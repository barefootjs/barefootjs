/**
 * `__bfSlot` branch-template slot helper (#1213, #1694 follow-up).
 *
 * `__bfSlot` interpolates Child-position expressions inside conditional
 * `template()` arrows. Two output paths must coexist:
 *   - live `Node` values are stashed and replaced by a raw
 *     `<!--bf-slot:N-->` marker that `insert()` splices back by identity;
 *   - plain string/number values are emitted inline and (since #1694)
 *     HTML-escaped so branch text matches the SSR-rendered bytes and can't
 *     break out as markup under `innerHTML`.
 *
 * The escape must NOT touch the marker path — escaping `<!--bf-slot:0-->`
 * to `&lt;!--bf-slot:0--&gt;` would make `insert()` miss it and drop the
 * slotted node (the regression that broke `e2e-site-ui` when the text
 * escape was applied around the whole `__bfSlot(...)` call).
 */
import { describe, test, expect, beforeAll } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { __bfSlot } from '../../src/runtime/branch-slot'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

describe('__bfSlot', () => {
  test('HTML-escapes plain string values (branch text)', () => {
    const slots: Node[] = []
    expect(__bfSlot('a<b>c & "d" \'e\'', slots)).toBe(
      'a&lt;b&gt;c &amp; &quot;d&quot; &#39;e&#39;',
    )
    expect(slots).toHaveLength(0)
  })

  test('leaves a live Node as a raw, UN-escaped marker', () => {
    const slots: Node[] = []
    const el = document.createElement('div')
    const out = __bfSlot(el, slots)
    expect(out).toBe('<!--bf-slot:0-->')
    // The marker must stay raw so insert() can find it.
    expect(out).not.toContain('&lt;')
    expect(slots).toEqual([el])
  })

  test('mixes escaped strings and raw markers in an array', () => {
    const slots: Node[] = []
    const el = document.createElement('span')
    const out = __bfSlot(['x & y', el, '<z>'], slots)
    expect(out).toBe('x &amp; y<!--bf-slot:0-->&lt;z&gt;')
    expect(slots).toEqual([el])
  })

  test('renders nullish / boolean as empty string', () => {
    const slots: Node[] = []
    expect(__bfSlot(null, slots)).toBe('')
    expect(__bfSlot(undefined, slots)).toBe('')
    expect(__bfSlot(false, slots)).toBe('')
    expect(__bfSlot(true, slots)).toBe('')
    expect(slots).toHaveLength(0)
  })

  test('coerces non-string primitives (no metacharacters → unchanged)', () => {
    const slots: Node[] = []
    expect(__bfSlot(0, slots)).toBe('0')
    expect(__bfSlot(42, slots)).toBe('42')
  })
})
