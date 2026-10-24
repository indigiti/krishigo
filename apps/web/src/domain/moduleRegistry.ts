import registry from '../config/module-registry.json';
export type ModuleDescriptor={id:number;key:string;name:string;category:string;phase:number;summary:string;enabled:boolean;dependencies:number[];mode:'demo'};
export type ModuleFlags=Readonly<Record<number,boolean>>;
export const moduleDescriptors:readonly ModuleDescriptor[]=Object.freeze((registry.modules as ModuleDescriptor[]).map(m=>Object.freeze({...m,dependencies:[...m.dependencies]})));
const byId=new Map(moduleDescriptors.map(m=>[m.id,m]));
export const defaultFlags:ModuleFlags=Object.freeze(Object.fromEntries(moduleDescriptors.map(m=>[m.id,m.enabled])));
export function isEnabled(flags:ModuleFlags,id:number):boolean {const m=byId.get(id);return Boolean(m&&flags[id]&&m.dependencies.every(d=>isEnabled(flags,d)));}
export function transitionFlags(flags:ModuleFlags,id:number,enabled:boolean){
 if(!byId.has(id)||typeof enabled!=='boolean')throw Error('invalid_module');
 const next:Record<number,boolean>={...flags};
 if(enabled){if(byId.get(id)!.dependencies.some(dep=>!isEnabled(next,dep)))throw Error('dependency_required');next[id]=true;}
 else{next[id]=false;let repeat=true;while(repeat){repeat=false;for(const m of moduleDescriptors)if(next[m.id]&&m.dependencies.some(d=>!next[d])){next[m.id]=false;repeat=true;}}}
 return {flags:Object.freeze(next),changed:moduleDescriptors.filter(m=>flags[m.id]!==next[m.id]).map(m=>m.id)};
}
export function decodeFlags(input:unknown):ModuleFlags{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('invalid_flags');
 const r=input as Record<string,unknown>,v=r.flags;
 if(r.schema!==1||!v||typeof v!=='object'||Array.isArray(v))throw Error('invalid_schema');
 const source=v as Record<string,unknown>,res:Record<number,boolean>={};
 if(Object.keys(source).length!==25)throw Error('invalid_count');
 for(const m of moduleDescriptors){if(typeof source[m.id]!=='boolean')throw Error('invalid_value');res[m.id]=source[m.id] as boolean;}
 for(const m of moduleDescriptors)if(res[m.id]&&m.dependencies.some(d=>!res[d]))throw Error('dependency_disabled');
 return Object.freeze(res);
}
export const encodeFlags=(flags:ModuleFlags)=>JSON.stringify({schema:1,flags});
