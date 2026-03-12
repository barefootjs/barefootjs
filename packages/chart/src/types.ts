import type { ScaleBand, ScaleLinear, ScalePoint } from 'd3-scale'

/** Color and label configuration for chart data series */
export type ChartConfig = Record<
  string,
  {
    label: string
    color: string
  }
>

/** Registration info for a bar series */
export interface BarRegistration {
  dataKey: string
  fill: string
  radius: number
}

/** Props for ChartContainer */
export interface ChartContainerProps {
  config: ChartConfig
  className?: string
  children?: unknown
}

/** Props for BarChart */
export interface BarChartProps {
  data: Record<string, unknown>[]
  children?: unknown
}

/** Props for Bar */
export interface BarProps {
  dataKey: string
  fill?: string
  radius?: number
}

/** Props for CartesianGrid */
export interface CartesianGridProps {
  vertical?: boolean
  horizontal?: boolean
}

/** Props for XAxis */
export interface XAxisProps {
  dataKey: string
  tickFormatter?: (value: string) => string
  hide?: boolean
}

/** Props for YAxis */
export interface YAxisProps {
  hide?: boolean
  tickFormatter?: (value: number) => string
}

/** Props for LineChart */
export interface LineChartProps {
  data: Record<string, unknown>[]
  children?: unknown
}

/** Props for Line */
export interface LineProps {
  dataKey: string
  stroke?: string
  strokeWidth?: number
  type?: 'linear' | 'monotone'
  dot?: boolean
}

/** Props for ChartTooltip */
export interface ChartTooltipProps {
  labelFormatter?: (label: string) => string
}

/** Registration info for a radial bar series */
export interface RadialBarRegistration {
  dataKey: string
  fill: string
}

/** Registration info for a pie slice */
export interface PieRegistration {
  dataKey: string
  fill: string
}

/** Props for RadialChart */
export interface RadialChartProps {
  data: Record<string, unknown>[]
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  children?: unknown
}

/** Props for RadialBar */
export interface RadialBarProps {
  dataKey: string
  fill?: string
  stackId?: string
}

/** Props for RadialChartLabel */
export interface RadialChartLabelProps {
  children?: unknown
}

/** Context value shared between RadialChart and its children */
export interface RadialChartContextValue {
  svgGroup: () => SVGGElement | null
  container: () => HTMLElement | null
  data: () => Record<string, unknown>[]
  innerRadius: () => number
  outerRadius: () => number
  startAngle: () => number
  endAngle: () => number
  config: () => ChartConfig
  centerX: () => number
  centerY: () => number
  radialBars: () => RadialBarRegistration[]
  registerRadialBar: (bar: RadialBarRegistration) => void
  unregisterRadialBar: (dataKey: string) => void
}

/** Props for PieChart */
export interface PieChartProps {
  data: Record<string, unknown>[]
  children?: unknown
}

/** Props for Pie */
export interface PieProps {
  dataKey: string
  nameKey: string
  fill?: string
  innerRadius?: number
  outerRadius?: number
  paddingAngle?: number
}

/** Props for PieTooltip */
export interface PieTooltipProps {
  labelFormatter?: (label: string) => string
}

/** Context value shared between PieChart and its children */
export interface PieChartContextValue {
  svgGroup: () => SVGGElement | null
  container: () => HTMLElement | null
  data: () => Record<string, unknown>[]
  width: () => number
  height: () => number
  config: () => ChartConfig
  pies: () => PieRegistration[]
  registerPie: (pie: PieRegistration) => void
  unregisterPie: (dataKey: string) => void
}

/** Context value shared between BarChart and its children */
export interface BarChartContextValue {
  svgGroup: () => SVGGElement | null
  container: () => HTMLElement | null
  data: () => Record<string, unknown>[]
  xDataKey: () => string
  xScale: () => ScaleBand<string> | null
  yScale: () => ScaleLinear<number, number> | null
  innerWidth: () => number
  innerHeight: () => number
  config: () => ChartConfig
  bars: () => BarRegistration[]
  registerBar: (bar: BarRegistration) => void
  unregisterBar: (dataKey: string) => void
  setXDataKey: (key: string) => void
}

/** Registration info for a radar series */
export interface RadarRegistration {
  dataKey: string
  fill: string
  fillOpacity: number
}

/** Registration info for an area series */
export interface AreaRegistration {
  dataKey: string
  fill: string
  stroke: string
  fillOpacity: number
}

/** Props for RadarChart */
export interface RadarChartProps {
  data: Record<string, unknown>[]
  children?: unknown
}

/** Props for AreaChart */
export interface AreaChartProps {
  data: Record<string, unknown>[]
  children?: unknown
}

/** Props for Radar */
export interface RadarProps {
  dataKey: string
  fill?: string
  fillOpacity?: number
}

/** Props for PolarGrid */
export interface PolarGridProps {
  gridType?: 'polygon' | 'circle'
  show?: boolean
}

/** Props for PolarAngleAxis */
export interface PolarAngleAxisProps {
  dataKey: string
  tickFormatter?: (value: string) => string
  hide?: boolean
}

/** Props for RadarTooltip */
export interface RadarTooltipProps {
  labelFormatter?: (label: string) => string
}

/** Context value shared between RadarChart and its children */
export interface RadarChartContextValue {
  svgGroup: () => SVGGElement | null
  container: () => HTMLElement | null
  data: () => Record<string, unknown>[]
  dataKey: () => string
  radius: () => number
  radialScale: () => ScaleLinear<number, number> | null
  config: () => ChartConfig
  radars: () => RadarRegistration[]
  registerRadar: (radar: RadarRegistration) => void
  unregisterRadar: (dataKey: string) => void
  setDataKey: (key: string) => void
}

/** Props for Area */
export interface AreaProps {
  dataKey: string
  fill?: string
  stroke?: string
  fillOpacity?: number
}

/** Context value shared between AreaChart and its children */
export interface AreaChartContextValue {
  svgGroup: () => SVGGElement | null
  container: () => HTMLElement | null
  data: () => Record<string, unknown>[]
  xDataKey: () => string
  xScale: () => ScalePoint<string> | null
  yScale: () => ScaleLinear<number, number> | null
  innerWidth: () => number
  innerHeight: () => number
  config: () => ChartConfig
  areas: () => AreaRegistration[]
  registerArea: (area: AreaRegistration) => void
  unregisterArea: (dataKey: string) => void
  setXDataKey: (key: string) => void
}
