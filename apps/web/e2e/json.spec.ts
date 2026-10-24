import {expect,test} from '@playwright/test';

test('JSON staging workspace authenticates and performs fictional drafts, review and safe queue',async({page},info)=>{
 test.skip(process.env.KG_TEST_JSON!=='1','JSON staging UI is opt-in');
 const requests:string[]=[];
 let login=false,seq=0;
 const pending:Array<{id:number;owner:string;status:string;fields:Record<string,string|number>;created_at:string}>=[];
 const respond=(data:unknown,status=200)=>({status,contentType:'application/json',body:JSON.stringify(data)});
 await page.route('**/api/v1/**',async route=>{
  const r=route.request(),p=new URL(r.url()).pathname.replace(/^.*\/api\/v1/,'');
  const method=r.method();requests.push(method+' '+p);
  let body:Record<string,unknown>={};try{body=r.postDataJSON() as Record<string,unknown>;}catch{}
  if(p==='/auth/csrf')return route.fulfill(respond({csrf_token:'testing-only'}));
  if(p==='/auth/me')return route.fulfill(respond({identity:login?{name:'staging-admin',role:'admin',demo:true}:null}));
  if(p==='/auth/login'&&method==='POST'){login=true;return route.fulfill(respond({identity:{name:'staging-admin',role:'admin',demo:true},csrf_token:'testing-only'}));}
  if(p==='/staging/records/marketplace'&&method==='GET')return route.fulfill(respond({demo:true,items:pending.filter(x=>x.status==='reviewed-demo')}));
  if(p==='/staging/records/marketplace'&&method==='POST'){
   const item={id:++seq,owner:'staging-admin',status:'pending-demo',fields:body as Record<string,string|number>,created_at:'sample'};
   pending.push(item);return route.fulfill(respond({demo:true,item,delivered:false,replayed:false},201));
  }
  if(p==='/staging/admin/records/marketplace')return route.fulfill(respond({pending:pending.filter(x=>x.status==='pending-demo')}));
  if(p.match(/^\/staging\/admin\/records\/marketplace\/\d+\/review$/)){
   const target=pending[Number(p.split('/')[5])-1];target.status='reviewed-demo';return route.fulfill(respond({item:target,published_externally:false}));
  }
  if(p==='/staging/workflows/health')return route.fulfill(respond({database:'none',domains:{marketplace:{records:pending.length,pending:pending.filter(x=>x.status==='pending-demo').length,enabled:true,recovered:false}}}));
  if(p==='/staging/jobs'&&method==='GET')return route.fulfill(respond({items:[],health:{ok:true,database:'none',counts:{pending:0},recovered:false}}));
  if(p==='/staging/jobs'&&method==='POST')return route.fulfill(respond({job:{id:1,kind:'domain_snapshot',status:'pending'},deduplicated:false},202));
  if(p==='/staging/jobs/process')return route.fulfill(respond({processed:1,failed:0,external_actions:false}));
  if(p==='/staging/jobs/recover')return route.fulfill(respond({recovered_jobs:0,automatically_replayed:false}));
  return route.fulfill(respond({demo:true,items:[]}));
 });
 await page.goto('/krishigo/');
 if(info.project.name.startsWith('mobile'))await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:'JSON Workflows'}).click();
 await expect(page.getByRole('heading',{name:'Connected agricultural operations.'})).toBeVisible();
 await page.getByLabel('Username').fill('staging-admin');
 await page.getByLabel('Password').fill('sample-password');
 await page.getByRole('button',{name:'Sign in to JSON staging'}).click();
 await expect(page.getByText('staging-admin · admin · DEMO')).toBeVisible();
 await page.getByLabel('Crop').fill('Tomato');
 await page.getByLabel('District').fill('Pune');
 await page.getByLabel('Grade').fill('A');
 await page.getByLabel('Quantity (kg)').fill('1200');
 await page.getByLabel('Price (₹/kg)').fill('25');
 await page.getByRole('button',{name:'Save test draft'}).click();
 await expect(page.getByText('Fictional pending draft saved. Nobody was contacted.')).toBeVisible();
 await page.getByRole('button',{name:'Editorial desk'}).click();
 await expect(page.getByText('Pending marketplace review')).toBeVisible();
 await page.getByRole('button',{name:'Approve demo'}).click();
 await expect(page.getByText('Approved for the demo feed only.')).toBeVisible();
 await page.getByRole('button',{name:'Operations health'}).click();
 await expect(page.getByText(/1 records/)).toBeVisible();
 await page.getByRole('button',{name:'Queue snapshot'}).click();
 await expect(page.getByText('Safe diagnostic job queued.')).toBeVisible();
 await page.getByRole('button',{name:'Run safe jobs'}).click();
 await expect(page.getByText('Bounded jobs processed.')).toBeVisible();
 expect(requests).toContain('POST /staging/records/marketplace');
 expect(requests).toContain('POST /staging/jobs/process');
});
