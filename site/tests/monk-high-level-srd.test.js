import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {monkProgression,perfectFocusSpent} from '../dist/lib/monk-progression.js';
import {build,deriveCharacter,generateCharacter,levelsFor,templateCharacter,validateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay,validatePlay,reconcilePlay} from '../dist/lib/play.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';
const starter=templateCharacter('Monk');
const draft=(level,additional={})=>build({...starter,level,...additional}).draft;
const setup=level=>{
 const d=draft(level),profile=playProfile(d);let state=normalizePlay(profile);
 const act=(type,props={})=>state=advancePlay(profile,state,{type,...props});
 return {d,profile,act,get state(){return state;}};
};
const spend=(p,n)=>{for(let i=0;i<n;i++)p.act('counter',{id:'focus-points',delta:1});};

test('Monk Open Hand level 1–20 progression uses SRD focus, die and movement boundaries',()=>{
 assert.deepEqual(levelsFor('Monk'),Array.from({length:20},(_,i)=>i+1));
 for(const [level,focus,die,move] of [[1,0,6,0],[2,2,6,10],[5,5,8,10],[6,6,8,15],
   [10,10,8,20],[11,11,10,20],[13,13,10,20],[14,14,10,25],[17,17,12,25],[18,18,12,30],[20,20,12,30]]){
  const rules=monkProgression(level);
  assert.deepEqual([rules.focus,rules.martialDie,rules.movement],[focus,die,move],String(level));
  if(level>=2){
    const d=draft(level),profile=playProfile(d);
    assert.equal(profile.resources.find(row=>row.id==='focus-points').max,focus);
    assert.equal(profile.martialDie,die);
  }
 }
 for(const invalid of [0,21,-2,1.2,NaN,null,'14'])assert.throws(()=>monkProgression(invalid),/Monk level/);
});

test('Monk levels 13–20 derive fully valid characters, XP and unarmored movement',()=>{
 for(let level=13;level<=20;level++){
  const d=draft(level),s=deriveCharacter(d),r=monkProgression(level);
  assert.deepEqual(validateCharacter(d),[],String(level));
  assert.equal(s.proficiency,level>=17?6:5);
  assert.equal(s.dice,level+'d8');
  assert.equal(s.subclass,'Warrior of the Open Hand');
  assert.equal(s.nextXP,level===20?null:[140000,165000,195000,225000,265000,305000,355000][level-13]);
  assert.equal(s.speed,30+r.movement,'unarmored Movement at level '+level);
  assert.equal(s.attacks.find(attack=>attack.name==='Unarmed Strike').dice,'1d'+r.martialDie);
 }
});

test('Monk advancement 16 ASI and 19 Epic Boon are explicit valid choices',()=>{
 const sixteen=draft(16,{advancementSixteenFeat:'Ability Score Improvement',advancementSixteenBoost:'1,1'});
 assert.deepEqual(validateCharacter(sixteen),[]);
 assert.ok(Object.hasOwn(sixteen,'advancementSixteenBoost'));
 const nineteen=draft(19,{epicBoonFeat:'Boon of Fate',epicBoonAbility:1});
 assert.deepEqual(validateCharacter(nineteen),[]);
 assert.equal(playProfile(nineteen).resources.find(row=>row.id==='improve-fate').max,1);
 assert.notDeepEqual(validateCharacter({...sixteen,advancementSixteenBoost:'999,999'}),[]);
 assert.notDeepEqual(validateCharacter({...nineteen,epicBoonFeat:'Made-up Epic Boon'}),[]);
});

test('Body and Mind +4 DEX WIS cap 25, adjusts AC and saving throws but not retroactive HP',()=>{
 const nineteen=deriveCharacter(draft(19)),twenty=deriveCharacter(draft(20));
 assert.equal(twenty.scores[1],Math.min(25,nineteen.scores[1]+4));
 assert.equal(twenty.scores[4],Math.min(25,nineteen.scores[4]+4));
 assert.equal(twenty.ac-nineteen.ac,twenty.mods[1]-nineteen.mods[1]+twenty.mods[4]-nineteen.mods[4]);
 assert.equal(twenty.hp-nineteen.hp,5+nineteen.mods[2]);
 assert.ok(twenty.features.some(feature=>feature.includes('Body and Mind')));
 assert.deepEqual(validateCharacter(draft(20)),[]);
});

