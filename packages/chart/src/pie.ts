import { useContext, createEffect, onCleanup } from '@barefootjs/client/runtime'
import { PieChartContext } from './context'
import { pie as d3Pie, arc as d3Arc } from 'd3-shape'
import type { PieArcDatum } from 'd3-shape'

const SVG_NS = 'http://www.w3.org/2000/svg'

interface PieDatum {
  name: string
  value: number
  fill: string
}

/**
 * Init function for Pie component.
 * Registers itself with PieChart context and renders arc paths.
 */
export function initPie(_scope: Element, props: Record<string, unknown>): void {
  const ctx = useContext(PieChartContext)

  let currentDataKey: string | null = null

  // Registration effect
  createEffect(() => {
    const dataKey = props.dataKey as string
    const fill = (props.fill as string) ?? 'currentColor'

    if (currentDataKey !== null) {
      ctx.unregisterPie(currentDataKey)
    }
    ctx.registerPie({ dataKey, fill })
    currentDataKey = dataKey
  })

  onCleanup(() => {
    if (currentDataKey !== null) ctx.unregisterPie(currentDataKey)
  })

  // Rendering effect
  let pieGroup: SVGGElement | null = null

  createEffect(() => {
    const dataKey = props.dataKey as string
    const nameKey = (props.nameKey as string) ?? 'name'
    const paddingAngle = (props.paddingAngle as number) ?? 0
    const innerRadiusRatio = (props.innerRadius as number) ?? 0
    const outerRadiusRatio = (props.outerRadius as number) ?? 0.8

    const g = ctx.svgGroup()
    if (!g) return

    // Clear previous
    if (pieGroup) {
      pieGroup.remove()
      pieGroup = null
    }

    const data = ctx.data()
    const config = ctx.config()
    const width = ctx.width()
    const height = ctx.height()
    const radius = Math.min(width, height) / 2

    // Build pie data
    const pieData: PieDatum[] = data.map((d) => {
      const name = String(d[nameKey] ?? '')
      const value = Number(d[dataKey]) || 0
      const configEntry = config[name]
      const fill = configEntry?.color ?? 'currentColor'
      return { name, value, fill }
    })

    const pieLayout = d3Pie<PieDatum>()
      .value((d) => d.value)
      .padAngle((paddingAngle * Math.PI) / 180)
      .sort(null)

    const arcGenerator = d3Arc<PieArcDatum<PieDatum>>()
      .innerRadius(radius * innerRadiusRatio)
      .outerRadius(radius * outerRadiusRatio)

    const arcs = pieLayout(pieData)

    pieGroup = document.createElementNS(SVG_NS, 'g')
    pieGroup.setAttribute('class', `chart-pie chart-pie-${dataKey}`)

    for (const arcDatum of arcs) {
      const path = document.createElementNS(SVG_NS, 'path')
      path.setAttribute('d', arcGenerator(arcDatum) ?? '')
      path.setAttribute('fill', arcDatum.data.fill)
      path.setAttribute('data-name', arcDatum.data.name)
      path.setAttribute('data-value', String(arcDatum.data.value))
      path.setAttribute('data-key', dataKey)
      pieGroup.appendChild(path)
    }

    g.appendChild(pieGroup)
  })
}
