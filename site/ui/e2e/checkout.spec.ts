import { test, expect, type Locator } from '@playwright/test'

/** Fill shipping form fields and select country. */
async function fillShipping(
  section: Locator,
  data: { name: string; email: string; address: string; city: string; zip: string; country: string }
) {
  const inputs = section.locator('input')
  await inputs.nth(0).fill(data.name)
  await inputs.nth(1).fill(data.email)
  await inputs.nth(2).fill(data.address)
  await inputs.nth(3).fill(data.city)
  await inputs.nth(4).fill(data.zip)

  // Select country from native <select>
  await section.locator('select').selectOption({ label: data.country })
}

test.describe('Checkout Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/checkout')
  })

  test('renders step 1 with disabled Continue button', async ({ page }) => {
    const section = page.locator('[bf-s^="CheckoutDemo_"]:not([data-slot])').first()
    await expect(section.locator('h3:has-text("Shipping Information")')).toBeVisible()
    await expect(section.locator('button:has-text("Continue to Payment")')).toBeDisabled()
  })

  test('filling shipping form enables Continue and navigates to Payment', async ({ page }) => {
    const section = page.locator('[bf-s^="CheckoutDemo_"]:not([data-slot])').first()

    await fillShipping(section, {
      name: 'John Doe', email: 'john@example.com',
      address: '123 Main St', city: 'New York', zip: '10001', country: 'United States',
    })

    const continueBtn = section.locator('button:has-text("Continue to Payment")')
    await expect(continueBtn).toBeEnabled()

    await continueBtn.click()
    await expect(section.locator('h3:has-text("Payment Method")')).toBeVisible()
  })

  test('payment: PayPal hides card form', async ({ page }) => {
    const section = page.locator('[bf-s^="CheckoutDemo_"]:not([data-slot])').first()

    await fillShipping(section, {
      name: 'Jane', email: 'j@e.co',
      address: '456 Oak Ave', city: 'LA', zip: '90001', country: 'Canada',
    })
    await section.locator('button:has-text("Continue to Payment")').click()
    await expect(section.locator('h3:has-text("Payment Method")')).toBeVisible()

    // Credit card form visible by default
    await expect(section.locator('input[placeholder="4242 4242 4242 4242"]')).toBeVisible()

    // Switch to PayPal — find the radio button adjacent to "PayPal" text
    await section.locator('.rounded-lg.border.p-3:has-text("PayPal") button[role="radio"]').click()
    await expect(section.locator('input[placeholder="4242 4242 4242 4242"]')).not.toBeVisible()
    await expect(section.locator('text=redirected to PayPal')).toBeVisible()
  })

  test('full flow: shipping → payment → review → place order', async ({ page }) => {
    const section = page.locator('[bf-s^="CheckoutDemo_"]:not([data-slot])').first()

    // Step 1: Shipping
    await fillShipping(section, {
      name: 'Alice Smith', email: 'alice@test.com',
      address: '789 Pine Rd', city: 'Chicago', zip: '60601', country: 'United States',
    })
    await section.locator('button:has-text("Continue to Payment")').click()
    await expect(section.locator('h3:has-text("Payment Method")')).toBeVisible()

    // Step 2: Payment (PayPal)
    await section.locator('.rounded-lg.border.p-3:has-text("PayPal") button[role="radio"]').click()
    await section.locator('button:has-text("Review Order")').click()

    // Step 3: Review — composite loop inside conditional
    await expect(section.locator('h3:has-text("Review Order")')).toBeVisible()
    await expect(section.locator('text=Wireless Headphones')).toBeVisible()
    await expect(section.locator('text=USB-C Hub Adapter')).toBeVisible()
    await expect(section.locator('text=Mechanical Keyboard')).toBeVisible()
    // Remove button works (composite loop inside conditional is reactive)
    const removeBtn = section.locator('button:has-text("✕")').first()
    await removeBtn.click()
    // Should have 2 items after removing one
    await expect(section.locator('text=USB-C Hub Adapter')).toBeVisible()
    await expect(section.locator('text=Mechanical Keyboard')).toBeVisible()
    // Shipping summary
    await expect(section.locator('text=Alice Smith')).toBeVisible()

    // Place order
    await section.locator('button:has-text("Place Order")').click()
    await expect(section.locator('text=Order Placed!')).toBeVisible()
    await expect(section.locator('text=alice@test.com')).toBeVisible()
  })

  test('back button preserves form data', async ({ page }) => {
    const section = page.locator('[bf-s^="CheckoutDemo_"]:not([data-slot])').first()

    await fillShipping(section, {
      name: 'Bob', email: 'b@b.co',
      address: '1 Elm St', city: 'SF', zip: '94102', country: 'Japan',
    })
    await section.locator('button:has-text("Continue to Payment")').click()
    await section.locator('button:has-text("Back")').click()

    await expect(section.locator('h3:has-text("Shipping Information")')).toBeVisible()
    await expect(section.locator('input').nth(0)).toHaveValue('Bob')
  })
})
