import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';
import path from 'path';
import { imageBase64 } from '@/__mocks__/images/greenCheckImageBase64';

test.describe('Thumbnail Uploader Page', () => {
  test('Upload unique image with proper dimensions', async ({
    page,
  }, testInfo) => {
    await page.route(
      'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg',
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
    await test.step('Navigate to the Thumbnail Upload Page', async () => {
      await page.goto('/upload');
    });

    // watch for img src request
    const responsePromise = page.waitForResponse(
      (res) =>
        res
          .url()
          .includes('s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg') &&
        res.status() === 200
    );
    await test.step('click to upload a file', async () => {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        await page.getByRole('button', { name: /cloud-upload/i }).click(),
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
      page.getByText('S3 URI: s3://s3bucket/thumbnail.jpg'),
      'S3 URI is shown'
    ).toBeVisible();

    await expect(
      page.getByText('Thumbnail uploaded successfully!'),
      'authenticating upload message appears'
    ).toBeVisible();

    await expect(
      page.getByAltText(/uploaded thumbnail/i),
      'Uploaded Thumbnail heading'
    ).toBeVisible();

    await responsePromise;

    const thumbnailUploadScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('Succesfull Image upload', {
      body: thumbnailUploadScreenshot,
      contentType: 'image/png',
    });
  });

  test('Upload duplicate image with proper dimensions', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    await worker.use(
      http.post('/api/upload-url', async ({ request }) => {
        return HttpResponse.json({
          uploadUrl:
            'https://s3bucket.s3.us-west-2.amazonaws.com/thumnbnail.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4NPAGWTH4OAKYR4F%2F20250306%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250306T210052Z&X-Amz-Expires=900&X-Amz-Signature=50d8e81e05d3b7ec427b0d9add69c839f5379ce2a27f7f7b6832c1b15fd430c8&X-Amz-SignedHeaders=host',
          fileUrl: 'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg',
          fileExists: true,
        });
      })
    );

    await page.route(
      'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg',
      async (route) => {
        console.log(`Image request intercepted: ${route.request().url()}`);

        // Respond with a small 1x1 transparent PNG
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        await route.fulfill({
          status: 200,
          contentType: 'image/jpg',
          body: imageBuffer,
        });
      }
    );

    await test.step('Navigate to the Thumbnail Upload Page', async () => {
      await page.goto('/upload');
    });

    // watch for img src request
    const responsePromise = page.waitForResponse(
      (res) =>
        res
          .url()
          .includes('s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg') &&
        res.status() === 200
    );
    await test.step('click to upload a file', async () => {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        await page.getByRole('button', { name: /cloud-upload/i }).click(),
      ]);
      await fileChooser.setFiles(
        path.join(__dirname, '../../__mocks__/images/thumbnail.jpg')
      );
    });

    await expect(
      page.getByText(/authenticating upload/i),
      'authenticating upload message appears'
    ).toBeVisible();

    await test.step('confirm overwrite', async () => {
      await expect(
        page.locator('.ant-modal-content').getByText('File Already Exists')
      ).toBeVisible();

      const overwriteConfirmModalScreenshot = await page.screenshot({
        fullPage: true,
      });
      testInfo.attach('Confirm Overwrite Modal', {
        body: overwriteConfirmModalScreenshot,
        contentType: 'image/png',
      });

      await page.getByRole('button', { name: 'Overwrite' }).click();
    });

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
      page.getByText('S3 URI: s3://s3bucket/thumbnail.jpg'),
      'S3 URI is shown'
    ).toBeVisible();

    await expect(
      page.getByText('Thumbnail uploaded successfully!'),
      'authenticating upload message appears'
    ).toBeVisible();

    await expect(
      page.getByAltText(/uploaded thumbnail/i),
      'Uploaded Thumbnail heading'
    ).toBeVisible();

    await responsePromise;
  });

  test('Size Validation prevents image upload with wrong dimensions', async ({
    page,
  }, testInfo) => {
    await page.route(
      'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg',
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

    await test.step('Navigate to the Thumbnail Upload Page', async () => {
      await page.goto('/upload');
    });

    await test.step('click to upload a file', async () => {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        await page.getByRole('button', { name: /cloud-upload/i }).click(),
      ]);
      await fileChooser.setFiles(
        path.join(__dirname, '../../__mocks__/images/wrongSizedThumbnail.jpg')
      );
    });

    await expect(
      page.getByText(/authenticating upload/i),
      'authenticating upload message appears'
    ).toBeHidden();

    await expect(
      page.getByRole('heading', { name: 'Image Validation' }),
      'image validation appears'
    ).toBeVisible();

    await test.step('validated image width is shown', async () => {
      const widthStatistic = page.locator('.ant-statistic').getByText('Width');
      await expect(widthStatistic).toBeVisible();
      await expect(widthStatistic.locator('..')).toContainText('1,280px');
    });

    await test.step('validated image height is shown', async () => {
      const heightStatistic = page
        .locator('.ant-statistic')
        .getByText('Height');
      await expect(heightStatistic).toBeVisible();
      await expect(heightStatistic.locator('..')).toContainText('853px');
    });

    await test.step('validated image aspect ratio is shown', async () => {
      const aspectRatioStatistic = page
        .locator('.ant-statistic')
        .getByText('Aspect Ratio');
      await expect(aspectRatioStatistic).toBeVisible();
      await expect(aspectRatioStatistic.locator('..')).toContainText('1.50');
    });
    await test.step('validated image file size is shown', async () => {
      const sizeStatistic = page.locator('.ant-statistic').getByText('Size');
      await expect(sizeStatistic).toBeVisible();
      await expect(sizeStatistic.locator('..')).toContainText('209KB');
    });
    await expect(
      page.getByText('S3 URI: s3://s3bucket/thumbnail.jpg'),
      'S3 URI is shown'
    ).toBeHidden();

    await expect(
      page.getByText('Thumbnail uploaded successfully!'),
      'authenticating upload message appears'
    ).toBeHidden();

    await expect(
      page.getByAltText(/uploaded thumbnail/i),
      'Uploaded Thumbnail heading'
    ).toBeHidden();

    await expect(
      page.getByRole('button', { name: /choose a different file/i })
    ).toBeVisible();

    const thumbnailValidationScreenshot = await page.screenshot({
      fullPage: true,
    });
    testInfo.attach('Failed Image Dimensions Validation', {
      body: thumbnailValidationScreenshot,
      contentType: 'image/png',
    });
  });
});
