/**
 * BarefootJS Compiler - Partial signal destructuring (getter only, no setter)
 *
 * const [items] = createSignal(...) should compile without errors
 * and produce correct SSR + client JS output.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('signal partial destructuring (getter only)', () => {
  test('compiles without errors', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function ReadOnlyList() {
        const [items] = createSignal([{ id: 1, name: 'A' }])
        return (
          <div>
            {items().map(item => (
              <p key={item.id}>{item.name}</p>
            ))}
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'ReadOnlyList.tsx', { adapter })
    expect(result.errors).toHaveLength(0)
  })

  test('client JS declares getter without setter', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function Counter() {
        const [count] = createSignal(42)
        return <div>{count()}</div>
      }
    `
    const result = compileJSXSync(source, 'Counter.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    const js = clientJs!.content

    // Should declare [count] (not [count, setCount])
    expect(js).toContain('[count] = createSignal(')
    expect(js).not.toContain('setCount')
  })

  test('SSR template references getter correctly', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function Display() {
        const [label] = createSignal('hello')
        return <span>{label()}</span>
      }
    `
    const result = compileJSXSync(source, 'Display.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const template = result.files.find(f => f.type === 'markedTemplate')
    expect(template).toBeDefined()
    // SSR should inline the initial value
    expect(template!.content).toContain('hello')
  })

  test('getter-only signal works with createMemo dependency', () => {
    const source = `
      'use client'
      import { createSignal, createMemo } from '@barefootjs/dom'

      export function Summary() {
        const [items] = createSignal([1, 2, 3])
        const total = createMemo(() => items().reduce((a, b) => a + b, 0))
        return <div>{total()}</div>
      }
    `
    const result = compileJSXSync(source, 'Summary.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    expect(clientJs!.content).toContain('[items] = createSignal(')
    expect(clientJs!.content).toContain('createMemo(')
  })
})
