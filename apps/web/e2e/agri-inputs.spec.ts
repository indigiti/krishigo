import {expect,test} from '@playwright/test';

async function openInputs(page:import('@playwright/test').Page){
 await page.goto('/krishigo/');
 if(await page.getByRole('button',{name:'Open menu'}).isVisible())await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:'Agri Inputs'}).click();
 await expect(page.getByRole('heading',{name:'Better inputs. Better-informed decisions.'})).toBeVisible();
}

test('all twelve agricultural input tools have usable staging panels',async({page})=>{
 await openInputs(page);
 await expect(page.locator('.agri-tool')).toHaveCount(12);
 for(const name of ['Pest & disease library','Nutrient deficiency library','Product comparison','Label scanner','Soil test interpreter','Fertilizer planning assistant','Application history','Compatibility reference','Price & availability','Expiry & batch tracking','Expert consultation','Crop-wise input discovery']){
  await page.locator('.agri-tool').filter({hasText:name}).click();
  await expect(page.locator('.agri-panel')).toBeVisible();
 }
});
test('catalogue filters and mathematical nutrient equivalent remain explicitly non-prescriptive',async({page})=>{
 await openInputs(page);
 await page.getByRole('textbox',{name:'Search agricultural input references'}).fill('zinc');
 await expect(page.locator('.agri-results .agri-record')).toHaveCount(1);
 await page.locator('.agri-tool').filter({hasText:'Fertilizer planning assistant'}).click();
 await page.getByRole('spinbutton',{name:'Target amount of one nutrient (kg)'}).fill('1.9');
 await expect(page.getByText('10 kg')).toBeVisible();
 await expect(page.getByText(/Never infer crop recommendations/)).toBeVisible();
});
test('local batch tracking reports expiry without claiming recalls',async({page})=>{
 await openInputs(page);
 await page.locator('.agri-tool').filter({hasText:'Expiry & batch tracking'}).click();
 await page.getByRole('textbox',{name:'Product or grade'}).fill('Example pack');
 await page.getByRole('textbox',{name:'Batch / lot identifier'}).fill('LOT-DEMO');
 await page.getByLabel('Label expiry date').fill('2020-01-01');
 await page.getByRole('button',{name:'Track locally'}).click();
 await expect(page.getByText(/Expired/)).toBeVisible();
 await expect(page.getByText(/No manufacturer recall/)).toBeVisible();
});


test('crop library follows selected crop and links evidence without treatment advice',async({page})=>{
 await openInputs(page);
 await expect(page.getByRole('region',{name:'Crop-wise knowledge library'})).toBeVisible();
 await expect(page.locator('.agri-crop-profile')).toContainText('Tomato');
 await expect(page.locator('.agri-knowledge-card')).toHaveCount(6);
 await page.getByLabel('Crop',{exact:true}).selectOption('Onion');
 await expect(page.locator('.agri-crop-profile')).toContainText('कांदा');
 await page.getByRole('searchbox',{name:'Search crop knowledge'}).fill('micronutrient');
 await expect(page.locator('.agri-knowledge-card')).toHaveCount(1);
 await expect(page.locator('.agri-knowledge-card a[href^="https://"]')).toHaveCount(1);
 await expect(page.getByText(/not a diagnosis, registered crop-use claim/i)).toBeVisible();
});

test('pest library filters crop and disease category using sourced content',async({page})=>{
 await openInputs(page);
 await page.locator('.agri-tool').filter({hasText:'Pest & disease library'}).click();
 await expect(page.locator('.agri-knowledge-card')).toHaveCount(2);
 await page.getByRole('combobox',{name:'Crop for pest library'}).selectOption('Onion');
 await page.getByRole('combobox',{name:'Pest or disease topic'}).selectOption('Disease');
 await expect(page.locator('.agri-knowledge-card')).toHaveCount(1);
 await expect(page.locator('.agri-knowledge-card')).toContainText('Purple blotch');
 await page.getByRole('searchbox',{name:'Search pest and disease guides'}).fill('unknown-keyword');
 await expect(page.getByText(/No guides match your search/)).toBeVisible();
});

test('nutrient library searches Hindi/Marathi keywords and groups',async({page})=>{
 await openInputs(page);
 await page.locator('.agri-tool').filter({hasText:'Nutrient deficiency library'}).click();
 await expect(page.locator('.agri-knowledge-card')).toHaveCount(11);
 await page.getByRole('combobox',{name:'Nutrient group'}).selectOption('Micronutrient');
 await expect(page.locator('.agri-knowledge-card')).toHaveCount(5);
 await page.getByRole('searchbox',{name:'Search nutrient library'}).fill('जस्त');
 await expect(page.locator('.agri-knowledge-card')).toHaveCount(1);
 await expect(page.locator('.agri-knowledge-card')).toContainText('Zinc');
 await expect(page.locator('.agri-knowledge-card a[href^="https://"]')).toHaveCount(1);
});
