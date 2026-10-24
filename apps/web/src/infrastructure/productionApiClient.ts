/** Same-origin, session-cookie API client. Imported only in explicitly configured API mode. */
export type Identity = { id: number; display_name: string; email: string; role: string; status: string; verified_at: string | null };
export type LiveRecord = { id: number; status?: string; crop?: string; district?: string; quantity_kg?: string; price_per_kg?: string; target_price_per_kg?: string; topic?: string; body?: string; symptoms?: string; growth_stage?: string; description?: string; message?: string; seller?: string; created_at?: string; [key: string]: unknown };
export type WorkspaceArea = 'marketplace/listings' | 'buyers/requirements' | 'community/posts' | 'plant-cases' | 'enquiries';
const base = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const safe = (area: WorkspaceArea) => area;

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
}
export const productionClient = new ProductionApiClient();
