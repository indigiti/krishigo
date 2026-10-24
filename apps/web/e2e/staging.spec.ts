import { expect, test } from '@playwright/test';

const pages = ['Overview', 'Plant Doctor', 'Marketplace', 'Community', 'Insights', 'Buyers', 'Services', 'Crop Journal', 'Discover', 'Admin', 'My Profile', 'Plant Cases', 'Onboarding', 'Trade Desk', 'Review Desk'];

test('staging shows fiction disclaimer and usable navigation', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', error => consoleErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'KrishiGo homepage' })).toBeVisible();
  await expect(page.getByText('DEMO DATA').first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath(`${testInfo.project.name}-overview.png`), fullPage: true });

  for (const name of pages) {
    if (testInfo.project.name.startsWith('mobile')) {
      await page.getByRole('button', { name: 'Open menu' }).click();
    }
    await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.breadcrumb strong')).toHaveText(name);
    await expect(page.getByText('DEMO DATA').first()).toBeVisible();
  }
  expect(consoleErrors).toEqual([]);
});

test('themes and mobile search work; layout does not overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  for (const theme of ['Sand', 'Night', 'Forest']) {
    await page.getByRole('button', { name: `${theme} theme` }).click();
    await expect(page.locator('.app-shell')).toHaveClass(new RegExp(`theme-${theme.toLowerCase()}`));
  }
  if (testInfo.project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: 'Search listings' }).click();
    const search = page.getByRole('textbox', { name: 'Search crop and market listings' });
    await expect(search).toBeFocused();
    await search.fill('tomato');
    await expect(page.locator('.breadcrumb strong')).toHaveText('Marketplace');
    await page.getByRole('button', { name: 'Close search' }).click();
  } else {
    await page.getByRole('textbox', { name: 'Search market listings' }).fill('tomato');
    await expect(page.locator('.breadcrumb strong')).toHaveText('Marketplace');
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('demo does not transmit any plant images or real buyer enquiries', async ({ page }) => {
  const methods: string[] = [];
  page.on('request', request => {
    if (request.method() !== 'GET' && !request.url().startsWith('data:')) methods.push(`${request.method()} ${request.url()}`);
  });
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Plant Doctor' }).click();
  await expect(page.getByText(/does not analyze the photo or diagnose disease/i)).toBeVisible();
  await expect(page.getByText('DEMO DATA').first()).toBeVisible();
  expect(methods).toEqual([]);
});
