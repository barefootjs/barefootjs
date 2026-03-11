import { test, expect } from '@playwright/test'

test.describe('Button Reference Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/button')
  })

  test('displays page heading and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Button')
    await expect(page.locator('text=Displays a button or a component that looks like a button')).toBeVisible()
  })

  test.describe('Props Playground', () => {
    test('renders preview button with default text', async ({ page }) => {
      const preview = page.locator('[data-button-preview]')
      await expect(preview.locator('button')).toContainText('Button')
    })

    test('changing children text updates preview button', async ({ page }) => {
      const preview = page.locator('[data-button-preview]')
      const section = page.locator('#preview')
      const input = section.locator('input[type="text"]')

      await input.fill('Click me')
      await expect(preview.locator('button')).toContainText('Click me')
    })
  })

  test.describe('As Child example', () => {
    test('renders link styled as button', async ({ page }) => {
      const link = page.locator('a:has-text("Go Home")').first()
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', '/')
    })

    test('navigates to home on click', async ({ page }) => {
      await page.locator('a:has-text("Go Home")').first().click()
      await expect(page).toHaveURL('/')
    })
  })
})
