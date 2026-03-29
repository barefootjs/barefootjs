import { test, expect } from '@playwright/test'

test.describe('Music Player Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/music-player')
  })

  test.describe('Initial Rendering', () => {
    test('shows track info for first track', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      await expect(section.locator('.track-title')).toHaveText('Morning Light')
      await expect(section.locator('.track-artist')).toHaveText('Solar Wave')
    })

    test('shows paused badge initially', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      await expect(section.locator('.paused-badge')).toBeVisible()
    })

    test('shows playlist with 6 tracks', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      const items = section.locator('.playlist-item')
      await expect(items).toHaveCount(6)
    })

    test('shows initial time as 0:00', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      await expect(section.locator('.current-time')).toHaveText('0:00')
    })

    test('shows volume at 75%', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      await expect(section.locator('.volume-value')).toHaveText('75%')
    })
  })

  test.describe('Playback Controls', () => {
    test('clicking play starts playback and shows playing badge', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      const playBtn = section.locator('.play-btn')

      await playBtn.click()

      // Should show playing badge
      await expect(section.locator('.playing-badge')).toBeVisible()

      // Time should advance (wait for reactive update)
      await expect(section.locator('.current-time')).not.toHaveText('0:00', { timeout: 3000 })
    })

    test('clicking pause stops playback', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      const playBtn = section.locator('.play-btn')

      // Start playing
      await playBtn.click()
      await expect(section.locator('.playing-badge')).toBeVisible()

      // Pause
      await playBtn.click()
      await expect(section.locator('.paused-badge')).toBeVisible()

      // Time should stop advancing
      const time1 = await section.locator('.current-time').textContent()
      await page.waitForTimeout(300)
      const time2 = await section.locator('.current-time').textContent()
      expect(time1).toBe(time2)
    })

    test('next track switches to second track', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()

      await section.locator('.next-btn').click()
      await expect(section.locator('.track-title')).toHaveText('Deep Blue')
      await expect(section.locator('.track-artist')).toHaveText('Ocean Drive')
    })

    test('prev track from beginning stays on first track', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()

      await section.locator('.prev-btn').click()
      await expect(section.locator('.track-title')).toHaveText('Morning Light')
    })
  })

  test.describe('Playlist Interaction', () => {
    test('clicking playlist item switches track and starts playing', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      const items = section.locator('.playlist-item')

      // Click third track
      await items.nth(2).click()

      await expect(section.locator('.track-title')).toHaveText('City Nights')
      await expect(section.locator('.track-artist')).toHaveText('Neon Pulse')
      await expect(section.locator('.playing-badge')).toBeVisible()
    })

    test('active track is highlighted in playlist', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      const items = section.locator('.playlist-item')

      // First track should have bg-accent class initially
      const firstItem = items.first()
      await expect(firstItem).toHaveClass(/bg-accent/)

      // Click third track
      await items.nth(2).click()

      // Third track should now have bg-accent
      await expect(items.nth(2)).toHaveClass(/bg-accent/)
    })
  })

  test.describe('Repeat Control', () => {
    test('cycling repeat mode changes button text', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      const repeatBtn = section.locator('.repeat-btn')

      // Initial: off
      await expect(repeatBtn).toHaveText('↻')

      // Click: all
      await repeatBtn.click()
      await expect(repeatBtn).toHaveText('↻ All')

      // Click: one
      await repeatBtn.click()
      await expect(repeatBtn).toHaveText('↻ 1')

      // Click: back to off
      await repeatBtn.click()
      await expect(repeatBtn).toHaveText('↻')
    })
  })

  test.describe('Timer and Effect Cleanup', () => {
    test('timer advances during playback and stops when paused', async ({ page }) => {
      const section = page.locator('[bf-s^="MusicPlayerDemo_"]:not([data-slot])').first()
      const playBtn = section.locator('.play-btn')

      // Start playing
      await playBtn.click()

      // Wait for time to advance
      await expect(section.locator('.current-time')).not.toHaveText('0:00', { timeout: 3000 })

      // Pause
      await playBtn.click()

      // Record time after pause
      const pausedTime = await section.locator('.current-time').textContent()
      await page.waitForTimeout(500)
      const afterWaitTime = await section.locator('.current-time').textContent()

      // Time should not advance while paused (effect cleanup working)
      expect(pausedTime).toBe(afterWaitTime)
    })
  })
})
