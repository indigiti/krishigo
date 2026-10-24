import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialWorkflowState, WorkflowValidationError } from '../src/domain/workflow.ts';
import { transition } from '../src/application/workflowEngine.ts';

function execute(...actions){return actions.reduce((state,action)=>transition(state,action),initialWorkflowState());}

test('end-to-end farmer lot to reviewed demo lot to unsent buyer enquiry',()=>{
  const state=execute(
    {type:'lot/create',crop:'Tomato',district:'Pune',quantity:50,rate:1750},
    {type:'lot/request-review',id:1},
    {type:'lot/sample-review',id:1},
    {type:'need/create',crop:'Tomato',district:'Satara',quantity:12},
    {type:'enquiry/draft',lotId:1,needId:4,quantity:10},
  );
  assert.equal(state.lots[0].status,'sample_reviewed');
  assert.equal(state.enquiries[0].status,'unsent');
  assert.equal(state.enquiries[0].quantity,10);
  assert.equal(state.activity.length,5);
});

test('enquiry cannot be created before sample review',()=>{
 const state=execute({type:'lot/create',crop:'Tomato',district:'Pune',quantity:2,rate:1700},{type:'need/create',crop:'Tomato',district:'Pune',quantity:2});
 assert.throws(()=>transition(state,{type:'enquiry/draft',lotId:1,needId:2,quantity:1}),WorkflowValidationError);
});
test('enquiry requires matching crop and available quantity',()=>{
 const base=execute({type:'lot/create',crop:'Tomato',district:'Pune',quantity:8,rate:2000},{type:'lot/request-review',id:1},{type:'lot/sample-review',id:1},{type:'need/create',crop:'Onion',district:'Pune',quantity:10});
 assert.throws(()=>transition(base,{type:'enquiry/draft',lotId:1,needId:4,quantity:2}),/matching crops/);
 const match=transition(base,{type:'need/create',crop:'Tomato',district:'Pune',quantity:3});
 assert.throws(()=>transition(match,{type:'enquiry/draft',lotId:1,needId:5,quantity:4}),/exceeds/);
});
test('invalid and oversized inputs are rejected without mutating source state',()=>{
 const before=initialWorkflowState();
 for(const action of [
   {type:'lot/create',crop:' ',district:'Pune',quantity:12,rate:20},
   {type:'lot/create',crop:'Tomato',district:'Pune',quantity:Infinity,rate:20},
   {type:'need/create',crop:'Tomato',district:'Pune',quantity:-1},
   {type:'module/create',moduleId:26,title:'Example',detail:'Some detail',district:'',note:''}
 ]) assert.throws(()=>transition(before,action),WorkflowValidationError);
 assert.deepEqual(before,initialWorkflowState());
});
test('plant symptoms create an observation then a referral draft without AI diagnosis',()=>{
 const a=execute({type:'plant/create',crop:'Soybean',symptoms:'Yellow spots on older leaves',growthStage:'Flowering'});
 assert.equal(a.plantCases[0].status,'documented');
 const b=transition(a,{type:'plant/referral-draft',id:1});
 assert.equal(b.plantCases[0].status,'expert_referral_draft');
 assert.throws(()=>transition(b,{type:'plant/referral-draft',id:1}),WorkflowValidationError);
});
test('community moderation and service requests are draft-only',()=>{
 const a=execute({type:'discussion/create',title:'Field question',topic:'Tomato'}, {type:'discussion/flag',id:1}, {type:'service/create',category:'Tractor rental',district:'Nashik',detail:'Need field preparation'});
 assert.equal(a.discussions[0].status,'flagged_for_demo_review');
 assert.equal(a.serviceRequests[0].status,'draft');
});
test('module-specific drafts remain separable, removable, and resettable',()=>{
 const a=execute({type:'module/create',moduleId:7,title:'Guide draft',detail:'Sample seedling guide',district:'Pune',note:''},{type:'module/create',moduleId:18,title:'AI draft',detail:'Sample question plan',district:'Pune',note:''});
 assert.equal(a.moduleDrafts.length,2);
 const b=transition(a,{type:'module/remove',id:1});
 assert.deepEqual(b.moduleDrafts.map(x=>x.moduleId),[18]);
 assert.deepEqual(transition(b,{type:'reset'}),initialWorkflowState());
});
test('bounded audit-style activity array and monotonically increasing id sequence',()=>{
 let s=initialWorkflowState();
 for(let i=0;i<105;i++)s=transition(s,{type:'service/create',category:'Transport',district:'Pune',detail:'Truck request'});
 assert.equal(s.activity.length,100);assert.equal(s.sequence,105);assert.equal(s.activity[0].id,105);
});
