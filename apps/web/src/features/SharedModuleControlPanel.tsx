import {useCallback,useEffect,useState} from 'react';
import {Activity,CheckCircle2,LockKeyhole,RefreshCw,RotateCcw,ShieldAlert,ShieldCheck} from 'lucide-react';

/** Opt-in, same-origin PHP staging control plane. Never enabled in the static demo. */
type RemoteModule={id:number;key:string;name:string;category:string;summary:string;dependencies:number[];enabled:boolean};
type Snapshot={schema:number;revision:string;modules:RemoteModule[];enabled_count:number;disabled_count:number;configured:boolean;recovered:boolean;database:string};
type Identity={name:string;role:string;demo:boolean}|null;
const configuredBase=import.meta.env.VITE_MODULE_API_BASE_URL||'/api/v1';
function endpoint(path:string):string{
 const url=new URL(configuredBase.replace(/\/$/,'')+path,window.location.origin);
 if(url.origin!==window.location.origin)throw new Error('same_origin_api_required');
 if(!url.pathname.endsWith(path))throw new Error('invalid_module_api_path');
 return url.toString();
}
async function request<T>(path:string,method='GET',body?:unknown,csrf=''):Promise<T>{
 const res=await fetch(endpoint(path),{
  method,credentials:'same-origin',cache:'no-store',
  headers:{Accept:'application/json',...(body===undefined?{}:{'Content-Type':'application/json'}),...(csrf?{'X-CSRF-Token':csrf}:{})},
  ...(body===undefined?{}:{body:JSON.stringify(body)}),
 });
 const data:unknown=await res.json().catch(()=>({error:'invalid_api_response'}));
 if(!res.ok) {
  const error=data&&typeof data==='object'&&'error' in data?String((data as {error:unknown}).error):'api_error';
  throw new Error(error);
 }
 return data as T;
}
const humanError=(e:unknown)=>e instanceof Error?e.message:'request_failed';
export default function SharedModuleControlPanel(){
 const [identity,setIdentity]=useState<Identity>(null);
 const [login,setLogin]=useState({username:'',password:''});
 const [csrf,setCsrf]=useState('');
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
 const [busy,setBusy]=useState(false),[ready,setReady]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [query,setQuery]=useState('');
 const refresh=useCallback(async()=>{
  const data=await request<Snapshot>('/admin/module-controls');
  if(data.schema!==1||!Array.isArray(data.modules)||data.modules.length!==25||!(/^[a-f0-9]{64}$/.test(data.revision)))throw new Error('invalid_module_registry');
  setSnapshot(data);return data;
 },[]);
 useEffect(()=>{
  let active=true;
  (async()=>{try{
   const session=await request<{csrf_token:string}>('/auth/csrf');
   const member=await request<{identity:Identity}>('/auth/me');
   if(!active)return;
   setCsrf(session.csrf_token);setIdentity(member.identity);
   if(member.identity?.role==='admin')await refresh();
  }catch(e){if(active)setError(humanError(e));}
  finally{if(active)setReady(true);}})();
  return()=>{active=false;};
 },[refresh]);
 async function signIn(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError('');setNotice('');
  try{
   const data=await request<{identity:Identity;csrf_token:string}>('/auth/login','POST',login,csrf);
   setIdentity(data.identity);setCsrf(data.csrf_token);
   setLogin({username:'',password:''});
   if(data.identity?.role==='admin')await refresh();
   else setError('Administrator role is required for shared module changes.');
  }catch(e){setError(humanError(e));}
  finally{setBusy(false);}
 }
 async function signOut(){
  setBusy(true);try{await request('/auth/logout','POST',{},csrf);setIdentity(null);setSnapshot(null);setNotice('Signed out.');setError('');}
  catch(e){setError(humanError(e));}
  finally{setBusy(false);}
 }
 async function mutate(path:string,payload:Record<string,unknown>,label:string){
  if(!snapshot||busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   await request(path,'POST',{...payload,expected_revision:snapshot.revision},csrf);
   await refresh();setNotice(label+' — saved on the shared JSON staging server.');
  }catch(e){
   const reason=humanError(e);
   if(reason==='module_state_conflict'){
    try{await refresh();}catch{/* Preserve the last readable snapshot. */}
    setError('Another administrator changed the registry. Updated values loaded; review before retrying.');
   }else setError(reason);
  }finally{setBusy(false);}
 }
 return <section className="module-console" aria-label="Shared JSON module dashboard">
  <div className="page-heading"><div><div className="eyebrow">STAGING OPERATIONS · JSON CONTROL PLANE <span className="demo-pill">AUTHENTICATED</span></div><h1>Shared module controls.</h1><p>Manage 25 module switches on the protected PHP JSON server. No SQL or database required.</p></div></div>
  <p className="page-disclaimer">Only use this console on a protected HTTPS staging host with a same-origin PHP API. Browser-local demo settings never grant access to shared controls. This is not production identity management.</p>
  {error&&<div className="module-warning" role="alert">{error}</div>}
  {notice&&<div className="workspace-notice" role="status">{notice}</div>}
  {!ready?<div className="surface-card module-diagnostics" role="status">Checking staging API access…</div>:
   !identity?<form className="surface-card workspace-form" onSubmit={signIn}>
     <h3><LockKeyhole size={18}/> Staging administrator</h3>
     <label>Username<input autoComplete="username" required maxLength={100} value={login.username} onChange={e=>setLogin(s=>({...s,username:e.target.value}))}/></label>
     <label>Password<input type="password" autoComplete="current-password" required maxLength={200} value={login.password} onChange={e=>setLogin(s=>({...s,password:e.target.value}))}/></label>
     <button type="submit" className="btn btn-primary" disabled={busy||!csrf}>Sign in to shared controls</button>
   </form>:
   identity.role!=='admin'?<div className="surface-card module-diagnostics"><ShieldAlert/><p>Administrator role is required. This account has no module-control permission.</p><button className="btn btn-soft" onClick={signOut}>Sign out</button></div>:
   <><div className="module-controls"><strong><ShieldCheck size={17}/> {identity.name} · admin</strong><button className="btn btn-soft" disabled={busy} onClick={()=>{setError('');refresh().catch(e=>setError(humanError(e)));}}><RefreshCw size={16}/> Refresh</button><button className="btn btn-soft" disabled={busy} onClick={signOut}>Sign out</button></div>
   {snapshot&&<>
    <div className="module-status-grid">
     <div className="surface-card"><CheckCircle2 size={21}/><strong>{snapshot.enabled_count}/25</strong><small>Server enabled</small></div>
     <div className="surface-card"><Activity size={21}/><strong>{snapshot.disabled_count}</strong><small>Server disabled</small></div>
     <div className="surface-card"><ShieldCheck size={21}/><strong>{snapshot.configured?'Ready':'Off'}</strong><small>Private JSON store</small></div>
     <div className="surface-card"><ShieldAlert size={21}/><strong>{snapshot.recovered?'Recovered':'Normal'}</strong><small>Configuration recovery</small></div>
    </div>
    <div className="module-controls"><label className="workspace-search"><input aria-label="Find shared modules" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search shared modules"/></label>
     <button className="btn btn-soft" disabled={busy||!snapshot.configured} onClick={()=>mutate('/admin/module-controls/rollback',{},'Previous configuration restored')}><RotateCcw size={16}/> Roll back last change</button>
     <button className="btn btn-soft" disabled={busy||!snapshot.configured} onClick={()=>mutate('/admin/module-controls/reset',{},'Defaults restored')}>Restore defaults</button>
    </div>
    <div className="module-settings">{snapshot.modules.filter(m=>(m.name+' '+m.category).toLowerCase().includes(query.toLowerCase())).map(m=>
     <article className="surface-card module-setting" key={m.id}><div><span className="section-eyebrow">MODULE {String(m.id).padStart(2,'0')} · {m.category}</span><h3>{m.name}</h3><p>{m.summary}</p>{m.dependencies.length>0&&<small>Depends on {m.dependencies.join(', ')}</small>}</div>
     <label className="module-switch"><input type="checkbox" checked={m.enabled} disabled={busy||!snapshot.configured} onChange={e=>mutate('/admin/module-controls/'+m.id,{enabled:e.target.checked},m.name+(e.target.checked?' enabled':' disabled'))} aria-label={m.name+' shared module enabled'}/><span>{m.enabled?'Enabled':'Disabled'}</span></label></article>
    )}</div>
    <p className="page-disclaimer">Configuration revision: {snapshot.revision.slice(0,12)}… · Only module configuration is reversible. No enquiries, payments or moderation decisions are replayed.</p>
   </>}</>}
 </section>;
}
