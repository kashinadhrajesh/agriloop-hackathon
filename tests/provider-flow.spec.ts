import { test, expect } from '@playwright/test';

test.describe('Provider Flow MVP', () => {
  // Use a unique email for each test run to bypass the "User already registered" issue
  const testEmail = `test_provider_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  test('TC01: Provider Registration & Authentication', async ({ page }) => {
    // 1. Go to Register page
    await page.goto('/register');
    
    // 2. Fill out the form
    await page.fill('input[name="fullName"]', 'Test Provider');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // 3. Select Provider role
    await page.click('button:has-text("Provider")');
    
    // 4. Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to login
    await page.waitForURL(/\/login/);

    // 5. Log in with the newly created account
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to Provider Dashboard
    await page.waitForURL(/\/provider\/dashboard/);
    await expect(page.locator('h1:has-text("Provider Dashboard")')).toBeVisible();
  });

  test('TC02 & TC03: Listing a New Resource and Dashboard Updates', async ({ page }) => {
    // Since each test gets a clean browser state, we need to register/login again
    // Or we could use the same email if we use `test.beforeAll` or just login with the one we just made.
    // Let's just create a quick helper or reuse the previous email?
    // Wait, Playwright runs tests in parallel. It's safer to register a new user per test to ensure isolation.
    const resourceEmail = `res_provider_${Date.now()}@example.com`;
    
    // Register
    await page.goto('/register');
    await page.fill('input[name="fullName"]', 'Resource Tester');
    await page.fill('input[name="email"]', resourceEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button:has-text("Provider")');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/login/);

    // Login
    await page.fill('input[name="email"]', resourceEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/provider\/dashboard/);

    // Click "List New Resource"
    await page.click('a:has-text("List New Resource")');
    await page.waitForURL(/\/provider\/resources\/new/);

    // Fill out the resource form
    await page.selectOption('select[name="resource_type"]', 'Vegetable Waste');
    await page.fill('input[name="quantity"]', '500');
    await page.selectOption('select[name="unit"]', 'kg');
    await page.fill('input[name="location"]', 'Test Farm Location');
    await page.fill('input[name="available_from"]', '2026-10-01');
    await page.fill('input[name="available_until"]', '2026-10-31');
    await page.fill('textarea[name="description"]', 'High quality organic waste');

    // Submit the form
    await page.click('button:has-text("List Resource")');

    // Wait for redirect back to dashboard
    await page.waitForURL(/\/provider\/dashboard.*/);

    // Verify the new listing is visible in the active listings feed
    await expect(page.locator('p.font-medium.text-gray-900:has-text("500 kg of Vegetable Waste")')).toBeVisible();
    
    // Verify the "Active Listings" count updated. It should be at least 1.
    // Our dashboard currently just grabs resources.length and puts it there.
    await expect(page.locator('p.text-2xl.font-bold.text-gray-900').first()).toHaveText('1');
  });
});
