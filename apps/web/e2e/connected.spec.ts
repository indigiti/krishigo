import {expect,test} from '@playwright/test';
type RecordRow={id:number;owner:string;status:string;fields:Record<string,string|number>;created_at:string};
test('dedicated connected Marketplace, Buyers, Plant Care and editorial workflows',async({page},info)=>{
 test.skip(process.env.KG_TEST_JSON!=='1','Protected JSON API pilot only');
 let logged=false,seq=0;
 const records:Record<string,RecordRow[]>={marketplace:[],buyers:[],community:[],plant:[],services:[],editorial:[]};
 const requests:string[]=[];
 const response=(data:unknown,status=200)=>({status,contentType:'application/json',body:JSON.stringify(data)});
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/^.*\/api\/v1/,'');
  const method=req.method();requests.push(method+' '+path);
  let data:Record<string,unknown>={};try{data=req.postDataJSON() as Record<string,unknown>;}catch{}
  if(path==='/auth/csrf')return route.fulfill(response({csrf_token:'test-csrf'}));
  if(path==='/auth/me')return route.fulfill(response({identity:logged?{name:'editorial-tester',role:'admin',demo:true}:null}));
  if(path==='/auth/login'&&method==='POST'){logged=true;return route.fulfill(response({identity:{name:'editorial-tester',role:'admin',demo:true},csrf_token:'test-csrf'}));}
  if(path==='/staging/marketplace/matches'){
   const crop=url.searchParams.get('crop'),district=url.searchParams.get('district'),quantity=Number(url.searchParams.get('quantity_kg'));
   const found=records.marketplace.filter(r=>r.status==='reviewed-demo'&&r.fields.crop===crop&&r.fields.district===district&&Number(r.fields.quantity_kg)>=quantity);
   return route.fulfill(response({demo:true,items:found,matched:found.length,enquiries_sent:false}));
  }
  const item=path.match(/^\/staging\/records\/(marketplace|buyers|community|plant|services|editorial)$/);
  if(item){
   const domain=item[1];
   if(method==='GET')return route.fulfill(response({demo:true,items: url.searchParams.get('mine')==='1' ? records[domain] : records[domain].filter(r=>r.status==='reviewed-demo')}));
   if(method==='POST'){
    const r:RecordRow={id:++seq,owner:'editorial-tester',status:'pending-demo',fields:data as Record<string,string|number>,created_at:'sample'};
    records[domain].push(r);return route.fulfill(response({demo:true,item:r,replayed:false},201));
   }
  }
  const list=path.match(/^\/staging\/admin\/records\/(marketplace|buyers|community|plant|services|editorial)$/);
  if(list)return route.fulfill(response({pending:records[list[1]].filter(r=>r.status==='pending-demo')}));
  const reviewed=path.match(/^\/staging\/admin\/records\/(marketplace|buyers|community|plant|services|editorial)\/(\d+)\/review$/);
  if(reviewed){
   const r=records[reviewed[1]].find(row=>row.id===Number(reviewed[2]))!;
   r.status=data.decision==='approve'?'reviewed-demo':'rejected-demo';return route.fulfill(response({item:r,published_externally:false}));
  }
  return route.fulfill(response({error:'not_found'},404));
 });
 const navigate=async(name:string)=>{
  if(info.project.name.startsWith('mobile'))await page.getByRole('button',{name:'Open menu'}).click();
  await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name,exact:true}).click();
 };
 await page.goto('/krishigo/');
 await navigate('Marketplace');
 await expect(page.getByRole('heading',{name:'Produce marketplace.'})).toBeVisible();
 await page.getByLabel('Staging username').fill('editorial-tester');
 await page.getByLabel('Staging password').fill('test-password');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.getByText('editorial-tester · admin · DEMO')).toBeVisible();
 await page.getByLabel('Crop').fill('Tomato');
 await page.getByLabel('District').fill('Pune');
 await page.getByLabel('Grade').fill('A');
 await page.getByLabel('Quantity (kg)').fill('1000');
 await page.getByLabel('Price (₹/kg)').fill('25');
 await page.getByRole('button',{name:'Save produce lot'}).click();
 await expect(page.getByText('No product has been advertised to a real buyer.')).toBeVisible();
 await page.getByRole('button',{name:'Approve demo'}).click();
 await expect(page.getByText('Review decision saved only in the staging JSON store.')).toBeVisible();
 await navigate('Buyers');
 await expect(page.getByRole('heading',{name:'Buyer procurement.'})).toBeVisible();
 await page.getByLabel('Crop').fill('Tomato');await page.getByLabel('District').fill('Pune');await page.getByLabel('Quantity (kg)').fill('500');
 await page.getByRole('button',{name:'Find reviewed produce matches'}).click();
 await expect(page.getByText(/1000 kg available/)).toBeVisible();
 await page.getByRole('button',{name:'Save requirement'}).click();
 await expect(page.getByText('No farmer has received a procurement enquiry.')).toBeVisible();
 await navigate('Plant Doctor');
 await expect(page.getByRole('heading',{name:'Plant Care casebook.'})).toBeVisible();
 await page.getByLabel('Crop').fill('Tomato');await page.getByLabel('District').fill('Pune');
 await page.getByLabel('Observation (not diagnosis)').fill('First private test observation.');
 await page.getByRole('button',{name:'Save observation'}).click();
 await expect(page.getByText('Observations remain private to this staging login.')).toBeVisible();
 await page.getByLabel('Follow-up case').selectOption({index:1});
 await page.getByLabel('Crop').fill('Tomato');await page.getByLabel('District').fill('Pune');
 await page.getByLabel('Observation (not diagnosis)').fill('Follow-up field observations.');
 await page.getByRole('button',{name:'Save observation'}).click();
 await expect(page.getByText(/followup of: 3/)).toBeVisible();
 await navigate('Services');
 await expect(page.getByRole('heading',{name:'Agricultural service requests.'})).toBeVisible();
 await navigate('Community');
 await expect(page.getByRole('heading',{name:'Farmer community.'})).toBeVisible();
 await navigate('Review Desk');
 await expect(page.getByRole('heading',{name:'Editorial publishing desk.'})).toBeVisible();
 expect(requests).toContain('GET /staging/marketplace/matches');
 expect(requests.filter(x=>x==='POST /staging/records/plant')).toHaveLength(2);
});
