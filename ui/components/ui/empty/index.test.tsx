import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const emptySource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Empty', () => {
  const result = renderToTest(emptySource, 'empty.tsx', 'Empty')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is Empty', () => {
    expect(result.componentName).toBe('Empty')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as div with data-slot=empty', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('empty')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('rounded-lg')
    expect(result.root.classes).toContain('border-dashed')
  })
})

describe('EmptyHeader', () => {
  const result = renderToTest(emptySource, 'empty.tsx', 'EmptyHeader')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as div with data-slot=empty-header', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('empty-header')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('items-center')
  })
})

describe('EmptyMedia', () => {
  const result = renderToTest(emptySource, 'empty.tsx', 'EmptyMedia')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as div with data-slot=empty-icon', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('empty-icon')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('items-center')
  })
})

describe('EmptyTitle', () => {
  const result = renderToTest(emptySource, 'empty.tsx', 'EmptyTitle')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as div with data-slot=empty-title', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('empty-title')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('font-medium')
    expect(result.root.classes).toContain('tracking-tight')
  })
})

describe('EmptyDescription', () => {
  const result = renderToTest(emptySource, 'empty.tsx', 'EmptyDescription')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as div with data-slot=empty-description', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('empty-description')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('text-muted-foreground')
  })
})

describe('EmptyContent', () => {
  const result = renderToTest(emptySource, 'empty.tsx', 'EmptyContent')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as div with data-slot=empty-content', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('empty-content')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('text-sm')
  })
})
