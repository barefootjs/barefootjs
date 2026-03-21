import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Field', () => {
  const result = renderToTest(source, 'field.tsx', 'Field')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is Field', () => {
    expect(result.componentName).toBe('Field')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as <div>', () => {
    expect(result.root.tag).toBe('div')
  })

  test('has data-slot=field', () => {
    expect(result.root.props['data-slot']).toBe('field')
  })

  test('has role=group', () => {
    const el = result.find({ role: 'group' })
    expect(el).not.toBeNull()
    expect(el!.tag).toBe('div')
  })

  test('has data-orientation attribute', () => {
    expect(result.root.props['data-orientation']).not.toBeUndefined()
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('w-full')
    expect(result.root.classes).toContain('gap-3')
  })
})

describe('FieldSet', () => {
  const result = renderToTest(source, 'field.tsx', 'FieldSet')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as <fieldset>', () => {
    expect(result.root.tag).toBe('fieldset')
  })

  test('has data-slot=field-set', () => {
    expect(result.root.props['data-slot']).toBe('field-set')
  })
})

describe('FieldLegend', () => {
  const result = renderToTest(source, 'field.tsx', 'FieldLegend')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as <legend>', () => {
    expect(result.root.tag).toBe('legend')
  })

  test('has data-slot=field-legend', () => {
    expect(result.root.props['data-slot']).toBe('field-legend')
  })

  test('has data-variant attribute', () => {
    expect(result.root.props['data-variant']).not.toBeUndefined()
  })
})

describe('FieldGroup', () => {
  const result = renderToTest(source, 'field.tsx', 'FieldGroup')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as <div>', () => {
    expect(result.root.tag).toBe('div')
  })

  test('has data-slot=field-group', () => {
    expect(result.root.props['data-slot']).toBe('field-group')
  })
})

describe('FieldContent', () => {
  const result = renderToTest(source, 'field.tsx', 'FieldContent')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as <div>', () => {
    expect(result.root.tag).toBe('div')
  })

  test('has data-slot=field-content', () => {
    expect(result.root.props['data-slot']).toBe('field-content')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('flex-col')
    expect(result.root.classes).toContain('gap-1.5')
  })
})

describe('FieldLabel', () => {
  const result = renderToTest(source, 'field.tsx', 'FieldLabel')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as <label>', () => {
    expect(result.root.tag).toBe('label')
  })

  test('has data-slot=field-label', () => {
    expect(result.root.props['data-slot']).toBe('field-label')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('text-sm')
    expect(result.root.classes).toContain('font-medium')
  })
})

describe('FieldDescription', () => {
  const result = renderToTest(source, 'field.tsx', 'FieldDescription')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as <p>', () => {
    expect(result.root.tag).toBe('p')
  })

  test('has data-slot=field-description', () => {
    expect(result.root.props['data-slot']).toBe('field-description')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('text-sm')
    expect(result.root.classes).toContain('text-muted-foreground')
  })
})

describe('FieldError', () => {
  const result = renderToTest(source, 'field.tsx', 'FieldError')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as <div>', () => {
    expect(result.root.tag).toBe('div')
  })

  test('has data-slot=field-error', () => {
    expect(result.root.props['data-slot']).toBe('field-error')
  })

  test('has role=alert', () => {
    const el = result.find({ role: 'alert' })
    expect(el).not.toBeNull()
    expect(el!.tag).toBe('div')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('text-destructive')
  })
})
