import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

const testBands = ['R', 'G', 'B'];
test.describe('COGControlsForm Layout 🎨', () => {
  test('only render the band name, not the individual test band dropdowns for single band COG', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    await worker.use(
      http.get('/api/raster/cog/info', ({ request }) => {
        return HttpResponse.json({
          band_descriptions: [['b1', 'Band 1']],
        });
      })
    );
    // Navigate to the page with COGControlsForm
    await test.step('navigate to Cog Viewer Page', async () => {
      await page.goto('/cog-viewer');
    });

    await test.step('Load COG ViewerPage with mock response from /raster/cog/info endpoint', async () => {
      await expect(page.getByText('OpenStreetMap contributors')).toBeVisible();
      await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
      await page.getByRole('button', { name: /load/i }).click();
    });

    await expect(
      page.getByRole('button', { name: /update tile layer/i }),
      'update tile layer button should be disabled by default'
    ).toBeDisabled();

    await test.step('heading with band name should be displayed', async () => {
      await expect(
        page.getByRole('heading', { name: 'Band: Band 1 (Index: 1)' })
      ).toBeVisible();
    });

    await test.step('Verify RGB Band Dropdowns are hidden for single band COG', async () => {
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

    const singleBandCOGControlsScreenshot = await page.screenshot();
    testInfo.attach(
      'Default state of COG Viewer Form Controls for single band COG',
      {
        body: singleBandCOGControlsScreenshot,
        contentType: 'image/png',
      }
    );
  });

  test('render RGB band dropdowns for single band COG', async ({
    page,
  }, testInfo) => {
    await test.step('navigate to Cog Viewer Page', async () => {
      await page.goto('/cog-viewer');
    });

    await test.step('Load COG ViewerPage with mock response from /raster/cog/info endpoint', async () => {
      await expect(page.getByText('OpenStreetMap contributors')).toBeVisible();
      await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
      await page.getByRole('button', { name: /load/i }).click();
    });

    await test.step('verify RGB dropdowns are visible for multiband COG mock', async () => {
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

    const multiBandCOGControlsScreenshot = await page.screenshot();
    testInfo.attach(
      'Default state of COG Viewer Form Controls for multi-band COG',
      {
        body: multiBandCOGControlsScreenshot,
        contentType: 'image/png',
      }
    );
  });
});

test.describe('COGControlsForm inputs update tile parameters ⚙️', () => {
  for (const band of testBands) {
    test(`band (${band}) selection enables update tile layer and updates parameters`, async ({
      page,
    }) => {
      await test.step('navigate to Cog Viewer Page', async () => {
        await page.goto('/cog-viewer');
      });

      await test.step('Load COG ViewerPage with mock response from /raster/cog/info endpoint', async () => {
        await expect(
          page.getByText('OpenStreetMap contributors')
        ).toBeVisible();
        await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
        await page.getByRole('button', { name: /load/i }).click();
      });

      await expect(
        page.getByRole('button', { name: /update tile layer/i }),
        'update tile layer button should be disabled by default'
      ).toBeDisabled();

      await test.step(`Open the ${band} Band dropdown and select "Band 4"`, async () => {
        const bandRDropdown = page.locator(
          `[data-testid="band-${band}"] .ant-select-selector`
        );
        await expect(
          bandRDropdown,
          `Wait for the ${band} Band dropdown to load`
        ).toBeVisible();
        await bandRDropdown.click();
        const bandOption = page.locator('.ant-select-item', {
          hasText: 'b4 - Band 4',
        });
        await bandOption.click();
      });

      await test.step('validate GET request to /raster/cog/WebMercatorQuad/tilejson.json includes bidx=4 query parameter', async () => {
        const requestPromise = page.waitForRequest(
          (req) => req.url().includes('bidx=4') && req.method() === 'GET'
        );

        await page.getByRole('button', { name: /update tile layer/i }).click();

        await requestPromise;
      });
    });
  }

  test('colormap selection enables update tile layer and updates parameters', async ({
    page,
  }) => {
    await test.step('navigate to Cog Viewer Page', async () => {
      await page.goto('/cog-viewer');
    });

    await test.step('Load COG ViewerPage with mock response from /raster/cog/info endpoint', async () => {
      await expect(page.getByText('OpenStreetMap contributors')).toBeVisible();
      await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
      await page.getByRole('button', { name: /load/i }).click();
    });

    await expect(
      page.getByRole('button', { name: /update tile layer/i }),
      'update tile layer button should be disabled by default'
    ).toBeDisabled();

    //
    await test.step('Change the Colormap dropdown selection to cfastie', async () => {
      const colormapDropdown = page.locator(
        '[data-testid="colormap"] .ant-select-selector'
      );
      await expect(
        colormapDropdown,
        'Wait for the Colormap dropdown to load'
      ).toBeVisible();

      await colormapDropdown.click();

      const colormapOption = page.locator('.ant-select-item', {
        hasText: 'cfastie',
      });
      await colormapOption.click();
    });

    await test.step('validate GET request to /raster/cog/WebMercatorQuad/tilejson.json includes colormap_name=cfastie query parameter', async () => {
      const requestPromise = page.waitForRequest(
        (req) =>
          req.url().includes('colormap_name=cfastie') && req.method() === 'GET'
      );

      await page.getByRole('button', { name: /update tile layer/i }).click();

      await requestPromise;
    });
  });

  test('colorformula entry enables update tile layer and updates parameters', async ({
    page,
  }) => {
    await test.step('navigate to Cog Viewer Page', async () => {
      await page.goto('/cog-viewer');
    });

    await test.step('Load COG ViewerPage with mock response from /raster/cog/info endpoint', async () => {
      await expect(page.getByText('OpenStreetMap contributors')).toBeVisible();
      await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
      await page.getByRole('button', { name: /load/i }).click();
    });

    await expect(
      page.getByRole('button', { name: /update tile layer/i }),
      'update tile layer button should be disabled by default'
    ).toBeDisabled();

    const colorFormulaInput = page.getByLabel(/color formula/i);
    await expect(
      colorFormulaInput,
      'Wait for the Band (R) dropdown to load'
    ).toBeVisible();

    await test.step('Change Color Formula input to random string', async () => {
      await colorFormulaInput.fill('playwright');
    });

    await test.step('validate GET request to /raster/cog/WebMercatorQuad/tilejson.json includes color_formula query parameter', async () => {
      const requestPromise = page.waitForRequest(
        (req) =>
          req.url().includes('color_formula=playwright') &&
          req.method() === 'GET'
      );

      await page.getByRole('button', { name: /update tile layer/i }).click();

      await requestPromise;
    });
  });

  test('resampling selection enables update tile layer and updates parameters', async ({
    page,
  }) => {
    await test.step('navigate to Cog Viewer Page', async () => {
      await page.goto('/cog-viewer');
    });

    await test.step('Load COG ViewerPage with mock response from /raster/cog/info endpoint', async () => {
      await expect(page.getByText('OpenStreetMap contributors')).toBeVisible();
      await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
      await page.getByRole('button', { name: /load/i }).click();
    });

    await test.step('Change Resampling input to Bilinear', async () => {
      await expect(
        page.getByRole('button', { name: /update tile layer/i }),
        'update tile layer button should be disabled by default'
      ).toBeDisabled();

      const resamplingDropdown = page.locator(
        '[data-testid="resampling"] .ant-select-selector'
      );
      await expect(
        resamplingDropdown,
        'Wait for the dropdown to load'
      ).toBeVisible();

      await resamplingDropdown.click();
      const resamplingOption = page.locator('.ant-select-item', {
        hasText: 'Bilinear',
      });
      await resamplingOption.click();
    });

    await test.step('validate GET request to /raster/cog/WebMercatorQuad/tilejson.json includes resampling=bilinear query parameter', async () => {
      const requestPromise = page.waitForRequest(
        (req) =>
          req.url().includes('resampling=bilinear') && req.method() === 'GET'
      );

      await page.getByRole('button', { name: /update tile layer/i }).click();

      await requestPromise;
    });
  });

  test('nodata entry enables update tile layer and updates parameters', async ({
    page,
  }) => {
    await test.step('navigate to Cog Viewer Page', async () => {
      await page.goto('/cog-viewer');
    });

    await test.step('Load COG ViewerPage with mock response from /raster/cog/info endpoint', async () => {
      await expect(page.getByText('OpenStreetMap contributors')).toBeVisible();
      await page.getByPlaceholder(/Enter COG URL/i).fill('s3://test.com');
      await page.getByRole('button', { name: /load/i }).click();
    });

    await test.step('Change nodata input to random number', async () => {
      await expect(
        page.getByRole('button', { name: /update tile layer/i })
      ).toBeDisabled();

      const nodataInput = page.getByLabel(/nodata value/i);
      await expect(
        nodataInput,
        'Wait for the Band (R) dropdown to load'
      ).toBeVisible();

      await nodataInput.fill('255');
    });

    await test.step('validate GET request to /raster/cog/WebMercatorQuad/tilejson.json includes resampling=bilinear query parameter', async () => {
      const requestPromise = page.waitForRequest(
        (req) => req.url().includes('nodata=255') && req.method() === 'GET'
      );

      await page.getByRole('button', { name: /update tile layer/i }).click();

      await requestPromise;
    });
  });
});
