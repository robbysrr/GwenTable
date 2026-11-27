import test from 'node:test';
import assert from 'node:assert/strict';
import {inventoryFixture} from './fixtures/inventory-character.mjs';
import {applySavedInventoryCommand, inventoryEquipmentLines, inventoryField, inventoryReceiptsField, savedInventoryView} from '../dist/lib/saved-inventory.js';
import {carryingCapacity, coinWeightLb, SRD_ITEM_COUNT} from '../dist/lib/srd-encumbrance.mjs';
import {build, deriveCharacter} from '../dist/lib/character.js';
import {makeRosterExport, makeSavedCharacterExport, readRosterExport, readSavedCharacterExport} from '../dist/lib/portable.js';
import {exportGwenGCX, gcxToGwen} from '../dist/lib/gwentable-gcx.js';
import {mergeLinkedGCXUpdate} from '../dist/linked-gcx-update.js';
import {mergeSavedCharacterBuild} from '../dist/saved-character-build.js';
import {characterStorageRevision} from '../dist/lib/revision-tokens.js';

const key = n => 'cc001122-3344-4566-8899-'+String(n).padStart(12,'0');
const prepare = (type,n,options={},record={}) => ({
  operationId:key(n), expectedRevision:characterStorageRevision(record), type, ...options
});
const apply = (record,type,n,options) =>
  applySavedInventoryCommand(record,prepare(type,n,options,record));
const activate = record => apply(record,'activate',1);
const legacy = () => ({...inventoryFixture(),inventory:['2 Daggers','Chain Mail','Shield','Uncatalogued tome'],gp:20});
const wallet = record => savedInventoryView(record).inventory.wallets[0].coins;
const purchase = {catalogId:'srd521:dagger',wallet:'purse',coin:'gp',quantity:2};

test('legacy preview is reversible and projects each original gear row and GP only once',()=>{
  const record=legacy();
  const before=structuredClone(record);
  const preview=savedInventoryView(record);
  assert.deepEqual(record,before);
  assert.deepEqual(preview.inventory.items.map(item=>item.quantity),[2,1,1,1]);
  assert.equal(preview.load.carriedKnownLb,63.4);
  assert.equal(preview.load.certainty,'lower-bound');
  const active=activate(record);
  assert.deepEqual(savedInventoryView(active).load,preview.load);
  assert.deepEqual(active.inventory,before.inventory);
  assert.equal(active.gp,20);
  assert.deepEqual(active.customMetadata,before.customMetadata);
  const reverted=apply(active,'deactivate',2);
  assert.equal(reverted[inventoryField],undefined);
  assert.deepEqual(savedInventoryView(reverted).load,preview.load);
});

test('ambiguous legacy currency and unsupported inventory fields remain available for recovery',()=>{
  const ambiguous={...legacy(),money:{gp:500,myCoin:2}};
  assert.throws(()=>activate(ambiguous),/manual legacy review/);
  const active=activate(legacy());
  active[inventoryField].inventory.items[0].foreignItemData={link:'preserve'};
  assert.throws(()=>apply(active,'buy',2,purchase),/manual legacy review/);
  assert.deepEqual(active[inventoryField].inventory.items[0].foreignItemData,{link:'preserve'});
});

test('prices, purchases, sales and replay use the same authoritative inventory and wallet',()=>{
  const current={...activate(legacy()),_characterRevision:key(100)};
  const command=prepare('buy',2,purchase,current);
  const purchased={...applySavedInventoryCommand(current,command),_characterRevision:key(101)};
  assert.equal(wallet(purchased).gp,16);
  assert.strictEqual(applySavedInventoryCommand(purchased,command),purchased);
  assert.throws(()=>applySavedInventoryCommand(purchased,{...command,quantity:1}),/reused/);
  assert.throws(()=>applySavedInventoryCommand(purchased,prepare('adjust',3,{wallet:'purse',coin:'ep',amount:1},current)),
    {code:'CHARACTER_REVISION_CONFLICT'});
  const sold=apply(purchased,'sell',4,{id:key(2),wallet:'purse',coin:'ep',quantity:1});
  assert.equal(wallet(sold).ep,2);
  assert.equal(savedInventoryView(sold).inventory.items.find(item=>item.id===key(2)).quantity,1);
  assert.throws(()=>apply(sold,'deactivate',5),/private backup/);
});

