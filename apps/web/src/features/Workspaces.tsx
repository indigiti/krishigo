import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, ClipboardList, Filter, Info, Leaf, MapPin, Plus, Search, ShieldCheck, SlidersHorizontal, Sprout, Users } from 'lucide-react';
import { type BuyerRequirement, type ContentEntry, type FarmService, type ScopeModule } from '../data/expanded';
import { dataSource } from '../services/dataSource';
import { ProfileWorkspace, CasesWorkspace } from './IdentityCases';
import {useModuleFlags} from '../infrastructure/modulePreferences';
import {isEnabled} from '../domain/moduleRegistry';
import ModuleControlPanel from './ModuleControlPanel';
import { ModuleStudio } from './ModuleStudio';

type Workspace = 'Buyers' | 'Services' | 'Discover' | 'Crop Journal' | 'Admin' | 'My Profile' | 'Plant Cases';
type JournalEntry = { id: number; crop: string; observation: string; date: string };
const DemoNote = ({children}: {children: ReactNode}) => <p className="page-disclaimer"><Info size={15}/> {children}</p>;
const SectionTitle = ({eyebrow,title,copy}: {eyebrow:string;title:string;copy:string}) => <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> {eyebrow} <span className="demo-pill"><span/> DEMO DATA</span></div><h1>{title}</h1><p>{copy}</p></div></div>;
const validation = (value: string) => value.trim().slice(0, 150);

