import { test, expect } from '@playwright/test'

test.describe('Empty Reference Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/empty')
  })

  test.describe('Props Playground', () => {
    test('changing media variant updates preview', async ({ page }) => {
      const preview = page.locator('[data-empty-preview]')
      const section = page.locator('#preview')

      // Default variant is "icon" — should have data-variant=icon
      const media = preview.locator('[data-slot="empty-icon"]')
      await expect(media).toHaveAttribute('data-variant', 'icon')

      // Open variant select and pick "default"
      await section.locator('button[role="combobox"]').first().click()
      await page.locator('[role="option"]:has-text("default")').click()

      // Media should now have default variant
      await expect(media).toHaveAttribute('data-variant', 'default')
    })
  })

  test.describe('Page Structure', () => {
    test('renders empty state components with correct data-slots', async ({ page }) => {
      // Verify usage example renders all sub-components
      const usageSection = page.locator('#usage')
      await expect(usageSection.locator('[data-slot="empty"]').first()).toBeVisible()
      await expect(usageSection.locator('[data-slot="empty-header"]').first()).toBeVisible()
      await expect(usageSection.locator('[data-slot="empty-icon"]').first()).toBeVisible()
      await expect(usageSection.locator('[data-slot="empty-title"]').first()).toBeVisible()
      await expect(usageSection.locator('[data-slot="empty-description"]').first()).toBeVisible()
      await expect(usageSection.locator('[data-slot="empty-content"]').first()).toBeVisible()
    })

    test('interactive demo renders with add item button', async ({ page }) => {
      const demo = page.locator('[bf-s^="EmptyDemo_"]:not([data-slot])')

      // Initially shows empty state with title and add button
      await expect(demo.locator('[data-slot="empty-title"]')).toContainText('No items yet')
      await expect(demo.locator('button:has-text("Add item")')).toBeVisible()
    })
  })
})
