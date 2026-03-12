import { createSignal, provideContext, useContext } from '@barefootjs/dom'
import type { PieRegistration } from './types'
import { PieChartContext, ChartConfigContext } from './context'

const SVG_NS = 'http://www.w3.org/2000/svg'
const ASPECT_RATIO = 1

/**
 * Init function for PieChart component.
 * Creates SVG, provides context to children (Pie, PieTooltip, etc.).
 */
export function initPieChart(scope: Element, props: Record<string, unknown>): void {
  const data = (props.data as Record<string, unknown>[]) ?? []
  const { config } = useContext(ChartConfigContext)

  const el = scope as HTMLElement
  const containerRect = el.getBoundingClientRect()
  const width = containerRect.width || 500
  const height = Math.round(width * ASPECT_RATIO)

  el.style.height = `${height}px`
  el.style.minHeight = ''

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.style.width = '100%'
  svg.style.height = `${height}px`
  svg.style.display = 'block'

  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('transform', `translate(${width / 2},${height / 2})`)
  svg.appendChild(g)
  el.appendChild(svg)

  const [pies, setPies] = createSignal<PieRegistration[]>([])

  const registerPie = (pie: PieRegistration) => {
    setPies((prev) => [...prev, pie])
  }

  const unregisterPie = (dataKey: string) => {
    setPies((prev) => prev.filter((p) => p.dataKey !== dataKey))
  }

  provideContext(PieChartContext, {
    svgGroup: () => g,
    container: () => el,
    data: () => data,
    width: () => width,
    height: () => height,
    config: () => config,
    pies,
    registerPie,
    unregisterPie,
  })
}
