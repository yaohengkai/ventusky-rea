import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
let req=[];
p.on('request', r=>{const u=r.url(); if(/data\.ventusky/.test(u)){req.push(u); console.log('REQ',u)}});
await p.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
const out = await p.evaluate(()=>{
  const a=[...document.querySelectorAll('#i>a')].find(x=>x.textContent.trim()==='Sea');
  const s=a.nextElementSibling.querySelector('select');
  s.value='currents'; s.dispatchEvent(new Event('change',{bubbles:true}));
  return {val:s.value, title:document.title};
});
console.log(out);
await p.waitForTimeout(8000);
console.log('TITLE2', await p.title());
console.log('N',req.length);
await p.screenshot({path:'sea2.png'});
await b.close();
