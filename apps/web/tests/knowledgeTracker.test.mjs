import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleFieldTools,standardToolIds} from '../src/domain/moduleFieldTools.ts';
const tracker=readFileSync(new URL('../../../KNOWLEDGE.md',import.meta.url),'utf8');
const registry=JSON.parse(readFileSync(new URL('../src/config/module-registry.json',import.meta.url),'utf8'));
test('single knowledge tracker covers every module in the released registry',()=>{
 assert.equal(registry.modules.length,25);
 for(const module of registry.modules){
  const id=String(module.id).padStart(2,'0');
  assert.match(tracker,new RegExp('^\\| '+id+' \\|','m'),id+' missing in KNOWLEDGE.md');
  assert.ok(module.id===11||Object.hasOwn(moduleFieldTools,module.id),module.name+' has no M19 field tool');
 }
 assert.equal(standardToolIds.length,24);
});
test('tracker distinguishes local, staged, external, verified and blocked work',()=>{
 for(const term of ['| D |','| S |','| C |','| X |','| V |','| BLOCKED |'])
  assert.ok(tracker.includes(term),'Missing '+term);
 assert.ok(tracker.includes('No verified live Cloudways deployment'));
 assert.ok(tracker.includes('M20 — Source-backed content'));
 assert.ok(tracker.includes('M25 — Production hardening'));
});
