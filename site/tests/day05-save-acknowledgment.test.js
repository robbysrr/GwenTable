import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLatestDraftWriter,snapshotPersistenceRevision} from '../dist/persist-state.js';
import {copy,setLanguage} from '../dist/locale.js';

const fixture=(name,extra={})=>({draft:{name,model:2},step:1,unlocked:2,choiceReview:{version:3},...extra});
const deferred=()=>{let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej;});return {promise,resolve,reject};};
const nextMicrotask=async()=>{for(let n=0;n<4;n++)await Promise.resolve();};

test('a finished write is NOT a successful Save acknowledgment after unscheduled edits',async()=>{
  let current=fixture('Mira');
  const first=current;
  const gate=deferred();
  const statuses=[];
  const persisted=[];
  const writer=createLatestDraftWriter({
    save:async snapshot=>{await gate.promise;persisted.push(structuredClone(snapshot));},
    currentRevision:()=>snapshotPersistenceRevision(current),onStatus:value=>statuses.push(value)
  });
  const pending=writer(first);
  await nextMicrotask();
  current=fixture('Mira', {draft:{name:'Mira',story:'New unsaved notes'}});
  gate.resolve();
  assert.equal(await pending,false);
  assert.equal(statuses.at(-1),'unsaved');
  assert.equal(persisted.length,1);
  assert.equal(persisted[0].draft.story,undefined);
});

test('newer queued write is acknowledged, while the earlier completed write is not',async()=>{
  let current=fixture('Old');
  const first=current;
  const firstGate=deferred();const secondGate=deferred();
  const gates=[firstGate,secondGate];
  const recorded=[];const states=[];
  const writer=createLatestDraftWriter({
    save:async snapshot=>{const gate=gates.shift();await gate.promise;recorded.push(structuredClone(snapshot));},
    currentRevision:()=>snapshotPersistenceRevision(current),onStatus:state=>states.push(state)
  });
  const earlier=writer(first);
  await nextMicrotask();
  current=fixture('New');
  const newest=writer(current);
  firstGate.resolve();
  assert.equal(await earlier,false);
  await nextMicrotask();
  assert.equal(states.at(-1),'saving','the later snapshot is still queued/in flight');
  secondGate.resolve();
  assert.equal(await newest,true);
  assert.equal(states.at(-1),'saved');
  assert.deepEqual(recorded.map(item=>item.draft.name),['Old','New']);
});

test('a current committed snapshot receives a successful acknowledgment',async()=>{
  const current=fixture('Sage');const states=[];
  const writer=createLatestDraftWriter({save:async()=>{},currentRevision:()=>snapshotPersistenceRevision(current),onStatus:s=>states.push(s)});
  assert.equal(await writer(current),true);
  assert.deepEqual(states,['saving','saved']);
});

test('changing recovery progress while storage is in flight never claims a saved state',async()=>{
  let current=fixture('Sage',{unlocked:3,appearanceDecision:null});
  const gate=deferred();const states=[];
  const writer=createLatestDraftWriter({save:()=>gate.promise,currentRevision:()=>snapshotPersistenceRevision(current),onStatus:s=>states.push(s)});
  const pending=writer(current);await nextMicrotask();
  current=fixture('Sage',{unlocked:5,appearanceDecision:{mode:'skipped',revision:'new'}});
  gate.resolve();
  assert.equal(await pending,false);
  assert.equal(states.at(-1),'unsaved');
});

test('the Save action distinguishes stale, pending, conflict and failure outcomes in both locales',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  assert.match(app,/saveState==='saving'\?'Newer draft changes are still being saved\.'/);
  assert.match(app,/saveState==='unsaved'\?'Newer draft changes are not saved yet\. Save again\.'/);
  assert.match(app,/saved\?'Draft saved in this browser\.'/);
  assert.match(app,/saveState==='saved'\?'A newer save finished\./);
  assert.match(app,/renderSaveState\(\);\n};\n\$\('save'\)/,
    'the manual Save handler must restore the conflict-disabled control');
  for(const language of ['en','id']){
    setLanguage(language);
    const pending=copy('Newer draft changes are still being saved.');
    const unsaved=copy('Newer draft changes are not saved yet. Save again.');
    const newer=copy('A newer save finished. Check your latest changes.');
    assert.notEqual(pending,unsaved);
    assert.ok(newer.length>20);
    assert.ok(pending.length>20&&unsaved.length>20);
    if(language==='id'){assert.match(pending,/penyimpanan/);assert.match(unsaved,/belum tersimpan/);}
  }
  setLanguage('en');
});
