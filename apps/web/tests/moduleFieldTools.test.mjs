import test from 'node:test';
import assert from 'node:assert/strict';
import {standardToolIds,moduleFieldTools,evaluateModuleCalculator,taskPlanCompletion} from '../src/domain/moduleFieldTools.ts';

test('each standard module has exactly one domain-specific field tool, while 11 retains its dedicated workspace',()=>{
 assert.deepEqual(standardToolIds,Array.from({length:25},(_,i)=>i+1).filter(id=>id!==11));
 const types=standardToolIds.map(id=>moduleFieldTools[id].kind);
 assert.equal(types.filter(x=>x==='calculator').length,12);
 assert.equal(types.filter(x=>x==='action-plan').length,12);
 assert.equal(new Set(standardToolIds).size,24);
});
test('all twelve calculators implement their declared own-number scenarios',()=>{
 const expected={1:2250,2:41700,3:1800,9:118000,10:12000,12:124,14:266.75,17:3080,20:1500,22:16500,23:12000,24:6000};
 for(const [idString,value] of Object.entries(expected)){
  const id=Number(idString),tool=moduleFieldTools[id];
  assert.equal(tool.kind,'calculator');
  const inputs=Object.fromEntries(tool.fields.map(f=>[f.key,f.initial]));
  const result=evaluateModuleCalculator(id,inputs);
  assert.equal(result.valid,true,id+': '+result.reason);
  assert.equal(result.value,value,id);
  assert.ok(result.label.length>7);
  assert.ok(result.notice.toLowerCase().includes('no ')||/not |does not|pending/.test(result.notice.toLowerCase()),id);
 }
});
test('invalid, missing, huge and fractional count inputs fail with explicit message',()=>{
 for(const id of standardToolIds){
  const tool=moduleFieldTools[id];
  if(tool.kind!=='calculator')continue;
  const values=Object.fromEntries(tool.fields.map(f=>[f.key,f.initial]));
  const required=tool.fields[0];
  const invalids=[Number.NaN,Number.POSITIVE_INFINITY,-1,required.max+1];
  for(const invalid of invalids){
   const outcome=evaluateModuleCalculator(id,{...values,[required.key]:invalid});
   assert.equal(outcome.valid,false,id+' '+String(invalid));
   assert.equal(outcome.value,null);
   assert.ok(outcome.reason.length>8);
  }
  assert.equal(evaluateModuleCalculator(id,{}).valid,false,id);
  const whole=tool.fields.find(f=>f.whole);
  if(whole)assert.equal(evaluateModuleCalculator(id,{...values,[whole.key]:1.5}).valid,false,id+' must require whole number');
 }
});
test('financial and trade tools never claim actual payment, order, APR, crop treatment or weather prediction',()=>{
 for(const id of standardToolIds){
  const t=moduleFieldTools[id];
  assert.ok(t.title.length>6);
  assert.ok(t.description.length>20);
  assert.ok(t.notice.length>30);
  if(t.kind==='calculator'){
   assert.ok(t.fields.length>=2&&t.fields.length<=5,id);
   assert.equal(new Set(t.fields.map(f=>f.key)).size,t.fields.length);
   for(const f of t.fields){
    assert.ok(f.max>f.min);
    assert.ok(f.initial>=f.min&&f.initial<=f.max,id+' '+f.key);
   }
  }else{
   assert.ok(t.steps.length>=4,id);
   for(const step of t.steps){assert.ok(step.label.length>8&&step.note.length>15,id);}
  }
 }
});
test('action planning deduplicates valid selections and drops unknown tasks',()=>{
 for(const id of standardToolIds){
  const t=moduleFieldTools[id];
  if(t.kind!=='action-plan')continue;
  assert.deepEqual(taskPlanCompletion(id,[]),{done:0,total:t.steps.length,percent:0});
  const result=taskPlanCompletion(id,[0,0,1,-1,15,NaN,1.5]);
  assert.equal(result.done,2,id);
  assert.equal(result.percent,50,id);
  assert.equal(taskPlanCompletion(id,t.steps.map((_,i)=>i)).percent,100,id);
 }
 assert.deepEqual(taskPlanCompletion(11,[0]),{done:0,total:0,percent:0});
 assert.equal(evaluateModuleCalculator(11,{}).valid,false);
});
