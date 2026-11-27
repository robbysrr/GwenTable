// Real-browser acceptance for the artwork-withheld preview (Chromium via Playwright).
// Not part of `node --test` discovery. Run after `npm run build:artwork-withheld-preview`:
//   node --test --test-concurrency=1 browser-acceptance/uat.e2e.mjs
// Synthetic characters only; Math.random is seeded per context so failures are repeatable.
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile, writeFile, mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const require = createRequire(import.meta.url);
const {chromium} = require('playwright');
const PORT = Number(process.env.UAT_PORT || 4191);
const BASE = `http://127.0.0.1:${PORT}/`;
let server, browser;

before(async () => {
  server = spawn(process.execPath, ['scripts/dev-local.mjs', '--artwork-withheld'], {env: {...process.env, PORT: String(PORT)}, stdio: ['ignore', 'pipe', 'inherit']});
  await new Promise((resolve, reject) => {
    server.stdout.on('data', d => { if (/127\.0\.0\.1/.test(String(d))) resolve(); });
    server.on('exit', code => reject(new Error(`server exited ${code}`)));
  });
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.kill(); });

async function open({seed = 1, width = 1280, height = 900, ctx: existing} = {}) {
  const ctx = existing ?? await browser.newContext({viewport: {width, height}, acceptDownloads: true});
  if (!existing) await ctx.addInitScript(s => {
    let x = s >>> 0 || 1;
    Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }, seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  return {ctx, page, errors};
}

async function generate(page, cls, level) {
  await page.locator('a[href="#create"]:visible').first().click();
  if (!await page.locator('#build-start').evaluate(d => d.open)) await page.locator('#build-start > summary').click();
  await page.locator('button[aria-label^="Generator class"]').click();
  await page.locator('dialog[open] button', {hasText: new RegExp('^' + cls)}).click();
  await page.locator('#generator select[name=level]').selectOption(String(level));
  await page.locator('#generator button[type=submit]').click();
  await page.waitForTimeout(400);
}

// Confirm each step's suggested choices and continue; returns the visited step labels.
async function walk(page, stop = /Appearance/) {
  const seen = [];
  for (let i = 0; i < 16; i++) {
    const tab = (await page.locator('[role=tab][aria-selected=true]').textContent()).trim();
    seen.push(tab);
    if (stop.test(tab)) return seen;
    if (seen.length >= 3 && seen.at(-1) === seen.at(-3)) throw new Error(`Builder stuck on "${tab}": ${await page.locator('#step-status').innerText()}`);
    const confirm = page.locator('#create button:visible:not(#next)', {hasText: /^(Confirm|Use this)/});
    for (let k = await confirm.count(); k > 0; k--) { await confirm.first().click(); await page.waitForTimeout(100); }
    await page.locator('#next').click();
    await page.waitForTimeout(200);
  }
  throw new Error('Builder did not reach ' + stop);
}

async function saveCharacter(page) {
  await page.locator('#next').click(); // Finish and preview sheet
  await page.waitForTimeout(300);
  await page.locator('#save').click();
  await page.waitForURL(/#play\//);
  await page.waitForTimeout(500);
}

// Export is two steps: prepare, then a "Download <name>.json" link appears.
async function exportBackup(page) {
  await page.getByRole('button', {name: 'Export play backup'}).click();
  const link = page.locator('a[download$=".json"]:visible').first();
  await link.waitFor();
  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  return download;
}
const hp = async page => (await page.locator('main').innerText()).match(/\b(\d+)\s*\/\s*(\d+)\s*\n?\s*Hit Points/i)?.slice(1, 3).map(Number);
async function damage(page, amount) {
  await page.getByLabel('Amount', {exact: true}).fill(String(amount));
  await page.getByRole('button', {name: 'Damage', exact: true}).click();
  await page.waitForTimeout(400);
}

test('UAT-01 Fighter 5: generate, confirm every step, save, reload from IndexedDB', async () => {
  const {ctx, page, errors} = await open({seed: 1});
  await generate(page, 'Fighter', 5);
  const steps = await walk(page);
  assert.ok(steps.some(s => /Spells/.test(s)), 'Spells step visited for Magic Initiate background');
  await saveCharacter(page);
  const text = await page.locator('main').innerText();
  assert.match(text, /Level 5 Fighter/);
  const [cur, max] = await hp(page);
  assert.equal(cur, max);
  await page.reload(); await page.waitForTimeout(600);
  assert.match(await page.locator('main').innerText(), /Level 5 Fighter/);
  assert.deepEqual(await hp(page), [cur, max]);
  const dbs = await page.evaluate(async () => (await indexedDB.databases()).map(d => d.name));
  assert.ok(dbs.includes('open-5e-companion'));
  assert.deepEqual(errors, []);
  await ctx.close();
});

for (const seed of [7, 8]) {
  test(`UAT-01 Wizard 5 (seed ${seed}, Standard Array): generated scores shown and build saves`, async () => {
    const {ctx, page, errors} = await open({seed});
    await generate(page, 'Wizard', 5);
    await walk(page, /Abilities/);
    const scores = await page.locator('#step-content select[data-choice=scores]').evaluateAll(s => s.map(x => Number(x.value)));
    assert.deepEqual([...scores].sort((a, b) => b - a), [15, 14, 13, 12, 10, 8], 'generated Standard Array is visible, not blank');
    await walk(page);
    await saveCharacter(page);
    const text = await page.locator('main').innerText();
    assert.match(text, /Level 5 Wizard/);
    assert.match(text, /Spells & slots/);
    await page.reload(); await page.waitForTimeout(600);
    assert.match(await page.locator('main').innerText(), /Level 5 Wizard/);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('UAT-01 level 3 template keeps its Standard Array scores', async () => {
  const {ctx, page, errors} = await open({seed: 3});
  await page.goto(BASE + '#templates'); await page.waitForTimeout(300);
  await page.locator('#template-form button[type=submit], #template-form button', {hasText: 'Use template'}).first().click();
  await page.waitForTimeout(400);
  await walk(page, /Abilities/);
  const scores = await page.locator('#step-content select[data-choice=scores]').evaluateAll(s => s.map(x => Number(x.value)));
  assert.deepEqual([...scores].sort((a, b) => b - a), [15, 14, 13, 12, 10, 8]);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('UAT-11/12/13 damage, Undo, two-tab stale write, offline reload, play backup export', async () => {
  const {ctx, page, errors} = await open({seed: 1});
  await generate(page, 'Fighter', 5); await walk(page); await saveCharacter(page);
  const [full] = await hp(page);
  const other = await ctx.newPage();
  await other.goto(page.url()); await other.waitForTimeout(600);

  await damage(page, 5);
  assert.deepEqual(await hp(page), [full - 5, full]);

  // UAT-12: the second tab still shows the old revision; its write must be refused.
  await damage(other, 3);
  assert.match((await other.locator('main').innerText()) + (await other.locator('body').innerText()), /changed in another tab/);
  await page.reload(); await page.waitForTimeout(500);
  assert.deepEqual(await hp(page), [full - 5, full], 'no lost update, stale write not applied');

  // UAT-11: Undo restores and persists.
  await page.getByRole('button', {name: 'Undo'}).click(); await page.waitForTimeout(500);
  assert.deepEqual(await hp(page), [full, full]);
  await page.reload(); await page.waitForTimeout(500);
  assert.deepEqual(await hp(page), [full, full]);

  // UAT-11: export play backup is valid JSON that carries the character.
  const download = await exportBackup(page);
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  assert.match(JSON.stringify(exported), /Fighter/);

  // UAT-13: offline reload renders the saved character from the service worker cache.
  await damage(page, 2);
  await ctx.setOffline(true);
  await page.reload(); await page.waitForTimeout(800);
  assert.deepEqual(await hp(page), [full - 2, full]);
  await ctx.setOffline(false);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('UAT-15 tampered import is refused; a malicious name typed in the builder renders as text', async () => {
  const {ctx, page, errors} = await open({seed: 1});
  await generate(page, 'Fighter', 5); await walk(page); await saveCharacter(page);
  const download = await exportBackup(page);
  const payload = '<img src=x onerror="window.__gwenXss=1">';
  const data = JSON.parse(await readFile(await download.path(), 'utf8'));
  let replaced = 0;
  const visit = o => { if (o && typeof o === 'object') { if (typeof o.name === 'string' && 'className' in o) { o.name = payload; replaced++; } Object.values(o).forEach(visit); } };
  visit(data);
  assert.ok(replaced > 0, 'name replaced in export');
  const dir = await mkdtemp(join(tmpdir(), 'gwen-uat-'));
  const file = join(dir, 'tampered.json');
  await writeFile(file, JSON.stringify(data));
  const before = await page.evaluate(async () => (await new Promise(r => { const q = indexedDB.open('open-5e-companion'); q.onsuccess = () => { const g = q.result.transaction('characters').objectStore('characters').count(); g.onsuccess = () => r(g.result); }; })));
  await page.goto(BASE + '#create'); await page.waitForTimeout(300);
  if (!await page.locator('#build-start').evaluate(d => d.open)) await page.locator('#build-start > summary').click();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#builder-import').click()]);
  await chooser.setFiles(file);
  await page.waitForTimeout(800);
  assert.match(await page.locator('#library-status').innerText(), /integrity/i, 'tampered file refused with a reason');
  assert.equal(await page.locator('#import-preview').isVisible(), false);
  const afterCount = await page.evaluate(async () => (await new Promise(r => { const q = indexedDB.open('open-5e-companion'); q.onsuccess = () => { const g = q.result.transaction('characters').objectStore('characters').count(); g.onsuccess = () => r(g.result); }; })));
  assert.equal(afterCount, before, 'nothing imported');

  // Rendering: type the payload as the character name, save, and view it.
  await generate(page, 'Fighter', 3);
  await page.locator('#step-content input').first().fill(payload);
  await walk(page); await saveCharacter(page);
  assert.equal((await page.locator('main h1:visible').first().innerText()).trim(), payload, 'name shown literally on the sheet');
  await page.goto(BASE + '#characters'); await page.waitForTimeout(500);
  assert.ok((await page.locator('#roster').innerText()).includes(payload), 'name shown literally in Saved Characters');
  assert.equal(await page.locator('img[src="x"]').count(), 0);
  assert.equal(await page.evaluate(() => window.__gwenXss), undefined, 'payload never executed');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('UAT-15 English / Bahasa Indonesia switch sets language metadata and translates navigation', async () => {
  const {ctx, page, errors} = await open();
  const nav = async () => page.locator('nav.desktop-navigation').innerText();
  const en = await nav();
  await page.locator('#language-toggle').click(); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'id');
  const id = await nav();
  assert.notEqual(id, en);
  await page.reload(); await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'id', 'language choice persists');
  await page.locator('#language-toggle').click();
  assert.deepEqual(errors, []);
  await ctx.close();
});

for (const width of [360, 390, 768, 1280]) {
  test(`UAT-14 no horizontal overflow at ${width}px on overview, builder and play sheet`, async () => {
    const {ctx, page, errors} = await open({seed: 1, width});
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(await overflow() <= 0, 'overview');
    await generate(page, 'Fighter', 5);
    assert.ok(await overflow() <= 0, 'builder');
    await walk(page); await saveCharacter(page);
    assert.ok(await overflow() <= 0, `play sheet overflow ${await overflow()}px`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('Integration 11 Bless/Bane: record on Play sheet, save preview asks for the d4, reload keeps it, ID labels', async () => {
  const {ctx, page, errors} = await open({seed: 1});
  await generate(page, 'Fighter', 5); await walk(page); await saveCharacter(page);
  const panel = page.locator('details', {has: page.locator('summary', {hasText: 'Bless and Bane'})});
  await panel.locator('summary').click();
  const add = panel.locator('form[data-play-form="modifier-add"]');
  await add.locator('select[name=spell]').selectOption('Bless');
  await add.locator('input[name=caster]').fill('Sister Ama');
  await add.locator('input[name=confirmed]').check();
  await add.getByRole('button', {name: 'Record spell effect'}).click();
  await page.waitForTimeout(500);
  assert.match(await panel.innerText(), /Bless: add 1d4 to attack rolls and saving throws · 1 active source/);

  // Quick save preview now requires the physical d4 and adds it.
  const section = page.locator('details', {has: page.locator(':scope > summary', {hasText: /^Attacks & checks$/})}).first();
  if (!await section.evaluate(d => d.open)) await section.locator(':scope > summary').click();
  const quick = page.locator('details.play-live-check');
  await quick.locator('summary').click();
  const save = quick.locator('form[data-live-check="save"]');
  const die = save.locator('input[name="spell-die-Bless"]');
  assert.equal(await die.count(), 1);
  assert.equal(await quick.locator('form[data-live-check="skill"] input[name^="spell-die-"]').count(), 0, 'no die on ability checks');
  await save.locator('input[name=first]').fill('10');
  await die.fill('3');
  await save.locator('input[name=confirmed]').check();
  await save.getByRole('button', {name: 'Preview result'}).click();
  assert.match(await save.locator('output').innerText(), /Bless \+3; Total \d+/);

  // Persisted through reload; Indonesian labels present.
  await page.reload(); await page.waitForTimeout(600);
  assert.match(await page.locator('main').innerText(), /Bless · Sister Ama · #1/);
  await page.locator('#language-toggle').click(); await page.waitForTimeout(300);
  assert.match(await page.locator('main').innerText(), /Bless dan Bane/);
  await page.locator('#language-toggle').click();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Integration 12 fillable GwenTable v0.3 sheet: generate from Play sheet, download, fields filled from the character', async () => {
  const {ctx, page, errors} = await open({seed: 7});
  await generate(page, 'Wizard', 5); await walk(page); await saveCharacter(page);
  await damage(page, 3);
  const name = (await page.locator('main h1:visible').first().innerText()).trim();
  await page.getByRole('button', {name: 'Print / PDF'}).click();
  const dialog = page.locator('dialog[open]');
  assert.equal(await dialog.locator('select[name=design]').inputValue(), 'v03-complete');
  assert.equal(await dialog.locator('select[name=edition]').isVisible(), false, 'edition only for simple sheet');
  await dialog.getByRole('button', {name: 'Generate PDF'}).click();
  const button = dialog.getByRole('button', {name: 'Download character PDF'});
  await button.waitFor({timeout: 20000});
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
  assert.match(download.suggestedFilename(), /_Sheet-v03-complete-A4\.pdf$/);
  const {PDFDocument} = await import('../dist/vendor/pdf-lib.min.js');
  const pdf = await PDFDocument.load(await readFile(await download.path()));
  const form = pdf.getForm();
  const text = n => form.getTextField(n).getText();
  assert.equal(pdf.getPageCount(), 4);
  assert.equal(text('identity.name'), name);
  assert.equal(text('identity.class'), 'Wizard');
  assert.equal(text('identity.level'), '5');
  const [cur, max] = (await page.locator('main').innerText()).match(/\b(\d+)\s*\/\s*(\d+)\s*\n?\s*Hit Points/i).slice(1, 3);
  assert.equal(text('combat.hp_current'), cur, 'current play snapshot');
  assert.equal(text('combat.hp_max'), max);
  const proficientSkills = form.getFields().filter(f => /^skills\.[a-z_]+\.proficient$/.test(f.getName()) && f.isChecked()).length;
  assert.ok(proficientSkills >= 4, `skill proficiencies checked: ${proficientSkills}`);
  assert.ok(text('spellcasting.save_dc'));
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Integration 12 builder ergonomics: start options open for new players; Next alone confirms and continues', async () => {
  const {ctx, page, errors} = await open({seed: 2, width: 390, height: 844});
  await page.locator('a[href="#create"]:visible').first().click();
  assert.equal(await page.locator('#build-start').evaluate(d => d.open), true, 'start options visible on first visit');
  await page.locator('button[aria-label^="Generator class"]').click();
  await page.locator('dialog[open] button', {hasText: /^Fighter/}).click();
  await page.locator('#generator select[name=level]').selectOption('3');
  await page.locator('#generator button[type=submit]').click();
  await page.waitForTimeout(300);
  let taps = 0, combined = 0;
  for (; taps < 20; taps++) {
    const tab = (await page.locator('[role=tab][aria-selected=true]').textContent()).trim();
    if (/Appearance/.test(tab)) break;
    const label = await page.locator('#next').textContent();
    if (/^Confirm & continue/.test(label)) combined++;
    await page.locator('#next').click();
    await page.waitForTimeout(350);
  }
  assert.ok(taps < 20, 'reached Appearance using Next only');
  assert.ok(combined >= 5, `steps that confirmed and continued in one tap: ${combined}`);
  await page.locator('#next').click(); await page.waitForTimeout(300);
  await page.locator('#save').click();
  await page.waitForURL(/#play\//);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Integration 12 Settings menu: top-right on phone and desktop; theme applies; Escape closes', async () => {
  for (const width of [320, 390, 1280]) {
    const {ctx, page, errors} = await open({width});
    const summary = page.locator('#site-settings > summary');
    const box = await summary.boundingBox();
    assert.ok(box.x + box.width > width - 70 && box.y < 60, `top-right at ${width}px`);
    await summary.click();
    await page.locator('#theme-mode').selectOption('dark');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#site-settings').evaluate(d => d.open), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

test('Integration 12 compendium: subject text first, full SRD page on request', async () => {
  const {ctx, page, errors} = await open();
  await page.goto(BASE + '#compendium'); await page.waitForTimeout(400);
  await page.fill('[data-catalogue-search]', 'Bag of Holding');
  await page.locator('[data-catalogue-results] button', {hasText: 'Magic Item'}).filter({has: page.locator('b', {hasText: /^Bag of Holding$/})}).click();
  const dialog = page.locator('#official-reference');
  await page.waitForTimeout(400);
  const pre = dialog.locator('pre');
  assert.match(await pre.innerText(), /^Wondrous Item, Uncommon\nThis bag has an interior space/);
  assert.match(await dialog.locator('[data-rules-page]').innerText(), /SRD description · page 212/);
  await dialog.locator('[data-rules-mode]').click(); await page.waitForTimeout(300);
  assert.match(await dialog.locator('[data-rules-page]').innerText(), /SRD page 212/);
  assert.match(await pre.innerText(), /Bag of Devouring/);
  await dialog.locator('[data-rules-mode]').click(); await page.waitForTimeout(300);
  assert.match(await pre.innerText(), /^Wondrous Item, Uncommon/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Integration 13 Attack roller: typed and generated dice, Finesse, crit doubles dice only, no saved change', async () => {
  const {ctx, page, errors} = await open({seed: 5, width: 390, height: 844});
  await generate(page, 'Rogue', 5); await walk(page); await saveCharacter(page);
  const stored = () => page.evaluate(() => new Promise(r => { const q = indexedDB.open('open-5e-companion'); q.onsuccess = () => { const g = q.result.transaction('characters').objectStore('characters').getAll(); g.onsuccess = () => r(JSON.stringify(g.result)); }; }));
  const before = await stored();
  const section = page.locator('details', {has: page.locator(':scope > summary', {hasText: /^Attacks & checks$/})}).first();
  if (!await section.evaluate(d => d.open)) await section.locator(':scope > summary').click();
  const form = page.locator('[data-attack-form]');
  await form.waitFor();
  // Pick the Dagger (Finesse): formula shown, ability choice offered.
  await form.locator('select[name=attack]').selectOption({label: 'Dagger'});
  assert.equal(await form.locator('[data-attack-ability]').isVisible(), true);
  const info = await form.locator('[data-attack-info]').innerText();
  const bonus = Number(info.match(/Attack ([+−]\d+)/)[1].replace('−', '-'));
  assert.match(info, /= Dexterity \+\d+ \+ Proficiency Bonus \+3/);
  // Typed natural 20: critical, checkbox set, damage dice doubled with modifier once.
  await form.locator('input[name=first]').fill('20');
  await form.getByRole('button', {name: 'Show attack result'}).click();
  const attack = await form.locator('[data-attack-result]').innerText();
  assert.match(attack, new RegExp(`d20 20 \\(Normal\\).*Total ${20 + bonus}\\. Critical Hit`));
  assert.equal(await form.locator('input[name=critical]').isChecked(), true);
  await form.locator('input[name=dice]').fill('3');
  await form.getByRole('button', {name: 'Show damage'}).click();
  assert.match(await form.locator('[data-damage-result]').innerText(), /Enter 2 results on d4/);
  await form.locator('input[name=dice]').fill('3 4');
  await form.getByRole('button', {name: 'Show damage'}).click();
  const dmg = await form.locator('[data-damage-result]').innerText();
  const mod = Number(info.match(/Damage 1d4 ([+−]\d+)/)[1].replace('−', '-'));
  assert.match(dmg, new RegExp(`2d4 \\[3, 4\\] = 7, modifier [+−]\\d+ → ${7 + mod} Piercing.*Critical Hit`));
  // Natural 1 always misses even against a low AC.
  await form.locator('input[name=first]').fill('1');
  await form.locator('input[name=ac]').fill('5');
  await form.getByRole('button', {name: 'Show attack result'}).click();
  assert.match(await form.locator('[data-attack-result]').innerText(), /Natural 1: the attack misses\./);
  // Finesse switch to Strength changes the bonus.
  await form.locator('select[name=ability]').selectOption('0');
  assert.match(await form.locator('[data-attack-info]').innerText(), /= Strength/);
  // Advantage needs two dice; Roll for me fills and shows a result.
  await form.locator('.attack-mode label', {hasText: /^\s*Advantage\s*$/}).click();
  assert.equal(await form.locator('input[value=advantage]').isChecked(), true);
  await form.locator('input[name=first]').fill('12');
  await form.locator('input[name=second]').fill('');
  await form.getByRole('button', {name: 'Show attack result'}).click();
  assert.match(await form.locator('[data-attack-result]').innerText(), /Enter both d20 results/);
  await form.getByRole('button', {name: 'Roll for me', exact: true}).click();
  assert.match(await form.locator('[data-attack-result]').innerText(), /\(Advantage\).*Total -?\d+\./);
  await form.getByRole('button', {name: 'Roll damage for me'}).click();
  assert.match(await form.locator('[data-damage-result]').innerText(), /Dagger damage: \dd4 \[/);
  assert.equal(await stored(), before, 'previews never change the saved character');
  assert.deepEqual(errors, []);
  await ctx.close();
});
