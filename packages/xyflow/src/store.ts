import {
  createSignal,
  createEffect,
  createMemo,
  untrack,
} from '@barefootjs/client'
import {
  adoptUserNodes,
  updateAbsolutePositions,
  updateConnectionLookup,
  fitViewport,
  panBy as panByUtil,
} from '@xyflow/system'
import type {
  NodeBase,
  EdgeBase,
  InternalNodeBase,
  Viewport,
  NodeLookup,
  ParentLookup,
  EdgeLookup,
  ConnectionLookup,
  CoordinateExtent,
  SnapGrid,
  NodeOrigin,
  Transform,
  PanZoomInstance,
  NodeDragItem,
  XYPosition,
} from '@xyflow/system'
import type { FlowStoreOptions, FlowStore, FitViewOptions } from './types'

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }
const infiniteExtent: CoordinateExtent = [
  [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
]

/**
 * Create a signal-based reactive store that bridges @xyflow/system
 * with BarefootJS reactivity.
 */
export function createFlowStore<
  NodeType extends NodeBase = NodeBase,
  EdgeType extends EdgeBase = EdgeBase,
>(options: FlowStoreOptions<NodeType, EdgeType> = {}): FlowStore<NodeType, EdgeType> {
  // --- Configuration ---
  const minZoom = options.minZoom ?? 0.5
  const maxZoom = options.maxZoom ?? 2
  const nodeOrigin: NodeOrigin = options.nodeOrigin ?? [0, 0]
  const nodeExtent: CoordinateExtent = options.nodeExtent ?? infiniteExtent
  const snapToGrid = options.snapToGrid ?? false
  const snapGrid: SnapGrid = options.snapGrid ?? [15, 15]

  // --- Core state signals ---
  const [nodes, setNodes] = createSignal<NodeType[]>(options.nodes ?? [])
  const [edges, setEdges] = createSignal<EdgeType[]>(options.edges ?? [])
  const [viewport, setViewport] = createSignal<Viewport>(
    options.defaultViewport ?? DEFAULT_VIEWPORT
  )
  const [width, setWidth] = createSignal(0)
  const [height, setHeight] = createSignal(0)
  const [dragging, setDragging] = createSignal(false)

  // --- Internal refs ---
  const [panZoom, setPanZoom] = createSignal<PanZoomInstance | null>(null)
  const [domNode, setDomNode] = createSignal<HTMLElement | null>(null)

  // --- Lookups (mutable maps, tracked via signals for change notification) ---
  const [nodeLookup, setNodeLookup] = createSignal<NodeLookup<InternalNodeBase<NodeType>>>(
    new Map()
  )
  const [parentLookup, setParentLookup] = createSignal<ParentLookup<InternalNodeBase<NodeType>>>(
    new Map()
  )
  const [edgeLookup, setEdgeLookup] = createSignal<EdgeLookup<EdgeType>>(new Map())
  const [connectionLookup, setConnectionLookup] = createSignal<ConnectionLookup>(new Map())

  // --- Derived state ---

  /**
   * Process user nodes through @xyflow/system's adoptUserNodes.
   * This populates nodeLookup/parentLookup and calculates internals.
   * Returns whether all nodes have measured dimensions.
   */
  const nodesInitialized = createMemo(() => {
    const currentNodes = nodes()
    const lookup = nodeLookup()
    const parents = parentLookup()

    const result = adoptUserNodes(currentNodes, lookup, parents, {
      nodeOrigin,
      nodeExtent,
      checkEquality: false,
    })

    updateAbsolutePositions(lookup, parents, {
      nodeOrigin,
      nodeExtent,
    })

    // Trigger signal update so dependents know lookups changed
    setNodeLookup(() => lookup)
    setParentLookup(() => parents)

    return result.nodesInitialized
  })

  // Process edges into lookup when edges change
  createEffect(() => {
    const currentEdges = edges()
    const eLookup = new Map<string, EdgeType>()
    for (const edge of currentEdges) {
      eLookup.set(edge.id, edge)
    }
    setEdgeLookup(() => eLookup)

    const connLookup = untrack(connectionLookup)
    updateConnectionLookup(connLookup, eLookup, currentEdges)
    setConnectionLookup(() => connLookup)
  })

  // --- Selection state ---
  const [multiSelectionActive, setMultiSelectionActive] = createSignal(false)

  // --- Actions ---

  function getTransform(): Transform {
    const vp = untrack(viewport)
    return [vp.x, vp.y, vp.zoom]
  }

  /**
   * Update node positions during drag operations.
   * Called by XYDrag with the current drag items.
   */
  function updateNodePositions(
    dragItems: Map<string, NodeDragItem | InternalNodeBase>,
    isDragging = true,
  ) {
    const lookup = untrack(nodeLookup)

    for (const [id, item] of dragItems) {
      const internalNode = lookup.get(id)
      if (!internalNode) continue

      internalNode.internals.positionAbsolute = item.internals
        ? (item as InternalNodeBase).internals.positionAbsolute
        : { x: (item as NodeDragItem).position.x, y: (item as NodeDragItem).position.y }

      // Update position on the user node
      const userNode = internalNode.internals.userNode
      if ('position' in item) {
        userNode.position = (item as any).position
      }

      userNode.dragging = isDragging
    }

    // Force re-render by triggering nodeLookup signal
    setNodeLookup(() => lookup)
  }

  /**
   * Deselect all nodes and edges, or specific ones.
   */
  function unselectNodesAndEdges(params?: {
    nodes?: NodeBase[]
    edges?: EdgeBase[]
  }) {
    const currentNodes = untrack(nodes)
    const currentEdges = untrack(edges)

    if (params?.nodes) {
      const idsToDeselect = new Set(params.nodes.map((n) => n.id))
      setNodes(
        currentNodes.map((n) =>
          idsToDeselect.has(n.id) ? { ...n, selected: false } : n,
        ) as NodeType[],
      )
    } else {
      setNodes(
        currentNodes.map((n) =>
          n.selected ? { ...n, selected: false } : n,
        ) as NodeType[],
      )
    }

    if (params?.edges) {
      const idsToDeselect = new Set(params.edges.map((e) => e.id))
      setEdges(
        currentEdges.map((e) =>
          idsToDeselect.has(e.id) ? { ...e, selected: false } : e,
        ) as EdgeType[],
      )
    } else {
      setEdges(
        currentEdges.map((e) =>
          e.selected ? { ...e, selected: false } : e,
        ) as EdgeType[],
      )
    }
  }

  /**
   * Pan the viewport by a delta amount.
   */
  async function panByDelta(delta: XYPosition): Promise<boolean> {
    return panByUtil({
      delta,
      panZoom: untrack(panZoom),
      transform: getTransform(),
      translateExtent: infiniteExtent,
      width: untrack(width),
      height: untrack(height),
    })
  }

  /**
   * Add a new edge to the store.
   */
  function addEdge(edge: EdgeType) {
    setEdges((prev) => [...prev, edge])
  }

  /**
   * Delete nodes and edges from the store.
   */
  function deleteElements(params: {
    nodes?: NodeType[]
    edges?: EdgeType[]
  }) {
    if (params.nodes?.length) {
      const idsToRemove = new Set(params.nodes.map((n) => n.id))
      setNodes((prev) => prev.filter((n) => !idsToRemove.has(n.id)))
      // Also remove connected edges
      setEdges((prev) =>
        prev.filter(
          (e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target),
        ),
      )
    }
    if (params.edges?.length) {
      const idsToRemove = new Set(params.edges.map((e) => e.id))
      setEdges((prev) => prev.filter((e) => !idsToRemove.has(e.id)))
    }
  }

  function fitView(fitViewOptions?: FitViewOptions) {
    const pz = untrack(panZoom)
    if (!pz) return

    const lookup = untrack(nodeLookup)
    const w = untrack(width)
    const h = untrack(height)

    fitViewport(
      {
        nodes: lookup,
        width: w,
        height: h,
        panZoom: pz,
        minZoom,
        maxZoom,
      },
      fitViewOptions
    )
  }

  return {
    // Signal getters
    nodes,
    edges,
    viewport,
    width,
    height,
    dragging,
    nodesInitialized,

    // Lookups
    nodeLookup,
    parentLookup,
    edgeLookup,
    connectionLookup,

    // Internal refs
    panZoom,
    domNode,

    // Setters
    setNodes,
    setEdges,
    setViewport,
    setWidth,
    setHeight,

    // Selection state
    multiSelectionActive,

    // Internal setters (not on public FlowStore type, but needed by initFlow)
    setDragging,
    setPanZoom,
    setDomNode,
    setMultiSelectionActive,

    // Actions
    fitView,
    updateNodePositions,
    unselectNodesAndEdges,
    panByDelta,
    addEdge,
    deleteElements,

    // Configuration
    minZoom,
    maxZoom,
    nodeOrigin,
    nodeExtent,
    snapToGrid,
    snapGrid,

    getTransform,

    // Custom types
    nodeTypes: options.nodeTypes,
    edgeTypes: options.edgeTypes,

    // Callbacks
    onConnect: options.onConnect,
    onConnectStart: options.onConnectStart,
    onConnectEnd: options.onConnectEnd,
    isValidConnection: options.isValidConnection,
  } as FlowStore<NodeType, EdgeType> & {
    setDragging: typeof setDragging
    setPanZoom: typeof setPanZoom
    setDomNode: typeof setDomNode
    setMultiSelectionActive: typeof setMultiSelectionActive
  }
}
