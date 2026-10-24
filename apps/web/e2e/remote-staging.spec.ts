import {expect,test} from '@playwright/test';
test('Cloudways staging page captures actual server and browser performance timings',async({page},info)=>{
 await page.addInitScript(()=>{
  const summary:{lcp:number,cls:number}={lcp:0,cls:0};
  (window as typeof window & {__perfSummary?:typeof summary}).__perfSummary=summary;
  try{new PerformanceObserver(list=>list.getEntries().forEach(entry=>{summary.lcp=entry.startTime;})).observe({type:'largest-contentful-paint',buffered:true});}catch{}
  try{new PerformanceObserver(list=>list.getEntries().forEach(entry=>{const r=entry as PerformanceEntry & {value:number;hadRecentInput:boolean};if(!r.hadRecentInput)summary.cls+=r.value;})).observe({type:'layout-shift',buffered:true});}catch{}
 });
 const response=await page.goto('/krishigo/',{waitUntil:'domcontentloaded'});
 expect(response?.status(),'Stage shell must load before measuring browser experience').toBe(200);
 await expect(page.getByRole('button',{name:'KrishiGo homepage'})).toBeVisible();
 await page.waitForTimeout(1500);
 const metrics=await page.evaluate(()=>{
  const n=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
  const paint=performance.getEntriesByName('first-contentful-paint')[0];
  return {ttfb_ms:n?.responseStart??null,dom_content_loaded_ms:n?.domContentLoadedEventEnd??null,
          fcp_ms:paint?.startTime??null,
          ...((window as typeof window & {__perfSummary?:{lcp:number;cls:number}}).__perfSummary||{lcp:0,cls:0}),
          resource_count:performance.getEntriesByType('resource').length};
 });
 await info.attach('cloudways-observed-browser-metrics.json',{body:Buffer.from(JSON.stringify({...metrics,measurement:'GitHub remote Chromium navigation, not field INP/LCP'},null,2)),contentType:'application/json'});
 console.log(JSON.stringify(metrics));
});
