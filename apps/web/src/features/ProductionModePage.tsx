import {lazy,Suspense} from 'react';
import type {WorkspaceArea} from '../infrastructure/productionApiClient';

const ProductionWorkspace=lazy(()=>import('./ProductionWorkspace'));

const writable:Record<string,WorkspaceArea>={
 'Marketplace':'marketplace/listings',
 'Buyers':'buyers/requirements',
 'Community':'community/posts',
 'Plant Doctor':'plant-cases',
 'Plant Cases':'plant-cases',
 'Crop Journal':'plant-cases',
 'Trade Desk':'marketplace/listings',
 'Review Desk':'marketplace/listings',
};
const available=new Set([
 'Connected Operations','Overview','My Profile','Admin','Insights','Agri Inputs','Discover',
 'Marketplace','Buyers','Community','Plant Doctor','Plant Cases','Crop Journal','Trade Desk','Review Desk'
]);

/** Prevent fixture-backed sample screens appearing in any explicitly connected build. */
export default function ProductionModePage({page}:{page:string}){
 if(!available.has(page))return <section className="surface-card production-panel" aria-label="Production integration unavailable">
   <div className="section-eyebrow">KRISHIGO · CONNECTED MODE</div>
   <h1>{page}</h1>
   <p>The real provider workflow for this module is not connected. No demonstration suppliers,
    quotations, weather readings or other fictional records will be displayed as operational data.</p>
   <p>When source permissions, domain persistence and host acceptance are complete, this module
    can be enabled through the production policy. No purchase, booking or message was initiated.</p>
  </section>;
 return <Suspense fallback={<section className="surface-card production-panel" role="status">Connecting to verified PHP records…</section>}>
  <ProductionWorkspace key={page} initialArea={writable[page]} pageLabel={page}/>
 </Suspense>;
}
