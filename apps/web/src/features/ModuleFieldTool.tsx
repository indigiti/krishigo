import {useMemo,useState} from 'react';
import {Calculator,CheckCircle2,ClipboardCheck,Info,RotateCcw,ShieldAlert} from 'lucide-react';
import {evaluateModuleCalculator,moduleFieldTools,taskPlanCompletion} from '../domain/moduleFieldTools';

type Entry=Readonly<Record<string,string>>;
function defaultEntry(moduleId:number):Record<string,string>{
 const t=moduleFieldTools[moduleId];
 return t?.kind==='calculator'?Object.fromEntries(t.fields.map(f=>[f.key,String(f.initial)])):{};
}
function CalculatorPanel({moduleId}:{moduleId:number}){
 const tool=moduleFieldTools[moduleId];
 const [entries,setEntries]=useState<Entry>(()=>defaultEntry(moduleId));
 const result=useMemo(()=>{
  const numbers:Record<string,number>={};
  if(tool?.kind!=='calculator')return null;
  for(const field of tool.fields){
   const raw=entries[field.key];
   if(raw===undefined||raw.trim()==='')return evaluateModuleCalculator(moduleId,{});
   numbers[field.key]=Number(raw);
  }
  return evaluateModuleCalculator(moduleId,numbers);
 },[moduleId,tool,entries]);
 if(tool?.kind!=='calculator')return null;
 return <section className="surface-card field-tool" aria-label={'Field tool: '+tool.title}>
  <div className="field-tool-top"><div><span className="section-eyebrow">M19 FIELD WORKBENCH · YOUR OWN NUMBERS</span>
   <h3><Calculator size={22}/>{tool.title}</h3><p>{tool.description}</p></div>
   <span className="field-tool-demo">Local simulation</span></div>
  <div className="field-tool-fields">
   {tool.fields.map(f=><label key={f.key}>{f.label}<span className="field-tool-unit">{f.unit}</span>
    <input aria-label={f.label} type="number" min={f.min} max={f.max} step={f.whole?1:"any"} value={entries[f.key]||''}
     onChange={e=>setEntries(prev=>({...prev,[f.key]:e.target.value}))}/>
   </label>)}
  </div>
  <div className="field-tool-outcome" role="status">
   <div><span>{tool.resultLabel}</span>
    <strong data-testid={'field-result-'+moduleId}>{result?.valid?result.value?.toLocaleString('en-IN',{maximumFractionDigits:tool.precision})+' '+tool.resultUnit:'Check input values'}</strong>
    {!result?.valid&&<small>{result?.reason}</small>}
   </div>
   <button type="button" onClick={()=>setEntries(defaultEntry(moduleId))}><RotateCcw size={15}/> Reset</button>
  </div>
  <div className="field-tool-caution"><ShieldAlert size={16}/><p>{tool.notice} Values are hypothetical or entered manually, and no external service is contacted.</p></div>
 </section>;
}
function ActionPlanPanel({moduleId}:{moduleId:number}){
 const tool=moduleFieldTools[moduleId];
 const [done,setDone]=useState<number[]>([]);
 const complete=useMemo(()=>taskPlanCompletion(moduleId,done),[moduleId,done]);
 if(tool?.kind!=='action-plan')return null;
 return <section className="surface-card field-tool" aria-label={'Field tool: '+tool.title}>
  <div className="field-tool-top"><div>
   <span className="section-eyebrow">M19 FIELD WORKBENCH · ACTION PREPARATION</span>
   <h3><ClipboardCheck size={22}/>{tool.title}</h3><p>{tool.description}</p>
  </div><span className="field-tool-demo">Local plan</span></div>
  <div className="field-tool-progress"><div><strong>{complete.done} of {complete.total} tasks</strong><span>{complete.percent}% noted in this session</span></div>
   <div className="field-tool-track"><span style={{width:complete.percent+'%'}}/></div></div>
  <div className="field-tool-steps">
   {tool.steps.map((step,index)=><label key={index} className={done.includes(index)?'checked':''}>
    <input type="checkbox" checked={done.includes(index)} onChange={e=>setDone(prev=>e.target.checked?[...prev,index]:prev.filter(x=>x!==index))}/>
    <span><strong>{step.label}</strong><small>{step.note}</small></span>
    {done.includes(index)&&<CheckCircle2 size={18}/>}
   </label>)}
  </div>
  <div className="field-tool-action"><button type="button" onClick={()=>setDone([])}><RotateCcw size={15}/> Reset plan</button>
   <small>Selections are temporary; refreshing clears them.</small></div>
  <div className="field-tool-caution"><Info size={16}/><p>{tool.notice}</p></div>
 </section>;
}
export function ModuleFieldTool({moduleId}:{moduleId:number}){
 const tool=moduleFieldTools[moduleId];
 if(!tool)return null;
 return tool.kind==='calculator'?<CalculatorPanel moduleId={moduleId}/>:<ActionPlanPanel moduleId={moduleId}/>;
}
