import test from 'node:test';
import assert from 'node:assert/strict';
import {beginnerHelp,beginnerTerms} from '../dist/beginner-help.js';
import {stages,stageFor,stageIndex,restoreBuilderProgress,builderCompletionIssue,shortChoiceKeys} from '../dist/builder-stages.js';
import {identitySuggestion} from '../dist/identity-generator.js';
import {classes,species} from '../dist/lib/catalog.js';
import {build,deriveCharacter,initialDraft,templateCharacter,validateCharacter} from '../dist/lib/character.js';
import {setLanguage} from '../dist/locale.js';

test('identity and species start together with level and no duplicate species stage',()=>{
  assert.equal(stages[0].id,'identity-species');
  assert.equal(stages.at(-2).id,'review');
  assert.equal(stages.at(-1).id,'appearance');
  assert.equal(stageIndex('species'),-1);
  for(const key of ['level','species','alignment','lineage','size']) assert.equal(stageFor({section:'identity',key}),'identity-species');
  for(const key of ['species','className','background','size','languages','alignment','method']) assert.ok(shortChoiceKeys.has(key));
});

test('older spellcaster draft retains its record choices and progress',()=>{
  const draft=templateCharacter('Wizard');
  const saved={id:'wizard-legacy',draftId:'wizard-legacy',draft,step:12,unlocked:13,saved:false};
  const old=structuredClone(saved);
  const progress=restoreBuilderProgress(saved,draft);
  assert.equal(stages[progress.step].id,'review');
  assert.equal(stages[progress.unlocked].id,'appearance');
  assert.deepEqual(progress.arrayAssigned,[0,1,2,3,4,5]);
  assert.equal(progress.finished,false);
  assert.deepEqual(saved,old);
  assert.deepEqual(build(saved.draft).draft,saved.draft);
  assert.deepEqual(validateCharacter(draft),[]);
  const missingName=restoreBuilderProgress({...saved,step:3,unlocked:3},{...draft,name:''});
  assert.equal(missingName.step,0);
  assert.equal(stages[missingName.unlocked].id,'background');
  const reopened=restoreBuilderProgress({...saved,saved:true},draft);
  assert.equal(reopened.finished,true);
});

test('completion requires confirmed mechanics and permits empty appearance',()=>{
  const wizard=templateCharacter('Wizard');
  const clean={...wizard};
  delete clean.appearance;
  delete clean.personality;
  delete clean.appearanceDetails;
  const progress={unlocked:stageIndex('appearance'),arrayAssigned:[0,1,2,3,4,5],waitingForHP:false,waitingForRoll:false};
  assert.equal(builderCompletionIssue(initialDraft(),{...progress,unlocked:0}),'identity-species');
  assert.equal(builderCompletionIssue(clean,{...progress,unlocked:stageIndex('review')}),'review');
  assert.equal(builderCompletionIssue(clean,{...progress,waitingForRoll:true}),'abilities');
  assert.equal(builderCompletionIssue(clean,{...progress,waitingForHP:true}),'training');
  assert.equal(builderCompletionIssue(clean,progress),null);
  assert.deepEqual(validateCharacter(clean),[]);
});

test('beginner examples and localized names leave official choices and calculations intact',()=>{
  assert.equal(Object.keys(beginnerTerms).length,18);
  for(const term of ['Class','Species','Background','Proficiency','Skill','Skill Check','Tool Proficiency','Origin Feat','Ability Score','Saving Throw','Advantage']) assert.ok(beginnerTerms[term]);
  const all=Object.keys(classes).map(templateCharacter);
  const expected=all.map(deriveCharacter);
  for(const ancestry of Object.keys(species)) {
    const draft={...initialDraft(),species:ancestry};
    const en=identitySuggestion('name',draft,()=>0,'en');
    const id=identitySuggestion('name',draft,()=>0,'id');
    assert.notEqual(en,id);
    assert.notEqual(id,identitySuggestion('name',{...draft,name:id},()=>0,'id'));
  }
  setLanguage('id');
  try {
    for(const term of Object.keys(beginnerTerms)) {
      const html=beginnerHelp(term);
      assert.match(html,/Apa itu/);
      assert.match(html,/SRD 5.2.1/);
      assert.equal((html.match(/<li>/g)??[]).length,2);
    }
    assert.deepEqual(all.map(deriveCharacter),expected);
  } finally {setLanguage('en');}
});
