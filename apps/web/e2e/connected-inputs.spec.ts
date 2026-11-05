import {test,expect} from '@playwright/test';
test('P1–P4 input pilot exposes authenticated drafts, review and sourced lookup',async({page},info)=>{
 test.skip(process.env.KG_TEST_JSON!=='1','Protected JSON pilot only');
 let authenticated=false,serial=0;
 const rows:Array<{id:number;owner:string;status:string;fields:Record<string,string>;created_at:string}>=[];
 const mock=(data:unknown,status=200)=>({status,contentType:'application/json',body:JSON.stringify(data)});
 await page.route('**/api/v1/**',async route=>{
  const request=route.request(),url=new URL(request.url());
  const path=url.pathname.replace(/^.*\/api\/v1/,'');
  const method=request.method();
  const body=method==='POST'?request.postDataJSON() as Record<string,string>:{};
  if(path==='/auth/csrf')return route.fulfill(mock({csrf_token:'staging-test-csrf'}));
  if(path==='/auth/me')return route.fulfill(mock({identity:authenticated?{name:'demo-editor',role:'admin',demo:true}:null}));
  if(path==='/auth/login'){authenticated=true;return route.fulfill(mock({identity:{name:'demo-editor',role:'admin',demo:true},csrf_token:'staging-test-csrf'}));}
  if(path==='/staging/inputs/schemas')return route.fulfill(mock({schemas:{products:{private:false,create_allowed:true,fields:[
   {key:'name',label:'Product name',type:'text',max:120,options:null},
   {key:'category',label:'Input category',type:'category',max:700,options:['micronutrient','herbicide']},
   {key:'composition',label:'Composition',type:'text',max:220,options:null},
   {key:'crop',label:'Crop',type:'text',max:90,options:null},
   {key:'registration_reference',label:'Registration reference',type:'text',max:140,options:null},
   {key:'source_url',label:'Source URL',type:'url',max:300,options:null},
   {key:'checked_on',label:'Source checked on',type:'date',max:700,options:null}
  ]}}}));
  if(path==='/staging/inputs/records/products'){
   if(method==='POST'){const row={id:++serial,owner:'demo-editor',status:'pending-demo',fields:body,created_at:'test'};rows.push(row);return route.fulfill(mock({item:row,external_publication:false},201));}
   return route.fulfill(mock({items:url.searchParams.get('mine')==='1'?rows:rows.filter(r=>r.status==='reviewed-demo'),private:false}));
  }
  if(path==='/staging/inputs/admin/products')return route.fulfill(mock({pending:rows.filter(r=>r.status==='pending-demo')}));
  if(path.endsWith('/review')&&method==='POST'){
   const id=Number(path.match(/\/(\d+)\/review$/)?.[1]||0);
   const row=rows.find(r=>r.id===id)!;row.status=body.decision==='approve'?'reviewed-demo':'rejected-demo';
   return route.fulfill(mock({item:row,regulatory_certification:false}));
  }
  if(path==='/staging/inputs/assistant'){
   return route.fulfill(mock({results:rows.filter(r=>r.status==='reviewed-demo').map(r=>({
    title:r.fields.name,summary:r.fields.composition,source_url:r.fields.source_url,kind:'products'})),
    answer:'Human-reviewed staging sources only.',generative_ai:false}));
  }
  if(path==='/staging/inputs/alerts')return route.fulfill(mock({matches:[],notifications_sent:false}));
  return route.fulfill(mock({error:'not_found'},404));
 });
 await page.goto('/krishigo/');
 if(info.project.name.startsWith('mobile'))await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:'Agri Inputs'}).click();
 await expect(page.getByRole('heading',{name:'Connected inputs operations'})).toBeVisible();
 await page.getByLabel('Staging username').fill('demo-editor');
 await page.getByLabel('Staging password').fill('staging-test-password');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByLabel('Product name').fill('Demo micronutrient');
 await page.getByLabel('Input category').selectOption('micronutrient');
 await page.getByLabel('Composition').fill('Illustrative grade');
 await page.locator('.agri-connected-form').getByLabel('Crop',{exact:true}).fill('Onion');
 await page.getByLabel('Registration reference').fill('UNKNOWN');
 await page.getByLabel('Source URL').fill('https://example.org/label');
 await page.getByLabel('Source checked on').fill('2026-11-01');
 await page.getByRole('button',{name:'Save protected draft'}).click();
 await expect(page.getByText(/Private|Protected demo draft/).first()).toBeVisible();
 await page.getByLabel('Records').selectOption('review');
 await page.locator('.agri-review-reason textarea').fill('Demo evidence only, no external validation.');
 await page.getByRole('button',{name:'Review as demo'}).click();
 await expect(page.getByText(/not legal certification/)).toBeVisible();
 await page.getByLabel('Search staged sources').fill('micronutrient');
 await page.getByRole('button',{name:'Search',exact:true}).click();
 await expect(page.getByText('Demo micronutrient').first()).toBeVisible();
});
