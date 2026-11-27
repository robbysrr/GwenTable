// Integration 13 (#3 Attack rolls): player-initiated attack and damage previews.
// SRD 5.2.1: p.6 natural 20 hits / natural 1 misses; p.16 Critical Hit doubles damage dice, modifiers once;
// p.89 Finesse (Str or Dex, same for attack and damage); pp.89-90 property/mastery text (reference only).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter, build} from '../dist/lib/character.js';
import {playProfile, normalizePlay, advancePlay} from '../dist/lib/play.js';
import {attackOptions, previewAttack, previewDamage, parseDamageDice, rollDice} from '../dist/lib/srd-attack-roll.mjs';
import {weaponReference} from '../dist/lib/srd-weapon-reference.js';

const setup = (cls, level = 5, over = {}) => {
  const profile = playProfile(build({...templateCharacter(cls), level, ...over}).draft);
  return {profile, play: normalizePlay(profile)};
};
const row = (p, name) => p.profile.s.attacks.find(a => a.name === name);
const attack = (p, name, input) => previewAttack(p.profile, p.play, {row: row(p, name), ...input});

test('derived rows explain their own numbers (no second calculation)', () => {
  for (const cls of ['Fighter', 'Rogue', 'Ranger', 'Wizard', 'Monk', 'Paladin', 'Barbarian']) {
    const {profile} = setup(cls);
    for (const r of profile.s.attacks) {
      const o = attackOptions(profile, r);
      assert.equal(o.attackBonus, r.bonus, `${cls} ${r.name}`);
      assert.equal(o.damageMod, r.mod);
      const sum = o.formula.reduce((a, f) => a + f.value, 0);
      assert.equal(sum, r.bonus, `${cls} ${r.name} formula adds up`);
    }
  }
});

test('melee and ranged totals; Archery shown separately; non-proficient weapon has no Proficiency Bonus', () => {
  const ranger = setup('Ranger');
  const bow = row(ranger, 'Longbow');
  const r = attack(ranger, 'Longbow', {rolls: [11]});
  assert.equal(r.total, 11 + bow.bonus);
  assert.ok(attackOptions(ranger.profile, bow).formula.some(f => f.label === 'Fighting Style (Archery)' && f.value === 2));
  const wizard = setup('Wizard');
  const custom = {...row(wizard, 'Dagger'), proficient: false, bonus: row(wizard, 'Dagger').mod};
  assert.match(attackOptions(wizard.profile, custom).warning, /Not proficient/);
});

test('Finesse: choose Strength or Dexterity, used for both attack and damage; other weapons cannot switch', () => {
  const p = setup('Rogue');
  const dagger = row(p, 'Dagger');
  const str = attackOptions(p.profile, dagger, {ability: 0});
  assert.equal(str.attackBonus, p.profile.s.mods[0] + p.profile.s.proficiency);
  assert.equal(str.damageMod, p.profile.s.mods[0]);
  assert.throws(() => attackOptions(p.profile, row(p, 'Shortbow'), {ability: 0}), /Finesse/);
});

test('natural 20 is a Critical Hit; natural 1 misses even against low AC; Champion crits on 19', () => {
  const p = setup('Rogue');
  assert.equal(attack(p, 'Dagger', {rolls: [20], targetAC: 30}).critical, true);
  assert.equal(attack(p, 'Dagger', {rolls: [20], targetAC: 30}).status, 'success');
  const one = attack(p, 'Dagger', {rolls: [1], targetAC: 2});
  assert.equal(one.automaticMiss, true);
  assert.equal(one.status, 'failure');
  assert.equal(attack(p, 'Dagger', {rolls: [12], targetAC: 30}).status, 'failure');
  const champion = setup('Fighter');
  const sword = champion.profile.s.attacks[0];
  assert.equal(previewAttack(champion.profile, champion.play, {row: sword, rolls: [19]}).critical, true);
  assert.equal(previewAttack(champion.profile, champion.play, {row: sword, rolls: [18]}).critical, false);
});

test('Advantage/Disadvantage need two dice and take higher/lower; both cancel', () => {
  const p = setup('Rogue');
  assert.equal(attack(p, 'Dagger', {rolls: [3, 17], advantage: true}).natural, 17);
  assert.equal(attack(p, 'Dagger', {rolls: [3, 17], disadvantage: true}).natural, 3);
  assert.throws(() => attack(p, 'Dagger', {rolls: [3], advantage: true}));
  assert.equal(attack(p, 'Dagger', {rolls: [9], advantage: true, disadvantage: true}).mode, 'normal');
});

