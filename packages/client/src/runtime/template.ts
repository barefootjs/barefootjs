/**
 * BarefootJS - Template Registry
 *
 * Stores template functions for client-side component creation.
 * Templates generate HTML strings from props, used by createComponent().
 */

/**
 * Template function type - generates HTML string from props
 */
export type TemplateFn = (props: Record<string, unknown>) => string

/**
 * Registry storing template functions by component name
 */
const templateRegistry = new Map<string, TemplateFn>()

/**
 * Register a template function for a component.
 *
 * @param name - Component name (e.g., 'TodoItem')
 * @param templateFn - Function that generates HTML from props
 *
 * @example
 * registerTemplate('TodoItem', (props) => `
 *   <li class="${props.done ? 'done' : ''}">
 *     <span>${props.text}</span>
 *   </li>
 * `)
 */
export function registerTemplate(name: string, templateFn: TemplateFn): void {
  templateRegistry.set(name, templateFn)
}

/**
 * Get a registered template function by component name.
 *
 * @param name - Component name
 * @returns Template function or undefined if not registered
 */
export function getTemplate(name: string): TemplateFn | undefined {
  return templateRegistry.get(name)
}

/**
 * Check if a template is registered for a component.
 *
 * @param name - Component name
 * @returns true if template is registered
 */
export function hasTemplate(name: string): boolean {
  return templateRegistry.has(name)
}
