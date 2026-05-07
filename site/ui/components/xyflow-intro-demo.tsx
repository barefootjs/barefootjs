"use client"
/**
 * xyflow Introduction Demos
 *
 * Standalone demos for the xyflow Introduction page. Kept in a dedicated
 * file (rather than reusing site/ui/components/xyflow-demo.tsx) so the
 * Introduction's bundle stays small and isolated from unrelated demos.
 *
 * The demos rely on Flow's default node renderer: each node renders its
 * `data.label` inside the framework's `bf-flow__node` wrapper. Custom
 * node bodies via `<NodeWrapper>` children would double-mount with the
 * auto loop, and the `renderNode` callback contains JSX the compiler
 * does not transform — both paths are out of scope for an Introduction.
 */

import {
  Background,
  Controls,
  Flow,
  MiniMap,
} from '@/components/ui/xyflow'

// Positions are biased to the top-left so the MiniMap (bottom-right by
// default) does not occlude the nodes inside the 420px-tall preview.
const fourNodes = [
  { id: '1', position: { x: 40, y: 60 }, data: { label: 'Input' } },
  { id: '2', position: { x: 220, y: 20 }, data: { label: 'Transform' } },
  { id: '3', position: { x: 220, y: 140 }, data: { label: 'Validate' } },
  { id: '4', position: { x: 420, y: 80 }, data: { label: 'Output' } },
]

const fourEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' },
]

const twoNodes = [
  { id: 'a', position: { x: 80, y: 80 }, data: { label: 'Hello' } },
  { id: 'b', position: { x: 320, y: 80 }, data: { label: 'World' } },
]

const oneEdge = [{ id: 'a-b', source: 'a', target: 'b' }]

/**
 * Full Quick Start — nodes + edges + Background + Controls + MiniMap.
 */
export function XyflowQuickStartDemo() {
  return (
    <div className="w-full h-[420px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={fourNodes} edges={fourEdges}>
        <Background variant="dots" gap={20} />
        <Controls />
        <MiniMap pannable zoomable />
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
