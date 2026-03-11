import { test, expect } from '@playwright/test'

test.describe('Input OTP Reference Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/input-otp')
  })

  test.describe('Preview (Playground)', () => {
    test('renders OTP input in playground', async ({ page }) => {
      const preview = page.locator('[data-input-otp-preview]').first()
      await expect(preview).toBeVisible()
      // Playground renders InputOTP with hidden native input
      const input = preview.locator('input')
      await expect(input.first()).toBeAttached()
    })
  })

  test.describe('Basic', () => {
    test('renders 4 OTP slots', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPBasicDemo_"]:not([data-slot])').first()
      const slots = section.locator('[data-slot="input-otp-slot"]')
      await expect(slots).toHaveCount(4)
    })
  })

  test.describe('Pattern', () => {
    test('accepts alphanumeric characters', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPPatternDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-otp-input]')

      await input.focus()
      await input.pressSequentially('a1b2')

      const slots = section.locator('[data-slot="input-otp-slot"]')
      await expect(slots.nth(0).locator('[data-otp-char]')).toHaveText('a')
      await expect(slots.nth(1).locator('[data-otp-char]')).toHaveText('1')
      await expect(slots.nth(2).locator('[data-otp-char]')).toHaveText('b')
      await expect(slots.nth(3).locator('[data-otp-char]')).toHaveText('2')
    })
  })

  test.describe('Form', () => {
    test('verify button is disabled when incomplete', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPFormDemo_"]:not([data-slot])').first()
      const verifyButton = section.locator('button:has-text("Verify")')
      await expect(verifyButton).toBeDisabled()
    })

    test('verify button enables when all 6 digits entered', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPFormDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-otp-input]')
      const verifyButton = section.locator('button:has-text("Verify")')

      await input.focus()
      await input.pressSequentially('123456')

      await expect(verifyButton).toBeEnabled()
    })

    test('clicking verify shows loading state and success message', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPFormDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-otp-input]')

      await input.focus()
      await input.pressSequentially('123456')

      // Use programmatic click because Playwright's CDP click
      // does not trigger onclick property handlers set by hydration
      const result = await page.evaluate(() => {
        const section = document.querySelector('[bf-s^="InputOTPFormDemo_"]:not([data-slot])') as HTMLElement
        const buttons = section?.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
        const verifyBtn = Array.from(buttons).find(b => b.textContent?.includes('Verify'))
        verifyBtn?.click()
        return verifyBtn?.textContent
      })
      expect(result).toBe('Verifying...')

      await expect(section.locator('text=Code verified successfully!')).toBeVisible({ timeout: 5000 })
    })

    test('clicking verify with wrong code shows error message', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPFormDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-otp-input]')

      await input.focus()
      await input.pressSequentially('999999')

      await page.evaluate(() => {
        const section = document.querySelector('[bf-s^="InputOTPFormDemo_"]:not([data-slot])') as HTMLElement
        const buttons = section?.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
        const verifyBtn = Array.from(buttons).find(b => b.textContent?.includes('Verify'))
        verifyBtn?.click()
      })

      await expect(section.locator('text=Invalid code. Please try again.')).toBeVisible({ timeout: 5000 })
    })

    test('resend code button is initially enabled', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPFormDemo_"]:not([data-slot])').first()
      const resendButton = section.locator('button:has-text("Resend code")')
      await expect(resendButton).toBeEnabled()
    })
  })
})
