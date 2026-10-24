import {useSyncExternalStore} from 'react';
import {defaultFlags,decodeFlags,encodeFlags,isEnabled,transitionFlags,type ModuleFlags} from '../domain/moduleRegistry';
const KEY='krishigo.demo.modules.v1',GOOD=KEY+'.last-good';
let flags:ModuleFlags=defaultFlags,initialized=false,watching=false,lastError='';
const listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(l=>l());
function fromStorage(key:string):ModuleFlags|null{try{const v=window.localStorage.getItem(key);return v?decodeFlags(JSON.parse(v)):null;}catch{return null;}}
function init(){
 if(initialized)return;initialized=true;if(typeof window==='undefined')return;
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
 set(id:number,on:boolean){const next=transitionFlags(snapshot(),id,on);flags=next.flags;save();notify();return next.changed;},
 reset(){flags=defaultFlags;lastError='';save();notify();}
};
export function useModuleFlags():ModuleFlags{return useSyncExternalStore(modulePreferences.subscribe,modulePreferences.snapshot,modulePreferences.snapshot);}
