import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'

describe('jsxToIR', () => {
  test('transforms simple element', () => {
    const source = `
      'use client'

      export function App() {
        return <div>Hello</div>
      }
    `

    const ctx = analyzeComponent(source, 'App.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    expect(ir?.type).toBe('element')
    if (ir?.type === 'element') {
      expect(ir.tag).toBe('div')
      expect(ir.children).toHaveLength(1)
      expect(ir.children[0].type).toBe('text')
    }
  })

  test('transforms element with event', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function Counter() {
        const [count, setCount] = createSignal(0)
        return <button onClick={() => setCount(n => n + 1)}>Click</button>
      }
    `

    const ctx = analyzeComponent(source, 'Counter.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    expect(ir?.type).toBe('element')
    if (ir?.type === 'element') {
      expect(ir.tag).toBe('button')
      expect(ir.events).toHaveLength(1)
      expect(ir.events[0].name).toBe('click')
    }
  })

  test('transforms dynamic expression', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function Counter() {
        const [count, setCount] = createSignal(0)
        return <div>{count()}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Counter.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    expect(ir?.type).toBe('element')
    if (ir?.type === 'element') {
      expect(ir.children).toHaveLength(1)
      expect(ir.children[0].type).toBe('expression')
      if (ir.children[0].type === 'expression') {
        expect(ir.children[0].reactive).toBe(true)
        expect(ir.children[0].slotId).not.toBeNull()
      }
    }
  })

  test('marks constant reference attributes as dynamic', () => {
    // Regression test for: JSX attribute values referencing constants should be
    // rendered as {expr} not "expr" string literals
    const source = `
      'use client'

      const paths = {
        'icon': 'M12 0L24 12',
      } as const

      export function Icon() {
        return <svg><path d={paths['icon']} /></svg>
      }
    `

    const ctx = analyzeComponent(source, 'Icon.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    expect(ir?.type).toBe('element')
    if (ir?.type === 'element') {
      // svg element
      expect(ir.tag).toBe('svg')
      expect(ir.children).toHaveLength(1)

      const pathElement = ir.children[0]
      expect(pathElement.type).toBe('element')
      if (pathElement.type === 'element') {
        expect(pathElement.tag).toBe('path')
        // The 'd' attribute should be marked as dynamic
        const dAttr = pathElement.attrs.find(a => a.name === 'd')
        expect(dAttr).toBeDefined()
        expect(dAttr?.value).toBe("paths['icon']")
        expect(dAttr?.dynamic).toBe(true)
      }
    }
  })
})
