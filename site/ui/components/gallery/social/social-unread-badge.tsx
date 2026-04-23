"use client"

import { createSignal } from '@barefootjs/client'
import { readUnreadMessageCount } from '../../shared/gallery-social-storage'

// Compiler constraint: top-level conditional returns in "use client" components
// are not preserved by the compiler (SSR always renders the truthy branch).
// Workaround: wrap in a `contents` container so the conditional is an inner
// child expression — matching the AdminUnreadBadge / ProductivityUnreadBadge pattern.
export function SocialUnreadBadge() {
  const [count, setCount] = createSignal<number>(readUnreadMessageCount())

  // Each social route is a full page navigation so listeners don't
  // accumulate — no onCleanup needed (same pattern as ProductivityUnreadBadge).
  if (typeof window !== 'undefined') {
    window.addEventListener('barefoot:social-storage', () => setCount(readUnreadMessageCount()))
  }

  return (
    <span className="contents" aria-live="polite">
      {count() > 0 ? (
        <span
          data-unread-count={count()}
          className="social-unread-count inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
        >
          {count()}
        </span>
      ) : null}
    </span>
  )
}
