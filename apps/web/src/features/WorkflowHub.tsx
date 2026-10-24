import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Activity, ArrowRight, CheckCircle2, ClipboardList, FileHeart, Info, Leaf, MessageCircle, RotateCcw, Send, ShieldCheck, ShoppingBasket, Sprout, Truck, Users } from 'lucide-react';
import { WorkflowValidationError } from '../domain/workflow.ts';
import type { WorkflowAction, WorkflowCategory } from '../domain/workflow.ts';
import { demoWorkflowRepository, useDemoWorkflows } from '../infrastructure/memoryWorkflowStore.ts';

type Tab = 'trade'|'community'|'plant'|'services'|'activity';
const tabs: {id:Tab;label:string;description:string;icon:typeof Leaf}[] = [
  {id:'trade',label:'Farm to market',description:'Lots → review → buyer needs → unsent enquiry',icon:ShoppingBasket},
  {id:'community',label:'Farmer Circle',description:'Discuss → flag for sample moderation',icon:Users},
  {id:'plant',label:'Plant care',description:'Symptoms → agronomist referral draft',icon:FileHeart},
  {id:'services',label:'Services',description:'Find a service → prepare a local request',icon:Truck},
  {id:'activity',label:'Activity',description:'Trace demo workflow events',icon:Activity}
];
const value=(form:FormData,key:string)=>String(form.get(key)||'');
const num=(form:FormData,key:string)=>Number(value(form,key));
const Panel=({title,eyebrow,children}:{title:string;eyebrow:string;children:ReactNode})=><section className="surface-card workflow-panel"><span className="section-eyebrow">{eyebrow}</span><h3>{title}</h3>{children}</section>;

