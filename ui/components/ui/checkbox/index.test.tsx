import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const checkboxSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Checkbox', () => {
  const result = renderToTest(checkboxSource, 'checkbox.tsx')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is Checkbox', () => {
    expect(result.componentName).toBe('Checkbox')
  })

  test('has signals: internalChecked, controlledChecked (createSignal)', () => {
    expect(result.signals).toContain('internalChecked')
    expect(result.signals).toContain('controlledChecked')
  })

  test('isControlled and isChecked are memos, not in signals', () => {
    // isControlled and isChecked are created via createMemo, not createSignal
    expect(result.memos).toContain('isControlled')
    expect(result.memos).toContain('isChecked')
    expect(result.signals).not.toContain('isControlled')
    expect(result.signals).not.toContain('isChecked')
  })

  test('renders as <button>', () => {
    const button = result.find({ tag: 'button' })
    expect(button).not.toBeNull()
  })

  test('has role=checkbox', () => {
    const button = result.find({ role: 'checkbox' })
    expect(button).not.toBeNull()
    expect(button!.tag).toBe('button')
  })

  test('has aria-checked attribute', () => {
    const button = result.find({ role: 'checkbox' })!
    expect(button.aria).toHaveProperty('checked')
  })

  test('has data-state attribute', () => {
    const button = result.find({ role: 'checkbox' })!
    expect(button.dataState).not.toBeNull()
  })

  test('has click event handler', () => {
    const button = result.find({ role: 'checkbox' })!
    expect(button.events).toContain('click')
  })

  test('contains conditional SVG child (checkmark)', () => {
    const svg = result.find({ tag: 'svg' })
    expect(svg).not.toBeNull()
  })

  test('toStructure() includes role and aria info', () => {
    const structure = result.toStructure()
    expect(structure).toContain('[role=checkbox]')
    expect(structure).toContain('[aria-checked]')
    expect(structure).toContain('(click)')
    expect(structure).toContain('svg')
    expect(structure).toContain('path')
  })
})
