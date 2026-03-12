import { createContext } from '@barefootjs/dom'
import type { BarChartContextValue, RadarChartContextValue, PieChartContextValue, AreaChartContextValue, ChartConfig } from './types'

export const BarChartContext = createContext<BarChartContextValue>()

export const RadarChartContext = createContext<RadarChartContextValue>()

export const PieChartContext = createContext<PieChartContextValue>()

export const AreaChartContext = createContext<AreaChartContextValue>()

export const ChartConfigContext = createContext<{ config: ChartConfig }>()
