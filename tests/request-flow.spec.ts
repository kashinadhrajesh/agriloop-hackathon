import { test, expect } from '@playwright/test';

test.describe('Phase 4: Request Engine Loop', () => {
  const providerEmail = `req_provider_${Date.now()}@example.com`;
  const farmerEmail = `req_farmer_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const uniqueQuantity = Math.floor(Math.random() * 1000) + 500; // Unique quantity to verify exact match

  test('TC08: The End-to-End Request Loop', async ({ page }) => {
    test.setTimeout(90000); // 90s timeout for full E2E loop
    
    // ==========================================
    // PART 1: PROVIDER CREATES A RESOURCE
    // ==========================================
    
    // Register Provider
    await page.goto('/register');
    await page.fill('input[name="fullName"]', 'Request Provider');
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
    await page.selectOption('select[name="resource_type"]', 'Compost');
    await page.fill('input[name="quantity"]', uniqueQuantity.toString());
    await page.selectOption('select[name="unit"]', 'kg');
    await page.fill('input[name="location"]', 'Req Test Location');
    await page.fill('input[name="available_from"]', '2026-10-01');
    await page.fill('input[name="available_until"]', '2026-10-31');
    await page.fill('textarea[name="description"]', 'Request Testing Data');

    // Submit and wait for dashboard
    await page.click('button:has-text("List Resource")');
    await page.waitForURL(/\/provider\/dashboard.*/);
    
    // ==========================================
    // PART 2: FARMER DISCOVERS & REQUESTS THE RESOURCE
    // ==========================================
    
    // Clear cookies/storage to simulate different user/computer
    await page.context().clearCookies();
    
    // Register Farmer
    await page.goto('/register');
    await page.fill('input[name="fullName"]', 'Request Farmer');
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

    // Search for Compost
    await page.selectOption('select[name="resource_type"]', 'Compost');
    await page.fill('input[name="requested_quantity"]', (uniqueQuantity - 50).toString());
    
    // Execute Search
    await page.click('button:has-text("Find Matches")');

    // Verify the EXACT resource is in the results, then request it
    const resourceCard = page.locator(`text=${uniqueQuantity} kg Compost`).locator('..');
    
    // We can't easily click "Request Resource" using just the parent div in playwright easily,
    // let's just click the first "Request Resource" button since this is an isolated test environment.
    // Actually, wait, there might be other compost listings. Let's find the exact button for this listing.
    await page.locator(`text=${uniqueQuantity} kg Compost`).locator('xpath=ancestor::div[contains(@class, "border-gray-200")]').locator('button:has-text("Request Resource")').click();

    // The modal should appear. Fill out message.
    await page.waitForSelector('text=Message to Provider');
    await page.fill('textarea', 'E2E Automated Request Message');
    
    // Listen for the alert dialog before clicking send
    page.once('dialog', dialog => dialog.accept());

    // Submit the request
    await page.click('button:has-text("Send Request")');

    // Give it a second to process
    await page.waitForTimeout(2000);

    // Go to Farmer Dashboard to verify
    await page.goto('/farmer/dashboard');

    // Verify it appeared in Farmer's Pending requests
    await expect(page.locator(`text=${uniqueQuantity} kg of Compost`)).toBeVisible();

    // ==========================================
    // PART 3: PROVIDER SEES THE REQUEST
    // ==========================================

    // Clear cookies to log back in as Provider
    await page.context().clearCookies();

    await page.goto('/login');
    await page.fill('input[name="email"]', providerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/provider\/dashboard/);

    // Verify the incoming request is visible on the Provider Dashboard!
    await expect(page.locator(`text=Request Farmer`)).toBeVisible();
    await expect(page.locator(`text=${uniqueQuantity} kg of Compost`).first()).toBeVisible();
  });
});
