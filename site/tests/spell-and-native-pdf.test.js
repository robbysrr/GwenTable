import test from 'node:test';
import assert from 'node:assert/strict';
import {spellLists} from '../dist/lib/tables.js';
import {filterSpells,spellReference} from '../dist/lib/spell-reference.js';
import {classes} from '../dist/lib/catalog.js';
import {build,templateCharacter} from '../dist/lib/character.js';
import {normalizePlay,playProfile} from '../dist/lib/play.js';
import {makeNativeSheetPDF,paperSizes} from '../dist/lib/native-sheet-pdf.js';
import {filterChoices} from '../dist/spell-picker.js';
import {stages,stageFor,stepIssue} from '../dist/builder-stages.js';
import {spellGroups} from '../dist/builder-magic.js';
import {identitySuggestion} from '../dist/identity-generator.js';
import {spellText,rulePages} from '../dist/lib/official-rules.js';
import {PDFDocument} from '../dist/vendor/pdf-lib.min.js';

test('all installed spell options have cited SRD headers and legal pools remain filterable',()=>{
  const names=[...new Set(Object.values(spellLists).flatMap(Object.keys))];
  assert.equal(names.length,285);
  assert.ok(names.every(name=>spellReference(name)?.page>=107&&spellReference(name)?.page<=175));
  assert.ok(names.every(name=>spellReference(name).effect.length>15));
  assert.match(spellReference('Fireball').effect,/8d6 Fire damage/);
  assert.equal(spellReference('Fire Bolt').page,132);
  assert.equal(spellReference('Shield').page,161);
  assert.match(spellReference('Shield').time,/Reaction.+Magic Missile/);
  const draft=templateCharacter('Wizard');
  const options=build(draft).controls.find(control=>control.key==='cantrips').options.map(spellReference);
  assert.deepEqual(filterSpells(options,{query:'  fÍre   bolt ',level:'0',school:'Evocation'}).map(x=>x.name),['Fire Bolt']);
  assert.deepEqual(filterSpells(options,{query:'fire',concentration:true}),[]);
  assert.ok(!options.some(x=>x.name==='Bless'));
});

test('both native PDF layouts print every class template on A4 and US Letter',async()=>{
  for(const name of Object.keys(classes)) {
    const profile=playProfile(templateCharacter(name));
    for(const edition of ['2014','2024']) for(const paper of Object.keys(paperSizes)) {
      const result=await makeNativeSheetPDF(profile,normalizePlay(profile),{edition,paper,clean:true,notes:false});
      const doc=await PDFDocument.load(result.bytes);
      assert.ok(result.pages>=1);
      assert.equal(doc.getPageCount(),result.pages);
      assert.deepEqual(Object.values(doc.getPage(0).getSize()),paperSizes[paper]);
      assert.match(doc.getTitle(),new RegExp(edition+'-style'));
    }
  }
});

test('native PDF paginates long custom content and handles unsupported characters visibly',async()=>{
  const draft=build({...templateCharacter('Wizard'),level:12,name:'Élodie 星',story:'Long story. '.repeat(80),
    custom:Array.from({length:10},(_,i)=>({id:'test-'+i,type:'Trait',name:'Private trait '+i,description:'A custom detail. '.repeat(80)}))}).draft;
  const profile=playProfile(draft);
  const play=normalizePlay(profile,{hp:0,xp:107500,temp:3,failures:2});
  const withNotes=await makeNativeSheetPDF(profile,play,{edition:'2024',notes:true});
  const without=await makeNativeSheetPDF(profile,play,{edition:'2024',notes:false});
  assert.equal(withNotes.substituted,true);
  assert.ok(withNotes.pages>without.pages);
});

test('picker combines text with the available category and spell filters',()=>{
  const rows=[
    {value:'wolf',name:'Wolf',category:'CR 1/4'},
    {value:'dire-wolf',name:'Dire Wolf',category:'CR 1'}
  ];
  assert.deepEqual(filterChoices(rows,{query:' WÓLF ',category:'CR 1'}).map(row=>row.value),['dire-wolf']);
  const spells=['Fire Bolt','Dancing Lights','Flame Blade'].map(name=>{
    const spell=spellReference(name);
    return {...spell,category:spell.school};
  });
  assert.deepEqual(filterChoices(spells,{query:'action',level:'0',concentration:true}).map(row=>row.name),['Dancing Lights']);
  assert.equal(filterChoices([{name:'Thieves’ Tools'}],{query:'thieves tools'}).length,1);
});

