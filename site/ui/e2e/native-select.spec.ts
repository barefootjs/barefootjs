import { test, expect } from '@playwright/test'

test.describe('NativeSelect Reference Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/native-select')
  })

  test.describe('NativeSelect Rendering', () => {
    test('displays select elements', async ({ page }) => {
      const selects = page.locator('select[data-slot="native-select"]')
      await expect(selects.first()).toBeVisible()
    })

    test('has multiple select examples', async ({ page }) => {
      const selects = page.locator('select[data-slot="native-select"]')
      // Should have at least 4 selects on the page (playground + usage + sizes + disabled + optgroup)
      expect(await selects.count()).toBeGreaterThan(3)
    })
  })

  test.describe('Sizes', () => {
    test('displays sizes section', async ({ page }) => {
      await expect(page.locator('h3:has-text("Sizes")')).toBeVisible()
    })
  })

  test.describe('Disabled', () => {
    test('displays disabled example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Disabled")')).toBeVisible()
    })

    test('has disabled select', async ({ page }) => {
      const disabledSelects = page.locator('select[data-slot="native-select"][disabled]')
      expect(await disabledSelects.count()).toBeGreaterThanOrEqual(1)
    })
  })

  test.describe('Value Binding', () => {
    test('displays value binding section', async ({ page }) => {
      await expect(page.locator('h3:has-text("Value Binding")')).toBeVisible()
      const section = page.locator('[bf-s^="NativeSelectBindingDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
    })

    test('updates output when selecting', async ({ page }) => {
      const section = page.locator('[bf-s^="NativeSelectBindingDemo_"]:not([data-slot])').first()
      const select = section.locator('select[data-slot="native-select"]')
      const output = section.locator('.selected-value')

      await select.selectOption('banana')
      await expect(output).toContainText('banana')
    })
  })

  test.describe('Form', () => {
    test('displays form example', async ({ page }) => {
      await expect(page.locator('h3:has-text("Form")')).toBeVisible()
      const section = page.locator('[bf-s^="NativeSelectFormDemo_"]:not([data-slot])').first()
      await expect(section).toBeVisible()
    })

    test('updates role when changed', async ({ page }) => {
      const section = page.locator('[bf-s^="NativeSelectFormDemo_"]:not([data-slot])').first()
      const selects = section.locator('select[data-slot="native-select"]')
      const roleOutput = section.locator('.form-role')

      await selects.first().selectOption('admin')
      await expect(roleOutput).toContainText('admin')
    })

    test('updates theme when changed', async ({ page }) => {
      const section = page.locator('[bf-s^="NativeSelectFormDemo_"]:not([data-slot])').first()
      const selects = section.locator('select[data-slot="native-select"]')
      const themeOutput = section.locator('.form-theme')

      await selects.nth(1).selectOption('dark')
      await expect(themeOutput).toContainText('dark')
    })
  })

  test.describe('With OptGroup', () => {
    test('displays optgroup example', async ({ page }) => {
      await expect(page.locator('h3:has-text("With OptGroup")')).toBeVisible()
    })

    test('has optgroup elements', async ({ page }) => {
      const optgroups = page.locator('optgroup[data-slot="native-select-optgroup"]')
      expect(await optgroups.count()).toBeGreaterThanOrEqual(2)
    })
  })
})
