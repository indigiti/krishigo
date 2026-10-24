import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('M12 optional six-domain JSON client uses same-origin session and idempotency',()=>{
 const client=read('../src/infrastructure/jsonStagingClient.ts');
 const app=read('../src/App.tsx');
 assert.match(client,/credentials:'same-origin'/);
 assert.match(client,/new URL\(base\+path,window.location.origin\)/);
 assert.match(client,/crypto.randomUUID\(\)/);
 assert.match(app,/VITE_JSON_WORKFLOWS_MODE==='api'/);
 assert.match(app,/const JsonOperations = lazy/);
});
test('M12 draft workflows cannot be mistaken for real trading or diagnosis',()=>{
 const ui=read('../src/features/JsonOperations.tsx');
 assert.match(ui,/No payments, delivery, AI diagnosis or live agricultural feed/);
 assert.match(ui,/Fictional pending draft saved/);
 assert.match(ui,/Never/ig);
});
