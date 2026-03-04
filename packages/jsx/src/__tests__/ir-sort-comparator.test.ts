import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'

describe('sort().map() / toSorted().map()', () => {
  test('sort((a, b) => a.price - b.price).map() produces sortComparator (asc)', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function ProductList() {
        const [products, setProducts] = createSignal<any[]>([])
        return (
          <ul>
            {products().sort((a, b) => a.price - b.price).map(p => (
              <li>{p.name}</li>
            ))}
          </ul>
        )
      }
    `

    const ctx = analyzeComponent(source, 'ProductList.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    const ul = ir!
    expect(ul.type).toBe('element')
    if (ul.type === 'element') {
      const loop = ul.children.find(c => c.type === 'loop')
      expect(loop).toBeDefined()
      if (loop?.type === 'loop') {
        expect(loop.sortComparator).toBeDefined()
        expect(loop.sortComparator!.field).toBe('price')
        expect(loop.sortComparator!.direction).toBe('asc')
        expect(loop.sortComparator!.method).toBe('sort')
        expect(loop.sortComparator!.paramA).toBe('a')
        expect(loop.sortComparator!.paramB).toBe('b')
        expect(loop.array).toBe('products()')
      }
    }
  })

  test('toSorted((a, b) => b.price - a.price).map() produces sortComparator (desc)', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function ProductList() {
        const [products, setProducts] = createSignal<any[]>([])
        return (
          <ul>
            {products().toSorted((a, b) => b.price - a.price).map(p => (
              <li>{p.name}</li>
            ))}
          </ul>
        )
      }
    `

    const ctx = analyzeComponent(source, 'ProductList.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    const ul = ir!
    if (ul.type === 'element') {
      const loop = ul.children.find(c => c.type === 'loop')
      expect(loop).toBeDefined()
      if (loop?.type === 'loop') {
        expect(loop.sortComparator).toBeDefined()
        expect(loop.sortComparator!.field).toBe('price')
        expect(loop.sortComparator!.direction).toBe('desc')
        expect(loop.sortComparator!.method).toBe('toSorted')
      }
    }
  })

  test('filter().sort().map() produces both filterPredicate and sortComparator', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function TodoList() {
        const [todos, setTodos] = createSignal<any[]>([])
        return (
          <ul>
            {todos().filter(t => !t.done).sort((a, b) => a.priority - b.priority).map(t => (
              <li>{t.text}</li>
            ))}
          </ul>
        )
      }
    `

    const ctx = analyzeComponent(source, 'TodoList.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    if (ir!.type === 'element') {
      const loop = ir!.children.find(c => c.type === 'loop')
      expect(loop).toBeDefined()
      if (loop?.type === 'loop') {
        expect(loop.filterPredicate).toBeDefined()
        expect(loop.filterPredicate!.param).toBe('t')
        expect(loop.sortComparator).toBeDefined()
        expect(loop.sortComparator!.field).toBe('priority')
        expect(loop.sortComparator!.direction).toBe('asc')
        expect(loop.chainOrder).toBe('filter-sort')
        expect(loop.array).toBe('todos()')
      }
    }
  })

  test('sort().filter().map() produces both with correct chainOrder', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function TodoList() {
        const [todos, setTodos] = createSignal<any[]>([])
        return (
          <ul>
            {todos().sort((a, b) => a.priority - b.priority).filter(t => !t.done).map(t => (
              <li>{t.text}</li>
            ))}
          </ul>
        )
      }
    `

    const ctx = analyzeComponent(source, 'TodoList.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    if (ir!.type === 'element') {
      const loop = ir!.children.find(c => c.type === 'loop')
      expect(loop).toBeDefined()
      if (loop?.type === 'loop') {
        expect(loop.filterPredicate).toBeDefined()
        expect(loop.sortComparator).toBeDefined()
        expect(loop.chainOrder).toBe('sort-filter')
        expect(loop.array).toBe('todos()')
      }
    }
  })

  test('complex sort comparator with @client keeps sort in array', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

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

    const ctx = analyzeComponent(source, 'TodoList.tsx')
    const ir = jsxToIR(ctx)

    expect(ir).not.toBeNull()
    if (ir!.type === 'element') {
      const loop = ir!.children.find(c => c.type === 'loop')
      expect(loop).toBeDefined()
      if (loop?.type === 'loop') {
        // @client: sort kept in array string, no sortComparator extracted
        expect(loop.sortComparator).toBeUndefined()
        expect(loop.clientOnly).toBe(true)
        expect(loop.array).toContain('sort')
      }
    }
  })
})
