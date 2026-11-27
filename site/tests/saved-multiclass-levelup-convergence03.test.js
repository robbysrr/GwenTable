import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {templateCharacter,deriveCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay} from '../dist/lib/play.js';
import {classes} from '../dist/lib/catalog.js';
import {setSavedMulticlassPlan,clearSavedMulticlassPlan} from '../dist/lib/saved-multiclass-plan.mjs';
import {prepareMulticlassLevelUp,clearMulticlassLevelUp,inspectMulticlassLevelUp,
 validMulticlassLevelUpShape,multiclassLevelUpSchema} from '../dist/lib/saved-multiclass-levelup.mjs';
import {makeSavedCharacterExport,readSavedCharacterExport,makeRosterExport,readRosterExport} from '../dist/lib/portable.js';

const fixture=(className='Fighter',nextClass='Rogue')=>{
 const draft=templateCharacter(className),profile=playProfile(draft);
 const record={id:randomUUID(),draft,play:normalizePlay(profile),playUndo:null,
   inventoryReceipts:[{operationId:randomUUID()}],personalNote:{table:'sample'},_characterRevision:randomUUID()};
 return setSavedMulticlassPlan(record,nextClass);
};
const eligibleXP=r=>({...r,play:{...r.play,xp:playProfile(r.draft).s.nextXP}});
const fixed=(r,options={})=>prepareMulticlassLevelUp(r,{hpMethod:'fixed',xpAuthority:'xp',acknowledged:true,...options});
const gm=(r,options={})=>prepareMulticlassLevelUp(r,{hpMethod:'fixed',xpAuthority:'gm',gmApproved:true,acknowledged:true,...options});

