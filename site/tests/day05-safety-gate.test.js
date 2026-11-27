import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build,initialDraft} from '../dist/lib/character.js';
import {stageIndex} from '../dist/builder-stages.js';
import {completionIssues,canOpenFinalSheet,draftRevision} from '../dist/builder-completion.js';
import {
  choiceReviewVersion,emptyChoiceReview,restoreChoiceReview,acceptChoiceReview,
  choiceReviewIssue,choiceReviewIssues,invalidateChoiceReview,reviewedSelection,
  speciesFingerprint,languageFingerprint,trainingFingerprint,featsFingerprint,
  classMagicFingerprint,originMagicFingerprint
} from '../dist/builder-choice-review.js';
import {makeDraftBackup,readDraftBackup} from '../dist/draft-recovery.js';
import {copy,setLanguage} from '../dist/locale.js';

const draft=(clazz='Fighter',species='Human',background='Soldier')=>
  build({...initialDraft(),name:'Local safety fixture',className:clazz,species,background}).draft;
const progress=choiceReview=>({choiceReview,step:stageIndex('appearance'),unlocked:stageIndex('appearance'),
  arrayAssigned:[0,1,2,3,4,5],waitingForRoll:false,waitingForHP:false,unavailable:false});
const approve=(d,state=emptyChoiceReview())=>
  ['species','className','background','gamingSet','languages','training','feats',
   'boost','equipment','classMagic','originMagic'].reduce((r,field)=>acceptChoiceReview(r,d,field),state);

test('v3 new builds require source-bound identity, Class, language and training approval',()=>{
  const d=draft();
  const pending=choiceReviewIssues(d,emptyChoiceReview()).map(x=>x.field);
  for(const key of ['speciesConfirmation','classConfirmation','languagesConfirmation',
    'trainingConfirmation','featsConfirmation']) assert.ok(pending.includes(key),key);
  assert.equal(reviewedSelection(d,emptyChoiceReview(),'species'),null);
  assert.equal(reviewedSelection(d,emptyChoiceReview(),'className'),null);
  assert.equal(reviewedSelection(d,emptyChoiceReview(),'languages'),null);
  assert.equal(canOpenFinalSheet(d,progress(emptyChoiceReview()),
    {mode:'skipped',revision:draftRevision(d)}),false);
  assert.equal(choiceReviewVersion,3);
});

test('v3 approval remains serializable and does not mutate projected mechanical data',()=>{
  const d=draft();const source=JSON.stringify(d),review=approve(d);
  assert.deepEqual(choiceReviewIssues(d,review),[]);
  assert.equal(JSON.stringify(d),source);
  for(const key of ['species','className','languages']) assert.deepEqual(reviewedSelection(d,review,key),d[key]);
  assert.deepEqual(restoreChoiceReview({choiceReview:JSON.parse(JSON.stringify(review))},d),review);
  assert.equal(completionIssues(d,progress(review),{includeProgress:false}).length,0);
});

test('choosing Species does not automatically approve projected lineage or Species skills',()=>{
  const d=draft('Wizard','Human','Sage'),approved=approve(d);
  const changed=build({...d,species:'Elf'}).draft;
  const invalidated=invalidateChoiceReview(approved,'species');
  assert.equal(invalidated.species,null);
  assert.equal(choiceReviewIssue('identity-species',changed,invalidated)?.field,'speciesConfirmation');
  const confirmed=acceptChoiceReview(invalidated,changed,'species');
  assert.equal(choiceReviewIssue('identity-species',changed,confirmed),null);
  assert.equal(confirmed.className,approved.className);
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  assert.match(app,/if\(key==='species'\) choiceReview=invalidateChoiceReview\(choiceReview,'species'\)/);
});

test('Species lineage/skill edits invalidate Species review without erasing independent notes',()=>{
  const d=build({...draft('Wizard','Elf','Sage'),story:'Kept between visits',lineage:'Drow'}).draft;
  const accepted=approve(d);
  const alternative=build({...d,lineage:'High Elf'}).draft;
  assert.notEqual(speciesFingerprint(d),speciesFingerprint(alternative));
  assert.equal(choiceReviewIssue('identity-species',alternative,accepted)?.field,'speciesConfirmation');
  assert.equal(alternative.story,d.story);
  assert.equal(choiceReviewIssue('class',alternative,accepted),null);
});

test('Class change clears dependent confirmations, but leaves Species intact',()=>{
  const d=draft(),accepted=approve(d);
  const wizard=build({...d,className:'Wizard'}).draft;
  const invalidated=invalidateChoiceReview(accepted,'className');
  assert.equal(choiceReviewIssue('identity-species',wizard,invalidated),null);
  for(const stage of ['class','languages','training','equipment'])
    assert.ok(choiceReviewIssues(wizard,invalidated).some(issue=>issue.stage===stage),stage);
  assert.equal(invalidated.background,accepted.background);
  assert.equal(invalidated.classMagic,null);
});

