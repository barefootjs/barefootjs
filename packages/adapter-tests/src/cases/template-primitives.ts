/**
 * Template-primitive conformance cases (#1187 phase 3).
 *
 * Pure data + a `runner` that turns each case into the artifact its
 * `assert` inspects. Imported by per-adapter test files; this module
 * never imports a concrete adapter.
 *
 * Each case is a small JSX component whose generated client JS should
 * either inline a template-scope call or fall back to `(undefined)` —
 * depending on what the adapter promises it can render via
 * `templatePrimitives` / `acceptsTemplateCall`.
 */

import { expect } from 'bun:test'
import { compileJSX } from '../../../jsx/src/compiler'
import type { TemplateAdapter } from '../../../jsx/src/types'
import type { ConformanceCase } from '../conformance'

export const FALLBACK_SENTINEL = '(undefined)'

export const TemplatePrimitiveCaseId = {
  JSON_STRINGIFY_VIA_CONST: 'json-stringify-via-const',
  MATH_FLOOR_VIA_CONST: 'math-floor-via-const',
  USER_IMPORT_VIA_CONST: 'user-import-via-const',
  NO_DOUBLE_REWRITE_OF_PROPS_OBJECT: 'no-double-rewrite-of-props-object',
} as const

export type TemplatePrimitiveCaseId =
  (typeof TemplatePrimitiveCaseId)[keyof typeof TemplatePrimitiveCaseId]

export interface TemplatePrimitiveInput {
  source: string
}

export const templatePrimitiveCases: ReadonlyArray<
  ConformanceCase<TemplatePrimitiveCaseId, TemplatePrimitiveInput, string>
> = [
  {
    id: TemplatePrimitiveCaseId.JSON_STRINGIFY_VIA_CONST,
    description: 'JSON.stringify(props.x) via const inlines into template',
    input: {
      source: `
        'use client'
        export function Foo(props: { config: object }) {
          const json = JSON.stringify(props.config)
          return <div data-config={json}>hi</div>
        }
      `,
    },
    assert: (clientJs) => {
      expect(clientJs).not.toContain(FALLBACK_SENTINEL)
      expect(clientJs).toContain('JSON.stringify(_p.config)')
    },
  },
  {
    id: TemplatePrimitiveCaseId.MATH_FLOOR_VIA_CONST,
    description: 'Math.floor(props.score) via const inlines into template',
    input: {
      source: `
        'use client'
        export function Foo(props: { score: number }) {
          const rounded = Math.floor(props.score)
          return <div data-rounded={rounded}>hi</div>
        }
      `,
    },
    assert: (clientJs) => {
      expect(clientJs).not.toContain(FALLBACK_SENTINEL)
      expect(clientJs).toContain('Math.floor(_p.score)')
    },
  },
  {
    id: TemplatePrimitiveCaseId.USER_IMPORT_VIA_CONST,
    description: 'user-imported function via const inlines into template',
    input: {
      source: `
        'use client'
        import { customSerialize } from './lib'
        export function Foo(props: { config: object }) {
          const serialized = customSerialize(props.config)
          return <div data-config={serialized}>hi</div>
        }
      `,
    },
    assert: (clientJs) => {
      expect(clientJs).not.toContain(FALLBACK_SENTINEL)
      expect(clientJs).toContain('customSerialize(_p.config)')
    },
  },
  {
    id: TemplatePrimitiveCaseId.NO_DOUBLE_REWRITE_OF_PROPS_OBJECT,
    description: 'props-object lift does not leak `_p._p.X` into the template',
    input: {
      source: `
        'use client'
        import { customSerialize } from './lib'
        export function Foo(props: { a: number; b: number }) {
          const json = customSerialize({ a: props.a, b: props.b })
          return <div data-config={json}>hi</div>
        }
      `,
    },
    assert: (clientJs) => {
      // Pre-fix this produced `_p._p.a` / `_p._p.b` because the
      // props-object name was lifted via the per-key form.
      expect(clientJs).not.toContain('_p._p')
      expect(clientJs).toContain('_p.a')
      expect(clientJs).toContain('_p.b')
    },
  },
]

/**
 * Standard runner for template-primitive cases: compile the source
 * with the adapter and return the generated client JS. Adapters can
 * pass this directly to `runConformanceSuite`'s `run`.
 */
export function runTemplatePrimitiveCase(
  adapter: TemplateAdapter,
  input: TemplatePrimitiveInput,
): string {
  const result = compileJSX(input.source, 'Test.tsx', { adapter })
  return result.files.find((f) => f.type === 'clientJs')?.content ?? ''
}
