/**
 * xyflow Introduction Page
 *
 * Mirrors the xyflow/react getting-started tutorial: an empty Flow,
 * then nodes, then edges, then overlays — each step compounds. Wraps
 * with the same "simple createSignal demo first, reach for the package
 * once it gets complex" framing as the Forms / Charts intros.
 */

import { GraphEditorDemo } from '@/components/graph-editor-demo'
import {
  XyflowQuickStartDemo,
  XyflowEmptyDemo,
  XyflowNodesDemo,
  XyflowEdgesDemo,
} from '@/components/xyflow-intro-demo'
import {
  PageHeader,
  Section,
  Subsection,
  Example,
  CodeBlock,
  PackageManagerTabs,
  type TocItem,
} from '../../components/shared/docs'
import { getXyflowNavLinks } from '../../components/shared/PageNavigation'
import { TableOfContents } from '@/components/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'simple-example', title: 'Simple Example' },
  { id: 'when-to-reach-for-xyflow', title: 'When to Reach for @barefootjs/xyflow' },
  { id: 'quick-start', title: 'Quick Start' },
  { id: 'installation', title: 'Installation', branch: 'start' },
  { id: 'first-flow', title: 'Your First Flow', branch: 'child' },
  { id: 'adding-nodes', title: 'Adding Nodes', branch: 'child' },
  { id: 'connecting-edges', title: 'Connecting Edges', branch: 'child' },
  { id: 'adding-overlays', title: 'Adding Overlays', branch: 'end' },
  { id: 'nodes', title: 'Nodes' },
  { id: 'edges', title: 'Edges' },
  { id: 'built-in-components', title: 'Built-in Components' },
  { id: 'next-steps', title: 'Next Steps' },
]

const simpleSvgCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/client'

