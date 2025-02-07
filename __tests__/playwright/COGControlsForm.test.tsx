import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

const testBands = ['R', 'G', 'B'];
test.describe('COGControlsForm', () => {
  for (const band of testBands) {
    test(`band (${band}) selection enables update tile layer and updates parameters`, async ({
      page,
    }) => {
      // Navigate to the page with COGControlsForm
      await page.goto('/cog-viewer');

      await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
      await page.getByRole('button', { name: /load/i }).click();

      // update tile layer button should be disabled by default
      await expect(
        page.getByRole('button', { name: /update tile layer/i })
      ).toBeDisabled();

      // Wait for the Band dropdown to load
      const bandRDropdown = page.locator(
        `[data-testid="band-${band}"] .ant-select-selector`
      );
      await expect(bandRDropdown).toBeVisible();

      // Open the dropdown and select "Band 4"
      await bandRDropdown.click();
      const bandOption = page.locator('.ant-select-item', {
        hasText: 'b4 - Band 4',
      });
      await bandOption.click();

      const requestPromise = page.waitForRequest(
        (req) => req.url().includes('bidx=4') && req.method() === 'GET'
      );

      await page.getByRole('button', { name: /update tile layer/i }).click();

      await requestPromise;
    });
  }

  test('only render the band name, not the individual test band dropdowns for single band COG', async ({
    page,
    http,
    worker,
  }) => {
    await worker.use(
      http.get('/api/raster/cog/info', ({ request }) => {
        return HttpResponse.json({
          band_descriptions: [['b1', 'Band 1']],
        });
      })
    );
    // Navigate to the page with COGControlsForm
    await page.goto('/cog-viewer');

    await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
    await page.getByRole('button', { name: /load/i }).click();

    // update tile layer button should be disabled by default
    await expect(
      page.getByRole('button', { name: /update tile layer/i })
    ).toBeDisabled();

    await expect(
      page.getByRole('heading', { name: 'Band: Band 1 (Index: 1)' })
    ).toBeVisible();
    const bandRDropdown = page.locator(
      `[data-testid="band-R"] .ant-select-selector`
    );
    const bandGDropdown = page.locator(
      `[data-testid="band-G"] .ant-select-selector`
    );
    const bandBDropdown = page.locator(
      `[data-testid="band-B"] .ant-select-selector`
    );
    await expect(bandRDropdown).toBeHidden();
    await expect(bandGDropdown).toBeHidden();
    await expect(bandBDropdown).toBeHidden();
  });

  test('colormap selection enables update tile layer and updates parameters', async ({
    page,
  }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/cog-viewer');

    await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
    await page.getByRole('button', { name: /load/i }).click();

    // update tile layer button should be disabled by default
    await expect(
      page.getByRole('button', { name: /update tile layer/i })
    ).toBeDisabled();

    // Wait for the Band (R) dropdown to load
    const colormapDropdown = page.locator(
      '[data-testid="colormap"] .ant-select-selector'
    );
    await expect(colormapDropdown).toBeVisible();

    // Open the dropdown and select "Band 2"
    await colormapDropdown.click();
    const colormapOption = page.locator('.ant-select-item', {
      hasText: 'CFastie',
    });
    await colormapOption.click();

    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('colormap_name=cfastie') && req.method() === 'GET'
    );

    await page.getByRole('button', { name: /update tile layer/i }).click();

    await requestPromise;
  });

  test('colorformula entry enables update tile layer and updates parameters', async ({
    page,
  }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/cog-viewer');

    await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
    await page.getByRole('button', { name: /load/i }).click();

    // update tile layer button should be disabled by default
    await expect(
      page.getByRole('button', { name: /update tile layer/i })
    ).toBeDisabled();

    // Wait for the Band (R) dropdown to load
    const colorFormulaInput = page.getByLabel(/color formula/i);
    await expect(colorFormulaInput).toBeVisible();

    await colorFormulaInput.fill('playwright');

    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('color_formula=playwright') && req.method() === 'GET'
    );

    await page.getByRole('button', { name: /update tile layer/i }).click();

    await requestPromise;
  });

  test('resampling selection enables update tile layer and updates parameters', async ({
    page,
  }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/cog-viewer');

    await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
    await page.getByRole('button', { name: /load/i }).click();

    // update tile layer button should be disabled by default
    await expect(
      page.getByRole('button', { name: /update tile layer/i })
    ).toBeDisabled();

    // Wait for the dropdown to load
    const resamplingDropdown = page.locator(
      '[data-testid="resampling"] .ant-select-selector'
    );
    await expect(resamplingDropdown).toBeVisible();

    // Open the dropdown and select "Bilinear"
    await resamplingDropdown.click();
    const resamplingOption = page.locator('.ant-select-item', {
      hasText: 'Bilinear',
    });
    await resamplingOption.click();

    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('resampling=bilinear') && req.method() === 'GET'
    );

    await page.getByRole('button', { name: /update tile layer/i }).click();

    await requestPromise;
  });

  test('nodata entry enables update tile layer and updates parameters', async ({
    page,
  }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/cog-viewer');

    await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
    await page.getByRole('button', { name: /load/i }).click();

    // update tile layer button should be disabled by default
    await expect(
      page.getByRole('button', { name: /update tile layer/i })
    ).toBeDisabled();

    // Wait for the Band (R) dropdown to load
    const nodataInput = page.getByLabel(/nodata value/i);
    await expect(nodataInput).toBeVisible();

    await nodataInput.fill('255');

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('nodata=255') && req.method() === 'GET'
    );

    await page.getByRole('button', { name: /update tile layer/i }).click();

    await requestPromise;
  });

  test('renders correctly with mock metadata', async ({ page }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/cog-viewer');

    await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
    await page.getByRole('button', { name: /load/i }).click();

    // Verify the initial state
    await expect(page.locator('[data-testid="band-R"]')).toBeVisible();
    await expect(page.locator('[data-testid="band-R"]')).toContainText(
      'b1 - Band 1'
    );

    // Verify the initial state
    await expect(page.locator('[data-testid="band-G"]')).toBeVisible();
    await expect(page.locator('[data-testid="band-G"]')).toContainText(
      'b2 - Band 2'
    );

    // Verify the initial state
    await expect(page.locator('[data-testid="band-B"]')).toBeVisible();
    await expect(page.locator('[data-testid="band-B"]')).toContainText(
      'b3 - Band 3'
    );
  });
});
