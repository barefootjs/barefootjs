/**
 * Unit tests for the AST-based props-object rename
 * (`ir-to-client-js/rewrite-props-object.ts`).
 *
 * Documents the AST-correct exclusions that the pre-C2 regex hack
 * (`\\b<propsObjectName>\\b`) silently broke. Today's corpus happens to
 * not collide with these forms, but new emission shapes downstream
 * could trip the regex form — these tests pin the AST behaviour.
 */

import { describe, test, expect } from 'bun:test'
import { rewritePropsObjectRef } from '../ir-to-client-js/rewrite-props-object'

describe('rewritePropsObjectRef', () => {
  test('rewrites `props.x` value-position reads to `_p.x`', () => {
    const out = rewritePropsObjectRef('const name = props.name', 'props')
    expect(out).toBe('const name = _p.name')
  })

  test('rewrites multiple references in one line', () => {
    const out = rewritePropsObjectRef('const x = props.a + props.b', 'props')
    expect(out).toBe('const x = _p.a + _p.b')
  })

  test('does NOT rewrite object literal keys (regex hack regression guard)', () => {
    // `{ props: x }` — the `props` here is a key, not a value reference.
    // The legacy regex `\\b<name>\\b` would have rewritten this; the AST
    // walker correctly skips it.
    const out = rewritePropsObjectRef('const obj = { props: 1 }', 'props')
    expect(out).toBe('const obj = { props: 1 }')
  })

  test('does NOT rewrite property access names', () => {
    // `obj.props` — `props` is a property name, not a receiver.
    const out = rewritePropsObjectRef('const x = obj.props', 'props')
    expect(out).toBe('const x = obj.props')
  })

  test('does NOT rewrite shorthand property keys', () => {
    // `{ props }` is shorthand for `{ props: props }`. The key slot must
    // stay; in well-formed init body the value slot would be a separate
    // identifier (and we wouldn't see this pattern), but the test pins
    // the safe behaviour.
    const out = rewritePropsObjectRef('const obj = { props }', 'props')
    expect(out).toBe('const obj = { props }')
  })

  test('does NOT touch occurrences inside string literals', () => {
    const out = rewritePropsObjectRef('const s = "props.name"', 'props')
    expect(out).toBe('const s = "props.name"')
  })

  test('does NOT touch occurrences inside line comments', () => {
    const out = rewritePropsObjectRef('// reads props.name later\nconst x = 1', 'props')
    expect(out).toBe('// reads props.name later\nconst x = 1')
  })

  test('handles user-supplied object names (e.g. `p`)', () => {
    const out = rewritePropsObjectRef('const name = p.name', 'p')
    expect(out).toBe('const name = _p.name')
  })

  test('no-op when propsObjectName is null (destructured-props mode)', () => {
    const code = 'const x = props.name'
    const out = rewritePropsObjectRef(code, null)
    // null → defaults to 'props'; rewritten.
    expect(out).toBe('const x = _p.name')
  })

  test('no-op when propsObjectName equals _p', () => {
    const code = 'const x = _p.name'
    const out = rewritePropsObjectRef(code, '_p')
    expect(out).toBe(code)
  })

  test('rewrites inside template literals', () => {
    const out = rewritePropsObjectRef('const s = `name=${props.name}`', 'props')
    expect(out).toBe('const s = `name=${_p.name}`')
  })

  test('does NOT rewrite identifiers that share a substring', () => {
    // `propsX` is a different identifier; must not be partially matched.
    const out = rewritePropsObjectRef('const x = propsX.name', 'props')
    expect(out).toBe('const x = propsX.name')
  })
})
