/** Deterministic, side-effect-free use cases and workflow transitions. */
import { initialWorkflowState, WorkflowValidationError } from '../domain/workflow.ts';
import type { WorkflowAction, WorkflowCategory, WorkflowState } from '../domain/workflow.ts';

function required(value:string, name:string, max=140):string {
  const text=value.trim().replace(/\s+/g,' ');
  if(text.length < 2 || text.length>max) throw new WorkflowValidationError(`${name} must contain 2–${max} characters.`);
  return text;
}
function positive(value:number, name:string):number {
  if(!Number.isFinite(value)||value<=0||value>1000000)throw new WorkflowValidationError(`${name} must be a positive number no greater than 1,000,000.`);
  return Math.round(value*100)/100;
}
function stamp(state:WorkflowState, category:WorkflowCategory, detail:string):WorkflowState {
  const id=state.sequence+1;
  return {...state,sequence:id,activity:[{id,category,detail},...state.activity].slice(0,100)};
}
function newId(state:WorkflowState){return state.sequence+1;}
function requireItem<T extends {id:number}>(items:T[], id:number, kind:string):T {
  const item=items.find(x=>x.id===id);if(!item)throw new WorkflowValidationError(`${kind} was not found in this session.`);return item;
}
/** Every state transition stays local in staging. REVIEW is never a real approval. */
export function transition(state:WorkflowState, action:WorkflowAction):WorkflowState {
  if(action.type==='reset')return initialWorkflowState();
  const id=newId(state);
  switch(action.type){
    case 'lot/create':{
      const crop=required(action.crop,'Crop'), district=required(action.district,'District');
      const quantity=positive(action.quantity,'Quantity'),rate=positive(action.rate,'Rate');
      return stamp({...state,lots:[{id,crop,district,quantity,rate,status:'draft'},...state.lots]},'market',`Demo lot drafted: ${crop} · ${quantity} quintals`);
    }
    case 'lot/request-review':{
      const lot=requireItem(state.lots,action.id,'Lot');
      if(lot.status!=='draft')throw new WorkflowValidationError('Only draft lots can request sample review.');
      return stamp({...state,lots:state.lots.map(x=>x.id===lot.id?{...x,status:'review_requested'}:x)},'market',`Sample review requested for ${lot.crop}`);
    }
    case 'lot/sample-review':{
      const lot=requireItem(state.lots,action.id,'Lot');
      if(lot.status!=='review_requested')throw new WorkflowValidationError('Request demo review first.');
      return stamp({...state,lots:state.lots.map(x=>x.id===lot.id?{...x,status:'sample_reviewed'}:x)},'market',`Sample review recorded for ${lot.crop} (not a verification)`);
    }
    case 'need/create':{
      const crop=required(action.crop,'Commodity'),district=required(action.district,'District');
      const quantity=positive(action.quantity,'Required quantity');
      return stamp({...state,needs:[{id,crop,district,quantity,status:'draft'},...state.needs]},'market',`Demo buyer requirement created: ${crop}`);
    }
    case 'enquiry/draft':{
      const lot=requireItem(state.lots,action.lotId,'Lot');
      const need=requireItem(state.needs,action.needId,'Requirement');
      const quantity=positive(action.quantity,'Enquiry quantity');
      if(lot.status!=='sample_reviewed')throw new WorkflowValidationError('Sample review must be completed before drafting an enquiry.');
      if(lot.crop.trim().toLowerCase()!==need.crop.trim().toLowerCase())throw new WorkflowValidationError('Select matching crops for the buyer and seller.');
      if(quantity>lot.quantity||quantity>need.quantity)throw new WorkflowValidationError('Enquiry quantity exceeds one of the two quantities.');
      return stamp({...state,enquiries:[{id,lotId:lot.id,needId:need.id,quantity,status:'unsent'},...state.enquiries]},'market',`Unsent enquiry prepared: ${quantity} quintals of ${lot.crop}`);
    }
    case 'discussion/create':{
      const title=required(action.title,'Discussion title',180),topic=required(action.topic,'Topic',70);
      return stamp({...state,discussions:[{id,title,topic,status:'draft'},...state.discussions]},'community','Local community discussion drafted');
    }
    case 'discussion/flag':{
      const discussion=requireItem(state.discussions,action.id,'Discussion');
      if(discussion.status!=='draft')throw new WorkflowValidationError('Already flagged for sample moderation.');
      return stamp({...state,discussions:state.discussions.map(x=>x.id===discussion.id?{...x,status:'flagged_for_demo_review'}:x)},'community','Discussion flagged for simulated moderation');
    }
    case 'plant/create':{
      const crop=required(action.crop,'Crop');
      const symptoms=required(action.symptoms,'Symptoms',600);
      const growthStage=required(action.growthStage,'Growth stage',90);
      return stamp({...state,plantCases:[{id,crop,symptoms,growthStage,status:'documented'},...state.plantCases]},'plant-care','Crop symptoms documented locally (no diagnosis)');
    }
    case 'plant/referral-draft':{
      const plantCase=requireItem(state.plantCases,action.id,'Crop case');
      if(plantCase.status!=='documented')throw new WorkflowValidationError('Referral draft already prepared.');
      return stamp({...state,plantCases:state.plantCases.map(x=>x.id===plantCase.id?{...x,status:'expert_referral_draft'}:x)},'plant-care','Agronomist referral drafted locally; no expert contacted');
    }
    case 'service/create':{
      const category=required(action.category,'Service',90),district=required(action.district,'District',90);
      const detail=required(action.detail,'Work description',300);
      return stamp({...state,serviceRequests:[{id,category,district,detail,status:'draft'},...state.serviceRequests]},'services','Local service request drafted; no provider contacted');
    }
    case 'module/create':{
      if(!Number.isInteger(action.moduleId)||action.moduleId<1||action.moduleId>25)throw new WorkflowValidationError('Unknown module.');
      const title=required(action.title,'Title'),detail=required(action.detail,'Details',420);
      const district=action.district.trim().slice(0,80),note=action.note.trim().slice(0,600);
      return stamp({...state,moduleDrafts:[{id,moduleId:action.moduleId,title,detail,district,note},...state.moduleDrafts]},'module',`Module ${action.moduleId} draft added`);
    }
    case 'module/remove':{
      requireItem(state.moduleDrafts,action.id,'Module draft');
      return stamp({...state,moduleDrafts:state.moduleDrafts.filter(x=>x.id!==action.id)},'module','Module draft removed');
    }
  }
}
