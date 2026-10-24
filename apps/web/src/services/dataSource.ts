import { listings, posts, type Listing, type CommunityPost } from '../data/demo';
import { buyerRequirements, farmServices, contentEntries, scopeModules, type BuyerRequirement, type FarmService, type ContentEntry, type ScopeModule } from '../data/expanded';

/** The UI depends on this interface, not on MySQL, HTTP or Python implementations. */
export interface KrishiGoDataSource {
  listings(): Promise<Listing[]>;
  communityPosts(): Promise<CommunityPost[]>;
  buyerRequirements(): Promise<BuyerRequirement[]>;
  farmServices(): Promise<FarmService[]>;
  contentEntries(): Promise<ContentEntry[]>;
  scopeModules(): Promise<ScopeModule[]>;
}

/** No persistence, credentials or network operations in staging mock mode. */
const mockSource: KrishiGoDataSource = {
  async listings() { return structuredClone(listings); },
  async communityPosts() { return structuredClone(posts); },
  async buyerRequirements() { return structuredClone(buyerRequirements); },
  async farmServices() { return structuredClone(farmServices); },
  async contentEntries() { return structuredClone(contentEntries); },
  async scopeModules() { return structuredClone(scopeModules); }
};

const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'include', headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<T>;
}
/** These endpoints are CONTRACTS ONLY; the secure PHP endpoints are not built yet. */
const apiSource: KrishiGoDataSource = {
  listings: () => apiGet<Listing[]>('/marketplace/listings'),
  communityPosts: () => apiGet<CommunityPost[]>('/community/posts'),
  buyerRequirements: () => apiGet<BuyerRequirement[]>('/buyers/requirements'),
  farmServices: () => apiGet<FarmService[]>('/services'),
  contentEntries: () => apiGet<ContentEntry[]>('/content'),
  scopeModules: () => apiGet<ScopeModule[]>('/modules')
};
export const isDemo = import.meta.env.VITE_DATA_MODE !== 'api';
export const dataSource: KrishiGoDataSource = isDemo ? mockSource : apiSource;
