import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  headless: true,
  args: ['--no-sandbox','--disable-blink-features=AutomationControlled']
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US', timezoneId: 'America/Los_Angeles' });
const page = await ctx.newPage();
page.on('console', m => console.log('CONSOLE', m.type(), m.text().slice(0,300)));
page.on('request', r => { const u=r.url(); if (/ventusky|waqi|openstreetmap/.test(u)) console.log('REQ', r.method(), u.slice(0,400)); });
page.on('response', r => { const u=r.url(); if (/ventusky/.test(u)) console.log('RES', r.status(), u.slice(0,300)); });
await page.goto('https://www.ventusky.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(12000);
console.log('TITLE', await page.title());
console.log('URL', page.url());
await page.screenshot({ path: 'shot1.png', fullPage: false });
console.log('HTML len', (await page.content()).length);
await browser.close();
