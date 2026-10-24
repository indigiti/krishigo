/** Fictional, deliberately non-actionable staging fixtures. Never present as live market data. */
export type BuyerRequirement = {
  id: number; commodity: string; quantityTonnes: number; district: string;
  grade: string; neededBy: string; buyer: string; status: 'Sample' | 'Draft';
};
export type FarmService = {
  id: number; category: string; name: string; district: string;
  description: string; icon: string;
};
export type ContentEntry = {
  id: number; kind: 'News' | 'Scheme' | 'Guide' | 'Learning'; title: string;
  summary: string; crop: string; source: string; updated: string;
};
export type ScopeModule = { id: number; name: string; category: string; phase: 1 | 2 | 3; summary: string };
export const buyerRequirements: BuyerRequirement[] = [
  { id: 201, commodity: 'Tomato', quantityTonnes: 6, district: 'Pune', grade: 'A / assorted', neededBy: 'Sample window', buyer: 'Example Fresh Retail', status: 'Sample' },
  { id: 202, commodity: 'Onion', quantityTonnes: 12, district: 'Nashik', grade: 'Export grade', neededBy: 'Sample window', buyer: 'Example FPO Buyers', status: 'Sample' },
  { id: 203, commodity: 'Soybean', quantityTonnes: 18, district: 'Latur', grade: 'FAQ specification', neededBy: 'Sample window', buyer: 'Example Grain Processors', status: 'Sample' },
  { id: 204, commodity: 'Chilli', quantityTonnes: 3, district: 'Kolhapur', grade: 'Fresh', neededBy: 'Sample window', buyer: 'Example Farm Stores', status: 'Sample' },
];
export const farmServices: FarmService[] = [
  { id: 1, category: 'Machinery', name: 'Tractor & implement rentals', district: 'Pune', description: 'Compare rental options, duration and operator requirements.', icon: '🚜' },
  { id: 2, category: 'Transport', name: 'Farm produce transport', district: 'Nashik', description: 'Request pickup quotes for harvest batches.', icon: '🚚' },
  { id: 3, category: 'Storage', name: 'Cold storage & warehousing', district: 'Satara', description: 'Explore storage type, temperatures and enquiry requirements.', icon: '📦' },
  { id: 4, category: 'Testing', name: 'Soil testing services', district: 'Pune', description: 'Compare soil sampling and laboratory result workflows.', icon: '🧪' },
  { id: 5, category: 'Inputs', name: 'Seeds & supplies directory', district: 'Solapur', description: 'Find business listings with future licence verification.', icon: '🌱' },
  { id: 6, category: 'Labour', name: 'Seasonal farm support', district: 'Ahmednagar', description: 'Post service requirements and arrange direct enquiries.', icon: '👷' },
  { id: 7, category: 'Business', name: 'FPO aggregation desk', district: 'Nashik', description: 'Group harvest availability and procurement leads.', icon: '🏢' },
  { id: 8, category: 'Export', name: 'Export readiness advice', district: 'Mumbai', description: 'Review illustrative quality and document checklists.', icon: '🌍' },
];
export const contentEntries: ContentEntry[] = [
  { id: 1, kind: 'Guide', title: 'Photographing a crop problem effectively', summary: 'Capture entire plants, leaf undersides, nearby plants and field conditions before asking for help.', crop: 'All crops', source: 'KrishiGo educational draft', updated: 'Draft / undated' },
  { id: 2, kind: 'Guide', title: 'Before selling a tomato harvest', summary: 'Record variety, quantity, grade, packing and pickup conditions before contacting buyers.', crop: 'Tomato', source: 'KrishiGo editorial draft', updated: 'Draft / undated' },
  { id: 3, kind: 'Learning', title: 'Understanding integrated pest management', summary: 'A draft lesson framework covering observation, prevention, monitoring and expert escalation.', crop: 'All crops', source: 'Editorial outline only', updated: 'Draft / undated' },
  { id: 4, kind: 'News', title: 'Agriculture news desk preview', summary: 'Placeholder for sourced, timestamped and editor-verified news; no current news is represented here.', crop: 'General', source: 'No live news source', updated: 'Sample only' },
  { id: 5, kind: 'Scheme', title: 'Government scheme explorer', summary: 'Prototype of eligibility checks, official source links and application-document requirements.', crop: 'General', source: 'No verified programme imported', updated: 'Sample only' },
  { id: 6, kind: 'Learning', title: 'Commodity grading checklist', summary: 'Draft inspection categories for quality, moisture, transport readiness and declared grade.', crop: 'All crops', source: 'KrishiGo editorial draft', updated: 'Draft / undated' },
];
export const scopeModules: ScopeModule[] = [
 ['Mandi Prices','Insights',1,'APMC quotations, data freshness and regional comparisons'],
 ['Buy & Sell Marketplace','Market',1,'Farmer listings, quantities, images and enquiries'],
 ['Buyer Requirements','Market',1,'Procurement requests, filters and matching'],
 ['Farmer Community','Circle',1,'Crop groups, posts and moderated replies'],
 ['Agriculture News','Learn',1,'Verified, sourced agricultural reporting'],
 ['Weather & Alerts','Insights',1,'Location-based forecasts and warnings'],
 ['Farming Knowledge','Learn',1,'Cultivation guides and safe field practices'],
 ['Government Schemes','Learn',1,'Eligibility, documentation and official links'],
 ['Machinery Marketplace','Services',2,'New and used implements and equipment'],
 ['Equipment Rentals','Services',2,'Tractors, harvesters and tools to hire'],
 ['Agricultural Inputs','Services',2,'Business directory for seeds and farm supplies'],
 ['Transport & Logistics','Services',2,'Transport quotes and pickup coordination'],
 ['Agriculture Services','Services',2,'Labour, soil testing, repairs and spraying'],
 ['FPO & Cooperative Hub','Business',2,'Bulk aggregation and procurement management'],
 ['Local Business Directory','Services',2,'Farm-related dealers and providers'],
 ['Video & Learning','Learn',2,'Guides, webinars and agriculture training'],
 ['Storage & Warehousing','Services',2,'Cold-storage and warehouse enquiries'],
 ['AI Farming Assistant','Plant Care',2,'Crop-related multilingual assistance with safeguards'],
 ['Livestock Marketplace','Market',3,'Permitted livestock categories with verification'],
 ['Crop Price Intelligence','Insights',3,'Longitudinal regional price analysis'],
 ['Soil & Crop Health','Plant Care',3,'Soil reports and extended crop health'],
 ['Agriculture Jobs','Services',3,'Seasonal labour and farm employment'],
 ['Finance & Insurance','Business',3,'Educational tools and regulated partner referrals'],
 ['Export Marketplace','Market',3,'Export leads and quality requirements'],
 ['Farmer Recognition','Circle',3,'Farmer stories, awards and knowledge sharing']
].map(([name, category, phase, summary], i) => ({ id: i + 1, name: name as string, category: category as string, phase: phase as 1|2|3, summary: summary as string }));
