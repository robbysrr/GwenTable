// Integration 14 (#4 Spellcasting flow): named casting spends the slot and starts/replaces
// Concentration in one reducer action. SRD 5.2.1 p.104 (cantrips, rituals), p.105 (slot level,
// one slot per turn, Concentration), p.77 (Wizard Ritual Adept).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter, build} from '../dist/lib/character.js';
import {playProfile, normalizePlay, advancePlay, validatePlay} from '../dist/lib/play.js';
import {castableSpells, castOptions, isConcentration, isRitual} from '../dist/lib/srd-spell-cast.mjs';

const setup = (cls, level = 5) => {
  const profile = playProfile(build({...templateCharacter(cls), level}).draft);
  let state = normalizePlay(profile);
  return {profile, get state() { return state; }, set state(v) { state = v; },
    cast(spell, method, slotLevel, extra = {}) { return state = advancePlay(profile, state, {type: 'spell-cast', spell, method, ...(slotLevel ? {slotLevel} : {}), confirmed: true, ...extra}); }};
};

test('leveled spell spends exactly one slot of the chosen level and starts Concentration', () => {
  const p = setup('Sorcerer');
  p.cast('Web', 'slot', 2);
  assert.equal(p.state.slots[2], 1);
  assert.equal(p.state.slots[3] ?? 0, 0);
  assert.equal(p.state.focus, 'Web');
  assert.deepEqual(validatePlay(p.profile, p.state), p.state);
});

test('upcasting uses the higher slot; a lower slot is refused', () => {
  const p = setup('Sorcerer');
  p.cast('Magic Missile', 'slot', 3);
  assert.equal(p.state.slots[3], 1);
  assert.throws(() => p.cast('Web', 'slot', 1), /level or higher/);
});

test('exhausted slots are refused and nothing changes', () => {
  const p = setup('Paladin');
  p.cast('Cure Wounds', 'slot', 2); p.cast('Cure Wounds', 'slot', 2);
  const before = structuredClone(p.state);
  assert.throws(() => p.cast('Cure Wounds', 'slot', 2), /No level 2 spell slots remain/);
  assert.deepEqual(p.state, before);
});

test('Pact Magic casts at the pact slot level only', () => {
  const p = setup('Warlock');
  assert.equal(p.profile.pact, true);
  const o = castOptions(p.profile, p.state, 'Hex');
  assert.deepEqual(o.methods.map(m => m.level), [3]);
  p.cast('Hex', 'slot', 3);
  assert.equal(p.state.slots[3], 1);
  assert.match(p.state.log.at(-1), /level 3 Pact Magic slot/);
});

test('cantrips use no slot; cantrip with a slot is refused', () => {
  const p = setup('Wizard');
  p.cast('Fire Bolt', 'cantrip');
  assert.deepEqual(p.state.slots, normalizePlay(p.profile).slots);
  assert.throws(() => p.cast('Fire Bolt', 'slot', 1), /Cantrips are cast without a spell slot/);
});

test('rituals: prepared ritual or Wizard spellbook ritual, no slot; non-ritual cannot be a ritual', () => {
  const p = setup('Wizard');
  assert.ok(isRitual('Detect Magic'));
  p.cast('Detect Magic', 'ritual');
  assert.deepEqual(p.state.slots, normalizePlay(p.profile).slots);
  assert.match(p.state.log.at(-1), /as a Ritual \(10 minutes longer, no slot\)/);
  const book = castableSpells(p.profile).find(r => !r.prepared);
  assert.ok(book, 'unprepared spellbook ritual offered to a Wizard');
  assert.deepEqual(castOptions(p.profile, p.state, book.name).methods.map(m => m.kind), ['ritual']);
  assert.throws(() => p.cast(book.name, 'slot', 1), /not available|level or higher/);
  assert.throws(() => p.cast('Web', 'ritual'), /not available/);
  const cleric = setup('Cleric');
  assert.ok(castableSpells(cleric.profile).every(r => r.prepared), 'non-Wizards get no unprepared spellbook rituals');
});

test('new Concentration spell replaces the old; non-Concentration spell keeps it', () => {
  const p = setup('Druid');
  p.cast('Entangle', 'slot', 1);
  assert.equal(p.state.focus, 'Entangle');
  p.cast('Goodberry', 'slot', 1);
  assert.equal(p.state.focus, 'Entangle', 'Goodberry is not Concentration');
  p.cast('Moonbeam', 'slot', 2);
  assert.equal(p.state.focus, 'Moonbeam');
  assert.match(p.state.log.at(-1), /Concentration on Entangle ended; now concentrating on Moonbeam/);
  assert.ok(isConcentration('Moonbeam') && !isConcentration('Goodberry'));
});

test('refusals: unconfirmed, unknown, Shield (dedicated control), extra fields, 0 HP', () => {
  const p = setup('Wizard');
  const before = structuredClone(p.state);
  assert.throws(() => p.cast('Web', 'slot', 2, {confirmed: false}), /Confirm/);
  assert.throws(() => p.cast('Wish', 'slot', 3), /not prepared/);
  assert.throws(() => p.cast('Shield', 'slot', 1), /Shield reaction control/);
  assert.throws(() => p.cast('Web', 'slot', 2, {targets: 'x'}), /Unsupported/);
  assert.deepEqual(p.state, before);
  const down = setup('Cleric');
  down.state = advancePlay(down.profile, down.state, {type: 'damage', value: down.profile.s.hp});
  assert.throws(() => down.cast('Healing Word', 'slot', 1), /0 Hit Points/);
});

test('every slot-casting template class can record a cast (8 classes)', () => {
  for (const cls of ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard']) {
    const p = setup(cls);
    const spell = castableSpells(p.profile).find(r => r.level > 0 && r.prepared && r.name !== 'Shield');
    const slot = castOptions(p.profile, p.state, spell.name).methods.find(m => m.kind === 'slot');
    p.cast(spell.name, 'slot', slot.level);
    assert.equal(p.state.slots[slot.level], 1, cls);
  }
});

test('Play sheet wires the panel through change() and Undo; cached offline', () => {
  const ui = readFileSync(new URL('../dist/play-sheet.js', import.meta.url), 'utf8');
  assert.match(ui, /\['spells','Spells & slots',castPanelHTML\(profile,p\)\+spellHelp/);
  assert.match(ui, /if\(type==='spell-cast'\)\{\n      if\(!body\.contains\(event\.target\)\)return;\n      return change\(castCommand\(event\.target\)\);/);
  const sw = readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8');
  for (const f of ['./spell-cast-panel.js', './lib/srd-spell-cast.mjs']) assert.ok(sw.includes(`'${f}'`), f);
});
