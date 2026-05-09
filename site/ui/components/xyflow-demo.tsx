/**
 * xyflow JSX-native Demos
 *
 * Renders the JSX-native `<Flow>` graph editor with the four overlays
 * (`<Background>` / `<Controls>` / `<MiniMap>`).
 *
 * The custom-body / custom-handle demos below return live JSX from
 * `renderNode`. This relies on the compiler fix in #1211 (inline
 * `(n) => <div/>` arrows hoisted into synthesized client components)
 * and the runtime fix in #1213 (live `Node` returns spliced into
 * branch templates via `__bfSlot` instead of being stringified by
 * the surrounding template literal).
 */

"use client"

import {
  Background,
  Controls,
  Flow,
  Handle,
  MiniMap,
} from '@/components/ui/xyflow'
import { Position } from '@barefootjs/xyflow'

const customBodyNodes = [
  { id: 'src', position: { x:  80, y: 100 }, data: { label: 'Source' } },
  { id: 'mid', position: { x: 320, y:  80 }, data: { label: 'Pipeline' } },
  { id: 'dst', position: { x: 560, y: 120 }, data: { label: 'Sink' } },
]
const customBodyEdges = [
  { id: 'src-mid', source: 'src', target: 'mid' },
  { id: 'mid-dst', source: 'mid', target: 'dst' },
]

// Per-id colour palette so each Source / Pipeline / Sink is visually
// distinct from the others *and* from Flow's default node body.
const customBodyTone: Record<string, string> = {
  src: 'bg-emerald-500 text-white border-emerald-600',
  mid: 'bg-amber-500  text-white border-amber-600',
  dst: 'bg-sky-500    text-white border-sky-600',
}

function PillNode(props: { id: string }) {
  const node = customBodyNodes.find((n) => n.id === props.id)
  const label = node?.data?.label ?? props.id
  const tone = customBodyTone[props.id] ?? 'bg-card text-foreground border'
  return (
    <div className={`rounded-full border-2 px-5 py-2 text-sm font-semibold shadow-md ${tone}`}>
      <Handle type="target" position={Position.Left} nodeId={props.id} />
      {label}
      <Handle type="source" position={Position.Right} nodeId={props.id} />
    </div>
  )
}

export function XyflowCustomBodyDemo() {
  return (
    <div className="w-full h-[280px] rounded-lg border bg-background overflow-hidden">
      <Flow
        nodes={customBodyNodes}
        edges={customBodyEdges}
        renderNode={(n) => <PillNode id={n.id} />}
      >
        <Background variant="dots" gap={30} />
      </Flow>
    </div>
  )
}

const fanNodes = [
  { id: 'fan', position: { x:  80, y: 120 }, data: { label: 'Router' } },
  { id: 'a',   position: { x: 360, y:  30 }, data: { label: 'A' } },
  { id: 'b',   position: { x: 360, y: 140 }, data: { label: 'B' } },
  { id: 'c',   position: { x: 360, y: 240 }, data: { label: 'C' } },
]
const fanEdges = [
  { id: 'fan-a', source: 'fan', sourceHandle: 'top',    target: 'a' },
  { id: 'fan-b', source: 'fan', sourceHandle: 'right',  target: 'b' },
  { id: 'fan-c', source: 'fan', sourceHandle: 'bottom', target: 'c' },
]

function FanNode(props: { id: string }) {
  const node = fanNodes.find((n) => n.id === props.id)
  const label = node?.data?.label ?? props.id
  if (props.id === 'fan') {
    return (
      <div className="rounded-full border-2 border-violet-600 bg-violet-500 text-white px-5 py-2 text-sm font-semibold shadow-md">
        <Handle type="source" position={Position.Top} nodeId={props.id} id="top" />
        <Handle type="source" position={Position.Right} nodeId={props.id} id="right" />
        <Handle type="source" position={Position.Bottom} nodeId={props.id} id="bottom" />
        {label}
      </div>
    )
  }
  return (
    <div className="rounded-full border-2 border-slate-400 bg-white text-slate-800 px-4 py-1.5 text-sm font-medium shadow-sm">
      <Handle type="target" position={Position.Left} nodeId={props.id} />
      {label}
    </div>
  )
}

export function XyflowCustomHandlesDemo() {
  return (
    <div className="w-full h-[320px] rounded-lg border bg-background overflow-hidden">
      <Flow
        nodes={fanNodes}
        edges={fanEdges}
        renderNode={(n) => <FanNode id={n.id} />}
      >
        <Background variant="dots" gap={30} />
      </Flow>
    </div>
  )
}

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
