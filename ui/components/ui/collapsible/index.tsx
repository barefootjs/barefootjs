"use client"

/**
 * Collapsible Components
 *
 * An interactive component which expands/collapses a panel.
 * Simpler than Accordion — single panel, no multi-item management.
 *
 * State management uses createContext/useContext for parent-child communication.
 *
 * @example Basic collapsible
 * ```tsx
 * const [open, setOpen] = createSignal(false)
 *
 * <Collapsible open={open()} onOpenChange={setOpen}>
 *   <CollapsibleTrigger>Toggle</CollapsibleTrigger>
 *   <CollapsibleContent>Hidden content here</CollapsibleContent>
 * </Collapsible>
 * ```
 */

import type { HTMLBaseAttributes, ButtonHTMLAttributes } from '@barefootjs/jsx'
import { createContext, useContext, createSignal, createEffect } from '@barefootjs/dom'
import type { Child } from '../../../types'

// Context for Collapsible → children state sharing
interface CollapsibleContextValue {
  open: () => boolean
  onOpenChange: (open: boolean) => void
  disabled: () => boolean
}

const CollapsibleContext = createContext<CollapsibleContextValue>()

// CollapsibleContent base classes (uses CSS grid animation)
const collapsibleContentBaseClasses = 'grid transition-[grid-template-rows,visibility] duration-normal ease-out'

// CollapsibleContent open classes
const collapsibleContentOpenClasses = 'grid-rows-[1fr] visible'

// CollapsibleContent closed classes
const collapsibleContentClosedClasses = 'grid-rows-[0fr] invisible'

// CollapsibleContent inner classes
const collapsibleContentInnerClasses = 'overflow-hidden'

/**
 * Props for Collapsible component.
 */
interface CollapsibleProps extends HTMLBaseAttributes {
  /** Controlled open state */
  open?: boolean
  /** Default open state for uncontrolled mode */
  defaultOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Whether the collapsible is disabled */
  disabled?: boolean
  /** Child components */
  children?: Child
}

/**
 * Collapsible root component.
 * Manages open/closed state and provides context to children.
 */
function Collapsible(props: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = createSignal(props.defaultOpen ?? false)

  const isControlled = () => props.open !== undefined
  const open = () => isControlled() ? props.open! : internalOpen()

  const handleOpenChange = (value: boolean) => {
    if (props.disabled) return
    if (!isControlled()) {
      setInternalOpen(value)
    }
    props.onOpenChange?.(value)
  }

  const handleMount = (el: HTMLElement) => {
    createEffect(() => {
      el.dataset.state = open() ? 'open' : 'closed'
    })
  }

  return (
    <CollapsibleContext.Provider value={{
      open,
      onOpenChange: handleOpenChange,
      disabled: () => props.disabled ?? false,
    }}>
      <div
        id={props.id}
        data-slot="collapsible"
        data-state={props.defaultOpen ? 'open' : 'closed'}
        data-disabled={props.disabled || undefined}
        className={props.className ?? ''}
        ref={handleMount}
      >
        {props.children}
      </div>
    </CollapsibleContext.Provider>
  )
}

/**
 * Props for CollapsibleTrigger component.
 */
interface CollapsibleTriggerProps extends ButtonHTMLAttributes {
  /** Render child element as trigger instead of built-in button */
  asChild?: boolean
  /** Trigger content */
  children?: Child
}

/**
 * Clickable trigger that toggles the collapsible content.
 * Reads open state from CollapsibleContext.
 */
function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(CollapsibleContext)

    // Reactive aria-expanded
    createEffect(() => {
      el.setAttribute('aria-expanded', String(ctx.open()))
    })

    // Click handler
    el.addEventListener('click', (e: Event) => {
      e.stopPropagation()
      if (!ctx.disabled()) {
        ctx.onOpenChange(!ctx.open())
      }
    })
  }

  if (props.asChild) {
    return (
      <span
        data-slot="collapsible-trigger"
        style="display:contents"
        aria-expanded="false"
        ref={handleMount}
      >
        {props.children}
      </span>
    )
  }

  return (
    <button
      id={props.id}
      data-slot="collapsible-trigger"
      type="button"
      className={props.className ?? ''}
      aria-expanded="false"
      ref={handleMount}
    >
      {props.children}
    </button>
  )
}

/**
 * Props for CollapsibleContent component.
 */
interface CollapsibleContentProps extends HTMLBaseAttributes {
  /** Whether the content is initially open (for SSR) */
  defaultOpen?: boolean
  /** Content to display */
  children?: Child
}

/**
 * Collapsible content panel.
 * Uses CSS grid animation for smooth expand/collapse.
 */
function CollapsibleContent(props: CollapsibleContentProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(CollapsibleContext)

    createEffect(() => {
      const isOpen = ctx.open()
      el.dataset.state = isOpen ? 'open' : 'closed'
      el.className = `${collapsibleContentBaseClasses} ${isOpen ? collapsibleContentOpenClasses : collapsibleContentClosedClasses}`
    })
  }

  const className = props.className ?? ''

  const initialOpen = props.defaultOpen ?? false

  return (
    <div
      id={props.id}
      data-slot="collapsible-content"
      role="region"
      data-state={initialOpen ? 'open' : 'closed'}
      className={`${collapsibleContentBaseClasses} ${initialOpen ? collapsibleContentOpenClasses : collapsibleContentClosedClasses}`}
      ref={handleMount}
    >
      <div className={collapsibleContentInnerClasses}>
        <div className={className}>
          {props.children}
        </div>
      </div>
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
export type { CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps }
