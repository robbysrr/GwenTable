import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {filterEntities} from '../dist/character-entity-list.js';
import {templateCharacter,deriveCharacter} from '../dist/lib/character.js';
import {classes} from '../dist/lib/catalog.js';
import {sheetEntities} from '../dist/sheet-entities.js';
import {setLanguage} from '../dist/locale.js';
import {icon} from '../dist/ui-icons.js';

test('collection search is accent and punctuation tolerant with OR within facets and AND across groups',()=>{
  const rows=[
    {id:'a',label:'Café du Voyage',description:'Cure a wound',facets:{level:['Level 1'],kind:['Healing']}},
    {id:'b',label:'Hunter’s Mark',description:'Track a target',facets:{level:['Level 1'],kind:['Utility']}},
    {id:'c',label:'Lullaby',description:'Ease a wound',facets:{level:['Level 2'],kind:['Utility']}},
    {id:'d',label:'Homemade Salve',source:'Custom',facets:{level:['Level 0'],kind:['Healing']}}
  ];
  assert.deepEqual(filterEntities(rows,{query:'cafe-du, wound'}).map(row=>row.id),['a']);
  assert.deepEqual(filterEntities(rows,{query:"hunter's"}).map(row=>row.id),['b']);
  assert.deepEqual(filterEntities(rows,{facets:{level:['Level 1','Level 2'],kind:['Utility']},sort:'name'}).map(row=>row.id),['b','c']);
  assert.deepEqual(filterEntities(rows,{query:'custom'}).map(row=>row.id),['d']);
  assert.equal(rows.length,4);
});

test('all twelve templates keep engine attacks, checks, saves, known spells and slot capacity',()=>{
  for(const name of Object.keys(classes)) {
    const draft=templateCharacter(name);
    const snapshot=structuredClone(draft);
    const summary=deriveCharacter(draft);
    const lists=sheetEntities(draft,summary);
    assert.equal(lists.attacks.length,summary.attacks.length,name);
    assert.equal(lists.checks.length,summary.skills.length,name);
    assert.equal(lists.saves.length,summary.saves.length,name);
    assert.equal(lists.slots.length,summary.slots.length,name);
    assert.equal(lists.cantrips.length+lists.prepared.length+lists.granted.length,summary.known.length,name);
    for(const [key,rows] of Object.entries(lists)) {
      assert.equal(new Set(rows.map(row=>row.id)).size,rows.length,name+' '+key);
      assert.ok(rows.every(row=>row.label&&row.source),name+' '+key);
    }
    assert.deepEqual(draft,snapshot);
  }
});

test('slot summaries update while stable IDs, canonical spell names and custom origin survive localization',()=>{
  const base=templateCharacter('Cleric');
  const draft={...base,custom:[
    {id:'qa-lex',type:'Item',name:'Cure Wounds',description:'A family heirloom',quantity:2},
    {id:'qa-potion',type:'Item',name:'Cure Wounds',description:'A distinct custom entry',quantity:1}
  ]};
  const summary=deriveCharacter(draft);
  const original=sheetEntities(draft,summary,{spent:{1:0}});
  const current=sheetEntities(draft,summary,{spent:{1:1}});
  assert.equal(original.slots[0].id,current.slots[0].id);
  assert.notEqual(original.slots[0].summary,current.slots[0].summary);
  assert.equal(new Set(current.customRows.map(row=>row.id)).size,2);
  assert.ok(current.customRows.every(row=>row.source==='Custom'&&!row.page&&!row.spell));
  assert.equal(filterEntities(current.customRows,{query:'heirloom'}).length,1);
  setLanguage('id');
  try {
    const translated=sheetEntities(draft,summary,{spent:{1:1}});
    assert.equal(translated.customRows[0].label,original.customRows[0].label);
    assert.match(translated.slots[0].summary,/^Sisa/);
    assert.equal(translated.prepared[0].id,original.prepared[0].id);
  } finally {setLanguage('en');}
});

test('shipped icon mappings resolve to documented safe glyphs, with an offline fallback',async()=>{
  const registry=JSON.parse(await readFile(new URL('../audit/icon-registry.json',import.meta.url)));
  assert.deepEqual(registry.exactEntityArtwork,{});
  for(const [name,asset] of Object.entries(registry.assets)) {
    assert.equal(asset.audienceVisibility,'public');
    const rendered=icon(name);
    assert.match(rendered,/stroke="currentColor"/);
    assert.doesNotMatch(rendered,/<(?:script|foreignObject)|\son\w+=|\b(?:href|src)=/i);
    if(name.startsWith('tav-')) {
      const file=await readFile(new URL('../dist/'+asset.filePath,import.meta.url));
      assert.equal(createHash('sha256').update(file).digest('hex'),asset.sha256);
    }
  }
  for(const [label,id] of Object.entries(registry.semanticMappings)) assert.equal(icon(label).split('<svg')[1],icon(id).split('<svg')[1]);
  assert.equal(icon('unknown <asset>'),icon('item'));
});
