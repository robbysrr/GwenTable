import test from 'node:test';
import assert from 'node:assert/strict';
import {build,initialDraft,deriveCharacter,templateCharacter} from '../dist/lib/character.js';
import {stages,stageIndex} from '../dist/builder-stages.js';
import {completionIssues,confirmAppearance,canOpenFinalSheet,draftRevision} from '../dist/builder-completion.js';
import {emptyChoiceReview,acceptChoiceReview,reviewedSelection,choiceReviewIssue,choiceReviewIssues,boostFingerprint,equipmentFingerprint,restoreChoiceReview,invalidateChoiceReview} from '../dist/builder-choice-review.js';
import {planBackgroundChange,backgroundBenefits} from '../dist/background-choice.js';
import {makeDraftBackup,readDraftBackup} from '../dist/draft-recovery.js';
import {setLanguage,copy} from '../dist/locale.js';

const named=(background='Soldier')=>build({...initialDraft(),name:'Ada Tester',species:'Dwarf',background}).draft;
const progress=(state)=>({choiceReview:state,step:stageIndex('appearance'),unlocked:stageIndex('appearance'),arrayAssigned:[0,1,2,3,4,5],waitingForRoll:false,waitingForHP:false,unavailable:false});
const approveAll=(draft,state)=>['species','className','background','gamingSet','languages','training','feats','boost','equipment','classMagic','originMagic'].reduce((s,field)=>acceptChoiceReview(s,draft,field),state);

test('fresh character projections remain unresolved in serializable intent, without corrupting the SRD engine',()=>{
  const d=named();
  const review=emptyChoiceReview();
  assert.equal(review.version,3);
  for(const key of ['background','gamingSet','boost','kit','backgroundKit']) {
    assert.ok(d[key]!==null,`Mechanics projection ${key} remains supported for legacy rules engine`);
    assert.equal(reviewedSelection(d,review,key),null,`${key} was not chosen`);
  }
  assert.deepEqual(choiceReviewIssues(d,review).map(x=>x.field),[
    'speciesConfirmation','classConfirmation','backgroundConfirmation','gamingSetConfirmation',
    'languagesConfirmation','boostConfirmation','trainingConfirmation','equipmentConfirmation']);
  assert.equal(canOpenFinalSheet(d,progress(review),{mode:'skipped',revision:draftRevision(d)}),false);
  assert.equal(confirmAppearance(d,progress(review),'skipped'),null);
});

test('explicit intent persists as a separate, source-sensitive record and allows valid completion',()=>{
  const d=named();
  let review=approveAll(d,emptyChoiceReview());
  for(const key of ['background','gamingSet','boost','kit','backgroundKit']) assert.equal(reviewedSelection(d,review,key),d[key]);
  assert.deepEqual(completionIssues(d,progress(review),{includeProgress:false}),[]);
  const approval=confirmAppearance(d,progress(review),'skipped');
  assert.ok(approval);
  assert.equal(canOpenFinalSheet(d,progress(review),approval),true);
  assert.deepEqual(restoreChoiceReview({choiceReview:JSON.parse(JSON.stringify(review))},d,{unlocked:stageIndex('appearance')}),review);
});

test('Background change preserves unrelated character and invalidates only source-dependent decisions',()=>{
  const before=named();
  const approved=approveAll(before,emptyChoiceReview());
  const plan=planBackgroundChange(before,'Criminal');
  assert.equal(plan.blocked,undefined);
  assert.equal(plan.candidate.name,before.name);
  assert.equal(plan.candidate.species,before.species);
  assert.equal(plan.candidate.className,before.className);
  assert.equal(reviewedSelection(plan.candidate,approved,'boost'),null);
  assert.equal(reviewedSelection(plan.candidate,approved,'backgroundKit'),null);
  assert.equal(choiceReviewIssue('abilities',plan.candidate,approved).field,'boostConfirmation');
  assert.equal(choiceReviewIssue('equipment',plan.candidate,approved).field,'equipmentConfirmation');
  assert.equal(choiceReviewIssue('background',plan.candidate,approved).field,'backgroundConfirmation');
  const newApproval=acceptChoiceReview(approved,plan.candidate,'background');
  assert.equal(choiceReviewIssue('equipment',plan.candidate,newApproval).field,'equipmentConfirmation');
  assert.equal(choiceReviewIssue('abilities',plan.candidate,newApproval).field,'boostConfirmation');
  assert.deepEqual(deriveCharacter(before).inventory,deriveCharacter(before).inventory);
});

test('changing ability pattern or equipment without changing source makes old review stale',()=>{
  const d=named();
  const approved=approveAll(d,emptyChoiceReview());
  const boosted=build({...d,boost:'1,1,1'}).draft;
  assert.notEqual(boostFingerprint(boosted),boostFingerprint(d));
  assert.equal(choiceReviewIssue('abilities',boosted,approved).field,'boostConfirmation');
  assert.equal(choiceReviewIssue('equipment',boosted,approved),null);
  const changed=build({...d,backgroundKit:d.backgroundKit==='A'?'B':'A'}).draft;
  assert.notEqual(equipmentFingerprint(changed),equipmentFingerprint(d));
  assert.equal(choiceReviewIssue('equipment',changed,approved).field,'equipmentConfirmation');
  assert.equal(reviewedSelection(changed,approved,'kit'),null);
  assert.equal(choiceReviewIssue('abilities',changed,approved),null);
  const otherClass=build({...d,className:'Wizard'}).draft;
  assert.equal(choiceReviewIssue('equipment',otherClass,approved).field,'equipmentConfirmation');
});

