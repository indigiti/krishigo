import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {ArrowRight,CheckCircle2,ClipboardList,Leaf,LockKeyhole,RefreshCw,ShieldCheck,Search,Users} from 'lucide-react';
import {jsonStagingClient,domainFields,type DemoDomain,type DemoIdentity,type DemoRecord} from '../infrastructure/jsonStagingClient';

const titles:Record<DemoDomain,{title:string,subtitle:string,action:string,notice:string}> = {
 marketplace:{title:'Produce marketplace.',subtitle:'Prepare a harvest listing, track editorial review and browse approved fictional produce.',action:'Save produce lot',notice:'No product has been advertised to a real buyer.'},
 buyers:{title:'Buyer procurement.',subtitle:'Record a sample buyer requirement and compare it with reviewed produce lots.',action:'Save requirement',notice:'No farmer has received a procurement enquiry.'},
 community:{title:'Farmer community.',subtitle:'Submit a discussion for editorial review and read reviewed sample discussions.',action:'Submit discussion',notice:'This post was not published outside protected staging.'},
 plant:{title:'Plant Care casebook.',subtitle:'Keep private field observations and create an owned case follow-up. This is not an AI diagnosis.',action:'Save observation',notice:'Observations remain private to this staging login.'},
 services:{title:'Agricultural service requests.',subtitle:'Create sample requests and track review. This does not book a provider.',action:'Save request',notice:'No service provider has been contacted.'},
 editorial:{title:'Editorial publishing desk.',subtitle:'Draft factual content for review. Staging approvals cannot publish externally.',action:'Save editorial draft',notice:'No article has been published on a public website.'}
};
const safeError=(e:unknown)=>e instanceof Error?e.message:'request_failed';

