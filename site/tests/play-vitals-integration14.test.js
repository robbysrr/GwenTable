// Integration 14 (#2 save state, #23 mobile layout): sticky vitals strip on the Play sheet.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {messages} from '../dist/locale-copy.js';

const ui = readFileSync(new URL('../dist/play-sheet.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

test('strip exists once, outside the re-rendered body, before the feedback line', () => {
  assert.equal((html.match(/id="play-vitals"/g) || []).length, 1);
  assert.ok(html.indexOf('id="play-vitals"') < html.indexOf('id="play-feedback"'));
});

test('strip reads the same live state and live AC as the sheet; no separate state', () => {
  const fn = ui.slice(ui.indexOf('function renderVitals(){'), ui.indexOf("vitals?.addEventListener('click'"));
  assert.match(fn, /const p=play,ac=liveArmorClass\(profile,p\)\.total;/);
  assert.match(fn, /\$\{p\.hp\}\/\$\{profile\.maxHP\}/);
  assert.doesNotMatch(fn, /characters\.|change\(/);
});

test('save state follows the single change() transaction: saving, saved, or not saved on conflict', () => {
  const fn = ui.slice(ui.indexOf('async function change(action) {'), ui.indexOf('async function activateMulticlass'));
  assert.match(fn, /saveState='saving';renderVitals\(\);/);
  assert.match(fn, /saveState='saved';\n      takeRecord\(next\);/);
  assert.match(fn, /saveState=error\?\.code===characterConflictCode\?'error':'saved';/);
  assert.match(fn, /finally \{busy=false;renderVitals\(\);\}/);
});

test('strip Undo delegates to the existing Undo control and has a distinct accessible name', () => {
  assert.match(ui, /if\(event\.target\.closest\('\[data-vitals-undo\]'\)\)root\.querySelector\('\[data-play-action="undo"\]'\)\?\.click\(\);/);
  assert.match(ui, /aria-label="\$\{htmlCopy\('Undo last change'\)\}"/);
  for (const key of ['Saving…', 'Saved', 'Not saved', 'Undo last change', 'Current vitals']) assert.ok(messages[key]?.id, key);
});
