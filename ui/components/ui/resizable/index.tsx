"use client"

// No signal imports needed — this component uses imperative DOM manipulation via ref

/**
 * Resizable Panel Components
 *
 * Accessible resizable panel groups with drag and keyboard support.
 * Inspired by shadcn/ui wrapping react-resizable-panels.
 *
 * @example
 * ```tsx
 * <ResizablePanelGroup direction="horizontal">
 *   <ResizablePanel defaultSize={50}>Left</ResizablePanel>
 *   <ResizableHandle />
 *   <ResizablePanel defaultSize={50}>Right</ResizablePanel>
 * </ResizablePanelGroup>
 * ```
 */

import type { HTMLBaseAttributes } from '@barefootjs/jsx'

// CSS classes matching shadcn/ui
const groupBaseClasses = 'flex h-full w-full'
const panelClasses = 'overflow-hidden'

const handleBaseClasses = 'bg-border relative flex items-center justify-center after:absolute focus-visible:ring-ring focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[resize-handle-state=drag]:bg-ring/50'

const handleOrientationClasses = {
  horizontal: 'w-px after:inset-y-0 after:-left-1 after:-right-1',
  vertical: 'h-px w-full after:inset-x-0 after:-top-1 after:-bottom-1',
} as const

const gripClasses = 'bg-border z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-border'

interface ResizablePanelGroupProps extends HTMLBaseAttributes {
  /** Layout direction. */
  direction: 'horizontal' | 'vertical'
  /** Panel children. */
  children?: any
  /** Callback when panel sizes change. */
  onLayout?: (sizes: number[]) => void
}

interface ResizablePanelProps extends HTMLBaseAttributes {
  /** Initial size as percentage (0-100). */
  defaultSize?: number
  /** Minimum size as percentage. */
  minSize?: number
  /** Maximum size as percentage. */
  maxSize?: number
  /** Panel content. */
  children?: any
}

interface ResizableHandleProps extends HTMLBaseAttributes {
  /** Show visible grip dots. */
  withHandle?: boolean
  /** Disable drag interaction. */
  disabled?: boolean
}

/**
 * GripVertical icon — 6-dot pattern for resize handle indicator.
 */
function GripVerticalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="size-2.5"
    >
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  )
}

/**
 * Container for resizable panels. Manages layout and drag coordination.
 */
