/**
 * SearchPlaceholder Component (shared)
 *
 * A non-interactive search button look-alike for docs/lp.
 * Same visual as SearchButton but uses <div> instead of <button>.
 * Server component (NOT "use client").
 */

function SearchPlaceholderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export function SearchPlaceholder() {
  return (
    <>
      {/* Desktop: full search bar */}
      <div className="hidden sm:flex items-center gap-2 h-9 w-64 rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
        <SearchPlaceholderIcon />
        <span className="flex-1 text-left">Search...</span>
      </div>
      {/* Mobile: icon only */}
      <div className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground">
        <SearchPlaceholderIcon />
      </div>
    </>
  )
}
