/**
 * Tests for #1311: `internalInvariant` separates AST-shape contract
 * violations (upstream tooling produced a node that shouldn't exist) from
 * user-facing BF0xx diagnostics. Throwing surfaces a stack at the broken
 * caller rather than dressing up the failure as a per-source error.
 */

import { describe, test, expect } from 'bun:test'
import {
  InternalInvariantError,
  internalInvariant,
} from '../errors'

describe('internalInvariant (#1311)', () => {
  test('passes through when condition is truthy', () => {
    expect(() => internalInvariant(true, 'should not throw')).not.toThrow()
    expect(() => internalInvariant(1, 'should not throw')).not.toThrow()
    expect(() => internalInvariant({}, 'should not throw')).not.toThrow()
  })

  test('throws InternalInvariantError when condition is falsy', () => {
    expect(() => internalInvariant(false, 'rest token must be last')).toThrow(
      InternalInvariantError,
    )
    expect(() => internalInvariant(0, 'rest token must be last')).toThrow(
      InternalInvariantError,
    )
    expect(() => internalInvariant(null, 'rest token must be last')).toThrow(
      InternalInvariantError,
    )
    expect(() =>
      internalInvariant(undefined, 'rest token must be last'),
    ).toThrow(InternalInvariantError)
  })

  test('error message is prefixed so producers can recognize it', () => {
    let caught: unknown
    try {
      internalInvariant(false as boolean, 'rest target must be an identifier')
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(InternalInvariantError)
    expect((caught as Error).message).toBe(
      'barefoot internal invariant: rest target must be an identifier',
    )
    expect((caught as Error).name).toBe('InternalInvariantError')
  })
})
