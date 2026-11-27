import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLatestDraftWriter,snapshotPersistenceRevision} from '../dist/persist-state.js';
import {makeDraftBackup,readDraftBackup} from '../dist/draft-recovery.js';
import {setLanguage,copy} from '../dist/locale.js';

function memoryIndexedDB() {
  // Serialized readwrite transactions, mimicking the relevant IndexedDB
  // transaction lifecycle without installing a browser or a new dependency.
  const records=new Map();
  let txQueue=Promise.resolve();
  const instance={
    createObjectStore(){return {};},
    transaction(name,mode) {
      assert.equal(name,'drafts');
      assert.ok(['readonly','readwrite'].includes(mode));
      let write;
      let scheduled=false;
      let aborted=false;
      const tx={
        oncomplete:null,onabort:null,onerror:null,error:null,
        abort(){aborted=true;},
        objectStore:()=>({
          get(key) {
            assert.equal(key,'active');
            const request={onsuccess:null,result:undefined};
            scheduled=true;
            txQueue=txQueue.then(async()=>{
              await Promise.resolve(); // let caller attach its handlers
              request.result=records.has(key)?structuredClone(records.get(key)):undefined;
              request.onsuccess?.();
              if(aborted) {tx.onabort?.();return;}
              if(write)records.set(write[1],structuredClone(write[0]));
              tx.oncomplete?.();
            });
            return request;
          },
          put(value,key){
            write=[value,key];
            if(!scheduled) {
              scheduled=true;
              txQueue=txQueue.then(async()=>{
                await Promise.resolve();
                if(aborted){tx.onabort?.();return;}
                records.set(key,structuredClone(value));
                tx.oncomplete?.();
              });
            }
            return {result:key};
          }
        })
      };
      return tx;
    }
  };
  return {records,open(){
    const request={result:instance,onsuccess:null,onerror:null,onupgradeneeded:null,onblocked:null};
    queueMicrotask(()=>{request.onupgradeneeded?.({oldVersion:0});request.onsuccess?.();});
    return request;
  }};
}

let storage;
test('IndexedDB readwrite CAS prevents two tabs from silently overwriting the active draft',async()=>{
  const original=globalThis.indexedDB;
  globalThis.indexedDB=memoryIndexedDB();
  try {
    // Fresh import: storage module opens its connection at module evaluation.
    const mod=await import('../dist/lib/storage.js?multi-tab-fixture=1');
    storage=mod;
    assert.equal(mod.draftStorageRevision(null),null);
    assert.equal(mod.draftStorageRevision({_storageRevision:'invalid'}),null);
    const a={draft:{name:'Fighter',notes:'tab A'}};
    const b={draft:{name:'Fighter',notes:'tab B'}};
    const settled=await Promise.allSettled([
      mod.drafts.compareAndSet(a,null),mod.drafts.compareAndSet(b,null)
    ]);
    assert.equal(settled.filter(x=>x.status==='fulfilled').length,1);
    assert.equal(settled.filter(x=>x.status==='rejected').length,1);
    assert.equal(settled.find(x=>x.status==='rejected').reason.code,'DRAFT_REVISION_CONFLICT');
    const kept=await mod.drafts.get();
    assert.equal(kept.draft.notes,'tab A');
    const revision=mod.draftStorageRevision(kept);
    assert.ok(revision);
    await assert.rejects(mod.drafts.compareAndSet(b,null),{code:'DRAFT_REVISION_CONFLICT'});
    assert.deepEqual((await mod.drafts.get()).draft,kept.draft);
    const next=await mod.drafts.compareAndSet({...kept,draft:{...kept.draft,notes:'tab A edited'}},revision);
    assert.notEqual(next,revision);
    assert.equal((await mod.drafts.get()).draft.notes,'tab A edited');
  } finally {
    if(original===undefined) delete globalThis.indexedDB;
    else globalThis.indexedDB=original;
  }
});

test('v0.22.9 unversioned draft upgrades on first write without deleting extension data',async()=>{
  const old={draft:{name:'Legacy'},unknownExtension:{keep:['homebrew']},choiceReview:{version:3}};
  await storage.drafts.set(old); // inject a v0.22.9 browser record into the fixture
  assert.equal(storage.draftStorageRevision(await storage.drafts.get()),null);
  const after={...old,draft:{name:'Legacy edited'}};
  const revision=await storage.drafts.compareAndSet(after,null);
  const saved=await storage.drafts.get();
  assert.equal(storage.draftStorageRevision(saved),revision);
  assert.deepEqual(saved.unknownExtension,old.unknownExtension);
  assert.deepEqual(saved.choiceReview,old.choiceReview);
  assert.equal(saved.draft.name,'Legacy edited');
});

