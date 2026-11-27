import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {build,templateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay} from '../dist/lib/play.js';
import {setSavedMulticlassPlan} from '../dist/lib/saved-multiclass-plan.mjs';
import {prepareMulticlassLevelUp} from '../dist/lib/saved-multiclass-levelup.mjs';
import {rogueEntryOptions,setSavedRogueEntry} from '../dist/lib/saved-multiclass-rogue-entry.mjs';
import {activateFighterRogue} from '../dist/lib/activate-fighter-rogue.mjs';
import {makeNativeSheetPDF} from '../dist/lib/native-sheet-pdf.js';
import {exportGwenGCX,gcxToGwen,multiclassGCXKey} from '../dist/lib/gwentable-gcx.js';
import {readGCX,makeGCX} from '../dist/lib/gcx.mjs';
import {PDFDocument} from '../dist/vendor/pdf-lib.min.js';
import {makeSavedCharacterExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {readRosterExport,makeRosterExport} from '../dist/lib/portable.js';
import {readFileSync} from 'node:fs';

function character(){
 const draft=build({...templateCharacter('Fighter'),level:1,kit:'B'}).draft;
 let record={id:randomUUID(),draft,play:{...normalizePlay(playProfile(draft)),xp:300},playUndo:null};
 record=setSavedMulticlassPlan(record,'Rogue');
 record=prepareMulticlassLevelUp(record,{acknowledged:true,xpAuthority:'xp',hpMethod:'fixed'});
 const opts=rogueEntryOptions(record);
 record=setSavedRogueEntry(record,{skill:opts.skills[0],expertise:[opts.expertise[0],opts.skills[0]],
  language:opts.languages[0],masteries:['Dagger',opts.masteries.find(x=>x!=='Dagger')],acknowledged:true});
 return activateFighterRogue(record,{confirmed:true});
}
const fields=pdf=>pdf.getForm().getFields().flatMap(f=>typeof f.getText==='function'?[f.getText()]:[]);

test('dev06: PDF 2024/2014 A4/Letter titles reflect Fighter 1 / Rogue 1, never Fighter 1 only',async()=>{
 const r=character(),profile=playProfile(r.draft,r.multiclassActive);
 for(const edition of ['2024','2014'])for(const paper of ['a4','letter']){
  const {bytes,pages}=await makeNativeSheetPDF(profile,r.play,{edition,paper,clean:false});
  const doc=await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(),pages);
  const body=fields(doc).join(' | ');
  assert.match(body,/Level 2 Fighter 1 \/ Rogue 1/);
  assert.match(body,/Character Level 2.*Fighter 1 \/ Rogue 1/);
  assert.match(body,/Hit Dice Fighter 1\/1 d10.*Rogue 1\/1 d8/);
  assert.match(body,/Sneak Attack 1d6/);
  assert.ok(body.includes('Thieves’ Tools')||body.includes('[U+2019]'));
  assert.doesNotMatch(body,/Hit Dice [0-9]+\/[0-9]+ d10/);
 }
});

test('dev06: spent Fighter and Rogue dice appear as independent PDF resources',async()=>{
 const r=character(),profile=playProfile(r.draft,r.multiclassActive);
 const spent=advancePlay(profile,r.play,{type:'hit-die',die:8,value:1});
 const {bytes}=await makeNativeSheetPDF(profile,spent,{notes:false});
 const doc=await PDFDocument.load(bytes);
 assert.match(fields(doc).join(' | '),/Hit Dice Fighter 1\/1 d10.*Rogue 0\/1 d8/);
});

test('dev06: build GCX exports two class allocations and namespaced active ledger',async()=>{
 const r=character();
 const output=await readGCX(await exportGwenGCX(r,'build'));
 assert.equal(output.character.level,2);
 assert.deepEqual(output.character.classes,[{name:'Fighter',level:1},{name:'Rogue',level:1}]);
 assert.equal(output.character.maxHp,playProfile(r.draft,r.multiclassActive).maxHP);
 assert.deepEqual(output.preservedExtensions[multiclassGCXKey],r.multiclassActive);
 assert.equal(output.character.play,undefined);
 assert.equal(output.preservedExtensions['gwentable/play'],undefined);
 const imported=gcxToGwen(output,false);
 assert.deepEqual(imported.multiclassActive,r.multiclassActive);
 assert.deepEqual(imported.draft,r.draft);
 assert.equal(imported.play,undefined);
});

test('dev06: live GCX round trip restores mixed Hit Dice with SRD profile (no single-class reinterpretation)',async()=>{
 const r=character(),profile=playProfile(r.draft,r.multiclassActive);
 const spent=advancePlay(profile,r.play,{type:'hit-die',die:8,value:1});
 const output=await readGCX(await exportGwenGCX({...r,play:spent},'live-snapshot'));
 const imported=gcxToGwen(output,true);
 assert.deepEqual(imported.multiclassActive,r.multiclassActive);
 assert.equal(imported.play.hp,spent.hp);
 assert.deepEqual(imported.play.hitDiceSpent,spent.hitDiceSpent);
 assert.equal(imported.play.dice,spent.dice);
 assert.equal(imported.playUndo,undefined);
 assert.equal(output.character.level,2);
 assert.equal(output.character.play.hp,spent.hp);
});

