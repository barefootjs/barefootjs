/**
 * @barefootjs/adapter-tests — Public API
 *
 * Provides a conformance test suite for TemplateAdapter implementations.
 */

export { runJSXConformanceTests, normalizeHTML } from './jsx-runner'
export { createFixture, normalizeExpectedHtml } from './types'
export type { JSXFixture } from './types'
export { indentHTML } from './indent-html'
export type { RunJSXConformanceOptions, RenderOptions } from './jsx-runner'
export { runConformanceSuite } from './conformance'
export type {
  ConformanceAdapter,
  ConformanceCase,
  RunSuiteArgs,
} from './conformance'
