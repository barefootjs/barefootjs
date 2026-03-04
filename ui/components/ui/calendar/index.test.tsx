import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const calendarSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Calendar', () => {
  const result = renderToTest(calendarSource, 'calendar.tsx')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is Calendar', () => {
    expect(result.componentName).toBe('Calendar')
  })

  test('has signals: currentYear, currentMonth, internalSelected, internalRange (createSignal)', () => {
    expect(result.signals).toContain('currentYear')
    expect(result.signals).toContain('currentMonth')
    expect(result.signals).toContain('internalSelected')
    expect(result.signals).toContain('internalRange')
  })

  test('memos are not in signals', () => {
    expect(result.memos).toContain('selectedDate')
    expect(result.memos).toContain('selectedRange')
    expect(result.memos).toContain('weeks0')
    expect(result.memos).toContain('monthLabel0')
    expect(result.memos).toContain('weekdays')
    expect(result.signals).not.toContain('selectedDate')
    expect(result.signals).not.toContain('selectedRange')
    expect(result.signals).not.toContain('weeks0')
    expect(result.signals).not.toContain('monthLabel0')
    expect(result.signals).not.toContain('weekdays')
  })

  test('renders as <div> root element', () => {
    const root = result.find({ tag: 'div' })
    expect(root).not.toBeNull()
  })

  test('root div has click event handler', () => {
    const root = result.find({ tag: 'div' })
    expect(root).not.toBeNull()
    expect(root!.events).toContain('click')
  })

  test('toStructure() includes inlined month grids', () => {
    const structure = result.toStructure()
    // #569: renderMonthGrid is inlined at IR level, verify both grids are present
    expect(structure).toContain('table.w-full.border-collapse [role=grid]')
    expect(structure).toContain('weeks0()')
    expect(structure).toContain('weeks1()')
  })
})
