import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {templateCharacter,deriveCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay} from '../dist/lib/play.js';
import {setSavedMulticlassPlan,clearSavedMulticlassPlan} from '../dist/lib/saved-multiclass-plan.mjs';
import {prepareMulticlassLevelUp,clearMulticlassLevelUp} from '../dist/lib/saved-multiclass-levelup.mjs';
import {rogueEntryOptions,setSavedRogueEntry,inspectSavedRogueEntry,clearSavedRogueEntry,validRogueEntryShape} from '../dist/lib/saved-multiclass-rogue-entry.mjs';
import {makeSavedCharacterExport,readSavedCharacterExport,makeRosterExport,readRosterExport} from '../dist/lib/portable.js';
const sample=(nextClass='Rogue')=>{
 const draft=templateCharacter('Fighter'),profile=playProfile(draft);
 const record={id:randomUUID(),draft,play:{...normalizePlay(profile),xp:profile.s.nextXP},
  playUndo:null,inventoryReceipts:[{operationId:randomUUID()}],notes:'private test'};
 return prepareMulticlassLevelUp(setSavedMulticlassPlan(record,nextClass),{xpAuthority:'xp',hpMethod:'fixed',acknowledged:true});
};
function pick(record){
 const options=rogueEntryOptions(record);
 assert.equal(options.supported,true);
 const skill=options.skills[0];
 const expertise=[options.expertise[0],skill];
 const language=options.languages[0];
 const masteries=options.masteries.slice(0,2);
 assert.equal(new Set(expertise).size,2);
 return {skill,expertise,language,masteries,acknowledged:true};
}
const accepted=r=>setSavedRogueEntry(r,pick(r));

