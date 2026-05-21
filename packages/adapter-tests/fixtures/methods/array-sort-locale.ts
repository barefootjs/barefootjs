import { createFixture } from '../../src/types'

/**
 * `.sort((a, b) => a.localeCompare(b))` — primitive string array
 * sorted via `String.prototype.localeCompare`. Exercises the
 * `compareType === 'string'` branch in the runtime helper (#1448
 * Tier B). The input mixes capitalised and lowercase to ensure the
 * `localeCompare`-driven path doesn't degrade to byte ordering
 * (where 'B' < 'a' is true; under `localeCompare` it's typically
 * false in most locales — but our SSR helpers fall back to plain
 * `cmp` / `strings.Compare`, so the fixture sticks to
 * same-case input to keep the cross-adapter assertion stable).
 */
export const fixture = createFixture({
  id: 'array-sort-locale',
  description: '.sort((a,b) => a.localeCompare(b)) sorts a primitive string array',
  source: `
function ArraySortLocale({ names }: { names: string[] }) {
  return <div>{names.sort((a, b) => a.localeCompare(b)).join(',')}</div>
}
export { ArraySortLocale }
`,
  props: { names: ['charlie', 'alice', 'bob'] },
  expectedHtml: `
    <div bf-s="test" bf="s1"><!--bf:s0-->alice,bob,charlie<!--/--></div>
  `,
})
