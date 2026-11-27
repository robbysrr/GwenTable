import {deriveCharacter, migrateDraft, validateCharacter} from './character.js';
import {characterStorageRevision} from './revision-tokens.js';
import {applyInventoryTransaction, calculateInventoryLoad, CURRENCY, emptyInventory, normalizeInventory, SRD_ITEMS} from './srd-encumbrance.mjs';

const schema = 'gwentable-saved-inventory-v1';
export const inventoryField = 'gwentableInventory';
export const inventoryReceiptsField = '_gwentableInventoryReceipts';
export const inventoryConflictCode = 'CHARACTER_REVISION_CONFLICT';
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const coinValues = {cp:1, sp:10, ep:50, gp:100, pp:1000};
const own = (value, key) => Object.hasOwn(value, key);
const plain = value => value && Object.getPrototypeOf(value) === Object.prototype;
const keys = (value, allowed) => plain(value) && Object.keys(value).every(key => allowed.includes(key));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;

// Printed SRD 5.2.1 pp. 91–92, 95–96. Prices in copper per catalogue unit.
export const inventoryPrices = Object.freeze(Object.fromEntries(Object.entries({
  dagger:200, longsword:1500, 'chain-mail':7500, shield:1000, backpack:200,
  bedroll:100, pouch:50, rations:50, rope:100, torch:1, 'arrows-20':100
}).map(([slug, value]) => ['srd521:'+slug, value])));

const nameKey = value => value.replaceAll('’', "'").toLowerCase();
const catalogueByName = new Map(Object.entries(SRD_ITEMS).map(([id, item]) => [nameKey(item.name), id]));
for (const [label, slug] of Object.entries({
  "Burglar's Pack":'burglars-pack', "Dungeoneer's Pack":'dungeoneers-pack',
  "Entertainer's Pack":'entertainers-pack', "Explorer's Pack":'explorers-pack',
  "Priest's Pack":'priests-pack', "Scholar's Pack":'scholars-pack',
  "Traveler's Clothes":'travelers-clothes', 'Crossbow, Light':'light-crossbow',
  'Arcane Focus (crystal)':'arcane-crystal', 'Arcane Focus (orb)':'arcane-orb',
  'Arcane Focus (Quarterstaff)':'arcane-staff', 'Druidic Focus (Quarterstaff)':'druidic-wooden-staff',
  'Druidic Focus (sprig of mistletoe)':'druidic-sprig', 'Potion of Healing (Common)':'potion-of-healing',
  'Book (prayers)':'book', 'Book (history)':'book', 'Book (occult lore)':'book',
  '20 Arrows':'arrows-20', '20 Bolts':'bolts-20', '20 Crossbow Bolts':'bolts-20'
})) catalogueByName.set(nameKey(label), 'srd521:'+slug);

function sourceBuild(record) {
  assert(record?.draft && !validateCharacter(record.draft).length, 'Inventory needs a valid saved build.');
  const draft = migrateDraft(record.draft);
  const sheet = deriveCharacter(draft);
  return {
    draft, sheet,
    capacity: {strength:sheet.scores[0], size:draft.size,
      capacityTraits:draft.species === 'Goliath' ? ['powerful-build'] : []}
  };
}

function startingInventory(record, {draft, sheet}) {
  const baseline = own(record, 'inventory') ? record.inventory : sheet.inventory;
  const gp = own(record, 'gp') ? record.gp : sheet.gp;
  assert(!['money','wallet','wallets','coins','currency','equipment','cp','sp','ep','pp'].some(key => own(record, key)) &&
    Array.isArray(baseline) && baseline.length <= 500 &&
    baseline.every(label => typeof label === 'string' && label.trim() && label.length <= 120) &&
    integer(gp, 0, 1e12), 'Inventory needs a manual legacy review.');
  const inventory = emptyInventory();
  inventory.wallets.push({id:'purse', parentId:null, location:'carried', coins:{gp}});
  let armor = draft.armor;
  let shield = draft.shield === 'Equipped';
  for (const [index, name] of baseline.entries()) {
    const label = nameKey(name);
    const stack = /^(\d+) (.+)$/.exec(label);
    const singular = stack?.[2].replace(/s$/, '');
    const exact = catalogueByName.get(label);
    const catalogId = exact ?? catalogueByName.get(singular);
    const quantity = exact || !catalogId ? 1 : Number(stack[1]);
    assert(integer(quantity, 1, 500), 'Inventory needs a manual legacy review.');
    const location = name === armor ? 'worn' : name === 'Shield' && shield ? 'equipped' : 'carried';
    if (location === 'worn') armor = null;
    if (location === 'equipped') shield = false;
    const spec = SRD_ITEMS[catalogId];
    // A legacy user-supplied label may include qualifiers that need preserving.
    // The original top-level array or draft remains available after activation.
    const item = spec ? {catalogId} : {customName:name, customWeightLb:null};
    const container = spec?.type === 'container';
    for (let offset = 0; offset < (container ? quantity : 1); offset++) {
      inventory.items.push({...item, id:'starter-'+index+'-'+offset, parentId:null,
        location, quantity:container ? 1 : quantity});
      assert(inventory.items.length <= 500, 'Inventory needs a manual legacy review.');
    }
  }
  return { inventory:normalizeInventory(inventory), baseline, gp };
}

