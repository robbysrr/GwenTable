import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {templateCharacter,build} from '../dist/lib/character.js';
import {playProfile,normalizePlay,validatePlay,advancePlay} from '../dist/lib/play.js';
import {setSavedMulticlassPlan} from '../dist/lib/saved-multiclass-plan.mjs';
import {prepareMulticlassLevelUp} from '../dist/lib/saved-multiclass-levelup.mjs';
import {rogueEntryOptions,setSavedRogueEntry} from '../dist/lib/saved-multiclass-rogue-entry.mjs';
import {activateFighterRogue} from '../dist/lib/activate-fighter-rogue.mjs';
import {advanceFighterRogue2} from '../dist/lib/advance-fighter-rogue2.mjs';
import {advanceFighterRogue3} from '../dist/lib/advance-fighter-rogue3.mjs';
import {activeFighterRogue2Schema,activeFighterRogue3Schema,validFighterRogueActive} from '../dist/lib/srd-fighter-rogue-live.mjs';
import {planAttack,attackRollMode} from '../dist/lib/combat-assist.js';
import {makeSavedCharacterExport,readSavedCharacterExport,makeRosterExport,readRosterExport} from '../dist/lib/portable.js';
import {exportGwenGCX,gcxToGwen,multiclassGCXKey} from '../dist/lib/gwentable-gcx.js';
import {readGCX} from '../dist/lib/gcx.mjs';
import {makeNativeSheetPDF} from '../dist/lib/native-sheet-pdf.js';
import {PDFDocument} from '../dist/vendor/pdf-lib.min.js';
import {srdPages} from '../dist/lib/srd-reader-pages.js';
const source=file=>readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
function rogue2(){
 const draft=build({...templateCharacter('Fighter'),level:1,kit:'B'}).draft;
 let record={id:randomUUID(),draft,play:{...normalizePlay(playProfile(draft)),xp:300},playUndo:null,foreignMeta:{owner:'Keep'}};
 record=setSavedMulticlassPlan(record,'Rogue');
 record=prepareMulticlassLevelUp(record,{acknowledged:true,xpAuthority:'xp',hpMethod:'fixed'});
 const opts=rogueEntryOptions(record);
 record=setSavedRogueEntry(record,{skill:opts.skills[0],expertise:[opts.expertise[0],opts.skills[0]],
  language:opts.languages[0],masteries:['Dagger',opts.masteries.find(x=>x!=='Dagger')],acknowledged:true});
 record=activateFighterRogue(record,{confirmed:true});
 return advanceFighterRogue2({...record,play:{...record.play,xp:900}},{confirmed:true});
}
const rogue3=(record=rogue2(),options={})=>advanceFighterRogue3({...record,play:{...record.play,xp:2700}},
 {confirmed:true,...options});

test('dev08: Fighter1 / Rogue2 source remains unchanged, Rogue3 Thief advances once with accurate XP/HP/d8 ledger',()=>{
 const old=rogue2(),before=structuredClone(old),next=rogue3(old);
 assert.deepEqual(old,before);assert.equal(old.multiclassActive.schema,activeFighterRogue2Schema);
 assert.equal(next.multiclassActive.schema,activeFighterRogue3Schema);
 assert.equal(next.multiclassActive.totalLevel,4);assert.equal(next.multiclassActive.secondaryLevel,3);
 assert.equal(next.multiclassActive.rogue3.subclass,'Thief');
 assert.equal(next.multiclassActive.rogue3.xpAtAdvancement,2700);
 assert.equal(next.multiclassActive.maxHP,old.multiclassActive.maxHP+Math.max(1,5+playProfile(old.draft,old.multiclassActive).con));
 assert.equal(next.draft.level,1);assert.deepEqual(next.draft,old.draft);
 assert.equal(next.foreignMeta.owner,'Keep');assert.equal(next.playUndo,null);
 const profile=playProfile(next.draft,next.multiclassActive);
 assert.equal(profile.totalLevel,4);assert.equal(profile.rogueLevel,3);
 assert.equal(profile.rogueSubclass,'Thief');assert.equal(profile.s.nextXP,6500);
 assert.equal(profile.s.proficiency,2);
 assert.deepEqual(profile.hitDicePools,[{className:'Fighter',die:10,count:1},{className:'Rogue',die:8,count:3}]);
 assert.equal(profile.s.climbSpeed,profile.s.speed);assert.equal(profile.s.jumpAbility,'Dexterity');
 assert.ok(profile.s.features.some(s=>s.includes('Steady Aim')));
 assert.ok(profile.s.features.some(s=>s.includes('Fast Hands')));
 assert.ok(profile.s.features.some(s=>s.includes('Sneak Attack 2d6')));
 assert.ok(!profile.s.features.some(s=>s.includes('Sneak Attack 1d6')));
 assert.ok(profile.resources.some(x=>x.id==='second-wind'));
 assert.deepEqual(validatePlay(profile,next.play),next.play);
});

