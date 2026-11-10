import {useEffect,useState} from 'react';
import {ShieldCheck,RefreshCcw,LockKeyhole} from 'lucide-react';
import {productionClient,type ProductionModuleFlag} from '../infrastructure/productionApiClient';
import {moduleDescriptors} from '../domain/moduleRegistry';

/** Server-enforced production policy: not localStorage, not JSON staging flags. */
export default function ProductionModuleControls(){
 const [rows,setRows]=useState<ProductionModuleFlag[]>([]);
 const [history,setHistory]=useState<Array<{id:string;module_id:number;cause_module_id:number;actor:string;old_enabled:number;new_enabled:number;created_at:string}>>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
 async function refresh(){
  const [data,events]=await Promise.all([productionClient.productionModules(),productionClient.productionModuleEvents()]);
  if(data.items.length!==25)throw new Error('Production policy is incomplete: access is blocked.');
  setRows(data.items);setHistory(events.items.slice(0,10));
 }
 useEffect(()=>{let active=true;void Promise.all([productionClient.productionModules(),productionClient.productionModuleEvents()])
  .then(([data,events])=>{if(active){if(data.items.length!==25)throw new Error('Incomplete production policy');
    setRows(data.items);setHistory(events.items.slice(0,10));}})
  .catch(e=>{if(active)setError(String(e));});
  return()=>{active=false;};
 },[]);
 async function toggle(item:ProductionModuleFlag){
  if(busy)return;
  if(!window.confirm(item.enabled?
    'Disable this production module and any dependent modules? Active workflows will be blocked.':
    'Enable this production module on the PHP API? This does not activate any external provider.'))return;
  setBusy(true);setError('');setNote('');
  try{const result=await productionClient.updateProductionModule(item.module_id,!item.configured_enabled,item.revision);
   await refresh();
   window.dispatchEvent(new Event('krishigo-production-policy-changed'));
   setNote(result.changed.length?
    'Production policy updated for modules: '+result.changed.join(', '):
    'No change required.');
  }catch(e){setError(e instanceof Error?e.message:'Policy update failed');}
  finally{setBusy(false);}
 }
 return <section className="surface-card production-panel" aria-label="Server-enforced production modules">
  <div className="section-head"><div><h3><ShieldCheck size={18}/> Production module authorization</h3>
    <p>Changes are committed to MySQL, checked on PHP routes, audited and revision-protected.</p></div>
   <button type="button" className="btn btn-soft" disabled={busy} onClick={()=>void refresh().catch(e=>setError(String(e)))}><RefreshCcw size={15}/> Reload</button>
  </div>
  <p className="page-disclaimer"><LockKeyhole size={15}/> This is NOT the browser-local demo registry. Disabling a parent closes dependent routes.
   Enabling a module does not create official market feeds, payments, licensing, OCR or delivery capabilities.</p>
  {error&&<p role="alert" className="workspace-notice">{error}</p>}
  {note&&<p role="status" className="workspace-notice">{note}</p>}
  {rows.length===0&&!error&&<p role="status">Loading server policy…</p>}
  <div className="module-settings">
   {rows.map(item=><div className="module-setting" key={item.module_id}>
     <div><strong>Module {String(item.module_id).padStart(2,'0')} · {moduleDescriptors.find(m=>m.id===item.module_id)?.name||'Unknown module'}</strong>
      <small>Revision {item.revision}{item.depends_on.length?' · Requires '+item.depends_on.join(', '):''}</small>
     </div>
     <button type="button" className="btn btn-soft" disabled={busy} aria-label={'Toggle production module '+item.module_id}
      onClick={()=>void toggle(item)}>{item.enabled?'Enabled · disable':'Disabled · enable'}</button>
    </div>)}
  </div>
  <h4>Recent production policy events</h4>
  {history.length===0?<p>No changes recorded.</p>:history.map(event=>
    <article className="production-record" key={event.id}>
      <strong>Module {event.module_id} · {event.new_enabled?'Enabled':'Disabled'}</strong>
      <small>Triggered by module {event.cause_module_id} · {event.actor} · {event.created_at}</small>
    </article>)}
 </section>;
}
