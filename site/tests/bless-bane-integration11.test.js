// Integration 11: Bless/Bane shared D20 dice modifiers (SRD 5.2.1 p.113 Bless, p.112 Bane,
// p.106 Combining Magical Effects). Physical d4 entry only; saves wired, attacks table-resolved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter, build} from '../dist/lib/character.js';
import {normalizePlay, playProfile, advancePlay, validatePlay} from '../dist/lib/play.js';
import {liveArmorClass, liveD20Dice, applyD20Dice, modifierLedger} from '../dist/lib/srd-live-modifiers.mjs';
import {previewLiveCheck} from '../dist/lib/srd-live-check-preview.mjs';
import {makePlayExport, readSavedCharacterExport} from '../dist/lib/portable.js';
import {spellHeaders} from '../dist/lib/spell-headers.js';
import {spellEffects} from '../dist/lib/spell-effects.js';
import {messages} from '../dist/locale-copy.js';

const setup = (cls = 'Fighter') => {
  const draft = build({...templateCharacter(cls), level: 5}).draft, profile = playProfile(draft);
  let state = normalizePlay(profile);
  return {
    draft, profile, get state() { return state; },
    act(type, fields = {}) { return state = advancePlay(profile, state, {type, ...fields}); },
    add(spell, caster = 'Ally', fields = {}) { return this.act('modifier-add', {spell, caster, confirmed: true, ...fields}); },
    save(fields = {}) { return previewLiveCheck(profile, state, {kind: 'save', name: 'Wisdom', rolls: [10], advantage: false, disadvantage: false, otherBonus: 0, dc: 15, confirmed: true, ...fields}); },
  };
};
const wis = p => p.profile.s.saves[4];

test('pinned SRD text: Bless +1d4 and Bane -1d4 on attack rolls and saves, Concentration up to 1 minute', () => {
  assert.equal(spellHeaders.Bless[0], 113);
  assert.equal(spellHeaders.Bane[0], 112);
  for (const spell of ['Bless', 'Bane']) assert.match(spellHeaders[spell][4], /Concentration, up to 1 minute/);
  assert.match(spellEffects.Bless[2], /adds 1d4 to the attack roll or save/);
  assert.match(spellEffects.Bane[2], /subtract 1d4 from the attack roll or save/);
});

test('records incoming Bless/Bane on the existing ledger without changing AC, slots or concentration', () => {
  const p = setup();
  const before = structuredClone(p.state);
  p.add('Bless', 'Cleric A');
  p.add('Bane', 'Cultist');
  assert.deepEqual(p.state.modifierEffects.map(e => e.spell), ['Bless', 'Bane']);
  assert.deepEqual(liveArmorClass(p.profile, p.state), {base: p.profile.s.ac, entries: [], total: p.profile.s.ac});
  for (const k of ['slots', 'focus', 'hp', 'combat']) assert.deepEqual(p.state[k], before[k]);
  assert.deepEqual(validatePlay(p.profile, p.state), p.state);
});

test('Bless adds the entered d4 to a saving throw; Bane subtracts it; both together apply', () => {
  const p = setup();
  p.add('Bless');
  const blessed = p.save({spellDice: {Bless: 3}});
  assert.equal(blessed.total, 10 + wis(p) + 3);
  assert.deepEqual(blessed.spellDice, [{spell: 'Bless', roll: 3, value: 3, sourceCount: 1}]);
  p.add('Bane', 'Cultist');
  const both = p.save({spellDice: {Bless: 3, Bane: 4}});
  assert.equal(both.total, 10 + wis(p) + 3 - 4);
});

test('same spell from two casters overlaps into one die (Combining Magical Effects)', () => {
  const p = setup();
  p.add('Bless', 'Cleric A');
  p.add('Bless', 'Paladin B');
  assert.deepEqual(liveD20Dice(p.state, 'save'), [{spell: 'Bless', sides: 4, sign: 1, sourceCount: 2}]);
  assert.equal(p.save({spellDice: {Bless: 2}}).total, 10 + wis(p) + 2);
  // Ending one caster's Bless keeps the other.
  p.act('modifier-remove', {...p.state.modifierEffects[0], confirmed: true});
  assert.equal(p.save({spellDice: {Bless: 2}}).total, 10 + wis(p) + 2);
  p.act('modifier-remove', {...p.state.modifierEffects[0], confirmed: true});
  assert.equal(p.save().total, 10 + wis(p));
});

test('no invented dice: missing, out-of-range, non-integer, extra or inapplicable dice are rejected', () => {
  const p = setup();
  p.add('Bless');
  for (const spellDice of [undefined, {}, {Bless: 0}, {Bless: 5}, {Bless: 2.5}, {Bless: '3'}, {Bless: 3, Bane: 1}, {Bless: 3, __proto__: null, x: 1}, [3]])
    assert.throws(() => p.save(spellDice === undefined ? {} : {spellDice}), RangeError, JSON.stringify(spellDice));
  const fresh = setup();
  assert.throws(() => fresh.save({spellDice: {Bless: 3}}), /does not apply/);
});

test('ability checks are unaffected and refuse Bless/Bane dice', () => {
  const p = setup();
  p.add('Bless');
  const check = previewLiveCheck(p.profile, p.state, {kind: 'skill', name: 'Athletics', rolls: [10], advantage: false, disadvantage: false, otherBonus: 0, dc: null, confirmed: true});
  assert.deepEqual(check.spellDice, []);
  assert.throws(() => previewLiveCheck(p.profile, p.state, {kind: 'skill', name: 'Athletics', rolls: [10], advantage: false, disadvantage: false, otherBonus: 0, dc: null, confirmed: true, spellDice: {Bless: 2}}), /does not apply/);
  assert.deepEqual(applyD20Dice(p.state, 'ability', {}), {parts: [], total: 0});
});

