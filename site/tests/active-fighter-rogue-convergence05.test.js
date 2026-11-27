import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {templateCharacter,build,deriveCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay,validatePlay} from '../dist/lib/play.js';
import {planAttack} from '../dist/lib/combat-assist.js';
import {setSavedMulticlassPlan} from '../dist/lib/saved-multiclass-plan.mjs';
import {prepareMulticlassLevelUp} from '../dist/lib/saved-multiclass-levelup.mjs';
import {rogueEntryOptions,setSavedRogueEntry} from '../dist/lib/saved-multiclass-rogue-entry.mjs';
import {activateFighterRogue} from '../dist/lib/activate-fighter-rogue.mjs';
import {makeRosterExport,readRosterExport,makeSavedCharacterExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {mergeSavedCharacterBuild} from '../dist/saved-character-build.js';
import {mergeLinkedGCXUpdate} from '../dist/linked-gcx-update.js';

function fixture({kit='B',xpAuthority='xp',hpMethod='fixed',hpRoll=null}={}){
 const draft=build({...templateCharacter('Fighter'),level:1,kit}).draft;
 const base=playProfile(draft);
 let record={id:randomUUID(),draft,play:{...normalizePlay(base),xp:base.s.nextXP},playUndo:null,privateMeta:{owner:'synthetic-only'}};
 record=setSavedMulticlassPlan(record,'Rogue');
 record=prepareMulticlassLevelUp(record,{acknowledged:true,xpAuthority,hpMethod,hpRoll,gmApproved:xpAuthority==='gm'});
 const opts=rogueEntryOptions(record);
 record=setSavedRogueEntry(record,{skill:opts.skills[0],expertise:[opts.expertise[0],opts.skills[0]],
  language:opts.languages[0],masteries:['Dagger',opts.masteries.find(x=>x!=='Dagger')],acknowledged:true});
 return record;
}
const live=r=>activateFighterRogue(r,{confirmed:true});

test('Convergence 05: activation is a single immutable Fighter 1 / Rogue 1 transformation with no gear grant',()=>{
 const before=fixture(),snap=structuredClone(before),after=live(before);
 assert.deepEqual(before,snap);
 assert.equal(after.multiclassActive.primaryLevel,1);
 assert.equal(after.multiclassActive.secondaryLevel,1);
 assert.equal(after.multiclassActive.totalLevel,2);
 assert.equal(after.draft.level,1);assert.equal(after.draft.className,'Fighter');
 assert.deepEqual(after.draft,before.draft);assert.deepEqual(after.privateMeta,before.privateMeta);
 assert.equal(after.playUndo,null);
 assert.ok(!Object.hasOwn(after,'multiclassPlan')&&!Object.hasOwn(after,'multiclassLevelUp')&&!Object.hasOwn(after,'multiclassRogueEntry'));
 assert.equal(after.play.hp,before.multiclassLevelUp.nextMaxHP);
 assert.equal(after.play.dice,0);assert.deepEqual(after.play.hitDiceSpent,{'8':0,'10':0});
 assert.deepEqual(validatePlay(playProfile(after.draft,after.multiclassActive),after.play),after.play);
});

test('Convergence 05: class-specific proficiencies, expertise, Sneak Attack and Fighter resources coexist',()=>{
 const before=fixture(),after=live(before),profile=playProfile(after.draft,after.multiclassActive);
 const s=profile.s;
 assert.equal(profile.d.level,1);assert.equal(profile.totalLevel,2);
 assert.equal(profile.die,10);assert.equal(profile.dice,2);
 assert.deepEqual(profile.hitDicePools,[{className:'Fighter',die:10,count:1},{className:'Rogue',die:8,count:1}]);
 assert.equal(s.hp,before.multiclassLevelUp.nextMaxHP);
 assert.equal(s.xp,300);assert.equal(s.nextXP,900);
 assert.equal(s.proficiency,2);assert.equal(s.fighter.attacks,1);
 assert.ok(profile.resources.some(x=>x.id==='second-wind'));
 assert.ok(s.languages.includes(after.multiclassActive.language));assert.ok(s.languages.includes('Thieves’ Cant'));
 assert.ok(s.proficientTools.includes('Thieves’ Tools'));assert.ok(s.armorTraining.includes('Light'));
 for(const name of after.multiclassActive.expertise){const row=s.skills.find(x=>x.name===name);assert.equal(row.expert,true);assert.equal(row.trained,true)}
 const rogueSkill=s.skills.find(x=>x.name===after.multiclassActive.skill);
 assert.equal(rogueSkill.expert,true);assert.equal(rogueSkill.total,deriveCharacter(after.draft).skills.find(x=>x.name===rogueSkill.name).total+4);
 assert.ok(s.features.some(x=>x.includes('Sneak Attack 1d6')));
 assert.equal(s.attacks.find(x=>x.name==='Shortsword').mastery,deriveCharacter(after.draft).attacks.find(x=>x.name==='Shortsword').mastery);
});

test('Convergence 05: mixed 1d8 and 1d10 spend as independent tracked Hit Dice and restore on long rest',()=>{
 const r=live(fixture()),p=playProfile(r.draft,r.multiclassActive);
 const first=advancePlay(p,r.play,{type:'hit-die',die:8,value:5});
 assert.deepEqual(first.hitDiceSpent,{'8':1,'10':0});assert.equal(first.dice,1);
 assert.throws(()=>advancePlay(p,first,{type:'hit-die',die:8,value:4}),/no Hit Dice/);
 const second=advancePlay(p,first,{type:'hit-die',die:10,value:6});
 assert.deepEqual(second.hitDiceSpent,{'8':1,'10':1});assert.equal(second.dice,2);
 assert.throws(()=>advancePlay(p,second,{type:'hit-die',die:6,value:3}),/remaining class Hit Die/);
 assert.throws(()=>advancePlay(p,second,{type:'hit-die',value:4}),/remaining class Hit Die/);
 assert.deepEqual(validatePlay(p,second),second);
 const resting=advancePlay(p,second,{type:'long-rest'});
 assert.deepEqual(resting.hitDiceSpent,{'8':0,'10':0});assert.equal(resting.dice,0);
});

test('Convergence 05: Rogue 1 Sneak Attack rolls with validated finesse hit, and Fighter Second Wind remains legal',()=>{
 const r=live(fixture()),profile=playProfile(r.draft,r.multiclassActive);
 const index=profile.s.attacks.findIndex(a=>a.name==='Shortsword');assert.ok(index>=0);
 const plan=planAttack(profile,r.play,{index,rolls:[15,5],advantage:true,targetAC:14,confirmedHit:false,
  sneak:true,allyNear:false,cunning:'none',cunningExtra:'none'});
 assert.equal(plan.hit,true);assert.equal(plan.rogue.used,true);assert.equal(plan.rogue.count,1);
 assert.throws(()=>planAttack(profile,r.play,{index,rolls:[15,5],advantage:true,targetAC:14,confirmedHit:false,
  sneak:true,cunning:'trip',allyNear:false}),/Rogue level 5/);
 const attack=advancePlay(profile,r.play,{type:'attack-assist',index,rolls:[15,5],advantage:true,targetAC:14,
   confirmedHit:false,sneak:true,allyNear:false,damageRolls:[4],sneakRolls:[3]});
 assert.match(attack.log.at(-1),/Sneak Attack: 3 extra damage/);
 const wind=advancePlay(profile,attack,{type:'second-wind',roll:6});
 assert.equal(wind.counters['second-wind'],1);
});

test('Convergence 05: rejects activation without consent, stale checkpoint, non-Fighter1 or repeated use',()=>{
 const r=fixture();assert.throws(()=>activateFighterRogue(r),/Explicitly confirm/);
 assert.throws(()=>live({...r,multiclassLevelUp:{...r.multiclassLevelUp,nextMaxHP:9999}}),/changed|review/);
 assert.throws(()=>live({...r,draft:build({...r.draft,level:2}).draft}),/Fighter level 1/);
 assert.throws(()=>live({...r,play:{...r.play,combat:{...r.play.combat,active:true}}}),/End combat/);
 assert.throws(()=>live(live(r)),/already has an active/);
});

test('Convergence 05: active composite profile fails closed after source build edits or forged HP',()=>{
 const r=live(fixture());
 assert.throws(()=>playProfile(build({...r.draft,level:2}).draft,r.multiclassActive),/source build changed/);
 assert.throws(()=>playProfile(r.draft,{...r.multiclassActive,maxHP:r.multiclassActive.maxHP+1}),/malformed/);
 assert.throws(()=>validatePlay(playProfile(r.draft,r.multiclassActive),{...r.play,hitDiceSpent:{8:99,10:0}}),/invalid health or resources/);
 assert.throws(()=>mergeSavedCharacterBuild(r,{draft:build({...r.draft,level:2}).draft}),/single-class Builder/);
 assert.throws(()=>mergeLinkedGCXUpdate(r,{gcx:{...r.gcx}},new Date().toISOString()),/single-class GCX/);
});

test('Convergence 05: individual and roster exports preserve ACTIVE profile and independent Hit Dice on reimport',async()=>{
 const active=live(fixture());
 const profile=playProfile(active.draft,active.multiclassActive);
 const spent={...active,play:advancePlay(profile,active.play,{type:'hit-die',die:8,value:6})};
 const json=JSON.stringify(await makeSavedCharacterExport(spent));
 const restored=await readSavedCharacterExport(json);
 assert.deepEqual(restored.multiclassActive,spent.multiclassActive);
 assert.deepEqual(restored.play,spent.play);
 assert.deepEqual(validatePlay(playProfile(restored.draft,restored.multiclassActive),restored.play),restored.play);
 const roster=await readRosterExport(JSON.stringify(await makeRosterExport([spent])));
 assert.deepEqual(roster[0].play,spent.play);
 assert.deepEqual(roster[0].multiclassActive,spent.multiclassActive);
});

test('Convergence 05: forged multiclass ability prerequisites or HP method cannot be imported as active rules',()=>{
 const r=live(fixture());
 const absentDex={...r.multiclassActive,scoresAtActivation:[17,8,15,8,12,10]};
 assert.throws(()=>playProfile(r.draft,absentDex),/malformed|source build changed/);
 const extraHP={...r.multiclassActive,hpGain:r.multiclassActive.hpGain+1,
  maxHP:r.multiclassActive.maxHP+1};
 assert.throws(()=>playProfile(r.draft,extraHP),/source build changed/);
 const overRoll={...r.multiclassActive,hpMethod:'rolled',hpRoll:9};
 assert.throws(()=>playProfile(r.draft,overRoll),/malformed/);
});
