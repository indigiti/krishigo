/** Same-origin, session-cookie API client. Imported only in explicitly configured API mode. */
export type Identity = { id: number; display_name: string; email: string; role: string; status: string; verified_at: string | null };
export type LiveRecord = { id: number; status?: string; crop?: string; district?: string; quantity_kg?: string; price_per_kg?: string; target_price_per_kg?: string; topic?: string; body?: string; symptoms?: string; growth_stage?: string; description?: string; message?: string; seller?: string; created_at?: string; [key: string]: unknown };
export type WorkspaceArea = 'marketplace/listings' | 'buyers/requirements' | 'community/posts' | 'plant-cases' | 'enquiries';
const base = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const safe = (area: WorkspaceArea) => area;

export type SourceRecord={id:string;title:string;publisher:string;source_url:string;jurisdiction:string;status?:string;published_on?:string;created_at?:string};
export type KnowledgeArticle={id:string;title:string;crop:string;topic:string;language:string;summary:string;revision:number;source_title?:string;source_url?:string;publisher?:string};
export type PlatformQuote={id:string;enquiry_id:number;listing_id:number;quantity_kg:string;total_inr:string;terms:string;status:string;expires_at:string;buyer_id:number;seller_id:number};
export type PlatformOrder={id:string;quote_id:string;status:string;quantity_kg:string;total_inr:string;terms:string};
export type PlatformNotice={id:string;topic:string;title:string;description:string;status:string;created_at:string};
export type PlatformCapabilities={schema_revision:number;platform_candidate:boolean;source_review:boolean;real_ocr:boolean;generative_ai:boolean;whatsapp_delivery:boolean;payments:boolean;[key:string]:boolean|number};

