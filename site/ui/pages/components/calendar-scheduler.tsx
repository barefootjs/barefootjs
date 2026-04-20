/**
 * Calendar Scheduler Reference Page (/components/calendar-scheduler)
 *
 * Block-level composition pattern: 2D grid calendar with month/week view
 * toggle, overlapping event layout memo chain, and outer-loop param capture.
 */

import { CalendarSchedulerDemo } from '@/components/calendar-scheduler-demo'
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

// View mode toggle changes the entire loop structure:
// month view → flat calendarDays loop
// week view  → nested weekDays × HOURS 2D grid

function CalendarScheduler() {
  const [viewMode, setViewMode] = createSignal<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = createSignal(new Date())
  const [events, setEvents] = createSignal<CalendarEvent[]>(initialEvents)

  // 4-level overlap layout memo chain (week view only):
  const weekEvents = createMemo(() =>
    events().filter(e => isInWeek(e.date, weekStart()))
  )
  const weekEventsByDay = createMemo(() => groupByDay(weekEvents()))
  const overlapGroups = createMemo(() =>
    computeOverlapGroups(weekEventsByDay())
  )
  const eventPositions = createMemo(() =>
    computeEventPositions(overlapGroups())
  )

  return (
    <div>
      {/* Month view: flat loop with per-cell conditionals */}
      {viewMode() === 'month' ? (
        <div className="grid grid-cols-7">
          {calendarDays().map(cell => (
            <div key={cell.key}
              className={\`...\${cell.isCurrentMonth ? '' : 'opacity-40'}\${cell.key === todayKey ? ' bg-primary/5' : ''}\`}
              onClick={() => openCreate(cell.key, 9)}
            >
              {(eventsByDate()[cell.key] ?? []).map(evt => (
                <div key={String(evt.id)} className={COLOR_CLASSES[evt.color]}>
                  {evt.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {/* Week view: 2D loop — weekDays outer, HOURS inner */}
      {viewMode() === 'week' ? (
        <div className="flex">
          {weekDays().map(d => (
            <div key={d.key} className="relative flex-1" style={\`height: \${24 * HOUR_PX}px\`}>
              {HOURS.map(h => (
                <div key={String(h)} className="absolute w-full border-b"
                  style={\`top: \${h * HOUR_PX}px; height: \${HOUR_PX}px\`}
                  onClick={() => openCreate(d.key, h)}
                />
              ))}
              {(weekEventsByDay()[d.key] ?? []).map(evt => {
                const pos = eventPositions()[evt.id]
                return (
                  <div key={String(evt.id)} className="absolute"
                    style={\`top: \${pos.top}px; height: \${pos.height}px; left: \${pos.left}%; width: \${pos.width}%\`}
                    onClick={() => setSelectedEventId(evt.id)}
                  >
                    {evt.title}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}`

export function CalendarSchedulerRefPage() {
  return (
    <DocPage slug="calendar-scheduler" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Calendar Scheduler"
          description="Month/week calendar with view-mode toggling that changes the loop structure entirely, a 4-level overlap layout memo chain, and deep nested event handlers inside a 2D time grid."
          {...getNavLinks('calendar-scheduler')}
        />

        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <CalendarSchedulerDemo />
          </Example>
        </Section>

        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">View Mode Toggle Changes Loop Structure</h3>
              <p className="text-sm text-muted-foreground">
                Switching between Month and Week renders an entirely different DOM tree.
                Month view iterates a flat <code className="mx-1 text-xs">calendarDays()</code> array
                (a 1D loop producing a 7-column grid). Week view nests
                <code className="mx-1 text-xs">weekDays().map()</code> and
                <code className="mx-1 text-xs">HOURS.map()</code> to build a 2D time grid
                with absolutely-positioned events. The compiler must handle both loop
                structures behind the same <code className="mx-1 text-xs">viewMode()</code> conditional.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Per-Cell Complex Conditionals</h3>
              <p className="text-sm text-muted-foreground">
                Each month day cell evaluates three independent conditions:
                <code className="mx-1 text-xs">cell.isCurrentMonth</code> (opacity),
                <code className="mx-1 text-xs">cell.key === todayKey</code> (highlight ring), and
                event list presence. The week header repeats similar checks per day column.
                Multiple conditional class branches inside a single <code className="mx-1 text-xs">.map()</code> body
                stress the compiler's per-cell IR generation.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">4-Level Memo Chain for Overlap Layout</h3>
              <p className="text-sm text-muted-foreground">
                Week view event positioning uses a four-level memo dependency:
                <code className="mx-1 text-xs">weekEvents</code> (filter by week) →
                <code className="mx-1 text-xs">weekEventsByDay</code> (group by day key) →
                <code className="mx-1 text-xs">overlapGroups</code> (detect overlapping event clusters) →
                <code className="mx-1 text-xs">eventPositions</code> (compute pixel top/height/left/width).
                Adding or deleting an event cascades through all four levels to update layout.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Deep Nested Event Handlers</h3>
              <p className="text-sm text-muted-foreground">
                The week time grid nests three <code className="mx-1 text-xs">.map()</code> calls:
                outer <code className="mx-1 text-xs">weekDays</code>, inner
                <code className="mx-1 text-xs">HOURS</code>, and sibling
                <code className="mx-1 text-xs">weekEventsByDay[d.key]</code>.
                Click handlers in the hour slots capture <code className="mx-1 text-xs">d.key</code>
                (outer loop parameter) and <code className="mx-1 text-xs">h</code> (inner item),
                exercising outer-loop param accessor wrapping across two loop levels.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
