"use client"
/**
 * EmptyDemo Component
 *
 * Interactive demo for Empty component showing a realistic
 * empty state with icon, title, description, and action button.
 */

import { createSignal } from '@barefootjs/dom'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@ui/components/ui/empty'
import { Button } from '@ui/components/ui/button'

// Lucide Package icon (inline SVG)
function PackageIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.5 9.4 7.55 4.24" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="3.29 7 12 12 20.71 7" />
      <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="22" y2="12" />
    </svg>
  )
}

/**
 * Empty state demo with action button
 */
export function EmptyDemo() {
  const [items, setItems] = createSignal<string[]>([])

  return (
    <div className="w-full">
      {items().length === 0 ? (
        <Empty className="border border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon />
            </EmptyMedia>
            <EmptyTitle>No items yet</EmptyTitle>
            <EmptyDescription>
              Get started by adding your first item.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setItems(['Item 1'])}>
              Add item
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col items-center gap-4 p-6 border border-border rounded-lg">
          <p className="text-sm text-muted-foreground">Items: {items().join(', ')}</p>
          <Button variant="outline" onClick={() => setItems([])}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
