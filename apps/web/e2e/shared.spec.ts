import {expect,test} from '@playwright/test';
import {readFileSync} from 'node:fs';
const descriptor=JSON.parse(readFileSync(new URL('../src/config/module-registry.json',import.meta.url),'utf8')) as {modules:Array<{id:number;key:string;name:string;category:string;summary:string;dependencies:number[];enabled:boolean}>};

test('shared module configuration controls dashboard and public navigation',async({page},info)=>{
 let authorized=false;
 let rev='a'.repeat(64);
 const disabled=new Set<number>();
 const requests:Array<{method:string;path:string;body?:Record<string,unknown>}>=[];
 const json=(body:unknown,status=200)=>({status,contentType:'application/json',body:JSON.stringify(body)});
 const snapshot=()=>{
  const modules=descriptor.modules.map(m=>({...m,enabled:!disabled.has(m.id)}));
  return {schema:1,revision:rev,modules,configured:true,recovered:false,database:'none',enabled_count:25-disabled.size,disabled_count:disabled.size};
 };
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.split('/api/v1')[1]||'';
  const method=req.method();
  let body:Record<string,unknown>={};
  try{body=req.postDataJSON() as Record<string,unknown> || {};}catch{/* GET requests */}
  requests.push({method,path,body});
  if(path==='/modules/registry')return route.fulfill(json(snapshot()));
  if(path==='/auth/csrf')return route.fulfill(json({csrf_token:'staging-csrf'}));
  if(path==='/auth/me')return route.fulfill(json({identity:authorized?{name:'test-admin',role:'admin',demo:true}:null}));
  if(path==='/auth/login'&&method==='POST'){
   authorized=true;return route.fulfill(json({identity:{name:'test-admin',role:'admin',demo:true},csrf_token:'staging-csrf'}));
  }
  if(path==='/admin/module-controls'&&method==='GET')return route.fulfill(json(authorized?snapshot():{error:'unauthorized'},authorized?200:401));
  if(path==='/admin/module-controls/4'&&method==='POST'){
   if(body.expected_revision!==rev)return route.fulfill(json({error:'module_state_conflict'},409));
   disabled.add(4);rev='b'.repeat(64);return route.fulfill(json({ok:true,revision:rev}));
  }
  return route.fulfill(json({error:'not_found'},404));
 });
 await page.goto('/krishigo/');
 if(info.project.name.startsWith('mobile'))await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:'Admin'}).click();
 await expect(page.getByRole('heading',{name:'Shared module controls.'})).toBeVisible();
 await page.getByLabel('Username').fill('test-admin');
 await page.getByLabel('Password').fill('testing-only');
 await page.getByRole('button',{name:'Sign in to shared controls'}).click();
 await expect(page.getByRole('heading',{name:'Farmer Community'})).toBeVisible();
 await page.getByRole('checkbox',{name:'Farmer Community shared module enabled'}).uncheck();
 await expect(page.getByRole('checkbox',{name:'Farmer Community shared module enabled'})).not.toBeChecked();
 await expect(page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:'Community',exact:true})).toHaveCount(0);
 expect(requests.some(x=>x.path==='/admin/module-controls/4'&&x.body?.expected_revision==='a'.repeat(64))).toBe(true);
});
