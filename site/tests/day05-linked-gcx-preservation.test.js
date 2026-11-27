import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,reconcilePlay} from '../dist/lib/play.js';
import {mergeLinkedGCXUpdate} from '../dist/linked-gcx-update.js';
import {setLanguage,copy} from '../dist/locale.js';

const fighter=()=>templateCharacter('Fighter');
const profile=d=>playProfile(d);
const play=(d,hp=undefined)=>normalizePlay(profile(d),hp===undefined?{}:{hp});
const gcx=id=>({portableCharacterId:id,format:'GCX',preservedExtensions:{}});

test('linked GCX Build update retains user notes, extra keys and independent Play and Undo',()=>{
  const d=fighter(), original={id:'local-id',updatedAt:'before',_characterRevision:'browser-revision',draft:d,
    gcx:gcx('gwen:hero'),play:play(d,6),playUndo:play(d,8),
    privateNotes:{history:'player text'},homebrew:{source:'user',nested:[1,2,3]},extensions:{owner:'user'}};
  const before=structuredClone(original);
  const candidate={draft:{...d,name:'Edited from GCX'},gcx:gcx('gwen:hero')};
  const merged=mergeLinkedGCXUpdate(original,candidate,'after');
  assert.equal(merged.draft.name,'Edited from GCX');
  assert.equal(merged.id,'local-id');
  assert.equal(merged.updatedAt,'after');
  assert.deepEqual(merged.privateNotes,original.privateNotes);
  assert.deepEqual(merged.homebrew,original.homebrew);
  assert.deepEqual(merged.extensions,original.extensions);
  assert.deepEqual(merged.play,original.play);
  assert.deepEqual(merged.playUndo,original.playUndo);
  assert.deepEqual(original,before,'must not mutate record read from IndexedDB');
});

test('Class-changing linked Build update reconciles Play and Undo separately',()=>{
  const d=fighter(), newDraft={...templateCharacter('Wizard'),name:'Scholar'};
  const record={id:'hero',draft:d,play:play(d,5),playUndo:play(d,7),privateData:{keep:true}};
  const updated=mergeLinkedGCXUpdate(record,{draft:newDraft,gcx:gcx('gwen:hero')},'now');
  assert.deepEqual(updated.play,reconcilePlay(profile(d),profile(newDraft),record.play));
  assert.deepEqual(updated.playUndo,reconcilePlay(profile(d),profile(newDraft),record.playUndo));
  assert.deepEqual(updated.privateData,record.privateData);
});

test('applying live GCX updates current Play, using previous Play for one-step Undo',()=>{
  const d=fighter();
  const record={id:'hero',draft:d,play:play(d,4),playUndo:play(d,7),playerText:'keep'};
  const imported=play(d,9);
  const updated=mergeLinkedGCXUpdate(record,{draft:d,gcx:gcx('gwen:hero'),play:imported},'now');
  assert.deepEqual(updated.play,imported);
  assert.deepEqual(updated.playUndo,record.play,'Undo should restore state before the import');
  assert.equal(updated.playerText,'keep');
  assert.deepEqual(record.playUndo,play(d,7),'original state unchanged');
});

test('live GCX update without prior Play does not carry stale Undo checkpoint',()=>{
  const d=fighter();
  const updated=mergeLinkedGCXUpdate({id:'hero',draft:d,playUndo:play(d,7),privateData:42},
    {draft:d,gcx:gcx('gwen:hero'),play:play(d,9)},'now');
  assert.equal(Object.hasOwn(updated,'playUndo'),false);
  assert.equal(updated.privateData,42);
});

test('foreign GCX-only update preserves unrelated private metadata without inventing a draft',()=>{
  const old={id:'foreign',gcx:gcx('custom:foreign'),privateNotes:['not SRD'],extensions:{nested:true}};
  const revised=mergeLinkedGCXUpdate(old,{gcx:gcx('custom:foreign')},'now');
  assert.deepEqual(revised.privateNotes,old.privateNotes);
  assert.deepEqual(revised.extensions,old.extensions);
  assert.equal(Object.hasOwn(revised,'draft'),false);
});

test('mismatched build types and missing linked records cannot overwrite the existing save',()=>{
  const d=fighter();
  assert.throws(()=>mergeLinkedGCXUpdate(null,{draft:d,gcx:gcx('gwen:1')},'now'),/unavailable/);
  assert.throws(()=>mergeLinkedGCXUpdate({draft:d},{gcx:gcx('gwen:1')},'now'),/separate copy/);
  assert.throws(()=>mergeLinkedGCXUpdate({gcx:gcx('gwen:1')},{draft:d,gcx:gcx('gwen:1')},'now'),/separate copy/);
  assert.throws(()=>mergeLinkedGCXUpdate({draft:d},{draft:d},'now'),/invalid/);
});

test('GCX update path still uses the revision-checked transaction and new module is offline cached',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(app,/characters\.update\(linked\.id,current=>/);
  assert.match(app,/mergeLinkedGCXUpdate\(current,candidate,updatedAt\)/);
  assert.match(app,/expectedRevision:characterStorageRevision\(linked\),requireExisting:true/);
  assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
  assert.match(sw,/\.\/linked-gcx-update\.js/);
});

test('live resource replacement notice is present in both locales',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  assert.match(app,/Applying a live snapshot replaces Play resources/);
  const source='Applying a live snapshot replaces Play resources. Undo restores your previous Play state if available.';
  setLanguage('en');assert.match(copy(source),/Undo restores/);
  setLanguage('id');assert.match(copy(source),/Undo memulihkan/);
  setLanguage('en');
});
