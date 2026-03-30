"use client"

/**
 * Portal Demo Components
 *
 * Demonstrates the createPortal utility from @barefootjs/dom.
 */

import { createSignal, createPortal } from '@barefootjs/dom'

/**
 * Basic portal demo - shows content rendering at document.body
 */
export function PortalBasicDemo() {
  const [open, setOpen] = createSignal(false)
  const state = { portal: null }

  const showPortal = () => {
    if (state.portal) {
      state.portal.unmount()
    }

    state.portal = createPortal(`
      <div data-portal-content class="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg z-50">
        <p class="text-sm text-foreground mb-2">Portal content at document.body</p>
        <button data-portal-close class="text-sm text-primary hover:underline">Close</button>
      </div>
    `)

    state.portal.element.querySelector('[data-portal-close]')?.addEventListener('click', hidePortal)
    setOpen(true)
  }

  const hidePortal = () => {
    if (state.portal) {
      state.portal.unmount()
      state.portal = null
    }
    setOpen(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={showPortal}
        disabled={open()}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50"
      >
        Show Portal
      </button>
    </div>
  )
}

/**
 * Portal with custom container demo
 */
export function PortalCustomContainerDemo() {
  const [open, setOpen] = createSignal(false)
  const state = { portal: null, container: null }

  const showPortal = () => {
    if (!state.container) return

    if (state.portal) {
      state.portal.unmount()
    }

    state.portal = createPortal(
      `<div data-portal-content class="bg-accent text-accent-foreground p-3 rounded-md text-sm">Rendered inside custom container</div>`,
      state.container
    )
    setOpen(true)
  }

  const hidePortal = () => {
    if (state.portal) {
      state.portal.unmount()
      state.portal = null
    }
    setOpen(false)
  }

  const setContainerRef = (el) => {
    state.container = el
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={showPortal}
          disabled={open()}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50"
        >
          Show in Container
        </button>
        <button
          type="button"
          onClick={hidePortal}
          disabled={!open()}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border bg-background hover:bg-accent h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50"
        >
          Hide
        </button>
      </div>
      <div
        ref={setContainerRef}
        data-portal-container
        className="min-h-20 border border-dashed rounded-lg p-4 flex items-center justify-center"
      >
        {!open() && <span className="text-muted-foreground text-sm">Portal container (empty)</span>}
      </div>
    </div>
  )
}
