import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

test.describe('COG Viewer Page', () => {
  test('COG Viewer loads single band COG ', async ({ page, http, worker }) => {
    await worker.use(
      http.get('/api/raster/cog/info', ({ request }) => {
        return HttpResponse.json({
          band_descriptions: [['b1', 'Band 1']],
        });
      })
    );
    // Navigate to the page with COGControlsForm
    await page.goto('/cog-viewer');

    await page.getByPlaceholder('Enter COG URL').fill('s3://test.com');
    await page.getByRole('button', { name: /Load/i }).click();
    await expect(page.getByText('Band: Band 1 (Index: 1)')).toBeVisible();
    await expect(page.getByLabel('Band (R)')).toBeHidden();
    await expect(page.getByLabel('Band (G)')).toBeHidden();
    await expect(page.getByLabel('Band (B)')).toBeHidden();
  });

  test('COG Viewer loads multi band COG ', async ({ page, http, worker }) => {
    await page.goto('/cog-viewer');

    await page.getByPlaceholder('Enter COG URL').fill('s3://test.com');
    await page.getByRole('button', { name: /Load/i }).click();
    await expect(page.getByText('Band: Band 1 (Index: 1)')).toBeHidden();
    await expect(page.getByLabel('Band (R)')).toBeVisible();
    await expect(page.locator('[data-testid="band-R"]')).toContainText(
      'b1 - Band 1'
    );
    await expect(page.getByLabel('Band (G)')).toBeVisible();
    await expect(page.locator('[data-testid="band-G"]')).toContainText(
      'b2 - Band 2'
    );
    await expect(page.getByLabel('Band (B)')).toBeVisible();
    await expect(page.locator('[data-testid="band-B"]')).toContainText(
      'b3 - Band 3'
    );

    await expect(page.locator('[data-testid="colormap"]')).toContainText(
      'Internal'
    );

    await expect(
      page.getByRole('button', { name: /update tile layer/i })
    ).toBeDisabled();
    await page.getByRole('button', { name: 'View Rendering Options' }).click();
    await expect(
      page.getByRole('dialog', { name: /COG Rendering Options/i })
    ).toBeVisible();
    await expect(page.locator('.ant-modal-body')).toHaveText(
      JSON.stringify(
        {
          bidx: [1],
          rescale: [],
          assets: ['cog_default'],
        },
        null,
        2
      )
    );
  });
});
