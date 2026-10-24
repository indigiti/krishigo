import { expect, test } from '@playwright/test';

const pages = ['Overview', 'Plant Doctor', 'Marketplace', 'Community', 'Insights', 'Buyers', 'Services', 'Crop Journal', 'Discover', 'Admin', 'My Profile', 'Plant Cases', 'Onboarding', 'Trade Desk', 'Review Desk', 'Workflow Hub'];

test('staging shows fiction disclaimer and usable navigation', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', error => consoleErrors.push(error.message));
  await page.goto('/krishigo/');
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
  await page.goto('/krishigo/');
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

test('demo does not transmit any plant images or real buyer enquiries', async ({ page }, testInfo) => {
  const methods: string[] = [];
  page.on('request', request => {
    if (request.method() !== 'GET' && !request.url().startsWith('data:')) methods.push(`${request.method()} ${request.url()}`);
  });
  await page.goto('/krishigo/');
  if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Plant Doctor' }).click();
  await expect(page.getByText(/does not analyze the photo or diagnose disease/i)).toBeVisible();
  await expect(page.getByText('DEMO DATA').first()).toBeVisible();
  expect(methods).toEqual([]);
});

test('25 module catalogue opens specialized demo workflows without network writes', async ({ page }) => {
  test.setTimeout(90_000);
  const mutations: string[] = [];
  page.on('request', request => { if (!['GET','HEAD'].includes(request.method())) mutations.push(request.method()+' '+request.url()); });
  await page.goto('/krishigo/');
  if (test.info().project.name.startsWith('mobile')) await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Discover' }).click();
  const examples = [
    { name: 'Mandi Prices', field: 'Commodity' },
    { name: 'Government Schemes', field: 'Scheme name' },
    { name: 'Machinery Marketplace', field: 'Equipment' },
    { name: 'AI Farming Assistant', field: 'Crop' },
    { name: 'Agriculture Jobs', field: 'Role' },
    { name: 'Farmer Recognition', field: 'Story title' },
  ];
  for (const example of examples) {
    await page.getByRole('button', { name: `Explore ${example.name}` }).click();
    await expect(page.getByRole('heading', { name: example.name, exact: true })).toBeVisible();
    await expect(page.getByText('Interactive demonstration only').first()).toBeVisible();
    await page.getByRole('tab', { name: 'Create & drafts' }).click();
    await expect(page.locator('.studio-form').getByText(example.field)).toBeVisible();
    await page.getByRole('button', { name: 'All modules' }).click();
  }
  expect(mutations).toEqual([]);
});

test('module draft is created only locally and can be removed', async ({ page }) => {
  await page.goto('/krishigo/');
  if (test.info().project.name.startsWith('mobile')) await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Discover' }).click();
  await page.getByRole('button', { name: 'Explore Agriculture Jobs' }).click();
  await page.getByRole('tab', { name: 'Create & drafts' }).click();
  const form = page.locator('.studio-form');
  await form.locator('input[name="field-0"]').fill('Harvest assistant');
  await form.locator('input[name="field-1"]').fill('Pune');
  await form.locator('input[name="field-2"]').fill('3 days');
  await form.getByRole('button', { name: 'Save local draft' }).click();
  await expect(page.getByText('Draft saved in this browser tab only.')).toBeVisible();
  await expect(page.getByText('Harvest assistant')).toBeVisible();
  await page.getByRole('button', { name: 'Remove draft Harvest assistant' }).click();
  await expect(page.getByText('No drafts yet.')).toBeVisible();
});


test('M7 workflow hub validates and stages a buyer enquiry without any network writes',async ({page})=>{
 const badRequests:string[]=[];
 page.on('request',r=>{if(r.method()!=='GET')badRequests.push(r.method()+' '+r.url());});
 await page.goto('/krishigo/');
 if((await page.getByRole('button',{name:'Open menu'}).isVisible().catch(()=>false)))await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:'Workflow Hub'}).click();
 await expect(page.getByText('One farm. Connected workflows.')).toBeVisible();
 const forms=page.locator('.workflow-panel form');
 await forms.nth(0).getByLabel('Crop').fill('Tomato');
 await forms.nth(0).getByLabel('District').fill('Pune');
 await forms.nth(0).getByLabel('Quantity (quintals)').fill('20');
 await forms.nth(0).getByLabel('Rate (₹/quintal)').fill('1500');
 await forms.nth(0).getByRole('button',{name:/Create local lot/}).click();
 await forms.nth(1).getByLabel('Crop').fill('Tomato');
 await forms.nth(1).getByLabel('Destination district').fill('Satara');
 await forms.nth(1).getByLabel('Quantity required (quintals)').fill('12');
 await forms.nth(1).getByRole('button',{name:/Create buyer draft/}).click();
 await page.getByRole('button',{name:'Request demo review'}).click();
 await page.getByRole('button',{name:'Mark reviewed (demo)'}).click();
 await forms.nth(2).getByLabel('Sample-reviewed produce lot').selectOption({index:1});
 await forms.nth(2).getByLabel('Buyer requirement').selectOption({index:1});
 await forms.nth(2).getByLabel('Enquiry quantity (quintals)').fill('10');
 await forms.nth(2).getByRole('button',{name:/Prepare unsent enquiry/}).click();
 await expect(page.getByText('Unsent · draft only')).toBeVisible();
 expect(badRequests).toEqual([]);
});
