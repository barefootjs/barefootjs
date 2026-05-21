import { createFixture } from '../../src/types'

/**
 * `Array.prototype.sort((a, b) => a.field - b.field)` lowering
 * (#1448 Tier B). Field-based numeric ascending — the historical
 * shape that Go's `IRLoop.sortComparator` already supported pre-
 * Tier B; this fixture brings Mojo to parity. The JSX-producing
 * `.map()` keeps the chain on the loop-hoist path (where the
 * sort wraps the loop's iterable expression) rather than the
 * standalone `array-method` arm.
 */
export const fixture = createFixture({
  id: 'array-sort-field-asc',
  description: '.sort((a,b) => a.f - b.f) sorts by field, ascending',
  source: `
function ArraySortFieldAsc({ items }: { items: { name: string; price: number }[] }) {
  return <ul>{items.sort((a, b) => a.price - b.price).map(it => <li key={it.name}>{it.name}</li>)}</ul>
}
export { ArraySortFieldAsc }
`,
  props: {
    items: [
      { name: 'c', price: 30 },
      { name: 'a', price: 10 },
      { name: 'b', price: 20 },
    ],
  },
  expectedHtml: `
    <ul bf-s="test" bf="s1"><li data-key="a"><!--bf:s0-->a<!--/--></li><li data-key="b"><!--bf:s0-->b<!--/--></li><li data-key="c"><!--bf:s0-->c<!--/--></li></ul>
  `,
})
