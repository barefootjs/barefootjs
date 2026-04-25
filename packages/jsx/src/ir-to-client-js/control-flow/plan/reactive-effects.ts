/**
 * Plan types for emitting reactive effects (attrs, texts, conditionals)
 * inside a loop item's renderItem body.
 *
 * Every emission decision (attr-by-slot grouping, text-inside-conditional
 * partition, loop-param wrapping) is resolved at build time so the
 * stringifier becomes a deterministic walk of pre-computed data.
 *
 * Inner branch bodies (events, child component inits, inner loops, nested
 * conditionals) are still routed through the legacy helpers — Item 2 of the
 * `tmp/emit-survey/HANDOFF.md` plan replaces those with their own Plans and
 * removes the `legacyWhenTrue` / `legacyWhenFalse` fields.
 */

import type { AttrMeta, LoopParamBinding } from '../../../types'
import type { LoopChildBranchSummary } from '../../types'

/** A single reactive attribute effect (one createEffect block). */
export interface ReactiveAttrEffect {
  attrName: string
  /** Already wrapped via wrapLoopParamAsAccessor at build time. */
  wrappedExpression: string
  /** Pre-copied attr metadata used by emitAttrUpdate. */
  meta: AttrMeta
}

/** Reactive attrs grouped by child slot (one qsa lookup per slot). */
export interface ReactiveAttrSlot {
  slotId: string
  attrs: readonly ReactiveAttrEffect[]
}

/** A reactive text effect (one createEffect updating textContent). */
export interface ReactiveTextEffect {
  slotId: string
  /** Already wrapped via wrapLoopParamAsAccessor at build time. */
  wrappedExpression: string
}

/**
 * Plan for one reactive conditional inside a loop scope. The HTML and
 * condition are wrapped at build time; per-arm reactive text effects are
 * partitioned out of the outer text list. The arm bodies themselves
 * (events / child components / inner loops / nested conditionals) are still
 * delegated to the legacy helpers via `legacyWhenTrue` / `legacyWhenFalse`.
 */
export interface NestedConditionalPlan {
  slotId: string
  /** Wrapped condition expression (already through wrapLoopParamAsAccessor). */
  wrappedCondition: string
  /** Wrapped + addCondAttrToTemplate'd whenTrue HTML — ready for `\`...\``. */
  whenTrueTemplateHtml: string
  /** Wrapped + addCondAttrToTemplate'd whenFalse HTML. */
  whenFalseTemplateHtml: string
  /** Texts whose slot lives in whenTrue's HTML — emitted inside whenTrue's bindEvents. */
  whenTrueTexts: readonly ReactiveTextEffect[]
  /** Texts whose slot lives in whenFalse's HTML. */
  whenFalseTexts: readonly ReactiveTextEffect[]
  /**
   * Branch summaries kept verbatim for the legacy bindEvents emitters
   * (events / child components / inner loops / nested conditionals). Item 2
   * Plan-ifies these and removes the field.
   */
  legacyWhenTrue: LoopChildBranchSummary
  legacyWhenFalse: LoopChildBranchSummary
  /** Loop param identifier — needed by the legacy passthroughs. */
  loopParam: string
  /** Destructured-binding metadata for the loop param. */
  loopParamBindings?: readonly LoopParamBinding[]
}

export interface ReactiveEffectsPlan {
  attrSlots: readonly ReactiveAttrSlot[]
  /** Text effects scoped to the outer renderItem (not inside any conditional). */
  outerTexts: readonly ReactiveTextEffect[]
  conditionals: readonly NestedConditionalPlan[]
}
