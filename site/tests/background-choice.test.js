import test from 'node:test';
import assert from 'node:assert/strict';
import {backgroundBenefits,backgroundChoiceRow,planBackgroundChange} from '../dist/background-choice.js';
import {commitBuildPlan} from '../dist/class-choice.js';
import {backgrounds,spellLists} from '../dist/lib/catalog.js';
import {build,templateCharacter,deriveCharacter} from '../dist/lib/character.js';
import {setLanguage} from '../dist/locale.js';
const fixture=(background='Soldier',className='Wizard')=>build({...templateCharacter(className),level:1,name:'Mira 石',background,story:'Synthetic fixture',backgroundKit:'B'}).draft;
const expected={
 Acolyte:{abilities:['Intelligence','Wisdom','Charisma'],feat:'Magic Initiate (Cleric)',skills:['Insight','Religion'],gp:8,tool:'Calligrapher’s Supplies'},
 Criminal:{abilities:['Dexterity','Constitution','Intelligence'],feat:'Alert',skills:['Sleight of Hand','Stealth'],gp:16,tool:'Thieves’ Tools'},
 Sage:{abilities:['Constitution','Intelligence','Wisdom'],feat:'Magic Initiate (Wizard)',skills:['Arcana','History'],gp:8,tool:'Calligrapher’s Supplies'},
 Soldier:{abilities:['Strength','Dexterity','Constitution'],feat:'Savage Attacker',skills:['Athletics','Intimidation'],gp:14,tool:'Gaming Set'}
};
test('four p83 records have exact source grants and mutually exclusive equipment A/B',()=>{
 assert.deepEqual(Object.keys(backgrounds),Object.keys(expected));
 for(const [id,row] of Object.entries(expected)) {
  const b=backgroundBenefits(id);assert.deepEqual(b.abilityCandidates,row.abilities);assert.equal(b.originFeat,row.feat);assert.deepEqual(b.skills,row.skills);assert.equal(b.tool.name,row.tool);
  assert.equal(b.equipment[0].gp,row.gp);assert.deepEqual(b.equipment[1],{id:'B',items:[],gp:50});assert.equal(b.sourceVersion,'5.2.1');assert.equal(b.page,83);assert.equal(b.license,'CC BY 4.0');
  assert.ok(b.pending.some(x=>x.stage==='abilities'));assert.ok(b.pending.some(x=>x.stage==='equipment'));
 }
 assert.ok(backgroundBenefits('Acolyte').equipment[0].items.includes('Parchment (10 sheets)'));
 assert.ok(backgroundBenefits('Sage').equipment[0].items.includes('Parchment (8 sheets)'));
 assert.ok(backgroundBenefits('Criminal').equipment[0].items.includes('2 Daggers'));
 assert.ok(backgroundBenefits('Soldier').equipment[0].items.includes('20 Arrows'));
});
test('proposal previews contextual grants even when stored boost and kit values do not change',()=>{
 const draft=fixture();const original=structuredClone(draft);const plan=planBackgroundChange(draft,'Sage');
 assert.deepEqual(draft,original);assert.ok(plan.changes.some(x=>x.key==='background:abilityCandidates'));assert.ok(plan.changes.some(x=>x.key==='background:originFeat'));
 for(const key of ['name','className','species','level','story','scores','kit','backgroundKit','book','prepared']) assert.deepEqual(plan.candidate[key],draft[key],key);
});
test('Soldier selected Gaming Set matches package A; derivation does not append grants on repeats',()=>{
 const base=fixture('Soldier','Fighter');const control=build(base).controls.find(x=>x.key==='gamingSet');
 for(const gamingSet of control.options) {
  const draft=build({...base,gamingSet,backgroundKit:'A'}).draft;
  assert.equal(backgroundBenefits('Soldier',draft).tool.selected,gamingSet);
  assert.ok(backgroundBenefits('Soldier',draft).equipment[0].items.includes(gamingSet));
  assert.ok(deriveCharacter(draft).inventory.includes(gamingSet));
  assert.deepEqual(deriveCharacter(build(draft).draft),deriveCharacter(draft));
 }
});
test('Magic Initiate controls stay on the correct source spell list and are labeled for later review',()=>{
 for(const [background,list] of [['Acolyte','Cleric'],['Sage','Wizard']]) {
  const draft=fixture(background);const controls=build(draft).controls.filter(x=>x.key.startsWith('backgroundMagic'));
  assert.ok(backgroundBenefits(background).pending.some(x=>x.stage==='magic'));
  const cantrips=controls.find(x=>x.key.endsWith('Cantrips'));const spell=controls.find(x=>x.key.endsWith('Spell'));
  assert.equal(cantrips.count,2);assert.ok(cantrips.options.every(name=>spellLists[list][name]?.[0]===0));assert.ok(spell.options.every(name=>spellLists[list][name]?.[0]===1));
 }
});
test('repeated Soldier/Sage proposals do not mutate source records or accumulate GP/skills/items',()=>{
 let draft=fixture('Soldier','Fighter');const expectedStats=deriveCharacter(draft);
 for(let i=0;i<3;i++){draft=planBackgroundChange(draft,'Sage').candidate;draft=planBackgroundChange(draft,'Soldier').candidate;}
 const stats=deriveCharacter(draft);assert.equal(stats.gp,expectedStats.gp);assert.deepEqual(stats.inventory,expectedStats.inventory);assert.equal(new Set(stats.featNames).size,stats.featNames.length);
 assert.deepEqual(stats.scores,expectedStats.scores);
});
test('failed pre-save never applies Background; raw unsupported custom data remains unchanged',async()=>{
 let draft=fixture();const plan=planBackgroundChange(draft,'Criminal');const before=structuredClone(draft);
 assert.equal(await commitBuildPlan(plan,{getDraft:()=>draft,saveBefore:async()=>false,onCommit:p=>{draft=p.candidate;}}),'save-failed');assert.deepEqual(draft,before);
 const unknown={...draft,background:'private:origin',extensions:{source:'fixture:pack',inventory:['keepsake']}};const raw=structuredClone(unknown);
 assert.ok(planBackgroundChange(unknown,'Soldier').blocked);assert.deepEqual(unknown,raw);assert.equal(backgroundBenefits('__proto__'),null);assert.equal(backgroundChoiceRow('private:origin'),null);
});
test('locale switching keeps Background and source IDs plus numeric mechanics intact',()=>{
 const draft=fixture('Criminal');const before=deriveCharacter(draft);const row=backgroundChoiceRow('Criminal');
 setLanguage('id');try{assert.equal(backgroundChoiceRow('Criminal').value,row.value);assert.notEqual(backgroundChoiceRow('Criminal').summary,row.summary);assert.deepEqual(deriveCharacter(draft),before);}finally{setLanguage('en');}
});
