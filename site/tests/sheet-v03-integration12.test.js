// Integration 12: GwenTable Character Sheet v0.3 fillable PDF filled from canonical character state.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {templateCharacter, build} from '../dist/lib/character.js';
import {playProfile, normalizePlay, advancePlay} from '../dist/lib/play.js';
import {sheetV03Values, makeSheetV03PDF, sheetV03TemplatePath, sheetV03Variants} from '../dist/lib/gwentable-sheet-v03.js';
import {PDFDocument} from '../dist/vendor/pdf-lib.min.js';

const load = url => readFileSync(new URL('../dist/' + url.replace('./', ''), import.meta.url));
const setup = cls => { const profile = playProfile(build({...templateCharacter(cls), level: 5}).draft); return {profile, play: normalizePlay(profile)}; };
// Approved kit v0.3 templates, byte-identical to the owner-supplied kit archive.
const approved = {
  'Quick_Reference_A4': 'a0c26dd0f5e5', 'Quick_Reference_LETTER': '13b1f65218a3', 'Compact_A4': '80585dd5e814',
  'Compact_LETTER': 'e7a2238eeab0', 'Complete_A4': '1e0057d73eab', 'Complete_LETTER': 'f718828cb7df'
};

test('bundled templates are the approved v0.3 kit files', () => {
  for (const [name, prefix] of Object.entries(approved)) {
    const hash = createHash('sha256').update(load(`./sheets/GwenTable_${name}_v03_Fillable.pdf`)).digest('hex');
    assert.ok(hash.startsWith(prefix), name);
  }
  assert.throws(() => sheetV03TemplatePath('poster', 'a4'));
  assert.throws(() => sheetV03TemplatePath('complete', 'a3'));
});

test('every mapped field name exists in the Complete template (no silent misspellings)', async () => {
  const pdf = await PDFDocument.load(load(sheetV03TemplatePath('complete', 'a4')));
  const names = new Set(pdf.getForm().getFields().map(f => f.getName()));
  for (const cls of ['Wizard', 'Fighter', 'Cleric', 'Rogue']) {
    const {profile, play} = setup(cls);
    const unknown = Object.keys(sheetV03Values(profile, play)).filter(n => !names.has(n) && !/\.(\d+)\./.test(n) && !/cantrips\.\d+$/.test(n));
    assert.deepEqual(unknown, [], cls);
  }
});

test('values come from the derived profile and play state; clean shows a rested build', () => {
  const {profile} = setup('Wizard');
  let play = normalizePlay(profile);
  play = advancePlay(profile, play, {type: 'damage', value: 5});
  const v = sheetV03Values(profile, play);
  assert.equal(v['combat.hp_current'], String(profile.s.hp - 5));
  assert.equal(v['combat.hp_max'], String(profile.s.hp));
  assert.equal(v['abilities.int.score'], String(profile.s.scores[3]));
  assert.equal(v['abilities.int.save_proficient'], true);
  assert.equal(v['abilities.str.save_proficient'], false);
  assert.equal(v['spellcasting.save_dc'], String(profile.s.known.find(s => s.level > 0).dc));
  assert.equal(v['spellcasting.slots.1.total'], '4');
  assert.equal(sheetV03Values(profile, play, {clean: true})['combat.hp_current'], String(profile.s.hp));
  for (const row of profile.s.skills) assert.equal(v[`skills.${row.name.toLowerCase().replace(/[^a-z]+/g, '_')}.proficient`], row.trained || row.expert);
});

test('fills each variant and paper, keeps fields editable, lists overflow rows', async () => {
  const {profile, play} = setup('Wizard');
  for (const variant of Object.keys(sheetV03Variants)) for (const paper of ['a4', 'letter']) {
    const r = await makeSheetV03PDF(profile, play, {variant, paper, fetchTemplate: async url => load(url)});
    assert.equal(r.pages, sheetV03Variants[variant].pages);
    const pdf = await PDFDocument.load(r.bytes);
    const form = pdf.getForm();
    assert.equal(form.getTextField('identity.name').getText(), profile.d.name);
    assert.ok(form.getFields().length > 100, 'still a fillable form');
    if (variant === 'complete' && r.overflow) assert.match(form.getTextField('story.notes').getText(), /^[\s\S]*Also: /);
  }
});

test('export dialog offers the v0.3 sheet by default and keeps the simple sheet', () => {
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.match(html, /<select name="design"><option value="v03-complete"/);
  assert.match(html, /<option value="simple"/);
  const ui = readFileSync(new URL('../dist/sheet-export.js', import.meta.url), 'utf8');
  assert.match(ui, /makeSheetV03PDF\(profile,state,\{variant:designValue\(\)\.slice\(4\),paper:paper\.value,clean\}\)/);
  assert.match(readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8'), /'\.\/lib\/gwentable-sheet-v03\.js'/);
});
