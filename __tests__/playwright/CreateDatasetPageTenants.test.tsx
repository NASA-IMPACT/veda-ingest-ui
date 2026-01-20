import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

const requiredConfig = {
  collection: 'test-collection',
  title: 'test title',
  description: 'test description',
  license: 'test license',
  discovery_items: [
    {
      filename_regex: '(.*)Test_(.*).tif$',
      use_multithreading: false,
      discovery: 's3',
      prefix: 'Test/',
      bucket: 'veda-test',
    },
  ],
  spatial_extent: {
    xmin: -123.4,
    ymin: 98.6,
    xmax: -98.6,
    ymax: 180,
  },
  temporal_extent: {
    startdate: '1901-01-01T00:00:00Z',
    enddate: '2025-01-01T23:59:59Z',
  },
  sample_files: ['s3://test/test/test_1950-01-01.tif'],
  data_type: 'cog',
  providers: [
    {
      name: 'NASA VEDA',
      roles: ['host'],
      url: 'https://www.earthdata.nasa.gov/dashboard/',
    },
  ],
  item_assets: {
    cog_default: {
      type: 'image/tiff; application=geotiff; profile=cloud-optimized',
      roles: ['data', 'layer'],
      title: 'Default COG Layer',
      description: 'Cloud optimized default layer to display on map',
    },
  },
  renders: {
    dashboard: {
      resampling: 'nearest',
      bidx: [1],
      colormap_name: 'rdbu',
      assets: ['cog_default'],
      rescale: [[-1, 1]],
      title: 'VEDA Dashboard Render Parameters',
    },
  },
  assets: {
    thumbnail: {
      title: 'thumbnail title',
      description: 'thumbnail description',
      href: 'thumbnail href',
      type: 'image/jpeg',
      roles: ['thumbnail'],
    },
  },
  stac_version: '1.0.0',
  stac_extensions: [
    'https://stac-extensions.github.io/render/v1.0.0/schema.json',
    'https://stac-extensions.github.io/item-assets/v1.0.0/schema.json',
  ],
  links: [],
};

const MOCK_GITHUB_URL = 'https://github.com/nasa-veda/veda-data/pull/12345';

