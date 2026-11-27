import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay,validatePlay} from '../dist/lib/play.js';
import {attackDice,attackRollMode,resolveAttack} from '../dist/lib/combat-assist.js';
import {beastFormLimit,beastQuickReference} from '../dist/lib/beast-reference.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {messages} from '../dist/locale-copy.js';

const sheet=(cls='Fighter')=>{
 const draft=templateCharacter(cls),profile=playProfile(draft);
 let state=normalizePlay(profile);
 const act=(type,fields={})=>state=advancePlay(profile,state,{type,...fields});
 return {draft,profile,act,get state(){return state;}};
};
const indexOf=(p,name)=>p.profile.s.attacks.findIndex(attack=>attack.name===name);
const result=(p,index,fields={})=>resolveAttack(p.profile,p.state,{index,targetAC:null,
 confirmedHit:false,advantage:false,disadvantage:false,rolls:[11],damageRolls:[],...fields});

test('dice parser doubles only damage dice on a critical, including 2d6 and fixed Unarmed Strike',()=>{
 assert.deepEqual(attackDice('2d6',true),{count:4,sides:6,fixed:null});
 assert.deepEqual(attackDice('1d8'),{count:1,sides:8,fixed:null});
 assert.deepEqual(attackDice('1',true),{count:0,sides:null,fixed:1});
 assert.deepEqual(attackDice('5'),{count:0,sides:null,fixed:5});
 for(const bad of ['0d6','2d3','2d6+5','',null,'100d6','1d20 garbage'])
   assert.throws(()=>attackDice(bad),/expression/);
});

test('advantage and disadvantage cancel, including forced Heavy-property disadvantage',()=>{
 assert.equal(attackRollMode({advantage:true}),'advantage');
 assert.equal(attackRollMode({disadvantage:true}),'disadvantage');
 assert.equal(attackRollMode({advantage:true,disadvantage:true}),'normal');
 assert.equal(attackRollMode({advantage:true,forcedDisadvantage:true}),'normal');
 assert.equal(attackRollMode({forcedDisadvantage:true}),'disadvantage');
 assert.throws(()=>attackRollMode({advantage:'true'}),/valid Advantage/);
});

test('normal d20 total resolves against entered AC and subtracts Exhaustion from D20 only',()=>{
 const p=sheet(),index=indexOf(p,'Unarmed Strike');
 p.act('exhaustion',{value:2});
 const base=p.profile.s.attacks[index];
 const a=result(p,index,{targetAC:base.bonus+11-4,rolls:[11],damageRolls:[]});
 assert.equal(a.hit,true);
 assert.equal(a.total,11+base.bonus-4);
 assert.equal(a.damage,Math.max(0,1+base.mod));
 assert.equal(a.bonus,base.bonus-4);
 assert.equal(a.critical,false);
 assert.equal(result(p,index,{targetAC:99,rolls:[11]}).hit,false);
});

test('natural one auto-misses even with enormous attack bonus, and cannot be confirmed hit',()=>{
 const p=sheet(),i=indexOf(p,'Unarmed Strike');
 assert.equal(result(p,i,{rolls:[1],targetAC:1}).hit,false);
 assert.throws(()=>result(p,i,{rolls:[1],confirmedHit:true}),/natural 1/);
});

test('natural twenty automatically hits an unreachable AC and rolls double weapon dice',()=>{
 const p=sheet(),i=indexOf(p,'Flail');
 assert.notEqual(i,-1);
 const attack=p.profile.s.attacks[i];
 const dice=attackDice(attack.dice,true);
 const a=result(p,i,{rolls:[20],targetAC:99,damageRolls:Array(dice.count).fill(2)});
 assert.equal(a.critical,true);
 assert.equal(a.hit,true);
 assert.equal(a.damage,Math.max(0,dice.count*2+attack.mod));
 assert.equal(a.targetAC,99);
});

test('Advantage uses higher die, Disadvantage lower, and canceled flags use one die',()=>{
 const p=sheet(),i=indexOf(p,'Unarmed Strike');
 assert.equal(result(p,i,{advantage:true,rolls:[2,15]}).natural,15);
 assert.equal(result(p,i,{disadvantage:true,rolls:[2,15]}).natural,2);
 assert.equal(result(p,i,{advantage:true,disadvantage:true,rolls:[12]}).natural,12);
 assert.throws(()=>result(p,i,{advantage:true,disadvantage:true,rolls:[12,15]}),/correct number/);
});

