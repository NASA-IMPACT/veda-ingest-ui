import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

const modifiedCollectionConfig = {
  id: 'PLAYWRIGHT_1234',
  title: 'MODIFIED test collection title',
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

test.describe('Edit Collection Page', () => {
  test('Edit Collection does not allow renaming collection', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
    });

    await test.step('wait for list of of pending requests to load and pick #1', async () => {
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });

    await expect(
      page.getByLabel('Identifier'),
      'Identifier Input should be disabled'
    ).toBeDisabled();

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('attempt renaming collection via JSON Editor', async () => {
      await page.getByTestId('json-editor').fill(
        JSON.stringify({
          ...modifiedCollectionConfig,
          id: 'brand-new-name',
        })
      );
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    await expect(
      page.getByText('ID cannot be changed!'),
      'error message appears for attempting ID rename'
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

  test('Submit button enables after form changes', async ({ page }) => {
    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
    });

    await test.step('wait for list of pending requests to load and pick #1', async () => {
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });
    // Make a change to the form
    await test.step('modify form field', async () => {
      await page.getByLabel('Title').first().click();
      await page.getByLabel('Title').first().fill('Modified Title Test');
      await page.getByLabel('Title').first().blur();
    });

    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  test('Edit Collection allows editing fields other than ID', async ({
    page,
  }, testInfo) => {
    // Intercept and block the request to validate the payload
    await page.route('**/edit-dataset', async (route, request) => {
      if (request.method() === 'PUT') {
        const postData = request.postDataJSON();

        expect(postData, 'validate filePath property exists').toHaveProperty(
          'filePath'
        );
        expect(postData, 'validate fileSha property exists').toHaveProperty(
          'fileSha'
        );
        expect(postData, 'validate formData property exists').toHaveProperty(
          'formData'
        );

        // Assert that the submitted formData matches the modified config
        expect(
          postData.formData,
          'validate formData matches modified json'
        ).toMatchObject(modifiedCollectionConfig);

        await route.abort(); // Block the request
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
    });

    await test.step('wait for list of of pending requests to load and pick #1', async () => {
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });

    await expect(
      page.getByLabel('Identifier'),
      'Identifier Input should be disabled'
    ).toBeDisabled();

    const initialFormScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('initial form with disabled Collection', {
      body: initialFormScreenshot,
      contentType: 'image/png',
    });

    await test.step('switch to manual json edit tab', async () => {
      await page.getByRole('tab', { name: /manual json edit/i }).click();
    });

    await test.step('edit collection via JSON Editor', async () => {
      await page
        .getByTestId('json-editor')
        .fill(JSON.stringify(modifiedCollectionConfig));
      await page.getByRole('button', { name: /apply changes/i }).click();
    });

    const completedFormScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('form with values pasted in JSON editor', {
      body: completedFormScreenshot,
      contentType: 'image/png',
    });

    await test.step('submit form and validate that PUT body values match pasted config values', async () => {
      await page.getByRole('button', { name: /apply changes/i }).click();
    });
  });

  test('Edit Collection displays list of open PRs for collections', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
    });

    await test.step('verify list of of pending collection requests loads', async () => {
      await expect(
        page.getByRole('button', {
          name: /seeded ingest #1/i,
        })
      ).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: /seeded ingest #1/i,
        })
      ).toBeVisible();
    });

    const listCollectionRequestsScreenshot = await page.screenshot({
      fullPage: true,
    });
    testInfo.attach('filtered list of open collection PRs', {
      body: listCollectionRequestsScreenshot,
      contentType: 'image/png',
    });
  });

  test('Error Handling - Edit Collection gracefully handles failed /list-collections call', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    // Mock a failure for the list-ingests API endpoint
    await worker.use(
      http.get('/api/list-ingests', ({ request }) => {
        return HttpResponse.json(
          { error: 'something went wrong' },
          { status: 400 }
        );
      })
    );

    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
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

  test('Error Handling - Edit Collection gracefully handles failed /retrieve-collection call', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    // Mock a failure for the retrieve-collection API endpoint
    await worker.use(
      http.get('/api/retrieve-ingest', ({ request }) => {
        return HttpResponse.json(
          { error: 'something went wrong' },
          { status: 400 }
        );
      })
    );

    await test.step('Navigate to Edit Collection Page', async () => {
      await page.goto('/edit-collection');
    });

    await test.step('wait for list of of pending requests to load and pick #1', async () => {
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });

    await test.step('verify error modal loads', async () => {
      await expect(
        page.getByRole('dialog', { name: /Something went wrong/i })
      ).toBeVisible();
      await expect(
        page
          .getByRole('dialog', { name: /Something went wrong/i })
          .getByText('updating Ingest Request for seeded ingest #1.')
      ).toBeVisible();
    });

    const loadingErrorScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('api error loading requests', {
      body: loadingErrorScreenshot,
      contentType: 'image/png',
    });
  });
});
