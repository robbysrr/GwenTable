import test from 'node:test';
import assert from 'node:assert/strict';
import {build,initialDraft,templateCharacter,deriveCharacter} from '../dist/lib/character.js';
import {stageIndex} from '../dist/builder-stages.js';
import {completionIssues,canOpenFinalSheet,confirmAppearance,draftRevision} from '../dist/builder-completion.js';
import {emptyChoiceReview,restoreChoiceReview,acceptChoiceReview,choiceReviewIssue,originMagicChoices,originMagicFingerprint} from '../dist/builder-choice-review.js';
import {makeDraftBackup,readDraftBackup} from '../dist/draft-recovery.js';
import {setLanguage} from '../dist/locale.js';

const fullProgress={step:stageIndex('appearance'),unlocked:stageIndex('appearance'),waitingForRoll:false,waitingForHP:false,arrayAssigned:[0,1,2,3,4,5],unavailable:false};
const named=(className='Fighter',background='Soldier')=>build({...templateCharacter(className),background,name:'Wynn Example'}).draft;
const approveNewStages=(draft,state)=>['species','className','languages','training','feats','classMagic'].reduce((r,key)=>acceptChoiceReview(r,draft,key),state);

// The canonical engine deliberately fills initial choices. Only the separate UI envelope can attest that the player reviewed them.
test('fresh draft keeps mechanic projections while Background remains unconfirmed',()=>{
  const draft=build({...initialDraft(),name:'Wynn Example'}).draft;
  const fresh=restoreChoiceReview(null,draft,{unlocked:0});
  assert.deepEqual(fresh,emptyChoiceReview());
  assert.equal(draft.background,'Soldier');
  assert.equal(choiceReviewIssue('background',draft,fresh).field,'backgroundConfirmation');
  const progress={...fullProgress,choiceReview:fresh};
  assert.ok(completionIssues(draft,progress,{includeProgress:false}).some(issue=>issue.field==='backgroundConfirmation'));
  assert.equal(confirmAppearance(draft,progress,'reviewed'),null);
  assert.equal(canOpenFinalSheet(draft,progress,{mode:'reviewed',revision:draftRevision(draft)}),false);
  const confirmed=acceptChoiceReview(approveNewStages(draft,fresh),draft,'background');
  assert.equal(choiceReviewIssue('background',draft,confirmed),null);
  assert.deepEqual(deriveCharacter(draft),deriveCharacter(draft));
  assert.deepEqual(completionIssues(draft,{...progress,choiceReview:confirmed},{includeProgress:false}).map(issue=>issue.field),['gamingSetConfirmation','boostConfirmation','equipmentConfirmation']);
  const toolAccepted=acceptChoiceReview(confirmed,draft,'gamingSet');
  assert.deepEqual(completionIssues(draft,{...progress,choiceReview:toolAccepted},{includeProgress:false}).map(issue=>issue.field),['boostConfirmation','equipmentConfirmation']);
  const ready=acceptChoiceReview(acceptChoiceReview(toolAccepted,draft,'boost'),draft,'equipment');
  assert.deepEqual(completionIssues(draft,{...progress,choiceReview:ready},{includeProgress:false}),[]);
});

test('Background acknowledgement is tied to selected record and old acknowledgement cannot approve a change',()=>{
  const soldier=named();
  const state=acceptChoiceReview(emptyChoiceReview(),soldier,'background');
  const acolyte=build({...soldier,background:'Acolyte'}).draft;
  assert.equal(choiceReviewIssue('background',acolyte,state).field,'backgroundConfirmation');
  assert.ok(choiceReviewIssue('magic',acolyte,state));
  const accepted=acceptChoiceReview(state,acolyte,'background');
  assert.equal(choiceReviewIssue('background',acolyte,accepted),null);
  assert.ok(choiceReviewIssue('magic',acolyte,accepted));
  assert.equal(acolyte.backgroundMagicCantrips.length,2);
});

