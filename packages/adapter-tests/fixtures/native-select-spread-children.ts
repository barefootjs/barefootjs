import { createFixture } from '../src/types'

/**
 * #1633 regression: a component that forwards `children` onto an
 * element which ALSO carries a `{...props}` spread must materialize
 * those children in the CSR path, not just SSR.
 *
 * The original NativeSelect bug came from a self-closing host that
 * received children implicitly through `{...props}`
 * (`<select {...props} />`). SSR materialized them but the CSR
 * template path rendered a childless `<select>`. The fix is to pull
 * `children` out of the rest bag and place it explicitly alongside
 * the spread (`<select {...props}>{children}</select>`). This fixture
 * pins that the explicit-children + spread shape lowers to the same
 * HTML under both Hono SSR and the CSR template path.
 *
 * Shape note: the children-host is the child component's ROOT element
 * and the slotted children are intrinsic `<option>`s (literal attrs),
 * not nested child components. That keeps the fixture clear of the
 * known CSR spread-bag harness limitation (parent-supplied runtime
 * spread props on a child component's root — see the `jsx-spread-*`
 * entries in csr-conformance's skip set) so the regression it guards
 * (children materialization) is the only thing under test.
 *
 * Adapter coverage: Hono SSR, Go SSR and the CSR template path all
 * render this fixture. The Mojo adapter skips it (`skipJsx` in
 * `mojo-adapter.test.ts`) because `render_child` doesn't plumb the
 * destructured rest bag (`{ children, ...props }`) into the child
 * template scope, so the emitted `$bf->spread_attrs($props)` dies on
 * an undeclared `$props`. Go plumbs the same bag via its
 * `Spread_0`/`Extras map[string]any` Input field. Mojo render_child
 * spread-bag plumbing is tracked as a separate follow-up; #1633 is a
 * CSR-layer bug, so CSR + Hono + Go coverage is sufficient here.
 */
export const fixture = createFixture({
  id: 'native-select-spread-children',
  description: 'Children placed alongside a {...props} spread materialize in CSR',
  source: `
'use client'
import { NativeSelect } from './native-select'
export function NativeSelectComposition() {
  return (
    <NativeSelect>
      <option data-slot="native-select-option" value="1">Option 1</option>
      <option data-slot="native-select-option" value="2">Option 2</option>
    </NativeSelect>
  )
}
`,
  components: {
    './native-select.tsx': `
'use client'
import type { SelectHTMLAttributes } from '@barefootjs/jsx'
export function NativeSelect({ children, ...props }: SelectHTMLAttributes) {
  return <select data-slot="native-select" {...props}>{children}</select>
}
`,
  },
  expectedHtml: `
    <select bf-s="test_s0" data-slot="native-select">
      <option data-slot="native-select-option" value="1">Option 1</option>
      <option data-slot="native-select-option" value="2">Option 2</option>
    </select>
  `,
})
