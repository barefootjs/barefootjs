/**
 * Regression tests for #1404: a `'use client'` component with chained
 * init-locals consumed only by an `if (cond) return <jsx/>` early
 * return emitted a `template:` lambda whose `cond` evaluated as
 * `undefined`. SSR then always took the wrong branch — visible as a
 * flash of the wrong content before hydrate corrected it.
 *
 * The cascade had two layers:
 *
 *  1. `populateCsrInlinable` (`compute-inlinability.ts`) rebuilt its
 *     substitution env once per iter of the fixed-point loop. When the
 *     dependent (`isCompressed`) appeared in the same iter as its
 *     dependency (`width`) was finalised, the env didn't yet carry
 *     `width`'s substitution. The post-substitution
 *     `isInlinableInTemplate` re-ran relocate on the un-substituted
 *     text, fell `width` back to `undefined` (init-local without
 *     inlinable form), and froze `(undefined < 154)` into
 *     `ctx.csrInlinable`. Fix: rebuild env per-const inside the loop
 *     so each iteration is monotonic.
 *
 *  2. `extractFreeIdentifiersFromNode` (`analyzer.ts`) walked through
 *     TypeScript type nodes (`as { compact?: boolean }`), pulling the
 *     type's property keys into the const's `freeIdentifiers` set.
 *     Those non-runtime identifiers reclassified `data` as
 *     `external-name` → unsafe → its transitive consumer
 *     `isCompressed` got demoted to `depends-on-unsafe`, producing a
 *     spurious BF061. Fix: stop the visitor at any `ts.TypeNode` so
 *     type-only identifiers stay out of the free-id set.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSX } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

function findHydrate(content: string): string {
  const line = content.split('\n').find(l => l.includes('hydrate('))
  if (!line) throw new Error('no hydrate() call in client JS')
  return line
}

describe('chained init-local consumed by `if (cond) return <jsx/>` (#1404)', () => {
  test('issue exact repro: chained init-locals with `as T` cast resolve to real bridged form', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Props { data: unknown }

      export function InitLocalCast(props: Props) {
        const [count] = createSignal(0)
        const data = props.data as { compact?: boolean; width?: number }
        const width = data.width ?? 256
        const isCompressed = width < 154

        if (isCompressed) return <div>compressed: {count()}</div>
        if (data.compact) return <div>compact: {count()}</div>
        return <div>detail: {count()}</div>
      }
    `
    const result = compileJSX(source, 'InitLocalCast.tsx', { adapter })

    // No spurious BF061 from the type-annotation identifiers being
    // collected as free-id references.
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')!
    const hydrate = findHydrate(clientJs.content)

    // The if-statement condition's chained-init-local expands through
    // both hops to the bridged prop form, not `undefined`.
    expect(hydrate).toContain('(_p.data.width ?? 256) < 154')
    expect(hydrate).not.toContain('undefined < 154')
  })

  test('chain works without a type cast on the alias const', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function NoCast(props: { data: { compact?: boolean; width?: number } }) {
        const [count] = createSignal(0)
        const data = props.data
        const width = data.width ?? 256
        const isCompressed = width < 154

        if (isCompressed) return <div>compressed: {count()}</div>
        return <div>detail: {count()}</div>
      }
    `
    const result = compileJSX(source, 'NoCast.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')!
    expect(findHydrate(clientJs.content)).toContain('(_p.data.width ?? 256) < 154')
  })

  test('longer chain (4 hops) still resolves in a single fixed-point pass', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function LongChain(props: { x: { y: { z: number } } }) {
        const [n] = createSignal(0)
        const a = props.x
        const b = a.y
        const c = b.z
        const d = c < 10

        if (d) return <div>small: {n()}</div>
        return <div>large: {n()}</div>
      }
    `
    const result = compileJSX(source, 'LongChain.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    // Per-hop parens come from the chain resolver wrapping each
    // substituted value in `(...)` — semantically equivalent to
    // `_p.x.y.z`, just structurally protected against precedence
    // surprises in the surrounding expression.
    expect(findHydrate(result.files.find(f => f.type === 'clientJs')!.content)).toMatch(/\(+_p\.x\)?\.y\)?\.z\)? < 10/)
  })

  test('type-only identifiers in `as` cast do not leak into freeIdentifiers', () => {
    // Direct guard for the second layer of the fix: a type-annotation
    // identifier shadowing a local const must not pull the alias into
    // the `external-name` bucket.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Shape { width?: number }

      export function TypeShadow(props: { data: unknown }) {
        const [count] = createSignal(0)
        // The type-key 'width' appears in the cast. Pre-fix this
        // poisoned data's freeIdentifiers and demoted it to
        // external-name, cascading BF061 onto isCompressed.
        const data = props.data as Shape
        const w = data.width ?? 256
        const isCompressed = w < 154

        if (isCompressed) return <div>compressed: {count()}</div>
        return <div>detail: {count()}</div>
      }
    `
    const result = compileJSX(source, 'TypeShadow.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    expect(findHydrate(result.files.find(f => f.type === 'clientJs')!.content)).toContain('(_p.data.width ?? 256) < 154')
  })

  test('cast variant still produces correct content (not the wrong branch)', () => {
    // SSR-side correctness guard: the template's ternary must select
    // the right branch. Pre-fix, `(undefined < 154)` is always false,
    // so SSR always rendered the `else` branch — the compressed
    // content would only appear after hydrate. Compile-time check:
    // the template literal contains the resolved condition, not the
    // bare fallback.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      export function ThreeWay(props: { data: unknown }) {
        const [n] = createSignal(0)
        const data = props.data as { compact?: boolean; width?: number }
        const w = data.width ?? 256
        const isCompressed = w < 154

        if (isCompressed) return <span>S: {n()}</span>
        if (data.compact) return <em>C: {n()}</em>
        return <strong>D: {n()}</strong>
      }
    `
    const result = compileJSX(source, 'ThreeWay.tsx', { adapter })
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    const hydrate = findHydrate(result.files.find(f => f.type === 'clientJs')!.content)
    expect(hydrate).toContain('(_p.data.width ?? 256) < 154')
    expect(hydrate).toContain('_p.data.compact')
  })
})