test('Magic Initiate acknowledgement captures all three projected choices and becomes stale on edit',()=>{
  const sage=named('Wizard','Sage');
  const controls=originMagicChoices(sage);
  assert.deepEqual(controls.map(c=>c.key),['backgroundMagicAbility','backgroundMagicCantrips','backgroundMagicSpell']);
  assert.equal(controls.find(c=>c.key==='backgroundMagicCantrips').count,2);
  let state=acceptChoiceReview(emptyChoiceReview(),sage,'background');
  assert.equal(choiceReviewIssue('magic',sage,state).field,'originMagicConfirmation');
  state=acceptChoiceReview(state,sage,'originMagic');
  assert.equal(choiceReviewIssue('magic',sage,state),null);
  const option=controls.find(c=>c.key==='backgroundMagicSpell').options.find(x=>x!==sage.backgroundMagicSpell);
  const edited=build({...sage,backgroundMagicSpell:option}).draft;
  assert.ok(originMagicFingerprint(edited)!==originMagicFingerprint(sage));
  assert.equal(choiceReviewIssue('magic',edited,state).field,'originMagicConfirmation');
  assert.equal(canOpenFinalSheet(edited,{...fullProgress,choiceReview:state},{mode:'reviewed',revision:draftRevision(edited)}),false);
  const reaccepted=acceptChoiceReview(state,edited,'originMagic');
  assert.equal(choiceReviewIssue('magic',edited,reaccepted),null);
});

test('a non-Magic-Initiate Background never adds fake magic gates',()=>{
  for(const background of ['Criminal','Soldier']) {
    const draft=build({...named('Fighter',background),species:'Dwarf'}).draft;
    assert.equal(originMagicFingerprint(draft),null);
    const state=acceptChoiceReview(emptyChoiceReview(),draft,'background');
    assert.equal(choiceReviewIssue('magic',draft,state),null);
  }
});

test('new Magic Initiate characters cannot finish until both acknowledgement stages are completed',()=>{
  const draft=named('Wizard','Sage');
  const state=acceptChoiceReview(approveNewStages(draft,emptyChoiceReview()),draft,'background');
  assert.deepEqual(completionIssues(draft,{...fullProgress,choiceReview:state},{includeProgress:false}).map(x=>x.field),['boostConfirmation','equipmentConfirmation','originMagicConfirmation']);
  const both=acceptChoiceReview(acceptChoiceReview(acceptChoiceReview(state,draft,'boost'),draft,'equipment'),draft,'originMagic');
  const flow={...fullProgress,choiceReview:both};
  assert.deepEqual(completionIssues(draft,flow),[]);
  const appearance=confirmAppearance(draft,flow,'skipped');
  assert.ok(appearance);
  assert.equal(canOpenFinalSheet(draft,flow,appearance),true);
});

test('legacy completed characters remain usable, but genuinely fresh drafts cannot inherit their approval',()=>{
  const draft=named('Wizard','Sage');
  const legacy=restoreChoiceReview({saved:true,unlockedStage:'appearance'},draft,{unlocked:stageIndex('appearance')});
  assert.equal(choiceReviewIssue('background',draft,legacy),null);
  assert.equal(choiceReviewIssue('magic',draft,legacy),null);
  const partial=restoreChoiceReview({saved:false,unlockedStage:'class'},draft,{unlocked:stageIndex('class')});
  assert.ok(choiceReviewIssue('background',draft,partial));
  assert.ok(choiceReviewIssue('magic',draft,partial));
  const visitedBackground=restoreChoiceReview({unlockedStage:'abilities'},draft,{unlocked:stageIndex('abilities')});
  assert.equal(choiceReviewIssue('background',draft,visitedBackground),null);
  assert.ok(choiceReviewIssue('magic',draft,visitedBackground));
});

