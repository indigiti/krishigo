import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {ArrowRight,CheckCircle2,ClipboardList,History,Leaf,RefreshCw,ShieldAlert,ShoppingBasket,XCircle} from 'lucide-react';
import {productionClient,type Identity,type JourneyDashboard,type JourneyTimelineEvent} from '../infrastructure/productionApiClient';

type FormValues=Record<string,FormDataEntryValue>;
const data=(e:FormEvent<HTMLFormElement>):FormValues=>Object.fromEntries(new FormData(e.currentTarget));
const canSell=(role:string)=>['farmer','fpo','admin'].includes(role);
const canBuy=(role:string)=>['buyer','fpo','admin'].includes(role);
const money=(v:string|number)=>Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const empty:JourneyDashboard={published_listings:[],my_listings:[],enquiries:[],quotes:[],orders:[],
 verified_for_restricted_actions:false,internal_workflow_only:true,
 payments_enabled:false,shipping_enabled:false,external_messages_sent:false};

/**
 * Single connected M26 farmer-to-buyer journey (never exposed in static/mock builds).
 * The PHP API independently enforces participant ownership, stock and CSRF gates.
 */
export default function TradeJourneyWorkspace({user}:{user:Identity}){
 const [snapshot,setSnapshot]=useState<JourneyDashboard>(empty),[ready,setReady]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [selectedLot,setSelectedLot]=useState<number|null>(null);
 const [selectedEnquiry,setSelectedEnquiry]=useState<number|null>(null);
 const [cancelReason,setCancelReason]=useState<Record<string,string>>({});
 const [timeline,setTimeline]=useState<{order:string;events:JourneyTimelineEvent[]}|null>(null);
 const refresh=useCallback(async()=>setSnapshot(await productionClient.journeyDashboard()),[]);
 useEffect(()=>{let active=true;void productionClient.journeyDashboard()
  .then(r=>{if(active)setSnapshot(r);}).catch(e=>{if(active)setError(String(e));})
  .finally(()=>{if(active)setReady(true);});
  return()=>{active=false;};
 },[user.id]);
 async function act(operation:()=>Promise<unknown>,done:string):Promise<boolean>{
  if(busy)return false;
  setBusy(true);setError('');setNotice('');
  try{await operation();await refresh();setNotice(done);return true;}
  catch(e){setError(e instanceof Error?e.message:'Request failed');return false;}
  finally{setBusy(false);}
 }
 function submit(event:FormEvent<HTMLFormElement>,operation:(input:FormValues)=>Promise<unknown>,message:string){
  event.preventDefault();const target=event.currentTarget;const values=data(event);
  void act(()=>operation(values),message).then(success=>{if(success)target.reset();});
 }
 const selling=canSell(user.role),buying=canBuy(user.role);
 const myEnquiries=snapshot.enquiries.filter(e=>Number(e.buyer_id)===user.id);
 const incoming=snapshot.enquiries.filter(e=>Number(e.seller_id)===user.id);
 const quoted=new Set(snapshot.quotes.map(q=>Number(q.enquiry_id)));
 const chosenLot=snapshot.published_listings.find(l=>l.id===selectedLot);
 const chosenEnquiry=incoming.find(e=>e.id===selectedEnquiry);
 return <section className="journey" aria-label="M26 farmer to buyer lifecycle">
  <div className="journey-heading"><div><span className="section-eyebrow">M26 · FARMER TO BUYER</span>
   <h3><ShoppingBasket size={21}/> Produce trading workspace</h3>
   <p>Published produce → enquiry → provisional quote → buyer decision → seller confirmation → retained activity history.</p>
  </div><button type="button" className="btn btn-soft" disabled={busy} onClick={()=>void act(refresh,'Trade records refreshed.')}>
   <RefreshCw size={15}/> Refresh</button></div>
  <div className="journey-steps" aria-label="Internal trade stages">
   {['Produce listing','Buyer enquiry','Seller quotation','Buyer decision','Order record'].map((stage,i)=>
    <div key={stage}><span>{i+1}</span>{stage}{i<4&&<ArrowRight size={13}/>}</div>)}
  </div>
  <p className="journey-warning"><ShieldAlert size={16}/> The workflow is provisional. Staff verification is not statutory KYC;
   no payment, transport booking, confirmed stock availability or external messages are handled.</p>
  {error&&<p role="alert" className="workspace-notice">{error}</p>}
  {notice&&<p role="status" className="workspace-notice">{notice}</p>}
  {!ready?<p role="status">Loading your trade records…</p>:<>
   {selling&&<section className="surface-card journey-card"><div className="journey-card-head"><h4><Leaf size={18}/> My produce lots</h4><small>{snapshot.my_listings.length} recorded</small></div>
    <p>New lots require independent staff approval before buyers can enquire. Use only accurate quantity and grade details.</p>
    <form className="journey-form" onSubmit={e=>submit(e,d=>productionClient.create('marketplace/listings',{
     crop:String(d.crop),district:String(d.district),quantity_kg:Number(d.quantity_kg),
     price_per_kg:Number(d.price_per_kg),description:String(d.description)
    }),'Produce lot submitted for editorial approval.')}>
     <label>Crop<input name="crop" maxLength={100} minLength={2} required/></label>
     <label>District<input name="district" maxLength={100} minLength={2} required/></label>
     <label>Quantity (kg)<input type="number" name="quantity_kg" min="0.01" step="0.01" required/></label>
     <label>Expected ₹/kg<input type="number" name="price_per_kg" min="0.01" step="0.01" required/></label>
     <label className="journey-wide">Lot description<textarea name="description" rows={2} minLength={8} maxLength={600} required/></label>
     <button type="submit" className="btn btn-primary" disabled={busy}>Submit lot for review</button>
    </form>
    {snapshot.my_listings.map(l=><article className="journey-item" key={l.id}><strong>#{l.id} · {l.crop} · {l.district}</strong>
     <small>{l.quantity_kg} kg · ₹{money(l.price_per_kg)}/kg</small><span className="journey-state">{l.status||'pending_review'}</span></article>)}
   </section>}
   {buying&&<section className="surface-card journey-card"><div className="journey-card-head"><h4><ShoppingBasket size={18}/> Published produce lots</h4>
    <small>{snapshot.published_listings.length} visible</small></div>
    <p>Only editor-approved listings appear. Their quantities and prices remain seller-supplied and unverified externally.</p>
    <div className="journey-list">{snapshot.published_listings.map(l=><article className="journey-item" key={l.id}>
     <div><strong>#{l.id} · {l.crop}</strong><small>{l.district} · {l.quantity_kg} kg · ₹{money(l.price_per_kg)}/kg</small>
      {l.description&&<p>{l.description}</p>}</div>
     <button type="button" className="btn btn-soft" disabled={busy} onClick={()=>setSelectedLot(l.id)}>
      Enquire</button>
    </article>)}</div>
    {chosenLot&&<form className="journey-form journey-detail" key={chosenLot.id}
      onSubmit={e=>submit(e,d=>productionClient.submitEnquiry(chosenLot.id,Number(d.quantity_kg),String(d.message)),
          'Enquiry recorded for the seller. No external contact sent.')}>
      <h4 className="journey-wide">Enquire about {chosenLot.crop} · Lot #{chosenLot.id}</h4>
      <label>Requested quantity (kg)<input type="number" name="quantity_kg" step="0.01" min="0.01" max={chosenLot.quantity_kg} required/></label>
      <label className="journey-wide">Message<textarea name="message" rows={2} minLength={5} maxLength={500} required/></label>
      <button type="submit" className="btn btn-primary" disabled={busy}>Submit buyer enquiry</button>
      <button type="button" className="btn btn-soft" onClick={()=>setSelectedLot(null)}>Close</button>
    </form>}
   </section>}
   {selling&&<section className="surface-card journey-card"><div className="journey-card-head"><h4><ClipboardList size={18}/> Incoming buyer enquiries</h4>
     <small>{incoming.length} received</small></div>
    {incoming.length===0&&<p>No buyer enquiries yet.</p>}
    {incoming.map(e=><article className="journey-item" key={e.id}>
      <div><strong>Enquiry #{e.id} · {e.crop}</strong><small>{e.quantity_kg} kg · Lot #{e.listing_id}</small><p>{e.message}</p></div>
      <button type="button" className="btn btn-soft" disabled={busy||quoted.has(e.id)||!user.verified_at}
       onClick={()=>setSelectedEnquiry(e.id)}>{quoted.has(e.id)?'Quote recorded':'Prepare quote'}</button>
    </article>)}
    {chosenEnquiry&&<form className="journey-form journey-detail" key={chosenEnquiry.id}
     onSubmit={e=>submit(e,d=>productionClient.createQuote({
       enquiry_id:chosenEnquiry.id,total_inr:Number(d.total_inr),
       terms:String(d.terms),expires_on:String(d.expires_on)
      }),'Quotation saved for buyer review in-app.')}>
     <h4 className="journey-wide">Quotation for enquiry #{chosenEnquiry.id}</h4>
     <label>Quoted total (₹)<input name="total_inr" type="number" min="0.01" step="0.01" required/></label>
     <label>Expiry date<input name="expires_on" type="date" required/></label>
     <label className="journey-wide">Terms<textarea name="terms" rows={3} minLength={12} maxLength={600} required/></label>
     <button className="btn btn-primary" type="submit" disabled={busy||!user.verified_at}>Save provisional quote</button>
     <button type="button" className="btn btn-soft" onClick={()=>setSelectedEnquiry(null)}>Close</button>
    </form>}
   </section>}
   {buying&&<section className="surface-card journey-card"><div className="journey-card-head"><h4>My buyer enquiries</h4><small>{myEnquiries.length}</small></div>
    {myEnquiries.length===0&&<p>Your enquiries will appear here after submission.</p>}
    {myEnquiries.map(e=><article className="journey-item" key={e.id}><strong>#{e.id} · {e.crop}</strong><small>{e.quantity_kg} kg · {e.status}</small></article>)}
   </section>}
   <section className="surface-card journey-card"><div className="journey-card-head"><h4>Provisional quotations</h4><small>{snapshot.quotes.length}</small></div>
    {snapshot.quotes.length===0&&<p>No quotations for this account.</p>}
    {snapshot.quotes.map(q=><article className="journey-item" key={q.id}><div>
     <strong>{q.crop} · ₹{money(q.total_inr)}</strong><small>Enquiry #{q.enquiry_id} · {q.quantity_kg} kg · {q.status} · valid until {q.expires_at}</small>
     <p>{q.terms}</p></div>
     {q.status==='offered'&&Number(q.buyer_id)===user.id&&<div className="journey-actions">
       <button type="button" className="btn btn-primary" disabled={busy||!user.verified_at} onClick={()=>void act(
          ()=>productionClient.decideQuote(q.id,'accept'),'Quotation accepted; provisional order created.')}>Accept</button>
       <button type="button" className="btn btn-soft" disabled={busy||!user.verified_at} onClick={()=>void act(
          ()=>productionClient.decideQuote(q.id,'reject'),'Quotation rejected.')}>Reject</button>
      </div>}
    </article>)}
   </section>
   <section className="surface-card journey-card journey-orders"><div className="journey-card-head"><h4>Provisional orders</h4><small>{snapshot.orders.length}</small></div>
    {snapshot.orders.length===0&&<p>Accepted quotations become provisional order records here.</p>}
    {snapshot.orders.map(o=><article className="journey-item journey-order" key={o.id}>
     <div><strong>{o.crop} · ₹{money(o.total_inr)}</strong>
      <small>Order {o.id.slice(0,8)} · {o.quantity_kg} kg · {o.status}</small>
      <p>{o.terms}</p></div>
     <div className="journey-actions">
      {o.status==='awaiting_seller_confirmation'&&Number(o.seller_id)===user.id&&<button type="button"
       className="btn btn-primary" disabled={busy||!user.verified_at} onClick={()=>void act(
        ()=>productionClient.confirmOrder(o.id),'Seller confirmed internal record; no payment or shipment.')}>
         <CheckCircle2 size={15}/> Confirm record</button>}
      {['awaiting_seller_confirmation','confirmed_record'].includes(o.status)&&<div className="journey-cancel">
       <label>Reason to cancel<input aria-label={'Cancellation reason '+o.id} maxLength={400} minLength={12}
        value={cancelReason[o.id]||''} onChange={e=>setCancelReason(v=>({...v,[o.id]:e.target.value}))}
        placeholder="Minimum 12 characters"/></label>
       <button type="button" className="btn btn-soft" disabled={busy||!user.verified_at||(cancelReason[o.id]||'').trim().length<12}
        onClick={()=>void act(()=>productionClient.cancelOrder(o.id,(cancelReason[o.id]||'').trim()),
         'Internal order cancelled; reserved quantity released.')}>
         <XCircle size={15}/> Cancel record</button></div>}
      <button type="button" className="btn btn-soft" disabled={busy} onClick={()=>void act(async()=>{
       const result=await productionClient.orderTimeline(o.id);
       setTimeline({order:o.id,events:result.events});
      },'Order timeline loaded.')}><History size={15}/> Activity history</button>
     </div>
     {timeline?.order===o.id&&<ol className="journey-timeline">
      {timeline.events.map((e,i)=><li key={e.id||i}><strong>{e.event_type.replaceAll('_',' ')}</strong>
       <small>{e.created_at}</small><p>{e.description}</p></li>)}
     </ol>}
    </article>)}
   </section>
  </>}
 </section>;
}
