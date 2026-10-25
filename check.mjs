// Opens pages in headless Chromium and prints what they show once hydrated, and the console errors.
// Usage: node check.mjs [base url] (needs puppeteer-core and a Chromium: CHROME=/path/to/chromium)
import puppeteer from 'puppeteer-core';

const base = (process.argv[2] ?? 'http://localhost:8081').replace(/\/$/, '');
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/chromium', headless: true });

async function check(path, selector) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (message) => {
    // The repro has no favicon.
    if (message.type() === 'error' && !message.location()?.url?.endsWith('/favicon.ico')) errors.push(message.text().slice(0, 300));
  });
  page.on('pageerror', (error) => errors.push(error.message.slice(0, 300)));
  const response = await page.goto(base + path, { waitUntil: 'networkidle0' });
  const serverHtml = await response.text();
  await page.waitForFunction((s) => !/hydrating|Loading/i.test(document.querySelector(s)?.textContent ?? ''), {}, selector);
  const root = serverHtml.slice(serverHtml.indexOf('<div id="root">'));
  console.log(`--- ${path}`);
  console.log('server ids:  ', [...root.matchAll(/\sid="(_R_[^"]+)"/g)].map((m) => m[1]).join(', '));
  console.log('page:        ', await page.$eval(selector, (element) => element.textContent));
  console.log('head title:  ', await page.evaluate(() => document.head.querySelector('title')?.textContent ?? '(none)'));
  console.log('in #root:    ', await page.evaluate(() => [...document.querySelectorAll('#root title, #root meta, #root link, #root style')].map((e) => e.tagName.toLowerCase()).join(', ') || 'no title/meta/link/style'));
  console.log('errors:      ', errors.length ? errors.join('\n') : 'none');
  await page.close();
}

await check('/', '#result');
await check('/slow', '[data-testid="slow"]');
await browser.close();
