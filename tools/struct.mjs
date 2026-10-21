import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox'] });
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(8000);
const s = await p.evaluate(()=>{
  function rec(el,d){ if(d>3) return null; return {tag:el.tagName,id:el.id,cls:typeof el.className==='string'?el.className:'',txt:[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('').slice(0,40),kids:[...el.children].map(c=>rec(c,d+1)).filter(Boolean)}; }
  return rec(document.querySelector('#i'),0);
});
console.log(JSON.stringify(s,null,1).slice(0,12000));
await b.close();