test('dev08: Rogue3 Sneak Attack is 2d6 on eligible Finesse attack, no repeat in same tracked creature turn',()=>{
 const row=rogue3(),profile=playProfile(row.draft,row.multiclassActive);
 const idx=profile.s.attacks.findIndex(a=>a.name==='Shortsword');assert.ok(idx>=0);
 const state=advancePlay(profile,advancePlay(profile,row.play,{type:'combat-start',initiative:12}),{type:'combat-turn',stage:'start'});
 const entry={index:idx,targetAC:14,rolls:[17],advantage:false,disadvantage:false,confirmedHit:false,sneak:true,allyNear:true};
 const planned=planAttack(profile,state,entry);
 assert.equal(planned.rogue.count,2);
 const hit=advancePlay(profile,state,{type:'attack-assist',...entry,damageRolls:[5],sneakRolls:[3,4]});
 assert.equal(hit.combat.sneakUsed,true);
 assert.throws(()=>planAttack(profile,hit,entry),/already used/);
});

test('dev08: Steady Aim requires unmoved confirmed active turn and exactly one Bonus Action',()=>{
 const row=rogue3(),p=playProfile(row.draft,row.multiclassActive);
 assert.throws(()=>advancePlay(p,row.play,{type:'rogue-steady-aim',notMoved:true}),/active combat turn/);
 const ready=advancePlay(p,advancePlay(p,row.play,{type:'combat-start',initiative:15}),{type:'combat-turn',stage:'start'});
 assert.throws(()=>advancePlay(p,ready,{type:'rogue-steady-aim',notMoved:false}),/not moved/);
 const aiming=advancePlay(p,ready,{type:'rogue-steady-aim',notMoved:true});
 assert.equal(aiming.combat.bonusUsed,true);assert.equal(aiming.combat.aimPending,true);assert.equal(aiming.combat.aimLocked,true);
 assert.throws(()=>advancePlay(p,aiming,{type:'rogue-cunning-action',option:'hide'}),/already marked used/);
 assert.throws(()=>advancePlay(p,aiming,{type:'rogue-steady-aim',notMoved:true}),/already active/);
 const idx=p.s.attacks.findIndex(a=>a.name==='Shortsword');
 const plan=planAttack(p,aiming,{index:idx,targetAC:15,rolls:[6,17],advantage:false,disadvantage:false,confirmedHit:false,sneak:false});
 assert.equal(plan.mode,'advantage');assert.equal(plan.steadyAim,true);
 const canceled=planAttack(p,aiming,{index:idx,targetAC:15,rolls:[17],advantage:false,disadvantage:true,confirmedHit:false,sneak:false});
 assert.equal(canceled.mode,'normal');
 const attacked=advancePlay(p,aiming,{type:'attack-assist',index:idx,targetAC:15,rolls:[6,17],advantage:false,
  disadvantage:false,confirmedHit:false,sneak:false,damageRolls:[5],sneakRolls:[]});
 assert.equal(attacked.combat.aimPending,false);assert.equal(attacked.combat.aimLocked,true);
 const after=advancePlay(p,attacked,{type:'combat-turn',stage:'end'});
 assert.equal(after.combat.aimPending,false);assert.equal(after.combat.aimLocked,false);
 const again=advancePlay(p,after,{type:'combat-turn',stage:'start'});
 assert.equal(again.combat.bonusUsed,false);
});

test('dev08: legacy Play snapshots without aim flags remain valid; explicitly forged flags fail validation',()=>{
 const next=rogue3(),p=playProfile(next.draft,next.multiclassActive),legacy=structuredClone(next.play);
 delete legacy.combat.aimPending;delete legacy.combat.aimLocked;
 assert.deepEqual(validatePlay(p,legacy),normalizePlay(p,legacy));
 assert.throws(()=>validatePlay(p,{...legacy,combat:{...legacy.combat,aimPending:true,aimLocked:true}}),/invalid/);
});

