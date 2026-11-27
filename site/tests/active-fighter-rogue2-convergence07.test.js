import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {templateCharacter,build} from '../dist/lib/character.js';
import {playProfile,normalizePlay,validatePlay,advancePlay} from '../dist/lib/play.js';
import {setSavedMulticlassPlan} from '../dist/lib/saved-multiclass-plan.mjs';
import {prepareMulticlassLevelUp} from '../dist/lib/saved-multiclass-levelup.mjs';
import {rogueEntryOptions,setSavedRogueEntry} from '../dist/lib/saved-multiclass-rogue-entry.mjs';
import {activateFighterRogue} from '../dist/lib/activate-fighter-rogue.mjs';
import {advanceFighterRogue2} from '../dist/lib/advance-fighter-rogue2.mjs';
import {activeFighterRogueSchema,activeFighterRogue2Schema,validFighterRogueActive} from '../dist/lib/srd-fighter-rogue-live.mjs';
import {planAttack} from '../dist/lib/combat-assist.js';
import {makeSavedCharacterExport,readSavedCharacterExport,makeRosterExport,readRosterExport} from '../dist/lib/portable.js';
import {makeNativeSheetPDF} from '../dist/lib/native-sheet-pdf.js';
import {PDFDocument} from '../dist/vendor/pdf-lib.min.js';
import {exportGwenGCX,gcxToGwen,multiclassGCXKey} from '../dist/lib/gwentable-gcx.js';
import {readGCX} from '../dist/lib/gcx.mjs';
import {readFileSync} from 'node:fs';

function fighterRogue1(){
 const draft=build({...templateCharacter('Fighter'),level:1,kit:'B'}).draft;
 let record={id:randomUUID(),draft,play:{...normalizePlay(playProfile(draft)),xp:300},playUndo:null,
  userMeta:{title:'Keep this private field'}};
 record=setSavedMulticlassPlan(record,'Rogue');
 record=prepareMulticlassLevelUp(record,{acknowledged:true,xpAuthority:'xp',hpMethod:'fixed'});
 const opts=rogueEntryOptions(record);
 record=setSavedRogueEntry(record,{skill:opts.skills[0],expertise:[opts.expertise[0],opts.skills[0]],
  language:opts.languages[0],masteries:['Dagger',opts.masteries.find(x=>x!=='Dagger')],acknowledged:true});
 return activateFighterRogue(record,{confirmed:true});
}
const prepared=(record=fighterRogue1(),options={})=>{
 const profile=playProfile(record.draft,record.multiclassActive);
 const elevated={...record,play:{...record.play,xp:900}};
 return advanceFighterRogue2(elevated,{confirmed:true,hpMethod:'fixed',...options});
};

test('dev07: Fighter1/Rogue1 remains byte-compatible, and Rogue2 advances once with correct class ledger',()=>{
 const prior=fighterRogue1(),before=structuredClone(prior),at2={...prior,play:{...prior.play,xp:900}},after=prepared(prior);
 assert.equal(prior.multiclassActive.schema,activeFighterRogueSchema);
 assert.deepEqual(prior,before);
 assert.equal(after.multiclassActive.schema,activeFighterRogue2Schema);
 assert.equal(after.multiclassActive.secondaryLevel,2);assert.equal(after.multiclassActive.totalLevel,3);
 assert.equal(after.draft.level,1);assert.deepEqual(after.draft,prior.draft);
 const beforeProfile=playProfile(at2.draft,at2.multiclassActive);
 const gain=Math.max(1,5+beforeProfile.con);
 assert.equal(after.multiclassActive.rogue2.hpGain,gain);
 assert.equal(after.play.hp,Math.min(after.multiclassActive.maxHP,at2.play.hp+gain));
 assert.equal(after.userMeta.title,prior.userMeta.title);assert.equal(after.playUndo,null);
 assert.equal(validFighterRogueActive(after.multiclassActive),true);
});

test('dev07: Rogue2 profile adds only Cunning Action, preserves Fighter1 and Sneak Attack 1d6',()=>{
 const record=prepared(),profile=playProfile(record.draft,record.multiclassActive);
 assert.equal(profile.totalLevel,3);assert.equal(profile.rogueLevel,2);
 assert.equal(profile.s.xp,900);assert.equal(profile.s.nextXP,2700);
 assert.equal(profile.s.proficiency,2);
 assert.deepEqual(profile.hitDicePools,[{className:'Fighter',die:10,count:1},{className:'Rogue',die:8,count:2}]);
 assert.equal(profile.dice,3);assert.equal(profile.maxHP,record.multiclassActive.maxHP);
 assert.ok(profile.s.features.some(feature=>feature.includes('Cunning Action')));
 assert.ok(profile.s.features.some(feature=>feature.includes('Sneak Attack 1d6')));
 assert.ok(!profile.s.features.some(feature=>feature.includes('Sneak Attack 2d6')));
 assert.ok(profile.resources.some(resource=>resource.id==='second-wind'));
 assert.deepEqual(validatePlay(profile,record.play),record.play);
});

