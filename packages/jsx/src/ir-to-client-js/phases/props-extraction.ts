/**
 * `props-extraction` phase — emit `const propName = _p.propName ?? <default>`
 * declarations at the top of the init body.
 *
 * The default value depends on usage:
 *   - prop has explicit default          → use it (wrap arrow defaults
 *                                            in parens for syntax safety)
 *   - prop is consumed as a loop array   → `?? []`
 *   - prop has property/index access     → `?? {}`  (skipped when the
 *                                            prop is a conditional guard
 *                                            so falsy values stay falsy)
 *   - prop is optional with type info    → `?? <inferred default>`
 *   - otherwise                          → no default
 *
 * Emitted whenever `neededProps` is non-empty — i.e. the component body
 * actually references one or more bare prop names (via destructured arg
 * `({ org }: Props)` OR via destructuring inside the body
 * `const { org } = props`). Pure SolidJS-style components that always
 * read `props.X` don't add anything to `neededProps`, so the early-return
 * takes care of that case naturally without a `propsObjectName` check.
 */

import type { PropUsage } from '../../types'
import { propHasPropertyAccess } from '../compute-prop-usage'
import type { ClientJsContext } from '../types'
import { inferDefaultValue, PROPS_PARAM } from '../utils'

export function emitPropsExtraction(
  lines: string[],
  ctx: ClientJsContext,
  neededProps: Set<string>,
  propUsage: Map<string, PropUsage>,
): void {
  if (neededProps.size === 0) return

  // Shadow guard: when a SolidJS-style component uses `(props)` and declares
  // a signal / memo / local with the same name as a prop, the bare ref
  // targets the local binding — emitting `const label = _p.label` would
  // then collide with the user's `const [label] = createSignal(...)`. Skip
  // those names; the local declaration the user wrote is what's wanted.
  const shadowed = new Set<string>()
  if (ctx.propsObjectName) {
    for (const s of ctx.signals) {
      shadowed.add(s.getter)
      if (s.setter) shadowed.add(s.setter)
    }
    for (const m of ctx.memos) shadowed.add(m.name)
    for (const c of ctx.localConstants) shadowed.add(c.name)
  }

  // Props that guard a conditional branch must remain falsy when undefined,
  // so `{}` (truthy) is the wrong default for them — track and exclude.
  const propsUsedAsConditions = new Set<string>()
  for (const cond of ctx.conditionalElements) {
    if (neededProps.has(cond.condition)) propsUsedAsConditions.add(cond.condition)
  }
  for (const cond of ctx.clientOnlyConditionals) {
    if (neededProps.has(cond.condition)) propsUsedAsConditions.add(cond.condition)
  }

  for (const propName of neededProps) {
    if (shadowed.has(propName)) continue
    const prop = ctx.propsParams.find(p => p.name === propName)
    const usage = propUsage.get(propName)
    const defaultVal = prop?.defaultValue
    if (defaultVal) {
      // `props.onInput ?? () => {}` is a syntax error — `??` binds tighter
      // than the arrow head. Wrap arrow defaults in parens.
      const wrappedDefault = prop?.defaultContainsArrow ? `(${defaultVal})` : defaultVal
      lines.push(`  const ${propName} = ${PROPS_PARAM}.${propName} ?? ${wrappedDefault}`)
    } else if (usage?.usedAsLoopArray) {
      lines.push(`  const ${propName} = ${PROPS_PARAM}.${propName} ?? []`)
    } else if (propHasPropertyAccess(usage) && !propsUsedAsConditions.has(propName)) {
      lines.push(`  const ${propName} = ${PROPS_PARAM}.${propName} ?? {}`)
    } else if (prop?.optional && prop?.type) {
      const inferredDefault = inferDefaultValue(prop.type)
      if (inferredDefault !== 'undefined') {
        lines.push(`  const ${propName} = ${PROPS_PARAM}.${propName} ?? ${inferredDefault}`)
      } else {
        lines.push(`  const ${propName} = ${PROPS_PARAM}.${propName}`)
      }
    } else {
      lines.push(`  const ${propName} = ${PROPS_PARAM}.${propName}`)
    }
  }
  lines.push('')
}
