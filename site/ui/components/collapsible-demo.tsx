"use client"
/**
 * CollapsibleDemo Components
 *
 * Interactive demos for Collapsible component.
 * Used in collapsible documentation page.
 */

import { createSignal } from '@barefootjs/client'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@ui/components/ui/collapsible'
import { Button } from '@ui/components/ui/button'
import { ChevronDownIcon } from '@ui/components/ui/icon'

/**
 * Basic collapsible with defaultOpen and toggle button.
 * Shows a repository's starred files list.
 */
export function CollapsibleBasicDemo() {
  return (
    <div className="w-full max-w-sm">
      <Collapsible defaultOpen className="space-y-2">
        <div className="flex items-center justify-between space-x-4">
          <h4 className="text-sm font-semibold">
            @barefootjs/client has 3 repositories
          </h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDownIcon size="sm" className="transition-transform duration-normal" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs">
          @barefootjs/client
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs">
            @barefootjs/jsx
          </div>
          <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs">
            @barefootjs/adapter-hono
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/**
 * Controlled collapsible with external state management.
 * Demonstrates controlled mode with open/onOpenChange props.
 */
export function CollapsibleControlledDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div className="w-full max-w-sm space-y-4">
      <Collapsible open={open()} onOpenChange={setOpen} className="space-y-2">
        <div className="flex items-center justify-between space-x-4">
          <h4 className="text-sm font-semibold">
            Starred Repositories
          </h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDownIcon size="sm" className="transition-transform duration-normal" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs">
          solidjs/solid
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs">
            honojs/hono
          </div>
          <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs">
            unjs/nitro
          </div>
        </CollapsibleContent>
      </Collapsible>
      <p className="text-sm text-muted-foreground" data-testid="collapsible-controlled-state">
        State: {open() ? 'open' : 'closed'}
      </p>
    </div>
  )
}

/**
 * Disabled collapsible that cannot be toggled.
 */
export function CollapsibleDisabledDemo() {
  return (
    <div className="w-full max-w-sm">
      <Collapsible disabled className="space-y-2">
        <div className="flex items-center justify-between space-x-4">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Archived Repositories (disabled)
          </h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0" disabled>
              <ChevronDownIcon size="sm" className="transition-transform duration-normal" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs opacity-50">
          @barefootjs/legacy
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs">
            @barefootjs/old-adapter
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
