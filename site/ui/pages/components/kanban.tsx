/**
 * Kanban Reference Page (/components/kanban)
 *
 * Block-level composition pattern: nested .map() loops with dynamic array mutation.
 * Compiler stress test for nested loop rendering and cross-column state updates.
 */

import { KanbanDemo } from '@/components/kanban-demo'
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Task = { id: number; title: string; priority: 'high' | 'medium' | 'low' }
type Column = { id: string; title: string; tasks: Task[] }

const priorityVariant = { high: 'destructive', medium: 'secondary', low: 'outline' }

function KanbanBoard() {
  const [columns, setColumns] = createSignal<Column[]>(initialColumns)

  // Nested .map() — the key compiler stress test
  return (
    <div className="flex gap-4">
      {columns().map(col => (
        <div key={col.id} className="flex-1">
          <h3>{col.title} ({col.tasks.length})</h3>
          {col.tasks.map(task => (
            <Card key={task.id}>
              <CardContent>
                <p>{task.title}</p>
                <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}`

export function KanbanRefPage() {
  return (
    <DocPage slug="kanban" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Kanban Board"
          description="A task management board with nested .map() loops, cross-column movement, and dynamic task management."
          {...getNavLinks('kanban')}
        />

        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <KanbanDemo />
          </Example>
        </Section>

        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Nested Loop Rendering</h3>
              <p className="text-sm text-muted-foreground">
                Columns and tasks rendered via nested .map() calls — the primary compiler stress test.
                Each column has its own task list, rendered as a nested loop inside the outer column loop.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Cross-Column Movement</h3>
              <p className="text-sm text-muted-foreground">
                Tasks can be moved left/right between columns via immutable nested array updates.
                Tests complex setSignal(prev =&gt; prev.map(...)) patterns with nested structures.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Dynamic Task Management</h3>
              <p className="text-sm text-muted-foreground">
                Add and delete tasks with conditional form rendering inside the nested loop context.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
