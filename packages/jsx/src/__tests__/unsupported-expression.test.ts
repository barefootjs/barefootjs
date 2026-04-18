/**
 * Unsupported Expression Error Tests
 *
 * Tests for BF021: Emit compile error when a filter predicate cannot be
 * compiled to marked template and @client is not present.
 */

import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'
import { compileJSXSync } from '../compiler'
import { ErrorCodes } from '../errors'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

/**
 * Helper: analyze and transform to IR, returning errors from ctx.
 */
function compileToIR(source: string) {
  const ctx = analyzeComponent(source, 'Test.tsx')
  const ir = jsxToIR(ctx)
  return { ctx, ir, errors: ctx.errors }
}

describe('Unsupported Expression Error (BF021)', () => {
  // Use `typeof t` in filter predicate — typeof expressions are unsupported
  // by the expression parser for server-side rendering.
  const unsupportedSource = `
    'use client'
    import { createSignal } from '@barefootjs/client'

    export function TodoList() {
      const [items, setItems] = createSignal<any[]>([])
      return (
        <ul>
          {items().filter(t => typeof t === 'string').map(t => (
            <li>{t}</li>
          ))}
        </ul>
      )
    }
  `

  test('emits BF021 error for unsupported filter predicate', () => {
    const { errors } = compileToIR(unsupportedSource)
    const bf021 = errors.filter(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)

    expect(bf021).toHaveLength(1)
    expect(bf021[0].severity).toBe('error')
  })

  test('@client suppresses BF021 error', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function TodoList() {
        const [items, setItems] = createSignal<any[]>([])
        return (
          <ul>
            {/* @client */ items().filter(t => typeof t === 'string').map(t => (
              <li>{t}</li>
            ))}
          </ul>
        )
      }
    `

    const { errors } = compileToIR(source)
    const bf021 = errors.filter(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)

    expect(bf021).toHaveLength(0)
  })

  test('no BF021 error for supported filter predicate', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function TodoList() {
        const [todos, setTodos] = createSignal<any[]>([])
        return (
          <ul>
            {todos().filter(t => !t.done).map(t => (
              <li>{t.name}</li>
            ))}
          </ul>
        )
      }
    `

    const { errors } = compileToIR(source)
    const bf021 = errors.filter(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)

    expect(bf021).toHaveLength(0)
  })

  test('error message includes the unsupported reason', () => {
    const { errors } = compileToIR(unsupportedSource)
    const bf021 = errors.find(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)

    expect(bf021).toBeDefined()
    expect(bf021!.message).toContain('Expression cannot be compiled to marked template')
  })

  test('error includes suggestion to add @client', () => {
    const { errors } = compileToIR(unsupportedSource)
    const bf021 = errors.find(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)

    expect(bf021).toBeDefined()
    expect(bf021!.suggestion).toBeDefined()
    expect(bf021!.suggestion!.message).toContain('@client')
  })

  test('IR is still produced despite BF021 error (graceful degradation)', () => {
    const { ir, errors } = compileToIR(unsupportedSource)

    // Error is emitted
    const bf021 = errors.filter(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)
    expect(bf021).toHaveLength(1)

    // But IR is still produced
    expect(ir).not.toBeNull()
    expect(ir!.type).toBe('element')
  })

  test('compileJSXSync includes IR-phase BF021 errors in result', () => {
    const result = compileJSXSync(unsupportedSource, 'TodoList.tsx', { adapter })
    const bf021 = result.errors.filter(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)

    expect(bf021).toHaveLength(1)
    expect(bf021[0].severity).toBe('error')
    expect(bf021[0].message).toContain('Expression cannot be compiled to marked template')
  })
})

describe('Unsupported Sort Comparator (BF021)', () => {
  test('emits BF021 error for non-subtraction sort comparator', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function TodoList() {
        const [items, setItems] = createSignal<any[]>([])
        return (
          <ul>
            {items().sort((a, b) => a.name.localeCompare(b.name)).map(t => (
              <li>{t.name}</li>
            ))}
          </ul>
        )
      }
    `

    const { errors } = compileToIR(source)
    const bf021 = errors.filter(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)

    expect(bf021).toHaveLength(1)
    expect(bf021[0].message).toContain('not a simple subtraction pattern')
  })

  test('@client suppresses BF021 for unsupported sort comparator', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function TodoList() {
        const [items, setItems] = createSignal<any[]>([])
        return (
          <ul>
            {/* @client */ items().sort((a, b) => a.name.localeCompare(b.name)).map(t => (
              <li>{t.name}</li>
            ))}
          </ul>
        )
      }
    `

    const { errors } = compileToIR(source)
    const bf021 = errors.filter(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)

    expect(bf021).toHaveLength(0)
  })

  test('emits BF021 error for block body sort comparator', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function TodoList() {
        const [items, setItems] = createSignal<any[]>([])
        return (
          <ul>
            {items().sort((a, b) => { return a.price - b.price }).map(t => (
              <li>{t.name}</li>
            ))}
          </ul>
        )
      }
    `

    const { errors } = compileToIR(source)
    const bf021 = errors.filter(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)

    expect(bf021).toHaveLength(1)
    expect(bf021[0].message).toContain('Block body sort comparators are not supported')
  })

  test('no BF021 error for supported sort comparator', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function TodoList() {
        const [items, setItems] = createSignal<any[]>([])
        return (
          <ul>
            {items().sort((a, b) => a.price - b.price).map(t => (
              <li>{t.name}</li>
            ))}
          </ul>
        )
      }
    `

    const { errors } = compileToIR(source)
    const bf021 = errors.filter(e => e.code === ErrorCodes.UNSUPPORTED_JSX_PATTERN)

    expect(bf021).toHaveLength(0)
  })
})