test('Convergence 03: fixed-HP SRD multiclass checkpoint does not grant active features or resources',()=>{
 const record=eligibleXP(fixture()),before=structuredClone(record),profile=playProfile(record.draft);
 const saved=fixed(record);
 assert.equal(saved.multiclassLevelUp.schema,multiclassLevelUpSchema);
 assert.equal(saved.multiclassLevelUp.nextClass,'Rogue');
 assert.equal(saved.multiclassLevelUp.classHitDie,classes.Rogue.die);
 assert.equal(saved.multiclassLevelUp.hpGain,Math.max(1,5+profile.s.mods[2]));
 assert.equal(saved.multiclassLevelUp.nextMaxHP,profile.maxHP+saved.multiclassLevelUp.hpGain);
 assert.equal(inspectMulticlassLevelUp(saved).status,'current');
 assert.equal(saved.draft.level,3);
 assert.deepEqual(saved.draft,record.draft);assert.deepEqual(saved.play,record.play);
 assert.deepEqual(saved.playUndo,record.playUndo);
 assert.deepEqual(saved.inventoryReceipts,record.inventoryReceipts);
 assert.deepEqual(saved.personalNote,record.personalNote);
 assert.deepEqual(record,before);
});
test('Convergence 03: a rolled Hit Die has bounded input and a minimum of 1 HP gained',()=>{
 const r=gm(fixture(),{hpMethod:'rolled',hpRoll:1});
 assert.equal(r.multiclassLevelUp.hpRoll,1);
 assert.equal(r.multiclassLevelUp.hpGain,Math.max(1,1+playProfile(r.draft).s.mods[2]));
 for(const invalid of [0,-1,1.5,9,20,NaN,null,'6'])
   assert.throws(()=>gm(fixture(),{hpMethod:'rolled',hpRoll:invalid}),/actual roll/);
 assert.equal(gm(fixture(),{hpMethod:'rolled',hpRoll:8}).multiclassLevelUp.hpRoll,8);
 assert.throws(()=>gm(fixture(),{hpMethod:'fixed',hpRoll:5}),/Fixed Hit Points/);
});
test('Convergence 03: XP threshold is checked using total character level, GM milestone is explicit',()=>{
 const record=fixture();
 assert.throws(()=>fixed(record),/XP threshold/);
 assert.throws(()=>gm(record,{gmApproved:false}),/explicit confirmation/);
 const approved=gm(record);
 assert.equal(approved.multiclassLevelUp.xpAuthority,'gm');
 assert.equal(approved.multiclassLevelUp.xpAtCheckpoint,record.play.xp);
 assert.deepEqual(approved.play,record.play);
 const byXP=fixed(eligibleXP(record));
 assert.equal(byXP.multiclassLevelUp.xpAtCheckpoint,playProfile(record.draft).s.nextXP);
});
test('Convergence 03: never stage without a current qualified plan and explicit nonactivation acknowledgment',()=>{
 const initial=eligibleXP(fixture());
 assert.throws(()=>fixed(clearSavedMulticlassPlan(initial)),/plan is missing/);
 assert.throws(()=>fixed({...initial,draft:{...initial.draft,level:4}}),/stale/);
 assert.throws(()=>fixed(initial,{acknowledged:false}),/will NOT activate/);
 assert.throws(()=>fixed(initial,{xpAuthority:'unknown'}),/XP threshold/);
 assert.throws(()=>fixed(initial,{hpMethod:'unknown'}),/Hit Points/);
 assert.throws(()=>fixed({...initial,play:{...initial.play,hp:0}}),/zero-HP/);
});
test('Convergence 03: score, XP, level and source HP changes invalidate checkpoint, without mutating it',()=>{
 const checkpoint=fixed(eligibleXP(fixture()));
 const scored={...checkpoint,draft:{...checkpoint.draft,scores:[14,15,13,8,12,10]}};
 assert.equal(inspectMulticlassLevelUp(scored).status,'review');
 assert.equal(inspectMulticlassLevelUp({...checkpoint,draft:{...checkpoint.draft,level:4}}).status,'review');
 assert.equal(inspectMulticlassLevelUp({...checkpoint,play:{...checkpoint.play,xp:checkpoint.play.xp+1}}).status,'review');
 assert.equal(inspectMulticlassLevelUp({...checkpoint,multiclassPlan:null}).status,'review');
 assert.equal(inspectMulticlassLevelUp(checkpoint).status,'current');
});
test('Convergence 03: repeated plan approval invalidates its old checkpoint before another save',()=>{
 const checked=fixed(eligibleXP(fixture()));
 const refreshed=setSavedMulticlassPlan(checked,'Rogue');
 assert.equal(Object.hasOwn(refreshed,'multiclassLevelUp'),false);
 const cleared=clearSavedMulticlassPlan(checked);
 assert.equal(Object.hasOwn(cleared,'multiclassLevelUp'),false);
 assert.equal(Object.hasOwn(cleared,'multiclassPlan'),false);
 assert.equal(inspectMulticlassLevelUp(cleared).status,'none');
});
test('Convergence 03: removing a prepared checkpoint retains existing next-class plan and Play data',()=>{
 const checked=fixed(eligibleXP(fixture()));
 const cleared=clearMulticlassLevelUp(checked);
 assert.deepEqual(cleared.multiclassPlan,checked.multiclassPlan);
 assert.deepEqual(cleared.play,checked.play);
 assert.deepEqual(cleared.playUndo,checked.playUndo);
 assert.equal(Object.hasOwn(cleared,'multiclassLevelUp'),false);
 assert.strictEqual(clearMulticlassLevelUp(cleared),cleared);
});
test('Convergence 03: source-aligned slot, proficiency, and mixed Hit Dice previews, not active resources',()=>{
 const prep=inspectMulticlassLevelUp(fixed(eligibleXP(fixture())));
 assert.equal(prep.preview.before.totalLevel,3);
 assert.equal(prep.preview.after.totalLevel,4);
 assert.deepEqual(prep.preview.after.hitDice,[{className:'Fighter',count:3,die:10},{className:'Rogue',count:1,die:8}]);
 assert.equal(prep.preview.after.proficiencyBonus,2);
 assert.deepEqual(prep.preview.after.sharedSlots,[]);
 assert.equal(prep.preview.sourcePage,'SRD 5.2.1 pp. 24–25');
});
test('Convergence 03: forged checkpoint fields are rejected; imported malformed data cannot grant active mechanics',()=>{
 const ready=fixed(eligibleXP(fixture())),p=ready.multiclassLevelUp;
 for(const forged of [{...p,schema:'unknown'},{...p,primaryLevel:20},{...p,nextClass:'Invalid'},
   {...p,hpGain:0},{...p,nextMaxHP:99999},{...p,hpRoll:99,hpMethod:'rolled'},
   {...p,autoSpendSlots:true},{...p,scoresAtCheckpoint:[1,2]}]) {
  assert.equal(validMulticlassLevelUpShape(forged),false);
  assert.equal(inspectMulticlassLevelUp({...ready,multiclassLevelUp:forged}).status,'invalid');
 }
});
test('Convergence 03: individual export/import preserves checkpoint as a private, inactive extension',async()=>{
 const ready=fixed(eligibleXP(fixture())),file=await makeSavedCharacterExport(ready);
 assert.deepEqual(file.payload.extensions.multiclassLevelUp,ready.multiclassLevelUp);
 const restored=await readSavedCharacterExport(JSON.stringify(file));
 assert.deepEqual(restored.multiclassLevelUp,ready.multiclassLevelUp);
 assert.deepEqual(restored.play,ready.play);
 assert.equal(inspectMulticlassLevelUp(restored).status,'current');
 assert.equal(restored.draft.level,3);
});
test('Convergence 03: roster backup preserves only the staged character checkpoint',async()=>{
 const first=fixed(eligibleXP(fixture())),second=fixture('Ranger','Rogue');
 const file=await makeRosterExport([first,second]);
 const restored=await readRosterExport(JSON.stringify(file));
 assert.equal(inspectMulticlassLevelUp(restored[0]).status,'current');
 assert.equal(inspectMulticlassLevelUp(restored[1]).status,'none');
 assert.deepEqual(restored[0].multiclassPlan,first.multiclassPlan);
 assert.deepEqual(restored[0].play,first.play);
});
test('Convergence 03: Play Sheet integrates revision-guarded checkpoint UI with explicit inactive wording',()=>{
 const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 for(const phrase of ['data-play-form="multiclass-levelup"','data-play-action="clear-levelup-checkpoint"',
   'characters.update(savedId,current=>','expectedRevision,requireExisting:true,skipUnchanged:true',
   'does not change my active level','Class spell preparation'])assert.ok(ui.includes(phrase),phrase);
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 assert.match(sw,/saved-multiclass-levelup\.mjs/);
});
