/**
 * Charts Introduction Page
 *
 * Entry point for the Charts section. Surfaces what @barefootjs/chart can do
 * (the six built-in chart types) and walks through install + a quick start.
 */

import {
  AreaChartPreviewDemo,
} from '@/components/area-chart-demo'
import {
  BarChartPreviewDemo,
} from '@/components/bar-chart-demo'
import {
  LineChartPreviewDemo,
} from '@/components/line-chart-demo'
import {
  PieChartPreviewDemo,
} from '@/components/pie-chart-demo'
import {
  RadarChartPreviewDemo,
} from '@/components/radar-chart-demo'
import {
  RadialChartPreviewDemo,
} from '@/components/radial-chart-demo'
import {
  PageHeader,
  Section,
  Example,
  PackageManagerTabs,
  type TocItem,
} from '../../components/shared/docs'
import { getChartNavLinks } from '../../components/shared/PageNavigation'
import { TableOfContents } from '@/components/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'chart-types', title: 'Chart Types' },
  { id: 'installation', title: 'Installation' },
  { id: 'quick-start', title: 'Quick Start' },
  { id: 'next-steps', title: 'Next Steps' },
]

const chartTypes = [
  {
    slug: 'bar-chart',
    title: 'Bar Chart',
    description: 'Categorical comparison with grouped or single series bars.',
    Demo: BarChartPreviewDemo,
  },
  {
    slug: 'line-chart',
    title: 'Line Chart',
    description: 'Time series and trends with optional dots and smoothing.',
    Demo: LineChartPreviewDemo,
  },
  {
    slug: 'area-chart',
    title: 'Area Chart',
    description: 'Stacked or single-series filled regions over a baseline.',
    Demo: AreaChartPreviewDemo,
  },
  {
    slug: 'pie-chart',
    title: 'Pie Chart',
    description: 'Part-to-whole composition; supports donuts via inner radius.',
    Demo: PieChartPreviewDemo,
  },
  {
    slug: 'radar-chart',
    title: 'Radar Chart',
    description: 'Multi-axis comparison across shared categorical dimensions.',
    Demo: RadarChartPreviewDemo,
  },
  {
    slug: 'radial-chart',
    title: 'Radial Chart',
    description: 'Polar bars and progress arcs (full or half-circle).',
    Demo: RadialChartPreviewDemo,
  },
]

const quickStartCode = `"use client"

import type { ChartConfig } from "@barefootjs/chart"
import {
  ChartContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ChartTooltip,
} from "@/components/ui/chart"

const chartConfig: ChartConfig = {
  desktop: { label: "Desktop", color: "hsl(221 83% 53%)" },
}

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

export function MyBarChart() {
  return (
    <ChartContainer config={chartConfig} className="w-full">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={(v: string) => v.slice(0, 3)}
        />
        <YAxis />
        <ChartTooltip />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}`

export function ChartsIntroductionPage() {
  return (
    <div className="flex gap-10">
      <div className="flex-1 min-w-0 space-y-12">
        <PageHeader
          title="Introduction"
          description="SVG chart primitives for BarefootJS — composable JSX components with signal-driven reactivity and D3 scales under the hood."
          {...getChartNavLinks('introduction')}
        />

        {/* Overview */}
        <Section id="overview" title="Overview">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              <code className="text-foreground">@barefootjs/chart</code> ships six chart types built from small, composable
              JSX primitives — <code className="text-foreground">ChartContainer</code>,{' '}
              <code className="text-foreground">XAxis</code>, <code className="text-foreground">Bar</code>,{' '}
              <code className="text-foreground">Line</code>, and so on. Charts render as SVG, react to signals without
              re-rendering the whole tree, and use D3 scales internally — so you keep the layout control of D3 with the
              ergonomics of components.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
              <li><strong>Six chart types</strong>: bar, line, area, pie, radar, and radial</li>
              <li><strong>Signal-reactive</strong>: <code className="text-foreground">dataKey</code>, <code className="text-foreground">fill</code>, and other props update granularly</li>
              <li><strong>SVG-based</strong>: scalable, theme-aware, and CSS-styleable via custom properties</li>
              <li><strong>Composable</strong>: drop in <code className="text-foreground">ChartTooltip</code>, <code className="text-foreground">CartesianGrid</code>, and axes only when you need them</li>
              <li><strong>Themed via <code className="text-foreground">ChartConfig</code></strong>: per-series labels and colors expressed as CSS variables</li>
            </ul>
          </div>
        </Section>

        {/* Chart Types */}
        <Section id="chart-types" title="Chart Types">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Six chart types are available out of the box. Click through to each page for full props, examples, and a live playground.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {chartTypes.map((chart) => (
              <a
                href={`/charts/${chart.slug}`}
                className="group block p-4 rounded-lg border bg-card no-underline hover:border-foreground/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="aspect-[4/3] flex items-center justify-center overflow-hidden rounded-md bg-background p-3">
                    <chart.Demo />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground group-hover:underline underline-offset-4">
                      {chart.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{chart.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Section>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="bun add @barefootjs/chart" />
        </Section>

        {/* Quick Start */}
        <Section id="quick-start" title="Quick Start">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              A minimal bar chart: declare a <code className="text-foreground">ChartConfig</code>, hand data to{' '}
              <code className="text-foreground">{'<BarChart>'}</code>, and compose the axes, grid, and tooltip you want.
            </p>
          </div>

          <Example title="" code={quickStartCode}>
            <BarChartPreviewDemo />
          </Example>
        </Section>

        {/* Next Steps */}
        <Section id="next-steps" title="Next Steps">
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {chartTypes.map((chart) => (
              <li>
                <a href={`/charts/${chart.slug}`} className="text-foreground underline underline-offset-4">
                  {chart.title}
                </a>{' '}
                — {chart.description}
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <TableOfContents items={tocItems} />
    </div>
  )
}