function ResizablePanelGroup({ direction, children, className = '', onLayout, ...props }: ResizablePanelGroupProps) {
  const handleMount = (el: HTMLElement) => {
    // Initialize panel sizes from defaultSize attributes
    const panels = el.querySelectorAll(':scope > [data-slot="resizable-panel"]') as NodeListOf<HTMLElement>
    if (panels.length === 0) return

    // Collect default sizes
    const sizes: number[] = []
    let totalExplicit = 0
    let implicitCount = 0

    panels.forEach((panel) => {
      const defaultSize = panel.getAttribute('data-default-size')
      if (defaultSize) {
        const size = parseFloat(defaultSize)
        sizes.push(size)
        totalExplicit += size
      } else {
        sizes.push(-1)
        implicitCount++
      }
    })

    // Distribute remaining space to panels without explicit size
    const remaining = 100 - totalExplicit
    const implicitSize = implicitCount > 0 ? remaining / implicitCount : 0
    for (let i = 0; i < sizes.length; i++) {
      if (sizes[i] === -1) sizes[i] = implicitSize
    }

    // Apply sizes
    const applyPanelSizes = (panelSizes: number[]) => {
      panels.forEach((panel, i) => {
        const size = panelSizes[i] ?? 0
        if (direction === 'horizontal') {
          panel.style.flexBasis = `${size}%`
          panel.style.flexGrow = '0'
          panel.style.flexShrink = '0'
        } else {
          panel.style.flexBasis = `${size}%`
          panel.style.flexGrow = '0'
          panel.style.flexShrink = '0'
        }
        panel.setAttribute('data-panel-size', String(Math.round(size * 10) / 10))
      })
    }

    applyPanelSizes(sizes)

    // Notify parent
    onLayout?.(sizes)

    // Set up drag handlers on each handle
    const handles = el.querySelectorAll(':scope > [data-slot="resizable-handle"]') as NodeListOf<HTMLElement>

    handles.forEach((handle, handleIndex) => {
      if (handle.getAttribute('data-disabled') === 'true') return

      const panelBefore = panels[handleIndex]
      const panelAfter = panels[handleIndex + 1]
      if (!panelBefore || !panelAfter) return

      const getMinMax = (panel: HTMLElement) => {
        const min = parseFloat(panel.getAttribute('data-min-size') || '0')
        const max = parseFloat(panel.getAttribute('data-max-size') || '100')
        return { min, max }
      }

      // Pointer drag
      handle.addEventListener('pointerdown', (e: PointerEvent) => {
        if (handle.getAttribute('data-disabled') === 'true') return
        e.preventDefault()
        handle.setPointerCapture(e.pointerId)
        handle.setAttribute('data-resize-handle-state', 'drag')

        const groupRect = el.getBoundingClientRect()
        const sizeBefore = parseFloat(panelBefore.getAttribute('data-panel-size') || '50')
        const sizeAfter = parseFloat(panelAfter.getAttribute('data-panel-size') || '50')
        const totalSize = sizeBefore + sizeAfter
        const startPos = direction === 'horizontal' ? e.clientX : e.clientY
        const groupSize = direction === 'horizontal' ? groupRect.width : groupRect.height

        const onMove = (me: PointerEvent) => {
          const currentPos = direction === 'horizontal' ? me.clientX : me.clientY
          const delta = currentPos - startPos
          const deltaPct = (delta / groupSize) * 100

          const { min: minBefore, max: maxBefore } = getMinMax(panelBefore)
          const { min: minAfter, max: maxAfter } = getMinMax(panelAfter)

          let newBefore = sizeBefore + deltaPct
          let newAfter = sizeAfter - deltaPct

          // Clamp
          newBefore = Math.max(minBefore, Math.min(maxBefore, newBefore))
          newAfter = totalSize - newBefore
          newAfter = Math.max(minAfter, Math.min(maxAfter, newAfter))
          newBefore = totalSize - newAfter

          // Re-clamp (handles edge cases)
          newBefore = Math.max(minBefore, Math.min(maxBefore, newBefore))

          // Update current sizes array
          const currentSizes = Array.from(panels).map(
            (p) => parseFloat(p.getAttribute('data-panel-size') || '0')
          )
          currentSizes[handleIndex] = newBefore
          currentSizes[handleIndex + 1] = newAfter
          applyPanelSizes(currentSizes)
          onLayout?.(currentSizes)
        }

        const onUp = () => {
          handle.removeEventListener('pointermove', onMove)
          handle.removeEventListener('pointerup', onUp)
          handle.setAttribute('data-resize-handle-state', 'inactive')
        }

        handle.addEventListener('pointermove', onMove)
        handle.addEventListener('pointerup', onUp)
      })

      // Hover states
      handle.addEventListener('mouseenter', () => {
        if (handle.getAttribute('data-resize-handle-state') !== 'drag') {
          handle.setAttribute('data-resize-handle-state', 'hover')
        }
      })
      handle.addEventListener('mouseleave', () => {
        if (handle.getAttribute('data-resize-handle-state') !== 'drag') {
          handle.setAttribute('data-resize-handle-state', 'inactive')
        }
      })

      // Keyboard support: arrow keys resize by 5%
      handle.addEventListener('keydown', (e: KeyboardEvent) => {
        if (handle.getAttribute('data-disabled') === 'true') return

        const step = 5
        let delta = 0

        if (direction === 'horizontal') {
          if (e.key === 'ArrowLeft') delta = -step
          else if (e.key === 'ArrowRight') delta = step
          else return
        } else {
          if (e.key === 'ArrowUp') delta = -step
          else if (e.key === 'ArrowDown') delta = step
          else return
        }

        e.preventDefault()

        const { min: minBefore, max: maxBefore } = getMinMax(panelBefore)
        const { min: minAfter, max: maxAfter } = getMinMax(panelAfter)

        const currentBefore = parseFloat(panelBefore.getAttribute('data-panel-size') || '50')
        const currentAfter = parseFloat(panelAfter.getAttribute('data-panel-size') || '50')
        const total = currentBefore + currentAfter

        let newBefore = currentBefore + delta
        let newAfter = currentAfter - delta

        newBefore = Math.max(minBefore, Math.min(maxBefore, newBefore))
        newAfter = total - newBefore
        newAfter = Math.max(minAfter, Math.min(maxAfter, newAfter))
        newBefore = total - newAfter
        newBefore = Math.max(minBefore, Math.min(maxBefore, newBefore))

        const currentSizes = Array.from(panels).map(
          (p) => parseFloat(p.getAttribute('data-panel-size') || '0')
        )
        currentSizes[handleIndex] = newBefore
        currentSizes[handleIndex + 1] = newAfter
        applyPanelSizes(currentSizes)
        onLayout?.(currentSizes)
      })
    })
  }

  return (
    <div
      data-slot="resizable-panel-group"
      data-panel-group-direction={direction}
      className={`${groupBaseClasses} ${direction === 'vertical' ? 'flex-col' : ''} ${className}`}
      ref={handleMount}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * A panel within a ResizablePanelGroup.
 */
function ResizablePanel({ defaultSize, minSize, maxSize, children, className = '', ...props }: ResizablePanelProps) {
  return (
    <div
      data-slot="resizable-panel"
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
      className={`${panelClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * A draggable handle between ResizablePanels.
 */
function ResizableHandle({ withHandle, disabled, className = '', ...props }: ResizableHandleProps) {
  // Determine orientation from parent (defaults to horizontal group → vertical handle)
  // The parent sets data-panel-group-direction; handle reads it at mount
  const handleRef = (el: HTMLElement) => {
    const group = el.closest('[data-slot="resizable-panel-group"]')
    const groupDir = group?.getAttribute('data-panel-group-direction') || 'horizontal'
    // For horizontal groups, the handle divider is vertical (w-px)
    // For vertical groups, the handle divider is horizontal (h-px)
    const orientationClass = handleOrientationClasses[groupDir as 'horizontal' | 'vertical']
    el.classList.add(...orientationClass.split(' '))
  }

  return (
    <div
      data-slot="resizable-handle"
      data-resize-handle-state="inactive"
      data-disabled={disabled || undefined}
      role="separator"
      tabindex={disabled ? -1 : 0}
      className={`${handleBaseClasses} ${className}`}
      ref={handleRef}
      {...props}
    >
      {withHandle && (
        <div className={gripClasses}>
          <GripVerticalIcon />
        </div>
      )}
    </div>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
export type { ResizablePanelGroupProps, ResizablePanelProps, ResizableHandleProps }
