import { useEffect, useState, type FormEvent } from 'react';
import { productionClient, type Identity, type LiveRecord, type WorkspaceArea } from '../infrastructure/productionApiClient';

type Area = 'marketplace/listings' | 'buyers/requirements' | 'community/posts' | 'plant-cases' | 'enquiries';
const areaNames: Record<Area,string> = { 'marketplace/listings':'Marketplace', 'buyers/requirements':'Buyer Requirements', 'community/posts':'Farmer Community', 'plant-cases':'Plant Care Records', 'enquiries':'Enquiries' };
const toString = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : '';

/** Never rendered in the mock-data build. Uses an authenticated PHP service, not browser privileges. */
export default function ProductionWorkspace() {
  const [user,setUser] = useState<Identity|null>(null);
  const [ready,setReady] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [area,setArea] = useState<Area>('marketplace/listings');
  const [records,setRecords] = useState<LiveRecord[]>([]);
  const [mine,setMine] = useState(false);
  const [queue,setQueue] = useState<Array<{id:number;type:string;status:string}>>([]);
  const [loading,setLoading] = useState(false);
  const [registerMode,setRegisterMode] = useState(false);
  const [formKey,setFormKey] = useState(0);

  useEffect(() => {let active=true; (async()=>{try{await productionClient.initialize();const data=await productionClient.identity();if(active)setUser(data.identity);}catch(e){if(active)setError(String(e));}finally{if(active)setReady(true);}})();return()=>{active=false;};},[]);
  useEffect(()=>{if(!ready)return; let active=true;setLoading(true);setRecords([]);productionClient.list(area,mine).then(data=>{if(active)setRecords(data);}).catch(e=>{if(active)setError((e as Error).message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[ready,area,mine,user?.id]);
  const refresh = async () => { try {setLoading(true);setRecords(await productionClient.list(area,mine));}catch(e){setError((e as Error).message);}finally{setLoading(false);} };
  const signIn=async (event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setError('');setNotice('');const fields=new FormData(event.currentTarget);
    try {
      if(registerMode){await productionClient.register({display_name:fields.get('display_name'),email:fields.get('email'),password:fields.get('password'),role:fields.get('role')});setNotice('Account created, but not verified. Sign in to prepare records for review.');setRegisterMode(false);}
      else {setUser(await productionClient.login(String(fields.get('email')),String(fields.get('password'))));setNotice('Signed in. Permissions are enforced by the PHP API.');}
      setFormKey(k=>k+1);
    }catch(e){setError((e as Error).message);}
  };
  const submit = async (event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setError('');setNotice('');const values=Object.fromEntries(new FormData(event.currentTarget));
    const body:Record<string,unknown> = {...values};
    try {if(area==='enquiries')body.listing_id=Number(body.listing_id);
      const result=await productionClient.create(area as WorkspaceArea,body);
      setNotice(`Record #${result.id} saved with status ${result.status}. It will not be published until reviewed.`);
      setFormKey(k=>k+1);await refresh();
    }catch(e){setError((e as Error).message);}
  };
  const review = async (type:'listing'|'requirement'|'post',id:number,decision:'approve'|'reject')=>{
    const reason=window.prompt('Reviewer reason (minimum 10 characters):')?.trim();
    if(!reason)return;
    try{await productionClient.review(type,id,decision,reason);setQueue((await productionClient.reviewQueue()).items);setNotice(`Review decision stored for ${type} #${id}.`);}catch(e){setError((e as Error).message);}
  };
  const loadQueue=async()=>{try{setQueue((await productionClient.reviewQueue()).items);}catch(e){setError((e as Error).message);}};
  if (!ready)return <section className="surface-card production-panel" role="status">Connecting to the PHP service…</section>;
  return <div className="production-space">
    <div className="page-heading"><div><div className="eyebrow">PRODUCTION API WORKSPACE</div><h1>KrishiGo connected operations</h1><p>Account-specific records backed by the PHP API. Staging demo mode never enables this view.</p></div></div>
    {error&&<div role="alert" className="workspace-notice">{error}</div>}
    {notice&&<div role="status" className="workspace-notice">{notice}</div>}
    {!user ? <section className="surface-card production-panel">
      <div className="section-head"><h3>{registerMode?'Create a KrishiGo account':'Sign in to KrishiGo'}</h3><button type="button" className="btn btn-soft" onClick={()=>setRegisterMode(s=>!s)}>{registerMode?'Existing account':'Create account'}</button></div>
      <form key={formKey} onSubmit={signIn} className="workspace-form">
        {registerMode&&<><label>Display name<input name="display_name" minLength={2} maxLength={100} required/></label><label>Role<select name="role"><option value="farmer">Farmer</option><option value="buyer">Buyer</option><option value="fpo">FPO coordinator</option></select></label></>}
        <label>Email<input name="email" type="email" maxLength={190} autoComplete="email" required/></label>
        <label>Password<input name="password" type="password" minLength={12} maxLength={200} autoComplete={registerMode?'new-password':'current-password'} required/></label>
        <button type="submit" className="btn btn-primary">{registerMode?'Create account':'Sign in'}</button>
      </form><p className="page-disclaimer">New accounts are unverified; listings and requirements require staff verification and moderation before publication. Do not submit sensitive crop imagery.</p>
    </section> : <>
      <section className="surface-card production-panel"><div className="section-head"><div><h3>{user.display_name} <small>· {user.role}</small></h3><p>{user.verified_at?'Identity review recorded':'Identity not yet reviewed'}</p></div><button type="button" className="btn btn-soft" onClick={async()=>{try{await productionClient.logout();setUser(null);setNotice('Signed out.');}catch(e){setError((e as Error).message);}}}>Sign out</button></div></section>
      <div className="category-pills workspace-pills">{(Object.keys(areaNames) as Area[]).map(a=><button key={a} type="button" className={a===area?'active':''} onClick={()=>{setArea(a);setMine(a==='plant-cases'||a==='enquiries');setError('');}}>{areaNames[a]}</button>)}</div>
      <div className="production-columns"><section className="surface-card production-panel"><div className="section-head"><h3>New {areaNames[area]} record</h3></div>
        <form key={`${area}-${formKey}`} onSubmit={submit} className="workspace-form">
          {(area==='marketplace/listings'||area==='buyers/requirements'||area==='plant-cases')&&<label>Crop<input name="crop" maxLength={100} required/></label>}
          {(area==='marketplace/listings'||area==='buyers/requirements')&&<><label>District<input name="district" maxLength={100} required/></label><label>Quantity (kg)<input name="quantity_kg" type="number" step="0.01" min="0.01" required/></label></>}
          {area==='marketplace/listings'&&<><label>Price per kg (₹)<input name="price_per_kg" type="number" step="0.01" min="0.01" required/></label><label>Description<textarea name="description" maxLength={600} required/></label></>}
          {area==='buyers/requirements'&&<label>Target price per kg (₹)<input name="target_price_per_kg" type="number" step="0.01" min="0.01" required/></label>}
          {area==='community/posts'&&<><label>Topic<input name="topic" maxLength={80} required/></label><label>Discussion<textarea name="body" maxLength={1500} minLength={5} required/></label></>}
          {area==='plant-cases'&&<><label>Crop stage<select name="growth_stage">{['seedling','vegetative','flowering','fruiting','harvest','unknown'].map(s=><option key={s}>{s}</option>)}</select></label><label>Observed symptoms<textarea name="symptoms" maxLength={1200} minLength={8} required/></label></>}
          {area==='enquiries'&&<><label>Published listing ID<input name="listing_id" type="number" min="1" required/></label><label>Requested quantity (kg)<input name="quantity_kg" type="number" min="0.01" step="0.01" required/></label><label>Buyer message<textarea name="message" maxLength={500} required/></label></>}
          <button type="submit" className="btn btn-primary">Save for review</button>
        </form>
      </section><section className="surface-card production-panel"><div className="section-head"><div><h3>{mine?'Your records':'Published records'}</h3><p>Newest first · limit 30–50 items</p></div><button type="button" className="btn btn-soft" disabled={area==='plant-cases'||area==='enquiries'} onClick={()=>setMine(x=>!x)}>Toggle mine/public</button></div>
        {loading?<p role="status">Loading records…</p>:records.length===0?<p>No records in this view yet.</p>:records.map(row=><article className="production-record" key={row.id}><strong>#{row.id} · {toString(row.crop||row.topic||row.message||'Record')}</strong><small>{toString(row.status||'published')} · {toString(row.district||row.created_at)}</small><p>{toString(row.description||row.body||row.symptoms||'')}</p></article>)}
      </section></div>
      {(user.role==='admin'||user.role==='editor')&&<section className="surface-card production-panel"><div className="section-head"><h3>Moderation review queue</h3><button type="button" className="btn btn-soft" onClick={loadQueue}>Load pending cases</button></div>
        {queue.map(row=><div className="production-record" key={`${row.type}-${row.id}`}><strong>{row.type} #{row.id}</strong><p>{row.status}</p><div className="m3-actions"><button type="button" className="btn btn-soft" onClick={()=>review(row.type as 'listing'|'requirement'|'post',row.id,'approve')}>Approve</button><button type="button" className="btn btn-soft" onClick={()=>review(row.type as 'listing'|'requirement'|'post',row.id,'reject')}>Reject</button></div></div>)}
      </section>}
    </>}
  </div>;
}