test('dev08: Fast Hands costs the Bonus Action and never presumes successful checks or changes item resources',()=>{
 const next=rogue3(),p=playProfile(next.draft,next.multiclassActive);
 for(const option of ['sleight','utilize','magic-item']){
  const ready=advancePlay(p,advancePlay(p,next.play,{type:'combat-start',initiative:16}),{type:'combat-turn',stage:'start'});
  assert.throws(()=>advancePlay(p,ready,{type:'rogue-fast-hands',option,confirmed:false,magicItemEligible:true}),/Confirm/);
  if(option==='magic-item')assert.throws(()=>advancePlay(p,ready,{type:'rogue-fast-hands',option,confirmed:true,magicItemEligible:false}),/normally requiring/);
  const used=advancePlay(p,ready,{type:'rogue-fast-hands',option,confirmed:true,magicItemEligible:true});
  assert.equal(used.combat.bonusUsed,true);
  assert.deepEqual(used.conditions,ready.conditions);
  assert.deepEqual(used.counters,ready.counters);
  assert.deepEqual(used.slots,ready.slots);
  assert.match(used.log.at(-1),/resolve check, targeting, charges and effects manually/i);
  assert.throws(()=>advancePlay(p,used,{type:'rogue-fast-hands',option,confirmed:true,magicItemEligible:true}),/already marked used/);
 }
 assert.throws(()=>advancePlay(p,next.play,{type:'rogue-fast-hands',option:'spellcasting',confirmed:true}),/Choose Sleight/);
 const older=rogue2(),oldProfile=playProfile(older.draft,older.multiclassActive);
 assert.throws(()=>advancePlay(oldProfile,older.play,{type:'rogue-fast-hands',option:'sleight',confirmed:true}),/requires Rogue level 3/);
});

test('dev08: Rogue3 enforces total level 4 XP 2700 or separate GM milestone, with fixed and rolled HP',()=>{
 const first=rogue2();
 assert.throws(()=>advanceFighterRogue3(first,{confirmed:true}),/2,700 XP/);
 assert.throws(()=>rogue3(first,{subclass:'Assassin'}),/only the SRD 5.2.1 Thief/i);
 const gm=advanceFighterRogue3(first,{confirmed:true,xpAuthority:'gm',gmApproved:true});
 assert.equal(gm.multiclassActive.rogue3.gmApproved,true);assert.equal(gm.play.xp,first.play.xp);
 assert.throws(()=>advanceFighterRogue3(first,{confirmed:true,xpAuthority:'gm',gmApproved:false}),/separately confirm/);
 const rolled=rogue3(first,{hpMethod:'rolled',hpRoll:8});
 assert.equal(rolled.multiclassActive.rogue3.hpGain,Math.max(1,8+playProfile(first.draft,first.multiclassActive).con));
 assert.throws(()=>rogue3(first,{hpMethod:'rolled',hpRoll:9}),/valid d8/);
 assert.throws(()=>rogue3(first,{hpMethod:'fixed',hpRoll:4}),/fixed HP/);
 assert.throws(()=>advanceFighterRogue3(first,{confirmed:false}),/Confirm a private backup/);
});

test('dev08: active combat, concentration and downed characters cannot level; repeated or forged Rogue3 data are rejected',()=>{
 const one=rogue2(),p=playProfile(one.draft,one.multiclassActive);
 const ready={...one,play:{...one.play,xp:2700}},before=structuredClone(ready);
 const fighting=advancePlay(p,ready.play,{type:'combat-start',initiative:11});
 assert.throws(()=>advanceFighterRogue3({...ready,play:fighting},{confirmed:true}),/End combat/);
 assert.throws(()=>advanceFighterRogue3({...ready,play:{...ready.play,hp:0}},{confirmed:true}),/zero-HP/);
 const concentrating=advancePlay(p,ready.play,{type:'concentration',value:'Test Focus'});
 assert.throws(()=>advanceFighterRogue3({...ready,play:concentrating},{confirmed:true}),/Concentration/);
 assert.deepEqual(ready,before);
 const two=rogue3(one);
 assert.throws(()=>advanceFighterRogue3(two,{confirmed:true}),/Only a verified active/);
 for(const mut of [
  a=>{a.rogue3.subclass='Assassin'},
  a=>{a.rogue3.hpGain=999},
  a=>{a.rogue3.xpAtAdvancement=100},
  a=>{a.maxHP+=1},
  a=>{a.rogue3.extra='forgery'},
  a=>{a.rogue2.hpGain+=1}]){
  const forged=structuredClone(two.multiclassActive);mut(forged);
  assert.throws(()=>playProfile(two.draft,forged),/malformed|changed/i);
 }
});

