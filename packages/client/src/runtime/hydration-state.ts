/**
 * BarefootJS - Hydration State
 *
 * Tracks which scope elements have been hydrated using a WeakSet
 * instead of a DOM attribute. This avoids polluting the DOM and
 * enables tree-shaking.
 */

/**
 * Set of scope elements that have been initialized/hydrated.
 * Used to prevent duplicate initialization.
 */
export const hydratedScopes = new WeakSet<Element>()
