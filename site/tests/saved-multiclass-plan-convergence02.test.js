import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {templateCharacter,deriveCharacter} from '../dist/lib/character.js';
import {normalizePlay,playProfile} from '../dist/lib/play.js';
import {makeSavedCharacterExport,readSavedCharacterExport,makeRosterExport,readRosterExport} from '../dist/lib/portable.js';
import {previewMulticlass} from '../dist/lib/srd-multiclass-preview.mjs';
import {setSavedMulticlassPlan,clearSavedMulticlassPlan,inspectSavedMulticlassPlan,validMulticlassPlanShape,multiclassPlanSchema} from '../dist/lib/saved-multiclass-plan.mjs';

const make=(className='Fighter')=>{
 const draft=templateCharacter(className);
 return {id:randomUUID(),draft,play:normalizePlay(playProfile(draft)),playUndo:null,
   inventoryReceipts:[{operationId:randomUUID()}],personalNote:{campaign:'sample'},
   _characterRevision:randomUUID()};
};
test('Convergence 02: future-class planning saves immutable structured intent without granting active mechanics',()=>{
 const original=make();const before=structuredClone(original);
 const saved=setSavedMulticlassPlan(original,'Rogue');
 const expected=previewMulticlass([{className:'Fighter',level:3},{className:'Rogue',level:1}],deriveCharacter(original.draft).scores);
 assert.equal(saved.multiclassPlan.schema,multiclassPlanSchema);
 assert.equal(saved.multiclassPlan.primaryClass,'Fighter');
 assert.equal(saved.multiclassPlan.nextClass,'Rogue');
 assert.equal(saved.multiclassPlan.primaryLevel,3);
 assert.equal(saved.multiclassPlan.nextTotalLevel,expected.totalLevel);
 assert.equal(inspectSavedMulticlassPlan(saved).status,'current');
 assert.equal(validMulticlassPlanShape(saved.multiclassPlan),true);
 assert.deepEqual(saved.draft,original.draft);
 assert.deepEqual(saved.play,original.play);
 assert.deepEqual(saved.inventoryReceipts,original.inventoryReceipts);
 assert.deepEqual(saved, {...original,multiclassPlan:saved.multiclassPlan});
 assert.deepEqual(original,before);
});
test('Convergence 02: invalid SRD prerequisites cannot be saved or silently converted to character levels',()=>{
 const character=make('Fighter');
 for(const value of ['Monk','Paladin','Wizard','Fighter','Invalid Class',null,''])
   assert.throws(()=>setSavedMulticlassPlan(character,value));
 assert.equal(inspectSavedMulticlassPlan(character).status,'none');
 assert.equal(character.draft.level,3);
});
test('Convergence 02: ability scores and class changes flag the saved plan as stale, without deleting it',()=>{
 const planned=setSavedMulticlassPlan(make('Fighter'),'Rogue');
 const newScores={...planned,draft:{...planned.draft,scores:[13,15,14,8,12,10]}};
 assert.equal(inspectSavedMulticlassPlan(newScores).status,'review');
 const newLevel={...planned,draft:{...planned.draft,level:4}};
 assert.equal(inspectSavedMulticlassPlan(newLevel).status,'review');
 const changedClass={...planned,draft:{...planned.draft,className:'Ranger'}};
 assert.equal(inspectSavedMulticlassPlan(changedClass).status,'review');
 assert.equal(planned.multiclassPlan.nextClass,'Rogue');
});
test('Convergence 02: re-save after an eligible ability change refreshes snapshot and clears stale status',()=>{
 const planned=setSavedMulticlassPlan(make('Fighter'),'Rogue');
 const changed={...planned,draft:{...planned.draft,scores:[15,14,13,8,12,10]}};
 assert.equal(inspectSavedMulticlassPlan(changed).status,'review');
 const fixed=setSavedMulticlassPlan(changed,'Rogue');
 assert.equal(inspectSavedMulticlassPlan(fixed).status,'current');
 assert.notDeepEqual(fixed.multiclassPlan.scoresAtPlanning,planned.multiclassPlan.scoresAtPlanning);
});
test('Convergence 02: level 20 characters cannot schedule additional levels',()=>{
 const source=make('Fighter');
 assert.throws(()=>setSavedMulticlassPlan({...source,draft:{...source.draft,level:20}},'Rogue'),/level 20/);
});
test('Convergence 02: corrupted persisted plan metadata is rejected, not executed',()=>{
 const source=setSavedMulticlassPlan(make(),'Rogue');
 const p=source.multiclassPlan;
 for(const altered of [{...p,primaryLevel:99},{...p,nextTotalLevel:200},{...p,scoresAtPlanning:[13,13]},
  {...p,nextClass:'Fighter'},{...p,schema:'unknown'},{...p,operation:'automatically-grant-spells'}]){
   assert.equal(validMulticlassPlanShape(altered),false);
   assert.equal(inspectSavedMulticlassPlan({...source,multiclassPlan:altered}).status,'invalid');
 }
});
test('Convergence 02: unrecognized or corrupted record fails closed rather than damaging fields',()=>{
 assert.throws(()=>setSavedMulticlassPlan({},'Rogue'));
 assert.throws(()=>setSavedMulticlassPlan({draft:{className:'Blaster',level:3}},'Rogue'));
 assert.throws(()=>clearSavedMulticlassPlan({draft:{className:'Blaster',level:3}}));
});
test('Convergence 02: explicit removal preserves all Play, inventory and foreign extension data',()=>{
 const record=setSavedMulticlassPlan(make(),'Rogue');
 const cleared=clearSavedMulticlassPlan(record);
 assert.equal(Object.hasOwn(cleared,'multiclassPlan'),false);
 assert.deepEqual({...cleared,multiclassPlan:record.multiclassPlan},record);
 assert.strictEqual(clearSavedMulticlassPlan(cleared),cleared);
 assert.deepEqual(record.multiclassPlan.nextClass,'Rogue');
});
test('Convergence 02: individual character export/import round trip preserves only portable planning intent',async()=>{
 const active=setSavedMulticlassPlan(make(),'Rogue');
 const file=await makeSavedCharacterExport(active);
 assert.deepEqual(file.payload.extensions.multiclassPlan,active.multiclassPlan);
 assert.equal(file.payload.draft.level,3);
 assert.equal(Object.hasOwn(file.payload,'_characterRevision'),false);
 const restored=await readSavedCharacterExport(JSON.stringify(file));
 assert.deepEqual(restored.multiclassPlan,active.multiclassPlan);
 assert.equal(inspectSavedMulticlassPlan(restored).status,'current');
 assert.equal(restored.play.hp,active.play.hp);
 const roundtrip=await makeSavedCharacterExport(restored);
 assert.deepEqual(roundtrip.payload,file.payload);
});
test('Convergence 02: full roster export/import also preserves intent for one PC without touching others',async()=>{
 const a=setSavedMulticlassPlan(make(),'Rogue'),b=make('Ranger');
 const packet=await makeRosterExport([a,b]);
 const roster=await readRosterExport(JSON.stringify(packet));
 assert.equal(inspectSavedMulticlassPlan(roster[0]).status,'current');
 assert.equal(inspectSavedMulticlassPlan(roster[1]).status,'none');
 assert.equal(roster[0].draft.level,3);
});
test('Convergence 02: Play Sheet has separate guarded save/remove actions, no active class mutation',()=>{
 const sheet=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 assert.match(sheet,/data-play-form="multiclass-plan"/);
 assert.match(sheet,/data-play-action="clear-multiclass-plan"/);
 assert.match(sheet,/saveFutureClassPlan/);
 assert.match(sheet,/characters\.update\(savedId,current=>/);
 assert.match(sheet,/expectedRevision,requireExisting:true/);
 assert.match(sheet,/I understand this is a saved planning note, not an active multiclass character/);
 assert.match(sheet,/Saving a future-class plan does not change level, HP, class features/);
});


test('Convergence 02: offline worker preloads the saved planning module under a new revision',()=>{
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 assert.match(sw,/open-5e-v0\.25\.7-inventory-dev\.10-player-convergence08/);
 assert.match(sw,/\.\/lib\/saved-multiclass-plan\.mjs/);
});

test('Convergence 02: next-class options expose reasons and disable choices failing SRD primary abilities',async()=>{
 const {multiclassPlanChoices}=await import('../dist/lib/saved-multiclass-plan.mjs');
 const fighter=make('Fighter');
 const options=multiclassPlanChoices(fighter);
 assert.equal(options.length,11);
 assert.equal(options.find(x=>x.className==='Rogue').eligible,true);
 const monk=options.find(x=>x.className==='Monk');
 assert.equal(monk.eligible,false);
 assert.match(monk.requirements,/Dexterity 13\+ and Wisdom 13\+/);
 assert.ok(monk.reason);
 assert.ok(options.every(row=>typeof row.requirements==='string'));
 const max={...fighter,draft:{...fighter.draft,level:20}};
 assert.ok(multiclassPlanChoices(max).every(row=>!row.eligible&&/level 20/.test(row.reason)));
});
test('Convergence 02: invalid null plan can be explicitly removed from Play despite lacking a valid nextClass',()=>{
 const damaged={...make(),multiclassPlan:null};
 assert.equal(inspectSavedMulticlassPlan(damaged).status,'invalid');
 assert.equal(inspectSavedMulticlassPlan(clearSavedMulticlassPlan(damaged)).status,'none');
 const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 assert.match(ui,/Object\.hasOwn\(record,'multiclassPlan'\)/);
 assert.match(ui,/multiclassPlanChoices\(record\)/);
});

test('Convergence 02: existing builder saves preserve the next-class plan and signal review if the build changes',async()=>{
 const {mergeSavedCharacterBuild}=await import('../dist/saved-character-build.js');
 const planned=setSavedMulticlassPlan(make('Fighter'),'Rogue');
 const replacement={id:planned.id,draft:{...planned.draft,scores:[13,15,14,8,12,10]}};
 const merged=mergeSavedCharacterBuild(planned,replacement);
 assert.deepEqual(merged.multiclassPlan,planned.multiclassPlan);
 assert.equal(inspectSavedMulticlassPlan(merged).status,'review');
 assert.deepEqual(merged.personalNote,planned.personalNote);
 assert.deepEqual(merged.inventoryReceipts,planned.inventoryReceipts);
 assert.equal(merged.draft.scores[0],13);
 assert.equal(planned.draft.scores[0],15);
});
test('Convergence 02: live Play actions after planning preserve the plan and old Undo state',async()=>{
 const {advancePlay}=await import('../dist/lib/play.js');
 const initial=make();const planned=setSavedMulticlassPlan(initial,'Rogue');
 const profile=playProfile(planned.draft);
 const after={...planned,play:advancePlay(profile,planned.play,{type:'damage',value:1,critical:false}),playUndo:planned.play};
 assert.deepEqual(after.multiclassPlan,planned.multiclassPlan);
 assert.equal(after.play.hp,planned.play.hp-1);
 assert.equal(after.playUndo.hp,planned.play.hp);
 assert.equal(after.draft.level,3);
});
