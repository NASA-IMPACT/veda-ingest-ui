import { expect, test } from '@/__tests__/playwright/setup-msw';

test.describe('COGControlsForm', () => {
  test('calls onBandChange when a band is selected', async ({ page }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/cog-viewer');

    await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com')
    await page.getByRole('button', {name: /load/i}).click();

    // update tile layer button should be disabled by default
    await expect(page.getByRole('button', {name: /update tile layer/i})).toBeDisabled()

    // Wait for the Band (R) dropdown to load
    const bandRDropdown = page.locator('[data-testid="band-R"] .ant-select-selector');
    await expect(bandRDropdown).toBeVisible();

    // Open the dropdown and select "Band 2"
    await bandRDropdown.click();
    const band2Option = page.locator('.ant-select-item', { hasText: 'b2 - Band 2' });
    await band2Option.click();

    const requestPromise = page.waitForRequest((req) => req.url().includes('bidx=2') && req.method() === 'GET');

    await page.getByRole('button', {name: /update tile layer/i}).click()
    
    await requestPromise;
  });

  test('renders correctly with mock metadata', async ({ page }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/cog-viewer');

    await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com')
    await page.getByRole('button', {name: /load/i}).click();

    // Verify the initial state
    await expect(page.locator('[data-testid="band-R"]')).toBeVisible();
    await expect(page.locator('[data-testid="band-R"]')).toContainText('b1 - Band 1');

    // Verify the initial state
    await expect(page.locator('[data-testid="band-G"]')).toBeVisible();
    await expect(page.locator('[data-testid="band-G"]')).toContainText('b2 - Band 2');

            // Verify the initial state
    await expect(page.locator('[data-testid="band-B"]')).toBeVisible();
    await expect(page.locator('[data-testid="band-B"]')).toContainText('b3 - Band 3');
  });
});
