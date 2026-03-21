import { test, expect } from '@playwright/test'

test.describe('Direction Reference Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/direction')
  })

  test.describe('Basic', () => {
    test('displays LTR and RTL sections', async ({ page }) => {
      const section = page.locator('[bf-s^="DirectionBasicDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()

      const ltrProvider = section.locator('[data-slot="direction-provider"][dir="ltr"]').first()
      await expect(ltrProvider).toBeVisible()
      await expect(ltrProvider).toHaveAttribute('dir', 'ltr')

      const rtlProvider = section.locator('[data-slot="direction-provider"][dir="rtl"]').first()
      await expect(rtlProvider).toBeVisible()
      await expect(rtlProvider).toHaveAttribute('dir', 'rtl')
    })

    test('LTR section contains left-to-right text', async ({ page }) => {
      const section = page.locator('[bf-s^="DirectionBasicDemo_"]:not([data-slot])').first()
      const ltrProvider = section.locator('[data-slot="direction-provider"][dir="ltr"]').first()
      await expect(ltrProvider.locator('text=Left-to-Right')).toBeVisible()
    })

    test('RTL section contains right-to-left text', async ({ page }) => {
      const section = page.locator('[bf-s^="DirectionBasicDemo_"]:not([data-slot])').first()
      const rtlProvider = section.locator('[data-slot="direction-provider"][dir="rtl"]').first()
      await expect(rtlProvider.locator('text=Right-to-Left')).toBeVisible()
    })
  })

  test.describe('Nested', () => {
    test('displays nested direction providers', async ({ page }) => {
      const section = page.locator('[bf-s^="DirectionNestedDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()

      // Outer RTL provider
      const outerRtl = section.locator('[data-slot="direction-provider"][dir="rtl"]').first()
      await expect(outerRtl).toBeVisible()

      // Inner LTR provider nested inside RTL
      const innerLtr = outerRtl.locator('[data-slot="direction-provider"][dir="ltr"]').first()
      await expect(innerLtr).toBeVisible()
      await expect(innerLtr.locator('text=Nested LTR content')).toBeVisible()
    })
  })

  test.describe('Form', () => {
    test('displays RTL form with Arabic labels', async ({ page }) => {
      const section = page.locator('[bf-s^="DirectionFormDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()

      const rtlProvider = section.locator('[data-slot="direction-provider"][dir="rtl"]').first()
      await expect(rtlProvider).toBeVisible()

      // Check form inputs exist
      const inputs = rtlProvider.locator('input')
      await expect(inputs).toHaveCount(2)
    })
  })
})
