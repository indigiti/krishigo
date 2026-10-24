import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera, CheckCircle2, ClipboardList, Info, Leaf, LockKeyhole, Plus, ShieldCheck, Trash2, UserRound, Users } from 'lucide-react';

type PreviewRole = 'Farmer'|'Buyer'|'FPO coordinator'|'Agronomist'|'Editor';
const permissions: Record<PreviewRole,string[]> = {
  Farmer: ['Manage crop profiles', 'Draft produce listings', 'Ask crop-care questions'],
  Buyer: ['Draft procurement requirements', 'Save produce opportunities', 'Request supplier verification'],
  'FPO coordinator': ['Organize member lots', 'Prepare bulk harvest plans', 'Manage FPO enquiries'],
  Agronomist: ['Review referred crop cases', 'Provide expert-reviewed guidance', 'Flag urgent risk'],
  Editor: ['Review reported listings', 'Moderate community content', 'Verify sources before publishing'],
};

export function ProfileWorkspace() {
  const [role,setRole] = useState<PreviewRole>('Farmer');
  const [language,setLanguage] = useState('Marathi');
  const [district,setDistrict] = useState('Pune');
  const [crop,setCrop] = useState('Tomato');
  const [confirmed,setConfirmed] = useState(false);
  const changeRole = (next:PreviewRole) => {setRole(next);setConfirmed(false);};
  return <>
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> FARMER & BUSINESS IDENTITY <span className="demo-pill">PREVIEW</span></div><h1>Your agriculture profile.</h1><p>Explore role-specific experiences before real registration and identity verification are available.</p></div></div>
    <section className="identity-layout">
      <div className="surface-card identity-card"><div className="identity-avatar"><UserRound size={32}/></div><span className="section-eyebrow">LOCAL DEMONSTRATION</span><h2>Demo KrishiGo member</h2><p>Select a profile role and preferences. Nothing is sent to a server or saved to a database.</p>
        <label>Account role<select value={role} onChange={e=>changeRole(e.target.value as PreviewRole)}>{Object.keys(permissions).map(r=><option key={r}>{r}</option>)}</select></label>
        <label>Preferred language<select value={language} onChange={e=>{setLanguage(e.target.value);setConfirmed(false);}}><option>Marathi</option><option>Hindi</option><option>English</option></select></label>
        <label>District<input value={district} maxLength={80} onChange={e=>{setDistrict(e.target.value);setConfirmed(false);}} aria-label="District"/></label>
        <label>Primary crop<input value={crop} maxLength={80} onChange={e=>{setCrop(e.target.value);setConfirmed(false);}} aria-label="Primary crop"/></label>
        <button className="btn btn-primary" onClick={()=>setConfirmed(true)}><CheckCircle2 size={17}/> Preview preferences</button>
        {confirmed&&<p role="status" className="workspace-notice">Preview: {role} · {language} · {district.trim()||'Unspecified district'} · {crop.trim()||'Unspecified crop'}. No account created.</p>}
      </div>
      <div className="surface-card identity-permissions"><div className="section-eyebrow">ROLE EXPERIENCE</div><h3>{role} workspace</h3><p>Proposed actions after secure PHP authentication and account verification are implemented:</p><div className="permission-list">{permissions[role].map(p=><div key={p}><ShieldCheck size={18}/><span>{p}</span></div>)}</div><div className="workspace-notice"><LockKeyhole size={18}/> Selecting a role here does not grant API permissions. Production permissions will always be validated by the PHP backend.</div></div>
    </section>
    <p className="page-disclaimer"><Info size={15}/> This is an in-memory UI preview, not registration, login, KYC or verified profile data. Marathi/Hindi selections preview preferences only; full interface translations are pending.</p>
  </>;
}

