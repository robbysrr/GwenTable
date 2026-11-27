import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeDraftBackup,readDraftBackup,draftBackupLimit,safeDraftBackupTree} from '../dist/draft-recovery.js';
import {sortSavedCharacters} from '../dist/lib/roster-sort.js';

const sample=()=>({draft:{model:2,name:'Older draft',unknown:{producer:'custom:extension',items:[{label:'kept'}]}},
  olderDrafts:[],legacyField:{notes:'custom field'},saved:true});
const serialized=value=>JSON.stringify({format:'gwentable-draft-backup',version:1,kind:'unfinished-draft',snapshot:value});

test('backup migration keeps safe unknown fields and never imports completion authority',()=>{
  const input=sample();
  const loaded=readDraftBackup(serialized(input));
  assert.deepEqual(loaded.draft.unknown,input.draft.unknown);
  assert.deepEqual(loaded.legacyField,input.legacyField);
  assert.equal(loaded.saved,false);
  assert.equal(loaded.id,null);
  assert.deepEqual(input,sample());
});

test('prototype pollution keys are refused at every depth, including historic recovery entries',()=>{
  for(const field of ['__proto__','constructor','prototype']){
    const poison=JSON.parse('{"'+field+'":{"polluted":true}}');
    const current=sample();current.draft.unknown=poison;
    assert.equal(safeDraftBackupTree(current),false);
    assert.throws(()=>readDraftBackup(serialized(current)),/unsafe or excessively nested/);
    assert.throws(()=>makeDraftBackup(current),/unsafe or excessively nested/);
    const history=sample();history.olderDrafts=[{draft:{custom:{nested:poison}}}];
    assert.throws(()=>readDraftBackup(serialized(history)),/unsafe or excessively nested/);
  }
  assert.equal(Object.prototype.polluted,undefined);
});

test('backup tree depth limits reject malicious nested payload without dropping normal arrays',()=>{
  const deep=sample(); let slot=deep.draft.unknown;
  for(let i=0;i<34;i++){slot.more={};slot=slot.more;}
  assert.equal(safeDraftBackupTree(deep),false);
  assert.throws(()=>readDraftBackup(serialized(deep)),/unsafe or excessively nested/);
  const valid=sample();valid.draft.unknown.deep={one:[{two:{three:1}}]};
  assert.deepEqual(readDraftBackup(serialized(valid)).draft.unknown,valid.draft.unknown);
});

test('backup export enforces the same UTF-8 payload limit as backup import',()=>{
  const huge=sample();huge.draft.unknown.text='界'.repeat(Math.ceil(draftBackupLimit/3));
  assert.throws(()=>makeDraftBackup(huge),/exceeds 8 MB/);
  assert.throws(()=>readDraftBackup(serialized(huge)),/under 8 MB/);
});

test('valid shared object references do not prevent backup export',()=>{
  const fixture=sample();fixture.legacyField.shared=fixture.draft.unknown;
  const file=makeDraftBackup(fixture);
  assert.deepEqual(readDraftBackup(JSON.stringify(file)).legacyField.shared,fixture.draft.unknown);
});

test('saved-character sorting accepts missing or malformed legacy timestamps',()=>{
  const input=[{id:'z-old'},{id:'fresh',updatedAt:'2026-11-19T02:00:00.000Z'},
    {id:'bad-date',updatedAt:'not-a-date'},{id:'mid',updatedAt:'2026-11-18T03:00:00.000Z'},
    {id:'a-old',updatedAt:null}];
  const original=structuredClone(input);
  assert.deepEqual(sortSavedCharacters(input).map(x=>x.id),['fresh','mid','a-old','bad-date','z-old']);
  assert.deepEqual(input,original);
});

test('saved-character sorting is deterministic when two records share a timestamp',()=>{
  const input=[{id:'B',updatedAt:'2026-11-19T01:00:00Z'},{id:'A',updatedAt:'2026-11-19T01:00:00Z'}];
  assert.deepEqual(sortSavedCharacters(input).map(x=>x.id),['A','B']);
});

test('roster screen and backup use the same safe timestamp sort',()=>{
  const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  assert.ok(source.includes('const records=sortSavedCharacters(await characters.list());'));
  assert.ok(source.includes('makeRosterExport(sortSavedCharacters(records))'));
  assert.equal(source.includes('b.updatedAt.localeCompare(a.updatedAt)'),false);
});

test('draft-backup UI catches synchronous size and validation errors and translates them',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const copy=readFileSync(new URL('../dist/locale-copy.js',import.meta.url),'utf8');
  assert.ok(app.includes('Promise.resolve().then(()=>makeDraftBackup(currentDraftSnapshot()))'));
  assert.ok(app.includes("copy('Export failed. ')+copy(error.message)"));
  assert.ok(copy.includes('Ukuran cadangan draf melebihi 8 MB'));
  assert.ok(copy.includes('struktur yang terlalu bertingkat'));
});

test('offline service worker revision precaches the new roster sort dependency',()=>{
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.ok(sw.includes("const revision='open-5e-v0.25.7-inventory-dev.10-player-convergence08-integration13'"));
  assert.ok(sw.includes("'./lib/roster-sort.js'"));
});
