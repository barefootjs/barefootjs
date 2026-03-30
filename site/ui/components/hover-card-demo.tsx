"use client"
/**
 * HoverCardDemo Components
 *
 * Interactive demos for HoverCard component.
 * Used in hover-card documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@ui/components/ui/hover-card'

/**
 * Preview demo - GitHub-style user profile hover card
 */
export function HoverCardPreviewDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <HoverCard open={open()} onOpenChange={setOpen}>
      <HoverCardTrigger>
        <a
          href="#"
          className="text-sm font-medium underline underline-offset-4 decoration-primary hover:text-primary"
          onClick={(e: MouseEvent) => e.preventDefault()}
        >
          @barefootjs
        </a>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80">
        <div className="flex justify-between space-x-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground text-lg font-bold shrink-0">
            B
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@barefootjs</h4>
            <p className="text-sm text-muted-foreground">
              JSX to Marked Template + client JS compiler. Signal-based reactivity for any backend.
            </p>
            <div className="flex items-center pt-2">
              <svg className="mr-2 size-4 text-muted-foreground opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span className="text-xs text-muted-foreground">
                Joined December 2024
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

/**
 * Basic demo - simple text content hover card
 */
export function HoverCardBasicDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <HoverCard open={open()} onOpenChange={setOpen}>
      <HoverCardTrigger>
        <span
          className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-default"
        >
          Hover me
        </span>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">HoverCard</h4>
          <p className="text-sm text-muted-foreground">
            A hover card displays rich content when hovering over a trigger element. It stays open while the mouse is over the trigger or the content.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