/** Dedicated, code-split module view. PHP, never browser role labels, owns authorization. */
export default function ConnectedDomainPanel({domain}:{domain:DemoDomain}){
 const cfg=titles[domain];
 const [identity,setIdentity]=useState<DemoIdentity>(null);
 const [authReady,setAuthReady]=useState(false);
 const [login,setLogin]=useState({username:'',password:''});
 const [records,setRecords]=useState<DemoRecord[]>([]);
 const [mine,setMine]=useState(true),[pending,setPending]=useState<DemoRecord[]>([]);
 const [fields,setFields]=useState<Record<string,string>>({});
 const [matches,setMatches]=useState<DemoRecord[]>([]);
 const [cases,setCases]=useState<DemoRecord[]>([]);
 const [followup,setFollowup]=useState('');
 const [search,setSearch]=useState('');
 const [status,setStatus]=useState(''),[error,setError]=useState('');
 const [working,setWorking]=useState(false);
 const [ready,setReady]=useState(false);
 const canModerate=identity?.role==='admin'||identity?.role==='editor';
 const canPost=domain==='editorial' ? canModerate : identity?.role==='admin'||identity?.role==='farmer'||identity?.role==='buyer'||identity?.role==='fpo'||identity?.role==='editor';
 const refresh=useCallback(async()=>{
  const own=domain==='plant'||mine;
  const data=await jsonStagingClient.records(domain,own);
  setRecords(data.items);
  if(domain==='plant')setCases(data.items.filter(x=>!x.fields.followup_of));
  if(domain!=='plant' && canModerate){
   const review=await jsonStagingClient.pending(domain);
   setPending(review.pending);
  }
 },[domain,mine,canModerate]);
 useEffect(()=>{let active=true;
  (async()=>{try{
   await jsonStagingClient.initialize();
   const session=await jsonStagingClient.identity();
   if(active){setIdentity(session.identity);setAuthReady(true);}
  }catch(e){if(active)setError(safeError(e));}
  finally{if(active)setReady(true);}})();
  return()=>{active=false;};
 },[]);
 useEffect(()=>{if(!identity)return;let active=true;
  refresh().catch(e=>{if(active)setError(safeError(e));});
  return()=>{active=false;};
 },[identity,refresh]);
 async function action(fn:()=>Promise<void>,message:string){
  if(working)return;setWorking(true);setError('');setStatus('');
  try{await fn();setStatus(message);}catch(e){setError(safeError(e));}finally{setWorking(false);}
 }
 function signIn(e:FormEvent){e.preventDefault();void action(async()=>{
  const session=await jsonStagingClient.login(login.username,login.password);
  setIdentity(session);setLogin({username:'',password:''});
 },'Logged in to fictional staging services.');}
 function signOut(){void action(async()=>{
  await jsonStagingClient.logout();setIdentity(null);setRecords([]);setCases([]);setPending([]);setMatches([]);
 },'Signed out of the staging session.');}
 function save(e:FormEvent){e.preventDefault();
  const data:Record<string,unknown>={};
  for(const field of domainFields[domain]){
   const val=(fields[field.key]||'').trim();
   data[field.key]=field.kind==='number'?Number(val):val;
  }
  if(domain==='plant' && followup)data.followup_of=Number(followup);
  void action(async()=>{
   await jsonStagingClient.create(domain,data);setFields({});setFollowup('');
   await refresh();
  },cfg.notice);
 }
 function findMatches(){
  void action(async()=>{
   const crop=(fields.crop||'').trim(),district=(fields.district||'').trim();
   const quantity=Number(fields.quantity_kg||0);
   if(!crop||!district||!Number.isSafeInteger(quantity)||quantity<1)throw new Error('Enter crop, district and positive whole kilograms first.');
   const found=await jsonStagingClient.matches(crop,district,quantity);
   setMatches(found.items);
  },'Matching only checks reviewed fictional listings. No enquiries sent.');
 }
 function moderate(record:DemoRecord,decision:'approve'|'reject'){
  void action(async()=>{
   await jsonStagingClient.decide(domain,record.id,decision);await refresh();
  },'Review decision saved only in the staging JSON store.');
 }
 const visible=records.filter(r=>JSON.stringify(r.fields).toLowerCase().includes(search.toLowerCase()));
 return <section className="module-console connected-domain" aria-label={domain+' JSON staging module'}>
  <div className="page-heading"><div>
   <div className="eyebrow">KRISHIGO · CONNECTED MODULE <span className="demo-pill">PROTECTED STAGING</span></div>
   <h1>{cfg.title}</h1><p>{cfg.subtitle}</p>
  </div></div>
  <p className="page-disclaimer">Only fictional JSON test records. The PHP API requires private, protected same-origin hosting. No live trade, notifications, third-party data or crop diagnosis.</p>
  {error&&<div role="alert" className="module-warning">{error}</div>}
  {status&&<div role="status" className="workspace-notice"><CheckCircle2 size={17}/>{status}</div>}
  {!ready?<p role="status">Checking staging credentials…</p>:
  !identity?<form className="surface-card workspace-form" onSubmit={signIn}>
    <h3><LockKeyhole size={18}/> Protected staging login</h3>
    <label>Username<input aria-label="Staging username" autoComplete="username" maxLength={100} required value={login.username} onChange={e=>setLogin(s=>({...s,username:e.target.value}))}/></label>
    <label>Password<input aria-label="Staging password" autoComplete="current-password" type="password" required value={login.password} onChange={e=>setLogin(s=>({...s,password:e.target.value}))}/></label>
    <button className="btn btn-primary" disabled={!authReady||working}>Sign in</button>
   </form>:
   <>
    <div className="module-controls"><strong><ShieldCheck size={17}/> {identity.name} · {identity.role} · DEMO</strong>
     <button className="btn btn-soft" disabled={working} onClick={signOut}>Sign out</button>
     <button className="btn btn-soft" disabled={working} onClick={()=>void action(refresh,'Module records refreshed.')}><RefreshCw size={16}/> Refresh</button>
    </div>
    <div className="connected-domain-layout">
    <form className="surface-card workspace-form" onSubmit={save}>
     <h3>{domain==='plant'?'New observation / follow-up':domain==='editorial'?'Editorial story draft':domain==='services'?'Service request details':domain==='buyers'?'Buyer requirement details':domain==='marketplace'?'Harvest lot details':'Start a discussion'}</h3>
     <div className="form-grid">{domainFields[domain].map(field=><label key={field.key}>{field.label}
      {field.key==='body'||field.key==='symptoms'||field.key==='description'||field.key==='summary'?
       <textarea rows={3} value={fields[field.key]||''} required maxLength={600} placeholder={field.hint} onChange={e=>setFields(s=>({...s,[field.key]:e.target.value}))}/>:
       field.key==='category'?<select required value={fields.category||'News'} onChange={e=>setFields(s=>({...s,category:e.target.value}))}>{['News','Guide','Scheme','Learning'].map(v=><option key={v}>{v}</option>)}</select>:
       <input type={field.kind==='number'?'number':'text'} min={field.kind==='number'?1:undefined} maxLength={field.kind==='number'?undefined:150}
       required value={fields[field.key]||''} placeholder={field.hint} onChange={e=>setFields(s=>({...s,[field.key]:e.target.value}))}/>}
     </label>)}</div>
     {domain==='plant'&&<label>Link to existing case (optional)
      <select aria-label="Follow-up case" value={followup} onChange={e=>setFollowup(e.target.value)}>
       <option value="">New standalone case</option>
       {cases.map(c=><option key={c.id} value={c.id}>Case #{c.id} · {c.fields.crop}</option>)}
      </select></label>}
     <button className="btn btn-primary" disabled={working||!canPost}>{cfg.action}<ArrowRight size={16}/></button>
     {domain==='buyers'&&<button className="btn btn-soft" disabled={working} onClick={findMatches} type="button"><Search size={15}/> Find reviewed produce matches</button>}
     {domain==='plant'&&<p className="page-disclaimer"><Leaf size={15}/> Symptoms are observations only. No inference or pesticide advice is generated.</p>}
    </form>
    <div className="surface-card connected-results">
      <div className="section-head"><div><div className="section-eyebrow">STAGING RECORDS</div><h3>{domain==='plant'?'Private case history':'Saved and reviewed records'}</h3></div></div>
      {domain!=='plant'&&<label className="connected-checkbox"><input aria-label="My drafts only" checked={mine} type="checkbox" onChange={e=>setMine(e.target.checked)}/> My drafts only</label>}
      <label className="workspace-search"><Search size={16}/><input aria-label="Filter records" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter records"/></label>
      <div className="connected-record-list">{visible.length===0?<p>No matching records. New test drafts require review before appearing in the sample public feed.</p>:
       visible.map(r=><article key={r.id} className="connected-record"><span className="section-eyebrow">#{r.id} · {r.status}</span>
        <strong>{r.fields.crop||r.fields.title||r.fields.topic||r.fields.service_type||'Demo record'}</strong>
        <p>{Object.entries(r.fields).map(([key,val])=>key.replaceAll('_',' ')+': '+val).join(' · ')}</p></article>)}
      </div>
    </div></div>
    {domain==='buyers'&&<section className="surface-card connected-results"><div className="section-head"><h3>Reviewed harvest matches · fictional</h3></div>
     {matches.length===0?<p>No matches loaded. Enter the requirement details and use Find reviewed produce matches.</p>:
      matches.map(r=><article key={r.id} className="connected-record"><strong>{r.fields.crop} · {r.fields.district}</strong><p>{r.fields.quantity_kg} kg available · ₹{r.fields.price_per_kg}/kg · Grade {r.fields.grade}</p><small>Sample only — enquiries are not enabled.</small></article>)}
    </section>}
    {canModerate && domain!=='plant'&&<section className="surface-card connected-results"><div className="section-head"><h3><ClipboardList size={18}/> Pending review · {pending.length}</h3></div>
      {pending.length===0?<p>No pending sample submissions.</p>:pending.map(r=><article className="connected-record" key={r.id}>
       <strong>#{r.id} · {r.fields.crop||r.fields.title||r.fields.topic||r.fields.service_type}</strong>
       <p>Pending internal staging review. No external publication.</p>
       <div className="module-controls"><button disabled={working} className="btn btn-soft" onClick={()=>moderate(r,'approve')}>Approve demo</button>
        <button disabled={working} className="btn btn-soft" onClick={()=>moderate(r,'reject')}>Reject demo</button></div>
      </article>)}
    </section>}
   </>}
 </section>;
}
