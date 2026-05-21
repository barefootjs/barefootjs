import { createFixture } from '../../src/types'

/**
 * `Array.prototype.findIndex(pred)` — positive conformance fixture
 * (#1448 catalog parity).
 *
 * Already-lowered via the higher-order AST path. Pinning a
 * duplicated-value array where the first match sits at a non-zero
 * index disambiguates `findIndex` from both `find` (returns value,
 * not index) and `lastIndexOf` (returns last position, not first).
 */
export const fixture = createFixture({
  id: 'array-findIndex',
  description: '.findIndex(pred) returns the index of the first match',
  source: `
function ArrayFindIndex({ items, target }: { items: string[]; target: string }) {
  return <div>idx: {items.findIndex(x => x === target)}</div>
}
export { ArrayFindIndex }
`,
  props: { items: ['a', 'b', 'c', 'b'], target: 'b' },
  expectedHtml: `
    <div bf-s="test" bf="s1">idx: <!--bf:s0-->1<!--/--></div>
  `,
})
