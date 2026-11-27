/**
 * GwenTable candidate module: SRD 5.2.1 carrying capacity + inventory load.
 * Authority: printed SRD pages 89, 92, 178, 212; CC BY 4.0 attribution in NOTICE.
 * Not the legacy 2014 variant encumbrance system and not Avarra graduated load.
 * Pure functions. No browser storage, enemy state, hidden weight guesses or auto-deletions.
 */
export const POUNDS_TO_KG = 0.45359237;
export const COINS_PER_POUND = 50;
export const CURRENCY = Object.freeze(['cp','sp','ep','gp','pp']);
export const SIZES = Object.freeze(['Tiny','Small','Medium','Large','Huge','Gargantuan']);
const FACTOR_MILLI = Object.freeze({Tiny:7500,Small:15000,Medium:15000,Large:30000,Huge:60000,Gargantuan:120000});
const WEIGHT_SCALE = 1000; // millipounds: exact 1/4-lb darts and 1/50-lb coins
const LIMIT = 10000;
const fail = msg => { throw new Error(msg); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const integer = (x,label,min=0,max=1e9) => {
  if(!Number.isSafeInteger(x)||x<min||x>max)fail(`${label} must be an integer in ${min}..${max}`);
  return x;
};
const identifier = (x,label) => {
  if(typeof x !== 'string'||! /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(x))fail(`${label} must be a safe stable ID`);
  return x;
};
const label = (x,labelName) => {
  if(typeof x!=='string'||!x.trim()||x.length>120)fail(`${labelName} must be a nonempty name up to 120 characters`);
  return x.trim();
};
export function toMillipounds(pounds,what='weight') {
  if(pounds === null)return null;
  if(typeof pounds !== 'number'||!Number.isFinite(pounds)||pounds<0||pounds>1_000_000)fail(`${what} must be a finite nonnegative number <= 1000000 lb or null`);
  const result=Math.round(pounds*WEIGHT_SCALE);
  if(Math.abs(pounds*WEIGHT_SCALE-result)>1e-7)fail(`${what} supports at most 0.001 lb precision`);
  return integer(result,what,0,1_000_000_000);
}
export const fromMillipounds = value => integer(value,'millipounds',0,Number.MAX_SAFE_INTEGER)/WEIGHT_SCALE;
const add = (a,b) => {if(!Number.isSafeInteger(a+b)||a+b>Number.MAX_SAFE_INTEGER)fail('inventory weight overflow');return a+b;};
const mul = (a,b) => {if(!Number.isSafeInteger(a*b)||a*b>Number.MAX_SAFE_INTEGER)fail('inventory weight overflow');return a*b;};

// The weight-only equipment catalogue is a separate, source-page-traceable module.
import {SRD_ITEMS} from './srd-item-catalog.mjs';
export {SRD_ITEMS,SRD_ITEM_COUNT,SRD_CATALOG_PROVENANCE} from './srd-item-catalog.mjs';
const SIZE_UP = Object.freeze({Tiny:'Small',Small:'Medium',Medium:'Large',Large:'Huge',Huge:'Gargantuan',Gargantuan:'Gargantuan'});
export function carryingCapacity(character){
  if(!object(character))fail('character object required');
  const strength=integer(character.strength,'Strength',1,30);
  const size=character.size;
  if(!SIZES.includes(size))fail('unsupported creature size');
  // Caller must verify any feature granting this bonus from canonical character build.
  const traits=character.capacityTraits??[];
  if(!Array.isArray(traits)||traits.some(t=>t!=='powerful-build')||new Set(traits).size!==traits.length)fail('unverified carrying capacity trait');
  const effectiveSize=traits.includes('powerful-build')?SIZE_UP[size]:size;
  const carryMilli=mul(strength,FACTOR_MILLI[effectiveSize]);
  return Object.freeze({strength,size,effectiveSize,traits:[...traits],carryLb:fromMillipounds(carryMilli),pushDragLiftLb:fromMillipounds(carryMilli*2)});
}
export function assessPushDragLift(character,weightLb){
  const c=carryingCapacity(character),w=toMillipounds(weightLb,'pushed/dragged/lifted weight');
  const capacity=toMillipounds(c.carryLb);
  return Object.freeze({weightLb,withinMaximum:w<=capacity*2,exceedsCarrying:w>capacity,
    speedCapFeet:w>capacity&&w<=capacity*2?5:null,requiresAdjudication:w>capacity*2,
    note:w>capacity*2?'Weight exceeds SRD push/drag/lift maximum; DM adjudication required.':
      w>capacity?'Speed can be no more than 5 feet while pushing, dragging, or lifting.':'No SRD push/drag/lift speed cap from weight.'});
}
const COINS = Object.freeze({cp:0,sp:0,ep:0,gp:0,pp:0});
const coins = x=>{
  if(!object(x)||Object.keys(x).some(k=>!CURRENCY.includes(k)))fail('coin denominations must be cp/sp/ep/gp/pp');
  return Object.fromEntries(CURRENCY.map(k=>[k,integer(x[k]??0,`coins.${k}`,0,1e12)]));
};
const coinCount = value=>{
  let total=0;
  for(const k of CURRENCY)total=add(total,value[k]);
  return total;
};
export function coinWeightLb(value){return fromMillipounds(mul(coinCount(coins(value)),20));}
export const emptyInventory = ()=>({schema:'gwentable-srd521-inventory-v1',items:[],wallets:[]});
const parent = (record,key) => record.parentId===undefined||record.parentId===null?null:identifier(record.parentId,key);
const location = (value,hasParent) => {
  const allowed=hasParent?['contained']:['carried','equipped','worn','stored','dropped'];
  if(!allowed.includes(value))fail(`location must be ${allowed.join('/')}`);
  return value;
};
const itemRecord = x=>{
  if(!object(x))fail('item record object required');
  const id=identifier(x.id,'item ID'),parentId=parent(x,'parentId');
  const loc=location(x.location,parentId!==null),quantity=integer(x.quantity,'item quantity',1,1e6);
  const catalogId=x.catalogId===undefined||x.catalogId===null?null:identifier(x.catalogId,'catalog ID');
  if(catalogId!==null){
    const entry=SRD_ITEMS[catalogId];
    if(!Object.hasOwn(SRD_ITEMS,catalogId))fail(`unknown SRD catalogue ID: ${catalogId}; use an explicitly weighted custom item`);
    if(x.customName!==undefined||x.customWeightLb!==undefined||x.customContainer!==undefined)fail('catalogued weights/container rules may not be overridden');
    if(entry.type==='container'&&quantity!==1)fail('container item must have quantity 1');
    return {id,catalogId,parentId,location:loc,quantity};
  }
  const customName=label(x.customName,'custom item name');
  if(!Object.hasOwn(x,'customWeightLb'))fail('custom item weight must be supplied as pounds or null (unknown)');
  toMillipounds(x.customWeightLb,`custom weight for ${id}`);
  if(x.customContainer!==undefined&&typeof x.customContainer!=='boolean')fail('customContainer must be boolean');
  if(x.customContainer===true&&quantity!==1)fail('custom containers cannot be stacked');
  return {id,catalogId:null,customName,customWeightLb:x.customWeightLb,customContainer:x.customContainer===true,parentId,location:loc,quantity};
};
const walletRecord=x=>{
  if(!object(x))fail('wallet record object required');
  const id=identifier(x.id,'wallet ID'),parentId=parent(x,'parentId');
  return {id,parentId,location:location(x.location,parentId!==null),coins:coins(x.coins??COINS)};
};
export function normalizeInventory(raw){
  if(!object(raw)||raw.schema!=='gwentable-srd521-inventory-v1')fail('unsupported inventory schema; use an explicit, non-destructive migration');
  if(!Array.isArray(raw.items)||!Array.isArray(raw.wallets))fail('items/wallets arrays required');
  if(raw.items.length+raw.wallets.length>LIMIT)fail('inventory node limit exceeded');
  const items=raw.items.map(itemRecord),wallets=raw.wallets.map(walletRecord);
  const ids=new Set();for(const row of [...items,...wallets]){if(ids.has(row.id))fail(`duplicate inventory ID ${row.id}`);ids.add(row.id);}
  const itemById=new Map(items.map(x=>[x.id,x]));
  const parentById=new Map([...items,...wallets].map(x=>[x.id,x.parentId]));
  for(const row of [...items,...wallets]){
    if(row.parentId===null)continue;
    const p=itemById.get(row.parentId);
    if(!p)fail(`orphan or non-item container ${row.parentId}`);
    const def=p.catalogId?SRD_ITEMS[p.catalogId]:null;
    if(!(def?.type==='container'||p.customContainer))fail(`parent ${row.parentId} is not a container`);
    const seen=new Set([row.id]);let candidate=row.parentId;
    while(candidate!==null){if(seen.has(candidate))fail('inventory container cycle detected');seen.add(candidate);if(seen.size>128)fail('inventory nesting exceeds safe depth');candidate=parentById.get(candidate)??null;}
    // Extra-dimensional object nested inside another extra-dimensional object: hazardous, never silently calculate as safe.
    if(row.catalogId==='srd521:bag-of-holding'){
      candidate=row.parentId;
      while(candidate!==null){if(itemById.get(candidate)?.catalogId==='srd521:bag-of-holding')fail('dangerous extradimensional container nesting needs DM adjudication');candidate=parentById.get(candidate)??null;}
    }
  }
  return {schema:'gwentable-srd521-inventory-v1',items,wallets};
}
const isKnown=x=>x!==null;
/** Recursively reports physical contents and the weight passed to its parent, without double counting. */
export function calculateInventoryLoad(raw,character){
  const inventory=normalizeInventory(raw),capacity=carryingCapacity(character);
  const children=new Map(),roots=[];
  for(const row of [...inventory.items,...inventory.wallets]){
    if(row.parentId===null)roots.push(row);
    else {if(!children.has(row.parentId))children.set(row.parentId,[]);children.get(row.parentId).push(row);}
  }
  const details=[],issues=[];
  const visit=(row,depth=0)=>{
    if(depth>128)fail('inventory nesting exceeds safe depth');
    const isWallet=Object.hasOwn(row,'coins');
    const spec=isWallet?null:row.catalogId?SRD_ITEMS[row.catalogId]:null;
    const singleWeight=isWallet?mul(coinCount(row.coins),20):toMillipounds(spec?spec.weightLb:row.customWeightLb,`weight ${row.id}`);
    const itemWeight=isKnown(singleWeight)?mul(singleWeight,isWallet?1:row.quantity):null;
    const descendants=(children.get(row.id)||[]).map(c=>visit(c,depth+1));
    let contentsKnownMilli=0,contentKnown=true;
    for(const d of descendants){
      contentsKnownMilli=add(contentsKnownMilli,d.passedKnownMilli);
      if(d.passedUnknown)contentKnown=false;
    }
    // Preserve a lower bound for known gear even when another item's weight is unknown.
    const selfKnownMilli=itemWeight??0;
    const fullKnownMilli=add(selfKnownMilli,contentsKnownMilli);
    const fullUnknown=itemWeight===null||!contentKnown;
    const passedKnownMilli=spec?.extradimensional?selfKnownMilli:fullKnownMilli;
    const passedUnknown=spec?.extradimensional?itemWeight===null:fullUnknown;
    if(spec?.contentCapacityLb!==undefined){
      const max=toMillipounds(spec.contentCapacityLb);
      if(!contentKnown)issues.push({id:row.id,code:'unknown-container-content-weight'});
      if(contentsKnownMilli>max)issues.push({id:row.id,code:'container-over-capacity',actualLb:fromMillipounds(contentsKnownMilli),limitLb:spec.contentCapacityLb});
      if(descendants.length&&spec.contentVolumeCubicFt!==undefined)issues.push({id:row.id,code:'volume-not-verified',limitCubicFt:spec.contentVolumeCubicFt});
    }
    const detail={id:row.id,name:isWallet?'Coins':spec?.name??row.customName,quantity:isWallet?1:row.quantity,
      parentId:row.parentId,location:row.location,catalogId:isWallet?null:row.catalogId,
      itemWeightLb:itemWeight===null?null:fromMillipounds(itemWeight),
      contentsWeightLb:contentKnown?fromMillipounds(contentsKnownMilli):null,
      contentsKnownAtLeastLb:fromMillipounds(contentsKnownMilli),
      actualWeightLb:fullUnknown?null:fromMillipounds(fullKnownMilli),
      effectiveWeightLb:passedUnknown?null:fromMillipounds(passedKnownMilli),
      effectiveKnownAtLeastLb:fromMillipounds(passedKnownMilli),
      extradimensional:!!spec?.extradimensional};
    details.push(detail);
    return {passedKnownMilli,passedUnknown};
  };
  let carriedKnown=0,unknownCarried=0,excludedKnown=0,unknownExcluded=0;
  for(const root of roots){
    const result=visit(root);
    const onPerson=['carried','worn','equipped'].includes(root.location);
    if(onPerson){if(result.passedUnknown)unknownCarried++;carriedKnown=add(carriedKnown,result.passedKnownMilli);}
    else {if(result.passedUnknown)unknownExcluded++;excludedKnown=add(excludedKnown,result.passedKnownMilli);}
  }
  const capacityMilli=toMillipounds(capacity.carryLb);
  const overBy=Math.max(0,carriedKnown-capacityMilli);
  const knownOver=carriedKnown>capacityMilli;
  return {schema:inventory.schema,capacity,carriedKnownLb:fromMillipounds(carriedKnown),
    storedOrDroppedKnownLb:fromMillipounds(excludedKnown),remainingKnownLb:fromMillipounds(Math.max(0,capacityMilli-carriedKnown)),
    overByAtLeastLb:fromMillipounds(overBy),unknownCarriedEntries:unknownCarried,unknownStoredEntries:unknownExcluded,
    status:knownOver?'over-capacity':unknownCarried?'weight-incomplete':'within-capacity',
    certainty:unknownCarried?'lower-bound':'exact',
    note:knownOver?'Carried known weight exceeds capacity; review with the DM. Do not automatically apply variant speed penalties.':
      unknownCarried?'One or more carried items have unknown weight; load is a lower bound.':'Known carried load is within SRD capacity.',
    details,issues};
}
export function applyInventoryAction(raw,character,action){
  const original=normalizeInventory(raw);
  if(!object(action)||typeof action.type!=='string')fail('inventory action type required');
  const draft=structuredClone(original);
  const find=(list,id)=>{identifier(id,'target ID');const index=list.findIndex(x=>x.id===id);if(index<0)fail(`unknown target ${id}`);return index;};
  const idAvailable=id=>!draft.items.some(x=>x.id===id)&&!draft.wallets.some(x=>x.id===id);
  switch(action.type){
    case 'item:add':{
      const item=itemRecord(action.item);
      if(!idAvailable(item.id))fail(`duplicate ID ${item.id}`);draft.items.push(item);break;
    }
    case 'item:quantity':{
      const i=find(draft.items,action.id);draft.items[i].quantity=integer(action.quantity,'new quantity',1,1e6);break;
    }
    case 'item:remove':{
      const i=find(draft.items,action.id);const row=draft.items[i];
      if([...draft.items,...draft.wallets].some(x=>x.parentId===row.id))fail('empty or move container contents before removing it');
      draft.items.splice(i,1);break;
    }
    case 'item:move':{
      const i=find(draft.items,action.id),parentId=action.parentId??null;
      draft.items[i].parentId=parentId;
      draft.items[i].location=action.location;break;
    }
    case 'wallet:add':{
      const wallet=walletRecord(action.wallet);
      if(!idAvailable(wallet.id))fail(`duplicate ID ${wallet.id}`);draft.wallets.push(wallet);break;
    }
    case 'wallet:adjust':{
      const i=find(draft.wallets,action.id);if(!object(action.delta)||Object.keys(action.delta).some(k=>!CURRENCY.includes(k)))fail('invalid wallet delta');
      for(const k of CURRENCY){const delta=integer(action.delta[k]??0,`delta.${k}`,-1e12,1e12);
        draft.wallets[i].coins[k]=integer(draft.wallets[i].coins[k]+delta,`wallet ${k}`,0,1e12);}
      break;
    }
    case 'wallet:move':{
      const i=find(draft.wallets,action.id);
      draft.wallets[i].parentId=action.parentId??null;draft.wallets[i].location=action.location;break;
    }
    case 'wallet:remove':{
      const i=find(draft.wallets,action.id);
      if(coinCount(draft.wallets[i].coins)!==0)fail('cannot remove nonempty wallet');
      draft.wallets.splice(i,1);break;
    }
    default:fail(`unsupported inventory action: ${action.type}`);
  }
  const oldLoad=calculateInventoryLoad(original,character);
  const inventory=normalizeInventory(draft);
  const load=calculateInventoryLoad(inventory,character);
  const oldOver=new Map(oldLoad.issues.filter(i=>i.code==='container-over-capacity').map(i=>[i.id,i.actualLb]));
  const worsened=load.issues.find(i=>i.code==='container-over-capacity'&&i.actualLb>(oldOver.get(i.id)??0));
  if(worsened)fail(`container ${worsened.id} exceeds its capacity: action rejected; overloaded Bag of Holding is not auto-destroyed`);
  return {inventory,load};
}
/** Exact, explicit legacy migration: never infer item weight from labels; retain unmapped rows. */
export function prepareLegacyMigration(legacy){
  if(!object(legacy)||!Array.isArray(legacy.items))fail('legacy items array required');
  const result=emptyInventory(),unmapped=[];
  for(const row of legacy.items){
    if(!object(row)||typeof row.id!=='string') {unmapped.push(row);continue;}
    try{
      if(!Object.hasOwn(row,'weightLb')){unmapped.push(row);continue;}
      const candidate={id:row.id,customName:row.name,customWeightLb:row.weightLb,
        quantity:row.quantity??1,location:row.location??'carried',parentId:null};
      result.items.push(itemRecord(candidate));
    }catch{unmapped.push(row);}
  }
  // Deliberately never transform money silently: balances may include SRD and non-SRD denominations.
  return {candidate:normalizeInventory(result),unmappedLegacy:unmapped,legacyMoneyUnmapped:legacy.money??null,
    note:'Migration is a review candidate. Keep original backup and source metadata. Nothing has been persisted.'};
}

/** Apply multi-action purchases/transfers atomically to a local immutable snapshot.
 * The caller must still commit the returned inventory with an optimistic revision lock.
 */
export function applyInventoryTransaction(raw,character,actions){
  if(!Array.isArray(actions)||actions.length<1||actions.length>100)fail('transaction requires 1..100 actions');
  let inventory=normalizeInventory(raw);
  for(const action of actions){inventory=applyInventoryAction(inventory,character,action).inventory;}
  return {inventory,load:calculateInventoryLoad(inventory,character),actionCount:actions.length};
}
