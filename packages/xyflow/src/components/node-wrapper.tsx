"use client"

// JSX-native NodeWrapper component (#1081 step 6).
//
// Translates the wrapper portion of `createNodeWrapper` (the per-node
// `<div>` element with reactive class + transform + selection state)
// into a `<NodeWrapper />` JSX component. The complex bookkeeping
// (dimension measurement via ResizeObserver, drag handler, handle
// bounds via @xyflow/system.updateNodeInternals, auto-pan during
// drag) stays imperative and is delegated through `ref` callbacks
// in the consolidation step — those primitives are pointer-paced
// and gain nothing from JSX bindings.
//
// Custom node content rendering (`store.nodeTypes[type]`) is the
// consumer's escape hatch; this wrapper exposes it via `children`
// so JSX-native callers can compose `<NodeWrapper>` with their own
// content directly. The imperative path's "render via createElement
// + render()" stays in node-wrapper.ts until the cutover.
//
// **Wiring status:** the imperative `createNodeWrapper` /
// `createNodeRenderer` in `node-wrapper.ts` is still the production
// code path. Replacing the call site happens in the consolidation
// step at the end of #1081.

import { createMemo, useContext } from '@barefootjs/client'
import type { JSX } from '@barefootjs/jsx/jsx-runtime'
import { FlowContext } from '../context'
import type { FlowStore } from '../types'

type Child = JSX.Element | string | number | boolean | null | undefined | Child[]

export interface NodeWrapperProps {
  /** Stable id of the node inside `store.nodeLookup()`. */
  nodeId: string
  /** Slot for node content (default rendering or custom component output). */
  children?: Child
  /**
   * Optional ref callback. The consolidation step in `node-wrapper.ts`
   * uses this to attach the imperative drag/measure/handle-bounds
   * machinery to the rendered element.
   */
  ref?: (element: HTMLElement) => void
}

export function NodeWrapper(props: NodeWrapperProps) {
  const store = useContext(FlowContext) as FlowStore | undefined

  const node = createMemo(() => {
    if (!store) return null
    // Reading `nodes()` AND `nodeLookup()` mirrors the imperative
    // wrapper effect — `positionEpoch` covers in-flight drag updates,
    // `nodes()` covers structural commits.
    store.positionEpoch()
    store.nodes()
    return store.nodeLookup().get(props.nodeId) ?? null
  })

  const transform = createMemo(() => {
    const n = node()
    if (!n) return ''
    const pos = n.internals.positionAbsolute
    return `translate(${pos.x}px, ${pos.y}px)`
  })

  const zIndex = createMemo(() => String(node()?.internals.z ?? 0))

  const className = createMemo(() => {
    const n = node()
    if (!store || !n) return 'bf-flow__node nopan'
    const isParent = store.parentLookup().has(props.nodeId)
    const isChild = !!n.internals.userNode.parentId
    const selected = !!n.selected
    let cls = 'bf-flow__node nopan'
    if (isParent) cls += ' bf-flow__node--group'
    if (isChild) cls += ' bf-flow__node--child'
    if (selected) cls += ' bf-flow__node--selected'
    return cls
  })

  const style = createMemo(
    () =>
      `position: absolute; transform-origin: 0 0; pointer-events: all; transform: ${transform()}; z-index: ${zIndex()};`,
  )

  return (
    <div
      ref={props.ref}
      className={className()}
      style={style()}
      data-id={props.nodeId}
    >
      {props.children}
    </div>
  )
}
