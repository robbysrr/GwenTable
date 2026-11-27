import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter,generateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay,validatePlay} from '../dist/lib/play.js';
import {resolveAttack,planAttack,attackSummary} from '../dist/lib/combat-assist.js';
import {sneakAttackDice,planRogueStrike} from '../dist/lib/rogue-strike.js';
import {weaponMasteryResult} from '../dist/lib/weapon-mastery.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {messages} from '../dist/locale-copy.js';

const setup=(className='Rogue',level=3)=>{
 const draft={...templateCharacter(className),level};
 const profile=playProfile(draft);
 let state=normalizePlay(profile);
 const act=(type,extra={})=>state=advancePlay(profile,state,{type,...extra});
 return {draft,profile,act,get state(){return state;}};
};
const attackIndex=(p,name)=>p.profile.s.attacks.findIndex(attack=>attack.name===name);
const attack=(p,name,fields={})=>{
 const index=attackIndex(p,name);
 assert.ok(index>=0,name);
 const base={index,advantage:true,disadvantage:false,targetAC:10,confirmedHit:false,
   rolls:[16,7],sneak:true,allyNear:false,cunning:'none'};
 const entry={...base,...fields};
 const plan=planAttack(p.profile,p.state,entry);
 const damageRolls=plan.hit?Array(plan.damageDice.count).fill(3):[];
 const sneakRolls=Array(plan.rogue.count).fill(4);
 return {...entry,damageRolls,sneakRolls};
};

test('SRD Rogue Sneak Attack progression increments every odd class level',()=>{
 for(const [level,expected] of [[1,1],[2,1],[3,2],[4,2],[5,3],[10,5],[11,6],[12,6],[13,7],[19,10],[20,10]])
  assert.equal(sneakAttackDice(level),expected);
 for(const bad of [0,21,1.5,'5',null])assert.throws(()=>sneakAttackDice(bad),/Rogue level/);
});

test('advantaged Finesse and Ranged weapons add Sneak Attack dice and damage',()=>{
 const p=setup();
 for(const name of ['Dagger','Shortbow']){
  const entry=attack(p,name);
  const result=resolveAttack(p.profile,p.state,entry);
  assert.equal(result.rogue.used,true);
  assert.equal(result.rogue.count,4===p.draft.level?2:2);
  assert.equal(result.sneakDamage,8);
  assert.equal(result.damage,result.weaponDamage+result.sneakDamage);
  assert.match(attackSummary(result),/included in total, do not add twice/);
  assert.match(attackSummary(result),/Sneak Attack: 8 extra damage/);
 }
});

test('natural 20 doubles Sneak Attack damage dice after Cunning Strike costs',()=>{
 const p=setup('Rogue',5);
 const entry=attack(p,'Dagger',{rolls:[20,3],cunning:'trip',targetLargeOrSmaller:true});
 assert.equal(planAttack(p.profile,p.state,entry).rogue.count,4);
 const hit=resolveAttack(p.profile,p.state,entry);
 assert.equal(hit.sneakDamage,16);
 assert.equal(hit.rogue.dc,8+p.profile.s.mods[1]+p.profile.s.proficiency);
 assert.match(attackSummary(hit),/Cunning Strike trip/);
 assert.match(attackSummary(hit),/DC 15/);
});

test('Rogue ally adjacency works only without effective Disadvantage',()=>{
 const p=setup(),i=attackIndex(p,'Shortbow');
 const base={index:i,rolls:[14],advantage:false,disadvantage:false,
  allyNear:true,sneak:true,targetAC:1,confirmedHit:false,cunning:'none'};
 assert.equal(planAttack(p.profile,p.state,base).rogue.used,true);
 assert.throws(()=>planAttack(p.profile,p.state,{...base,rolls:[14,3],disadvantage:true}),/Sneak Attack requires/);
 assert.equal(planAttack(p.profile,p.state,{...base,advantage:true,disadvantage:true}).rogue.used,true);
 assert.throws(()=>planAttack(p.profile,p.state,{...base,allyNear:false}),/Sneak Attack requires/);
});

