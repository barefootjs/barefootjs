/**
 * BarefootJS - Client-Side Rendering
 *
 * CSR entry point for rendering components directly in the browser
 * without server-side rendering. Tree-shakeable: SSR-only apps
 * never import this module.
 */

import { BF_SCOPE } from '@barefootjs/shared'
import { hydratedScopes } from './hydration-state'
import type { ComponentDef } from './types'

/**
 * Render a component into a container element (CSR mode).
 *
 * Creates the component's DOM from its template, mounts it into
 * the container, and initializes it with the given props.
 *
 * Unlike hydrate(), this function does not require pre-rendered HTML.
 * The container's content is replaced entirely.
 *
 * @param container - Target DOM element to render into
 * @param def - Component definition with init and template functions
 * @param props - Props to pass to the component
 *
 * @example
 * import { render } from '@barefootjs/client-runtime'
 * import { Counter } from './Counter'
 *
 * render(document.getElementById('app')!, Counter, { initialCount: 0 })
 */
export function render(
  container: HTMLElement,
  def: ComponentDef,
  props: Record<string, unknown> = {}
): void {
  if (!def.template) {
    throw new Error('[BarefootJS] render() requires a ComponentDef with a template function')
  }

  // Generate HTML from template
  const html = def.template(props).trim()

  // Create DOM element
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  const element = tpl.content.firstChild as HTMLElement

  if (!element) {
    throw new Error('[BarefootJS] render(): template returned empty HTML')
  }

  // Set scope ID if not present
  if (!element.getAttribute(BF_SCOPE)) {
    const id = Math.random().toString(36).slice(2, 8)
    const name = def.name || def.init.name?.replace(/^init/, '') || 'Component'
    element.setAttribute(BF_SCOPE, `${name}_${id}`)
  }

  // Mount into container
  container.innerHTML = ''
  container.appendChild(element)

  // Initialize the component
  def.init(element, props)

  // Mark as hydrated so reconcileList doesn't re-initialize
  hydratedScopes.add(element)
}
