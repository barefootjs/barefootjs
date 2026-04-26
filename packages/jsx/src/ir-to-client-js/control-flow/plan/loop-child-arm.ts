/**
 * Plan types for the body of a single arm (whenTrue / whenFalse) of a
 * loop-scoped conditional (`NestedConditionalPlan`).
 *
 * Item 2 of `tmp/emit-survey/HANDOFF.md` plan-ifies the recursive
 * branch ↔ loop ↔ conditional helpers. This file accumulates the per-arm
 * sub-plans as each helper is migrated:
 *
 *   - `BranchEventBindingsPlan`       — Item 2a (this PR)
 *   - `BranchChildComponentInitsPlan` — Item 2b
 *   - `BranchInnerLoopsPlan`          — Item 2c
 *   - nested `NestedConditionalPlan[]`— Item 2d
 *
 * Once every helper is migrated, an `LoopChildArmPlan` aggregate will
 * consolidate every arm-scoped concern under one type.
 */

/** A single addEventListener emitted inside an arm's bindEvents. */
export interface BranchEventListener {
  eventName: string
  /** Already wrapped via wrapLoopParamAsAccessor at build time. */
  wrappedHandler: string
}

/** Listeners grouped by slot (one qsa() lookup per slot). */
export interface BranchEventSlot {
  slotId: string
  listeners: readonly BranchEventListener[]
}

/**
 * Pre-built event bindings for one arm of a loop-scoped conditional. An
 * empty list means the stringifier emits nothing.
 */
export type BranchEventBindingsPlan = readonly BranchEventSlot[]

/**
 * One child component initialiser inside an arm body (qsa() + initChild for
 * SSR, or placeholder replacement + createComponent for CSR). The selector,
 * placeholder id, and props object expression are all resolved at build time
 * — the stringifier just emits a single line per entry.
 */
export interface BranchChildComponentInit {
  /** Component tag name, e.g. `"Card"`. */
  name: string
  /** CSS selector passed to qsa(): `[bf-s$="_<slotId>"]` or `[bf-s^="~<name>_"]`. */
  selector: string
  /** Identifier used by the data-bf-ph attribute on the CSR placeholder. */
  placeholderId: string
  /** Pre-built props object expression (e.g. `{ get foo() { return ... } }`). */
  propsExpr: string
}

/**
 * Pre-built child component initialisers for one arm of a loop-scoped
 * conditional. Empty list ⇒ stringifier emits nothing.
 */
export type BranchChildComponentInitsPlan = readonly BranchChildComponentInit[]
