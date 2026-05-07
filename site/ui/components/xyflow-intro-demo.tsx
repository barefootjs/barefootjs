"use client"
/**
 * xyflow Introduction Demos
 *
 * Standalone demos for the xyflow Introduction page. Kept in a dedicated
 * file so the Introduction's bundle stays isolated from xyflow-demo.tsx
 * (whose XyflowCustomNodeDemo carries `renderNode` callback JSX the
 * compiler does not transform).
 *
 * The demos rely on Flow's default node renderer (DefaultNodeBody),
 * which mounts target=Top / source=Bottom handles so edges flow
 * top-down — the same convention as xyflow/react's quick start.
 *
 * MiniMap is intentionally omitted on the Introduction page; it is
 * documented on the Components reference page.
 */

import { Background, Controls, Flow } from '@/components/ui/xyflow'

// Positions are spread wide enough that Flow's fit-view-on-init pass
// settles around scale ~1 instead of zooming in / out aggressively.
const fourNodes = [
  { id: '1', position: { x: 250, y: 30 },  data: { label: 'Input' } },
  { id: '2', position: { x: 100, y: 180 }, data: { label: 'Transform' } },
  { id: '3', position: { x: 450, y: 180 }, data: { label: 'Validate' } },
  { id: '4', position: { x: 250, y: 330 }, data: { label: 'Output' } },
]

const fourEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' },
]

const twoNodes = [
  { id: 'a', position: { x: 80, y: 30 },   data: { label: 'Hello' } },
  { id: 'b', position: { x: 280, y: 150 }, data: { label: 'World' } },
]

const oneEdge = [{ id: 'a-b', source: 'a', target: 'b' }]

/**
 * Full Quick Start — nodes + edges + Background + Controls.
 */
export function XyflowQuickStartDemo() {
  return (
    <div className="w-full h-[420px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={fourNodes} edges={fourEdges}>
        <Background variant="dots" gap={20} />
        <Controls />
      </Flow>
    </div>
  )
}

/**
 * Empty Flow — bare canvas with the Background pattern only.
 */
export function XyflowEmptyDemo() {
  return (
    <div className="w-full h-[240px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={[]} edges={[]}>
        <Background variant="dots" gap={20} />
      </Flow>
    </div>
  )
}

/**
 * Two nodes, no edges yet.
 */
export function XyflowNodesDemo() {
  return (
    <div className="w-full h-[240px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={twoNodes} edges={[]}>
        <Background variant="dots" gap={20} />
      </Flow>
    </div>
  )
}

/**
 * Two nodes connected by a single edge.
 */
export function XyflowEdgesDemo() {
  return (
    <div className="w-full h-[240px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={twoNodes} edges={oneEdge}>
        <Background variant="dots" gap={20} />
      </Flow>
    </div>
  )
}
