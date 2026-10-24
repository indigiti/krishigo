import {useMemo,useState} from 'react';
import {CheckCircle2,RotateCcw,ShieldCheck,Activity,Power,Search} from 'lucide-react';
import {moduleDescriptors,isEnabled} from '../domain/moduleRegistry';
import {modulePreferences,useModuleFlags} from '../infrastructure/modulePreferences';
import {diagnostics,useDiagnostics} from '../infrastructure/diagnostics';
export default function ModuleControlPanel(){
 const flags=useModuleFlags(),events=useDiagnostics();
 const [search,setSearch]=useState(''),[status,setStatus]=useState('All'),[notice,setNotice]=useState('');
 const enabled=moduleDescriptors.filter(m=>isEnabled(flags,m.id)).length;
 const visible=useMemo(()=>moduleDescriptors.filter(m=>(m.name+' '+m.category).toLowerCase().includes(search.toLowerCase())&&(status==='All'||(status==='Enabled'?isEnabled(flags,m.id):!isEnabled(flags,m.id)))),[search,status,flags]);
 const change=(id:number,on:boolean)=>{try{const ids=modulePreferences.set(id,on);diagnostics.record(on?'module_enabled':'module_disabled','registry','info');setNotice(ids.length+' module(s) changed in this browser preview. No other users or servers were changed.');}
 catch{diagnostics.record('module_dependency_rejected','registry','warning');setNotice('Enable prerequisite modules before activating this module.');}};
 return <section className="module-console" aria-label="Module control dashboard">
 <div className="page-heading"><div><div className="eyebrow">OPERATIONS · MODULE CONTROL <span className="demo-pill">LOCAL STAGING PREVIEW</span></div><h1>Modular control center.</h1><p>Enable and disable all 25 demo modules without a database.</p></div></div>
 <div className="module-status-grid"><div className="surface-card"><CheckCircle2 size={21}/><strong>{enabled}/25</strong><small>Enabled</small></div><div className="surface-card"><Power size={21}/><strong>{25-enabled}</strong><small>Disabled</small></div><div className="surface-card"><Activity size={21}/><strong>{events.filter(e=>e.severity==='error').length}</strong><small>Local errors</small></div><div className="surface-card"><ShieldCheck size={21}/><strong>No DB</strong><small>JSON preview</small></div></div>
 {modulePreferences.error()&&<p className="module-warning" role="alert">{modulePreferences.error()}</p>}
 {notice&&<div className="workspace-notice" role="status">{notice}</div>}
 <div className="module-controls"><label className="workspace-search"><Search size={17}/><input aria-label="Search modules to manage" placeholder="Find modules" value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="Filter modules by status" value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Enabled</option><option>Disabled</option></select><button className="btn btn-soft" onClick={()=>{modulePreferences.reset();setNotice('Factory defaults restored in this browser only.');}}><RotateCcw size={15}/> Restore defaults</button></div>
 <div className="module-settings">{visible.map(m=><div className="surface-card module-setting" key={m.id}><div><span className="section-eyebrow">MODULE {String(m.id).padStart(2,'0')} · {m.category.toUpperCase()}</span><h3>{m.name}</h3><p>{m.summary}</p>{m.dependencies.length>0&&<small>Requires module(s) {m.dependencies.join(', ')}</small>}</div><label className="module-switch"><input type="checkbox" checked={isEnabled(flags,m.id)} onChange={e=>change(m.id,e.target.checked)} aria-label={m.name+' module enabled'}/><span>{isEnabled(flags,m.id)?'Enabled':'Disabled'}</span></label></div>)}</div>
 {!visible.length&&<p className="studio-empty">No matching modules.</p>}
 <div className="surface-card module-diagnostics"><div className="section-head"><div><span className="section-eyebrow">OBSERVABILITY · LOCAL</span><h3>Safe recovery and error management</h3></div><button className="btn btn-soft" onClick={()=>diagnostics.clear()}>Clear log</button></div><p>Failed screens can be retried. Local configuration restores from a validated snapshot; no external service is automatically restarted.</p><div role="log" className="module-log">{events.length===0?<small>No UI errors recorded.</small>:events.slice().reverse().slice(0,12).map(e=><div key={e.id}><small>{e.at.slice(11,19)} UTC</small><strong>{e.code}</strong><span>{e.area} · {e.severity}</span></div>)}</div></div>
 <p className="page-disclaimer">These public staging controls are browser-only, not privileged authentication. Shared module activation requires the secured PHP admin API.</p></section>;
}
