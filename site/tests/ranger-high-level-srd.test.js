import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rangerProgression,isHuntersMark} from '../dist/lib/ranger-progression.js';
import {levelsFor,build,templateCharacter,generateCharacter,deriveCharacter,validateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay,validatePlay,reconcilePlay} from '../dist/lib/play.js';
import {planAttack,resolveAttack,attackSummary} from '../dist/lib/combat-assist.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {messages} from '../dist/locale-copy.js';

const base=templateCharacter('Ranger');
const ranger=(level,other={})=>build({...base,level,...other}).draft;
function setup(level=20){
 const d=ranger(level),profile=playProfile(d);let state=normalizePlay(profile);
 const act=(type,fields={})=>state=advancePlay(profile,state,{type,...fields});
 const fail=(type,fields,re)=>{const before=structuredClone(state);assert.throws(()=>act(type,fields),re);assert.deepEqual(state,before);};
 return {d,profile,act,fail,get state(){return state;}};
}
function hit(p,options={}){
 const index=p.profile.s.attacks.findIndex(row=>row.name==='Longbow');
 assert.ok(index>=0);
 const proposed={index,targetAC:10,advantage:false,disadvantage:false,confirmedHit:false,markedTarget:true,
  rolls:p.d.level>=17?[17,5]:[17],...options};
 const plan=planAttack(p.profile,p.state,proposed);
 return {...proposed,damageRolls:plan.hit?Array(plan.damageDice.count).fill(3):[],
  markRolls:Array(plan.markDice.count).fill(4),sneakRolls:[]};
}

