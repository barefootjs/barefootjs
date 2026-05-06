/**
 * Template-Primitive Conformance Tests
 *
 * Cross-adapter conformance for the `templatePrimitives` /
 * `acceptsTemplateCall` contract added in #1187 phase 3. Each case is
 * a small component whose generated client JS should either inline a
 * template-scope call or fall back to `(undefined)` — depending on
 * what the adapter promises it can render.
 *
 * Built on the shared `runConformanceSuite` harness (`../conformance.ts`).
 */

import { expect } from 'bun:test'
// Source-path imports (not via package exports). Several adapters and
// `@barefootjs/jsx` itself ship dist builds in their `exports` field; in
// dev that dist may be stale relative to `src/`, which breaks the
// conformance signal. Reach the source directly so this suite always
// reflects the in-tree behaviour.
import { compileJSX } from '../../../jsx/src/compiler'
import { HonoAdapter } from '../../../adapter-hono/src/adapter/hono-adapter'
import { GoTemplateAdapter } from '../../../adapter-go-template/src/adapter/go-template-adapter'
import { runConformanceSuite } from '../conformance'

const FALLBACK_SENTINEL = '(undefined)'

const CaseId = {
  JSON_STRINGIFY_VIA_CONST: 'json-stringify-via-const',
  MATH_FLOOR_VIA_CONST: 'math-floor-via-const',
  USER_IMPORT_VIA_CONST: 'user-import-via-const',
  NO_DOUBLE_REWRITE_OF_PROPS_OBJECT: 'no-double-rewrite-of-props-object',
} as const
type CaseId = (typeof CaseId)[keyof typeof CaseId]

interface Input {
  source: string
}

runConformanceSuite<CaseId, Input, string>({
  name: 'template primitives conformance',
  issue: '#1187 phase 3',
  adapters: [
    {
      name: 'hono',
      factory: () => new HonoAdapter(),
      // Hono uses `acceptsTemplateCall: () => true` (its SSR runtime is
      // JS), so every case is in scope.
      skip: new Set(),
    },
    {
      name: 'go-template',
      factory: () => new GoTemplateAdapter(),
      // Go's template runtime is the Go html/template engine — it can
      // render only callees the adapter explicitly maps to a Go
      // template function via `templatePrimitives`. None mapped yet
      // (#1188); every positive-inlining case stays skipped until then.
      skip: new Set([
        CaseId.JSON_STRINGIFY_VIA_CONST,
        CaseId.MATH_FLOOR_VIA_CONST,
        CaseId.USER_IMPORT_VIA_CONST,
        CaseId.NO_DOUBLE_REWRITE_OF_PROPS_OBJECT,
      ]),
    },
  ],
  cases: [
    {
      id: CaseId.JSON_STRINGIFY_VIA_CONST,
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
      id: CaseId.MATH_FLOOR_VIA_CONST,
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
      id: CaseId.USER_IMPORT_VIA_CONST,
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
      id: CaseId.NO_DOUBLE_REWRITE_OF_PROPS_OBJECT,
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
  ],
  run: (adapter, input) => {
    const result = compileJSX(input.source, 'Test.tsx', { adapter })
    return result.files.find((f) => f.type === 'clientJs')?.content ?? ''
  },
})
