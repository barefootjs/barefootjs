/**
 * Regression tests for #1596: reactive expressions inside a conditional
 * branch must generate text bindings so they update when dependencies change.
 *
 * Before this fix, `transformConditionalBranch` always set `slotId: null`
 * on branch-level IRExpressions, which meant `collectBranchTextEffects`
 * never collected them (it requires both `reactive` and `slotId`).
 * The result was an empty `bindEvents` and a static text node.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSX } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

function getClientJs(source: string, filename: string): string {
  const result = compileJSX(source, filename, { adapter })
  expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
  const clientJs = result.files.find(f => f.type === 'clientJs')
  expect(clientJs).toBeDefined()
  return clientJs!.content
}

describe('reactive text inside conditional branch (#1596)', () => {
  test('reactive memo call in truthy branch generates a text binding in bindEvents', () => {
    const source = `
      'use client'
      import { createSignal, createMemo } from '@barefootjs/client'

      export function Timer() {
        const [seconds, setSeconds] = createSignal(0)
        const totalDuration = createMemo(() => seconds() * 1000)
        const [ready, setReady] = createSignal(true)
        return (
          <div>
            {ready() ? totalDuration() : 'N/A'}
          </div>
        )
      }
    `

    const clientJs = getClientJs(source, 'Timer.tsx')

    const insertIdx = clientJs.indexOf('insert(')
    expect(insertIdx).toBeGreaterThanOrEqual(0)
    const insertBlock = clientJs.slice(insertIdx)

    // The truthy branch's bindEvents must contain a createDisposableEffect
    // for the reactive text node, not be empty.
    expect(insertBlock).toMatch(/bindEvents:\s*\(__branchScope[^)]*\)\s*=>\s*\{[\s\S]*?createDisposableEffect/)
  })

  test('function wrapping a reactive call in truthy branch generates a text binding', () => {
    const source = `
      'use client'
      import { createSignal, createMemo } from '@barefootjs/client'

      function formatDuration(ms: number): string {
        return ms + 'ms'
      }

      export function Timer() {
        const [seconds, setSeconds] = createSignal(0)
        const totalDuration = createMemo(() => seconds() * 1000)
        const [ready, setReady] = createSignal(true)
        return (
          <div>
            {ready() ? formatDuration(totalDuration()) : 'N/A'}
          </div>
        )
      }
    `

    const clientJs = getClientJs(source, 'Timer.tsx')

    const insertIdx = clientJs.indexOf('insert(')
    expect(insertIdx).toBeGreaterThanOrEqual(0)
    const insertBlock = clientJs.slice(insertIdx)

    expect(insertBlock).toMatch(/bindEvents:\s*\(__branchScope[^)]*\)\s*=>\s*\{[\s\S]*?createDisposableEffect/)
  })

  test('static literal in branch does NOT generate a text binding', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Toggle() {
        const [on, setOn] = createSignal(false)
        return (
          <div>
            {on() ? 'Yes' : 'No'}
          </div>
        )
      }
    `

    const clientJs = getClientJs(source, 'Toggle.tsx')

    const insertIdx = clientJs.indexOf('insert(')
    expect(insertIdx).toBeGreaterThanOrEqual(0)
    const insertBlock = clientJs.slice(insertIdx)

    // Static string branches should NOT have createDisposableEffect for text
    expect(insertBlock).not.toMatch(/bindEvents:\s*\(__branchScope[^)]*\)\s*=>\s*\{[\s\S]*?createDisposableEffect/)
  })
})
