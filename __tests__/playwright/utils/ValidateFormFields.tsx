import { Page, expect } from '@playwright/test';

export async function validateIngestFormFields(
  page: Page,
  expectedValues: any
) {
  // Simple field assertions
  await expect(page.getByText('Invalid JSON format.')).toBeHidden();
  await expect(page.getByLabel('Collection')).toHaveValue(
    expectedValues.collection
  );
  await expect(page.getByLabel('Title').first()).toHaveValue(
    expectedValues.title
  );
  await expect(page.getByLabel('License')).toHaveValue(expectedValues.license);
  await expect(page.getByLabel('Data Type')).toHaveValue(
    expectedValues.data_type
  );
  await expect(page.getByLabel('STAC Version')).toHaveValue('1.0.0');
  await expect(page.getByLabel('Description').first()).toHaveValue(
    expectedValues.description
  );
  await expect(page.getByLabel('xmin')).toHaveValue(
    expectedValues.spatial_extent.xmin.toString()
  );
  await expect(page.getByLabel('xmax')).toHaveValue(
    expectedValues.spatial_extent.xmax.toString()
  );
  await expect(page.getByLabel('ymin')).toHaveValue(
    expectedValues.spatial_extent.ymin.toString()
  );
  await expect(page.getByLabel('ymax')).toHaveValue(
    expectedValues.spatial_extent.ymax.toString()
  );
  await expect(page.getByLabel('Start Date').first()).toHaveValue(
    expectedValues.temporal_extent.startdate
  );
  await expect(page.getByLabel('End Date').first()).toHaveValue(
    expectedValues.temporal_extent.enddate
  );

  const DiscoveryField = page.locator('.form-group.field.field-string', {
    hasText: 'Discovery',
  });

  await expect(
    DiscoveryField.getByText(expectedValues.discovery_items[0].discovery, {
      exact: true,
    }),
    'Discovery dropdown should have correct value'
  ).toBeVisible();

  await expect(page.getByLabel('Prefix')).toHaveValue(
    expectedValues.discovery_items[0].prefix
  );
  await expect(page.getByLabel('Bucket')).toHaveValue(
    expectedValues.discovery_items[0].bucket
  );
  await expect(page.getByLabel('Filename Regex')).toHaveValue(
    expectedValues.discovery_items[0].filename_regex
  );
  await expect(page.getByLabel('Sample Files-1')).toHaveValue(
    expectedValues.sample_files[0]
  );
  await expect(page.locator('#root_renders').getByRole('textbox')).toHaveValue(
    JSON.stringify(expectedValues.renders.dashboard, null, 2)
  );
}

export async function validateCollectionFormFields(
  page: Page,
  expectedValues: any
) {
  // Simple field assertions
  await expect(page.getByText('Invalid JSON format.')).toBeHidden();
  await expect(page.getByLabel('Identifier')).toHaveValue(expectedValues.id);
  await expect(page.getByLabel('Title').first()).toHaveValue(
    expectedValues.title
  );
  await expect(page.getByLabel('License')).toHaveValue(expectedValues.license);
  await expect(page.getByLabel('Type of STAC entity')).toHaveValue(
    expectedValues.type
  );
  await expect(page.getByLabel('STAC Version')).toHaveValue(
    expectedValues.stac_version
  );
  await expect(page.getByLabel('Description').first()).toHaveValue(
    expectedValues.description
  );
}
