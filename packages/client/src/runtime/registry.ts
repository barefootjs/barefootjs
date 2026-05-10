/**
 * BarefootJS - Component Registry
 *
 * Component registry for parent-child communication.
 * Each component registers its init function so parents can initialize children with props.
 */

import { BF_SCOPE, BF_CHILD_PREFIX, BF_PARENT, BF_MOUNT } from '@barefootjs/shared'
import { hydratedScopes } from './hydration-state'
import { setCurrentScope } from './context'
import { createComponent } from './component'
import type { InitFn } from './types'

/**
 * Component registry for parent-child communication.
 */
const componentRegistry = new Map<string, InitFn>()

/**
 * Recognises bf-s values whose final segment is a nested-slot path
 * (`…_sM_sN`). These show up when a synthesized component (e.g.
 * `BFInlineJsxCallback`) renders descendants whose own internal scope
 * happens to end in `_sN`, coincidentally matching a sibling slot's
 * loose suffix selector. The slotId-suffix lookup in `upsertChild`
 * skips them so the wrong `initChild` never fires (#1220).
 */
const NESTED_SLOT_SUFFIX = /_s\d+_s\d+$/

/**
 * Queue of pending child initializations waiting for components to register.
 * Key: component name, Value: array of pending init requests
 */
const pendingChildInits = new Map<string, Array<{ scope: Element; props: Record<string, unknown> }>>()

/**
 * Register a component's init function for parent initialization.
 * Also processes any pending child initializations for this component.
 *
 * @param name - Component name (e.g., 'Counter', 'AddTodoForm')
 * @param init - Init function that takes (scope, props)
 */
export function registerComponent(name: string, init: InitFn): void {
  componentRegistry.set(name, init)

  // Drain any pending child initializations queued before this component
  // registered. Re-enter through initChild so the same hydratedScopes
  // bookkeeping + currentScope wrapping applies to deferred and immediate
  // calls alike.
  const pending = pendingChildInits.get(name)
  if (pending) {
    pendingChildInits.delete(name)
    for (const { scope, props } of pending) {
      initChild(name, scope, props)
    }
  }
}

/**
 * Get a component's init function from the registry.
 * Used by createComponent() to initialize dynamically created components.
 *
 * @param name - Component name
 * @returns Init function or undefined if not registered
 */
export function getComponentInit(name: string): InitFn | undefined {
  return componentRegistry.get(name)
}

/**
 * Initialize a child component with props from parent.
 * Used by parent components to pass function props (like onAdd) to children.
 *
 * If the child component's script hasn't loaded yet (component not registered),
 * queues the initialization request. When the component registers via
 * registerComponent(), pending initializations are processed synchronously.
 *
 * @param name - Child component name
 * @param childScope - The child's scope element (found by parent)
 * @param props - Props to pass to the child (including function props)
 */
export function initChild(
  name: string,
  childScope: Element | null,
  props: Record<string, unknown> = {}
): void {
  if (!childScope) return

  const init = componentRegistry.get(name)
  if (!init) {
    // Component not registered yet - queue initialization for when it registers
    // This handles cases where parent script loads before child script
    if (!pendingChildInits.has(name)) {
      pendingChildInits.set(name, [])
    }
    pendingChildInits.get(name)!.push({ scope: childScope, props })
    return
  }

  // Child-prefixed scopes (`~Foo_xxx`) are owned by the parent's initChild
  // entirely — once we've run their init, never re-enter. Top-level scopes
  // (no `~`) reach this path through `upsertChild` during reconcile, where
  // re-invoking init is the documented way to deliver fresh closure-captured
  // callback props to the child. So only short-circuit the prefixed case.
  if (
    hydratedScopes.has(childScope) &&
    childScope.getAttribute(BF_SCOPE)?.startsWith(BF_CHILD_PREFIX)
  ) {
    return
  }

  const prevScope = setCurrentScope(childScope)
  try {
    init(childScope, props)
  } finally {
    setCurrentScope(prevScope)
  }

  // Mark the scope as hydrated AFTER init runs so the doc-order walker in
  // hydrate.ts knows to skip this element on its later pass — the parent
  // has just claimed responsibility for it. This is what lets the walker
  // get away with a single `hydratedScopes.has(el)` check instead of an
  // ancestor-name guard.
  hydratedScopes.add(childScope)
}

/** Resolve the parent component scope id (without the `~` child prefix)
 *  for a slot lookup. Prefers the explicit `anchorScope` because the
 *  immediate `parent` element may be a freshly-created detached fragment
 *  whose `closest()` returns null. */
function parentScopeOf(parent: Element, anchorScope?: Element | null): string {
  const ancestor = anchorScope ?? parent.closest(`[${BF_SCOPE}]`)
  if (!ancestor) return ''
  const bfs = ancestor.getAttribute(BF_SCOPE) ?? ''
  return bfs.startsWith(BF_CHILD_PREFIX) ? bfs.slice(1) : bfs
}

