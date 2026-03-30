/**
 * Shared Page Navigation Component
 *
 * Displays Previous/Next navigation links at the bottom of documentation pages.
 * Server component — no "use client" directive.
 * Uses inline SVGs to avoid dependency on UI icon library.
 */

export interface PageNavigationLink {
  href: string
  title: string
}

export interface PageNavigationProps {
  prev?: PageNavigationLink
  next?: PageNavigationLink
}

function ChevronLeft() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function PageNavigation({ prev, next }: PageNavigationProps) {
  if (!prev && !next) return null

  return (
    <nav className="hidden sm:flex items-center justify-between pt-8 mt-12 border-0 border-t border-solid" aria-label="Page navigation">
      {prev ? (
        <a
          href={prev.href}
          className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          <ChevronLeft />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Previous</span>
            <span className="text-xl font-medium text-foreground">{prev.title}</span>
          </div>
        </a>
      ) : (
        <div />
      )}
      {next ? (
        <a
          href={next.href}
          className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-right no-underline"
        >
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Next</span>
            <span className="text-xl font-medium text-foreground">{next.title}</span>
          </div>
          <ChevronRight />
        </a>
      ) : (
        <div />
      )}
    </nav>
  )
}
