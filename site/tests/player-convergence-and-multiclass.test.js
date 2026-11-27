import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {classes} from '../dist/lib/catalog.js';
import {previewMulticlass,multiclassRequirements,multiclassRequirementStatus} from '../dist/lib/srd-multiclass-preview.mjs';
import {alignmentExamples,languageExamples,alignmentDisclaimer} from '../dist/choice-guidance.js';
const file=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const scores=(str,dex,con,int,wis,cha)=>[str,dex,con,int,wis,cha];
const levels=(...x)=>x.map(([className,level])=>({className,level}));

test('Convergence: class prerequisites cover exactly all twelve SRD classes',()=>{
  assert.deepEqual(Object.keys(multiclassRequirements).sort(),Object.keys(classes).sort());
  assert.equal(multiclassRequirementStatus('Fighter',scores(8,13,10,8,8,8)).eligible,true);
  assert.equal(multiclassRequirementStatus('Fighter',scores(13,8,10,8,8,8)).eligible,true);
  assert.equal(multiclassRequirementStatus('Fighter',scores(12,12,10,8,8,8)).eligible,false);
  assert.equal(multiclassRequirementStatus('Monk',scores(8,13,10,8,12,8)).eligible,false);
  assert.equal(multiclassRequirementStatus('Monk',scores(8,13,10,8,13,8)).eligible,true);
  assert.equal(multiclassRequirementStatus('Paladin',scores(13,8,10,8,8,12)).eligible,false);
  assert.equal(multiclassRequirementStatus('Paladin',scores(13,8,10,8,8,13)).eligible,true);
  assert.equal(multiclassRequirementStatus('Ranger',scores(8,13,10,8,13,8)).eligible,true);
  assert.equal(multiclassRequirementStatus('Wizard',scores(8,13,10,12,13,8)).eligible,false);
});
test('Convergence: changing class requires both old and new primary abilities, without mutating input',()=>{
  const original=levels(['Barbarian',4],['Druid',1]);const before=structuredClone(original);
  const fail=previewMulticlass(original,scores(12,11,12,8,13,9));
  assert.equal(fail.qualified,false);assert.equal(fail.totalLevel,5);
  assert.equal(previewMulticlass(original,scores(13,11,12,8,13,9)).qualified,true);
  assert.deepEqual(original,before);
});
test('Convergence: shared spellcaster level and multiclass Spellcasting slots follow SRD 5.2.1',()=>{
  const testScores=[13,14,12,16,16,16];
  const result=previewMulticlass(levels(['Ranger',4],['Sorcerer',3]),testScores);
  assert.equal(result.spellcastingLevel,5);
  assert.deepEqual(result.sharedSlots,[{level:1,count:4},{level:2,count:3},{level:3,count:2}]);
  const warlock=previewMulticlass(levels(['Warlock',2],['Wizard',3]),testScores);
  assert.equal(warlock.pactMagicSeparate,true);
  assert.deepEqual(warlock.sharedSlots,[{level:1,count:4},{level:2,count:2}]);
  assert.deepEqual(previewMulticlass(levels(['Fighter',2],['Rogue',3]),testScores).sharedSlots,[]);
});
test('Convergence: level 20 wizard planning table is valid, but does not pretend persistence exists',()=>{
  const result=previewMulticlass(levels(['Wizard',20]),scores(8,12,12,18,10,10));
  assert.equal(result.totalLevel,20);assert.equal(result.proficiencyBonus,6);
  assert.deepEqual(result.sharedSlots.map(x=>x.count),[4,3,3,3,3,2,2,1,1]);
  assert.match(result.manualRules.at(-1),/No secondary-class features or saved character data/);
  assert.throws(()=>previewMulticlass(levels(['Wizard',20],['Fighter',1]),[13,13,12,13,10,10]),/exceed total level/);
});
test('Convergence: invalid and duplicate class data rejected without changing original inputs',()=>{
  const src=levels(['Wizard',1],['Wizard',2]);const before=structuredClone(src);
  assert.throws(()=>previewMulticlass(src,scores(8,8,8,13,8,8)),/different SRD class/);
  assert.deepEqual(src,before);
  assert.throws(()=>previewMulticlass(levels(['Wizard',0]),scores(8,8,8,13,8,8)),/1–20 levels/);
  assert.throws(()=>previewMulticlass(levels(['NonSRD',2]),scores(8,8,8,13,8,8)),/different SRD class/);
  assert.throws(()=>previewMulticlass(levels(['Wizard',1]),[13,13]),/Six integer ability scores/);
});
test('Convergence: all alignments and SRD standard languages have distinct grounded explanations',async()=>{
  const {alignments,languages}=await import('../dist/lib/rules.js');
  assert.deepEqual(Object.keys(alignmentExamples).sort(),alignments.slice().sort());
  for(const name of languages)assert.ok(languageExamples[name]?.length>15,name);
  assert.ok(languageExamples.Common);
  assert.match(alignmentDisclaimer,/does not grant abilities/);
});
function themeHarness(start={}){
  const stored=new Map(Object.entries(start));const documentHandlers={};const windowHandlers={};const systemHandlers={};
  const controlKeys=['theme-mode','palette-mode','density-mode'];
  const controls=Object.fromEntries(controlKeys.map(k=>[k,{value:'',handlers:{},addEventListener(type,callback){this.handlers[type]=callback;},change(value){this.value=value;this.handlers.change?.({target:this});}}]));
  const dom={documentElement:{dataset:{}},getElementById(id){return controls[id]??null;},
    querySelector(selector){return selector==='meta[name="theme-color"]'?meta:null;},
    addEventListener(name,callback){documentHandlers[name]=callback;}};
  const meta={content:'#000000'};const system={matches:false,addEventListener(type,cb){systemHandlers[type]=cb;}};
  const win={matchMedia:()=>system,addEventListener(type,cb){windowHandlers[type]=cb;}};
  const localStorage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,value)};
  vm.runInNewContext(file('design/theme.js'),{document:dom,window:win,localStorage,getComputedStyle:()=>({getPropertyValue:()=> '#FAF7F2'})});
  documentHandlers.DOMContentLoaded();
  return {controls,stored,dom,win,system,meta,windowHandlers,systemHandlers};
}
test('Convergence: defaults Scholar Plum, system scheme, Comfortable with zero saved writes',()=>{
  const h=themeHarness();assert.equal(h.dom.documentElement.dataset.theme,'light');
  assert.equal(h.dom.documentElement.dataset.palette,'scholar-plum');
  assert.equal(h.dom.documentElement.dataset.density,'comfortable');
  assert.equal(h.controls['palette-mode'].value,'scholar-plum');
  assert.equal(h.stored.size,0);
});
test('Convergence: changing presentation persists independently and synchronizes across tabs',()=>{
  const h=themeHarness();h.controls['palette-mode'].change('moonlit-sapphire');
  h.controls['density-mode'].change('compact');h.controls['theme-mode'].change('dark');
  assert.equal(h.dom.documentElement.dataset.theme,'dark');
  assert.equal(h.dom.documentElement.dataset.palette,'moonlit-sapphire');
  assert.equal(h.dom.documentElement.dataset.density,'compact');
  assert.equal(h.stored.get('gwentable-palette'),'moonlit-sapphire');
  h.stored.set('gwentable-density','comfortable');h.windowHandlers.storage({key:'gwentable-density'});
  assert.equal(h.dom.documentElement.dataset.density,'comfortable');
  h.controls['palette-mode'].change('not-a-palette');assert.equal(h.dom.documentElement.dataset.palette,'moonlit-sapphire');
});
test('Convergence: system scheme honors OS changes; explicit dark overrides OS changes',()=>{
  const h=themeHarness();h.system.matches=true;h.systemHandlers.change();
  assert.equal(h.dom.documentElement.dataset.theme,'dark');
  h.controls['theme-mode'].change('light');h.system.matches=false;h.systemHandlers.change();
  assert.equal(h.dom.documentElement.dataset.theme,'light');
  h.stored.set('gwentable-theme','system');h.windowHandlers.storage({key:'gwentable-theme'});
  h.system.matches=true;h.systemHandlers.change();assert.equal(h.dom.documentElement.dataset.theme,'dark');
});
test('Convergence: player navigation hides DM/NPC route while preserving legacy records',()=>{
  const html=file('index.html'),js=file('app.js'),styles=file('style.css'),sw=file('sw.js');
  assert.match(html,/id="palette-mode"/);assert.match(html,/id="density-mode"/);
  assert.match(html,/href="#encounters" data-ui-icon="attack"/);
  assert.doesNotMatch(html,/<a href="#dm" data-ui-icon=/);
  assert.match(html,/<section id="npc" class="view" hidden aria-hidden="true"/);
  assert.match(js,/fragment==='dm'\?'encounters'/);
  assert.match(styles,/data-density="compact"/);assert.match(styles,/data-palette="moonlit-sapphire"/);
  assert.match(sw,/choice-guidance\.js/);assert.match(sw,/srd-multiclass-preview\.mjs/);
  assert.match(js,/Multiclassing · eligibility preview/);
});

test('Convergence: prepared spells render first in class spell selection',async()=>{
  const {spellGroups}=await import('../dist/builder-magic.js');
  const choices=[{key:'bookSpells',label:'Wizard book'},{key:'cantrips',label:'Cantrips'},
    {key:'prepared',label:'Prepared spells'},{key:'classBonus',label:'Bonus magic'}];
  assert.deepEqual(spellGroups(choices).map(x=>x.id),['prepared','cantrips','book','sources']);
});
