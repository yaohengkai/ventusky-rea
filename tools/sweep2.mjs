import { chromium } from 'playwright-core';
import fs from 'node:fs';
const b = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const c = await b.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const p = await c.newPage();
let bucket=[];
p.on('request', r=>{const u=r.url(); if(/data\.ventusky\.com/.test(u)) bucket.push(u)});
await p.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000}); await p.waitForTimeout(9000);
const layers = await p.evaluate(()=>[...document.querySelectorAll('#i > a')].map((a,i)=>({i,txt:a.textContent.trim()})));
const out=[];
for (const L of layers) {
  // activate top-level
  const act = await p.evaluate((i)=>{const a=document.querySelectorAll('#i > a')[i]; a.click(); return document.title;}, L.i);
  await p.waitForTimeout(1200);
  const sub = await p.evaluate((i)=>{
    const a=document.querySelectorAll('#i > a')[i]; const d=a.nextElementSibling;
    if(!d||d.tagName!=='DIV') return null;
    const s=d.querySelector('select'); if(!s) return null;
    return [...s.options].map(o=>({v:o.value,t:o.textContent.trim()}));
  }, L.i);
  if (sub && sub.length) {
    for (const o of sub) {
      const before=bucket.length;
      const title = await p.evaluate(({i,v})=>{
        const a=document.querySelectorAll('#i > a')[i]; const s=a.nextElementSibling.querySelector('select');
        s.value=v; s.dispatchEvent(new Event('change',{bubbles:true})); return document.title;
      }, {i:L.i, v:o.v});
      await p.waitForTimeout(2200);
      const urls=[...new Set(bucket.slice(before))];
      out.push({layer:L.txt, id:o.v, name:o.t, title, urls});
      console.log(L.txt,'|',o.v,'|',urls.length,'|',urls[0]||'');
    }
  } else {
    const before=bucket.length;
    await p.waitForTimeout(2200);
    const urls=[...new Set(bucket.slice(before))];
    out.push({layer:L.txt, id:null, name:L.txt, title:await p.title(), urls});
    console.log(L.txt,'| - |',urls.length,'|',urls[0]||'');
  }
}
fs.writeFileSync('sweep2.json',JSON.stringify(out,null,2));
console.log('DONE',out.length);
await b.close();