test('native A4 exports retain character name edits after resaving',async()=>{
  const profile=playProfile({...templateCharacter('Wizard'),name:'Draft name'});
  const {bytes}=await makeNativeSheetPDF(profile,normalizePlay(profile),{paper:'a4'});
  const doc=await PDFDocument.load(bytes);
  const fieldName='Character name and level 1';
  const field=doc.getForm().getTextField(fieldName);
  assert.match(field.getText(),/^Draft name/);
  field.setText('Updated name');
  const reloaded=await PDFDocument.load(await doc.save());
  assert.equal(reloaded.getForm().getTextField(fieldName).getText(),'Updated name');
});

test('creation stages expose each builder control and separate Wizard spellbook, preparation and grants',()=>{
  assert.equal(stages.at(-1).id,'appearance');
  for(const name of Object.keys(classes)) {
    const template=templateCharacter(name);
    const {controls}=build({...template,level:name==='Fighter'?20:12});
    assert.ok(controls.every(control=>stages.some(stage=>stage.id===stageFor(control))),name);
  }
  const {controls,draft}=build(templateCharacter('Wizard'));
  const groups=Object.fromEntries(spellGroups(controls.filter(control=>stageFor(control)==='magic')).map(group=>[group.id,group.controls]));
  assert.deepEqual(groups.cantrips.map(control=>control.key),['cantrips']);
  assert.deepEqual(groups.book.map(control=>[control.key,control.count]),[['bookBasics',8],['bookAdvanced',2],['bookSavant',2]]);
  assert.deepEqual(groups.prepared.map(control=>[control.key,control.count]),[['prepared',6]]);
  assert.ok(draft.prepared.every(spell=>groups.prepared[0].options.includes(spell)));
  assert.ok(groups.sources.some(control=>control.key==='backgroundMagicCantrips'));
});

test('the guided builder requires an explicit roll and a character name',()=>{
  const draft=templateCharacter('Wizard');
  assert.match(stepIssue('abilities',draft,true).message,/Roll all six/);
  assert.equal(stepIssue('abilities',draft,false),null);
  assert.match(stepIssue('identity-species',{...draft,name:'   '},false).message,/name is required/);
  assert.equal(stepIssue('identity-species',draft,false),null);
});

test('identity suggestions are editable original text and selected spells include complete SRD details',()=>{
  const draft=templateCharacter('Wizard');
  const trinket=identitySuggestion('trinket',draft,()=>0);
  assert.notEqual(trinket,draft.trinket);
  assert.match(identitySuggestion('story',draft,()=>0),/borrowed books/);
  assert.match(spellText.Fireball,/Using a Higher-Level Spell Slot/);
  assert.match(rulePages[182],/Expertise/);
});

test('personal description survives a character file round trip',async()=>{
  const {makeExport,readSavedCharacterExport}=await import('../dist/lib/portable.js');
  const draft=build({...templateCharacter('Wizard'),appearance:'An indigo cloak',personality:'Curious and patient'}).draft;
  const saved=await makeExport(draft);
  const {draft:restored}=await readSavedCharacterExport(JSON.stringify(saved));
  assert.equal(restored.appearance,draft.appearance);
  assert.equal(restored.personality,draft.personality);
});

test('metric display and planner suggestions avoid changing underlying rules',async()=>{
  const {distance,metricText,weaponDistances}=await import('../dist/lib/distances.js');
  const {spellSuggestions}=await import('../dist/builder-magic.js');
  assert.equal(distance(30),'30 ft / 9 m');
  assert.equal(metricText('Area: 15-foot cone'),'Area: 15 ft / 4.5 m cone');
  assert.equal(metricText(distance(30)),distance(30));
  assert.equal(weaponDistances('Range 30/120'),'Range 30/120 ft / 9/36 m');
  const choices=['Fire Bolt','Mage Hand','Minor Illusion','Shocking Grasp'];
  for(const mode of ['random','optimize']){
    const picks=spellSuggestions(choices,3,mode,spellReference,()=>.4);
    assert.equal(new Set(picks).size,3);
    assert.ok(picks.every(pick=>choices.includes(pick)));
  }
});
