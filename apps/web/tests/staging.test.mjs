import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const provider = read('../src/services/dataSource.ts');
const app = read('../src/App.tsx');
const extras = read('../src/data/expanded.ts');
const workspaces = read('../src/features/Workspaces.tsx');
test('staging defaults to the no-database mock provider', () => {
  assert.match(provider, /import\.meta\.env\.VITE_DATA_MODE !== 'api'/);
  assert.match(provider, /isDemo \? mockSource : apiSource/);
  assert.match(provider, /structuredClone\(buyerRequirements\)/);
});
test('production endpoints are isolated in one adapter', () => {
  assert.match(provider, /\/buyers\/requirements/);
  assert.match(provider, /\/community\/posts/);
  assert.match(provider, /\/services/);
});
test('core workspace screens have actual demo workflows', () => {
  for (const p of ['Buyers','Services','Discover','Crop Journal','Admin']) assert.ok(app.includes(p), p);
  for (const f of ['setRequirements','setEntries','setSelected','setCategory']) assert.ok(workspaces.includes(f), f);
});
test('all 25 original feature names appear as planned modules', () => {
  const match = extras.match(/export const scopeModules:[\s\S]+?= \[([\s\S]+?)\]\.map/);
  assert.ok(match, 'module catalog');
  assert.equal((match[1].match(/^ \['/gm)||[]).length, 25);
});
test('Plant Doctor and market samples state clear limitations', () => {
  assert.match(app, /does not analyze the photo or diagnose disease/);
  assert.match(app, /fictional UI sample records/);
  assert.match(workspaces, /in-memory state only/);
});
const profileSource = read('../src/features/IdentityCases.tsx');
test('M2 has role previews but they never claim backend authorization', () => {
  for (const role of ['Farmer','Buyer','FPO coordinator','Agronomist','Editor']) assert.ok(profileSource.includes(role));
  assert.match(profileSource,/does not grant API permissions/);
  assert.match(app,/My Profile/);
});
test('M2 local crop case journal explicitly prohibits AI or upload claims', () => {
  assert.match(profileSource,/no AI diagnosis/i);
  assert.match(profileSource,/no upload/i);
  assert.match(profileSource,/image\/jpeg/);
  assert.match(app,/Plant Cases/);
});

const m3 = read('../src/features/TradeWorkflows.tsx');
test('M3 provides real onboarding flow, listing detail and unsent enquiry drafts', () => {
  for (const component of ['FarmerOnboarding','TradeDesk','ReviewDesk']) assert.ok(m3.includes(`function ${component}`), component);
  assert.match(m3,/No seller was contacted/);
  assert.match(m3,/not a real account/);
  assert.match(m3,/not an authorized admin panel/);
  assert.match(m3,/dataSource\.listings\(\)/);
  assert.match(app,/nav\('Trade Desk'\)/);
});
test('M3 screens remain local simulations without a client-side write API', () => {
  assert.doesNotMatch(m3,/fetch\(|localStorage|sessionStorage|indexedDB/);
  for (const page of ['Onboarding','Trade Desk','Review Desk']) assert.ok(app.includes(`page === '${page}'`));
});