/**
 * Find the SSR scope element for a child component at `slotId` inside
 * `parent`, using `bf-parent`/`bf-mount` markers. This replaces the
 * earlier bf-s suffix lookup, which couldn't tell direct children apart
 * from descendants once recursive components were introduced — every
 * depth's bf-s ended in the same slot id and `NESTED_SLOT_SUFFIX`
 * filtered them all out.
 *
 * Strategy:
 *   1. Walk up from `parent` to find the closest `[bf-s]` ancestor — that
 *      is the parent component's scope. Strip the `~` child prefix to get
 *      the value used in `bf-parent`.
 *   2. Inside `parent`, find the descendant whose `bf-parent` and
 *      `bf-mount` match. There can be at most one such direct child for
 *      a given (parent scope, slot) pair.
 *
 * Falls back to the legacy `bf-s$="_<slotId>"` + `NESTED_SLOT_SUFFIX`
 * filter for SSR output produced before bf-parent/bf-mount were added.
 */
function findSsrScopeBySlot(
  parent: Element,
  name: string,
  slotId: string,
  anchorScope?: Element | null,
): HTMLElement | null {
  const parentBfs = parentScopeOf(parent, anchorScope)

  // Primary lookup via slot-relationship markers.
  if (parentBfs) {
    const escaped = (CSS as { escape?: (s: string) => string }).escape
      ? CSS.escape(parentBfs)
      : parentBfs.replace(/"/g, '\\"')
    const direct = parent.querySelector(
      `[${BF_PARENT}="${escaped}"][${BF_MOUNT}="${slotId}"]`,
    ) as HTMLElement | null
    if (direct) return direct
  }

  // Legacy fallback: bf-s suffix lookup with #1220 nested-slot filter.
  const candidates = parent.querySelectorAll(`[${BF_SCOPE}$="_${slotId}"]`)
  for (const candidate of candidates) {
    const bfs = candidate.getAttribute(BF_SCOPE) || ''
    if (NESTED_SLOT_SUFFIX.test(bfs)) continue
    return candidate as HTMLElement
  }

  // Last-resort fallback: component-name prefix search.
  return parent.querySelector(
    `[${BF_SCOPE}^="~${name}_"], [${BF_SCOPE}^="${name}_"]`,
  ) as HTMLElement | null
}

/**
 * Upsert a child component at a slot inside `parent`. Resolves the SSR vs
 * CSR shape at runtime in one place — so the compiler doesn't need a
 * `mode: 'csr' | 'ssr'` argument for child component emission.
 *
 *   1. SSR: a `[bf-parent][bf-mount]` element exists for this (parent,
 *      slot). Initialise it via initChild and return it.
 *   2. CSR: a `[data-bf-ph="<slotId|name>"]` placeholder exists. Replace it
 *      with `createComponent(name, props, key)` and return the new element.
 *   3. Neither matches (already initialised on a previous reconcile pass) —
 *      no-op, return null.
 *
 * The returned element is the live component scope element — callers can
 * use it for follow-up effects (e.g. a children-textContent createEffect).
 */
export function upsertChild(
  parent: Element,
  name: string,
  slotId: string | null,
  props: Record<string, unknown>,
  key?: string | number,
  anchorScope?: Element | null,
): HTMLElement | null {
  // SSR: scope element is already in the tree.
  let ssr: HTMLElement | null = null
  if (slotId) {
    ssr = findSsrScopeBySlot(parent, name, slotId, anchorScope)
  } else {
    ssr = parent.querySelector(`[${BF_SCOPE}^="~${name}_"], [${BF_SCOPE}^="${name}_"]`) as HTMLElement | null
  }
  if (ssr) {
    initChild(name, ssr, props)
    return ssr
  }
  // CSR: replace placeholder with a freshly-created component.
  const phId = slotId ?? name
  const ph = parent.querySelector(`[data-bf-ph="${phId}"]`) as HTMLElement | null
  if (ph) {
    const slot = slotId ? slotInfoFor(parent, slotId, anchorScope) : undefined
    const comp = createComponent(name, props, key, slot)
    ph.replaceWith(comp)
    return comp
  }
  return null
}

/** Build the bf-parent / bf-mount metadata for a fresh component about to be
 *  mounted at `slotId` inside `parent`. createComponent stamps these onto the
 *  new element so subsequent upsertChild lookups can find it via the
 *  slot-relationship markers. `anchorScope` is preferred over walking up
 *  from `parent` because the loop-item parent may be a freshly-created
 *  detached fragment whose `closest()` returns null. */
function slotInfoFor(
  parent: Element,
  slotId: string,
  anchorScope?: Element | null,
): { parent: string; mount: string } | undefined {
  const parentBfs = parentScopeOf(parent, anchorScope)
  if (!parentBfs) return undefined
  return { parent: parentBfs, mount: slotId }
}
