import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
const fails=[]; p.on('requestfailed',r=>{if(!r.url().startsWith('data:')){fails.push(r.url());console.log('FAIL',r.url().slice(0,150))}});
p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,160))});
await p.goto('http://localhost:8787/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
// model select
const modelBox = p.locator('label.v.n.m select');
console.log('MODELS',await modelBox.locator('option').count());
await modelBox.selectOption('gfs');
await p.waitForTimeout(5000);
console.log('TITLE',await p.title());
console.log('MODELTXT',(await p.locator('#k').innerText()).slice(0,80));
// time slider: click next arrow
try { await p.click('#r a.next, #r .next', {timeout:2000}); } catch(e){ console.log('next fail'); }
await p.waitForTimeout(3000);
console.log('AFTER NEXT',await p.title());
await p.screenshot({path:'modeltime.png'});
console.log('FAILS',fails.length);
await b.close();