test('Rogue Sneak Attack rejects Unarmed Strikes, non-Rogues and invalid booleans',()=>{
 const rogue=setup(),fighter=setup('Fighter');
 assert.throws(()=>planAttack(rogue.profile,rogue.state,{...attack(rogue,'Dagger'),index:attackIndex(rogue,'Unarmed Strike')}),/Finesse or Ranged/);
 const i=attackIndex(fighter,'Shortbow');
 assert.throws(()=>planAttack(fighter.profile,fighter.state,{index:i,rolls:[18,9],advantage:true,
  disadvantage:false,targetAC:10,confirmedHit:false,sneak:true}),/requires a Rogue/);
 for(const bad of [{sneak:'yes'},{allyNear:'yes'},{cunning:'something'}])
  assert.throws(()=>planAttack(rogue.profile,rogue.state,{...attack(rogue,'Dagger'),...bad}),/valid Sneak|supported Cunning/);
});

test('a miss never spends Sneak Attack, and an unknown AC never invents damage',()=>{
 const p=setup();
 const miss=attack(p,'Dagger',{rolls:[1,4],targetAC:99});
 const result=resolveAttack(p.profile,p.state,miss);
 assert.equal(result.hit,false);assert.equal(result.rogue.used,false);
 assert.equal(result.sneakDamage,0);assert.equal(result.damage,null);
 p.act('combat-start',{initiative:14});p.act('combat-turn',{stage:'start'});
 p.act('attack-assist',miss);
 assert.equal(p.state.combat.sneakUsed,false);
 const unknown=attack(p,'Dagger',{targetAC:null,confirmedHit:false});
 assert.equal(resolveAttack(p.profile,p.state,unknown).rogue.used,false);
});

test('only confirmed attack hits consume Sneak Attack once in a personal turn',()=>{
 const p=setup();p.act('combat-start',{initiative:15});p.act('combat-turn',{stage:'start'});
 const first=attack(p,'Dagger');p.act('attack-assist',first);
 assert.equal(p.state.combat.sneakUsed,true);
 assert.throws(()=>p.act('attack-assist',attack(p,'Dagger')),/already used/);
 p.act('combat-turn',{stage:'end'});
 assert.equal(p.state.combat.sneakUsed,true);
 p.act('combat-window',{confirmed:true});
 assert.equal(p.state.combat.sneakUsed,false);
 p.act('attack-assist',attack(p,'Dagger'));
 assert.equal(p.state.combat.sneakUsed,true);
 p.act('combat-turn',{stage:'start'});
 assert.equal(p.state.combat.sneakUsed,false);
});

test('other-creature turn reset requires a Rogue, active encounter, and explicit confirmation',()=>{
 const p=setup();assert.throws(()=>p.act('combat-window',{confirmed:true}),/outside your own active turn/);
 p.act('combat-start',{initiative:0});
 assert.throws(()=>p.act('combat-window',{confirmed:false}),/DM announced/);
 p.act('combat-turn',{stage:'start'});
 assert.throws(()=>p.act('combat-window',{confirmed:true}),/outside your own active turn/);
 const f=setup('Fighter');f.act('combat-start',{initiative:1});
 assert.throws(()=>f.act('combat-window',{confirmed:true}),/requires a Rogue/);
});

test('Cunning Strike validates level 5, Poisoner Kit and target size and never pays cost twice',()=>{
 const p=setup('Rogue',5),base=attack(p,'Dagger');
 const i=base.index;
 assert.throws(()=>planAttack(p.profile,p.state,{...base,cunning:'poison'}),/Poisoner/);
 assert.throws(()=>planAttack(p.profile,p.state,{...base,cunning:'trip'}),/Large or smaller/);
 assert.equal(planAttack(p.profile,p.state,{...base,cunning:'poison',poisonKit:true}).rogue.count,2);
 assert.equal(planAttack(p.profile,p.state,{...base,cunning:'trip',targetLargeOrSmaller:true}).rogue.count,2);
 const withdraw=planAttack(p.profile,p.state,{...base,cunning:'withdraw'});
 assert.equal(withdraw.rogue.count,2);
 const junior=setup('Rogue',3);
 assert.throws(()=>planAttack(junior.profile,junior.state,{...attack(junior,'Dagger'),cunning:'withdraw'}),/level 5/);
 assert.throws(()=>planAttack(p.profile,p.state,{...base,sneak:false,cunning:'withdraw'}),/requires Sneak/);
 assert.ok(i>=0);
});

