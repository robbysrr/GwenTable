import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setLanguage,copy,canonicalOptionName,htmlCanonicalOptionName} from '../dist/locale.js';
import {catalogueEntries,mountCompendium} from '../dist/compendium.js';
import {SRD_ITEMS,SRD_ITEM_COUNT} from '../dist/lib/srd-item-catalog.mjs';
import {inventoryPanel} from '../dist/inventory-panel.js';
import {inventoryFixture} from './fixtures/inventory-character.mjs';
import {applySavedInventoryCommand} from '../dist/lib/saved-inventory.js';
import {characterStorageRevision} from '../dist/lib/revision-tokens.js';

function inIndonesian(callback) {
  setLanguage('id');
  try {return callback();} finally {setLanguage('en');}
}

test('official option names never use Indonesian interface message translations',()=>inIndonesian(()=>{
  // These names also mean ordinary words in a user interface. The distinction
  // must be explicit: interface descriptions translate, named SRD options do not.
  assert.equal(copy('Light'),'Terang');
  assert.equal(copy('Lock'),'Kunci');
  for(const name of ['Light','Lock','Paper','Fear','Dagger','Longsword','Bag of Holding',
    'Fireball','Life Domain','Draconic Sorcery','Sleight of Hand','Magic Initiate']) {
    assert.equal(canonicalOptionName(name),name);
    assert.equal(htmlCanonicalOptionName(name),name);
  }
  assert.equal(htmlCanonicalOptionName('Longsword <&> "test"'),
    'Longsword &lt;&amp;&gt; &quot;test&quot;');
  assert.equal(htmlCanonicalOptionName("Oath's & Shield"),'Oath&#39;s &amp; Shield');
}));

test('all SRD item catalogue names are identical across both languages',()=>{
  assert.equal(SRD_ITEM_COUNT,180);
  const catalog = Object.values(SRD_ITEMS);
  for(const item of catalog) {
    assert.equal(item.nameId,item.name);
    assert.equal(item.translationReviewed,true);
    for(const language of ['en','id']) {
      setLanguage(language);
      assert.equal(canonicalOptionName(item.name),item.name);
    }
  }
  setLanguage('en');
  assert.equal(SRD_ITEMS['srd521:dagger'].name,'Dagger');
  assert.equal(SRD_ITEMS['srd521:backpack'].name,'Backpack');
  assert.equal(SRD_ITEMS['srd521:bag-of-holding'].name,'Bag of Holding');
});

test('compendium renders official name collisions in English but localizes category chrome',()=>inIndonesian(()=>{
  const elements={};
  for(const key of ['results','search','category','count','more']) elements[key]={value:'',innerHTML:'',textContent:'',hidden:false};
  const selectors={'[data-catalogue-results]':'results','[data-catalogue-search]':'search',
    '[data-catalogue-category]':'category','[data-catalogue-count]':'count',
    '[data-more-results]':'more'};
  const root={querySelector:selector=>elements[selectors[selector]]};
  const oldOption=globalThis.Option;
  globalThis.Option=class {constructor(label,value){this.label=label;this.value=value;}};
  elements.category.replaceChildren=(...children)=>{elements.category.options=children;};
  try {
    const refresh=mountCompendium(root,()=>{});
    for(const name of ['Light','Lock','Paper']) {
      elements.search.value=name;
      elements.search.oninput();
      assert.ok(elements.results.innerHTML.includes(`<b>${name}</b>`),`Missing ${name}`);
    }
    // The UI control itself is still in Indonesian.
    assert.ok(elements.category.options.some(o=>o.label==='Semua kategori') ||
      elements.category.options.some(o=>o.label===copy('All categories')));
    const countBefore=catalogueEntries().length;
    assert.ok(countBefore>1000);
    refresh();
  } finally {
    if(oldOption===undefined) delete globalThis.Option;
    else globalThis.Option=oldOption;
  }
}));

test('inventory panel displays English catalog item names while buttons translate',()=>inIndonesian(()=>{
  let record={...inventoryFixture(),inventory:['2 Daggers'],gp:20};
  record=applySavedInventoryCommand(record,{type:'activate',operationId:'cc001122-3344-4566-8899-000000009001',
    expectedRevision:characterStorageRevision(record)});
  const savedRevision=characterStorageRevision(record);
  record=applySavedInventoryCommand(record,{type:'add-item',catalogId:'srd521:bag-of-holding',quantity:1,
    operationId:'cc001122-3344-4566-8899-000000009002',expectedRevision:savedRevision});
  const html=inventoryPanel(record,new Set());
  assert.match(html,/Dagger/);
  assert.match(html,/Bag of Holding/);
  assert.doesNotMatch(html,/Belati|Tas Penyimpanan Ajaib/);
  assert.match(html,/Kelola barang/);
  assert.match(html,/Beli/);
  assert.match(JSON.stringify(record),/srd521:bag-of-holding/);
  assert.doesNotMatch(JSON.stringify(record),/Tas Penyimpanan Ajaib/);
}));

test('static compendium route uses nontranslating name rendering',async()=>{
  const code=await readFile(new URL('../dist/compendium.js',import.meta.url),'utf8');
  assert.match(code,/htmlCanonicalOptionName\(entry\.name\)/);
});