test('queued snapshots from a single tab follow its latest acknowledged storage token',async()=>{
  assert.ok(storage);
  let base=storage.draftStorageRevision(await storage.drafts.get());
  const status=[];
  let current={draft:{name:'Fighter',notes:'one'}};
  const save=createLatestDraftWriter({
    save:async snapshot=>{base=await storage.drafts.compareAndSet(snapshot,base);},
    currentRevision:()=>snapshotPersistenceRevision(current),
    // Both queued writes commit in order, but only the latest one counts
    // as an acknowledgement of the current on-screen character.
    onStatus:s=>status.push(s)
  });
  const first=current;
  current={draft:{name:'Fighter',notes:'two'}};
  assert.deepEqual(await Promise.all([save(first),save(current)]),[false,true]);
  assert.equal((await storage.drafts.get()).draft.notes,'two');
  assert.ok(status.includes('saving'));
});

test('conflict permanently halts the current tab writer, even for queued requests',async()=>{
  assert.ok(storage);
  const statuses=[];
  let called=0;
  const save=createLatestDraftWriter({
    save:async()=>{called++;const error=new Error('version mismatch');error.code='DRAFT_REVISION_CONFLICT';throw error;},
    currentRevision:()=>'',onStatus:s=>statuses.push(s)
  });
  const snapshot={draft:{name:'Fighter'}};
  assert.deepEqual(await Promise.all([save(snapshot),save(snapshot)]),[false,false]);
  assert.equal(called,1,'a queued second request must never write after the first detects a conflict');
  assert.equal(statuses.at(-1),'conflict');
  assert.equal(await save(snapshot),false);
  assert.equal(called,1);
  assert.equal(statuses.at(-1),'conflict');
});

test('a quota error is retryable; a revision conflict is not',async()=>{
  let fail=true,called=0;
  const statuses=[];
  const snapshot={draft:{name:'partial'}};
  const writer=createLatestDraftWriter({save:async()=>{called++;if(fail)throw new Error('QuotaExceededError');},
    currentRevision:()=>snapshotPersistenceRevision(snapshot),onStatus:s=>statuses.push(s)});
  assert.equal(await writer(snapshot),false);
  assert.equal(statuses.at(-1),'failed');
  fail=false;
  assert.equal(await writer(snapshot),true);
  assert.equal(called,2);
});

test('local revision tokens are excluded from portable backups, including recovery history',()=>{
  const token='12345678-1234-1234-1234-123456789abc';
  const snapshot={draft:{name:'Mine'},_storageRevision:token,
    previousDraft:{draft:{name:'Old'},_storageRevision:token},
    olderDrafts:[{draft:{name:'Older'},_storageRevision:token}],unknown:{keep:true}};
  const backup=makeDraftBackup(snapshot);
  for(const item of [backup.snapshot,backup.snapshot.previousDraft,...backup.snapshot.olderDrafts])
    assert.equal(Object.hasOwn(item,'_storageRevision'),false);
  const restored=readDraftBackup(JSON.stringify(backup));
  for(const item of [restored,restored.previousDraft,...restored.olderDrafts])
    assert.equal(Object.hasOwn(item,'_storageRevision'),false);
  assert.deepEqual(restored.unknown,{keep:true});
});

test('conflict response has a visible accessible action and readable EN/id-ID copy',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const storageSource=readFileSync(new URL('../dist/lib/storage.js',import.meta.url),'utf8');
  assert.match(html,/id="reload-conflicted-draft"[^>]*hidden/);
  assert.match(html,/id="conflict-draft-backup"[^>]*hidden/);
  assert.match(app,/storageBaseRevision=await drafts\.compareAndSet\(snapshot,storageBaseRevision\)/);
  assert.match(app,/storageBaseRevision=draftStorageRevision\(active\)/);
  assert.match(app,/storageBaselineReady=true/);
  assert.match(app,/ready&&storageBaselineReady\?writeDraftSnapshot/);
  assert.match(app,/\$\('reload-conflicted-draft'\)\.hidden=saveState!=='conflict'/);
  assert.match(storageSource,/const tx=conn\.transaction\('drafts','readwrite'\)/);
  for(const language of ['en','id']) {
    setLanguage(language);
    assert.ok(copy('Save conflict: another tab changed this draft').length>10);
    assert.ok(copy('Reload latest saved draft').length>10);
  }
  setLanguage('en');
});
