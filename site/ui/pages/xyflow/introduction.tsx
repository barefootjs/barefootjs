/**
 * xyflow Introduction Page
 *
 * Entry point for the xyflow section. Mirrors the Forms / Charts pattern:
 * a compact demo using the built-in primitives, then the case for reaching
 * for @barefootjs/xyflow once panning, zooming, and edge interaction enter
 * the picture.
 */

import { GraphEditorDemo } from '@/components/graph-editor-demo'
import { XyflowPreviewDemo } from '@/components/xyflow-demo'
import {
  PageHeader,
  Section,
  Example,
  PackageManagerTabs,
  type TocItem,
} from '../../components/shared/docs'
import { getXyflowNavLinks } from '../../components/shared/PageNavigation'
import { TableOfContents } from '@/components/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'simple-example', title: 'Simple Example' },
  { id: 'when-to-reach-for-xyflow', title: 'When to Reach for @barefootjs/xyflow' },
  { id: 'features', title: 'Features' },
  { id: 'installation', title: 'Installation' },
  { id: 'quick-start', title: 'Quick Start' },
  { id: 'next-steps', title: 'Next Steps' },
]

const simpleSvgCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/client'

// Nodes and edges live in plain signals. The SVG view binds directly:
// <circle cx={n.x}/> reflects a node's position, <path d={edgePath(e)}/>
// rebuilds whenever any endpoint moves, and the root <svg viewBox=...>
// reacts to zoom changes. No extra package required.

