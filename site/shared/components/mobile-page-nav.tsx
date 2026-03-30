/**
 * Shared Mobile Page Navigation Component
 *
 * Fixed bottom navigation for mobile devices with prev/next buttons.
 * Hidden on desktop (sm:hidden). Uses inline SVGs to avoid dependency on UI icon library.
 */

export interface MobilePageNavLink {
  href: string
  title: string
}

interface MobilePageNavProps {
  prev?: MobilePageNavLink
  next?: MobilePageNavLink
}

function ChevronLeftSmall() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="shrink-0"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightSmall() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="shrink-0"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

const navLinkClass = 'flex items-center px-2 py-1.5 bg-background/95 backdrop-blur rounded-md border text-muted-foreground hover:text-foreground transition-colors no-underline'

export function MobilePageNav({ prev, next }: MobilePageNavProps) {
  if (!prev && !next) return null

  return (
    <div className="fixed bottom-6 left-18 right-4 z-[10000] sm:hidden grid grid-cols-[7rem_7rem] justify-end gap-2">
      {prev && (
        <a href={prev.href} className={navLinkClass} aria-label={`Previous: ${prev.title}`}>
          <ChevronLeftSmall />
          <span className="flex-1 text-center text-xs truncate">{prev.title}</span>
        </a>
      )}
      {!prev && <div />}
      {next && (
        <a href={next.href} className={navLinkClass} aria-label={`Next: ${next.title}`}>
          <span className="flex-1 text-center text-xs truncate">{next.title}</span>
          <ChevronRightSmall />
        </a>
      )}
    </div>
  )
}
