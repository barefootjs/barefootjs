import { Position } from '@xyflow/system'
import type { HandleType, HandleProps } from '@xyflow/system'

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

/**
 * Default handle size in pixels.
 */
const HANDLE_SIZE = 8

/**
 * Create a handle DOM element and attach it to a node element.
 * The handle is a small circle used as a connection point.
 *
 * @param nodeElement - The node element to attach the handle to
 * @param props - Handle configuration
 * @returns The handle DOM element
 */
export function createHandle(
  nodeElement: HTMLElement,
  props: HandleProps,
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

  // Position based on handle position
  const posStyles = HANDLE_POSITION_STYLES[position]
  if (posStyles) {
    Object.assign(el.style, posStyles)
  }

  // Ensure the node has relative positioning for handle placement
  if (!nodeElement.style.position || nodeElement.style.position === 'static') {
    nodeElement.style.position = 'relative'
  }

  nodeElement.appendChild(el)

  return el
}

/**
 * Init function for Handle component within a node.
 * Reads handle configuration from props and creates the DOM element.
 */
export function initHandle(scope: Element, props: Record<string, unknown>): void {
  const nodeElement = scope as HTMLElement
  const handleProps: HandleProps = {
    type: (props.type as HandleType) ?? 'source',
    position: (props.position as Position) ?? Position.Top,
    id: (props.id as string) ?? null,
    isConnectable: (props.isConnectable as boolean) ?? true,
  }

  createHandle(nodeElement, handleProps)
}
