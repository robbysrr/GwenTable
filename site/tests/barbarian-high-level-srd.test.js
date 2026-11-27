import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build,deriveCharacter,generateCharacter,levelsFor,templateCharacter,validateCharacter} from '../dist/lib/character.js';
import {barbarianProgression,indomitableMightTotal} from '../dist/lib/barbarian-progression.js';
import {playProfile,normalizePlay,advancePlay,validatePlay,reconcilePlay} from '../dist/lib/play.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';
const starter=templateCharacter('Barbarian');
const draft=(level,extra={})=>build({...starter,level,...extra}).draft;
const setup=(level)=>{
 const d=draft(level),profile=playProfile(d);
 let state=normalizePlay(profile);
 const act=(type,props={})=>state=advancePlay(profile,state,{type,...props});
 return {d,profile,act,get state(){return state;}};
};

test('SRD 5.2.1 Barbarian levels 1–20 use the correct Rage, damage and mastery thresholds',()=>{
 assert.deepEqual(levelsFor('Barbarian'),Array.from({length:20},(_,i)=>i+1));
 for(const [level,rages,damage,masteries] of [[1,2,2,2],[3,3,2,2],[4,3,2,3],[6,4,2,3],
   [9,4,3,3],[10,4,3,4],[11,4,3,4],[12,5,3,4],[16,5,4,4],[17,6,4,4],[20,6,4,4]]){
  const p=barbarianProgression(level);
  assert.deepEqual([p.rages,p.rageDamage,p.masteries],[rages,damage,masteries],String(level));
  assert.equal(playProfile(draft(level)).resources.find(resource=>resource.id==='rage').max,rages);
  assert.equal(draft(level).mastery.length,masteries);
 }
 for(const bad of [-1,0,21,1.1,null,'17'])assert.throws(()=>barbarianProgression(bad),/level/);
});

test('Brutal Strike unlocks extra effects at 13 and two different effects at 17, not earlier',()=>{
 assert.deepEqual(barbarianProgression(8).brutalEffects,[]);
 assert.deepEqual(barbarianProgression(9).brutalEffects,['Forceful Blow','Hamstring Blow']);
 assert.equal(barbarianProgression(12).brutalDice,1);
 assert.deepEqual(barbarianProgression(13).brutalEffects,['Forceful Blow','Hamstring Blow','Staggering Blow','Sundering Blow']);
 assert.equal(barbarianProgression(16).brutalEffectCount,1);
 assert.deepEqual([barbarianProgression(17).brutalDice,barbarianProgression(17).brutalEffectCount],[2,2]);
});

test('Barbarian 13–20 builds derive exact class, HP, XP, proficiency and new feature thresholds',()=>{
 const xp=[120000,140000,165000,195000,225000,265000,305000,355000];
 for(let level=13;level<=20;level++){
  const d=draft(level),s=deriveCharacter(d);
  assert.deepEqual(validateCharacter(d),[],String(level));
  assert.equal(s.xp,xp[level-13]);
  assert.equal(s.nextXP,level===20?null:xp[level-12]);
  assert.equal(s.dice,level+'d12');
  assert.equal(s.proficiency,level>=17?6:5);
  assert.equal(s.subclass,'Path of the Berserker');
  assert.equal(playProfile(d).maxHP,s.hp);
  assert.equal(s.barbarian.rages,level>=17?6:5);
 }
 const features=(level,term)=>deriveCharacter(draft(level)).features.some(v=>v.startsWith(term));
 for(const [level,term] of [[13,'Improved Brutal Strike'],[14,'Intimidating Presence'],[15,'Persistent Rage'],
   [18,'Indomitable Might'],[20,'Primal Champion']]){
  assert.equal(features(level-1,term),false,term+' too soon');
  assert.equal(features(level,term),true,term+' missing');
 }
});

