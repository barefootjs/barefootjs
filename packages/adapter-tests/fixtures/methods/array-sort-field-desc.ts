import { createFixture } from '../../src/types'

/**
 * `.sort((a, b) => b.field - a.field)` — field-based numeric
 * descending. Mirrors the ascending fixture but with reversed
 * operand order to exercise the `direction === 'desc'` branch
 * (#1448 Tier B). JSX-producing `.map()` keeps the chain on the
 * loop-hoist path.
 */
export const fixture = createFixture({
  id: 'array-sort-field-desc',
  description: '.sort((a,b) => b.f - a.f) sorts by field, descending',
  source: `
function ArraySortFieldDesc({ items }: { items: { name: string; price: number }[] }) {
  return <ul>{items.sort((a, b) => b.price - a.price).map(it => <li key={it.name}>{it.name}</li>)}</ul>
}
export { ArraySortFieldDesc }
`,
  props: {
    items: [
      { name: 'a', price: 10 },
      { name: 'c', price: 30 },
      { name: 'b', price: 20 },
    ],
  },
  expectedHtml: `
    <ul bf-s="test" bf="s1">
      <li data-key="c"><!--bf:s0-->c<!--/--></li>
      <li data-key="b"><!--bf:s0-->b<!--/--></li>
      <li data-key="a"><!--bf:s0-->a<!--/--></li>
    </ul>
  `,
})
