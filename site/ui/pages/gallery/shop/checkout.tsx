import { ShopShell } from '@/components/gallery/shop/shop-shell'
import { CheckoutDemo } from '@/components/checkout-demo'
import { GalleryMeta } from '../admin/gallery-meta'

export function ShopCheckoutPage() {
  return (
    <>
      <GalleryMeta appName="E-Commerce Shop" issueNumber={929} />
      <ShopShell currentRoute="checkout">
        <CheckoutDemo />
      </ShopShell>
    </>
  )
}
