import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
await p.goto('http://localhost:8787/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(8000);
const links=await p.evaluate(()=>[...document.querySelectorAll('menu a, #b a, a.button')].map(a=>({t:a.textContent.trim(),h:a.getAttribute('href')})));
console.log(links);
await b.close();
