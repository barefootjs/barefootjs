import { GalleryMeta } from './gallery-meta'
import { GalleryAppLanding } from '../gallery-app-landing'

const SOURCE_HREF = 'https://github.com/barefootjs/barefootjs/tree/main/site/ui/components/gallery/admin'

const PAGES = [
  {
    title: 'Overview',
    href: '/gallery/admin/overview',
    description: 'Dashboard overview with key metrics, recent orders, and a persistent time-range filter.',
  },
  {
    title: 'Analytics',
    href: '/gallery/admin/analytics',
    description: 'Charts and data visualization. Shares the time-range filter state with the Overview page.',
  },
  {
    title: 'Orders',
    href: '/gallery/admin/orders',
    description: 'Order management table with search, status filtering, and row actions.',
  },
  {
    title: 'Notifications',
    href: '/gallery/admin/notifications',
    description: 'Notification center with read/unread management and cross-page badge sync.',
  },
  {
    title: 'Settings',
    href: '/gallery/admin/settings',
    description: 'User and application settings with tabbed navigation for profile, team, and notifications.',
  },
]

export function GalleryAdminLandingPage() {
  return (
    <>
      <GalleryMeta appName="Admin Dashboard" sourceHref={SOURCE_HREF} />
      <GalleryAppLanding
        appName="Admin Dashboard"
        description="Multi-page admin application with analytics, order management, notifications, and settings. Demonstrates cross-page shared state and reactive layout primitives."
        pages={PAGES}
      />
    </>
  )
}
