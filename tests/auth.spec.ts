import { test, expect } from '@playwright/test';

// Generate unique email for each test run
const generateTestEmail = () => `test_${Date.now()}@example.com`;

test.describe('Authentication Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check that login form elements are present
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Check that registration form elements are present
    await expect(page.locator('h1')).toContainText('Sign Up');
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('should fill registration form', async ({ page }) => {
    await page.goto('/register');
    
    const testEmail = generateTestEmail();
    const testPassword = 'TestPass123!';
    const testName = 'Test User';
    
    // Fill in registration form
    await page.locator('input#name').fill(testName);
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input#password').fill(testPassword);
    await page.locator('input#confirmPassword').fill(testPassword);
    
    // Verify form is filled
    await expect(page.locator('input#name')).toHaveValue(testName);
    await expect(page.locator('input[type="email"]')).toHaveValue(testEmail);
    await expect(page.locator('input#password')).toHaveValue(testPassword);
    await expect(page.locator('input#confirmPassword')).toHaveValue(testPassword);
  });

  test('should protect dashboard route', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});