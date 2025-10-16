import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

const requiredCollectionConfig = {
  id: 'PLAYWRIGHT_1234',
  title: 'test collection title',
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

const MOCK_GITHUB_URL = 'https://github.com/nasa-veda/veda-data/pull/12345';

test.describe('Tenant Functionality - Create Collection Page', () => {
  test('Create Collection with tenants in form mode', async ({
    page,
  }, testInfo) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(
          postData.data.tenant,
          'tenant key value should match selection'
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

    await test.step('Navigate to the Create Collection page', async () => {
      await page.goto('/create-collection');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste JSON without tenants', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(requiredCollectionConfig, null, 2));
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
        .getByText('tenant2', { exact: true })
        .click();

      // Close dropdown
      await page.keyboard.press('Escape');

      // Verify selection
      await expect(
        page.locator('.ant-select-selection-item', { hasText: /tenant2/i })
      ).toBeVisible();
    });

    const selectedTenantScreenshot = await page.screenshot({
      animations: 'disabled',
    });
    testInfo.attach('Tenant Selection', {
      body: selectedTenantScreenshot,
      contentType: 'image/png',
    });

    await test.step('submit form and verify tenants are included', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
      await page.getByRole('button', { name: /continue & submit/i }).click();
    });
  });

  test('Create Collection not selecting tenants in form mode omits tenant key', async ({
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

    await test.step('Navigate to the Create Collection page', async () => {
      await page.goto('/create-collection');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste JSON without tenants', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(requiredCollectionConfig, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('submit form and verify tenants are not included', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
      await page.getByRole('button', { name: /continue & submit/i }).click();
    });
  });

  test('Create Collection with tenants in JSON mode', async ({ page }) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(
          postData.data.tenant,
          'tenant key value should match JSON entry'
        ).toEqual('tenant3');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ githubURL: MOCK_GITHUB_URL }),
        });
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to the Create Collection page', async () => {
      await page.goto('/create-collection');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste JSON with tenants', async () => {
      const configWithTenants = {
        ...requiredCollectionConfig,
        tenant: 'tenant3',
      };
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(configWithTenants, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('verify tenants persist when switching back to form', async () => {
      await page.getByRole('tab', { name: /form/i }).click();
      await expect(
        page.locator('.tenants-field').getByText('tenant3')
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
    await test.step('Navigate to the Create Collection page', async () => {
      await page.goto('/create-collection');
    });

    await test.step('enter unauthorized tenants via JSON', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();

      const invalidConfig = {
        ...requiredCollectionConfig,
        tenant: 'unauthorized-tenant',
      };

      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(invalidConfig, null, 2));
    });

    await test.step('verify JSON validation for unauthorized tenants', async () => {
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

  test('Create Collection handles session without tenants in keycloak session', async ({
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

    await test.step('Navigate to Create Collection page', async () => {
      await page.goto('/create-collection');
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
        .fill(JSON.stringify(requiredCollectionConfig, null, 2));
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
