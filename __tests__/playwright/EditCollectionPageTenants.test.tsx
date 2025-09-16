import { expect, test } from '@/__tests__/playwright/setup-msw';

const modifiedCollectionConfig = {
  id: 'PLAYWRIGHT_1234',
  title: 'MODIFIED test collection title',
  stac_version: '1.0.0',
  type: 'Collection',
  description: 'test collection description',
  license: 'test-license',
  extent: {
    spatial: {
      bbox: [[-180, -90, 180, 90]],
    },
    temporal: {
      interval: [['1998-01-01T00:00:00+00:00', null]],
    },
  },
  links: [
    {
      rel: 'items',
      type: 'application/geo+json',
      href: 'https://openveda.cloud/api/stac/collections/TEST/items',
    },
    {
      rel: 'parent',
      type: 'application/json',
      href: 'https://openveda.cloud/api/stac/',
    },
    {
      rel: 'root',
      type: 'application/json',
      href: 'https://openveda.cloud/api/stac/',
    },
    {
      rel: 'self',
      type: 'application/json',
      href: 'https://openveda.cloud/api/stac/collections/test',
    },
    {
      rel: 'http://www.opengis.net/def/rel/ogc/1.0/queryables',
      type: 'application/schema+json',
      title: 'Queryables',
      href: 'https://openveda.cloud/api/stac/collections/test/queryables',
    },
  ],
  providers: [
    {
      name: 'NASA VEDA',
      roles: ['host'],
      url: 'https://www.earthdata.nasa.gov/dashboard/',
    },
  ],
  assets: {
    thumbnail: {
      title: 'thumbnail title',
      description: 'thumbnail description',
      href: 'thumbnail href',
      type: 'image/jpeg',
      roles: ['thumbnail'],
    },
  },
  summaries: {
    'eo:bands': ['B1', 'B2'],
  },
};

test.describe('Tenant Functionality - Edit Collection Page', () => {
  test('Edit Collection preserves existing tenants in form mode', async ({
    page,
  }) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'PUT') {
        const putData = request.postDataJSON();

        expect(putData.formData.tenant).toEqual(['tenant1', 'tenant2']);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
        });
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
    });

    await test.step('wait for list of pending requests to load and pick #1', async () => {
      await page
        .getByRole('button', { name: /Ingest Request for seeded ingest #1/i })
        .click();
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

      await page.getByText('tenant1').click();
      await page.getByText('tenant2').click();

      // Close dropdown
      await page.keyboard.press('Escape');
    });

    await test.step('submit form and verify tenant changes', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
      // Verify the request includes the modified tenants
    });
  });

  test('Edit Collection handles tenants in JSON mode', async ({ page }) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'PUT') {
        const putData = request.postDataJSON();

        expect(putData.formData.tenant).toEqual(['tenant1', 'tenant3']);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
        });
      } else {
        await route.continue();
      }
    });
    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
    });

    await test.step('wait for list of pending requests to load and pick #1', async () => {
      await page
        .getByRole('button', { name: /Ingest Request for seeded ingest #1/i })
        .click();
    });

    await test.step('edit collection via JSON Editor', async () => {
      const updatedConfig = {
        ...modifiedCollectionConfig,
        id: 'Playwright_TEST',
        tenant: ['tenant1', 'tenant3'], // Change tenants
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
        page.locator('.ant-select-selection-item', { hasText: /tenant1/i })
      ).toBeVisible();
      await expect(
        page.locator('.ant-select-selection-item', { hasText: /tenant3/i })
      ).toBeVisible();
    });

    await test.step('submit form and verify tenant changes', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
      // Verify the request includes the modified tenants
    });
  });

  test('Edit Collection validates tenant changes', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
    });

    await test.step('wait for list of pending requests to load and pick #1', async () => {
      await page
        .getByRole('button', { name: /Ingest Request for seeded ingest #1/i })
        .click();
    });

    await test.step('verify available tenant options', async () => {
      const tenantDropdown = page.getByLabel('Tenant');
      await tenantDropdown.click();

      // Verify allowed tenants are present
      await expect(page.getByTitle('tenant1')).toBeVisible();
      await expect(page.getByTitle('tenant2')).toBeVisible();
      await expect(page.getByTitle('tenant3')).toBeVisible();

      const tenantScreenshot = await page.screenshot({
        animations: 'disabled',
      });
      testInfo.attach('Tenant Dropdown', {
        body: tenantScreenshot,
        contentType: 'image/png',
      });
    });

    await test.step('verify JSON validation for unauthorized tenants', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();

      const invalidConfig = {
        ...modifiedCollectionConfig,
        id: 'Playwright_TEST',
        tenant: ['tenant1', 'unauthorized-tenant'],
      };

      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(invalidConfig, null, 2));
      await page
        .getByRole('checkbox', { name: 'Enforce strict schema (' })
        .uncheck();
      await page.getByRole('button', { name: /apply changes/i }).click();

      // Should show validation error
      await expect(
        page.getByText(
          '"tenant/1 must be equal to one of the allowed values"',
          { exact: true }
        )
      ).toBeVisible();
    });
  });
});
