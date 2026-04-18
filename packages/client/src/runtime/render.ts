/**
 * BarefootJS - Client-Side Rendering
 *
 * CSR entry point for rendering components directly in the browser
 * without server-side rendering. Tree-shakeable: SSR-only apps
 * never import this module.
 */

import { BF_SCOPE } from '@barefootjs/shared'
import { hydratedScopes } from './hydration-state'
import { getComponentInit } from './registry'
import { getTemplate } from './template'

/**
 * Render a registered component into a container element (CSR mode).
 *
 * Looks up the component's init and template functions by name from
 * the registry, generates its DOM from the template, mounts it into
 * the container, and initializes it with the given props.
 *
 * The component must be registered first by importing its `.client.js`
 * file (which calls `registerComponent` + `registerTemplate` internally).
 *
 * Unlike hydrate(), this function does not require pre-rendered HTML.
 * The container's content is replaced entirely.
 *
 * @param container - Target DOM element to render into
 * @param componentName - Registered component name (e.g., 'Counter')
 * @param props - Props to pass to the component
 *
 * @example
 * import { render } from '@barefootjs/client'
 * await import('/static/components/Counter.client.js')
 *
 * render(document.getElementById('app')!, 'Counter', { initialCount: 0 })
 */
export function render(
  container: HTMLElement,
  componentName: string,
  props: Record<string, unknown> = {}
): void {
  const init = getComponentInit(componentName)
  const template = getTemplate(componentName)

  if (!init || !template) {
    throw new Error(
      `[BarefootJS] Component "${componentName}" is not registered. ` +
      `Did you import its .client.js file before calling render()?`
    )
  }

  const html = template(props).trim()

  const tpl = document.createElement('template')
  tpl.innerHTML = html
  const element = tpl.content.firstChild as HTMLElement

  if (!element) {
    throw new Error('[BarefootJS] render(): template returned empty HTML')
  }

  if (!element.getAttribute(BF_SCOPE)) {
    const id = Math.random().toString(36).slice(2, 8)
    element.setAttribute(BF_SCOPE, `${componentName}_${id}`)
  }

  container.innerHTML = ''
  container.appendChild(element)

  init(element, props)

  hydratedScopes.add(element)
}
