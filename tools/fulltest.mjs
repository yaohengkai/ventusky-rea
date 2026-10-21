import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox'] });
for (const path of ['full-noinline.html']) {
  const p = await (await b.newContext({viewport:{width:800,height:600}})).newPage();
  p.on('framenavigated', f=>{if(f===p.mainFrame()) console.log('NAV',f.url())});
  p.on('console', m=>console.log('CONSOLE',m.type(),m.text().slice(0,150)));
  p.on('pageerror', e=>console.log('ERR',e.message.slice(0,200)));
  await p.goto('http://127.0.0.1:8788/'+path,{waitUntil:'commit',timeout:20000});
  await p.waitForTimeout(5000);
  console.log('TITLE',await p.title());
  console.log('SHEETS',await p.evaluate(()=>[...document.styleSheets].length));
  await p.close();
}
await b.close();
