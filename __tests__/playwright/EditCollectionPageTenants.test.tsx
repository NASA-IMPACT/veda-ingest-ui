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
  test('Edit Collection displays list of open PRs ordered by tenants', async ({
    page,
  }, testInfo) => {
    const seededTenants = {
      tenant1: ['seeded ingest #1'],
      tenant2: [],
      tenant3: ['seeded ingest #2', 'seeded ingest #3'],
      public: ['Public Landsat ingest'],
    };

    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
    });

    await test.step('wait for list of pending requests to load', async () => {
      await expect(
        page.getByRole('heading', {
          level: 3,
          name: /Pending Ingest Requests/i,
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

  test('Edit Collection preserves existing tenants in form mode', async ({
    page,
  }) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'PUT') {
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

    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
    });

    await test.step('wait for list of pending requests to load and pick #1', async () => {
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });

    await test.step('verify existing tenants are hidden', async () => {
      await expect(
        page.locator('.ant-select-selection-item', { hasText: /tenant1/i })
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

        expect(putData.formData.tenant).toEqual('tenant3');

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
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });

    await test.step('edit collection via JSON Editor', async () => {
      const updatedConfig = {
        ...modifiedCollectionConfig,
        id: 'Playwright_TEST',
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
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
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
        tenant: 'unauthorized-tenant',
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
        page.getByText('"tenant must be equal to one of the allowed values"', {
          exact: true,
        })
      ).toBeVisible();
    });
  });
});
