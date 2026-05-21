import { createFixture } from '../../src/types'

/**
 * `Array.prototype.find(pred)` — positive conformance fixture
 * (#1448 catalog parity).
 *
 * Already-lowered via the higher-order AST path; this fixture pins
 * the first-match return semantic. Props seed two `'b'` entries
 * with the first at index 1 (not 0) so a lowering that scans
 * backward or returns the last match would surface here. The
 * predicate is the canonical `x => x === target` shape — the same
 * comparison the analyser already routes through Mojo's `grep` /
 * Go's `bf_find` lowering.
 */
export const fixture = createFixture({
  id: 'array-find',
  description: '.find(pred) returns the first matching element',
  source: `
function ArrayFind({ items, target }: { items: string[]; target: string }) {
  return <div>found: {items.find(x => x === target)}</div>
}
export { ArrayFind }
`,
  props: { items: ['a', 'b', 'c', 'b'], target: 'b' },
  expectedHtml: `
    <div bf-s="test" bf="s1">found: <!--bf:s0-->b<!--/--></div>
  `,
})
