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
