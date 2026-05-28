import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('NativeSelect', () => {
  const result = renderToTest(source, 'native-select.tsx', 'NativeSelect')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is NativeSelect', () => {
    expect(result.componentName).toBe('NativeSelect')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders wrapper div with data-slot', () => {
    const wrapper = result.find({ tag: 'div' })
    expect(wrapper).not.toBeNull()
    expect(wrapper!.props['data-slot']).toBe('native-select-wrapper')
  })

  test('renders <select> with data-slot', () => {
    const select = result.find({ tag: 'select' })
    expect(select).not.toBeNull()
    expect(select!.props['data-slot']).toBe('native-select')
  })

  test('has resolved base CSS classes on select', () => {
    const select = result.find({ tag: 'select' })!
    expect(select.classes).toContain('rounded-md')
    expect(select.classes).toContain('border')
    expect(select.classes).toContain('appearance-none')
  })

  test('has chevron icon', () => {
    const icon = result.find({ componentName: 'ChevronDownIcon' })
    expect(icon).not.toBeNull()
    expect(icon!.props['data-slot']).toBe('native-select-icon')
    expect(icon!.props['className']).toContain('pointer-events-none')
  })

  // #1633: children must be placed explicitly inside the <select> so the
  // CSR path materializes the <option>s. A self-closing `<select {...props} />`
  // (children only forwarded via the rest spread) renders a childless select
  // in CSR. Guard against regressing back to the self-closing form.
  test('forwards children into <select>', () => {
    const select = result.find({ tag: 'select' })!
    const childrenSlot = select.children.find(
      (c) => c.type === 'expression' && c.text === 'children',
    )
    expect(childrenSlot).toBeDefined()
  })
})

describe('NativeSelectOption', () => {
  const result = renderToTest(source, 'native-select.tsx', 'NativeSelectOption')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as <option>', () => {
    const option = result.find({ tag: 'option' })
    expect(option).not.toBeNull()
    expect(option!.props['data-slot']).toBe('native-select-option')
  })

  // #1633: option label text arrives as children — must be placed explicitly.
  test('forwards children into <option>', () => {
    const option = result.find({ tag: 'option' })!
    const childrenSlot = option.children.find(
      (c) => c.type === 'expression' && c.text === 'children',
    )
    expect(childrenSlot).toBeDefined()
  })
})

describe('NativeSelectOptGroup', () => {
  const result = renderToTest(source, 'native-select.tsx', 'NativeSelectOptGroup')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as <optgroup>', () => {
    const optgroup = result.find({ tag: 'optgroup' })
    expect(optgroup).not.toBeNull()
    expect(optgroup!.props['data-slot']).toBe('native-select-optgroup')
  })

  // #1633: nested options arrive as children — must be placed explicitly.
  test('forwards children into <optgroup>', () => {
    const optgroup = result.find({ tag: 'optgroup' })!
    const childrenSlot = optgroup.children.find(
      (c) => c.type === 'expression' && c.text === 'children',
    )
    expect(childrenSlot).toBeDefined()
  })
})
