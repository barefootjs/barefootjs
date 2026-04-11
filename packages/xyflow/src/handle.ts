import { untrack, useContext, createSignal } from '@barefootjs/client-runtime'
import { Position, XYHandle, ConnectionMode } from '@xyflow/system'
import type { HandleType, HandleProps, ConnectionState } from '@xyflow/system'
import { FlowContext } from './context'
import type { FlowStore } from './types'

export type { HandleType, HandleProps }

/**
 * Position CSS for handle placement on a node.
 */
const HANDLE_POSITION_STYLES: Record<string, Partial<CSSStyleDeclaration>> = {
  [Position.Top]: { left: '50%', top: '0', transform: 'translate(-50%, -50%)' },
  [Position.Bottom]: { left: '50%', bottom: '0', top: 'auto', transform: 'translate(-50%, 50%)' },
  [Position.Left]: { left: '0', top: '50%', transform: 'translate(-50%, -50%)' },
  [Position.Right]: { right: '0', left: 'auto', top: '50%', transform: 'translate(50%, -50%)' },
}

const HANDLE_SIZE = 8

/**
 * Create a handle DOM element and attach it to a node element.
 * Integrates with XYHandle for connection drag behavior.
 */
export function createHandle(
  nodeElement: HTMLElement,
  props: HandleProps & { nodeId: string },
  store?: FlowStore,
): HTMLElement {
  const handleType = props.type ?? 'source'
  const position = props.position ?? Position.Top

  const el = document.createElement('div')
  el.className = `bf-flow__handle bf-flow__handle--${handleType}`
  el.dataset.handleType = handleType
  el.dataset.handlePosition = position
  if (props.id) {
    el.dataset.handleId = props.id
  }

  // Styling
  el.style.position = 'absolute'
  el.style.width = `${HANDLE_SIZE}px`
  el.style.height = `${HANDLE_SIZE}px`
  el.style.borderRadius = '50%'
  el.style.backgroundColor = '#1a192b'
  el.style.border = '1px solid #fff'
  el.style.cursor = 'crosshair'
  el.style.pointerEvents = 'all'
  el.style.zIndex = '1'

  const posStyles = HANDLE_POSITION_STYLES[position]
  if (posStyles) {
    Object.assign(el.style, posStyles)
  }

  if (!nodeElement.style.position || nodeElement.style.position === 'static') {
    nodeElement.style.position = 'relative'
  }

  nodeElement.appendChild(el)

  // Wire up XYHandle for connection dragging
  if (store) {
    el.addEventListener('pointerdown', (event: PointerEvent) => {
      const [, setConnectionState] = createSignal<ConnectionState | null>(null)

      XYHandle.onPointerDown(event, {
        autoPanOnConnect: true,
        connectionMode: ConnectionMode.Loose,
        connectionRadius: 20,
        domNode: untrack(store.domNode) as HTMLDivElement | null,
        handleId: props.id ?? null,
        nodeId: props.nodeId,
        isTarget: handleType === 'target',
        nodeLookup: untrack(store.nodeLookup),
        lib: 'bf',
        flowId: null,
        updateConnection: (state: ConnectionState) => {
          setConnectionState(state)
          // TODO: render connection line SVG during drag
        },
        panBy: store.panByDelta,
        cancelConnection: () => {
          setConnectionState(null)
        },
        onConnectStart: store.onConnectStart,
        onConnect: store.onConnect,
        onConnectEnd: store.onConnectEnd,
        isValidConnection: store.isValidConnection,
        getTransform: store.getTransform,
        getFromHandle: () => null,
        handleDomNode: el,
      })
    })
  }

  return el
}

/**
 * Init function for Handle component within a node.
 * Reads handle configuration from props and creates the DOM element.
 */
export function initHandle(scope: Element, props: Record<string, unknown>): void {
  const nodeElement = scope as HTMLElement
  let store: FlowStore | undefined
  try {
    store = useContext(FlowContext)
  } catch {
    // No flow context available — standalone handle without connection
  }

  const handleProps = {
    type: (props.type as HandleType) ?? 'source',
    position: (props.position as Position) ?? Position.Top,
    id: (props.id as string) ?? null,
    isConnectable: (props.isConnectable as boolean) ?? true,
    nodeId: (props.nodeId as string) ?? '',
  }

  createHandle(nodeElement, handleProps, store)
}
