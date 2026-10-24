import {useSyncExternalStore} from 'react';
export type HealthEvent={id:number;at:string;code:string;area:string;severity:'info'|'warning'|'error'};
let entries:readonly HealthEvent[]=Object.freeze([]),next=0;
const listeners=new Set<()=>void>();
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
const read=()=>entries;
export const diagnostics={
 record(code:string,area:string,severity:HealthEvent['severity']='error'){
 const sanitize=(s:string)=>s.replace(/[^a-zA-Z0-9_.:-]/g,'_').slice(0,64);
 entries=Object.freeze([...entries.slice(-49),{id:++next,at:new Date().toISOString(),code:sanitize(code),area:sanitize(area),severity}]);listeners.forEach(l=>l());
 },clear(){entries=Object.freeze([]);listeners.forEach(l=>l());}
};
export const useDiagnostics=()=>useSyncExternalStore(subscribe,read,read);
