import { chromium } from 'playwright-core';
import fs from 'node:fs';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
await p.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
const out = await p.evaluate(()=>{
  const s=document.querySelector('label.v.n.m select');
  return [...s.querySelectorAll('option')].map(o=>({v:o.value,t:o.textContent.trim(),g:o.parentElement.label||''}));
});
console.log(JSON.stringify(out,null,1));
fs.writeFileSync('models-ui.json',JSON.stringify(out,null,2));
await b.close();
