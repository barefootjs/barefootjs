'use client'

/**
 * Search Button Component
 *
 * A button that opens the command palette.
 * Displays "Search..." text with Cmd+K / Ctrl+K shortcut hint.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { SearchIcon } from '@ui/components/ui/icon'
import { Kbd } from '@ui/components/ui/kbd'

export function SearchButton() {
  // Shortcut key display (detected on client)
  const [shortcutKey, setShortcutKey] = createSignal('⌘')

  // Detect OS and set up click handler on client
  createEffect(() => {
    // Update shortcut display based on OS
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    setShortcutKey(isMac ? '⌘' : 'Ctrl')

    // Set up click handlers for both desktop and mobile buttons
    const handleClick = () => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        ctrlKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    }

    const button = document.querySelector('[data-search-button]')
    const mobileButton = document.querySelector('[data-search-button-mobile]')

    if (button) button.addEventListener('click', handleClick)
    if (mobileButton) mobileButton.addEventListener('click', handleClick)

    return () => {
      if (button) button.removeEventListener('click', handleClick)
      if (mobileButton) mobileButton.removeEventListener('click', handleClick)
    }
  })

  return (
    <>
      {/* Desktop: full search bar */}
      <button
        data-search-button
        type="button"
        className="hidden sm:flex items-center gap-2 h-9 w-64 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <SearchIcon size="sm" />
        <span className="flex-1 text-left">Search...</span>
        <Kbd className="bg-background px-1.5 font-mono text-[10px] rounded">
          <span data-shortcut-key>{shortcutKey()}</span>K
        </Kbd>
      </button>
      {/* Mobile: icon only */}
      <button
        data-search-button-mobile
        type="button"
        className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-foreground hover:bg-accent transition-colors"
        aria-label="Search"
      >
        <SearchIcon size="md" />
      </button>
    </>
  )
}
