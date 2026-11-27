import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {preflightInventoryBackup} from '../dist/lib/inventory-backup-preflight.js';
import {runPreflightCLI} from '../scripts/preflight-inventory-export.mjs';
import {inventoryFixture} from './fixtures/inventory-character.mjs';
import {makeRosterExport,makeSavedCharacterExport} from '../dist/lib/portable.js';
import {applySavedInventoryCommand,inventoryField} from '../dist/lib/saved-inventory.js';

const uid = '11111111-2222-4333-8444-555555555555';
const encoded = async record => JSON.stringify(await makeSavedCharacterExport(record));
const fixture = () => ({...inventoryFixture(),inventory:['Uncatalogued private tome'],gp:14,customNotes:'SENSITIVE_SECRET_STRING'});
const activate = r => applySavedInventoryCommand(r,{type:'activate',operationId:uid,expectedRevision:null});

test('tracked, known-weight private character export is structurally ready, but never migration-certified',async()=>{
  const record=activate({...inventoryFixture(),inventory:['Dagger'],gp:14});
  const before=structuredClone(record);
  const r=await preflightInventoryBackup(await encoded(record));
  assert.equal(r.status,'structurally-ready');
  assert.equal(r.migrationAccepted,false);
  assert.equal(r.entries[0].status,'structurally-ready');
  assert.equal(r.entries[0].inventoryState,'tracked');
  assert.deepEqual(record,before);
  assert.equal(JSON.stringify(r).includes(record.draft.name),false);
});

test('unactivated legacy preview and unknown weights require manual review without losing original fields',async()=>{
  const record=fixture();
  const before=structuredClone(record);
  const r=await preflightInventoryBackup(await encoded(record));
  assert.equal(r.status,'manual-review');
  assert.deepEqual(r.entries[0].codes,['UNACTIVATED_INVENTORY','UNKNOWN_CARRIED_WEIGHT']);
  assert.deepEqual(record,before);
  assert.equal(JSON.stringify(r).includes('SENSITIVE_SECRET_STRING'),false);
  assert.equal(JSON.stringify(r).includes(record.draft.name),false);
});

test('ambiguously overlapping money schemas do not authorize inventory migration',async()=>{
  const r=await preflightInventoryBackup(await encoded({...fixture(),wallet:{gp:42}}));
  assert.equal(r.status,'manual-review');
  assert.deepEqual(r.entries[0].codes,['MANUAL_LEGACY_REVIEW']);
});

test('mixed roster gives per-record redacted readiness, not a false green gate',async()=>{
  const records=[activate({...inventoryFixture(),inventory:['Dagger'],gp:1}),fixture()];
  const r=await preflightInventoryBackup(JSON.stringify(await makeRosterExport(records)));
  assert.equal(r.kind,'character-roster');
  assert.equal(r.characterCount,2);
  assert.deepEqual(r.counts,{structurallyReady:1,manualReview:1});
  assert.equal(r.status,'manual-review');
  assert.equal(JSON.stringify(r).includes('SENSITIVE_SECRET_STRING'),false);
});

test('tampered integrity is rejected, never summarized as validated',async()=>{
  const raw=await encoded(activate({...inventoryFixture(),inventory:['Dagger'],gp:3}));
  const data=JSON.parse(raw);data.payload.draft.name='private-tampered-name';
  assert.deepEqual((await preflightInventoryBackup(JSON.stringify(data))).code,'INVALID_EXPORT');
  assert.equal(JSON.stringify(await preflightInventoryBackup(JSON.stringify(data))).includes('private-tampered-name'),false);
});

test('invalid JSON and unsupported files fail closed without echoing private bytes',async()=>{
  assert.equal((await preflightInventoryBackup('{"name":"SENSITIVE_SECRET_STRING"')).code,'INVALID_JSON');
  assert.equal((await preflightInventoryBackup(JSON.stringify({kind:'saved-record-recovery',secret:'SENSITIVE_SECRET_STRING'}))).code,'UNSUPPORTED_FORMAT');
  assert.equal((await preflightInventoryBackup(null)).code,'INVALID_JSON');
});

test('recognized old character export is preview-only or unsupported, never autoactivated',async()=>{
  const data=JSON.parse(await encoded(fixture()));
  assert.equal((await preflightInventoryBackup(JSON.stringify(data))).entries[0].inventoryState,'legacy-preview');
});

test('CLI can write restrictive redacted report once and never overwrite it or mutate export',async()=>{
  const folder=await mkdtemp(join(tmpdir(),'gt-inventory-preflight-'));
  const source=join(folder,'private.json'),target=join(folder,'redacted.json');
  const raw=await encoded(fixture());
  await writeFile(source,raw);
  let output='';const streams={stdout:{write:s=>output+=s},stderr:{write:s=>output+=s}};
  const one=await runPreflightCLI([source,'--output',target],{readFile,writeFile,stat,...streams});
  assert.equal(one,2);
  assert.equal((await stat(target)).mode & 0o777,0o600);
  assert.equal(await readFile(source,'utf8'),raw);
  const report=await readFile(target,'utf8');
  assert.equal(report.includes('SENSITIVE_SECRET_STRING'),false);
  assert.equal(await runPreflightCLI([source,'--output',target],{readFile,writeFile,stat,...streams}),73);
  assert.equal(await readFile(target,'utf8'),report);
});

test('oversized untrusted JSON is rejected before parsing or reading from disk',async()=>{
  assert.equal((await preflightInventoryBackup('x'.repeat(8*1024*1024+1))).code,'TOO_LARGE');
  let read=false;let errors='';
  const code=await runPreflightCLI(['/tmp/private-large.json'],{
    stat:async()=>({isFile:()=>true,size:9*1024*1024}),
    readFile:async()=>{read=true;return '';},writeFile,
    stdout:{write(){}},stderr:{write:s=>errors+=s}
  });
  assert.equal(code,65);
  assert.equal(read,false);
  assert.match(errors,/size limit/);
});
