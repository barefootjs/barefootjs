/**
 * BarefootJS Compiler - JSX Constant Inlining Tests (#547)
 *
 * When JSX is assigned to a variable (e.g., `const icon = <svg>...</svg>`),
 * it should be inlined at the IR level rather than emitted as raw JSX in client JS.
 */

import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('JSX constant inlining (#547)', () => {
  describe('analyzer', () => {
    test('sets isJsx flag on JSX variable declarations', () => {
      const source = `
        'use client'

        export function MyComponent() {
          const icon = <svg><path d="M0 0" /></svg>
          return <div>{icon}</div>
        }
      `

      const ctx = analyzeComponent(source, 'MyComponent.tsx')
      const iconConstant = ctx.localConstants.find(c => c.name === 'icon')

      expect(iconConstant).toBeDefined()
      expect(iconConstant!.isJsx).toBe(true)
    })

    test('stores JSX AST node in jsxConstants map', () => {
      const source = `
        'use client'

        export function MyComponent() {
          const icon = <svg><path d="M0 0" /></svg>
          return <div>{icon}</div>
        }
      `

      const ctx = analyzeComponent(source, 'MyComponent.tsx')

      expect(ctx.jsxConstants.has('icon')).toBe(true)
    })

    test('does not set isJsx for non-JSX constants', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function MyComponent() {
          const label = "hello"
          return <div>{label}</div>
        }
      `

      const ctx = analyzeComponent(source, 'MyComponent.tsx')
      const labelConstant = ctx.localConstants.find(c => c.name === 'label')

      expect(labelConstant).toBeDefined()
      expect(labelConstant!.isJsx).toBe(false)
    })

    test('detects JSX self-closing elements', () => {
      const source = `
        'use client'

        export function MyComponent() {
          const icon = <svg />
          return <div>{icon}</div>
        }
      `

      const ctx = analyzeComponent(source, 'MyComponent.tsx')
      const iconConstant = ctx.localConstants.find(c => c.name === 'icon')

      expect(iconConstant!.isJsx).toBe(true)
      expect(ctx.jsxConstants.has('icon')).toBe(true)
    })

    test('detects parenthesized JSX', () => {
      const source = `
        'use client'

        export function MyComponent() {
          const icon = (<svg><path d="M0 0" /></svg>)
          return <div>{icon}</div>
        }
      `

      const ctx = analyzeComponent(source, 'MyComponent.tsx')
      const iconConstant = ctx.localConstants.find(c => c.name === 'icon')

      expect(iconConstant!.isJsx).toBe(true)
    })

    test('does not flag ternary with JSX branches as isJsx', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function MyComponent() {
          const [active, setActive] = createSignal(false)
          const content = active() ? <span>On</span> : <span>Off</span>
          return <div>{content}</div>
        }
      `

      const ctx = analyzeComponent(source, 'MyComponent.tsx')
      const contentConstant = ctx.localConstants.find(c => c.name === 'content')

      expect(contentConstant).toBeDefined()
      expect(contentConstant!.isJsx).toBe(false)
    })
  })

  describe('IR transformation', () => {
    test('inlines JSX variable as IRElement instead of IRExpression', () => {
      const source = `
        'use client'

        export function MyComponent() {
          const icon = <svg className="w-4"><path d="M0 0" /></svg>
          return <div>{icon}</div>
        }
      `

      const ctx = analyzeComponent(source, 'MyComponent.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir!.type).toBe('element')
      if (ir!.type === 'element') {
        // The div should contain the inlined svg, not an expression node
        const svgChild = ir!.children.find(
          (c: any) => c.type === 'element' && c.tag === 'svg'
        )
        expect(svgChild).toBeDefined()

        // Should NOT have an expression node with raw JSX text
        const exprChild = ir!.children.find(
          (c: any) => c.type === 'expression' && c.expr === 'icon'
        )
        expect(exprChild).toBeUndefined()
      }
    })

    test('inlines JSX variable used multiple times', () => {
      const source = `
        'use client'

        export function MyComponent() {
          const dot = <span className="dot" />
          return <div>{dot}{dot}</div>
        }
      `

      const ctx = analyzeComponent(source, 'MyComponent.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      if (ir!.type === 'element') {
        const spanChildren = ir!.children.filter(
          (c: any) => c.type === 'element' && c.tag === 'span'
        )
        expect(spanChildren).toHaveLength(2)
      }
    })
  })

  describe('client JS output', () => {
    test('does not emit raw JSX variable declaration in client JS init function', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function MyComponent() {
          const [active, setActive] = createSignal(false)
          const icon = <svg className="w-4"><path d="M0 0" /></svg>
          return <button onClick={() => setActive(v => !v)}>{icon}</button>
        }
      `

      const result = compileJSXSync(source, 'MyComponent.tsx', { adapter })

      expect(result.errors).toHaveLength(0)

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()

      // The variable 'icon' should not be declared in client JS
      // (it would contain raw JSX like `const icon = <svg className=...>`)
      expect(clientJs!.content).not.toMatch(/\bconst icon\b/)
      expect(clientJs!.content).not.toMatch(/\blet icon\b/)
    })

    test('SVG icon in marked template is preserved', () => {
      const source = `
        'use client'

        export function MyComponent() {
          const icon = <svg className="w-4"><path d="M0 0" /></svg>
          return <div>{icon}</div>
        }
      `

      const result = compileJSXSync(source, 'MyComponent.tsx', { adapter })

      expect(result.errors).toHaveLength(0)

      const template = result.files.find(f => f.type === 'markedTemplate')
      expect(template).toBeDefined()
      // The inlined SVG should appear in the template output
      expect(template!.content).toContain('svg')
      expect(template!.content).toContain('path')
    })

    test('compiles Calendar-style pattern without errors', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function Calendar() {
          const [month, setMonth] = createSignal(0)
          const chevronLeft = <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          const chevronRight = <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
          return (
            <div>
              <button onClick={() => setMonth(m => m - 1)}>{chevronLeft}</button>
              <span>Month: {month()}</span>
              <button onClick={() => setMonth(m => m + 1)}>{chevronRight}</button>
            </div>
          )
        }
      `

      const result = compileJSXSync(source, 'Calendar.tsx', { adapter })

      expect(result.errors).toHaveLength(0)

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()
      // JSX variable declarations should not appear in client JS init function
      expect(clientJs!.content).not.toMatch(/\bconst chevronLeft\b/)
      expect(clientJs!.content).not.toMatch(/\bconst chevronRight\b/)
    })
  })
})
