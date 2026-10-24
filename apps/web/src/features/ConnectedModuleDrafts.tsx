import {useEffect,useState,type FormEvent} from 'react';
import {CheckCircle2,LockKeyhole,RefreshCw} from 'lucide-react';
import {jsonStagingClient,type DemoIdentity,type DemoRecord,type ModuleDraftSchema} from '../infrastructure/jsonStagingClient';

const message=(error:unknown)=>error instanceof Error?error.message:'module_staging_request_failed';

/** Generates module-specific private JSON test forms directly from server contracts. */
export default function ConnectedModuleDrafts({moduleId}:{moduleId:number}){
 const [schema,setSchema]=useState<ModuleDraftSchema|null>(null);
 const [identity,setIdentity]=useState<DemoIdentity>(null);
 const [ready,setReady]=useState(false);
 const [login,setLogin]=useState({username:'',password:''});
 const [title,setTitle]=useState(''),[note,setNote]=useState('');
 const [details,setDetails]=useState<Record<string,string>>({});
 const [records,setRecords]=useState<DemoRecord[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function refresh(id:number){
  const [spec,data]=await Promise.all([jsonStagingClient.moduleSchema(id),jsonStagingClient.moduleDrafts(id)]);
  if(spec.schema!==1||spec.module_id!==id||!Array.isArray(spec.fields))throw new Error('module_contract_unavailable');
  setSchema(spec);setRecords(data.items);
 }
 useEffect(()=>{let active=true;(async()=>{
  try{await jsonStagingClient.initialize();
   const session=await jsonStagingClient.identity();
   if(active){setIdentity(session.identity);if(session.identity)await refresh(moduleId);}
  }catch(e){if(active)setError(message(e));}
  finally{if(active)setReady(true);}
 })();return()=>{active=false;};
 },[moduleId]);
 async function action(fn:()=>Promise<void>,success:string){
  if(busy)return;setBusy(true);setError('');setNotice('');
  try{await fn();setNotice(success);}catch(e){setError(message(e));}finally{setBusy(false);}
 }
 function signIn(e:FormEvent){e.preventDefault();void action(async()=>{
  const result=await jsonStagingClient.login(login.username,login.password);
  setIdentity(result);setLogin({username:'',password:''});await refresh(moduleId);
 },'Protected staging session opened.');}
 function save(e:FormEvent){e.preventDefault();if(!schema)return;
  const input:Record<string,string|number>={};
  for(const field of schema.fields){
   const raw=details[field.key]||'';
   input[field.key]=field.type==='integer'?Number(raw):raw.trim();
  }
  void action(async()=>{
   await jsonStagingClient.saveModuleDraft(moduleId,title.trim(),note.trim(),input);
   setTitle('');setNote('');setDetails({});await refresh(moduleId);
  },'Module-specific fictional draft stored in private JSON. No external action triggered.');
 }
 return <section className="studio-columns" aria-label="Module-specific connected JSON drafts">
  {!ready?<div role="status" className="surface-card">Checking protected module contract…</div>:
  !identity?<form className="surface-card studio-form" onSubmit={signIn}>
   <h3><LockKeyhole size={18}/> Protected staging module access</h3>
   <label>Username<input aria-label="Module staging username" required autoComplete="username" value={login.username} onChange={e=>setLogin(s=>({...s,username:e.target.value}))}/></label>
   <label>Password<input aria-label="Module staging password" required autoComplete="current-password" type="password" value={login.password} onChange={e=>setLogin(s=>({...s,password:e.target.value}))}/></label>
   <button className="btn btn-primary" disabled={busy}>Sign in</button>
  </form>:schema?<form className="surface-card studio-form" onSubmit={save}>
   <div className="section-eyebrow">MODULE {moduleId} · PROTECTED JSON TEST CONTRACT</div>
   <h3>{schema.purpose}</h3>
   <p className="page-disclaimer">Strict field validation, private staging drafts only. This form does not book, publish, diagnose or contact anyone.</p>
   <label>Draft title<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label>
   {schema.fields.map(field=><label key={field.key}>{field.label}
    {field.type==='enum'?
     <select required value={details[field.key]||''} onChange={e=>setDetails(s=>({...s,[field.key]:e.target.value}))}><option value="">Select option</option>{field.options?.map(o=><option key={o} value={o}>{o}</option>)}</select>:
     <input required type={field.type==='integer'?'number':field.type==='date'?'date':field.type==='https_url'?'url':'text'}
      min={field.type==='integer'?1:undefined} max={field.type==='integer'?field.max:undefined} maxLength={field.type==='text'||field.type==='https_url'?field.max:undefined}
      placeholder={String(field.example)} value={details[field.key]||''} onChange={e=>setDetails(s=>({...s,[field.key]:e.target.value}))}/>}
   </label>)}
   <label>Context note<input required maxLength={600} value={note} onChange={e=>setNote(e.target.value)}/></label>
   <button className="btn btn-primary" disabled={busy||!schema.roles.includes(identity.role)}>Save private JSON test draft</button>
  </form>:<div className="surface-card">Module-specific contract is unavailable. No data was submitted.</div>}
  <section className="surface-card studio-drafts">
   <div className="section-eyebrow">PRIVATE STAGING RECORDS</div><h3>{records.length} stored draft{records.length===1?'':'s'}</h3>
   <p>These are owned by the current staging session. No emails, notifications or publishing are enabled.</p>
   {error&&<p className="module-warning" role="alert">{error}</p>}
   {notice&&<p className="workspace-notice" role="status"><CheckCircle2 size={15}/>{notice}</p>}
   <button className="btn btn-soft" disabled={!identity||busy} onClick={()=>void action(()=>refresh(moduleId),'Private drafts refreshed.')}><RefreshCw size={15}/> Refresh</button>
   {records.length===0?<p>No private JSON records yet.</p>:records.map(row=><article className="studio-draft-row" key={row.id}>
    <div><strong>#{row.id} · {String(row.fields.title||'Draft')}</strong><small>{row.status} · {String(row.fields.note||'')}</small></div>
   </article>)}
  </section>
 </section>;
}
