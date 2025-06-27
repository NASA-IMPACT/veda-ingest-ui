import { expect, test } from '@/__tests__/playwright/setup-msw';
import path from 'path';
import { imageBase64 } from '@/__mocks__/images/greenCheckImageBase64';

test.describe('Thumbnail Uploader Drawer', () => {
  test('Upload image populates thumbnail href input', async ({
    page,
  }, testInfo) => {
    // Skip test based on environment variable
    test.skip(
      process.env.NEXT_PUBLIC_ENABLE_THUMBNAIL_UPLOAD !== 'true',
      'Test does not run if uploads disabled'
    );

    await page.route(
      'https://thumbnails.openveda.cloud/thumbnail.jpg',
      async (route) => {
        console.log(`Image request intercepted: ${route.request().url()}`);

        const imageBuffer = Buffer.from(imageBase64, 'base64');

        await route.fulfill({
          status: 200,
          contentType: 'image/jpg',
          body: imageBuffer,
        });
      }
    );

    //
    await test.step('Navigate to the Ingest Creation Page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('enter text in Collection Input to validate later that it is not overwritten', async () => {
      await page
        .getByRole('textbox', { name: /collection/i })
        .fill('collection name');
    });

    await test.step('click to open Thumbnail Upload drawer', async () => {
      await page.getByRole('button', { name: /upload thumbnail/i }).click();
    });

    await test.step('click to upload a file', async () => {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        await page
          .locator('.ant-drawer-content')
          .getByRole('button', { name: /cloud-upload/i })
          .click(),
      ]);
      await fileChooser.setFiles(
        path.join(__dirname, '../../__mocks__/images/thumbnail.jpg')
      );
    });

    await expect(
      page.getByText(/authenticating upload/i),
      'authenticating upload message appears'
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Image Validation' }),
      'image validation appears'
    ).toBeVisible();

    await test.step('validated image width is shown', async () => {
      const widthStatistic = page.locator('.ant-statistic').getByText('Width');
      await expect(widthStatistic).toBeVisible();
      await expect(widthStatistic.locator('..')).toContainText('2,000px');
    });

    await test.step('validated image height is shown', async () => {
      const heightStatistic = page
        .locator('.ant-statistic')
        .getByText('Height');
      await expect(heightStatistic).toBeVisible();
      await expect(heightStatistic.locator('..')).toContainText('1,000px');
    });

    await test.step('validated image aspect ratio is shown', async () => {
      const aspectRatioStatistic = page
        .locator('.ant-statistic')
        .getByText('Aspect Ratio');
      await expect(aspectRatioStatistic).toBeVisible();
      await expect(aspectRatioStatistic.locator('..')).toContainText('2.00');
    });
    await test.step('validated image file size is shown', async () => {
      const sizeStatistic = page.locator('.ant-statistic').getByText('Size');
      await expect(sizeStatistic).toBeVisible();
      await expect(sizeStatistic.locator('..')).toContainText('412KB');
    });
    await expect(
      page.getByText(
        'URL: https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg'
      ),
      'URL is shown'
    ).toBeVisible();

    await expect(
      page.getByText('Thumbnail uploaded successfully!'),
      'authenticating upload message appears'
    ).toBeVisible();

    await expect(
      page.getByAltText(/uploaded thumbnail/i),
      'Uploaded Thumbnail heading'
    ).toBeVisible();

    const thumbnailUploadScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('Successful Image upload', {
      body: thumbnailUploadScreenshot,
      contentType: 'image/png',
    });

    await test.step('click Continue to close drawer', async () => {
      await page.getByRole('button', { name: /continue/i }).click();
    });

    await expect(
      page.getByRole('textbox', { name: /href/i }),
      'validate href is populated with upload url'
    ).toHaveValue('https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg');
    await expect(
      page.getByRole('textbox', { name: /collection/i }),
      'validate that other form data has not been overwritten'
    ).toHaveValue('collection name');
  });
});
