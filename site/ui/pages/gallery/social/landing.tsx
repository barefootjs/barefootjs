import { GalleryMeta } from '../admin/gallery-meta'
import { GalleryAppLanding } from '../gallery-app-landing'

const SOURCE_HREF = 'https://github.com/barefootjs/barefootjs/tree/main/site/ui/components/gallery/social'

const PAGES = [
  {
    title: 'Feed',
    href: '/gallery/social/feed',
    description: 'Social news feed with posts, like buttons, and reaction counts.',
  },
  {
    title: 'Profile',
    href: '/gallery/social/profile',
    description: 'User profile with tabbed content for overview, repositories, and activity.',
  },
  {
    title: 'Thread',
    href: '/gallery/social/thread',
    description: 'Comment thread with nested replies, sort controls, and a new comment form.',
  },
  {
    title: 'Messages',
    href: '/gallery/social/messages',
    description: 'Direct messaging with a conversation list and a live chat area.',
  },
]

export function GallerySocialLandingPage() {
  return (
    <>
      <GalleryMeta appName="Social App" sourceHref={SOURCE_HREF} />
      <GalleryAppLanding
        appName="Social App"
        description="Social platform with news feed, user profiles, comment threads, and direct messaging. Tests deep nested component composition and cross-page unread count state."
        pages={PAGES}
      />
    </>
  )
}
