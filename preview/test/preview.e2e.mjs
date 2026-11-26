// Browser tests for the survival preview (real Chromium via Playwright).
// Run: node --test preview/test/preview.e2e.mjs
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startServer} from '../serve.mjs';

const require = createRequire(import.meta.url);
const {chromium} = require('playwright');
let server, browser, base;

before(async () => {
  server = await startServer(0);
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

async function open(ctx, width = 390) {
  const page = await ctx.newPage();
  await page.setViewportSize({width, height: 900});
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.location().url)) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(base);
  await page.waitForSelector('#track .pip');
  return {page, errors};
}
const text = (page, sel) => page.locator(sel).innerText();
const pipsOn = page => page.locator('#track .pip.on').count();
const logCount = page => page.locator('#log li').count();

async function consumeKeyboard(page, w, f) {
  await page.locator('#q-w').focus();
  await page.keyboard.press('Control+A'); await page.keyboard.type(String(w));
  await page.keyboard.press('Tab');
  await page.keyboard.press('Control+A'); await page.keyboard.type(String(f));
  await page.keyboard.press('Enter');
  await page.waitForSelector('#confirm-consume-yes');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'confirm-consume-yes');
  await page.keyboard.press('Enter');
}
async function endDay(page) {
  await page.locator('#btn-close').click();
  await page.locator('#confirm-close-yes').click();
}