// Validate before applying reference normalization so future fields survive
// as-is in a record/backup and cannot be silently erased by a mutation.
export function validateSavedInventory(extension) {
  assert(keys(extension, ['schema','inventory','edited']) && extension.schema === schema &&
    typeof extension.edited === 'boolean', 'Inventory needs a manual legacy review.');
  const {inventory} = extension;
  assert(keys(inventory, ['schema','items','wallets']) && Array.isArray(inventory.items) &&
    Array.isArray(inventory.wallets) && inventory.items.length + inventory.wallets.length <= 501 &&
    inventory.items.every(item => keys(item, ['id','catalogId','parentId','location','quantity','customName','customWeightLb','customContainer'])) &&
    inventory.wallets.every(wallet => keys(wallet, ['id','parentId','location','coins']) && keys(wallet.coins, CURRENCY) &&
      Object.values(wallet.coins).every(value => integer(value,0,1e12))),
    'Inventory needs a manual legacy review.');
  calculateInventoryLoad(inventory, {strength:10, size:'Medium'});
  return extension;
}

export function savedInventoryView(record) {
  const build = sourceBuild(record);
  const active = own(record, inventoryField);
  const starter = active ? null : startingInventory(record, build);
  const tracker = active ? validateSavedInventory(record[inventoryField]) : null;
  const inventory = tracker ? normalizeInventory(tracker.inventory) : starter.inventory;
  return {inventory, capacity:build.capacity, active, edited:tracker?.edited ?? false, starter,
    load:calculateInventoryLoad(inventory, build.capacity)};
}

const commandFields = {
  activate:[], deactivate:[], buy:['catalogId','wallet','coin','quantity'],
  sell:['id','wallet','coin','quantity'], quantity:['id','quantity'],
  move:['id','destination'], adjust:['wallet','coin','amount'],
  transfer:['wallet','target','coin','quantity'], 'new-wallet':[],
  'add-item':['catalogId','quantity'], 'add-custom':['name','weight','container'],
  remove:['id']
};

function commandSignature(command) {
  const {type, operationId, expectedRevision} = command;
  assert(own(commandFields,type) && keys(command, ['type','operationId','expectedRevision',...commandFields[type]]) &&
    typeof operationId === 'string' && uuid.test(operationId) &&
    (expectedRevision === null || typeof expectedRevision === 'string' && uuid.test(expectedRevision)), 'Invalid inventory request.');
  const values = commandFields[type].map(key => command[key]);
  assert(values.every(value => value === null || typeof value === 'boolean' ||
    typeof value === 'string' && value.length <= 120 || Number.isFinite(value)), 'Invalid inventory request.');
  return JSON.stringify([type, expectedRevision, ...values]);
}