export class ProductionApiClient {
  private csrf = '';
  private async call<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${base}/${path.replace(/^\//, '')}`, {
      method, credentials: 'include', redirect: 'error',
      headers: { 'Accept': 'application/json', ...(body ? { 'Content-Type': 'application/json', 'X-CSRF-Token': this.csrf } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000)
    });
    const json = await res.json().catch(() => ({})) as Record<string, unknown>;
    if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error.replaceAll('_', ' ') : `Request failed (${res.status})`);
    return json as T;
  }
  async initialize() { const result = await this.call<{csrf_token:string}>('GET', 'auth/csrf'); this.csrf = result.csrf_token; }
  async identity() { return this.call<{identity:Identity|null}>('GET','auth/me'); }
  async register(details: Record<string,unknown>) { return this.call<{id:number;verified:boolean}>('POST','auth/register',details); }
  async login(email: string,password:string) {
    const result = await this.call<{identity:Identity; csrf_token:string}>('POST','auth/login',{email,password});
    this.csrf=result.csrf_token;
    return result.identity;
  }
  async logout() { const value = await this.call<{ok:boolean}>('POST','auth/logout',{}); await this.initialize(); return value; }
  async list(area: WorkspaceArea, mine=false): Promise<LiveRecord[]> { return this.call('GET', `${safe(area)}${mine?'/mine':''}`); }
  async create(area: WorkspaceArea, fields: Record<string,unknown>) { return this.call<{id:number;status:string}>('POST',safe(area),fields); }
  async reviewQueue() { return this.call<{items:Array<{id:number;type:string;status:string}>}>('GET','admin/review-cases'); }
  async review(type: 'listing'|'requirement'|'post',id:number,decision:'approve'|'reject',reason:string) {
    return this.call('POST',`admin/review-cases/${type}/${id}/decision`,{decision,reason});
  }

  // M20–M25: all mutations stay same-origin and use the authenticated CSRF session.
  async platformCapabilities(){return this.call<PlatformCapabilities>('GET','platform/capabilities');}
  async sources(){return this.call<{items:SourceRecord[]}>('GET','knowledge/sources');}
  async knowledge(language='en',crop=''){return this.call<{items:KnowledgeArticle[]}>('GET',
    'knowledge/articles?language='+encodeURIComponent(language)+'&crop='+encodeURIComponent(crop));}
  async stagedSources(){return this.call<{items:SourceRecord[]}>('GET','editor/knowledge/sources');}
  async createSource(fields:Record<string,unknown>){return this.call<{id:string;status:string}>('POST','editor/knowledge/sources',fields);}
  async decideSource(id:string,decision:'approve'|'reject',reason:string){return this.call<{id:string;status:string}>('POST','editor/knowledge/sources/'+encodeURIComponent(id)+'/review',{decision,reason});}
  async stagedArticles(){return this.call<{items:KnowledgeArticle[]}>('GET','editor/knowledge/articles');}
  async createArticle(fields:Record<string,unknown>){return this.call<{id:string;status:string;revision:number}>('POST','editor/knowledge/articles',fields);}
  async decideArticle(id:string,decision:'approve'|'reject',reason:string){return this.call<{id:string;status:string}>('POST','editor/knowledge/articles/'+encodeURIComponent(id)+'/review',{decision,reason});}
  async snapshots(domain:string){return this.call<{items:Array<{id:string;domain:string;label:string;payload:Record<string,unknown>;observed_at:string;valid_until:string;source_url:string}>;connector_live:boolean}>('GET','data/snapshots?domain='+encodeURIComponent(domain));}
  async stagedSnapshots(){return this.call<{items:Array<{id:string;domain:string;label:string;status:string}>}>('GET','editor/data/snapshots');}
  async createSnapshot(fields:Record<string,unknown>){return this.call<{id:string;status:string}>('POST','editor/data/snapshots',fields);}
  async decideSnapshot(id:string,decision:'approve'|'reject',reason:string){return this.call<{id:string;status:string}>('POST','editor/data/snapshots/'+encodeURIComponent(id)+'/review',{decision,reason});}
  async farmProfile(){return this.call<{profile:{district:string;crop_focus:string;preferred_language:string}|null}>('GET','me/farm-profile');}
  async saveFarmProfile(fields:{district:string;crop_focus:string;preferred_language:string}){return this.call<{stored:boolean}>('PUT','me/farm-profile',fields);}
  async supplierProfile(){return this.call<{profile:{id:string;business_name:string;district:string;status:string}|null}>('GET','suppliers/profile');}
  async createSupplier(fields:Record<string,unknown>){return this.call<{id:string;status:string}>('POST','suppliers/profile',fields);}
  async suppliersPending(){return this.call<{items:Array<{id:string;business_name:string;district:string;license_reference:string}>}>('GET','admin/suppliers');}
  async decideSupplier(id:string,decision:'approve'|'reject',reason:string){return this.call<{status:string}>('POST','admin/suppliers/'+id+'/review',{decision,reason});}
  async quotes(){return this.call<{items:PlatformQuote[]}>('GET','trade/quotes/mine');}
  async createQuote(fields:Record<string,unknown>){return this.call<{id:string;status:string}>('POST','trade/quotes',fields);}
  async decideQuote(id:string,decision:'accept'|'reject'){return this.call<{status:string;order_id:string|null}>('POST','trade/quotes/'+id+'/decision',{decision});}
  async orders(){return this.call<{items:PlatformOrder[]}>('GET','trade/orders/mine');}
  async confirmOrder(id:string){return this.call<{status:string}>('POST','trade/orders/'+id+'/confirm',{});}
  async assistantSearch(q:string){return this.call<{matches:KnowledgeArticle[];answer:string;generative_ai:false}>('GET','assistant/search?q='+encodeURIComponent(q));}
  async agronomyCases(){return this.call<{items:Array<{id:string;crop:string;kind:string;observation:string;status:string}>}>('GET','agronomy/mine');}
  async createAgronomy(fields:Record<string,unknown>){return this.call<{id:string;status:string;ocr_processed:false}>('POST','agronomy/intake',fields);}
  async notificationPreferences(){return this.call<{items:Array<{topic:string;channel:string;opted_in:number}>}>('GET','me/notification-preferences');}
  async changeNotificationPreference(topic:string,opted_in:boolean){return this.call<{topic:string;opted_in:boolean}>('PUT','me/notification-preferences',{topic,channel:'in_app',opted_in});}
  async notificationEvents(){return this.call<{items:PlatformNotice[]}>('GET','me/notification-events');}
}
export const productionClient = new ProductionApiClient();
