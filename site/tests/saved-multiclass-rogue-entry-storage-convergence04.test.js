import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {templateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay} from '../dist/lib/play.js';
import {setSavedMulticlassPlan} from '../dist/lib/saved-multiclass-plan.mjs';
import {prepareMulticlassLevelUp} from '../dist/lib/saved-multiclass-levelup.mjs';
import {rogueEntryOptions,setSavedRogueEntry,clearSavedRogueEntry,inspectSavedRogueEntry} from '../dist/lib/saved-multiclass-rogue-entry.mjs';

// Reuse the full browser-style IDB transaction contract, but keep this
// deterministic Node harness explicitly separate from real Chromium QA.
function sandboxDatabase(){
 const stores=new Map();let transactionQueue=Promise.resolve();
 const clone=value=>value===undefined?undefined:structuredClone(value);
 const connection={
  createObjectStore(name,options){stores.set(name,{rows:new Map(),keyPath:options?.keyPath});},
  transaction(name,mode){
   const base=stores.get(name);if(!base)throw new Error('Unknown store: '+name);
   let abandoned=false;const actions=[];
   const tx={oncomplete:null,onabort:null,onerror:null,error:null,abort(){abandoned=true;},
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
const beforeIndexedDB=globalThis.indexedDB;
const sandbox=sandboxDatabase();globalThis.indexedDB=sandbox.indexedDB;
const {characters,characterStorageRevision}=await import('../dist/lib/storage.js?convergence04-rogue-choice-persistence');
if(beforeIndexedDB===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=beforeIndexedDB;

async function saved(){
 const draft=templateCharacter('Fighter'),profile=playProfile(draft);
 const record={id:randomUUID(),draft,play:{...normalizePlay(profile),xp:profile.s.nextXP},playUndo:null,
   privateMeta:{table:'fixture'},inventoryReceipts:[{operationId:randomUUID()}]};
 await characters.put(record);
 const initial=await characters.get(record.id);
 return characters.update(record.id,current=>{
  const planned=setSavedMulticlassPlan(current,'Rogue');
  return prepareMulticlassLevelUp(planned,{xpAuthority:'xp',hpMethod:'fixed',acknowledged:true});
 },{expectedRevision:characterStorageRevision(initial),requireExisting:true});
}
const choice=record=>{
 const opts=rogueEntryOptions(record);
 return {skill:opts.skills[0],expertise:[opts.expertise[0],opts.skills[0]],
   language:opts.languages[0],masteries:opts.masteries.slice(0,2),acknowledged:true};
};

test('Convergence 04 IDB: saved entry updates only one revised character record with no Play/Undo mutation',async()=>{
 const prior=await saved(),oldToken=characterStorageRevision(prior);
 const final=await characters.update(prior.id,row=>setSavedRogueEntry(row,choice(row)),
   {expectedRevision:oldToken,requireExisting:true});
 assert.notEqual(characterStorageRevision(final),oldToken);
 assert.equal(inspectSavedRogueEntry(await characters.get(prior.id)).status,'current');
 assert.deepEqual(final.draft,prior.draft);assert.deepEqual(final.play,prior.play);
 assert.deepEqual(final.playUndo,prior.playUndo);assert.deepEqual(final.privateMeta,prior.privateMeta);
 assert.deepEqual(final.inventoryReceipts,prior.inventoryReceipts);
});
test('Convergence 04 IDB: concurrent stale tabs cannot both persist different Rogue entry choices',async()=>{
 const prior=await saved(),token=characterStorageRevision(prior);
 const a=choice(prior),b={...a,language:rogueEntryOptions(prior).languages[1]};
 const results=await Promise.allSettled([
  characters.update(prior.id,row=>setSavedRogueEntry(row,a),{expectedRevision:token,requireExisting:true}),
  characters.update(prior.id,row=>setSavedRogueEntry(row,b),{expectedRevision:token,requireExisting:true})
 ]);
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
 assert.equal(results.filter(result=>result.status==='rejected').length,1);
 assert.equal(results.find(result=>result.status==='rejected').reason.code,'CHARACTER_REVISION_CONFLICT');
 assert.equal(inspectSavedRogueEntry(await characters.get(prior.id)).status,'current');
});
test('Convergence 04 IDB: invalid double Expertise aborts without touching Play or revision',async()=>{
 const prior=await saved(),before=structuredClone(prior),token=characterStorageRevision(prior);
 const bad=choice(prior);bad.expertise=[bad.skill,bad.skill];
 await assert.rejects(characters.update(prior.id,row=>setSavedRogueEntry(row,bad),
   {expectedRevision:token,requireExisting:true}),/two distinct/);
 assert.deepEqual(await characters.get(prior.id),before);
});
test('Convergence 04 IDB: intentional removal does not remove the approved plan, HP checkpoint or inventory',async()=>{
 const prior=await saved(),ready=await characters.update(prior.id,row=>setSavedRogueEntry(row,choice(row)),
   {expectedRevision:characterStorageRevision(prior),requireExisting:true});
 const cleared=await characters.update(ready.id,clearSavedRogueEntry,
   {expectedRevision:characterStorageRevision(ready),requireExisting:true});
 assert.equal(inspectSavedRogueEntry(cleared).status,'none');
 assert.deepEqual(cleared.multiclassLevelUp,ready.multiclassLevelUp);
 assert.deepEqual(cleared.multiclassPlan,ready.multiclassPlan);
 assert.deepEqual(cleared.play,ready.play);
 assert.deepEqual(cleared.inventoryReceipts,ready.inventoryReceipts);
});
