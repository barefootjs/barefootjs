import { test, expect } from '@playwright/test'

test.describe('Component Catalog Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components')
  })

  test('displays catalog header', async ({ page }) => {
    await expect(page.locator('h1:has-text("Components")')).toBeVisible()
  })

  test('displays filter chips', async ({ page }) => {
    const filterGroup = page.locator('[role="group"][aria-label="Filter by category"]')
    await expect(filterGroup).toBeVisible()

    await expect(filterGroup.locator('[data-slot="badge"]:has-text("All")')).toBeVisible()
    await expect(filterGroup.locator('[data-slot="badge"]:has-text("Input")')).toBeVisible()
    await expect(filterGroup.locator('[data-slot="badge"]:has-text("Display")')).toBeVisible()
    await expect(filterGroup.locator('[data-slot="badge"]:has-text("Feedback")')).toBeVisible()
    await expect(filterGroup.locator('[data-slot="badge"]:has-text("Navigation")')).toBeVisible()
    await expect(filterGroup.locator('[data-slot="badge"]:has-text("Layout")')).toBeVisible()
  })

  test('displays component cards in grid', async ({ page }) => {
    const cards = page.locator('[data-catalog-card]')
    // Catalog has 40+ components
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThan(30)
  })

  test('clicking tag filter hides non-matching cards', async ({ page }) => {
    const filterGroup = page.locator('[role="group"][aria-label="Filter by category"]')
    const inputChip = filterGroup.locator('[data-slot="badge"]:has-text("Input")')

    // Click "Input" filter
    await inputChip.click()

    // Input-tagged cards should be visible (e.g., Button)
    const buttonCard = page.locator('[data-catalog-card][data-tags~="input"]').first()
    await expect(buttonCard).toBeVisible()

    // Non-input cards should be hidden (e.g., Badge is display-only)
    const displayCard = page.locator('[data-catalog-card]:not([data-tags~="input"])').first()
    await expect(displayCard).toBeHidden()
  })

  test('clicking same filter again resets to show all', async ({ page }) => {
    const filterGroup = page.locator('[role="group"][aria-label="Filter by category"]')
    const inputChip = filterGroup.locator('[data-slot="badge"]:has-text("Input")')

    // Click to filter
    await inputChip.click()

    // Click again to reset
    await inputChip.click()

    // All cards should be visible again
    const allCards = page.locator('[data-catalog-card]')
    const visibleCards = allCards.filter({ has: page.locator(':visible') })
    expect(await visibleCards.count()).toBeGreaterThan(30)
  })
})
