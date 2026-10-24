import {expect,test} from '@playwright/test';

test('Weather module uses its own authenticated JSON contract rather than a generic note form',async({page},info)=>{
 test.skip(process.env.KG_TEST_JSON!=='1','Protected JSON staging pilot only');
 let logged=false;
 const records:Array<{id:number;status:string;fields:Record<string,string|number>;owner:string;created_at:string}>=[];
 const fields=[
  {key:'district',label:'District',type:'text',max:150,example:'Pune'},
  {key:'crop',label:'Crop',type:'text',max:150,example:'Cotton'},
  {key:'risk',label:'Weather risk',type:'enum',options:['Heavy rain','Heatwave'],example:'Heavy rain'}
 ];
 const requests:string[]=[];
 const result=(data:unknown,status=200)=>({status,contentType:'application/json',body:JSON.stringify(data)});
 await page.route('**/api/v1/**',async route=>{
  const r=route.request(),path=new URL(r.url()).pathname.split('/api/v1')[1],method=r.method();
  requests.push(method+' '+path);
  let body:Record<string,unknown>={};
  try{body=r.postDataJSON() as Record<string,unknown>;}catch{/* GET */}
  if(path==='/auth/csrf')return route.fulfill(result({csrf_token:'example-csrf'}));
  if(path==='/auth/me')return route.fulfill(result({identity:logged?{name:'editor',role:'admin',demo:true}:null}));
  if(path==='/auth/login'){logged=true;return route.fulfill(result({identity:{name:'editor',role:'admin',demo:true},csrf_token:'example-csrf'}));}
  if(path==='/staging/module-drafts/6/schema')return route.fulfill(result({schema:1,module_id:6,staging_only:true,delivery_enabled:false,purpose:'Plan weather watch criteria',roles:['admin','editor'],fields}));
  if(path==='/staging/module-drafts/6'){
   if(method==='GET')return route.fulfill(result({demo:true,private:true,items:records}));
   const draft={id:records.length+1,status:'pending-demo',owner:'editor',fields:{title:body.title as string,note:body.note as string,...body.details as Record<string,string|number>},created_at:'example'};
   records.push(draft);return route.fulfill(result({demo:true,private:true,item:draft},201));
  }
  return route.fulfill(result({error:'not_found'},404));
 });
 await page.goto('/krishigo/');
 if(info.project.name.startsWith('mobile'))await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:'Discover'}).click();
 await page.getByRole('button',{name:'Explore Weather & Alerts'}).click();
 await expect(page.getByRole('heading',{name:'Weather & Alerts'})).toBeVisible();
 await page.getByRole('tab',{name:'Create & drafts'}).click();
 await page.getByLabel('Module staging username').fill('editor');
 await page.getByLabel('Module staging password').fill('example-password');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.getByText('Plan weather watch criteria')).toBeVisible();
 await page.getByLabel('Draft title').fill('Sample heavy rain alert criteria');
 await page.getByLabel('District').fill('Pune');
 await page.getByLabel('Crop').fill('Cotton');
 await page.getByLabel('Weather risk').selectOption('Heavy rain');
 await page.getByLabel('Context note').fill('This is an unsent fictional draft for acceptance testing.');
 await page.getByRole('button',{name:'Save private JSON test draft'}).click();
 await expect(page.getByText('Module-specific fictional draft stored in private JSON. No external action triggered.')).toBeVisible();
 await expect(page.getByText('1 stored draft')).toBeVisible();
 expect(requests).toContain('GET /staging/module-drafts/6/schema');
 expect(requests).toContain('POST /staging/module-drafts/6');
 expect(records[0].fields.risk).toBe('Heavy rain');
});
