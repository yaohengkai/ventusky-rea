import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
const fails=[], errs=[];
p.on('requestfailed', r=>{if(!r.url().startsWith('data:')){fails.push(r.url()); console.log('FAIL',r.url().slice(0,140))}});
p.on('console', m=>{if(m.type()==='error'){errs.push(m.text().slice(0,160)); console.log('CONSOLE',m.text().slice(0,160))}});
p.on('pageerror', e=>{errs.push(e.message); console.log('PAGEERROR',e.message.slice(0,160))});
await p.goto('http://localhost:8787/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(8000);
console.log('HOME',await p.title());
// sea currents
await p.evaluate(()=>{const a=[...document.querySelectorAll('#i>a')].find(x=>x.textContent.trim()==='Sea'); a.click();});
await p.waitForTimeout(800);
await p.evaluate(()=>{const a=[...document.querySelectorAll('#i>a')].find(x=>x.textContent.trim()==='Sea'); const s=a.nextElementSibling.querySelector('select'); s.value='tide'; s.dispatchEvent(new Event('change',{bubbles:true}));});
await p.waitForTimeout(4000);
console.log('TIDE',await p.title(),await p.locator('#k').innerText().catch(()=>'').then(t=>t.slice(0,80)));
// city
await p.mouse.click(720,450); await p.waitForTimeout(7000);
console.log('CITY',await p.title());
// zh
await p.goto('http://localhost:8787/zh',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(6000);
console.log('ZH',await p.title(),await p.evaluate(()=>document.documentElement.lang));
// lab
await p.goto('http://localhost:8787/__lab/',{waitUntil:'networkidle',timeout:30000}); await p.waitForTimeout(1000);
console.log('LAB',await p.title(),await p.locator('#status').innerText());
console.log('FAILS',fails.length,'ERRS',errs.length);
await b.close();
