/**
 * Regression tests for #1401: a multi-return `'use client'` component
 * previously compiled to a `hydrate()` call without a `template` field
 * when `canGenerateStaticTemplate` returned `true` for the if-statement
 * IR root. Consumers resolving the component via
 * `createComponent(name, props)` (a parent's conditional branch, a
 * mapArray child) then hit
 *
 *   [BarefootJS] Template not found for component: X
 *
 * at runtime and rendered a `[X]` placeholder.
 *
 * Root cause: `irToComponentTemplate`'s `case 'if-statement': return ''`
 * — the static-template path silently lowered the entire body to an
 * empty string instead of the conditional template the CSR path
 * (`generateCsrTemplate`) already produced for the same shape. Fix
 * mirrors the CSR ternary into the static path so both routes agree.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSX } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

function extractHydrateCall(content: string): string {
  // The hydrate(...) call may span multiple statements emitted on the
  // same line; capture from `hydrate(` to the end of that line so the
  // template literal inside the call is included in the match.
  const match = content.split('\n').find((l) => l.includes('hydrate('))
  if (!match) throw new Error('no hydrate() call in client JS')
  return match
}

describe("multi-return 'use client' component → hydrate template (#1401)", () => {
  test('Toggle shape (signal + onClick + no signal reads in JSX) emits a conditional template', () => {
    // Pre-fix this exact shape compiled to `hydrate('Toggle', { init:
    // initToggle })` — no `template:` field — because
    // `canGenerateStaticTemplate` returned true but
    // `irToComponentTemplate` returned `''` for the if-statement root.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Toggle(props: { asChild?: boolean }) {
        const [open, setOpen] = createSignal(false)
        if (props.asChild) {
          return <span onClick={() => setOpen(!open())}>child</span>
        }
        return <button onClick={() => setOpen(!open())}>toggle</button>
      }
    `
    const result = compileJSX(source, 'Toggle.tsx', { adapter })
    expect(result.errors.filter((e) => e.severity === 'error')).toHaveLength(0)

    const clientJs = result.files.find((f) => f.type === 'clientJs')!
    const hydrate = extractHydrateCall(clientJs.content)

    expect(hydrate).toContain('template:')
    // The template lowers the multi-return body to a ternary at the
    // discriminant prop. Both branch templates appear inside it.
    expect(hydrate).toMatch(/_p\.asChild \?/)
    expect(hydrate).toContain('<span')
    expect(hydrate).toContain('child')
    expect(hydrate).toContain('<button')
    expect(hydrate).toContain('toggle')
  })

  test('issue literal repro (props-only dispatch, no signals) still emits a template', () => {
    const source = `
      'use client'
      export function MultiReturnView(props: { mode: 'a' | 'b' | 'c' }) {
        if (props.mode === 'a') return <div>view A</div>
        if (props.mode === 'b') return <div>view B</div>
        return <div>view C</div>
      }
    `
    const result = compileJSX(source, 'MultiReturnView.tsx', { adapter })
    expect(result.errors.filter((e) => e.severity === 'error')).toHaveLength(0)

    const clientJs = result.files.find((f) => f.type === 'clientJs')!
    const hydrate = extractHydrateCall(clientJs.content)
    expect(hydrate).toContain('template:')
    expect(hydrate).toContain('view A')
    expect(hydrate).toContain('view B')
    expect(hydrate).toContain('view C')
  })

  test('multi-return with reactive content (ConditionalReturn-shape) keeps its template', () => {
    // The CSR path already handled this shape; the fix to the
    // static-template path must not regress it.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      function ConditionalReturn(props: { variant?: string }) {
        const [count, setCount] = createSignal(0)
        if (props.variant === 'link') {
          return <a onClick={() => setCount(c => c + 1)}>link: {count()}</a>
        }
        return <button onClick={() => setCount(c => c + 1)}>btn: {count()}</button>
      }

      export default ConditionalReturn
    `
    const result = compileJSX(source, 'ConditionalReturn.tsx', { adapter })
    expect(result.errors.filter((e) => e.severity === 'error')).toHaveLength(0)

    const clientJs = result.files.find((f) => f.type === 'clientJs')!
    const hydrate = extractHydrateCall(clientJs.content)
    expect(hydrate).toContain('template:')
    expect(hydrate).toMatch(/_p\.variant === ['"]link['"] \?/)
  })

  test('nested else-if chain (3+ branches) lowers to a chained ternary', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function ThreeBranches(props: { mode: 'a' | 'b' | 'c' }) {
        const [n, setN] = createSignal(0)
        if (props.mode === 'a') {
          return <span onClick={() => setN(n() + 1)}>A</span>
        }
        if (props.mode === 'b') {
          return <em onClick={() => setN(n() + 1)}>B</em>
        }
        return <button onClick={() => setN(n() + 1)}>C</button>
      }
    `
    const result = compileJSX(source, 'ThreeBranches.tsx', { adapter })
    expect(result.errors.filter((e) => e.severity === 'error')).toHaveLength(0)

    const clientJs = result.files.find((f) => f.type === 'clientJs')!
    const hydrate = extractHydrateCall(clientJs.content)
    expect(hydrate).toContain('template:')
    expect(hydrate).toContain('<span')
    expect(hydrate).toContain('<em')
    expect(hydrate).toContain('<button')
  })
})
