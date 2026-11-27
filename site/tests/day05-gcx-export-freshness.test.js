import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {normalizePlay,playProfile} from '../dist/lib/play.js';
import {stageIndex} from '../dist/builder-stages.js';
import {draftRevision} from '../dist/builder-completion.js';
import {emptyChoiceReview,acceptChoiceReview} from '../dist/builder-choice-review.js';
import {createSavedCompletionApproval} from '../dist/saved-character-completion.js';
import {characterStorageRevision} from '../dist/lib/revision-tokens.js';
import {mayExportGCXRecord,checkGCXExportFreshness,prepareFreshGCXExport,StaleGCXExportError} from '../dist/gcx-export-freshness.js';
import {readGCX,makeGCX} from '../dist/lib/gcx.mjs';
import {setLanguage,copy} from '../dist/locale.js';

const tokenA='12345678-1234-4234-8234-123456789abc';
const tokenB='12345678-1234-4234-8234-987654321abc';
function approvedRecord(){
  const draft=templateCharacter('Fighter');
  const fields=['species','className','background','gamingSet','languages','training','feats','boost','equipment','classMagic','originMagic'];
  const choiceReview=fields.reduce((state,field)=>acceptChoiceReview(state,draft,field),emptyChoiceReview());
  const flow={step:stageIndex('appearance'),unlocked:stageIndex('appearance'),choiceReview,
    waitingForRoll:false,waitingForHP:false,arrayAssigned:[0,1,2,3,4,5],unavailable:false};
  const approval=createSavedCompletionApproval(draft,flow,{mode:'skipped',revision:draftRevision(draft)});
  assert.ok(approval);
  return {id:'fighter-id',_characterRevision:tokenA,draft,completionApproval:approval,
    play:normalizePlay(playProfile(draft),{hp:12}),extraNotes:{player:'private'}};
}
const activeFor=record=>({id:record.id,_characterRevision:record._characterRevision,
  draft:structuredClone(record.draft),eligible:true});

test('GCX requires the exact saved revision; no legacy token, changed ID or missing completion receipt',()=>{
  const saved=approvedRecord();
  assert.equal(mayExportGCXRecord(saved,{...saved}),true);
  assert.equal(mayExportGCXRecord(saved,{...saved,_characterRevision:tokenB}),false);
  assert.equal(mayExportGCXRecord(saved,{...saved,id:'different'}),false);
  assert.equal(mayExportGCXRecord(saved,{...saved,completionApproval:null}),false);
  assert.equal(mayExportGCXRecord({...saved,_characterRevision:null},saved),false);
  assert.equal(mayExportGCXRecord(saved,undefined),false);
});

test('active-builder GCX export requires matching persisted build, revision, ID and current UI approval',()=>{
  const saved=approvedRecord();
  const active=activeFor(saved);
  assert.equal(mayExportGCXRecord(saved,saved,{active}),true);
  assert.equal(mayExportGCXRecord(saved,saved,{active:{...active,draft:{...active.draft,name:'Unsaved edit'}}}),false);
  assert.equal(mayExportGCXRecord(saved,saved,{active:{...active,_characterRevision:tokenB}}),false);
  assert.equal(mayExportGCXRecord(saved,saved,{active:{...active,id:'wrong'}}),false);
  assert.equal(mayExportGCXRecord(saved,saved,{active:{...active,eligible:false}}),false);
  assert.equal(mayExportGCXRecord(saved,saved,{active:null}),false);
  assert.equal(mayExportGCXRecord(saved,saved,{active:{...active,draft:{get name(){throw new Error('bad draft');}}}}),false);
  assert.equal(characterStorageRevision(active),tokenA);
});

test('read failures, removed records and missing revision fail closed without writing to storage',async()=>{
  const saved=approvedRecord();
  let calls=0;
  assert.equal(await checkGCXExportFreshness(saved,async id=>{calls++;assert.equal(id,saved.id);return saved;}),true);
  assert.equal(calls,1);
  assert.equal(await checkGCXExportFreshness(saved,async()=>undefined),false);
  assert.equal(await checkGCXExportFreshness(saved,async()=>{throw new Error('IndexedDB blocked');}),false);
  assert.equal(await checkGCXExportFreshness(saved,undefined),false);
  assert.equal(await checkGCXExportFreshness({...saved,_characterRevision:null},async()=>saved),false);
  assert.equal(await checkGCXExportFreshness(saved,async()=>saved,{getActive:()=>({...activeFor(saved),eligible:false})}),false);
});

