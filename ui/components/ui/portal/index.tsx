"use client"

/**
 * Portal Component
 *
 * A component that renders its children into a different part of the DOM tree.
 * Useful for modals, tooltips, and dropdowns that need to render outside
 * their parent container to avoid overflow or z-index issues.
 *
 * Uses @barefootjs/client's createPortal utility for client-side portal mounting.
 *
 * @example Basic usage with createPortal
 * ```tsx
 * import { createPortal } from '@barefootjs/client'
 *
 * function Modal() {
 *   const portal = createPortal(
 *     '<div class="modal">Modal content</div>',
 *     document.body
 *   )
 *
 *   // Later: cleanup
 *   portal.unmount()
 * }
 * ```
 */

import type { Child } from '../../../types'

/**
 * Props for the Portal component.
 */
interface PortalProps {
  /** Content to render in the portal */
  children?: Child
  /** Target container element (defaults to document.body) */
  container?: HTMLElement | null
  /** Additional CSS classes */
  className?: string
}

/**
 * Portal component placeholder for SSR rendering.
 *
 * On SSR, children are rendered inline with data-portal attribute.
 * For actual portal functionality, use createPortal from @barefootjs/client directly.
 *
 * @param props.children - Content to render
 * @param props.className - Additional CSS classes
 */
function Portal({
  children,
  className = '',
}: PortalProps) {
  return (
    <div
      data-slot="portal"
      data-portal="true"
      className={className}
    >
      {children}
    </div>
  )
}

export { Portal }
export type { PortalProps }
