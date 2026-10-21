import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
const fails=[]; p.on('requestfailed',r=>{if(!r.url().startsWith('data:')){fails.push(r.url()); console.log('FAIL',r.url().slice(0,140))}});
p.on('console',m=>{if(m.type()==='error') console.log('CONSOLE',m.text().slice(0,160))});
await p.goto('http://localhost:8787/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(8000);
// Click Login
try { await p.click('#b a[href*="login"], #b a:has-text("Login")', {timeout:3000}); } catch(e){ console.log('loginclick',e.message.slice(0,80)); }
await p.waitForTimeout(5000);
console.log('AFTER LOGIN',p.url(),await p.title());
console.log('BODY', (await p.locator('body').innerText()).slice(0,300).replace(/\n+/g,' | '));
console.log('FAILS',fails.length);
await p.screenshot({path:'login.png'});
await b.close();
