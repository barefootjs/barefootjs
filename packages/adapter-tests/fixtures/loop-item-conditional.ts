import { createFixture } from '../src/types'

/**
 * Whole-item loop conditional (#1665): `arr.map(t => cond(t) && <li/>)` makes
 * the conditional the entire loop item, so an item renders 0-or-1 element.
 *
 * The SSR template emits an always-present `<!--bf-loop-i:KEY-->` anchor
 * before each item's conditional content — the true branch as a `bf-c`
 * element, the false branch as the `bf-cond-start/end` marker pair — so
 * `mapArrayAnchored` can track every item (including the empty ones) by its
 * anchor on the client. The `<!--bf-loop:lN-->` boundary markers are stripped
 * by `normalizeHTML`; the per-item anchors and conditional markers are the
 * load-bearing part of this contract.
 */
export const fixture = createFixture({
  id: 'loop-item-conditional',
  description: 'Whole-item loop conditional renders per-item anchors + conditional markers (#1665)',
  source: `
'use client'
import { createSignal } from '@barefootjs/client'
export function LoopItemConditional() {
  const [items] = createSignal([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
  const [sel] = createSignal('b')
  return <ul>{items().map(t => sel() === t.id && <li key={t.id}>{t.id}</li>)}</ul>
}
`,
  expectedHtml: `
    <ul bf-s="test" bf="s2">
      <!--bf-loop-i:a-->
      <!--bf-cond-start:s0--><!--bf-cond-end:s0-->
      <!--bf-loop-i:b-->
      <li bf-c="s0" data-key="b"><!--bf:s1-->b<!--/--></li>
      <!--bf-loop-i:c-->
      <!--bf-cond-start:s0--><!--bf-cond-end:s0-->
    </ul>
  `,
})
