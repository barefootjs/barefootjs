/**
 * Adapter Conformance Test Suite — Type Definitions
 */

/**
 * A single compile-time diagnostic the fixture is expected to emit.
 *
 * Used in `JSXFixture.expectedDiagnostics` per adapter to assert the
 * compiler is loud about an unsupported pattern, rather than silently
 * emitting broken template output that only fails at request time.
 */
export interface ExpectedDiagnostic {
  /** Error code (e.g. `'BF101'`, `'BF103'`). */
  code: string
  /** Severity to match against `CompilerError.severity`. */
  severity: 'error' | 'warning'
}

/**
 * A JSX fixture defines a component source and optional props for rendering.
 * Used by the JSX conformance runner to compile and render across adapters.
 *
 * Fixtures intentionally carry no adapter-specific knowledge — diagnostic
 * expectations live on the adapter side (`runAdapterConformanceTests`
 * `expectedDiagnostics`), so adding a new adapter doesn't require touching
 * any fixture.
 */
export interface JSXFixture {
  /** Unique fixture identifier, e.g., "counter" */
  id: string
  /** Human-readable description */
  description: string
  /** JSX source code (complete component file) */
  source: string
  /** Additional component files available for import (filename → source) */
  components?: Record<string, string>
  /** Props to pass when rendering (optional) */
  props?: Record<string, unknown>
  /** Expected normalized HTML output (generated from reference Hono adapter) */
  expectedHtml?: string
}

/**
 * Normalize expectedHtml by collapsing whitespace for comparison.
 * Allows expectedHtml to be written with indentation in fixtures
 * while still matching flat HTML output from adapters.
 */
export function normalizeExpectedHtml(html: string): string {
  return html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
}

/**
 * Create a JSXFixture with automatic source trimming.
 * Strips leading newline from template literals so source
 * can be written with a natural indentation style.
 * Normalizes expectedHtml by collapsing whitespace.
 */
export function createFixture(input: {
  id: string
  description: string
  source: string
  components?: Record<string, string>
  props?: Record<string, unknown>
  expectedHtml?: string
}): JSXFixture {
  const trimmedComponents = input.components
    ? Object.fromEntries(
        Object.entries(input.components).map(([k, v]) => [k, v.trimStart()]),
      )
    : undefined
  const normalizedExpectedHtml = input.expectedHtml
    ? normalizeExpectedHtml(input.expectedHtml)
    : undefined
  return {
    ...input,
    source: input.source.trimStart(),
    components: trimmedComponents,
    expectedHtml: normalizedExpectedHtml,
  }
}