test('Level-16 ASI and level-19 Epic Boon remain explicit validated choices',()=>{
 const sixteen=draft(16,{advancementSixteenFeat:'Ability Score Improvement',advancementSixteenBoost:'2,2'});
 assert.deepEqual(validateCharacter(sixteen),[]);
 assert.ok(Object.hasOwn(sixteen,'advancementSixteenBoost'));
 const nineteen=draft(19,{epicBoonFeat:'Boon of Fate',epicBoonAbility:1});
 assert.deepEqual(validateCharacter(nineteen),[]);
 assert.ok(deriveCharacter(nineteen).featNames.includes('Boon of Fate'));
 assert.ok(playProfile(nineteen).resources.some(row=>row.id==='improve-fate'));
 assert.notDeepEqual(validateCharacter({...sixteen,advancementSixteenBoost:'invalid'}),[]);
 assert.notDeepEqual(validateCharacter({...nineteen,epicBoonFeat:'Unverified Boon'}),[]);
});

test('Primal Champion applies +4 STR and CON (maximum 25) and retroactive Constitution HP',()=>{
 const nineteen=draft(19),twenty=draft(20);
 const old=deriveCharacter(nineteen),s=deriveCharacter(twenty);
 assert.equal(s.scores[0],Math.min(25,old.scores[0]+4));
 assert.equal(s.scores[2],Math.min(25,old.scores[2]+4));
 assert.equal(s.hp-old.hp,7+old.mods[2]+20*(s.mods[2]-old.mods[2]));
 assert.equal(s.hpSteps.length,19);
 assert.equal(s.hpParts.first+s.hpParts.advancement+s.hpParts.species+s.hpParts.subclass,s.hp);
 const conASI=draft(20,{advancementSixteenFeat:'Ability Score Improvement',advancementSixteenBoost:'2,2'});
 const increased=deriveCharacter(conASI);
 assert.ok(increased.scores[2]<=25);
 assert.deepEqual(validateCharacter(conASI),[]);
});

test('800 seeded high-level Barbarian builds validate without leaking other class choices',()=>{
 let seed=96512;
 const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 for(let level=13;level<=20;level++)for(let n=0;n<100;n++){
  const d=generateCharacter({className:'Barbarian',level},rng);
  assert.deepEqual(validateCharacter(d),[],`level ${level}, seed ${seed}`);
  assert.equal(d.level,level);assert.equal(d.className,'Barbarian');
 }
});

test('Intimidating Presence consumes Bonus Action, respects one-use limit, and can recharge for Rage',()=>{
 const p=setup(14);
 assert.equal(p.profile.resources.find(r=>r.id==='intimidating-presence').max,1);
 assert.throws(()=>p.act('intimidating-presence'),/Confirm/);
 p.act('combat-start',{initiative:17});p.act('combat-turn',{stage:'start'});
 p.act('intimidating-presence',{confirmed:true});
 assert.equal(p.state.counters['intimidating-presence'],1);
 assert.equal(p.state.combat.bonusUsed,true);
 assert.match(p.state.log.at(-1),/Wisdom saving throw DC/);
 assert.throws(()=>p.act('intimidating-presence',{confirmed:true}),/recharged/);
 p.act('intimidating-presence-recharge');
 assert.equal(p.state.counters.rage,1);
 assert.equal(p.state.counters['intimidating-presence'],0);
 assert.throws(()=>p.act('intimidating-presence',{confirmed:true}),/Bonus Action/);
 p.act('combat-turn',{stage:'end'});p.act('combat-turn',{stage:'start'});
 p.act('intimidating-presence',{confirmed:true});
 assert.equal(p.state.counters['intimidating-presence'],1);
 assert.equal(p.state.counters.rage,1);
});

