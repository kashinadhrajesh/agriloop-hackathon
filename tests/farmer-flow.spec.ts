import { test, expect } from '@playwright/test';

test.describe('Farmer Flow MVP', () => {
  const testEmail = `test_farmer_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  test('TC04, TC05 & TC06: Complete Farmer Flow', async ({ page }) => {
    // 1. Go to Register page
    await page.goto('/register');
    
    // 2. Fill out the form
    await page.fill('input[name="fullName"]', 'Test Farmer');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // 3. Select Farmer role
    await page.click('button:has-text("Farmer")');
    
    // 4. Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to login
    await page.waitForURL(/\/login/);

    // 5. Log in with the newly created account
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to Farmer Dashboard
    await page.waitForURL(/\/farmer\/dashboard/);
    await expect(page.locator('h1:has-text("Farmer Dashboard")')).toBeVisible();

    // Verify Dashboard UI elements
    await expect(page.locator('text=Active Requests').first()).toBeVisible();
    await expect(page.locator('text=Confirmed Matches').first()).toBeVisible();

    // Navigate to Search Page
    await page.click('a:has-text("Find New Resources")');
    await page.waitForURL(/\/farmer\/search/);

    // Verify initial "Ready to search" state
    await expect(page.locator('text=Ready to search')).toBeVisible();

    // Execute Search
    await page.click('button:has-text("Find Matches")');

    // Verify results are displayed
    await expect(page.locator('text=matching resources')).toBeVisible();
    await expect(page.locator('text=Request Resource').first()).toBeVisible();
  });
});
