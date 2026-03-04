import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'

describe('component as JSX root (#281)', () => {
  test('component with children as root produces IRComponent (no wrapper div)', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function MenuDemo() {
        const [open, setOpen] = createSignal(false)
        return (
          <DropdownMenu open={open()} onOpenChange={setOpen}>
            <DropdownMenuTrigger>
              <span>KK</span>
            </DropdownMenuTrigger>
          </DropdownMenu>
        )
      }
    `

    const ctx = analyzeComponent(source, 'MenuDemo.tsx')
    const ir = jsxToIR(ctx)

    // Root should be the component itself; the adapter handles scope
    // placement via isRootOfClientComponent / __instanceId
    expect(ir).not.toBeNull()
    expect(ir!.type).toBe('component')
    if (ir!.type === 'component') {
      expect(ir!.name).toBe('DropdownMenu')
    }
  })

  test('self-closing component as root produces IRComponent (no wrapper div)', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function IconButton() {
        const [active, setActive] = createSignal(false)
        return <ChevronIcon active={active()} />
      }
    `

    const ctx = analyzeComponent(source, 'IconButton.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    expect(ir!.type).toBe('component')
    if (ir!.type === 'component') {
      expect(ir!.name).toBe('ChevronIcon')
    }
  })

  test('fragment root with component child keeps component as-is', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function Layout() {
        const [theme, setTheme] = createSignal('light')
        return (
          <>
            <header>Header</header>
            <ThemeProvider theme={theme()} />
          </>
        )
      }
    `

    const ctx = analyzeComponent(source, 'Layout.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    expect(ir!.type).toBe('fragment')
    if (ir!.type === 'fragment') {
      // Fragment uses comment-based scope marker
      expect(ir!.needsScopeComment).toBe(true)

      // Element children do NOT get needsScope (scope is via comment)
      const header = ir!.children.find(c => c.type === 'element' && c.tag === 'header')
      expect(header).toBeDefined()
      if (header?.type === 'element') {
        expect(header.needsScope).toBe(false)
      }

      // Component child stays as IRComponent (no wrapper div)
      const provider = ir!.children.find(c => c.type === 'component')
      expect(provider).toBeDefined()
      if (provider?.type === 'component') {
        expect(provider.name).toBe('ThemeProvider')
      }
    }
  })

  test('non-root component is NOT affected', () => {
    const source = `
      'use client'

      export function App() {
        return (
          <div>
            <ChildComponent />
          </div>
        )
      }
    `

    const ctx = analyzeComponent(source, 'App.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    expect(ir!.type).toBe('element')
    if (ir!.type === 'element') {
      expect(ir!.tag).toBe('div')
      expect(ir!.needsScope).toBe(true)
      // Child should be a component directly
      expect(ir!.children).toHaveLength(1)
      expect(ir!.children[0].type).toBe('component')
    }
  })

  test('isRoot does not leak into component slot children', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function Demo() {
        const [open, setOpen] = createSignal(false)
        return (
          <Menu>
            <button>Toggle</button>
          </Menu>
        )
      }
    `

    const ctx = analyzeComponent(source, 'Demo.tsx')
    const ir = jsxToIR(ctx)

    // Root is the component itself
    expect(ir).not.toBeNull()
    expect(ir!.type).toBe('component')
    if (ir!.type === 'component') {
      expect(ir!.name).toBe('Menu')
      // The button inside the component's slot children must NOT have needsScope
      const button = ir!.children.find(c => c.type === 'element' && c.tag === 'button')
      expect(button).toBeDefined()
      if (button?.type === 'element') {
        expect(button.needsScope).toBe(false)
      }
    }
  })
})
