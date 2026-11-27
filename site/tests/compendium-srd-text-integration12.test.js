// Integration 12: compendium shows each subject's own SRD 5.2.1 text (extracted from the official
// PDF by scripts/extract-entry-text.py; 7,262 of 7,315 sentences verbatim when generated).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {entryText} from '../dist/lib/srd-entry-text.js';
import {catalogueEntries} from '../dist/compendium.js';

const text = key => entryText[key]?.[1] ?? '';
const count = type => Object.keys(entryText).filter(k => k.startsWith(type + '|')).length;

test('coverage: every subject type with its own SRD entry has text', () => {
  assert.equal(count('Creature'), 330);
  assert.ok(count('Spell') >= 338);
  assert.ok(count('Magic Item') >= 255);
  assert.equal(count('Species'), 9);
  assert.equal(count('Background'), 4);
  assert.equal(count('Feat'), 10);
  assert.ok(count('Subclass') >= 10);
});

test('text starts at the subject, not at the top of its printed page', () => {
  assert.match(text('Equipment|Acid'), /^When you take the Attack action, you can replace one of your attacks with throwing a vial of Acid\./);
  assert.match(text('Species|Dwarf'), /^Creature Type: Humanoid\nSize: Medium/);
  assert.doesNotMatch(text('Species|Dwarf'), /Dragonborn|Elf\b/);
  assert.match(text('Feat|Alert'), /^Origin Feat\n/);
  assert.match(text('Magic Item|Bag of Holding'), /^Wondrous Item, Uncommon\nThis bag has an interior space/);
  assert.doesNotMatch(text('Magic Item|Bag of Holding'), /feeding orifice/);
  assert.equal(entryText['Magic Item|Bag of Holding'][0], 212);
});

test('text ends before the next subject', () => {
  assert.match(text('Spell|Fireball'), /Duration: Instantaneous\nA bright streak/);
  assert.match(text('Spell|Fireball'), /increases by 1d6 for each spell slot level above 3\.$/);
  assert.doesNotMatch(text('Spell|Fireball'), /Otherworldly Steed|Fire Shield/);
  assert.match(text('Spell|Bless'), /adds 1d4 to the attack roll or save/);
  assert.match(text('Creature|Goblin Warrior'), /^Small Fey \(Goblinoid\), Chaotic Neutral\nAC 15\n/);
  assert.match(text('Creature|Goblin Warrior'), /Str 8 \(−1, save −1\) · Dex 15 \(\+2, save \+2\)/);
  assert.doesNotMatch(text('Creature|Goblin Warrior'), /Goblin Boss/);
});

test('weapons and armor show their SRD table row; every catalogue row has a lookup key', () => {
  const entries = catalogueEntries();
  const longsword = entries.find(e => e.name === 'Longsword');
  assert.equal(longsword.summary, 'Martial Melee weapon\nDamage: 1d8 Slashing\nProperties: Versatile (1d10)\nMastery: Sap');
  assert.match(entries.find(e => e.name === 'Chain Mail').summary, /^Heavy Armor\nArmor Class: 16\nStrength: 13\nStealth: Disadvantage$/);
  assert.ok(entries.every(e => e.entryKey === e.type + '|' + e.name));
  const covered = entries.filter(e => e.summary || entryText[e.entryKey]).length;
  assert.ok(covered >= 1095, `covered ${covered}`);
});

test('reader opens on the description and can switch to the full page', () => {
  const ui = readFileSync(new URL('../dist/official-reference.js', import.meta.url), 'utf8');
  assert.match(ui, /import\('\.\/lib\/srd-entry-text\.js'\)/);
  assert.match(ui, /entryMode=Boolean\(key\|\|tableSummary\)/);
  assert.match(ui, /copy\('Show full SRD page'\)/);
  assert.match(readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'), /data-rules-mode hidden/);
});
