import { test, expect } from '@playwright/test';

test.describe('Middleware auth enforcement', () => {
  const protectedRoutes = [
    '/',
    '/datasets',
    '/collections',
    '/create-dataset',
    '/create-collection',
    '/edit-dataset',
    '/edit-collection',
    '/upload',
    '/cog-viewer',
  ];

  for (const route of protectedRoutes) {
    test(`Unauthenticated request to ${route} redirects to /login`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
