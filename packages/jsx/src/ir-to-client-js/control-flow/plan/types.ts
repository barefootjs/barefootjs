/**
 * Plan types for the control-flow emitter.
 *
 * The control-flow emission pipeline is being migrated from "IR → string[]"
 * directly to "IR → Plan → string[]". This file holds the Plan IR.
 *
 * Plans are pure data — no string templates, no `lines.push`. Every emission
 * decision (which scope to query, which event-name normalizer to use, etc.)
 * is made by the builder; the stringifier is a deterministic function from
 * Plan to source text.
 *
 * Migration status (2026-04-25):
 * - PR 1: `InsertPlan` for top-level + nested conditionals.
 * - PR 2: `LoopPlan` (plain → component → composite).
 * - PR 3: `EventDelegationPlan`.
 *
 * Until PR 2 lands, ArmBody.loops is a passthrough escape hatch — see the
 * field comment on `ArmBody.loopsRaw` below.
 */

import type {
  BranchLoop,
  ConditionalElement,
  LoopChildConditional,
  LoopChildEvent,
  LoopChildReactiveAttr,
  LoopChildReactiveText,
  TopLevelLoop,
} from '../../types'
import type { IRLoopChildComponent } from '../../../types'
import type { DepthLevel } from '../../emit-control-flow'

// ─────────────────────────────────────────────────────────────────────
// Top-level
// ─────────────────────────────────────────────────────────────────────

/**
 * Plan for a single `insert(scope, slotId, () => cond, trueArm, falseArm)`
 * call. `kind` is included so future dispatcher unions can narrow.
 */
export interface InsertPlan {
  kind: 'insert'
  /** Variable expression to use as the first argument of `insert(...)`. */
  scope: ScopeRef
  slotId: string
  /** The reactive condition expression. Wrapped at builder time. */
  condition: string
  /** Always two arms: [whenTrue, whenFalse]. */
  arms: [InsertArm, InsertArm]
  /**
   * Event-name normalizer applied to events inside arm bodies.
   * `'dom'` calls `toDomEventName` (drop "on" prefix, lowercase); `'raw'`
   * keeps the original event name (used by `@client` conditionals).
   */
  eventNameMode: 'dom' | 'raw'
}

/** A single branch arm of an insert(). */
export interface InsertArm {
  /** Pre-rendered HTML template string. Already includes the bf-cond-* markers. */
  templateHtml: string
  body: ArmBody
}

/**
 * Everything that happens inside `bindEvents: (__branchScope) => { ... }`.
 *
 * The order of fields matches the emission order (events → refs → child
 * components → disposable text effects → loop reconciliation → nested
 * conditionals). Stringifiers MUST follow this order to keep output stable.
 */
export interface ArmBody {
  /** addEventListener calls bound to elements inside the arm. */
  events: ArmEventBind[]
  /** Imperative ref callbacks for elements inside the arm. */
  refs: ArmRefBind[]
  /** initChild calls for child components materialized by the arm swap. */
  childComponents: ArmChildComponentInit[]
  /** Reactive text effects scoped to this branch. Each becomes `createDisposableEffect`. */
  textEffects: ArmTextEffect[]
  /**
   * Branch-scoped loops. PR 1 keeps these as raw `BranchLoop` references and
   * delegates back to the legacy `emitBranchLoopBody` helper. PR 2 will turn
   * them into `LoopPlan` and stringify directly.
   */
  loopsRaw: BranchLoop[]
  /**
   * Nested conditionals within this branch. Built recursively as `InsertPlan`s
   * so the same stringifier handles them at any depth.
   */
  conditionals: InsertPlan[]
}

export interface ArmEventBind {
  slotId: string
  eventName: string
  /** Handler source expression (already trimmed). The stringifier wraps it. */
  handler: string
}

export interface ArmRefBind {
  slotId: string
  callback: string
}

export interface ArmChildComponentInit {
  name: string
  slotId: string | null
  /** Pre-built props object expression (e.g., `{ get name() { return ... } }`). */
  propsExpr: string
}

export interface ArmTextEffect {
  slotId: string
  expression: string
}

// ─────────────────────────────────────────────────────────────────────
// Scope references
// ─────────────────────────────────────────────────────────────────────

