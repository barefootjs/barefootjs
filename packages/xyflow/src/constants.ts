import type { CoordinateExtent } from '@xyflow/system'

export const SVG_NS = 'http://www.w3.org/2000/svg'

export const INFINITE_EXTENT: CoordinateExtent = [
  [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
]
