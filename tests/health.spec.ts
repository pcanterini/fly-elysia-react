import { test, expect } from '@playwright/test';

test.describe('Application Health', () => {
  test('should display homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check main elements are present
    await expect(page.locator('h1')).toContainText('React + Vite + Elysia');
    await expect(page.locator('text=Running on Fly.io with Better-Auth')).toBeVisible();
  });

  test('should check API health status', async ({ page }) => {
    await page.goto('/');
    
    // API status should be visible
    await expect(page.locator('h2:has-text("API Status")')).toBeVisible();
    
    // Check API button should be present
    const checkButton = page.getByRole('button', { name: /check api/i });
    await expect(checkButton).toBeVisible();
    
    // Click check API button
    await checkButton.click();
    
    // Should show either connected or checking status
    await expect(page.locator('text=/API Connected|Checking API/i')).toBeVisible();
  });

  test('should have working counter demo', async ({ page }) => {
    await page.goto('/');
    
    // Find counter section
    await expect(page.locator('h2:has-text("Counter Demo")')).toBeVisible();
    
    // Initial count should be 0
    await expect(page.locator('text=Count: 0')).toBeVisible();
    
    // Click increment button
    const incrementButton = page.getByRole('button', { name: /increment/i });
    await incrementButton.click();
    
    // Count should be 1
    await expect(page.locator('text=Count: 1')).toBeVisible();
  });

  test('should navigate to login from homepage', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in button
    await page.getByRole('link', { name: /sign in/i }).click();
    
    // Should be on login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('API should return correct health response', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/health');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(json).toHaveProperty('status', 'ok');
    expect(json).toHaveProperty('message');
    expect(json).toHaveProperty('timestamp');
  });
});