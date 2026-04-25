/**
 * Stringify LoopPlan variants to source lines.
 *
 * Output shapes (preserved byte-identical from the legacy emitter):
 *
 *   PlainLoopPlan, no reactive effects (single-line renderItem):
 *     <indent>mapArray(() => <arr>, <container>, <keyFn>, (<head>, <idx>, __existing) =>
 *       { <unwrap?> <preamble?>; if (__existing) return __existing; const __tpl = ...; return ... })
 *
 *   PlainLoopPlan, with reactive effects (multi-line renderItem):
 *     <indent>mapArray(() => <arr>, <container>, <keyFn>, (<head>, <idx>, __existing) => {
 *     <indent>  <unwrap?>
 *     <indent>  <preamble?>
 *     <indent>  const __el = __existing ?? (() => { ... })()
 *     <indent>  <reactive effects via emitLoopChildReactiveEffects>
 *     <indent>  return __el
 *     <indent>})
 *
 *   StaticLoopPlan: two parallel forEach blocks (attrs / texts) — see
 *     emitStaticLoop. The forEach-duplication noted in observation O-4 is
 *     preserved bug-for-bug; PR 5+ collapses them.
 *
 * Indent convention for plain loops: top-level emission uses `'  '` (2 sp);
 * passed in via `topIndent`.
 */

import { varSlotId } from '../../utils'
import { emitLoopChildReactiveEffects } from '../../emit-control-flow'
import { emitAttrUpdate } from '../../emit-reactive'
import type { PlainLoopPlan, StaticLoopPlan } from '../plan/types'

export function stringifyPlainLoop(
  lines: string[],
  plan: PlainLoopPlan,
  topIndent: string = '  ',
): void {
  const {
    containerVar,
    arrayExpr,
    keyFn,
    paramHead,
    paramUnwrap,
    indexParam,
    mapPreambleWrapped,
    template,
    reactiveEffects,
  } = plan

  if (reactiveEffects === null) {
    // Single-line renderItem (no reactive effects).
    const unwrapInline = paramUnwrap ? `${paramUnwrap} ` : ''
    const preamble = mapPreambleWrapped ? `${mapPreambleWrapped}; ` : ''
    lines.push(
      `${topIndent}mapArray(() => ${arrayExpr}, ${containerVar}, ${keyFn}, (${paramHead}, ${indexParam}, __existing) => { ${unwrapInline}${preamble}if (__existing) return __existing; const __tpl = document.createElement('template'); __tpl.innerHTML = \`${template}\`; return __tpl.content.firstElementChild.cloneNode(true) })`,
    )
    return
  }

  // Multi-line renderItem (reactive effects present).
  lines.push(`${topIndent}mapArray(() => ${arrayExpr}, ${containerVar}, ${keyFn}, (${paramHead}, ${indexParam}, __existing) => {`)
  const bodyIndent = topIndent + '  '
  if (paramUnwrap) lines.push(`${bodyIndent}${paramUnwrap}`)
  if (mapPreambleWrapped) lines.push(`${bodyIndent}${mapPreambleWrapped}`)
  lines.push(`${bodyIndent}const __el = __existing ?? (() => { const __tpl = document.createElement('template'); __tpl.innerHTML = \`${template}\`; return __tpl.content.firstElementChild.cloneNode(true) })()`)
  emitLoopChildReactiveEffects(
    lines,
    bodyIndent,
    '__el',
    reactiveEffects.attrs,
    reactiveEffects.texts,
    reactiveEffects.conditionals,
    reactiveEffects.loopParam,
    reactiveEffects.loopParamBindings,
  )
  lines.push(`${bodyIndent}return __el`)
  lines.push(`${topIndent}})`)
}

export function stringifyStaticLoop(lines: string[], plan: StaticLoopPlan): void {
  const { containerVar, arrayExpr, param, indexParam, childIndexExpr, attrsBySlot, texts } = plan

  // Block 1: reactive attributes.
  if (attrsBySlot.length > 0) {
    lines.push(`  // Reactive attributes in static array children`)
    lines.push(`  if (${containerVar}) {`)
    lines.push(`    ${arrayExpr}.forEach((${param}, ${indexParam}) => {`)
    lines.push(`      const __iterEl = ${containerVar}.children[${childIndexExpr}]`)
    lines.push(`      if (__iterEl) {`)
    for (const [slotId, attrs] of attrsBySlot) {
      const varName = `__t_${varSlotId(slotId)}`
      lines.push(`        const ${varName} = qsa(__iterEl, '[bf="${slotId}"]')`)
      lines.push(`        if (${varName}) {`)
      for (const attr of attrs) {
        lines.push(`          createEffect(() => {`)
        for (const stmt of emitAttrUpdate(varName, attr.attrName, attr.expression, attr)) {
          lines.push(`            ${stmt}`)
        }
        lines.push(`          })`)
      }
      lines.push(`        }`)
    }
    lines.push(`      }`)
    lines.push(`    })`)
    lines.push(`  }`)
    lines.push('')
  }

  // Block 2: reactive texts. NOTE — the second forEach scans the same array
  // again. This duplication is observation O-4 and will be merged in a
  // follow-up PR; PR 2-a preserves the legacy shape.
  if (texts.length > 0) {
    lines.push(`  // Reactive texts in static array children`)
    lines.push(`  if (${containerVar}) {`)
    lines.push(`    ${arrayExpr}.forEach((${param}, ${indexParam}) => {`)
    lines.push(`      const __iterEl = ${containerVar}.children[${childIndexExpr}]`)
    lines.push(`      if (__iterEl) {`)
    for (const text of texts) {
      const vn = `__rt_${varSlotId(text.slotId)}`
      lines.push(`        { const [${vn}] = $t(__iterEl, '${text.slotId}')`)
      lines.push(`        if (${vn}) createEffect(() => { ${vn}.textContent = String(${text.expression}) }) }`)
    }
    lines.push(`      }`)
    lines.push(`    })`)
    lines.push(`  }`)
    lines.push('')
  }
}
