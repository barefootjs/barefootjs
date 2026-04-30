/**
 * Pins the lowering of `async function` declarations inside a `'use client'`
 * component body to a `const <name> = async (...) => { ... }` arrow.
 *
 * Without preserving the `async` modifier on the rewritten arrow, any `await`
 * inside the body throws `SyntaxError: Unexpected reserved word` at parse
 * time in the browser, because the lowered arrow is no longer an async
 * function. See piconic-ai/barefootjs#1130.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('async function declarations → async const arrow rewrite (#1130)', () => {
  test('async function inside component body keeps `async` modifier on the lowered arrow', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Page() {
        const [items, setItems] = createSignal<string[]>([])

        async function fetchItems(forceRefresh = false) {
          const res = await fetch('/api/items?force=' + forceRefresh)
          const data = await res.json()
          setItems(data)
        }

        return (
          <div>
            <button onClick={() => fetchItems(true)}>Reload</button>
            {items().length}
          </div>
        )
      }
    `

    const result = compileJSXSync(source, 'Page.tsx', { adapter })
    expect(result.errors).toHaveLength(0)
    const clientJs = result.files.find((f) => f.type === 'clientJs')
    const content = clientJs?.content ?? ''

    // The arrow form must keep `async` so the `await` inside it parses.
    expect(content).toMatch(/const\s+fetchItems\s*=\s*async\s*\(/)
    // It must NOT lower to a plain (non-async) arrow.
    expect(content).not.toMatch(/const\s+fetchItems\s*=\s*\(forceRefresh\s*=\s*false\)\s*=>/)
  })

  test('non-async function still lowers to a plain const arrow (no spurious `async`)', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Page() {
        const [count, setCount] = createSignal(0)

        function bump(by = 1) {
          setCount(count() + by)
        }

        return <button onClick={() => bump(2)}>{count()}</button>
      }
    `

    const result = compileJSXSync(source, 'Page.tsx', { adapter })
    expect(result.errors).toHaveLength(0)
    const clientJs = result.files.find((f) => f.type === 'clientJs')
    const content = clientJs?.content ?? ''

    // Non-async functions still lower to a plain arrow — must not gain an
    // `async` keyword by accident.
    expect(content).toMatch(/const\s+bump\s*=\s*\(/)
    expect(content).not.toMatch(/const\s+bump\s*=\s*async\b/)
  })
})
