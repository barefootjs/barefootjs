// Public API for @barefootjs/xyflow.
//
// All re-exports use bare specifiers (no `.ts` extension) and
// resolve to the imperative entry points under `src/*.ts`. JSX-native
// counterparts live under `src/components/*.tsx` — they are NOT
// re-exported here today; the runtime cutover that exposes them as
// `<Flow>` / `<Background>` / etc. is a follow-up to #1081.
//
// Do not place a `.tsx` next to its `.ts` namesake under `src/`. With
// both files present, `bun build` may resolve a bare specifier to
// `.tsx`, pull `@barefootjs/jsx/jsx-dev-runtime` (types-only subpath)
// into the bundler graph, and break the build. See `README.md` for
// the full rationale.

// Core
export { initFlow } from './flow'
export { createFlowStore } from './store'
export { FlowContext } from './context'
export { createNodeWrapper, createNodeRenderer } from './node-wrapper'
export { createEdgeRenderer, createEdgeLabelRenderer } from './edge-renderer'
export { createHandle, initHandle } from './handle'
export type { HandleType, HandleProps } from './handle'
export { attachConnectionHandler, attachReconnectionHandler } from './connection'
export { initNodeResizer, ResizeControlVariant } from './node-resizer'
export type {
  NodeResizerOptions,
  ControlPosition,
  ControlLinePosition,
  OnResize,
  OnResizeStart,
  OnResizeEnd,
  ShouldResize,
  ResizeControlDirection,
} from './node-resizer'
export { useFlow, useViewport, useNodes, useEdges, useNodesInitialized, useStore, screenToFlowPosition } from './hooks'
export { setupKeyboardHandlers, setupNodeSelection, setupSelectionRectangle } from './selection'
export type { SelectionRectOptions } from './selection'

// Plugins
export { initBackground } from './background'
export type { BackgroundVariant, BackgroundProps } from './background'
export { initControls } from './controls'
export type { ControlsProps } from './controls'
export { initMiniMap } from './minimap'
export type { MiniMapProps } from './minimap'

// Types
export type {
  FlowProps,
  FlowStore,
  InternalFlowStore,
  FlowStoreOptions,
  FitViewOptions,
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
  XYPosition,
  OnConnect,
  OnConnectStart,
  OnConnectEnd,
  IsValidConnection,
  NodeDragItem,
  ConnectionMode,
  NodeComponentProps,
  EdgeComponentProps,
  SelectionMode,
  OnReconnect,
  Connection,
} from './types'

// Compat layer (React Flow API shims for desk migration)
export { useNodesState, useEdgesState, useReactFlow, addEdge, reconnectEdge } from './compat'

// Re-export useful utilities from @xyflow/system
export {
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  getConnectedEdges,
  getOutgoers,
  getIncomers,
  getNodesBounds,
  getNodesInside,
  getEdgeToolbarTransform,
  Position,
  ConnectionMode as ConnectionModeEnum,
  MarkerType,
} from '@xyflow/system'
