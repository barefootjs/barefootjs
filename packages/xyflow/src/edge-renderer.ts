import {
  createEffect,
  onCleanup,
} from '@barefootjs/client'
import {
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  getEdgePosition,
  ConnectionMode,
  Position,
} from '@xyflow/system'
import type {
  NodeBase,
  EdgeBase,
  EdgePosition,
} from '@xyflow/system'
import type { FlowStore } from './types'
import { SVG_NS } from './constants'
import { attachReconnectionHandler } from './connection'

/**
 * Reactively renders all edges as SVG paths.
 * A single effect re-draws all edges when edges or node positions change.
 */
export function createEdgeRenderer<
  NodeType extends NodeBase = NodeBase,
  EdgeType extends EdgeBase = EdgeBase,
>(
  store: FlowStore<NodeType, EdgeType>,
  svgContainer: SVGSVGElement,
): void {
  // Reusable SVG group for edge paths
  const edgeGroup = document.createElementNS(SVG_NS, 'g')
  edgeGroup.setAttribute('class', 'bf-flow__edge-group')
  svgContainer.appendChild(edgeGroup)

  // Track edge path elements, hit areas, and reconnection handles by edge id
  const edgeElements = new Map<string, SVGPathElement>()
  const hitElements = new Map<string, SVGPathElement>()
  const reconnectSourceHandles = new Map<string, SVGCircleElement>()
  const reconnectTargetHandles = new Map<string, SVGCircleElement>()

  createEffect(() => {
    const edges = store.edges()
    // Re-run when node positions change during drag (lightweight epoch bump)
    // or when nodes are structurally changed (add/remove triggers nodes()).
    store.positionEpoch()
    store.nodes()
    const nodeLookup = store.nodeLookup()
    const existingIds = new Set(edgeElements.keys())

    for (const edge of edges) {
      if (edge.hidden) continue

      existingIds.delete(edge.id)

      const sourceNode = nodeLookup.get(edge.source)
      const targetNode = nodeLookup.get(edge.target)

      if (!sourceNode || !targetNode) continue

      // Get source/target positions from @xyflow/system
      let edgePos = getEdgePosition({
        id: edge.id,
        sourceNode,
        sourceHandle: edge.sourceHandle ?? null,
        targetNode,
        targetHandle: edge.targetHandle ?? null,
        connectionMode: ConnectionMode.Loose,
      })

      // Fallback: if no handle bounds, use node center positions
      if (!edgePos) {
        const sw = sourceNode.measured.width ?? 150
        const sh = sourceNode.measured.height ?? 40
        const tw = targetNode.measured.width ?? 150

        const sourcePos = sourceNode.internals.positionAbsolute
        const targetPos = targetNode.internals.positionAbsolute

        edgePos = {
          sourceX: sourcePos.x + sw / 2,
          sourceY: sourcePos.y + sh,
          targetX: targetPos.x + tw / 2,
          targetY: targetPos.y,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        }
      }

      const pathData = getEdgePath(edge, edgePos)
      if (!pathData) continue

      const [path] = pathData

      let pathEl = edgeElements.get(edge.id)
      if (!pathEl) {
        // Invisible hit area for click selection (wider than visible path)
        const hitPath = document.createElementNS(SVG_NS, 'path')
        hitPath.setAttribute('fill', 'none')
        hitPath.setAttribute('stroke', 'transparent')
        hitPath.setAttribute('stroke-width', '20')
        hitPath.dataset.hitId = edge.id
        hitPath.style.cursor = 'pointer'
        hitPath.style.pointerEvents = 'stroke'
        hitPath.addEventListener('mousedown', (e) => {
          e.stopPropagation()
          // Focus container for keyboard events (Delete)
          const container = store.domNode()
          if (container) container.focus()
          const edgeId = edge.id
          store.unselectNodesAndEdges()
          store.setEdges((prev) =>
            prev.map((ed) =>
              ed.id === edgeId ? { ...ed, selected: true } : ed,
            ),
          )
        })
        edgeGroup.appendChild(hitPath)
        hitElements.set(edge.id, hitPath)

        // Visible path
        pathEl = document.createElementNS(SVG_NS, 'path')
        pathEl.setAttribute('class', 'bf-flow__edge')
        pathEl.dataset.id = edge.id
        edgeGroup.appendChild(pathEl)
        edgeElements.set(edge.id, pathEl)
      }

      pathEl.setAttribute('d', path)

      // Update hit area path
      const hitEl = hitElements.get(edge.id)
      if (hitEl) hitEl.setAttribute('d', path)

      pathEl.classList.toggle('bf-flow__edge--selected', !!edge.selected)
      pathEl.classList.toggle('bf-flow__edge--animated', !!edge.animated)

      // Edge reconnection handles
      const isReconnectable = store.edgesReconnectable && (edge as any).reconnectable !== false
      if (isReconnectable) {
        // Source reconnection handle
        let srcHandle = reconnectSourceHandles.get(edge.id)
        if (!srcHandle) {
          srcHandle = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement
          srcHandle.setAttribute('class', 'bf-flow__edge-reconnect bf-flow__edge-reconnect--source')
          srcHandle.setAttribute('r', '5')
          srcHandle.style.cursor = 'crosshair'
          srcHandle.style.pointerEvents = 'all'
          edgeGroup.appendChild(srcHandle)
          reconnectSourceHandles.set(edge.id, srcHandle)
          // Attach reconnection handler
          const container = store.domNode()
          if (container) {
            attachReconnectionHandler(srcHandle, edge, 'source', container, svgContainer, store)
          }
        }
        srcHandle.setAttribute('cx', String(edgePos.sourceX))
        srcHandle.setAttribute('cy', String(edgePos.sourceY))

        // Target reconnection handle
        let tgtHandle = reconnectTargetHandles.get(edge.id)
        if (!tgtHandle) {
          tgtHandle = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement
          tgtHandle.setAttribute('class', 'bf-flow__edge-reconnect bf-flow__edge-reconnect--target')
          tgtHandle.setAttribute('r', '5')
          tgtHandle.style.cursor = 'crosshair'
          tgtHandle.style.pointerEvents = 'all'
          edgeGroup.appendChild(tgtHandle)
          reconnectTargetHandles.set(edge.id, tgtHandle)
          const container = store.domNode()
          if (container) {
            attachReconnectionHandler(tgtHandle, edge, 'target', container, svgContainer, store)
          }
        }
        tgtHandle.setAttribute('cx', String(edgePos.targetX))
        tgtHandle.setAttribute('cy', String(edgePos.targetY))
      }
    }

    // Remove edges that no longer exist
    for (const removedId of existingIds) {
      const el = edgeElements.get(removedId)
      if (el) { el.remove(); edgeElements.delete(removedId) }
      const hit = hitElements.get(removedId)
      if (hit) { hit.remove(); hitElements.delete(removedId) }
      const srcH = reconnectSourceHandles.get(removedId)
      if (srcH) { srcH.remove(); reconnectSourceHandles.delete(removedId) }
      const tgtH = reconnectTargetHandles.get(removedId)
      if (tgtH) { tgtH.remove(); reconnectTargetHandles.delete(removedId) }
    }
  })

  onCleanup(() => {
    edgeGroup.remove()
    edgeElements.clear()
    hitElements.clear()
    reconnectSourceHandles.clear()
    reconnectTargetHandles.clear()
  })
}

/**
 * Calculate edge path based on edge type.
 * Returns [path, labelX, labelY, offsetX, offsetY] or null.
 */
function getEdgePath(
  edge: EdgeBase,
  pos: EdgePosition,
): [string, number, number, number, number] | null {
  const params = {
    sourceX: pos.sourceX,
    sourceY: pos.sourceY,
    sourcePosition: pos.sourcePosition,
    targetX: pos.targetX,
    targetY: pos.targetY,
    targetPosition: pos.targetPosition,
  }

  const edgeType = edge.type ?? 'default'

  switch (edgeType) {
    case 'straight':
      return getStraightPath(params) as [string, number, number, number, number]
    case 'smoothstep':
    case 'step':
      return getSmoothStepPath({
        ...params,
        borderRadius: edgeType === 'step' ? 0 : undefined,
      }) as [string, number, number, number, number]
    case 'default':
    case 'bezier':
    default:
      return getBezierPath(params)
  }
}