test('Disciplined Survivor unlocks every saving throw proficiency only at Monk 14',()=>{
 for(const level of [13,14,15,20]){
  const s=deriveCharacter(draft(level)),d=draft(level);
  const prof=s.proficiency;
  for(let i=0;i<6;i++){
   const trained=level>=14||[0,1].includes(i);
   assert.equal(s.saves[i]-s.mods[i],trained?prof:0,'level '+level+', ability '+i);
  }
  assert.equal(s.features.some(feature=>feature.startsWith('Disciplined Survivor')),level>=14);
 }
});

test('features appear only at their correct 13/14/15/17/18/20 thresholds',()=>{
 for(const [level,feature] of [[13,'Deflect Energy'],[14,'Disciplined Survivor'],[15,'Perfect Focus'],[17,'Quivering Palm'],
   [18,'Superior Defense'],[20,'Body and Mind']]){
   assert.ok(deriveCharacter(draft(level)).features.some(f=>f.startsWith(feature)),feature+' should appear');
   assert.ok(!deriveCharacter(draft(level-1)).features.some(f=>f.startsWith(feature)),feature+' must not appear early');
 }
 assert.equal(deriveCharacter(draft(17)).attacks.find(a=>a.name==='Unarmed Strike').dice,'1d12');
});

test('800 seeded high-level Monks 13–20 remain valid; other unfinished class caps remain at 12',()=>{
 let seed=95741;const rng=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/2**32);
 for(let level=13;level<=20;level++)for(let n=0;n<100;n++){
  const d=generateCharacter({className:'Monk',level},rng);
  assert.equal(d.className,'Monk');assert.equal(d.level,level);
  assert.deepEqual(validateCharacter(d),[],`level ${level} seed ${seed}`);
 }
 for(const name of ['Bard','Cleric','Druid','Sorcerer','Warlock','Wizard']){
  assert.equal(levelsFor(name).at(-1),12,name);
 }
});

test('Perfect Focus pure helper restores exactly to four remaining, never raises higher totals',()=>{
 for(const [level,spent,want] of [[15,15,11],[15,12,11],[15,11,11],[15,10,10],
   [20,20,16],[20,17,16],[20,16,16],[20,15,15]])assert.equal(perfectFocusSpent(level,spent),want);
 assert.throws(()=>perfectFocusSpent(14,12),/level 15/);
 for(const invalid of [-1,2.4,99,'15'])assert.throws(()=>perfectFocusSpent(15,invalid),/Invalid Focus/);
});

test('Perfect Focus applies on Initiative, not on new personal turns, and never with metabolism',()=>{
 const p=setup(15);spend(p,14);
 p.act('combat-start',{initiative:13});assert.equal(p.state.counters['focus-points'],11);
 p.act('combat-turn',{stage:'start'});assert.equal(p.state.counters['focus-points'],11);
 p.act('combat-end');spend(p,2);p.act('combat-start',{initiative:10,metabolismRoll:6});
 assert.equal(p.state.counters['focus-points'],0,'metabolism restores all');
 assert.equal(p.state.counters.metabolism,1);
});

test('Perfect Focus does not activate before 15 and never restores if four or more remain',()=>{
 const p=setup(14);spend(p,13);p.act('combat-start',{initiative:8});
 assert.equal(p.state.counters['focus-points'],13);
 const q=setup(15);spend(q,9);q.act('combat-start',{initiative:8});
 assert.equal(q.state.counters['focus-points'],9);
});

test('Disciplined Survivor reroll spends one Focus with confirmed failed save and new d20',()=>{
 const p=setup(14);
 assert.throws(()=>setup(13).act('monk-save-reroll',{failed:true,newRoll:18}),/level 14/);
 assert.throws(()=>p.act('monk-save-reroll',{failed:false,newRoll:18}),/Confirm/);
 assert.throws(()=>p.act('monk-save-reroll',{failed:true,newRoll:21}),/new d20/);
 assert.equal(p.state.counters['focus-points'],0);
 p.act('monk-save-reroll',{failed:true,newRoll:2});
 assert.equal(p.state.counters['focus-points'],1);
 assert.match(p.state.log.at(-1),/must be used/);
 spend(p,13);
 assert.throws(()=>p.act('monk-save-reroll',{failed:true,newRoll:20}),/No Focus/);
});

