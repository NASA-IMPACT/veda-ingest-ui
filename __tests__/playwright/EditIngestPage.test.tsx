import { expect, test } from '@/__tests__/playwright/setup-msw';
import { validateFormFields } from './utils/ValidateFormFields';

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

test.describe('EditIngest Page', () => {
  test('edit Ingest does not allow renaming collection', async ({ page }) => {
    // Navigate to the page with COGControlsForm
    await page.goto('/edit-ingest');

    await page
      .getByRole('button', { name: /Ingest Request for seeded ingest #1/i })
      .click();
    await expect(page.getByLabel('Collection')).toBeDisabled();

    await page.getByRole('tab', { name: /manual json edit/i }).click();

    await page
      .getByTestId('json-editor')
      .fill('{"collection": "brand new name"}');
    await page.getByRole('button', { name: /apply changes/i }).click();
    await expect(
      page.getByText('Collection name cannot be changed!')
    ).toBeVisible();
  });
});
