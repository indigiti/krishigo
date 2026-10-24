import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, ClipboardCheck, FileText, Info, Leaf, MapPin, Search, ShieldAlert, ShoppingBasket, Sprout, UserRound } from 'lucide-react';
import { type Listing } from '../data/demo';
import { dataSource } from '../services/dataSource';

type Enquiry = { id: string; listingId: number; quantity: string; destination: string; note: string; status: 'Draft — not sent' };
type ReviewState = 'Awaiting review'|'Needs more information'|'Declined in simulation';
type ReviewCase = {id: string; topic: string; subject: string; reason: string; outcome: ReviewState};
const initialCases: ReviewCase[] = [
  {id:'RV-101', topic:'Farmer verification',subject:'Example grower account',reason:'Identity and farm information need manual review',outcome:'Awaiting review'},
  {id:'RV-102', topic:'Listing verification',subject:'Example tomato harvest listing',reason:'Quantity and grade documentation should be checked',outcome:'Awaiting review'},
  {id:'RV-103', topic:'Community moderation',subject:'Sample crop-treatment response',reason:'Treatment claims require qualified expert verification',outcome:'Awaiting review'},
];

function Heading({eyebrow,title,subtitle}:{eyebrow:string;title:string;subtitle:string}){
  return <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> {eyebrow} <span className="demo-pill">SIMULATED</span></div><h1>{title}</h1><p>{subtitle}</p></div></div>;
}
function SafetyNote({children}:{children:string}) { return <p className="page-disclaimer"><Info size={16}/>{children}</p>; }

export function FarmerOnboarding(){
  const [step,setStep]=useState(0);
  const [role,setRole]=useState('Farmer');
  const [name,setName]=useState('');
  const [district,setDistrict]=useState('Pune');
  const [language,setLanguage]=useState('Marathi');
  const [crops,setCrops]=useState<string[]>(['Tomato']);
  const [checked,setChecked]=useState(false);
  const [complete,setComplete]=useState(false);
  const cropChoices=['Tomato','Onion','Soybean','Cotton','Wheat','Sugarcane'];
  const stages=['Identity','Farm profile','Review'];
  const canContinue = step===0 ? name.trim().length>=2 && name.trim().length<=70 && district.trim().length>=2 : step===1 ? crops.length>0 : checked;
  const next=(e:FormEvent)=>{e.preventDefault();if(!canContinue)return;if(step<2){setStep(s=>s+1);}else{setComplete(true);}};
  return <>
    <Heading eyebrow="KRISHIGO MEMBER EXPERIENCE" title="Welcome to your farming network." subtitle="Explore a practical onboarding flow before live accounts, identity checks and farmer verification are enabled."/>
    <div className="m3-steps" aria-label="Registration steps">{stages.map((s,i)=><span key={s} className={step===i?'active':''}><b>{i+1}</b>{s}</span>)}</div>
    <div className="identity-layout"><form className="surface-card identity-card" onSubmit={next}>
      {complete ? <><CheckCircle2 size={42} color="var(--accent)"/><h2>Onboarding preview complete</h2><p>You created a temporary profile summary, not a real account. Nothing was sent or retained.</p><button type="button" className="btn btn-primary" onClick={()=>{setComplete(false);setStep(0);setChecked(false);}}>Start again</button></> : <>
        <div className="section-eyebrow">STEP {step+1} OF 3 · DEMO ONLY</div>
        {step===0 && <><h2>Tell us about your role</h2><label>Account type<select value={role} onChange={e=>setRole(e.target.value)}>{['Farmer','Buyer','FPO coordinator','Agricultural service provider'].map(x=><option key={x}>{x}</option>)}</select></label><label>Display name<input required minLength={2} maxLength={70} value={name} onChange={e=>setName(e.target.value)} placeholder="Your display name"/></label><label>District<input required minLength={2} maxLength={80} value={district} onChange={e=>setDistrict(e.target.value)}/></label><label>Preferred language<select value={language} onChange={e=>setLanguage(e.target.value)}><option>Marathi</option><option>Hindi</option><option>English</option></select></label></>}
        {step===1 && <><h2>Choose your agricultural interests</h2><p>Select the crops you want KrishiGo to prioritize in your future dashboard.</p><div className="m3-check-grid">{cropChoices.map(c=><label key={c}><input type="checkbox" checked={crops.includes(c)} onChange={e=>setCrops(previous=>e.target.checked?[...previous,c]:previous.filter(x=>x!==c))}/>{c}</label>)}</div></>}
        {step===2 && <><h2>Review your preview</h2><dl className="m3-details"><div><dt>Profile</dt><dd>{name.trim()} · {role}</dd></div><div><dt>Location</dt><dd>{district.trim()}</dd></div><div><dt>Language</dt><dd>{language}</dd></div><div><dt>Crops</dt><dd>{crops.join(', ')}</dd></div></dl><label className="m3-checkbox"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/> I understand this is only a non-persistent design preview.</label></>}
        <div className="m3-actions">{step>0&&<button type="button" className="btn btn-soft" onClick={()=>setStep(s=>s-1)}><ArrowLeft size={17}/> Back</button>}<button type="submit" disabled={!canContinue} className="btn btn-primary">{step===2?'Finish demo':'Continue'} <ArrowRight size={16}/></button></div>
      </>}
    </form><aside className="surface-card identity-permissions"><span className="section-eyebrow">WHAT WILL BE VERIFIED LATER</span><h3>Trust before transactions.</h3><p>Production onboarding will require email or phone verification, backend-controlled roles, permissions, and separate business verification where relevant.</p><div className="permission-list"><div><UserRound size={18}/> Personal and business account permissions</div><div><Sprout size={18}/> Crop and farm profiles</div><div><BadgeCheck size={18}/> Seller verification before public trust badges</div><div><ShieldAlert size={18}/> Fraud reports, moderation and audit trails</div></div><div className="workspace-notice">Preview preferences remain only in current page memory; do not enter real identity documents or private contact details.</div></aside></div>
    <SafetyNote>Registration, verification, SMS/email, consent records and data storage are not active. This page must never be treated as actual farmer registration.</SafetyNote>
  </>;
}

