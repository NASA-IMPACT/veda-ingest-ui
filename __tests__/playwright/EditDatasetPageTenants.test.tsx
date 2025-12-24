import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

const modifiedConfig = {
  collection: 'seeded-ingest-1',
  title: 'test title',
  description: 'test description',
  license: 'test license',
  tenant: 'tenant2',
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
  assets: {
    thumbnail: {
      title: 'thumbnail title',
      description: 'thumbnail description',
      href: 'thumbnail href',
      type: 'image/jpeg',
      roles: ['thumbnail'],
    },
  },
  renders: {
    dashboard: {
      json: true,
    },
  },
};

test.describe('Edit Dataset Page', () => {
  test('Edit Dataset preserves existing tenants in form mode', async ({
    page,
  }, testInfo) => {
    let putRequestIntercepted = false;

    // Intercept and validate the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'PUT') {
        putRequestIntercepted = true;
        const putData = request.postDataJSON();

        expect(putData.formData.tenant).toEqual('tenant1');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
        });
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to Edit Dataset page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of pending requests and select first item', async () => {
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });

    await test.step('verify existing tenants are hidden', async () => {
      await expect(
        page.locator('.ant-select-selection-item', { hasText: /tenant1/i })
      ).toBeHidden();
      await expect(
        page.locator('.ant-select-selection-item', { hasText: /tenant2/i })
      ).toBeHidden();
    });

    await test.step('modify tenants', async () => {
      const tenantDropdown = page.getByLabel('Tenant');
      await tenantDropdown.click();

      // Wait for dropdown to be visible and click the tenant option
      await page.locator('.ant-select-dropdown').waitFor({ state: 'visible' });
      await page
        .locator('.ant-select-dropdown')
        .getByText('tenant1', { exact: true })
        .click();

      // Close dropdown
      await page.keyboard.press('Escape');
    });

    page.getByRole('button', { name: /submit/i }).click();

    await test.step('review changes in diff modal', async () => {
      await expect(
        page.getByRole('dialog', { name: /review changes/i })
      ).toBeVisible();

      const diffModalScreenshot = await page.screenshot({ fullPage: true });
      testInfo.attach('diff modal showing changes', {
        body: diffModalScreenshot,
        contentType: 'image/png',
      });
    });

    await test.step('submit form and verify tenant changes', async () => {
      // Wait for the PUT request to be made
      const requestPromise = page.waitForRequest(
        (req) =>
          req.url().includes('/api/create-ingest') && req.method() === 'PUT'
      );

      await page.getByRole('button', { name: /confirm changes/i }).click();

      // Ensure the request was actually made
      await requestPromise;

      // Verify our route handler was called
      expect(
        putRequestIntercepted,
        'PUT request should have been intercepted'
      ).toBe(true);
    });
  });

  test('Edit Dataset handles tenants in JSON mode', async ({
    page,
  }, testInfo) => {
    let putRequestIntercepted = false;

    // Intercept and validate the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'PUT') {
        putRequestIntercepted = true;
        const putData = request.postDataJSON();

        expect(putData.formData.tenant).toEqual('tenant3');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
        });
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to Edit Dataset page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of pending requests and select first item', async () => {
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });

    await test.step('edit dataset via JSON Editor', async () => {
      const updatedConfig = {
        ...modifiedConfig,
        tenant: 'tenant3',
      };

      await expect(page.locator('.tenants-field')).toBeVisible();

      await page.getByRole('tab', { name: /manual json edit/i }).click();

      await page.getByTestId('json-editor').fill(JSON.stringify(updatedConfig));

      await page
        .getByRole('checkbox', { name: 'Enforce strict schema (' })
        .uncheck();

      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('verify tenant changes in form view', async () => {
      await expect(page.locator('.tenants-field')).toBeVisible();

      await expect(
        page.locator('.ant-select-selection-item', { hasText: /tenant3/i })
      ).toBeVisible();
    });

    page.getByRole('button', { name: /submit/i }).click();

    await test.step('review changes in diff modal', async () => {
      await expect(
        page.getByRole('dialog', { name: /review changes/i })
      ).toBeVisible();

      const diffModalScreenshot = await page.screenshot({ fullPage: true });
      testInfo.attach('diff modal showing changes', {
        body: diffModalScreenshot,
        contentType: 'image/png',
      });
    });

    await test.step('submit and verify tenant changes', async () => {
      // Wait for the PUT request to be made
      const requestPromise = page.waitForRequest(
        (req) =>
          req.url().includes('/api/create-ingest') && req.method() === 'PUT'
      );

      await page.getByRole('button', { name: /confirm changes/i }).click();

      // Ensure the request was actually made
      await requestPromise;

      // Verify our route handler was called
      expect(
        putRequestIntercepted,
        'PUT request should have been intercepted'
      ).toBe(true);
    });
  });

  test('Edit Dataset validates tenant changes', async ({ page }) => {
    await test.step('Navigate to Edit Dataset page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of pending requests and select first item', async () => {
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });

    await test.step('verify available tenant options', async () => {
      const tenantDropdown = page.getByLabel('Tenant');
      await tenantDropdown.click();

      // Verify allowed tenants are present
      await expect(page.getByTitle('tenant1')).toBeVisible();
      await expect(page.getByTitle('tenant2')).toBeVisible();
      await expect(page.getByTitle('tenant3')).toBeVisible();
    });

    await test.step('verify JSON validation for unauthorized tenants', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();

      const invalidConfig = {
        ...modifiedConfig,
        tenant: 'unauthorized-tenant',
      };

      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(invalidConfig, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();

      // Should show validation error
      await expect(
        page.getByText('"tenant must be equal to one of the allowed values"', {
          exact: true,
        })
      ).toBeVisible();
    });
  });
});