test('dev07: preserves spent Fighter/Rogue Hit Dice and supports both dice at level 3',()=>{
 const start=fighterRogue1(),profile=playProfile(start.draft,start.multiclassActive);
 const spent=advancePlay(profile,start.play,{type:'hit-die',die:8,value:4});
 const next=prepared({...start,play:{...spent,xp:900}}),p=playProfile(next.draft,next.multiclassActive);
 assert.deepEqual(next.play.hitDiceSpent,{'8':1,'10':0});assert.equal(next.play.dice,1);
 assert.deepEqual(p.hitDicePools[1],{className:'Rogue',die:8,count:2});
 const more=advancePlay(p,next.play,{type:'hit-die',die:8,value:6});
 assert.deepEqual(more.hitDiceSpent,{'8':2,'10':0});
 assert.throws(()=>advancePlay(p,more,{type:'hit-die',die:8,value:3}),/no Hit Dice/);
 const rest=advancePlay(p,more,{type:'long-rest'});
 assert.deepEqual(rest.hitDiceSpent,{'8':0,'10':0});
});

test('dev07: Cunning Action Dash, Disengage and Hide consume exactly one confirmed bonus action in combat',()=>{
 for(const option of ['dash','disengage','hide']){
  const record=prepared(),p=playProfile(record.draft,record.multiclassActive);
  const start=advancePlay(p,record.play,{type:'combat-start',initiative:16});
  const turn=advancePlay(p,start,{type:'combat-turn',stage:'start'});
  const result=advancePlay(p,turn,{type:'rogue-cunning-action',option});
  assert.equal(result.combat.bonusUsed,true);
  assert.match(result.log.at(-1),new RegExp('Cunning Action: '+option,'i'));
  assert.throws(()=>advancePlay(p,result,{type:'rogue-cunning-action',option:'hide'}),/already marked used/);
  const next=advancePlay(p,advancePlay(p,result,{type:'combat-turn',stage:'end'}),{type:'combat-turn',stage:'start'});
  assert.equal(next.combat.bonusUsed,false);
 }
});

test('dev07: Cunning Action is not active at Rogue1, cannot auto-hide or use invalid option',()=>{
 const one=fighterRogue1(),p1=playProfile(one.draft,one.multiclassActive);
 assert.throws(()=>advancePlay(p1,one.play,{type:'rogue-cunning-action',option:'dash'}),/requires Rogue class level 2/);
 const two=prepared(),p2=playProfile(two.draft,two.multiclassActive);
 assert.throws(()=>advancePlay(p2,two.play,{type:'rogue-cunning-action',option:'teleport'}),/Choose Dash/);
 const start=advancePlay(p2,two.play,{type:'combat-start',initiative:10});
 assert.throws(()=>advancePlay(p2,start,{type:'rogue-cunning-action',option:'dash'}),/requires your turn/);
 const result=advancePlay(p2,two.play,{type:'rogue-cunning-action',option:'hide'});
 assert.ok(!result.conditions.includes('Invisible'));assert.ok(!result.conditions.includes('Hidden'));
});

test('dev07: Rogue2 can reset tracked Sneak Attack on another creature turn',()=>{
 const record=prepared(),p=playProfile(record.draft,record.multiclassActive);
 const active=advancePlay(p,record.play,{type:'combat-start',initiative:10});
 const window=advancePlay(p,active,{type:'combat-window',confirmed:true});
 assert.equal(window.combat.sneakUsed,false);
 const idx=p.s.attacks.findIndex(a=>a.name==='Shortsword');
 const strike=planAttack(p,window,{index:idx,rolls:[16,5],advantage:true,targetAC:15,confirmedHit:false,sneak:true});
 assert.equal(strike.rogue.count,1);
});

test('dev07: XP threshold or separate GM-approved milestone is required, no auto-level',()=>{
 const start=fighterRogue1();
 assert.throws(()=>advanceFighterRogue2(start,{confirmed:true}),/at least 900 XP/);
 const gm=advanceFighterRogue2(start,{confirmed:true,xpAuthority:'gm',gmApproved:true});
 assert.equal(gm.play.xp,300);assert.equal(gm.multiclassActive.rogue2.xpAuthority,'gm');
 assert.equal(gm.multiclassActive.rogue2.gmApproved,true);
 assert.throws(()=>advanceFighterRogue2(start,{confirmed:true,xpAuthority:'gm'}),/separately confirm GM/);
 assert.throws(()=>advanceFighterRogue2(start,{confirmed:true,xpAuthority:'xp',gmApproved:true}),/Choose earned XP/);
 assert.throws(()=>advanceFighterRogue2(start,{confirmed:false,xpAuthority:'gm',gmApproved:true}),/Confirm a private backup/);
});