test('Convergence 04: confirmed Fighter to Rogue class entry remains an inert, fully projected choices ledger',()=>{
 const record=sample(),before=structuredClone(record);
 const result=accepted(record),inspection=inspectSavedRogueEntry(result);
 assert.equal(inspection.status,'current');assert.equal(inspection.projection.active,false);
 assert.deepEqual(inspection.projection.hitDice,[{className:'Fighter',count:3,die:10},{className:'Rogue',count:1,die:8}]);
 assert.equal(inspection.projection.totalLevel,4);
 assert.equal(inspection.projection.proficiencyBonus,2);
 assert.equal(inspection.projection.maxHP,result.multiclassLevelUp.nextMaxHP);
 assert.deepEqual(inspection.projection.armorTraining,['Light']);
 assert.deepEqual(inspection.projection.toolProficiencies,["Thieves’ Tools"]);
 assert.equal(inspection.projection.features.length,4);
 assert.equal(inspection.projection.grantedStartingEquipment,false);
 assert.deepEqual(record,before);assert.deepEqual(result.play,record.play);
 assert.deepEqual(result.draft,record.draft);assert.equal(deriveCharacter(result.draft).hp,deriveCharacter(record.draft).hp);
});
test('Convergence 04: valid Rogue options require 1 new Rogue skill, 2 Expertise, 1 language, 2 distinct mastery kinds',()=>{
 const r=sample(),chosen=pick(r);const opts=rogueEntryOptions(r);
 assert.ok(opts.skills.length>=1&&opts.expertise.length>=1&&opts.languages.length>=1&&opts.masteries.length>=2);
 assert.ok(opts.skills.includes(chosen.skill));
 assert.ok(opts.expertise.includes(chosen.expertise[0]));
 assert.ok(opts.languages.includes(chosen.language));
 assert.ok(chosen.masteries.every(name=>opts.masteries.includes(name)));
 const entry=accepted(r).multiclassRogueEntry;
 assert.equal(validRogueEntryShape(entry),true);
 assert.deepEqual(entry.expertise,chosen.expertise);
});
test('Convergence 04: no save without explicit non-activation acknowledgement and current checkpoint',()=>{
 const r=sample(),chosen=pick(r);
 assert.throws(()=>setSavedRogueEntry(r,{...chosen,acknowledged:false}),/Confirm/);
 assert.throws(()=>setSavedRogueEntry(clearMulticlassLevelUp(r),chosen),/checkpoint/);
 assert.throws(()=>setSavedRogueEntry(clearSavedMulticlassPlan(r),chosen),/checkpoint|future-class/);
 assert.throws(()=>setSavedRogueEntry({...r,draft:{...r.draft,level:4}},chosen),/checkpoint/);
 assert.equal(rogueEntryOptions(sample('Barbarian')).supported,false);
});
test('Convergence 04: rejects forged skills, expertise, language, and duplicate/non-proficient masteries',()=>{
 const r=sample(),chosen=pick(r);
 const bad=[{...chosen,skill:'Arcana'}, {...chosen,expertise:['Arcana',chosen.skill]},
  {...chosen,expertise:[chosen.skill,chosen.skill]}, {...chosen,language:'Thieves’ Cant'},
  {...chosen,masteries:[chosen.masteries[0],chosen.masteries[0]]},
  {...chosen,masteries:['nonexistent','Spear']}, {...chosen,masteries:[r.draft.mastery[0],chosen.masteries[0]]}];
 for(const value of bad)assert.throws(()=>setSavedRogueEntry(r,value));
});
test('Convergence 04: reapproval of future class plan or HP checkpoint clears old Rogue entry',()=>{
 const r=accepted(sample());
 assert.equal(Object.hasOwn(setSavedMulticlassPlan(r,'Rogue'),'multiclassRogueEntry'),false);
 assert.equal(Object.hasOwn(clearSavedMulticlassPlan(r),'multiclassRogueEntry'),false);
 assert.equal(Object.hasOwn(clearMulticlassLevelUp(r),'multiclassRogueEntry'),false);
 const reset=prepareMulticlassLevelUp(r,{xpAuthority:'xp',hpMethod:'rolled',hpRoll:5,acknowledged:true});
 assert.equal(Object.hasOwn(reset,'multiclassRogueEntry'),false);
});
test('Convergence 04: stale XP or changed ability scores do not activate old Rogue choices',()=>{
 const r=accepted(sample());
 assert.equal(inspectSavedRogueEntry({...r,play:{...r.play,xp:r.play.xp+1}}).status,'review');
 assert.equal(inspectSavedRogueEntry({...r,draft:{...r.draft,level:4}}).status,'review');
 assert.equal(inspectSavedRogueEntry({...r,multiclassLevelUp:{...r.multiclassLevelUp,hpGain:99}}).status,'review');
 assert.equal(inspectSavedRogueEntry(r).status,'current');
});
test('Convergence 04: corrupt and forged extension shapes are never interpreted as a feature entitlement',()=>{
 const record=accepted(sample()),entry=record.multiclassRogueEntry;
 for(const forged of [{...entry,schema:'unknown'},{...entry,primaryLevel:20},
  {...entry,nextTotalLevel:20},{...entry,extra:true},{...entry,expertise:['Stealth']},
  {...entry,checkpoint:{...entry.checkpoint,baseMaxHP:999}}]){
  assert.equal(validRogueEntryShape(forged),false);
  assert.equal(inspectSavedRogueEntry({...record,multiclassRogueEntry:forged}).status,'invalid');
 }
});
test('Convergence 04: saved individual character export/import preserves inert entry as private metadata',async()=>{
 const saved=accepted(sample());const file=await makeSavedCharacterExport(saved);
 assert.deepEqual(file.payload.extensions.multiclassRogueEntry,saved.multiclassRogueEntry);
 const restored=await readSavedCharacterExport(JSON.stringify(file));
 assert.deepEqual(restored.multiclassRogueEntry,saved.multiclassRogueEntry);
 assert.equal(inspectSavedRogueEntry(restored).status,'current');
 assert.deepEqual(restored.play,saved.play);
});
test('Convergence 04: roster backup preserves linked entry and unaffected second character',async()=>{
 const first=accepted(sample());const second=sample();const backup=await makeRosterExport([first,second]);
 const restored=await readRosterExport(JSON.stringify(backup));
 assert.deepEqual(restored[0].multiclassRogueEntry,first.multiclassRogueEntry);
 assert.equal(Object.hasOwn(restored[1],'multiclassRogueEntry'),false);
 assert.equal(inspectSavedRogueEntry(restored[0]).status,'current');
});
test('Convergence 04: clearing entry leaves checkpoints, character Play, Undo, inventory and future plan untouched',()=>{
 const r=accepted(sample()),clear=clearSavedRogueEntry(r);
 assert.equal(Object.hasOwn(clear,'multiclassRogueEntry'),false);
 assert.deepEqual(clear.play,r.play);
 assert.deepEqual(clear.playUndo,r.playUndo);
 assert.deepEqual(clear.multiclassPlan,r.multiclassPlan);
 assert.deepEqual(clear.multiclassLevelUp,r.multiclassLevelUp);
 assert.deepEqual(clear.inventoryReceipts,r.inventoryReceipts);
 assert.strictEqual(clearSavedRogueEntry(clear),clear);
});
