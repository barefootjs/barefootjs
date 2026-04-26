/**
 * BarefootJS Compiler — Plain `.map()` inside a conditional branch (#1065)
 *
 * Sibling file of `composite-branch-loop.test.ts`. Covers the **plain**
 * branch-loop emission path: a `.map()` whose body is a single native
 * element with no child components and no nested inner loops (so
 * `useElementReconciliation` is false and `BranchPlainLoopPlan` is built
 * instead of `BranchCompositeLoopPlan`).
 *
 * Issue #1065: the plain path's `mapPreambleRaw` field carried the inner
 * `.map()` callback's block-body locals **without** rewriting loop-param
 * references to signal-accessor form. The renderItem callback then read
 * `cell.flag` instead of `cell().flag` — bare `cell` inside the renderItem
 * is the signal accessor function, so `cell.flag === undefined` and the
 * preamble produced wrong values silently. The composite path used
 * `mapPreambleWrapped` correctly.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('plain `.map()` inside a conditional branch (#1065)', () => {
  test('regression #1065: branch-plain mapPreamble references the loop param via signal accessor', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      type Cell = { id: number; value: string; flag: boolean }

      export function CondList() {
        const [show] = createSignal(true)
        const [items, setItems] = createSignal<Cell[]>([
          { id: 1, value: 'a', flag: true },
        ])
        return (
          <div onClick={() => setItems(prev => [...prev])}>
            {show() ? (
              <ul>
                {items().map((cell) => {
                  const cls = cell.flag ? 'on' : 'off'
                  return <li key={cell.id} className={cls}>{cell.value}</li>
                })}
              </ul>
            ) : null}
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'CondList.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    const js = result.files.find(f => f.type === 'clientJs')!.content

    // The branch-plain renderItem must rewrite preamble references to
    // `cell()` — `cell` inside the renderItem is the signal accessor, so
    // bare `cell.flag` would resolve to `undefined`. Composite-loop's
    // `${cell().id}` template references are already wrapped; the
    // preamble must match.
    const renderItemSection = js.slice(
      js.indexOf('__disposers.push(createDisposableEffect'),
      js.indexOf('return () => __disposers'),
    )
    expect(renderItemSection.length).toBeGreaterThan(0)
    expect(renderItemSection).toMatch(/const\s+cls\s*=\s*cell\(\)\.flag/)
    expect(renderItemSection).not.toMatch(/const\s+cls\s*=\s*cell\.flag/)
  })

  test('regression #1065: destructured branch-plain mapPreamble rewrites bindings to __bfItem()', () => {
    // Destructured callback param (#951): the wrap pass must rewrite each
    // binding name (here `flag`) to `__bfItem().flag`, matching the
    // template-literal references that already use the destructured form.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      type Cell = { id: number; value: string; flag: boolean }

      export function CondListD() {
        const [show] = createSignal(true)
        const [items, setItems] = createSignal<Cell[]>([
          { id: 1, value: 'a', flag: true },
        ])
        return (
          <div onClick={() => setItems(prev => [...prev])}>
            {show() ? (
              <ul>
                {items().map(({ id, value, flag }) => {
                  const cls = flag ? 'on' : 'off'
                  return <li key={id} className={cls}>{value}</li>
                })}
              </ul>
            ) : null}
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'CondListD.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    const js = result.files.find(f => f.type === 'clientJs')!.content

    const renderItemSection = js.slice(
      js.indexOf('__disposers.push(createDisposableEffect'),
      js.indexOf('return () => __disposers'),
    )
    // Destructured bindings inside the preamble must read via __bfItem().
    expect(renderItemSection).toMatch(/const\s+cls\s*=\s*__bfItem\(\)\.flag/)
    expect(renderItemSection).not.toMatch(/const\s+cls\s*=\s*flag\b/)
  })

  test('regression #1065: single-line renderItem shape (no reactive effects) wraps preamble', () => {
    // The plain branch-loop emitter has two emission shapes — a multi-line
    // body when `loop.childReactive*` is non-empty, and a single-line body
    // (everything packed into one `mapArray(...)` line) when there are no
    // reactive effects on item children. The previous two tests had a
    // `{cell.value}` reactive text inside the `<li>` body, which forced
    // the multi-line branch; the single-line branch's preamble wrap was
    // therefore untested and could have silently regressed.
    //
    // This source has no reactive expressions inside the loop item, so the
    // emitter takes the single-line path:
    //
    //   mapArray(...,(cell, idx, __existing) => {
    //     if (__existing) return __existing;
    //     const cls = cell().flag ? 'on' : 'off';   ← must be wrapped
    //     ...
    //   })
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      type Cell = { id: number; flag: boolean }

      export function CondListSL() {
        const [show] = createSignal(true)
        const [items, setItems] = createSignal<Cell[]>([
          { id: 1, flag: true },
        ])
        return (
          <div onClick={() => setItems(prev => [...prev])}>
            {show() ? (
              <ul>
                {items().map((cell) => {
                  const cls = cell.flag ? 'on' : 'off'
                  return <li key={cell.id} className={cls}>x</li>
                })}
              </ul>
            ) : null}
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'CondListSL.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    const js = result.files.find(f => f.type === 'clientJs')!.content

    const renderItemSection = js.slice(
      js.indexOf('__disposers.push(createDisposableEffect'),
      js.indexOf('return () => __disposers'),
    )
    expect(renderItemSection.length).toBeGreaterThan(0)
    // Confirm we're in the single-line branch by asserting all of
    // `mapArray(...)` lives on one source line — multi-line would split
    // across newlines.
    const mapArrayLine = renderItemSection
      .split('\n')
      .find(l => l.includes('mapArray('))
    expect(mapArrayLine).toBeDefined()
    expect(mapArrayLine!).toContain(' return __existing;')
    expect(mapArrayLine!).toContain('cell().flag')
    expect(mapArrayLine!).not.toContain(' cell.flag')
  })

  test('regression #1065: destructured + single-line shape rewrites bindings to __bfItem()', () => {
    // Cross-product of the two sub-features: destructured callback param
    // (#951) AND single-line emission shape (no reactive effects). Both
    // wrap pathways must compose so the preamble stays consistent with
    // the template literal's already-wrapped reads.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      type Cell = { id: number; flag: boolean }

      export function CondListSLD() {
        const [show] = createSignal(true)
        const [items, setItems] = createSignal<Cell[]>([
          { id: 1, flag: true },
        ])
        return (
          <div onClick={() => setItems(prev => [...prev])}>
            {show() ? (
              <ul>
                {items().map(({ id, flag }) => {
                  const cls = flag ? 'on' : 'off'
                  return <li key={id} className={cls}>x</li>
                })}
              </ul>
            ) : null}
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'CondListSLD.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    const js = result.files.find(f => f.type === 'clientJs')!.content

    const renderItemSection = js.slice(
      js.indexOf('__disposers.push(createDisposableEffect'),
      js.indexOf('return () => __disposers'),
    )
    const mapArrayLine = renderItemSection
      .split('\n')
      .find(l => l.includes('mapArray('))
    expect(mapArrayLine).toBeDefined()
    expect(mapArrayLine!).toContain('__bfItem().flag')
    // Bare `flag` reference (without `__bfItem().` prefix) would mean the
    // wrap pass missed the destructured binding.
    expect(mapArrayLine!).not.toMatch(/\bcls\s*=\s*flag\b/)
  })
})