test('dev07: rolled HP and minimum-1 rule use the class d8 and original CON modifier',()=>{
 const roll=prepared(fighterRogue1(),{hpMethod:'rolled',hpRoll:7});
 const prevActive={...roll.multiclassActive,schema:activeFighterRogueSchema,secondaryLevel:1,totalLevel:2,
  maxHP:roll.multiclassActive.maxHP-roll.multiclassActive.rogue2.hpGain};
 delete prevActive.rogue2;
 const before=playProfile(roll.draft,prevActive);
 assert.equal(roll.multiclassActive.rogue2.hpGain,Math.max(1,7+before.con));
 assert.throws(()=>prepared(fighterRogue1(),{hpMethod:'rolled',hpRoll:9}),/valid d8/);
 assert.throws(()=>prepared(fighterRogue1(),{hpMethod:'rolled',hpRoll:0}),/valid d8/);
 assert.throws(()=>prepared(fighterRogue1(),{hpMethod:'fixed',hpRoll:4}),/fixed HP/);
});

test('dev07: no advancement while in combat, at 0 HP, dead or concentrating; old record is unchanged',()=>{
 const prior=fighterRogue1(),p=playProfile(prior.draft,prior.multiclassActive);
 const atXP={...prior,play:{...prior.play,xp:900}};
 const saved=structuredClone(atXP);
 const combat=advancePlay(p,atXP.play,{type:'combat-start',initiative:15});
 assert.throws(()=>advanceFighterRogue2({...atXP,play:combat},{confirmed:true}),/End combat/);
 assert.throws(()=>advanceFighterRogue2({...atXP,play:{...atXP.play,hp:0}},{confirmed:true}),/zero-HP/);
 const concentrated=advancePlay(p,atXP.play,{type:'concentration',value:'Synthetic Concentration'});
 assert.throws(()=>advanceFighterRogue2({...atXP,play:concentrated},{confirmed:true}),/Concentration/);
 assert.deepEqual(atXP,saved);
});

test('dev07: forged source ledger, HP receipt, XP authority, unknown extra fields, and repeated progression fail closed',()=>{
 const record=prepared();
 assert.throws(()=>advanceFighterRogue2(record,{confirmed:true}),/Only a verified active/);
 for(const forged of [
  {...record.multiclassActive,maxHP:record.multiclassActive.maxHP+5},
  {...record.multiclassActive,rogue2:{...record.multiclassActive.rogue2,hpGain:99}},
  {...record.multiclassActive,rogue2:{...record.multiclassActive.rogue2,xpAuthority:'xp',xpAtAdvancement:1}},
  {...record.multiclassActive,rogue2:{...record.multiclassActive.rogue2,gmApproved:true}},
  {...record.multiclassActive,rogue2:{...record.multiclassActive.rogue2,extra:'forged'}},
 ])assert.throws(()=>playProfile(record.draft,forged),/malformed|source build changed/);
});

test('dev07: JSON individual/roster import, GCX build/live round trips preserve 3-level allocation',async()=>{
 const record=prepared();
 const individual=await readSavedCharacterExport(JSON.stringify(await makeSavedCharacterExport(record)));
 assert.deepEqual(individual.multiclassActive,record.multiclassActive);
 assert.deepEqual(individual.play,record.play);
 const roster=await readRosterExport(JSON.stringify(await makeRosterExport([record])));
 assert.deepEqual(roster[0].multiclassActive,record.multiclassActive);
 for(const mode of ['build','live-snapshot']){
  const gcx=await readGCX(await exportGwenGCX(record,mode));
  assert.equal(gcx.character.level,3);
  assert.deepEqual(gcx.character.classes,[{name:'Fighter',level:1},{name:'Rogue',level:2}]);
  assert.deepEqual(gcx.preservedExtensions[multiclassGCXKey],record.multiclassActive);
  const imported=gcxToGwen(gcx,mode==='live-snapshot');
  assert.deepEqual(imported.multiclassActive,record.multiclassActive);
  if(mode==='live-snapshot')assert.deepEqual(imported.play,{...record.play,log:[]});
 }
});

test('dev07: Native PDF renders dynamic multiclass level 3 and separate 1d10 + 2d8',async()=>{
 const record=prepared(),profile=playProfile(record.draft,record.multiclassActive);
 const {bytes}=await makeNativeSheetPDF(profile,record.play,{edition:'2024',paper:'a4'});
 const doc=await PDFDocument.load(bytes);
 const text=doc.getForm().getFields().flatMap(f=>typeof f.getText==='function'?[f.getText()]:[]).join(' | ');
 assert.match(text,/Level 3 Fighter 1 \/ Rogue 2/);
 assert.match(text,/Rogue 2\/2 d8/);
 assert.match(text,/Cunning Action/);
});

test('dev07: UI binds class level, optional GM approval, validated character transaction and Cunning Action options',()=>{
 const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 const roster=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(ui,/data-play-form="advance-fighter-rogue2"/);
 assert.match(ui,/gmApproved/);
 assert.match(ui,/expectedRevision:characterStorageRevision\(record\)/);
 assert.match(ui,/data-play-action="rogue-cunning-action"/);
 assert.match(roster,/composite\.totalLevel/);
 assert.match(roster,/composite\.secondaryLevel/);
});
