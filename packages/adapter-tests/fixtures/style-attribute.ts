import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'style-attribute',
  description: 'Inline style string attribute',
  source: `
export function StyleAttribute() {
  return <div style="color: red; font-size: 16px">Styled</div>
}
`,
  expectedHtml: `
    <div style="color: red; font-size: 16px" bf-s="test">Styled</div>
  `,
})
