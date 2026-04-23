import { GalleryMeta } from '../admin/gallery-meta'
import { GalleryAppLanding } from '../gallery-app-landing'

const SOURCE_HREF = 'https://github.com/barefootjs/barefootjs/tree/main/site/ui/components/gallery/productivity'

const PAGES = [
  {
    title: 'Mail',
    href: '/gallery/productivity/mail',
    description: 'Email client with inbox search, read/unread state, and a detail panel. Unread count persists across routes.',
  },
  {
    title: 'Files',
    href: '/gallery/productivity/files',
    description: 'File browser with nested folder navigation, bulk selection, and upload actions.',
  },
  {
    title: 'Board',
    href: '/gallery/productivity/board',
    description: 'Kanban board with drag-and-drop task cards across status columns.',
  },
  {
    title: 'Calendar',
    href: '/gallery/productivity/calendar',
    description: 'Calendar application with event creation, month navigation, and event detail view.',
  },
]

export function GalleryProductivityLandingPage() {
  return (
    <>
      <GalleryMeta appName="Productivity Suite" sourceHref={SOURCE_HREF} />
      <GalleryAppLanding
        appName="Productivity Suite"
        description="Workspace application with mail, file browser, task board, and calendar. Demonstrates shared layout with cross-tool navigation and unread badge state."
        pages={PAGES}
      />
    </>
  )
}
