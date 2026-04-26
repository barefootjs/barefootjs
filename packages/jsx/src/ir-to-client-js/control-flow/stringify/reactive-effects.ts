/**
 * Stringify a `ReactiveEffectsPlan` into source lines.
 *
 * The stringifier is a deterministic walk: every wrap and every partition
 * decision was already made by `buildReactiveEffectsPlan`.
 *
 * Conditional arm bodies (events / child component inits / inner loops /
 * nested conditionals) still flow through the legacy helpers — Item 2 of
 * `tmp/emit-survey/HANDOFF.md` Plan-ifies those next.
 */

import { varSlotId, wrapLoopParamAsAccessor } from '../../utils'
import { emitAttrUpdate } from '../../emit-reactive'
import {
  emitBranchChildComponentInits,
  emitBranchInnerLoops,
  emitNestedLoopChildConditionals,
} from '../legacy-helpers'
import { stringifyBranchEventBindings } from './loop-child-arm'
import type {
  NestedConditionalPlan,
  ReactiveEffectsPlan,
  ReactiveTextEffect,
} from '../plan/reactive-effects'

export interface StringifyReactiveEffectsOptions {
  /** Indent prefix for every emitted line. */
  indent: string
  /**
   * Element variable to attach effects to (e.g., `__el`, `__existing`,
   * `__csrEl`). The stringifier never inspects it — it is simply substituted
   * into the qsa() / $t() call shapes.
   */
  elVar: string
}

export function stringifyReactiveEffects(
  lines: string[],
  plan: ReactiveEffectsPlan,
  opts: StringifyReactiveEffectsOptions,
): void {
  const { indent, elVar } = opts

  // 1. Reactive attribute effects (one qsa per slot, then per-attr createEffect).
  for (const slot of plan.attrSlots) {
    const varName = `__ra_${varSlotId(slot.slotId)}`
    lines.push(`${indent}{ const ${varName} = qsa(${elVar}, '[bf="${slot.slotId}"]')`)
    lines.push(`${indent}if (${varName}) {`)
    for (const attr of slot.attrs) {
      lines.push(`${indent}  createEffect(() => {`)
      for (const stmt of emitAttrUpdate(varName, attr.attrName, attr.wrappedExpression, attr.meta)) {
        lines.push(`${indent}    ${stmt}`)
      }
      lines.push(`${indent}  })`)
    }
    lines.push(`${indent}} }`)
  }

  // 2. Outer text effects (slots NOT inside any conditional branch).
  for (const text of plan.outerTexts) {
    emitOuterText(lines, indent, elVar, text)
  }

  // 3. Reactive conditionals — each emits an insert(...) with arm bodies that
  //    still delegate to the legacy bindEvents emitters (Item 2).
  for (const cond of plan.conditionals) {
    emitConditional(lines, indent, elVar, cond)
  }
}

function emitOuterText(
  lines: string[],
  indent: string,
  elVar: string,
  text: ReactiveTextEffect,
): void {
  const varName = `__rt_${varSlotId(text.slotId)}`
  lines.push(`${indent}{ const [${varName}] = $t(${elVar}, '${text.slotId}')`)
  lines.push(`${indent}if (${varName}) createEffect(() => { ${varName}.textContent = String(${text.wrappedExpression}) }) }`)
}

function emitBranchText(
  lines: string[],
  indent: string,
  text: ReactiveTextEffect,
): void {
  const varName = `__rt_${varSlotId(text.slotId)}`
  lines.push(`${indent}{ const [${varName}] = $t(__branchScope, '${text.slotId}')`)
  lines.push(`${indent}if (${varName}) createEffect(() => { ${varName}.textContent = String(${text.wrappedExpression}) }) }`)
}

function emitConditional(
  lines: string[],
  indent: string,
  elVar: string,
  cond: NestedConditionalPlan,
): void {
  // Re-derive the wrap closure for the legacy passthrough helpers; they each
  // accept a `wrap` function. wrapLoopParamAsAccessor is idempotent — applying
  // it to already-wrapped Plan strings would be a re-wrap bug, so the closure
  // is only handed to helpers that receive *unwrapped* IR data.
  const wrap = (expr: string) => wrapLoopParamAsAccessor(expr, cond.loopParam, cond.loopParamBindings)
  const armIndent = `${indent}    `

  lines.push(`${indent}insert(${elVar}, '${cond.slotId}', () => ${cond.wrappedCondition}, {`)
  lines.push(`${indent}  template: () => \`${cond.whenTrueTemplateHtml}\`,`)
  lines.push(`${indent}  bindEvents: (__branchScope) => {`)
  stringifyBranchEventBindings(lines, cond.whenTrueEvents, armIndent)
  emitBranchChildComponentInits(lines, armIndent, cond.legacyWhenTrue.childComponents, cond.loopParam, undefined, cond.loopParamBindings)
  emitBranchInnerLoops(lines, armIndent, '__branchScope', cond.legacyWhenTrue.innerLoops, cond.loopParam, undefined, cond.loopParamBindings)
  emitNestedLoopChildConditionals(lines, armIndent, '__branchScope', cond.legacyWhenTrue.conditionals, wrap, cond.loopParam, cond.loopParamBindings)
  for (const text of cond.whenTrueTexts) {
    emitBranchText(lines, armIndent, text)
  }
  lines.push(`${indent}  }`)
  lines.push(`${indent}}, {`)
  lines.push(`${indent}  template: () => \`${cond.whenFalseTemplateHtml}\`,`)
  lines.push(`${indent}  bindEvents: (__branchScope) => {`)
  stringifyBranchEventBindings(lines, cond.whenFalseEvents, armIndent)
  emitBranchChildComponentInits(lines, armIndent, cond.legacyWhenFalse.childComponents, cond.loopParam, undefined, cond.loopParamBindings)
  emitBranchInnerLoops(lines, armIndent, '__branchScope', cond.legacyWhenFalse.innerLoops, cond.loopParam, undefined, cond.loopParamBindings)
  emitNestedLoopChildConditionals(lines, armIndent, '__branchScope', cond.legacyWhenFalse.conditionals, wrap, cond.loopParam, cond.loopParamBindings)
  for (const text of cond.whenFalseTexts) {
    emitBranchText(lines, armIndent, text)
  }
  lines.push(`${indent}  }`)
  lines.push(`${indent}})`)
}
