import test from 'node:test';
import assert from 'node:assert/strict';
import {build,deriveCharacter,templateCharacter,validateCharacter} from '../dist/lib/character.js';
import {appearanceFields,generateAppearance,appearanceEntries} from '../dist/lib/appearance.js';
import {dieMeshes,rollDice,visibleDice} from '../dist/dice-geometry.js';
import {catalogueEntries,filterCatalogue} from '../dist/compendium.js';
import {srdPages} from '../dist/lib/srd-reader-pages.js';
import {playAdvice} from '../dist/play-guide.js';
import {readSavedCharacterExport,makeExport} from '../dist/lib/portable.js';
import {makeNativeSheetPDF} from '../dist/lib/native-sheet-pdf.js';
import {playProfile,normalizePlay} from '../dist/lib/play.js';
import {PDFDocument} from '../dist/vendor/pdf-lib.min.js';

test('appearance is seeded, rerolls unlocked fields, and survives the portable JSON format',async()=>{
  const previous={hair:'Long silver braid'};
  const rolled=generateAppearance(previous,['hair'],'demo');
  assert.deepEqual(generateAppearance(previous,['hair'],'demo'),rolled);
  assert.equal(Object.keys(rolled).length,appearanceFields.length);
  assert.equal(rolled.hair,previous.hair);
  assert.deepEqual(Object.keys(generateAppearance({},[],'demo','eyes')),['eyes']);
  const draft=build({...templateCharacter('Fighter'),appearance:'Legacy notes',appearanceDetails:rolled,appearanceLocks:['hair','invalid']}).draft;
  assert.deepEqual(validateCharacter(draft),[]);
  const {draft:restored}=await readSavedCharacterExport(JSON.stringify(await makeExport(draft)));
  assert.equal(restored.appearance,'Legacy notes');
  assert.deepEqual(restored.appearanceLocks,['hair']);
  assert.deepEqual(appearanceEntries(restored),appearanceEntries(draft));
});
test('3D die meshes have distinct closed faces and percentile faces represent the exact result',()=>{
  for(const size of [4,6,8,10,12,20]) {
    const mesh=dieMeshes[size];
    assert.equal(mesh.faces.length,size);
    const edges=new Map();
    for(const {indices} of mesh.faces) indices.forEach((n,i)=>{
      const edge=[n,indices[(i+1)%indices.length]].sort((a,b)=>a-b).join(',');
      edges.set(edge,(edges.get(edge)??0)+1);
    });
    assert.ok([...edges.values()].every(count=>count===2));
  }
  const boundary=[4294967295,0,5,4];
  assert.deepEqual(rollDice(6,3,()=>boundary.shift()),[1,6,5]);
  assert.deepEqual(visibleDice(100,[100,40,7]).map(die=>die.face),[0,0,4,0,0,7]);
});
test('public index resolves names to the pinned source and excludes known private records',()=>{
  const rows=catalogueEntries();
  assert.equal(Object.keys(srdPages).length,364);
  assert.ok(rows.every(row=>srdPages[row.first]));
  assert.equal(filterCatalogue(rows,'fireball','Spell')[0].name,'Fireball');
  assert.equal(filterCatalogue(rows,'winged boots','Magic Item')[0].first,253);
  assert.match(srdPages[258],/Aboleth/);
  assert.deepEqual(filterCatalogue(rows,'Aure Sluice Leech','Creature'),[]);
});
test('guide separates sourced tactics from outside-combat advice for all class templates',()=>{
  for(const name of ['Fighter','Wizard','Warlock','Rogue']) {
    const draft=templateCharacter(name);
    const sections=playAdvice(draft,deriveCharacter(draft));
    assert.deepEqual(sections.map(([title])=>title),['Outside combat','During combat']);
    assert.ok(sections.every(([,rows])=>rows.length>=3&&rows.every(([,body,page])=>body&&srdPages[page])));
  }
  const wizard=templateCharacter('Wizard'), rogue=templateCharacter('Rogue');
  assert.notDeepEqual(playAdvice(wizard,deriveCharacter(wizard)),playAdvice(rogue,deriveCharacter(rogue)));
});
test('both original print layouts contain the generated guide with no private notes enabled',async()=>{
  const profile=playProfile({...templateCharacter('Warlock'),appearanceDetails:{eyes:'A private eye detail'}});
  for(const edition of ['2014','2024']) {
    const {bytes}=await makeNativeSheetPDF(profile,normalizePlay(profile),{edition,notes:false});
    const pdf=await PDFDocument.load(bytes);
    const fields=pdf.getForm().getFields();
    assert.ok(fields.some(field=>field.getName().includes('How to play')));
    assert.ok(fields.every(field=>!field.getText().includes('A private eye detail')));
  }
});
