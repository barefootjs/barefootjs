import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// Slider (stateful — internalValue, controlledValue, percentage signals)
// ---------------------------------------------------------------------------

describe('Slider', () => {
  const result = renderToTest(source, 'slider.tsx', 'Slider')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is Slider', () => {
    expect(result.componentName).toBe('Slider')
  })

  test('has signals: internalValue, controlledValue (createSignal)', () => {
    expect(result.signals).toContain('internalValue')
    expect(result.signals).toContain('controlledValue')
  })

  test('isControlled, currentValue, percentage are memos, not in signals', () => {
    // isControlled, currentValue, percentage are created via createMemo, not createSignal
    expect(result.memos).toContain('isControlled')
    expect(result.memos).toContain('currentValue')
    expect(result.memos).toContain('percentage')
    expect(result.signals).not.toContain('isControlled')
    expect(result.signals).not.toContain('currentValue')
    expect(result.signals).not.toContain('percentage')
  })

  test('root tag is div with data-slot=slider', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('slider')
  })

  test('root has pointerdown event handler', () => {
    expect(result.root.events).toContain('pointerdown')
  })

  test('contains span with role=slider', () => {
    const thumb = result.find({ role: 'slider' })
    expect(thumb).not.toBeNull()
  })

  test('slider thumb has data-slot=slider-thumb', () => {
    const thumb = result.find({ role: 'slider' })!
    expect(thumb.props['data-slot']).toBe('slider-thumb')
  })

  test('slider thumb has aria-valuemin', () => {
    const thumb = result.find({ role: 'slider' })!
    expect(thumb.aria).toHaveProperty('valuemin')
  })

  test('contains div with data-slot=slider-track', () => {
    const track = result.find({ tag: 'div' })
    expect(track).not.toBeNull()
    const sliderTrack = result.findAll({ tag: 'div' }).find(d => d.props['data-slot'] === 'slider-track')
    expect(sliderTrack).not.toBeNull()
  })

  test('contains div with data-slot=slider-range', () => {
    const sliderRange = result.findAll({ tag: 'div' }).find(d => d.props['data-slot'] === 'slider-range')
    expect(sliderRange).not.toBeNull()
  })

  test('toStructure() contains slider and aria-valuenow', () => {
    const structure = result.toStructure()
    expect(structure).toContain('slider')
    expect(structure).toContain('aria-valuenow')
  })
})
