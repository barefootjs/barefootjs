/**
 * Unit tests for `tokenContainsIdent` — the lexer-aware
 * fallback for the call sites that operate on **synthesised** expression
 * strings with no originating AST node (post-substitution CSR templates,
 * post-chain-resolve constant values).
 *
 * AST-bearing call sites read `node.freeIdentifiers` instead — see #1267.
 *
 * These tests pin down the over-match classes that motivated #1267:
 * string literals, member-access tail names, comments, template literals.
 */

import { describe, test, expect } from 'bun:test'
import { tokenContainsIdent } from '../ir-to-client-js/utils'

describe('tokenContainsIdent', () => {
  describe('positive controls', () => {
    test('bare identifier match', () => {
      expect(tokenContainsIdent('className', 'className')).toBe(true)
    })

    test('identifier inside a function call argument', () => {
      expect(tokenContainsIdent('foo(className)', 'className')).toBe(true)
    })

    test('identifier inside a binary expression', () => {
      expect(tokenContainsIdent('x + className', 'className')).toBe(true)
    })

    test('identifier inside a bracket subscript is still a reference', () => {
      expect(tokenContainsIdent('a[className]', 'className')).toBe(true)
    })

    test('identifier inside template-literal expression substitution', () => {
      expect(tokenContainsIdent('`${className}`', 'className')).toBe(true)
    })

    test('identifier with non-target match nearby', () => {
      expect(tokenContainsIdent('className2 + className', 'className')).toBe(true)
    })
  })

  describe('string literal over-match (the #1267 motivation)', () => {
    test('single-quoted string literal', () => {
      expect(tokenContainsIdent("'className'", 'className')).toBe(false)
    })

    test('double-quoted string literal with hyphen', () => {
      expect(tokenContainsIdent('"prefix-className"', 'className')).toBe(false)
    })

    test('escaped quote inside string literal does not break scanning', () => {
      expect(tokenContainsIdent("'\\'className\\''", 'className')).toBe(false)
    })

    test('mixed: string literal then identifier reference', () => {
      expect(tokenContainsIdent("'className' + className", 'className')).toBe(true)
    })

    test('template literal text part (between backticks, outside ${})', () => {
      expect(tokenContainsIdent('`pre-className`', 'className')).toBe(false)
    })

    test('template literal with text-part match and expression hit', () => {
      expect(tokenContainsIdent('`label-${className}`', 'className')).toBe(true)
    })

    test('template literal with text-part match but no expression hit', () => {
      expect(tokenContainsIdent('`pre-${other}-className`', 'className')).toBe(false)
    })

    test('nested template literal inside template expression', () => {
      // Outer template literal expression contains another template literal
      // text part; the inner text part should not match.
      expect(tokenContainsIdent('`${`inner-className`}`', 'className')).toBe(false)
    })

    test('nested template literal where inner expr references the ident', () => {
      expect(tokenContainsIdent('`${`${className}`}`', 'className')).toBe(true)
    })
  })

  describe('member-access over-match', () => {
    test('property name on dot-access does not count', () => {
      expect(tokenContainsIdent('a.className', 'className')).toBe(false)
    })

    test('property name on dot-access via whitespace does not count', () => {
      expect(tokenContainsIdent('a . className', 'className')).toBe(false)
    })

    test('left-hand side of member access is still a reference', () => {
      expect(tokenContainsIdent('className.foo', 'className')).toBe(true)
    })

    test('chained member-access does not match middle names', () => {
      expect(tokenContainsIdent('a.b.className', 'className')).toBe(false)
    })

    test('optional chaining member-access tail does not count', () => {
      // `?.className` — preceding non-whitespace is `.`, so member-tail rule
      // skips this identifier.
      expect(tokenContainsIdent('a?.className', 'className')).toBe(false)
    })

    test('spread operator should not be confused with member access', () => {
      // `...className` — preceding non-whitespace is `.` of `...`, but the
      // char before that is also `.`, so this is the spread operator. The
      // identifier following `...` IS a reference, not a property tail.
      expect(tokenContainsIdent('foo(...className)', 'className')).toBe(true)
    })
  })

  describe('comment over-match', () => {
    test('line comment content', () => {
      expect(tokenContainsIdent('x // className', 'className')).toBe(false)
    })

    test('block comment content', () => {
      expect(tokenContainsIdent('/* className */ x', 'className')).toBe(false)
    })

    test('multi-line block comment', () => {
      expect(tokenContainsIdent('/*\n * className\n */ x', 'className')).toBe(false)
    })

    test('line comment then real reference on next line', () => {
      expect(tokenContainsIdent('x // not\nclassName', 'className')).toBe(true)
    })
  })

  // Regex literals were invisible to the previous hand-rolled char scanner:
  // a lone quote inside the regex flipped it into string state (swallowing
  // real references), and an identifier inside the regex body was counted as
  // a reference. The shared ts.createScanner-based lexer recognises regex
  // literals, so both cases are now correct (#1370).
  describe('regex literals', () => {
    test('reference after a regex literal containing an apostrophe', () => {
      expect(tokenContainsIdent("/it's/.test(className)", 'className')).toBe(true)
    })

    test('reference after a regex literal containing a quote', () => {
      expect(tokenContainsIdent('/a"b/.test(className)', 'className')).toBe(true)
    })

    test('identifier inside a regex body is not a reference', () => {
      expect(tokenContainsIdent('/className/.test(x)', 'className')).toBe(false)
    })

    test('regex with escaped slash does not leak into following code', () => {
      expect(tokenContainsIdent('/a\\/b/.test(className)', 'className')).toBe(true)
    })

    test('division is not mistaken for a regex literal', () => {
      expect(tokenContainsIdent('total / className', 'className')).toBe(true)
    })
  })

  describe('non-matches', () => {
    test('substring is not a match (word boundary)', () => {
      expect(tokenContainsIdent('myClassName', 'className')).toBe(false)
    })

    test('superstring is not a match', () => {
      expect(tokenContainsIdent('class', 'className')).toBe(false)
    })

    test('empty expression', () => {
      expect(tokenContainsIdent('', 'className')).toBe(false)
    })
  })
})

