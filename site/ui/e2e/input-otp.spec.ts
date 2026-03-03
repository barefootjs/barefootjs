import { test, expect } from '@playwright/test'

test.describe('Input OTP Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/input-otp')
  })

  test.describe('Preview', () => {
    test('renders 6 OTP slots with separator', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPPreviewDemo_"]:not([data-slot])').first()
      const slots = section.locator('[data-slot="input-otp-slot"]')
      await expect(slots).toHaveCount(6)
    })

    test('renders separator between groups', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPPreviewDemo_"]:not([data-slot])').first()
      const separator = section.locator('[data-slot="input-otp-separator"]')
      await expect(separator).toHaveCount(1)
    })

    test('typing digits fills slots', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPPreviewDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-otp-input]')

      await input.focus()
      await input.pressSequentially('123')

      const slots = section.locator('[data-slot="input-otp-slot"]')
      await expect(slots.nth(0).locator('[data-otp-char]')).toHaveText('1')
      await expect(slots.nth(1).locator('[data-otp-char]')).toHaveText('2')
      await expect(slots.nth(2).locator('[data-otp-char]')).toHaveText('3')
    })

    test('non-digit characters are rejected', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPPreviewDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-otp-input]')

      await input.focus()
      await input.pressSequentially('1a2b3')

      const slots = section.locator('[data-slot="input-otp-slot"]')
      await expect(slots.nth(0).locator('[data-otp-char]')).toHaveText('1')
      await expect(slots.nth(1).locator('[data-otp-char]')).toHaveText('2')
      await expect(slots.nth(2).locator('[data-otp-char]')).toHaveText('3')
    })

    test('backspace removes last character', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPPreviewDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-otp-input]')

      await input.focus()
      await input.pressSequentially('12')
      await input.press('Backspace')

      const slots = section.locator('[data-slot="input-otp-slot"]')
      await expect(slots.nth(0).locator('[data-otp-char]')).toHaveText('1')
      await expect(slots.nth(1).locator('[data-otp-char]')).toHaveText('')
    })

    test('paste fills multiple slots', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPPreviewDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-otp-input]')

      await input.focus()
      // Use clipboard API to paste
      await page.evaluate(() => {
        const input = document.querySelector('input[data-otp-input]') as HTMLInputElement
        input.focus()
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: new DataTransfer(),
        })
        pasteEvent.clipboardData!.setData('text', '456789')
        input.dispatchEvent(pasteEvent)
      })

      const slots = section.locator('[data-slot="input-otp-slot"]')
      await expect(slots.nth(0).locator('[data-otp-char]')).toHaveText('4')
      await expect(slots.nth(1).locator('[data-otp-char]')).toHaveText('5')
      await expect(slots.nth(2).locator('[data-otp-char]')).toHaveText('6')
      await expect(slots.nth(3).locator('[data-otp-char]')).toHaveText('7')
      await expect(slots.nth(4).locator('[data-otp-char]')).toHaveText('8')
      await expect(slots.nth(5).locator('[data-otp-char]')).toHaveText('9')
    })

    test('input truncates at maxLength', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPPreviewDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-otp-input]')

      await input.focus()
      await input.pressSequentially('12345678')

      // Only first 6 chars should be displayed
      const slots = section.locator('[data-slot="input-otp-slot"]')
      await expect(slots.nth(5).locator('[data-otp-char]')).toHaveText('6')
    })

    test('active slot has data-active=true', async ({ page }) => {
      const section = page.locator('[bf-s^="InputOTPPreviewDemo_"]:not([data-slot])').first()
      const input = section.locator('input[data-otp-input]')

      await input.focus()

      const slots = section.locator('[data-slot="input-otp-slot"]')
      await expect(slots.nth(0)).toHaveAttribute('data-active', 'true')
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
        const btn = section?.querySelector('button[bf="s11"]') as HTMLButtonElement
        btn?.click()
        return btn?.textContent
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
        const btn = section?.querySelector('button[bf="s11"]') as HTMLButtonElement
        btn?.click()
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
