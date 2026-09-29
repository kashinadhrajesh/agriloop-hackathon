import { test, expect } from '@playwright/test';

test.describe('AgriLoop User-Specific Location System', () => {

  test('TEST A, B, C, D, E: Farmer & Provider authenticated map location and refresh tests', async ({ browser }) => {
    const farmerLogs: string[] = [];
    const providerLogs: string[] = [];

    // Context 1: Farmer session
    const farmerContext = await browser.newContext();
    const farmerPage = await farmerContext.newPage();
    farmerPage.on('console', msg => farmerLogs.push(msg.text()));

    // TEST A: Login Farmer -> open /map -> Expected: Farmer's location (Kumily)
    await farmerPage.goto('/login');
    await farmerPage.fill('input[name="email"]', 'farmer@agriloop.demo');
    await farmerPage.fill('input[name="password"]', 'Password123!');
    await farmerPage.click('button[type="submit"]');
    await farmerPage.waitForURL(/\/farmer\/dashboard/);

    await farmerPage.goto('/map');
    await farmerPage.waitForSelector('.leaflet-container');

    await expect(farmerPage.locator('text=Your Location: Kumily, Kerala')).toBeVisible();

    // Verify console debugging logs for Farmer
    expect(farmerLogs.some(l => l.includes('MAP USER ID:'))).toBe(true);
    expect(farmerLogs.some(l => l.includes('MAP USER EMAIL: farmer@agriloop.demo'))).toBe(true);
    expect(farmerLogs.some(l => l.includes('MAP ROLE: FARMER'))).toBe(true);
    expect(farmerLogs.some(l => l.includes('MAP LOCATION: Kumily, Kerala'))).toBe(true);
    expect(farmerLogs.some(l => l.includes('MAP LAT: 9.6031'))).toBe(true);
    expect(farmerLogs.some(l => l.includes('MAP LNG: 77.1615'))).toBe(true);
    expect(farmerLogs.some(l => l.includes('MAP MODE: DEMO'))).toBe(true);

    // Context 2: Provider session (TEST C: same machine using separate session)
    const providerContext = await browser.newContext();
    const providerPage = await providerContext.newPage();
    providerPage.on('console', msg => providerLogs.push(msg.text()));

    // TEST B: Login Provider -> open /map -> Expected: Provider's location (Kattappana)
    await providerPage.goto('/login');
    await providerPage.fill('input[name="email"]', 'provider@agriloop.demo');
    await providerPage.fill('input[name="password"]', 'Password123!');
    await providerPage.click('button[type="submit"]');
    await providerPage.waitForURL(/\/provider\/dashboard/);

    await providerPage.goto('/map');
    await providerPage.waitForSelector('.leaflet-container');

    await expect(providerPage.locator('text=Your Location: Kattappana, Kerala')).toBeVisible();

    // Verify console debugging logs for Provider
    expect(providerLogs.some(l => l.includes('MAP USER ID:'))).toBe(true);
    expect(providerLogs.some(l => l.includes('MAP USER EMAIL: provider@agriloop.demo'))).toBe(true);
    expect(providerLogs.some(l => l.includes('MAP ROLE: PROVIDER'))).toBe(true);
    expect(providerLogs.some(l => l.includes('MAP LOCATION: Kattappana, Kerala'))).toBe(true);
    expect(providerLogs.some(l => l.includes('MAP LAT: 9.7547'))).toBe(true);
    expect(providerLogs.some(l => l.includes('MAP LNG: 77.1192'))).toBe(true);
    expect(providerLogs.some(l => l.includes('MAP MODE: DEMO'))).toBe(true);

    // TEST C: Verify both users have different locations simultaneously on same machine
    await expect(farmerPage.locator('text=Your Location: Kumily, Kerala')).toBeVisible();
    await expect(providerPage.locator('text=Your Location: Kattappana, Kerala')).toBeVisible();

    // TEST D: Refresh Farmer map -> Expected: still Farmer location (Kumily)
    await farmerPage.reload();
    await farmerPage.waitForSelector('.leaflet-container');
    await expect(farmerPage.locator('text=Your Location: Kumily, Kerala')).toBeVisible();

    // TEST E: Refresh Provider map -> Expected: still Provider location (Kattappana)
    await providerPage.reload();
    await providerPage.waitForSelector('.leaflet-container');
    await expect(providerPage.locator('text=Your Location: Kattappana, Kerala')).toBeVisible();

    await farmerContext.close();
    await providerContext.close();
  });

  test('TEST 4: Location Settings modal allows switching demo locations and persists', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');
    await page.fill('input[name="email"]', 'farmer@agriloop.demo');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/farmer\/dashboard/);

    await page.goto('/map');
    await page.waitForSelector('.leaflet-container');

    // Click Location Settings button
    await page.click('button:has-text("Location Settings")');
    await expect(page.locator('text=Location Mode:')).toBeVisible();

    // Select Kochi, Kerala from demo dropdown inside the modal
    const modalSelect = page.locator('.fixed select');
    await modalSelect.selectOption({ label: 'Kochi, Kerala' });
    await page.click('button:has-text("Save Location")');

    // Verify location updated on UI
    await expect(page.locator('text=Your Location: Kochi, Kerala')).toBeVisible();

    // Reload page to verify persistence in Supabase profile
    await page.reload();
    await page.waitForSelector('.leaflet-container');
    await expect(page.locator('text=Your Location: Kochi, Kerala')).toBeVisible();

    // Reset back to Kumily
    await page.click('button:has-text("Location Settings")');
    await page.locator('.fixed select').selectOption({ label: 'Kumily, Kerala' });
    await page.click('button:has-text("Save Location")');
    await expect(page.locator('text=Your Location: Kumily, Kerala')).toBeVisible();

    await context.close();
  });

  test('TEST 5: Matching Engine calculates dynamic distance between Farmer and Provider', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as Farmer (Kumily)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'farmer@agriloop.demo');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/farmer\/dashboard/);

    // Go to search page
    await page.goto('/farmer/search');
    await expect(page.locator('text=Your Location: Kumily, Kerala')).toBeVisible();

    // Search for Crop Residue with 300 kg and max distance 30 km (Kattappana is ~17.7 km away)
    await page.selectOption('select[name="resource_type"]', 'Crop Residue');
    await page.fill('input[name="requested_quantity"]', '300');
    await page.fill('input[name="max_distance_km"]', '30');

    await page.click('button:has-text("Find Matches")');

    // Resource from Provider in Kattappana (500 kg Crop Residue) should appear!
    await expect(page.locator('text=500 kg Crop Residue').first()).toBeVisible();
    // Distance should be dynamically calculated (~17.7 km)
    await expect(page.locator('text=17.7 km away').first()).toBeVisible();

    await context.close();
  });

  test('FINAL ACCEPTANCE TEST: Provider (Kattappana) and Farmer (Kumily) full settings and map flow', async ({ browser }) => {
    // 1. Provider Flow
    const providerContext = await browser.newContext();
    const providerPage = await providerContext.newPage();

    await providerPage.goto('/login');
    await providerPage.fill('input[name="email"]', 'provider@agriloop.demo');
    await providerPage.fill('input[name="password"]', 'Password123!');
    await providerPage.click('button[type="submit"]');
    await providerPage.waitForURL(/\/provider\/dashboard/);

    await providerPage.goto('/map');
    await providerPage.waitForSelector('.leaflet-container');

    // Open Location Settings, select Kattappana, save
    await providerPage.click('button:has-text("Location Settings")');
    await providerPage.locator('.fixed select').selectOption({ label: 'Kattappana, Kerala' });
    await providerPage.click('button:has-text("Save Location")');

    // Expected UI
    await expect(providerPage.locator('text=Your Location: Kattappana, Kerala')).toBeVisible();
    await expect(providerPage.locator('text=DEMO').first()).toBeVisible();
    await expect(providerPage.locator('text=Provider').first()).toBeVisible();

    await providerContext.close();

    // 2. Farmer Flow
    const farmerContext = await browser.newContext();
    const farmerPage = await farmerContext.newPage();

    await farmerPage.goto('/login');
    await farmerPage.fill('input[name="email"]', 'farmer@agriloop.demo');
    await farmerPage.fill('input[name="password"]', 'Password123!');
    await farmerPage.click('button[type="submit"]');
    await farmerPage.waitForURL(/\/farmer\/dashboard/);

    await farmerPage.goto('/map');
    await farmerPage.waitForSelector('.leaflet-container');

    // Open Location Settings, select Kumily, save
    await farmerPage.click('button:has-text("Location Settings")');
    await farmerPage.locator('.fixed select').selectOption({ label: 'Kumily, Kerala' });
    await farmerPage.click('button:has-text("Save Location")');

    // Expected UI
    await expect(farmerPage.locator('text=Your Location: Kumily, Kerala')).toBeVisible();
    await expect(farmerPage.locator('text=DEMO').first()).toBeVisible();
    await expect(farmerPage.locator('text=Farmer').first()).toBeVisible();

    await farmerContext.close();
  });

});
