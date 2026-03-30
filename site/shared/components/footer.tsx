/**
 * Footer component (shared)
 *
 * Displays copyright and attribution. Server component (no "use client").
 */

export interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className={className || "py-8 border-t mt-16"}>
      <div className="text-center text-sm text-muted-foreground">
        <p>
          MIT License {year}{' '}
          <a
            href="https://kobaken.co"
            className="hover:text-foreground transition-colors"
          >
            kobaken
          </a>
        </p>
      </div>
    </footer>
  )
}
