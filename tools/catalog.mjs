import { chromium } from 'playwright-core';
import fs from 'node:fs';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
await p.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
const data = await p.evaluate(()=>{
  const tops=[...document.querySelectorAll('#i > a')];
  const layers=tops.map((a,i)=>{
    const d=a.nextElementSibling;
    const opts = d && d.tagName==='DIV' ? [...d.querySelectorAll('select option')].map(o=>({v:o.value,t:o.textContent.trim()})) : [];
    return {i, txt:a.textContent.trim(), cls:a.className, opts};
  });
  const sels=[...document.querySelectorAll('select')].map(s=>({name:s.name,id:s.id,cls:s.className,opts:[...s.options].map(o=>({v:o.value,t:o.textContent.trim()})).slice(0,80)}));
  return {layers,sels};
});
console.log(JSON.stringify(data,null,1));
fs.writeFileSync('catalog.json',JSON.stringify(data,null,2));
await b.close();
