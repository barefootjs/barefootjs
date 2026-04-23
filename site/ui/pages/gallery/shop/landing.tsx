import { GalleryMeta } from '../admin/gallery-meta'
import { GalleryAppLanding } from '../gallery-app-landing'

const SOURCE_HREF = 'https://github.com/barefootjs/barefootjs/tree/main/site/ui/components/gallery/shop'

const PAGES = [
  {
    title: 'Catalog',
    href: '/gallery/shop/catalog',
    description: 'Product grid with category filtering, add-to-cart, and a live cart count badge.',
  },
  {
    title: 'Cart',
    href: '/gallery/shop/cart',
    description: 'Shopping cart with quantity controls, item removal, and an order summary.',
  },
  {
    title: 'Checkout',
    href: '/gallery/shop/checkout',
    description: 'Multi-step checkout flow with shipping form validation and payment selection.',
  },
]

export function GalleryShopLandingPage() {
  return (
    <>
      <GalleryMeta appName="E-Commerce Shop" sourceHref={SOURCE_HREF} />
      <GalleryAppLanding
        appName="E-Commerce Shop"
        description="Online store with product catalog, shopping cart, and multi-step checkout. Cart state persists across pages via sessionStorage."
        pages={PAGES}
      />
    </>
  )
}
