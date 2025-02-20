import { expect, test } from '@/__tests__/playwright/setup-msw';
import { validateFormFields } from './utils/ValidateFormFields';

const modifiedConfig = {
  collection: 'seeded-ingest-1',
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

test.describe('EditIngest Page', () => {
  test('Edit Ingest does not allow renaming collection', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to Edit Ingest Page', async () => {
      await page.goto('/edit-ingest');
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
      'error message appears for attempting Collection rename'
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

  test('Edit Ingest allows editing fields other than collection name', async ({
    page,
  }, testInfo) => {
    // Intercept and block the request
    await page.route('**/create-ingest', async (route, request) => {
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

        expect(
          postData.formData,
          'validate formData matches modified json'
        ).toEqual(expect.objectContaining(modifiedConfig));

        // Block the request
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to Edit Ingest Page', async () => {
      await page.goto('/edit-ingest');
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
});