test('Language review is source-sensitive, including the Rogue additional language',()=>{
  const d=draft('Rogue'),accepted=approve(d);
  assert.equal(choiceReviewIssue('languages',d,accepted),null);
  const extra=build({...d,extraLanguages:['Elvish']}).draft;
  assert.notEqual(languageFingerprint(extra),languageFingerprint(d));
  assert.equal(choiceReviewIssue('languages',extra,accepted)?.field,'languagesConfirmation');
  assert.equal(extra.name,d.name);
});

test('Human feat choice, Class training and ordinary Class spells have separate approval identities',()=>{
  const d=draft('Wizard','Human','Sage');
  const review=approve(d);
  assert.ok(featsFingerprint(d));
  assert.ok(trainingFingerprint(d));
  assert.ok(classMagicFingerprint(d));
  assert.ok(originMagicFingerprint(d));
  const feat=build({...d,humanFeat:'Skilled'}).draft;
  assert.equal(choiceReviewIssue('feats',feat,review)?.field,'featsConfirmation');
  const preparedControl=build(d).controls.find(c=>c.key==='prepared');
  const other=preparedControl.options.find(value=>!d.prepared.includes(value));
  assert.ok(other);
  const prepared=build({...d,prepared:[...d.prepared.slice(0,-1),other]}).draft;
  assert.equal(choiceReviewIssue('classMagic',prepared,review)?.field,'classMagicConfirmation');
  assert.equal(choiceReviewIssue('identity-species',prepared,review),null);
  const originControl=build(d).controls.find(c=>c.key==='backgroundMagicSpell');
  const newOrigin=originControl.options.find(value=>value!==d.backgroundMagicSpell);
  const origin=build({...d,backgroundMagicSpell:newOrigin}).draft;
  assert.equal(choiceReviewIssue('magic',origin,review)?.field,'originMagicConfirmation');
  assert.equal(classMagicFingerprint(origin),classMagicFingerprint(d));
});

test('v2 progress migration credits only traversed stages, not unvisited defaults',()=>{
  const d=draft('Wizard','Human','Sage');
  const old={choiceReview:{version:2,background:d.background,gamingSet:null,
    boost:null,equipment:null,originMagic:null},saved:false};
  const early=restoreChoiceReview(old,d,{unlocked:stageIndex('class')});
  assert.equal(early.species,speciesFingerprint(d));
  assert.equal(early.className,null);
  assert.equal(early.languages,null);
  assert.equal(early.classMagic,null);
  const advanced=restoreChoiceReview(old,d,{unlocked:stageIndex('appearance')});
  assert.equal(advanced.languages,languageFingerprint(d));
  assert.equal(advanced.classMagic,classMagicFingerprint(d));
  assert.equal(advanced.boost,null); // v2 approval was never recorded
  assert.equal(advanced.equipment,null);
  const restored=restoreChoiceReview({choiceReview:advanced},d,{unlocked:0});
  assert.deepEqual(restored,advanced);
});

test('backup import cannot smuggle v3 completion approvals from the active or recovery drafts',()=>{
  const d=draft(),approved=approve(d);
  const record={draft:d,choiceReview:approved,finished:true,saved:true,appearanceDecision:{mode:'skipped'},
    unknownPluginField:{stable:'keep me'}};
  const recovered=readDraftBackup(JSON.stringify(makeDraftBackup({...record,
    previousDraft:record,olderDrafts:[record]})));
  for(const item of [recovered,recovered.previousDraft,...recovered.olderDrafts]) {
    assert.deepEqual(item.choiceReview,emptyChoiceReview());
    assert.equal(item.finished,false);
    assert.deepEqual(item.unknownPluginField,{stable:'keep me'});
  }
});

test('EN/id-ID confirmation explanations do not change source IDs, value fingerprints or approval',()=>{
  const d=draft('Wizard','Elf','Sage'),a=approve(d);
  const fp=classMagicFingerprint(d);
  setLanguage('en');assert.equal(copy('Confirm Class spells'),'Confirm Class spells');
  setLanguage('id');
  try {assert.notEqual(copy('Confirm Class spells'),'Confirm Class spells');
    assert.notEqual(copy('Confirm Species choices'),'Confirm Species choices');
    assert.equal(classMagicFingerprint(d),fp);
    assert.deepEqual(choiceReviewIssues(d,a),[]);
  } finally {setLanguage('en');}
});

test('UI wires actual source-backed confirm buttons and does not imply a public deployment',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  for(const field of ['species','className','languages','training','feats','classMagic'])
    assert.ok(app.includes(`field:'${field}'`)||app.includes(`field:${JSON.stringify(field)}`),`UI field ${field}`);
  assert.match(app,/choiceConfirmationSaving=true/);
  assert.match(app,/const saved=await persist\(\)/);
});
