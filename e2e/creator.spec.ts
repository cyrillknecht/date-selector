import { test, expect } from '@playwright/test'

test.describe('Creator happy path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('login page renders email input and sign-in button', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows error feedback on invalid email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('not-an-email')
    await page.getByRole('button', { name: /sign in/i }).click()
    // browser native validation prevents submit for invalid email
    const input = page.getByLabel(/email/i)
    const validity = await input.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(validity).toBe(false)
  })

  test('dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/creator/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('flows list page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/creator/flows/some-flow-id')
    await expect(page).toHaveURL(/\/login/)
  })
})
