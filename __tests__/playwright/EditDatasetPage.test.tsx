import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

const modifiedConfig = {
  collection: 'seeded-ingest-1',
  title: 'test title',
  description: 'test description',
  license: 'test license',
  tenant: 'tenant2',
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
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });

    await expect(
      page.getByLabel('Collection', { exact: true }),
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
    let putRequestIntercepted = false;

    // Intercept and validate the request
    await page.route('**/api/create-ingest', async (route, request) => {
      if (request.method() === 'PUT') {
        putRequestIntercepted = true;
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

        // Return a successful response instead of aborting
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            githubURL: 'https://github.com/test/repo/pull/123',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await test.step('Navigate to Edit Dataset Page', async () => {
      await page.goto('/edit-dataset');
    });

    await test.step('wait for list of of pending requests to load and pick #1', async () => {
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
    });

    await expect(
      page.getByLabel('Collection', { exact: true }),
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

    await page.getByRole('button', { name: /submit/i }).click();

    await test.step('review changes in diff modal', async () => {
      await expect(
        page.getByRole('dialog', { name: /review changes/i })
      ).toBeVisible();

      const diffModalScreenshot = await page.screenshot({ fullPage: true });
      testInfo.attach('diff modal showing changes', {
        body: diffModalScreenshot,
        contentType: 'image/png',
      });
    });

    await test.step('submit form and validate that PUT body values match pasted config values', async () => {
      // Wait for the PUT request to be made
      const requestPromise = page.waitForRequest(
        (req) =>
          req.url().includes('/api/create-ingest') && req.method() === 'PUT'
      );

      await page.getByRole('button', { name: /confirm changes/i }).click();

      // Ensure the request was actually made
      await requestPromise;

      // Verify our route handler was called
      expect(
        putRequestIntercepted,
        'PUT request should have been intercepted'
      ).toBe(true);
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
          name: /seeded ingest #1/i,
        })
      ).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: /seeded ingest #2/i,
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
      http.get('/api/list-ingests', () => {
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
        page.getByRole('dialog', { name: /Failed to Load Pending Ingests/i })
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
      http.get('/api/retrieve-ingest', () => {
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
      await page.getByRole('button', { name: /seeded ingest #1/i }).click();
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
});
