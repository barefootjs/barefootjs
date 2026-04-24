import { test, expect } from '@playwright/test'

test.describe('Theme Customizer Block', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', error => {
      console.log('Page error:', error.message)
    })
    await page.goto('/components/theme-customizer')
  })

  const section = (page: any) =>
    page.locator('[bf-s^="ThemeCustomizerDemo_"]:not([data-slot])').first()

  // --- Initial Render ---

  test.describe('Initial Render', () => {
    test('renders controls and preview panels', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('[data-slot="controls-panel"]')).toBeVisible()
      await expect(s.locator('[data-slot="preview-panel"]')).toBeVisible()
    })

    test('renders all three control sections', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('[data-section="palette"]')).toBeVisible()
      await expect(s.locator('[data-section="spacing"]')).toBeVisible()
      await expect(s.locator('[data-section="typography"]')).toBeVisible()
    })

    test('renders preview shell with header and body', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('[data-slot="preview-shell"]')).toBeVisible()
      await expect(s.locator('[data-slot="preview-header"]')).toBeVisible()
      await expect(s.locator('[data-slot="preview-body"]')).toBeVisible()
    })

    test('renders initial custom tokens', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('[data-slot="custom-token-row"]')).toHaveCount(2)
      await expect(s.locator('.custom-token-count')).toContainText('2 tokens')
    })

    test('default spacing scale is Normal', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.spacing-scale-select')).toHaveValue('normal')
    })

    test('default font family is Sans-serif', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.font-family-select')).toHaveValue('sans')
    })

    test('default font size is Base', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('.font-size-select')).toHaveValue('base')
    })
  })

  // --- Provider Value Propagation (PaletteCtx) ---
  //
  // Changing the primary signal must update all consumers across 12 levels:
  // PreviewHeaderBrand (L8), PreviewBrandIcon (L9), PreviewSidebarItem
  // active (L10), PreviewCardHeader (L10), PreviewCardValue (L12).

  test.describe('Palette Provider Propagation', () => {
    test('primary color change propagates to brand icon background', async ({ page }) => {
      const s = section(page)
      const brandIcon = s.locator('[data-slot="preview-brand-icon"]')

      await page.evaluate(() => {
        const input = document.querySelector('.palette-primary-input') as HTMLInputElement
        input.value = '#ef4444'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      const bg = await brandIcon.evaluate((el: HTMLElement) => el.style.backgroundColor)
      // #ef4444 = rgb(239, 68, 68)
      expect(bg).toContain('239')
    })

    test('primary color change propagates to card header color', async ({ page }) => {
      const s = section(page)
      const cardHeader = s.locator('[data-slot="preview-card-header"]').first()

      await page.evaluate(() => {
        const input = document.querySelector('.palette-primary-input') as HTMLInputElement
        input.value = '#16a34a'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      const color = await cardHeader.evaluate((el: HTMLElement) => el.style.color)
      // #16a34a = rgb(22, 163, 74)
      expect(color).toContain('22')
    })

    test('primary color change propagates to card value color', async ({ page }) => {
      const s = section(page)
      const cardValues = s.locator('[data-slot="preview-card-value"][data-accent="false"]')

      await page.evaluate(() => {
        const input = document.querySelector('.palette-primary-input') as HTMLInputElement
        input.value = '#7c3aed'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      const color = await cardValues.first().evaluate((el: HTMLElement) => el.style.color)
      // #7c3aed = rgb(124, 58, 237)
      expect(color).toContain('124')
    })

    test('primary color change propagates to sidebar active item', async ({ page }) => {
      const s = section(page)
      const activeItem = s.locator('[data-slot="preview-sidebar-item"][data-active="true"]')

      await page.evaluate(() => {
        const input = document.querySelector('.palette-primary-input') as HTMLInputElement
        input.value = '#0891b2'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      const bg = await activeItem.evaluate((el: HTMLElement) => el.style.backgroundColor)
      // #0891b2 = rgb(8, 145, 178)
      expect(bg).toContain('8')
    })

    test('accent color change propagates to brand badge and accent card values', async ({ page }) => {
      const s = section(page)
      const brandBadge = s.locator('[data-slot="preview-brand-badge"]')
      const accentValues = s.locator('[data-slot="preview-card-value"][data-accent="true"]')

      await page.evaluate(() => {
        const input = document.querySelector('.palette-accent-input') as HTMLInputElement
        input.value = '#dc2626'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      const badgeBg = await brandBadge.evaluate((el: HTMLElement) => el.style.backgroundColor)
      const valueColor = await accentValues.first().evaluate((el: HTMLElement) => el.style.color)
      // #dc2626 = rgb(220, 38, 38)
      expect(badgeBg).toContain('220')
      expect(valueColor).toContain('220')
    })

    test('secondary color change propagates to nav chips', async ({ page }) => {
      const s = section(page)
      const navChips = s.locator('[data-slot="preview-nav-chip"]')

      await page.evaluate(() => {
        const input = document.querySelector('.palette-secondary-input') as HTMLInputElement
        input.value = '#9333ea'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      const color = await navChips.first().evaluate((el: HTMLElement) => el.style.color)
      // #9333ea = rgb(147, 51, 234)
      expect(color).toContain('147')
    })

    test('hex display updates when primary color changes', async ({ page }) => {
      const s = section(page)

      await page.evaluate(() => {
        const input = document.querySelector('.palette-primary-input') as HTMLInputElement
        input.value = '#123456'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      await expect(s.locator('.primary-hex')).toContainText('#123456')
    })
  })

  // --- SpacingCtx Provider Propagation ---

  test.describe('Spacing Provider Propagation', () => {
    test('compact scale shrinks sidebar width', async ({ page }) => {
      const s = section(page)
      const sidebar = s.locator('[data-slot="preview-sidebar"]')

      const normalWidth = await sidebar.evaluate((el: HTMLElement) => el.style.width)
      await s.locator('.spacing-scale-select').selectOption('compact')
      const compactWidth = await sidebar.evaluate((el: HTMLElement) => el.style.width)

      expect(compactWidth).not.toBe(normalWidth)
      expect(compactWidth).toContain('80')
    })

    test('spacious scale widens sidebar', async ({ page }) => {
      const s = section(page)
      const sidebar = s.locator('[data-slot="preview-sidebar"]')

      await s.locator('.spacing-scale-select').selectOption('spacious')
      const width = await sidebar.evaluate((el: HTMLElement) => el.style.width)
      expect(width).toContain('140')
    })

    test('spacing values display updates when scale changes', async ({ page }) => {
      const s = section(page)
      await s.locator('.spacing-scale-select').selectOption('compact')
      await expect(s.locator('.spacing-values')).toContainText('gap: 4px')
      await expect(s.locator('.spacing-values')).toContainText('padding: 8px')

      await s.locator('.spacing-scale-select').selectOption('spacious')
      await expect(s.locator('.spacing-values')).toContainText('gap: 16px')
      await expect(s.locator('.spacing-values')).toContainText('padding: 24px')
    })

    test('spacing change propagates to card body gap', async ({ page }) => {
      const s = section(page)
      const cardBody = s.locator('[data-slot="preview-card-body"]')

      await s.locator('.spacing-scale-select').selectOption('compact')
      const compactGap = await cardBody.evaluate((el: HTMLElement) => el.style.gap)

      await s.locator('.spacing-scale-select').selectOption('spacious')
      const spaciousGap = await cardBody.evaluate((el: HTMLElement) => el.style.gap)

      expect(compactGap).toBe('4px')
      expect(spaciousGap).toBe('16px')
    })
  })

  // --- TypographyCtx Provider Propagation ---

  test.describe('Typography Provider Propagation', () => {
    test('font family change propagates to brand text', async ({ page }) => {
      const s = section(page)
      const brandText = s.locator('[data-slot="preview-brand-text"]')

      await s.locator('.font-family-select').selectOption('mono')
      const fontFamily = await brandText.evaluate((el: HTMLElement) => el.style.fontFamily)
      expect(fontFamily).toContain('monospace')
    })

    test('font family change propagates to card header', async ({ page }) => {
      const s = section(page)
      const cardHeader = s.locator('[data-slot="preview-card-header"]').first()

      await s.locator('.font-family-select').selectOption('serif')
      const fontFamily = await cardHeader.evaluate((el: HTMLElement) => el.style.fontFamily)
      expect(fontFamily).toContain('serif')
    })

    test('font size change propagates to badge label', async ({ page }) => {
      const s = section(page)
      const badgeLabel = s.locator('[data-slot="preview-badge-label"]')

      await s.locator('.font-size-select').selectOption('lg')
      const fontSize = await badgeLabel.evaluate((el: HTMLElement) => el.style.fontSize)
      expect(fontSize).toBe('16px')

      await s.locator('.font-size-select').selectOption('sm')
      const fontSizeSm = await badgeLabel.evaluate((el: HTMLElement) => el.style.fontSize)
      expect(fontSizeSm).toBe('11px')
    })
  })

  // --- Multi-Provider Stale-Read Safety ---
  //
  // Change all three provider values in sequence: every consumer must reflect
  // the final state, not an intermediate snapshot from mid-render chain.

  test.describe('Multi-Provider Stale-Read Safety', () => {
    test('all three providers update independently without cross-contamination', async ({ page }) => {
      const s = section(page)
      const brandText = s.locator('[data-slot="preview-brand-text"]')
      const cardBody = s.locator('[data-slot="preview-card-body"]')

      // Change typography
      await s.locator('.font-family-select').selectOption('mono')
      // Change spacing
      await s.locator('.spacing-scale-select').selectOption('compact')
      // Change palette
      await page.evaluate(() => {
        const input = document.querySelector('.palette-primary-input') as HTMLInputElement
        input.value = '#14b8a6'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      // Typography consumer sees mono font
      const fontFamily = await brandText.evaluate((el: HTMLElement) => el.style.fontFamily)
      expect(fontFamily).toContain('monospace')

      // Spacing consumer sees compact gap
      const gap = await cardBody.evaluate((el: HTMLElement) => el.style.gap)
      expect(gap).toBe('4px')

      // Palette consumer sees new primary color
      const brandIcon = s.locator('[data-slot="preview-brand-icon"]')
      const bg = await brandIcon.evaluate((el: HTMLElement) => el.style.backgroundColor)
      // #14b8a6 = rgb(20, 184, 166)
      expect(bg).toContain('20')
    })

    test('rapid palette changes settle to the last value', async ({ page }) => {
      const s = section(page)
      const brandIcon = s.locator('[data-slot="preview-brand-icon"]')

      for (const color of ['#ef4444', '#3b82f6', '#22c55e', '#a855f7']) {
        await page.evaluate((c) => {
          const input = document.querySelector('.palette-primary-input') as HTMLInputElement
          input.value = c
          input.dispatchEvent(new Event('input', { bubbles: true }))
        }, color)
      }

      // Final value: #a855f7 = rgb(168, 85, 247)
      const bg = await brandIcon.evaluate((el: HTMLElement) => el.style.backgroundColor)
      expect(bg).toContain('168')
    })
  })

  // --- Dynamic Custom Tokens ---

  test.describe('Dynamic Custom Tokens', () => {
    test('adding a token appends it to the list', async ({ page }) => {
      const s = section(page)

      await s.locator('.add-token-name-input').fill('--hero-bg')
      await s.locator('.add-token-value-input').fill('#1e40af')
      await s.locator('.add-token-submit-btn').click()

      await expect(s.locator('[data-slot="custom-token-row"]')).toHaveCount(3)
      await expect(s.locator('.custom-token-name').last()).toHaveText('--hero-bg')
      await expect(s.locator('.custom-token-value').last()).toHaveText('#1e40af')
      await expect(s.locator('.custom-token-count')).toContainText('3 tokens')
    })

    test('add button is a no-op when fields are empty', async ({ page }) => {
      const s = section(page)
      await s.locator('.add-token-submit-btn').click()
      await expect(s.locator('[data-slot="custom-token-row"]')).toHaveCount(2)
    })

    test('inputs clear after adding a token', async ({ page }) => {
      const s = section(page)
      await s.locator('.add-token-name-input').fill('--foo')
      await s.locator('.add-token-value-input').fill('bar')
      await s.locator('.add-token-submit-btn').click()
      await expect(s.locator('.add-token-name-input')).toHaveValue('')
      await expect(s.locator('.add-token-value-input')).toHaveValue('')
    })

    test('removing a token shrinks the list', async ({ page }) => {
      const s = section(page)
      await s.locator('.custom-token-remove-btn').first().click()
      await expect(s.locator('[data-slot="custom-token-row"]')).toHaveCount(1)
      await expect(s.locator('.custom-token-count')).toContainText('1 token')
    })

    test('removing all tokens shows empty list', async ({ page }) => {
      const s = section(page)
      await s.locator('.custom-token-remove-btn').first().click()
      await s.locator('.custom-token-remove-btn').first().click()
      await expect(s.locator('[data-slot="custom-token-row"]')).toHaveCount(0)
      await expect(s.locator('.custom-token-count')).toContainText('0 tokens')
    })

    test('adding multiple tokens preserves insertion order', async ({ page }) => {
      const s = section(page)

      for (const [name, value] of [['--alpha', '#111'], ['--beta', '#222']]) {
        await s.locator('.add-token-name-input').fill(name)
        await s.locator('.add-token-value-input').fill(value)
        await s.locator('.add-token-submit-btn').click()
      }

      const names = await s.locator('.custom-token-name').allTextContents()
      const alphaIdx = names.indexOf('--alpha')
      const betaIdx = names.indexOf('--beta')
      expect(alphaIdx).toBeGreaterThanOrEqual(0)
      expect(betaIdx).toBeGreaterThan(alphaIdx)
    })
  })

  // --- Preview Structure Integrity ---
  //
  // The 12-level deep tree must render all nodes regardless of which
  // context values are active.

  test.describe('Preview Structure Integrity', () => {
    test('preview renders header brand sub-components', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('[data-slot="preview-brand-icon"]')).toBeVisible()
      await expect(s.locator('[data-slot="preview-brand-text"]')).toHaveText('AppName')
      await expect(s.locator('[data-slot="preview-brand-badge"]')).toBeVisible()
      await expect(s.locator('[data-slot="preview-badge-label"]')).toHaveText('live')
    })

    test('preview renders nav chips', async ({ page }) => {
      const s = section(page)
      const chips = s.locator('[data-slot="preview-nav-chip"]')
      await expect(chips).toHaveCount(3)
      await expect(chips.nth(0)).toHaveText('Home')
    })

    test('preview renders three sidebar items with one active', async ({ page }) => {
      const s = section(page)
      const items = s.locator('[data-slot="preview-sidebar-item"]')
      await expect(items).toHaveCount(3)
      await expect(items.filter({ hasText: 'Dashboard' })).toHaveAttribute('data-active', 'true')
      await expect(items.filter({ hasText: 'Reports' })).toHaveAttribute('data-active', 'false')
    })

    test('preview renders analytics card with card values', async ({ page }) => {
      const s = section(page)
      await expect(s.locator('[data-slot="preview-card"]')).toBeVisible()
      await expect(s.locator('[data-slot="preview-card-header"]')).toContainText('Analytics')
      await expect(s.locator('[data-slot="preview-card-value"]')).toHaveCount(3)
    })
  })
})