test('Intimidating Presence fails closed when Rage unavailable; short rest does not restore the feature',()=>{
 const p=setup(14);
 assert.throws(()=>setup(13).act('intimidating-presence',{confirmed:true}),/level 14/);
 p.act('intimidating-presence',{confirmed:true});
 p.act('counter',{id:'rage',delta:1});
 p.act('counter',{id:'rage',delta:1});
 p.act('counter',{id:'rage',delta:1});
 p.act('counter',{id:'rage',delta:1});
 p.act('counter',{id:'rage',delta:1});
 assert.throws(()=>p.act('intimidating-presence-recharge'),/No Rage use/);
 assert.throws(()=>p.act('counter',{id:'intimidating-presence',delta:-1}),/dedicated class action/);
 p.act('short-rest');
 assert.equal(p.state.counters['intimidating-presence'],1);
 assert.equal(p.state.counters.rage,4);
 p.act('long-rest');
 assert.equal(p.state.counters['intimidating-presence'],0);
 assert.equal(p.state.counters.rage,0);
});

test('Persistent Rage explicitly refreshes expended Rage on Initiative only once per Long Rest',()=>{
 const p=setup(15);p.act('counter',{id:'rage',delta:1});p.act('counter',{id:'rage',delta:1});
 assert.throws(()=>setup(14).act('combat-start',{initiative:9,persistentRage:true}),/level 15/);
 p.act('combat-start',{initiative:9,persistentRage:true});
 assert.equal(p.state.counters.rage,0);
 assert.equal(p.state.counters['persistent-rage'],1);
 assert.throws(()=>p.act('combat-start',{initiative:10}),/End the current/);
 p.act('combat-end');p.act('counter',{id:'rage',delta:1});
 assert.throws(()=>p.act('combat-start',{initiative:11,persistentRage:true}),/already used/);
 assert.equal(p.state.counters.rage,1);
 p.act('short-rest');assert.equal(p.state.counters['persistent-rage'],1);
 p.act('long-rest');p.act('counter',{id:'rage',delta:1});
 p.act('combat-start',{initiative:10,persistentRage:true});
 assert.equal(p.state.counters['persistent-rage'],1);
});

test('Persistent Rage rejects invalid choices and cannot waste a refresh when fully stocked',()=>{
 const p=setup(15);
 assert.throws(()=>p.act('combat-start',{initiative:10,persistentRage:true}),/No expended/);
 assert.throws(()=>p.act('combat-start',{initiative:10,persistentRage:'yes'}),/boolean/);
 assert.equal(p.state.combat.active,false);
 p.act('combat-start',{initiative:10});
 assert.equal(p.state.counters['persistent-rage'],0);
});

test('Indomitable Might check/save floor applies at 18, never to attack rolls',()=>{
 assert.throws(()=>indomitableMightTotal(17,20,4),/level 18/);
 assert.equal(indomitableMightTotal(18,20,8),20);
 assert.equal(indomitableMightTotal(18,20,23),23);
 assert.equal(indomitableMightTotal(20,25,0),25);
 assert.throws(()=>indomitableMightTotal(18,20,NaN),/valid/);
 assert.match(deriveCharacter(draft(18)).features.join(' '),/Strength checks and saving throws/);
});

test('Legacy Barbarian Play state and new resources preserve Undo, reconciliation, and private backup integrity',async()=>{
 const p=setup(15);
 const old={...p.state,counters:{...p.state.counters}};
 delete old.counters['intimidating-presence'];delete old.counters['persistent-rage'];
 assert.deepEqual(validatePlay(p.profile,old),p.state);
 assert.throws(()=>validatePlay(p.profile,{...old,counters:{...old.counters,'persistent-rage':2}}),/invalid health or resources/);
 p.act('intimidating-presence',{confirmed:true});
 p.act('intimidating-presence-recharge');
 assert.equal(reconcilePlay(p.profile,p.profile,p.state).counters.rage,1);
 const backup=await makePlayExport(p.d,p.state);
 const restored=await readSavedCharacterExport(JSON.stringify(backup));
 assert.deepEqual(restored.play.counters,p.state.counters);
 assert.match(readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),/lib\/barbarian-progression\.js/);
 const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 assert.match(ui,/data-play-action="intimidating-presence"/);
 assert.match(ui,/name="persistent-rage"/);
 const locale=readFileSync(new URL('../dist/locale-copy.js',import.meta.url),'utf8');
 assert.match(locale,/Pulihkan seluruh penggunaan Rage/);
});
