import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter,build} from '../dist/lib/character.js';
import {stageIndex} from '../dist/builder-stages.js';
import {draftRevision} from '../dist/builder-completion.js';
import {emptyChoiceReview,acceptChoiceReview,choiceReviewIssues} from '../dist/builder-choice-review.js';
import {createSavedCompletionApproval,savedCharacterIsComplete,savedCharacterReviewState} from '../dist/saved-character-completion.js';
import {mergeSavedCharacterBuild} from '../dist/saved-character-build.js';
import {makeRosterExport,readRosterExport,makeSavedCharacterExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {makeDraftBackup,readDraftBackup,activeDraftSnapshot,recoverySnapshot} from '../dist/draft-recovery.js';
import {normalizePlay,playProfile} from '../dist/lib/play.js';
import {copy,setLanguage} from '../dist/locale.js';

const makeFixture=(d=templateCharacter('Fighter'))=>{
  const fields=['species','className','background','gamingSet','languages','training','feats','boost','equipment','classMagic','originMagic'];
  const review=fields.reduce((state,key)=>acceptChoiceReview(state,d,key),emptyChoiceReview());
  assert.deepEqual(choiceReviewIssues(d,review),[], 'fixture must approve each relevant choice');
  const flow={step:stageIndex('appearance'),unlocked:stageIndex('appearance'),choiceReview:review,
    waitingForRoll:false,waitingForHP:false,arrayAssigned:[0,1,2,3,4,5],unavailable:false};
  const appearance={mode:'skipped',revision:draftRevision(d)};
  const receipt=createSavedCompletionApproval(d,flow,appearance);
  assert.ok(receipt,'fixture should be eligible for saved completion');
  return {draft:d,completionApproval:receipt,play:normalizePlay(playProfile(d)),playerMemo:'Keep private notes'};
};

test('saved roster entries without verifiable builder confirmation do not authorize Play, even when mechanics validate',()=>{
  const d=templateCharacter('Fighter');
  assert.equal(savedCharacterIsComplete({id:'legacy',draft:d,saved:true}),false);
  assert.equal(savedCharacterReviewState({draft:d}),null);
  assert.equal(savedCharacterIsComplete({draft:d,completionApproval:{version:1}}),false);
});

test('new explicit builder review mints a receipt bound to the exact save and supports restored editing',()=>{
  const record=makeFixture();
  assert.equal(savedCharacterIsComplete(record),true);
  const restored=savedCharacterReviewState(record);
  assert.deepEqual(restored.choiceReview,record.completionApproval.choiceReview);
  assert.deepEqual(restored.appearanceDecision,record.completionApproval.appearanceDecision);
  assert.equal(restored.unlocked,stageIndex('appearance'));
  assert.equal(savedCharacterIsComplete(structuredClone(record)),true);
});

test('completion becomes invalid after character modification, dependent choice change, or stale appearance',()=>{
  const record=makeFixture();
  assert.equal(savedCharacterIsComplete({...record,draft:{...record.draft,name:'Changed'}}),false);
  const changed=build({...record.draft,className:'Wizard'}).draft;
  assert.equal(savedCharacterIsComplete({...record,draft:changed}),false);
  const stale=structuredClone(record);
  stale.completionApproval.appearanceDecision.revision='old';
  assert.equal(savedCharacterIsComplete(stale),false);
});

test('a forged receipt with unconfirmed choice/unsupported version or unfinished stage is rejected',()=>{
  const record=makeFixture();
  for(const change of [
    proof=>{proof.version=999;},
    proof=>{proof.sourceVersion='unverified';},
    proof=>{proof.choiceReview.languages=null;},
    proof=>{proof.choiceReview.className='Other';},
    proof=>{proof.choiceReview.version=0;},
    proof=>{proof.unlocked=stageIndex('review');},
    proof=>{proof.waitingForRoll=true;},
    proof=>{proof.arrayAssigned=[];},
    proof=>{proof.appearanceDecision=null;}
  ]) {
    const candidate=structuredClone(record);
    change(candidate.completionApproval);
    assert.equal(savedCharacterIsComplete(candidate),false);
  }
});

test('receipt creation refuses incomplete flow or suggested-only choices',()=>{
  const d=templateCharacter('Fighter');
  const flow={unlocked:stageIndex('appearance'),choiceReview:emptyChoiceReview(),
    arrayAssigned:[0,1,2,3,4,5],waitingForRoll:false,waitingForHP:false,unavailable:false};
  assert.equal(createSavedCompletionApproval(d,flow,{mode:'skipped',revision:draftRevision(d)}),null);
  const valid=makeFixture(d);
  assert.equal(createSavedCompletionApproval(d,{...flow,choiceReview:valid.completionApproval.choiceReview},null),null);
});

test('editing a saved build preserves full private record but revokes absent prior completion authorization',()=>{
  const original=makeFixture();
  const replacement={id:'saved-id',draft:{...original.draft,name:'Revised'}};
  const merged=mergeSavedCharacterBuild({...original,id:'saved-id',customAddon:{keep:true}},replacement);
  assert.equal(merged.completionApproval,undefined);
  assert.deepEqual(merged.customAddon,{keep:true});
  assert.equal(merged.playerMemo,'Keep private notes');
  assert.ok(merged.play);
  assert.equal(savedCharacterIsComplete(merged),false);
  const reviewed={...replacement,completionApproval:makeFixture(replacement.draft).completionApproval};
  const resaved=mergeSavedCharacterBuild({...original,id:'saved-id'},reviewed);
  assert.equal(savedCharacterIsComplete(resaved),true);
});

test('roster and individual backups preserve private content but never transfer local completion approval',async()=>{
  const original=makeFixture();
  const roster=await makeRosterExport([{...original,id:'local:123'}]);
  assert.equal(JSON.stringify(roster).includes('completionApproval'),false);
  const [imported]=await readRosterExport(JSON.stringify(roster));
  assert.equal(savedCharacterIsComplete(imported),false);
  assert.equal(imported.playerMemo,original.playerMemo);
  const file=await makeSavedCharacterExport(original);
  assert.equal(JSON.stringify(file).includes('completionApproval'),false);
  const copy=await readSavedCharacterExport(JSON.stringify(file));
  assert.equal(savedCharacterIsComplete(copy),false);
  assert.deepEqual(copy.play,original.play);
  assert.equal(copy.playerMemo,original.playerMemo);
});

test('a correctly rehashed roster with injected authorization metadata is still rejected',async()=>{
  const payload=await makeRosterExport([makeFixture()]);
  payload.payload[0].extensions={completionApproval:{version:1,forged:true}};
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'
    ?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
  const {integrity,...body}=payload;
  integrity.value=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(body))))),
    b=>b.toString(16).padStart(2,'0')).join('');
  await assert.rejects(readRosterExport(JSON.stringify(payload)),/invalid extension metadata/);
});

