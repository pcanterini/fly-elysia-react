import { test, expect } from '@playwright/test';

test.describe('Application Health', () => {
  test('should display homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check main elements are present
    await expect(page.locator('h1')).toContainText('Welcome to Your App');
    await expect(page.locator('text=Full-stack TypeScript on Fly.io')).toBeVisible();
  });

  test('should check API health status', async ({ page }) => {
    await page.goto('/');
    
    // API status should be visible
    await expect(page.locator('text=API Status')).toBeVisible();
    
    // Should show either online, checking, or offline status
    await expect(page.locator('text=/Online|Checking|Offline/i')).toBeVisible();
  });

  test('should have working counter demo', async ({ page }) => {
    await page.goto('/');
    
    // Find the counter section
    await expect(page.locator('text=Click Counter')).toBeVisible();
    
    // Get initial count
    const counterText = await page.locator('text=Click Counter').locator('..').textContent();
    const initialCount = parseInt(counterText?.match(/\d+/)?.[0] || '0');
    
    // Click the refresh button
    const refreshButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await refreshButton.click();
    
    // Count should increment
    await page.waitForTimeout(500);
    const newCounterText = await page.locator('text=Click Counter').locator('..').textContent();
    const newCount = parseInt(newCounterText?.match(/\d+/)?.[0] || '0');
    
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in button
    await page.getByRole('link', { name: /sign in/i }).click();
    
    // Should be on login page
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h2')).toContainText('Sign In');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    
    // Click sign up button
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Should be on register page
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('h2')).toContainText('Create Account');
  });

  test('should have responsive navigation', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Content should still be visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('h1')).toBeVisible();
  });
});