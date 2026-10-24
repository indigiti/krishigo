/** Pure domain contracts. No React, storage, HTTP or framework dependencies. */
export type WorkflowCategory = 'market'|'community'|'plant-care'|'services'|'module';
export type ReviewState = 'draft'|'review_requested'|'sample_reviewed';
export type Activity = { id: number; category: WorkflowCategory; detail: string };
export type Lot = { id: number; crop: string; district: string; quantity: number; rate: number; status: ReviewState };
export type Need = { id: number; crop: string; district: string; quantity: number; status: 'draft' };
export type Enquiry = { id: number; lotId: number; needId: number; quantity: number; status: 'unsent' };
export type Discussion = { id: number; title: string; topic: string; status: 'draft'|'flagged_for_demo_review' };
export type PlantCase = { id: number; crop: string; symptoms: string; growthStage: string; status: 'documented'|'expert_referral_draft' };
export type ServiceRequest = { id: number; category: string; district: string; detail: string; status: 'draft' };
export type ModuleDraft = { id: number; moduleId: number; title: string; detail: string; district: string; note: string };
export type WorkflowState = { sequence: number; lots: Lot[]; needs: Need[]; enquiries: Enquiry[]; discussions: Discussion[]; plantCases: PlantCase[]; serviceRequests: ServiceRequest[]; moduleDrafts: ModuleDraft[]; activity: Activity[] };

export type WorkflowAction =
  | { type:'lot/create'; crop:string; district:string; quantity:number; rate:number }
  | { type:'lot/request-review'; id:number }
  | { type:'lot/sample-review'; id:number }
  | { type:'need/create'; crop:string; district:string; quantity:number }
  | { type:'enquiry/draft'; lotId:number; needId:number; quantity:number }
  | { type:'discussion/create'; title:string; topic:string }
  | { type:'discussion/flag'; id:number }
  | { type:'plant/create'; crop:string; symptoms:string; growthStage:string }
  | { type:'plant/referral-draft'; id:number }
  | { type:'service/create'; category:string; district:string; detail:string }
  | { type:'module/create'; moduleId:number; title:string; detail:string; district:string; note:string }
  | { type:'module/remove'; id:number }
  | { type:'reset' };

export const initialWorkflowState = ():WorkflowState => ({ sequence:0, lots:[], needs:[], enquiries:[], discussions:[], plantCases:[], serviceRequests:[], moduleDrafts:[], activity:[] });
export class WorkflowValidationError extends Error { constructor(message:string){super(message);this.name='WorkflowValidationError';} }