function GraphEditor() {
  const [nodes, setNodes] = createSignal(INITIAL_NODES)
  const [edges, setEdges] = createSignal(INITIAL_EDGES)
  const [zoom, setZoom] = createSignal(1)

  const viewBox = createMemo(() => {
    const w = 720 / zoom(), h = 400 / zoom()
    return \`\${360 - w / 2} \${200 - h / 2} \${w} \${h}\`
  })

  return (
    <svg viewBox={viewBox()} onPointerMove={onMove} onPointerUp={onUp}>
      <g>
        {edges().map(e => (
          <path key={e.id} d={edgePath(e)} stroke="#94a3b8" fill="none" />
        ))}
      </g>
      <g>
        {nodes().map(n => (
          <g key={n.id} data-node-id={n.id} onPointerDown={onNodeDown}>
            <circle cx={n.x} cy={n.y} r={28} fill={KIND_FILL[n.kind]} />
            <text x={n.x} y={n.y}>{n.label}</text>
            <circle cx={n.x + 28} cy={n.y} r={5} onPointerDown={onHandleDown} />
          </g>
        ))}
      </g>
    </svg>
  )
}`

const quickStartCode = `"use client"

import { Flow, Background, Controls, MiniMap } from "@/components/ui/xyflow"
import { useNodesState, useEdgesState } from "@barefootjs/xyflow"

const initialNodes = [
  { id: "1", position: { x: 100, y: 100 }, data: { label: "Input" } },
  { id: "2", position: { x: 350, y: 50 },  data: { label: "Transform" } },
  { id: "3", position: { x: 600, y: 125 }, data: { label: "Output" } },
]
const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
]

export function MyCanvas() {
  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(initialEdges)

  return (
    <div className="w-full h-[420px]">
      <Flow nodes={nodes()} edges={edges()}>
        <Background variant="dots" gap={20} />
        <Controls />
        <MiniMap pannable zoomable />
      </Flow>
    </div>
  )
}`

export function XyflowIntroductionPage() {
  return (
    <div className="flex gap-10">
      <div className="flex-1 min-w-0 space-y-12">
        <PageHeader
          title="Introduction"
          description="Node graphs in BarefootJS — start with createSignal + SVG for small canvases, reach for @barefootjs/xyflow once panning, zooming, and edge interaction become non-trivial."
          {...getXyflowNavLinks('introduction')}
        />

        {/* Overview */}
        <Section id="overview" title="Overview">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              BarefootJS lets you bind signals directly to SVG attributes — <code className="text-foreground">cx</code>,{' '}
              <code className="text-foreground">cy</code>, <code className="text-foreground">d</code>, and{' '}
              <code className="text-foreground">viewBox</code> all update granularly when their underlying
              signals change. That alone is enough to build a small interactive canvas. When you start needing
              pan / zoom, drag-to-connect with snapping, fit-view, minimap, or a node renderer registry, the{' '}
              <code className="text-foreground">@barefootjs/xyflow</code> package wraps{' '}
              <code className="text-foreground">@xyflow/system</code> with a signal-friendly store and ships a
              JSX-native renderer.
            </p>
          </div>
        </Section>

        {/* Simple Example */}
        <Section id="simple-example" title="Simple Example">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              For a small canvas, plain signals plus SVG attributes go a long way. The demo below stores
              nodes / edges / zoom in <code className="text-foreground">createSignal</code>, recomputes
              the edge <code className="text-foreground">d</code> path whenever an endpoint moves, and
              reactively rewrites the root <code className="text-foreground">viewBox</code>. No extra
              dependencies.
            </p>
          </div>

          <Example title="SVG canvas with createSignal" code={simpleSvgCode}>
            <GraphEditorDemo />
          </Example>
        </Section>

        {/* When to Reach for @barefootjs/xyflow */}
        <Section id="when-to-reach-for-xyflow" title="When to Reach for @barefootjs/xyflow">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              The signal-bound SVG approach stays pleasant up until you start needing the things every real
              node-graph editor ends up needing:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
              <li>Pointer-paced pan and zoom (with momentum, bounds, and pinch support)</li>
              <li>Drag-to-connect handles with snapping and connection validation</li>
              <li>Fit-view, zoom-to-node, and a coordinate transform shared across overlays</li>
              <li>Selection rectangles, multi-select, and keyboard nudging</li>
              <li>Minimap with synced viewport and node coloring</li>
              <li>Custom HTML node bodies that participate in edge routing and resizing</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              At that point, <code className="text-foreground">@barefootjs/xyflow</code> packages all of it
              behind a small JSX-native API and a signal store you can read with{' '}
              <code className="text-foreground">useFlow</code> /{' '}
              <code className="text-foreground">useViewport</code> /{' '}
              <code className="text-foreground">useNodes</code>.
            </p>
          </div>
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Built on @xyflow/system</h3>
              <p className="text-sm text-muted-foreground">
                The same battle-tested pan / zoom / connection subsystems that power React Flow and Svelte
                Flow, wrapped in a signal-driven store instead of a virtual DOM diffing loop.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">JSX-native renderer</h3>
              <p className="text-sm text-muted-foreground">
                <code className="text-foreground">{'<Flow>'}</code>,{' '}
                <code className="text-foreground">{'<Background>'}</code>,{' '}
                <code className="text-foreground">{'<Controls>'}</code>,{' '}
                <code className="text-foreground">{'<MiniMap>'}</code>,{' '}
                <code className="text-foreground">{'<Handle>'}</code>,{' '}
                <code className="text-foreground">{'<NodeWrapper>'}</code>, and{' '}
                <code className="text-foreground">{'<SimpleEdge>'}</code> are plain BarefootJS components —
                drop in only the overlays you need.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Signal-friendly store</h3>
              <p className="text-sm text-muted-foreground">
                Read state through <code className="text-foreground">useFlow</code>,{' '}
                <code className="text-foreground">useViewport</code>,{' '}
                <code className="text-foreground">useNodes</code>,{' '}
                <code className="text-foreground">useEdges</code>, and{' '}
                <code className="text-foreground">useStore</code>; nodes and edges live in standard
                BarefootJS signals so derived state and effects stay granular.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Custom HTML nodes</h3>
              <p className="text-sm text-muted-foreground">
                Wrap any BarefootJS component in <code className="text-foreground">{'<NodeWrapper>'}</code>{' '}
                and place <code className="text-foreground">{'<Handle>'}</code> children to expose
                connection points. Nodes participate in pan / zoom and edge routing automatically.
              </p>
            </div>
          </div>
        </Section>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              The utility helpers ship as <code className="text-foreground">@barefootjs/xyflow</code>; the
              JSX-native renderer components are distributed via the shadcn-style registry under{' '}
              <code className="text-foreground">@/components/ui/xyflow</code>.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-foreground">Install the renderer components</h4>
            <PackageManagerTabs command="barefoot add xyflow" />
          </div>

          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium text-foreground">Install the utility package</h4>
            <PackageManagerTabs command="bun add @barefootjs/xyflow" />
          </div>
        </Section>

        {/* Quick Start */}
        <Section id="quick-start" title="Quick Start">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Drop a <code className="text-foreground">{'<Flow>'}</code> with the overlays you want, hand it
              your nodes / edges signals, and you have a working canvas with pan, zoom, connection, and
              minimap.
            </p>
          </div>

          <Example title="" code={quickStartCode}>
            <XyflowPreviewDemo />
          </Example>
        </Section>

        {/* Next Steps */}
        <Section id="next-steps" title="Next Steps">
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>
              <a href="/components/xyflow" className="text-foreground underline underline-offset-4">
                xyflow components
              </a>{' '}
              — full prop reference for <code className="text-foreground">Flow</code>,{' '}
              <code className="text-foreground">Background</code>,{' '}
              <code className="text-foreground">Controls</code>,{' '}
              <code className="text-foreground">MiniMap</code>, and the rest.
            </li>
          </ul>
        </Section>
      </div>
      <TableOfContents items={tocItems} />
    </div>
  )
}
