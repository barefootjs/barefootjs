/**
 * BarefootJS - Hydration
 *
 * Combined component registration + template registration + hydration.
 * Single entry point for compiler-generated code.
 */

import { commentScopeRegistry } from './scope'
import { hydratedScopes } from './hydration-state'
import { registerComponent } from './registry'
import { registerTemplate } from './template'
import { BF_SCOPE, BF_PROPS, BF_CHILD_PREFIX, BF_SCOPE_COMMENT_PREFIX } from '@barefootjs/shared'
import type { ComponentDef } from './types'

/**
 * Register a component and hydrate all its instances on the page.
 * Combines registration + template setup + hydration in a single call.
 *
 * Finds scope elements and their corresponding props, then initializes each instance.
 * Supports Suspense streaming by using requestAnimationFrame for delayed re-hydration.
 *
 * @param name - Component name
 * @param def - Component definition (init function + optional template + comment flag)
 */
export function hydrate(name: string, def: ComponentDef): void {
  // Ensure name is always set on the def so createComponentFromDef()
  // doesn't rely on def.init.name (which may be lost under minification).
  def.name = name

  // Register component for parent-child communication
  registerComponent(name, def.init)

  // Register template for client-side component creation
  if (def.template) {
    registerTemplate(name, def.template)
  }

  const doHydrate = () => {
    if (def.comment) {
      // Comment-scope-only: skip attribute-based search
      hydrateCommentScopes(name, def.init, new Set())
      return
    }

    // Select all scope elements matching this component name
    const scopeEls = document.querySelectorAll(
      `[${BF_SCOPE}^="${name}_"]`
    )

    // Track initialized scope IDs to avoid duplicate initialization
    // (Fragment roots have multiple elements with the same scope ID)
    const initializedScopes = new Set<string>()

    for (const scopeEl of scopeEls) {
      // Skip already hydrated elements
      if (hydratedScopes.has(scopeEl)) continue

      // Skip child components (~ prefix) - they are initialized by parent via initChild
      if (scopeEl.getAttribute(BF_SCOPE)?.startsWith(BF_CHILD_PREFIX)) continue

      // Skip nested instances when parent is the same component type.
      // This prevents double initialization (parent's initChild handles it).
      //
      // Different parent types are allowed to hydrate independently:
      //   - ToggleItem inside Toggle → hydrate (different types)
      //   - Counter inside Counter → skip (same type, parent initializes)
      //
      // Note: This relies on scopeId format "ComponentName_xxxxx"
      const parentScope = scopeEl.parentElement?.closest(`[${BF_SCOPE}]`)
      if (parentScope) {
        const rawParentScopeId = parentScope.getAttribute(BF_SCOPE)
        const parentScopeId = rawParentScopeId?.startsWith(BF_CHILD_PREFIX)
          ? rawParentScopeId.slice(1)
          : rawParentScopeId
        if (parentScopeId?.startsWith(name + '_')) continue
      }

      // Get unique instance ID from scope element
      const instanceId = scopeEl.getAttribute(BF_SCOPE)
      if (!instanceId) continue

      // Skip if already initialized in this batch (for fragment roots)
      if (initializedScopes.has(instanceId)) continue
      initializedScopes.add(instanceId)

      // Mark as initialized immediately to prevent duplicate init
      hydratedScopes.add(scopeEl)

      // Read props from bf-p attribute (flat format: {"propName": value, ...})
      const propsJson = scopeEl.getAttribute(BF_PROPS)
      let props: Record<string, unknown> = {}
      if (propsJson) {
        try {
          props = JSON.parse(propsJson)
        } catch {
          console.warn(`[BarefootJS] Invalid props JSON on ${instanceId}:`, propsJson)
        }
      }

      def.init(scopeEl, props)
    }
  }

  // Immediately hydrate elements already in DOM
  doHydrate()

  // Re-hydrate after next frame (for Suspense streaming support)
  // Hono's streaming script moves template content into document after initial script execution
  requestAnimationFrame(doHydrate)
}

/**
 * Hydrate components using comment-based scope markers.
 * Walks all comments in the document looking for <!--bf-scope:Name_xxx--> markers.
 */
function hydrateCommentScopes(
  name: string,
  init: (scope: Element, props: Record<string, unknown>) => void,
  alreadyInitialized: Set<string>
): void {
  const prefix = BF_SCOPE_COMMENT_PREFIX
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT)

  while (walker.nextNode()) {
    const comment = walker.currentNode as Comment
    const value = comment.nodeValue
    if (!value?.startsWith(prefix)) continue

    // Parse scope ID and props from comment value
    let rest = value.slice(prefix.length)

    // Skip child components (~ prefix)
    if (rest.startsWith(BF_CHILD_PREFIX)) continue

    // Split scope ID from props JSON
    let scopeId = rest
    let propsJson = ''
    const pipeIdx = rest.indexOf('|')
    if (pipeIdx >= 0) {
      scopeId = rest.slice(0, pipeIdx)
      propsJson = rest.slice(pipeIdx + 1)
    }

    if (!scopeId.startsWith(`${name}_`)) continue

    // Skip if already initialized
    if ((comment as unknown as Record<string, boolean>).__bfInitialized) continue
    if (alreadyInitialized.has(scopeId)) continue

    // Mark as initialized
    ;(comment as unknown as Record<string, boolean>).__bfInitialized = true
    alreadyInitialized.add(scopeId)

    // Find the scope proxy element: first element sibling after the comment
    let proxyEl: Element | null = null
    let node: Node | null = comment.nextSibling
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        proxyEl = node as Element
        break
      }
      node = node.nextSibling
    }
    if (!proxyEl) {
      proxyEl = comment.parentElement
    }

    if (proxyEl) {
      commentScopeRegistry.set(proxyEl, {
        commentNode: comment,
        scopeId,
      })

      // Parse props from comment
      let parsed: Record<string, unknown> = {}
      if (propsJson) {
        try {
          parsed = JSON.parse(propsJson)
        } catch {
          console.warn(`[BarefootJS] Invalid props JSON in comment scope ${scopeId}:`, propsJson)
        }
      }
      const props = (parsed[name] ?? {}) as Record<string, unknown>

      init(proxyEl, props)
    }
  }
}
