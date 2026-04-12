/**
 * Permission Matrix Reference Page (/components/permission-matrix)
 *
 * Block-level composition pattern: Role x Permission grid with inheritance
 * cascade, diamond memo dependencies, and bulk operations.
 */

import { PermissionMatrixDemo } from '@/components/permission-matrix-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'
import { getNavLinks } from '../../components/shared/PageNavigation'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'features', title: 'Features' },
]

const previewCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/client'
import { Checkbox } from '@/components/ui/checkbox'

const ROLES = [
  { id: 'viewer', rank: 4 },
  { id: 'editor', rank: 3 },
  { id: 'admin', rank: 2 },
  { id: 'owner', rank: 1 },
]

function PermissionMatrix() {
  const [directGrants, setDirectGrants] = createSignal({})

  // Diamond memo: directGrants → effectivePerms → cellStates + roleStats
  const effectivePerms = createMemo(() => {
    const grants = directGrants()
    const result = {}
    for (const role of ROLES) {
      const effective = new Set()
      for (const r of ROLES) {
        if (r.rank >= role.rank) {
          for (const p of (grants[r.id] || [])) effective.add(p)
        }
      }
      result[role.id] = [...effective]
    }
    return result
  })

  const cellStates = createMemo(() => { /* checked/inherited/disabled per cell */ })

  return (
    <table>
      <tbody>
        {ALL_PERMISSIONS.map(perm => (
          <tr key={perm.id}>
            <td>{perm.label}</td>
            {ROLES.map(role => (
              <td key={role.id}>
                <Checkbox
                  checked={cellStates()[role.id + ':' + perm.id].checked}
                  disabled={cellStates()[role.id + ':' + perm.id].disabled}
                  onCheckedChange={() => toggle(role.id, perm.id)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}`

export function PermissionMatrixRefPage() {
  return (
    <DocPage slug="permission-matrix" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Permission Matrix"
          description="A Role x Permission grid with inheritance cascade, diamond memo dependency graphs, cascading derived state, and 2D grid rendering with bulk operations."
          {...getNavLinks('permission-matrix')}
        />

        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <PermissionMatrixDemo />
          </Example>
        </Section>

        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Diamond Memo Dependency Graph</h3>
              <p className="text-sm text-muted-foreground">
                directGrants signal feeds into effectivePerms memo, which feeds into both cellStates
                and roleStats memos. cellStates also reads directGrants directly, forming a diamond
                DAG where multiple paths converge on the same data sources. Tests that the compiler
                correctly tracks and batches updates across shared dependencies.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Inheritance Cascade</h3>
              <p className="text-sm text-muted-foreground">
                Roles are ranked (Owner &gt; Admin &gt; Editor &gt; Viewer). When a permission is
                directly granted to a lower-ranked role, all higher-ranked roles automatically inherit
                it. Inherited checkboxes appear checked but disabled with reduced opacity, ensuring
                the cascade is both visually distinct and functionally correct.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">2D Nested Loop with Per-Cell State</h3>
              <p className="text-sm text-muted-foreground">
                The grid renders as ALL_PERMISSIONS.map(perm =&gt; ROLES.map(role =&gt; cell)).
                Each cell reads from the cellStates memo to determine checked, inherited, and
                disabled status. Tests nested static array mapArray with per-item reactive
                attribute binding on Checkbox components.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Bulk Toggle Operations</h3>
              <p className="text-sm text-muted-foreground">
                "All" and "None" buttons per role (column) and "+" and "-" buttons per permission
                (row) trigger batch mutations that cascade through the entire memo chain. Tests that
                bulk signal updates propagate correctly through the diamond dependency graph.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Reactive Text in Loop</h3>
              <p className="text-sm text-muted-foreground">
                Per-role permission count badges (e.g., "Admin: 8/12") update reactively as
                permissions are toggled. Tests reactive text interpolation inside loop iterations.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
