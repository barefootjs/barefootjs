/**
 * Cross-adapter conformance suite harness.
 *
 * The pattern:
 *
 *   suite =
 *     - a name (the describe label)
 *     - a list of adapters under test, each with a typed `skip` set of
 *       case ids that adapter doesn't yet support
 *     - a list of cases, each with: an id, a description, a per-case
 *       input shape, and an `assert` callback over the runner's output
 *     - a runner that turns (adapter, case-input) into the value the
 *       assert callback inspects (e.g. compiled client JS, IR, etc.)
 *
 * Each adapter × case combination becomes one test. Skipped pairs use
 * `test.skip` so they stay visible in the test report — silently
 * absent skips are how spec drift hides.
 *
 * Adapter authors: when your adapter graduates a case, remove it from
 * the skip set; the next test run picks it up. No suite-file edits
 * needed.
 */

import { describe, test } from 'bun:test'
import type { TemplateAdapter } from '../../jsx/src/types'

export interface ConformanceAdapter<CaseId extends string> {
  /** Label used in `describe` headings — keep short, lowercase. */
  name: string
  /**
   * Each test instantiates a fresh adapter via the factory so per-test
   * adapter state (Hono's `loopKeyStack`, etc.) doesn't bleed across
   * cases. Cheap by construction; do not memoize.
   */
  factory: () => TemplateAdapter
  /**
   * Case ids this adapter doesn't yet implement. Typed by the suite's
   * own `CaseId` literal-union so a typo here is a TypeScript error.
   * Empty set when the adapter satisfies every case in the suite.
   */
  skip: Set<CaseId>
}

export interface ConformanceCase<CaseId extends string, Input, Output> {
  id: CaseId
  /** One-line summary — appears in test names. */
  description: string
  /** Per-case input. Suite-defined shape (e.g. `{ source: string }`). */
  input: Input
  /** Assertion against the runner's output. */
  assert: (output: Output) => void
}

export interface RunSuiteArgs<CaseId extends string, Input, Output> {
  /** Suite label used in describe heading; e.g. `'template primitives'`. */
  name: string
  adapters: Array<ConformanceAdapter<CaseId>>
  cases: Array<ConformanceCase<CaseId, Input, Output>>
  /**
   * Per (adapter, case) execution. Receives a fresh adapter instance
   * and the case's input; returns the artifact the case's `assert`
   * inspects. Synchronous compile + extract is the typical shape; an
   * async return is allowed for adapters that need async setup.
   */
  run: (adapter: TemplateAdapter, input: Input) => Output | Promise<Output>
  /** Optional issue reference appended to the suite heading. */
  issue?: string
}

export function runConformanceSuite<CaseId extends string, Input, Output>(
  args: RunSuiteArgs<CaseId, Input, Output>,
): void {
  const heading = args.issue ? `${args.name} (${args.issue})` : args.name

  for (const adapter of args.adapters) {
    describe(`[${adapter.name}] ${heading}`, () => {
      for (const c of args.cases) {
        const t = adapter.skip.has(c.id) ? test.skip : test
        t(`${c.id}: ${c.description}`, async () => {
          const output = await args.run(adapter.factory(), c.input)
          c.assert(output)
        })
      }
    })
  }
}
