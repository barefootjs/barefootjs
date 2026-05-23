// Unit tests for `generateTestTemplate` — covers the `bf gen test`
// regression on `export function` components (#1403). Writes a fixture
// .tsx to a tmpdir and asserts the emitted string contains the
// expected describe/test bodies, not just the header.

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { generateTestTemplate } from '../lib/test-template'

let workdir: string

beforeEach(() => { workdir = mkdtempSync(path.join(tmpdir(), 'bf-test-template-')) })
afterEach(() => { rmSync(workdir, { recursive: true, force: true }) })

function tplFor(source: string, fileName = 'Component.tsx', importSource?: string): string {
  const filePath = path.join(workdir, fileName)
  writeFileSync(filePath, source)
  return importSource
    ? generateTestTemplate(filePath, { importSource })
    : generateTestTemplate(filePath)
}

describe('generateTestTemplate', () => {
  test('emits a complete describe block for `export function Counter`', () => {
    const tpl = tplFor(`
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Counter() {
        const [count, setCount] = createSignal(0)
        return <div><button onClick={() => setCount(c => c + 1)}>+1</button></div>
      }
    `, 'Counter.tsx')

    // Header
    expect(tpl).toContain(`import { renderToTest } from '@barefootjs/test'`)
    // describe with the actual component name
    expect(tpl).toContain(`describe('Counter'`)
    // basic assertions are present
    expect(tpl).toContain(`expect(result.errors).toEqual([])`)
    expect(tpl).toContain(`expect(result.componentName).toBe('Counter')`)
    // signal extraction
    expect(tpl).toContain(`expect(result.signals).toContain('count')`)
    // event handler picked up — assertion walks the whole tree and
    // accepts both intrinsic `events` (`<button onClick>` → `events:
    // ['click']`) and component `props` (`<Button onClick>` →
    // `props.onClick != null`), so it passes regardless of which
    // pattern the source uses.
    expect(tpl).toMatch(/all\.some\(n => n\.events\.includes\('click'\) \|\| n\.props\['onClick'\] != null\)/)
  })

  test('reads source via bare filename (same-dir layout)', () => {
    const tpl = tplFor(`export function Foo() { return <div /> }`, 'Foo.tsx')
    expect(tpl).toContain(`readFileSync(resolve(__dirname, 'Foo.tsx')`)
    // Specifically NOT the legacy `__tests__/` hop:
    expect(tpl).not.toContain(`readFileSync(resolve(__dirname, '../Foo.tsx')`)
  })

  test('registry-style `export { Slot }` still produces full template (regression guard)', () => {
    const tpl = tplFor(`
      function Slot(props: { children?: unknown; className?: string }) {
        return <div className={props.className}>{props.children}</div>
      }
      export { Slot }
    `, 'index.tsx')
    expect(tpl).toContain(`describe('Slot'`)
    expect(tpl).toContain(`expect(result.root.tag).toBe('div')`)
  })

  // The import source is parameterised so `bf gen test` can emit a
  // `from 'vitest'` line for non-bun PMs (issue #1454). Defaults to
  // `bun:test` so existing callers and the snapshot-style tests above
  // behave unchanged.
  test('defaults to a `from \'bun:test\'` header', () => {
    const tpl = tplFor(`export function Foo() { return <div /> }`, 'Foo.tsx')
    expect(tpl).toContain(`from 'bun:test'`)
    expect(tpl).not.toContain(`from 'vitest'`)
  })

  test('importSource: \'vitest\' swaps the header for non-bun scaffolds', () => {
    const tpl = tplFor(
      `export function Foo() { return <div /> }`,
      'Foo.tsx',
      'vitest',
    )
    expect(tpl).toContain(`import { describe, test, expect } from 'vitest'`)
    expect(tpl).not.toContain(`from 'bun:test'`)
  })

  // `onKeyDown` is the React-style prop name preserved on component
  // nodes; deriving the prop name from the lowercased IR event name
  // (`'on' + 'K' + 'eydown'`) produced `onKeydown`, so the generated
  // `props['onKeydown'] != null` arm never matched and the test failed
  // out of the box on the first user component that listened to
  // keystrokes (e.g. an Enter-to-submit input wired through `<Input
  // onKeyDown=…>`).
  test('emits onKeyDown (not onKeydown) for keydown handlers', () => {
    const tpl = tplFor(`
      'use client'
      import { createSignal } from '@barefootjs/client'
      import { Input } from '@/components/ui/input'
      export function Form() {
        const [text, setText] = createSignal('')
        return (
          <Input
            value={text()}
            onKeyDown={(e) => e.key === 'Enter' && setText('')}
          />
        )
      }
    `, 'Form.tsx')
    expect(tpl).toContain(`n.props['onKeyDown'] != null`)
    expect(tpl).not.toContain(`n.props['onKeydown']`)
  })
})
