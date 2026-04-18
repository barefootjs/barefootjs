/**
 * Signal/Memo Getter Not Called Error Tests
 *
 * Tests for BF044: Emit compile error when a signal or memo getter
 * is passed without calling it (e.g., value={count} instead of value={count()}).
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

describe('Signal Getter Not Called (BF044)', () => {
  describe('positive cases — should emit BF044', () => {
    test('signal getter as attribute value', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <div value={count} />
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(1)
      expect(bf044[0].severity).toBe('error')
      expect(bf044[0].message).toContain("'count'")
    })

    test('signal getter in JSX children', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <div>{count}</div>
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(1)
      expect(bf044[0].message).toContain("'count'")
    })

    test('memo as attribute value', () => {
      const source = `
        'use client'
        import { createSignal, createMemo } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          const doubled = createMemo(() => count() * 2)
          return <div value={doubled} />
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(1)
      expect(bf044[0].message).toContain("'doubled'")
    })

    test('memo in JSX children', () => {
      const source = `
        'use client'
        import { createSignal, createMemo } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          const doubled = createMemo(() => count() * 2)
          return <div>{doubled}</div>
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(1)
      expect(bf044[0].message).toContain("'doubled'")
    })

    test('error suggestion includes corrected call syntax', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <div value={count} />
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.find(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toBeDefined()
      expect(bf044!.suggestion).toBeDefined()
      expect(bf044!.suggestion!.message).toContain('count()')
      expect(bf044!.suggestion!.replacement).toBe('count()')
    })
  })

  describe('negative cases — should NOT emit BF044', () => {
    test('correct signal call: value={count()}', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <div value={count()} />
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(0)
    })

    test('correct memo call: value={doubled()}', () => {
      const source = `
        'use client'
        import { createSignal, createMemo } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          const doubled = createMemo(() => count() * 2)
          return <div value={doubled()} />
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(0)
    })

    test('non-signal identifier: value={someLocal}', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          const someLocal = "hello"
          return <div value={someLocal} />
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(0)
    })

    test('props access: value={props.checked}', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/client'

        export function Counter(props: { checked: boolean }) {
          const [count, setCount] = createSignal(0)
          return <div value={props.checked} />
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(0)
    })

    test('complex expression: value={count() + 1}', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <div value={count() + 1} />
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(0)
    })

    test('setter passed to event handler: onChange={setCount}', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <button onClick={setCount}>{count()}</button>
        }
      `

      const { errors } = compileToIR(source)
      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(0)
    })
  })

  describe('integration', () => {
    test('IR is still produced despite BF044 error', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <div value={count} />
        }
      `

      const { ir, errors } = compileToIR(source)

      const bf044 = errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)
      expect(bf044).toHaveLength(1)

      expect(ir).not.toBeNull()
      expect(ir!.type).toBe('element')
    })

    test('compileJSXSync includes BF044 in result errors', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/client'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <div value={count} />
        }
      `

      const result = compileJSXSync(source, 'Counter.tsx', { adapter })
      const bf044 = result.errors.filter(e => e.code === ErrorCodes.SIGNAL_GETTER_NOT_CALLED)

      expect(bf044).toHaveLength(1)
      expect(bf044[0].severity).toBe('error')
    })
  })
})
