import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
p.on('request', r=>{const u=r.url(); if(/data\.ventusky/.test(u)) console.log('REQ',u)});
p.on('response', r=>{const u=r.url(); if(/data\.ventusky/.test(u)) console.log('RES',r.status(),u)});
p.on('console', m=>{ if(m.type()==='error') console.log('ERR',m.text().slice(0,200)); });
await p.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
// click Sea
const sea = p.locator('#i > a').filter({hasText:'Sea'}).first();
await sea.click(); await p.waitForTimeout(2000);
console.log('SUBHTML', (await p.evaluate(()=>{const a=[...document.querySelectorAll('#i>a')].find(x=>x.textContent.trim()==='Sea'); return a.nextElementSibling?.outerHTML.slice(0,2000)})));
// dispatch Currents
const r = await p.evaluate(()=>{
  const a=[...document.querySelectorAll('#i>a')].find(x=>x.textContent.trim()==='Sea');
  const d=a.nextElementSibling;
  const links=[...d.querySelectorAll('a')];
  const t=links.find(x=>x.textContent.trim()==='Currents');
  if(!t) return 'notfound:'+links.map(x=>x.textContent.trim()).join('|');
  t.click(); return 'clicked';
});
console.log('CLICK',r);
await p.waitForTimeout(5000);
console.log('TITLE',await p.title());
await p.screenshot({path:'sea.png'});
await b.close();
