import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless: true, args:['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale:'en-US' });
const page = await ctx.newPage();
await page.goto('https://www.ventusky.com/', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(9000);
const info = await page.evaluate(() => {
  const out=[];
  document.querySelectorAll('#i a, #i button, #i select, #i li, #i label').forEach(el=>{
    out.push({tag:el.tagName,id:el.id,cls:el.className,txt:el.textContent.trim().replace(/\s+/g,' ').slice(0,100),href:el.getAttribute('href'),data:[...el.attributes].filter(a=>a.name.startsWith('data')).map(a=>a.name+'='+a.value.slice(0,80))});
  });
  return out;
});
console.log(JSON.stringify(info,null,1));
await browser.close();
