import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergeSavedCharacterBuild} from '../dist/saved-character-build.js';
import {templateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,reconcilePlay} from '../dist/lib/play.js';
import {makeRosterExport,readRosterExport} from '../dist/lib/portable.js';

const fighter=()=>templateCharacter('Fighter');

test('a new character keeps the submitted record and does not invent play history',()=>{
  const record={id:'new',draft:fighter(),updatedAt:'2026-11-19T03:00:00Z'};
  assert.deepEqual(mergeSavedCharacterBuild(undefined,record),record);
  assert.deepEqual(mergeSavedCharacterBuild(null,record),record);
  assert.equal(Object.hasOwn(mergeSavedCharacterBuild(undefined,record),'play'),false);
});

test('saving an existing build preserves unknown top-level extension fields, GCX and personal notes',()=>{
  const draft=fighter();
  const current={id:'existing',draft,updatedAt:'old',gcx:{legacyLink:'preserve'},
    ownerNotes:{author:'player',lines:['Keep this background story']},
    importedExtension:{source:'user:private',n:42},
    futureVersionData:{schema:99,keep:{custom:true}}};
  const original=structuredClone(current);
  const replacement={id:current.id,draft:{...draft,name:'New name'},updatedAt:'new'};
  const merged=mergeSavedCharacterBuild(current,replacement);
  assert.equal(merged.draft.name,'New name');
  assert.equal(merged.updatedAt,'new');
  for(const key of ['gcx','ownerNotes','importedExtension','futureVersionData'])
    assert.deepEqual(merged[key],original[key],`lost ${key}`);
  assert.deepEqual(current,original,'the merge must be pure and not mutate the saved record');
  assert.notEqual(merged,current);
});

test('Play and Undo stay intact when editing the name of a character',()=>{
  const draft=fighter();
  const profile=playProfile(draft);
  const current={id:'fighter',draft,play:normalizePlay(profile,{hp:profile.maxHP-3,log:['Used a potion']}),
    playUndo:normalizePlay(profile,{hp:profile.maxHP,log:['Undo checkpoint']}),
    playerMemo:'Do not delete'};
  const changed={id:'fighter',draft:{...draft,name:'Renamed Fighter'},updatedAt:'new'};
  const merged=mergeSavedCharacterBuild(current,changed);
  assert.deepEqual(merged.play,current.play);
  assert.deepEqual(merged.playUndo,current.playUndo);
  assert.equal(merged.playerMemo,'Do not delete');
});

test('level or Class changes reconcile Play and Undo independently without resetting unrelated metadata',()=>{
  const draft=fighter();
  const currentProfile=playProfile(draft);
  const current={id:'upgraded',draft,play:normalizePlay(currentProfile,{hp:currentProfile.maxHP-4,log:['Combat 1']}),
    playUndo:normalizePlay(currentProfile,{hp:currentProfile.maxHP-2,log:['Combat checkpoint']}),
    extra:{unknown:['still here']}};
  const replacement={id:'upgraded',draft:{...templateCharacter('Wizard'),name:'Scholar'},updatedAt:'new'};
  const after=playProfile(replacement.draft);
  const merged=mergeSavedCharacterBuild(current,replacement);
  assert.deepEqual(merged.play,reconcilePlay(currentProfile,after,current.play));
  assert.deepEqual(merged.playUndo,reconcilePlay(currentProfile,after,current.playUndo));
  assert.notDeepEqual(merged.play,merged.playUndo);
  assert.deepEqual(merged.extra,current.extra);
});

test('an unrelated legacy Undo field remains intact if no active Play state exists',()=>{
  const record={id:'legacy',draft:fighter(),playUndo:{legacy:'retain'},legacyExtra:{keep:true}};
  const merged=mergeSavedCharacterBuild(record,{id:'legacy',draft:{...record.draft,name:'Update'}});
  assert.deepEqual(merged.playUndo,{legacy:'retain'});
  assert.deepEqual(merged.legacyExtra,{keep:true});
});

test('the live Build save uses the safe merge within the atomic character revision update',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(app,/characters\.update\(record\.id,current=>mergeSavedCharacterBuild\(current,record\)/);
  assert.match(app,/\{expectedRevision,createOnly:existingId===null,requireExisting:existingId!==null\}/);
  assert.match(worker,/open-5e-v0\.25\.7-inventory-dev/);
  assert.match(worker,/\.\/saved-character-build\.js/);
});


test('private roster backup and reimport preserve future-version and user extension fields',async()=>{
  const draft=fighter();
  const original={id:'local:1',updatedAt:'2026-11-19',_characterRevision:'12345678-1234-1234-1234-123456789abc',
    draft,gcx:undefined,legacyNotes:{text:'do not lose this'},
    thirdParty:{source:'custom:user',nested:{flags:['a','b']}},extensions:{myOldAppField:42}};
  const backup=await makeRosterExport([original]);
  assert.deepEqual(backup.payload[0].extensions,{legacyNotes:original.legacyNotes,
    thirdParty:original.thirdParty,extensions:original.extensions});
  assert.equal(JSON.stringify(backup).includes(original._characterRevision),false);
  assert.equal(Object.hasOwn(backup.payload[0],'id'),false);
  const [restored]=await readRosterExport(JSON.stringify(backup));
  assert.deepEqual(restored.legacyNotes,original.legacyNotes);
  assert.deepEqual(restored.thirdParty,original.thirdParty);
  assert.deepEqual(restored.extensions,original.extensions);
  assert.equal(Object.hasOwn(restored,'id'),false,'import must create a new local ID');
  assert.equal(Object.hasOwn(restored,'_characterRevision'),false);
  const again=await makeRosterExport([restored]);
  assert.deepEqual(again.payload,backup.payload,'second export must not nest or drop extension fields');
});

test('legacy v0.23.3 roster backups without extensions remain readable',async()=>{
  const backup=await makeRosterExport([{id:'old',draft:fighter()}]);
  const [restored]=await readRosterExport(JSON.stringify(backup));
  assert.deepEqual(restored,{draft:fighter()});
});

test('roster exports refuse dangerous extension keys and excessively nested metadata',async()=>{
  const unsafe=JSON.parse('{"__proto__":{"polluted":true}}');
  await assert.rejects(makeRosterExport([{draft:fighter(),...unsafe}]),/unsafe or cannot be represented/);
  const tooDeep={};let target=tooDeep;
  for(let i=0;i<15;i++){target.node={};target=target.node;}
  await assert.rejects(makeRosterExport([{draft:fighter(),privateExtension:tooDeep}]),/unsafe or cannot be represented/);
  assert.equal(Object.prototype.polluted,undefined);
});


test('a backup cannot silently discard unsupported IndexedDB extension values',async()=>{
  for(const value of [new Date('2026-11-19'),new Map([['key',1]]),undefined,Infinity,3n]) {
    await assert.rejects(makeRosterExport([{draft:fighter(),userMetadata:{value}}]),
      /cannot be represented accurately in JSON/);
  }
  const circular={};circular.self=circular;
  // Note: the source tree guard must be cycle-safe so this rejection terminates.
  // The cycle is detected by jsonSafeExtension before hashing.
  await assert.rejects(makeRosterExport([{draft:fighter(),userMetadata:circular}]),
    /cannot be represented accurately in JSON/);
});
