/**
 * Hono Adapter Tests
 *
 * Single mandatory `runAdapterConformanceTests` call below covers every
 * shared conformance suite the adapter contract defines today and any
 * future ones added to that function.
 */

import { HonoAdapter } from '../src/adapter'
import { runAdapterConformanceTests } from '@barefootjs/adapter-tests'
import { renderHonoComponent } from '@barefootjs/hono/test-render'

runAdapterConformanceTests({
  name: 'hono',
  factory: () => new HonoAdapter(),
  render: renderHonoComponent,
  // Hono's SSR runtime is JS — broad `acceptsTemplateCall` covers
  // every conformance case. Only one outlier:
  skipJsx: [
    // `Record<K, V>` + `obj[key]` index lookup (Button's variantClasses
    // pattern) — tracked in #1272 (sub-issue of #1244). SSR drops the
    // substitution: `class="base "` instead of `class="base class-a"`.
    // Browser-side hydration overwrites the class on first paint so
    // site/ui works in practice, but server-rendered HTML is wrong on
    // the wire. The go-template adapter renders the same case
    // correctly — Hono's SSR expression path is the gap.
    'record-index-lookup',
  ],
})