test('Quivering Palm requires level 17, confirmed Unarmed hit, a target and 4 Focus',()=>{
 const p=setup(17);
 assert.throws(()=>setup(16).act('monk-quivering-start',{confirmedHit:true,target:'Ogre'}),/level 17/);
 assert.throws(()=>p.act('monk-quivering-start',{confirmedHit:false,target:'Ogre'}),/Confirm/);
 for(const invalid of ['','  Ogre','<script>', 'x'.repeat(61)])
  assert.throws(()=>p.act('monk-quivering-start',{confirmedHit:true,target:invalid}),/target label/);
 p.act('monk-quivering-start',{confirmedHit:true,target:'Ogre'});
 assert.deepEqual(p.state.quivering,{active:true,target:'Ogre'});
 assert.equal(p.state.counters['focus-points'],4);
 assert.throws(()=>p.act('monk-quivering-start',{confirmedHit:true,target:'Goblin'}),/current Quivering Palm/);
});

test('Quivering Palm resolves action and damage at table; half on successful save',()=>{
 const p=setup(17);p.act('combat-start',{initiative:10});p.act('combat-turn',{stage:'start'});
 p.act('monk-quivering-start',{confirmedHit:true,target:'Giant'});
 const rolls=[3,4,5,6,7,8,9,10,11,12];
 assert.throws(()=>p.act('monk-quivering-resolve',{samePlane:false,mode:'action',rolls}),/same plane/);
 assert.throws(()=>p.act('monk-quivering-resolve',{samePlane:true,mode:'action',rolls:[1,2]}),/ten d12/);
 assert.equal(p.state.combat.actionUsed,false);
 p.act('monk-quivering-resolve',{samePlane:true,mode:'action',rolls});
 assert.equal(p.state.combat.actionUsed,true);assert.deepEqual(p.state.quivering,{active:false,target:''});
 assert.match(p.state.log.at(-1),/10d12 Force 75 on failed save or 37 on success/);
 assert.throws(()=>p.act('monk-quivering-dismiss'),/No Quivering/);
});

test('Quivering Palm attack-forgone option preserves manual Action markers and cannot spend twice',()=>{
 const p=setup(18);p.act('combat-start',{initiative:7});p.act('combat-turn',{stage:'start'});
 p.act('monk-quivering-start',{confirmedHit:true,target:'Bandit'});
 p.act('monk-quivering-resolve',{samePlane:true,mode:'attack',rolls:Array(10).fill(12)});
 assert.equal(p.state.combat.actionUsed,false);
 p.act('monk-quivering-start',{confirmedHit:true,target:'Bandit'});
 p.act('combat-use',{key:'actionUsed',used:true});
 assert.throws(()=>p.act('monk-quivering-resolve',{samePlane:true,mode:'action',rolls:Array(10).fill(12)}),/already marked used/);
 assert.equal(p.state.quivering.active,true);
 p.act('monk-quivering-dismiss');assert.equal(p.state.quivering.active,false);
});

test('Quivering Palm does not silently spend Focus if insufficient or if action fails',()=>{
 const p=setup(17);spend(p,14);
 assert.throws(()=>p.act('monk-quivering-start',{confirmedHit:true,target:'Giant'}),/requires 4 Focus/);
 assert.equal(p.state.counters['focus-points'],14);
});

test('Monk high-level legacy Play, Undo, reconciliation and private exports work',async()=>{
 const p=setup(17);const old={...p.state};delete old.quivering;
 assert.deepEqual(validatePlay(p.profile,old),p.state);
 assert.throws(()=>validatePlay(p.profile,{...p.state,quivering:{active:true,target:'<script>'}}),/invalid health/);
 p.act('monk-quivering-start',{confirmedHit:true,target:'Ogre'});
 assert.equal(p.state.quivering.active,true);
 assert.equal(reconcilePlay(p.profile,p.profile,p.state).quivering.active,true);
 const file=await makePlayExport(p.d,p.state);
 const parsed=await readSavedCharacterExport(JSON.stringify(file));
 assert.deepEqual(parsed.play.quivering,p.state.quivering);
 const before=p.state;
 const after=advancePlay(p.profile,before,{type:'monk-quivering-dismiss'});
 assert.equal(after.quivering.active,false);assert.equal(before.quivering.active,true);
 assert.equal(advancePlay(p.profile,after,{type:'long-rest'}).quivering.active,false);
});

test('High-level Monk UI strings and source module are cached for offline use',()=>{
 const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 const locale=readFileSync(new URL('../dist/locale-copy.js',import.meta.url),'utf8');
 assert.match(ui,/monk-save-reroll/);assert.match(ui,/monk-quivering-start/);
 assert.match(ui,/monk-quivering-resolve/);assert.match(ui,/monk-quivering-dismiss/);
 assert.match(sw,/monk-progression\.js/);
 assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
 assert.match(locale,/Ulangi saving throw/);
});
