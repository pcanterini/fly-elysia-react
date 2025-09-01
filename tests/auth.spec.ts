import { test, expect } from '@playwright/test';

// Generate unique email for each test run
const generateTestEmail = () => `test_${Date.now()}@example.com`;

test.describe('Authentication Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check that login form elements are present
    await expect(page.locator('h2')).toContainText('Sign In');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Check that registration form elements are present
    await expect(page.locator('h2')).toContainText('Create Account');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('should fill registration form', async ({ page }) => {
    await page.goto('/register');
    
    const testEmail = generateTestEmail();
    const testPassword = 'TestPass123!';
    const testName = 'Test User';
    
    // Fill in registration form
    await page.locator('input[name="name"]').fill(testName);
    await page.locator('input[name="email"]').fill(testEmail);
    await page.locator('input[name="password"]').fill(testPassword);
    
    // Verify form is filled
    await expect(page.locator('input[name="name"]')).toHaveValue(testName);
    await expect(page.locator('input[name="email"]')).toHaveValue(testEmail);
    await expect(page.locator('input[name="password"]')).toHaveValue(testPassword);
  });

  test('should protect dashboard route', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h2')).toContainText('Sign In');
  });
});