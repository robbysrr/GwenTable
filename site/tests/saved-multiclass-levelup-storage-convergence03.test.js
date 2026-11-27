import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {templateCharacter} from '../dist/lib/character.js';
import {normalizePlay,playProfile} from '../dist/lib/play.js';
import {setSavedMulticlassPlan,inspectSavedMulticlassPlan} from '../dist/lib/saved-multiclass-plan.mjs';
import {prepareMulticlassLevelUp,clearMulticlassLevelUp,inspectMulticlassLevelUp} from '../dist/lib/saved-multiclass-levelup.mjs';

// Deterministic IndexedDB transaction mock, not a live browser acceptance.
function sandboxDatabase(){
 const stores=new Map();let transactionQueue=Promise.resolve();
 const clone=value=>value===undefined?undefined:structuredClone(value);
 const connection={
  createObjectStore(name,options){stores.set(name,{rows:new Map(),keyPath:options?.keyPath});},
  transaction(name,mode){
   const base=stores.get(name);if(!base)throw new Error('No such object store: '+name);
   let abandoned=false,errors=null;const actions=[];
   const tx={oncomplete:null,onabort:null,onerror:null,error:null,
    abort(){abandoned=true;},
    objectStore:()=>({
     get(id){const request={result:undefined,onsuccess:null};actions.push(draft=>{
        request.result=clone(draft.get(id));request.onsuccess?.();
       });return request;},
     getAll(){const request={result:undefined,onsuccess:null};actions.push(draft=>{
        request.result=[...draft.values()].map(clone);request.onsuccess?.();
       });return request;},
     add(record,key){const request={result:key??record.id};actions.push(draft=>{
        const id=key??record.id;if(draft.has(id))throw new Error('ConstraintError');draft.set(id,clone(record));
       });return request;},
     put(record,key){const request={result:key??record.id};actions.push(draft=>{
        draft.set(key??record.id,clone(record));
       });return request;}
    })};
   transactionQueue=transactionQueue.then(()=>new Promise(done=>setImmediate(()=>{
     const draft=new Map([...base.rows].map(([key,value])=>[key,clone(value)]));
     try{
       while(actions.length&&!abandoned)actions.shift()(draft);
       if(!abandoned){if(mode==='readwrite')base.rows=draft;tx.oncomplete?.();}
       else tx.onabort?.();
     }catch(error){tx.error=error;tx.onabort?.();}
     done();
   })));
   return tx;
  }
 };
 return {stores,indexedDB:{open(){const request={result:connection,onsuccess:null,onupgradeneeded:null,onerror:null};
   queueMicrotask(()=>{request.onupgradeneeded?.({oldVersion:0});request.onsuccess?.();});return request;}}};
}
const priorIndexedDB=globalThis.indexedDB;
const sandbox=sandboxDatabase();globalThis.indexedDB=sandbox.indexedDB;
const {characters,characterStorageRevision}=await import('../dist/lib/storage.js?convergence03-levelup-checkpoint-persist');
if(priorIndexedDB===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=priorIndexedDB;

async function savedPC(){
 const draft=templateCharacter('Fighter'),profile=playProfile(draft);
 const row={id:randomUUID(),draft,play:{...normalizePlay(profile),xp:profile.s.nextXP},playUndo:null,
   inventoryReceipts:[{operationId:randomUUID()}],personalNote:{campaign:'Private fixture'}};
 await characters.put(row);return characters.get(row.id);
}
const ready=current=>prepareMulticlassLevelUp(current,{hpMethod:'fixed',xpAuthority:'xp',acknowledged:true});
test('Convergence 03 IDB: current future-class plan stages a level-up in ONE revisioned character transaction',async()=>{
 let saved=await savedPC();const before=structuredClone(saved);
 saved=await characters.update(saved.id,current=>setSavedMulticlassPlan(current,'Rogue'),
   {expectedRevision:characterStorageRevision(saved),requireExisting:true});
 const token=characterStorageRevision(saved);
 const result=await characters.update(saved.id,current=>ready(current),
   {expectedRevision:token,requireExisting:true});
 assert.notEqual(characterStorageRevision(result),token);
 assert.equal(inspectMulticlassLevelUp(await characters.get(saved.id)).status,'current');
 assert.equal(result.draft.level,3);assert.deepEqual(result.play,before.play);
 assert.deepEqual(result.playUndo,before.playUndo);
 assert.deepEqual(result.inventoryReceipts,before.inventoryReceipts);
 assert.deepEqual(result.personalNote,before.personalNote);
});
test('Convergence 03 IDB: race between two stale tabs produces exactly ONE checkpoint',async()=>{
 const initial=await savedPC();const planned=await characters.update(initial.id,current=>setSavedMulticlassPlan(current,'Rogue'),
   {expectedRevision:characterStorageRevision(initial),requireExisting:true});
 const token=characterStorageRevision(planned);
 const results=await Promise.allSettled([
   characters.update(planned.id,row=>ready(row),{expectedRevision:token,requireExisting:true}),
   characters.update(planned.id,row=>prepareMulticlassLevelUp(row,{hpMethod:'rolled',hpRoll:7,xpAuthority:'xp',acknowledged:true}),
     {expectedRevision:token,requireExisting:true})
 ]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(results.filter(x=>x.status==='rejected').length,1);
 assert.equal(results.find(x=>x.status==='rejected').reason.code,'CHARACTER_REVISION_CONFLICT');
 assert.equal(inspectMulticlassLevelUp(await characters.get(planned.id)).status,'current');
});
test('Convergence 03 IDB: invalid HP choice or unapproved milestone aborts with unchanged revision',async()=>{
 const first=await savedPC();let planned=await characters.update(first.id,current=>setSavedMulticlassPlan(current,'Rogue'),
   {expectedRevision:characterStorageRevision(first),requireExisting:true});
 const token=characterStorageRevision(planned);
 await assert.rejects(characters.update(planned.id,current=>prepareMulticlassLevelUp(current,
   {hpMethod:'rolled',hpRoll:99,xpAuthority:'xp',acknowledged:true}),
   {expectedRevision:token,requireExisting:true}),/actual roll/);
 await assert.rejects(characters.update(planned.id,current=>prepareMulticlassLevelUp(current,
   {hpMethod:'fixed',xpAuthority:'gm',gmApproved:false,acknowledged:true}),
   {expectedRevision:token,requireExisting:true}),/explicit confirmation/);
 assert.deepEqual(await characters.get(planned.id),planned);
});
test('Convergence 03 IDB: clear checkpoint atomically preserves existing plan, inventory and Play',async()=>{
 const first=await savedPC();const planned=await characters.update(first.id,r=>setSavedMulticlassPlan(r,'Rogue'),
   {expectedRevision:characterStorageRevision(first),requireExisting:true});
 const staged=await characters.update(first.id,ready,{expectedRevision:characterStorageRevision(planned),requireExisting:true});
 const cleared=await characters.update(first.id,clearMulticlassLevelUp,
   {expectedRevision:characterStorageRevision(staged),requireExisting:true});
 assert.equal(inspectMulticlassLevelUp(cleared).status,'none');
 assert.equal(inspectSavedMulticlassPlan(cleared).status,'current');
 assert.deepEqual(cleared.play,staged.play);
 assert.deepEqual(cleared.inventoryReceipts,staged.inventoryReceipts);
});
test('Convergence 03 IDB: re-selecting next class invalidates staged preparation in same transaction',async()=>{
 const first=await savedPC();const planned=await characters.update(first.id,r=>setSavedMulticlassPlan(r,'Rogue'),
   {expectedRevision:characterStorageRevision(first),requireExisting:true});
 const staged=await characters.update(first.id,ready,
   {expectedRevision:characterStorageRevision(planned),requireExisting:true});
 const renewed=await characters.update(first.id,r=>setSavedMulticlassPlan(r,'Rogue'),
   {expectedRevision:characterStorageRevision(staged),requireExisting:true});
 assert.equal(inspectSavedMulticlassPlan(renewed).status,'current');
 assert.equal(inspectMulticlassLevelUp(renewed).status,'none');
});
