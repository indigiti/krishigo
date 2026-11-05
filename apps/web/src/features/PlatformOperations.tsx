import {lazy,Suspense,useEffect,useState,type FormEvent} from 'react';
const TradeJourneyWorkspace=lazy(()=>import('./TradeJourneyWorkspace'));
import {BookOpen,ShieldCheck,Truck,Stethoscope,Bell,Search,RefreshCw,Database,FileText} from 'lucide-react';
import {productionClient,type Identity,type SourceRecord,type KnowledgeArticle,type PlatformQuote,type PlatformOrder,type PlatformNotice,type PlatformCapabilities} from '../infrastructure/productionApiClient';
type Tab='knowledge'|'farm'|'trade'|'intelligence'|'readiness';
const tabs:readonly {key:Tab;name:string}[]=[
 {key:'knowledge',name:'Knowledge desk'},{key:'farm',name:'Farm records'},
 {key:'trade',name:'Farmer–Buyer Trade'},{key:'intelligence',name:'Intelligence & alerts'},{key:'readiness',name:'Data & readiness'}
];
const errorMessage=(e:unknown)=>e instanceof Error?e.message:'Operation failed';
const form=(e:FormEvent<HTMLFormElement>)=>Object.fromEntries(new FormData(e.currentTarget));
export default function PlatformOperations({user,initialTab='knowledge'}:{user:Identity;initialTab?:Tab}){
 const [tab,setTab]=useState<Tab>(initialTab),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[reason,setReason]=useState('');
 const [sources,setSources]=useState<SourceRecord[]>([]),[pendingSources,setPendingSources]=useState<SourceRecord[]>([]);
 const [articles,setArticles]=useState<KnowledgeArticle[]>([]),[pendingArticles,setPendingArticles]=useState<KnowledgeArticle[]>([]);
 const [pendingSnapshots,setPendingSnapshots]=useState<Array<{id:string;domain:string;label:string}>>([]);
 const [profile,setProfile]=useState<{district:string;crop_focus:string;preferred_language:string}|null>(null);
 const [supplier,setSupplier]=useState<{id:string;business_name:string;district:string;status:string}|null>(null);
 const [supplierQueue,setSupplierQueue]=useState<Array<{id:string;business_name:string;district:string}>>([]);
 const [cases,setCases]=useState<Array<{id:string;crop:string;kind:string;observation:string;status:string}>>([]);
 const [quotes,setQuotes]=useState<PlatformQuote[]>([]),[orders,setOrders]=useState<PlatformOrder[]>([]);
 const [events,setEvents]=useState<PlatformNotice[]>([]);
 const [opted,setOpted]=useState<Record<string,boolean>>({});
 const [term,setTerm]=useState(''),[answer,setAnswer]=useState(''),[matches,setMatches]=useState<KnowledgeArticle[]>([]);
 const [snapshotDomain,setSnapshotDomain]=useState('mandi');
 const [snapshots,setSnapshots]=useState<Array<{id:string;label:string;observed_at:string;valid_until:string;source_url:string;payload:Record<string,unknown>}>>([]);
 const [cap,setCap]=useState<PlatformCapabilities|null>(null);
 const editor=user.role==='editor'||user.role==='admin',admin=user.role==='admin';
 async function load(current=tab){
  if(current==='knowledge'){
   const [a,b]=await Promise.all([productionClient.sources(),productionClient.knowledge()]);
   setSources(a.items);setArticles(b.items);
   if(editor){const [s,d,h]=await Promise.all([productionClient.stagedSources(),productionClient.stagedArticles(),productionClient.stagedSnapshots()]);
    setPendingSources(s.items);setPendingArticles(d.items);setPendingSnapshots(h.items);}
  }
  if(current==='farm'){const [p,c]=await Promise.all([productionClient.farmProfile(),productionClient.agronomyCases()]);setProfile(p.profile);setCases(c.items);}
  if(current==='trade'){const [q,o,s]=await Promise.all([productionClient.quotes(),productionClient.orders(),productionClient.supplierProfile()]);
   setQuotes(q.items);setOrders(o.items);setSupplier(s.profile);if(admin)setSupplierQueue((await productionClient.suppliersPending()).items);}
  if(current==='intelligence'){
   const [n,p]=await Promise.all([productionClient.notificationEvents(),productionClient.notificationPreferences()]);
   setEvents(n.items);setOpted(Object.fromEntries(p.items.map(x=>[x.topic,Boolean(Number(x.opted_in))])));
  }
  if(current==='readiness'){
   const [c,s]=await Promise.all([productionClient.platformCapabilities(),productionClient.snapshots(snapshotDomain)]);
   setCap(c);setSnapshots(s.items);
  }
 }
 useEffect(()=>{let active=true;setError('');void load(tab).catch(e=>{if(active)setError(errorMessage(e))});return()=>{active=false};},[tab,user.id,snapshotDomain]);
 async function action(run:()=>Promise<unknown>,message:string):Promise<boolean>{
  if(busy)return false;setBusy(true);setError('');setNotice('');
  try{await run();await load();setNotice(message);return true;}
  catch(e){setError(errorMessage(e));return false;}finally{setBusy(false);}
 }
 function send(e:FormEvent<HTMLFormElement>,run:(data:Record<string,FormDataEntryValue>)=>Promise<unknown>,message:string){
  e.preventDefault();const el=e.currentTarget;const data=form(e);
  void action(()=>run(data),message).then(success=>{if(success)el.reset();});
 }
 function reviewSource(id:string,decision:'approve'|'reject'){
  void action(()=>productionClient.decideSource(id,decision,reason),'Source review recorded. No official data feed is connected.');
 }
 function reviewArticle(id:string,decision:'approve'|'reject'){
  void action(()=>productionClient.decideArticle(id,decision,reason),'Article review recorded as source-backed educational content.');
 }
 function reviewSnapshot(id:string,decision:'approve'|'reject'){
  void action(()=>productionClient.decideSnapshot(id,decision,reason),'Snapshot review recorded, subject to expiry.');
 }
 const canReview=editor&&reason.trim().length>=12;
 return <section className="platform-workspace" aria-label="Connected M20–M25 platform operations">
  <div className="platform-head"><div><span className="section-eyebrow">M20–M25 · PHP + MYSQL CANDIDATE</span><h2>Knowledge, trade & field operations</h2>
   <p>Permissioned internal workflows. Provider feeds, real OCR, generative diagnosis, outbound messaging and payments remain disabled.</p></div><ShieldCheck size={26}/></div>
  <div className="platform-tabs" role="tablist" aria-label="Platform workspaces">
   {tabs.map(t=><button type="button" key={t.key} role="tab" aria-selected={tab===t.key} onClick={()=>setTab(t.key)}>{t.name}</button>)}
  </div>
  {error&&<p className="workspace-notice" role="alert">{error}</p>}
  {notice&&<p className="workspace-notice" role="status">{notice}</p>}
  <div className="platform-tools">
   <button type="button" className="btn btn-soft" onClick={()=>void action(()=>load(),'Workspace refreshed.')} disabled={busy}><RefreshCw size={15}/> Refresh</button>
   <span>{user.role} · {user.verified_at?'Staff identity review on file':'Identity review required for restricted actions'}</span>
  </div>
  {tab==='knowledge'&&<div className="platform-panels">
   <section className="surface-card platform-panel"><h3><BookOpen size={19}/> Reviewed learning library</h3>
    <p>Published educational summaries carry original source links. No chemical label approvals.</p>
    {articles.length===0?<p>No reviewed articles available yet.</p>:articles.map(a=><article className="platform-record" key={a.id}>
     <strong>{a.title} · {a.crop}</strong><small>{a.language} · {a.topic} · revision {a.revision}</small><p>{a.summary}</p>
     {a.source_url&&<a href={a.source_url} rel="noopener noreferrer" target="_blank">Original submitted source</a>}</article>)}
   </section>
   {editor&&<section className="surface-card platform-panel"><h3><FileText size={19}/> Editorial source intake</h3>
    <form className="platform-form" onSubmit={e=>send(e,d=>productionClient.createSource(d),'Source draft queued for independent review.')}>
     <label>Source title<input name="title" minLength={5} maxLength={180} required/></label>
     <label>Publisher<input name="publisher" minLength={3} maxLength={120} required/></label>
     <label>Original HTTPS source URL<input name="source_url" type="url" pattern="https://.*" required/></label>
     <label>Jurisdiction<input name="jurisdiction" defaultValue="India" maxLength={80} required/></label>
     <label>Published on (optional)<input name="published_on" type="date"/></label>
     <button className="btn btn-primary" disabled={busy}>Submit source for review</button>
    </form>
    <h4>Source review queue · {pendingSources.length}</h4>
    {pendingSources.map(s=><article className="platform-record" key={s.id}><strong>{s.title}</strong>
     <small>{s.publisher} · {s.jurisdiction}</small><p>{s.source_url}</p>
     <button className="btn btn-soft" disabled={!canReview||busy} onClick={()=>reviewSource(s.id,'approve')}>Approve reviewed source</button>
     <button className="btn btn-soft" disabled={!canReview||busy} onClick={()=>reviewSource(s.id,'reject')}>Reject</button>
    </article>)}
   </section>}
   {editor&&<section className="surface-card platform-panel"><h3>Knowledge article drafts</h3>
    <form className="platform-form" onSubmit={e=>send(e,d=>productionClient.createArticle(d),'Knowledge article submitted for independent review.')}>
     <label>Reviewed source<select name="source_id" required defaultValue=""><option value="">Select approved source</option>{sources.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
     <label>Article title<input name="title" maxLength={180} minLength={5} required/></label>
     <label>Crop<input name="crop" maxLength={100} minLength={2} required/></label>
     <label>Topic<select name="topic">{['crop_guide','pest_disease','nutrient','scheme','market','equipment','general'].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
     <label>Language<select name="language"><option value="en">English</option><option value="mr">Marathi</option><option value="hi">Hindi</option></select></label>
     <label>Summary<textarea name="summary" rows={4} minLength={30} maxLength={2200} required/></label>
     <button className="btn btn-primary" disabled={busy||sources.length===0}>Submit article draft</button>
    </form>
    <h4>Awaiting independent review · {pendingArticles.length}</h4>
    {pendingArticles.map(a=><article className="platform-record" key={a.id}><strong>{a.title}</strong><small>{a.crop} · {a.language}</small>
     <button className="btn btn-soft" disabled={!canReview||busy} onClick={()=>reviewArticle(a.id,'approve')}>Approve</button>
     <button className="btn btn-soft" disabled={!canReview||busy} onClick={()=>reviewArticle(a.id,'reject')}>Reject</button>
    </article>)}
   </section>}
   {editor&&<section className="surface-card platform-panel"><h3>Source-linked data snapshot intake</h3>
    <p>Manually record observations with dates and evidence. This is not a live APMC/IMD connector.</p>
    <form className="platform-form" onSubmit={e=>send(e,d=>{
      const payload:Record<string,string>={metric:String(d.metric||''),value:String(d.value||''),unit:String(d.unit||'')};
      return productionClient.createSnapshot({...d,payload});
    },'Snapshot queued for separate source review.')}>
     <label>Approved source<select name="source_id" required defaultValue=""><option value="">Select</option>{sources.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
     <label>Domain<select name="domain">{['mandi','weather','schemes','inputs','logistics'].map(x=><option key={x}>{x}</option>)}</select></label>
     <label>Label<input name="label" minLength={4} maxLength={140} required/></label>
     <label>Metric<input name="metric" maxLength={40} required/></label>
     <label>Value<input name="value" maxLength={220} required/></label>
     <label>Unit<input name="unit" maxLength={80} required/></label>
     <label>Observed date<input name="observed_on" type="date" required/></label>
     <label>Valid until<input name="valid_until" type="date" required/></label>
     <button disabled={busy||sources.length===0} className="btn btn-primary">Save source-linked snapshot</button>
    </form>
    <h4>Pending snapshot review · {pendingSnapshots.length}</h4>
    {pendingSnapshots.map(s=><article className="platform-record" key={s.id}><strong>{s.label} · {s.domain}</strong>
     <button className="btn btn-soft" disabled={!canReview||busy} onClick={()=>reviewSnapshot(s.id,'approve')}>Approve</button>
     <button className="btn btn-soft" disabled={!canReview||busy} onClick={()=>reviewSnapshot(s.id,'reject')}>Reject</button>
    </article>)}
   </section>}
   {editor&&<label className="platform-review-reason">Review reason (required, 12+ characters)
    <textarea rows={2} maxLength={400} value={reason} onChange={e=>setReason(e.target.value)}/></label>}
  </div>}

  {tab==='farm'&&<div className="platform-panels">
   <section className="surface-card platform-panel"><h3>My farm profile</h3>
    <form className="platform-form" key={profile?.district||'new'} onSubmit={e=>send(e,d=>productionClient.saveFarmProfile({
      district:String(d.district),crop_focus:String(d.crop_focus),preferred_language:String(d.preferred_language)
    }),'Private farm profile saved.')}>
     <label>District<input name="district" required maxLength={100} defaultValue={profile?.district||''}/></label>
     <label>Crop focus<input name="crop_focus" required maxLength={120} defaultValue={profile?.crop_focus||''}/></label>
     <label>Preferred language<select name="preferred_language" defaultValue={profile?.preferred_language||'en'}>
      <option value="en">English</option><option value="mr">Marathi</option><option value="hi">Hindi</option></select></label>
     <button className="btn btn-primary" disabled={busy}>Save my preferences</button>
    </form>
   </section>
   <section className="surface-card platform-panel"><h3><Stethoscope size={19}/> Crop and label observation intake</h3>
    <p>Manual text only; no photo upload, actual OCR, automatic diagnoses or delivered expert consultation.</p>
    <form className="platform-form" onSubmit={e=>send(e,d=>productionClient.createAgronomy(d),'Private case created for expert review (no real dispatch).')}>
     <label>Type<select name="kind"><option value="plant_observation">Crop observation</option><option value="label_transcription">Manual label transcription</option></select></label>
     <label>Crop<input name="crop" maxLength={100} minLength={2} required/></label>
     <label>Observation<textarea name="observation" rows={3} minLength={12} maxLength={1200} required/></label>
     <label>Context note<textarea name="context_note" rows={2} minLength={8} maxLength={600} required/></label>
     <label>Optional HTTPS evidence reference<input type="url" name="evidence_url"/></label>
     <button className="btn btn-primary" disabled={busy}>Save for review</button>
    </form>
    {cases.map(c=><article className="platform-record" key={c.id}><strong>{c.crop} · {c.kind}</strong><small>{c.status}</small><p>{c.observation}</p></article>)}
   </section>
  </div>}

  {tab==='trade'&&<div className="platform-panels">
   <div className="journey-slot"><Suspense fallback={<p role="status">Loading farmer-to-buyer workspace…</p>}><TradeJourneyWorkspace user={user}/></Suspense></div>
   <section className="surface-card platform-panel"><h3><Truck size={19}/> Supplier onboarding</h3><p>Internal review is not a licence certificate.</p>
    {supplier?<p>{supplier.business_name} · {supplier.district} · {supplier.status}</p>:
     <form className="platform-form" onSubmit={e=>send(e,d=>productionClient.createSupplier(d),'Supplier profile submitted for internal review.')}>
      <label>Business name<input name="business_name" minLength={3} maxLength={160} required/></label>
      <label>District<input name="district" minLength={2} maxLength={100} required/></label>
      <label>Licence reference (optional)<input name="license_reference" maxLength={140}/></label>
      <button className="btn btn-primary" disabled={busy||!user.verified_at}>Create supplier profile</button>
     </form>}
   </section>
   {admin&&<section className="surface-card platform-panel"><h3>Supplier review queue</h3>
    {supplierQueue.map(s=><article className="platform-record" key={s.id}><strong>{s.business_name}</strong><small>{s.district}</small>
     <button className="btn btn-soft" disabled={!canReview||busy} onClick={()=>void action(()=>productionClient.decideSupplier(s.id,'approve',reason),'Supplier internally reviewed, not legally licensed.')}>Review</button>
     <button className="btn btn-soft" disabled={!canReview||busy} onClick={()=>void action(()=>productionClient.decideSupplier(s.id,'reject',reason),'Supplier record rejected.')}>Reject</button>
    </article>)}
    <label className="platform-review-reason">Reviewer reason<textarea rows={2} maxLength={400} value={reason} onChange={e=>setReason(e.target.value)}/></label>
   </section>}
  </div>}

  {tab==='intelligence'&&<div className="platform-panels">
   <section className="surface-card platform-panel"><h3><Search size={19}/> Source-only assistant search</h3>
    <p>Returns citations from independently reviewed articles. No generative AI or pesticide treatment output.</p>
    <form className="platform-form" onSubmit={e=>{e.preventDefault();void action(async()=>{
      const r=await productionClient.assistantSearch(term);setMatches(r.matches);setAnswer(r.answer);
    },'Source-only lookup complete.');}}>
     <label>Search approved references<input type="search" minLength={2} maxLength={100} value={term} onChange={e=>setTerm(e.target.value)} required/></label>
     <button className="btn btn-primary" disabled={busy}>Find references</button>
    </form>
    {answer&&<p role="status">{answer}</p>}
    {matches.map(m=><article className="platform-record" key={m.id}><strong>{m.title}</strong><p>{m.summary}</p>{m.source_url&&<a href={m.source_url} rel="noopener noreferrer" target="_blank">Submitted source</a>}</article>)}
   </section>
   <section className="surface-card platform-panel"><h3><Bell size={19}/> In-app notification preferences</h3>
    <p>Explicit consent controls internal alerts; external WhatsApp/email delivery is disabled.</p>
    {['trade','content','regulatory','agronomy'].map(t=><label className="platform-toggle" key={t}>
     <input type="checkbox" checked={Boolean(opted[t])} disabled={busy} onChange={e=>void action(
      ()=>productionClient.changeNotificationPreference(t,e.target.checked),'In-app consent setting updated.')}/>
     {t} (in-app only)</label>)}
    <h4>My in-app events · {events.length}</h4>
    {events.map(e=><article className="platform-record" key={e.id}><strong>{e.title}</strong><small>{e.topic} · {e.created_at}</small><p>{e.description}</p></article>)}
   </section>
  </div>}

  {tab==='readiness'&&<div className="platform-panels">
   <section className="surface-card platform-panel"><h3><Database size={19}/> Capability gates</h3>
    <p>Transparent API flags for code availability and disabled real-world integrations.</p>
    {cap?Object.entries(cap).map(([name,value])=><div className="platform-cap" key={name}>
     <span>{name.replaceAll('_',' ')}</span><strong>{typeof value==='boolean'?(value?'Candidate enabled':'Not connected'):String(value)}</strong>
    </div>):<p>Capabilities unavailable.</p>}
   </section>
   <section className="surface-card platform-panel"><h3>Fresh source-linked observations</h3>
    <label>Domain<select value={snapshotDomain} onChange={e=>setSnapshotDomain(e.target.value)}>
      {['mandi','weather','schemes','inputs','logistics'].map(d=><option key={d}>{d}</option>)}
    </select></label>
    <p>Only reviewed, unexpired snapshots appear. No official provider feed is connected.</p>
    {snapshots.map(s=><article className="platform-record" key={s.id}><strong>{s.label}</strong>
      <small>Observed {s.observed_at} · valid until {s.valid_until}</small>
      <p>{Object.entries(s.payload).map(([k,v])=>k+': '+String(v)).join(' · ')}</p>
      <a href={s.source_url} target="_blank" rel="noopener noreferrer">Submitted original source</a>
    </article>)}
    {snapshots.length===0&&<p>No current, reviewed source snapshots.</p>}
   </section>
  </div>}
 </section>;
}
