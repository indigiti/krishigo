import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, Camera,
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CloudSun, Compass,
  Droplets, Filter, Heart, HeartPulse, Home, Info, Leaf, MapPin, Menu, MessageCircle,
  MoreHorizontal, Plus, Search, Send, ShieldCheck, ShoppingBag, SlidersHorizontal,
  Sparkles, Sprout, Sun, Thermometer, TrendingUp, UploadCloud, Users, Wind, X,
  ChartNoAxesCombined, Bookmark, ScanLine, Zap, RefreshCw, Volume2, BookOpen, BriefcaseBusiness, ClipboardList, LayoutGrid, NotebookPen
} from 'lucide-react';
import { type Listing, type CommunityPost, mandiMarkets } from './data/demo';
import { dataSource, isDemo } from './services/dataSource';
import Workspaces from './features/Workspaces';

type Page = 'Overview' | 'Plant Doctor' | 'Marketplace' | 'Buyers' | 'Community' | 'Insights' | 'Services' | 'Crop Journal' | 'Discover' | 'Admin';
type Theme = 'forest' | 'sand' | 'night';
const navigation: { label: Page; icon: typeof Home; desc: string }[] = [
  { label: 'Overview', icon: Home, desc: 'Farm at a glance' },
  { label: 'Plant Doctor', icon: ScanLine, desc: 'AI crop care' },
  { label: 'Marketplace', icon: ShoppingBag, desc: 'Buy and sell' },
  { label: 'Community', icon: Users, desc: 'Grow together' },
  { label: 'Insights', icon: ChartNoAxesCombined, desc: 'Mandi and trends' },
  { label: 'Buyers', icon: ClipboardList, desc: 'Procurement' },
  { label: 'Services', icon: BriefcaseBusiness, desc: 'Farm businesses' },
  { label: 'Crop Journal', icon: NotebookPen, desc: 'Field notes' },
  { label: 'Discover', icon: LayoutGrid, desc: 'All 25 modules' },
  { label: 'Admin', icon: BookOpen, desc: 'Operations preview' }
];
const formatToday = () => new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
function PlantArtwork({ small = false }: { small?: boolean }) {
  return <svg className={small ? 'plant-svg small' : 'plant-svg'} viewBox="0 0 560 480" role="img" aria-label="Stylized healthy green crop plant">
    <defs>
      <linearGradient id="leafA" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#e6f3a2"/><stop offset=".5" stopColor="#a9d971"/><stop offset="1" stopColor="#4c9e65"/></linearGradient>
      <linearGradient id="leafB" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#6cbe72"/><stop offset="1" stopColor="#135d3e"/></linearGradient>
      <linearGradient id="leafC" x1="0" x2="1"><stop stopColor="#d3e999"/><stop offset="1" stopColor="#699d49"/></linearGradient>
      <linearGradient id="pot" x1="0" x2="1"><stop stopColor="#efdfb5"/><stop offset="1" stopColor="#bc9a65"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="15" stdDeviation="12" floodOpacity=".23"/></filter>
    </defs>
    <circle cx="292" cy="242" r="205" fill="none" stroke="#c5edaa" strokeOpacity=".25" strokeWidth="1"/>
    <circle cx="292" cy="242" r="152" fill="none" stroke="#c5edaa" strokeOpacity=".23" strokeWidth="1"/>
    <path d="M286 400C283 320 278 223 293 117M289 302C229 254 210 210 185 177M289 258C351 220 369 170 387 144M288 345C340 304 367 299 406 286" fill="none" stroke="#91be79" strokeWidth="12" strokeLinecap="round"/>
    <path d="M280 293C160 288 113 199 143 121C253 118 305 218 280 293Z" fill="url(#leafA)" stroke="#d6eda3" strokeWidth="2"/>
    <path d="M281 291C239 220 199 167 151 132M247 236l-68-13M225 206l4-53" fill="none" stroke="#457e43" strokeOpacity=".5" strokeWidth="3"/>
    <path d="M301 247C287 137 341 67 444 74C461 162 394 239 301 247Z" fill="url(#leafB)" stroke="#93cc83" strokeWidth="2"/>
    <path d="M306 243C339 168 394 110 435 81M362 170l53 1M373 153l-8-50" fill="none" stroke="#d0edaf" strokeOpacity=".65" strokeWidth="3"/>
    <path d="M287 184C231 118 251 55 306 22C377 75 359 147 287 184Z" fill="url(#leafC)" stroke="#d0e69c" strokeWidth="2"/>
    <path d="M289 178C300 119 304 79 307 32M302 115l32-32M295 130l-24-36" fill="none" stroke="#5b8c50" strokeOpacity=".62" strokeWidth="3"/>
    <path d="M296 349C326 278 404 252 477 289C455 379 371 404 296 349Z" fill="url(#leafA)" stroke="#d6eda3" strokeWidth="2"/>
    <path d="M300 350c56-37 118-53 169-58M390 318l19 38" fill="none" stroke="#457e43" strokeOpacity=".56" strokeWidth="3"/>
    <ellipse cx="288" cy="399" rx="93" ry="21" fill="#153a29" opacity=".32"/>
    <path d="M208 384h167l-21 73H232Z" fill="url(#pot)" filter="url(#shadow)"/>
    <ellipse cx="291" cy="383" rx="83" ry="17" fill="#efdca9"/>
    <ellipse cx="291" cy="382" rx="70" ry="11" fill="#54482e"/>
    <circle cx="461" cy="145" r="6" fill="#ddffa6"/><circle cx="461" cy="145" r="15" fill="none" stroke="#ddffa6" strokeOpacity=".7"/>
    <circle cx="137" cy="299" r="5" fill="#ddffa6"/><circle cx="137" cy="299" r="14" fill="none" stroke="#ddffa6" strokeOpacity=".6"/>
  </svg>;
}
function MiniLine({ color = 'var(--accent)', dashed = false }: { color?: string; dashed?: boolean }) {
  return <svg className="miniline" viewBox="0 0 160 42" preserveAspectRatio="none" aria-hidden="true"><path d="M1 36C16 30 19 21 35 28s22-13 35-10 20 11 34-2 22-15 30-6 19-5 25-8" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={dashed ? '5 7' : undefined}/></svg>;
}
function GrowthChart({ compact = false }: { compact?: boolean }) {
  const values = [58, 65, 61, 76, 72, 81, 75, 88, 83, 91, 86, 96];
  const coords = values.map((v, i) => `${30 + i * 43},${210 - (v - 45) * 2.8}`).join(' ');
  return <div className={'growth-chart' + (compact ? ' compact' : '')}>
    <svg viewBox="0 0 540 250" role="img" aria-label="Illustrative weekly crop growth trending upward">
      <defs><linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#65bc8b" stopOpacity=".26"/><stop offset="1" stopColor="#65bc8b" stopOpacity="0"/></linearGradient></defs>
      {[58, 108, 158, 208].map(y => <line key={y} x1="25" x2="530" y1={y} y2={y} stroke="var(--chart-grid)" strokeDasharray="4 8"/>)}
      <polygon points={`30,232 ${coords} 503,232`} fill="url(#growthFill)"/>
      <polyline points={coords} stroke="var(--accent)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {[3, 7, 11].map(i => <circle key={i} cx={30 + i * 43} cy={210 - (values[i] - 45) * 2.8} r="6.5" fill="var(--accent)" stroke="var(--panel)" strokeWidth="4"/>)}
    </svg>
    <div className="chart-labels">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => <span key={x}>{x}</span>)}</div>
  </div>;
}
const DemoPill = () => isDemo ? <span className="demo-pill"><span/> DEMO DATA</span> : null;
function App() {
  const [page, setPage] = useState<Page>('Overview');
  const [theme, setTheme] = useState<Theme>('forest');
  const [mobileNav, setMobileNav] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [q, setQ] = useState('');
  const [marketCategory, setMarketCategory] = useState('All');
  const [saved, setSaved] = useState<number[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [liked, setLiked] = useState<number[]>([]);
  const [newPost, setNewPost] = useState('');
  const [postComposer, setPostComposer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [plantResult, setPlantResult] = useState(false);
  const [crop, setCrop] = useState('Tomato');
  const [symptoms, setSymptoms] = useState('Yellowing / leaf spots');
  const [scanTab, setScanTab] = useState<'Guide' | 'History'>('Guide');
  const [chartPeriod, setChartPeriod] = useState('7 days');
  const [listingComposer, setListingComposer] = useState(false);
  const [listingFeedback, setListingFeedback] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { let active = true; Promise.all([dataSource.listings(), dataSource.communityPosts()]).then(([l, p]) => { if (active) { setAllListings(l); setAllPosts(p); } }).catch(() => { if (active) { setAllListings([]); setAllPosts([]); } }); return () => { active = false; }; }, []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const navigate = (p: Page) => { setPage(p); setMobileNav(false); setQ(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const toggleSaved = (id: number) => setSaved(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  const handleFile = (file?: File) => { if (!file || !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) return; setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); setPlantResult(false); };
  const addListing = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim().slice(0, 100);
    const location = String(form.get('location') || '').trim().slice(0, 100);
    const kind = String(form.get('kind') || 'Produce') as Listing['kind'];
    const quantity = String(form.get('quantity') || '').trim().slice(0, 80);
    if (!name || !location || !quantity || !['Produce','Equipment','Services'].includes(kind)) return;
    setAllListings(old => [{ id: Date.now(), name, kind, location, price: 'Draft only', unit: '', quantity, label: 'Demo draft', icon: kind === 'Produce' ? '🌱' : kind === 'Equipment' ? '🚜' : '🚚', tone: 'sage', seller: 'Demo Farmer', verified: false }, ...old]);
    setListingComposer(false); setListingFeedback('Listing added to demo session only. No buyer can see or contact you.'); setMarketCategory('All');
  };
  const publish = () => { if (!newPost.trim()) return; setAllPosts(prev => [{ id: Date.now(), author: 'Demo Farmer', role: 'Farmer', district: 'Maharashtra', time: 'Just now', avatar: 'DF', topic: 'Discussion', text: newPost.trim(), likes: 0, replies: 0 }, ...prev]); setNewPost(''); setPostComposer(false); };
  const nav = (p: Page) => navigate(p);
  const searchMatches = allListings.filter(l => `${l.name} ${l.location} ${l.seller}`.toLowerCase().includes(q.toLowerCase()) && (marketCategory === 'All' || marketCategory === l.kind));
  return <div className={`app-shell theme-${theme}`}>
    <aside className={'sidebar' + (mobileNav ? ' sidebar-open' : '')}>
      <button className="brand" onClick={() => nav('Overview')} aria-label="KrishiGo homepage"><span className="brand-mark"><Sprout size={27} strokeWidth={2.2}/></span><span className="brand-words"><strong>krishi<span>go</span></strong><small>GROW BETTER, EVERY DAY</small></span></button>
      <div className="side-group-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Primary navigation">
        {navigation.map(n => <button key={n.label} className={'side-link' + (page === n.label ? ' selected' : '')} onClick={() => nav(n.label)}><n.icon size={19} strokeWidth={1.9}/><span>{n.label}</span>{n.label === 'Plant Doctor' && <span className="new-dot"/>}</button>)}
      </nav>
      <div className="side-group-label side-label-space">YOUR SPACE</div>
      <button className="side-link secondary" onClick={() => nav('Plant Doctor')}><HeartPulse size={19}/>Crop health</button>
      <button className="side-link secondary" onClick={() => { nav('Marketplace'); setMarketCategory('All'); }}><Bookmark size={19}/>Saved listings <span className="side-count">{saved.length}</span></button>
      <div className="sidebar-spacer"/>
      <div className="side-promo"><div className="promo-stars"><Sparkles size={23}/><span>FIELD INTELLIGENCE</span></div><strong>Every crop deserves better care.</strong><p>Ask Plant Doctor about your crop symptoms.</p><button onClick={() => nav('Plant Doctor')}>Explore Plant Doctor <ArrowRight size={15}/></button></div>
      <div className="side-profile"><div className="profile-avatar">KG</div><div><strong>Demo farmer</strong><small>Staging workspace</small></div><MoreHorizontal size={18}/></div>
    </aside>
    {mobileNav && <button className="mobile-backdrop" aria-label="Close menu" onClick={() => setMobileNav(false)}/>}
    <div className="main-shell">
      <header className="topbar"><button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={23}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{page}</strong></div>
        <div className="top-actions"><div className="searchbox"><Search size={17}/><input aria-label="Search market listings" placeholder="Search crops, listings, topics..." value={q} onChange={e => { setQ(e.target.value); if (e.target.value) setPage('Marketplace'); }}/><span>⌘ K</span></div>
          <div className="theme-switch" aria-label="Choose design theme">{([['forest','Forest'],['sand','Sand'],['night','Night']] as const).map(t => <button title={`${t[1]} design`} aria-label={`${t[1]} theme`} aria-pressed={theme===t[0]} className={theme===t[0]?'current':''} key={t[0]} onClick={() => setTheme(t[0])}><span className={'theme-dot '+t[0]}/><span className="theme-word">{t[1]}</span></button>)}</div>
          <div className="notification-wrap"><button className="icon-button" aria-label="Notifications" aria-expanded={notificationOpen} onClick={() => setNotificationOpen(v => !v)}><Bell size={19}/><span className="notification-dot"/></button>{notificationOpen && <div className="notification-panel"><strong>You're all caught up</strong><p>New crop care tips and buyer enquiries will appear here when connected.</p><DemoPill /></div>}</div><div className="header-avatar">KG</div></div>
      </header>
      <main className="page-content">
        {page === 'Overview' && <>
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR FARM COMPANION <DemoPill/></div><h1>Good morning, farmer <span className="wave">✳</span></h1><p>Here's what's happening across your agricultural world.</p></div><div className="date-chip"><CalendarDays size={17}/>{formatToday()}</div></div>
          <section className="hero-panel"><div className="hero-noise"/><div className="hero-copy"><div className="hero-kicker"><span className="kicker-glow"/> INTRODUCING KRISHIGO INTELLIGENCE</div><h2>From soil to<br/><em>success.</em></h2><p>A smarter way to care for your crops, connect with buyers and grow your farming business.</p><div className="hero-buttons"><button className="btn btn-lime" onClick={() => nav('Plant Doctor')}>Scan a plant <ArrowRight size={18}/></button><button className="btn btn-ghostlight" onClick={() => nav('Marketplace')}>Explore marketplace <ChevronRight size={18}/></button></div></div><div className="hero-plant"><div className="halo halo-one"/><div className="halo halo-two"/><PlantArtwork/><div className="float-pill float-one"><span className="float-icon"><Leaf size={15}/></span><div><small>Crop wellness</small><strong>Growing smarter</strong></div></div><div className="float-pill float-two"><span className="float-icon sun"><Sun size={15}/></span><div><small>Smart insights</small><strong>Always learning</strong></div></div></div><div className="hero-index">01 / 03 <span>━</span></div></section>
          <div className="stat-grid"><div className="stat-card"><div className="stat-card-top"><span className="icon-tile green"><Sprout size={21}/></span><span className="stat-trend"><ArrowUpRight size={14}/> +12%</span></div><p>Active crop profiles</p><strong>04 <small>crops</small></strong><MiniLine/></div><div className="stat-card"><div className="stat-card-top"><span className="icon-tile peach"><ScanLine size={21}/></span><span className="stat-trend"><ArrowUpRight size={14}/> +8%</span></div><p>Plant care sessions</p><strong>12 <small>checks</small></strong><MiniLine color="#e2a464"/></div><div className="stat-card"><div className="stat-card-top"><span className="icon-tile violet"><ShoppingBag size={21}/></span><span className="stat-trend"><ArrowUpRight size={14}/> +24%</span></div><p>Market opportunities</p><strong>08 <small>leads</small></strong><MiniLine color="#a29de8"/></div></div>
          <div className="dashboard-grid"><section className="surface-card growth-card"><div className="section-head"><div><div className="section-eyebrow">FARM ANALYTICS</div><h3>Field growth overview</h3><p>Illustrative crop health activity</p></div><button className="subtle-select" onClick={() => setChartPeriod(chartPeriod === '7 days' ? '30 days' : '7 days')}>{chartPeriod}<ChevronDown size={16}/></button></div><div className="growth-legend"><span><i className="legend-mark"/> Farm health index</span><strong>86<span>%</span> <small>+5.2%</small></strong></div><GrowthChart/></section><section className="surface-card weather-card"><div className="section-head"><div><div className="section-eyebrow">LOCAL CONDITIONS</div><h3>Weather outlook</h3></div><CloudSun size={22}/></div><div className="weather-main"><div><span className="weather-temp">28°</span><p>Partly cloudy · Pune</p></div><div className="weather-sun"><Sun size={55}/></div></div><div className="weather-detail"><span><Droplets size={15}/> 64% humidity</span><span><Wind size={15}/> 12 km/h winds</span></div><div className="forecast"><div><small>MON</small><Sun size={17}/><strong>28°</strong></div><div><small>TUE</small><CloudSun size={17}/><strong>29°</strong></div><div><small>WED</small><CloudSun size={17}/><strong>27°</strong></div><div><small>THU</small><Sun size={17}/><strong>30°</strong></div></div><p className="tiny-disclaimer">Illustrative forecast, not live weather.</p></section></div>
          <div className="bottom-grid"><section className="surface-card focus-card"><div className="section-head"><div><div className="section-eyebrow">CURATED FOR YOU</div><h3>Today’s focus</h3></div><button className="text-arrow" onClick={() => nav('Plant Doctor')}>Plant care <ArrowRight size={15}/></button></div><div className="task-row"><span className="task-icon yellow"><Droplets size={19}/></span><div><strong>Check irrigation schedule</strong><small>Monitor field moisture before watering</small></div><span className="priority-tag">Suggested</span></div><div className="task-row"><span className="task-icon green"><Leaf size={19}/></span><div><strong>Review your crop symptoms</strong><small>Use Plant Doctor to organize observations</small></div><ChevronRight size={17}/></div><div className="task-row"><span className="task-icon rose"><ShoppingBag size={19}/></span><div><strong>Explore new buyer requirements</strong><small>Discover produce opportunities nearby</small></div><ChevronRight size={17}/></div></section><section className="surface-card mandi-mini"><div className="section-head"><div><div className="section-eyebrow">MARKET INTELLIGENCE</div><h3>Mandi snapshot</h3></div><button className="text-arrow" onClick={() => nav('Insights')}>See all <ArrowRight size={15}/></button></div>{mandiMarkets.slice(0,3).map(m => <div className="mandi-mini-row" key={m.market}><div className="crop-round">{m.crop==='Tomato'?'🍅':m.crop==='Onion'?'🧅':'🌾'}</div><div><strong>{m.crop}</strong><small>{m.market}</small></div><strong className="mandi-val">{m.avg}</strong><span className={m.trend.startsWith('+')?'positive':'negative'}>{m.trend}</span></div>)}<p className="tiny-disclaimer">Sample prices for UI demonstration only.</p></section></div>
        </>}
        {page === 'Plant Doctor' && <>
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> SMART CROP CARE <DemoPill/></div><h1>Meet your Plant Doctor <span className="wave">✳</span></h1><p>Understand plant symptoms and take the next step with confidence.</p></div><div className="date-chip"><ShieldCheck size={17}/> Guided screening</div></div>
          <section className="doctor-header"><div><div className="hero-kicker">YOUR CROP CARE ASSISTANT</div><h2>A little attention.<br/><em>A healthier harvest.</em></h2><p>Upload your plant photo, tell us what you've noticed, and explore an example of how guided screening can work.</p></div><div className="doctor-art"><PlantArtwork small/></div></section>
          <div className="doctor-grid"><section className="surface-card scan-form"><div className="section-head"><div><div className="section-eyebrow">STEP 01 · ADD A PHOTO</div><h3>Scan your crop</h3></div><span className="small-status"><span/> Prototype</span></div>
              <input type="file" accept="image/*" capture="environment" ref={fileRef} onChange={(e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0])} hidden/>
              <div className="dropzone" onClick={() => fileRef.current?.click()} onKeyDown={e => { if (e.key === 'Enter') fileRef.current?.click(); }} tabIndex={0} role="button" aria-label="Upload a crop photograph" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}>
                {previewUrl ? <img src={previewUrl} alt="Uploaded crop preview" className="upload-preview"/> : <><div className="drop-icon"><Camera size={29}/></div><strong>Drop your crop photo here</strong><p>or click to capture / browse an image</p><small>JPG, PNG or WebP · Up to 10 MB</small></>}
                {previewUrl && <span className="image-overlay"><UploadCloud size={16}/> Change image</span>}
              </div>
              <div className="form-row"><label>Which crop?<select value={crop} onChange={e => { setCrop(e.target.value); setPlantResult(false); }}><option>Tomato</option><option>Onion</option><option>Soybean</option><option>Cotton</option><option>Chilli</option><option>Other crop</option></select></label><label>What have you noticed?<select value={symptoms} onChange={e => { setSymptoms(e.target.value); setPlantResult(false); }}><option>Yellowing / leaf spots</option><option>Wilting / drooping</option><option>Insect damage</option><option>Stunted growth</option><option>Not sure yet</option></select></label></div>
              <button className="btn btn-primary full" onClick={() => { setPlantResult(true); setScanTab('Guide'); }}><Sparkles size={17}/> Preview guided screening <ArrowRight size={18}/></button>
              <div className="scan-warning"><Info size={16}/><span>Demo only: this prototype does not analyze the photo or diagnose disease. The result shown is an example, regardless of the image uploaded.</span></div>
            </section><section className="surface-card result-card"><div className="section-head"><div><div className="section-eyebrow">STEP 02 · CARE GUIDANCE</div><h3>{plantResult ? 'Example screening report' : 'Your care companion'}</h3></div><span className="scan-badge"><Sparkles size={14}/> AI-ready</span></div>
              {plantResult ? <div className="result-content"><div className="result-banner"><span className="result-icon"><Leaf size={22}/></span><div><small>SAMPLE REPORT · NOT A DIAGNOSIS</small><strong>Possible leaf stress symptoms</strong><p>For a {crop.toLowerCase()} plant reporting {symptoms.toLowerCase()}, several conditions can look similar.</p></div></div><div className="tab-row"><button className={scanTab==='Guide'?'active':''} onClick={() => setScanTab('Guide')}>Next steps</button><button className={scanTab==='History'?'active':''} onClick={() => setScanTab('History')}>About accuracy</button></div>{scanTab==='Guide' ? <div className="care-steps"><div><span>01</span><p>Take clear photos of the whole plant, both sides of affected leaves, and surrounding plants.</p></div><div><span>02</span><p>Note when symptoms started, recent irrigation, weather, and any treatments already used.</p></div><div><span>03</span><p>Consult a qualified local agricultural specialist for identification and treatment selection.</p></div></div> : <p className="accuracy-copy">Many pests, diseases, and nutrient or water problems share visual symptoms. A future model should present alternatives and uncertainty, and escalate uncertain cases for expert review.</p>}<button className="btn btn-soft full" onClick={() => { setPlantResult(false); setSelectedFile(null); setPreviewUrl(null); }}>Start another scan <RefreshCw size={16}/></button></div> : <div className="result-empty"><div className="result-empty-icon"><Leaf size={47}/></div><strong>Every healthy harvest starts with understanding.</strong><p>Your guided screening preview will appear here. No diagnosis is being performed in this version.</p><div className="feature-list"><span><CheckCircle2 size={16}/> Structured observations</span><span><CheckCircle2 size={16}/> Clear next steps</span><span><CheckCircle2 size={16}/> Expert escalation</span></div></div>}
            </section></div>
          <div className="doctor-bottom"><section className="surface-card mini-advice"><span className="small-kicker">A BETTER WAY TO GROW</span><h3>Care that continues beyond a scan.</h3><p>In the production version, farmers will be able to record crop history, track follow-ups, and ask experts questions in regional languages.</p><div className="mini-advice-icons"><span><CalendarDays size={17}/> Crop diary</span><span><MessageCircle size={17}/> Expert answers</span><span><Volume2 size={17}/> Voice guidance</span></div></section><section className="surface-card tip-card"><div className="tip-icon"><Sun size={23}/></div><div><div className="section-eyebrow">FIELD TIP</div><h3>Good photos help more than guesses.</h3><p>Photograph the full plant as well as individual damaged areas in natural light. Always document field conditions.</p></div></section></div>
        </>}
        {page === 'Marketplace' && <><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> KRISHIGO MARKET <DemoPill/></div><h1>Grow it. Find it. Trade it.</h1><p>Discover agricultural produce, equipment and useful farm services.</p></div><button className="btn btn-primary" onClick={() => setListingComposer(v => !v)}><Plus size={18}/> Sell something</button></div>
          {listingComposer && <form className="surface-card workspace-form" onSubmit={addListing}><div className="section-eyebrow">DEMO SELLER WORKFLOW</div><h3>Create a listing draft</h3><div className="form-grid"><label>Listing title<input name="name" required maxLength={100} placeholder="Crop or equipment name"/></label><label>Category<select name="kind"><option>Produce</option><option>Equipment</option><option>Services</option></select></label><label>District or location<input name="location" required maxLength={100} placeholder="Pune, Maharashtra"/></label><label>Quantity / availability<input name="quantity" required maxLength={80} placeholder="e.g. 5 tonnes"/></label></div><button type="submit" className="btn btn-primary"><Plus size={17}/> Add to demo listings</button></form>}
          {listingFeedback && <div role="status" className="workspace-notice"><CheckCircle2 size={18}/>{listingFeedback}</div>}
          <section className="market-banner"><div><div className="section-eyebrow">FARM TO MARKET, CONNECTED</div><h2>Good harvests deserve<br/>great opportunities.</h2><p>Find the right buyers and services for your farming journey.</p></div><div className="market-art"><div className="market-emoji">🌽</div><div className="market-bubble">Fresh possibilities <ArrowUpRight size={16}/></div></div></section>
          <div className="filterbar"><div className="category-pills">{['All','Produce','Equipment','Services','Saved'].map(c => <button key={c} className={marketCategory===c?'active':''} onClick={() => setMarketCategory(c)}>{c}</button>)}</div><span className="filter-count"><SlidersHorizontal size={17}/> {marketCategory==='Saved'?saved.length:searchMatches.length} listings</span></div>
          <div className="product-grid">{allListings.filter(l => (marketCategory==='All'||marketCategory==='Saved'||l.kind===marketCategory) && (marketCategory!=='Saved'||saved.includes(l.id)) && `${l.name} ${l.location} ${l.seller}`.toLowerCase().includes(q.toLowerCase())).map(l => <article className="product-card" key={l.id}><div className={`product-image ${l.tone}`}><span className="product-illustration">{l.icon}</span><span className="product-tag">{l.label}</span><button className={'save-button'+(saved.includes(l.id)?' is-saved':'')} onClick={() => toggleSaved(l.id)} title={saved.includes(l.id)?'Unsave listing':'Save listing'} aria-label={saved.includes(l.id)?'Unsave listing':'Save listing'}><Heart size={18} fill={saved.includes(l.id)?'currentColor':'none'}/></button></div><div className="product-detail"><div className="product-location"><MapPin size={14}/>{l.location}</div><h3>{l.name}</h3><div className="price-row"><strong>{l.price}</strong><small>{l.unit}</small></div><div className="product-bottom"><span>{l.quantity}</span><span className="seller-name">{l.verified && <ShieldCheck size={14}/>} {l.seller}</span></div><button className="contact-btn" onClick={() => alert(`Demo listing: ${l.name}. Buyer enquiries will become available when PHP authentication and messaging are connected.`)}>View opportunity <ArrowRight size={16}/></button></div></article>)}</div>
          {((marketCategory==='Saved' && !saved.length)||(!searchMatches.length && marketCategory!=='Saved')) && <div className="empty-message"><ShoppingBag size={36}/><h3>No matching listings</h3><p>Try another crop, region or listing category.</p><button className="btn btn-primary" onClick={() => { setMarketCategory('All'); setQ(''); }}>See all listings</button></div>}
          <p className="page-disclaimer"><Info size={15}/> All listings, sellers and prices are fictional UI sample records. No real purchases or enquiries can be made in staging.</p>
        </>}
        {page === 'Community' && <><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> FARMER COMMUNITY <DemoPill/></div><h1>Better together, every season.</h1><p>Trade knowledge, ask questions and share what's working in the field.</p></div><button className="btn btn-primary" onClick={() => setPostComposer(v => !v)}><Plus size={18}/> New discussion</button></div>
          <section className="community-hero"><div className="community-hero-icon"><Users size={37}/></div><div><div className="section-eyebrow">KRISHIGO CIRCLE</div><h2>Where farmers help farmers grow.</h2><p>Questions, field stories, expert perspectives and meaningful connections — all in one place.</p></div><div className="community-circles"><span>AK</span><span>SF</span><span>RD</span><span>+</span></div></section>
          <div className="community-layout"><div className="post-feed"><div className="feed-tabs"><span className="feed-tab active">Community feed</span><span className="feed-count">{allPosts.length} discussions</span></div>{postComposer && <div className="surface-card composer"><div className="post-person"><span className="post-avatar">DF</span><div><strong>Demo Farmer</strong><small>Share an idea or ask a question</small></div></div><textarea aria-label="Write your community post" placeholder="What's on your mind about farming today?" value={newPost} onChange={e => setNewPost(e.target.value)} maxLength={1000}/><div className="composer-actions"><span>{newPost.length}/1000</span><button className="btn btn-primary" onClick={publish} disabled={!newPost.trim()}>Publish to demo feed <Send size={16}/></button></div></div>}{allPosts.filter(p => `${p.text} ${p.author} ${p.topic}`.toLowerCase().includes(q.toLowerCase())).map(p => <article className="surface-card community-post" key={p.id}><div className="post-head"><div className="post-person"><span className="post-avatar">{p.avatar}</span><div><strong>{p.author}</strong><small>{p.role} · {p.district} · {p.time}</small></div></div><span className="post-topic">{p.topic}</span></div><p>{p.text}</p><div className="post-actions"><button className={liked.includes(p.id)?'liked':''} onClick={() => setLiked(prev => prev.includes(p.id)?prev.filter(x=>x!==p.id):[...prev,p.id])}><Heart size={18} fill={liked.includes(p.id)?'currentColor':'none'}/> {p.likes + (liked.includes(p.id)?1:0)} Helpful</button><button onClick={() => alert('Replies will be enabled with the PHP community API.')}><MessageCircle size={18}/> {p.replies} Replies</button><span><ShieldCheck size={15}/> Moderated community</span></div></article>)}</div><aside className="community-right"><div className="surface-card conversation-card"><span className="small-kicker">TRENDING TOPICS</span><h3>What farmers are discussing</h3>{[['🌱','Crop health','124 conversations'],['💧','Water management','86 conversations'],['📈','Market prices','72 conversations'],['🚜','Farm equipment','51 conversations']].map((t,i) => <button key={t[1]} onClick={() => { setPostComposer(true); setNewPost(`${t[1]}: `); }}><span>{t[0]}</span><div><strong>{t[1]}</strong><small>{t[2]}</small></div><ChevronRight size={17}/><small className="topic-rank">0{i+1}</small></button>)}</div><div className="community-join"><Sparkles size={25}/><h3>Your knowledge can help another farmer.</h3><p>Share an experience, ask a thoughtful question or offer practical field advice.</p><button className="btn btn-lime" onClick={() => setPostComposer(true)}>Start a discussion <ArrowRight size={16}/></button></div></aside></div>
          <p className="page-disclaimer"><Info size={15}/> This is a demo-only in-memory feed; changes disappear when the page reloads. Do not use community posts as verified crop-treatment advice.</p>
        </>}
        {page === 'Insights' && <><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> MARKET & FARM INTELLIGENCE <DemoPill/></div><h1>Make every decision count.</h1><p>Explore how mandi information and farm trends will come together.</p></div><div className="date-chip"><MapPin size={16}/> Maharashtra</div></div>
          <div className="insights-banner"><div><div className="section-eyebrow">DATA, WITH PURPOSE</div><h2>Clarity from field<br/>to market.</h2><p>Bring together verified prices, historical trends and timely insights.</p></div><div className="insights-big-number"><small>ILLUSTRATIVE PRICE SIGNAL</small><strong>+5.4%</strong><MiniLine color="#bcf0a3"/></div></div>
          <div className="insights-grid"><section className="surface-card insights-chart"><div className="section-head"><div><div className="section-eyebrow">COMMODITY OVERVIEW</div><h3>Market activity trends</h3><p>Example trend chart for UI evaluation</p></div><button className="subtle-select" onClick={() => setChartPeriod(chartPeriod==='7 days'?'30 days':'7 days')}>{chartPeriod}<ChevronDown size={16}/></button></div><div className="growth-legend"><span><i className="legend-mark"/> Sample price trend</span><strong>+5.4<span>%</span></strong></div><GrowthChart/></section><section className="surface-card insights-metrics"><div className="section-eyebrow">FIELD METRICS</div><h3>Environmental snapshot</h3><div className="metric-box lime"><span><Droplets size={20}/> Water oversight</span><strong>64<span>%</span></strong><small>Example moisture index</small></div><div className="metric-split"><div><Thermometer size={19}/><strong>28°</strong><small>Temperature</small></div><div><Activity size={19}/><strong>86%</strong><small>Crop health demo</small></div></div></section></div>
          <section className="surface-card market-table"><div className="section-head"><div><div className="section-eyebrow">MANDI EXPLORER</div><h3>Sample commodity prices</h3><p>Structured for future verified market feeds</p></div><span className="small-status"><span/> No live feed</span></div><div className="table-wrap"><table><thead><tr><th>Market</th><th>Commodity</th><th>Minimum</th><th>Maximum</th><th>Average</th><th>Change</th></tr></thead><tbody>{mandiMarkets.map(m => <tr key={m.market}><td><strong>{m.market}</strong></td><td>{m.crop}</td><td>{m.min}</td><td>{m.max}</td><td><strong>{m.avg}</strong></td><td><span className={m.trend.startsWith('+')?'positive':'negative'}>{m.trend}</span></td></tr>)}</tbody></table></div><p className="tiny-disclaimer">Prices, changes and charts on this screen are fictitious samples, not trading or agricultural advice.</p></section>
        </>}
        {(['Buyers','Services','Discover','Crop Journal','Admin'] as const).includes(page as 'Buyers'|'Services'|'Discover'|'Crop Journal'|'Admin') && <Workspaces key={page} page={page as 'Buyers'|'Services'|'Discover'|'Crop Journal'|'Admin'}/>}
        <footer className="footer"><div><Sprout size={16}/> KrishiGo <span>·</span> Designed for the next generation of farming</div><span>{isDemo ? 'Staging prototype · no database · sample information' : 'Connected application'}</span></footer>
      </main>
    </div>
  </div>;
}
export default App;
