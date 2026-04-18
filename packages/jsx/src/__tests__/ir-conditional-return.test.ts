import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('conditional JSX returns (if-statement)', () => {
  test('collects event handlers from both branches of conditional return', () => {
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

    const result = compileJSXSync(source, 'Toggle.tsx', { adapter })

    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    expect(clientJs?.content).toContain('initToggle')
    // Both branches should have click handlers collected
    expect(clientJs?.content).toContain("addEventListener('click'")
  })

  test('collects reactive attributes from conditional return branches', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Disclosure(props: { asChild?: boolean }) {
        const [open, setOpen] = createSignal(false)

        if (props.asChild) {
          return <div aria-expanded={open()} onClick={() => setOpen(!open())}>child</div>
        }

        return <button aria-expanded={open()} onClick={() => setOpen(!open())}>toggle</button>
      }
    `

    const result = compileJSXSync(source, 'Disclosure.tsx', { adapter })

    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    // Reactive attribute should generate createEffect for aria-expanded
    expect(clientJs?.content).toContain('createEffect')
    expect(clientJs?.content).toContain('aria-expanded')
  })

  test('collects child component inits from conditional return branches', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Wrapper(props: { variant?: string }) {
        const [active, setActive] = createSignal(false)

        if (props.variant === 'fancy') {
          return <div><Child onToggle={() => setActive(!active())} /></div>
        }

        return <div><Child onToggle={() => setActive(!active())} /></div>
      }
    `

    const result = compileJSXSync(source, 'Wrapper.tsx', { adapter })

    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    // Child component initialization should be collected
    expect(clientJs?.content).toContain('initChild')
  })
})
