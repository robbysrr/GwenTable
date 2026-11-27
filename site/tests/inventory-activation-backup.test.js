import test from 'node:test';
import assert from 'node:assert/strict';
import {inventoryFixture} from './fixtures/inventory-character.mjs';
import {prepareInventoryActivationBackup, requireInventoryActivationBackup} from '../dist/lib/inventory-activation-backup.js';
import {readRosterExport} from '../dist/lib/portable.js';
import {inventoryPanel} from '../dist/inventory-panel.js';
import {readFileSync} from 'node:fs';
import {inventoryField, applySavedInventoryCommand} from '../dist/lib/saved-inventory.js';

const revision='11111111-2222-4333-8444-555555555555';
function legacy() {return {...inventoryFixture(),id:'synthetic-character',_characterRevision:revision,
  inventory:['Dagger','Unmapped relic'],gp:17, privateNotes:{memo:'Do not discard'}, customMetadata:{version:1}};}

test('inventory activation backup is importable and preserves private extension values',async()=>{
  const record=legacy();const original=structuredClone(record);
  const prepared=await prepareInventoryActivationBackup(record);
  assert.deepEqual(record,original);
  assert.equal(prepared.revision,revision);
  assert.equal(prepared.characterId,record.id);
  const [loaded]=await readRosterExport(JSON.stringify(prepared.file));
  assert.deepEqual(loaded.inventory,record.inventory);
  assert.equal(loaded.gp,17);
  assert.deepEqual(loaded.privateNotes,record.privateNotes);
  assert.deepEqual(loaded.customMetadata,record.customMetadata);
  assert.equal(JSON.stringify(prepared.file).includes(revision),false);
});

test('inventory activation requires the same character/revision and explicit confirmed download',async()=>{
  const record=legacy(),backup=await prepareInventoryActivationBackup(record);
  const approve=(data=record,state={downloadAttempted:true,acknowledged:true})=>requireInventoryActivationBackup(backup,data,state);
  assert.equal(approve(),true);
  for(const state of [{},{downloadAttempted:true},{acknowledged:true},{downloadAttempted:true,acknowledged:false}])
    assert.throws(()=>approve(record,state),/Download and confirm/);
  assert.throws(()=>approve({...record,id:'different-character'}),/Download and confirm/);
  assert.throws(()=>approve({...record,_characterRevision:'aaaa1111-2222-4333-8444-555555555555'}),/Download and confirm/);
  assert.throws(()=>requireInventoryActivationBackup(null,record,{downloadAttempted:true,acknowledged:true}),/Download and confirm/);
});

test('cannot prepare a new migration backup after inventory activation; legacy remains unmodified',async()=>{
  const record=legacy();
  const changed=applySavedInventoryCommand(record,{type:'activate',operationId:'22222222-3333-4444-8555-666666666666',expectedRevision:revision});
  assert.ok(changed[inventoryField]);
  await assert.rejects(()=>prepareInventoryActivationBackup(changed),/already active/);
  await assert.rejects(()=>prepareInventoryActivationBackup({...record,money:{gp:99}}),/manual legacy review/);
  assert.deepEqual(record.inventory,['Dagger','Unmapped relic']);
});

test('private backup fails closed on non-JSON-safe extension fields',async()=>{
  const record=legacy();record.unsafeExtension=new Map([['secret','value']]);
  await assert.rejects(()=>prepareInventoryActivationBackup(record),/unsafe|cannot be represented/);
});

test('inventory activation UI has download-first controls, acknowledgement and disabled activation',()=>{
  const markup=inventoryPanel(legacy(),new Set());
  assert.match(markup,/data-inventory-action="prepare-backup"/);
  assert.match(markup,/data-inventory-backup-download/);
  assert.match(markup,/data-inventory-backup-ack disabled/);
  assert.match(markup,/data-inventory-action="activate" disabled/);
});


test('offline cache includes backup gate and Play UI enforces stale-save freshness',()=>{
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  const play=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
  assert.match(sw,/inventory-activation-backup\.js/);
  assert.match(sw,/open-5e-v0\.25\.7-inventory-dev\.10-player-convergence08/);
  const storage=readFileSync(new URL('../dist/lib/inventory-storage.js',import.meta.url),'utf8');
  assert.match(storage,/requireInventoryActivationBackup\(backup,current,backup\)/);
  assert.match(play,/commitSavedInventory\(opened.id,complete,activationBackup/);
  assert.match(play,/checkSavedExportFreshness\(opened,key=>characters\.get\(key\)\)/);
});


test('preparing an oversized private backup fails without changing the saved record',async()=>{
  const record=legacy();
  record.largeNotes='x'.repeat(8*1024*1024);
  await assert.rejects(()=>prepareInventoryActivationBackup(record),/exceeds the 8 MB backup limit/);
  assert.equal(record[inventoryField],undefined);
  assert.equal(record._characterRevision,revision);
});
