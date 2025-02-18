import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

test.describe('COG Viewer Drawer', () => {
  test('COG Viewer loads with renders object presets', async ({
    page,
    http,
    worker,
  }) => {
    await page.goto('/create-ingest');

    await page.getByLabel('Sample Files-1').fill('s3://test.com');

    await page.getByLabel('dashboard').fill(
      JSON.stringify(
        {
          resampling: 'nearest',
          bidx: [1],
          colormap_name: 'rdbu',
          assets: ['cog_default'],
          rescale: [[-1, 1]],
          color_formula: 'test123',
          nodata: 255,
          title: 'VEDA Dashboard Render Parameters',
        },
        null,
        2
      )
    );

    await page
      .getByRole('button', {
        name: /Generate Renders Object from Sample File/i,
      })
      .click();
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
      'rdbu'
    );
    await expect(page.locator('[data-testid="resampling"]')).toContainText(
      /nearest/i
    );

    await expect(page.locator('[data-testid="colorFormula"]')).toHaveValue(
      /test123/i
    );

    await expect(page.locator('[data-testid="nodata"]')).toHaveValue(/255/i);

    await page.getByRole('button', { name: 'View Rendering Options' }).click();
    await expect(
      page.getByRole('dialog', { name: /COG Rendering Options/i })
    ).toBeVisible();
    await expect(page.locator('.ant-modal-body')).toHaveText(
      JSON.stringify(
        {
          bidx: [1],
          rescale: [[-1, 1]],
          colormap_name: 'rdbu',
          color_formula: 'test123',
          nodata: 255,
          assets: ['cog_default'],
        },
        null,
        2
      )
    );
  });

  test('COG Viewer loads without entry in renders object', async ({
    page,
    http,
    worker,
  }) => {
    await page.goto('/create-ingest');

    await page.getByLabel('Sample Files-1').fill('s3://test.com');

    await page
      .getByRole('button', {
        name: /Generate Renders Object from Sample File/i,
      })
      .click();

    await expect(page.locator('[data-testid="colormap"]')).toContainText(
      'Internal'
    );
    await expect(page.locator('[data-testid="resampling"]')).toContainText('');

    await expect(page.locator('[data-testid="colorFormula"]')).toHaveValue('');

    await expect(page.locator('[data-testid="nodata"]')).toHaveValue('');

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

  test('COG Viewer loads with error in renders object presets', async ({
    page,
    http,
    worker,
  }) => {
    await page.goto('/create-ingest');

    await page.getByLabel('Sample Files-1').fill('s3://test.com');

    await page.getByLabel('dashboard').fill('"test": true');

    await page
      .getByRole('button', {
        name: /Generate Renders Object from Sample File/i,
      })
      .click();

    await expect(page.locator('[data-testid="colormap"]')).toContainText(
      'Internal'
    );
    await expect(page.locator('[data-testid="resampling"]')).toContainText('');

    await expect(page.locator('[data-testid="colorFormula"]')).toHaveValue('');

    await expect(page.locator('[data-testid="nodata"]')).toHaveValue('');

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

  test('COG Viewer overwrites existing renders object with selections', async ({
    page,
    http,
    worker,
  }) => {
    await page.goto('/create-ingest');

    await page.getByLabel('Sample Files-1').fill('s3://test.com');

    await page.getByLabel('dashboard').fill(
      JSON.stringify(
        {
          resampling: 'nearest',
          bidx: [1],
          colormap_name: 'rdbu',
          assets: ['cog_default'],
          rescale: [[-1, 1]],
          color_formula: 'test123',
          nodata: 255,
          title: 'VEDA Dashboard Render Parameters',
        },
        null,
        2
      )
    );

    await page
      .getByRole('button', {
        name: /Generate Renders Object from Sample File/i,
      })
      .click();

    await expect(page.locator('[data-testid="colormap"]')).toContainText(
      'rdbu'
    );

    await expect(page.locator('[data-testid="nodata"]')).toHaveValue('255');
    await page.locator('[data-testid="nodata"]').fill('');

    await expect(page.locator('[data-testid="colorFormula"]')).toHaveValue(
      /test123/i
    );
    await page.locator('[data-testid="colorFormula"]').fill('test456');

    await page.getByRole('button', { name: 'View Rendering Options' }).click();
    await expect(
      page.getByRole('dialog', { name: /COG Rendering Options/i })
    ).toBeVisible();
    await expect(page.locator('.ant-modal-body')).toHaveText(
      JSON.stringify(
        {
          bidx: [1],
          rescale: [[-1, 1]],
          colormap_name: 'rdbu',
          color_formula: 'test456',
          assets: ['cog_default'],
        },
        null,
        2
      )
    );
    await page
      .getByLabel('COG Rendering Options')
      .getByRole('button', { name: 'Cancel' })
      .click();
    await page.getByRole('button', { name: /accept render options/i }).click();
    await expect(page.getByLabel('Dashboard')).toHaveText(
      JSON.stringify(
        {
          bidx: [1],
          rescale: [[-1, 1]],
          colormap_name: 'rdbu',
          color_formula: 'test456',
          assets: ['cog_default'],
        },
        null,
        2
      )
    );
  });
});
