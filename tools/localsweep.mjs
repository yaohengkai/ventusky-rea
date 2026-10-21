import { chromium } from 'playwright-core';
import fs from 'node:fs';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
let current = {layer:null, id:null, ok:0, bad:0, urls:[]};
const results=[];
p.on('response', r=>{
  const u=r.url();
  if (!u.includes('/proxy/data.ventusky.com') && !u.includes('/proxy/archive.ventusky.com')) return;
  if (!/\.(jpg|png)/.test(u)) return;
  if (r.status()<400) { current.ok++; if(current.urls.length<2) current.urls.push(u); }
  else { current.bad++; current.urls.push(r.status()+' '+u); }
});
await p.goto('http://localhost:8787/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
const layers = await p.evaluate(()=>[...document.querySelectorAll('#i > a')].map((a,i)=>({i,txt:a.textContent.trim()})));
for (const L of layers) {
  current={layer:L.txt,id:null,ok:0,bad:0,urls:[]};
  try { await p.evaluate(i=>document.querySelectorAll('#i > a')[i].click(), L.i); } catch {}
  await p.waitForTimeout(1500);
  const opts = await p.evaluate(i=>{
    const a=document.querySelectorAll('#i > a')[i]; const d=a.nextElementSibling;
    if(!d||d.tagName!=='DIV') return null;
    const s=d.querySelector('select'); return s?[...s.options].map(o=>({v:o.value,t:o.textContent.trim()})):null;
  }, L.i);
  if (opts && opts.length) {
    for (const o of opts) {
      current={layer:L.txt,id:o.v,name:o.t,ok:0,bad:0,urls:[]};
      try { await p.evaluate(({i,v})=>{const a=document.querySelectorAll('#i > a')[i]; const s=a.nextElementSibling.querySelector('select'); s.value=v; s.dispatchEvent(new Event('change',{bubbles:true}));},{i:L.i,v:o.v}); } catch {}
      await p.waitForTimeout(2200);
      results.push({...current});
      console.log(current.layer,'|',current.id,'| ok',current.ok,'bad',current.bad,'|',current.urls[0]?.slice(0,120)||'');
    }
  } else {
    await p.waitForTimeout(2200);
    results.push({...current});
    console.log(current.layer,'| - | ok',current.ok,'bad',current.bad,'|',current.urls[0]?.slice(0,120)||'');
  }
}
fs.writeFileSync('localsweep.json',JSON.stringify(results,null,2));
console.log('DONE',results.length,'bad',results.filter(x=>x.bad>0).length,'empty',results.filter(x=>x.ok===0&&x.bad===0).length);
await b.close();
