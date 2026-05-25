/**
 * BF022 `INVALID_JSX_ATTRIBUTE` deletion audit.
 *
 * BF022 was reserved for "Invalid JSX attribute" but was never emitted.
 * TypeScript's own type-checking catches invalid attribute names and
 * types at the language level.
 */

import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'
import { ErrorCodes } from '../errors'

function compileToIR(source: string) {
  const ctx = analyzeComponent(source, '/tmp/Test.tsx')
  const ir = jsxToIR(ctx)
  return { ctx, ir, errors: ctx.errors }
}

describe('BF022 INVALID_JSX_ATTRIBUTE — deletion audit', () => {
  test('valid JSX attributes compile without errors', () => {
    const src = `'use client'
import { createSignal } from '@barefootjs/client'
export function App() {
  const [name, setName] = createSignal('world')
  return <input type="text" value={name()} onInput={(e) => setName(e.target.value)} />
}
`
    const { errors } = compileToIR(src)
    expect(errors).toHaveLength(0)
  })

  test('spread attributes compile without errors', () => {
    const src = `
export function App(props: { class?: string; id?: string }) {
  return <div {...props}>content</div>
}
`
    const { errors } = compileToIR(src)
    expect(errors).toHaveLength(0)
  })

  test('BF022 code no longer exists in ErrorCodes', () => {
    const allCodes = Object.values(ErrorCodes)
    expect(allCodes).not.toContain('BF022')
  })
})
