import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarDays, Download, RefreshCw, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';

type MandiRecord = {
 state: string; district: string; market: string; commodity: string; variety: string; grade: string;
 arrival_date: string; min_price: number; max_price: number; modal_price: number;
 price_unit: string; quality_warning: boolean;
};
type MandiResponse = {
 mode: 'live_government_data'; stale: boolean; retrieved_at: string; source: string; source_url: string;
 page: number; limit: number; total: number; records: MandiRecord[];
 note: string; rejected_records: number;
};
const ENDPOINT = import.meta.env.VITE_MANDI_API_BASE_URL || '/api/v1/mandi/daily';
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const date = (value: string) => {
 const parsed = new Date(value + 'T00:00:00');
 return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
function saveCSV(rows: MandiRecord[]) {
 const header: Array<keyof MandiRecord> = ['arrival_date','state','district','market','commodity','variety','grade','min_price','max_price','modal_price','price_unit'];
 const escape = (value: unknown) => '"' + String(value ?? '').replaceAll('"','""') + '"';
 const csv = [header.join(','), ...rows.map(item => header.map(field => escape(item[field])).join(','))].join('\r\n');
 const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
 const link = document.createElement('a'); link.href = url; link.download = 'krishigo-agmarknet-mandi-prices.csv';
 document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

export default function LiveMandiExplorer() {
 const [state, setState] = useState('Maharashtra');
 const [district, setDistrict] = useState('');
 const [commodity, setCommodity] = useState('');
 const [market, setMarket] = useState('');
 const [searchDate, setSearchDate] = useState('');
 const [activeFilters, setActiveFilters] = useState({ state: 'Maharashtra', district: '', commodity: '', market: '', searchDate: '' });
 const [page, setPage] = useState(1);
 const [refresh, setRefresh] = useState(0);
 const [result, setResult] = useState<MandiResponse | null>(null);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 useEffect(() => {
  const abort = new AbortController();
  setLoading(true); setError('');
  const params = new URLSearchParams({ page: String(page), limit: '50' });
  for (const [key,value] of Object.entries({ state: activeFilters.state, district: activeFilters.district, commodity: activeFilters.commodity, market: activeFilters.market, date: activeFilters.searchDate })) if (value.trim()) params.set(key, value.trim());
  fetch(ENDPOINT + '?' + params.toString(), { credentials: 'same-origin', signal: abort.signal, headers: { Accept: 'application/json' } })
   .then(async response => {
    const body: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body && typeof body === 'object' && 'error' in body ? String((body as {error:unknown}).error).replaceAll('_',' ') : 'Government source unavailable';
      throw new Error(message);
    }
    if (!body || typeof body !== 'object' || !('mode' in body) || (body as {mode:unknown}).mode !== 'live_government_data') throw new Error('Unverified source response');
    return body as MandiResponse;
   })
   .then(data => { if (!abort.signal.aborted) setResult(data); })
   .catch(cause => { if (!abort.signal.aborted) { setResult(null); setError(cause instanceof Error ? cause.message : 'Could not load government mandi prices'); } })
   .finally(() => { if (!abort.signal.aborted) setLoading(false); });
  return () => abort.abort();
 }, [activeFilters, page, refresh]);
 const visible = useMemo(() => {
  const needle = search.toLocaleLowerCase().trim();
  if (!needle) return result?.records || [];
  return (result?.records || []).filter(r => [r.market,r.commodity,r.district,r.variety,r.grade].some(value => value.toLocaleLowerCase().includes(needle)));
 }, [result, search]);
 const submitted = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault(); setActiveFilters({ state, district, commodity, market, searchDate }); setPage(1);
 };
 return <section className="mandi-live" aria-label="Government mandi daily prices">
  <div className="mandi-live-head">
   <div><div className="section-eyebrow">KRISHIGO · OFFICIAL MARKET DATA</div><h2>Daily mandi prices</h2><p>Browse AGMARKNET market observations, with source dates and price units displayed for every record.</p></div>
   <button className="btn btn-soft" type="button" onClick={() => setRefresh(v => v+1)} disabled={loading}><RefreshCw size={16}/> Refresh</button>
  </div>
  <div className="mandi-source-strip"><ShieldCheck size={18}/><span>Source: AGMARKNET / data.gov.in</span><strong>{result ? (result.stale ? 'Cached · provider unavailable' : 'Government feed') : 'Connection not verified'}</strong></div>
  <form className="mandi-filters" onSubmit={submitted}>
   <label>State<input value={state} onChange={e=>{setState(e.target.value);}} placeholder="Maharashtra" maxLength={80}/></label>
   <label>District<input value={district} onChange={e=>{setDistrict(e.target.value);}} placeholder="Pune" maxLength={80}/></label>
   <label>Commodity<input value={commodity} onChange={e=>{setCommodity(e.target.value);}} placeholder="Onion" maxLength={80}/></label>
   <label>Market<input value={market} onChange={e=>{setMarket(e.target.value);}} placeholder="Pune" maxLength={80}/></label>
   <label>Observation date<input type="date" value={searchDate} onChange={e=>{setSearchDate(e.target.value);}} /></label>
   <button className="btn btn-primary" type="submit"><SlidersHorizontal size={16}/> Apply</button>
  </form>
  {error && <div className="mandi-alert" role="alert"><AlertTriangle size={19}/><div><strong>Live mandi data unavailable</strong><p>{error}. No sample rates are shown as live values. Configure an authorized API key and a private cache directory on the PHP host.</p></div></div>}
  {loading && <div className="mandi-loading" role="status">Loading government market observations…</div>}
  {!loading && result && <>
   {result.stale && <div className="mandi-alert" role="status"><AlertTriangle size={18}/> These are previously cached observations. Check their market dates before making a trade decision.</div>}
   <div className="mandi-toolbar"><div><strong>{result.total.toLocaleString('en-IN')} provider records</strong><small> Page {result.page} · Retrieved {new Date(result.retrieved_at).toLocaleString('en-IN')} · {result.rejected_records || 0} invalid records excluded</small></div>
    <div className="mandi-toolbar-actions"><label className="mandi-search"><Search size={16}/><input aria-label="Filter current page" placeholder="Filter visible rows…" value={search} onChange={e=>setSearch(e.target.value)}/></label><button className="btn btn-soft" onClick={()=>saveCSV(visible)} disabled={!visible.length}><Download size={16}/> Export CSV</button></div>
   </div>
   {visible.length ? <div className="mandi-table-wrap"><table><thead><tr><th><CalendarDays size={15}/> Market date</th><th>Market / District</th><th>Commodity / Variety</th><th>Min ₹/q</th><th>Max ₹/q</th><th>Modal ₹/q</th><th>Quality</th></tr></thead><tbody>
    {visible.map((item,index)=><tr key={item.state+'-'+item.market+'-'+item.commodity+'-'+item.variety+'-'+item.arrival_date+'-'+index}>
     <td>{date(item.arrival_date)}</td><td><strong>{item.market}</strong><small>{item.district}, {item.state}</small></td>
     <td><strong>{item.commodity}</strong><small>{item.variety || 'Unspecified'} · {item.grade || 'Grade not reported'}</small></td>
     <td>{money.format(item.min_price)}</td><td>{money.format(item.max_price)}</td><td><strong>{money.format(item.modal_price)}</strong></td>
     <td>{item.quality_warning ? <span className="mandi-warning">Review</span> : 'Reported'}</td>
    </tr>)}
   </tbody></table></div> : <div className="mandi-loading">No observations match these filters on this result page.</div>}
   <div className="mandi-pagination"><button className="btn btn-soft" disabled={page<=1 || loading} onClick={()=>setPage(v=>Math.max(1,v-1))}><ArrowLeft size={15}/> Previous</button><span>Page {page} of {Math.max(1,Math.ceil(result.total/50))}</span><button className="btn btn-soft" disabled={loading || page*50>=result.total || page>=100} onClick={()=>setPage(v=>v+1)}>Next <ArrowRight size={15}/></button></div>
   <p className="tiny-disclaimer">Daily reported wholesale prices in INR per quintal, not instantaneous bids or guaranteed sale prices. Price records may arrive late or contain reporting errors. <a href={result.source_url} target="_blank" rel="noreferrer">Original government data</a>.</p>
  </>}
 </section>;
}
