import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
await p.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
const out = await p.evaluate(()=>{
  const s=document.querySelector('select#z') || [...document.querySelectorAll('select')].find(x=>x.id==='z');
  const groups=[...s.querySelectorAll('optgroup')].map(g=>({label:g.label, opts:[...g.querySelectorAll('option')].map(o=>({v:o.value,t:o.textContent.trim()}))}));
  return {value:s.value, groups, opts:[...s.options].map(o=>({v:o.value,t:o.textContent.trim(),g:o.parentElement.tagName+':'+(o.parentElement.label||'')}))};
});
console.log(JSON.stringify(out,null,1));
await b.close();
