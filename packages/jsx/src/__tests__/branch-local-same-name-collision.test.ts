/**
 * Regression tests for #1422: when the same identifier name is declared
 * as `const` inside multiple early-return `if`-blocks of a `'use client'`
 * component, barefoot's hoist pass kept only one declaration in outer
 * init scope — the last one encountered. Sibling branches' nested
 * function declarations ended up reading the wrong value at runtime.
 *
 * Distinct from #1414 (single-branch reference leakage). The bug here is
 * that nested function declarations inside a branch are captured by the
 * analyzer via the `collectFunction` path with their bodies as raw text.
 * The text references the branch-local `const`, but since multiple
 * branches declare the same name, only one survives as a top-level
 * binding — every branch's closure resolves to that one value.
 *
 * Fix: in `collectFunction`, walk the function's ancestor chain for any
 * enclosing conditional-return `if`-block and text-substitute its
 * `scopeVariables` references in the captured body. Mirrors the existing
 * `_branchScopeVars` route in `jsx-to-ir.ts` that handles JSX-return
 * raw-text capture (ref callbacks, event handlers, `{local()}` child
 * positions).
 */

import { describe, test, expect } from 'bun:test'
import { compileJSX } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

function clientJsContent(result: ReturnType<typeof compileJSX>): string {
  return result.files.find(f => f.type === 'clientJs')!.content
}

describe('same-name branch-local const referenced from nested function decl (#1422)', () => {
  test('two sibling branches with same-name const — each closure reads its branch value', () => {
    const source = `
      'use client'

      interface Props { mode: 'a' | 'b' }

      export function TwoBranches(props: Props) {
        if (props.mode === 'a') {
          const size = 'small'
          function attachA(el: HTMLElement) {
            el.dataset.size = size
          }
          return <div ref={attachA}>A</div>
        }
        const size = 'large'
        function attachB(el: HTMLElement) {
          el.dataset.size = size
        }
        return <div ref={attachB}>B</div>
      }
    `
    const result = compileJSX(source, 'TwoBranches.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toEqual([])
    const content = clientJsContent(result)

    // attachA's body must reference 'small', not 'large'.
    expect(content).toMatch(/attachA[\s\S]*?dataset\.size\s*=\s*\('small'\)/)
    // attachB stays as a top-level reference: `size` resolves to 'large' via the
    // outer init-scope const. Either form is acceptable as long as the value
    // observed at runtime is 'large'.
    const attachBBody = content.match(/attachB\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}/)?.[0] ?? ''
    if (!attachBBody.includes("'large'")) {
      // If not inlined, the bare `size` reference must resolve to the only
      // outer-scope `const size = 'large'`.
      expect(content).toMatch(/const\s+size\s*=\s*'large'/)
      expect(attachBBody).toMatch(/\bsize\b/)
    }
  })

  test('three branches with same-name const (matches desk #86 phase 6 shape)', () => {
    const source = `
      'use client'

      interface Props { mode: 'a' | 'b' | 'c' }

      export function BranchLocalSameNameCollision(props: Props) {
        if (props.mode === 'a') {
          const size = 'small'
          function attachA(el: HTMLElement) {
            el.dataset.size = size
          }
          return <div ref={attachA}>A</div>
        }
        if (props.mode === 'b') {
          const size = 'medium'
          function attachB(el: HTMLElement) {
            el.dataset.size = size
          }
          return <div ref={attachB}>B</div>
        }
        const size = 'large'
        function attachC(el: HTMLElement) {
          el.dataset.size = size
        }
        return <div ref={attachC}>C</div>
      }
    `
    const result = compileJSX(source, 'ThreeBranches.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toEqual([])
    const content = clientJsContent(result)

    // Each branch closure reads its own branch's value.
    const attachABody = content.match(/attachA\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}/)?.[0] ?? ''
    const attachBBody = content.match(/attachB\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}/)?.[0] ?? ''

    expect(attachABody).toContain("'small'")
    expect(attachBBody).toContain("'medium'")

    // attachA must NOT read 'large' or 'medium'.
    expect(attachABody).not.toContain("'large'")
    expect(attachABody).not.toContain("'medium'")
    // attachB must NOT read 'large' or 'small'.
    expect(attachBBody).not.toContain("'large'")
    expect(attachBBody).not.toContain("'small'")
  })

  test('mixed initializer kinds (string vs number) under the same identifier', () => {
    const source = `
      'use client'

      interface Props { mode: 'a' | 'b' | 'c' }

      export function MixedKinds(props: Props) {
        if (props.mode === 'a') {
          const value = 'string-value'
          function attachA(el: HTMLElement) {
            el.dataset.value = String(value)
          }
          return <div ref={attachA}>A</div>
        }
        if (props.mode === 'b') {
          const value = 42
          function attachB(el: HTMLElement) {
            el.dataset.value = String(value)
          }
          return <div ref={attachB}>B</div>
        }
        const value = true
        function attachC(el: HTMLElement) {
          el.dataset.value = String(value)
        }
        return <div ref={attachC}>C</div>
      }
    `
    const result = compileJSX(source, 'MixedKinds.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toEqual([])
    const content = clientJsContent(result)

    const attachABody = content.match(/attachA\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}/)?.[0] ?? ''
    const attachBBody = content.match(/attachB\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}/)?.[0] ?? ''

    expect(attachABody).toContain("'string-value'")
    expect(attachBBody).toContain('42')

    expect(attachABody).not.toContain('42')
    expect(attachBBody).not.toContain("'string-value'")
  })

  test('non-colliding branch-local — substitution still applies (covers prior single-branch shape)', () => {
    // Same fix path covers the prior single-branch case where a closure
    // references a branch-local without a same-name sibling. Without
    // substitution the bare `wrapperHeight` would leak to outer scope
    // and ReferenceError at runtime.
    const source = `
      'use client'

      interface Props { kind: 'a' | 'b' }

      export function SingleBranch(props: Props) {
        if (props.kind === 'a') {
          const wrapperHeight = '36px'
          function attachWrapper(w: HTMLElement) {
            w.style.minHeight = wrapperHeight
          }
          return <div ref={attachWrapper}>A</div>
        }
        return <div>B</div>
      }
    `
    const result = compileJSX(source, 'SingleBranch.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toEqual([])
    const content = clientJsContent(result)

    // The wrapperHeight identifier must NOT survive as a free reference;
    // it must be substituted with its literal value. The function body may
    // appear in arrow form (init scope) or `function (...) {...}` form
    // (module scope) depending on whether it still references any
    // init-required name after substitution.
    expect(content).toContain("'36px'")
    expect(content).not.toMatch(/=\s*wrapperHeight\b/)
  })
})