test('automatic save failure needs no dice', () => {
  const p = setup();
  p.add('Bless');
  p.act('condition', {name: 'Stunned', active: true});
  const r = previewLiveCheck(p.profile, p.state, {kind: 'save', name: 'Strength', rolls: [10], advantage: false, disadvantage: false, otherBonus: 0, dc: 10, confirmed: true});
  assert.equal(r.status, 'automatic-failure');
});

test('pending Concentration save uses the same resolver and logs the die; a missing die changes nothing', () => {
  const p = setup('Cleric');
  p.act('concentration', {value: 'Spirit Guardians'});
  p.add('Bless', 'Paladin');
  p.act('damage', {value: 4});
  assert.equal(p.state.concentrationChecks.length, 1);
  const head = p.state.concentrationChecks[0];
  const cmd = over => ({type: 'concentration-roll', focus: p.state.focus, ...head, pendingCount: 1, rolls: [8], advantage: false, disadvantage: false, otherBonus: 0, confirmed: true, ...over});
  const before = structuredClone(p.state);
  assert.throws(() => advancePlay(p.profile, p.state, cmd()));
  assert.deepEqual(p.state, before);
  const next = advancePlay(p.profile, p.state, cmd({spellDice: {Bless: 2}}));
  assert.match(next.log.at(-1), /d20 8 \(Bless \+2\); modifier/);
  assert.equal(next.concentrationChecks.length, 0);
});

test('pending condition save accepts the dice field and applies Bane', () => {
  const p = setup();
  p.add('Bane', 'Cultist');
  p.act('condition-save-add', {name: 'Paralyzed', source: 'Hold Person', ability: 'Wisdom', dc: 15, confirmed: true});
  p.act('condition-save-queue', {id: 'ce1', attempt: 0, confirmed: true});
  const e = p.state.conditionEffects[0];
  const roll = over => advancePlay(p.profile, p.state, {type: 'condition-save-roll', id: 'ce1', attempt: e.save.attempt, name: e.name, source: e.source, ability: 'Wisdom', dc: 15, rolls: [20], advantage: false, disadvantage: false, otherBonus: 15 - 20 - wis(p) + 1, confirmed: true, ...over});
  assert.throws(() => roll());
  // 20 + wis + (16 - 20 - wis) = 16, minus Bane 2 = 14: below DC 15, source remains.
  const failed = roll({spellDice: {Bane: 2}});
  assert.match(failed.log.at(-1), /total 14 \(Bane -2\); failure; source remains/);
});

test('completed rests expire Bless/Bane with other short incoming effects; JSON export round-trips', async () => {
  const p = setup();
  p.add('Bless'); p.add('Bane', 'Cultist'); p.add('Shield of Faith', 'Cleric A');
  const saved = await readSavedCharacterExport(JSON.stringify(await makePlayExport(p.draft, p.state)));
  assert.deepEqual(saved.play.modifierEffects, p.state.modifierEffects);
  p.act('short-rest');
  assert.deepEqual(p.state.modifierEffects, []);
  assert.match(p.state.log.join('\n'), /incoming spell effects \(AC, Bless, Bane\) expired/);
  assert.deepEqual(liveD20Dice(p.state, 'save'), []);
});

test('ledger still rejects unsupported spells and malformed sources', () => {
  const p = setup();
  for (const fields of [{spell: 'Bless ', caster: 'A'}, {spell: 'Guidance', caster: 'A'}, {spell: 'Bless', caster: '<b>'}, {spell: 'Bless', caster: 'A', bonus: 4}])
    assert.throws(() => p.act('modifier-add', {confirmed: true, ...fields}));
  p.add('Bless', 'A');
  assert.throws(() => p.add('Bless', 'a'), /Duplicate/);
  assert.throws(() => modifierLedger({modifierEffects: [{id: 1, spell: 'Bless', caster: 'A', die: 4}], modifierSequence: 1}));
});

test('Play Sheet wires the panel, the three save forms and Indonesian copy; offline cache lists the module', () => {
  const ui = readFileSync(new URL('../dist/play-sheet.js', import.meta.url), 'utf8');
  assert.match(ui, /const saveDice=liveD20Dice\(p,'save'\)/);
  assert.match(ui, /\$\{diceModifierPanel\}/);
  assert.match(ui, /spell:input\.get\('spell'\)\?\?'Shield of Faith'/);
  assert.match(ui, /statsIntro\+attackPanelHTML\(profile,p\)\+liveCheckHTML\(p\)/);
  const check = readFileSync(new URL('../dist/live-check-preview.js', import.meta.url), 'utf8');
  assert.equal((check.match(/spellDiceFields\(play,'save'\)/g) || []).length, 2, 'quick save preview and Concentration form');
  const cond = readFileSync(new URL('../dist/condition-sources.js', import.meta.url), 'utf8');
  assert.match(cond, /spellDiceFields\(play,'save'\)/);
  assert.match(cond, /\.\.\.spellDiceField\(fields\)\}/);
  for (const key of ['Bless and Bane', 'Record Bless or Bane on you', '{spell}: d4 to add', '{spell}: d4 to subtract', 'Record spell effect', 'Spell'])
    assert.ok(messages[key]?.id, key);
  const sw = readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8');
  assert.ok(sw.includes("'./spell-dice-fields.js'"));
  assert.ok(sw.includes('convergence08-integration13'));
});
