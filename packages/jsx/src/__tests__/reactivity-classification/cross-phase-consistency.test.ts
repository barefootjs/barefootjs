/**
 * Reactivity Classification — Cross-Phase Consistency (issue #1248 AC)
 *
 * Invariant: for any expression-bearing IR node, the Phase 1 reactivity
 * judgement (derived from `origin.freeRefs`) and the Phase 2 emit shape
 * (effect wrap vs bare emit) must agree. Today the two channels can
 * silently diverge; this test pins the invariant.
 *
 * The check is structural — every expression node carries `origin` and
 * (when `reactive` is true) the emitted client JS wraps SOME expression.
 * We deliberately keep the assertion shape coarse so the test survives
 * minor emit changes; the point is "they don't disagree", not the exact
 * emission detail.
 */

import { describe, test, expect } from 'bun:test'
import {
  compileToComponentIR,
  compileToClientJs,
  collectExpressions,
  EFFECT_WRAP_RE,
} from './_helpers'

const FIXTURES: Array<{ label: string; source: string }> = [
  {
    label: 'signal getter call',
    source: `
      import { createSignal } from '@barefootjs/client'
      export const A = () => {
        const [count, setCount] = createSignal(0)
        return <div>{count()}</div>
      }
    `,
  },
  {
    label: 'memo call',
    source: `
      import { createSignal, createMemo } from '@barefootjs/client'
      export const B = () => {
        const [count, setCount] = createSignal(0)
        const doubled = createMemo(() => count() * 2)
        return <div>{doubled()}</div>
      }
    `,
  },
  {
    label: 'prop reference',
    source: `
      export const C = (props: { label: string }) => {
        return <div>{props.label}</div>
      }
    `,
  },
  {
    label: 'renamed destructured prop',
    source: `
      export const D = ({ label: renamed }: { label: string }) => {
        return <div>{renamed}</div>
      }
    `,
  },
  {
    label: 'static literal expression (not reactive)',
    source: `
      export const E = () => {
        const x = 'hello'
        return <div>{x}</div>
      }
    `,
  },
]

describe('cross-phase consistency invariant', () => {
  for (const { label, source } of FIXTURES) {
    test(`${label}: every expression has origin populated`, () => {
      const { componentIR } = compileToComponentIR(source, `/virtual/${label}.tsx`)
      expect(componentIR).not.toBeNull()
      const exprs = collectExpressions(componentIR!.root)
      expect(exprs.length).toBeGreaterThan(0)
      for (const e of exprs) {
        expect(e.origin).toBeDefined()
        // freeRefs is mandatory post-refactor
        expect(Array.isArray(e.origin!.freeRefs)).toBe(true)
      }
    })

    test(`${label}: Phase 1 reactive flag ⇔ Phase 2 effect wrap`, () => {
      const { componentIR } = compileToComponentIR(source, `/virtual/${label}.tsx`)
      expect(componentIR).not.toBeNull()
      const exprs = collectExpressions(componentIR!.root)
      const anyReactive = exprs.some(e => e.reactive)
      const clientJs = compileToClientJs(componentIR!)
      const hasEffectWrap = EFFECT_WRAP_RE.test(clientJs)
      // Two-way implication: if Phase 1 says reactive, Phase 2 must wrap;
      // if Phase 1 says nothing reactive, Phase 2 must not introduce a
      // spurious effect either.
      expect(hasEffectWrap).toBe(anyReactive)
    })
  }
})
