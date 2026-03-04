import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('hydrate() template generation for signal-bearing components', () => {
  test('Counter (top-level only): NO CSR fallback template', () => {
    const source = `
      'use client'
      import { createSignal, createMemo } from '@barefootjs/dom'
      interface CounterProps { initial?: number }
      export function Counter(props: CounterProps) {
        const [count, setCount] = createSignal(props.initial ?? 0)
        const doubled = createMemo(() => count() * 2)
        return (
          <div className="counter-container">
            <p className="counter-value">{count()}</p>
            <p className="counter-doubled">doubled: {doubled()}</p>
            <button className="btn-increment" onClick={() => setCount(n => n + 1)}>+1</button>
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'Counter.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    const content = clientJs!.content

    // Top-level-only component: no CSR fallback template (saves bytes)
    expect(content).toContain("hydrate('Counter', { init: initCounter })")
    expect(content).not.toContain('template:')
  })

  test('ItemList (top-level only): NO CSR fallback template', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'
      export function ItemList(props: { items: string[] }) {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <span>{count()}</span>
            <ul>
              {props.items.map((item) => (
                <li>{item}</li>
              ))}
            </ul>
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'ItemList.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()

    // Top-level-only: no CSR fallback
    expect(clientJs!.content).toContain("hydrate('ItemList', { init: initItemList })")
    expect(clientJs!.content).not.toContain('template:')
  })

  test('child stateless component gets template, parent (top-level) skips CSR fallback', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      function Child(props: { value: number }) {
        return <span>{props.value}</span>
      }

      export function Parent() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <Child value={count()} />
            <button onClick={() => setCount(n => n + 1)}>+</button>
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'Parent.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    const content = clientJs!.content

    // Stateless Child gets a static template (always useful)
    expect(content).toContain("hydrate('Child', { init: initChild, template:")

    // Parent is NOT used as a child — no CSR fallback
    expect(content).toContain("hydrate('Parent', { init: initParent })")
    expect(content).not.toMatch(/hydrate\('Parent',.*template:/)
  })

  test('component used as child gets CSR fallback template', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function StatusBadge(props: { active: boolean }) {
        const [flash, setFlash] = createSignal(false)
        return (
          <span className={flash() ? 'flash' : ''} onClick={() => setFlash(v => !v)}>
            {props.active ? 'on' : 'off'}
          </span>
        )
      }

      export function Dashboard() {
        const [items, setItems] = createSignal([{ id: 1, active: true }])
        return (
          <div>
            {items().map(item => (
              <StatusBadge active={item.active} />
            ))}
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'Dashboard.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    const content = clientJs!.content

    // StatusBadge IS used as a child by Dashboard → gets CSR fallback template
    expect(content).toMatch(/hydrate\('StatusBadge',.*template:/)

    // Dashboard is NOT used as a child → no CSR fallback
    expect(content).not.toMatch(/hydrate\('Dashboard',.*template:/)
  })

  test('client-only expression (top-level only): NO CSR fallback template', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'
      export function Filtered() {
        const [items, setItems] = createSignal([{id: 1, done: false}])
        return (
          <ul>
            {/* @client */ items().filter(t => !t.done).map(t => (
              <li>{t.id}</li>
            ))}
          </ul>
        )
      }
    `
    const result = compileJSXSync(source, 'Filtered.tsx', { adapter })

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()

    // Top-level-only: no CSR fallback
    expect(clientJs!.content).toContain("hydrate('Filtered', { init: initFiltered })")
    expect(clientJs!.content).not.toContain('template:')
  })

  test('string literals in CSS classes are not corrupted by constant inlining', () => {
    // Use a parent+child scenario so the child (Icon) gets a CSR fallback template,
    // which exercises the transformExpr() string-literal protection path.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'
      type Size = 'sm' | 'md' | 'lg'
      const sizeClasses: Record<Size, string> = {
        sm: 'size-4',
        md: 'size-6',
        lg: 'size-8',
      }
      export function Icon(props: { size?: Size }) {
        const [active, setActive] = createSignal(false)
        const size = props.size ?? 'md'
        return (
          <svg className={sizeClasses[size]} onClick={() => setActive(v => !v)}>
            <circle />
          </svg>
        )
      }

      export function IconGallery() {
        return (
          <div>
            <Icon size="sm" />
            <Icon size="md" />
            <Icon size="lg" />
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'Icon.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    const content = clientJs!.content

    // Icon is used as a child → gets CSR fallback with template
    expect(content).toMatch(/hydrate\('Icon',.*template:/)

    // String literals 'size-4', 'size-6', 'size-8' must NOT be corrupted
    // by the constant `size` being inlined into them
    expect(content).toContain("'size-4'")
    expect(content).toContain("'size-6'")
    expect(content).toContain("'size-8'")
    // The word 'size' inside 'size-4' should not be replaced with the constant value
    expect(content).not.toMatch(/'\(props\.size/)
  })
})
