import test from 'node:test';
import assert from 'node:assert/strict';
import {backgroundBenefits,planBackgroundChange} from '../dist/background-choice.js';
import {backgrounds,gamingSets} from '../dist/lib/catalog.js';
import {build,initialDraft,deriveCharacter} from '../dist/lib/character.js';
import {emptyChoiceReview,acceptChoiceReview,restoreChoiceReview,choiceReviewIssue,choiceReviewIssues} from '../dist/builder-choice-review.js';
import {stageIndex} from '../dist/builder-stages.js';
import {createLatestDraftWriter,snapshotPersistenceRevision} from '../dist/persist-state.js';
import {copy,setLanguage} from '../dist/locale.js';
import {beginnerTerms} from '../dist/beginner-help.js';

const soldier=()=>build({...initialDraft(),species:'Dwarf',name:'Source-safe Soldier',background:'Soldier'}).draft;
const packages={
  Acolyte:['Calligrapher’s Supplies','Book (prayers)','Holy Symbol','Parchment (10 sheets)','Robe'],
  Criminal:['2 Daggers','Thieves’ Tools','Crowbar','2 Pouches','Traveler’s Clothes'],
  Sage:['Quarterstaff','Calligrapher’s Supplies','Book (history)','Parchment (8 sheets)','Robe'],
  Soldier:['Spear','Shortbow','20 Arrows','Gaming Set','Healer’s Kit','Quiver','Traveler’s Clothes']
};

test('D04 p83 source IDs, exact item packages, mutually exclusive coins and derived effect IDs',()=>{
  assert.deepEqual(Object.keys(backgrounds),Object.keys(packages));
  for(const [name,items] of Object.entries(packages)){
    const b=backgroundBenefits(name);
    assert.equal(b.id,`srd-5.2.1:background:${name.toLowerCase()}`);
    assert.equal(b.sourceId,b.id);
    assert.equal(b.page,83);
    assert.deepEqual(b.equipment[0].items,items);
    assert.equal(b.equipment[1].gp,50);
    assert.deepEqual(b.equipment[1].items,[]);
    assert.equal(b.abilityPlan.status,'pending-abilities-review');
    assert.deepEqual(b.abilityPlan.patterns,['+2/+1 distinct','+1/+1/+1']);
    assert.equal(b.abilityPlan.cap,20);
    assert.equal(b.equipmentPlan.status,'pending-equipment-review');
    assert.equal(new Set(b.grants.map(x=>x.effectId)).size,b.grants.length);
    assert.ok(b.grants.every(x=>x.sourceType==='background'&&x.sourceId===b.id&&x.appliedVersion==='5.2.1'));
  }
});

test('Soldier Gaming Set is explicitly pending; its choice stays paired to kit A',()=>{
  const draft=soldier();
  assert.ok(gamingSets.includes(draft.gamingSet));
  assert.equal(backgroundBenefits('Soldier',draft,emptyChoiceReview()).tool.confirmationPending,true);
  let state=acceptChoiceReview(emptyChoiceReview(),draft,'background');
  assert.equal(choiceReviewIssue('gamingSet',draft,state).field,'gamingSetConfirmation');
  state=acceptChoiceReview(state,draft,'gamingSet');
  assert.equal(choiceReviewIssue('gamingSet',draft,state),null);
  assert.equal(backgroundBenefits('Soldier',draft,state).tool.confirmationPending,false);
  assert.ok(backgroundBenefits('Soldier',draft,state).equipment[0].items.includes(draft.gamingSet));
  const alt=gamingSets.find(s=>s!==draft.gamingSet);
  const changed=build({...draft,gamingSet:alt}).draft;
  assert.equal(choiceReviewIssue('gamingSet',changed,state).field,'gamingSetConfirmation');
  assert.ok(backgroundBenefits('Soldier',changed,state).equipment[0].items.includes(alt));
  assert.ok(!backgroundBenefits('Soldier',changed,state).equipment[0].items.includes(draft.gamingSet));
});

