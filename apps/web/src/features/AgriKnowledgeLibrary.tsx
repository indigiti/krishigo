import {useMemo,useState} from 'react';
import {BookOpenText,ExternalLink,Filter,FlaskConical,Leaf,Search,ShieldAlert} from 'lucide-react';
import {knowledgeCrops} from './agriKnowledgeCore';
import {filterCropInputTopics,filterPestDiseaseGuides,filterNutrientGuides,cropByName} from './agriKnowledgeSearch';

type Section='crop'|'pests'|'nutrients';
const cropNames=knowledgeCrops.map(x=>x.name);
function SourceLink({url,label}:{url:string;label:string}){
 return <a className="agri-library-source" href={url} target="_blank" rel="noopener noreferrer" aria-label={'Open source: '+label}>
  <BookOpenText size={14}/><span>{label}</span><ExternalLink size={13}/>
 </a>;
}
function SafetyNote(){return <p className="agri-library-warning"><ShieldAlert size={17}/>
 <span>Educational recognition only — not a diagnosis, registered crop-use claim, product endorsement or treatment plan.
 Source pages may contain historical pesticide recommendations that require current Indian label and legal verification.</span></p>;}
export default function AgriKnowledgeLibrary({section,crop,onCropChange}:{
 section:Section;crop:string;onCropChange:(crop:string)=>void;
}){
 const [search,setSearch]=useState('');
 const [filter,setFilter]=useState('All');
 const cropGuide=cropByName(crop);
 const topics=useMemo(()=>filterCropInputTopics(crop,search),[crop,search]);
 const issues=useMemo(()=>filterPestDiseaseGuides(crop,search,filter),[crop,search,filter]);
 const nutrients=useMemo(()=>filterNutrientGuides(search,filter),[search,filter]);
 const count=section==='crop'?topics.length:section==='pests'?issues.length:nutrients.length;
 return <div className="agri-library" aria-label={section==='crop'?'Crop-wise knowledge library':section==='pests'?'Pest and disease knowledge library':'Nutrient knowledge library'}>
  <div className="agri-library-head"><div><span className="section-eyebrow">KRISHIGO · STARTER KNOWLEDGE LIBRARY</span>
   <h3>{section==='crop'?'Crop and input fundamentals':section==='pests'?'Field identification reference':'Nutrient symptom reference'}</h3>
   <p>{section==='crop'?'Learn what each agricultural input category is and what evidence to check.':
    section==='pests'?'Recognize possible signs, inspect the field and compare lookalike causes.':
    'Understand nutrient roles, possible symptoms, lookalikes and tests before taking action.'}</p>
   </div><div className="agri-library-count"><BookOpenText size={18}/><strong>{count}</strong><span>guides</span></div></div>
  <div className="agri-library-controls">
   {section==='pests'&&<label>Crop<select aria-label="Crop for pest library" value={crop} onChange={e=>{onCropChange(e.target.value);setSearch('');}}>
    {cropNames.map(x=><option key={x} value={x}>{x}</option>)}
    <option value="All crops">All crops</option>
   </select></label>}
   {section==='nutrients'&&<label>Nutrient group<select aria-label="Nutrient group" value={filter} onChange={e=>setFilter(e.target.value)}>
    {['All','Primary nutrient','Secondary nutrient','Micronutrient'].map(x=><option key={x}>{x}</option>)}
   </select></label>}
   {section==='pests'&&<label>Topic type<select aria-label="Pest or disease topic" value={filter} onChange={e=>setFilter(e.target.value)}>
    {['All','Insect or mite','Disease'].map(x=><option key={x}>{x}</option>)}
   </select></label>}
   <label className="agri-library-search"><Search size={16}/><input type="search"
    aria-label={section==='crop'?'Search crop knowledge':section==='pests'?'Search pest and disease guides':'Search nutrient library'}
    placeholder={section==='crop'?'Search water-soluble, micronutrients…':section==='pests'?'Search thrips, leaf spots, blight…':'Search N, zinc, yellowing, जस्त…'}
    maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}/></label>
  </div>
  {section==='crop'&&cropGuide&&<article className="agri-crop-profile">
   <div className="agri-crop-heading"><span className="agri-crop-mark"><Leaf size={22}/></span><div><span className="section-eyebrow">CROP FIELD PROFILE · {cropGuide.group.toUpperCase()}</span>
    <h3>{cropGuide.name} <small>{cropGuide.marathi} · {cropGuide.hindi}</small></h3></div></div>
   <p>{cropGuide.summary}</p><strong className="agri-subheading">What to observe</strong>
   <ul>{cropGuide.observe.map(x=><li key={x}>{x}</li>)}</ul>
   <SourceLink url={cropGuide.sourceUrl} label={cropGuide.sourceTitle}/>
  </article>}
  {section==='crop'&&!cropGuide&&<p className="agri-library-empty">Select a named crop to see its field profile. No generic product approval can be inferred for “Other”.</p>}
  <div className="agri-knowledge-grid">
   {section==='crop'&&topics.map(x=><article className="agri-knowledge-card" key={x.id}>
    <div className="agri-knowledge-card-top"><span className="agri-knowledge-icon"><FlaskConical size={19}/></span><span className="agri-knowledge-kind">{x.kind}</span></div>
    <h4>{x.name}</h4><p>{x.overview}</p><div className="agri-knowledge-detail"><strong>Before selecting a product</strong><p>{x.check}</p></div>
    <SourceLink url={x.sourceUrl} label={x.sourceTitle}/></article>)}
   {section==='pests'&&issues.map(x=><article className="agri-knowledge-card" key={x.id}>
    <div className="agri-knowledge-card-top"><span className="agri-knowledge-icon"><Leaf size={19}/></span>
     <span className="agri-knowledge-kind">{x.kind} · {knowledgeCrops.find(c=>c.id===x.crop)?.name}</span></div>
    <h4>{x.name}</h4>{x.scientific&&<span className="agri-scientific">{x.scientific}</span>}
    <div className="agri-knowledge-detail"><strong>Possible signs</strong><p>{x.signs}</p></div>
    <div className="agri-knowledge-detail"><strong>What to inspect</strong><p>{x.scout}</p></div>
    <div className="agri-knowledge-detail"><strong>Could also be</strong><p>{x.alternatives}</p></div>
    <SourceLink url={x.sourceUrl} label={x.sourceTitle}/></article>)}
   {section==='nutrients'&&nutrients.map(x=><article className="agri-knowledge-card" key={x.id}>
    <div className="agri-knowledge-card-top"><span className="agri-element-mark">{x.symbol}</span><span className="agri-knowledge-kind">{x.group}</span></div>
    <h4>{x.name}</h4><p>{x.role}</p>
    <div className="agri-knowledge-detail"><strong>Possible signs</strong><p>{x.possibleSigns}</p></div>
    <div className="agri-knowledge-detail"><strong>Where signs may start</strong><p>{x.firstSeen}</p></div>
    <div className="agri-knowledge-detail"><strong>Check before diagnosing</strong><p>{x.confirm}</p></div>
    <div className="agri-knowledge-detail"><strong>Lookalikes</strong><p>{x.lookAlikes}</p></div>
    <SourceLink url={x.sourceUrl} label={x.sourceTitle}/></article>)}
  </div>
  {count===0&&<div className="agri-library-empty"><Filter size={18}/><p>No guides match your search. Try another crop or broader keyword.</p></div>}
  <SafetyNote/>
 </div>;
}
