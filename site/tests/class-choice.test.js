import test from 'node:test';
import assert from 'node:assert/strict';
import {classOverview,classChoiceRow,classCoreFacts,planClassChange,commitClassPlan} from '../dist/class-choice.js';
import {classes} from '../dist/lib/catalog.js';
import {build,templateCharacter,deriveCharacter} from '../dist/lib/character.js';
import {setLanguage} from '../dist/locale.js';
const valid=(name='Wizard',level=3)=>build({...templateCharacter(name),name:'Mira 石',level,story:'Synthetic fixture',kit:'B'}).draft;
test('twelve overview primary abilities and complexity use the p19 source values',()=>{
  assert.deepEqual(Object.keys(classOverview),Object.keys(classes));
  assert.deepEqual(Object.values(classOverview).map(x=>x.complexity),['Average','High','Average','High','Low','High','Average','Average','Low','High','High','Average']);
  assert.equal(classOverview.Fighter.primary,'Strength or Dexterity');
  assert.equal(classOverview.Monk.primary,'Dexterity and Wisdom');assert.equal(classOverview.Ranger.primary,'Dexterity and Wisdom');assert.equal(classOverview.Paladin.primary,'Strength and Charisma');
  for(const id of Object.keys(classes)) {assert.equal(classChoiceRow(id).value,id);assert.ok(classChoiceRow(id).summary.includes(classOverview[id].example));assert.ok(classCoreFacts(id).length);}
});
test('Class proposal is non-mutating, lists new/removed decisions and preserves valid identity and equipment option',()=>{
  const before=valid();const original=structuredClone(before);const plan=planClassChange(before,'Fighter');
  assert.equal(plan.blocked,undefined);assert.deepEqual(before,original);
  for(const key of ['name','species','level','background','story','kit']) assert.deepEqual(plan.candidate[key],before[key],key);
  assert.ok(plan.changes.some(x=>x.unavailable));
  assert.ok(planClassChange(valid('Fighter'),'Wizard').changes.some(x=>x.before===undefined&&x.after!==undefined));
});
test('unknown data and unsupported high level block the proposal without altering the original',()=>{
  const unknown={...valid(),'private:source':{id:'fixture:custom'}};const original=structuredClone(unknown);
  assert.ok(planClassChange(unknown,'Fighter').blocked);assert.deepEqual(unknown,original);
  const high=valid('Fighter',20);assert.ok(planClassChange(high,'Wizard').blocked);assert.equal(high.level,20);
  assert.ok(planClassChange(valid(),'private:class').blocked);
});
test('failed pre-change save and stale preview cannot commit Class',async()=>{
  let draft=valid(),commits=0;const plan=planClassChange(draft,'Fighter');
  const deps={getDraft:()=>draft,saveBefore:async()=>false,onCommit:()=>commits++};
  assert.equal(await commitClassPlan(plan,deps),'save-failed');assert.equal(commits,0);
  assert.equal(await commitClassPlan(plan,{...deps,saveBefore:async()=>{throw Error('fixture quota');}}),'save-failed');
  assert.equal(await commitClassPlan(plan,{...deps,saveBefore:async()=>{draft={...draft,name:'Changed while saving'};return true;}}),'stale');assert.equal(commits,0);
});
test('successful commit writes the old raw state first, then changes Class; locale never changes IDs',async()=>{
  let draft=valid();const before=structuredClone(draft);let snapshot;
  const plan=planClassChange(draft,'Fighter');
  assert.equal(await commitClassPlan(plan,{getDraft:()=>draft,saveBefore:async()=>{snapshot=structuredClone(draft);return true;},onCommit:change=>{draft=change.candidate;}}),'committed');
  assert.deepEqual(snapshot,before);assert.equal(draft.className,'Fighter');
  const stats=deriveCharacter(draft);setLanguage('id');
  try{assert.equal(classChoiceRow('Fighter').value,'Fighter');assert.notEqual(classChoiceRow('Fighter').summary,classOverview.Fighter.example);assert.deepEqual(deriveCharacter(draft),stats);}finally{setLanguage('en');}
});
test('changing a rolled-HP Class to a different Hit Die requires new advancement rolls',()=>{
  const draft=build({...valid(),hpMethod:'rolled',hpRolls:[3,4]}).draft;
  assert.equal(planClassChange(draft,'Fighter').needsHPRoll,true);
});
test('level1 Fighter and Wizard keep their own class-specific feature and magic contracts',()=>{
  const fighter=valid('Fighter',1),wizard=valid('Wizard',1);
  assert.ok(build(fighter).controls.some(x=>x.key==='style'));assert.ok(build(fighter).controls.some(x=>x.key==='mastery'));
  assert.ok(build(wizard).controls.some(x=>x.section==='magic'));assert.equal(build(fighter).controls.some(x=>x.key==='book'),false);
  assert.equal(fighter.level,1);assert.equal(wizard.level,1);
});