test('dev08: distinct Fighter d10 and three Rogue d8 remain spendable and recover separately',()=>{
 const next=rogue3(),p=playProfile(next.draft,next.multiclassActive);
 let play=next.play;
 for(let i=0;i<3;i++)play=advancePlay(p,play,{type:'hit-die',die:8,value:4});
 assert.deepEqual(play.hitDiceSpent,{'8':3,'10':0});
 assert.throws(()=>advancePlay(p,play,{type:'hit-die',die:8,value:4}),/no Hit Dice/);
 play=advancePlay(p,play,{type:'hit-die',die:10,value:4});
 assert.equal(play.hitDiceSpent[10],1);
 play=advancePlay(p,play,{type:'long-rest'});
 assert.deepEqual(play.hitDiceSpent,{'8':0,'10':0});
});

test('dev08: JSON, roster, and GCX preserve exact Rogue3 Thief and live Play; no class flattening',async()=>{
 const next=rogue3(),profile=playProfile(next.draft,next.multiclassActive);
 const packed=await makeSavedCharacterExport(next);
 const unpacked=await readSavedCharacterExport(JSON.stringify(packed));
 assert.deepEqual(unpacked.multiclassActive,next.multiclassActive);
 const roster=await readRosterExport(JSON.stringify(await makeRosterExport([next])));
 assert.deepEqual(roster[0].multiclassActive,next.multiclassActive);
 const gcx=await readGCX(await exportGwenGCX(next,'live-snapshot'));
 assert.deepEqual(gcx.preservedExtensions[multiclassGCXKey],next.multiclassActive);
 const imported=gcxToGwen(gcx,true);
 assert.deepEqual(imported.multiclassActive,next.multiclassActive);
 assert.deepEqual(validatePlay(profile,imported.play),normalizePlay(profile,imported.play));
});

test('dev08: fillable A4 and Letter PDF show level4 Thief subclass, 2d6 Sneak Attack, mixed Hit Dice',async()=>{
 const next=rogue3(),profile=playProfile(next.draft,next.multiclassActive);
 for(const [edition,paper] of [['2024','a4'],['2014','letter']]){
  const output=await makeNativeSheetPDF(profile,next.play,{edition,paper});
  const pdf=await PDFDocument.load(output.bytes);
  const form=pdf.getForm();const fields=form.getFields().map(x=>x.getName());
  const text=form.getFields().filter(x=>typeof x.getText==='function').map(x=>x.getText()).join(' | ');
  assert.ok(pdf.getPageCount()>=2);
  assert.ok(fields.some(x=>x.includes('Character name and level')));
  assert.match(text,/Level 4 Fighter 1 \/ Rogue 3/);
  assert.match(text,/Rogue subclass: Thief/);
  assert.match(text,/Sneak Attack 2d6/);
  assert.match(text,/Hit Dice Fighter 1\/1 d10.*Rogue 3\/3 d8/);
  assert.ok(fields.some(x=>x.includes('Multiclass allocation'))||fields.some(x=>x.includes('Feats')));
  assert.ok(fields.some(x=>x.includes('Class resources'))||fields.some(x=>x.includes('Combat profile')));
 }
});

test('dev08: source-backed Rogue3 details, visible UI controls, bilingual copy, offline module registration',()=>{
 assert.match(srdPages[62],/Level 3: Steady Aim/);
 assert.match(srdPages[64],/Level 3: Fast Hands/);
 assert.match(srdPages[64],/Level 3: Second-Story Work/);
 const sheet=source('play-sheet.js'),sw=source('sw.js'),local=source('locale-copy.js');
 for(const token of ['advance-fighter-rogue3','rogue-steady-aim','rogue-fast-hands','data-rogue-no-move','magicItemEligible',
  'Fighter 1 / Rogue 3 (Thief)','profile.rogueLevel>=3','profile.rogueSubclass'])assert.ok(sheet.includes(token),token);
 assert.ok(sw.includes("'./lib/advance-fighter-rogue3.mjs'"));
 assert.ok(sw.includes('player-convergence08'));
 assert.ok(local.includes('Naik ke Fighter 1 / Rogue 3'));
});
