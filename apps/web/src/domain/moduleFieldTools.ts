/**
 * Deterministic, self-contained field tools for the 24 standard KrishiGo modules.
 * Module 11 already has a dedicated Agricultural Inputs Intelligence workspace.
 * Input values are user-provided; outputs are examples, NOT live agricultural data
 * or advice, prices, eligibility assessments, trade confirmations or forecasts.
 */
export type NumberField = {
 key: string; label: string; unit: string; min: number; max: number;
 initial: number; whole?: boolean; help?: string;
};
export type CalculatorTool = {
 kind: 'calculator'; title: string; description: string; fields: readonly NumberField[];
 resultLabel: string; resultUnit: string; precision: number; notice: string;
};
export type ActionStep = {label: string; note: string};
export type ChecklistTool = {
 kind: 'action-plan'; title: string; description: string; steps: readonly ActionStep[];
 notice: string;
};
export type FieldTool = CalculatorTool | ChecklistTool;
const num=(key:string,label:string,unit:string,initial:number,min=0.001,max=100_000_000):NumberField=>({key,label,unit,initial,min,max});
const whole=(key:string,label:string,unit:string,initial:number,min=1,max=100_000_000):NumberField=>({...num(key,label,unit,initial,min,max),whole:true});
const calc=(title:string,description:string,fields:NumberField[],resultLabel:string,resultUnit:string,notice:string,precision=2):CalculatorTool=>({kind:'calculator',title,description,fields,resultLabel,resultUnit,notice,precision});
const plan=(title:string,description:string,steps:[string,string][],notice:string):ChecklistTool=>({
 kind:'action-plan',title,description,steps:steps.map(([label,note])=>({label,note})),notice
});
/** A single functional tool per standard module; no duplicate tool for module 11. */
export const moduleFieldTools:Readonly<Record<number,FieldTool>>={
 1:calc('Net mandi price per quintal','Compare a rate and total transport using your own figures.',
  [num('rate','Observed rate','₹/quintal',2300),num('qty','Marketable quantity','quintals',30),num('cost','Transport + handling cost','₹ total',1500,0)],'Estimated net per quintal','₹/quintal','Not a mandi feed or selling recommendation. Excludes unentered charges.'),
 2:calc('Produce lot value estimator','Estimate the net value of a proposed harvest lot before negotiating.',
  [num('qty','Marketable quantity','quintals',20),num('rate','Proposed selling rate','₹/quintal',2200),num('cost','Total expected charges','₹ total',2300,0)],'Illustrative net lot value','₹','No offer, buyer contact, sale or payment is created.'),
 3:calc('Procurement coverage gap','Compare a buyer quantity request against available lots.',
  [num('need','Requested quantity','kg',5000),num('available','Identified supply','kg',3200,0)],'Supply still needed','kg','Does not validate real lot ownership, crop quality or matching.'),
 4:plan('Community post moderation preparation','Prepare a draft discussion before asking a real moderator.',
  [['Remove personal contact details','Use private communication only through authorized features.'],
   ['Flag chemical or health claims','Do not present peer suggestions as prescriptions.'],
   ['Identify crop and location context','A crop, region and observation date support useful discussion.'],
   ['Select a question for expert review','Escalate uncertain crop treatments rather than guessing.']],
  'Checking items is a personal writing checklist, not a moderation approval.'),
 5:plan('Agriculture article source checklist','Prepare an editorial item for verification and publication later.',
  [['Identify the original publisher','Keep a primary source URL or document reference.'],
   ['Separate publication date and event date','A news item can be newly published about an older event.'],
   ['Corroborate the key claim','Cross-check numbers, policy statements and quoted remarks.'],
   ['Record permissions and corrections','Respect content rights and preserve correction history.']],
  'No article is fact-checked or published by this tool.'),
 6:plan('Farm weather response preparation','Prepare information for an eventual official weather alert feed.',
  [['Record field and district','Location affects the relevance of a real forecast.'],
   ['Identify crop and growth stage','Different stages have different vulnerabilities.'],
   ['Choose an authoritative forecast source','Inspect validity time and actual issued warnings.'],
   ['Document a response contact','Use qualified local extension services for urgent decisions.']],
  'No forecast or active hazard warning is provided.'),
 7:plan('Crop-learning guide authoring','Structure a crop-specific educational article.',
  [['Choose crop, stage and region','General content may not transfer between agro-climatic zones.'],
   ['Record original educational references','Link to qualified agriculture extension sources.'],
   ['Check safety and uncertainty','Avoid unregistered crop/chemical claims.'],
   ['Request agronomist editorial review','Publish only after independent subject-matter review.']],
  'Completing this plan does not publish or verify content.'),
 8:plan('Scheme application research','Prepare an evidence checklist for a possible government scheme.',
  [['Open the current official scheme portal','Do not rely on old third-party summaries.'],
   ['Check district/category eligibility rules','Eligibility is specific to the individual programme.'],
   ['Record deadlines and document types','Never upload identity documents into a demo.'],
   ['Note department contact and application reference','An official receipt is required to confirm submission.']],
  'Eligibility is not assessed and no application is submitted.'),
 9:calc('Machinery annualized cost comparison','Spread a hypothetical purchase cost over years and add annual upkeep.',
  [num('purchase','Illustrative purchase cost','₹',450000),whole('years','Estimated use period','years',5),num('upkeep','Annual upkeep/insurance','₹ per year',28000,0)],'Simplified annual cost','₹/year','Not a financing, resale-value or machinery-worth assessment.'),
 10:calc('Equipment hire budget','Estimate equipment hire plus operator/travel charges for a proposed booking.',
  [num('hours','Requested hours','hours',8),num('rate','Proposed hourly rental rate','₹/hour',1300),num('other','Other quoted charges','₹',1600,0)],'Illustrative hire budget','₹','No supplier availability or booking is confirmed.'),
 12:calc('Transport cost per quintal','Allocate an entered total freight/handling cost across cargo quantity.',
  [num('freight','Quoted freight','₹',5300,0),num('handling','Handling/other costs','₹',900,0),num('qty','Cargo weight','quintals',50)],'Total transport unit cost','₹/quintal','Real routes, vehicle rates and deliveries are not verified.'),
 13:plan('Agricultural service work order','Prepare clear requirements before engaging a service provider.',
  [['Write precise work scope','Include crop, plot and task boundaries.'],
   ['Verify provider qualifications','Check licences where applicable, safety and insurance.'],
   ['Agree equipment, timing and fees','Separate labour, materials and travel terms.'],
   ['Plan completion evidence','Record work performed and any agreed follow-up.']],
  'No service provider has been contacted or booked.'),
 14:calc('FPO collective lot estimate','Estimate aggregate saleable quantity from participating members.',
  [whole('members','Participating members','farmers',25),num('perMember','Estimated quantity per farmer','quintals',11),num('lossPct','Expected handling loss','%',3,0,100)],'Illustrative saleable quantity','quintals','Real member consent, ownership, grade and stock reconciliation are pending.'),
 15:plan('Local business verification intake','Prepare a prospective supplier or service directory record.',
  [['Check legal name and operating address','Do not infer that a listing is a verified business.'],
   ['Record permitted contact details','Collect permission before publishing phone or email.'],
   ['Request regulatory licence where needed','Input products and some activities may require specific permission.'],
   ['Record last verification date','Stale entries should be visibly marked.']],
  'No provider is automatically verified, ranked or published.'),
 16:plan('Training course release checklist','Prepare a structured, accessible agricultural lesson.',
  [['Identify learner and learning objective','Define the crop, language and skill target.'],
   ['Record instructor credentials','Expert attribution is required for agronomy claims.'],
   ['Prepare captions and transcripts','Account for Marathi, Hindi and low-bandwidth access.'],
   ['Create knowledge check and revision date','Retire outdated chemical or policy references.']],
  'This is authoring preparation; no video is hosted or streamed.'),
 17:calc('Warehouse storage budget','Estimate storage charges from an entered capacity-duration-rate quote.',
  [num('qty','Cargo quantity','tonnes',2),whole('days','Storage period','days',14),num('rate','Quoted storage rate','₹/tonne/day',110)],'Illustrative storage budget','₹','Does not confirm a cold-chain facility, safe temperature or booking.'),
 18:plan('Farm assistant question triage','Collect missing context before expert or validated AI review.',
  [['Identify crop and growth stage','Growth stage influences symptom interpretation.'],
   ['Document signs and extent','Record what is visible and whether it is spreading.'],
   ['Record watering, weather and recent inputs','Similar signs have several possible causes.'],
   ['Link source or request expert review','Do not produce chemical doses or definitive diagnosis.']],
  'No automated crop diagnosis, treatment or live expert response.'),
 19:plan('Livestock listing welfare checklist','Prepare a lawful and welfare-conscious listing record.',
  [['Confirm local trade permissions','Allowed animal categories and transport rules can differ.'],
   ['Record veterinary and ownership evidence','Avoid a fictitious health certification.'],
   ['Check housing and transport welfare','Animal safety is central to any real fulfilment.'],
   ['Use a verified buyer and seller','Avoid publication until provenance is reviewed.']],
  'Not an animal trade authorization or veterinary examination.'),
 20:calc('Market-to-market net comparison','Compare the net lot value of two entered price/expense scenarios.',
  [num('qty','Same commodity quantity','quintals',30),num('rateA','Market A expected rate','₹/quintal',2200),num('costA','Market A total charges','₹',4000,0),
   num('rateB','Market B expected rate','₹/quintal',2350),num('costB','Market B total charges','₹',7000,0)],'Net difference: B minus A','₹','Positive means B is higher for these hypothetical values; not a forecast.'),
 21:plan('Soil-report interpretation preparation','Capture enough context for meaningful qualified review.',
  [['Identify lab and sampling method','Different tests and depths are not interchangeable.'],
   ['Preserve measurement units and date','A value without units or method may be meaningless.'],
   ['Record crop, stage, irrigation and soil pH','Context matters for nutrient availability.'],
   ['Refer to a qualified agronomist','Symptoms alone cannot confirm a deficiency.']],
  'No nutrient deficiency, application or amendment recommendation is calculated.'),
 22:calc('Agricultural job wage budget','Estimate a clearly stated wage commitment for a proposed farm job.',
  [whole('workers','Number of workers','people',6),whole('days','Work duration','days',5),num('wage','Daily wage per worker','₹/person/day',550)],'Illustrative gross wage budget','₹','Not an employment contract or hiring action. Check applicable minimum wages, working conditions and statutory obligations.'),
 23:calc('Simple interest illustration','Illustrate non-compounding interest on a hypothetical loan.',
  [num('principal','Illustrative principal','₹',100000),num('apr','Nominal annual interest','% per year',12,0,100),whole('months','Term','months',12)],'Illustrative simple interest','₹','Not an EMI/APR quote, financial advice, lender eligibility or insurance offer.'),
 24:calc('Export shipment weight','Estimate net cargo weight from cartons and weight per carton.',
  [whole('cartons','Number of cartons','cartons',1200),num('kg','Net kilograms per carton','kg/carton',5)],'Net shipment mass','kg','Not a customs declaration, trade permit or verified export requirement.'),
 25:plan('Farmer recognition editorial nomination','Prepare a consent-based community story.',
  [['Obtain documented subject consent','Consent can be withdrawn according to published policy.'],
   ['Verify achievement and supporting evidence','Do not inflate yields, savings or award status.'],
   ['Review privacy and minors in images','Avoid disclosing sensitive farm or household information.'],
   ['Disclose sponsors and selection criteria','Editorial review must remain distinguishable from promotions.']],
  'No award is granted and no story is published.')
};
export const standardToolIds=Object.freeze(Object.keys(moduleFieldTools).map(Number).sort((a,b)=>a-b));
export type ToolOutcome={valid:boolean;value:number|null;label:string;unit:string;notice:string;reason:string};
export function evaluateModuleCalculator(moduleId:number,inputs:Readonly<Record<string,number>>):ToolOutcome{
 const tool=moduleFieldTools[moduleId];
 if(!tool||tool.kind!=='calculator')return {valid:false,value:null,label:'Unavailable',unit:'',notice:'',reason:'No calculator exists for this module.'};
 for(const f of tool.fields){
  const n=inputs[f.key];
  if(typeof n!=='number'||!Number.isFinite(n)||n<f.min||n>f.max||(f.whole===true&&!Number.isInteger(n)))
   return {valid:false,value:null,label:tool.resultLabel,unit:tool.resultUnit,notice:tool.notice,reason:'Enter valid numbers in the stated units and ranges.'};
 }
 const n=(k:string)=>inputs[k];
 let result:number;
 switch(moduleId){
  case 1:result=n('rate')-n('cost')/n('qty');break;
  case 2:result=n('qty')*n('rate')-n('cost');break;
  case 3:result=Math.max(0,n('need')-n('available'));break;
  case 9:result=n('purchase')/n('years')+n('upkeep');break;
  case 10:result=n('hours')*n('rate')+n('other');break;
  case 12:result=(n('freight')+n('handling'))/n('qty');break;
  case 14:result=n('members')*n('perMember')*(1-n('lossPct')/100);break;
  case 17:result=n('qty')*n('days')*n('rate');break;
  case 20:result=n('qty')*(n('rateB')-n('rateA'))-(n('costB')-n('costA'));break;
  case 22:result=n('workers')*n('days')*n('wage');break;
  case 23:result=n('principal')*n('apr')*n('months')/1200;break;
  case 24:result=n('cartons')*n('kg');break;
  default:return {valid:false,value:null,label:tool.resultLabel,unit:tool.resultUnit,notice:tool.notice,reason:'Calculator not implemented.'};
 }
 if(!Number.isFinite(result)||Math.abs(result)>1_000_000_000_000)
  return {valid:false,value:null,label:tool.resultLabel,unit:tool.resultUnit,notice:tool.notice,reason:'Calculation exceeds the supported staging range.'};
 return {valid:true,value:Number(result.toFixed(tool.precision)),label:tool.resultLabel,unit:tool.resultUnit,notice:tool.notice,reason:''};
}
export function taskPlanCompletion(moduleId:number,completed:readonly number[]):{done:number;total:number;percent:number}{
 const tool=moduleFieldTools[moduleId];
 if(!tool||tool.kind!=='action-plan')return {done:0,total:0,percent:0};
 const selected=new Set(completed.filter(x=>Number.isInteger(x)&&x>=0&&x<tool.steps.length));
 return {done:selected.size,total:tool.steps.length,percent:Math.round(selected.size*100/tool.steps.length)};
}
