import { expect, test } from '@/__tests__/playwright/setup-msw';
import { validateCollectionFormFields } from '../playwright/utils/ValidateFormFields';
import { HttpResponse, http } from 'msw';

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

test.describe('Create Collection Page', () => {
  test('Create Collection request displays github link to PR', async ({
    page,
    worker,
    http,
  }, testInfo) => {
    await worker.use(
      http.post('/api/create-ingest', async () => {
        return HttpResponse.json({ githubURL: MOCK_GITHUB_URL });
      })
    );

    await test.step('Navigate to the Create Collection page', async () => {
      await page.goto('/create-collection');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste a JSON with config options matching schema minimum', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(requiredCollectionConfig));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('submit completed form', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });

    await expect(
      page.getByRole('dialog', { name: /Collection Submitted/i })
    ).toBeVisible();

    const githubLink = page
      .getByRole('dialog', { name: /Collection Submitted/i })
      .getByRole('link', { name: /github/i });
    await expect(githubLink).toBeVisible();

    const href = await githubLink.getAttribute('href');
    expect(href, 'href from github should be correct').toBe(MOCK_GITHUB_URL);

    const successScreenshot = await page.screenshot();
    testInfo.attach('success modal with github link', {
      body: successScreenshot,
      contentType: 'image/png',
    });
  });

  test('Create Collection request submitted with pasted JSON', async ({
    page,
  }, testInfo) => {
    // Intercept the POST request to validate its payload
    await page.route('**/create-dataset', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(postData.ingestionType).toBe('collection');
        expect(postData.data).toEqual(
          expect.objectContaining(requiredCollectionConfig)
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

    await test.step('Navigate to the Create Collection page', async () => {
      await page.goto('/create-collection');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await expect(
      page.getByRole('button', { name: /apply changes/i }),
      'Apply Changes should be disabled if no changes are made'
    ).toBeDisabled();

    await test.step('paste a JSON with valid collection config', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(requiredCollectionConfig));
      const JSONScreenshot = await page.screenshot();
      testInfo.attach('pasted JSON in editor', {
        body: JSONScreenshot,
        contentType: 'image/png',
      });
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('validate that form tab displays with pasted json values now populated in form', async () => {
      await validateCollectionFormFields(page, requiredCollectionConfig);
    });

    const completedFormScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('form with values pasted in JSON editor', {
      body: completedFormScreenshot,
      contentType: 'image/png',
    });

    await test.step('submit form and validate that POST body values match pasted config values', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });

    await expect(
      page.getByRole('dialog', { name: /Collection Submitted/i })
    ).toBeVisible();
  });

  test('Create Collection allows extra fields with toggle enabled', async ({
    page,
  }, testInfo) => {
    // Intercept the request to validate the payload
    await page.route('**/create-dataset', async (route, request) => {
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        expect(postData.ingestionType).toBe('collection');
        expect(postData.data).toEqual(
          expect.objectContaining({ extraField: true })
        );

        await route.abort(); // Abort to prevent actual submission
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

    await test.step('uncheck the Enforce Strict Schema checkbox', async () => {
      await page
        .getByRole('checkbox', { name: /enforce strict schema/i })
        .uncheck();
    });

    await test.step('paste in a valid config with an additional field', async () => {
      await page
        .getByTestId('json-editor')
        .fill(
          JSON.stringify({ ...requiredCollectionConfig, extraField: true })
        );
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

      await expect(
        extraPropertiesCard.getByText('Property Details:'),
        'Should show the single property title'
      ).toBeVisible();

      const codeEditor = extraPropertiesCard.locator('textarea');
      await expect(
        codeEditor,
        'The code editor for the single property should be visible'
      ).toBeVisible();

      const expectedValue = JSON.stringify({ extraField: true }, null, 2);
      await expect(
        codeEditor,
        'The editor should contain the correct JSON'
      ).toHaveValue(expectedValue);
    });

    const extraPropertiesScreenshot = await page.screenshot({
      fullPage: true,
    });
    testInfo.attach('extra properties listed on form tab', {
      body: extraPropertiesScreenshot,
      contentType: 'image/png',
    });

    await test.step('submit form and validate that POST body includes the extra field', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
    });
  });

  test('Create Collection handles errors with pasted JSON', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to the Create Collection page', async () => {
      await page.goto('/create-collection');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste a non-JSON string in the editor and check for error message', async () => {
      await page.getByTestId('json-editor').fill('this is not json');
      await page.getByRole('button', { name: /apply changes/i }).click();
      await expect(page.getByText('Invalid JSON format.')).toBeVisible();
    });

    await test.step('paste a JSON not matching required schema in the editor and check for error message', async () => {
      await page.getByTestId('json-editor').fill('{}');
      await page.getByRole('button', { name: /apply changes/i }).click();
      await expect(page.getByText('Schema Validation Errors')).toBeVisible();

      // Check for expected schema validation errors
      const requiredProperties = [
        'stac_version',
        'type',
        'id',
        'description',
        'license',
        'extent',
        'links',
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

          await errorCard.getByText(expectedTagText).click();

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
    testInfo.attach('Error messages for invalid and non-schema JSON', {
      body: errorMessagesScreenshot,
      contentType: 'image/png',
    });
  });

  test('Error Handling - Duplicate id displays error modal', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    // Mock the API response for a duplicate collection
    await worker.use(
      http.post('/api/create-ingest', () => {
        return HttpResponse.json(
          { error: 'Reference already exists' },
          { status: 400 }
        );
      })
    );

    await test.step('Navigate to the Create Collection page', async () => {
      await page.goto('/create-collection');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste a valid JSON config', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(requiredCollectionConfig));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('submit completed form', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
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
    // Mock the API response for a GitHub auth failure
    await worker.use(
      http.post('/api/create-ingest', () => {
        return HttpResponse.json(
          { error: 'Failed to fetch GitHub token' },
          { status: 400 }
        );
      })
    );

    await test.step('Navigate to the Create Collection page', async () => {
      await page.goto('/create-collection');
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('paste a valid JSON config', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(requiredCollectionConfig));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await test.step('submit completed form', async () => {
      await page.getByRole('button', { name: /submit/i }).click();
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
});
