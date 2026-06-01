/**
 * `escapeAttr` runtime contract (#1692).
 *
 * Client-render templates concatenate dynamic attribute values into an
 * HTML string that is later inserted via `innerHTML`. Values containing
 * HTML metacharacters — e.g. UnoCSS arbitrary variants like
 * `[class*="size-"]` or `has-[>svg]` on shadcn-style components — must be
 * escaped at interpolation time so the assembled markup parses correctly
 * and is byte-identical to the SSR adapters' output (Hono escapes
 * `& " ' < >`). This pins that entity set and ordering.
 */
import { describe, test, expect } from 'bun:test'
import { escapeAttr } from '../../src/runtime/component'

describe('escapeAttr', () => {
  test('escapes the five HTML attribute metacharacters', () => {
    expect(escapeAttr('a&b<c>d"e\'f')).toBe('a&amp;b&lt;c&gt;d&quot;e&#39;f')
  })

  test('replaces & first so emitted entities are not double-escaped', () => {
    // If `<` were escaped before `&`, the `&` in `&lt;` would become
    // `&amp;lt;`. Correct output keeps a single entity.
    expect(escapeAttr('<')).toBe('&lt;')
    expect(escapeAttr('&lt;')).toBe('&amp;lt;')
  })

  test('matches the SSR-escaped form of a UnoCSS arbitrary-variant class', () => {
    expect(escapeAttr('[class*="size-"] has-[>svg]:px-4 [&_svg]:shrink-0')).toBe(
      '[class*=&quot;size-&quot;] has-[&gt;svg]:px-4 [&amp;_svg]:shrink-0',
    )
  })

  test('leaves metacharacter-free values untouched', () => {
    expect(escapeAttr('inline-flex items-center rounded-md')).toBe(
      'inline-flex items-center rounded-md',
    )
  })

  test('coerces non-string values via String()', () => {
    expect(escapeAttr(0)).toBe('0')
    expect(escapeAttr(undefined)).toBe('undefined')
    expect(escapeAttr(null)).toBe('null')
  })
})
