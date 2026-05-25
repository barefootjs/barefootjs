/**
 * BF020 `INVALID_JSX_EXPRESSION` deletion audit.
 *
 * BF020 was reserved as a generic "Invalid JSX expression" catch-all.
 * BF021 (UNSUPPORTED_JSX_PATTERN) already covers every concrete case
 * where a JSX expression is unsupported by the compiler, and TypeScript
 * itself catches syntactically invalid JSX.
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

describe('BF020 INVALID_JSX_EXPRESSION — deletion audit', () => {
  test('valid JSX expressions compile without errors', () => {
    const src = `'use client'
import { createSignal } from '@barefootjs/client'
export function App() {
  const [show, setShow] = createSignal(true)
  return <div>{show() ? <span>yes</span> : <span>no</span>}</div>
}
`
    const { errors } = compileToIR(src)
    expect(errors).toHaveLength(0)
  })

  test('unsupported JSX patterns are caught by BF021, not BF020', () => {
    const allCodes = Object.values(ErrorCodes)
    expect(allCodes).toContain('BF021')
    expect(allCodes).not.toContain('BF020')
  })

  test('BF020 code no longer exists in ErrorCodes', () => {
    const allCodes = Object.values(ErrorCodes)
    expect(allCodes).not.toContain('BF020')
  })
})
