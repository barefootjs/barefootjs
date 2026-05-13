/**
 * Reactivity Classification — Destructured / Renamed Prop (issue #1248 Case 3)
 *
 *   const Comp = ({ value: renamed }: { value: string }) => {
 *     const x = renamed
 *     return <div>{x}</div>   // reactive because `renamed` is a prop
 *   }
 *
 * Today:
 *   - Phase 1 wraps via prop-name match heuristic (the analyzer knows
 *     `renamed` came from prop `value`).
 *   - Phase 2 regex looks for `props.renamed` in the expanded text and
 *     never finds it — the rename hides the prop identity at the string level.
 *
 * After unification the IR's `origin.freeRefs` for the `<div>{x}</div>`
 * expression must contain a `prop` reference pointing at the source prop
 * (or the renamed local that resolves to it through taint), and Phase 2
 * must agree.
 */

import { describe, test, expect } from 'bun:test'
import {
  compileToComponentIR,
  compileToClientJs,
  collectExpressions,
  hasFreeRefKind,
  EFFECT_WRAP_RE,
} from './_helpers'

const SOURCE = `
  export const Comp = ({ value: renamed }: { value: string }) => {
    const x = renamed
    return <div>{x}</div>
  }
`

describe('destructured / renamed prop', () => {
  test('IR marks expression reactive via prop reference in origin.freeRefs', () => {
    const { componentIR } = compileToComponentIR(SOURCE, '/virtual/Comp.tsx')
    expect(componentIR).not.toBeNull()
    const target = collectExpressions(componentIR!.root).find(
      e => e.expr.trim() === 'x'
    )
    expect(target).toBeDefined()
    expect(target!.reactive).toBe(true)

    expect(target!.origin).toBeDefined()
    expect(
      hasFreeRefKind(target!.origin!.freeRefs, 'prop', 'init-local')
    ).toBe(true)
  })

  test('cross-phase consistency: Phase 2 wraps the expression too', () => {
    const { componentIR } = compileToComponentIR(SOURCE, '/virtual/Comp.tsx')
    expect(componentIR).not.toBeNull()
    const clientJs = compileToClientJs(componentIR!)
    expect(clientJs).toMatch(EFFECT_WRAP_RE)
  })
})
