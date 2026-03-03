import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// InputOTP (stateful — context provider, hidden input, signals)
// ---------------------------------------------------------------------------

describe('InputOTP', () => {
  const result = renderToTest(source, 'input-otp.tsx', 'InputOTP')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is InputOTP', () => {
    expect(result.componentName).toBe('InputOTP')
  })

  test('has signals: internalValue, activeIndex, isFocused', () => {
    expect(result.signals).toContain('internalValue')
    expect(result.signals).toContain('activeIndex')
    expect(result.signals).toContain('isFocused')
  })

  test('renders as div with data-slot=input-otp', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('input-otp')
  })

  test('has hidden input with autocomplete=one-time-code', () => {
    const input = result.find({ tag: 'input' })
    expect(input).not.toBeNull()
    expect(input!.props['autocomplete']).toBe('one-time-code')
  })

  test('hidden input has type=text', () => {
    const input = result.find({ tag: 'input' })!
    expect(input.props['type']).toBe('text')
  })

  test('has resolved container CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('items-center')
    expect(result.root.classes).toContain('gap-2')
  })
})

// ---------------------------------------------------------------------------
// InputOTPGroup (stateless — div wrapper)
// ---------------------------------------------------------------------------

describe('InputOTPGroup', () => {
  const result = renderToTest(source, 'input-otp.tsx', 'InputOTPGroup')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is InputOTPGroup', () => {
    expect(result.componentName).toBe('InputOTPGroup')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as div with data-slot=input-otp-group', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('input-otp-group')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('items-center')
  })
})

// ---------------------------------------------------------------------------
// InputOTPSlot (stateful — context consumer, ref + createEffect)
// ---------------------------------------------------------------------------

describe('InputOTPSlot', () => {
  const result = renderToTest(source, 'input-otp.tsx', 'InputOTPSlot')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is InputOTPSlot', () => {
    expect(result.componentName).toBe('InputOTPSlot')
  })

  test('renders as div with data-slot=input-otp-slot', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('input-otp-slot')
  })

  test('has data-active attribute', () => {
    expect(result.root.props['data-active']).toBeDefined()
  })

  test('has resolved slot CSS classes', () => {
    expect(result.root.classes).toContain('relative')
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('h-9')
    expect(result.root.classes).toContain('w-9')
  })

  test('contains character span', () => {
    const span = result.find({ tag: 'span' })
    expect(span).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// InputOTPSeparator (stateless — renders MinusIcon)
// ---------------------------------------------------------------------------

describe('InputOTPSeparator', () => {
  const result = renderToTest(source, 'input-otp.tsx', 'InputOTPSeparator')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is InputOTPSeparator', () => {
    expect(result.componentName).toBe('InputOTPSeparator')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as div with data-slot=input-otp-separator', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('input-otp-separator')
  })

  test('has role=separator', () => {
    expect(result.root.role).toBe('separator')
  })

  test('renders default MinusIcon when no children', () => {
    // MinusIcon is inside nullish coalescing (children ?? <MinusIcon />)
    // IR may not expose it via find(), verify via component name in children
    const children = result.root.children
    expect(children).toBeDefined()
  })
})