export function TradeDesk({initialListingId}:{initialListingId?:number|null}){
 const [all,setAll]=useState<Listing[]>([]);const [selected,setSelected]=useState<number|null>(initialListingId??null);
 const [query,setQuery]=useState('');const [quantity,setQuantity]=useState('');const [destination,setDestination]=useState('');const [message,setMessage]=useState('');
 const [enquiries,setEnquiries]=useState<Enquiry[]>([]);const [notice,setNotice]=useState('');
 useEffect(()=>{let on=true;dataSource.listings().then(v=>{if(on)setAll(v);}).catch(()=>{if(on)setNotice('Sample listings could not load.');});return()=>{on=false;};},[]);
 const listing=all.find(l=>l.id===selected);
 const filtered=useMemo(()=>all.filter(l=>`${l.name} ${l.location} ${l.kind}`.toLowerCase().includes(query.toLowerCase())),[all,query]);
 const submit=(e:FormEvent)=>{e.preventDefault();if(!listing||!destination.trim()||!quantity.trim()||!message.trim())return;
    setEnquiries(prev=>[{id:`ENQ-${prev.length+1}`,listingId:listing.id,quantity:quantity.trim().slice(0,80),destination:destination.trim().slice(0,100),note:message.trim().slice(0,400),status:'Draft — not sent'},...prev]);setNotice('Draft enquiry added locally. No seller was contacted.');setQuantity('');setDestination('');setMessage('');};
 return <><Heading eyebrow="FARM TO MARKET WORKFLOWS" title="Explore a trade opportunity." subtitle="View structured supply details, then prepare a buyer enquiry without submitting or contacting anyone."/>
 <div className="m3-trade-layout"><aside className="surface-card m3-trade-list"><label className="workspace-search"><Search size={17}/><input aria-label="Search demo trade opportunities" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find crop or district"/></label><div className="section-eyebrow">ILLUSTRATIVE LISTINGS</div>{filtered.map(l=><button className={'m3-trade-option'+(selected===l.id?' active':'')} onClick={()=>{setSelected(l.id);setNotice('');}} key={l.id}><span>{l.icon}</span><span><strong>{l.name}</strong><small>{l.location} · {l.quantity}</small></span><ArrowRight size={16}/></button>)}{!filtered.length&&<p>No example listings match your search.</p>}</aside>
 <div className="m3-trade-content">{listing ? <><section className="surface-card m3-listing-details"><span className="section-eyebrow">DEMO LISTING #{listing.id} · NOT FOR TRADE</span><div className="m3-detail-hero"><div className={'product-image '+listing.tone}><span className="product-illustration">{listing.icon}</span></div><div><h2>{listing.name}</h2><p><MapPin size={15}/> {listing.location}</p><strong className="m3-price">{listing.price} <small>{listing.unit}</small></strong><p><ShoppingBasket size={15}/> {listing.quantity} · {listing.kind}</p></div></div><dl className="m3-details"><div><dt>Listed by</dt><dd>{listing.seller} (fictional)</dd></div><div><dt>Quality grade</dt><dd>Not assessed · supplier documentation needed</dd></div><div><dt>Trade process</dt><dd>Proposed enquiry → verification → agreement</dd></div><div><dt>Verification</dt><dd>Not verified in staging</dd></div></dl></section>
 <form className="surface-card identity-card" onSubmit={submit}><div className="section-eyebrow">PREPARE AN ENQUIRY · NO DELIVERY</div><h3>What would you like to ask?</h3><div className="form-grid"><label>Required quantity<input required value={quantity} maxLength={80} onChange={e=>setQuantity(e.target.value)} placeholder="e.g. 2 tonnes"/></label><label>Destination district<input required value={destination} maxLength={100} onChange={e=>setDestination(e.target.value)} placeholder="e.g. Pune"/></label></div><label>Enquiry note<textarea required value={message} maxLength={400} onChange={e=>setMessage(e.target.value)} rows={3} placeholder="Grade, packaging, transport or harvest availability questions"/></label><button className="btn btn-primary" type="submit"><FileText size={16}/> Save enquiry draft</button></form></>:<section className="surface-card m3-listing-details"><Leaf size={36}/><h3>Select an example listing</h3><p>Explore its details and prepare a mock trade enquiry.</p></section>}</div></div>
 {notice&&<div className="workspace-notice" role="status"><Info size={16}/>{notice}</div>}
 <section className="surface-card m3-draft-list"><div className="section-head"><div><div className="section-eyebrow">BUYER ENQUIRY WORKFLOW</div><h3>{enquiries.length} unsent draft{enquiries.length===1?'':'s'}</h3></div><ClipboardCheck size={22}/></div>{enquiries.length?enquiries.map(e=><article key={e.id} className="m3-enquiry"><strong>{e.id} · Listing #{e.listingId}</strong><p>{e.quantity} · {e.destination} · {e.note}</p><small>{e.status}</small><button type="button" onClick={()=>setEnquiries(prev=>prev.filter(x=>x.id!==e.id))}>Discard</button></article>):<p>No enquiries drafted yet. Sample records only.</p>}</section>
 <SafetyNote>Listings, prices, sellers and buyer requests are fictional. Saving an enquiry cannot notify another person or create an order. Enquiries disappear upon reload.</SafetyNote>
 </>;
}

export function ReviewDesk(){
 const [cases,setCases]=useState<ReviewCase[]>(initialCases);const [selected,setSelected]=useState('All');
 const update=(id:string,outcome:ReviewState)=>setCases(prev=>prev.map(c=>c.id===id?{...c,outcome}:c));
 const visible=cases.filter(c=>selected==='All'||c.outcome===selected);
 return <><Heading eyebrow="OPERATIONS · LOCAL SIMULATION" title="Verification & moderation desk." subtitle="Review sample quality checks and explore decision workflows without changing server data."/>
 <div className="workspace-metrics"><div><ClipboardCheck/><strong>{cases.length}</strong><span>Sample review items</span></div><div><ShieldAlert/><strong>{cases.filter(c=>c.outcome==='Awaiting review').length}</strong><span>Awaiting review</span></div><div><CheckCircle2/><strong>0</strong><span>Actual verifications completed</span></div></div>
 <div className="workspace-toolbar"><div className="category-pills workspace-pills">{['All','Awaiting review','Needs more information','Declined in simulation'].map(s=><button key={s} className={selected===s?'active':''} onClick={()=>setSelected(s)}>{s}</button>)}</div></div>
 <div className="m3-review-grid">{visible.map(c=><article className="surface-card m3-review-card" key={c.id}><div className="section-eyebrow">{c.id} · {c.topic}</div><h3>{c.subject}</h3><p>{c.reason}</p><strong className="scope-tag">{c.outcome}</strong><div className="m3-actions"><button type="button" className="btn btn-soft" onClick={()=>update(c.id,'Needs more information')}>Request details (demo)</button><button type="button" className="btn btn-soft" onClick={()=>update(c.id,'Declined in simulation')}>Flag (demo)</button><button type="button" className="btn btn-soft" onClick={()=>update(c.id,'Awaiting review')}>Reset</button></div></article>)}{!visible.length&&<div className="empty-message"><p>No matching review items.</p></div>}</div>
 <SafetyNote>This screen is a public UI simulation, not an authorized admin panel. It does not verify accounts, publish content, or store moderation decisions. Production review actions will require PHP role authorization and auditable persistence.</SafetyNote>
 </>;
}
