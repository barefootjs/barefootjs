/**
 * BarefootJS - Core Types
 *
 * Shared type definitions for component initialization and registration.
 */

/**
 * Component init function type.
 * Takes the scope element and props, initializes the component
 * by setting up event handlers, effects, and reactive bindings.
 */
export type InitFn = (scope: Element, props: Record<string, unknown>) => void

/**
 * Component definition.
 * Bundles the init function with optional template and scope metadata.
 */
export interface ComponentDef {
  /** Component name (e.g., 'Counter'). Used for scope ID generation. */
  name?: string
  /** Init function that hydrates a scope element */
  init: InitFn
  /** Template function for client-side component creation */
  template?: (props: Record<string, unknown>) => string
  /** When true, use comment-based scope hydration (fragment roots) */
  comment?: boolean
}
