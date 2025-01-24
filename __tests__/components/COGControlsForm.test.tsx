import { test, expect } from '@playwright/test';

test.describe('COGControlsForm', () => {
  test('calls onBandChange when a band is selected', async ({ page }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/');

    // Wait for the Band (R) dropdown to load
    const bandRDropdown = page.locator('[data-testid="band-R"] .ant-select-selector');
    await expect(bandRDropdown).toBeVisible();

    // Open the dropdown and select "Band 2"
    await bandRDropdown.click();
    const band2Option = page.locator('.ant-select-item', { hasText: 'b2 - Band 2' });
    await band2Option.click();

    // Verify the change (you may need to intercept network requests or check component state)
    // Example: Wait for the API call
    await page.waitForRequest((req) => req.url().includes('bidx=2') && req.method() === 'GET');
  });

  test('renders correctly with mock metadata', async ({ page }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/');

    // Verify the initial state
    await expect(page.locator('[data-testid="band-R"]')).toBeVisible();
    await expect(page.locator('[data-testid="band-R"]')).toContainText('b1 - Band 1');
  });
});
