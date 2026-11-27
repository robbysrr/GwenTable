import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {normalizePlay,playProfile} from '../dist/lib/play.js';
import {makeGCX} from '../dist/lib/gcx.mjs';
import {makePlayExport,makeSavedCharacterExport,readSavedCharacterExport,makeRosterExport,readRosterExport} from '../dist/lib/portable.js';

const draft=()=>templateCharacter('Fighter');
const playFor=d=>normalizePlay(playProfile(d));
const validGCX=()=>makeGCX({sourceApp:'gwentable',sourceBuild:'test',exportMode:'build',
  portableCharacterId:'gwen:test',rulesProfile:'SRD_5_2_1',provenance:[],
  character:{name:'Test Fighter',kind:'PC',level:1,classes:[{name:'Fighter',level:1}]},
  preservedExtensions:{'custom/user-namespace':{userSetting:true}}});

test('individual Play export keeps safe custom fields, linked GCX, and Undo while stripping browser tokens',async()=>{
  const d=draft();
  const initial=playFor(d);
  const active={...initial,hp:Math.max(1,initial.hp-1)};
  const gcx=await validGCX();
  const record={id:'device:123',updatedAt:'2026-11-19T10:00:00Z',
    _characterRevision:'12345678-1234-1234-1234-123456789abc',
    _storageRevision:'12345678-1234-1234-1234-123456789abd',
    draft:d,play:initial,playUndo:initial,gcx,
    userNotes:{quest:'Remember the bridge',tags:['harbor','guild']},
    unknownVendor:{v:4,nested:{values:[1,2,3]}},
    extensions:{originalPrivateField:'kept'}};
  const before=structuredClone(record);
  const file=await makeSavedCharacterExport(record,active);
  assert.equal(file.kind,'character-play');
  assert.equal(file.schemaVersion,'2.0.0');
  const raw=JSON.stringify(file,null,2);
  assert.ok(Buffer.byteLength(raw,'utf8')<=512*1024);
  assert.ok(!raw.includes('12345678-1234-1234-1234-123456789abc'));
  assert.ok(!raw.includes('device:123'));
  assert.equal(Object.hasOwn(file.payload,'id'),false);
  assert.deepEqual(file.payload.extensions,{userNotes:record.userNotes,
    unknownVendor:record.unknownVendor,extensions:record.extensions});
  const reimport=await readSavedCharacterExport(raw);
  assert.deepEqual(reimport.draft,d);
  assert.deepEqual(reimport.play,active);
  assert.deepEqual(reimport.playUndo,initial);
  assert.deepEqual(reimport.gcx,gcx);
  assert.deepEqual(reimport.userNotes,record.userNotes);
  assert.deepEqual(reimport.unknownVendor,record.unknownVendor);
  assert.deepEqual(reimport.extensions,record.extensions);
  assert.equal(Object.hasOwn(reimport,'_characterRevision'),false);
  assert.deepEqual(record,before,'an individual export must not mutate the saved record');
});

test('individual backup can be re-exported without nesting or losing extension fields',async()=>{
  const d=draft();const play=playFor(d);
  const record={draft:d,play,notes:{source:'private'},extensions:{old:1}};
  const once=await makeSavedCharacterExport(record);
  const imported=await readSavedCharacterExport(JSON.stringify(once));
  const twice=await makeSavedCharacterExport(imported);
  assert.deepEqual(twice.payload,once.payload);
  assert.deepEqual(imported.notes,record.notes);
  assert.deepEqual(imported.extensions,record.extensions);
});

test('legacy two-field individual Play export retains the original portable contract',async()=>{
  const d=draft();const p=playFor(d);
  const file=await makePlayExport(d,p);
  assert.deepEqual(Object.keys(file.payload).sort(),['draft','play']);
  assert.deepEqual(await readSavedCharacterExport(JSON.stringify(file)),{draft:d,play:p});
});

test('single-character backup and roster backup agree on source-owned extension data',async()=>{
  const d=draft(), play=playFor(d);
  const record={id:'local',draft:d,play,extraA:{flag:67},extraB:['A','B']};
  const individual=await readSavedCharacterExport(JSON.stringify(await makeSavedCharacterExport(record)));
  const [roster]=await readRosterExport(JSON.stringify(await makeRosterExport([record])));
  assert.deepEqual(individual,roster);
});

