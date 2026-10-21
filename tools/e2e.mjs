import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
const fails=[], errs=[];
p.on('requestfailed', r=>{ if(!r.url().startsWith('data:')) { fails.push(r.url()); console.log('FAIL',r.url().slice(0,160),r.failure()?.errorText); }});
p.on('console', m=>{if(m.type()==='error'){errs.push(m.text().slice(0,200)); console.log('CONSOLE',m.text().slice(0,200))}});
p.on('pageerror', e=>{errs.push(e.message); console.log('PAGEERROR',e.message.slice(0,200))});
await p.goto('http://localhost:8787/',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(9000);
console.log('HOME',await p.title());
// Sea -> currents
await p.evaluate(()=>{const a=[...document.querySelectorAll('#i>a')].find(x=>x.textContent.trim()==='Sea'); a.click();});
await p.waitForTimeout(1000);
await p.evaluate(()=>{const a=[...document.querySelectorAll('#i>a')].find(x=>x.textContent.trim()==='Sea'); const s=a.nextElementSibling.querySelector('select'); s.value='currents'; s.dispatchEvent(new Event('change',{bubbles:true}));});
await p.waitForTimeout(5000);
console.log('SEA',await p.title());
await p.screenshot({path:'e2e_sea.png'});
// click map to open city page
await p.mouse.click(720,450);
await p.waitForTimeout(8000);
console.log('CITY',await p.title(),p.url());
await p.screenshot({path:'e2e_city.png'});
console.log('FAILS',fails.length,'ERRS',errs.length);
await b.close();
