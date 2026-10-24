import {useSyncExternalStore} from 'react';
import {defaultFlags,decodeFlags,encodeFlags,isEnabled,transitionFlags,moduleDescriptors,type ModuleFlags} from '../domain/moduleRegistry';
const KEY='krishigo.demo.modules.v1',GOOD=KEY+'.last-good';
const SHARED=import.meta.env.VITE_MODULE_CONTROL_MODE==='api';
const disabled:ModuleFlags=Object.freeze(Object.fromEntries(moduleDescriptors.map(m=>[m.id,false])));
let flags:ModuleFlags=SHARED?disabled:defaultFlags,initialized=false,watching=false,lastError='';
let pending:Promise<void>|null=null;
/** Shared staging mode validates all flags and fails closed. Public mock mode never calls fetch. */
async function refreshShared():Promise<void>{
 if(!SHARED||typeof window==='undefined')return;
 if(pending)return pending;
 pending=(async()=>{
  try{
   const base=import.meta.env.VITE_MODULE_API_BASE_URL||'/api/v1';
   const url=new URL(base.replace(/\\/$/,'')+'/modules/registry',window.location.origin);
   if(url.origin!==window.location.origin)throw Error('same_origin_api_required');
   const response=await fetch(url.toString(),{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error('registry_unavailable');
   const doc=await response.json() as {schema?:number;configured?:boolean;modules?:Array<{id:number;enabled:boolean}>};
   if(doc.schema!==1||doc.configured!==true||!Array.isArray(doc.modules)||doc.modules.length!==25)throw Error('invalid_registry');
   const snapshot=decodeFlags({schema:1,flags:Object.fromEntries(doc.modules.map(m=>[m.id,m.enabled]))});
   flags=snapshot;lastError='';notify();
  }catch{
   flags=disabled;lastError='Shared registry cannot be verified; modules are disabled until connectivity is restored.';notify();
  }
 })().finally(()=>{pending=null;});
 return pending;
}
const listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(l=>l());
function fromStorage(key:string):ModuleFlags|null{try{const v=window.localStorage.getItem(key);return v?decodeFlags(JSON.parse(v)):null;}catch{return null;}}
function init(){
 if(initialized)return;initialized=true;if(typeof window==='undefined')return;
 if(SHARED){
  if(!watching){watching=true;
   window.addEventListener('focus',()=>{void refreshShared();});
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshShared();});
  }
  void refreshShared();return;
 }
 if(!watching){watching=true;window.addEventListener('storage',event=>{
 if(event.key!==KEY)return;
 try{flags=event.newValue?decodeFlags(JSON.parse(event.newValue)):defaultFlags;lastError='';}
 catch{lastError='Invalid preferences received; previous configuration retained.';}notify();
 });}
 try{const raw=window.localStorage.getItem(KEY);
 if(raw!==null){try{flags=decodeFlags(JSON.parse(raw));}
 catch{flags=fromStorage(GOOD)??defaultFlags;lastError='Damaged module preferences recovered to a safe demo configuration.';window.localStorage.setItem(KEY,encodeFlags(flags));}}}
 catch{lastError='Storage unavailable; using tab-only defaults.';}
}
function save(){if(typeof window==='undefined')return;try{const data=encodeFlags(flags);window.localStorage.setItem(GOOD,data);window.localStorage.setItem(KEY,data);}catch{lastError='Storage unavailable; using temporary settings.';}}
const snapshot=()=>{init();return flags;};
export const modulePreferences={
 snapshot,subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
 isEnabled(id:number){return isEnabled(snapshot(),id);},error(){return lastError;},
 async refresh(){await refreshShared();},
 set(id:number,on:boolean){if(SHARED)throw Error('server_managed_registry');const next=transitionFlags(snapshot(),id,on);flags=next.flags;save();notify();return next.changed;},
 reset(){if(SHARED)throw Error('server_managed_registry');flags=defaultFlags;lastError='';save();notify();}
};
export function useModuleFlags():ModuleFlags{return useSyncExternalStore(modulePreferences.subscribe,modulePreferences.snapshot,modulePreferences.snapshot);}
