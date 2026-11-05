/** M12 staging-only JSON client. Same-origin, cookie session; no external delivery. */
export type DemoDomain = 'marketplace'|'buyers'|'community'|'plant'|'services'|'editorial';
export const domainFields: Record<DemoDomain, Array<{key:string;label:string;kind?:'number';hint:string}>>={
 marketplace:[{key:'crop',label:'Crop',hint:'Tomato'},{key:'district',label:'District',hint:'Pune'},{key:'grade',label:'Grade',hint:'A'},{key:'quantity_kg',label:'Quantity (kg)',kind:'number',hint:'1000'},{key:'price_per_kg',label:'Price (₹/kg)',kind:'number',hint:'24'}],
 buyers:[{key:'crop',label:'Crop',hint:'Tomato'},{key:'district',label:'District',hint:'Pune'},{key:'quantity_kg',label:'Quantity (kg)',kind:'number',hint:'500'}],
 community:[{key:'topic',label:'Topic',hint:'Soil moisture'},{key:'body',label:'Discussion',hint:'Field observation; no expert verification'}],
 plant:[{key:'crop',label:'Crop',hint:'Tomato'},{key:'district',label:'District',hint:'Pune'},{key:'symptoms',label:'Observation (not diagnosis)',hint:'Describe the observed symptoms'}],
 services:[{key:'service_type',label:'Service category',hint:'Tractor rental'},{key:'district',label:'District',hint:'Pune'},{key:'description',label:'Request details',hint:'Fictional service request'}],
 editorial:[{key:'title',label:'Headline',hint:'Draft agricultural update'},{key:'summary',label:'Summary',hint:'Requires official source verification'},{key:'category',label:'Category: News / Guide / Scheme / Learning',hint:'News'}]
};
export type ModuleDraftField={key:string;label:string;type:'text'|'integer'|'date'|'enum'|'https_url';max?:number;options?:string[];example:string|number};
export type ModuleDraftSchema={schema:1;module_id:number;staging_only:true;delivery_enabled:false;purpose:string;roles:string[];fields:ModuleDraftField[]};
export type DemoIdentity = {name:string;role:string;demo:boolean}|null;
export type DemoRecord={id:number;owner:string;status:string;fields:Record<string,string|number>;created_at:string};
export type QueueJob={id:number;kind:string;status:string;attempts:number;max_attempts:number;created_at:string;result?:Record<string,unknown>;last_error?:string};
export type QueueHealth={ok:boolean;database:'none';counts:Record<string,number>;recovered:boolean};
const base=(import.meta.env.VITE_JSON_API_BASE_URL||'/api/v1').replace(/\/$/,'');
function url(path:string){const value=new URL(base+path,window.location.origin);if(value.origin!==window.location.origin)throw new Error('same_origin_required');return value.toString();}
export class JsonStagingClient {
 private csrf='';
 private async call<T>(method:string,path:string,body?:Record<string,unknown>,key=''):Promise<T>{
  const response=await fetch(url(path),{
   method,credentials:'same-origin',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000),
   headers:{Accept:'application/json',...(body?{'Content-Type':'application/json','X-CSRF-Token':this.csrf}:{}),...(key?{'Idempotency-Key':key}:{})},
   ...(body?{body:JSON.stringify(body)}:{})
  });
  const data=await response.json().catch(()=>({error:'invalid_api_response'})) as Record<string,unknown>;
  if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'HTTP '+response.status);
  return data as T;
 }
 async initialize(){const a=await this.call<{csrf_token:string}>('GET','/auth/csrf');this.csrf=a.csrf_token;}
 async identity(){return this.call<{identity:DemoIdentity}>('GET','/auth/me');}
 async login(username:string,password:string){
  const r=await this.call<{identity:DemoIdentity;csrf_token:string}>('POST','/auth/login',{username,password});
  this.csrf=r.csrf_token;return r.identity;
 }
 async logout(){await this.call('POST','/auth/logout',{});this.csrf='';await this.initialize();}
 async records(domain:DemoDomain,mine=false){
  return this.call<{demo:boolean;items:DemoRecord[]}>('GET',`/staging/records/${domain}${mine?'?mine=1':''}`);
 }
 async create(domain:DemoDomain,fields:Record<string,unknown>){
  return this.call<{demo:boolean;item:DemoRecord;replayed:boolean}>('POST',`/staging/records/${domain}`,fields,crypto.randomUUID());
 }
 /** Match only moderated sample lots; no enquiry or communication is triggered. */
 async matches(crop:string,district:string,quantityKg:number){
  const params=new URLSearchParams({crop,district,quantity_kg:String(quantityKg)});
  return this.call<{demo:boolean;matched:number;items:DemoRecord[];enquiries_sent:false}>('GET','/staging/marketplace/matches?'+params.toString());
 }
 async moduleSchema(moduleId:number){return this.call<ModuleDraftSchema>('GET',`/staging/module-drafts/${moduleId}/schema`);}
 async moduleDrafts(moduleId:number){return this.call<{demo:true;private:true;items:DemoRecord[]}>('GET',`/staging/module-drafts/${moduleId}`);}
 async saveModuleDraft(moduleId:number,title:string,note:string,details:Record<string,string|number>){
  return this.call<{demo:true;private:true;item:DemoRecord}>('POST',`/staging/module-drafts/${moduleId}`,{title,note,details},crypto.randomUUID());
 }
 async pending(domain:DemoDomain){return this.call<{pending:DemoRecord[]}>('GET',`/staging/admin/records/${domain}`);}
 async decide(domain:DemoDomain,id:number,decision:'approve'|'reject'){
  return this.call<{item:DemoRecord}>('POST',`/staging/admin/records/${domain}/${id}/review`,{decision});
 }
 async inputCapabilities(){return this.call<{staging_only:true;collections:string[];real_ocr:false;generative_ai:false;verified_external_feeds:false}>('GET','/staging/inputs/capabilities');}
 async inputSchemas(){return this.call<{staging_only:true;schemas:Record<string,{fields:Array<{key:string;label:string;type:string;max:number;options:string[]|null}>;private:boolean;create_allowed:boolean}>}>('GET','/staging/inputs/schemas');}
 async inputList(kind:string,mine:boolean){return this.call<{staging_only:true;items:DemoRecord[];private:boolean}>('GET','/staging/inputs/records/'+encodeURIComponent(kind)+(mine?'?mine=1':''));}
 async inputCreate(kind:string,fields:Record<string,string>){return this.call<{staging_only:true;item:DemoRecord;external_publication:false}>('POST','/staging/inputs/records/'+encodeURIComponent(kind),fields,crypto.randomUUID());}
 async inputPending(kind:string){return this.call<{staging_only:true;pending:DemoRecord[]}>('GET','/staging/inputs/admin/'+encodeURIComponent(kind));}
 async inputReview(kind:string,id:number,decision:'approve'|'reject',reason:string){return this.call<{staging_only:true;item:DemoRecord;regulatory_certification:false}>('POST','/staging/inputs/admin/'+encodeURIComponent(kind)+'/'+id+'/review',{decision,reason});}
 async inputSearch(q:string,assistant=false){return this.call<{staging_only:true;results:Array<{kind:string;id:number;title:string;summary:string;source_url:string;source_date:string;status:string}>;answer:string;generative_ai:false}>('GET','/staging/inputs/'+(assistant?'assistant':'search')+'?q='+encodeURIComponent(q));}
 async inputAlerts(batch:string){return this.call<{staging_only:true;matches:Array<{status:string;fields:Record<string,string>}>;official_recall_feed_connected:false;notifications_sent:false}>('GET','/staging/inputs/alerts?batch='+encodeURIComponent(batch));}
  async inputWatchAlerts(){return this.call<{staging_only:true;alerts:Array<{watch_id:number;recall:Record<string,string>;reviewed_demo:true}>;in_app_only:true;email_sent:false;whatsapp_sent:false}>('GET','/staging/inputs/watch-alerts');}
 async inputRegulatoryUpdates(since=''){return this.call<{staging_only:true;updates:Array<{id:number;fields:Record<string,string>;status:string}>;live_source_monitoring:false}>('GET','/staging/inputs/regulatory-updates'+(since?'?since='+encodeURIComponent(since):''));}
 async inputDeleteWatch(id:number){return this.call<{deleted:true}>('DELETE','/staging/inputs/records/watches/'+id,{});}
  async doctor(){return this.call<{schema:number;ok:boolean;status:'healthy'|'attention';checks:Array<{id:string;severity:'ok'|'attention'|'critical';message:string}>;summary:{diagnostic_domains:number;enabled_diagnostic_domains:number;restored_snapshots:number;queue_pending:number;queue_failed:number;queue_dead:number;available_private_storage_mb:number|null};database:'none';generated_at:string}>('GET','/staging/operations/doctor');}
 async health(){return this.call<{domains:Record<string,{records:number;pending:number;enabled:boolean;recovered:boolean}>;database:string}>('GET','/staging/workflows/health');}
 async queue(){return this.call<{items:QueueJob[];health:QueueHealth}>('GET','/staging/jobs');}
 async enqueue(domain:DemoDomain){return this.call('POST','/staging/jobs',{kind:'domain_snapshot',domain});}
 async process(){return this.call('POST','/staging/jobs/process',{});}
 async recover(){return this.call('POST','/staging/jobs/recover',{});}
}
export const jsonStagingClient=new JsonStagingClient();
