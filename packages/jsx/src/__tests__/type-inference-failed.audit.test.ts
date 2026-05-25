/**
 * BF030 `TYPE_INFERENCE_FAILED` deletion audit.
 *
 * BF030 was reserved for "Failed to infer type" — intended as a
 * fallback when the compiler's `ts.Program`-based type detection
 * fails. In practice, the compiler gracefully degrades (treats
 * unknown types as non-reactive) and TypeScript itself reports
 * type errors to the developer. No silent bug exists.
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

describe('BF030 TYPE_INFERENCE_FAILED — deletion audit', () => {
  test('component with typed props compiles without errors', () => {
    const src = `
interface Props { count: number; label: string }
export function Display(props: Props) {
  return <div>{props.label}: {props.count}</div>
}
`
    const { errors } = compileToIR(src)
    expect(errors).toHaveLength(0)
  })

  test('component with generic props compiles without errors', () => {
    const src = `
export function List<T extends { id: string }>(props: { items: T[] }) {
  return <ul>{props.items.map((item) => <li key={item.id}>{item.id}</li>)}</ul>
}
`
    const { errors } = compileToIR(src)
    expect(errors).toHaveLength(0)
  })

  test('BF030 code no longer exists in ErrorCodes', () => {
    const allCodes = Object.values(ErrorCodes)
    expect(allCodes).not.toContain('BF030')
  })
})
