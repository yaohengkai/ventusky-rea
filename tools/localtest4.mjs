import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
const pending=new Set();
p.on('request', r=>pending.add(r.url()));
p.on('requestfinished', r=>pending.delete(r.url()));
p.on('requestfailed', r=>{pending.delete(r.url()); console.log('FAILED',r.url().slice(0,180), r.failure()?.errorText)});
p.on('console', m=>{if(m.type()==='error') console.log('CONSOLE',m.text().slice(0,200))});
p.on('pageerror', e=>console.log('PAGEERROR',e.message.slice(0,200)));
try { await p.goto('http://127.0.0.1:8787/',{waitUntil:'commit',timeout:20000}); } catch(e){console.log('GOTO',e.message.slice(0,100))}
await p.waitForTimeout(15000);
console.log('TITLE',await p.title());
console.log('PENDING', [...pending].slice(0,15));
console.log('BODYLEN', (await p.content()).length);
await p.screenshot({path:'local2.png'});
await b.close();
