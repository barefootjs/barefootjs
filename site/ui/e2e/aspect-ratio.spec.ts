import { test, expect } from '@playwright/test'

test.describe('Aspect Ratio Reference Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/aspect-ratio')
  })

  test.describe('Preview', () => {
    test('renders aspect ratio playground', async ({ page }) => {
      const playground = page.locator('[data-aspect-ratio-preview]')

      await expect(playground).toBeVisible()
    })
  })

  test.describe('Image Example', () => {
    test('renders image with aspect ratio container', async ({ page }) => {
      const section = page.locator('#image').locator('..')
      const container = section.locator('[data-slot="aspect-ratio"]').first()

      await expect(container).toBeVisible()
    })

    test('image is present inside container', async ({ page }) => {
      const section = page.locator('#image').locator('..')
      const img = section.locator('[data-slot="aspect-ratio"] img').first()

      await expect(img).toBeVisible()
    })
  })

  test.describe('Ratios Example', () => {
    test('renders multiple aspect ratio containers', async ({ page }) => {
      const section = page.locator('#ratios').locator('..')
      const containers = section.locator('[data-slot="aspect-ratio"]')

      await expect(containers).toHaveCount(3)
    })
  })
})
