/**
 * Analytics Dashboard Reference Page (/components/analytics-dashboard)
 *
 * Block-level composition: Cards + Charts + Table + Select + Input.
 * Compiler stress test for multi-level memo chains, dynamic chart data,
 * inner loops (tags), conditional expansion, and controlled input focus.
 */

import { AnalyticsDashboardDemo } from '@/components/analytics-dashboard-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'features', title: 'Features' },
  { id: 'kpi-cards', title: 'KPI Cards', branch: 'start' },
  { id: 'charts', title: 'Dynamic Charts', branch: 'child' },
  { id: 'table', title: 'Filterable Table', branch: 'child' },
  { id: 'memo-chain', title: 'Memo Chain', branch: 'end' },
]

export function AnalyticsDashboardRefPage() {
  return (
    <DocPage slug="analytics-dashboard" toc={tocItems}>
      <PageHeader
        title="Analytics Dashboard"
        description="Website analytics with multi-level memo chains, dynamic charts, filterable table, and per-item reactivity."
      />

      <Section id="preview" title="Preview">
        <Example code="">
          <AnalyticsDashboardDemo />
        </Example>
      </Section>

      <Section id="features" title="Features">
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>6 KPI cards with progress bars and conditional badges</li>
          <li>Area chart (traffic over time) and pie chart (revenue by source)</li>
          <li>Sortable, filterable table with inner tag loops</li>
          <li>Source dropdown filter driving 5-level memo chain</li>
          <li>Controlled search input with focus preservation</li>
          <li>Expandable row details via conditional rendering in loop</li>
          <li>Pagination with multi-signal text expressions</li>
        </ul>
      </Section>

      <Section id="kpi-cards" title="KPI Cards">
        <p className="text-sm text-muted-foreground">
          Six metric cards read from a single <code>aggregateStats()</code> memo.
          Values update reactively when the source filter or search changes.
        </p>
      </Section>

      <Section id="charts" title="Dynamic Charts">
        <p className="text-sm text-muted-foreground">
          Area chart uses <code>chartData()</code> memo (grouped by month).
          Pie chart uses <code>sourceBreakdown()</code> memo (grouped by source).
          Both recompute when filters change.
        </p>
      </Section>

      <Section id="table" title="Filterable Table">
        <p className="text-sm text-muted-foreground">
          Three-stage memo chain: filter → sort → paginate.
          Each row renders tags via inner loop and supports click-to-expand detail.
        </p>
      </Section>

      <Section id="memo-chain" title="Memo Chain Architecture">
        <p className="text-sm text-muted-foreground">
          Two input signals (searchQuery + sourceFilter) drive a 5-level diamond-shaped
          memo topology: filteredData → sortedData → paginatedData, plus
          aggregateStats and chartData/sourceBreakdown branches.
        </p>
      </Section>
    </DocPage>
  )
}
