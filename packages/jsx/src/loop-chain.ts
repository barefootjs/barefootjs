/**
 * Shared array-chain builder (#1448 Tier B follow-up to PR feedback).
 *
 * Three call sites previously held byte-identical copies of the
 * `.filter(...)` + `.toSorted(...)` chain emit:
 *
 *   - `packages/jsx/src/ir-to-client-js/utils.ts:buildChainedArrayExpr`
 *     (`TopLevelLoop` / `BranchLoop` — post-collect shape)
 *   - `packages/jsx/src/ir-to-client-js/html-template.ts:applyLoopChain`
 *     (`IRLoop` — pre-collect shape, accepts optional base override)
 *   - `packages/adapter-hono/src/adapter/hono-adapter.ts:applyHonoLoopChain`
 *     (`IRLoop` again)
 *
 * Each was structurally the same: chain `.filter` and `.toSorted` in
 * `chainOrder`-determined order, no chain at all when both are
 * absent. The dispersion meant a future filter/sort tweak (e.g.
 * widening the chain to `.flatMap`) would have to land in three
 * places. This helper centralises the chain into one source so the
 * three sites just unpack their respective IR shape into the
 * primitive inputs.
 *
 * Always emits `.toSorted` (non-mutating) regardless of the user's
 * source method (`.sort` or `.toSorted`) — templates render a
 * snapshot, and mutating a shared prop array would reorder the
 * receiver across renders.
 */

/**
 * The minimal sort-comparator shape this helper needs. Both the
 * full `SortComparator` (from expression-parser) and the stripped-
 * down collected form on `TopLevelLoop` / `BranchLoop` (which only
 * carries `paramA`, `paramB`, `raw` for the client-template emit)
 * satisfy this — accepting the structural shape lets the three
 * call sites consume their respective IR view without an explicit
 * downcast.
 */
export interface SortChainView {
  paramA: string
  paramB: string
  raw: string
}

export interface LoopChainInputs {
  /** The base array expression the chain wraps (e.g. `_p.items`, `.Items`). */
  base: string
  /** When present, emits `.toSorted((paramA, paramB) => raw)`. */
  sortComparator?: SortChainView
  /** When present, emits `.filter(param => raw)`. */
  filterPredicate?: { param: string; raw: string }
  /**
   * Filter vs sort order when both are present.
   *   - `'filter-sort'` → `base.filter(...).toSorted(...)`
   *   - `'sort-filter'` → `base.toSorted(...).filter(...)`
   *
   * Defaults to `'sort-filter'` (sort first) when undefined.
   */
  chainOrder?: 'filter-sort' | 'sort-filter'
}

export function buildLoopChainExpr(opts: LoopChainInputs): string {
  const sortExpr = opts.sortComparator
    ? `.toSorted((${opts.sortComparator.paramA}, ${opts.sortComparator.paramB}) => ${opts.sortComparator.raw})`
    : ''
  const filterExpr = opts.filterPredicate
    ? `.filter(${opts.filterPredicate.param} => ${opts.filterPredicate.raw})`
    : ''

  if (!sortExpr && !filterExpr) return opts.base

  if (opts.chainOrder === 'filter-sort') {
    return `${opts.base}${filterExpr}${sortExpr}`
  }
  return `${opts.base}${sortExpr}${filterExpr}`
}
