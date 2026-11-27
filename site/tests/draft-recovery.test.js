import test from 'node:test';
import assert from 'node:assert/strict';
import {activeDraftSnapshot,recoverySnapshot,makeDraftBackup,readDraftBackup,recoveryLabel,draftBackupLimit} from '../dist/draft-recovery.js';
import {readBuilderDraft,confirmAppearance} from '../dist/builder-completion.js';
import {build,templateCharacter} from '../dist/lib/character.js';
import {stageIndex} from '../dist/builder-stages.js';
const raw={model:1,name:'Mira 石',species:'private:ancestry',customSource:{id:'fixture:pack',version:1},inventory:['keepsake']};

test('active backup and recovery snapshot retain raw data and envelope provenance without aliasing',()=>{
  const envelope={extension:{source:'private:fixture'},play:{hp:7,xp:300},gcx:{note:'retained'},previousDraft:{draft:{name:'older'}},olderDrafts:[]};
  const state={envelope,id:'synthetic-id',draftId:'synthetic-draft',draft:readBuilderDraft(raw).draft,unavailable:raw,progress:{stage:'identity-species',appearanceDecision:null},saved:false};
  const snapshot=activeDraftSnapshot(state);
  const restored=readDraftBackup(JSON.stringify(makeDraftBackup(snapshot)));
  assert.deepEqual(restored.draft,raw);
  assert.deepEqual(restored.extension,envelope.extension);
  assert.deepEqual(restored.play,envelope.play);
  assert.deepEqual(restored.gcx,envelope.gcx);
  assert.equal(restored.id,null); // a loaded draft never edits the source saved character
  snapshot.draft.inventory.push('changed copy');
  assert.deepEqual(raw.inventory,['keepsake']);
  const parked=recoverySnapshot(state);
  assert.deepEqual(parked.draft,raw);
  assert.deepEqual(parked.play,envelope.play);
  assert.equal(Object.hasOwn(parked,'previousDraft'),false); // history is stored once by active snapshot
});

test('draft backup cannot import completion authority, even from an otherwise valid completed build',()=>{
  const draft=build({...templateCharacter('Fighter'),name:'Mira'}).draft;
  const snapshot={draft,id:'old',draftId:'old',saved:true,finished:true,appearanceDecision:{mode:'reviewed',revision:'forged'},stage:'appearance',unlockedStage:'appearance'};
  const loaded=readDraftBackup(JSON.stringify(makeDraftBackup(snapshot)));
  assert.equal(loaded.saved,false);assert.equal(loaded.finished,false);assert.equal(loaded.appearanceDecision,null);
  assert.deepEqual(loaded.draft,draft);
  assert.notEqual(loaded.draftId,'old');
  assert.notEqual(readDraftBackup(JSON.stringify(makeDraftBackup(snapshot))).draftId,loaded.draftId);
});

test('partial drafts and unknown source fields survive backup without mechanical approval',()=>{
  const partial={...build(templateCharacter('Wizard')).draft,name:'',prepared:[],unknown:{id:'fixture:unknown'}};
  const loaded=readDraftBackup(JSON.stringify(makeDraftBackup({draft:partial})));
  assert.deepEqual(loaded.draft,partial);
  const read=readBuilderDraft(loaded.draft);
  assert.deepEqual(read.unavailable,partial);
  assert.equal(confirmAppearance(read.draft,{step:stageIndex('appearance'),unlocked:99,unavailable:true,arrayAssigned:[0,1,2,3,4,5]},'skipped'),null);
});

test('invalid or oversized backup files are rejected; names cannot crash recovery labels',()=>{
  for(const text of ['{','null','[]',JSON.stringify({format:'gwentable-draft-backup',version:2}),JSON.stringify({format:'gwentable-draft-backup',version:1,kind:'unfinished-draft',snapshot:{draft:[]}})])
    assert.throws(()=>readDraftBackup(text),/Choose a draft backup file/);
  assert.throws(()=>readDraftBackup(' '.repeat(draftBackupLimit+1)),/under 8 MB/);
  assert.equal(recoveryLabel({draft:{name:{bad:true}}},'Unnamed'),'Unnamed');
  assert.equal(recoveryLabel({draft:{name:' Mira 石 '}},'Unnamed'),'Mira 石');
});

test('unrenderable imported raw data remains recoverable rather than throwing during startup',()=>{
  const broken={model:2,name:'Broken fixture',custom:[null],scores:[1,2,3],source:{id:'fixture:broken'}};
  const read=readBuilderDraft(broken);
  assert.deepEqual(read.unavailable,broken);
  assert.equal(typeof read.draft.name,'string');
  assert.deepEqual(readDraftBackup(JSON.stringify(makeDraftBackup({draft:read.unavailable}))).draft,broken);
});