test('Critical damage doubles the dice, adds modifiers once; flat Unarmed Strike; negative modifier allowed', () => {
  const p = setup('Rogue');
  const d = previewDamage(p.profile, {row: row(p, 'Dagger'), critical: true, rolls: [4, 1]});
  assert.equal(d.total, 5 + row(p, 'Dagger').mod);
  assert.throws(() => previewDamage(p.profile, {row: row(p, 'Dagger'), critical: true, rolls: [4]}), /Enter 2 results on d4/);
  assert.throws(() => previewDamage(p.profile, {row: row(p, 'Dagger'), rolls: [5]}), /d4/);
  const fist = previewDamage(p.profile, {row: row(p, 'Unarmed Strike'), rolls: []});
  assert.equal(fist.total, 1 + row(p, 'Unarmed Strike').mod);
  const weak = previewDamage(p.profile, {row: row(p, 'Dagger'), ability: 0, rolls: [1], extra: -3});
  assert.equal(weak.total, 1 + p.profile.s.mods[0] - 3);
  if (weak.total <= 0) assert.match(weak.note, /confirm/);
  assert.deepEqual(parseDamageDice('2d6'), {count: 2, sides: 6, flat: 0});
  assert.throws(() => parseDamageDice('2d7'));
});

test('Exhaustion and recorded Bless/Bane apply to attack rolls with a physical d4; missing d4 is refused', () => {
  const p = setup('Rogue');
  let play = advancePlay(p.profile, p.play, {type: 'modifier-add', spell: 'Bless', caster: 'Cleric', confirmed: true});
  play = advancePlay(p.profile, play, {type: 'exhaustion', value: 1});
  const base = row(p, 'Dagger').bonus;
  assert.throws(() => previewAttack(p.profile, play, {row: row(p, 'Dagger'), rolls: [10]}), /d4 result for Bless/);
  const r = previewAttack(p.profile, play, {row: row(p, 'Dagger'), rolls: [10], spellDice: {Bless: 3}});
  assert.equal(r.total, 10 + base + 3 - 2);
});

test('inputs are validated; generated dice stay within range; previews never change state', () => {
  const p = setup('Rogue');
  const before = structuredClone(p.play);
  for (const bad of [{rolls: [0]}, {rolls: [21]}, {rolls: [2.5]}, {rolls: [10], otherBonus: 99}, {rolls: [10], targetAC: 0}])
    assert.throws(() => attack(p, 'Dagger', bad));
  attack(p, 'Dagger', {rolls: [15]});
  previewDamage(p.profile, {row: row(p, 'Dagger'), rolls: [2]});
  assert.deepEqual(p.play, before);
  let i = 0; const seq = [0, 0.999, 0.5];
  assert.deepEqual(rollDice(3, 6, () => seq[i++]), [1, 6, 4]);
  assert.throws(() => previewAttack(p.profile, {...p.play, dead: true}, {row: row(p, 'Dagger'), rolls: [10]}));
});

test('weapon property and mastery reference text is the SRD wording with pages', () => {
  assert.equal(Object.keys(weaponReference).length, 18);
  assert.match(weaponReference.Finesse.text, /^When making an attack with a Finesse weapon, use your choice of your Strength or Dexterity modifier/);
  assert.equal(weaponReference.Vex.kind, 'mastery');
  assert.equal(weaponReference.Graze.page, 90);
});

test('Play sheet renders the panel inside Attacks & checks; handlers are preview-only; cached offline', () => {
  const ui = readFileSync(new URL('../dist/play-sheet.js', import.meta.url), 'utf8');
  assert.match(ui, /statsIntro\+attackPanelHTML\(profile,p\)\+liveCheckHTML\(p\)/);
  const handler = ui.slice(ui.indexOf("if(event.target.matches('[data-attack-form]'))"), ui.indexOf("if(event.target.matches('[data-live-check]'))"));
  assert.match(handler, /attackFormResult/);
  assert.doesNotMatch(handler, /change\(|characters\./);
  const sw = readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8');
  for (const f of ['./attack-panel.js', './lib/srd-attack-roll.mjs', './lib/srd-weapon-reference.js']) assert.ok(sw.includes(`'${f}'`), f);
});