test('invalid prices, funds and a partially applied purchase never change the record',()=>{
  const active=activate(legacy());
  const before=structuredClone(active);
  for (const options of [
    {...purchase,catalogId:'srd521:bag-of-holding'}, {...purchase,quantity:11}, {...purchase,quantity:1.5},
    {...purchase,catalogId:'srd521:backpack',quantity:2}, {...purchase,coin:'pp'}, {...purchase,cost:1}
  ]) assert.throws(()=>apply(active,'buy',2,options));
  assert.deepEqual(active,before);
});

test('denominations, bags, storage, quantities and same-character transfers affect load only once',()=>{
  let record=activate({...inventoryFixture(),inventory:['Backpack','Unevaluated treasure'],gp:0});
  record=apply(record,'new-wallet',2);
  for (const [i,coin] of ['cp','sp','ep','gp','pp'].entries())
    record=apply(record,'adjust',i+3,{wallet:'purse',coin,amount:10});
  assert.equal(coinWeightLb(wallet(record)),1);
  record=apply(record,'transfer',8,{wallet:'purse',target:key(2),coin:'pp',quantity:5});
  assert.equal(wallet(record).pp,5);
  assert.equal(savedInventoryView(record).load.carriedKnownLb,6);
  record=apply(record,'move',9,{id:key(2),destination:'in:starter-0-0'});
  record=apply(record,'move',10,{id:'starter-0-0',destination:'stored'});
  assert.equal(savedInventoryView(record).load.carriedKnownLb,0.9);
  record=apply(record,'move',11,{id:'starter-1-0',destination:'stored'});
  assert.equal(savedInventoryView(record).load.certainty,'exact');
  record=apply(record,'add-item',12,{catalogId:'srd521:dart',quantity:2});
  record=apply(record,'quantity',13,{id:key(12),quantity:3});
  assert.equal(savedInventoryView(record).load.carriedKnownLb,1.65);
  assert.throws(()=>apply(record,'move',14,{id:'starter-0-0',destination:'in:starter-0-0'}),/cycle/);
  assert.throws(()=>apply(record,'remove',15,{id:'starter-0-0'}),/contents/);
});

test('capacity follows supported SRD size and reviewed build scores after advancement',()=>{
  assert.equal(SRD_ITEM_COUNT,180);
  for (const [size,capacity] of Object.entries({Tiny:75,Small:150,Medium:150,Large:300,Huge:600,Gargantuan:1200})) {
    assert.equal(carryingCapacity({strength:10,size}).carryLb,capacity);
  }
  const active=activate(legacy());
  const changedDraft=build({...active.draft,species:'Goliath',lineage:'Stone',level:4}).draft;
  const next=mergeSavedCharacterBuild(active,{draft:changedDraft});
  const view=savedInventoryView(next);
  assert.equal(view.load.capacity.carryLb,30*deriveCharacter(changedDraft).scores[0]);
  assert.deepEqual(next[inventoryField],active[inventoryField]);
  assert.deepEqual(next.customMetadata,active.customMetadata);
  assert.ok(inventoryEquipmentLines(view).some(row=>row.includes('Uncatalogued tome')));
});

test('roster and individual backups preserve private extensions and inventory but exclude receipts',async()=>{
  const current=apply(activate(legacy()),'buy',2,purchase);
  const [restored]=await readRosterExport(JSON.stringify(await makeRosterExport([current])));
  const individual=await readSavedCharacterExport(JSON.stringify(await makeSavedCharacterExport(current)));
  for (const record of [restored,individual]) {
    assert.deepEqual(record[inventoryField],current[inventoryField]);
    assert.deepEqual(record.customMetadata,current.customMetadata);
    assert.deepEqual(record.inventory,current.inventory);
    assert.equal(record[inventoryReceiptsField],undefined);
  }
  const [old]=await readRosterExport(JSON.stringify(await makeRosterExport([legacy()])));
  assert.equal(savedInventoryView(old).active,false);
  assert.equal(wallet(old).gp,20);
});

test('GCX copies preserve tracked equipment and linked updates preserve local inventory ownership',async()=>{
  const current=apply(activate(legacy()),'buy',2,purchase);
  const file=await exportGwenGCX(current,'live-snapshot');
  const imported=gcxToGwen(file,true);
  assert.deepEqual(imported[inventoryField],current[inventoryField]);
  assert.equal(JSON.stringify(file).includes(inventoryReceiptsField),false);
  const local=activate(legacy());
  const linked=mergeLinkedGCXUpdate(local,imported,new Date().toISOString());
  assert.deepEqual(linked[inventoryField],local[inventoryField]);
  assert.deepEqual(linked.customMetadata,local.customMetadata);
});
