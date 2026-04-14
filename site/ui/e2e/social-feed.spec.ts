import { test, expect } from '@playwright/test'

test.describe('Social Feed Block (#830)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/social-feed')
  })

  test('renders initial posts with stats', async ({ page }) => {
    const section = page.locator('[bf-s^="SocialFeedDemo_"]:not([data-slot])').first()

    // Stats bar should show counts
    await expect(section.locator('text=3 posts')).toBeVisible()
    await expect(section.locator('text=likes')).toBeVisible()
    await expect(section.locator('text=comments')).toBeVisible()

    // First post author should be visible
    await expect(section.locator('text=Mia Torres').first()).toBeVisible()
  })

  test('toggle comments section shows/hides comments', async ({ page }) => {
    const section = page.locator('[bf-s^="SocialFeedDemo_"]:not([data-slot])').first()

    // Mia's post has showComments: true — comments should be visible
    await expect(section.locator('text=James O\'Brien').first()).toBeVisible()

    // Noah's post has showComments: false — click to show comments
    // Find the comments toggle button on Noah's post (second post)
    const noahPost = section.locator('.rounded-lg.border').nth(1)
    const commentsBtn = noahPost.locator('button:has-text("💬")')
    await commentsBtn.click()

    // Lily's comment should now be visible
    await expect(section.locator('text=Lily Chang')).toBeVisible()

    // Click again to hide
    await commentsBtn.click()
    await expect(section.locator('text=Lily Chang')).not.toBeVisible()
  })

  test('existing replies are visible in expanded comments', async ({ page }) => {
    const section = page.locator('[bf-s^="SocialFeedDemo_"]:not([data-slot])').first()

    // Mia's post is expanded and James's comment has 1 reply from Mia
    // The reply text should be visible
    await expect(section.locator('text=I\'ll add a section on that in the follow-up')).toBeVisible()
  })

  test('add reply via input appends to reply list', async ({ page }) => {
    const section = page.locator('[bf-s^="SocialFeedDemo_"]:not([data-slot])').first()

    // Find the reply input (inside James's comment which has existing replies)
    const replyInput = section.locator('input[placeholder="Reply..."]').first()
    await replyInput.fill('Thanks for the suggestion!')
    await replyInput.press('Enter')

    // New reply should appear
    await expect(section.locator('text=Thanks for the suggestion!')).toBeVisible()

    // Input should be cleared
    await expect(replyInput).toHaveValue('')
  })

  test('like button on post toggles like state', async ({ page }) => {
    const section = page.locator('[bf-s^="SocialFeedDemo_"]:not([data-slot])').first()

    // First post (Mia's) has 42 likes, not liked
    const firstPost = section.locator('.rounded-lg.border').first()
    const likeBtn = firstPost.locator('button:has-text("♡ 42")')
    await expect(likeBtn).toBeVisible()

    // Click to like
    await likeBtn.click()

    // Should show filled heart and 43 likes
    await expect(firstPost.locator('button:has-text("♥ 43")')).toBeVisible()
  })

  test('add comment via input appends to comment list', async ({ page }) => {
    const section = page.locator('[bf-s^="SocialFeedDemo_"]:not([data-slot])').first()

    // Find the comment input in Mia's post (first expanded post)
    const commentInput = section.locator('input[placeholder="Write a comment..."]').first()
    await commentInput.fill('Great discussion!')
    await commentInput.press('Enter')

    // New comment should appear
    await expect(section.locator('text=Great discussion!')).toBeVisible()

    // Input should be cleared
    await expect(commentInput).toHaveValue('')
  })
})