function actionsFor(command, inventory) {
  const {type, id, catalogId, wallet, coin, amount, quantity, destination, operationId, target} = command;
  const findWallet = key => inventory.wallets.find(row => row.id === key);
  const item = inventory.items.find(row => row.id === id);
  const adjust = (id, value) => ({type:'wallet:adjust', id, delta:{[coin]:value}});
  const add = data => ({type:'item:add', item:{id:operationId, location:'carried', parentId:null, ...data}});
  const reduce = count => count === item.quantity ? {type:'item:remove', id} : {type:'item:quantity', id, quantity:item.quantity-count};

  if (['buy','sell','transfer','quantity','add-item'].includes(type))
    assert(integer(quantity, 1, 1e6), 'Enter a whole quantity between 1 and 1000000.');
  if (['buy','sell','adjust','transfer'].includes(type))
    assert(CURRENCY.includes(coin) && findWallet(wallet), 'Choose a coin denomination and wallet.');

  switch (type) {
    case 'buy':
    case 'sell': {
      const buying = type === 'buy';
      const priceId = buying ? catalogId : item?.catalogId;
      assert(own(inventoryPrices, priceId), 'This item has no verified trade price.');
      if (!buying) assert(quantity <= item.quantity, 'This sale exceeds the owned quantity.');
      const count = inventoryPrices[priceId]*quantity / (buying ? 1 : 2) / coinValues[coin];
      assert(integer(count, 1, 1e12), 'Choose a denomination and quantity that give an exact price.');
      if (buying) assert(findWallet(wallet).coins[coin] >= count, 'The wallet does not contain enough of that coin.');
      return buying ? [adjust(wallet, -count), add({catalogId, quantity})] : [reduce(quantity), adjust(wallet, count)];
    }
    case 'quantity':
      assert(item, 'Choose an owned item.');
      return [{type:'item:quantity', id, quantity}];
    case 'remove':
      assert(item, 'Choose an owned item.');
      return [{type:'item:remove', id}];
    case 'move': {
      assert(item || findWallet(id), 'Choose an owned item or wallet.');
      assert(typeof destination === 'string', 'Choose a destination.');
      const parentId = destination.startsWith('in:') ? destination.slice(3) : null;
      return [{type:item ? 'item:move' : 'wallet:move', id, parentId, location:parentId ? 'contained' : destination}];
    }
    case 'adjust':
      assert(integer(amount, -1e12, 1e12) && amount !== 0, 'Enter a nonzero whole coin adjustment.');
      assert(integer(findWallet(wallet).coins[coin]+amount, 0, 1e12), 'The resulting wallet balance is outside its limits.');
      return [adjust(wallet, amount)];
    case 'transfer':
      assert(wallet !== target && findWallet(target), 'Choose two different wallets.');
      assert(findWallet(wallet).coins[coin] >= quantity, 'The wallet does not contain enough of that coin.');
      return [adjust(wallet,-quantity),adjust(target,quantity)];
    case 'new-wallet':
      return [{type:'wallet:add',wallet:{id:operationId,location:'carried',parentId:null,coins:{}}}];
    case 'add-item':
      assert(own(SRD_ITEMS,catalogId), 'Choose an SRD catalogue item.');
      return [add({catalogId,quantity})];
    case 'add-custom':
      assert(typeof command.name === 'string' && command.name.trim() && typeof command.container === 'boolean' &&
        (command.weight === null || Number.isFinite(command.weight)), 'Enter a custom name and a valid weight, or leave the weight blank.');
      return [add({customName:command.name,customWeightLb:command.weight,customContainer:command.container,quantity:1})];
    default:
      throw new Error('Invalid inventory request.');
  }
}

export function applySavedInventoryCommand(record, command) {
  const signature = commandSignature(command);
  const receipts = own(record,inventoryReceiptsField) ? record[inventoryReceiptsField] : [];
  assert(Array.isArray(receipts) && receipts.length <= 128 && receipts.every(row =>
    keys(row,['id','signature']) && typeof row.id === 'string' && uuid.test(row.id) &&
    typeof row.signature === 'string' && row.signature.length <= 1000), 'Inventory needs a manual legacy review.');
  const prior = receipts.find(row => row.id === command.operationId);
  if (prior) {
    assert(prior.signature === signature, 'The inventory operation ID was reused with different details.');
    return record;
  }
  if (characterStorageRevision(record) !== command.expectedRevision) {
    const error = new Error('Inventory changed in another tab. Reload the saved character before editing.');
    error.code = inventoryConflictCode;
    throw error;
  }
  const view = savedInventoryView(record);
  const next = {...record, updatedAt:new Date().toISOString(),
    [inventoryReceiptsField]:[...receipts,{id:command.operationId, signature}].slice(-128)};
  if (command.type === 'deactivate') {
    assert(view.active && !view.edited, 'Export a private backup before replacing edited inventory.');
    delete next[inventoryField];
    return next;
  }
  if (command.type === 'activate') {
    assert(!view.active, 'Inventory tracking is already active.');
    next[inventoryField] = validateSavedInventory({schema, inventory:view.inventory, edited:false});
    return next;
  }
  assert(view.active, 'Review and activate inventory tracking first.');
  const {inventory} = applyInventoryTransaction(view.inventory,view.capacity,actionsFor(command,view.inventory));
  next[inventoryField] = validateSavedInventory({schema,inventory,edited:true});
  return next;
}

export function inventoryEquipmentLines(view) {
  const parents = new Map(view.load.details.map(row => [row.id,row]));
  const place = row => row.parentId ? 'in '+parents.get(row.parentId)?.name : row.location;
  return [
    (view.load.certainty === 'lower-bound' ? 'Known carried load: at least ' : 'Carried load: ')+
      view.load.carriedKnownLb+' / '+view.load.capacity.carryLb+' lb',
    ...view.inventory.items.map(item => parents.get(item.id))
      .map(row => row.quantity+' × '+row.name+' ('+place(row)+')'+(row.itemWeightLb === null ? ' · weight unknown' : '')),
    ...view.inventory.wallets.map(wallet => CURRENCY.map(coin => wallet.coins[coin]+' '+coin).join(' · ')+
      ' ('+place(wallet)+')')
  ];
}

export function savedEquipmentLines(record) {
  if (!record) return undefined;
  try {
    return inventoryEquipmentLines(savedInventoryView(record));
  } catch {
    return own(record,inventoryField) ? ['Saved inventory unavailable. See the private character backup.'] : undefined;
  }
}
