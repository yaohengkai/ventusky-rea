import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
await p.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
const out = await p.evaluate(()=>{
  const labs=[...document.querySelectorAll('label.v.n.m, label.v.n, label.n.m')];
  return labs.map(l=>({cls:l.className,txt:l.textContent.trim().slice(0,500),html:l.outerHTML.slice(0,5000)}));
});
console.log(JSON.stringify(out,null,1).slice(0,12000));
await b.close();
