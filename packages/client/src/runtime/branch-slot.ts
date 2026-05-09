/**
 * Branch-template slot helper (#1213).
 *
 * Conditional `template()` arrows interpolate Child-position expressions
 * via `${expr}`. When `expr` evaluates to a live `Node` (e.g. the result
 * of `_p.renderNode(node())` returning an `HTMLElement` from
 * `createComponent`), the surrounding template literal coerces it via
 * `Object.prototype.toString`, producing `"[object HTMLDivElement]"` and
 * destroying the live node identity on hydration.
 *
 * `__bfSlot` intercepts the value before stringification: if it's a
 * `Node`, it stashes the node into the closure-scoped `slots` array and
 * returns a unique marker comment. The `insert()` runtime then walks the
 * parsed fragment for those markers and splices the original node back
 * in by identity (no `cloneNode`), preserving event listeners and signal
 * bindings.
 *
 * Non-node values fall through to `String(value)` for the existing
 * inline-string path.
 */
export function __bfSlot(value: unknown, slots: Node[]): string {
  if (value == null || value === false || value === true) return ''
  if (typeof Node !== 'undefined' && value instanceof Node) {
    const idx = slots.length
    slots.push(value)
    return `<!--bf-slot:${idx}-->`
  }
  if (Array.isArray(value)) {
    return value.map((v) => __bfSlot(v, slots)).join('')
  }
  return String(value)
}
