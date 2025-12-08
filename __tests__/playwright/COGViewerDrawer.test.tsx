import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';

async function openCOGDrawer(page: any) {
  await page.waitForTimeout(1000);
  await page
    .getByRole('button', {
      name: /Generate Renders Object from Sample File/i,
    })
    .click();

  // Wait for the drawer to open and content to load
  await expect(page.locator('.ant-drawer')).toBeVisible({ timeout: 10000 });

  await expect(page.getByTestId('colormap', { timeout: 10000 })).toBeVisible();
}

async function fillRenders(page: any, rendersData: any) {
  const rendersTextbox = page.locator('#root_renders').getByRole('textbox');
  await rendersTextbox.clear();
  await rendersTextbox.fill(JSON.stringify(rendersData, null, 2));

  // Wait for the JSON to be properly set in the form
  await expect(rendersTextbox).toContainText(
    `"${Object.keys(rendersData)[0]}"`
  );
}

test.describe('COG Viewer Drawer', () => {
  test('COG Viewer loads with renders object presets', async ({
    page,
  }, testInfo) => {
    await test.step('navigate to Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('enter URL of Sample File and valid json in renders object', async () => {
      await page.getByLabel('Sample Files-1').fill('s3://test.com');
      await page.waitForTimeout(2500);

      await fillRenders(page, {
        resampling: 'nearest',
        bidx: [1],
        colormap_name: 'rdbu',
        assets: ['cog_default'],
        rescale: [[-1, 1]],
        color_formula: 'test123',
        nodata: 255,
        title: 'VEDA Dashboard Render Parameters',
      });
    });

    const initialRendersScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('Initial Renders Object', {
      body: initialRendersScreenshot,
      contentType: 'image/png',
    });

    await test.step('click button to open COG Viewer Drawer', async () => {
      await openCOGDrawer(page);
    });

    await expect(
      page.getByText('Band: Band 1 (Index: 1)'),
      'multi-band COGs should not have Band Name Header'
    ).toBeHidden();
    await test.step('validate that RGB Band Dropdowns are visible and populated with first 3 bands', async () => {
      await expect(page.getByLabel('Band (R)')).toBeVisible();
      await expect(page.locator('[data-testid="band-R"]')).toContainText(
        'b1 - Band 1'
      );
      await expect(page.getByLabel('Band (G)')).toBeVisible();
      await expect(page.locator('[data-testid="band-G"]')).toContainText(
        'b2 - Band 2'
      );
      await expect(page.getByLabel('Band (B)')).toBeVisible();
      await expect(page.locator('[data-testid="band-B"]')).toContainText(
        'b3 - Band 3'
      );
    });

    await test.step('validate that form controls pre-populate with values from renders object', async () => {
      await expect(page.locator('[data-testid="colormap"]')).toContainText(
        'rdbu'
      );
      await expect(page.locator('[data-testid="resampling"]')).toContainText(
        /nearest/i
      );

      await expect(page.locator('[data-testid="colorFormula"]')).toHaveValue(
        /test123/i
      );

      await expect(page.locator('[data-testid="nodata"]')).toHaveValue(/255/i);
    });

    const prepopulatedControlsScreenshot = await page.screenshot();
    testInfo.attach('Pre-populated COG Viewer Form Controls', {
      body: prepopulatedControlsScreenshot,
      contentType: 'image/png',
    });

    await test.step('validate that Rendering Options Modal displays values in form in pretty json format', async () => {
      await page
        .getByRole('button', { name: 'View Rendering Options' })
        .click();
      await expect(
        page
          .getByRole('dialog')
          .locator('.ant-drawer-title')
          .getByText(/COG Rendering Options/i)
      ).toBeVisible();
      await expect(
        page.getByText('COG Rendering Options{ "bidx').getByRole('textbox')
      ).toHaveText(
        JSON.stringify(
          {
            bidx: [1],
            rescale: [[-1, 1]],
            colormap_name: 'rdbu',
            color_formula: 'test123',
            resampling: 'nearest',
            nodata: 255,
            assets: ['cog_default'],
          },
          null,
          2
        )
      );
    });

    const renderingOptionsModalScreenshot = await page.screenshot();
    testInfo.attach('Rendering Options Modal', {
      body: renderingOptionsModalScreenshot,
      contentType: 'image/png',
    });
  });

  test('COG Viewer loads without entry in renders object', async ({
    page,
  }, testInfo) => {
    await test.step('navigate to Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('enter URL of Sample File but no renders object', async () => {
      await page.getByLabel('Sample Files-1').fill('s3://test.com');
      await page.waitForTimeout(2500);
    });

    await test.step('click button to open COG Viewer Drawer', async () => {
      await openCOGDrawer(page);
    });

    await test.step('missing sample file URL error should not be visible', async () => {
      await expect(page.getByText(/Sample File URL is required/i)).toBeHidden();
    });

    await test.step('validate that form controls pre-populate with default values', async () => {
      await expect(page.getByText(/COG Rendering Options/i)).toBeVisible();
      await expect(page.locator('[data-testid="colormap"]')).toContainText(
        'Internal',
        { timeout: 7500 }
      );
      await expect(page.locator('[data-testid="resampling"]')).toContainText(
        ''
      );

      await expect(page.locator('[data-testid="colorFormula"]')).toHaveValue(
        ''
      );

      await expect(page.locator('[data-testid="nodata"]')).toHaveValue('');
    });

    const defaultControlsScreenshot = await page.screenshot();
    testInfo.attach('Default state of COG Viewer Form Controls', {
      body: defaultControlsScreenshot,
      contentType: 'image/png',
    });

    await test.step('validate that Rendering Options Modal displays default values in form in pretty json format', async () => {
      await page
        .getByRole('button', { name: 'View Rendering Options' })
        .click();
      await expect(
        page
          .getByRole('dialog')
          .locator('.ant-drawer-title')
          .getByText(/COG Rendering Options/i)
      ).toBeVisible();
      await expect(
        page.getByText('COG Rendering Options{ "bidx').getByRole('textbox')
      ).toHaveText(
        JSON.stringify(
          {
            bidx: [1],
            rescale: [],
            assets: ['cog_default'],
          },
          null,
          2
        )
      );
    });
  });
  test('COG Viewer loads with error in renders object presets', async ({
    page,
  }) => {
    await test.step('navigate to Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('enter URL of Sample File and invalid json in renders object', async () => {
      await page.getByLabel('Sample Files-1').fill('s3://test.com');
      await page.waitForTimeout(2500);

      const rendersTextbox = page.locator('#root_renders').getByRole('textbox');
      await rendersTextbox.clear();
      await rendersTextbox.fill('"test": true');
    });

    await test.step('click button to open COG Viewer Drawer', async () => {
      await openCOGDrawer(page);
    });

    await test.step('validate that form controls pre-populate with default values', async () => {
      await expect(page.locator('[data-testid="colormap"]')).toContainText(
        'Internal'
      );
      await expect(page.locator('[data-testid="resampling"]')).toContainText(
        ''
      );

      await expect(page.locator('[data-testid="colorFormula"]')).toHaveValue(
        ''
      );

      await expect(page.locator('[data-testid="nodata"]')).toHaveValue('');
    });

    await test.step('validate that Rendering Options Modal displays default values in form in pretty json format', async () => {
      await page
        .getByRole('button', { name: 'View Rendering Options' })
        .click();
      await expect(
        page
          .getByRole('dialog')
          .locator('.ant-drawer-title')
          .getByText(/COG Rendering Options/i)
      ).toBeVisible();
      await expect(
        page.getByText('COG Rendering Options{ "bidx').getByRole('textbox')
      ).toHaveText(
        JSON.stringify(
          {
            bidx: [1],
            rescale: [],
            assets: ['cog_default'],
          },
          null,
          2
        )
      );
    });
  });

  test('COG Viewer overwrites existing renders object with selections', async ({
    page,
  }) => {
    await test.step('navigate to Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('enter URL of Sample File and valid json in renders object', async () => {
      await page.getByLabel('Sample Files-1').fill('s3://test.com');
      await page.waitForTimeout(2500);

      await fillRenders(page, {
        resampling: 'nearest',
        bidx: [1],
        colormap_name: 'rdbu',
        assets: ['cog_default'],
        rescale: [[-1, 1]],
        color_formula: 'test123',
        nodata: 255,
        title: 'VEDA Dashboard Render Parameters',
      });
    });

    await test.step('click button to open COG Viewer Drawer', async () => {
      await openCOGDrawer(page);

      await test.step('change renders values in COG Viewer Control Form', async () => {
        await expect(page.locator('[data-testid="colormap"]')).toContainText(
          'rdbu',
          { timeout: 10000 }
        );

        await expect(page.locator('[data-testid="nodata"]')).toHaveValue('255');
        await page.locator('[data-testid="nodata"]').fill('');

        await expect(page.locator('[data-testid="colorFormula"]')).toHaveValue(
          /test123/i
        );
        await page.locator('[data-testid="colorFormula"]').fill('test456');
      });

      await test.step('validate that Rendering Options Modal displays new values in form in pretty json format', async () => {
        await page
          .getByRole('button', { name: 'View Rendering Options' })
          .click();
        await expect(
          page
            .getByRole('dialog')
            .locator('.ant-drawer-title')
            .getByText(/COG Rendering Options/i)
        ).toBeVisible();
        await expect(
          page.getByText('COG Rendering Options{ "bidx').getByRole('textbox')
        ).toHaveText(
          JSON.stringify(
            {
              bidx: [1],
              rescale: [[-1, 1]],
              colormap_name: 'rdbu',
              color_formula: 'test456',
              resampling: 'nearest',
              assets: ['cog_default'],
            },
            null,
            2
          )
        );
      });
      await test.step('close COG Rendering Options Modal', async () => {
        await page
          .getByLabel('Selected COG Rendering Options')
          .getByRole('button', { name: 'Cancel' })
          .click();
      });

      await test.step('click to accept selected COG Rendering Options', async () => {
        await page
          .getByRole('button', { name: /accept render options/i })
          .click();
      });

      await test.step('validate that renders object has updated with new values', async () => {
        const rendersTextbox = page
          .locator('#root_renders')
          .getByRole('textbox');
        const expectedJson = JSON.stringify(
          {
            bidx: [1],
            rescale: [[-1, 1]],
            colormap_name: 'rdbu',
            color_formula: 'test456',
            resampling: 'nearest',
            assets: ['cog_default'],
          },
          null,
          2
        );

        // Wait for the updated values to be reflected in the form
        await expect(rendersTextbox).toHaveText(expectedJson);
      });
    });
  });

  test('COG Viewer does not open if sample files input is empty', async ({
    page,
  }, testInfo) => {
    await test.step('navigate to Create Dataset page', async () => {
      await page.goto('/create-dataset');
    });

    await test.step('do not enter URL of Sample File but enter valid json in renders object', async () => {
      await fillRenders(page, {
        resampling: 'nearest',
        bidx: [1],
        colormap_name: 'rdbu',
        assets: ['cog_default'],
        rescale: [[-1, 1]],
        color_formula: 'test123',
        nodata: 255,
        title: 'VEDA Dashboard Render Parameters',
      });
    });
    await test.step('click button to open COG Viewer Drawer', async () => {
      await page
        .getByRole('button', {
          name: /Generate Renders Object from Sample File/i,
        })
        .click();
    });
    await expect(
      page.getByText(/Sample File URL is required/i),
      'verify error message appears'
    ).toBeVisible();
    await expect(
      page.locator('.ant-drawer').filter({ hasText: /COG Rendering Options/i }),
      'COG Viewer Drawer remains hidden'
    ).toBeHidden();

    const errorScreenshot = await page.screenshot();
    testInfo.attach('error message if no sample file url present', {
      body: errorScreenshot,
      contentType: 'image/png',
    });
  });
});
