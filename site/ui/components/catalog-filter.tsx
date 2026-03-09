"use client"
/**
 * Catalog Filter Component
 *
 * Client-side tag filtering for the component catalog.
 * Chip active states use declarative reactive className via .map().
 * Card visibility uses createEffect + DOM queries since cards
 * are rendered by a separate server component.
 * Ref: #517
 */

import { createSignal, createEffect } from '@barefootjs/dom'

const chipActive = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer select-none bg-primary text-primary-foreground'
const chipInactive = 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer select-none bg-secondary text-secondary-foreground hover:bg-secondary/80'

const tagOptions = [
  { label: 'All', value: '' },
  { label: 'Input', value: 'input' },
  { label: 'Display', value: 'display' },
  { label: 'Feedback', value: 'feedback' },
  { label: 'Navigation', value: 'navigation' },
  { label: 'Layout', value: 'layout' },
]

export function CatalogFilter() {
  const [activeTag, setActiveTag] = createSignal('')

  // Card visibility — cards are owned by ComponentCatalogPage
  createEffect(() => {
    const tag = activeTag()
    const cards = document.querySelectorAll<HTMLElement>('[data-catalog-card]')
    for (const card of cards) {
      const cardTags = (card.dataset.tags ?? '').split(' ')
      const matchesTag = !tag || cardTags.includes(tag)
      card.style.display = matchesTag ? '' : 'none'
    }
  })

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {tagOptions.map(opt => (
        <button
          type="button"
          className={activeTag() === opt.value ? chipActive : chipInactive}
          onClick={() => setActiveTag(prev => prev === opt.value ? '' : opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
