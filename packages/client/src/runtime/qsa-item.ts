/**
 * Multi-root-aware slot lookup for `mapArray` items whose body is a JSX
 * Fragment with two or more sibling elements (#1212).
 *
 * In a single-root loop, every reactive slot inside a renderItem body is a
 * descendant of `__el`, so plain `qsa(__el, ...)` finds it. With a
 * multi-root Fragment item the second / third / Nth root are *siblings* of
 * `__el` rather than descendants — `__el.querySelector(...)` will silently
 * miss them, leaving reactive attributes / event handlers unbound. The
 * compiler emits `qsaItem(__el, ...)` for those cases; this helper walks
 * `[__el, ...nextSiblings]` until it either finds the slot or crosses a
 * `<!--bf-loop-i-->` Comment that opens the next item's range.
 */

import { BF_LOOP_ITEM } from '@barefootjs/shared'

/**
 * Find an element matching `selector` within an item's range — that is,
 * the primary element plus any sibling root elements that share its
 * `<!--bf-loop-i-->` boundary. Returns `null` when no match is found
 * before the next item start or the end of the parent.
 *
 * Falls back to the same root-or-descendant semantics as `qsa` when the
 * primary element has no following siblings (single-root case still works
 * if a caller emits `qsaItem` defensively).
 */
export function qsaItem(primaryEl: Element | null, selector: string): Element | null {
  if (!primaryEl) return null
  if (primaryEl.matches(selector)) return primaryEl
  const direct = primaryEl.querySelector(selector)
  if (direct) return direct
  let n: Node | null = primaryEl.nextSibling
  while (n) {
    if (n.nodeType === Node.COMMENT_NODE && (n as Comment).nodeValue === BF_LOOP_ITEM) return null
    if (n.nodeType === Node.ELEMENT_NODE) {
      const el = n as Element
      if (el.matches(selector)) return el
      const inner = el.querySelector(selector)
      if (inner) return inner
    }
    n = n.nextSibling
  }
  return null
}
