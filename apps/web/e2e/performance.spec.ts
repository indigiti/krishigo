import {expect,test} from '@playwright/test';
/** Captures browser timing evidence; synthetic CI is not a field performance guarantee. */
test('records static staging navigation and paint timings',async({page},info)=>{
 await page.addInitScript(()=>{
  (window as typeof window & {__kgCls?:number}).__kgCls=0;
  const observer=new PerformanceObserver(list=>{
   for(const entry of list.getEntries() as Array<PerformanceEntry & {value?:number;hadRecentInput?:boolean}>){
    if(!entry.hadRecentInput)(window as typeof window & {__kgCls?:number}).__kgCls!+=entry.value||0;
   }
  });
  try{observer.observe({type:'layout-shift',buffered:true});}catch{/* browser support varies */}
 });
 const began=Date.now();
 await page.goto('/krishigo/');
 await expect(page.getByRole('button',{name:'KrishiGo homepage'})).toBeVisible();
 const report=await page.evaluate(()=>{
  const entry=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
  const fcp=performance.getEntriesByName('first-contentful-paint')[0];
  return {ttfb_ms:entry?.responseStart??null,dom_content_loaded_ms:entry?.domContentLoadedEventEnd??null,
   document_load_ms:entry?.loadEventEnd??null,fcp_ms:fcp?.startTime??null,
   cls:(window as typeof window & {__kgCls?:number}).__kgCls??null,
   transfer_bytes:performance.getEntriesByType('resource').reduce((n,e)=>n+((e as PerformanceResourceTiming).transferSize||0),0)};
 });
 await info.attach('staging-browser-timings.json',{body:Buffer.from(JSON.stringify({...report,wall_ms:Date.now()-began,environment:'CI Chromium; not Cloudways field data'},null,2)),contentType:'application/json'});
 expect(report.dom_content_loaded_ms).not.toBeNull();
});
