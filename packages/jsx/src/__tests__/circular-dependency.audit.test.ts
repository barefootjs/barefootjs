/**
 * BF041 `CIRCULAR_DEPENDENCY` deletion audit.
 *
 * BF041 was reserved for "Circular dependency detected" but was never
 * emitted. ESM handles circular imports via partial initialization,
 * and bundlers (Vite, esbuild) detect and warn about circular deps.
 * The barefoot compiler processes one file at a time and has no
 * cross-file dependency graph to detect cycles.
 */

import { describe, test, expect } from 'bun:test'
import { ErrorCodes } from '../errors'

describe('BF041 CIRCULAR_DEPENDENCY — deletion audit', () => {
  test('BF041 code no longer exists in ErrorCodes', () => {
    const allCodes = Object.values(ErrorCodes)
    expect(allCodes).not.toContain('BF041')
  })
})
