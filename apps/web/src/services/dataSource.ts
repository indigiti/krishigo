import { listings, posts, type Listing, type CommunityPost } from '../data/demo';
import { buyerRequirements, farmServices, contentEntries, scopeModules, type BuyerRequirement, type FarmService, type ContentEntry, type ScopeModule } from '../data/expanded';

/** The legacy demo screens intentionally retain their original fixture contracts. */
export interface KrishiGoDataSource {
  listings(): Promise<Listing[]>;
  communityPosts(): Promise<CommunityPost[]>;
  buyerRequirements(): Promise<BuyerRequirement[]>;
  farmServices(): Promise<FarmService[]>;
  contentEntries(): Promise<ContentEntry[]>;
  scopeModules(): Promise<ScopeModule[]>;
}
/** No persistence, credentials or network operations in legacy demo workspaces. */
const mockSource: KrishiGoDataSource = {
  async listings() { return structuredClone(listings); },
  async communityPosts() { return structuredClone(posts); },
  async buyerRequirements() { return structuredClone(buyerRequirements); },
  async farmServices() { return structuredClone(farmServices); },
  async contentEntries() { return structuredClone(contentEntries); },
  async scopeModules() { return structuredClone(scopeModules); }
};

/** API mode enables a separate connected workspace. It does not silently reinterpret demo DTOs. */
export const isDemo = import.meta.env.VITE_DATA_MODE !== 'api';
export const dataSource: KrishiGoDataSource = mockSource;