test('unsafe metadata is rejected, not erased or silently converted',async()=>{
  const d=draft(),play=playFor(d);
  const malicious=JSON.parse('{"__proto__":{"polluted":true}}');
  await assert.rejects(makeSavedCharacterExport({draft:d,play,...malicious}),/unsafe or cannot be represented/);
  for(const value of [undefined,Infinity,3n,new Date('2026-11-19'),new Map([['a',1]])]) {
    await assert.rejects(makeSavedCharacterExport({draft:d,play,privateData:{value}}),/cannot be represented accurately in JSON/);
  }
  const circular={};circular.self=circular;
  await assert.rejects(makeSavedCharacterExport({draft:d,play,privateData:circular}),/cannot be represented accurately in JSON/);
  assert.equal(Object.prototype.polluted,undefined);
});

test('invalid Play/Undo or an unplayable record cannot be exported',async()=>{
  const d=draft(),play=playFor(d);
  await assert.rejects(makeSavedCharacterExport({draft:d,play:undefined}),/no playable state/);
  await assert.rejects(makeSavedCharacterExport({draft:d,play,playUndo:{...play,hp:5000}}),/invalid play state/);
  await assert.rejects(makeSavedCharacterExport({draft:d,play:{...play,hp:5000}}),/invalid play state/);
  await assert.rejects(makeSavedCharacterExport({gcx:await validGCX()}),/valid build/);
});

test('oversized single-character exports refuse to generate unreadable backups',async()=>{
  const d=draft(),play=playFor(d);
  const record={draft:d,play,personalMemo:'a'.repeat(600_000)};
  await assert.rejects(makeSavedCharacterExport(record),/exceeds 512 KB/);
  const file=await makePlayExport(d,play);
  file.payload.extensions={personalMemo:'a'.repeat(600_000)};
  await assert.rejects(readSavedCharacterExport(JSON.stringify(file)),/under 512 KB/);
});

test('modified or unexpected single-character backup payloads are rejected',async()=>{
  const d=draft(),play=playFor(d);
  const saved=await makeSavedCharacterExport({draft:d,play,personalMemo:'initial'});
  saved.payload.extensions.personalMemo='changed';
  await assert.rejects(readSavedCharacterExport(JSON.stringify(saved)),/integrity/);
  const other=await makePlayExport(d,play);
  other.payload.id='attacker-local-id';
  await assert.rejects(readSavedCharacterExport(JSON.stringify(other)),/integrity/);
});

test('Play workspace exports the full record snapshot and precaches updated code',()=>{
  const sheet=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(sheet,/makeSavedCharacterExport\(opened,play\)/);
  assert.doesNotMatch(sheet,/download\(makePlayExport\(/);
  assert.match(worker,/open-5e-v0\.25\.7-inventory-dev/);
  assert.match(worker,/\.\/lib\/portable\.js/);
  assert.match(worker,/\.\/play-sheet\.js/);
});


test('even correctly rehashed payloads cannot smuggle browser fields or override core data',async()=>{
  const d=draft(),play=playFor(d);
  const signature=async file=>{
    const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'
      ?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
    const {integrity,...body}=file;
    const bytes=new TextEncoder().encode(JSON.stringify(canonical(body)));
    integrity.value=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
      byte=>byte.toString(16).padStart(2,'0')).join('');
    return JSON.stringify(file);
  };
  const polluted=await makePlayExport(d,play);
  polluted.payload.extensions=JSON.parse('{"__proto__":{"polluted":true}}');
  await assert.rejects(readSavedCharacterExport(await signature(polluted)),/Choose an Open 5E Companion/);
  const browserKey=await makePlayExport(d,play);
  browserKey.payload.extensions={_characterRevision:'12345678-1234-1234-1234-123456789abc'};
  await assert.rejects(readSavedCharacterExport(await signature(browserKey)),/invalid extension metadata/);
  const overwrite=await makePlayExport(d,play);
  overwrite.payload.extensions={draft:{name:'Injected'}};
  await assert.rejects(readSavedCharacterExport(await signature(overwrite)),/invalid extension metadata/);
  const extraneous=await makePlayExport(d,play);
  extraneous.payload.deviceId='device-secret';
  await assert.rejects(readSavedCharacterExport(await signature(extraneous)),/Invalid character build/);
  assert.equal(Object.prototype.polluted,undefined);
});

test('extra data is visibly flagged on import, and new export errors have Indonesian UI copy',async()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const {messages}=await import('../dist/locale-copy.js');
  assert.match(app,/Includes private extension metadata/);
  assert.match(app,/Includes Undo checkpoint/);
  assert.match(messages['This individual character exceeds 512 KB. Use the private roster backup instead.'].id,/cadangan daftar karakter/);
});
