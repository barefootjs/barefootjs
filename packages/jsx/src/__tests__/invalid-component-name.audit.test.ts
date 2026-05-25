/**
 * BF042 `INVALID_COMPONENT_NAME` deletion audit.
 *
 * BF042 was reserved for "Component name must start with uppercase
 * letter" but was never emitted. JSX's own lowercasing rules already
 * enforce this: lowercase tags are treated as intrinsic HTML elements,
 * so `<myComponent />` renders as `<mycomponent>` rather than calling
 * a component function. TypeScript also errors on the type mismatch.
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

describe('BF042 INVALID_COMPONENT_NAME — deletion audit', () => {
  test('PascalCase component compiles without errors', () => {
    const src = `
function MyButton() { return <button>click</button> }
export function App() {
  return <MyButton />
}
`
    const { errors } = compileToIR(src)
    expect(errors).toHaveLength(0)
  })

  test('BF042 code no longer exists in ErrorCodes', () => {
    const allCodes = Object.values(ErrorCodes)
    expect(allCodes).not.toContain('BF042')
  })
})
