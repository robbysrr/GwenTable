import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {templateCharacter} from '../dist/lib/character.js';
import {normalizePlay,playProfile} from '../dist/lib/play.js';
import {setSavedMulticlassPlan,clearSavedMulticlassPlan,inspectSavedMulticlassPlan} from '../dist/lib/saved-multiclass-plan.mjs';

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
const {characters,characterStorageRevision}=await import('../dist/lib/storage.js?convergence02-multiclass-persist');
if(priorIndexedDB===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=priorIndexedDB;
async function character(){
 const draft=templateCharacter('Fighter');const entry={id:randomUUID(),draft,play:normalizePlay(playProfile(draft)),
   playUndo:null,customUserField:{value:'untouched'},updatedAt:'2026-11-22T03:00:00Z'};
 await characters.put(entry);return characters.get(entry.id);
}
test('Convergence 02 storage: saved future-class plan persists through regular characters.get/list',async()=>{
 const initial=await character();const expected=characterStorageRevision(initial);
 const changed=await characters.update(initial.id,row=>setSavedMulticlassPlan(row,'Rogue'),{expectedRevision:expected,requireExisting:true});
 assert.ok(changed._characterRevision!==expected);
 assert.equal(inspectSavedMulticlassPlan(await characters.get(initial.id)).status,'current');
 assert.ok((await characters.list()).some(row=>row.id===initial.id&&row.multiclassPlan.nextClass==='Rogue'));
 assert.deepEqual(changed.play,initial.play);
 assert.deepEqual(changed.playUndo,initial.playUndo);
 assert.deepEqual(changed.customUserField,initial.customUserField);
});
test('Convergence 02 storage: two stale tabs cannot both choose competing future classes',async()=>{
 const record=await character();const token=characterStorageRevision(record);
 const results=await Promise.allSettled([
  characters.update(record.id,row=>setSavedMulticlassPlan(row,'Rogue'),{expectedRevision:token,requireExisting:true}),
  characters.update(record.id,row=>setSavedMulticlassPlan(row,'Rogue'),{expectedRevision:token,requireExisting:true})
 ]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(results.filter(x=>x.status==='rejected').length,1);
 assert.equal(results.find(x=>x.status==='rejected').reason.code,'CHARACTER_REVISION_CONFLICT');
 assert.equal(inspectSavedMulticlassPlan(await characters.get(record.id)).status,'current');
});
test('Convergence 02 storage: invalid eligibility rolls back without modifying character or revision',async()=>{
 const record=await character();const token=characterStorageRevision(record);
 await assert.rejects(characters.update(record.id,row=>setSavedMulticlassPlan(row,'Wizard'),
   {expectedRevision:token,requireExisting:true}),/qualifying ability scores/);
 assert.deepEqual(await characters.get(record.id),record);
});
test('Convergence 02 storage: one transaction can remove the plan without disturbing Play or extension data',async()=>{
 const source=await character();const first=await characters.update(source.id,row=>setSavedMulticlassPlan(row,'Rogue'),
   {expectedRevision:characterStorageRevision(source),requireExisting:true});
 const second=await characters.update(first.id,row=>clearSavedMulticlassPlan(row),
   {expectedRevision:characterStorageRevision(first),requireExisting:true,skipUnchanged:true});
 assert.equal(inspectSavedMulticlassPlan(second).status,'none');
 assert.deepEqual(second.play,source.play);
 assert.deepEqual(second.customUserField,source.customUserField);
});
test('Convergence 02 storage: read-only current Play state never needs a database migration',()=>{
 assert.ok(sandbox.stores.has('characters'));
 assert.ok(sandbox.stores.has('drafts'));
 assert.ok(sandbox.stores.has('encounters'));
 assert.equal(sandbox.stores.size,3);
});
