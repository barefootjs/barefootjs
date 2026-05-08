/**
 * xyflow Nodes Page
 *
 * Standalone deep dive on nodes — the shape, the default body, custom
 * bodies via `nodeTypes`, and per-node `<Handle>` placement.
 */

import { XyflowNodesDemo } from '@/components/xyflow-intro-demo'
import { XyflowCustomBodyDemo, XyflowCustomHandlesDemo } from '@/components/xyflow-demo'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  type TocItem,
} from '../../components/shared/docs'
import { getXyflowNavLinks } from '../../components/shared/PageNavigation'
import { TableOfContents } from '@/components/table-of-contents'

const tocItems: TocItem[] = [
  { id: 'shape', title: 'Node Shape' },
  { id: 'default-body', title: 'Default Body' },
  { id: 'custom-bodies', title: 'Custom Bodies' },
  { id: 'custom-handles', title: 'Custom Handles' },
]

const nodeShapeCode = `// A node is a plain object: id, position, data.
const nodes = [
  { id: "a", position: { x: 80, y: 30 }, data: { label: "Hello" } },
  // Optional fields:
  // - type      : key into the \`nodeTypes\` map (custom rendering)
  // - selected  : initial selection state
  // - draggable : disable per-node drag
]`

const defaultBodyCode = `import { Flow, Background } from "@/components/ui/xyflow"

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

const customNodeCode = `"use client"

import { Background, Controls, Flow, Handle } from "@/components/ui/xyflow"
import { Position } from "@barefootjs/xyflow"

const nodes = [
  { id: "src", position: { x:  80, y: 100 }, data: { label: "Source" } },
  { id: "mid", position: { x: 320, y:  80 }, data: { label: "Pipeline" } },
  { id: "dst", position: { x: 560, y: 120 }, data: { label: "Sink" } },
]
const edges = [
  { id: "src-mid", source: "src", target: "mid" },
  { id: "mid-dst", source: "mid", target: "dst" },
]

export function MyFlow() {
  return (
    <Flow
      nodes={nodes}
      edges={edges}
      renderNode={(n) => (
        <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-sm">
          {n.data.label}
          <Handle type="target" position={Position.Left}  nodeId={n.id} />
          <Handle type="source" position={Position.Right} nodeId={n.id} />
        </div>
      )}
    >
      <Background variant="cross" gap={28} />
      <Controls showInteractive={false} />
    </Flow>
  )
}`

const customHandlesCode = `// Multiple handles per node — give each one a stable \`id\`
// and reference it from the edge's \`sourceHandle\` / \`targetHandle\`.
const nodes = [
  { id: "fan", position: { x:  80, y: 120 }, data: { label: "Router" } },
  { id: "a",   position: { x: 360, y:  30 }, data: { label: "A" } },
  { id: "b",   position: { x: 360, y: 140 }, data: { label: "B" } },
  { id: "c",   position: { x: 360, y: 240 }, data: { label: "C" } },
]
const edges = [
  { id: "fan-a", source: "fan", sourceHandle: "top",    target: "a" },
  { id: "fan-b", source: "fan", sourceHandle: "right",  target: "b" },
  { id: "fan-c", source: "fan", sourceHandle: "bottom", target: "c" },
]

<Flow
  nodes={nodes}
  edges={edges}
  renderNode={(n) =>
    n.id === "fan" ? (
      <div className="rounded-md border bg-card px-3 py-2 text-sm font-medium">
        {n.data.label}
        <Handle type="source" position={Position.Top}    nodeId={n.id} id="top"    />
        <Handle type="source" position={Position.Right}  nodeId={n.id} id="right"  />
        <Handle type="source" position={Position.Bottom} nodeId={n.id} id="bottom" />
      </div>
    ) : (
      <div className="rounded-md border bg-card px-3 py-2 text-sm">
        {n.data.label}
        <Handle type="target" position={Position.Left} nodeId={n.id} />
      </div>
    )
  }
>
  <Background variant="dots" gap={30} />
</Flow>`

export function XyflowNodesPage() {
  return (
    <div className="flex gap-10">
      <div className="flex-1 min-w-0 space-y-12">
        <PageHeader
          title="Nodes"
          description="The node shape, the default rendering, and how to swap in your own body or handles."
          {...getXyflowNavLinks('nodes')}
        />

        <Section id="shape" title="Node Shape">
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
        </Section>

        <Section id="default-body" title="Default Body">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Pass nodes to <code className="text-foreground">{'<Flow>'}</code> with no{' '}
              <code className="text-foreground">nodeTypes</code> map and Flow renders each node's{' '}
              <code className="text-foreground">data.label</code> inside the built-in card —
              a target handle on top, a source handle on the bottom, themed border / fill via the
              design tokens.
            </p>
          </div>

          <Example title="Two default nodes" code={defaultBodyCode}>
            <XyflowNodesDemo />
          </Example>
        </Section>

        <Section id="custom-bodies" title="Custom Bodies">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              To customise the body — colour, layout, an icon, an inline status — pass a{' '}
              <code className="text-foreground">renderNode</code> callback to{' '}
              <code className="text-foreground">{'<Flow>'}</code>. Flow calls it once per node and forwards
              the live <code className="text-foreground">id</code> /{' '}
              <code className="text-foreground">data</code> /{' '}
              <code className="text-foreground">selected</code> as props.
            </p>
          </div>

          <Example title="Source / Pipeline / Sink" code={customNodeCode}>
            <XyflowCustomBodyDemo />
          </Example>
        </Section>

        <Section id="custom-handles" title="Custom Handles">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              The default node has one target handle on top and one source handle on the bottom. For richer
              graphs you can mount as many{' '}
              <code className="text-foreground">{'<Handle>'}</code> elements as you need, each with its own{' '}
              <code className="text-foreground">position</code> and an{' '}
              <code className="text-foreground">id</code> so edges can pin to a specific connection point
              via <code className="text-foreground">sourceHandle</code> /{' '}
              <code className="text-foreground">targetHandle</code>.
            </p>
          </div>

          <Example title="Three-way fan-out" code={customHandlesCode}>
            <XyflowCustomHandlesDemo />
          </Example>
        </Section>
      </div>
      <TableOfContents items={tocItems} />
    </div>
  )
}
