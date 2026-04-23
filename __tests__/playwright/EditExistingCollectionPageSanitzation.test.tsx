import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';
import { stacCollectionResponse } from '@/__mocks__/stacCollectionResponse';

test.describe('Edit Existing Collection Sanitization', () => {
  test('shows initial sanitization modal, reveals cleanup, enables submit, and sends sanitized PUT body', async ({
    page,
    http,
    worker,
  }) => {
    const dirtyCollectionPayload = {
      ...stacCollectionResponse,
      assets: null,
      item_assets: null,
      summaries: null,
      links: null,
      keywords: null,
      providers: null,
      stac_extensions: null,
      extent: {
        ...stacCollectionResponse.extent,
        temporal: {
          interval: [['1998-01-01 00:00:00+00', null]],
        },
      },
    };

    const expectedInitialSanitizedPayload = {
      ...stacCollectionResponse,
      assets: {},
      item_assets: {},
      summaries: {},
      links: [],
      keywords: [],
      providers: [],
      stac_extensions: [],
      extent: {
        ...stacCollectionResponse.extent,
        temporal: {
          interval: [['1998-01-01T00:00:00+00:00', null]],
        },
      },
    };

    let putRequestIntercepted = false;
    let putPayload: unknown;

    await worker.use(
      http.get('/api/existing-collection/:collectionId', ({ params }) => {
        return HttpResponse.json({
          ...dirtyCollectionPayload,
          id: params.collectionId,
        });
      })
    );

    await page.route('**/api/existing-collection/*', async (route, request) => {
      if (request.method() === 'PUT') {
        putRequestIntercepted = true;
        putPayload = request.postDataJSON();

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            githubURL: 'https://github.com/test/repo/pull/123',
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await test.step('Navigate to Edit Existing Collection Page', async () => {
      await page.goto('/edit-existing-collection');
    });

    await expect(
      page.getByRole('heading', { level: 3, name: 'Edit Existing Collection' })
    ).toBeVisible();

    await test.step('Select an existing collection', async () => {
      await page
        .locator('.ant-card')
        .filter({ hasText: /test-collection-1/i })
        .click();
    });

    const sanitizationModal = page.getByRole('dialog', {
      name: /stac metadata format updates/i,
    });

    await test.step('Validate initial sanitization modal and diff content', async () => {
      await expect(sanitizationModal).toBeVisible();
      await expect(
        sanitizationModal.getByText(
          /The Existing Collection's STAC metadata has been updated/i
        )
      ).toBeVisible();

      // Ensure cleanup cues are visible in diff content.
      await expect(sanitizationModal).toContainText(
        '1998-01-01T00:00:00+00:00'
      );
    });

    await test.step('Dismiss sanitization modal and verify JSON tab shows sanitized values', async () => {
      await sanitizationModal.getByRole('button', { name: /^ok$/i }).click();
      await expect(sanitizationModal).toBeHidden();

      await page.getByRole('tab', { name: /manual json edit/i }).click();
      await expect(page.getByTestId('json-editor')).toContainText(
        '1998-01-01T00:00:00+00:00'
      );
      await expect(page.getByTestId('json-editor')).toContainText(
        '"links": []'
      );

      await page.getByRole('tab', { name: /^form$/i }).click();

      await expect(page.getByRole('button', { name: /submit/i })).toBeEnabled();
    });

    await test.step('Submit and verify sanitized payload in PUT body', async () => {
      const requestPromise = page.waitForRequest(
        (req) =>
          req.url().includes('/api/existing-collection/') &&
          req.method() === 'PUT'
      );

      await page.getByRole('button', { name: /submit/i }).click();

      await expect(
        page.getByRole('dialog', { name: /review changes/i })
      ).toBeVisible();
      await page.getByRole('button', { name: /confirm changes/i }).click();

      await requestPromise;

      expect(
        putRequestIntercepted,
        'PUT request should have been intercepted'
      ).toBe(true);
      expect(
        putPayload,
        'PUT body should contain the initial sanitized values'
      ).toMatchObject(expectedInitialSanitizedPayload);
      expect(putPayload).toHaveProperty(
        'extent.temporal.interval.0.0',
        '1998-01-01T00:00:00+00:00'
      );
    });
  });
});
