import { test, expect } from '@playwright/test'

test.describe('Selector token URL', () => {
  test('invalid token shows not-found page', async ({ page }) => {
    const res = await page.goto('/00000000-0000-0000-0000-000000000000')
    // Expect either a 404 status or a "not found" message in the page
    const is404 = res?.status() === 404
    const hasNotFound = await page.getByText(/not found|invalid|expired/i).isVisible().catch(() => false)
    expect(is404 || hasNotFound).toBe(true)
  })

  test('malformed token path returns error', async ({ page }) => {
    const res = await page.goto('/not-a-uuid')
    const is404 = res?.status() === 404
    const hasError = await page.getByText(/not found|invalid|error/i).isVisible().catch(() => false)
    expect(is404 || hasError).toBe(true)
  })
})

test.describe('Selector intro screen', () => {
  // These tests require a real published flow token. Skipped in unit CI;
  // run with TEST_SELECTOR_TOKEN env var pointing to a seeded token.
  test.skip(!process.env.TEST_SELECTOR_TOKEN, 'requires TEST_SELECTOR_TOKEN env var')

  const token = process.env.TEST_SELECTOR_TOKEN ?? ''

  test('loads intro screen with start button', async ({ page }) => {
    await page.goto(`/${token}`)
    await expect(page.getByRole('heading', { name: /date night/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /let.?s start/i })).toBeVisible()
  })

  test('navigates through intro to first module step', async ({ page }) => {
    await page.goto(`/${token}`)
    await page.getByRole('button', { name: /let.?s start/i }).click()
    // Progress bar should appear after leaving intro
    await expect(page.locator('.h-1.bg-stone-100')).toBeVisible()
  })
})
