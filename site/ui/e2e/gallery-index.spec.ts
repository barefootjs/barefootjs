import { test, expect } from '@playwright/test'

const apps = [
  { title: 'Admin Dashboard', href: '/gallery/admin' },
  { title: 'E-Commerce Shop', href: '/gallery/shop' },
  { title: 'Productivity Suite', href: '/gallery/productivity' },
  { title: 'SaaS Marketing', href: '/gallery/saas' },
  { title: 'Social App', href: '/gallery/social' },
] as const

test.describe('Gallery: Index', () => {
  test('renders the gallery index with all app cards', async ({ page }) => {
    await page.goto('/gallery')

    await expect(page.locator('main h1')).toHaveText('Gallery')

    for (const app of apps) {
      await expect(page.locator('main').locator(`a[href="${app.href}"]`)).toBeVisible()
    }
  })

  test('each app card links to the correct per-app landing page', async ({ page }) => {
    await page.goto('/gallery')

    for (const app of apps) {
      const card = page.locator('main').locator(`a[href="${app.href}"]`)
      await expect(card).toBeVisible()
    }
  })

  test.describe('Per-app landing pages', () => {
    test('admin landing shows description and page links', async ({ page }) => {
      await page.goto('/gallery/admin')

      await expect(page.locator('main h1')).toContainText('Admin Dashboard')
      await expect(page.locator('a[href="/gallery/admin/overview"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/admin/analytics"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/admin/orders"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/admin/notifications"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/admin/settings"]')).toBeVisible()
    })

    test('shop landing shows description and page links', async ({ page }) => {
      await page.goto('/gallery/shop')

      await expect(page.locator('main h1')).toContainText('E-Commerce Shop')
      await expect(page.locator('a[href="/gallery/shop/catalog"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/shop/cart"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/shop/checkout"]')).toBeVisible()
    })

    test('productivity landing shows description and page links', async ({ page }) => {
      await page.goto('/gallery/productivity')

      await expect(page.locator('main h1')).toContainText('Productivity Suite')
      await expect(page.locator('a[href="/gallery/productivity/mail"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/productivity/files"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/productivity/board"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/productivity/calendar"]')).toBeVisible()
    })

    test('social landing shows description and page links', async ({ page }) => {
      await page.goto('/gallery/social')

      await expect(page.locator('main h1')).toContainText('Social App')
      await expect(page.locator('a[href="/gallery/social/feed"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/social/profile"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/social/thread"]')).toBeVisible()
      await expect(page.locator('a[href="/gallery/social/messages"]')).toBeVisible()
    })

    test('landing pages have a back link to the gallery index', async ({ page }) => {
      // saas uses its own marketing landing page (already has nav), so skip it
      for (const app of apps.filter(a => a.href !== '/gallery/saas')) {
        await page.goto(app.href)
        // GalleryMeta back link is in main content area
        await expect(page.locator('main').locator('a[href="/gallery"]').first()).toBeVisible()
      }
    })

    test('landing pages have a theme toggle button', async ({ page }) => {
      await page.goto('/gallery/admin')
      // GalleryMeta ThemeSwitcher is in main content (not in header)
      const themeBtn = page.locator('main').locator('button[aria-label*="mode"]')
      await expect(themeBtn).toBeVisible()
    })
  })
})
