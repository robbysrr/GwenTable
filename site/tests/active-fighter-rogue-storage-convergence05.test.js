import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {templateCharacter,build} from '../dist/lib/character.js';
import {playProfile,normalizePlay} from '../dist/lib/play.js';
import {setSavedMulticlassPlan} from '../dist/lib/saved-multiclass-plan.mjs';
import {prepareMulticlassLevelUp} from '../dist/lib/saved-multiclass-levelup.mjs';
import {rogueEntryOptions,setSavedRogueEntry} from '../dist/lib/saved-multiclass-rogue-entry.mjs';
import {activateFighterRogue} from '../dist/lib/activate-fighter-rogue.mjs';

// Deterministic transactional fixture. It is NOT real browser IndexedDB.
function sandboxDatabase(){
 const stores=new Map();let serial=Promise.resolve();
 const clone=value=>value===undefined?undefined:structuredClone(value);
 const connection={
  createObjectStore(name,options){stores.set(name,{rows:new Map(),keyPath:options?.keyPath});},
  transaction(name,mode){
   const base=stores.get(name);if(!base)throw new Error('Unknown object store: '+name);
   let aborted=false;const pending=[];
   const tx={oncomplete:null,onabort:null,onerror:null,error:null,abort(){aborted=true;},
    objectStore:()=>({
     get(id){const req={result:undefined,onsuccess:null};pending.push(temp=>{req.result=clone(temp.get(id));req.onsuccess?.();});return req;},
     getAll(){const req={result:undefined,onsuccess:null};pending.push(temp=>{req.result=[...temp.values()].map(clone);req.onsuccess?.();});return req;},
     add(value,id){pending.push(temp=>{if(temp.has(id??value.id))throw new Error('ConstraintError');temp.set(id??value.id,clone(value));});return {result:id??value.id};},
     put(value,id){pending.push(temp=>{temp.set(id??value.id,clone(value));});return {result:id??value.id};}
    })};
   serial=serial.then(()=>new Promise(done=>setImmediate(()=>{
    const temp=new Map([...base.rows].map(([key,value])=>[key,clone(value)]));
    try{
     while(pending.length&&!aborted)pending.shift()(temp);
     if(aborted)tx.onabort?.();
     else{if(mode==='readwrite')base.rows=temp;tx.oncomplete?.();}
    }catch(error){tx.error=error;tx.onabort?.();}
    done();
   })));
   return tx;
  }
 };
 return {indexedDB:{open(){const req={result:connection,onsuccess:null,onupgradeneeded:null,onerror:null};
   queueMicrotask(()=>{req.onupgradeneeded?.({oldVersion:0});req.onsuccess?.();});return req;}},stores};
}
const old=globalThis.indexedDB,fixtureDb=sandboxDatabase();globalThis.indexedDB=fixtureDb.indexedDB;
const {characters,characterStorageRevision}=await import('../dist/lib/storage.js?convergence05-active-composite');
if(old===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=old;
async function saved(){
 const draft=build({...templateCharacter('Fighter'),level:1,kit:'B'}).draft,profile=playProfile(draft);
 let record={id:randomUUID(),draft,play:{...normalizePlay(profile),xp:profile.s.nextXP},playUndo:null,
  notes:'Do not overwrite',inventoryReceipts:[{operationId:randomUUID()}]};
 record=setSavedMulticlassPlan(record,'Rogue');
 record=prepareMulticlassLevelUp(record,{hpMethod:'fixed',xpAuthority:'xp',acknowledged:true});
 const opts=rogueEntryOptions(record);
 record=setSavedRogueEntry(record,{skill:opts.skills[0],expertise:[opts.expertise[0],opts.skills[0]],
  language:opts.languages[0],masteries:['Dagger','Shortsword'],acknowledged:true});
 await characters.put(record);
 return characters.get(record.id);
}
test('Convergence 05 IDB: one revision-checked transaction activates all composite state and retains personal metadata',async()=>{
 const prev=await saved(),token=characterStorageRevision(prev);
 const updated=await characters.update(prev.id,row=>activateFighterRogue(row,{confirmed:true}),
  {expectedRevision:token,requireExisting:true});
 assert.notEqual(characterStorageRevision(updated),token);
 assert.equal(updated.multiclassActive.totalLevel,2);assert.equal(updated.play.hp,updated.multiclassActive.maxHP);
 assert.equal(updated.playUndo,null);assert.equal(updated.notes,prev.notes);assert.deepEqual(updated.inventoryReceipts,prev.inventoryReceipts);
 assert.deepEqual(await characters.get(prev.id),updated);
});
test('Convergence 05 IDB: parallel competing activation has one committed winner',async()=>{
 const prior=await saved(),expected=characterStorageRevision(prior);
 const results=await Promise.allSettled([characters.update(prior.id,row=>activateFighterRogue(row,{confirmed:true}),
  {expectedRevision:expected,requireExisting:true}),characters.update(prior.id,row=>activateFighterRogue(row,{confirmed:true}),
  {expectedRevision:expected,requireExisting:true})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(results.filter(r=>r.status==='rejected').length,1);
 assert.equal(results.find(r=>r.status==='rejected').reason.code,'CHARACTER_REVISION_CONFLICT');
 assert.equal((await characters.get(prior.id)).multiclassActive.totalLevel,2);
});
test('Convergence 05 IDB: invalid checkpoint or missing confirmation aborts with no revision change',async()=>{
 const prior=await saved(),before=structuredClone(prior),expected=characterStorageRevision(prior);
 await assert.rejects(characters.update(prior.id,row=>activateFighterRogue(row,{confirmed:false}),
  {expectedRevision:expected,requireExisting:true}),/Explicitly confirm/);
 await assert.rejects(characters.update(prior.id,row=>activateFighterRogue({...row,multiclassLevelUp:{...row.multiclassLevelUp,baseMaxHP:999}},
  {confirmed:true}),{expectedRevision:expected,requireExisting:true}),/review|changed/);
 assert.deepEqual(await characters.get(prior.id),before);
});

// Convergence 07: Active Rogue2 must use the same per-character IndexedDB
// revision guard as previous Rogue1 activation. This is a staged fake-IDB
// transaction test, not an actual two-tab browser acceptance.
const {advanceFighterRogue2}=await import('../dist/lib/advance-fighter-rogue2.mjs');
async function activeForSecondLevel(){
 const first=await saved();
 const activated=await characters.update(first.id,row=>activateFighterRogue(row,{confirmed:true}),
  {expectedRevision:characterStorageRevision(first),requireExisting:true});
 return characters.update(first.id,row=>({...row,play:{...row.play,xp:900}}),
  {expectedRevision:characterStorageRevision(activated),requireExisting:true});
}
test('Convergence 07 IDB: Rogue2 advancement is one revision-checked write, preserving extension fields',async()=>{
 const before=await activeForSecondLevel(),revision=characterStorageRevision(before);
 const after=await characters.update(before.id,row=>advanceFighterRogue2(row,{confirmed:true}),
  {expectedRevision:revision,requireExisting:true});
 assert.equal(after.multiclassActive.totalLevel,3);
 assert.equal(after.playUndo,null);
 assert.equal(after.multiclassActive.rogue2.hpMethod,'fixed');
 assert.notEqual(characterStorageRevision(after),revision);
 assert.equal(after.notes,before.notes);
 assert.deepEqual(after.inventoryReceipts,before.inventoryReceipts);
 assert.deepEqual(await characters.get(before.id),after);
});
test('Convergence 07 IDB: competing Rogue2 advancements have exactly one successful transaction',async()=>{
 const before=await activeForSecondLevel(),revision=characterStorageRevision(before);
 const jobs=[characters.update(before.id,row=>advanceFighterRogue2(row,{confirmed:true}),
  {expectedRevision:revision,requireExisting:true}),
  characters.update(before.id,row=>advanceFighterRogue2(row,{confirmed:true}),
  {expectedRevision:revision,requireExisting:true})];
 const outcomes=await Promise.allSettled(jobs);
 assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);
 assert.equal(outcomes.filter(o=>o.status==='rejected').length,1);
 assert.equal(outcomes.find(o=>o.status==='rejected').reason.code,'CHARACTER_REVISION_CONFLICT');
 assert.equal((await characters.get(before.id)).multiclassActive.secondaryLevel,2);
});
test('Convergence 07 IDB: missing milestone or false confirmation aborts unchanged character + revision',async()=>{
 const before=await activeForSecondLevel(),revision=characterStorageRevision(before),snapshot=structuredClone(before);
 for(const options of [{confirmed:false},{confirmed:true,xpAuthority:'gm',gmApproved:false},
   {confirmed:true,hpMethod:'rolled',hpRoll:10}]){
  await assert.rejects(characters.update(before.id,row=>advanceFighterRogue2(row,options),
   {expectedRevision:revision,requireExisting:true}));
  assert.deepEqual(await characters.get(before.id),snapshot);
 }
});
test('Convergence 07 IDB: a concurrent XP edit makes a stale Rogue2 write fail closed',async()=>{
 const before=await activeForSecondLevel(),revision=characterStorageRevision(before);
 await characters.update(before.id,row=>({...row,play:{...row.play,xp:950}}),
   {expectedRevision:revision,requireExisting:true});
 const snapshot=await characters.get(before.id);
 await assert.rejects(characters.update(before.id,row=>advanceFighterRogue2(row,{confirmed:true}),
   {expectedRevision:revision,requireExisting:true}),{code:'CHARACTER_REVISION_CONFLICT'});
 assert.deepEqual(await characters.get(before.id),snapshot);
});

// Convergence 08: The Rogue3 Thief subclass level-up reuses the exact saved-row
// compare-and-swap contract; do not assume two real browser tabs were tested.
const {advanceFighterRogue3}=await import('../dist/lib/advance-fighter-rogue3.mjs');
async function activeForThirdLevel(){
 const current=await activeForSecondLevel();
 const second=await characters.update(current.id,row=>advanceFighterRogue2(row,{confirmed:true}),
  {expectedRevision:characterStorageRevision(current),requireExisting:true});
 return characters.update(second.id,row=>({...row,play:{...row.play,xp:2700}}),
  {expectedRevision:characterStorageRevision(second),requireExisting:true});
}
test('Convergence 08 IDB: Rogue3 Thief commit is one revision-checked mutation and preserves foreign fields',async()=>{
 const before=await activeForThirdLevel(),revision=characterStorageRevision(before);
 const after=await characters.update(before.id,row=>advanceFighterRogue3(row,{confirmed:true}),
  {expectedRevision:revision,requireExisting:true});
 assert.equal(after.multiclassActive.secondaryLevel,3);
 assert.equal(after.multiclassActive.rogue3.subclass,'Thief');
 assert.equal(after.playUndo,null);
 assert.equal(after.notes,before.notes);
 assert.deepEqual(after.inventoryReceipts,before.inventoryReceipts);
 assert.notEqual(characterStorageRevision(after),revision);
 assert.deepEqual(await characters.get(before.id),after);
});
test('Convergence 08 IDB: two concurrent Rogue3 writes have one winner; losing transaction does not mutate the record',async()=>{
 const before=await activeForThirdLevel(),revision=characterStorageRevision(before);
 const tasks=[0,1].map(()=>characters.update(before.id,row=>advanceFighterRogue3(row,{confirmed:true}),
  {expectedRevision:revision,requireExisting:true}));
 const results=await Promise.allSettled(tasks);
 assert.equal(results.filter(o=>o.status==='fulfilled').length,1);
 assert.equal(results.filter(o=>o.status==='rejected').length,1);
 assert.equal(results.find(o=>o.status==='rejected').reason.code,'CHARACTER_REVISION_CONFLICT');
 assert.equal((await characters.get(before.id)).multiclassActive.secondaryLevel,3);
});
test('Convergence 08 IDB: rejected XP, missing confirmation or forged subclass leaves exact revision and Play unchanged',async()=>{
 const before=await activeForThirdLevel(),revision=characterStorageRevision(before),snapshot=structuredClone(before);
 for(const options of [{confirmed:false},{confirmed:true,subclass:'Arcane Trickster'},
  {confirmed:true,xpAuthority:'gm',gmApproved:false},{confirmed:true,hpMethod:'rolled',hpRoll:9}]){
  await assert.rejects(characters.update(before.id,row=>advanceFighterRogue3(row,options),
   {expectedRevision:revision,requireExisting:true}));
  assert.deepEqual(await characters.get(before.id),snapshot);
 }
});
