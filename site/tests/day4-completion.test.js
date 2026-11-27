import test from 'node:test';
import assert from 'node:assert/strict';
import {build,templateCharacter,deriveCharacter,validateCharacter} from '../dist/lib/character.js';
import {classes} from '../dist/lib/catalog.js';
import {stageIndex,restoreBuilderProgress} from '../dist/builder-stages.js';
import {draftRevision,completionIssues,mechanicalIssues,confirmAppearance,canOpenFinalSheet,readBuilderDraft,validatedSavedDraft,relevantStageIndices} from '../dist/builder-completion.js';
import {playProfile,normalizePlay,reconcilePlay} from '../dist/lib/play.js';
import {copy,setLanguage} from '../dist/locale.js';
const valid=(name='Fighter',level=1)=>build({...templateCharacter(name),name:'Mira 石',level}).draft;
const flow={step:stageIndex('appearance'),unlocked:stageIndex('appearance'),arrayAssigned:[0,1,2,3,4,5],waitingForRoll:false,waitingForHP:false};

test('final sheet requires valid rules plus an explicit appearance decision on the current revision',()=>{
  const draft=valid();
  assert.equal(canOpenFinalSheet(draft,flow,null),false);
  const skipped=confirmAppearance(draft,flow,'skipped');
  assert.equal(skipped.mode,'skipped');
  assert.equal(canOpenFinalSheet(draft,flow,skipped),true);
  assert.equal(canOpenFinalSheet(draft,{...flow,waitingForRoll:true},skipped),false);
  assert.equal(confirmAppearance(draft,{...flow,step:stageIndex('review')},'skipped'),null);
  assert.equal(canOpenFinalSheet({...draft,name:'changed'},flow,skipped),false);
  assert.equal(canOpenFinalSheet(draft,{...flow,unavailable:true},skipped),false);
  assert.equal(canOpenFinalSheet(draft,{...flow,unlocked:0},skipped),false);
  assert.equal(validatedSavedDraft({...draft,name:''}),null);
  assert.deepEqual(validatedSavedDraft(draft),draft);
});

test('missing Wizard spell choices produce an owning field, and unsupported levels cannot pass',()=>{
  const draft=valid('Wizard');
  const spellControl=build(draft).controls.find(row=>row.section==='magic'&&row.count>1);
  const incomplete={...draft,[spellControl.key]:[]};
  const issues=mechanicalIssues(incomplete);
  assert.ok(issues.some(issue=>issue.stage==='magic'&&issue.field===spellControl.key));
  assert.equal(confirmAppearance(incomplete,flow,'reviewed'),null);
  assert.ok(mechanicalIssues({...draft,level:20}).some(issue=>issue.status==='unsupported'&&issue.field==='level'));
  assert.ok(completionIssues(draft,{...flow,waitingForHP:true}).some(issue=>issue.stage==='training'));
});

test('all class templates derive completion and conditional Magic from their real controls',()=>{
  for(const className of Object.keys(classes)) {
    const draft=valid(className,3);
    assert.deepEqual(completionIssues(draft,flow),[],className);
    assert.ok(confirmAppearance(draft,flow,'reviewed'),className);
  }
  const dwarf=build({...valid(),species:'Dwarf'}).draft;
  assert.equal(relevantStageIndices(dwarf).includes(stageIndex('magic')),false);
  assert.equal(relevantStageIndices(valid('Wizard')).includes(stageIndex('magic')),true);
});