type CaseRecord = {id:number; crop:string; symptom:string; stage:string; imageUrl:string|null};
const sampleCases:CaseRecord[] = [{id:100,crop:'Tomato',symptom:'Illustrative: patches on older leaves after rain',stage:'Example only',imageUrl:null}];
export function CasesWorkspace(){
  const [cases,setCases]=useState<CaseRecord[]>(sampleCases);
  const [crop,setCrop]=useState('Tomato');const [symptom,setSymptom]=useState('');const [stage,setStage]=useState('Flowering');
  const [imageUrl,setImageUrl]=useState<string|null>(null);const [warning,setWarning]=useState('');
  const photoUrls = useRef<string[]>([]);
  useEffect(()=>()=>{photoUrls.current.forEach(url=>URL.revokeObjectURL(url));},[]);
  const onPhoto=(e:ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>5*1024*1024){setWarning('Choose a JPEG, PNG or WebP image under 5 MB.');e.target.value='';return;}
    const url=URL.createObjectURL(file);photoUrls.current.push(url);setImageUrl(url);setWarning('Photograph stays in this browser only; no upload or image analysis will happen.');
  };
  const add=(e:FormEvent)=>{e.preventDefault();if(!symptom.trim())return;
    setCases(prev=>[{id:Date.now(),crop,stage,symptom:symptom.trim().slice(0,600),imageUrl},...prev]);
    setSymptom('');setImageUrl(null);setWarning('Case added to this temporary session. No AI diagnosis, expert referral or cloud upload occurred.');
  };
  const remove=(id:number)=>setCases(prev=>{const existing=prev.find(c=>c.id===id);if(existing?.imageUrl) URL.revokeObjectURL(existing.imageUrl);return prev.filter(c=>c.id!==id);});
  return <>
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> CROP HEALTH FOLLOW-UP <span className="demo-pill">NO AI</span></div><h1>Plant care case journal.</h1><p>Organize field photographs and symptoms for future expert review. This is not a diagnosis.</p></div></div>
    <div className="identity-layout">
      <form className="surface-card identity-card" onSubmit={add}><div className="section-eyebrow">NEW OBSERVATION</div><h3>Document a crop concern</h3>
        <label>Crop<select value={crop} onChange={e=>setCrop(e.target.value)}>{['Tomato','Onion','Soybean','Cotton','Chilli','Sugarcane','Other'].map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Growth stage<select value={stage} onChange={e=>setStage(e.target.value)}>{['Seedling','Vegetative','Flowering','Fruiting','Harvest','Unknown'].map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Observed symptoms<textarea value={symptom} maxLength={600} rows={5} onChange={e=>setSymptom(e.target.value)} placeholder="Describe leaf appearance, weather, duration and parts affected..." required/></label>
        <label className="case-file-label"><Camera size={19}/> Attach optional photo (local preview only)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhoto}/></label>
        {imageUrl&&<img className="case-preview" src={imageUrl} alt="Local preview of selected crop"/>}
        <button type="submit" className="btn btn-primary" disabled={!symptom.trim()}><Plus size={17}/> Add temporary case</button>
        {warning&&<div className="workspace-notice" role="status"><Info size={16}/>{warning}</div>}
      </form>
      <section className="surface-card identity-permissions"><div className="section-eyebrow">TEMPORARY CASE RECORDS</div><h3>{cases.length} observation{cases.length===1?'':'s'}</h3><div className="case-list">{cases.map(c=><article key={c.id} className="case-item"><span className="case-icon"><Leaf size={18}/></span><div><strong>{c.crop} · {c.stage}</strong><p>{c.symptom}</p><small>{c.id===100?'Fictional example':'Session draft · never uploaded'}</small>{c.imageUrl&&<img src={c.imageUrl} alt="Attached crop observation" className="case-thumb"/>}</div><button title="Discard observation" aria-label="Discard observation" onClick={()=>remove(c.id)}><Trash2 size={17}/></button></article>)}</div>
        <div className="workspace-notice"><Users size={18}/> Expert review and disease-screening services are planned, not running. Avoid chemical treatment based solely on a picture.</div></section>
    </div>
    <p className="page-disclaimer"><Info size={15}/> No database, no upload, no real diagnosis. All entered records disappear when the page reloads. Photographs should not include identifying personal information.</p>
  </>;
}
