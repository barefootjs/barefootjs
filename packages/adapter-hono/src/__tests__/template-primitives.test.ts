/**
 * Pins #1187 phase 3: HonoAdapter declares `templatePrimitives` for safe
 * ECMAScript built-ins, and the compiler pipeline threads that registry
 * through to relocate so a chained-const using a registered call escapes
 * the bridged-arg / zero-arg rejection that previously forced a silent
 * `undefined` fallback in the template.
 *
 * Each test compiles a tiny component with HonoAdapter and inspects the
 * generated client JS:
 *   - "no fallback" = the rendered template inlines the actual call
 *   - "fallback" = the template substitutes the `(undefined)` sentinel
 *     (UNSAFE_TEMPLATE_EXPR from `html-template.ts`)
 *
 * Direct JSX expressions (`<div data-x={JSON.stringify(props.x)}>`
 * without an intervening const) go through a different path
 * (`transformExpr` → `unsafeLocalNames`) and are unaffected by phase 3.
 * Phase 3's contribution is specifically to the const-chain
 * classification done by `compute-inlinability`.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSX } from '../../../jsx/src/compiler'
import { HonoAdapter } from '../adapter/hono-adapter'

function compile(source: string) {
  const result = compileJSX(source, 'Test.tsx', { adapter: new HonoAdapter() })
  const clientJs = result.files.find((f) => f.type === 'clientJs')?.content ?? ''
  return { clientJs, errors: result.errors }
}

const FALLBACK_SENTINEL = '(undefined)'

describe('Hono templatePrimitives — chained const escapes silent fallback (#1187 phase 3)', () => {
  test('JSON.stringify(props.x) via const inlines into template', () => {
    const source = `
      'use client'
      export function Foo(props: { config: object }) {
        const json = JSON.stringify(props.config)
        return <div data-config={json}>hi</div>
      }
    `
    const { clientJs } = compile(source)

    expect(clientJs).not.toContain(FALLBACK_SENTINEL)
    // Template should inline the call with the bridged prop ref.
    expect(clientJs).toContain('JSON.stringify(_p.config)')
  })

  test('Math.floor(props.score) via const inlines into template', () => {
    const source = `
      'use client'
      export function Foo(props: { score: number }) {
        const rounded = Math.floor(props.score)
        return <div data-rounded={rounded}>hi</div>
      }
    `
    const { clientJs } = compile(source)

    expect(clientJs).not.toContain(FALLBACK_SENTINEL)
    expect(clientJs).toContain('Math.floor(_p.score)')
  })

  test('String(props.x) via const inlines into template', () => {
    const source = `
      'use client'
      export function Foo(props: { count: number }) {
        const label = String(props.count)
        return <div data-label={label}>hi</div>
      }
    `
    const { clientJs } = compile(source)

    expect(clientJs).not.toContain(FALLBACK_SENTINEL)
    expect(clientJs).toContain('String(_p.count)')
  })

  test('unregistered callee via const still falls back (negative control)', () => {
    // `customSerialize` isn't registered by HonoAdapter — the chained const
    // remains classified as external-name, the template-side reference of
    // `serialized` resolves to `(undefined)` via unsafeLocalNames.
    const source = `
      'use client'
      import { customSerialize } from './lib'
      export function Foo(props: { config: object }) {
        const serialized = customSerialize(props.config)
        return <div data-config={serialized}>hi</div>
      }
    `
    const { clientJs } = compile(source)

    expect(clientJs).toContain(FALLBACK_SENTINEL)
  })

})

// Shadow-guard semantics (a local name colliding with a registered global)
// are pinned at the unit level by `packages/jsx/src/__tests__/staged-ir/
// 11-template-primitive-registry.test.ts`. End-to-end behaviour through
// the chain resolver tends to converge on safe output even when the
// guard fires (see that test for the lower-level invariants).
