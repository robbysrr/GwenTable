import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeDraftBackup,readDraftBackup,activeDraftSnapshot,recoverySnapshot} from '../dist/draft-recovery.js';
import {makeRosterExport,readRosterExport} from '../dist/lib/portable.js';
import {templateCharacter} from '../dist/lib/character.js';
import {mergeSavedCharacterBuild} from '../dist/saved-character-build.js';
import {playProfile,normalizePlay} from '../dist/lib/play.js';
import {setLanguage,copy} from '../dist/locale.js';

// Transaction-only deterministic fixture. It is deliberately NOT called a
// browser/IndexedDB acceptance test. Each readwrite tx serializes its read,
// mutation callback, and commit, like an IndexedDB readwrite transaction.
function memoryCharacterDB() {
  const records=new Map();
  let pending=Promise.resolve();
  let errorOnWrite=false;
  const instance={
    createObjectStore(){return {};},
    transaction(name,mode){
      assert.equal(name,'characters');
      let operation=null,scheduled=false,aborted=false;
      let result,returned;
      const tx={error:null,oncomplete:null,onabort:null,onerror:null,abort(){aborted=true;},objectStore:()=>({
        get(key){
          const request={onsuccess:null,result:undefined};
          if(mode==='readwrite'){
            assert.equal(scheduled,false);
            scheduled=true;
            pending=pending.then(async()=>{
              await Promise.resolve();
              request.result=records.has(key)?structuredClone(records.get(key)):undefined;
              request.onsuccess?.();
              if(aborted){tx.onabort?.();return;}
              if(errorOnWrite&&operation){tx.error=new Error('QuotaExceededError');tx.onabort?.();return;}
              if(operation) records.set(operation.id,structuredClone(operation));
              tx.oncomplete?.();
            });
          } else queueMicrotask(()=>{request.result=records.has(key)?structuredClone(records.get(key)):undefined;request.onsuccess?.();tx.oncomplete?.();});
          return request;
        },
        getAll(){
          const request={result:[...records.values()].map(x=>structuredClone(x))};
          queueMicrotask(()=>tx.oncomplete?.());return request;
        },
        add(value){
          const request={result:value.id};
          scheduled=true;
          pending=pending.then(async()=>{
            await Promise.resolve();
            if(aborted){tx.onabort?.();return;}
            if(records.has(value.id)){
              tx.error=Object.assign(new Error('ID collision'),{name:'ConstraintError'});
              tx.onabort?.();return;
            }
            if(errorOnWrite){tx.error=new Error('QuotaExceededError');tx.onabort?.();return;}
            records.set(value.id,structuredClone(value));tx.oncomplete?.();
          });
          return request;
        },
        put(value){operation=value;return {result:value.id};}
      })};
      return tx;
    }
  };
  return {records,setError:value=>{errorOnWrite=value;},open(){
    const request={result:instance,onsuccess:null,onerror:null,onupgradeneeded:null,onblocked:null};
    queueMicrotask(()=>{request.onupgradeneeded?.({oldVersion:0});request.onsuccess?.();});
    return request;
  }};
}
let storage, mock;
test('saved character legacy update mints revision without dropping custom fields and Play state',async()=>{
  const prior=globalThis.indexedDB;
  mock=memoryCharacterDB();globalThis.indexedDB=mock;
  try {
    storage=await import('../dist/lib/storage.js?roster-fixture=1');
    const legacy={id:'hero-1',updatedAt:'2026-11-01',draft:{name:'Original'},play:{hp:7},myExtension:{keep:true}};
    mock.records.set('hero-1',legacy);
    assert.equal(storage.characterStorageRevision(legacy),null);
    const result=await storage.characters.update('hero-1',current=>({...current,draft:{...current.draft,name:'Edited'}}),{expectedRevision:null,requireExisting:true});
    assert.ok(storage.characterStorageRevision(result));
    assert.deepEqual(result.myExtension,{keep:true});
    assert.deepEqual(result.play,{hp:7});
    assert.equal((await storage.characters.get('hero-1')).draft.name,'Edited');
  } finally {if(prior===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=prior;}
});

test('two tabs editing the same saved build produce one winner, one conflict and no lost content',async()=>{
  const from=await storage.characters.get('hero-1');
  const baseline=storage.characterStorageRevision(from);
  const settled=await Promise.allSettled([
    storage.characters.update('hero-1',c=>({...c,draft:{...c.draft,name:'Tab A'}}),{expectedRevision:baseline,requireExisting:true}),
    storage.characters.update('hero-1',c=>({...c,draft:{...c.draft,name:'Tab B'}}),{expectedRevision:baseline,requireExisting:true})
  ]);
  assert.equal(settled.filter(x=>x.status==='fulfilled').length,1);
  const failed=settled.find(x=>x.status==='rejected');
  assert.equal(failed.reason.code,'CHARACTER_REVISION_CONFLICT');
  assert.equal((await storage.characters.get('hero-1')).draft.name,'Tab A');
  assert.equal((await storage.characters.get('hero-1')).play.hp,7);
  await assert.rejects(storage.characters.update('hero-1',c=>({...c,draft:{name:'Overwrite'}}),{expectedRevision:baseline,requireExisting:true}),{code:'CHARACTER_REVISION_CONFLICT'});
  assert.equal((await storage.characters.get('hero-1')).draft.name,'Tab A');
});

test('Play changes advance revision and stale build commits are rejected; stale Play is rejected too',async()=>{
  const existing=await storage.characters.get('hero-1');
  const editorToken=storage.characterStorageRevision(existing);
  const played=await storage.characters.update(existing.id,c=>({...c,play:{hp:3}}),{expectedRevision:editorToken,requireExisting:true});
  assert.notEqual(storage.characterStorageRevision(played),editorToken);
  await assert.rejects(storage.characters.update(existing.id,c=>({...c,draft:{name:'Old editor'}}),{expectedRevision:editorToken,requireExisting:true}),{code:'CHARACTER_REVISION_CONFLICT'});
  await assert.rejects(storage.characters.update(existing.id,c=>({...c,play:{hp:1}}),{expectedRevision:editorToken,requireExisting:true}),{code:'CHARACTER_REVISION_CONFLICT'});
  assert.equal((await storage.characters.get('hero-1')).play.hp,3);
});

test('new builds cannot overwrite an existing character and deleted saved characters are not silently recreated',async()=>{
  const current=await storage.characters.get('hero-1');
  const token=storage.characterStorageRevision(current);
  await assert.rejects(storage.characters.update('hero-1',()=>({id:'hero-1',draft:{name:'Duplicate'}}),{createOnly:true,expectedRevision:null}),{code:'CHARACTER_REVISION_CONFLICT'});
  await assert.rejects(storage.characters.update('missing',()=>({id:'missing',draft:{name:'Zombie'}}),{requireExisting:true,expectedRevision:null}),{code:'CHARACTER_REVISION_CONFLICT'});
  assert.equal(await storage.characters.get('missing'),undefined);
  await assert.rejects(storage.characters.update('hero-1',()=>({id:'different-id',draft:{name:'Changed ID'}}),{expectedRevision:token,requireExisting:true}),/ID cannot change/);
  assert.equal((await storage.characters.get('hero-1')).id,'hero-1');
});

test('legacy Play update with no compare remains transactionally safe; next write gets a revision',async()=>{
  mock.records.set('legacy-play',{id:'legacy-play',draft:{name:'Legacy'},play:{hp:10},extension:{keep:42}});
  const next=await storage.characters.update('legacy-play',c=>({...c,play:{hp:c.play.hp-2}}));
  assert.equal(next.play.hp,8);
  assert.ok(storage.characterStorageRevision(next));
  assert.deepEqual(next.extension,{keep:42});
});

test('failed write does not change the saved character or its acknowledged revision',async()=>{
  const current=await storage.characters.get('hero-1');
  const token=storage.characterStorageRevision(current);
  mock.setError(true);
  try {
    await assert.rejects(storage.characters.update('hero-1',c=>({...c,draft:{name:'Discard me'}}),{expectedRevision:token,requireExisting:true}),/QuotaExceeded/);
  } finally {mock.setError(false);}
  const after=await storage.characters.get('hero-1');
  assert.equal(storage.characterStorageRevision(after),token);
  assert.deepEqual(after.draft,current.draft);
});

test('local saved-character revisions never enter draft recovery files or roster backups',async()=>{
  const token='12345678-1234-1234-1234-123456789abc';
  const state={envelope:{notes:{kept:true}},id:'hero-1',draftId:'hero-1',draft:{name:'Ranger'},
    progress:{step:2},characterBaseRevision:token,previousDraft:{draft:{name:'Old'},_characterBaseRevision:token},saved:true};
  const active=activeDraftSnapshot(state);
  assert.equal(active._characterBaseRevision,token);
  assert.equal(recoverySnapshot(state)._characterBaseRevision,token);
  const exported=makeDraftBackup(active);
  assert.equal(Object.hasOwn(exported.snapshot,'_characterBaseRevision'),false);
  assert.equal(Object.hasOwn(exported.snapshot.previousDraft,'_characterBaseRevision'),false);
  const imported=readDraftBackup(JSON.stringify(exported));
  assert.equal(imported.id,null);
  assert.equal(Object.hasOwn(imported,'_characterBaseRevision'),false);
  const draft=templateCharacter('Fighter');
  const bundle=await makeRosterExport([{id:'hero-2',draft,_characterRevision:token}]);
  assert.equal(JSON.stringify(bundle).includes(token),false);
  const records=await readRosterExport(JSON.stringify(bundle));
  assert.equal(Object.hasOwn(records[0],'_characterRevision'),false);
});

test('new imports create revisioned saved characters and reject direct silent put overwrite',async()=>{
  await storage.characters.addBatch([{id:'imported',draft:{name:'Import'},unknown:{keep:true}}]);
  const current=await storage.characters.get('imported');
  assert.ok(storage.characterStorageRevision(current));
  assert.deepEqual(current.unknown,{keep:true});
  await assert.rejects(storage.characters.put({id:'imported',draft:{name:'Oops'}}),/collision/i);
  assert.equal((await storage.characters.get('imported')).draft.name,'Import');
});

test('builder/Play/GCX integration wiring and bilingual conflict recovery copy are present',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const play=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
  assert.match(app,/\{expectedRevision,createOnly:existingId===null,requireExisting:existingId!==null\}/);
  assert.match(app,/characterBaseRevision=characterStorageRevision\(saved\)/);
  assert.match(app,/characterBaseRevision=characterStorageRevision\(\{_characterRevision:active\._characterBaseRevision\}\)/);
  assert.match(app,/\{expectedRevision:characterStorageRevision\(linked\),requireExisting:true\}/);
  assert.match(app,/characterSource:record/);
  assert.match(play,/\{expectedRevision,requireExisting:true\}/);
  for(const language of ['en','id']){
    setLanguage(language);
    const a=copy('This saved character changed in another tab. Download your draft backup before reopening the latest saved character.');
    const b=copy('This saved character changed in another tab. Return to Saved Characters and reopen it before another Play action.');
    assert.ok(a.length>30);assert.ok(b.length>30);
    if(language==='id'){assert.match(a,/Unduh/);assert.match(b,/Karakter/);}
  }
  setLanguage('en');
});


