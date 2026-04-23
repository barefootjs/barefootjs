interface PageLink {
  title: string
  description: string
  href: string
}

interface GalleryAppLandingProps {
  appName: string
  description: string
  pages: PageLink[]
}

export function GalleryAppLanding({ appName, description, pages }: GalleryAppLandingProps) {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{appName}</h1>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
        <p className="text-sm text-muted-foreground">{pages.length} pages</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Pages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(page => (
            <a
              key={page.href}
              href={page.href}
              className="group block rounded-xl border bg-card p-5 hover:bg-accent/50 transition-colors no-underline"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground text-sm">{page.title}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="text-muted-foreground group-hover:text-foreground transition-colors"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{page.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