test('GCX encoding is never called when the opened character is stale',async()=>{
  const saved=approvedRecord();let encodes=0;
  await assert.rejects(prepareFreshGCXExport(saved,'build',{
    load:async()=>({...saved,_characterRevision:tokenB}),encode:async()=>{encodes++;return {};}
  }),{code:'GCX_STALE_CHARACTER'});
  assert.equal(encodes,0);
});

test('a revision change DURING async GCX generation invalidates the payload',async()=>{
  const saved=approvedRecord();let reads=0;let encoded=0;
  await assert.rejects(prepareFreshGCXExport(saved,'live-snapshot',{
    load:async()=>{reads++;return reads===1?saved:{...saved,_characterRevision:tokenB};},
    encode:async()=>{encoded++;return {fake:'bytes'};}
  }),{code:'GCX_STALE_CHARACTER'});
  assert.equal(reads,2);
  assert.equal(encoded,1);
});

test('changing active editor build mid-encode prevents GCX handoff',async()=>{
  const saved=approvedRecord();let active=activeFor(saved);
  await assert.rejects(prepareFreshGCXExport(saved,'build',{
    load:async()=>saved,getActive:()=>active,
    encode:async()=>{active={...active,draft:{...active.draft,name:'New edit'}};return {};}
  }),{code:'GCX_STALE_CHARACTER'});
});

test('current saved build exports valid Build and Live GCX with stable identity, without browser revision tokens',async()=>{
  const saved=approvedRecord();
  for(const mode of ['build','live-snapshot']){
    const file=await readGCX(await prepareFreshGCXExport(saved,mode,{load:async()=>saved}));
    assert.equal(file.exportMode,mode);
    assert.equal(file.portableCharacterId,'gwen:'+saved.id);
    assert.equal(file.character.name,saved.draft.name);
    assert.equal(JSON.stringify(file).includes(tokenA),false);
    assert.equal(file.preservedExtensions['gwentable/play']===undefined,mode==='build');
  }
});

test('foreign GCX-only records may export when current, without pretending they have a GwenTable receipt',async()=>{
  const source=await makeGCX({sourceApp:'gwentable',sourceBuild:'fixture',exportMode:'build',
    portableCharacterId:'foreign:test',rulesProfile:'USER_CUSTOM',provenance:[],
    character:{name:'Imported private hero',kind:'PC',level:1,classes:[]},preservedExtensions:{}});
  const saved={id:'foreign-id',_characterRevision:tokenA,gcx:source};
  assert.equal(mayExportGCXRecord(saved,saved),true);
  const exported=await readGCX(await prepareFreshGCXExport(saved,'build',{load:async()=>saved}));
  assert.equal(exported.portableCharacterId,source.portableCharacterId);
  assert.equal(exported.character.name,source.character.name);
  assert.equal(mayExportGCXRecord(saved,{...saved,_characterRevision:tokenB}),false);
});

test('GCX entry points, late click guard, cache registration and locale text are wired',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(app,/prepareFreshGCXExport\(opened,mode,opts\)/);
  assert.match(app,/verifyBeforeDelivery:verify/);
  assert.match(app,/link\.addEventListener\('click',async event=>/);
  assert.match(app,/if\(!await verifyBeforeDelivery\(\)\) throw new StaleGCXExportError/);
  assert.match(app,/if\(!await gcxVerify\(current,true\)\) throw new StaleGCXExportError/);
  assert.match(app,/active: true|active:true/);
  assert.match(sw,/\.\/gcx-export-freshness\.js/);
  assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
  const key='A newer version of this character may exist. Save your current build, then reopen the saved character before exporting GCX.';
  setLanguage('en');assert.match(copy(key),/Save your current build/);
  setLanguage('id');try{assert.match(copy(key),/Simpan build/);}finally{setLanguage('en');}
});

test('stale error has a stable code for recovery copy, not a generic test failure',()=>{
  const error=new StaleGCXExportError();
  assert.equal(error.code,'GCX_STALE_CHARACTER');
  assert.match(error.message,/reopen/);
});
