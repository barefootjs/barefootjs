import { test, expect } from '@playwright/test'

test.describe('Card Reference Page', () => {
  test.beforeEach(async ({ page }) => {
    // Use domcontentloaded to avoid waiting for external images (unsplash, dicebear)
    await page.goto('/components/card', { waitUntil: 'domcontentloaded' })
  })

  test('renders page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Card')
  })

  test('renders playground with card', async ({ page }) => {
    await expect(page.locator('[data-slot="card"]').first()).toBeVisible()
  })

  test('renders API reference section', async ({ page }) => {
    await expect(page.locator('#api-reference')).toBeVisible()
  })

  test.describe('Card Examples', () => {
    test('displays Image Card example (Swiss Alps Adventure)', async ({ page }) => {
      await expect(page.locator('text=Swiss Alps Adventure').first()).toBeVisible()
      await expect(page.locator('text=Experience breathtaking views').first()).toBeVisible()
    })

    test('displays Stats Cards example', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Total Sales' })).toBeVisible()
      await expect(page.locator('text=$45,231').first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Active Users' })).toBeVisible()
      await expect(page.locator('text=2,350').first()).toBeVisible()
    })

    test('displays Profile Card example', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Emily Chen' })).toBeVisible()
      await expect(page.locator('text=Senior Product Designer').first()).toBeVisible()
    })

    test('displays Login Form example', async ({ page }) => {
      const examplesSection = page.locator('#examples')
      await expect(examplesSection.getByRole('heading', { name: 'Login to your account' })).toBeVisible()
      await expect(examplesSection.getByRole('button', { name: 'Login' }).first()).toBeVisible()
    })
  })

  test.describe('Children Composition', () => {
    test('CardHeader contains CardTitle and CardDescription', async ({ page }) => {
      // Profile Card example demonstrates this well
      const profileCard = page.locator('.w-\\[350px\\]').filter({ hasText: 'Emily Chen' }).first()
      await expect(profileCard.locator('h3:has-text("Emily Chen")')).toBeVisible()
      await expect(profileCard.locator('p:has-text("Senior Product Designer")')).toBeVisible()
    })

    test('Card contains nested sub-components', async ({ page }) => {
      // Login Form Card in Examples section contains header, content, and footer areas
      const examplesSection = page.locator('#examples')
      const loginCard = examplesSection.locator('.max-w-sm[data-slot="card"]')
      await expect(loginCard.getByRole('heading', { name: 'Login to your account' })).toBeVisible()
      await expect(loginCard.getByText('Enter your email below')).toBeVisible()
      await expect(loginCard.getByRole('button', { name: 'Login' }).first()).toBeVisible()
    })
  })
})
