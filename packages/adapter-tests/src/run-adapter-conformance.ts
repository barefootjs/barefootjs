/**
 * Single mandatory entry point for per-adapter conformance.
 *
 * Each adapter package's test file calls this exactly once. The
 * function bundles every conformance suite the adapter contract
 * defines today, plus future ones added here. Adapter authors do not
 * choose which suites to run — they only declare what to skip.
 *
 * Why this shape:
 *
 * - Adding a new suite is a single-place edit (this file). Every
 *   adapter automatically picks it up on the next test run, with the
 *   suite's case set fully exercised unless the adapter explicitly
 *   opts out.
 * - The "I forgot to wire up the new conformance suite" failure mode
 *   becomes impossible: there's nothing to wire up in the adapter's
 *   own test file.
 * - Skip sets are typed per-suite, so a typo in an opt-out is a TS
 *   error rather than a silent miss.
 *
 * Adapter authors graduate a case by removing it from the matching
 * skip set; the next test run picks it up.
 */

import type { TemplateAdapter } from '../../jsx/src/types'
import { runJSXConformanceTests, type RenderOptions } from './jsx-runner'
import { runConformanceSuite } from './conformance'
import {
  templatePrimitiveCases,
  runTemplatePrimitiveCase,
  type TemplatePrimitiveCaseId,
  type TemplatePrimitiveInput,
} from './cases/template-primitives'

export interface RunAdapterConformanceOptions {
  /** Short lowercase label used in `describe` headings. */
  name: string
  /**
   * Fresh-instance factory called per test. Each test gets its own
   * adapter so per-instance state doesn't bleed across cases.
   */
  factory: () => TemplateAdapter
  /** Renderer for JSX-fixture-based conformance. */
  render: (opts: RenderOptions) => Promise<string>
  /** Reference adapter for HTML-diff conformance (optional). */
  referenceAdapter?: () => TemplateAdapter
  referenceRender?: (opts: RenderOptions) => Promise<string>
  /**
   * Optional escape hatch for renderer-level errors (e.g. Go runtime
   * not installed in CI). Return true to skip the failing fixture.
   */
  onRenderError?: (err: Error, fixtureId: string) => boolean

  /**
   * Per-suite opt-outs. Each new conformance suite added to this
   * function adds a new typed skip field. Adapters declare only the
   * skip sets they need; missing fields default to "skip nothing".
   */
  skipJsx?: ReadonlyArray<string>
  skipTemplatePrimitives?: ReadonlySet<TemplatePrimitiveCaseId>
}

export function runAdapterConformanceTests(
  opts: RunAdapterConformanceOptions,
): void {
  runJSXConformanceTests({
    createAdapter: opts.factory,
    render: opts.render,
    referenceAdapter: opts.referenceAdapter,
    referenceRender: opts.referenceRender,
    onRenderError: opts.onRenderError,
    skip: opts.skipJsx ? [...opts.skipJsx] : undefined,
  })

  runConformanceSuite<TemplatePrimitiveCaseId, TemplatePrimitiveInput, string>({
    name: 'template primitives conformance',
    issue: '#1187 phase 3',
    adapter: {
      name: opts.name,
      factory: opts.factory,
      skip: new Set(opts.skipTemplatePrimitives ?? []),
    },
    cases: templatePrimitiveCases,
    run: runTemplatePrimitiveCase,
  })
}
