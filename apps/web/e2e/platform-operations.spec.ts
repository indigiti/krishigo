import {expect,test} from '@playwright/test';

test('production-only platform panel exposes sourced knowledge, farm operations and honest capability flags',async({page},info)=>{
 test.skip(process.env.KG_TEST_PLATFORM!=='1','Build-specific production-candidate mock browser test');
 let authenticated=false;
 let farm:{district:string;crop_focus:string;preferred_language:string}|null=null;
 let intake=0;
 await page.route('**/api/v1/**',async route=>{
  const r=route.request(),url=new URL(r.url()),p=url.pathname.split('/api/v1')[1],method=r.method();
  let body:Record<string,unknown>={};
  try{body=r.postDataJSON() as Record<string,unknown>;}catch{}
  const reply=(data:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(p==='/auth/csrf')return reply({csrf_token:'test-csrf'});
  if(p==='/auth/me')return reply({identity:authenticated?{id:101,display_name:'Test Administrator',email:'ci@example.invalid',role:'admin',status:'active',verified_at:'2026-10-01'}:null});
  if(p==='/auth/login'){authenticated=true;return reply({identity:{id:101,display_name:'Test Administrator',email:'ci@example.invalid',role:'admin',status:'active',verified_at:'2026-10-01'},csrf_token:'test-csrf'});}
  if(p==='/marketplace/listings')return reply([]);
  if(p==='/knowledge/sources')return reply({items:[{id:'018c0f12-3456-7abc-8901-234567890abc',title:'Crop observation reference',publisher:'Example extension',source_url:'https://example.org/educational-reference',jurisdiction:'India'}]});
  if(p==='/knowledge/articles')return reply({items:[{id:'018c0f12-3456-7def-8901-234567890abc',title:'Onion field guide',crop:'Onion',topic:'crop_guide',language:'en',summary:'A source-linked educational observation, not a registered product label.',revision:1,source_url:'https://example.org/educational-reference'}]});
  if(p==='/editor/knowledge/sources'||p==='/editor/knowledge/articles'||p==='/editor/data/snapshots')return reply({items:[]});
  if(p==='/me/farm-profile'){if(method==='PUT'){farm=body as typeof farm;return reply({stored:true});}return reply({profile:farm});}
  if(p==='/agronomy/mine')return reply({items:intake?[{id:'018c0f12-3456-7abc-8901-234567890acc',crop:'Tomato',kind:'plant_observation',observation:'Observed curled leaves on new growth',status:'pending_expert_review'}]:[]});
  if(p==='/agronomy/intake'){intake++;return reply({id:'018c0f12-3456-7abc-8901-234567890acc',status:'pending_expert_review',ocr_processed:false},201);}
  if(p==='/trade/quotes/mine'||p==='/trade/orders/mine')return reply({items:[]});
  if(p==='/suppliers/profile')return reply({profile:null});
  if(p==='/admin/suppliers')return reply({items:[]});
  if(p==='/me/notification-events'||p==='/me/notification-preferences')return reply({items:[]});
  if(p==='/assistant/search')return reply({matches:[],answer:'No approved source supports a recommendation.',generative_ai:false});
  if(p==='/platform/capabilities')return reply({schema_revision:2,platform_candidate:true,source_review:true,real_ocr:false,generative_ai:false,whatsapp_delivery:false,payments:false});
  if(p==='/data/snapshots')return reply({items:[],connector_live:false});
  return reply({error:'not_found'},404);
 });
 await page.goto('/krishigo/');
 if(info.project.name.startsWith('mobile'))await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:'Connected Operations'}).click();
 await page.getByRole('heading',{name:'Sign in to KrishiGo'}).waitFor();
 await page.locator('form').filter({has:page.getByRole('button',{name:'Sign in',exact:true})}).getByLabel('Email').fill('ci@example.invalid');
 await page.locator('form').filter({has:page.getByRole('button',{name:'Sign in',exact:true})}).getByLabel('Password').fill('example-ci-password');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Knowledge, trade & field operations'})).toBeVisible();
 await expect(page.getByText('Onion field guide')).toBeVisible();
 await page.getByRole('tab',{name:'Farm records'}).click();
 await page.locator('.platform-workspace').getByLabel('District').fill('Pune');
 await page.locator('.platform-workspace').getByLabel('Crop focus').fill('Tomato');
 await page.locator('.platform-workspace').getByRole('button',{name:'Save my preferences'}).click();
 await expect(page.getByText('Private farm profile saved.')).toBeVisible();
 await page.getByRole('tab',{name:'Intelligence & alerts'}).click();
 await expect(page.getByText(/external WhatsApp\/email delivery is disabled/i)).toBeVisible();
 await page.getByRole('tab',{name:'Data & readiness'}).click();
 await expect(page.getByText('generative ai')).toBeVisible();
 await expect(page.getByText('payments')).toBeVisible();
 await expect(page.getByText('No current, reviewed source snapshots.')).toBeVisible();
});
