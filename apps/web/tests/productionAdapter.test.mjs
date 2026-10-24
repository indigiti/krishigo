import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const app=read('../src/App.tsx');
const client=read('../src/infrastructure/productionApiClient.ts');
const ui=read('../src/features/ProductionWorkspace.tsx');
test('production workspace is lazy and hidden from default staging navigation',()=>{
 assert.match(app,/lazy\(\(\) => import\('\.\/features\/ProductionWorkspace'\)\)/);
 assert.match(app,/!isDemo \? \[/);
 assert.match(app,/!isDemo && <ProductionWorkspace\/>/);
});
test('production API client is cookie and CSRF based, not a token in URL or storage',()=>{
 assert.match(client,/credentials: 'include'/);
 assert.match(client,/X-CSRF-Token/);
 assert.match(client,/await this\.initialize\(\)/);
 assert.doesNotMatch(client,/localStorage|sessionStorage|document\.cookie/);
});
test('connected production UI distinguishes crop observations from AI diagnosis',()=>{
 assert.match(ui,/Do not submit sensitive crop imagery/);
 assert.match(ui,/Plant Care Records/);
 assert.match(ui,/reviewed/);
});
