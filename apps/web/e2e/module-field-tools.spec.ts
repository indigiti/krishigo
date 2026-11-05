import {expect,test,type Page} from '@playwright/test';

async function discover(page:Page,info:{project:{name:string}}){
 await page.goto('/krishigo/');
 if(info.project.name.startsWith('mobile'))await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:'Discover'}).click();
 await expect(page.getByRole('heading',{name:'Everything agriculture. One place.'})).toBeVisible();
}
async function enter(page:Page,name:string){
 await page.getByRole('button',{name:'Explore '+name,exact:true}).click();
 await expect(page.getByRole('heading',{name:name,exact:true})).toBeVisible();
}
test('operational module calculators are interactive and reject invalid quantities',async({page},info)=>{
 await discover(page,info);
 await enter(page,'Mandi Prices');
 const calculator=page.getByRole('region',{name:'Field tool: Net mandi price per quintal'});
 await expect(calculator).toBeVisible();
 await expect(calculator.getByTestId('field-result-1')).toContainText('2,250');
 await calculator.getByRole('spinbutton',{name:'Marketable quantity'}).fill('0');
 await expect(calculator.getByTestId('field-result-1')).toHaveText('Check input values');
 await calculator.getByRole('button',{name:'Reset'}).click();
 await expect(calculator.getByTestId('field-result-1')).toContainText('2,250');
 await expect(calculator.getByText(/not a mandi feed/i)).toBeVisible();
});
test('module-specific action plans support progress without claiming publication',async({page},info)=>{
 await discover(page,info);
 await enter(page,'Agriculture News');
 const plan=page.getByRole('region',{name:'Field tool: Agriculture article source checklist'});
 await expect(plan).toBeVisible();
 await expect(plan.getByText('0 of 4 tasks')).toBeVisible();
 await plan.getByRole('checkbox').nth(0).check();
 await plan.getByRole('checkbox').nth(1).check();
 await expect(plan.getByText('2 of 4 tasks')).toBeVisible();
 await expect(plan.getByText('50% noted in this session')).toBeVisible();
 await expect(plan.getByText(/No article is fact-checked or published/)).toBeVisible();
 await plan.getByRole('button',{name:'Reset plan'}).click();
 await expect(plan.getByText('0 of 4 tasks')).toBeVisible();
});
test('finance illustration and livestock action plan keep appropriate boundaries',async({page},info)=>{
 await discover(page,info);
 await enter(page,'Finance & Insurance');
 const finance=page.getByRole('region',{name:'Field tool: Simple interest illustration'});
 await expect(finance.getByTestId('field-result-23')).toContainText('12,000');
 await finance.getByRole('spinbutton',{name:'Term'}).fill('1.5');
 await expect(finance.getByTestId('field-result-23')).toHaveText('Check input values');
 await page.getByRole('button',{name:'All modules'}).click();
 await enter(page,'Livestock Marketplace');
 const livestock=page.getByRole('region',{name:'Field tool: Livestock listing welfare checklist'});
 await expect(livestock.getByText('No award is granted')).toHaveCount(0);
 await expect(livestock.getByText(/Not an animal trade authorization/)).toBeVisible();
});
