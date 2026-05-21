import { createFixture } from '../../src/types'

/**
 * `.sort((a, b) => a - b)` on a primitive number array — the
 * `key.kind === 'self'` case that Tier B's catalogue introduces
 * (the Tier A `sortComparator` only handled struct-field shapes).
 * Composed with `.join(',')` so the sorted order surfaces in the
 * rendered HTML.
 */
export const fixture = createFixture({
  id: 'array-sort-primitive',
  description: '.sort((a,b) => a - b) sorts a primitive number array',
  source: `
function ArraySortPrimitive({ nums }: { nums: number[] }) {
  return <div>{nums.sort((a, b) => a - b).join(',')}</div>
}
export { ArraySortPrimitive }
`,
  props: { nums: [3, 1, 2] },
  expectedHtml: `
    <div bf-s="test" bf="s1"><!--bf:s0-->1,2,3<!--/--></div>
  `,
})