test('example loads with forecast, receipts and no script errors', async () => {
  const ctx = await browser.newContext();
  const {page, errors} = await open(ctx);
  assert.equal(await text(page, '#day-v'), '1');
  assert.match(await text(page, '#stock-w'), /^592 fl oz/);
  assert.match(await text(page, '#stock-f'), /^76 oz/);
  const fc = await text(page, '#forecast');
  assert.match(fc, /Water below half/);
  assert.match(fc, /DC 10 Constitution/);
  assert.equal(await pipsOn(page), 0);
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('keyboard consume deducts supplies exactly once; cancel and bad input change nothing', async () => {
  const ctx = await browser.newContext();
  const {page} = await open(ctx);
  await consumeKeyboard(page, 32, 2);
  assert.match(await text(page, '#stock-w'), /^560 fl oz/);
  assert.match(await text(page, '#stock-f'), /^74 oz/);
  assert.equal(await page.locator('#confirm-consume-yes').count(), 0);
  // Cancel leaves stock alone.
  await page.locator('#btn-consume').click();
  await page.keyboard.press('Escape');
  assert.match(await text(page, '#stock-w'), /^560 fl oz/);
  // Fractions and over-stock are rejected without a confirm step.
  await page.fill('#q-w', '1.5'); await page.locator('#btn-consume').click();
  assert.match(await text(page, '#status'), /whole numbers/);
  await page.fill('#q-w', '9999'); await page.fill('#q-f', '0'); await page.locator('#btn-consume').click();
  assert.match(await text(page, '#status'), /Not enough supplies/);
  assert.match(await text(page, '#stock-w'), /^560 fl oz/);
  await ctx.close();
});

test('end of day raises a DC 10 CON prompt, locks other actions, failure adds locked levels', async () => {
  const ctx = await browser.newContext();
  const {page} = await open(ctx);
  await endDay(page);
  await page.waitForSelector('#save-failure');
  assert.match(await text(page, '#pending'), /DC 10 Constitution/);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'save-success');
  for (const id of ['#btn-consume', '#btn-close', '#btn-other']) assert.equal(await page.locator(id).isDisabled(), true);
  assert.equal(await pipsOn(page), 0, 'no Exhaustion before the save outcome');
  assert.match(await text(page, '#status'), /Record the saving throw/);
  // Reload while the prompt is pending: it survives and nothing is applied.
  await page.reload(); await page.waitForSelector('#save-failure');
  assert.equal(await pipsOn(page), 0);
  await page.locator('#save-failure').click();
  assert.equal(await text(page, '#day-v'), '2');
  assert.equal(await pipsOn(page), 2, 'dehydration + malnutrition');
  assert.equal(await page.locator('#track .pip.locked').count(), 2);
  assert.match(await text(page, '#d20-v'), /−4/);
  assert.match(await text(page, '#speed-v'), /−10 ft/);
  assert.equal(await page.locator('#btn-rest').isDisabled(), true, 'locked levels cannot be rested away');
  await ctx.close();
});

test('reload and export/import do not replay effects; full intake unlocks recovery; Long Rest removes one level', async () => {
  const ctx = await browser.newContext();
  const {page} = await open(ctx);
  await endDay(page); await page.locator('#save-failure').click();
  const logs = await logCount(page);
  await page.reload(); await page.waitForSelector('#track .pip');
  assert.equal(await pipsOn(page), 2);
  assert.equal(await logCount(page), logs);
  const exported = await page.locator('#out').inputValue();
  // Invalid import is refused.
  await page.locator('summary', {hasText: 'Import JSON'}).click();
  await page.fill('#in', '{"schema":"nope"}'); await page.locator('#btn-import').click();
  assert.match(await text(page, '#status'), /not a valid/);
  await page.fill('#in', exported); await page.locator('#btn-import').click();
  await page.locator('#confirm-reset-yes').click();
  assert.equal(await pipsOn(page), 2, 'import does not reapply Exhaustion');
  assert.match(await text(page, '#stock-w'), /^592 fl oz/, 'import does not deduct supplies again');
  await consumeKeyboard(page, 128, 16);
  assert.equal(await page.locator('#track .pip.locked').count(), 0, 'full day of water and food unlocks both');
  assert.equal(await page.locator('#btn-rest').isDisabled(), false);
  await page.locator('#btn-rest').click(); await page.locator('#confirm-side-yes').click();
  assert.equal(await pipsOn(page), 1);
  await ctx.close();
});

test('two tabs: writes sync, and a stale tab cannot commit on old state', async () => {
  const ctx = await browser.newContext();
  const a = (await open(ctx)).page, b = (await open(ctx)).page;
  await consumeKeyboard(a, 16, 0);
  await b.waitForFunction(() => document.getElementById('stock-w').textContent.startsWith('576'));
  // Simulate a write from another tab that this tab has not seen (no storage event in the same tab).
  await b.evaluate(() => {
    const k = 'gwentable.survival-preview.v1';
    const s = JSON.parse(localStorage.getItem(k));
    s.session.stock.waterFlOz -= 100; s.session.revision += 1; s.session.eventIds.push('external1');
    s.session.survival.revision += 1; // keep engine invariants plausible is not required: snapshot is replaced
    localStorage.setItem(k, JSON.stringify(s));
  }).catch(() => {});
  const before = await b.evaluate(() => localStorage.getItem('gwentable.survival-preview.v1'));
  await b.fill('#q-w', '8'); await b.fill('#q-f', '0'); await b.locator('#btn-consume').click();
  await b.locator('#confirm-consume-yes').click();
  const status = await text(b, '#status');
  const afterStore = await b.evaluate(() => localStorage.getItem('gwentable.survival-preview.v1'));
  assert.equal(afterStore, before, 'stale tab wrote nothing');
  assert.match(status, /another tab|could not|rejected/);
  await ctx.close();
});

test('Bahasa Indonesia switch sets lang, translates, and persists', async () => {
  const ctx = await browser.newContext();
  const {page} = await open(ctx);
  await page.locator('#lang-id').click();
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'id');
  assert.equal(await text(page, 'h1'), 'Kebutuhan harian');
  assert.match(await text(page, '#forecast'), /Constitution Saving Throw DC 10/);
  assert.equal(await page.locator('#lang-id').getAttribute('aria-pressed'), 'true');
  await page.reload(); await page.waitForSelector('#track .pip');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'id');
  await ctx.close();
});

for (const width of [320, 390, 768, 1440]) {
  test(`no horizontal page scroll and 44px touch targets at ${width}px`, async () => {
    const ctx = await browser.newContext();
    const {page} = await open(ctx, width);
    for (const l of ['en', 'id']) {
      await page.locator(`#lang-${l}`).click();
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 0, `${l}: overflow ${over}px`);
    }
    const small = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent && b.getBoundingClientRect().height < 44).map(b => b.id || b.textContent));
    assert.deepEqual(small, []);
    await ctx.close();
  });
}
