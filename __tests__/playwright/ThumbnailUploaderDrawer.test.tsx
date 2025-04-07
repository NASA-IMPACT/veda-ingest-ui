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
      'https://bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIARVKJBJKAQFGENG5C%2F20250404%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250404T172309Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEKL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDbCay0UenLbnMIC%2FNEBrzwxs9OxA%2FpiInjFciy4QbeCwIgXp6TynvBQ8%2BUYk4DTvMDM9BZ7rfOmKt9eVCtglRatyAqqQIIGxACGgwxMTQ1MDY2ODA5NjEiDCOsgOx%2BRrGpNQnmWSqGAprgmAbuZhPuNq%2B9syAbMquhq0NKrkxLh0KacxVX3dAX%2FP1gTsCWyQKj1YFTw6owUw0OVMUpFCRjYQDF0GxpwkDqAVYoRzHX%2BLjgtEyvf1BrpDlORgXlN4GwTaohj15%2B8mrtLY3vfW6UEDWDb74rZrv%2FfScK6vofbCd%2BDUg1GtSoGWBpfMVlbYUxOFR5UWnUGyCdNpe7kjJMynMpC%2FlfFlqbI8qdV0LFECOX7S4e52aJVutlcHqVrPwAL7eNYRBk9dYLQH3Mz8nOSHGplOHQuaIZe4YRS0goOrg2WEU8kOXizeVueH9RSB91fwSkeGtHsV8t2fhBsGES4rhaEyFUvgUzD3DHO94w%2FarAvwY6nQG8InOBWfZXbitDPLbnkerLLWfRynjhGZCPaP5VI5D4yRjZcxEaBqvOyRtlLQSG5udSRf7ipKl%2Fgl0AoQPX5wen3A7bHMdpOAzpkn5YIIvYlLIG5SiZDsYopVPtFERiq1mX1xuPmHW58LX%2FPuWsFgKqaSZnTtwsu9cst3PBaHrF9Kdoz%2BoO%2BM%2FFJXvKttr3sJ8Wkexl6bbNRVtSITym&X-Amz-Signature=42e140a71802dcc427a4b76dc217b849066753dfb415d29e29f47a5d36f9008a&X-Amz-SignedHeaders=host',
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
      await page.goto('/create-ingest');
    });

    // watch for img src request
    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('s3.us-west-2.amazonaws.com/thumbnail.jpg') &&
        res.status() === 200
    );

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
    ).toHaveValue('s3://s3bucket/thumbnail.jpg');
    await expect(
      page.getByRole('textbox', { name: /collection/i }),
      'validate that other form data has not been overwritten'
    ).toHaveValue('collection name');
  });
});
