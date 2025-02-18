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
  test('create Ingest handles errors with pasted JSON', async ({ page }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/create-ingest');

    await page.getByRole('tab', { name: /manual json edit/i }).click();
    await expect(
      page.getByRole('button', { name: /apply changes/i })
    ).toBeDisabled();

    await page.getByTestId('json-editor').fill('s3://test.com');
    await page.getByRole('button', { name: /apply changes/i }).click();
    await expect(page.getByText('Invalid JSON format.')).toBeVisible();
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
          .filter({ hasText: `must have required property '${property}'` })
      ).toBeVisible();
    }

    // additional property of "validJSON": true is present
    await expect(
      page
        .getByRole('listitem')
        .filter({ hasText: 'must NOT have additional properties' })
    ).toBeVisible();
  });

  test('create Ingest request submitted with pasted JSON', async ({ page }) => {
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
    await page.goto('/create-ingest');

    await page.getByRole('tab', { name: /manual json edit/i }).click();
    await expect(
      page.getByRole('button', { name: /apply changes/i })
    ).toBeDisabled();

    await page.getByTestId('json-editor').fill(JSON.stringify(requiredConfig));
    await page.getByRole('button', { name: /apply changes/i }).click();

    await validateFormFields(page, requiredConfig);

    await page.getByRole('button', { name: /submit/i }).click();
  });

  test('create Ingest submits extra fields with toggle enabled', async ({
    page,
  }) => {
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
    // Navigate to the page with COGControlsForm
    await page.goto('/create-ingest');

    await page.getByRole('tab', { name: /manual json edit/i }).click();

    await page
      .getByRole('checkbox', { name: /enforce strict schema/i })
      .uncheck();
    await page
      .getByTestId('json-editor')
      .fill(JSON.stringify({ ...requiredConfig, extraField: true }));
    await page.getByRole('button', { name: /apply changes/i }).click();

    await page.getByRole('button', { name: /submit/i }).click();
  });
});
