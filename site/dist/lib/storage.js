import {characterStorageRevision} from './revision-tokens.js';
export {characterStorageRevision} from './revision-tokens.js';
const connection = new Promise((resolve,reject)=>{
  if (!globalThis.indexedDB) return reject(new Error('IndexedDB unavailable.'));
  const request = indexedDB.open('open-5e-companion',2);
  request.onupgradeneeded = event => {
    if (event.oldVersion<1) {
      request.result.createObjectStore('drafts');
      request.result.createObjectStore('characters',{keyPath:'id'});
    }
    request.result.createObjectStore('encounters',{keyPath:'id'});
  };
  const deadline = setTimeout(()=>reject(new Error('Browser storage did not open in time.')),3500);
  request.onsuccess=()=>{
    clearTimeout(deadline);
    request.result.onversionchange=()=>request.result.close();
    resolve(request.result);
  };
  request.onerror=()=>{
    clearTimeout(deadline);
    reject(request.error);
  };
  request.onblocked=()=>{
    clearTimeout(deadline);
    reject(new Error('Close other tabs of the app, then reload.'));
  };
});
export async function db(store, mode, action) {
  const conn=await connection;
  return new Promise((resolve,reject)=>{
    const tx=conn.transaction(store,mode);
    const request=action(tx.objectStore(store));
    tx.oncomplete=()=>resolve(request.result);
    tx.onabort=()=>reject(tx.error);
    tx.onerror=()=>reject(tx.error);
  });
}
// A guest draft is a single shared browser record. Give every successful write
// a fresh opaque token so two open tabs cannot silently overwrite one another.
// Legacy v0.22.x drafts have no token and are readable without migration.
export const draftConflictCode='DRAFT_REVISION_CONFLICT';
export class DraftConflictError extends Error {
  constructor(){
    super('This draft changed in another tab. Export your unsaved changes, then reload the latest saved draft.');
    this.name='DraftConflictError';
    this.code=draftConflictCode;
  }
}
export function draftStorageRevision(record) {
  return typeof record?._storageRevision==='string'&&/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(record._storageRevision)
    ?record._storageRevision:null;
}
export function conditionalDraftRecord(current,expected,next,newRevision) {
  if(draftStorageRevision(current)!==expected) throw new DraftConflictError();
  // Never trust metadata embedded in a restored/imported draft.
  return {...next,_storageRevision:newRevision};
}
export const drafts = {
  get:()=>db('drafts','readonly',store=>store.get('active')),
  // Deprecated internal method retained for compatibility with older tools.
  set:record=>db('drafts','readwrite',store=>store.put(record,'active')),
  async compareAndSet(record,expectedRevision) {
    const conn=await connection;
    return new Promise((resolve,reject)=>{
      const tx=conn.transaction('drafts','readwrite');
      const store=tx.objectStore('drafts');
      const current=store.get('active');
      const nextRevision=crypto.randomUUID();
      let failure;
      current.onsuccess=()=>{
        try {
          // Read AND compare AND write inside one IndexedDB readwrite
          // transaction. A pre-read in a separate transaction is unsafe.
          store.put(conditionalDraftRecord(current.result,expectedRevision,record,nextRevision),'active');
        } catch(error) {
          failure=error;
          tx.abort();
        }
      };
      tx.oncomplete=()=>resolve(nextRevision);
      tx.onabort=()=>reject(failure??tx.error??new Error('Draft write was aborted.'));
      tx.onerror=()=>reject(failure??tx.error??new Error('Draft write failed.'));
    });
  }
};
// Use separate keys in the existing store so saved characters never need a database upgrade.
const templateKey=edition=>'pdf-template:'+edition;
export const pdfTemplates = {
  get:edition=>db('drafts','readonly',store=>store.get(templateKey(edition))),
  set:(edition,template)=>db('drafts','readwrite',store=>store.put(template,templateKey(edition))),
  remove:edition=>db('drafts','readwrite',store=>store.delete(templateKey(edition)))
};
// Each saved character has its own local revision. A stale Build or Play tab
// must not replace later changes to the same character. No schema upgrade is
// needed: v0.23.0 and older records simply have a null revision.
export const characterConflictCode='CHARACTER_REVISION_CONFLICT';
export class CharacterConflictError extends Error {
  constructor(){
    super('This saved character changed in another tab. Keep a draft backup of your edits, then reopen the latest saved character.');
    this.name='CharacterConflictError';
    this.code=characterConflictCode;
  }
}
export function conditionalCharacterRecord(current,expected,next,newRevision,{createOnly=false,requireExisting=false}={}) {
  if(createOnly&&current || requireExisting&&!current || expected!==undefined&&characterStorageRevision(current)!==expected)
    throw new CharacterConflictError();
  if(!next||typeof next!=='object'||!next.id||(current&&next.id!==current.id))
    throw new Error('The character ID cannot change during a save.');
  // Never accept a revision supplied by imported or editable character data.
  return {...next,_characterRevision:newRevision};
}
export const characters = {
  get:id=>db('characters','readonly',store=>store.get(id)),
  list:()=>db('characters','readonly',store=>store.getAll()),
  // Former unconditional put is create-only; overwriting a saved character
  // requires update() with a revision check or an in-transaction transform.
  put:record=>db('characters','readwrite',store=>store.add({...record,_characterRevision:crypto.randomUUID()})),
  addBatch:records=>db('characters','readwrite',store=>{
    try {
      // add() rejects an ID collision and aborts the transaction with every entry.
      return records.map(record=>store.add({...record,_characterRevision:crypto.randomUUID()})).at(-1);
    } catch(error) {
      store.transaction.abort();
      throw error;
    }
  }),
  async update(id,transform,options={}) {
    const conn=await connection;
    return new Promise((resolve,reject)=>{
      const tx=conn.transaction('characters','readwrite');
      const store=tx.objectStore('characters');
      const request=store.get(id);
      let changed;
      let failure;
      request.onsuccess=()=>{
        try {
          // Compare the caller's acknowledged revision in the SAME IndexedDB
          // readwrite transaction as the write, never in a separate pre-read.
          const current=request.result;
          if(options.createOnly&&current || options.requireExisting&&!current ||
              Object.hasOwn(options,'expectedRevision')&&characterStorageRevision(current)!==options.expectedRevision)
            throw new CharacterConflictError();
          const next=transform(current);
          // An acknowledged replay may finish without a put or a new revision.
          if(options.skipUnchanged&&current&&next===current) {
            changed=current;
            return;
          }
          changed=conditionalCharacterRecord(current,undefined,next,crypto.randomUUID(),options);
          store.put(changed);
        } catch(error) {
          failure=error;
          tx.abort();
        }
      };
      tx.oncomplete=()=>resolve(changed);
      tx.onabort=()=>reject(failure??tx.error??new Error('Character write was aborted.'));
      // Requests may emit errors before an explicit abort finishes. Resolve
      // or reject on the transaction outcome so callers can retry safely.
      tx.onerror=event=>{failure??=event.target.error;};
    });
  }
};

