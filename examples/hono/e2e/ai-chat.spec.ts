import { test, expect } from '@playwright/test'

test.describe('AI Chat (Streaming SSR)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-chat')
  })

  test('shows skeleton then streams chat history', async ({ page }) => {
    // Either skeleton is visible initially or chat has already resolved
    const skeleton = page.locator('.chat-skeleton')
    const chatMessages = page.locator('.chat-messages')

    await expect(skeleton.or(chatMessages)).toBeVisible({ timeout: 5000 })

    // After streaming resolves, chat messages should be visible
    await expect(chatMessages).toBeVisible({ timeout: 5000 })
    await expect(skeleton).toBeHidden()
  })

  test('displays all mock chat messages after streaming', async ({ page }) => {
    await expect(page.locator('.chat-messages')).toBeVisible({ timeout: 5000 })

    // Should have both user and assistant messages
    const userMessages = page.locator('.chat-user')
    const assistantMessages = page.locator('.chat-assistant')

    await expect(userMessages.first()).toBeVisible()
    await expect(assistantMessages.first()).toBeVisible()

    // Check specific content
    await expect(page.locator('text=BarefootJSとは何ですか')).toBeVisible()
  })

  test('streams suggested questions', async ({ page }) => {
    // Suggestions may load before or after chat history
    await expect(page.locator('.chat-suggestions')).toBeVisible({ timeout: 5000 })

    const chips = page.locator('.suggestion-chip')
    await expect(chips).toHaveCount(3)
  })

  test('counter is interactive after streaming completes', async ({ page }) => {
    // Wait for streaming to complete
    await expect(page.locator('.chat-messages')).toBeVisible({ timeout: 5000 })

    // Counter should be hydrated and functional
    await expect(page.locator('.counter-value')).toHaveText('0')
    await page.click('button:has-text("+1")')
    await expect(page.locator('.counter-value')).toHaveText('1')
  })
})