test('Ranger (Hunter) extends to level 20; six other unfinished class paths remain capped',()=>{
 assert.deepEqual(levelsFor('Ranger'),Array.from({length:20},(_,i)=>i+1));
 for(const cls of ['Bard','Cleric','Druid','Sorcerer','Warlock','Wizard'])assert.equal(levelsFor(cls).at(-1),12);
 for(const level of [0,-1,21,'20',1.5,null,NaN]) assert.throws(()=>rangerProgression(level),/Ranger level/);
});
test('SRD Ranger 1–20 spell preparation, slots and favored-enemy uses are exact',()=>{
 const prep=[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];
 const counts=[[2],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],
  [4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],
  [4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
 for(let level=1;level<=20;level++){
  const p=rangerProgression(level),s=deriveCharacter(ranger(level)),play=playProfile(ranger(level));
  assert.equal(p.prepared,prep[level-1]);
  assert.deepEqual(p.slots.map(x=>x.count),counts[level-1]);
  assert.deepEqual(s.slots,p.slots);
  assert.equal(s.known.filter(spell=>spell.origin==='Ranger').length,p.prepared);
  assert.equal(play.freeSpells.find(spell=>spell.name.startsWith('Hunter’s Mark')).max,p.favoredEnemy);
 }
});
test('Ranger 13 and 17 spell boundaries do not unlock early',()=>{
 for(const [level,max] of [[12,3],[13,4],[16,4],[17,5],[20,5]]){
  const s=deriveCharacter(ranger(level));assert.equal(s.slots.at(-1).level,max);
 }
});
test('Ranger levels 16/19 preserve explicit feat and epic boon decisions',()=>{
 const six=ranger(16,{advancementSixteenFeat:'Ability Score Improvement',advancementSixteenBoost:'0,0'});
 assert.deepEqual(validateCharacter(six),[]);assert.ok(Object.hasOwn(six,'advancementSixteenBoost'));
 const nineteen=ranger(19,{epicBoonFeat:'Boon of Fate',epicBoonAbility:4});
 assert.deepEqual(validateCharacter(nineteen),[]);
 assert.ok(playProfile(nineteen).resources.some(row=>row.id==='improve-fate'));
 assert.notDeepEqual(validateCharacter({...nineteen,epicBoonFeat:'Unapproved Feat'}),[]);
});
test('Ranger 13–20 derived feature thresholds and XP are consistent',()=>{
 const thresholds=[[13,'Relentless Hunter'],[14,'Nature’s Veil'],[15,'Superior Hunter’s Defense'],
  [17,'Precise Hunter'],[18,'Feral Senses'],[20,'Foe Slayer']];
 for(const [level,feature] of thresholds){
  assert.ok(deriveCharacter(ranger(level)).features.some(x=>x.startsWith(feature)),feature);
  assert.ok(!deriveCharacter(ranger(level-1)).features.some(x=>x.startsWith(feature)),feature+' too early');
 }
 const xp=[120000,140000,165000,195000,225000,265000,305000,355000];
 for(let level=13;level<=20;level++){
  const d=ranger(level),s=deriveCharacter(d);
  assert.deepEqual(validateCharacter(d),[]);assert.equal(s.xp,xp[level-13]);
  assert.equal(s.nextXP,level===20?null:xp[level-12]);
  assert.equal(s.dice,`${level}d10`);
  assert.equal(s.proficiency,level>=17?6:5);
 }
});
test('800 deterministic generated Ranger characters across levels 13–20 validate',()=>{
 let seed=98475;const rng=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/2**32);
 for(let level=13;level<=20;level++)for(let n=0;n<100;n++){
  const d=generateCharacter({className:'Ranger',level},rng);
  assert.equal(d.className,'Ranger');assert.equal(d.level,level);
  assert.deepEqual(validateCharacter(d),[],`level ${level} seed ${seed}`);
 }
});
test('Hunter Mark normalization accepts two apostrophe styles and rejects unrelated effects',()=>{
 for(const str of ['Hunter’s Mark',"Hunter's Mark",' hunter’s mark ','HUNTER\'S MARK'])assert.ok(isHuntersMark(str));
 for(const val of [undefined,'hunter mark','Hunter\'s Mark Plus','Bless',null,123])assert.equal(isHuntersMark(val),false);
});
test('Ranger 13 Relentless Hunter ignores damage-based concentration checks only for Hunter Mark',()=>{
 const p=setup(13);
 p.act('concentration',{value:"Hunter's Mark"});p.act('damage',{value:18});
 assert.equal(p.state.focus,"Hunter's Mark");assert.deepEqual(p.state.concentrationChecks,[]);
 assert.match(p.state.log.at(-1),/Relentless Hunter/);
 p.act('concentration',{value:'Pass without Trace'});p.act('damage',{value:18});
 assert.equal(p.state.concentrationChecks.length,1);assert.equal(p.state.concentrationChecks[0].dc,10);
});
test('Damage and incapacitation still stop Ranger 13 Hunter Mark when appropriate',()=>{
 const p=setup(13);p.act('concentration',{value:'Hunter’s Mark'});
 p.act('condition',{name:'Stunned',active:true});assert.equal(p.state.focus,'');
 p.act('condition',{name:'Stunned',active:false});p.act('concentration',{value:'Hunter’s Mark'});
 p.act('damage',{value:9999});assert.equal(p.state.focus,'');assert.equal(p.state.hp,0);
});
test('Ranger 12 continues requiring Hunter Mark concentration saves',()=>{
 const p=setup(12);p.act('concentration',{value:'Hunter’s Mark'});p.act('damage',{value:12});
 assert.equal(p.state.concentrationChecks.length,1);
});
test('Nature’s Veil costs one use and a Bonus Action on an active turn',()=>{
 const p=setup(14),pool=p.profile.resources.find(x=>x.id==='natures-veil');
 assert.equal(pool.max,Math.max(1,p.profile.s.mods[4]));
 p.act('combat-start',{initiative:12});p.act('combat-turn',{stage:'start'});
 p.act('natures-veil',{confirmed:true});assert.equal(p.state.counters['natures-veil'],1);
 assert.equal(p.state.combat.bonusUsed,true);assert.match(p.state.log.at(-1),/end of personal turn 2/);assert.deepEqual(p.state.conditions,['Invisible']);
 p.fail('natures-veil',{confirmed:true},/Bonus Action/);
 p.act('combat-turn',{stage:'end'});p.act('combat-turn',{stage:'start'});p.act('combat-turn',{stage:'end'});p.act('combat-end');p.act('long-rest');assert.equal(p.state.counters['natures-veil'],0);
});
test('Nature’s Veil disallows premature use and invalid confirmation and cannot be forged via generic counter',()=>{
 const p=setup(14),lower=setup(13);
 lower.fail('natures-veil',{confirmed:true},/requires a level 14/);
 p.fail('natures-veil',{confirmed:'yes'},/Confirm/);
 p.fail('counter',{id:'natures-veil',delta:1},/dedicated class action/);
 const q=setup(14);
 q.act('combat-start',{initiative:7});q.fail('natures-veil',{confirmed:true},/requires your turn/);
});
test('Hunter 15 Reaction halves incoming damage, consumes Reaction and adjusts HP, temp, and checks',()=>{
 const p=setup(15);p.act('temp',{value:2});p.act('concentration',{value:'Pass without Trace'});
 p.act('combat-start',{initiative:12});p.act('combat-turn',{stage:'start'});
 const before=p.state.hp;
 p.act('hunter-defense',{confirmed:true,damage:19,damageType:'Fire'});
 assert.equal(p.state.hp,before-7);assert.equal(p.state.temp,0);
 assert.equal(p.state.combat.reactionUsed,true);
 assert.deepEqual(p.state.concentrationChecks,[{damage:9,dc:10}]);
 p.fail('hunter-defense',{confirmed:true,damage:5,damageType:'Cold'},/Reaction/);
 p.act('combat-turn',{stage:'end'});p.act('combat-turn',{stage:'start'});
 assert.equal(p.state.combat.reactionUsed,false);
});
test('Hunter Defense respects Relentless Hunter with Hunter Mark and permits one-point zero damage',()=>{
 const p=setup(15);p.act('concentration',{value:'Hunter’s Mark'});
 p.act('hunter-defense',{confirmed:true,damage:1,damageType:'Cold'});
 assert.equal(p.state.hp,p.profile.maxHP);
 p.act('hunter-defense',{confirmed:true,damage:15,damageType:'Fire'});
 assert.equal(p.state.focus,'Hunter’s Mark');assert.deepEqual(p.state.concentrationChecks,[]);
});
test('Hunter Defense rejects invalid requests and is unavailable before level 15',()=>{
 const p=setup(15),old=setup(14);
 old.fail('hunter-defense',{confirmed:true,damage:3,damageType:'Cold'},/level 15/);
 for(const action of [{confirmed:false,damage:9,damageType:'Fire'},{confirmed:true,damage:0,damageType:'Fire'},
  {confirmed:true,damage:1.5,damageType:'Fire'},{confirmed:true,damage:12,damageType:'Unknown'}]){
  p.fail('hunter-defense',action,/Confirm|damage|type/i);
 }
});
test('Hunter Mark attack needs active Concentration and explicit marked-target confirmation',()=>{
 const p=setup(17);
 assert.throws(()=>hit(p),/Hunter’s Mark must be the active/);
 p.act('concentration',{value:'Hunter’s Mark'});
 assert.equal(planAttack(p.profile,p.state,hit(p,{markedTarget:false,rolls:[9]})).markedTarget,false);
 const entry=hit(p),result=resolveAttack(p.profile,p.state,entry);
 assert.equal(result.markDamage,4);assert.equal(result.damage,result.weaponDamage+4);
 assert.match(attackSummary(result),/Hunter’s Mark bonus: 4/);
});
test('Precise Hunter grants Advantage only against active marked target from level 17',()=>{
 const early=setup(16);early.act('concentration',{value:'Hunter’s Mark'});
 assert.equal(planAttack(early.profile,early.state,hit(early)).mode,'normal');
 const p=setup(17);p.act('concentration',{value:'Hunter’s Mark'});
 assert.equal(planAttack(p.profile,p.state,hit(p)).mode,'advantage');
 const cancelled=hit(p,{disadvantage:true,rolls:[13]});
 assert.equal(planAttack(p.profile,p.state,cancelled).mode,'normal');
});
test('Foe Slayer raises marked damage to d10 at 20, doubles critical dice, not flat bonus',()=>{
 const nineteen=setup(19);nineteen.act('concentration',{value:'Hunter’s Mark'});
 assert.deepEqual(planAttack(nineteen.profile,nineteen.state,hit(nineteen)).markDice,{count:1,sides:6});
 const p=setup(20);p.act('concentration',{value:'Hunter’s Mark'});
 const entry=hit(p,{rolls:[20,2]});const plan=planAttack(p.profile,p.state,entry);
 assert.deepEqual(plan.markDice,{count:2,sides:10});
 const result=resolveAttack(p.profile,p.state,entry);
 assert.equal(result.markDamage,8);assert.equal(result.damage,result.weaponDamage+8);
 assert.match(attackSummary(result),/2d10/);
});
test('Marked-target attack rejects unearned bonus damage dice and malformed target flags',()=>{
 const p=setup(20);p.act('concentration',{value:'Hunter’s Mark'});
 const hitEntry=hit(p);
 assert.throws(()=>resolveAttack(p.profile,p.state,{...hitEntry,markRolls:[]}),/Hunter’s Mark dice/);
 assert.throws(()=>planAttack(p.profile,p.state,{...hitEntry,markedTarget:'true'}),/marked-target/);
 const miss=hit(p,{rolls:[1,1],targetAC:99});
 assert.deepEqual(planAttack(p.profile,p.state,miss).markDice,{count:0,sides:null});
 assert.equal(resolveAttack(p.profile,p.state,miss).damage,null);
});
test('Hunter Mark damage and Nature’s Veil survive Play history, Undo and private backup',async()=>{
 const p=setup(20);p.act('natures-veil',{confirmed:true});
 const previous=structuredClone(p.state);p.act('concentration',{value:'Hunter’s Mark'});
 const entry=hit(p);p.act('attack-assist',entry);
 assert.match(p.state.log.at(-1),/Hunter’s Mark/);
 assert.deepEqual(validatePlay(p.profile,p.state),p.state);
 assert.deepEqual(reconcilePlay(p.profile,p.profile,p.state),p.state);
 const file=await makePlayExport(p.d,p.state);
 const imported=await readSavedCharacterExport(JSON.stringify(file));
 assert.deepEqual(imported.play.counters['natures-veil'],p.state.counters['natures-veil']);
 assert.deepEqual(imported.play.log,p.state.log);
 assert.equal(previous.focus,'');
});
test('Legacy Ranger Play backup without Nature’s Veil usage remains importable; malformed supplied counter rejected',()=>{
 const p=setup(20),legacy=structuredClone(p.state);
 delete legacy.counters['natures-veil'];
 assert.deepEqual(validatePlay(p.profile,legacy),p.state);
 assert.throws(()=>validatePlay(p.profile,{...p.state,counters:{...p.state.counters,'natures-veil':999}}),/invalid health/);
});
test('Ranger bilingual UI, combat form and offline modules are present',()=>{
 const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 assert.match(ui,/rangerHigh\+/);assert.match(ui,/data-play-form="hunter-defense"/);
 assert.match(ui,/data-play-action="natures-veil"/);
 assert.match(ui,/markedTarget/);assert.match(ui,/markRolls/);
 assert.match(sw,/ranger-progression\.js/);assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
 for(const label of ['Hunter Ranger: high-level features','Use Nature’s Veil','Use Superior Hunter’s Defense',
  'This target is affected by my active Hunter’s Mark (bonus damage; level 17 Advantage)'])
   assert.ok(messages[label]?.id,label);
});