export const encounters = {
  get:id=>db('encounters','readonly',store=>store.get(id)),
  list:()=>db('encounters','readonly',store=>store.getAll()),
  add:record=>db('encounters','readwrite',store=>store.add(record)),
  async replace(record, expectedRevision) {
    const conn=await connection;
    return new Promise((resolve,reject)=>{
      const tx=conn.transaction('encounters','readwrite');
      const store=tx.objectStore('encounters');
      const current=store.get(record.id);
      let conflict=false;
      current.onsuccess=()=>{
        if (current.result?.revision!==expectedRevision) {
          conflict=true;
          tx.abort();
          return;
        }
        store.put(record);
      };
      tx.oncomplete=()=>resolve();
      tx.onabort=()=>reject(conflict?new Error('This encounter changed in another tab. Reopen it before editing.'):tx.error);
      tx.onerror=()=>reject(tx.error);
    });
  }
};

const npcKey=id=>'npc:'+id;
export const npcs={
  list:()=>db('drafts','readonly',store=>store.getAll(IDBKeyRange.bound('npc:','npc;',false,true))),
  add:record=>db('drafts','readwrite',store=>store.add(record,npcKey(record.id))),
  remove:id=>db('drafts','readwrite',store=>store.delete(npcKey(id))),
  notes:(id,notes)=>db('drafts','readwrite',store=>{
    const request=store.get(npcKey(id));
    request.onsuccess=()=>{
      if(request.result) store.put({...request.result,notes},npcKey(id));
    };
    return request;
  })
};
