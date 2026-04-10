/**
 * Inventory Manager Reference Page (/components/inventory-manager)
 *
 * Block-level composition pattern: CRUD inventory table with inline editing,
 * undo/redo, search/filter, validation, and aggregate stats.
 */

import { InventoryManagerDemo } from '@/components/inventory-manager-demo'
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

import { createSignal, createMemo } from '@barefootjs/dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type Item = { id: number; name: string; quantity: number; price: number }

function InventoryManager() {
  const [items, setItems] = createSignal<Item[]>([])
  const [search, setSearch] = createSignal('')
  const [history, setHistory] = createSignal<Item[][]>([])

  const filtered = createMemo(() =>
    items().filter(i => i.name.toLowerCase().includes(search().toLowerCase()))
  )

  const totalValue = createMemo(() =>
    filtered().reduce((s, i) => s + i.quantity * i.price, 0)
  )

  const undo = () => { /* restore from history */ }

  return (
    <div>
      <Input value={search()} onInput={(e) => setSearch(e.target.value)} />
      <table>
        {filtered().map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.quantity}</td>
            <td>{'$' + item.price.toFixed(2)}</td>
          </tr>
        ))}
      </table>
      <p>Total: {'$' + totalValue().toFixed(2)}</p>
    </div>
  )
}`

export function InventoryManagerRefPage() {
  return (
    <DocPage slug="inventory-manager" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Inventory Manager"
          description="A CRUD inventory table with inline editing, undo/redo history, search and category filtering, validation, and aggregate statistics."
          {...getNavLinks('inventory-manager')}
        />

        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <InventoryManagerDemo />
          </Example>
        </Section>

        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Undo/Redo via Signal History Stack</h3>
              <p className="text-sm text-muted-foreground">
                Every mutation pushes the current state onto a history stack. Undo pops from
                history and pushes to future; redo reverses. Tests array-of-arrays signal mutations
                and derived disabled state via createMemo.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Inline Editing with Validation</h3>
              <p className="text-sm text-muted-foreground">
                Click Edit to switch a row to inline edit mode with Input fields. Quantity and
                price inputs validate in real-time with error messages. Tests per-item conditional
                rendering (view vs edit mode) and controlled input binding.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">3-Stage createMemo Chain</h3>
              <p className="text-sm text-muted-foreground">
                items → filtered (search + category) → sorted (field + direction) → aggregates
                (total items, total value, count). Tests multi-stage derived state with cascading
                reactivity.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Multi-Signal Filter</h3>
              <p className="text-sm text-muted-foreground">
                Search input and category buttons both filter the list. Combines two signal
                sources in a single createMemo for filtering.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
