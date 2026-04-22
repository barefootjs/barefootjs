import { ShopShell } from '@/components/gallery/shop/shop-shell'
import { CartDemo } from '@/components/cart-demo'
import { GalleryMeta } from '../admin/gallery-meta'

export function ShopCartPage() {
  return (
    <>
      <GalleryMeta appName="E-Commerce Shop" issueNumber={929} />
      <ShopShell currentRoute="cart">
        <CartDemo />
      </ShopShell>
    </>
  )
}
