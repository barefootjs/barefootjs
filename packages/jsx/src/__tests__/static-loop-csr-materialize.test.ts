/**
 * #1247 — static-array loops whose array references an init-scope local
 * (e.g. `Object.entries(props.x).filter(...)`) substitute `[]` in the
 * CSR template, so a `createComponent`-only mount renders an empty
 * container. The fix emits a clone-and-insert fallback inside the
 * static-loop's per-item forEach so the init function materialises
 * missing children at hydrate time.
 *
 * These tests pin the emit shape:
 *   - materialize branch present when the array is unsafe
 *   - materialize branch absent when the array is safe (no regression)
 *   - SSR path unaffected — when `__iterEl` already exists, the branch is
 *     a dead `if (!__iterEl)` and reactive bindings run as before
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

describe('#1247 — static-loop CSR self-heal', () => {
  test('prop-derived static array emits clone-and-insert fallback', () => {
    const source = `
      'use client'
      type Props = { reactions: Record<string, string[]> }
      export function ReactionBar(props: Props) {
        const entries = Object.entries(props.reactions ?? {}).filter(([, users]) => users.length > 0)
        return (
          <div data-reaction-bar="true">
            {entries.map(([emoji, users]) => (
              <button key={emoji} type="button">
                <span>{emoji}</span>
                <span>{String(users.length)}</span>
              </button>
            ))}
          </div>
        )
      }
    `
    const clientJs = getClientJs(source, 'ReactionBar.tsx')
    // The forEach must use `let __iterEl` (not `const`) so the materialize
    // branch can reassign after cloning.
    expect(clientJs).toMatch(/let __iterEl = /)
    // Clone-and-insert branch must be present.
    expect(clientJs).toMatch(/if \(!__iterEl\)/)
    expect(clientJs).toMatch(/document\.createElement\('template'\)/)
    expect(clientJs).toMatch(/insertBefore\(/)
  })

  test('inline literal static array does NOT emit the materialize branch', () => {
    // `[1, 2, 3]` is template-safe — the CSR template emits the array
    // inline, so children always exist on the CSR-only mount and no
    // self-heal is needed. Adding the branch here would be dead code on
    // every static loop, undoing the size discipline this path enforces.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function NumberList() {
        const [n] = createSignal(0)
        return (
          <ul data-n={n()}>
            {[1, 2, 3].map(x => <li key={x}>{x}</li>)}
          </ul>
        )
      }
    `
    const clientJs = getClientJs(source, 'NumberList.tsx')
    expect(clientJs).not.toMatch(/if \(!__iterEl\)/)
  })

  test('safe-prop array (no init-scope local) does NOT emit the branch', () => {
    // `props.items` is directly usable in the CSR template — no fallback
    // needed.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      type Props = { items: number[] }
      export function PropList(props: Props) {
        const [n] = createSignal(0)
        return (
          <ul data-n={n()}>
            {props.items.map(x => <li key={x}>{x}</li>)}
          </ul>
        )
      }
    `
    const clientJs = getClientJs(source, 'PropList.tsx')
    expect(clientJs).not.toMatch(/if \(!__iterEl\)/)
  })

  test('materialize branch uses raw destructured param refs (no __bfItem())', () => {
    // The static forEach destructures the param directly; the cloned
    // template literal must reference `emoji` not `__bfItem().emoji` —
    // otherwise the IIFE throws because `__bfItem` is not in scope.
    const source = `
      'use client'
      type Props = { reactions: Record<string, string[]> }
      export function ReactionBar(props: Props) {
        const entries = Object.entries(props.reactions ?? {}).filter(([, users]) => users.length > 0)
        return (
          <div>
            {entries.map(([emoji, users]) => (
              <button key={emoji} type="button">
                <span>{emoji}</span>
              </button>
            ))}
          </div>
        )
      }
    `
    const clientJs = getClientJs(source, 'ReactionBar.tsx')
    // Find the materialize block.
    const m = clientJs.match(/if \(!__iterEl\) \{[\s\S]*?\n\s+\}\n\s+if \(__iterEl\)/)
    expect(m).toBeTruthy()
    const block = m![0]
    // The cloned template must reference `emoji` directly.
    expect(block).toMatch(/\$\{emoji\}/)
    // It must NOT reference `__bfItem()` — that accessor only exists
    // inside `mapArray` renderItems, not inside a plain forEach.
    expect(block).not.toMatch(/__bfItem\(\)/)
  })
})