test('draft backup preserves exact source but discards even structurally valid imported choice confirmations',()=>{
  const draft=named('Wizard','Sage');
  const state=acceptChoiceReview(acceptChoiceReview(emptyChoiceReview(),draft,'background'),draft,'originMagic');
  const backup=makeDraftBackup({draft,choiceReview:state,finished:true,appearanceDecision:{mode:'reviewed',revision:draftRevision(draft)}});
  const loaded=readDraftBackup(JSON.stringify(backup));
  assert.deepEqual(loaded.draft,draft);
  assert.deepEqual(loaded.choiceReview,emptyChoiceReview());
  assert.equal(loaded.finished,false);
  assert.equal(loaded.appearanceDecision,null);
});

test('selection fingerprints and mechanics never depend on English or Indonesian UI locale',()=>{
  const draft=named('Wizard','Acolyte');
  setLanguage('en');
  const en=originMagicFingerprint(draft);
  const mechanical=deriveCharacter(draft);
  setLanguage('id');
  try {
    assert.equal(originMagicFingerprint(draft),en);
    assert.deepEqual(deriveCharacter(draft),mechanical);
  } finally {setLanguage('en');}
});

test('nested backup history cannot smuggle saved status, IDs or confirmation authority',()=>{
  const draft=named('Wizard','Acolyte');
  const forged={draft,id:'sensitive-original',draftId:'sensitive-original',saved:true,finished:true,
    appearanceDecision:{mode:'reviewed',revision:draftRevision(draft)},
    choiceReview:acceptChoiceReview(acceptChoiceReview(emptyChoiceReview(),draft,'background'),draft,'originMagic'),
    'custom:source':{id:'private:fixture'}};
  const loaded=readDraftBackup(JSON.stringify(makeDraftBackup({...forged,previousDraft:forged,olderDrafts:[forged]})));
  for(const record of [loaded,loaded.previousDraft,...loaded.olderDrafts]) {
    assert.equal(record.id,null);
    assert.equal(record.saved,false);
    assert.equal(record.finished,false);
    assert.equal(record.appearanceDecision,null);
    assert.deepEqual(record.choiceReview,emptyChoiceReview());
    assert.deepEqual(record.draft,draft);
    assert.deepEqual(record['custom:source'],{'id':'private:fixture'});
  }
});

test('Human Magic Initiate also requires review of its chosen spell list and three magic controls',()=>{
  const draft=build({...named('Fighter','Soldier'),species:'Human',humanFeat:'Magic Initiate'}).draft;
  const choices=originMagicChoices(draft);
  assert.deepEqual(choices.map(choice=>choice.key),['humanFeatList','humanFeatAbility','humanFeatCantrips','humanFeatSpell']);
  const backgroundOnly=acceptChoiceReview(emptyChoiceReview(),draft,'background');
  assert.equal(choiceReviewIssue('magic',draft,backgroundOnly).field,'originMagicConfirmation');
  const confirmed=acceptChoiceReview(backgroundOnly,draft,'originMagic');
  assert.equal(choiceReviewIssue('magic',draft,confirmed),null);
  const control=choices.find(choice=>choice.key==='humanFeatList');
  const list=control.options.find(value=>value!==draft.humanFeatList);
  const other=build({...draft,humanFeatList:list}).draft;
  assert.equal(choiceReviewIssue('magic',other,confirmed).field,'originMagicConfirmation');
});

test('switching a Human from Soldier to Criminal surfaces auto-substituted Origin Magic Initiate rather than silently approving it',()=>{
  const source=named('Fighter','Soldier');
  assert.equal(source.humanFeat,'Alert');
  const changed=build({...source,background:'Criminal'}).draft;
  assert.equal(changed.humanFeat,'Magic Initiate'); // Alert is now granted by Criminal.
  assert.ok(originMagicChoices(changed).length);
  const state=acceptChoiceReview(emptyChoiceReview(),changed,'background');
  assert.equal(choiceReviewIssue('magic',changed,state).field,'originMagicConfirmation');
});
