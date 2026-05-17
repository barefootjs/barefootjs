import { createFixture } from '../src/types'

/**
 * Compiler stress (#1244): `children` passed as an explicit attribute
 * value (not nested between the opening / closing tags). Functionally
 * identical to nested children but parsed via a different path. Both
 * SSR and CSR render the same shape after #1320 — the hoisted JSX
 * carries a `bf-s` placeholder substituted by `renderChild` with the
 * outer component's scope, and `renderChild` no longer double-injects
 * `bf-s` when its template body root already carries one.
 */
export const fixture = createFixture({
  id: 'children-jsx-expression',
  description: 'children passed as a JSX-expression attribute renders the same as nested children',
  source: `
function Box({ children }: { children: any }) { return <div>{children}</div> }
export function ChildrenJsxExpression() {
  return <Box children={<span>x</span>} />
}
`,
  expectedHtml: `
    <div bf-s="test_s0"><span bf-s="test">x</span></div>
  `,
})