export default function WorkflowHub(){
  const state=useDemoWorkflows();
  const [tab,setTab]=useState<Tab>('trade');
  const [feedback,setFeedback]=useState('');
  const [lotChoice,setLotChoice]=useState('');
  const [needChoice,setNeedChoice]=useState('');
  const lot=state.lots.find(x=>String(x.id)===lotChoice);
  const need=state.needs.find(x=>String(x.id)===needChoice);
  const compatible=useMemo(()=>state.lots.filter(x=>x.status==='sample_reviewed' && state.needs.some(n=>n.crop.toLowerCase()===x.crop.toLowerCase())),[state.lots,state.needs]);
  const run=(action:WorkflowAction)=>{
    try{demoWorkflowRepository.execute(action);setFeedback('Demo workflow updated locally. Nothing was transmitted or published.');return true;}
    catch(error){setFeedback(error instanceof WorkflowValidationError?error.message:'Unable to update this demo workflow.');return false;}
  };
  const submit=(e:FormEvent<HTMLFormElement>,builder:(data:FormData)=>WorkflowAction)=>{
    e.preventDefault();const form=e.currentTarget;
    if(run(builder(new FormData(form))))form.reset();
  };
  return <div className="workflow-shell">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> CONNECTED AGRICULTURE WORKFLOWS <span className="demo-pill">DEMO ONLY</span></div><h1>One farm. Connected workflows.</h1><p>Move from a produce lot to a buyer enquiry, document crop concerns, and manage community or service requests in one lightweight workspace.</p></div></div>
    <div className="workflow-warning" role="note"><Info size={19}/><div><strong>Local workflow simulation, not a live service.</strong> No accounts, seller contacts, payments, crop diagnosis, expert referrals or published posts. Data stays in memory and disappears on reload.</div></div>
    <div className="workflow-stats" aria-label="Demo workflow totals">
      {[['Produce lots',state.lots.length],['Buyer needs',state.needs.length],['Unsent enquiries',state.enquiries.length],['Crop cases',state.plantCases.length],['Module drafts',state.moduleDrafts.length]].map(([name,count])=><div className="surface-card" key={name}><strong>{count}</strong><small>{name}</small></div>)}
    </div>
    <nav className="workflow-tabs" aria-label="Workflow sections">{tabs.map(t=><button type="button" key={t.id} aria-current={tab===t.id?'page':undefined} className={tab===t.id?'active':''} onClick={()=>{setTab(t.id);setFeedback('');}}><t.icon size={18}/><span>{t.label}</span></button>)}</nav>
    {feedback&&<p role="status" className="workspace-notice"><CheckCircle2 size={17}/>{feedback}</p>}
    {tab==='trade'&&<>
      <div className="workflow-grid">
        <Panel eyebrow="01 · FARMER" title="Create a produce lot">
          <p className="workflow-copy">Start with a draft. Request sample review before matching it to a buyer.</p>
          <form onSubmit={e=>submit(e,f=>({type:'lot/create',crop:value(f,'crop'),district:value(f,'district'),quantity:num(f,'quantity'),rate:num(f,'rate')}))}>
            <label>Crop<input name="crop" required maxLength={140} placeholder="Tomato"/></label>
            <label>District<input name="district" required maxLength={140} placeholder="Pune"/></label>
            <div className="workflow-two"><label>Quantity (quintals)<input name="quantity" type="number" min="0.01" max="1000000" step="0.01" required/></label><label>Rate (₹/quintal)<input name="rate" type="number" min="0.01" max="1000000" step="0.01" required/></label></div>
            <button className="btn btn-primary" type="submit">Create local lot <ArrowRight size={16}/></button>
          </form>
        </Panel>
        <Panel eyebrow="02 · BUYER" title="Create a buying requirement">
          <p className="workflow-copy">Use the same crop name as the seller lot to explore matching.</p>
          <form onSubmit={e=>submit(e,f=>({type:'need/create',crop:value(f,'crop'),district:value(f,'district'),quantity:num(f,'quantity')}))}>
            <label>Crop<input name="crop" required maxLength={140} placeholder="Tomato"/></label>
            <label>Destination district<input name="district" required maxLength={140} placeholder="Pune"/></label>
            <label>Quantity required (quintals)<input name="quantity" type="number" min="0.01" max="1000000" step="0.01" required/></label>
            <button className="btn btn-primary" type="submit">Create buyer draft <ArrowRight size={16}/></button>
          </form>
        </Panel>
      </div>
      <div className="workflow-grid">
        <Panel eyebrow="03 · SAMPLE REVIEW" title="Review produce lots">
          {state.lots.length===0?<p className="workflow-empty">Create a lot to begin the review chain.</p>:state.lots.map(item=><article className="workflow-record" key={item.id}><div><strong>{item.crop} · {item.quantity} q</strong><small>{item.district} · ₹{item.rate.toLocaleString('en-IN')}/q</small><small>Status: {item.status.replaceAll('_',' ')} (simulation)</small></div>{item.status==='draft'?<button onClick={()=>run({type:'lot/request-review',id:item.id})}>Request demo review</button>:item.status==='review_requested'?<button onClick={()=>run({type:'lot/sample-review',id:item.id})}>Mark reviewed (demo)</button>:<span className="workflow-done">Sample reviewed</span>}</article>)}
        </Panel>
        <Panel eyebrow="04 · NEGOTIATION" title="Prepare an unsent enquiry">
          <p className="workflow-copy">A reviewed sample lot and a same-crop buyer requirement are required. Nothing is delivered.</p>
          <form onSubmit={e=>submit(e,f=>({type:'enquiry/draft',lotId:Number(value(f,'lot')),needId:Number(value(f,'need')),quantity:num(f,'quantity')}))}>
            <label>Sample-reviewed produce lot<select required name="lot" value={lotChoice} onChange={e=>setLotChoice(e.target.value)}><option value="">Choose a lot</option>{state.lots.filter(x=>x.status==='sample_reviewed').map(x=><option key={x.id} value={x.id}>{x.crop} — {x.quantity} q · {x.district}</option>)}</select></label>
            <label>Buyer requirement<select required name="need" value={needChoice} onChange={e=>setNeedChoice(e.target.value)}><option value="">Choose a requirement</option>{state.needs.map(x=><option key={x.id} value={x.id}>{x.crop} — {x.quantity} q · {x.district}</option>)}</select></label>
            {lot&&need&&<p className="workflow-match">{lot.crop.toLowerCase()===need.crop.toLowerCase()?'Crop names match. Check quantities before drafting.':'These crops differ; matching is required.'}</p>}
            <label>Enquiry quantity (quintals)<input name="quantity" type="number" min="0.01" max="1000000" step="0.01" required/></label>
            <button className="btn btn-primary" type="submit" disabled={!compatible.length}>Prepare unsent enquiry <Send size={16}/></button>
          </form>
          {state.enquiries.map(x=><div className="workflow-record" key={x.id}><span>Enquiry #{x.id}: {x.quantity} quintals</span><strong>Unsent · draft only</strong></div>)}
        </Panel>
      </div>
    </>}
    {tab==='community'&&<div className="workflow-grid"><Panel eyebrow="CIRCLE · NEW DISCUSSION" title="Draft a farmer question"><form onSubmit={e=>submit(e,f=>({type:'discussion/create',title:value(f,'title'),topic:value(f,'topic')}))}><label>Topic<input name="topic" maxLength={70} required placeholder="Onion growers"/></label><label>Question<input name="title" maxLength={180} required placeholder="Which field observations should I record?"/></label><button type="submit" className="btn btn-primary">Save draft locally <MessageCircle size={16}/></button></form></Panel><Panel eyebrow="COMMUNITY · MODERATION" title="Review discussions">{state.discussions.length===0?<p className="workflow-empty">No drafts yet.</p>:state.discussions.map(item=><article className="workflow-record" key={item.id}><div><strong>{item.title}</strong><small>{item.topic} · {item.status.replaceAll('_',' ')}</small></div>{item.status==='draft'?<button onClick={()=>run({type:'discussion/flag',id:item.id})}>Flag for demo review</button>:<span className="workflow-done">Flagged locally</span>}</article>)}</Panel></div>}
    {tab==='plant'&&<div className="workflow-grid"><Panel eyebrow="PLANT CARE · FIELD OBSERVATION" title="Document a crop concern"><p className="workflow-copy">This records symptoms only. It cannot identify diseases or recommend chemicals.</p><form onSubmit={e=>submit(e,f=>({type:'plant/create',crop:value(f,'crop'),growthStage:value(f,'stage'),symptoms:value(f,'symptoms')}))}><label>Crop<input name="crop" maxLength={140} required placeholder="Soybean"/></label><label>Growth stage<select name="stage"><option>Vegetative</option><option>Flowering</option><option>Fruiting</option><option>Seedling</option><option>Harvest</option></select></label><label>Observed symptoms<textarea rows={4} required name="symptoms" maxLength={600} placeholder="Describe visible symptoms and duration; avoid personal information"/></label><button type="submit" className="btn btn-primary">Save observation <Leaf size={16}/></button></form></Panel><Panel eyebrow="PLANT CARE · REVIEW" title="Expert referral preparation">{state.plantCases.length===0?<p className="workflow-empty">Document symptoms to prepare a referral draft.</p>:state.plantCases.map(item=><article key={item.id} className="workflow-record"><div><strong>{item.crop} · {item.growthStage}</strong><small>{item.symptoms}</small><small>{item.status.replaceAll('_',' ')}</small></div>{item.status==='documented'?<button onClick={()=>run({type:'plant/referral-draft',id:item.id})}>Prepare expert referral</button>:<span className="workflow-done">Draft prepared</span>}</article>)}<p className="workflow-copy">No AI model runs here; no expert is contacted.</p></Panel></div>}
    {tab==='services'&&<div className="workflow-grid"><Panel eyebrow="AGRI-SERVICES · LOCAL REQUEST" title="Prepare a service requirement"><form onSubmit={e=>submit(e,f=>({type:'service/create',category:value(f,'category'),district:value(f,'district'),detail:value(f,'detail')}))}><label>Service category<select name="category"><option>Tractor rental</option><option>Farm transport</option><option>Cold storage</option><option>Soil testing</option><option>Equipment repair</option><option>Farm labour</option></select></label><label>District<input name="district" required maxLength={90} placeholder="Satara"/></label><label>Work description<textarea name="detail" required maxLength={300} rows={3} placeholder="Describe the required service and timing"/></label><button type="submit" className="btn btn-primary">Save local request <ClipboardList size={16}/></button></form></Panel><Panel eyebrow="SERVICE REQUESTS · LOCAL ONLY" title="Your demo requests">{state.serviceRequests.length===0?<p className="workflow-empty">No service requests created yet.</p>:state.serviceRequests.map(x=><article className="workflow-record" key={x.id}><div><strong>{x.category} · {x.district}</strong><small>{x.detail}</small></div><span className="workflow-done">Draft only</span></article>)}</Panel></div>}
    {tab==='activity'&&<Panel eyebrow="AUDIT-STYLE PREVIEW · DEVICE MEMORY" title="Actions across your modules"><p className="workflow-copy">This is a local activity trail, not an authoritative audit record.</p>{state.activity.length===0?<p className="workflow-empty">Your demo events will appear here.</p>:state.activity.map(x=><article key={x.id} className="workflow-record"><strong>#{x.id} · {x.category}</strong><span>{x.detail}</span></article>)}<button type="button" className="btn btn-soft workflow-reset" onClick={()=>{run({type:'reset'});setLotChoice('');setNeedChoice('');}}><RotateCcw size={17}/> Clear all temporary workflow data</button></Panel>}
    <footer className="workflow-tail"><ShieldCheck size={18}/> Uses a domain → application → memory repository → React presentation structure. Workflow data resets on refresh. Production PHP API integration will require separate authentication, verification, persistence, queues and security acceptance.</footer>
  </div>;
}
