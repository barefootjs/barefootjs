/**
 * BarefootJS Compiler - JSX Props Tests (#559)
 *
 * When a "use client" component passes JSX elements as named props
 * to a stateless component, the compiler should transform them into
 * IR nodes (jsxChildren) instead of raw JSX text.
 */

import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'
import type { IRComponent, IRElement } from '../types'

const adapter = new TestAdapter()

/** Helper: find first component node in IR tree */
function findComponent(node: any, name?: string): IRComponent | undefined {
  if (node.type === 'component' && (!name || node.name === name)) return node
  const children = node.children || []
  for (const child of children) {
    const found = findComponent(child, name)
    if (found) return found
  }
  return undefined
}

describe('JSX props (#559)', () => {
  describe('Phase 1: JSX → IR', () => {
    test('JSX element prop produces jsxChildren in IR', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return (
            <Layout controls={<input type="text" />} />
          )
        }
      `
      const ctx = analyzeComponent(source, 'App.tsx')
      const ir = jsxToIR(ctx)
      expect(ir).not.toBeNull()

      const layout = findComponent(ir!, 'Layout')
      expect(layout).toBeDefined()

      const controlsProp = layout!.props.find(p => p.name === 'controls')
      expect(controlsProp).toBeDefined()
      expect(controlsProp!.jsxChildren).toBeDefined()
      expect(controlsProp!.jsxChildren).toHaveLength(1)
      expect(controlsProp!.jsxChildren![0].type).toBe('element')
      expect((controlsProp!.jsxChildren![0] as IRElement).tag).toBe('input')
    })

    test('parenthesized JSX prop produces jsxChildren', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return (
            <Layout controls={(<div><span>hello</span></div>)} />
          )
        }
      `
      const ctx = analyzeComponent(source, 'App.tsx')
      const ir = jsxToIR(ctx)

      const layout = findComponent(ir!, 'Layout')
      const controlsProp = layout!.props.find(p => p.name === 'controls')
      expect(controlsProp!.jsxChildren).toBeDefined()
      expect(controlsProp!.jsxChildren).toHaveLength(1)
      expect(controlsProp!.jsxChildren![0].type).toBe('element')
      expect((controlsProp!.jsxChildren![0] as IRElement).tag).toBe('div')
    })

    test('elements inside JSX props get ^-prefixed slot IDs', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return (
            <Layout controls={
              <button onClick={() => setVal('clicked')}>Click</button>
            } />
          )
        }
      `
      const ctx = analyzeComponent(source, 'App.tsx')
      const ir = jsxToIR(ctx)

      const layout = findComponent(ir!, 'Layout')
      const controlsProp = layout!.props.find(p => p.name === 'controls')
      const button = controlsProp!.jsxChildren![0] as IRElement
      expect(button.tag).toBe('button')
      // Elements in JSX props are parent-owned, so get ^ prefix
      expect(button.slotId).toMatch(/^\^s\d+$/)
      expect(button.events).toHaveLength(1)
      expect(button.events[0].name).toBe('click')
    })

    test('mixed JSX and non-JSX props on same component', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return (
            <Layout
              title="Hello"
              controls={<input type="text" />}
              count={42}
            />
          )
        }
      `
      const ctx = analyzeComponent(source, 'App.tsx')
      const ir = jsxToIR(ctx)

      const layout = findComponent(ir!, 'Layout')
      expect(layout!.props).toHaveLength(3)

      const titleProp = layout!.props.find(p => p.name === 'title')
      expect(titleProp!.jsxChildren).toBeUndefined()
      expect(titleProp!.value).toBe('Hello')

      const controlsProp = layout!.props.find(p => p.name === 'controls')
      expect(controlsProp!.jsxChildren).toBeDefined()

      const countProp = layout!.props.find(p => p.name === 'count')
      expect(countProp!.jsxChildren).toBeUndefined()
      expect(countProp!.value).toBe('42')
    })
  })

  describe('Phase 2: Client JS generation', () => {
    test('events inside JSX props are collected in parent client JS', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return (
            <Layout controls={
              <button onClick={() => setVal('clicked')}>Click</button>
            }>
              <p>Content</p>
            </Layout>
          )
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      expect(result.errors).toHaveLength(0)

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()
      // The client JS should contain event binding for the button
      expect(clientJs!.content).toContain('addEventListener')
      expect(clientJs!.content).toContain('click')
    })

    test('reactive expressions inside JSX props generate proper effects', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [count, setCount] = createSignal(0)
          return (
            <Layout
              controls={<span>{count()}</span>}
            />
          )
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      expect(result.errors).toHaveLength(0)

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()
      // Should have createEffect for reactive text inside JSX prop
      expect(clientJs!.content).toContain('createEffect')
    })

    test('does not generate setAttribute for JSX prop values', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return (
            <Layout controls={<input type="text" />} />
          )
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      expect(result.errors).toHaveLength(0)

      const clientJs = result.files.find(f => f.type === 'clientJs')
      // Should NOT have setAttribute for the JSX prop —
      // JSX props are passed via createComponent, not setAttribute
      if (clientJs) {
        expect(clientJs.content).not.toContain('setAttribute')
      }
    })

    test('component references in JSX props are imported in client JS (with BF045)', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return (
            <Layout controls={<Button label="ok" />} />
          )
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      // BF045: component inside JSX prop
      const bf045Errors = result.errors.filter(e => e.code === 'BF045')
      expect(bf045Errors).toHaveLength(1)

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()
      // Should import Button component referenced inside JSX prop
      // (compilation continues despite BF045 — it's a diagnostic, not a hard stop)
      expect(clientJs!.content).toContain('@bf-child:Button')
    })

    test('client JS does not contain raw JSX syntax', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return (
            <Layout
              controls={<select onChange={(e) => setVal(e.target.value)}>
                <option value="a">A</option>
                <option value="b">B</option>
              </select>}
            />
          )
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      expect(result.errors).toHaveLength(0)

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()
      // Raw JSX with event handlers should NOT appear — handlers are extracted
      // HTML element tags DO appear in template literals (valid JS), which is correct
      expect(clientJs!.content).not.toMatch(/onChange=\{/)
      // Event handler should be extracted into addEventListener
      expect(clientJs!.content).toContain('addEventListener')
      expect(clientJs!.content).toContain('change')
    })
  })

  describe('BF045: component in JSX prop (#570)', () => {
    test('component in JSX prop emits BF045', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return <Layout controls={<Button label="ok" />} />
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      const bf045 = result.errors.filter(e => e.code === 'BF045')
      expect(bf045).toHaveLength(1)
      expect(bf045[0].message).toContain("'controls'")
      expect(bf045[0].message).toContain("'Layout'")
    })

    test('multiple components in JSX props emit BF045 for each', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return <Layout controls={<Select />} extra={<Button />} />
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      const bf045 = result.errors.filter(e => e.code === 'BF045')
      expect(bf045).toHaveLength(2)
    })

    test('reactive expression only (no component) does not emit BF045', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [count, setCount] = createSignal(0)
          return <Layout controls={<span>{count()}</span>} />
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      const bf045 = result.errors.filter(e => e.code === 'BF045')
      expect(bf045).toHaveLength(0)
    })

    test('event handler only (no component) does not emit BF045', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return <Layout controls={<button onClick={() => setVal('x')}>Go</button>} />
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      const bf045 = result.errors.filter(e => e.code === 'BF045')
      expect(bf045).toHaveLength(0)
    })

    test('static JSX only (no component) does not emit BF045', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return <Layout controls={<input type="text" />} />
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      const bf045 = result.errors.filter(e => e.code === 'BF045')
      expect(bf045).toHaveLength(0)
    })

    test('nested component inside element emits BF045', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function App() {
          const [val, setVal] = createSignal('')
          return <Layout controls={<div><Button /></div>} />
        }
      `
      const result = compileJSXSync(source, 'App.tsx', { adapter })
      const bf045 = result.errors.filter(e => e.code === 'BF045')
      expect(bf045).toHaveLength(1)
    })
  })
})
