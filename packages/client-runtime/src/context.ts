/**
 * Context API for parent-child state sharing.
 *
 * Provides createContext, useContext, and provideContext for
 * compound component patterns (DropdownMenu, Tabs, Dialog, etc.).
 *
 * Context values are stored on DOM elements (scope-based), enabling
 * multiple providers of the same context on one page (e.g., two Select
 * components). useContext walks DOM ancestors to find the nearest provider.
 * Portal elements (with bf-po attribute) follow the logical owner chain.
 *
 * A global store is kept as fallback for non-scoped usage.
 */

import { BF_PORTAL_OWNER, BF_SCOPE, BF_CHILD_PREFIX } from '@barefootjs/shared'

export type Context<T> = {
  readonly id: symbol
  readonly defaultValue: T | undefined
  /** Internal flag: true when default was explicitly provided (even if undefined) */
  readonly _hasDefault: boolean
  /** JSX Provider component. Compiled to provideContext() by the compiler. */
  readonly Provider: (props: { value: T; children?: unknown }) => unknown
}

/** Global fallback store for contexts without a DOM scope. */
const contextStore = new Map<symbol, unknown>()

/** Property key for context data stored on DOM elements. */
const CONTEXT_KEY = '__bfCtx'

/** Current scope element, set by initChild during component initialization. */
let currentScope: Element | null = null

/**
 * Set the current scope element for context operations.
 * Called by initChild to scope provideContext/useContext to the correct element.
 * Returns the previous scope for restoration.
 */
export function setCurrentScope(scope: Element | null): Element | null {
  const prev = currentScope
  currentScope = scope
  return prev
}

/**
 * Create a new context with an optional default value.
 *
 * When no default is provided, useContext() will throw if no provider is found.
 * When a default is provided (even if `undefined`), useContext() returns that default.
 */
export function createContext<T>(defaultValue?: T): Context<T> {
  return {
    id: Symbol(),
    defaultValue,
    _hasDefault: arguments.length > 0,
    // Provider is compiled away by the JSX compiler into provideContext() calls.
    // This runtime stub exists only for TypeScript type checking.
    Provider: (() => { throw new Error('Context.Provider should be compiled away') }) as Context<T>['Provider'],
  }
}

/**
 * Read the current value of a context.
 *
 * Walks up the DOM tree from the current scope element to find
 * the nearest ancestor that provided this context. Falls back to
 * the global store, then to the context's default value.
 */
export function useContext<T>(context: Context<T>): T {
  // Walk DOM ancestors from current scope to find nearest provider.
  // For portal elements (bf-po attribute), follow the logical owner
  // chain back to the original parent scope.
  if (currentScope) {
    let el: Element | null = currentScope
    while (el) {
      const ctxMap = (el as any)[CONTEXT_KEY] as Map<symbol, unknown> | undefined
      if (ctxMap?.has(context.id)) {
        return ctxMap.get(context.id) as T
      }
      // Follow portal owner chain: if this element has bf-po, jump to the owner scope
      const portalOwnerId: string | null = el.getAttribute(BF_PORTAL_OWNER)
      if (portalOwnerId) {
        const ownerEl: Element | null = document.querySelector(`[${BF_SCOPE}="${BF_CHILD_PREFIX}${portalOwnerId}"], [${BF_SCOPE}="${portalOwnerId}"]`)
        if (ownerEl && ownerEl !== el) {
          el = ownerEl
          continue
        }
      }
      el = el.parentElement
    }
  }
  // Fallback to global store
  if (contextStore.has(context.id)) {
    return contextStore.get(context.id) as T
  }
  if (context._hasDefault) {
    return context.defaultValue as T
  }
  throw new Error('useContext: no provider found and no default value')
}

/**
 * Provide a value for a context.
 *
 * Stores the value on the current scope DOM element so that child
 * components can find it via useContext's DOM ancestor walk.
 * Also sets the global store as fallback.
 */
export function provideContext<T>(context: Context<T>, value: T): void {
  if (currentScope) {
    let ctxMap = (currentScope as any)[CONTEXT_KEY] as Map<symbol, unknown> | undefined
    if (!ctxMap) {
      ctxMap = new Map()
      ;(currentScope as any)[CONTEXT_KEY] = ctxMap
    }
    ctxMap.set(context.id, value)

    // Propagate context to child scope elements so portal-moved children
    // can find it via DOM ancestor walk. At provideContext time, children
    // are still in their original SSR positions (portals haven't moved them yet).
    const childScopes = currentScope.querySelectorAll(`[${BF_SCOPE}]`)
    for (const child of childScopes) {
      let childCtxMap = (child as any)[CONTEXT_KEY] as Map<symbol, unknown> | undefined
      if (!childCtxMap) {
        childCtxMap = new Map()
        ;(child as any)[CONTEXT_KEY] = childCtxMap
      }
      // Only set if not already provided (don't override nested providers)
      if (!childCtxMap.has(context.id)) {
        childCtxMap.set(context.id, value)
      }
    }
  }
  contextStore.set(context.id, value)
}