test('actual character-storage transaction preserves legacy record extensions during Build save',async()=>{
  const draft=templateCharacter('Fighter');
  const profile=playProfile(draft);
  const original={id:'extended-legacy',draft,play:normalizePlay(profile,{hp:profile.maxHP-2}),
    playUndo:normalizePlay(profile,{hp:profile.maxHP}),
    legacyNotes:{text:'player-written'},privateCustomExtension:{id:'homebrew:42',keep:true}};
  mock.records.set(original.id,structuredClone(original));
  const newBuild={id:original.id,draft:{...draft,name:'Updated Build'},updatedAt:'2026-11-19T03:40:00Z'};
  const committed=await storage.characters.update(original.id,current=>mergeSavedCharacterBuild(current,newBuild),
    {expectedRevision:null,requireExisting:true});
  const restored=await storage.characters.get(original.id);
  assert.ok(storage.characterStorageRevision(restored));
  assert.equal(restored.draft.name,'Updated Build');
  assert.deepEqual(restored.privateCustomExtension,original.privateCustomExtension);
  assert.deepEqual(restored.legacyNotes,original.legacyNotes);
  assert.deepEqual(restored.play,original.play);
  assert.deepEqual(restored.playUndo,original.playUndo);
  assert.deepEqual(committed,restored);
  assert.equal(original.draft.name,draft.name);
});

test('a failed Build save cannot remove extension data or change the record revision',async()=>{
  const original=await storage.characters.get('extended-legacy');
  const revision=storage.characterStorageRevision(original);
  mock.setError(true);
  try{
    await assert.rejects(storage.characters.update(original.id,current=>mergeSavedCharacterBuild(current,
      {id:original.id,draft:{...original.draft,name:'Failed edit'},updatedAt:'after'}),
      {expectedRevision:revision,requireExisting:true}),/QuotaExceeded/);
  } finally{mock.setError(false);}
  const restored=await storage.characters.get(original.id);
  assert.deepEqual(restored,original);
  assert.equal(storage.characterStorageRevision(restored),revision);
});
