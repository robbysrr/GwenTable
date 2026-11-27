// Integration 11 regression tests for two builder defects found in real-browser UAT.
// Browser evidence: browser-acceptance/uat.e2e.mjs (UAT-01).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateCharacter, templateCharacter} from '../dist/lib/character.js';
const classNames = ['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];

const app = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');

test('Spells step keeps the Magic Initiate confirmation control after rendering spell content', () => {
  // Defect: the confirmation was appended to `content`, then `content=renderMagic(...)` replaced it,
  // leaving a blocking "Confirm Magic Initiate choices" requirement with no button.
  assert.match(app, /originMagicReview=`<section class="choice-acknowledgement" aria-label="Magic Initiate confirmation">/);
  assert.match(app, /content=renderMagic\(choices,view\)\+originMagicReview;/);
  assert.doesNotMatch(app, /content\+=`<section class="choice-acknowledgement" aria-label="Magic Initiate confirmation">/);
  const declared = app.indexOf("let originMagicReview=''");
  const appended = app.indexOf('content=renderMagic(choices,view)+originMagicReview');
  assert.ok(declared > 0 && appended > declared, 'review is built before the Spells content is assigned');
  assert.match(app, /data-confirm-choice="originMagic"/);
});

const sortedArray = scores => [...scores].sort((a, b) => b - a);
const seeded = seed => () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };

test('generated and template Standard Array drafts carry one complete assignment', () => {
  for (const className of classNames) {
    for (const seed of [1, 2, 3]) {
      const draft = generateCharacter({className, level: 5, method: 'array'}, seeded(seed));
      assert.equal(draft.method, 'array');
      assert.deepEqual(sortedArray(draft.scores), [15, 14, 13, 12, 10, 8], `${className} seed ${seed}`);
    }
    const template = templateCharacter(className);
    assert.deepEqual(sortedArray(template.scores), [15, 14, 13, 12, 10, 8], `${className} template`);
  }
});

test('builder shows generated Standard Array scores as assigned instead of blank selects', () => {
  // Defect: replaceDraft() resets arrayAssigned to [] for new drafts, so generated scores were hidden.
  assert.match(app, /const isCompleteStandardArray=scores=>Array\.isArray\(scores\)&&scores\.length===6&&/);
  assert.match(app, /function showGeneratedArrayAssignment\(\) \{\n  if\(draft\.method==='array'&&isCompleteStandardArray\(draft\.scores\)\) \{arrayAssigned=\[0,1,2,3,4,5\];update\(\);\}\n\}/);
  const generator = app.slice(app.indexOf("$('generator').onsubmit"), app.indexOf("$('template-form').onsubmit"));
  assert.match(generator, /replaceDraft\(generateCharacter\([\s\S]*\);\n  showGeneratedArrayAssignment\(\);/);
  const template = app.slice(app.indexOf("$('template-form').onsubmit"));
  assert.match(template.slice(0, 600), /replaceDraft\(templateCharacter\(name\)[\s\S]*?\);\n  showGeneratedArrayAssignment\(\);/);
  // Ability boosts still require their own confirmation; nothing auto-confirms intent.
  const review = readFileSync(new URL('../dist/builder-choice-review.js', import.meta.url), 'utf8');
  assert.match(review, /stage==='abilities'&&state\.boost!==boostFingerprint\(draft\)/);
});