test('Sneak bonus roll payloads cannot be missing, forged, or outside d6 bounds',()=>{
 const p=setup(),good=attack(p,'Dagger');
 assert.throws(()=>resolveAttack(p.profile,p.state,{...good,sneakRolls:[]}),/Sneak Attack dice/);
 assert.throws(()=>resolveAttack(p.profile,p.state,{...good,sneakRolls:[7,1]}),/Sneak Attack dice/);
 assert.throws(()=>resolveAttack(p.profile,p.state,{...good,sneakRolls:['4',1]}),/Sneak Attack dice/);
 assert.throws(()=>resolveAttack(p.profile,p.state,{...good,sneakRolls:[1,2,3]}),/Sneak Attack dice/);
});

test('untrained weapon mastery never applies; selected Graze applies modifier on miss only',()=>{
 const p=setup('Fighter'),graze=attackIndex(p,'Greatsword');
 const miss=resolveAttack(p.profile,p.state,{index:graze,targetAC:99,confirmedHit:false,
  advantage:false,disadvantage:false,rolls:[2],damageRolls:[]});
 assert.equal(miss.mastery.name,'Graze');
 assert.equal(miss.mastery.damage,Math.max(0,p.profile.s.attacks[graze].mod));
 assert.equal(miss.damage,null);
 assert.match(attackSummary(miss),/Mastery Graze/);
 const hit=resolveAttack(p.profile,p.state,{index:graze,targetAC:10,confirmedHit:false,
  advantage:false,disadvantage:false,rolls:[17],damageRolls:[2,2]});
 assert.equal(hit.mastery,null);
 const untrained=attackIndex(p,'Shortbow');
 const noMastery=resolveAttack(p.profile,p.state,{index:untrained,targetAC:1,
  confirmedHit:false,rolls:[18],damageRolls:[3]});
 assert.equal(noMastery.mastery,null);
});

test('weapon mastery applies only to confirmed hit and does not modify opponent records',()=>{
 const p=setup('Fighter');
 const i=attackIndex(p,'Flail');
 const hit=resolveAttack(p.profile,p.state,{index:i,targetAC:1,confirmedHit:false,rolls:[12],damageRolls:[4]});
 assert.equal(hit.mastery.name,'Sap');
 assert.match(hit.mastery.note,/Disadvantage/);
 assert.ok(!Object.hasOwn(hit,'targetHP'));
 const miss=resolveAttack(p.profile,p.state,{index:i,targetAC:99,confirmedHit:false,rolls:[1],damageRolls:[]});
 assert.equal(miss.mastery,null);
 assert.equal(weaponMasteryResult(p.profile,{hit:null},p.profile.s.attacks[i]),null);
});

test('Topple saves use 8 plus attacking ability mod plus proficiency',()=>{
 const p=setup('Fighter');
 const fake={mastery:'Topple',mod:4};
 const info=weaponMasteryResult(p.profile,{hit:true},fake);
 assert.equal(info.dc,8+4+p.profile.s.proficiency);
 assert.match(info.note,/Constitution save/);
});

test('Nick provides reminder without fabricating extra attack or Bonus Action',()=>{
 const p=setup('Rogue');p.act('combat-start',{initiative:14});p.act('combat-turn',{stage:'start'});
 const entry=attack(p,'Dagger',{sneak:false});
 const before=structuredClone(p.state.combat);
 p.act('attack-assist',entry);
 assert.match(p.state.log.at(-1),/Mastery Nick/);
 assert.deepEqual(p.state.combat,before);
});