test('legacy aliases and canonical source values survive repeated reads, with exact raw preservation on unknown data',()=>{
  const dwarf=build({...valid('Fighter',15),species:'Dwarf'}).draft;
  const caster=valid('Wizard',3);
  for(const original of [dwarf,caster]) {
    const read=readBuilderDraft(original);
    assert.equal(read.unavailable,null);
    assert.deepEqual(readBuilderDraft(read.draft),read);
    for(const stage of ['identity','setup','species']) assert.equal(restoreBuilderProgress({draft:original,stage,unlockedStage:'appearance'},original).step,0);
    assert.deepEqual(deriveCharacter(original),deriveCharacter(read.draft));
  }
  const unknown={...caster,'private:origin':{id:'pack:test'},species:'private:unknown',custom:[...caster.custom]};
  const read=readBuilderDraft(unknown);
  assert.deepEqual(read.unavailable,unknown);
  assert.equal(confirmAppearance(read.draft,{...flow,unavailable:true},'skipped'),null);
  assert.deepEqual(readBuilderDraft({...caster,'private:note':'retain'}).unavailable, {...caster,'private:note':'retain'});
});

test('appearance and locale cannot change calculations, and legitimate saving reconciles existing play state',()=>{
  const draft=valid('Fighter',3);
  const profile=playProfile(draft);
  const state=normalizePlay(profile,{hp:13,xp:1350,slots:{}});
  const next={...draft,appearance:'Green coat',personality:'Curious'};
  const after=reconcilePlay(profile,playProfile(next),state);
  assert.equal(after.hp,state.hp);assert.equal(after.xp,state.xp);
  const before=deriveCharacter(draft);
  assert.deepEqual(deriveCharacter(next),before);
  const decision=confirmAppearance(draft,flow,'skipped');
  setLanguage('id');
  try {assert.equal(canOpenFinalSheet(draft,flow,decision),true);assert.deepEqual(deriveCharacter(draft),before);}
  finally {setLanguage('en');}
  assert.equal(draftRevision({b:1,a:2}),draftRevision({a:2,b:1}));
});

// Exercise the actual dialog entry and submit handlers using its existing plain-DOM contract.
import {mountSheetExport} from '../dist/sheet-export.js';
test('PDF dialog rechecks stale eligibility on submit and on browser-print activation',async()=>{
  const handlers={};
  const element=()=>({hidden:false,disabled:false,value:'2024',checked:false,onclick:null,closest:()=>({hidden:false})});
  const fields=Object.fromEntries(['edition','paper','snapshot','notes','generate'].map(name=>[name,element()]));
  fields.paper.value='A4';
  const form={elements:fields,addEventListener:(type,callback)=>{handlers[type]=callback;}};
  const feedback={textContent:''};
  const web=element();
  const close=element();
  const dialog={open:false,querySelector:selector=>selector==='form'?form:selector==='[data-sheet-web]'?web:selector==='[data-sheet-close]'?close:feedback,
    addEventListener(){},showModal(){this.open=true;},close(){this.open=false;}};
  let eligibility=true,prints=0;
  const open=mountSheetExport(dialog,()=>{prints++;});
  const draft=valid();
  open(draft,undefined,{eligibility:()=>eligibility});
  assert.equal(dialog.open,true);
  eligibility=false;
  await form.onsubmit({preventDefault(){}});
  assert.match(feedback.textContent,/Review this saved build/);
  await web.onclick();
  assert.equal(prints,0);
  assert.equal(dialog.open,true);
  eligibility=true;
  await web.onclick();
  assert.equal(prints,1);
  assert.equal(dialog.open,false);
  open({...draft,name:''},undefined,{eligibility:()=>true});
  assert.equal(dialog.open,false);
});

test('legacy normalization retains its exact raw record, including unknown origin and imported provenance',()=>{
  const legacy={name:'Mira',species:'private:ancestry',level:7,className:'Wizard',background:'Sage',
    notes:'Synthetic old record',customSource:{id:'fixture:pack',version:1},inventory:['keepsake']};
  const before=structuredClone(legacy);
  const read=readBuilderDraft(legacy);
  assert.deepEqual(read.unavailable,before);
  assert.deepEqual(readBuilderDraft(read.unavailable).unavailable,before);
  assert.deepEqual(legacy,before);
  assert.equal(confirmAppearance(read.draft,{...flow,unavailable:true},'skipped'),null);
});
