import { test, expect } from '@playwright/test'

test.describe('File Browser Block (#830)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/file-browser')
  })

  test('renders initial tree with expanded folders', async ({ page }) => {
    const section = page.locator('[bf-s^="FileBrowserDemo_"]:not([data-slot])').first()

    // Stats bar should show file count and total size
    await expect(section.locator('text=files')).toBeVisible()
    await expect(section.locator('text=selected')).toBeVisible()

    // src folder is initially expanded — its children should be visible
    await expect(section.locator('text=components')).toBeVisible()
    await expect(section.locator('text=utils')).toBeVisible()
  })

  test('expand/collapse folder toggles children visibility', async ({ page }) => {
    const section = page.locator('[bf-s^="FileBrowserDemo_"]:not([data-slot])').first()

    // utils folder is initially collapsed — its children should not be visible
    await expect(section.locator('text=format.ts')).not.toBeVisible()

    // Click utils folder to expand
    await section.locator('button:has-text("utils")').click()

    // Children should now be visible
    await expect(section.locator('text=format.ts')).toBeVisible()
    await expect(section.locator('text=cn.ts')).toBeVisible()

    // Click again to collapse
    await section.locator('button:has-text("utils")').click()

    // Children should be hidden again
    await expect(section.locator('text=format.ts')).not.toBeVisible()
  })

  test('nested folder expand shows third-level children', async ({ page }) => {
    const section = page.locator('[bf-s^="FileBrowserDemo_"]:not([data-slot])').first()

    // components folder is initially expanded — its files should be visible
    await expect(section.locator('text=Button.tsx')).toBeVisible()
    await expect(section.locator('text=Input.tsx')).toBeVisible()
    await expect(section.locator('text=Dialog.tsx')).toBeVisible()
  })

  test('checkbox selection updates selected count', async ({ page }) => {
    const section = page.locator('[bf-s^="FileBrowserDemo_"]:not([data-slot])').first()

    // Initial state: 0 selected
    await expect(section.locator('text=0 selected')).toBeVisible()

    // Click checkbox on a visible file (Button.tsx is inside components, which is expanded)
    // The checkbox is the first interactive element before the file name
    const buttonTsxRow = section.locator('text=Button.tsx').locator('..')
    const checkbox = buttonTsxRow.locator('[role="checkbox"], [type="checkbox"], [bf-s*="Checkbox"]').first()
    await checkbox.click()

    // Should show 1 selected
    await expect(section.locator('text=1 selected')).toBeVisible()
  })

  test('add file via input creates new file in folder', async ({ page }) => {
    const section = page.locator('[bf-s^="FileBrowserDemo_"]:not([data-slot])').first()

    // Find the "New file..." input inside the components folder
    const newFileInput = section.locator('input[placeholder="New file..."]').first()
    await newFileInput.fill('NewComponent.tsx')
    await newFileInput.press('Enter')

    // New file should appear in the tree
    await expect(section.locator('text=NewComponent.tsx')).toBeVisible()
  })
})
