import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const aspectRatioSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('AspectRatio', () => {
  const result = renderToTest(aspectRatioSource, 'aspect-ratio.tsx', 'AspectRatio')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is AspectRatio', () => {
    expect(result.componentName).toBe('AspectRatio')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as div with data-slot=aspect-ratio', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('aspect-ratio')
  })

  test('has resolved base CSS classes', () => {
    expect(result.root.classes).toContain('relative')
    expect(result.root.classes).toContain('w-full')
  })

  test('style includes aspect-ratio declaration', () => {
    const style = result.root.props['style']
    expect(typeof style).toBe('string')
    expect(style as string).toContain('aspect-ratio:')
    expect(style as string).toContain('position:relative')
  })
})
