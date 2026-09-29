import { test, expect } from '@playwright/test';

test.describe('Phase 3: End-to-End Integration', () => {
  const providerEmail = `e2e_provider_${Date.now()}@example.com`;
  const farmerEmail = `e2e_farmer_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const uniqueQuantity = Math.floor(Math.random() * 1000) + 100; // Unique quantity to verify exact match

  test('TC07: The Complete Core Loop (Provider -> Farmer)', async ({ page }) => {
    test.setTimeout(60000); // 60s timeout for full E2E loop
    
    // ==========================================
    // PART 1: PROVIDER CREATES A RESOURCE
    // ==========================================
    
    // Register Provider
    await page.goto('/register');
    await page.fill('input[name="fullName"]', 'E2E Provider');
    await page.fill('input[name="email"]', providerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button:has-text("Provider")');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/login/);

    // Log in Provider
    await page.fill('input[name="email"]', providerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/provider\/dashboard/);

    // List New Resource
    await page.click('a:has-text("List New Resource")');
    await page.waitForURL(/\/provider\/resources\/new/);
    
    // Fill out unique resource
    await page.selectOption('select[name="resource_type"]', 'Fruit Waste');
    await page.fill('input[name="quantity"]', uniqueQuantity.toString());
    await page.selectOption('select[name="unit"]', 'kg');
    await page.fill('input[name="location"]', 'E2E Test Location');
    await page.fill('input[name="available_from"]', '2026-10-01');
    await page.fill('input[name="available_until"]', '2026-10-31');
    await page.fill('textarea[name="description"]', 'E2E Testing Data');

    // Submit and wait for dashboard
    await page.click('button:has-text("List Resource")');
    await page.waitForURL(/\/provider\/dashboard.*/);
    
    // Verify it appeared on Provider Dashboard
    await expect(page.locator(`text=${uniqueQuantity} kg of Fruit Waste`)).toBeVisible();

    // ==========================================
    // PART 2: FARMER DISCOVERS THE RESOURCE
    // ==========================================
    
    // Clear cookies/storage to simulate different user/computer
    await page.context().clearCookies();
    
    // Register Farmer
    await page.goto('/register');
    await page.fill('input[name="fullName"]', 'E2E Farmer');
    await page.fill('input[name="email"]', farmerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button:has-text("Farmer")');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/login/);

    // Log in Farmer
    await page.fill('input[name="email"]', farmerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/farmer\/dashboard/);

    // Navigate to Search
    await page.click('a:has-text("Find New Resources")');
    await page.waitForURL(/\/farmer\/search/);

    // Search for Fruit Waste
    await page.selectOption('select[name="resource_type"]', 'Fruit Waste');
    await page.fill('input[name="requested_quantity"]', (uniqueQuantity - 50).toString()); // Ask for slightly less to ensure quantity match
    
    // Execute Search
    await page.click('button:has-text("Find Matches")');

    // Verify the EXACT resource the provider just created is in the results!
    await expect(page.locator(`text=${uniqueQuantity} kg Fruit Waste`)).toBeVisible();
  });
});
