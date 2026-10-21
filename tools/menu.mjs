import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', headless: true, args:['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale:'en-US' });
const page = await ctx.newPage();
await page.goto('https://www.ventusky.com/', { waitUntil:'domcontentloaded', timeout:60000 });
await page.waitForTimeout(9000);
const info = await page.evaluate(() => {
  const tops=[...document.querySelectorAll('#i a.p')].map(a=>({txt:a.textContent.trim(),cls:a.className,html:a.outerHTML.slice(0,200)}));
  const all=[...document.querySelectorAll('#i a')].map(a=>({txt:a.textContent.trim().replace(/\s+/g,' '),cls:a.className,id:a.id}));
  return {tops, all};
});
console.log(JSON.stringify(info.tops,null,1));
console.log('COUNT', info.all.length);
await browser.close();
