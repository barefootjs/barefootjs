import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const badgeSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Badge', () => {
  const result = renderToTest(badgeSource, 'badge.tsx', 'Badge')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is Badge', () => {
    expect(result.componentName).toBe('Badge')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('root is conditional (asChild branch)', () => {
    expect(result.root.type).toBe('conditional')
  })

  test('contains a span with data-slot=badge', () => {
    const span = result.find({ tag: 'span' })
    expect(span).not.toBeNull()
    expect(span!.props['data-slot']).toBe('badge')
  })

  test('has resolved base CSS classes', () => {
    const span = result.find({ tag: 'span' })!
    expect(span.classes).toContain('inline-flex')
    expect(span.classes).toContain('items-center')
    expect(span.classes).toContain('rounded-xl')
  })

  test('contains Slot component for asChild', () => {
    const slot = result.find({ componentName: 'Slot' })
    expect(slot).not.toBeNull()
  })
})
