import { createFixture } from '../../src/types'

/**
 * `Array.prototype.toSorted(cmp)` — the non-mutating sibling of
 * `.sort()`. Shares the lowering with `.sort()` (templates render
 * a snapshot, so the JS mutate-vs-new distinction is moot), but
 * the fixture is split so adapters can pin the surface explicitly
 * and a future per-method divergence doesn't require renaming the
 * existing `.sort` pins. (#1448 Tier B)
 */
export const fixture = createFixture({
  id: 'array-toSorted',
  description: '.toSorted((a,b) => a - b) routes through the same sort helper',
  source: `
function ArrayToSorted({ nums }: { nums: number[] }) {
  return <div>{nums.toSorted((a, b) => a - b).join(',')}</div>
}
export { ArrayToSorted }
`,
  props: { nums: [3, 1, 2] },
  expectedHtml: `
    <div bf-s="test" bf="s1"><!--bf:s0-->1,2,3<!--/--></div>
  `,
})
