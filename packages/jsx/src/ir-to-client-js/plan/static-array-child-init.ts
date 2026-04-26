/**
 * Plan types for `emitStaticArrayChildInits` — the three shapes that
 * `static array` loops emit for child component initialisation:
 *
 *   - `single-comp`        — `loop.childComponent` ケース。一つの child component
 *                            を `querySelectorAll` で全インスタンスに initChild。
 *   - `outer-nested`       — depth 0 の `nestedComponents`。outer forEach で
 *                            `__iterEl.querySelector(...)` 経由で initChild。
 *   - `inner-loop-nested`  — depth > 0 の `nestedComponents`。outer + inner
 *                            forEach の二重ループで initChild。
 *
 * All decisions (selector, propsExpr, offset expressions) are resolved at
 * build time so the stringifier becomes a deterministic walk.
 *
 * Replaces the legacy 120-line `emitStaticArrayChildInits` whose emission
 * shapes were determined by inline branching on the IR.
 */

import type { PreludeStatements } from '../control-flow/plan/inner-loop'

/** Pre-built `{ name: value, ... }` props object expression. */
export type PropsExpr = string

/** A single child-component initialiser inside an inner-loop body. */
export interface InnerLoopComp {
  componentName: string
  /** CSS selector for `__innerEl.querySelector(...)`. */
  selector: string
  /** Pre-built props object expression. */
  propsExpr: PropsExpr
}

/** Plan for `loop.childComponent` (single child component per iteration). */
export interface SingleCompInitPlan {
  kind: 'single-comp'
  /** Container variable name — e.g. `_s4` (already prefixed). */
  containerVar: string
  componentName: string
  /** Combined selector: slotId-suffix match OR name-prefix match. */
  childSelector: string
  /** Array expression as written in user code. */
  arrayExpr: string
  /** Loop parameter identifier. */
  param: string
  /** Index parameter identifier (e.g. `__idx` or user-supplied). */
  indexParam: string
  /**
   * Outer `.map()` callback preamble locals (#1064), emitted inside the
   * `__childScopes.forEach` body after the `const <param> = ...[__idx]`
   * lookup so the propsExpr getter can resolve them. Empty when no
   * preamble.
   */
  outerPreludeStatements: PreludeStatements
  /** Pre-built props object expression for the child component. */
  propsExpr: PropsExpr
}

/** Plan for one depth-0 component inside `loop.nestedComponents`. */
export interface OuterNestedInitPlan {
  kind: 'outer-nested'
  containerVar: string
  componentName: string
  /** CSS selector for `__iterEl.querySelector(...)`. */
  selector: string
  arrayExpr: string
  param: string
  indexParam: string
  /** `indexParam` or `${indexParam} + ${siblingOffset}` — already substituted. */
  offsetExpr: string
  /**
   * Outer `.map()` callback preamble locals (#1064), emitted inside the
   * outer `forEach`'s `if (__iterEl)` block — i.e. only when the SSR
   * element exists, matching `inner-loop-nested`'s post-guard placement.
   * Empty when the source had no preamble.
   */
  outerPreludeStatements: PreludeStatements
  propsExpr: PropsExpr
}

/**
 * Plan for one inner-loop level's nested components (depth > 0). Mirrors
 * the `outer.forEach((p, idx) => inner.forEach((q, jdx) => initChild...))`
 * shape verbatim; multiple `comps` share the same outer/inner skeleton.
 */
export interface InnerLoopNestedInitPlan {
  kind: 'inner-loop-nested'
  containerVar: string
  /** Outer loop's array expression. */
  outerArrayExpr: string
  outerParam: string
  outerIndexParam: string
  /** Outer offset — `outerIndexParam` or `${outerIndexParam} + ${siblingOffset}`. */
  outerOffsetExpr: string
  /**
   * Outer `.map()` callback preamble locals, emitted after the
   * `if (!__outerEl) return` guard so the inner forEach (and its
   * component setup) can resolve them (#1064). Empty when no preamble.
   */
  outerPreludeStatements: PreludeStatements
  /**
   * Inner loop's container slot id. When non-null, the stringifier emits
   * `__outerEl.querySelector('[bf="..."]') || __outerEl`; otherwise
   * `__outerEl` is used directly.
   */
  innerContainerSlotId: string | null
  innerArrayExpr: string
  innerParam: string
  /** Inner offset — `__innerIdx` or `__innerIdx + ${siblingOffset}`. */
  innerOffsetExpr: string
  /**
   * Inner `.map()` callback preamble locals, emitted after the
   * `if (!__innerEl) return` guard so the per-component prop getters
   * can resolve them (#1064). Empty when no preamble.
   */
  innerPreludeStatements: PreludeStatements
  /** Depth used in the leading comment line (e.g. `depth 2`). */
  depth: number
  /** Per-component initialisers emitted inside the inner forEach body. */
  comps: readonly InnerLoopComp[]
}

export type StaticArrayChildInitPlan =
  | SingleCompInitPlan
  | OuterNestedInitPlan
  | InnerLoopNestedInitPlan

export type StaticArrayChildInitsPlan = readonly StaticArrayChildInitPlan[]
