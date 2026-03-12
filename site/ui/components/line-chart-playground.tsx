"use client"
/**
 * Line Chart Props Playground
 *
 * Interactive playground for the LineChart composed component.
 * Allows tweaking stroke width, curve type, dot visibility, and grid.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import {
  highlightJsxTree, plainJsxTree,
  type JsxTreeNode, type HighlightProp,
} from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import { Checkbox } from '@ui/components/ui/checkbox'
import {
  ChartContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ChartTooltip,
} from '@ui/components/ui/chart'

const chartConfig: Record<string, { label: string; color: string }> = {
  desktop: { label: "Desktop", color: "hsl(221 83% 53%)" },
}

const chartData = [
  { month: "Jan", desktop: 186 },
  { month: "Feb", desktop: 305 },
  { month: "Mar", desktop: 237 },
  { month: "Apr", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "Jun", desktop: 214 },
]

/**
 * Build the JSX tree description for code display.
 */
function buildCodeTree(strokeWidth: number, curveType: string, showDots: boolean, showGrid: boolean): JsxTreeNode {
  const chartChildren: JsxTreeNode[] = []

  if (showGrid) {
    chartChildren.push({
      tag: 'CartesianGrid',
      props: [{ name: 'vertical', value: 'false', defaultValue: '', kind: 'expression' }],
    })
  }

  chartChildren.push(
    { tag: 'XAxis', props: [{ name: 'dataKey', value: 'month', defaultValue: '' }] },
    { tag: 'YAxis' },
    { tag: 'ChartTooltip' },
  )

  const lineProps: HighlightProp[] = [
    { name: 'dataKey', value: 'desktop', defaultValue: '' },
    { name: 'stroke', value: 'var(--color-desktop)', defaultValue: '' },
    { name: 'strokeWidth', value: String(strokeWidth), defaultValue: '2', kind: 'expression' },
    { name: 'type', value: curveType, defaultValue: '' },
    { name: 'dot', value: String(showDots), defaultValue: 'true', kind: 'expression' },
  ]
  chartChildren.push({ tag: 'Line', props: lineProps })

  return {
    tag: 'ChartContainer',
    props: [
      { name: 'config', value: 'chartConfig', defaultValue: '', kind: 'expression' },
      { name: 'className', value: 'w-full', defaultValue: '' },
    ],
    children: [{
      tag: 'LineChart',
      props: [{ name: 'data', value: 'chartData', defaultValue: '', kind: 'expression' }],
      children: chartChildren,
    }],
  }
}

function LineChartPlayground(_props: {}) {
  const [strokeWidth, setStrokeWidth] = createSignal(2)
  const [curveType, setCurveType] = createSignal('monotone')
  const [showDots, setShowDots] = createSignal(true)
  const [showGrid, setShowGrid] = createSignal(true)

  createEffect(() => {
    const sw = strokeWidth()
    const ct = curveType()
    const d = showDots()
    const g = showGrid()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) codeEl.innerHTML = highlightJsxTree(buildCodeTree(sw, ct, d, g))
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-line-chart-preview"
      previewContent={
        <div className="w-full min-w-[300px]">
          <ChartContainer config={chartConfig} className="w-full">
            <LineChart data={chartData}>
              <CartesianGrid
                vertical={false}
                horizontal={showGrid()}
              />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip />
              <Line
                dataKey="desktop"
                stroke={'var(--color-desktop)'}
                strokeWidth={strokeWidth()}
                type={curveType() as 'linear' | 'monotone'}
                dot={showDots()}
              />
            </LineChart>
          </ChartContainer>
        </div>
      }
      controls={<>
        <PlaygroundControl label="strokeWidth">
          <Select value={String(strokeWidth())} onValueChange={(v: string) => setStrokeWidth(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select width..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
        <PlaygroundControl label="type">
          <Select value={curveType()} onValueChange={(v: string) => setCurveType(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monotone">monotone</SelectItem>
              <SelectItem value="linear">linear</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
        <PlaygroundControl label="dots">
          <Checkbox
            checked={showDots()}
            onCheckedChange={(v: boolean) => setShowDots(v)}
          />
        </PlaygroundControl>
        <PlaygroundControl label="showGrid">
          <Checkbox
            checked={showGrid()}
            onCheckedChange={(v: boolean) => setShowGrid(v)}
          />
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={plainJsxTree(buildCodeTree(strokeWidth(), curveType(), showDots(), showGrid()))} />}
    />
  )
}

export { LineChartPlayground }
