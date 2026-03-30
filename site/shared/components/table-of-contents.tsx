/**
 * Table of Contents Component
 *
 * Displays a sticky sidebar navigation for documentation pages.
 * Shows section links for easy navigation within the page.
 * Highlights the currently visible section using IntersectionObserver.
 */

'use client'

import { createSignal, createEffect } from '@barefootjs/dom'

export interface TocItem {
  id: string
  title: string
  // Tree branch type for CSS styling (indented child items)
  branch?: 'start' | 'child' | 'end'
}

export interface TableOfContentsProps {
  items: TocItem[]
}

export function TableOfContents(props: TableOfContentsProps) {
  if (props.items.length === 0) return null

  // Item height in pixels (py-1 = 8px padding + ~20px line-height)
  const ITEM_HEIGHT = 28

  // Use separate variable to avoid operator precedence issues in compiled output
  const initialActiveId = props.items[0]?.id ?? ''
  const [activeId, setActiveId] = createSignal<string>(initialActiveId)

  // Update indicator position when activeId changes
  // Moves both vertically (Y) and horizontally (X) for indented items
  createEffect(() => {
    const indicator = document.querySelector('[data-toc-indicator]') as HTMLElement
    if (indicator) {
      const idx = props.items.findIndex(item => item.id === activeId())
      const activeIdx = idx >= 0 ? idx : 0
      const activeItem = props.items[activeIdx]
      const xOffset = activeItem?.branch ? 8 : 0
      indicator.style.transform = `translate(${xOffset}px, ${activeIdx * ITEM_HEIGHT}px)`
    }
  })

  // Track visible sections using IntersectionObserver
  createEffect(() => {
    const sections = props.items
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    const lastItemId = props.items[props.items.length - 1]?.id

    // Check if scrolled to bottom of page
    const handleScroll = () => {
      const scrolledToBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 100
      if (scrolledToBottom && lastItemId) {
        setActiveId(lastItemId)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Check if at bottom first
        const scrolledToBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 100
        if (scrolledToBottom && lastItemId) {
          setActiveId(lastItemId)
          return
        }

        // Find the first visible section
        const visibleEntries = entries.filter(entry => entry.isIntersecting)
        if (visibleEntries.length > 0) {
          // Sort by top position and take the first one
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          setActiveId(visibleEntries[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px', // Account for header and prefer top sections
        threshold: 0,
      }
    )

    sections.forEach(section => observer.observe(section))
    window.addEventListener('scroll', handleScroll)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  })

  // Show on lg screens (1024px+) - sticky positioning within flex layout
  return (
    <nav className="hidden lg:block sticky top-[94px] w-56 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto shrink-0" aria-label="Table of contents">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">On This Page</p>
        <div className="relative">
          {/* Animated active indicator - slides along the left border line */}
          <div
            data-toc-indicator
            className="absolute w-0.5 transition-transform duration-100 ease-out z-10"
            style={`background-color: var(--gradient-start); height: ${ITEM_HEIGHT}px; left: 0;`}
          />
          <ul className="list-none m-0 p-0 text-sm">
            {props.items.map(item => (
              <li key={item.id} className="list-none m-0 p-0">
                <a
                  href={`#${item.id}`}
                  className={`block py-1 pl-3 border-0 border-l border-solid transition-colors no-underline ${
                    item.branch ? 'ml-2' : ''
                  } ${
                    activeId() === item.id
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}
