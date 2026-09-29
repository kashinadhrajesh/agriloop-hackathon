import { test, expect } from '@playwright/test';

test.describe('Phase 5: Accept/Reject Workflow', () => {
  const providerEmail = `ar_provider_${Date.now()}@example.com`;
  const farmerEmail = `ar_farmer_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const uniqueQuantity = Math.floor(Math.random() * 1000) + 1000; // Unique quantity to verify exact match

  test('TC09: Provider Accepts Request', async ({ page }) => {
    test.setTimeout(120000); // 120s timeout for full E2E loop
    
    // ==========================================
    // PART 1: PROVIDER CREATES A RESOURCE
    // ==========================================
    
    await page.goto('/register');
    await page.fill('input[name="fullName"]', 'AR Provider');
    await page.fill('input[name="email"]', providerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button:has-text("Provider")');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/login/);

    await page.fill('input[name="email"]', providerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/provider\/dashboard/);

    await page.click('a:has-text("List New Resource")');
    await page.waitForURL(/\/provider\/resources\/new/);
    
    await page.selectOption('select[name="resource_type"]', 'Cow Dung');
    await page.fill('input[name="quantity"]', uniqueQuantity.toString());
    await page.selectOption('select[name="unit"]', 'kg');
    await page.fill('input[name="location"]', 'AR Test Location');
    await page.fill('input[name="available_from"]', '2026-10-01');
    await page.fill('input[name="available_until"]', '2026-10-31');
    await page.fill('textarea[name="description"]', 'AR Testing Data');

    await page.click('button:has-text("List Resource")');
    await page.waitForURL(/\/provider\/dashboard.*/);
    
    // ==========================================
    // PART 2: FARMER REQUESTS THE RESOURCE
    // ==========================================
    
    await page.context().clearCookies();
    
    await page.goto('/register');
    await page.fill('input[name="fullName"]', 'AR Farmer');
    await page.fill('input[name="email"]', farmerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button:has-text("Farmer")');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/login/);

    await page.fill('input[name="email"]', farmerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/farmer\/dashboard/);

    await page.click('a:has-text("Find New Resources")');
    await page.waitForURL(/\/farmer\/search/);

    await page.selectOption('select[name="resource_type"]', 'Cow Dung');
    await page.fill('input[name="requested_quantity"]', (uniqueQuantity - 50).toString());
    
    await page.click('button:has-text("Find Matches")');

    await page.locator(`text=${uniqueQuantity} kg Cow Dung`).locator('xpath=ancestor::div[contains(@class, "border-gray-200")]').locator('button:has-text("Request Resource")').click();

    await page.waitForSelector('text=Message to Provider');
    await page.fill('textarea', 'Please accept my request!');
    
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Send Request")');
    await page.waitForTimeout(2000);

    // ==========================================
    // PART 3: PROVIDER ACCEPTS THE REQUEST
    // ==========================================

    await page.context().clearCookies();

    await page.goto('/login');
    await page.fill('input[name="email"]', providerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/provider\/dashboard/);

    // Verify request is there
    await expect(page.locator(`text=${uniqueQuantity} kg of Cow Dung`).first()).toBeVisible();
    
    // Click Accept!
    await page.locator(`text=${uniqueQuantity} kg of Cow Dung`).first().locator('xpath=ancestor::div[contains(@class, "border-gray-100")]').locator('button:has-text("Accept")').click();
    await page.waitForTimeout(2000); // Give server action time to execute and reload

    // The request should no longer be pending (the Accept button disappears)
    await expect(page.locator(`text=${uniqueQuantity} kg of Cow Dung`).first().locator('xpath=ancestor::div[contains(@class, "border-gray-100")]').locator('button:has-text("Accept")')).not.toBeVisible();

    // ==========================================
    // PART 4: FARMER SEES CONFIRMED MATCH
    // ==========================================

    await page.context().clearCookies();

    await page.goto('/login');
    await page.fill('input[name="email"]', farmerEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/farmer\/dashboard/);

    // Verify it appeared in Confirmed Matches (Ready for Pickup)
    // The Confirmed Matches section uses text: Confirmed
    await expect(page.locator('text=Ready for pickup!').first()).toBeVisible();
    await expect(page.locator(`text=${uniqueQuantity} kg of Cow Dung`)).toBeVisible();
  });
});