/**
 * The scope variable to pass as the first argument of insert(...) /
 * mapArray(...). At top-level this is `__scope`; nested inside an arm body
 * it is `__branchScope`; nested inside a loop renderItem it is the loop
 * element variable (e.g. `__el`).
 */
export type ScopeRef =
  | { kind: 'top' }                         // emits `__scope`
  | { kind: 'branchScope' }                 // emits `__branchScope`
  | { kind: 'var'; name: string }           // emits the literal variable name

// ─────────────────────────────────────────────────────────────────────
// Loops
// ─────────────────────────────────────────────────────────────────────

/**
 * Plan for a top-level dynamic loop with a plain element body (no child
 * components, no inner loops). Covers `emitPlainElementLoopReconciliation`.
 *
 * The "single-line vs multi-line renderItem" split in the legacy emitter is
 * a stringifier concern, not a Plan concern — the Plan just records
 * whether reactive effects exist and the stringifier picks the layout.
 */
export interface PlainLoopPlan {
  kind: 'plain-loop'
  /** The container element variable, e.g. `_s1`. */
  containerVar: string
  /** Array expression to drive `mapArray(() => ARR, ...)`. Already chained (filter/sort). */
  arrayExpr: string
  /** Key function source — `null` when the loop has no explicit key. */
  keyFn: string
  /** renderItem param identifier (after destructure unwrap rename). */
  paramHead: string
  /** Index parameter identifier, e.g. `__idx` or user-supplied. */
  indexParam: string
  /** Statement to unwrap a destructured param at body entry. Empty when not needed. */
  paramUnwrap: string
  /** Pre-render preamble line (already wrapped with loop param accessor). Empty when none. */
  mapPreambleWrapped: string
  /** HTML template string for one item. */
  template: string
  /**
   * Carried IR fields for legacy `emitLoopChildReactiveEffects` passthrough.
   * `null` means there are no reactive effects; the stringifier emits the
   * single-line renderItem in that case. PR 5+ will replace this with
   * structured `ReactiveEffectsPlan`.
   */
  reactiveEffects: ReactiveEffectsPassthrough | null
}

/**
 * Loaned-IR carrier for emitLoopChildReactiveEffects. PR 5+ replaces this
 * with a structured ReactiveEffectsPlan that addresses O-3 (key dedup) at
 * the builder level.
 */
export interface ReactiveEffectsPassthrough {
  attrs: LoopChildReactiveAttr[]
  texts: LoopChildReactiveText[]
  conditionals: LoopChildConditional[] | undefined
  loopParam: string
  loopParamBindings: TopLevelLoop['paramBindings']
}

/**
 * Plan for a top-level dynamic loop whose body is a single child component
 * (with or without nested child components inside it). Covers
 * `emitComponentLoopReconciliation`.
 *
 * `nestedComps.length === 0`  → emit the simple two-line renderItem
 *                               (initChild on existing, createComponent on new).
 * `nestedComps.length > 0`    → emit the SSR/CSR split that initialises both
 *                               the outer component and each nested child.
 *
 * Reactive-effects construction inside `childConditionals` is delegated to
 * the legacy `emitLoopChildReactiveEffects` via `ReactiveEffectsPassthrough`,
 * mirroring the PlainLoopPlan strategy.
 */
export interface ComponentLoopPlan {
  kind: 'component-loop'
  containerVar: string
  arrayExpr: string
  keyFn: string
  paramHead: string
  paramUnwrap: string
  indexParam: string
  /** The outer (loop body) component's name, e.g. `'Card'`. */
  componentName: string
  /** Pre-built props object expression for the outer component. */
  componentPropsExpr: string
  /** Wrapped key argument passed to `createComponent(name, props, KEY)`. */
  keyExpr: string
  /** Nested child component initialisers; empty for the simple case. */
  nestedComps: NestedComponentInit[]
  /** Carried IR for legacy reactive-effects passthrough; null when there's nothing to emit. */
  childConditionalEffects: ReactiveEffectsPassthrough | null
}

/**
 * One nested child component to initialise inside a renderItem body.
 * `childrenTextEffect` is non-null when the component's children are
 * text-equivalent AND reference the outer loop param — in that case the
 * stringifier emits a `createEffect` that updates the child's `textContent`.
 */
