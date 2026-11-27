import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {inspectRoster,inspectRosterRecord} from '../dist/lib/roster-view.js';
import {makeRosterExport,readRosterExport,portableRosterRecordIssue,makeSavedRecordRecoveryExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {copy,setLanguage} from '../dist/locale.js';

const hero=()=>({id:'healthy-fighter',draft:templateCharacter('Fighter'),notes:{owner:'private'},updatedAt:'2026-11-19T00:00:00Z'});
const invalid=()=>({id:'broken-entry',draft:{model:2,name:'Unparseable',className:'Nonsense'},notes:{keep:'unaltered'},_characterRevision:'12345678-1234-1234-1234-123456789abc'});

test('one corrupt saved character cannot hide valid saved characters; inspection is read-only',()=>{
  const records=[hero(),invalid(),{id:'empty-entry',notes:{keep:42}}];
  const before=structuredClone(records);
  const result=inspectRoster(records);
  assert.equal(result.inspected.length,3);
  assert.equal(result.inspected[0].kind,'build');
  assert.equal(result.inspected[0].portable,true);
  assert.equal(result.inspected[1].kind,'unreadable');
  assert.equal(result.inspected[2].kind,'unreadable');
  assert.equal(result.excluded.length,2);
  assert.equal(result.portable.length,1);
  assert.deepEqual(records,before,'classification must not change or erase IndexedDB records');
});

test('malformed GCX and missing IDs are isolated and do not throw in roster rendering',()=>{
  for (const value of [null,undefined,{},[],{id:'gcx-bad',gcx:{character:{name:77}}},
    {id:'missing-name',gcx:{character:{name:'',classes:[]}}},
    {id:'bad-draft',draft:{get model(){throw new Error('corrupt');}}}]) {
    assert.doesNotThrow(()=>inspectRosterRecord(value));
    assert.equal(inspectRosterRecord(value).kind,'unreadable');
  }
});

test('partial roster backup explicitly excludes damaged entry and roundtrips all healthy metadata',async()=>{
  const records=[hero(),invalid()];
  assert.ok(portableRosterRecordIssue(records[1]));
  await assert.rejects(makeRosterExport(records),/invalid build/);
  const selection=inspectRoster(records);
  const partial=await makeRosterExport(selection.portable.map(row=>row.record));
  const imported=await readRosterExport(JSON.stringify(partial));
  assert.equal(imported.length,1);
  assert.deepEqual(imported[0].notes,records[0].notes);
  assert.equal(records[1].notes.keep,'unaltered');
});

test('recovery file preserves damaged local record exactly but is intentionally NOT a character import',async()=>{
  const broken=invalid();
  const original=structuredClone(broken);
  const file=await makeSavedRecordRecoveryExport(broken);
  assert.equal(file.kind,'saved-record-recovery');
  assert.equal(file.visibility,'private');
  assert.deepEqual(file.payload.record,broken);
  assert.equal(file.payload.record._characterRevision,broken._characterRevision);
  assert.deepEqual(broken,original);
  await assert.rejects(readSavedCharacterExport(JSON.stringify(file)),/Choose an Open 5E Companion/);
});

test('unsafe or lossy local records are never misrepresented as complete recovery files',async()=>{
  const unsafe=JSON.parse('{"id":"bad","__proto__":{"owned":true}}');
  await assert.rejects(makeSavedRecordRecoveryExport(unsafe),/copied faithfully/);
  const circular={id:'circle'};circular.self=circular;
  await assert.rejects(makeSavedRecordRecoveryExport(circular),/copied faithfully/);
  for(const x of [new Date(),new Map([['a',1]]),undefined,Infinity])
    await assert.rejects(makeSavedRecordRecoveryExport({id:'bad',data:x}),/copied faithfully/);
  const sparse=[,42];
  const symbols={valid:1};symbols[Symbol('hidden')]='discarded';
  const hidden={visible:1};Object.defineProperty(hidden,'private',{value:'not exportable',enumerable:false});
  for(const value of [sparse,symbols,hidden,-0])
    await assert.rejects(makeSavedRecordRecoveryExport({id:'lossy',data:value}),/copied faithfully/);

  await assert.rejects(makeSavedRecordRecoveryExport({id:'too-big',data:'a'.repeat(9*1024*1024)}),/exceeds 8 MB/);
});

test('public UI keeps full and partial backups separate and gives an explicit per-record recovery action',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(html,/id="roster-export-readable" hidden/);
  assert.match(html,/id="roster-warning" role="status" hidden/);
  assert.match(app,/\$\('roster-export'\)\.disabled=!records\.length\|\|excluded\.length>0/);
  assert.match(app,/makeRosterExport\(portable\.map\(row=>row\.record\)\)/);
  assert.match(app,/data-recovery-id=/);
  assert.match(app,/makeSavedRecordRecoveryExport\(record\)/);
  assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
  assert.match(sw,/\.\/lib\/roster-view\.js/);
});

test('recovery warning and actions are localized without translating canonical rules or data',()=>{
  setLanguage('id');
  try{
    assert.match(copy('Export readable characters only'),/Ekspor/);
    assert.match(copy('Saved record needs recovery'),/dipulihkan/);
    assert.match(copy('Download recovery copy'),/pemulihan/);
    assert.match(copy('Some saved records cannot be included in a full roster backup. They remain in this browser. Export readable characters separately, and download recovery copies for excluded records. The partial backup will NOT contain those records.'),/TIDAK/);
  }finally{setLanguage('en');}
});
