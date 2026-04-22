import { ShopShell } from '@/components/gallery/shop/shop-shell'
import { ShopCatalogDemo } from '@/components/gallery/shop/catalog-demo'
import { GalleryMeta } from '../admin/gallery-meta'

export function ShopCatalogPage() {
  return (
    <>
      <GalleryMeta appName="E-Commerce Shop" issueNumber={929} />
      <ShopShell currentRoute="catalog">
        <ShopCatalogDemo />
      </ShopShell>
    </>
  )
}