test('dev06: mismatched class, HP, score or forged ledger stays preserved GCX only',async()=>{
 const r=character();const valid=await readGCX(await exportGwenGCX(r,'build'));
 for(const change of [
  data=>{data.character.classes=[{name:'Fighter',level:2}]},
  data=>{data.character.maxHp+=1},
  data=>{data.character.scores[0]+=1},
  data=>{delete data.preservedExtensions[multiclassGCXKey]},
  data=>{data.preservedExtensions[multiclassGCXKey].hpGain+=1},
  data=>{data.sourceApp='gwens-pocket-table'},
  data=>{data.rulesProfile='AVARRA'},
 ]){
  const forged=structuredClone(valid);change(forged);
  const imported=gcxToGwen(forged,false);
  assert.equal(imported.draft,undefined);
  assert.equal(imported.multiclassActive,undefined);
  assert.ok(imported.gcx);
 }
});

test('dev06: older noncomposite GCX remains unchanged and preserves unknown extensions',async()=>{
 const draft=templateCharacter('Wizard'),play=normalizePlay(playProfile(draft));
 const output=await readGCX(await exportGwenGCX({id:randomUUID(),draft,play},'live-snapshot'));
 assert.deepEqual(output.character.classes,[{name:'Wizard',subclass:playProfile(draft).s.subclass,level:draft.level}]);
 assert.equal(output.preservedExtensions[multiclassGCXKey],undefined);
 const imported=gcxToGwen(output,true);
 assert.equal(imported.multiclassActive,undefined);
 assert.equal(imported.play.hp,play.hp);
});

test('dev06: signed integrity protects composite extension after export',async()=>{
 const output=await exportGwenGCX(character(),'live-snapshot');
 const clone=structuredClone(output);
 clone.preservedExtensions[multiclassGCXKey].hpGain++;
 await assert.rejects(readGCX(clone),/integrity check failed/);
});

test('dev06: GCX-derived composite remains valid through private roster and character JSON',async()=>{
 const active=character(),gcx=await readGCX(await exportGwenGCX(active,'live-snapshot'));
 const imported=gcxToGwen(gcx,true);
 const individual=await readSavedCharacterExport(JSON.stringify(await makeSavedCharacterExport({id:randomUUID(),...imported})));
 assert.deepEqual(individual.multiclassActive,active.multiclassActive);
 const [roster]=await readRosterExport(JSON.stringify(await makeRosterExport([{id:randomUUID(),...imported}])));
 assert.deepEqual(roster.multiclassActive,active.multiclassActive);
});

test('dev06: player UI routes composite PDF and prohibits single-class print or linked GCX overwrite',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const sheet=readFileSync(new URL('../dist/sheet-export.js',import.meta.url),'utf8');
 const play=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 assert.match(app,/multiclassActive:record\.multiclassActive\?\?null/);
 assert.match(app,/!linked\.multiclassActive&&!imported\.multiclassActive/);
 assert.match(sheet,/playProfile\(draft,snapshot\.multiclassActive\)/);
 assert.match(sheet,/web\.hidden=!showWebPrint\|\|Boolean\(multiclassActive\)/);
 assert.match(play,/multiclassActive:opened\.multiclassActive\?\?null/);
 assert.ok(!play.includes('Multiclass printable PDF is not yet certified'));
});

test('dev06: Saved Characters shows the active total level and hides single-class edit for composite',()=>{
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(source,/const levelLabel=composite\?copy\('Level'\)\+' '\+composite\.totalLevel/);
 assert.match(source,/\$\{composite\?'':`<button data-id=/);
 assert.match(source,/Active multiclass\. View and manage resources in Play Sheet/);
});


test('dev06: new composite export/roster guidance has Bahasa Indonesia equivalents',async()=>{
 const {copy,setLanguage}=await import('../dist/locale.js');
 try {
  setLanguage('id');
  assert.match(copy('Active multiclass. View and manage resources in Play Sheet. Single-class Builder edits are locked to protect this character.'),/Multiclass aktif/);
  assert.match(copy('Fillable multiclass PDF and GCX exports are supported for this class pair. Further multiclass levels remain in development.'),/PDF multiclass/);
 }finally{setLanguage('en');}
});


test('dev06: active total level determines next XP threshold label; unsupported single-class advance hidden',()=>{
 const source=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 assert.match(source,/const next=\(profile\.totalLevel\?\?d\.level\)\+1/);
 assert.match(source,/const advanceAvailable=!record\.multiclassActive&&levelsFor\(d\.className\)\.includes\(next\)/);
});
