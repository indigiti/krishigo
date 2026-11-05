import {useEffect,useState,type FormEvent} from 'react';
import {jsonStagingClient,type DemoRecord} from '../infrastructure/jsonStagingClient';
type Spec={fields:Array<{key:string;label:string;type:string;max:number;options:string[]|null}>;private:boolean;create_allowed:boolean};
export default function ConnectedAgriInputs(){
 const [user,setUser]=useState<{name:string;role:string}|null>(null),[login,setLogin]=useState({u:'',p:''});
 const [specs,setSpecs]=useState<Record<string,Spec>>({}),[kind,setKind]=useState('products');
 const [fields,setFields]=useState<Record<string,string>>({}),[records,setRecords]=useState<DemoRecord[]>([]);
 const [mode,setMode]=useState('mine'),[reason,setReason]=useState(''),[note,setNote]=useState('');
 const [query,setQuery]=useState(''),[evidence,setEvidence]=useState<Array<{title:string;summary:string;source_url:string}>>([]);
 const [batch,setBatch]=useState(''),[alerts,setAlerts]=useState<Array<{fields:Record<string,string>}>>([]);
 const [watchAlerts,setWatchAlerts]=useState<Array<{watch_id:number;recall:Record<string,string>}>>([]);
 const [updates,setUpdates]=useState<Array<{id:number;fields:Record<string,string>}>>([]);
 const [busy,setBusy]=useState(false);
 const perform=async(fn:()=>Promise<void>)=>{setBusy(true);setNote('');try{await fn();}catch(e){setNote(String(e));}finally{setBusy(false)}};
 const refresh=async(k=kind,m=mode)=>{const r=m==='review'?await jsonStagingClient.inputPending(k):await jsonStagingClient.inputList(k,m!=='public');setRecords('pending'in r?r.pending:r.items)};
 useEffect(()=>{void(async()=>{try{await jsonStagingClient.initialize();const i=await jsonStagingClient.identity();if(i.identity){setUser(i.identity);setSpecs((await jsonStagingClient.inputSchemas()).schemas);}}catch(e){setNote(String(e));}})()},[]);
 useEffect(()=>{if(user&&specs[kind])void refresh().catch(e=>setNote(String(e)))},[user,specs,kind,mode]);
 const authenticate=(e:FormEvent)=>{e.preventDefault();void perform(async()=>{setUser(await jsonStagingClient.login(login.u,login.p));setSpecs((await jsonStagingClient.inputSchemas()).schemas);setLogin({u:'',p:''})})};
 const save=(e:FormEvent)=>{e.preventDefault();void perform(async()=>{const body:Record<string,string>={};for(const f of specs[kind].fields)body[f.key]=fields[f.key]||'';await jsonStagingClient.inputCreate(kind,body);setFields({});setMode('mine');await refresh(kind,'mine');setNote('Protected demo draft saved. No external action.')})};
 const decide=(r:DemoRecord,d:'approve'|'reject')=>void perform(async()=>{await jsonStagingClient.inputReview(kind,r.id,d,reason);await refresh(kind,'review');setNote('Staging decision only; not legal certification.')});
 return <section className="surface-card agri-panel agri-connected">
 <div className="section-eyebrow">P1–P4 · AUTHENTICATED JSON PILOT</div><h2>Connected inputs operations</h2>
 <p>Protected staging records, editorial review, farm logs, supplier quotes, and evidence search. No real OCR, registration verification, sales or AI advice.</p>
 {!user?<form className="agri-fields agri-form" onSubmit={authenticate}>
 <label>Staging username<input required value={login.u} onChange={e=>setLogin(v=>({...v,u:e.target.value}))}/></label>
 <label>Staging password<input required type="password" value={login.p} onChange={e=>setLogin(v=>({...v,p:e.target.value}))}/></label><button className="btn btn-primary" disabled={busy}>Sign in</button></form>:<>
 <p>{user.name} · {user.role} <button className="btn btn-soft" onClick={()=>void perform(async()=>{await jsonStagingClient.logout();setUser(null);setSpecs({})})}>Sign out</button></p>
 <div className="agri-fields two"><label>Collection<select value={kind} onChange={e=>{setKind(e.target.value);setFields({});setMode('mine')}}>{Object.keys(specs).map(k=><option key={k}>{k}</option>)}</select></label>
 <label>Records<select value={mode} onChange={e=>setMode(e.target.value)}><option value="mine">My drafts</option>{!specs[kind]?.private&&<option value="public">Reviewed demo</option>}
 {(user.role==='admin'||user.role==='editor')&&(!specs[kind]?.private||['ocr','plans','expert'].includes(kind))&&<option value="review">Pending review</option>}</select></label></div>
 {specs[kind]?.create_allowed&&<form onSubmit={save} className="agri-connected-form"><h3>Create private staging draft</h3><div className="agri-fields two">
 {specs[kind].fields.map(f=><label key={f.key}>{f.label}{f.options?<select required value={fields[f.key]||''} onChange={e=>setFields(x=>({...x,[f.key]:e.target.value}))}><option value="">Select</option>{f.options.map(o=><option key={o}>{o}</option>)}</select>:
 <input required type={f.type==='date'?'date':f.type==='url'?'url':f.type==='decimal'?'number':'text'} maxLength={f.max} step={f.type==='decimal'?'0.001':undefined} value={fields[f.key]||''} onChange={e=>setFields(x=>({...x,[f.key]:e.target.value}))}/>}</label>)}</div>
 <button className="btn btn-primary" disabled={busy}>Save protected draft</button></form>}
 {mode==='review'&&<label className="agri-review-reason">Review reason (min. 10 characters)<textarea maxLength={300} value={reason} onChange={e=>setReason(e.target.value)}/></label>}
 <h3>{mode==='review'?'Pending':'Records'} · {records.length}</h3>{records.map(r=><div className="agri-record" key={r.id}><strong>#{r.id} · {r.status}</strong>{Object.entries(r.fields).map(([k,v])=><p key={k}>{k}: {v}</p>)}
 {kind==='watches'&&mode==='mine'&&<button className="btn btn-soft" disabled={busy} onClick={()=>void perform(async()=>{await jsonStagingClient.inputDeleteWatch(r.id);await refresh();setWatchAlerts([]);setNote('Batch watch removed; in-app consent revoked.')})}>Remove this watch</button>}
 {mode==='review'&&<div><button disabled={busy||reason.trim().length<10} onClick={()=>decide(r,'approve')}>Review as demo</button> <button disabled={busy||reason.trim().length<10} onClick={()=>decide(r,'reject')}>Reject</button></div>}</div>)}
 <form className="agri-search-form" onSubmit={e=>{e.preventDefault();void perform(async()=>{const r=await jsonStagingClient.inputSearch(query,true);setEvidence(r.results);setNote(r.answer)})}}><h3>Source-grounded search</h3><input aria-label="Search staged sources" required minLength={2} maxLength={80} value={query} onChange={e=>setQuery(e.target.value)}/><button className="btn btn-soft" disabled={busy}>Search</button>
 {evidence.map((r,i)=><div className="agri-record" key={i}><strong>{r.title}</strong><p>{r.summary}</p><a href={r.source_url} target="_blank" rel="noopener noreferrer">Submitted source</a></div>)}</form>
 <form className="agri-search-form" onSubmit={e=>{e.preventDefault();void perform(async()=>{setAlerts((await jsonStagingClient.inputAlerts(batch)).matches)})}}><h3>Batch recall lookup · staging only</h3><input aria-label="Batch number" maxLength={100} value={batch} onChange={e=>setBatch(e.target.value)}/><button className="btn btn-soft" disabled={busy}>Check</button>
 {alerts.map((x,i)=><div key={i} className="agri-record"><strong>{x.fields.product} · {x.fields.batch}</strong><p>{x.fields.reason}</p></div>)}</form>
 <div className="agri-connected-tools">
  <div className="agri-search-form"><h3>Opt-in in-app watch alerts</h3>
   <p>Select the watches collection to add an exact product and batch with in-app-only consent. No messages are sent.</p>
   <button type="button" className="btn btn-soft" disabled={busy} onClick={()=>void perform(async()=>{const a=await jsonStagingClient.inputWatchAlerts();setWatchAlerts(a.alerts);setNote('Checked reviewed demo recalls against your private watchlist.')})}>Check my batch watches</button>
   {watchAlerts.length===0?<p>No matching staged recall notice. This does not establish safety.</p>:watchAlerts.map((a,i)=><div className="agri-record" key={i}><strong>{a.recall.product} · {a.recall.batch}</strong><p>{a.recall.reason}</p></div>)}
  </div>
  <div className="agri-search-form"><h3>Reviewed regulatory updates</h3>
   <button type="button" className="btn btn-soft" disabled={busy} onClick={()=>void perform(async()=>{setUpdates((await jsonStagingClient.inputRegulatoryUpdates()).updates);setNote('These are editor-reviewed stage notices, not a live official monitoring feed.')})}>Load reviewed updates</button>
   {updates.map(a=><div className="agri-record" key={a.id}><strong>{a.fields.title}</strong><p>{a.fields.summary}</p><a href={a.fields.source_url} target="_blank" rel="noopener noreferrer">Submitted notice source</a></div>)}
  </div>
 </div>
 </>}{note&&<p className="workspace-notice" role="status">{note}</p>}
 </section>;
}