test('draft recovery never leaks saved character completion receipts or trusts imported recovery approval',()=>{
  const approved=makeFixture();
  const base={draft:approved.draft,completionApproval:approved.completionApproval,finished:true,saved:true,
    choiceReview:approved.completionApproval.choiceReview,appearanceDecision:approved.completionApproval.appearanceDecision,
    previousDraft:null,olderDrafts:[]};
  const snapshot=activeDraftSnapshot({envelope:base,draft:base.draft,progress:base,unavailable:null});
  assert.equal(snapshot.completionApproval,undefined);
  const recovery=recoverySnapshot({envelope:base,draft:base.draft,progress:base,unavailable:null});
  assert.equal(recovery.completionApproval,undefined);
  const withReceipt={...base,previousDraft:base,olderDrafts:[base]};
  const exported=makeDraftBackup(withReceipt);
  assert.equal(JSON.stringify(exported).includes('completionApproval'),false);
  const imported=readDraftBackup(JSON.stringify(exported));
  for(const entry of [imported,imported.previousDraft,...imported.olderDrafts]) {
    assert.equal(entry.completionApproval,undefined);
    assert.equal(entry.finished,false);
    assert.equal(entry.appearanceDecision,null);
    assert.deepEqual(entry.choiceReview,emptyChoiceReview());
  }
});

test('Play direct route, saved roster actions, GCX, final PDF and browser print all have completion gates',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const play=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(app,/const approval=createSavedCompletionApproval\(draft,flowState\(\),appearanceDecision\)/);
  assert.match(app,/const approved=savedCharacterIsComplete\(r\)/);
  assert.match(app,/eligibility:\(\)=>savedCharacterIsComplete\(record\)/);
  assert.match(play,/if\(!savedCharacterIsComplete\(saved\)\)/);
  assert.match(play,/if\(type==='print'\)/);
  assert.match(play,/verifyCurrent:\(\)=>checkSavedExportFreshness\(opened/);
  assert.match(worker,/open-5e-v0\.25\.7-inventory-dev/);
  assert.match(worker,/\.\/saved-character-completion\.js/);
});

test('legacy review guidance uses id-ID text but does not modify any SRD mechanic',()=>{
  const d=templateCharacter('Fighter');
  setLanguage('en');
  assert.match(copy('Builder review required before Play, final PDF, or GCX export. Your saved data is preserved.'),/Builder review/);
  setLanguage('id');
  try {
    assert.match(copy('Builder review required before Play, final PDF, or GCX export. Your saved data is preserved.'),/Periksa kembali/);
    assert.equal(savedCharacterIsComplete({draft:d}),false);
  } finally {setLanguage('en');}
});

test('malformed stored records fail closed without crashing the roster approval check',()=>{
  assert.equal(savedCharacterIsComplete({draft:{get model(){throw new Error('bad read');}}}),false);
  assert.equal(savedCharacterIsComplete({draft:[]}),false);
  assert.equal(savedCharacterIsComplete(Object.create(null)),false);
});