test('a unknown target AC requires DM confirmation before damage dice are generated',()=>{
 const p=sheet(),i=indexOf(p,'Flail');
 assert.equal(result(p,i,{rolls:[13]}).hit,null);
 assert.throws(()=>result(p,i,{rolls:[13],damageRolls:[3]}),/Damage dice/);
 assert.equal(result(p,i,{rolls:[13],confirmedHit:true,damageRolls:[3]}).hit,true);
 assert.throws(()=>result(p,i,{rolls:[13],confirmedHit:true,targetAC:99}),/conflicts/);
});

test('a stale or invalid dice payload cannot forge a Play log transition',()=>{
 const p=sheet(),i=indexOf(p,'Flail'),base=p.state;
 for(const bad of [
   {rolls:[0]}, {rolls:[21]}, {rolls:['20']},{rolls:[]},
   {index:999}, {index:'0'}, {targetAC:'15'}, {targetAC:100},
   {confirmedHit:'true'}, {rolls:[18],targetAC:1,damageRolls:[99]},
   {rolls:[18],targetAC:1,damageRolls:[2,2]}
 ])assert.throws(()=>p.act('attack-assist',{index:i,targetAC:null,confirmedHit:false,
   advantage:false,disadvantage:false,rolls:[13],damageRolls:[],...bad}));
 assert.deepEqual(p.state,base);
});

test('an attack entry persists to Play log and is eligible for existing one-step Undo',()=>{
 const p=sheet(),i=indexOf(p,'Flail');
 const before=structuredClone(p.state);
 p.act('attack-assist',{index:i,targetAC:12,confirmedHit:false,advantage:false,disadvantage:false,
   rolls:[16],damageRolls:[5]});
 assert.match(p.state.log.at(-1),/Flail: d20 16/);
 assert.match(p.state.log.at(-1),/Apply to target at table/);
 assert.deepEqual(validatePlay(p.profile,p.state),p.state);
 assert.deepEqual(before.log,[]);
});

test('an attack never mutates self HP, target HP or action economy',()=>{
 const p=sheet(),i=indexOf(p,'Flail');
 p.act('combat-start',{initiative:18});p.act('combat-turn',{stage:'start'});
 const hp=p.state.hp,combat=structuredClone(p.state.combat);
 p.act('attack-assist',{index:i,targetAC:10,confirmedHit:false,advantage:false,disadvantage:false,
   rolls:[18],damageRolls:[6]});
 assert.equal(p.state.hp,hp);
 assert.deepEqual(p.state.combat,combat);
 assert.ok(!Object.hasOwn(p.state,'targetHP'));
});

test('reported miss never spends damage dice and Play rejects log edits for a downed character',()=>{
 const p=sheet(),i=indexOf(p,'Flail');
 p.act('attack-assist',{index:i,targetAC:99,confirmedHit:false,advantage:false,disadvantage:false,
   rolls:[1],damageRolls:[]});
 assert.match(p.state.log.at(-1),/miss/);
 p.act('damage',{value:p.profile.maxHP});
 assert.throws(()=>p.act('attack-assist',{index:i,targetAC:null,confirmedHit:false,
   advantage:false,disadvantage:false,rolls:[12],damageRolls:[]}),/at least 1 HP/);
});

test('fixed unarmed damage has no critical dice but applies the same modifier once',()=>{
 const p=sheet(),i=indexOf(p,'Unarmed Strike');
 const r=result(p,i,{rolls:[20],damageRolls:[]});
 assert.equal(r.critical,true);
 assert.equal(r.damage,Math.max(0,1+p.profile.s.attacks[i].mod));
});

test('non-Fighter has no improved critical threshold and explicit test covers Champion level 15',()=>{
 const rogue=sheet('Rogue'),ri=indexOf(rogue,'Unarmed Strike');
 assert.equal(result(rogue,ri,{rolls:[19],targetAC:99}).hit,false);
 const fighter=sheet('Fighter'),fi=indexOf(fighter,'Unarmed Strike');
 const highProfile={...fighter.profile,s:{...fighter.profile.s,fighter:{...fighter.profile.s.fighter,critical:18}}};
 const a=resolveAttack(highProfile,fighter.state,{index:fi,targetAC:99,confirmedHit:false,
   advantage:false,disadvantage:false,rolls:[18],damageRolls:[]});
 assert.equal(a.critical,true);assert.equal(a.hit,true);
});

