/**
 * Regression tests for the #1409 follow-up: outer-scope locals whose
 * initializer holds JSX at a non-root position — `cond ? <jsx/> :
 * null`, `flag && <jsx/>`, `value ?? <jsx/>` — left their identifier
 * bare in the emitted client JS and tripped a runtime
 * `ReferenceError` when referenced from a JSX expression.
 *
 *   const cLocal = props.show ? <span>shown</span> : null
 *   …
 *   {/* @client * / cLocal}                   // ← `cLocal` undefined at hydrate
 *
 * #1410 already handled the case where such locals lived INSIDE an
 * early-return if-block (via `_branchScopeVars`). This pass extends
 * the same inline-at-use-site treatment to outer-scope locals:
 * `analyzer.inlineableJsxConsts` registers any const whose initializer
 * contains JSX at a non-root position, and `transformExpressionInner`
 * re-enters the dispatch chain with the initializer expression so the
 * ternary / binary lowers to IRConditional with `clientOnly`
 * preserved.
 *
 * Pure JSX-literal initializers stay on the existing `jsxConstants`
 * path (#547) — registered in `analyzer.jsxConstants` and inlined via
 * the `transformNode` shim.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSX } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

function clientJsContent(result: ReturnType<typeof compileJSX>): string {
  return result.files.find(f => f.type === 'clientJs')!.content
}

function hydrateLine(result: ReturnType<typeof compileJSX>): string {
  const line = clientJsContent(result).split('\n').find(l => l.includes('hydrate('))
  if (!line) throw new Error('no hydrate() call in client JS')
  return line
}

describe('outer-scope inlineable JSX-typed consts (#1409 follow-up)', () => {
  test("issue exact follow-up repro: ternary-typed local declared after early returns inlines at the @client use site", () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Props { kind: 'a' | 'b' | 'c'; show: boolean }

      export function EarlyReturnOuterTernary(props: Props) {
        const [count] = createSignal(0)

        if (props.kind === 'a') {
          return <div><span>view A: {count()}</span></div>
        }
        if (props.kind === 'b') {
          return <div><span>view B: {count()}</span></div>
        }

        const cLocal = props.show ? <span>shown</span> : null
        return (
          <div>
            <span>view C: {count()}</span>
            {/* @client */ cLocal}
          </div>
        )
      }
    `
    const result = compileJSX(source, 'EarlyReturnOuterTernary.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)

    const content = clientJsContent(result)
    // Pre-fix: `updateClientMarker(__scope, 's*', cLocal)` referenced
    // an undeclared name at outer init scope.
    expect(content).not.toMatch(/\bcLocal\b/)
    // The ternary lowers to a clientOnly IRConditional → routes through
    // `insert()`, and `props.show` is bridged to `_p.show`.
    expect(content).toContain('insert(__scope')
    expect(content).toMatch(/_p\.show/)
  })

  test('outer-scope ternary-typed JSX local without early returns also resolves', () => {
    // The bug isn't actually about early returns — it's about
    // ternary-typed JSX locals at outer scope generally. This guards
    // the same fix on a layout that doesn't involve `if`-statement
    // returns.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function TernaryLocalNoEarly(props: { show: boolean }) {
        const [count] = createSignal(0)
        const local = props.show ? <span>shown</span> : null
        return <div>view: {count()}{/* @client */ local}</div>
      }
    `
    const result = compileJSX(source, 'TernaryLocalNoEarly.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)

    const content = clientJsContent(result)
    expect(content).not.toMatch(/\blocal\b/)
    expect(content).toContain('insert(__scope')
  })

  test('logical-AND-typed JSX local also inlines (`flag && <jsx/>`)', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function AndLocal(props: { show: boolean }) {
        const [count] = createSignal(0)
        const local = props.show && <span>shown</span>
        return <div>view: {count()}{local}</div>
      }
    `
    const result = compileJSX(source, 'AndLocal.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)

    const content = clientJsContent(result)
    expect(content).not.toMatch(/\blocal\b/)
  })

  test('nullish-coalescing-typed JSX local also inlines (`prop ?? <fallback/>`)', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function NullishLocal(props: { label: string | null }) {
        const [count] = createSignal(0)
        const local = props.label ?? <span>default</span>
        return <div>view: {count()}{local}</div>
      }
    `
    const result = compileJSX(source, 'NullishLocal.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)

    const content = clientJsContent(result)
    expect(content).not.toMatch(/\blocal\b/)
  })

  test('non-JSX-shaped local is left alone (no spurious inlining)', () => {
    // Regression guard: a const initializer with no JSX at all must
    // stay on the regular `localConstants` path. The
    // `inlineableJsxConsts` map only catches JSX-bearing shapes — a
    // ternary on two scalars must not get caught and routed through
    // the JSX-expression dispatcher (which would otherwise return
    // `null` for both leaves and produce a wrong-shape IR).
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function ScalarLocal(props: { flag: boolean }) {
        const [count] = createSignal(0)
        const label = props.flag ? 'yes' : 'no'
        return <div>{label}: {count()}</div>
      }
    `
    const result = compileJSX(source, 'ScalarLocal.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    // The chained-const inliner substitutes `label` to its value in
    // the template. Either `'yes'` (truthy literal in `_p.flag ?
    // 'yes' : 'no'`) or the ternary itself must appear — what must NOT
    // appear is an `insert(__scope` call (the IRConditional-with-
    // clientOnly route), which would mean the JSX dispatcher
    // mistakenly took ownership of a non-JSX ternary.
    expect(clientJsContent(result)).not.toContain('insert(__scope')
  })

  test("JSX inside a helper function body doesn't trip the JSX-shape detector", () => {
    // The detector walks into the initializer's AST, but stops at any
    // function / arrow boundary so JSX inside a callback isn't counted.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function HelperJsx(props: { items: string[] }) {
        const [count] = createSignal(0)
        const formatter = (item: string) => <span>{item}</span>  // JSX is INSIDE the arrow body
        return <div>view: {count()}{props.items.map(formatter)}</div>
      }
    `
    const result = compileJSX(source, 'HelperJsx.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    // `formatter` is an arrow function, not an inlineable-JSX shape.
    // Its body's JSX is handled through the `jsxFunctions` (#569) path.
  })

  test('pure JSX literal local is still handled by `jsxConstants` (#547)', () => {
    // Regression guard: the new `inlineableJsxConsts` path is consulted
    // only after the existing `jsxConstants` check misses. Pure JSX
    // literals must continue to route through the #547 inlining shim.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function PureJsxLocal() {
        const [count] = createSignal(0)
        const local = <span>literal</span>
        return <div>view: {count()}{local}</div>
      }
    `
    const result = compileJSX(source, 'PureJsxLocal.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    // Inlined directly: the template contains the literal span, not a
    // reference to `local`.
    expect(hydrateLine(result)).toContain('<span>literal</span>')
    expect(clientJsContent(result)).not.toMatch(/\blocal\b/)
  })
})
