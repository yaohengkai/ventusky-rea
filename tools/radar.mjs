import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
p.on('request', r=>{const u=r.url(); if(/data\.ventusky/.test(u)&&/radar|srazky_dbz|rgba|goes|meteosat|himawari/.test(u)) console.log('REQ',u)});
await p.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
for (const name of ['Radar','Satellite']) {
  console.log('===',name);
  await p.evaluate((n)=>{const a=[...document.querySelectorAll('#i>a')].find(x=>x.textContent.trim()===n); a.click();}, name);
  await p.waitForTimeout(8000);
  console.log('TITLE',await p.title());
}
await b.close();