test.describe('Tenant Functionality - Create Dataset Page', () => {
  test('Edit Dataset displays list of open PRs ordered by tenants', async ({
    page,
  }, testInfo) => {
    const seededTenants = {
      tenant1: ['seeded ingest #1'],
      tenant2: [],
      tenant3: ['seeded ingest #2', 'Seeded ingest #3'],
      public: ['Public Landsat ingest'],
    };

    await test.step('Navigate to Edit Dataset Page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of pending requests to load', async () => {
      await expect(
        page.getByRole('heading', {
          level: 3,
          name: /Edit Pending Ingest Requests/i,
        }),
        'Pending Ingest header is visible'
      ).toBeVisible();
    });

    await test.step('verify columns for each tenant', async () => {
      const cardTitles = page.locator('.ant-card-head-title');
      await expect(cardTitles, '4 columns should be visible').toHaveCount(4);

      const tenantKeys = Object.keys(seededTenants);
      for (let i = 0; i < tenantKeys.length; i++) {
        await expect(
          cardTitles.nth(i),
          `${tenantKeys[i]} should be visible`
        ).toHaveText(new RegExp(tenantKeys[i], 'i'));
      }
      await expect(
        cardTitles.last(),
        `public column should be visible`
      ).toHaveText(/public/i);
    });

    const tenantScreenshot = await page.screenshot({
      animations: 'disabled',
    });
    testInfo.attach('Ingest Requests Arranged by Tenant', {
      body: tenantScreenshot,
      contentType: 'image/png',
    });

    await test.step('verify ingests are in correct columns', async () => {
      for (const [tenant, requests] of Object.entries(seededTenants)) {
        const column = page.getByTestId(`tenant-column-${tenant}`);
        const requestButtons = column.getByRole('button');
        await expect(requestButtons).toHaveCount(requests.length);
        for (const requestName of requests) {
          await expect(
            column.getByRole('button', { name: new RegExp(requestName, 'i') })
          ).toBeVisible();
        }
      }
    });
  });

  test('Create Dataset with tenants in form mode', async ({
    page,
  }, testInfo) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(
          postData.data.tenant,
          'tenant key value should match selection'
        ).toEqual('tenant1');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ githubURL: MOCK_GITHUB_URL }),
        });
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to the Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste JSON without tenants', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(requiredConfig, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('select tenants', async () => {
      const tenantDropdown = page.getByLabel('Tenant');
      await tenantDropdown.click();

      const tenantScreenshot = await page.screenshot({
        animations: 'disabled',
      });
      testInfo.attach('Tenant Dropdown', {
        body: tenantScreenshot,
        contentType: 'image/png',
      });

      // Wait for dropdown to be visible and click the tenant option
      await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
      await page
        .locator('.ant-select-dropdown')
        .getByText('tenant1', { exact: true })
        .click();

      // Close dropdown
      await page.keyboard.press('Escape');

      // Verify selections
      await expect(
        page.locator('.ant-select-content-value', { hasText: /tenant1/i })
      ).toBeVisible();

      const selectedTenantScreenshot = await page.screenshot({
        animations: 'disabled',
      });
      testInfo.attach('Tenant Selection', {
        body: selectedTenantScreenshot,
        contentType: 'image/png',
      });
    });

    await test.step('submit form and verify tenants are included', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
      await page.getByRole('button', { name: /continue & submit/i }).click();
    });
  });

  test('not selecting tenants in form mode omits tenant key', async ({
    page,
  }) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(
          postData.data,
          'tenant key should not be included'
        ).not.toHaveProperty('tenant');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ githubURL: MOCK_GITHUB_URL }),
        });
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to the Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste JSON without tenants', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(requiredConfig, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('submit form and verify tenants are not included', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
      await page.getByRole('button', { name: /continue & submit/i }).click();
    });
  });

  test('Create Dataset with tenants in JSON mode', async ({ page }) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(
          postData.data.tenant,
          'tenant key value should match JSON entry'
        ).toEqual('tenant2');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ githubURL: MOCK_GITHUB_URL }),
        });
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to the Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste JSON with tenants', async () => {
      const configWithTenants = {
        ...requiredConfig,
        tenant: 'tenant2',
      };
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(configWithTenants, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('verify tenants persist when switching back to form', async () => {
      await page.getByRole('tab', { name: /form/i }).click();
      await expect(
        page.locator('.tenants-field').getByText('tenant2')
      ).toBeVisible();
    });

    await test.step('submit and verify tenants in request', async () => {
      await test.step('submit completed form', async () => {
        await page.getByRole('button', { name: /submit/i }).click();
      });

      await test.step('continue without adding a comment', async () => {
        await page.getByRole('button', { name: /continue & submit/i }).click();
      });

      await expect(
        page.getByRole('dialog', { name: /Ingestion Request Submitted/i })
      ).toBeVisible();
    });
  });

  test('Validate tenant restrictions enforced on JSON Editor', async ({
    page,
  }) => {
    await test.step('Navigate to the Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('verify JSON validation for unauthorized tenants', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();

      const invalidConfig = {
        ...requiredConfig,
        tenant: 'unauthorized-tenant',
      };

      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(invalidConfig, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();

      await expect(
        page.getByText('"tenant must be equal to one of the allowed values"', {
          exact: true,
        }),
        'Should show validation error'
      ).toBeVisible();

      await expect(
        page.getByTestId('json-editor'),
        'JSON Editor Should still be visible'
      ).toBeVisible();
    });
  });

  test('Create Dataset handles session without tenants in keycloak session', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    // Override the default session mock to remove tenants
    await worker.use(
      http.get('/api/auth/session', () => {
        return HttpResponse.json({
          user: {
            name: 'Mock User',
            email: 'test.user@example.com',
            image: null,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      })
    );

    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(
          postData.data,
          'tenant key should not be in POST data'
        ).not.toHaveProperty('tenant');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ githubURL: MOCK_GITHUB_URL }),
        });
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('verify tenant field is not present in form view', async () => {
      // The tenant field should not be visible in the form
      await expect(page.getByLabel('Tenant')).not.toBeVisible();
      await expect(page.locator('.tenants-field')).not.toBeVisible();

      const formViewScreenshot = await page.screenshot({
        animations: 'disabled',
      });
      testInfo.attach('Form View Without Tenant Field', {
        body: formViewScreenshot,
        contentType: 'image/png',
      });
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste JSON without tenants', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(requiredConfig, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('verify form submission succeeds without tenant field', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
      await page.getByRole('button', { name: /continue & submit/i }).click();

      // Verify submission was successful
      await expect(
        page.getByRole('dialog', { name: /Ingestion Request Submitted/i })
      ).toBeVisible();
    });
  });
});
