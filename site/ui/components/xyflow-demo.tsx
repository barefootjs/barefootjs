/**
 * xyflow JSX-native Demos
 *
 * Renders the JSX-native `<Flow>` graph editor with the four overlays
 * (`<Background>` / `<Controls>` / `<MiniMap>`).
 *
 * Why no `renderNode` callbacks live in this file: the barefoot
 * compiler does not transform JSX nested inside arrow-function
 * callbacks, so `renderNode={(n) => <div>…</div>}` ends up as raw JSX
 * in the emitted client bundle and the whole module fails to parse in
 * the browser. To keep the bundle hydratable we lean on Flow's default
 * node body (target=Top / source=Bottom + `data.label`) for every demo
 * here. Custom-body / custom-handle examples on the docs pages stay
 * code-sample-only.
 */

"use client"

import {
  Background,
  Controls,
  Flow,
  MiniMap,
} from '@/components/ui/xyflow'

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Input' } },
  { id: '2', position: { x: 350, y: 50 }, data: { label: 'Transform' } },
  { id: '3', position: { x: 350, y: 200 }, data: { label: 'Validate' } },
  { id: '4', position: { x: 600, y: 125 }, data: { label: 'Output' } },
]

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' },
]

export function XyflowPreviewDemo() {
  return (
    <div className="w-full h-[420px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={initialNodes} edges={initialEdges}>
        <Background variant="dots" gap={20} />
        <Controls />
        <MiniMap pannable zoomable />
      </Flow>
    </div>
  )
}

export function XyflowBackgroundVariantsDemo() {
  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      <div className="h-48 rounded-lg border bg-background overflow-hidden">
        <Flow nodes={[]} edges={[]}>
          <Background variant="dots" gap={20} />
        </Flow>
      </div>
      <div className="h-48 rounded-lg border bg-background overflow-hidden">
        <Flow nodes={[]} edges={[]}>
          <Background variant="lines" gap={30} />
        </Flow>
      </div>
      <div className="h-48 rounded-lg border bg-background overflow-hidden">
        <Flow nodes={[]} edges={[]}>
          <Background variant="cross" gap={32} />
        </Flow>
      </div>
    </div>
  )
}

// Edge-variants demo: four parallel routes between two columns, each
// using a different `edge.type` so the path geometries sit side by
// side for comparison. Default node body keeps the bundle parseable.
const variantsLeftNodes = [
  { id: 'l1', position: { x: 60, y: 30 },  data: { label: 'default' } },
  { id: 'l2', position: { x: 60, y: 110 }, data: { label: 'bezier' } },
  { id: 'l3', position: { x: 60, y: 190 }, data: { label: 'smoothstep' } },
  { id: 'l4', position: { x: 60, y: 270 }, data: { label: 'straight' } },
]
const variantsRightNodes = [
  { id: 'r1', position: { x: 360, y: 30 },  data: { label: 'r1' } },
  { id: 'r2', position: { x: 360, y: 110 }, data: { label: 'r2' } },
  { id: 'r3', position: { x: 360, y: 190 }, data: { label: 'r3' } },
  { id: 'r4', position: { x: 360, y: 270 }, data: { label: 'r4' } },
]
const variantsEdges = [
  { id: 'e1', source: 'l1', target: 'r1' },
  { id: 'e2', source: 'l2', target: 'r2', type: 'bezier' },
  { id: 'e3', source: 'l3', target: 'r3', type: 'smoothstep' },
  { id: 'e4', source: 'l4', target: 'r4', type: 'straight' },
]

export function XyflowEdgeVariantsDemo() {
  return (
    <div className="w-full h-[360px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={[...variantsLeftNodes, ...variantsRightNodes]} edges={variantsEdges}>
        <Background variant="dots" gap={30} />
      </Flow>
    </div>
  )
}

// Animated-edges demo: same nodes as the preview, edges marked
// `animated` so the visible stroke gains the dash-march animation.
const animatedEdgesNodes = [
  { id: 'a', position: { x: 80,  y: 50 }, data: { label: 'Source' } },
  { id: 'b', position: { x: 320, y: 50 }, data: { label: 'Process' } },
  { id: 'c', position: { x: 560, y: 50 }, data: { label: 'Sink' } },
]
const animatedEdgesEdges = [
  { id: 'a-b', source: 'a', target: 'b', animated: true },
  { id: 'b-c', source: 'b', target: 'c', animated: true },
]

export function XyflowAnimatedEdgesDemo() {
  return (
    <div className="w-full h-[220px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={animatedEdgesNodes} edges={animatedEdgesEdges}>
        <Background variant="dots" gap={30} />
      </Flow>
    </div>
  )
}