test('new, grandfathered and imported confirmation states distinguish unresolved intent',()=>{
  const draft=soldier();
  assert.equal(restoreChoiceReview(null,draft,{unlocked:0}).gamingSet,null);
  const old={choiceReview:{version:1,background:'Soldier',originMagic:null},saved:false};
  const pending=restoreChoiceReview(old,draft,{unlocked:stageIndex('background')});
  assert.equal(pending.gamingSet,null);
  const advanced=restoreChoiceReview(old,draft,{unlocked:stageIndex('abilities')});
  assert.equal(advanced.gamingSet,draft.gamingSet);
  const newSoldier=planBackgroundChange(build({...draft,background:'Sage'}).draft,'Soldier').candidate;
  assert.ok(backgroundBenefits('Soldier',newSoldier));
});

test('all eighteen relevant glossary terms have exactly two natural localized examples',()=>{
  const required=['Background','Origin Feat','Feat','Skill Proficiency','Tool Proficiency','Gaming Set','Ability Score','Ability Score Improvement','Starting Equipment','GP','Magic Initiate'];
  for(const term of required){
    const {definition,examples,why}=beginnerTerms[term];
    assert.equal(examples.length,2,term);
    setLanguage('id');
    try {
      for(const sentence of [definition,...examples,why]) assert.notEqual(copy(sentence),sentence,term);
    } finally {setLanguage('en');}
  }
});

test('a Background change retains independent traits, equipment and custom fields while derived grants stay stable',()=>{
  const first=soldier();
  const original=structuredClone(first);
  const changes=planBackgroundChange(first,'Sage');
  assert.deepEqual(first,original);
  assert.ok(changes.changes.some(x=>x.key==='background:originFeat'));
  for(const key of ['name','species','className','level','scores','kit']) assert.deepEqual(changes.candidate[key],first[key]);
  let draft=first;
  for(let i=0;i<4;i++){
    draft=planBackgroundChange(draft,'Sage').candidate;
    draft=planBackgroundChange(draft,'Soldier').candidate;
  }
  assert.deepEqual(deriveCharacter(draft).inventory,deriveCharacter(first).inventory);
  assert.equal(deriveCharacter(draft).gp,deriveCharacter(first).gp);
});

test('persistence snapshot signature includes confirmations, not only the SRD mechanics',()=>{
  const draft=soldier();
  const base={draft,id:'fixture',step:2,unlocked:2,choiceReview:emptyChoiceReview(),waitingForRoll:false};
  const chosen={...base,choiceReview:acceptChoiceReview(base.choiceReview,draft,'gamingSet')};
  assert.notEqual(snapshotPersistenceRevision(base),snapshotPersistenceRevision(chosen));
  assert.equal(snapshotPersistenceRevision({...base,previousDraft:{arbitrary:'history'}}),snapshotPersistenceRevision(base));
});

test('latest queued write never reports earlier choice-review snapshot as saved',async()=>{
  const draft=soldier();
  const first={draft,choiceReview:emptyChoiceReview()};
  const second={draft,choiceReview:acceptChoiceReview(first.choiceReview,draft,'background')};
  const statuses=[];let release;
  let current=second;
  const write=createLatestDraftWriter({save:snapshot=>new Promise(resolve=>{if(snapshot===first){release=resolve;}else resolve();}),
    currentRevision:()=>snapshotPersistenceRevision(current),onStatus:value=>statuses.push(value)});
  const a=write(first),b=write(second);
  await Promise.resolve();release();
  assert.equal(await a,false,'earlier queued snapshot cannot acknowledge current edits');assert.equal(await b,true);
  assert.deepEqual(statuses,['saving','saving','saved']);
});

test('failure stays failed until successful retry and never becomes false success',async()=>{
  const draft=soldier(),snapshot={draft,choiceReview:emptyChoiceReview()};
  const statuses=[];let failing=true;
  const write=createLatestDraftWriter({save:async()=>{if(failing)throw new Error('QuotaExceededError');},
    currentRevision:()=>snapshotPersistenceRevision(snapshot),onStatus:s=>statuses.push(s)});
  assert.equal(await write(snapshot),false);
  assert.deepEqual(statuses,['saving','failed']);
  failing=false;
  assert.equal(await write(snapshot),true);
  assert.deepEqual(statuses,['saving','failed','saving','saved']);
});
