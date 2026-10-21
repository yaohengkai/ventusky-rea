import { chromium } from 'playwright-core';
import fs from 'node:fs';
const browser = await chromium.launch({ executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless:true, args:['--no-sandbox','--lang=en-US'] });
const ctx = await browser.newContext({viewport:{width:1440,height:900}, locale:'en-US'});
const page = await ctx.newPage();
let bucket = [];
page.on('request', r => { const u=r.url(); if (/data\.ventusky\.com|map\.ventusky\.com/.test(u)) bucket.push(u); });
await page.goto('https://www.ventusky.com/',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(9000);
const layers = await page.evaluate(() => [...document.querySelectorAll('#i > a')].map((a,i)=>({i, txt:a.textContent.trim(), cls:a.className})));
console.log('LAYERS', JSON.stringify(layers));
const result = [];
for (const L of layers) {
  const before = bucket.length;
  const top = page.locator('#i > a').nth(L.i);
  try { await top.click({timeout:3000}); } catch(e) { console.log('top click fail', L.txt, e.message.slice(0,80)); continue; }
  await page.waitForTimeout(2500);
  const subs = await page.evaluate((idx) => {
    const top = document.querySelectorAll('#i > a')[idx];
    const div = top?.nextElementSibling;
    if (!div || div.tagName !== 'DIV') return [];
    return [...div.querySelectorAll('a')].map((a,j)=>({j, txt:a.textContent.trim()}));
  }, L.i);
  const urls = [...new Set(bucket.slice(before))];
  result.push({ layer:L.txt, subs, urls });
  console.log('L', L.txt, 'subs', subs.length, 'urls', urls.length);
  for (const S of subs) {
    const b2 = bucket.length;
    try {
      const sub = page.locator('#i > a').nth(L.i).locator('xpath=following-sibling::div[1]//a').nth(S.j);
      await sub.click({timeout:3000, force:true});
    } catch(e) { console.log(' sub fail', S.txt, e.message.slice(0,60)); continue; }
    await page.waitForTimeout(1800);
    const u2 = [...new Set(bucket.slice(b2))];
    result.push({ layer:L.txt, sub:S.txt, urls:u2 });
    console.log('  S', S.txt, 'urls', u2.length, u2[0]||'');
  }
}
fs.writeFileSync('sweep.json', JSON.stringify(result,null,2));
await page.screenshot({path:'sweep.png'});
await browser.close();
