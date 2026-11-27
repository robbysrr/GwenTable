import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {paladinProgression,restoringTouchConditions} from '../dist/lib/paladin-progression.js';
import {levelsFor,build,templateCharacter,generateCharacter,deriveCharacter,validateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay,validatePlay,reconcilePlay} from '../dist/lib/play.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';
const base=templateCharacter('Paladin');
const draft=(level,other={})=>build({...base,level,...other}).draft;
function setup(level){
 const d=draft(level),profile=playProfile(d);let state=normalizePlay(profile);
 const act=(type,fields={})=>state=advancePlay(profile,state,{type,...fields});
 const fail=(type,fields,pattern)=>{
  const before=structuredClone(state);
  assert.throws(()=>act(type,fields),pattern);
  assert.deepEqual(state,before,'invalid actions do not write state');
 };
 return {d,profile,act,fail,get state(){return state;}};
}
test('Paladin Oath of Devotion exposes exactly levels 1–20, rejects wrong progression input',()=>{
 assert.deepEqual(levelsFor('Paladin'),Array.from({length:20},(_,i)=>i+1));
 for(const level of [-1,0,21,'20',1.5,null,NaN]) assert.throws(()=>paladinProgression(level),/Paladin level/);
 for(const cls of ['Bard','Cleric','Druid','Sorcerer','Warlock','Wizard'])assert.equal(levelsFor(cls).at(-1),12);
});
test('Paladin SRD 5.2.1 prepared-count and slot table match every level 1–20',()=>{
 const prepared=[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];
 const expected=[[2],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],
 [4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],
 [4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
 for(let level=1;level<=20;level++){
  const prog=paladinProgression(level),s=deriveCharacter(draft(level));
  assert.equal(prog.prepared,prepared[level-1],`prepared level ${level}`);
  assert.deepEqual(prog.slots.map(r=>r.count),expected[level-1],`progression slot level ${level}`);
  assert.deepEqual(s.slots,prog.slots,`derived slot level ${level}`);
  assert.equal(s.known.filter(row=>row.origin==='Paladin').length,prepared[level-1],`chosen spells level ${level}`);
 }
});
test('Paladin 13–20 progression validates XP, hit dice, proficiency, AC and save values',()=>{
 const xp=[120000,140000,165000,195000,225000,265000,305000,355000];
 for(let level=13;level<=20;level++){
  const d=draft(level),s=deriveCharacter(d);
  assert.deepEqual(validateCharacter(d),[],`level ${level}`);
  assert.equal(s.xp,xp[level-13]);
  assert.equal(s.nextXP,level===20?null:xp[level-12]);
  assert.equal(s.dice,`${level}d10`);
  assert.equal(s.proficiency,level>=17?6:5);
  assert.equal(s.subclass,'Oath of Devotion');
  assert.ok(Number.isInteger(s.auraBonus));
 }
});
test('Paladin level 16 feat/ASI, level 19 Epic Boon and invalid choices',()=>{
 const six=draft(16,{advancementSixteenFeat:'Ability Score Improvement',advancementSixteenBoost:'0,0'});
 assert.deepEqual(validateCharacter(six),[]);
 assert.ok(Object.hasOwn(six,'advancementSixteenBoost'));
 const nineteen=draft(19,{epicBoonFeat:'Boon of Fate',epicBoonAbility:5});
 assert.deepEqual(validateCharacter(nineteen),[]);
 assert.equal(playProfile(nineteen).resources.find(pool=>pool.id==='improve-fate').max,1);
 assert.notDeepEqual(validateCharacter({...nineteen,epicBoonFeat:'Unsupported Epic Boon'}),[]);
 assert.notDeepEqual(validateCharacter({...six,advancementSixteenBoost:'-1,-1'}),[]);
});
test('Paladin level 13 and 17 Oath of Devotion spells are always granted, not counted as prepared',()=>{
 const twelve=deriveCharacter(draft(12)),thirteen=deriveCharacter(draft(13)),seventeen=deriveCharacter(draft(17));
 for(const name of ['Freedom of Movement','Guardian of Faith']){
  assert.ok(thirteen.known.some(r=>r.name===name&&r.origin==='Oath of Devotion'));
  assert.ok(!twelve.known.some(r=>r.name===name&&r.origin==='Oath of Devotion'));
 }
 for(const name of ['Commune','Flame Strike']){
  assert.ok(seventeen.known.some(r=>r.name===name&&r.origin==='Oath of Devotion'));
  assert.ok(!thirteen.known.some(r=>r.name===name&&r.origin==='Oath of Devotion'));
 }
 assert.equal(thirteen.known.filter(row=>row.origin==='Paladin').length,11);
 assert.equal(seventeen.known.filter(row=>row.origin==='Paladin').length,14);
});
test('Paladin aura radius, Restoring Touch, Smite of Protection and Nimbus unlock at exact level boundaries',()=>{
 for(const [level,feature] of [[14,'Restoring Touch'],[15,'Smite of Protection'],[18,'Aura Expansion'],[20,'Holy Nimbus']]){
  assert.equal(deriveCharacter(draft(level)).features.some(row=>row.startsWith(feature)),true,feature);
  assert.equal(deriveCharacter(draft(level-1)).features.some(row=>row.startsWith(feature)),false,feature);
 }
 for(const [level,radius] of [[5,0],[6,10],[17,10],[18,30],[20,30]]){
  assert.equal(deriveCharacter(draft(level)).auraRadius,radius);
  assert.equal(paladinProgression(level).auraRadius,radius);
 }
});
test('800 generated high-level Paladins 13–20 validate without skipping required magic or feats',()=>{
 let seed=89017;const rng=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/2**32);
 for(let level=13;level<=20;level++)for(let i=0;i<100;i++){
  const d=generateCharacter({className:'Paladin',level},rng);
  assert.equal(d.level,level);assert.equal(d.className,'Paladin');
  assert.deepEqual(validateCharacter(d),[],`level ${level}, seed ${seed}`);
 }
});
test('Restoring Touch costs five Lay On Hands points per condition and uses Bonus Action',()=>{
 const p=setup(14);p.act('condition',{name:'Blinded',active:true});p.act('condition',{name:'Frightened',active:true});
 p.act('combat-start',{initiative:13});p.act('combat-turn',{stage:'start'});
 p.act('lay-on-hands',{target:'self',effect:'restore',conditions:['Blinded','Frightened']});
 assert.equal(p.state.counters['lay-on-hands'],10);
 assert.ok(!p.state.conditions.includes('Blinded')&&!p.state.conditions.includes('Frightened'));
 assert.equal(p.state.combat.bonusUsed,true);
 p.fail('lay-on-hands',{target:'other',effect:'restore',conditions:['Charmed']},/Bonus Action/);
});
test('Restoring Touch supports ally conditions without inventing allied HP or statuses',()=>{
 const p=setup(14),hp=p.state.hp;
 p.act('lay-on-hands',{target:'other',effect:'restore',conditions:['Paralyzed','Stunned']});
 assert.equal(p.state.counters['lay-on-hands'],10);
 assert.equal(p.state.hp,hp);
 assert.match(p.state.log.at(-1),/DM confirms/);
 assert.deepEqual(validatePlay(p.profile,p.state),p.state);
});
test('Restoring Touch rejects below-level, forged, duplicate, ineligible or unaffordable conditions',()=>{
 const low=setup(13);low.fail('lay-on-hands',{target:'other',effect:'restore',conditions:['Blinded']},/level 14/);
 const p=setup(14);
 for(const conditions of [[],['Blinded','Blinded'],['Poisoned'],['Blinded','<script>'],'Blinded',Array(7).fill('Blinded')])
  p.fail('lay-on-hands',{target:'other',effect:'restore',conditions},/distinct Restoring Touch/);
 p.fail('lay-on-hands',{target:'self',effect:'restore',conditions:['Blinded']},/does not have/);
 p.act('lay-on-hands',{target:'other',effect:'heal',points:65});
 p.fail('lay-on-hands',{target:'other',effect:'restore',conditions:['Blinded','Frightened']},/Not enough/);
});
test('Holy Nimbus unlocks only at level 20; activation is limited to one use before recharge',()=>{
 const lower=setup(19);lower.fail('holy-nimbus-start',{confirmed:true},/level 20/);
 const p=setup(20);
 p.fail('holy-nimbus-start',{confirmed:false},/Confirm/);
 p.act('combat-start',{initiative:9});p.fail('holy-nimbus-start',{confirmed:true},/requires your turn/);
 p.act('combat-turn',{stage:'start'});
 p.act('holy-nimbus-start',{confirmed:true});
 assert.deepEqual(p.state.nimbus,{active:true});assert.equal(p.state.counters['holy-nimbus'],1);
 assert.equal(p.state.combat.bonusUsed,true);
 p.fail('holy-nimbus-start',{confirmed:true},/already active/);
 p.act('holy-nimbus-end');assert.deepEqual(p.state.nimbus,{active:false});
 p.fail('holy-nimbus-start',{confirmed:true},/Long Rest or a level 5/);
});
test('Holy Nimbus recharge spends exactly one level 5 slot without using an action',()=>{
 const p=setup(20);p.act('holy-nimbus-start',{confirmed:true});p.act('holy-nimbus-end');
 p.act('holy-nimbus-recharge');
 assert.equal(p.state.slots[5],1);assert.equal(p.state.counters['holy-nimbus'],0);
 p.fail('holy-nimbus-recharge',{},/already ready/);
 p.act('holy-nimbus-start',{confirmed:true});p.act('holy-nimbus-end');p.act('holy-nimbus-recharge');
 assert.equal(p.state.slots[5],2);
 p.act('holy-nimbus-start',{confirmed:true});p.act('holy-nimbus-end');
 p.fail('holy-nimbus-recharge',{},/No level 5 spell slot/);
});
test('Holy Nimbus and Restoring Touch survive snapshot validation, backup export and rollback',async()=>{
 const p=setup(20);p.act('holy-nimbus-start',{confirmed:true});
 p.act('lay-on-hands',{target:'other',effect:'restore',conditions:['Deafened']});
 assert.deepEqual(validatePlay(p.profile,p.state),p.state);
 assert.deepEqual(reconcilePlay(p.profile,p.profile,p.state),p.state);
 const file=await makePlayExport(p.d,p.state);
 const imported=await readSavedCharacterExport(JSON.stringify(file));
 assert.deepEqual(imported.play.nimbus,p.state.nimbus);
 assert.equal(imported.play.counters['lay-on-hands'],5);
 const before=p.state,after=advancePlay(p.profile,before,{type:'holy-nimbus-end'});
 assert.equal(before.nimbus.active,true);assert.equal(after.nimbus.active,false);
});
test('Pre-v0.25.5 Play backups add Nimbus state without accepting malformed overrides',()=>{
 const p=setup(20),legacy=structuredClone(p.state);
 delete legacy.nimbus;delete legacy.counters['holy-nimbus'];
 assert.deepEqual(validatePlay(p.profile,legacy),p.state);
 assert.throws(()=>validatePlay(p.profile,{...p.state,nimbus:{active:'yes'}}),/invalid health/);
 assert.throws(()=>validatePlay(p.profile,{...p.state,nimbus:{active:true,extra:'forged'}}),/invalid health/);
 assert.throws(()=>validatePlay(p.profile,{...p.state,counters:{...p.state.counters,'holy-nimbus':100}}),/invalid health/);
});
test('Holy Nimbus aura ends on Short or Long Rest, use only recovers on Long Rest',()=>{
 const p=setup(20);p.act('holy-nimbus-start',{confirmed:true});
 p.act('short-rest');assert.equal(p.state.nimbus.active,false);assert.equal(p.state.counters['holy-nimbus'],1);
 p.act('long-rest');assert.equal(p.state.nimbus.active,false);assert.equal(p.state.counters['holy-nimbus'],0);
});
test('High-level Divine Smite supports level 5 slot and records Smite of Protection reminder',()=>{
 const p=setup(20);
 p.act('divine-smite',{confirmedHit:true,free:false,level:5,fiendOrUndead:true,damageRoll:42});
 assert.equal(p.state.slots[5],1);
 assert.match(p.state.log.at(-1),/7d8/);
 assert.match(p.state.log.at(-1),/Smite of Protection/);
});
test('Paladin Play UI and bilingual strings are registered in the offline cache',()=>{
 const root=new URL('../dist/',import.meta.url);
 const ui=readFileSync(new URL('play-sheet.js',root),'utf8');
 const loc=readFileSync(new URL('locale-copy.js',root),'utf8');
 const sw=readFileSync(new URL('sw.js',root),'utf8');
 for(const name of ['restoring-touch','holy-nimbus-start','holy-nimbus-end','holy-nimbus-recharge']) assert.match(ui,new RegExp(name));
 for(const text of ['Hapus kondisi yang dipilih','Aktifkan Holy Nimbus','Isi ulang dengan spell slot'])assert.ok(loc.includes(text));
 assert.match(sw,/paladin-progression\.js/);assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
 assert.deepEqual(restoringTouchConditions,['Blinded','Charmed','Deafened','Frightened','Paralyzed','Stunned']);
});