// Nodes / edges / zoom live in plain signals. SVG attributes bind
// directly: <circle cx={n.x}/> tracks a node's position, edge <path d=
// {edgePath(e)}/> rebuilds whenever any endpoint moves, and the root
// viewBox reacts to zoom. No extra package required.

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
        {edges().map((e) => (
          <path key={e.id} d={edgePath(e)} stroke="#94a3b8" fill="none" />
        ))}
      </g>
      <g>
        {nodes().map((n) => (
          <g key={n.id} data-node-id={n.id} onPointerDown={onNodeDown}>
            <circle cx={n.x} cy={n.y} r={28} />
            <text x={n.x} y={n.y}>{n.label}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}`

const quickStartCode = `"use client"

import {
  Flow,
  Background,
  Controls,
} from "@/components/ui/xyflow"

const nodes = [
  { id: "a", position: { x: 80,  y: 30 },  data: { label: "Hello" } },
  { id: "b", position: { x: 320, y: 180 }, data: { label: "World" } },
]
const edges = [
  { id: "a-b", source: "a", target: "b" },
]

export function MyFlow() {
  return (
    <div className="w-full h-[420px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={nodes} edges={edges}>
        <Background variant="dots" gap={30} />
        <Controls />
      </Flow>
    </div>
  )
}`

const emptyFlowCode = `import { Flow, Background } from "@/components/ui/xyflow"

export function MyFlow() {
  return (
    <div className="w-full h-[240px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={[]} edges={[]}>
        <Background variant="dots" gap={30} />
      </Flow>
    </div>
  )
}`

const nodesCode = `import { Flow, Background } from "@/components/ui/xyflow"

const nodes = [
  { id: "a", position: { x: 80, y: 30 },   data: { label: "Hello" } },
  { id: "b", position: { x: 280, y: 150 }, data: { label: "World" } },
]

export function MyFlow() {
  return (
    <div className="w-full h-[240px] rounded-lg border bg-background overflow-hidden">
      <Flow nodes={nodes} edges={[]}>
        <Background variant="dots" gap={30} />
      </Flow>
    </div>
  )
}`

const edgesCode = `// Same as before — just pass an edges array this time.
const edges = [
  { id: "a-b", source: "a", target: "b" },
]

<Flow nodes={nodes} edges={edges}>
  <Background variant="dots" gap={30} />
</Flow>`

const overlaysCode = `<Flow nodes={nodes} edges={edges}>
  <Background variant="dots" gap={30} />
  <Controls />
</Flow>`

const nodeShapeCode = `// A node is a plain object: id, position, data.
const nodes = [
  { id: "a", position: { x: 80, y: 30 }, data: { label: "Hello" } },
  // Optional fields:
  // - type      : key into the \`nodeTypes\` map (custom rendering)
  // - selected  : initial selection state
  // - draggable : disable per-node drag
]`

const customNodeCode = `"use client"

import { Flow, Handle } from "@/components/ui/xyflow"
import { Position } from "@barefootjs/xyflow"

// A custom node is a regular function component. The store passes
// per-node props (id, data, selected, ...) through the nodeTypes map.
function PillNode(props) {
  return (
    <div className="rounded-full border-2 bg-card px-4 py-2 text-sm font-medium shadow-sm">
      <Handle type="target" position={Position.Top} nodeId={props.id} />
      {props.data.label}
      <Handle type="source" position={Position.Bottom} nodeId={props.id} />
    </div>
  )
}

const nodeTypes = { pill: PillNode }

const nodes = [
  { id: "a", type: "pill", position: { x: 80, y: 30 },  data: { label: "Hello" } },
  { id: "b", type: "pill", position: { x: 320, y: 180 }, data: { label: "World" } },
]

<Flow nodes={nodes} edges={edges} nodeTypes={nodeTypes}>
  <Background />
</Flow>`

const customHandlesCode = `// Multiple handles per node — give each one a stable \`id\`
// and reference it from the edge's \`sourceHandle\` / \`targetHandle\`.
function SplitNode(props) {
  return (
    <div className="...">
      <Handle type="target" position={Position.Top}    nodeId={props.id} />
      {props.data.label}
      <Handle type="source" position={Position.Bottom} nodeId={props.id} id="ok"   />
      <Handle type="source" position={Position.Right}  nodeId={props.id} id="warn" />
    </div>
  )
}

const edges = [
  { id: "a-b-ok",   source: "a", sourceHandle: "ok",   target: "b" },
  { id: "a-c-warn", source: "a", sourceHandle: "warn", target: "c" },
]`

const edgeShapeCode = `// An edge is a plain object connecting two node ids.
const edges = [
  { id: "a-b", source: "a", target: "b" },
  // Optional fields:
  // - type        : 'default' | 'bezier' | 'straight' | 'smoothstep' | 'step'
  //                 or a key into the \`edgeTypes\` map for custom edges
  // - animated    : true → renders a moving dashed stroke
  // - markerStart : 'arrow' | 'arrowclosed' to draw an arrow at the start
  // - markerEnd   : same for the end (default is 'arrow' on directed flows)
  // - sourceHandle / targetHandle : pin to a specific handle id
  // - selected    : initial selection state
  // - data        : arbitrary payload your custom edge component can read
]`

const edgeVariantsCode = `const edges = [
  { id: "a-b", source: "a", target: "b", type: "smoothstep" },
  { id: "b-c", source: "b", target: "c", type: "straight", animated: true },
  { id: "c-d", source: "c", target: "d", markerEnd: "arrowclosed" },
]`

const customEdgeCode = `// Custom edges receive an \`svgGroup\` slot to render label / decorations
// into. Keep the path stroke on a sibling SVG <path>.
import { getEdgePath, computeEdgePosition } from "@barefootjs/xyflow"

function ApprovalEdge(props) {
  // \`props\` includes id, source, target, sourceX/Y, targetX/Y,
  // sourcePosition, targetPosition, data, selected, animated, label,
  // and svgGroup (an SVGGElement to mount custom content into).
  // Render a path + foreignObject label inside svgGroup imperatively
  // (or hand it to a JSX render helper — see /components/xyflow).
}

const edgeTypes = { approval: ApprovalEdge }

const edges = [
  { id: "a-b", source: "a", target: "b", type: "approval", label: "OK" },
]

<Flow nodes={nodes} edges={edges} edgeTypes={edgeTypes} />`

export function XyflowIntroductionPage() {
  return (
    <div className="flex gap-10">
      <div className="flex-1 min-w-0 space-y-12">
        <PageHeader
          title="Introduction"
          description="Node graphs in BarefootJS — start with createSignal + SVG for small canvases, reach for @barefootjs/xyflow once you need pan / zoom / drag-to-connect / minimap and friends."
          {...getXyflowNavLinks('introduction')}
        />

        {/* Overview */}
        <Section id="overview" title="Overview">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              BarefootJS lets you bind signals directly to SVG attributes — <code className="text-foreground">cx</code>,{' '}
              <code className="text-foreground">cy</code>, <code className="text-foreground">d</code>, and{' '}
              <code className="text-foreground">viewBox</code> all update granularly when their underlying
              signals change. That alone is enough to build a small interactive canvas.{' '}
              <code className="text-foreground">@barefootjs/xyflow</code> wraps{' '}
              <code className="text-foreground">@xyflow/system</code> (the engine behind React Flow / Svelte
              Flow) with a signal-friendly store and a JSX-native renderer for everything bigger.
            </p>
          </div>
        </Section>

        {/* Simple Example */}
        <Section id="simple-example" title="Simple Example">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              For a small canvas, plain signals plus SVG attribute bindings go a long way. The demo below
              keeps nodes / edges / zoom in <code className="text-foreground">createSignal</code>, recomputes
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
              <li>Custom HTML node bodies that participate in edge routing and resizing</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              At that point, <code className="text-foreground">@barefootjs/xyflow</code> packages all of it
              behind a small JSX-native API.
            </p>
          </div>
        </Section>

        {/* Quick Start (full demo at the top, like reactflow.dev) */}
        <Section id="quick-start" title="Quick Start">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Here is what we are building — two draggable nodes connected by an edge, on a dotted background
              with zoom controls. The rest of the page walks through it step by step.
            </p>
          </div>

          <Example title="Quick Start" code={quickStartCode}>
            <XyflowQuickStartDemo />
          </Example>
        </Section>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              The renderer components ship via the shadcn-style registry. The utility helpers (signal hooks,
              store, types, geometry helpers) live in <code className="text-foreground">@barefootjs/xyflow</code>{' '}
              and are pulled in by the registry install.
            </p>
          </div>

          <PackageManagerTabs command="barefoot add xyflow" />
        </Section>

        {/* Your First Flow — progressive build */}
        <Section id="first-flow" title="Your First Flow">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Start with an empty <code className="text-foreground">{'<Flow>'}</code>. The surrounding{' '}
              <code className="text-foreground">{'<div>'}</code>{' '}
              <strong>must have explicit width and height</strong> — Flow measures its container to size the
              canvas, so a zero-sized parent renders nothing.
            </p>
          </div>

          <Example title="Empty canvas" code={emptyFlowCode}>
            <XyflowEmptyDemo />
          </Example>
        </Section>

        {/* Adding Nodes */}
        <Section id="adding-nodes" title="Adding Nodes">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Nodes are plain objects with <code className="text-foreground">id</code>,{' '}
              <code className="text-foreground">position</code>, and <code className="text-foreground">data</code>.
              Pass them as the <code className="text-foreground">nodes</code> prop and Flow renders each
              node's <code className="text-foreground">data.label</code> inside its built-in node wrapper.
              For custom node bodies and explicit connection handles, see the{' '}
              <a href="/components/xyflow#custom-node" className="text-foreground underline underline-offset-4">
                Components
              </a>{' '}
              page.
            </p>
          </div>

          <Example title="Two nodes" code={nodesCode}>
            <XyflowNodesDemo />
          </Example>
        </Section>

        {/* Connecting Edges */}
        <Section id="connecting-edges" title="Connecting Edges">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Edges are objects with <code className="text-foreground">id</code>,{' '}
              <code className="text-foreground">source</code>, and{' '}
              <code className="text-foreground">target</code> — the source / target ids must match a node{' '}
              <code className="text-foreground">id</code>. Pass them as the{' '}
              <code className="text-foreground">edges</code> prop and Flow draws each edge as a Bezier path
              between the matching handles.
            </p>
          </div>

          <Example title="Add an edge" code={edgesCode}>
            <XyflowEdgesDemo />
          </Example>
        </Section>

        {/* Adding Overlays */}
        <Section id="adding-overlays" title="Adding Overlays">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Two optional overlays are mounted as children of{' '}
              <code className="text-foreground">{'<Flow>'}</code>:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
              <li><code className="text-foreground">{'<Background>'}</code> — dotted / lined / cross pattern that scales with zoom.</li>
              <li><code className="text-foreground">{'<Controls>'}</code> — zoom-in / zoom-out / fit-view / lock buttons.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              A pannable / zoomable <code className="text-foreground">{'<MiniMap>'}</code> is also available — see the{' '}
              <a href="/components/xyflow" className="text-foreground underline underline-offset-4">Components</a>{' '}
              page for its full API.
            </p>
          </div>

          <CodeBlock code={overlaysCode} />

          <p className="text-sm text-muted-foreground mt-2">
            With all three you have the Quick Start demo at the top of this page.
          </p>
        </Section>

        {/* Nodes — concept + custom rendering + custom handles */}
        <Section id="nodes" title="Nodes">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              A node is a plain JavaScript object that lives in the{' '}
              <code className="text-foreground">nodes</code> prop. It needs a unique{' '}
              <code className="text-foreground">id</code>, a{' '}
              <code className="text-foreground">position</code> in flow coordinates, and a{' '}
              <code className="text-foreground">data</code> bag of whatever payload your renderer wants — a
              label, a status, a row from your database. Everything else (selected, dragging, measured size,
              absolute position) is computed by the store.
            </p>
          </div>

          <CodeBlock code={nodeShapeCode} />

          <Subsection title="Custom node bodies">
            <p className="text-sm text-muted-foreground">
              Out of the box Flow renders each node's{' '}
              <code className="text-foreground">data.label</code> inside the default card. To customise the
              body — colour, layout, an icon, an inline status — give the node a{' '}
              <code className="text-foreground">type</code> and pass a matching component through the{' '}
              <code className="text-foreground">nodeTypes</code> map. Flow mounts your component once per
              node and forwards the live{' '}
              <code className="text-foreground">id</code> / <code className="text-foreground">data</code> /{' '}
              <code className="text-foreground">selected</code> as props.
            </p>
            <CodeBlock code={customNodeCode} />
          </Subsection>

          <Subsection title="Custom handles">
            <p className="text-sm text-muted-foreground">
              The default node has one target handle on top and one source handle on the bottom. For richer
              graphs you can mount as many{' '}
              <code className="text-foreground">{'<Handle>'}</code> elements as you need, each with its own{' '}
              <code className="text-foreground">position</code> and an{' '}
              <code className="text-foreground">id</code> so edges can pin to a specific connection point
              via <code className="text-foreground">sourceHandle</code> /{' '}
              <code className="text-foreground">targetHandle</code>.
            </p>
            <CodeBlock code={customHandlesCode} />
          </Subsection>
        </Section>

        {/* Edges — concept + customization + labels */}
        <Section id="edges" title="Edges">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              An edge connects two nodes by their ids. The minimal shape is{' '}
              <code className="text-foreground">{'{ id, source, target }'}</code>; everything else —
              the curve type, animation, arrow markers, labels — is opt-in. Flow looks up{' '}
              <code className="text-foreground">source</code> /{' '}
              <code className="text-foreground">target</code> in the node lookup, finds the matching
              handles, and draws a path between them.
            </p>
          </div>

          <CodeBlock code={edgeShapeCode} />

          <Subsection title="Edge variants">
            <p className="text-sm text-muted-foreground">
              The built-in <code className="text-foreground">{'<SimpleEdge>'}</code> picks a path
              algorithm from the edge's <code className="text-foreground">type</code> string. Animated
              edges add a moving dashed stroke; markers attach an arrow at either end.
            </p>
            <CodeBlock code={edgeVariantsCode} />
          </Subsection>

          <Subsection title="Custom edges and labels">
            <p className="text-sm text-muted-foreground">
              For edge labels, decorations, or interactive controls along the path, register a custom
              edge component through the <code className="text-foreground">edgeTypes</code> map. Each
              custom edge receives the resolved geometry plus an{' '}
              <code className="text-foreground">svgGroup</code> slot it can render label foreignObjects
              and toolbars into. The <code className="text-foreground">label</code> field on the edge
              data is forwarded to your component as a prop.
            </p>
            <CodeBlock code={customEdgeCode} />
          </Subsection>
        </Section>

        {/* Built-in Components — what's in the box */}
        <Section id="built-in-components" title="Built-in Components">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              <code className="text-foreground">@barefootjs/xyflow</code> ships a small set of components
              you can drop inside <code className="text-foreground">{'<Flow>'}</code> (or compose into
              custom nodes / edges). Each one is documented in detail on the{' '}
              <a href="/components/xyflow" className="text-foreground underline underline-offset-4">
                Components
              </a>{' '}
              page — the summaries below are an at-a-glance index.
            </p>
          </div>

          <div className="space-y-3 mt-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-1"><code>{'<Flow>'}</code></h3>
              <p className="text-sm text-muted-foreground">
                The top-level container. Owns the store, the viewport transform, pan / zoom / drag
                subsystems, and the per-node measurement loop. Accepts <code className="text-foreground">nodes</code>,{' '}
                <code className="text-foreground">edges</code>, optional{' '}
                <code className="text-foreground">nodeTypes</code> / <code className="text-foreground">edgeTypes</code> maps,
                and any of the overlays below as children.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-1"><code>{'<Background>'}</code></h3>
              <p className="text-sm text-muted-foreground">
                Pattern background that scales and pans with the viewport. Three{' '}
                <code className="text-foreground">variant</code> options —{' '}
                <code className="text-foreground">"dots"</code>,{' '}
                <code className="text-foreground">"lines"</code>,{' '}
                <code className="text-foreground">"cross"</code> — plus{' '}
                <code className="text-foreground">gap</code> / <code className="text-foreground">color</code> tuning.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-1"><code>{'<Controls>'}</code></h3>
              <p className="text-sm text-muted-foreground">
                Zoom-in / zoom-out / fit-view / lock buttons. Each button is opt-out via{' '}
                <code className="text-foreground">showZoom</code> /{' '}
                <code className="text-foreground">showFitView</code> /{' '}
                <code className="text-foreground">showInteractive</code>; corner placement via{' '}
                <code className="text-foreground">position</code>.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-1"><code>{'<MiniMap>'}</code></h3>
              <p className="text-sm text-muted-foreground">
                Overview map with a synced viewport rectangle. Pannable and zoomable by default; per-node
                colours via the <code className="text-foreground">nodeColor</code> prop (string or function).
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-1"><code>{'<Handle>'}</code></h3>
              <p className="text-sm text-muted-foreground">
                Per-node connection point. Render inside a custom node body with a{' '}
                <code className="text-foreground">type</code> ({' '}
                <code className="text-foreground">"source"</code> | <code className="text-foreground">"target"</code>) and
                a <code className="text-foreground">position</code> ({' '}
                <code className="text-foreground">Position.Top</code> /{' '}
                <code className="text-foreground">Bottom</code> / <code className="text-foreground">Left</code> /{' '}
                <code className="text-foreground">Right</code>). Pass a stable{' '}
                <code className="text-foreground">id</code> when a node has more than one handle on the same side.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-1"><code>{'<NodeWrapper>'}</code></h3>
              <p className="text-sm text-muted-foreground">
                The transform / selection / measurement shell Flow mounts around every node. You usually
                don't reach for it directly — it shows up when you opt into a fully manual rendering path
                instead of the <code className="text-foreground">nodeTypes</code> map.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-1"><code>{'<SimpleEdge>'}</code></h3>
              <p className="text-sm text-muted-foreground">
                The default edge renderer. Reads the edge's{' '}
                <code className="text-foreground">type</code> /{' '}
                <code className="text-foreground">animated</code> /{' '}
                <code className="text-foreground">selected</code> flags and draws a stroke + an invisible
                wide hit area for click selection.
              </p>
            </div>
          </div>
        </Section>

        {/* Next Steps */}
        <Section id="next-steps" title="Next Steps">
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>
              <a href="/components/xyflow" className="text-foreground underline underline-offset-4">
                xyflow components
              </a>{' '}
              — full prop reference for{' '}
              <code className="text-foreground">Flow</code>,{' '}
              <code className="text-foreground">Background</code>,{' '}
              <code className="text-foreground">Controls</code>,{' '}
              <code className="text-foreground">MiniMap</code>,{' '}
              <code className="text-foreground">Handle</code>,{' '}
              <code className="text-foreground">NodeWrapper</code>, and{' '}
              <code className="text-foreground">SimpleEdge</code>.
            </li>
            <li>
              <a href="https://reactflow.dev/learn" className="text-foreground underline underline-offset-4">
                xyflow / react getting started
              </a>{' '}
              — the upstream tutorial this section is modelled on; the engine concepts (handles,
              connections, viewport) carry over directly.
            </li>
          </ul>
        </Section>
      </div>
      <TableOfContents items={tocItems} />
    </div>
  )
}