test('Uncanny Dodge requires level 5, visible attacker, confirmed attack-roll hit and Reaction',()=>{
 const junior=setup();assert.throws(()=>junior.act('rogue-uncanny-dodge',{visible:true,hit:true,damage:15}),/level 5/);
 const p=setup('Rogue',5);
 assert.throws(()=>p.act('rogue-uncanny-dodge',{visible:false,hit:true,damage:15}),/attacker you can see/);
 assert.throws(()=>p.act('rogue-uncanny-dodge',{visible:true,hit:false,damage:15}),/attack roll/);
 for(const invalid of [0,10000,'5'])assert.throws(()=>p.act('rogue-uncanny-dodge',{visible:true,hit:true,damage:invalid}),/incoming damage/);
 p.act('combat-start',{initiative:10});
 p.act('rogue-uncanny-dodge',{visible:true,hit:true,damage:15});
 assert.equal(p.state.combat.reactionUsed,true);
 assert.throws(()=>p.act('rogue-uncanny-dodge',{visible:true,hit:true,damage:4}),/Reaction already/);
});

test('Uncanny Dodge halves incoming damage rounding down, honoring temporary HP',()=>{
 const p=setup('Rogue',5),max=p.state.hp;
 p.act('temp',{value:3});
 p.act('rogue-uncanny-dodge',{visible:true,hit:true,damage:9});
 assert.equal(p.state.hp,max-1);assert.equal(p.state.temp,0);
 assert.match(p.state.log.at(-1),/halved to 4/);
});

test('Uncanny Dodge against one damage applies zero and does not create concentration check',()=>{
 const p=setup('Rogue',5);
 p.act('concentration',{value:'Test Focus'});
 const hp=p.state.hp;
 p.act('rogue-uncanny-dodge',{visible:true,hit:true,damage:1});
 assert.equal(p.state.hp,hp);
 assert.deepEqual(p.state.concentrationChecks,[]);
});

test('Uncanny Dodge maintains concentration DC against halved damage',()=>{
 const p=setup('Rogue',5);p.act('concentration',{value:'Test Focus'});
 p.act('rogue-uncanny-dodge',{visible:true,hit:true,damage:42});
 assert.deepEqual(p.state.concentrationChecks,[{damage:21,dc:10}]);
 assert.equal(p.state.focus,'Test Focus');
});

test('old combat saves without Sneak Attack marker remain valid, malformed supplied markers rejected',()=>{
 const p=setup();p.act('combat-start',{initiative:12});p.act('combat-turn',{stage:'start'});
 const {sneakUsed,...oldCombat}=p.state.combat;
 const migrated=validatePlay(p.profile,{...p.state,combat:oldCombat});
 assert.equal(migrated.combat.sneakUsed,false);
 assert.throws(()=>validatePlay(p.profile,{...p.state,combat:{...p.state.combat,sneakUsed:'true'}}),/invalid health/);
 assert.deepEqual(validatePlay(p.profile,p.state),p.state);
});

test('Sneak Attack and Uncanny Dodge persist through private JSON backup and one-step Undo',async()=>{
 const draft=generateCharacter({className:'Rogue',level:5},()=>.37);
 const profile=playProfile(draft);
 let state=normalizePlay(profile);
 const p={draft,profile,act:(type,extra={})=>{state=advancePlay(profile,state,{type,...extra});},get state(){return state;}};
 p.act('combat-start',{initiative:14});p.act('combat-turn',{stage:'start'});
 p.act('attack-assist',attack(p,'Dagger'));
 assert.equal(p.state.combat.sneakUsed,true);
 const exported=await makePlayExport(p.draft,p.state);
 const imported=await readSavedCharacterExport(JSON.stringify(exported));
 assert.deepEqual(imported.play,p.state);
 const prev=structuredClone(p.state);
 p.act('rogue-uncanny-dodge',{visible:true,hit:true,damage:10});
 assert.notDeepEqual(p.state,prev);
 const undone=normalizePlay(p.profile,prev);
 assert.deepEqual(validatePlay(p.profile,undone),prev);
});

test('new gameplay UI includes localized controls and registers module dependencies offline',()=>{
 const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 for(const marker of ['rogue-uncanny-dodge','combat-window','sneakRolls','Cunning Strike','Poisoner’s Kit'])
  assert.ok(ui.includes(marker),marker);
 for(const key of ['Apply Sneak Attack (once per turn)','Use Uncanny Dodge','DM confirms next creature turn (reset Sneak Attack)'])
  assert.ok(messages[key]?.id,key);
 for(const module of ['./lib/rogue-strike.js','./lib/weapon-mastery.js'])assert.ok(sw.includes(module));
 assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
});
