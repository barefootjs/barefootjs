/**
 * Reactivity Classification — Memo as Value (issue #1248 Case 2)
 *
 * When a memo is passed as a *value* rather than called (`const x = memo`),
 * the bare reference still carries the `Reactive<T>` brand on the TypeChecker.
 *
 *   const memo = createMemo(() => count() + 1)
 *   const x = memo            // brand sits on `memo`
 *   return <div>{x()}</div>   // `x` is reactive transitively
 *
 * Today the channels disagree:
 *   - TypeChecker brand walk picks up the reactivity on `memo`.
 *   - Phase 1 regex requires `memo\s*\(` and misses bare `memo`.
 *   - Phase 2 sees only the local `x` and never `memo`.
 *
 * After unification, the IR's `origin.freeRefs` must trace
 * `x → memo` (taint through the local constant) and mark the
 * expression reactive.
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
  import { createSignal, createMemo } from '@barefootjs/client'
  export const Counter = () => {
    const [count, setCount] = createSignal(0)
    const doubled = createMemo(() => count() * 2)
    const x = doubled
    return <div>{x()}</div>
  }
`

describe('memo as value (not called)', () => {
  test('bare memo reference through local constant is reactive', () => {
    const { componentIR } = compileToComponentIR(SOURCE, '/virtual/Counter.tsx')
    expect(componentIR).not.toBeNull()
    const target = collectExpressions(componentIR!.root).find(
      e => e.expr.trim() === 'x()'
    )
    expect(target).toBeDefined()
    expect(target!.reactive).toBe(true)

    expect(target!.origin).toBeDefined()
    // Should resolve via taint through the local constant `x` → `doubled`
    expect(
      hasFreeRefKind(target!.origin!.freeRefs, 'memo-getter', 'init-local')
    ).toBe(true)
  })

  test('cross-phase consistency: Phase 2 wraps the expression too', () => {
    const { componentIR } = compileToComponentIR(SOURCE, '/virtual/Counter.tsx')
    expect(componentIR).not.toBeNull()
    const clientJs = compileToClientJs(componentIR!)
    expect(clientJs).toMatch(EFFECT_WRAP_RE)
  })
})
