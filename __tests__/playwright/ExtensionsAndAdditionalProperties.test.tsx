import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse, http } from 'msw';
import { extensionSchemaResponse } from '@/__mocks__/extensionSchemaResponse';

const testExtensionUrl =
  'https://stac-extensions.github.io/testExtension/v2.2.0/schema.json';
const invalidTestExtensionUrl =
  'https://stac-extensions.github.io/testExtension/v2.2.0/invalid-schema.json';

const baseCollectionConfig = {
  id: 'TEST_COLLECTION_123',
  title: 'Test Collection Title',
  stac_version: '1.0.0',
  type: 'Collection',
  description: 'A description for the test collection.',
  license: 'proprietary',
  extent: {
    spatial: { bbox: [[-180, -90, 180, 90]] },
    temporal: { interval: [['2023-01-01T00:00:00Z', null]] },
  },
  links: [],
};

test.describe('Extensions and Additional Properties', () => {
  test('should manage additional properties and extensions correctly', async ({
    page,
  }, testInfo) => {
    await page.goto('/create-collection');

    // 1. Validate that adding an additional property via the JSON editor will add it to the Additional Properties section on the Form tab.
    await test.step('Add data with additional property from JSON editor', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
      await page.getByLabel('Enforce Strict Schema').uncheck();
      await page.getByTestId('json-editor').fill(
        JSON.stringify({
          ...baseCollectionConfig,
          'test:bands': ['B1', 'B2'],
          'test:dimensions': true,
        })
      );
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await expect(
      page.getByRole('heading', { name: 'Extra Properties set via JSON' }),
      'extra properties section to be visible'
    ).toBeVisible();
    await expect(
      page.getByLabel('Form').getByText('test:bands'),
      'additional properties should contain key from pasted json'
    ).toBeVisible();

    const additionalPropertyScreenshot = await page.screenshot({
      fullPage: true,
    });
    testInfo.attach('Additional Properties listed on Form', {
      body: additionalPropertyScreenshot,
      contentType: 'image/png',
    });

    // 2. Validate that adding an extension that includes that Additional Property as a top level property will move the value from Additional Properties to the Extension’s section.
    await test.step('Add extension URL', async () => {
      await page
        .getByPlaceholder(/Enter extension schema URL/i)
        .fill(testExtensionUrl);
      await page.getByRole('button', { name: /add extension/i }).click();
    });

    await test.step('Property should move From Additional Properties to Extension card', async () => {
      await page
        .getByPlaceholder(/Enter extension schema URL/i)
        .fill(testExtensionUrl);
      await page.getByRole('button', { name: /add extension/i }).click();

      await expect(
        page.getByRole('heading', { name: 'Extra Properties set via JSON' })
      ).toBeHidden();

      await expect(page.getByText('Test Extension Fields')).toBeVisible();
      await expect(page.getByLabel(/test:dimensions/i)).toBeVisible();
      await expect(page.getByLabel(/test:bands/i)).toBeVisible();
      const bandsInput = page.getByLabel(/test:bands/i);
      await expect(bandsInput).toContainText('B1');
    });

    const extensionFieldsScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('Properties listed on Extensions Fields', {
      body: extensionFieldsScreenshot,
      contentType: 'image/png',
    });

    // 3. Validate that removing the Extension will move that value back to the Additional Properties section.
    await test.step('Remove extension and see property move back', async () => {
      await page
        .getByText('Test Extension', { exact: true })
        .getByRole('img', { name: 'Close', exact: true })
        .click();
      await expect(page.getByText('Test Extension Fields')).toBeHidden();
      await expect(
        page.getByRole('heading', { name: 'Extra Properties set via JSON' }),
        'extra properties section should be visible'
      ).toBeVisible();
      await expect(
        page.getByLabel('Form').getByText('test:bands'),
        'additional properties should contain data from pasted json'
      ).toBeVisible();
    });

    // 4. Validate that submitting a form will include the RJSF data, the Additional Properties Data, and the Extension’s data.
    await test.step('Submit form with all data types', async (testInfo) => {
      // Re-add the extension to have all data types present
      await page
        .getByPlaceholder(/Enter extension schema URL/i)
        .fill(testExtensionUrl);
      await page.getByRole('button', { name: 'Add Extension' }).click();

      await page.route('**/create-dataset', async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        expect(postData.data.id).toBe(baseCollectionConfig.id);
        expect(postData.data['test:bands']).toEqual(['B1', 'B2']);
        expect(postData.data).toHaveProperty('stac_extensions');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ githubURL: 'https://github.com/mock-pr' }),
        });
      });

      await page.getByRole('button', { name: /submit/i }).click();

      await test.step('continue without adding a comment', async () => {
        await page.getByRole('button', { name: /continue & submit/i }).click();
      });

      await expect(
        page.getByRole('dialog', { name: /Ingestion Request Submitted/i })
      ).toBeVisible();
    });
  });

  test('should handle invalid extension schema response', async ({ page }) => {
    await page.goto('/create-collection');

    await test.step('Enter invalid extension schema URL', async () => {
      await page
        .getByPlaceholder(/Enter extension schema URL/i)
        .fill(invalidTestExtensionUrl);
      await page.getByRole('button', { name: /add extension/i }).click();
    });
    await expect(
      page.getByText(/Could not load or parse extension/i),
      'error message should appear'
    ).toBeVisible();
  });
});
