import { createFixture } from '../src/types'

/**
 * Static array of child components imported from a sibling .tsx file.
 *
 * Hono renders the JSX directly — the child component reference
 * resolves to the imported function symbol at request time, so the
 * output is the fully materialised HTML. The Go template adapter
 * emits `{{template "ListItem" .}}` for the same reference; the
 * template only resolves if the user has compiled `./list-item.tsx`
 * with the same adapter and registered the resulting
 * `{{define "ListItem"}}` on the same `*template.Template`. When
 * that doesn't happen (the common case for a user just adopting the
 * Hono-style "factor into a sibling file" pattern), the build
 * succeeds and the request returns 500 with
 * `template: "ListItem" is undefined`.
 *
 * The Go and Mojo adapters now emit `BF103` (warning, not error) for
 * this shape at build time (#1266); the `expectedDiagnostics` entry
 * pins that contract. Severity is `warning` because the barefoot CLI
 * compiles sibling .tsx files together and registers their templates
 * alongside the parent, so the runtime resolves correctly under the
 * CLI's normal build pipeline. The warning surfaces the contract for
 * users on a bespoke build pipeline where the cross-template lookup
 * would otherwise silently 500.
 */
export const fixture = createFixture({
  id: 'static-array-children',
  description: 'Static array with child components preserves className (#483)',
  source: `
import { ListItem } from './list-item'
export function StaticList() {
  const items = [{ label: 'Alpha' }, { label: 'Beta' }]
  return (
    <ul>
      {items.map(item => (
        <ListItem key={item.label} label={item.label} className="text-sm" />
      ))}
    </ul>
  )
}
`,
  components: {
    './list-item.tsx': `
export function ListItem({ label, className }: { label: string; className?: string }) {
  return <li className={className}>{label}</li>
}
`,
  },
  expectedHtml: `
    <ul bf-s="test" bf="s1">
      <li class="text-sm" bf-s="ListItem_*" data-key="Alpha" bf="s1"><!--bf:s0-->Alpha<!--/--></li>
      <li class="text-sm" bf-s="ListItem_*" data-key="Beta" bf="s1"><!--bf:s0-->Beta<!--/--></li>
    </ul>
  `,
  expectedDiagnostics: {
    'go-template': [{ code: 'BF103', severity: 'warning' }],
    mojo: [{ code: 'BF103', severity: 'warning' }],
  },
})
