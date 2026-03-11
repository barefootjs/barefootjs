import { test, expect } from '@playwright/test'

test.describe('RadioGroup Reference Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/radio-group')
  })

  test.describe('RadioGroup Rendering', () => {
    test('displays radio elements', async ({ page }) => {
      const radios = page.locator('button[role="radio"]')
      await expect(radios.first()).toBeVisible()
    })

    test('has multiple radio examples', async ({ page }) => {
      const radios = page.locator('button[role="radio"]')
      // Should have radios on the page (preview + examples)
      expect(await radios.count()).toBeGreaterThan(3)
    })
  })

  test.describe('Basic', () => {
    test('displays basic example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Basic")')).toBeVisible()
      const section = page.locator('[bf-s^="RadioGroupBasicDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
    })

    test('has three radio items', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupBasicDemo_"]:not([data-slot])').first()
      const radios = section.locator('button[role="radio"]')
      await expect(radios).toHaveCount(3)
    })

    test('first radio starts checked (defaultValue)', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupBasicDemo_"]:not([data-slot])').first()
      const radios = section.locator('button[role="radio"]')
      await expect(radios.first()).toHaveAttribute('aria-checked', 'true')
      await expect(radios.first()).toHaveAttribute('data-state', 'checked')
    })

    test('other radios start unchecked', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupBasicDemo_"]:not([data-slot])').first()
      const radios = section.locator('button[role="radio"]')
      await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'false')
      await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'false')
    })

    test('clicking selects a radio and deselects others (exclusive selection)', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupBasicDemo_"]:not([data-slot])').first()
      const radios = section.locator('button[role="radio"]')

      // Initially "default" is selected
      await expect(radios.first()).toHaveAttribute('aria-checked', 'true')

      // Click "comfortable" (second radio)
      await radios.nth(1).click()

      // Second should be checked, first should be unchecked
      await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true')
      await expect(radios.nth(1)).toHaveAttribute('data-state', 'checked')
      await expect(radios.first()).toHaveAttribute('aria-checked', 'false')
      await expect(radios.first()).toHaveAttribute('data-state', 'unchecked')
    })

    test('shows selected value text', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupBasicDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Selected:')).toBeVisible()
      // Use first() since "default" appears in radio label and selected text
      await expect(section.locator('text=default').first()).toBeVisible()
    })

    test('updates selected text when clicking another option', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupBasicDemo_"]:not([data-slot])').first()
      const radios = section.locator('button[role="radio"]')

      // Click "compact" (third radio)
      await radios.nth(2).click()
      await expect(section.locator('text=/Selected:.*compact/')).toBeVisible()
    })
  })

  test.describe('Form', () => {
    test('displays form example with two radio groups', async ({ page }) => {
      await expect(page.locator('h3:has-text("Form")')).toBeVisible()
      const section = page.locator('[bf-s^="RadioGroupFormDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()

      // Should have 6 radio items total (3 for notify + 3 for theme)
      const radios = section.locator('button[role="radio"]')
      await expect(radios).toHaveCount(6)
    })

    test('shows notification and theme headings', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupFormDemo_"]:not([data-slot])').first()
      await expect(section.locator('h4:has-text("Notify me about")')).toBeVisible()
      await expect(section.locator('h4:has-text("Theme")')).toBeVisible()
    })

    test('default values are selected', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupFormDemo_"]:not([data-slot])').first()
      const radioGroups = section.locator('[data-slot="radio-group"]')

      // First group: "all" selected (first radio)
      const notifyRadios = radioGroups.first().locator('button[role="radio"]')
      await expect(notifyRadios.first()).toHaveAttribute('aria-checked', 'true')

      // Second group: "system" selected (third radio)
      const themeRadios = radioGroups.nth(1).locator('button[role="radio"]')
      await expect(themeRadios.nth(2)).toHaveAttribute('aria-checked', 'true')
    })

    test('independent radio groups do not interfere', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupFormDemo_"]:not([data-slot])').first()
      const radioGroups = section.locator('[data-slot="radio-group"]')

      const notifyRadios = radioGroups.first().locator('button[role="radio"]')
      const themeRadios = radioGroups.nth(1).locator('button[role="radio"]')

      // Change notification to "mentions"
      await notifyRadios.nth(1).click()
      await expect(notifyRadios.nth(1)).toHaveAttribute('aria-checked', 'true')

      // Theme should still be "system"
      await expect(themeRadios.nth(2)).toHaveAttribute('aria-checked', 'true')

      // Change theme to "dark"
      await themeRadios.nth(1).click()
      await expect(themeRadios.nth(1)).toHaveAttribute('aria-checked', 'true')

      // Notification should still be "mentions"
      await expect(notifyRadios.nth(1)).toHaveAttribute('aria-checked', 'true')
    })

    test('shows summary text', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupFormDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Notifications:')).toBeVisible()
    })
  })

  test.describe('Card', () => {
    test('displays card example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Card")')).toBeVisible()
      const section = page.locator('[bf-s^="RadioGroupCardDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
    })

    test('has three plan radio items', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupCardDemo_"]:not([data-slot])').first()
      const radios = section.locator('button[role="radio"]')
      await expect(radios).toHaveCount(3)
    })

    test('startup plan is selected by default', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupCardDemo_"]:not([data-slot])').first()
      const radios = section.locator('button[role="radio"]')
      await expect(radios.first()).toHaveAttribute('aria-checked', 'true')
      await expect(section.locator('text=/Selected plan:.*startup/')).toBeVisible()
    })

    test('clicking another plan selects it', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupCardDemo_"]:not([data-slot])').first()
      const radios = section.locator('button[role="radio"]')

      // Click "business" (second plan)
      await radios.nth(1).click()
      await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true')
      await expect(radios.first()).toHaveAttribute('aria-checked', 'false')
      await expect(section.locator('text=/Selected plan:.*business/')).toBeVisible()
    })

    test('clicking card area selects the radio', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupCardDemo_"]:not([data-slot])').first()
      const radios = section.locator('button[role="radio"]')

      // Click on the card text area (label), not the radio button directly
      const cardLabels = section.locator('label.flex')
      await cardLabels.nth(1).click()

      // "business" (second radio) should now be selected
      await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true')
      await expect(radios.first()).toHaveAttribute('aria-checked', 'false')
      await expect(section.locator('text=/Selected plan:.*business/')).toBeVisible()
    })

    test('displays plan details', async ({ page }) => {
      const section = page.locator('[bf-s^="RadioGroupCardDemo_"]:not([data-slot])').first()
      await expect(section.locator('text=Startup').first()).toBeVisible()
      await expect(section.locator('text=$29/mo').first()).toBeVisible()
      await expect(section.locator('text=Business').first()).toBeVisible()
      await expect(section.locator('text=$99/mo')).toBeVisible()
      await expect(section.locator('text=Enterprise').first()).toBeVisible()
      await expect(section.locator('text=$299/mo')).toBeVisible()
    })
  })

})