export interface NestedComponentInit {
  componentName: string
  /** CSS selector used by `qsa(...)` to find the SSR-rendered placeholder. */
  selector: string
  /** Pre-built props object expression for the nested component. */
  propsExpr: string
  /** When non-null, emit a reactive textContent effect alongside `initChild`. */
  childrenTextEffect: { wrappedChildren: string } | null
}

/**
 * Plan for a composite loop — body is a plain element that contains either
 * nested child components (`outerComps`) and/or inner loops
 * (`depthLevels`). Used for both top-level emission
 * (`emitCompositeElementReconciliation`) and branch-scoped emission
 * (`emitCompositeBranchLoop`).
 *
 * The two contexts differ only in:
 *   - container variable name (`_sN` vs `__loop_cv`)
 *   - `arrayExpr` (top: chained filter/sort/map; branch: raw `loop.array`)
 *   - leading/body indent
 *   - `branchClearChildren`: when true, prepends a `getLoopChildren(...)
 *     .forEach(__el => __el.remove())` line so the branch swap starts from
 *     a clean slate (legacy parity).
 *
 * Inner-loop emission and component-and-event setup remain on the legacy
 * `emitInnerLoopSetup` / `emitComponentAndEventSetup` helpers, invoked from
 * the stringifier as a passthrough. PR 2-c does not Plan-ify those — the
 * SSR/CSR duplication noted in observation O-1 and the deep-nested loop
 * degradation in O-8 stay bug-for-bug for this PR; their fixes land in
 * dedicated bug-fix PRs after the migration completes.
 */
export interface CompositeLoopPlan {
  kind: 'composite-loop'
  containerVar: string
  arrayExpr: string
  keyFn: string
  paramHead: string
  paramUnwrap: string
  indexParam: string
  /** Wrapped mapPreamble line, hoisted before the SSR/CSR split. Empty when none. */
  mapPreambleWrapped: string
  /** Inner template HTML for the loop body (single item). */
  template: string
  /** Outer-level child components (depth 0), with `insideConditional` ones already filtered out. */
  outerComps: readonly IRLoopChildComponent[]
  /** Outer-level child events (no nested-loop scope). */
  outerEvents: readonly LoopChildEvent[]
  /** Per-inner-loop levels for `emitInnerLoopSetup` passthrough. */
  depthLevels: readonly DepthLevel[]
  /** Loop param identifier — needed for legacy passthroughs. */
  loopParam: string
  /** Destructured-binding metadata for the loop param. */
  loopParamBindings: TopLevelLoop['paramBindings']
  /** Reactive effects rendered after the SSR/CSR split. */
  reactiveEffects: ReactiveEffectsPassthrough | null
  /**
   * When true, the stringifier prepends a `getLoopChildren(...).forEach(__el
   * => __el.remove())` line — branch composite loops need this so mapArray
   * starts from a clean container after a branch swap. Top-level loops do not.
   */
  branchClearChildren: boolean
  /** Indent of the `mapArray(` line itself. */
  topIndent: string
  /** Indent of the lines inside the renderItem body. */
  bodyIndent: string
}

/**
 * Plan for a top-level static array loop. Two parallel `forEach` blocks (one
 * for reactive attrs, one for reactive texts) plus optional event delegation
 * — mirrors the legacy `emitStaticArrayUpdates` shape. The forEach
 * duplication noted in observation O-4 is preserved bug-for-bug here; PR 5+
 * collapses them into a single forEach.
 */
export interface StaticLoopPlan {
  kind: 'static-loop'
  containerVar: string
  /** Source array expression as written in user code (no signal accessor wrap). */
  arrayExpr: string
  /** Loop param name. */
  param: string
  /** Index parameter identifier. */
  indexParam: string
  /** Children-index offset expression — index when no offset, `${idx} + N` otherwise. */
  childIndexExpr: string
  /**
   * Reactive attrs grouped by child slot id (preserves emission order).
   * Empty list means the attr forEach block is omitted.
   */
  attrsBySlot: ReadonlyArray<readonly [string, readonly LoopChildReactiveAttr[]]>
  /** Reactive texts in declaration order. Empty list means the text forEach block is omitted. */
  texts: readonly LoopChildReactiveText[]
}

// ─────────────────────────────────────────────────────────────────────
// Re-export legacy types referenced from Plan-level code paths.
// PR 2-b/c will extend this with single-component / composite plans.
// ─────────────────────────────────────────────────────────────────────

export type { ConditionalElement, LoopChildConditional, BranchLoop }