function BuyerBoard() {
  const [requirements,setRequirements] = useState<BuyerRequirement[]>([]);
  const [filter,setFilter] = useState('');
  const [showForm,setShowForm] = useState(false);
  const [notice,setNotice] = useState('');
  useEffect(() => { let active=true; dataSource.buyerRequirements().then(d=> { if(active) setRequirements(d); }).catch(()=>setNotice('Sample requirements unavailable.')); return()=>{active=false;}; },[]);
  const create=(e: FormEvent<HTMLFormElement>)=>{
    e.preventDefault(); const f=new FormData(e.currentTarget);
    const commodity=validation(String(f.get('commodity')||'')); const district=validation(String(f.get('district')||''));
    const quantity=Number(f.get('quantity'));
    if (!commodity || !district || !Number.isFinite(quantity) || quantity<=0 || quantity>100000) {setNotice('Enter a crop, district and valid positive quantity.');return;}
    setRequirements(r=>[{id:Date.now(),commodity,district,quantityTonnes:quantity,grade:'To be confirmed',neededBy:'Draft only',buyer:'Demo buyer',status:'Draft'},...r]);
    setShowForm(false);setNotice('Draft added to this browser session only; no real procurement request was published.');
  };
  const visible=requirements.filter(r=>`${r.commodity} ${r.district} ${r.buyer}`.toLowerCase().includes(filter.toLowerCase()));
  return <>
    <SectionTitle eyebrow="KRISHIGO PROCUREMENT" title="Buyers, meet better harvests." copy="Explore sample procurement needs and build a draft requirement without contacting real farmers."/>
    <div className="workspace-toolbar"><label className="workspace-search"><Search size={18}/><input placeholder="Search crop, district or buyer" value={filter} onChange={e=>setFilter(e.target.value)}/></label><button className="btn btn-primary" onClick={()=>setShowForm(v=>!v)}><Plus size={18}/> Post a demo requirement</button></div>
    {showForm && <form className="surface-card workspace-form" onSubmit={create}><h3>Procurement requirement · staging draft</h3><div className="form-grid"><label>Commodity<input name="commodity" maxLength={150} placeholder="e.g. Tomato" required/></label><label>Quantity (tonnes)<input name="quantity" type="number" min="0.1" step="0.1" max="100000" required/></label><label>District<input name="district" maxLength={150} placeholder="e.g. Pune" required/></label></div><button className="btn btn-primary" type="submit">Save demo draft <ArrowRight size={17}/></button></form>}
    {notice && <div className="workspace-notice" role="status"><CheckCircle2 size={18}/>{notice}</div>}
    <div className="workspace-card-grid">{visible.map(r=><article className="surface-card workspace-tile" key={r.id}><div className="section-eyebrow">{r.status==='Draft'?'NEW DEMO DRAFT':'SAMPLE REQUIREMENT'}</div><h3>{r.commodity}</h3><strong className="workspace-big">{r.quantityTonnes} <small>tonnes</small></strong><p><MapPin size={15}/> {r.district} · {r.grade}</p><div className="workspace-footer"><span>{r.buyer}</span><button className="text-arrow" onClick={()=>setNotice('Enquiries require verified users and the production PHP API. No enquiry was sent.')}>Enquire <ArrowRight size={15}/></button></div></article>)}</div>
    {!visible.length && <div className="empty-message"><h3>No matching requirements</h3><p>Try another commodity or location.</p></div>}
    <DemoNote>All buyer identities and quantities are fictional samples. Forms update in-memory state only and reset on reload.</DemoNote>
  </>;
}
function ServicesBoard() {
  const [services,setServices]=useState<FarmService[]>([]); const [category,setCategory]=useState('All'); const [notice,setNotice]=useState('');
  useEffect(()=>{let active=true;dataSource.farmServices().then(r=>{if(active)setServices(r);}).catch(()=>setNotice('Service fixtures unavailable.'));return()=>{active=false;};},[]);
  const categories=['All',...Array.from(new Set(services.map(s=>s.category)))];
  return <><SectionTitle eyebrow="KRISHIGO NEARBY" title="Services around your farm." copy="Find the categories you need. Real listings, locations and availability will require verified provider data."/>
    <div className="category-pills workspace-pills">{categories.map(x=><button className={x===category?'active':''} onClick={()=>setCategory(x)} key={x}>{x}</button>)}</div>
    <div className="workspace-card-grid">{services.filter(s=>category==='All'||category===s.category).map(s=><article key={s.id} className="surface-card workspace-tile"><div className="workspace-emoji">{s.icon}</div><div className="section-eyebrow">{s.category.toUpperCase()} · SAMPLE</div><h3>{s.name}</h3><p>{s.description}</p><div className="workspace-footer"><span><MapPin size={14}/> {s.district}</span><button className="text-arrow" onClick={()=>setNotice(`Sample only: no request sent for ${s.name}.`)}>Details <ArrowRight size={15}/></button></div></article>)}</div>
    {notice&&<div role="status" className="workspace-notice">{notice}</div>}
    <DemoNote>These are fictional category illustrations, not verified service providers or available bookings.</DemoNote>
  </>;
}
function DiscoverBoard(){
  const moduleFlags=useModuleFlags();
  const [modules,setModules]=useState<ScopeModule[]>([]);const [content,setContent]=useState<ContentEntry[]>([]);const [filter,setFilter]=useState('All');const [phase,setPhase]=useState(0);
  useEffect(()=>{let active=true;Promise.all([dataSource.scopeModules(),dataSource.contentEntries()]).then(([m,c])=>{if(active){setModules(m);setContent(c);}}).catch(()=>{if(active){setModules([]);setContent([]);}});return()=>{active=false;};},[]);
  const [selected,setSelected]=useState<number|null>(null); const [moduleId,setModuleId]=useState<number|null>(null); const chosen=content.find(c=>c.id===selected);
  const groups=['All','Market','Plant Care','Circle','Insights','Learn','Services','Business'];
  const visible=modules.filter(m=>isEnabled(moduleFlags,m.id)&&(filter==='All'||m.category===filter)&&(!phase||m.phase===phase));
  if(moduleId!==null) return isEnabled(moduleFlags,moduleId)?<ModuleStudio key={moduleId} moduleId={moduleId} onBack={()=>setModuleId(null)}/>:<section className="surface-card workspace-recovery"><h2>Module disabled</h2><button className="btn btn-primary" onClick={()=>setModuleId(null)}>All modules</button></section>;
  return <><SectionTitle eyebrow="KRISHIGO ECOSYSTEM" title="Everything agriculture. One place." copy="Explore all 25 planned modules, crop knowledge and the future services roadmap."/>
    <div className="surface-card content-library"><div className="section-head"><div><div className="section-eyebrow">EDITORIAL LIBRARY · DRAFTS</div><h3>Knowledge, news and schemes</h3></div><BookOpen size={20}/></div><div className="workspace-card-grid compact">{content.map(c=><button className="content-teaser" key={c.id} onClick={()=>setSelected(c.id)}><span>{c.kind}</span><strong>{c.title}</strong><small>{c.source}</small><ArrowRight size={15}/></button>)}</div>{chosen&&<div className="content-detail" role="region" aria-label="Sample content detail"><button className="text-arrow" onClick={()=>setSelected(null)}>Close ×</button><strong>{chosen.title}</strong><p>{chosen.summary}</p><small>{chosen.source} · {chosen.updated}</small></div>}</div>
    <div className="workspace-toolbar"><div className="category-pills workspace-pills">{groups.map(g=><button key={g} className={filter===g?'active':''} onClick={()=>setFilter(g)}>{g}</button>)}</div><label className="workspace-phase"><Filter size={16}/><select value={phase} onChange={e=>setPhase(Number(e.target.value))} aria-label="Filter development phase"><option value={0}>All phases</option><option value={1}>Phase 1</option><option value={2}>Phase 2</option><option value={3}>Phase 3</option></select></label></div>
    <div className="workspace-card-grid compact">{visible.map(m=><article className="surface-card scope-tile" key={m.id}><div className="section-eyebrow">MODULE {String(m.id).padStart(2,'0')} · PHASE {m.phase}</div><h3>{m.name}</h3><p>{m.summary}</p><span className="scope-tag">{m.category}</span><button type="button" className="text-arrow" onClick={()=>setModuleId(m.id)} aria-label={`Explore ${m.name}`}>Open module <ArrowRight size={16}/></button></article>)}</div>
    <DemoNote>All 25 cards now open interactive module-specific staging exercises. They are not live integrated agricultural services. News, scheme and learning content remain editorial drafts.</DemoNote>
  </>;
}
function CropJournal(){
 const [entries,setEntries]=useState<JournalEntry[]>([{id:1,crop:'Tomato',observation:'Example note: inspect leaves after rainfall and take comparison photographs.',date:'Sample entry'}]);const [crop,setCrop]=useState('Tomato');const [note,setNote]=useState('');
 const add=(e:FormEvent)=>{e.preventDefault();if(!note.trim())return;setEntries(s=>[{id:Date.now(),crop,observation:note.trim().slice(0,1000),date:'Session draft'},...s]);setNote('');};
 return <><SectionTitle eyebrow="MY FARM WORKSPACE" title="Know your crops, every season." copy="Record field observations and plan follow-ups. No images or notes leave this device in staging."/>
    <div className="workspace-split"><form className="surface-card workspace-form" onSubmit={add}><div className="section-eyebrow">CROP DIARY</div><h3>New observation</h3><label>Crop<select value={crop} onChange={e=>setCrop(e.target.value)}>{['Tomato','Onion','Soybean','Cotton','Chilli','Sugarcane','Other'].map(c=><option key={c}>{c}</option>)}</select></label><label>Field observation<textarea maxLength={1000} rows={5} placeholder="What did you observe today? Note crop stage, visible symptoms and field conditions." value={note} onChange={e=>setNote(e.target.value)} required/></label><button className="btn btn-primary" type="submit"><Plus size={17}/> Add demo observation</button></form>
    <div className="surface-card journal-list"><div className="section-eyebrow">YOUR TEMPORARY HISTORY</div><h3>{entries.length} field notes</h3>{entries.map(x=><article className="journal-item" key={x.id}><div className="journal-dot"><Leaf size={18}/></div><div><strong>{x.crop}</strong><small>{x.date}</small><p>{x.observation}</p></div></article>)}</div></div>
    <DemoNote>Temporary observations disappear when the page reloads. This module does not provide plant identification, diagnosis, prescriptions or persistent case history yet.</DemoNote>
 </>;
}
function AdminBoard(){
 const rows=[{label:'Listings & buyers',state:'Mock data',detail:'No real verification or trading'},{label:'Plant Doctor',state:'Preview only',detail:'No AI image inference or diagnosis'},{label:'Community',state:'Session only',detail:'No user accounts or public posts'},{label:'Mandi & news',state:'Sample only',detail:'No verified imports or publication'},{label:'Database',state:'Disabled',detail:'Staging runs entirely without database storage'},{label:'PHP API',state:'Contract scaffold',detail:'Production authentication remains a milestone'}];
 return <><SectionTitle eyebrow="ADMINISTRATION · STAGING" title="Publishing & operations desk." copy="A read-only readiness board for development. Production administration will require verified roles and audit logs."/>
 <div className="workspace-metrics"><div><ClipboardList size={21}/><strong>25</strong><span>Planned agricultural modules</span></div><div><ShieldCheck size={21}/><strong>0</strong><span>Real user accounts</span></div><div><Sprout size={21}/><strong>Mock</strong><span>Environment data mode</span></div></div>
 <section className="surface-card"><div className="section-head"><div><div className="section-eyebrow">INTEGRATION READINESS</div><h3>System boundaries</h3></div><SlidersHorizontal size={19}/></div><div className="admin-rows">{rows.map(r=><div key={r.label}><div><strong>{r.label}</strong><small>{r.detail}</small></div><span className="scope-tag">{r.state}</span></div>)}</div></section><DemoNote>Admin is a public staging preview, not an authenticated or production management interface. Do not expose real operational controls here.</DemoNote>
 </>;
}
export default function Workspaces({page}: {page:Workspace}) { switch(page){case 'Buyers':return <BuyerBoard/>;case 'Services':return <ServicesBoard/>;case 'Discover':return <DiscoverBoard/>;case 'Crop Journal':return <CropJournal/>;case 'Admin':return <ModuleControlPanel/>;case 'My Profile':return <ProfileWorkspace/>;case 'Plant Cases':return <CasesWorkspace/>;} }
