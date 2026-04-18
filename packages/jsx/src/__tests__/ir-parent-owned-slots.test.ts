import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('parent-owned slots (^ prefix)', () => {
  test('elements with events inside component children get ^-prefixed slotId in IR', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Parent() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <Child>
              <button onClick={() => setCount(c => c + 1)}>Inc</button>
            </Child>
          </div>
        )
      }
    `
    const ctx = analyzeComponent(source, 'Parent.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    // Find the component node
    const div = ir as any
    expect(div.type).toBe('element')

    // Find the Child component in children
    const child = div.children.find((c: any) => c.type === 'component')
    expect(child).toBeDefined()
    expect(child.name).toBe('Child')

    // The button inside Child should have ^-prefixed slotId
    const button = child.children.find((c: any) => c.type === 'element' && c.tag === 'button')
    expect(button).toBeDefined()
    expect(button.slotId).toMatch(/^\^s\d+$/)
    expect(button.events).toHaveLength(1)
    expect(button.events[0].name).toBe('click')
  })

  test('component own slotId does NOT get ^ prefix', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Parent() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <Child>
              <button onClick={() => setCount(c => c + 1)}>Inc</button>
            </Child>
          </div>
        )
      }
    `
    const ctx = analyzeComponent(source, 'Parent.tsx')
    const ir = jsxToIR(ctx)
    const div = ir as any
    const child = div.children.find((c: any) => c.type === 'component')

    // The component's own slotId should NOT have ^ prefix
    expect(child.slotId).toMatch(/^s\d+$/)
    expect(child.slotId).not.toContain('^')
  })

  test('generated client JS uses ^-prefixed ID in $() but clean variable name', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Parent() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <Child>
              <button onClick={() => setCount(c => c + 1)}>Inc</button>
            </Child>
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'Parent.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()

    // Should use $(__scope, '^sN') for the lookup (raw ID with ^)
    expect(clientJs!.content).toMatch(/\$\(__scope, .*'\^s\d+'/)
    // Should use _sN (without ^) for variable name in destructured form
    expect(clientJs!.content).toMatch(/const \[.*_s\d+.*\] = \$\(__scope, .*'\^s\d+'/)
  })

  test('reactive expressions inside component children get ^-prefixed slotId', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Parent() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <Child>
              <span>{count()}</span>
            </Child>
          </div>
        )
      }
    `
    const ctx = analyzeComponent(source, 'Parent.tsx')
    const ir = jsxToIR(ctx)
    const div = ir as any
    const child = div.children.find((c: any) => c.type === 'component')

    // The span with reactive content inside Child should have ^-prefixed slotId
    const span = child.children.find((c: any) => c.type === 'element' && c.tag === 'span')
    expect(span).toBeDefined()
    expect(span.slotId).toMatch(/^\^s\d+$/)
  })

  test('nested component slotId does NOT get ^ prefix when inside another component children', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Parent() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <Outer>
              <Inner>
                <button onClick={() => setCount(c => c + 1)}>Click</button>
              </Inner>
            </Outer>
          </div>
        )
      }
    `
    const ctx = analyzeComponent(source, 'Parent.tsx')
    const ir = jsxToIR(ctx)
    const div = ir as any

    const outer = div.children.find((c: any) => c.type === 'component' && c.name === 'Outer')
    expect(outer).toBeDefined()
    // Outer's own slotId should NOT have ^ prefix
    expect(outer.slotId).toMatch(/^s\d+$/)
    expect(outer.slotId).not.toContain('^')

    const inner = outer.children.find((c: any) => c.type === 'component' && c.name === 'Inner')
    expect(inner).toBeDefined()
    // Inner's own slotId should NOT have ^ prefix (this was the bug)
    expect(inner.slotId).toMatch(/^s\d+$/)
    expect(inner.slotId).not.toContain('^')

    // But the button (native element) inside Inner SHOULD have ^ prefix
    const button = inner.children.find((c: any) => c.type === 'element' && c.tag === 'button')
    expect(button).toBeDefined()
    expect(button.slotId).toMatch(/^\^s\d+$/)
  })

  test('self-closing component inside component children does NOT get ^ prefix', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function Parent() {
        const [open, setOpen] = createSignal(false)
        return (
          <div>
            <Outer>
              <SelfClosing />
            </Outer>
          </div>
        )
      }
    `
    const ctx = analyzeComponent(source, 'Parent.tsx')
    const ir = jsxToIR(ctx)
    const div = ir as any

    const outer = div.children.find((c: any) => c.type === 'component' && c.name === 'Outer')
    const selfClosing = outer.children.find((c: any) => c.type === 'component' && c.name === 'SelfClosing')
    expect(selfClosing).toBeDefined()
    // Self-closing component's slotId should NOT have ^ prefix
    expect(selfClosing.slotId).toMatch(/^s\d+$/)
    expect(selfClosing.slotId).not.toContain('^')
  })
})
