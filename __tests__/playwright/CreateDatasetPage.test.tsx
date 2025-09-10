import { expect, test } from '@/__tests__/playwright/setup-msw';
import { validateIngestFormFields } from '../playwright/utils/ValidateFormFields';
import { HttpResponse, http } from 'msw';

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

test.describe('Create Dataset Page', () => {
  test('Create Dataset request displays github link to PR', async ({
    page,
    worker,
    http,
  }, testInfo) => {
    await worker.use(
      http.post('/api/create-ingest', async () => {
        return HttpResponse.json({ githubURL: MOCK_GITHUB_URL });
      })
    );

    await test.step('Navigate to the Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste a JSON with config options matching schema minimum', async () => {
      const { stac_version, stac_extensions, links, ...minimalConfig } =
        requiredConfig;
      await page.getByTestId('json-editor').fill(JSON.stringify(minimalConfig));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('submit completed form', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });

    await test.step('continue without adding a comment', async () => {
      await page.getByRole('button', { name: /continue & submit/i }).click();
    });

    const successDialog = page.getByRole('dialog', {
      name: /Ingestion Request Submitted/i,
    });

    await expect(successDialog).toBeVisible();

    const githubLink = page.getByRole('link', { name: /github/i }).first();
    await expect(githubLink).toBeVisible();

    const href = await githubLink.getAttribute('href');
    expect(href).toBe(MOCK_GITHUB_URL);

    const successScreenshot = await page.screenshot();
    testInfo.attach('success modal with github link', {
      body: successScreenshot,
      contentType: 'image/png',
    });
  });

  test('Create Dataset request submitted with pasted JSON', async ({
    page,
  }, testInfo) => {
    // Intercept and block the request
    await page.route('**/create-dataset', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(postData.ingestionType).toBe('dataset');

        const { renders: receivedRendersObj, ...restOfReceivedData } =
          postData.data;
        const { renders: expectedRendersObj, ...restOfExpectedData } =
          requiredConfig;

        const receivedRenders = JSON.parse(receivedRendersObj.dashboard);
        const expectedRenders = expectedRendersObj.dashboard;

        expect(receivedRenders).toEqual(expectedRenders);

        expect(restOfReceivedData).toEqual(
          expect.objectContaining(restOfExpectedData)
        );

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

    await expect(
      page.getByRole('button', { name: /apply changes/i }),
      'Apply Changes should be disabled if no changes are made'
    ).toBeDisabled();

    await test.step('paste a JSON with config options matching schema minimum', async () => {
      const { stac_version, stac_extensions, links, ...minimalConfig } =
        requiredConfig;
      await page.getByTestId('json-editor').fill(JSON.stringify(minimalConfig));
      const JSONScreenshot = await page.screenshot();
      testInfo.attach('pasted JSON in editor', {
        body: JSONScreenshot,
        contentType: 'image/png',
      });
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('validate that form tab displays with pasted json values now populated in form', async () => {
      await validateIngestFormFields(page, requiredConfig);
    });

    const completedFormScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('form with values pasted in JSON editor', {
      body: completedFormScreenshot,
      contentType: 'image/png',
    });

    await test.step('submit form and validate that POST body values match pasted config values', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });

    await test.step('continue without adding a comment', async () => {
      await page.getByRole('button', { name: /continue & submit/i }).click();
    });

    const successDialog = page.getByRole('dialog', {
      name: /Ingestion Request Submitted/i,
    });

    await expect(successDialog).toBeVisible();
  });

  test('Create Dataset allows extra fields with toggle enabled', async ({
    page,
  }, testInfo) => {
    // Intercept and block the request
    await page.route('**/create-dataset', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(postData.ingestionType).toBe('dataset');
        expect(postData.data).toEqual(
          expect.objectContaining({ extraField: true })
        );

        await route.abort();
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

    await test.step('uncheck the Enforce Strict Schema checkbox', async () => {
      await page
        .getByRole('checkbox', { name: /enforce strict schema/i })
        .uncheck();
    });

    await test.step('paste in a valid config with an additional field', async () => {
      const { stac_version, stac_extensions, links, ...minimalConfig } =
        requiredConfig;
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify({ ...minimalConfig, extraField: true }));
      const JSONScreenshot = await page.screenshot();
      testInfo.attach('pasted JSON in editor with extra field', {
        body: JSONScreenshot,
        contentType: 'image/png',
      });

      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('verify that extra properties are displayed on the form tab', async () => {
      const formTabPanel = page.getByRole('tabpanel', { name: 'Form' });

      const extraPropertiesCard = formTabPanel.getByTestId(
        'extra-properties-card'
      );
      await expect(
        extraPropertiesCard,
        'The extra properties card should be visible'
      ).toBeVisible();

      const codeEditor = extraPropertiesCard.locator('textarea');
      await expect(
        codeEditor,
        'The code editor for the extra property should be visible'
      ).toBeVisible();

      const expectedValue = JSON.stringify({ extraField: true }, null, 2);
      await expect(
        codeEditor,
        'The editor should contain the correct JSON'
      ).toHaveValue(expectedValue);
    });

    const extraPropertiesScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('extra properties listed on form tab', {
      body: extraPropertiesScreenshot,
      contentType: 'image/png',
    });

    await test.step('submit form and validate that POST body values match pasted config values including extra field', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });

    await test.step('continue without adding a comment', async () => {
      await page.getByRole('button', { name: /continue & submit/i }).click();
    });
  });

  test('Create Dataset handles errors with pasted JSON', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to the Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });
    await expect(
      page.getByRole('button', { name: /apply changes/i }),
      'Apply Changes should be disabled if no changes are made'
    ).toBeDisabled();

    await test.step('paste a non-JSON string in the editor and check for error message', async () => {
      await page.getByTestId('json-editor').fill('s3://test.com');
      await page.getByRole('button', { name: /apply changes/i }).click();
      await expect(page.getByText('Invalid JSON format.')).toBeVisible();
    });

    await test.step('paste a JSON not matching required schema in the editor and check for error message', async () => {
      await page.getByTestId('json-editor').fill('{}');
      await page.getByRole('button', { name: /apply changes/i }).click();

      await expect(page.getByText('Schema Validation Errors')).toBeVisible();

      // The list of properties that are expected to be missing.
      const requiredProperties = [
        'collection',
        'title',
        'description',
        'license',
        'discovery_items',
        'spatial_extent',
        'temporal_extent',
        'sample_files',
        'data_type',
        'providers',
        'renders',
      ];

      const errorCard = page.getByTestId('extra-properties-card');
      await expect(
        errorCard,
        'The error card container should be visible'
      ).toBeVisible();

      const errorTags = errorCard.locator('.ant-tag');
      await expect(
        errorTags,
        `Should display ${requiredProperties.length} error tags`
      ).toHaveCount(requiredProperties.length);

      await test.step('verify clicking each error tag shows the correct detail', async () => {
        for (let i = 0; i < requiredProperties.length; i++) {
          const propertyName = requiredProperties[i];
          const expectedTagText = `Error ${i + 1}`;
          const expectedErrorMessage = `must have required property '${propertyName}'`;

          await errorCard.getByText(expectedTagText, { exact: true }).click();

          const codeEditor = errorCard.locator('textarea');
          await expect(
            codeEditor,
            `Editor for ${expectedTagText} should be visible`
          ).toBeVisible();

          const expectedValue = JSON.stringify(
            { [expectedTagText]: expectedErrorMessage },
            null,
            2
          );
          await expect(
            codeEditor,
            `Editor for ${expectedTagText} should show correct error message`
          ).toHaveValue(expectedValue);
        }
      });
    });

    const errorMessagesScreenshot = await page.screenshot();
    testInfo.attach('Schema validation error messages', {
      body: errorMessagesScreenshot,
      contentType: 'image/png',
    });
  });

  test('Error Handling - Duplicate collection name displays error modal', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    await worker.use(
      http.post('/api/create-ingest', () => {
        return HttpResponse.json(
          { error: 'Reference already exists' },
          { status: 400 }
        );
      })
    );

    await test.step('Navigate to the Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste a JSON with config options matching schema minimum', async () => {
      const { stac_version, stac_extensions, links, ...minimalConfig } =
        requiredConfig;
      await page.getByTestId('json-editor').fill(JSON.stringify(minimalConfig));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('submit completed form', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });

    await test.step('continue without adding a comment', async () => {
      await page.getByRole('button', { name: /continue & submit/i }).click();
    });

    await expect(
      page.getByRole('dialog', { name: /Collection Name Exists/i })
    ).toBeVisible();

    const duplicateCollectionScreenshot = await page.screenshot();
    testInfo.attach('error modal for duplicate collection name', {
      body: duplicateCollectionScreenshot,
      contentType: 'image/png',
    });
  });

  test('Error Handling - Failed github authentication displays error modal', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    await worker.use(
      http.post('/api/create-ingest', () => {
        return HttpResponse.json(
          { error: 'Failed to fetch GitHub token' },
          { status: 400 }
        );
      })
    );

    await test.step('Navigate to the Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste a JSON with config options matching schema minimum', async () => {
      const { stac_version, stac_extensions, links, ...minimalConfig } =
        requiredConfig;
      await page.getByTestId('json-editor').fill(JSON.stringify(minimalConfig));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('submit completed form', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });

    await test.step('continue without adding a comment', async () => {
      await page.getByRole('button', { name: /continue & submit/i }).click();
    });

    await expect(
      page.getByRole('dialog', { name: /Something Went Wrong/i })
    ).toBeVisible();

    const errorScreenshot = await page.screenshot();
    testInfo.attach('error modal for failed GitHub authentication', {
      body: errorScreenshot,
      contentType: 'image/png',
    });
  });

  test('Hide extended Discovery Items fields by default', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to the Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await expect(
      page.getByRole('button', { name: /more options/i, expanded: false }),
      'more options should not be expanded'
    ).toBeVisible();

    const DiscoveryFieldset = page.locator('#root_discovery_items');
    const hiddenFields = [
      'Datetime Range',
      'Start Datetime',
      'End Datetime',
      'Id Regex',
      'Id Template',
      'Use Multithreading',
    ];

    for (const field of hiddenFields) {
      await expect(
        DiscoveryFieldset.getByLabel(field),
        `${field} should be hidden`
      ).toBeHidden();
    }

    const collapsedScreenshot = await DiscoveryFieldset.screenshot();
    testInfo.attach('collapsed Discovery Items', {
      body: collapsedScreenshot,
      contentType: 'image/png',
    });
    await test.step('click more option button', async () => {
      await page
        .getByRole('button', { name: /more options/i, expanded: false })
        .click();
    });

    await expect(
      page.getByRole('button', { name: /more options/i, expanded: true }),
      'more options should be expanded'
    ).toBeVisible();

    for (const field of hiddenFields) {
      await expect(
        DiscoveryFieldset.getByLabel(field),
        `${field} should be visible`
      ).toBeVisible();
    }
    const expandedScreenshot = await DiscoveryFieldset.screenshot();
    testInfo.attach('Expanded Discovery Items', {
      body: expandedScreenshot,
      contentType: 'image/png',
    });
  });

  test('Create Dataset with tenants in form mode', async ({
    page,
    worker,
    http,
  }) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(postData.data.tenant).toEqual(['tenant1', 'tenant2']);

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
      };
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(configWithTenants, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('select tenants', async () => {
      const tenantDropdown = page.getByLabel('Tenant');
      await tenantDropdown.click();

      // Select two tenants
      await page.getByText('tenant1').click();
      await page.getByText('tenant2').click();

      // Close dropdown
      await page.keyboard.press('Escape');

      // Verify selections
      await expect(
        page.locator('.ant-select-selection-item', { hasText: /tenant1/i })
      ).toBeVisible();
      await expect(
        page.locator('.ant-select-selection-item', { hasText: /tenant2/i })
      ).toBeVisible();
    });

    await test.step('submit form and verify tenants are included', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
      await page.getByRole('button', { name: /continue & submit/i }).click();
    });
  });

  test('Create Dataset with tenants in JSON mode', async ({
    page,
    worker,
    http,
  }) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(postData.data.tenant).toEqual(['tenant1', 'tenant2']);

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
        tenant: ['tenant1', 'tenant2'],
      };
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(configWithTenants, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('verify tenants persist when switching back to form', async () => {
      await page.getByRole('tab', { name: /form/i }).click();
      await expect(
        page.locator('.tenants-field').getByText('tenant1tenant2')
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

  test('Validate tenant restrictions', async ({ page }) => {
    await test.step('Navigate to the Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('verify JSON validation for unauthorized tenants', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();

      const invalidConfig = {
        ...requiredConfig,
        tenant: ['tenant1', 'unauthorized-tenant'],
      };

      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(invalidConfig, null, 2));
      await page.getByRole('button', { name: /apply changes/i }).click();

      await expect(
        page.getByText(
          '"tenant/1 must be equal to one of the allowed values"',
          { exact: true }
        ),
        'Should show validation error'
      ).toBeVisible();

      await expect(
        page.getByTestId('json-editor'),
        'JSON Editor Should still be visible'
      ).toBeVisible();
    });
  });
});
