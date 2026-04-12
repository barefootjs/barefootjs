import { untrack } from '@barefootjs/client'
import { getBezierPath } from '@xyflow/system'
import type { FlowStore, NodeBase, EdgeBase } from './types'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Attach a connection drag handler to a handle element.
 * Called when creating each handle in node-wrapper.
 */
export function attachConnectionHandler<
  NodeType extends NodeBase = NodeBase,
  EdgeType extends EdgeBase = EdgeBase,
>(
  handleEl: HTMLElement,
  nodeId: string,
  handleType: 'source' | 'target',
  container: HTMLElement,
  edgesSvg: SVGSVGElement,
  store: FlowStore<NodeType, EdgeType>,
): void {
  handleEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    if (!untrack(store.nodesDraggable)) return

    // Stop propagation to prevent node drag
    e.stopPropagation()
    e.preventDefault()

    const handleRect = handleEl.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const [, , scale] = store.getTransform()
    const vp = untrack(store.viewport)

    const sourceX = (handleRect.left + handleRect.width / 2 - containerRect.left - vp.x) / scale
    const sourceY = (handleRect.top + handleRect.height / 2 - containerRect.top - vp.y) / scale

    // Create temporary connection line
    const connectionLine = document.createElementNS(SVG_NS, 'path')
    connectionLine.setAttribute('fill', 'none')
    connectionLine.setAttribute('stroke', '#b1b1b7')
    connectionLine.setAttribute('stroke-width', '1.5')
    connectionLine.setAttribute('stroke-dasharray', '5')
    edgesSvg.appendChild(connectionLine)

    const onMouseMove = (e: MouseEvent) => {
      const targetX = (e.clientX - containerRect.left - vp.x) / scale
      const targetY = (e.clientY - containerRect.top - vp.y) / scale

      const [path] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition: handleType === 'source' ? 'bottom' as any : 'top' as any,
        targetX,
        targetY,
        targetPosition: handleType === 'source' ? 'top' as any : 'bottom' as any,
      })

      connectionLine.setAttribute('d', path)
    }

    const onMouseUp = (e: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)

      // Check if released on a target handle
      const targetEl = document.elementFromPoint(e.clientX, e.clientY)
      const targetHandle = targetEl?.closest?.('.bf-flow__handle') as HTMLElement | null

      if (
        targetHandle &&
        targetHandle.dataset.nodeId &&
        targetHandle.dataset.nodeId !== nodeId
      ) {
        const targetNodeId = targetHandle.dataset.nodeId

        // Determine source/target based on handle types
        let source = nodeId
        let target = targetNodeId
        if (handleType === 'target') {
          source = targetNodeId
          target = nodeId
        }

        // Create edge
        const edgeId = `e-${source}-${target}-${Date.now()}`
        const newEdge = { id: edgeId, source, target } as EdgeType

        if (store.onConnect) {
          store.onConnect({ source, target, sourceHandle: null, targetHandle: null })
        }

        store.addEdge(newEdge)
      }

      // Remove connection line
      connectionLine.remove()
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  })
}
