import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
await p.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
const out = await p.evaluate(()=>[...document.querySelectorAll('select')].map((s,i)=>({i,id:s.id,name:s.name,cls:s.className,val:s.value,parent:s.parentElement.parentElement.className,n:s.options.length,first:[...s.options].slice(0,4).map(o=>o.textContent.trim())})));
console.log(JSON.stringify(out,null,1));
await b.close();
