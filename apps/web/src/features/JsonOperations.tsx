import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {Activity,BookOpen,LockKeyhole,RefreshCcw,ShieldCheck} from 'lucide-react';
import {domainFields,jsonStagingClient,type DemoDomain,type DemoIdentity,type DemoRecord,type QueueJob} from '../infrastructure/jsonStagingClient';

const domains=Object.keys(domainFields) as DemoDomain[];
const readable=(e:unknown)=>e instanceof Error?e.message:'staging_request_failed';
const show=(r:DemoRecord)=>Object.entries(r.fields).map(([key,value])=>key+': '+String(value)).join(' · ');
/** Explicitly opt-in protected PHP staging UI: no real transactions or external publishing. */
export default function JsonOperations(){
 const [user,setUser]=useState<DemoIdentity>(null),[csrfReady,setCsrfReady]=useState(false);
 const [username,setUsername]=useState(''),[password,setPassword]=useState('');
 const [domain,setDomain]=useState<DemoDomain>('marketplace'),[mine,setMine]=useState(false);
 const [records,setRecords]=useState<DemoRecord[]>([]),[pending,setPending]=useState<DemoRecord[]>([]);
 const [health,setHealth]=useState<Record<string,{records:number;pending:number;enabled:boolean;recovered:boolean}>>({});
 const [jobs,setJobs]=useState<QueueJob[]>([]);
 const [doctor,setDoctor]=useState<{ok:boolean;status:string;checks:Array<{id:string;severity:string;message:string}>;summary:{diagnostic_domains:number;restored_snapshots:number;queue_dead:number;available_private_storage_mb:number|null}}|null>(null);
 const [fields,setFields]=useState<Record<string,string>>({});
 const [tab,setTab]=useState<'records'|'editorial'|'operations'>('records');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [initial,setInitial]=useState(false);
 const fetchRecords=useCallback(async(d:DemoDomain,m:boolean)=>{
  const result=await jsonStagingClient.records(d,d==='plant'?true:m);setRecords(result.items);
 },[]);
 const fetchAdmin=useCallback(async(d:DemoDomain)=>{
  if(d==='plant'){setPending([]);return;}
  const result=await jsonStagingClient.pending(d);setPending(result.pending);
 },[]);
 const fetchOps=useCallback(async()=>{
  const [status,queue,diagnosis]=await Promise.all([jsonStagingClient.health(),jsonStagingClient.queue(),jsonStagingClient.doctor()]);
  setHealth(status.domains);setJobs(queue.items);setDoctor(diagnosis);
 },[]);
 useEffect(()=>{let active=true;(async()=>{try{
  await jsonStagingClient.initialize();const a=await jsonStagingClient.identity();
  if(active){setUser(a.identity);setCsrfReady(true);}
 }catch(e){if(active)setError(readable(e));}finally{if(active)setInitial(true);}})();
 return()=>{active=false;};},[]);
 useEffect(()=>{if(!user)return;let active=true;
  jsonStagingClient.records(domain,domain==='plant'||mine).then(r=>{if(active)setRecords(r.items);}).catch(e=>{if(active)setError(readable(e));});
  return()=>{active=false;};
 },[user,domain,mine]);
 async function task(action:()=>Promise<unknown>,success:string){
  if(busy)return;setBusy(true);setError('');setMessage('');
  try{await action();setMessage(success);}catch(e){setError(readable(e));}finally{setBusy(false);}
 }
 async function login(e:FormEvent){e.preventDefault();await task(async()=>{
  const identity=await jsonStagingClient.login(username,password);setUser(identity);setPassword('');
 },'Logged into isolated staging. No real customer identity was created.');}
 async function logout(){await task(async()=>{await jsonStagingClient.logout();setUser(null);setRecords([]);setPending([]);},'Session closed.');}
 async function save(e:FormEvent){e.preventDefault();const data:Record<string,unknown>={};
  for(const f of domainFields[domain]){const value=fields[f.key]?.trim()||'';data[f.key]=f.kind==='number'?Number(value):value;}
  await task(async()=>{await jsonStagingClient.create(domain,data);await fetchRecords(domain,mine);setFields({});},'Fictional pending draft saved. Nobody was contacted.');
 }
 async function openTab(t:typeof tab){setTab(t);setError('');setMessage('');
  try{if(t==='editorial')await fetchAdmin(domain);if(t==='operations')await fetchOps();}
  catch(e){setError(readable(e));}
 }
 return <section className="module-console" aria-label="JSON staging operations">
  <div className="page-heading"><div><div className="eyebrow">M12 · PROTECTED JSON WORKFLOWS <span className="demo-pill">STAGING ONLY</span></div><h1>Connected agricultural operations.</h1>
   <p>Six functional draft adapters, editorial review and queue diagnostics. No payments, delivery, AI diagnosis or live agricultural feed.</p></div></div>
  <p className="page-disclaimer">The authenticated PHP JSON service must be deployed separately with a private store, HTTPS and access protection. This screen is unavailable in the normal DigiOps static build.</p>
  {error&&<p role="alert" className="module-warning">{error}</p>}{message&&<p role="status" className="workspace-notice">{message}</p>}
  {!initial?<p role="status">Checking the protected staging API…</p>:
  !user?<form className="surface-card workspace-form" onSubmit={login}>
    <h3><LockKeyhole size={18}/> Staging account login</h3>
    <label>Username<input autoComplete="username" value={username} maxLength={100} onChange={e=>setUsername(e.target.value)} required/></label>
    <label>Password<input type="password" autoComplete="current-password" maxLength={200} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
    <button type="submit" className="btn btn-primary" disabled={busy||!csrfReady}>Sign in to JSON staging</button>
  </form>:
  <>
   <div className="module-controls"><strong><ShieldCheck size={16}/> {user.name} · {user.role} · DEMO</strong><button className="btn btn-soft" onClick={logout} disabled={busy}>Sign out</button></div>
   <div className="category-pills workspace-pills"><button className={tab==='records'?'active':''} onClick={()=>openTab('records')}>Module drafts</button><button className={tab==='editorial'?'active':''} onClick={()=>openTab('editorial')}>Editorial desk</button><button className={tab==='operations'?'active':''} onClick={()=>openTab('operations')}>Operations health</button></div>
   {tab!=='operations'&&<div className="module-controls">
    <label>Module <select aria-label="JSON workflow module" value={domain} onChange={e=>{setDomain(e.target.value as DemoDomain);setFields({});setRecords([]);setPending([]);}}>
    {domains.map(d=><option key={d} value={d}>{d[0].toUpperCase()+d.slice(1)}</option>)}</select></label>
    {tab==='records'&&<label><input type="checkbox" checked={mine||domain==='plant'} disabled={domain==='plant'} onChange={e=>setMine(e.target.checked)}/> My drafts only</label>}
    <button className="btn btn-soft" onClick={()=>task(async()=>{await fetchRecords(domain,mine);if(tab==='editorial')await fetchAdmin(domain);},'Records refreshed.')} disabled={busy}><RefreshCcw size={16}/> Refresh</button>
   </div>}
   {tab==='records'&&<>
    <form className="surface-card workspace-form" onSubmit={save}>
     <h3>Create {domain} test draft</h3>
     <div className="form-grid">{domainFields[domain].map(field=><label key={field.key}>{field.label}
       <input type={field.kind==='number'?'number':'text'} required min={field.kind==='number'?1:undefined} maxLength={field.kind==='number'?undefined:600}
       placeholder={field.hint} value={fields[field.key]||''} onChange={e=>setFields(x=>({...x,[field.key]:e.target.value}))}/></label>)}</div>
     <button className="btn btn-primary" type="submit" disabled={busy}>Save test draft</button>
    </form>
    <div className="module-settings">{records.length===0?<p className="surface-card">No reviewed or personal drafts in this view.</p>:records.map(r=><article key={r.id} className="surface-card module-setting">
      <div><span className="section-eyebrow">#{r.id} · {r.status}</span><h3>{r.fields.crop||r.fields.title||r.fields.topic||r.fields.service_type||'Draft'}</h3><p>{show(r)}</p></div>
    </article>)}</div>
   </>}
   {tab==='editorial'&&<section className="module-diagnostics surface-card"><h3><BookOpen size={18}/> Pending {domain} review</h3>
    {domain==='plant'?<p>Private Plant Care observations cannot enter the public review queue.</p>:pending.length===0?<p>No pending demonstration drafts, or your staging role cannot access this queue.</p>:
    pending.map(r=><article key={r.id} className="module-setting"><div><h3>{domain} #{r.id}</h3><p>{show(r)}</p></div>
     <div className="module-controls"><button className="btn btn-soft" disabled={busy} onClick={()=>task(async()=>{await jsonStagingClient.decide(domain,r.id,'approve');await fetchAdmin(domain);},'Approved for the demo feed only.')}>Approve demo</button>
      <button className="btn btn-soft" disabled={busy} onClick={()=>task(async()=>{await jsonStagingClient.decide(domain,r.id,'reject');await fetchAdmin(domain);},'Rejected for this demo.')}>Reject demo</button></div>
    </article>)}</section>}
   {tab==='operations'&&<><div className="module-controls">
     <button className="btn btn-soft" onClick={()=>task(fetchOps,'Diagnostics refreshed.')} disabled={busy}><RefreshCcw size={15}/> Refresh</button>
     <button className="btn btn-soft" onClick={()=>task(async()=>{await jsonStagingClient.enqueue(domain);await fetchOps();},'Safe diagnostic job queued.')} disabled={busy}>Queue snapshot</button>
     <button className="btn btn-soft" onClick={()=>task(async()=>{await jsonStagingClient.process();await fetchOps();},'Bounded jobs processed.')} disabled={busy}>Run safe jobs</button>
     <button className="btn btn-soft" onClick={()=>task(async()=>{await jsonStagingClient.recover();await fetchOps();},'Expired diagnostic leases examined.')} disabled={busy}>Recover expired</button>
    </div>
    <div className="module-status-grid">{Object.entries(health).map(([name,item])=><div className="surface-card" key={name}><Activity size={18}/><strong>{name}</strong><small>{item.records} records · {item.pending} pending · {item.enabled?'enabled':'disabled'} · {item.recovered?'recovered':'healthy'}</small></div>)}</div>
    <section className="surface-card connected-results" aria-label="Operational diagnostics">
     <div className="section-head"><div><div className="section-eyebrow">M14 · PROTECTED OPERATIONS</div><h3>Runtime doctor</h3></div>
      <strong>{doctor?.status==='healthy'?'Healthy':doctor?'Attention required':'Not checked'}</strong></div>
     <p>Authenticated, read-only assessment. Recovery and retries always require an explicit administrator action.</p>
     {doctor?.checks.map(c=><div key={c.id} className="connected-record"><strong>{c.severity==='ok'?'✓':'!'} {c.id.replaceAll('_',' ')}</strong><p>{c.message}</p></div>)}
     <p className="page-disclaimer">Snapshot recoveries: {doctor?.summary.restored_snapshots??'—'} · Dead diagnostic jobs: {doctor?.summary.queue_dead??'—'} · Private free storage: {doctor?.summary.available_private_storage_mb??'Unknown'} MB</p>
    </section>
    <h3>Bounded diagnostic jobs</h3><div className="module-settings">{jobs.length===0?<p>No diagnostic jobs.</p>:jobs.map(j=><article className="surface-card module-setting" key={j.id}><div><strong>#{j.id} · {j.kind}</strong><p>{j.status} · {j.attempts}/{j.max_attempts} attempts {j.last_error?(' · '+j.last_error):''}</p></div></article>)}</div>
    <p className="page-disclaimer">Jobs only read fictional store counts. No retries of purchases, messages, notifications or AI inference.</p></>}
  </>}
 </section>;
}