test('v1 envelope receives non-destructive historic review inferred ONLY from completed stages',()=>{
  const d=named();
  const v1={choiceReview:{version:1,background:'Soldier',gamingSet:d.gamingSet,originMagic:null}};
  const atBackground=restoreChoiceReview(v1,d,{unlocked:stageIndex('background')});
  assert.equal(atBackground.boost,null);
  assert.equal(atBackground.equipment,null);
  assert.equal(atBackground.version,3);
  const atEquipment=restoreChoiceReview(v1,d,{unlocked:stageIndex('equipment')});
  assert.equal(atEquipment.boost,boostFingerprint(d));
  assert.equal(atEquipment.equipment,null);
  const advanced=restoreChoiceReview(v1,d,{unlocked:stageIndex('magic')});
  assert.equal(advanced.boost,boostFingerprint(d));
  assert.equal(advanced.equipment,equipmentFingerprint(d));
  assert.equal(advanced.background,'Soldier');
  const fresh=restoreChoiceReview(null,d,{unlocked:stageIndex('appearance')});
  assert.deepEqual(fresh,emptyChoiceReview());
});

test('new backup and nested recovery snapshots revoke every approved choice, preserving the draft itself',()=>{
  const d=named();
  const review=approveAll(d,emptyChoiceReview());
  const raw={draft:d,choiceReview:review,saved:true,finished:true,appearanceDecision:{mode:'skipped',revision:draftRevision(d)},customFlag:{version:16}};
  const loaded=readDraftBackup(JSON.stringify(makeDraftBackup({...raw,previousDraft:raw,olderDrafts:[raw]})));
  for(const entry of [loaded,loaded.previousDraft,...loaded.olderDrafts]) {
    assert.deepEqual(entry.choiceReview,emptyChoiceReview());
    assert.deepEqual(entry.customFlag,{version:16});
    assert.deepEqual(entry.draft,d);
    assert.equal(entry.saved,false);
    assert.equal(entry.finished,false);
  }
});

test('Background grant metadata signals unresolved until relevant user confirmation, idempotently',()=>{
  const d=named();
  const before=backgroundBenefits('Soldier',d,emptyChoiceReview());
  assert.equal(before.abilityPlan.selectedBoost,null);
  assert.equal(before.equipmentPlan.selected,null);
  const reviewed=approveAll(d,emptyChoiceReview());
  const after=backgroundBenefits('Soldier',d,reviewed);
  assert.equal(after.abilityPlan.selectedBoost,d.boost);
  assert.equal(after.equipmentPlan.selected,d.backgroundKit);
  assert.deepEqual(after.grants,before.grants);
  assert.equal(new Set(after.grants.map(x=>x.effectId)).size,after.grants.length);
});

test('localized prompts do not change stable intent fingerprints or official source IDs',()=>{
  const d=named('Sage');
  const f=boostFingerprint(d),g=equipmentFingerprint(d);
  setLanguage('en');
  assert.equal(copy('Confirm Ability Score increases'),'Confirm Ability Score increases');
  setLanguage('id');
  try {
    assert.notEqual(copy('Confirm Ability Score increases'),'Confirm Ability Score increases');
    assert.notEqual(copy('Confirm starting equipment'),'Confirm starting equipment');
    assert.equal(boostFingerprint(d),f);
    assert.equal(equipmentFingerprint(d),g);
    assert.equal(backgroundBenefits('Sage',d).sourceId,'srd-5.2.1:background:sage');
  }finally{setLanguage('en');}
});


test('switching Background away and back cannot revive a formerly confirmed dependency',()=>{
  const d=named('Soldier');
  let confirmed=approveAll(d,emptyChoiceReview());
  const next=build({...d,background:'Criminal'}).draft;
  confirmed=acceptChoiceReview(invalidateChoiceReview(confirmed,'background'),next,'background');
  assert.equal(confirmed.boost,null);
  assert.equal(confirmed.equipment,null);
  const restored=build({...next,background:'Soldier'}).draft;
  confirmed=acceptChoiceReview(invalidateChoiceReview(confirmed,'background'),restored,'background');
  assert.equal(choiceReviewIssue('abilities',restored,confirmed).field,'boostConfirmation');
  assert.equal(choiceReviewIssue('equipment',restored,confirmed).field,'equipmentConfirmation');
  assert.equal(choiceReviewIssue('gamingSet',restored,confirmed).field,'gamingSetConfirmation');
});

test('Class changes preserve an independent Background approval but reopen Class kit and Magic Initiate',()=>{
  const d=named('Sage');
  let confirmed=approveAll(d,emptyChoiceReview());
  confirmed=invalidateChoiceReview(confirmed,'className');
  assert.equal(confirmed.background,'Sage');
  assert.equal(confirmed.boost,boostFingerprint(d));
  assert.equal(confirmed.equipment,null);
  assert.equal(confirmed.originMagic,null);
});
