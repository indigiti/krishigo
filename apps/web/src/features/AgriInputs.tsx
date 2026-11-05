import { lazy, Suspense, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Beaker, BookOpenCheck, CalendarClock, CheckCircle2, ClipboardList, FileImage, FlaskConical, Info, Leaf, MapPin, Microscope, PackageSearch, Scale, Search, ShieldAlert, Sprout, Stethoscope, Trash2, Warehouse, Wheat } from 'lucide-react';
const ConnectedAgriInputs = lazy(() => import('./ConnectedAgriInputs'));
import { classifyBatchDate, filterInputReferences, inputCategories, inputFeatures, inputReferences, safeNutrientEquivalent, type InputFeature } from './agriInputsModel';

type JournalRecord={id:number;crop:string;product:string;date:string;notes:string};
type BatchRecord={id:number;name:string;batch:string;expiry:string};
type RequestRecord={id:number;subject:string;detail:string};
const featureIcons:Record<InputFeature['id'],typeof Leaf>={
 crop:Sprout,pests:Microscope,nutrients:Beaker,compare:Scale,label:FileImage,soil:FlaskConical,
 planner:Wheat,history:ClipboardList,compatibility:ShieldAlert,prices:Warehouse,batches:CalendarClock,expert:Stethoscope
};
const cropOptions=['Tomato','Onion','Sugarcane','Soybean','Grapes','Cotton','Pomegranate','Other'];
const issueInformation:Record<string,string>={
 'Leaf spots':'Leaf spots can reflect fungal, bacterial, nutritional or environmental causes. Examine distribution, crop stage, weather and laboratory evidence before selecting an intervention.',
 'Leaf yellowing':'Yellowing can result from nutrient availability, root damage, irrigation, pests or natural ageing. A photograph alone is not a nutrient diagnosis.',
 'Feeding damage':'Chewed tissue may indicate insects or other causes. Identify the organism and crop stage before reviewing any registered control options.',
 'Wilting':'Wilting can reflect water stress, root disease or vascular disorders. Severe or rapidly spreading cases require qualified field assessment.'
};
const nutrientInformation:Record<string,string>={
 Zinc:'Potentially associated with abnormal growth or chlorosis, but species and soil conditions matter. Confirm through a lab and local agronomist.',
 Iron:'Interveinal chlorosis may have several causes including root-zone pH. Identify the crop and confirm measurements first.',
 Boron:'Both deficiency and excess can damage crops. Never infer a boron treatment amount from photographs.',
 Manganese:'Symptoms overlap with several nutrient and disease conditions. Tissue and soil evidence are essential.',
 Magnesium:'Symptoms can overlap with nitrogen or potassium issues and environmental stress. Compare crop stage and laboratory analysis.',
 Calcium:'Root health, water movement and crop stage can influence calcium-related symptoms. Do not assume a fertilizer remedy.'
};
function Note({children}:{children:ReactNode}){return <p className="agri-note"><Info size={16}/>{children}</p>;}
function Panel({title,eyebrow,children}:{title:string;eyebrow?:string;children:ReactNode}){
 return <section className="surface-card agri-panel"><div className="section-eyebrow">{eyebrow||'STAGING · GUIDED PREVIEW'}</div><h2>{title}</h2>{children}</section>;
}
function Row({title,description,children}:{title:string;description?:string;children?:ReactNode}){
 return <article className="agri-record"><div><strong>{title}</strong>{description&&<p>{description}</p>}</div>{children}</article>;
}
export default function AgriInputs({onBack}:{onBack?:()=>void}){
 const [active,setActive]=useState<InputFeature['id']>('crop');
 const [crop,setCrop]=useState('Tomato');
 const [category,setCategory]=useState('All');
 const [search,setSearch]=useState('');
 const [left,setLeft]=useState(inputReferences[0].id);
 const [right,setRight]=useState(inputReferences[1].id);
 const [issue,setIssue]=useState('Leaf spots');
 const [nutrient,setNutrient]=useState('Zinc');
 const [labelUrl,setLabelUrl]=useState<string|null>(null);
 const [labelName,setLabelName]=useState('');
 const [labelRegistration,setLabelRegistration]=useState('');
 const [soilPh,setSoilPh]=useState('');
 const [soilObservations,setSoilObservations]=useState('');
 const [nutrientTarget,setNutrientTarget]=useState('');
 const [nutrientPercent,setNutrientPercent]=useState('19');
 const [activity,setActivity]=useState<JournalRecord[]>([]);
 const [batches,setBatches]=useState<BatchRecord[]>([]);
 const [requests,setRequests]=useState<RequestRecord[]>([]);
 const [notice,setNotice]=useState('');
 const today=new Date().toISOString().slice(0,10);
 const visible=useMemo(()=>filterInputReferences(search,category),[search,category]);
 const selectedFeature=inputFeatures.find(x=>x.id===active)!;
 const productA=inputReferences.find(x=>x.id===left)!;
 const productB=inputReferences.find(x=>x.id===right)!;
 const equivalent=safeNutrientEquivalent(Number(nutrientTarget),Number(nutrientPercent));
 useEffect(()=>()=>{if(labelUrl)URL.revokeObjectURL(labelUrl);},[labelUrl]);
 const pickFeature=(id:InputFeature['id'])=>{setActive(id);setNotice('');};
 const addRequest=(event:FormEvent<HTMLFormElement>,kind:'supplier'|'expert')=>{
  event.preventDefault();
  const values=new FormData(event.currentTarget);
  const subject=String(values.get('subject')||'').trim().slice(0,110);
  const detail=String(values.get('detail')||'').trim().slice(0,500);
  if(!subject||detail.length<5)return;
  setRequests(x=>[{id:Date.now(),subject:(kind==='supplier'?'Supplier enquiry: ':'Expert review: ')+subject,detail},...x]);
  event.currentTarget.reset();
  setNotice('Saved within this browser session only. No supplier or expert has been contacted.');
 };
 const chooseLabel=(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){
   setNotice('Select a JPEG, PNG or WebP image of 10 MB or less.');event.target.value='';return;
  }
  setLabelUrl(URL.createObjectURL(file));
  setNotice('Image preview ready on this device. OCR and registration verification are not connected.');
 };
 const saveHistory=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();const f=new FormData(e.currentTarget);
  const product=String(f.get('product')||'').trim().slice(0,100),notes=String(f.get('notes')||'').trim().slice(0,450);
  const date=String(f.get('date')||'');
  if(!product||!date||date>today)return;
  setActivity(v=>[{id:Date.now(),crop:String(f.get('crop')||crop),product,date,notes},...v]);
  e.currentTarget.reset();setNotice('Local activity record saved for this session only.');
 };
 const saveBatch=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();const f=new FormData(e.currentTarget);
  const name=String(f.get('name')||'').trim().slice(0,100),batch=String(f.get('batch')||'').trim().slice(0,80),expiry=String(f.get('expiry')||'');
  if(!name||!batch||classifyBatchDate(expiry,today)==='Invalid date')return;
  setBatches(v=>[{id:Date.now(),name,batch,expiry},...v]);e.currentTarget.reset();setNotice('Batch recorded locally. No recall database is connected.');
 };
 return <div className="agri-inputs">
  {onBack&&<button type="button" className="studio-back" onClick={onBack}><ArrowLeft size={18}/> All modules</button>}
  <header className="agri-hero"><div>
   <div className="section-eyebrow">MODULE 11 · AGRICULTURAL INPUTS INTELLIGENCE</div>
   <h1>Better inputs. Better-informed decisions.</h1>
   <p>Explore crop protection, water-soluble fertilizers, micronutrients and field records with evidence-first safeguards.</p>
   <div className="agri-hero-tags"><span>12 guided workspaces</span><span>Staging preview</span><span>English · localization planned</span></div>
  </div><div className="agri-hero-icon" aria-hidden="true"><Leaf size={56}/></div></header>
  <Note>No real registered products, live dealers, pesticide prescriptions, verified crop-use approvals, OCR, AI diagnoses, lab reference ranges or outbound requests are connected. Example records are illustrative only; drafts disappear on reload.</Note>
  {import.meta.env.VITE_JSON_WORKFLOWS_MODE==='api'&&<Suspense fallback={<p role="status">Loading protected input workflows…</p>}><ConnectedAgriInputs/></Suspense>}
  <div className="agri-tool-grid" role="group" aria-label="Agricultural inputs tools">{inputFeatures.map(feature=>{
   const Icon=featureIcons[feature.id];
   return <button key={feature.id} type="button" className={'agri-tool'+(active===feature.id?' selected':'')} aria-pressed={active===feature.id} onClick={()=>pickFeature(feature.id)}>
    <span className="agri-tool-icon"><Icon size={21}/></span><strong>{feature.title}</strong><small>{feature.summary}</small><span className="agri-tool-meta">{feature.state}</span>
   </button>;
  })}</div>
  <div className="agri-current-heading"><div><span className="section-eyebrow">SELECTED WORKSPACE</span><h2>{selectedFeature.title}</h2></div><span className="agri-status">Not production verified</span></div>
  {notice&&<div className="workspace-notice" role="status"><CheckCircle2 size={18}/>{notice}</div>}
  {active==='crop'&&<Panel title="Crop-wise input discovery" eyebrow="SEARCH · REFERENCE CATEGORIES">
    <p>Explore educational product categories. Choosing a crop does not imply that any displayed product is approved or suitable for that crop.</p>
    <div className="agri-fields"><label>Crop<select value={crop} onChange={e=>setCrop(e.target.value)}>{cropOptions.map(x=><option key={x}>{x}</option>)}</select></label>
     <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{inputCategories.map(x=><option key={x}>{x}</option>)}</select></label>
     <label>Search<input aria-label="Search agricultural input references" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ingredient, nutrient or category"/></label></div>
    <Note>{crop} crop-use approvals: no verified records loaded. An official label review is required before agricultural use.</Note>
    <div className="agri-results">{visible.map(x=><Row key={x.id} title={x.title} description={x.description}><span className="agri-tag">{x.category} · {x.evidence}</span><small>{x.composition}</small></Row>)}{!visible.length&&<p>No matching example records.</p>}</div>
   </Panel>}
  {active==='pests'&&<Panel title="Pest and disease information"><p>Choose an observation pattern for a non-diagnostic checklist. Identifying a registered treatment requires a qualified diagnosis and an approved label.</p>
   <label className="agri-single-field">Observation pattern<select value={issue} onChange={e=>setIssue(e.target.value)}>{Object.keys(issueInformation).map(x=><option key={x}>{x}</option>)}</select></label>
   <Row title={'Observation: '+issue} description={issueInformation[issue]}/>
   <Note>Capture affected crop, growth stage, onset, weather, irrigation and photographs. This does not identify a disease or recommend a chemical.</Note>
  </Panel>}
  {active==='nutrients'&&<Panel title="Nutrient deficiency reference"><p>Visual cues overlap between deficiencies, pests and environmental stress. This educational library does not diagnose nutrient status.</p>
   <label className="agri-single-field">Nutrient<select value={nutrient} onChange={e=>setNutrient(e.target.value)}>{Object.keys(nutrientInformation).map(x=><option key={x}>{x}</option>)}</select></label>
   <Row title={nutrient+' · evidence checklist'} description={nutrientInformation[nutrient]}/>
   <Note>Review crop type, soil pH, sampling method, test date, laboratory reference ranges and trained specialist advice.</Note>
  </Panel>}
  {active==='compare'&&<Panel title="Compare reference records"><div className="agri-fields two"><label>First reference<select value={left} onChange={e=>setLeft(e.target.value)}>{inputReferences.map(x=><option value={x.id} key={x.id}>{x.title}</option>)}</select></label>
   <label>Second reference<select value={right} onChange={e=>setRight(e.target.value)}>{inputReferences.map(x=><option value={x.id} key={x.id}>{x.title}</option>)}</select></label></div>
   <div className="agri-table-wrap"><table className="agri-table"><thead><tr><th>Attribute</th><th>{productA.title}</th><th>{productB.title}</th></tr></thead><tbody>{(['category','composition','cropScope','evidence'] as const).map(k=><tr key={k}><th>{k==='cropScope'?'Crop / use evidence':k==='evidence'?'Verification':k==='composition'?'Composition':'Category'}</th><td>{productA[k]}</td><td>{productB[k]}</td></tr>)}</tbody></table></div>
   <Note>Comparison is of example descriptions, not product equivalence or substitution suitability.</Note>
  </Panel>}
  {active==='label'&&<Panel title="Label scanner · assisted intake"><p>Choose a label photograph for a private on-device preview. Actual OCR, active-ingredient extraction and official registration matching require a separate verified processing service.</p>
   <div className="agri-fields two"><label>Label image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseLabel}/></label><label>Product name (manual transcription)<input value={labelName} onChange={e=>setLabelName(e.target.value.slice(0,120))} placeholder="Read from printed label"/></label>
    <label>Registration / license text (manual)<input value={labelRegistration} onChange={e=>setLabelRegistration(e.target.value.slice(0,120))} placeholder="Transcribe exactly as printed"/></label></div>
   {labelUrl&&<img className="agri-label-preview" src={labelUrl} alt="Locally selected product label preview"/>}
   <Row title={labelName||'No product name entered'} description={'Registration text: '+(labelRegistration||'not entered')}/>
   <Note>Not verified. Do not treat transcribed text or the image preview as proof of authenticity or approved use. No image is uploaded.</Note>
  </Panel>}
  {active==='soil'&&<Panel title="Soil test interpreter · report intake"><p>Record lab measurements with the correct units and test method. No region-, crop- or laboratory-specific nutrient thresholds are connected.</p>
   <div className="agri-fields two"><label>Lab-reported soil pH (if available)<input type="number" step="0.1" min="0" max="14" value={soilPh} onChange={e=>setSoilPh(e.target.value)}/></label>
    <label>Other report values and units<textarea rows={3} maxLength={450} value={soilObservations} onChange={e=>setSoilObservations(e.target.value)} placeholder="e.g. result, unit, test method and sample date"/></label></div>
   <Row title={soilPh!==''&&Number(soilPh)>=0&&Number(soilPh)<=14?'Recorded pH: '+soilPh:'No valid pH entered'} description={soilObservations||'Add laboratory values with units before requesting interpretation.'}/>
   <Note>This is a transcription preview, not a deficiency interpretation or amendment recommendation. Consult a qualified agronomist and the testing laboratory's reference ranges.</Note>
  </Panel>}
  {active==='planner'&&<Panel title="Nutrient-equivalent calculator"><p>For reviewing an expert-provided nutrient target only: calculate how much of an example fertilizer grade mathematically contains that amount of one selected nutrient. This does not calculate field application rates.</p>
   <div className="agri-fields two"><label>Target amount of one nutrient (kg)<input type="number" min="0.001" step="any" value={nutrientTarget} onChange={e=>setNutrientTarget(e.target.value)} placeholder="Provided by a qualified agronomist"/></label>
    <label>That nutrient in product (%)<input type="number" min="0.01" max="100" step="any" value={nutrientPercent} onChange={e=>setNutrientPercent(e.target.value)}/></label></div>
   <div className="agri-calculation"><Scale size={26}/><div><small>Mathematical product equivalent</small><strong>{nutrientTarget!==''&&equivalent!==null?equivalent.toLocaleString('en-IN',{maximumFractionDigits:2})+' kg':'Enter valid values'}</strong></div></div>
   <Note>Formula: nutrient target ÷ (percentage ÷ 100). For NPK, nitrogen is expressed as N, phosphorus commonly as P₂O₅ and potassium as K₂O. Products supply other nutrients too. Never infer crop recommendations, mixing, irrigation or dose from this calculation.</Note>
  </Panel>}
  {active==='history'&&<Panel title="Application history · local records"><form className="agri-fields agri-form" onSubmit={saveHistory}><label>Crop<select name="crop" defaultValue={crop}>{cropOptions.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Product or activity<input name="product" maxLength={100} required placeholder="Name exactly as used"/></label><label>Date<input name="date" type="date" max={today} defaultValue={today} required/></label>
   <label>Details / amount and unit<textarea name="notes" rows={2} maxLength={450} placeholder="Document what actually happened, not a suggested treatment"/></label><button className="btn btn-primary" type="submit">Save temporary record</button></form>
   {activity.length===0?<p>No session records yet.</p>:activity.map(x=><Row key={x.id} title={x.product+' · '+x.crop} description={x.date+' · '+x.notes}><button type="button" className="agri-small-action" onClick={()=>setActivity(v=>v.filter(a=>a.id!==x.id))} aria-label={'Remove '+x.product}><Trash2 size={16}/></button></Row>)}
   <Note>Entries are not persisted and will be lost on reload; no automatic safety compliance is certified.</Note>
  </Panel>}
  {active==='compatibility'&&<Panel title="Compatibility evidence checker"><p>Unverified mixtures can damage crops or create human exposure risks. Never infer tank-mix compatibility from similar labels or ingredients.</p>
   <div className="agri-fields two"><label>Input A<select value={left} onChange={e=>setLeft(e.target.value)}>{inputReferences.map(x=><option value={x.id} key={x.id}>{x.title}</option>)}</select></label>
   <label>Input B<select value={right} onChange={e=>setRight(e.target.value)}>{inputReferences.map(x=><option value={x.id} key={x.id}>{x.title}</option>)}</select></label></div>
   <div className="agri-evidence"><ShieldAlert size={22}/><div><strong>Compatibility unknown — not approved</strong><p>No verified manufacturer compatibility documents have been connected for these references. Do not mix or apply on this result.</p></div></div>
  </Panel>}
  {active==='prices'&&<Panel title="Input price and availability"><p>No real seller licences, stock, prices or retail offers are connected. Capture a private enquiry for future verified dealer discovery.</p>
   <form className="agri-fields agri-form" onSubmit={e=>addRequest(e,'supplier')}><label>Input or grade<input name="subject" maxLength={110} required placeholder="e.g. Water-soluble NPK grade"/></label>
   <label>District / quantity / requested pack size<textarea name="detail" maxLength={500} minLength={5} required placeholder="Describe requirements without personal contact details"/></label><button className="btn btn-primary" type="submit">Save unsent enquiry</button></form>
   {requests.filter(x=>x.subject.startsWith('Supplier')).map(x=><Row key={x.id} title={x.subject} description={x.detail}/>)}
   <Note>Dealer pricing and stock must be provided by separately verified, authorized sellers and timestamped before publishing.</Note>
  </Panel>}
  {active==='batches'&&<Panel title="Batch and expiry tracking"><form className="agri-fields agri-form" onSubmit={saveBatch}>
   <label>Product or grade<input name="name" maxLength={100} required/></label><label>Batch / lot identifier<input name="batch" maxLength={80} required/></label>
   <label>Label expiry date<input name="expiry" type="date" required/></label><button className="btn btn-primary" type="submit">Track locally</button></form>
   {batches.length===0?<p>No batches tracked in this session.</p>:batches.map(x=><Row key={x.id} title={x.name+' · '+x.batch} description={'Expiry: '+x.expiry+' · '+classifyBatchDate(x.expiry,today)}><button type="button" className="agri-small-action" onClick={()=>setBatches(v=>v.filter(a=>a.id!==x.id))} aria-label={'Remove batch '+x.batch}><Trash2 size={16}/></button></Row>)}
   <Note>Expiry is based on your typed label date only. No manufacturer recall or regulatory alert feed is connected. Never assume an unexpired product is safe or authorized.</Note>
  </Panel>}
  {active==='expert'&&<Panel title="Expert consultation · request draft"><p>Prepare the context an agronomist would need. No real consultation, diagnosis, private upload or request delivery is active.</p>
   <form className="agri-fields agri-form" onSubmit={e=>addRequest(e,'expert')}><label>Crop and observed issue<input name="subject" maxLength={110} required placeholder="e.g. Grape leaves with spots"/></label>
   <label>Context and questions<textarea name="detail" rows={4} minLength={5} maxLength={500} required placeholder="Crop stage, symptoms, duration, recent weather and tests"/></label><button className="btn btn-primary" type="submit">Save unsent review request</button></form>
   {requests.filter(x=>x.subject.startsWith('Expert')).map(x=><Row key={x.id} title={x.subject} description={x.detail}/>)}
   <Note>For acute exposure or poisoning, contact local emergency medical services; this app does not provide emergency medical assistance.</Note>
  </Panel>}
  <footer className="agri-module-footer"><BookOpenCheck size={18}/><span>Publication gate: official label evidence, seller permissions, safety review, source date, moderation and audit trail. No treatment instructions are generated in this preview.</span><MapPin size={18}/></footer>
 </div>;
}
