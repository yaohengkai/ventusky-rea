import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless: true, args:['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale:'en-US' });
const page = await ctx.newPage();
await page.goto('https://www.ventusky.com/', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(9000);
const info = await page.evaluate(() => {
  const root = document.querySelector('aside') || document.body;
  function walk(el, d) {
    if (d > 5) return null;
    return { tag: el.tagName, id: el.id, cls: typeof el.className==='string'?el.className:'', txt: [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ').slice(0,80), kids:[...el.children].map(c=>walk(c,d+1)).filter(Boolean) };
  }
  return walk(root,0);
});
console.log(JSON.stringify(info,null,1));
await browser.close();
