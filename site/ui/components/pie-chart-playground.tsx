"use client"
/**
 * Pie Chart Props Playground
 *
 * Interactive playground for the PieChart composed component.
 * Allows tweaking innerRadius, outerRadius, and paddingAngle.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import {
  hlPlain, hlTag, hlAttr, hlStr,
} from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import { Checkbox } from '@ui/components/ui/checkbox'
import {
  ChartContainer,
  PieChart,
  Pie,
  PieTooltip,
} from '@ui/components/ui/chart'

const chartConfig: Record<string, { label: string; color: string }> = {
  done: { label: "Done", color: "hsl(220 14% 30%)" },
  inProgress: { label: "In Progress", color: "hsl(220 14% 50%)" },
  todo: { label: "To Do", color: "hsl(220 14% 70%)" },
  backlog: { label: "Backlog", color: "hsl(220 14% 85%)" },
}

const chartData = [
  { status: "done", tasks: 42 },
  { status: "inProgress", tasks: 18 },
  { status: "todo", tasks: 25 },
  { status: "backlog", tasks: 15 },
]

/**
 * Build highlighted JSX string for the composed PieChart pattern.
 */
function buildHighlightedCode(innerRadius: number, paddingAngle: number, showTooltip: boolean): string {
  const indent = '  '
  const lines: string[] = []

  lines.push(
    `${hlPlain('&lt;')}${hlTag('ChartContainer')} ${hlAttr('config')}${hlPlain('={chartConfig}')} ${hlAttr('className')}${hlPlain('=')}${hlStr('&quot;w-full&quot;')}${hlPlain('&gt;')}`
  )
  lines.push(
    `${indent}${hlPlain('&lt;')}${hlTag('PieChart')} ${hlAttr('data')}${hlPlain('={chartData}')}${hlPlain('&gt;')}`
  )

  if (showTooltip) {
    lines.push(
      `${indent}${indent}${hlPlain('&lt;')}${hlTag('PieTooltip')} ${hlPlain('/&gt;')}`
    )
  }

  const innerProp = innerRadius !== 0
    ? ` ${hlAttr('innerRadius')}${hlPlain('={' + innerRadius + '}')}`
    : ''
  const paddingProp = paddingAngle !== 0
    ? ` ${hlAttr('paddingAngle')}${hlPlain('={' + paddingAngle + '}')}`
    : ''
  lines.push(
    `${indent}${indent}${hlPlain('&lt;')}${hlTag('Pie')} ${hlAttr('dataKey')}${hlPlain('=')}${hlStr('&quot;tasks&quot;')} ${hlAttr('nameKey')}${hlPlain('=')}${hlStr('&quot;status&quot;')}${innerProp}${paddingProp} ${hlPlain('/&gt;')}`
  )

  lines.push(
    `${indent}${hlPlain('&lt;/')}${hlTag('PieChart')}${hlPlain('&gt;')}`
  )
  lines.push(
    `${hlPlain('&lt;/')}${hlTag('ChartContainer')}${hlPlain('&gt;')}`
  )

  return lines.join('\n')
}

/**
 * Build plain-text JSX string for clipboard copy.
 */
function buildPlainCode(innerRadius: number, paddingAngle: number, showTooltip: boolean): string {
  const indent = '  '
  const lines: string[] = []

  lines.push('<ChartContainer config={chartConfig} className="w-full">')
  lines.push(`${indent}<PieChart data={chartData}>`)

  if (showTooltip) {
    lines.push(`${indent}${indent}<PieTooltip />`)
  }

  const innerProp = innerRadius !== 0 ? ` innerRadius={${innerRadius}}` : ''
  const paddingProp = paddingAngle !== 0 ? ` paddingAngle={${paddingAngle}}` : ''
  lines.push(`${indent}${indent}<Pie dataKey="tasks" nameKey="status"${innerProp}${paddingProp} />`)

  lines.push(`${indent}</PieChart>`)
  lines.push('</ChartContainer>')

  return lines.join('\n')
}

function PieChartPlayground(_props: {}) {
  const [innerRadius, setInnerRadius] = createSignal(0)
  const [paddingAngle, setPaddingAngle] = createSignal(0)
  const [showTooltip, setShowTooltip] = createSignal(true)

  createEffect(() => {
    const ir = innerRadius()
    const pa = paddingAngle()
    const st = showTooltip()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) codeEl.innerHTML = buildHighlightedCode(ir, pa, st)
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-pie-chart-preview"
      previewContent={
        <div className="w-full min-w-[300px] max-w-[400px] mx-auto">
          <ChartContainer config={chartConfig} className="w-full">
            <PieChart data={chartData}>
              <PieTooltip />
              <Pie
                dataKey="tasks"
                nameKey="status"
                innerRadius={innerRadius()}
                paddingAngle={paddingAngle()}
              />
            </PieChart>
          </ChartContainer>
        </div>
      }
      controls={<>
        <PlaygroundControl label="innerRadius">
          <Select value={String(innerRadius())} onValueChange={(v: string) => setInnerRadius(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select inner radius..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="0.2">0.2</SelectItem>
              <SelectItem value="0.4">0.4</SelectItem>
              <SelectItem value="0.6">0.6</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
        <PlaygroundControl label="paddingAngle">
          <Select value={String(paddingAngle())} onValueChange={(v: string) => setPaddingAngle(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select padding angle..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
        <PlaygroundControl label="showTooltip">
          <Checkbox
            checked={showTooltip()}
            onCheckedChange={(v: boolean) => setShowTooltip(v)}
          />
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={buildPlainCode(innerRadius(), paddingAngle(), showTooltip())} />}
    />
  )
}

export { PieChartPlayground }
