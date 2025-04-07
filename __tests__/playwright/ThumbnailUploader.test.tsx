import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';
import path from 'path';
import { imageBase64 } from '@/__mocks__/images/greenCheckImageBase64';

const mockSignedURL =
  'https://bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIARVKJBJKAQFGENG5C%2F20250404%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250404T172309Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEKL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDbCay0UenLbnMIC%2FNEBrzwxs9OxA%2FpiInjFciy4QbeCwIgXp6TynvBQ8%2BUYk4DTvMDM9BZ7rfOmKt9eVCtglRatyAqqQIIGxACGgwxMTQ1MDY2ODA5NjEiDCOsgOx%2BRrGpNQnmWSqGAprgmAbuZhPuNq%2B9syAbMquhq0NKrkxLh0KacxVX3dAX%2FP1gTsCWyQKj1YFTw6owUw0OVMUpFCRjYQDF0GxpwkDqAVYoRzHX%2BLjgtEyvf1BrpDlORgXlN4GwTaohj15%2B8mrtLY3vfW6UEDWDb74rZrv%2FfScK6vofbCd%2BDUg1GtSoGWBpfMVlbYUxOFR5UWnUGyCdNpe7kjJMynMpC%2FlfFlqbI8qdV0LFECOX7S4e52aJVutlcHqVrPwAL7eNYRBk9dYLQH3Mz8nOSHGplOHQuaIZe4YRS0goOrg2WEU8kOXizeVueH9RSB91fwSkeGtHsV8t2fhBsGES4rhaEyFUvgUzD3DHO94w%2FarAvwY6nQG8InOBWfZXbitDPLbnkerLLWfRynjhGZCPaP5VI5D4yRjZcxEaBqvOyRtlLQSG5udSRf7ipKl%2Fgl0AoQPX5wen3A7bHMdpOAzpkn5YIIvYlLIG5SiZDsYopVPtFERiq1mX1xuPmHW58LX%2FPuWsFgKqaSZnTtwsu9cst3PBaHrF9Kdoz%2BoO%2BM%2FFJXvKttr3sJ8Wkexl6bbNRVtSITym&X-Amz-Signature=42e140a71802dcc427a4b76dc217b849066753dfb415d29e29f47a5d36f9008a&X-Amz-SignedHeaders=host';

test.describe('Thumbnail Uploader Page', () => {
  test('Upload unique image with proper dimensions', async ({
    page,
  }, testInfo) => {
    await page.route(mockSignedURL, async (route) => {
      console.log(`Image request intercepted: ${route.request().url()}`);

      const imageBuffer = Buffer.from(imageBase64, 'base64');

      await route.fulfill({
        status: 200,
        contentType: 'image/jpg',
        body: imageBuffer,
      });
    });

    //
    await test.step('Navigate to the Thumbnail Upload Page', async () => {
      await page.goto('/upload');
    });

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

    await page.route(mockSignedURL, async (route) => {
      console.log(`Image request intercepted: ${route.request().url()}`);

      // Respond with a small 1x1 transparent PNG
      const imageBuffer = Buffer.from(imageBase64, 'base64');

      await route.fulfill({
        status: 200,
        contentType: 'image/jpg',
        body: imageBuffer,
      });
    });

    await test.step('Navigate to the Thumbnail Upload Page', async () => {
      await page.goto('/upload');
    });

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
  });

  test('Size Validation prevents image upload with wrong dimensions', async ({
    page,
  }, testInfo) => {
    await page.route(mockSignedURL, async (route) => {
      console.log(`Image request intercepted: ${route.request().url()}`);

      const imageBuffer = Buffer.from(imageBase64, 'base64');

      await route.fulfill({
        status: 200,
        contentType: 'image/jpg',
        body: imageBuffer,
      });
    });

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
