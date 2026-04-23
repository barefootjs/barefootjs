interface AppCard {
  title: string
  description: string
  href: string
  pageCount: number
  gradient: string
  icon: string
}

const APPS: AppCard[] = [
  {
    title: 'Admin Dashboard',
    description: 'Multi-page admin application with analytics, orders, notifications, and settings.',
    href: '/gallery/admin',
    pageCount: 5,
    gradient: 'from-blue-500/20 to-indigo-500/20',
    icon: 'admin',
  },
  {
    title: 'E-Commerce Shop',
    description: 'Online store with product catalog, shopping cart, and multi-step checkout.',
    href: '/gallery/shop',
    pageCount: 3,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    icon: 'shop',
  },
  {
    title: 'Productivity Suite',
    description: 'Workspace application with mail, file browser, task board, and calendar.',
    href: '/gallery/productivity',
    pageCount: 4,
    gradient: 'from-violet-500/20 to-purple-500/20',
    icon: 'productivity',
  },
  {
    title: 'SaaS Marketing',
    description: 'Marketing website with landing page, pricing plans, blog, and login.',
    href: '/gallery/saas',
    pageCount: 4,
    gradient: 'from-orange-500/20 to-amber-500/20',
    icon: 'saas',
  },
  {
    title: 'Social App',
    description: 'Social platform with news feed, profiles, comment threads, and messaging.',
    href: '/gallery/social',
    pageCount: 4,
    gradient: 'from-pink-500/20 to-rose-500/20',
    icon: 'social',
  },
]

function AppIcon({ name }: { name: string }) {
  switch (name) {
    case 'admin':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="text-foreground/60">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'shop':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="text-foreground/60">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <line x1="3" x2="21" y1="6" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      )
    case 'productivity':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="text-foreground/60">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="9" x2="22" y2="9" />
          <line x1="8" y1="4" x2="8" y2="9" />
        </svg>
      )
    case 'saas':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="text-foreground/60">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      )
    case 'social':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="text-foreground/60">
          <circle cx="9" cy="7" r="4" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <circle cx="19" cy="7" r="2" />
          <path d="M23 21v-1a2 2 0 0 0-2-2h-1" />
        </svg>
      )
    default:
      return null
  }
}

export function GalleryIndexPage() {
  return (
    <div className="space-y-10">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Gallery</h1>
        <p className="text-muted-foreground leading-relaxed">
          Multi-page application demos built with BarefootJS. Each app spans multiple routes with shared layout, cross-page state, and reactive islands.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Applications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPS.map(app => (
            <a
              key={app.href}
              href={app.href}
              className="group block rounded-xl border bg-card overflow-hidden no-underline hover:shadow-md transition-shadow"
            >
              <div className={`h-28 flex items-center justify-center bg-gradient-to-br ${app.gradient}`}>
                <AppIcon name={app.icon} />
              </div>
              <div className="p-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">{app.title}</h3>
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
                <p className="text-xs text-muted-foreground leading-relaxed">{app.description}</p>
                <p className="text-xs text-muted-foreground/70">{app.pageCount} pages</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