test('Beast reference is source-linked, explicitly limited by class level and available only to known beasts',()=>{
 assert.deepEqual(beastFormLimit(2),{cr:0.25,fly:false});
 assert.deepEqual(beastFormLimit(4),{cr:0.5,fly:false});
 assert.deepEqual(beastFormLimit(8),{cr:1,fly:true});
 assert.equal(beastFormLimit(1),null);
 const wolf=beastQuickReference('Wolf',2);
 assert.equal(wolf.cr,'1/4');assert.equal(wolf.eligible,true);
 assert.equal(wolf.page,364);assert.equal(wolf.ac,12);
 assert.equal(beastQuickReference('Brown Bear',2).eligible,false);
 assert.equal(beastQuickReference('Brown Bear',8).eligible,true);
 assert.equal(beastQuickReference('Giant Owl',4),null);
 assert.equal(beastQuickReference('Giant Owl',8),null); // SRD 5.2.1 Celestial, not Beast
 assert.equal(beastQuickReference('Adult Red Dragon',20),null);
 assert.equal(beastQuickReference('<img onerror=alert(1)>',20),null);
});

test('beast reference lookup does not alter saved Wild Shape or Play statistics',()=>{
 const p=sheet('Druid'),before=structuredClone(p.state);
 const ref=beastQuickReference('Wolf',p.profile.d.level);
 assert.ok(ref);assert.deepEqual(before,p.state);
 assert.equal(p.state.hp,p.profile.maxHP);
});

test('attack history survives a private character JSON export and re-import',async()=>{
 const p=sheet('Fighter'),i=indexOf(p,'Flail');
 p.act('attack-assist',{index:i,targetAC:12,confirmedHit:false,advantage:false,disadvantage:false,
   rolls:[18],damageRolls:[5]});
 const exported=await makePlayExport(p.draft,p.state);
 const imported=await readSavedCharacterExport(JSON.stringify(exported));
 assert.deepEqual(imported.play,p.state);
});

test('Play interface, translations and offline cache are wired to the new modules',()=>{
 const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 for(const keyword of ['attack-assist','Target AC (optional)','beastQuickReference','Wild Shape form limits'])
   assert.ok(ui.includes(keyword),keyword);
 for(const keyword of ['Roll and record attack','DM confirmed hit (if AC unknown)','Beast reference'])
   assert.ok(messages[keyword].id);
 assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
 assert.ok(sw.includes("'./lib/combat-assist.js'"));
 assert.ok(sw.includes("'./lib/beast-reference.js'"));
});

test('two-die Greatsword doubles all weapon dice but adds Strength modifier only once',()=>{
 const p=sheet('Fighter'),i=indexOf(p,'Greatsword');
 const bonus=p.profile.s.attacks[i].mod;
 assert.equal(result(p,i,{rolls:[15],targetAC:1,damageRolls:[2,3]}).damage,5+bonus);
 assert.equal(result(p,i,{rolls:[20],targetAC:99,damageRolls:[2,3,4,5]}).damage,14+bonus);
 assert.throws(()=>result(p,i,{rolls:[20],targetAC:99,damageRolls:[1,1]}),/Damage dice/);
});

test('Heavy weapon disadvantages cannot be erased except by opposing Advantage',()=>{
 const p=sheet('Fighter'),i=indexOf(p,'Greatsword');
 const temporary={...p.profile,s:{...p.profile.s,attacks:p.profile.s.attacks.map((a,j)=>j===i?{...a,disadvantage:true}:a)}};
 const basic={index:i,targetAC:null,confirmedHit:false,advantage:false,disadvantage:false,
   rolls:[18,5],damageRolls:[]};
 const lower=resolveAttack(temporary,p.state,basic);
 assert.equal(lower.mode,'disadvantage');assert.equal(lower.natural,5);
 const canceled=resolveAttack(temporary,p.state,{...basic,advantage:true,rolls:[14]});
 assert.equal(canceled.mode,'normal');assert.equal(canceled.natural,14);
});

test('an unconfirmed roll is recorded without inventing damage or another creature health',()=>{
 const p=sheet('Fighter'),i=indexOf(p,'Flail');
 p.act('attack-assist',{index:i,targetAC:null,confirmedHit:false,advantage:false,disadvantage:false,
   rolls:[10],damageRolls:[]});
 assert.match(p.state.log.at(-1),/unconfirmed/);
 assert.doesNotMatch(p.state.log.at(-1),/Apply to target at table/);
 assert.equal(p.state.hp,p.profile.maxHP);
});

test('beast quick lookup is read-only and has no valid entry for prohibited creature names',()=>{
 const before=beastQuickReference('Wolf',2);
 const another=beastQuickReference('Wolf',8);
 assert.equal(before.eligible,true);
 assert.equal(another.eligible,true);
 assert.deepEqual(before,{...another,eligible:true,limitation:before.limitation});
 assert.equal(beastQuickReference('Tyrannosaurus Rex',8),null);
 assert.equal(beastQuickReference('__proto__',8),null);
});
