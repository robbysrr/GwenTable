import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build,deriveCharacter,generateCharacter,levelsFor,templateCharacter,validateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay,reconcilePlay} from '../dist/lib/play.js';
import {planAttack,resolveAttack,attackSummary} from '../dist/lib/combat-assist.js';
import {cunningEffects,rogueCunningOptions,sneakAttackDice} from '../dist/lib/rogue-strike.js';
import {makePlayExport,readSavedCharacterExport,makeRosterExport,readRosterExport} from '../dist/lib/portable.js';
const starter=templateCharacter('Rogue');
const at=(level,choices={})=>build({...starter,level,...choices}).draft;
const ready=level=>{
 const d=at(level),profile=playProfile(d),state=normalizePlay(profile);
 const index=profile.s.attacks.findIndex(attack=>attack.name==='Dagger');
 assert.ok(index>=0);
 return {d,profile,state,index};
};
const attack=(p,more={})=>({index:p.index,targetAC:10,confirmedHit:false,advantage:true,disadvantage:false,
 rolls:[17,2],sneak:true,allyNear:false,cunning:'none',...more});

test('Rogue joins Fighter at all 20 builder levels; other unfinished classes remain capped at 12',()=>{
 assert.deepEqual(levelsFor('Rogue'),Array.from({length:20},(_,i)=>i+1));
 for(const klass of ['Bard','Cleric','Druid','Sorcerer','Warlock','Wizard'])
  assert.equal(levelsFor(klass).at(-1),12,klass);
});
test('Rogue 13–20 build, derived character, Play, XP and progression remain consistent',()=>{
 const xp=[120000,140000,165000,195000,225000,265000,305000,355000];
 for(let level=13;level<=20;level++){
  const draft=at(level),sheet=deriveCharacter(draft),profile=playProfile(draft);
  assert.deepEqual(validateCharacter(draft),[],String(level));
  assert.equal(sheet.proficiency,level>=17?6:5);
  assert.equal(sheet.xp,xp[level-13]);
  assert.equal(sheet.nextXP,level===20?null:xp[level-12]);
  assert.equal(sheet.dice,level+'d8');
  assert.equal(sheet.features.find(f=>f.startsWith('Sneak Attack (')),`Sneak Attack (${sneakAttackDice(level)}d6)`);
  assert.equal(sheet.subclass,'Thief');
  assert.equal(profile.maxHP,sheet.hp);
  assert.equal(profile.s.climbSpeed,sheet.speed);
 }
});
test('Thief high-level features appear at exact class thresholds, not prematurely',()=>{
 const features=(level,term)=>deriveCharacter(at(level)).features.some(value=>value.startsWith(term));
 for(const [level,key] of [[13,'Use Magic Device'],[14,'Devious Strikes'],[15,'Slippery Mind'],
  [17,'Thief’s Reflexes'],[18,'Elusive'],[20,'Stroke of Luck']]){
  assert.equal(features(level-1,key),false,key+' too soon');
  assert.equal(features(level,key),true,key+' missing');
 }
 assert.ok(features(19,'Boon of'));
 assert.ok(!features(18,'Boon of'));
});
test('level 15 Slippery Mind adds Wisdom and Charisma saving throw proficiency only at level 15',()=>{
 const before=deriveCharacter(at(14)),after=deriveCharacter(at(15));
 assert.equal(after.proficiency,5);
 for(const index of [4,5])assert.equal(after.saves[index]-before.saves[index],5);
 for(const index of [0,1,2,3])assert.equal(after.saves[index],before.saves[index]);
});
test('level 16 feat and level 19 Epic Boon choices validate and affect derived scores',()=>{
 const six=at(16,{advancementSixteenFeat:'Ability Score Improvement',advancementSixteenBoost:'2,2'});
 assert.deepEqual(validateCharacter(six),[]);
 assert.ok(Object.hasOwn(six,'advancementSixteenBoost'));
 const nineteen=at(19,{epicBoonFeat:'Boon of Fate',epicBoonAbility:1});
 assert.deepEqual(validateCharacter(nineteen),[]);
 assert.ok(deriveCharacter(nineteen).featNames.includes('Boon of Fate'));
 assert.ok(playProfile(nineteen).resources.some(r=>r.id==='improve-fate'));
 assert.notDeepEqual(validateCharacter({...nineteen,epicBoonFeat:'Boon of Unlisted Powers'}),[]);
 assert.notDeepEqual(validateCharacter({...six,advancementSixteenBoost:'not-an-option'}),[]);
});
test('high-level Constitution increases preserve retroactive HP and hit-die history',()=>{
 const prior=at(15,{advancementFeat:'Savage Attacker',advancementEightFeat:'Skilled',rogueTenFeat:'Grappler',advancementTwelveFeat:'Magic Initiate'});
 const next=build({...prior,level:16,advancementSixteenFeat:'Ability Score Improvement',advancementSixteenBoost:'2,2'}).draft;
 const one=deriveCharacter(prior),two=deriveCharacter(next);
 assert.equal(two.hp-one.hp,5+one.mods[2]+16);
 assert.equal(two.hpSteps.length,15);
 assert.equal(two.hpParts.first+two.hpParts.advancement+two.hpParts.species+two.hpParts.subclass,two.hp);
});
test('800 seeded Rogue builds across levels 13–20 pass validation and maintain class selection',()=>{
 let seed=754123;
 const rng=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/2**32);
 for(let level=13;level<=20;level++)for(let i=0;i<100;i++){
  const draft=generateCharacter({className:'Rogue',level},rng);
  assert.deepEqual(validateCharacter(draft),[],String(level)+' seed '+seed);
  assert.equal(draft.className,'Rogue');
  assert.equal(draft.level,level);
 }
});
test('Cunning Strike unlocks only verified effects by level',()=>{
 assert.deepEqual(rogueCunningOptions(4),['none']);
 assert.deepEqual(rogueCunningOptions(5),['none','poison','trip','withdraw']);
 assert.deepEqual(rogueCunningOptions(13),['none','poison','trip','withdraw']);
 assert.deepEqual(rogueCunningOptions(14),cunningEffects);
});
test('level 13 can apply two standard Cunning Strikes, paying both costs before critical doubling',()=>{
 const p=ready(13),entry=attack(p,{cunning:'trip',cunningExtra:'withdraw',targetLargeOrSmaller:true,rolls:[20,9]});
 const plan=planAttack(p.profile,p.state,entry);
 assert.equal(plan.rogue.cost,2);
 assert.equal(plan.rogue.count,10);
 assert.deepEqual(plan.rogue.effects,['trip','withdraw']);
 const result=resolveAttack(p.profile,p.state,{...entry,damageRolls:[4,4],sneakRolls:Array(10).fill(3)});
 assert.equal(result.sneakDamage,30);
 assert.match(attackSummary(result),/trip \+ withdraw/);
 assert.match(attackSummary(result),/included in total/);
});
test('level 14 Daze, Knock Out and Obscure use correct costs and DM-controlled saves',()=>{
 const p=ready(14);
 for(const [cunning,cost,phrase] of [['daze',2,'Constitution'],['knockout',6,'Unconscious'],['obscure',3,'Dexterity']]){
  const plan=planAttack(p.profile,p.state,attack(p,{cunning}));
  assert.equal(plan.rogue.count,7-cost);
  assert.equal(plan.rogue.dc,8+p.profile.s.mods[1]+p.profile.s.proficiency);
  assert.match(plan.rogue.notes,new RegExp(phrase));
 }
});
test('illegal Devious Strikes, duplicates and overspending reject before Play mutation',()=>{
 const p=ready(14),low=ready(13),junior=ready(10);
 assert.throws(()=>planAttack(low.profile,low.state,attack(low,{cunning:'obscure'})),/level 14/);
 assert.throws(()=>planAttack(junior.profile,junior.state,attack(junior,{cunning:'trip',cunningExtra:'withdraw',targetLargeOrSmaller:true})),/level 11/);
 assert.throws(()=>planAttack(p.profile,p.state,attack(p,{cunning:'daze',cunningExtra:'daze'})),/different/);
 assert.throws(()=>planAttack(p.profile,p.state,attack(p,{cunning:'none',cunningExtra:'daze'})),/first/);
 assert.throws(()=>planAttack(p.profile,p.state,attack(p,{cunning:'knockout',cunningExtra:'daze'})),/costs more dice/);
 assert.throws(()=>planAttack(p.profile,p.state,attack(p,{cunning:'sneaky'})),/supported Cunning/);
 assert.throws(()=>planAttack(p.profile,p.state,attack(p,{cunning:'poison'})),/Poisoner/);
 assert.throws(()=>planAttack(p.profile,p.state,attack(p,{cunning:'trip'})),/Large or smaller/);
 const before=structuredClone(p.state);
 assert.throws(()=>advancePlay(p.profile,p.state,{type:'attack-assist',...attack(p,{cunning:'knockout',cunningExtra:'obscure'})}));
 assert.deepEqual(p.state,before);
});
test('level 20 Stroke of Luck requires confirmed failed test, uses one charge, and Short Rest restores',()=>{
 const p=ready(20);
 assert.equal(p.profile.resources.find(r=>r.id==='stroke-of-luck').max,1);
 assert.throws(()=>advancePlay(p.profile,p.state,{type:'stroke-of-luck',failed:false}),/Confirm/);
 const used=advancePlay(p.profile,p.state,{type:'stroke-of-luck',failed:true});
 assert.equal(used.counters['stroke-of-luck'],1);
 assert.match(used.log.at(-1),/failed D20 Test becomes 20/);
 assert.throws(()=>advancePlay(p.profile,used,{type:'stroke-of-luck',failed:true}),/expended/);
 const rest=advancePlay(p.profile,used,{type:'short-rest'});
 assert.equal(rest.counters['stroke-of-luck'],0);
 const repeat=advancePlay(p.profile,rest,{type:'stroke-of-luck',failed:true});
 assert.equal(advancePlay(p.profile,repeat,{type:'long-rest'}).counters['stroke-of-luck'],0);
});
test('Stroke of Luck does not require an Action and can be logged at zero HP (DM resolves timing)',()=>{
 const p=ready(20),down=advancePlay(p.profile,p.state,{type:'damage',value:p.profile.maxHP});
 assert.equal(down.hp,0);
 const use=advancePlay(p.profile,down,{type:'stroke-of-luck',failed:true});
 assert.equal(use.counters['stroke-of-luck'],1);
 const lower=ready(19);
 assert.throws(()=>advancePlay(lower.profile,lower.state,{type:'stroke-of-luck',failed:true}),/level 20/);
});
test('Rogue 19 Boon of Fate refreshes on short rest, stays available in Play, and respects Undo',()=>{
 const d=at(19,{epicBoonFeat:'Boon of Fate',epicBoonAbility:1}),profile=playProfile(d),ready=normalizePlay(profile);
 const spent=advancePlay(profile,ready,{type:'counter',id:'improve-fate',delta:1});
 assert.equal(spent.counters['improve-fate'],1);
 assert.equal(advancePlay(profile,spent,{type:'short-rest'}).counters['improve-fate'],0);
 assert.equal(ready.counters['improve-fate'],0);
});
test('leveling to 20 reconciles Play and stroke resource; private backups round-trip',async()=>{
 const d19=at(19),d20=at(20);
 const old=playProfile(d19),next=playProfile(d20);
 const state=advancePlay(old,normalizePlay(old),{type:'damage',value:17});
 const advanced=reconcilePlay(old,next,state);
 assert.equal(advanced.hp,state.hp);
 assert.equal(advanced.counters['stroke-of-luck'],0);
 const used=advancePlay(next,advanced,{type:'stroke-of-luck',failed:true});
 const file=await makePlayExport(d20,used);
 assert.deepEqual(await readSavedCharacterExport(JSON.stringify(file)),{draft:d20,play:used});
 const roster=await makeRosterExport([{draft:d20,play:used,playUndo:advanced}]);
 assert.deepEqual(await readRosterExport(JSON.stringify(roster)),[{draft:d20,play:used,playUndo:advanced}]);
});
test('Play UI wires dual Cunning Strikes and Stroke of Luck to the persisted engine',()=>{
 const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 for(const marker of ['name="cunningExtra"','input.get(\'cunningExtra\')','data-play-action="stroke-of-luck"',"type:'stroke-of-luck',failed:true",'Thief’s Reflexes'])
  assert.ok(ui.includes(marker),marker);
 assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
 assert.ok(sw.includes('./lib/rogue-strike.js'));
});
