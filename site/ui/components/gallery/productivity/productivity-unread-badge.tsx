"use client"

import { createSignal } from '@barefootjs/client'
import { readUnreadMailCount } from '../../shared/gallery-productivity-storage'

// Compiler constraint: top-level conditional returns in "use client" components
// are not preserved by the compiler (SSR always renders the truthy branch).
// Workaround: wrap in a `contents` container so the conditional is an inner
// child expression — matching the AdminUnreadBadge pattern.
export function ProductivityUnreadBadge() {
  const [count, setCount] = createSignal<number>(readUnreadMailCount())

  // Each productivity route is a full page navigation so listeners don't
  // accumulate — no onCleanup needed (same pattern as AdminUnreadBadge).
  if (typeof window !== 'undefined') {
    window.addEventListener('barefoot:productivity-storage', () => setCount(readUnreadMailCount()))
  }

  return (
    <span className="contents" aria-live="polite">
      {count() > 0 ? (
        <span
          data-unread-count={count()}
          className="productivity-unread-count inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
        >
          {count()}
        </span>
      ) : null}
    </span>
  )
}
