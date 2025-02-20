import { expect, test } from '@/__tests__/playwright/setup-msw';
import { validateFormFields } from '../playwright/utils/ValidateFormFields';

const requiredConfig = {
  collection: 'test-collection',
  title: 'test title',
  description: 'test description',
  license: 'test license',
  discovery_items: [
    {
      upload: false,
      cogify: false,
      dry_run: false,
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
};

test.describe('CreateIngest Page', () => {
  test('create Ingest handles errors with pasted JSON', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to the Create Ingest page', async () => {
      await page.goto('/create-ingest');
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
      await page.getByTestId('json-editor').fill('{"validJSON": true}');
      await page.getByRole('button', { name: /apply changes/i }).click();
      await expect(page.getByText('Schema Validation Errors:')).toBeVisible();
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
        'item_assets',
      ];

      for (const property of requiredProperties) {
        await expect(
          page
            .getByRole('listitem')
            .filter({ hasText: `must have required property '${property}'` }),
          `${property} error message should be visible`
        ).toBeVisible();
      }

      await expect(
        page
          .getByRole('listitem')
          .filter({ hasText: 'must NOT have additional properties' }),
        'additional property in JSON should create error'
      ).toBeVisible();
    });

    const errorMessagesScreenshot = await page.screenshot();
    testInfo.attach(
      'Default state of COG Viewer Form Controls for single band COG',
      {
        body: errorMessagesScreenshot,
        contentType: 'image/png',
      }
    );
  });

  test('Create Ingest request submitted with pasted JSON', async ({
    page,
  }, testInfo) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON(); // Capture full request body

        // Validate the nested JSON field if it's present in the request
        if (postData.renders.dashboard) {
          const actualNestedJson = JSON.parse(postData.renders.dashboard); // Convert received string to JSON
          expect(actualNestedJson).toEqual(requiredConfig.renders.dashboard);
        }

        // Extract only the expected fields from postData (ignoring others)
        const { nestedJsonField, ...filteredPostData } = postData; // Exclude nestedJsonField from object comparison
        const { renders, ...filteredRequiredConfig } = requiredConfig;

        // Validate all other expected fields (except the nested one)
        expect(filteredPostData).toEqual(
          expect.objectContaining(filteredRequiredConfig)
        );

        // Block the request
        await route.abort();
      } else {
        await route.continue();
      }
    });
    await test.step('Navigate to the Create Ingest page', async () => {
      await page.goto('/create-ingest');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await expect(
      page.getByRole('button', { name: /apply changes/i }),
      'Apply Changes should be disabled if no changes are made'
    ).toBeDisabled();

    await test.step('paste a JSON with config options matching schema minimum', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(requiredConfig));
      const JSONScreenshot = await page.screenshot();
      testInfo.attach('pasted JSON in editor', {
        body: JSONScreenshot,
        contentType: 'image/png',
      });
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('validate that form tab displays with pasted json values now populated in form', async () => {
      await validateFormFields(page, requiredConfig);
    });

    const completedFormScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('frm with values pasted in JSON editor', {
      body: completedFormScreenshot,
      contentType: 'image/png',
    });

    await test.step('submit form and validate that POST body values match pasted config values', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });
  });

  test('Create Ingest allows extra fields with toggle enabled', async ({
    page,
  }, testInfo) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON(); // Capture full request body

        // Validate all other expected fields (except the nested one)
        expect(postData).toEqual(expect.objectContaining({ extraField: true }));

        // Block the request
        await route.abort();
      } else {
        await route.continue();
      }
    });
    await test.step('Navigate to the Create Ingest page', async () => {
      await page.goto('/create-ingest');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('uncheck the Enforce Strict Schema  checkbox', async () => {
      await page
        .getByRole('checkbox', { name: /enforce strict schema/i })
        .uncheck();
    });

    await test.step('paste in a valid config with an additional field', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify({ ...requiredConfig, extraField: true }));
      const JSONScreenshot = await page.screenshot();
      testInfo.attach('pasted JSON in editor', {
        body: JSONScreenshot,
        contentType: 'image/png',
      });
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('submit form and validate that POST body values match pasted config values including extra field', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });
  });
});
