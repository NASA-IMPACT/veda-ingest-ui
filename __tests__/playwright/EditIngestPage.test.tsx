import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

const modifiedConfig = {
  collection: 'seeded-ingest-1',
  title: 'test title',
  description: 'test description',
  license: 'test license',
  tenant: ['tenant1', 'tenant2'],
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
  test('Edit Dataset does not allow renaming collection', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to Edit Dataset Page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of of pending requests to load and pick #1', async () => {
      await page
        .getByRole('button', { name: /Ingest Request for seeded ingest #1/i })
        .click();
    });

    await expect(
      page.getByLabel('Collection'),
      'Collection Input should be disabled'
    ).toBeDisabled();

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('attempt renaming collection via JSON Editor', async () => {
      await page
        .getByTestId('json-editor')
        .fill(
          JSON.stringify({ ...modifiedConfig, collection: 'brand new name' })
        );
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await expect(
      page.getByText('Collection name cannot be changed!'),
      'error message appears for attempting Collection name rename'
    ).toBeVisible();

    const errorMessageScreenshot = await page.screenshot({
      fullPage: true,
      animations: 'disabled',
    });
    testInfo.attach('Error message for attempting rename', {
      body: errorMessageScreenshot,
      contentType: 'image/png',
    });
  });

  test('Edit Dataset allows editing fields other than collection name', async ({
    page,
  }, testInfo) => {
    // Intercept and block the request
    await page.route('**/create-dataset', async (route, request) => {
      if (request.method() === 'PUT') {
        const postData = request.postDataJSON(); // Capture full request body

        expect(postData, 'validate filePath property exists').toHaveProperty(
          'filePath'
        );
        expect(postData, 'validate fileSha property exists').toHaveProperty(
          'fileSha'
        );

        expect(postData, 'validate formData property exists').toHaveProperty(
          'formData'
        );

        // make sure the dashboard object is a prettified string before asserting
        const expectedModifiedConfig = {
          ...modifiedConfig,
          renders: {
            ...modifiedConfig.renders,
            dashboard: JSON.stringify(
              modifiedConfig.renders.dashboard,
              null,
              2
            ),
          },
        };

        expect(
          postData.formData,
          'validate formData matches modified json'
        ).toMatchObject(expectedModifiedConfig);

        // Block the request
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to Edit Dataset Page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of of pending requests to load and pick #1', async () => {
      await page
        .getByRole('button', { name: /Ingest Request for seeded ingest #1/i })
        .click();
    });

    await expect(
      page.getByLabel('Collection'),
      'Collection Input should be disabled'
    ).toBeDisabled();

    const initialFormScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('initial form with disabled Collection', {
      body: initialFormScreenshot,
      contentType: 'image/png',
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('attempt renaming collection via JSON Editor', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(modifiedConfig));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    const completedFormScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('form with values pasted in JSON editor', {
      body: completedFormScreenshot,
      contentType: 'image/png',
    });

    await test.step('submit form and validate that PUT body values match pasted config values', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });
  });

  test('Edit Dataset displays list of open PRs starting with "Ingest Request for"', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to Edit Dataset Page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('verify list of of pending requests loads', async () => {
      await expect(
        page.getByRole('button', {
          name: /Ingest Request for seeded ingest #1/i,
        })
      ).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: /Ingest Request for seeded ingest #2/i,
        })
      ).toBeVisible();
    });

    const listIngestRequestsScreenshot = await page.screenshot({
      fullPage: true,
    });
    testInfo.attach('filtered list of open PRs', {
      body: listIngestRequestsScreenshot,
      contentType: 'image/png',
    });
  });

  test('Error Handling - Edit Dataset gracefully handles failed /list-requests call', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    await worker.use(
      http.get('/api/list-ingests', ({ request }) => {
        return HttpResponse.json(
          { error: 'something went wrong' },
          { status: 400 }
        );
      })
    );

    await test.step('Navigate to Edit Dataset Page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('verify error modal loads', async () => {
      await expect(
        page.getByRole('dialog', { name: /Something went wrong/i })
      ).toBeVisible();
    });

    const unknownErrorScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('api error listing pending PRs', {
      body: unknownErrorScreenshot,
      contentType: 'image/png',
    });
  });

  test('Error Handling - Edit Dataset gracefully handles failed /retrieve-ingest call', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    await worker.use(
      http.get('/api/retrieve-ingest', ({ request }) => {
        return HttpResponse.json(
          { error: 'something went wrong' },
          { status: 400 }
        );
      })
    );

    await test.step('Navigate to Edit Dataset Page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of of pending requests to load and pick #1', async () => {
      await page
        .getByRole('button', { name: /Ingest Request for seeded ingest #1/i })
        .click();
    });

    await test.step('verify error modal loads', async () => {
      await expect(
        page.getByRole('dialog', { name: /Something went wrong/i })
      ).toBeVisible();
      await expect(
        page
          .getByRole('dialog', { name: /Something went wrong/i })
          .getByText('updating Ingest request for seeded ingest #1')
      ).toBeVisible();
    });

    const loadingErrorScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('api error loading requests', {
      body: loadingErrorScreenshot,
      contentType: 'image/png',
    });
  });

  test('Edit Dataset preserves existing tenants in form mode', async ({
    page,
    worker,
    http,
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

    await test.step('Navigate to Edit Dataset page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of pending requests and select first item', async () => {
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

  test('Edit Dataset handles tenants in JSON mode', async ({
    page,
    worker,
    http,
  }) => {
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

    await test.step('Navigate to Edit Dataset page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of pending requests and select first item', async () => {
      await page
        .getByRole('button', { name: /Ingest Request for seeded ingest #1/i })
        .click();
    });

    await test.step('edit dataset via JSON Editor', async () => {
      const updatedConfig = {
        ...modifiedConfig,
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

    await test.step('submit and verify tenant changes', async () => {
      await page.getByRole('button', { name: /submit/i }).click();

      // Verify the request includes the modified tenants
    });
  });

  test('Edit Dataset validates tenant changes', async ({ page }) => {
    await test.step('Navigate to Edit Dataset page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of pending requests and select first item', async () => {
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
    });

    await test.step('verify JSON validation for unauthorized tenants', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();

      const invalidConfig = {
        ...modifiedConfig,
        tenant: ['tenant1', 'unauthorized-tenant'],
      };

      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(invalidConfig, null, 2));
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
