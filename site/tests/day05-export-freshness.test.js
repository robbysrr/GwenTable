import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {stageIndex} from '../dist/builder-stages.js';
import {draftRevision} from '../dist/builder-completion.js';
import {emptyChoiceReview,acceptChoiceReview} from '../dist/builder-choice-review.js';
import {createSavedCompletionApproval} from '../dist/saved-character-completion.js';
import {sameSavedCharacterRevision,mayExportSavedCharacter,checkSavedExportFreshness} from '../dist/saved-character-freshness.js';
import {mountSheetExport} from '../dist/sheet-export.js';
import {copy,setLanguage} from '../dist/locale.js';
const A='12345678-1234-4234-8234-123456789abc';
const B='12345678-1234-4234-8234-987654321abc';
function approvedRecord(){
  const draft=templateCharacter('Fighter');
  const fields=['species','className','background','gamingSet','languages','training','feats','boost','equipment','classMagic','originMagic'];
  const choiceReview=fields.reduce((state,field)=>acceptChoiceReview(state,draft,field),emptyChoiceReview());
  const flow={step:stageIndex('appearance'),unlocked:stageIndex('appearance'),choiceReview,
    waitingForRoll:false,waitingForHP:false,arrayAssigned:[0,1,2,3,4,5],unavailable:false};
  const approval=createSavedCompletionApproval(draft,flow,{mode:'skipped',revision:draftRevision(draft)});
  assert.ok(approval);
  return {id:'fighter-local',_characterRevision:A,draft,completionApproval:approval};
}
function dialogHarness(){
  const control=(value='')=>({disabled:false,hidden:false,checked:false,value,closest:()=>({hidden:false})});
  const fields={edition:control('2024'),paper:control('a4'),snapshot:control('clean'),notes:control(),generate:control()};
  const form={elements:fields,addEventListener(){}};
  const feedback={textContent:'',replaceChildren(){throw new Error('stale PDF must not be linked for download');}};
  const web=control(),close=control();
  const dialog={open:false,querySelector(selector){
    return selector==='form'?form:selector==='[data-sheet-web]'?web:selector==='[data-sheet-close]'?close:feedback;
  },addEventListener(){},showModal(){this.open=true;},close(){this.open=false;}};
  const printed=[];
  const open=mountSheetExport(dialog,draft=>printed.push(draft.name));
  return {dialog,form,feedback,web,open,printed};
}
test('completed saved-record export requires exact non-null revision and a current completion receipt',()=>{
  const opened=approvedRecord();
  assert.equal(sameSavedCharacterRevision(opened,{...opened}),true);
  assert.equal(mayExportSavedCharacter(opened,{...opened}),true);
  assert.equal(mayExportSavedCharacter(opened,{...opened,_characterRevision:B}),false);
  assert.equal(mayExportSavedCharacter(opened,{...opened,completionApproval:null}),false);
  assert.equal(mayExportSavedCharacter(opened,{...opened,id:'other'}),false);
  assert.equal(sameSavedCharacterRevision({...opened,_characterRevision:null},{...opened,_characterRevision:null}),false);
  assert.equal(mayExportSavedCharacter({...opened,_characterRevision:'bad'},opened),false);
});
test('read-only revision check fails closed when the record is removed or IndexedDB cannot read it',async()=>{
  const opened=approvedRecord();
  const calls=[];
  assert.equal(await checkSavedExportFreshness(opened,async id=>{calls.push(id);return {...opened};}),true);
  assert.deepEqual(calls,[opened.id]);
  assert.equal(await checkSavedExportFreshness(opened,async()=>undefined),false);
  assert.equal(await checkSavedExportFreshness(opened,async()=>{throw new Error('storage unavailable');}),false);
  assert.equal(await checkSavedExportFreshness({...opened,_characterRevision:null},async()=>opened),false);
});
test('browser-print action blocks a saved sheet when another tab changes its revision',async()=>{
  const x=dialogHarness(),saved=approvedRecord();
  let valid=false;
  x.open(saved.draft,undefined,{eligibility:()=>true,verifyCurrent:async()=>valid});
  assert.equal(x.dialog.open,true);
  await x.web.onclick();
  assert.deepEqual(x.printed,[]);
  assert.equal(x.dialog.open,true);
  assert.match(x.feedback.textContent,/newer version/);
  valid=true;
  await x.web.onclick();
  assert.deepEqual(x.printed,[saved.draft.name]);
  assert.equal(x.dialog.open,false);
});
test('PDF submission does not generate or offer a stale sheet when freshness fails before rendering',async()=>{
  const x=dialogHarness(),saved=approvedRecord();
  x.open(saved.draft,undefined,{eligibility:()=>true,verifyCurrent:async()=>false});
  await x.form.onsubmit({preventDefault(){}});
  assert.match(x.feedback.textContent,/newer version/);
  assert.equal(x.dialog.open,true);
});
test('PDF submission checks revision AGAIN after generation, refusing a stale download link',async()=>{
  const x=dialogHarness(),saved=approvedRecord();
  let calls=0;
  x.open(saved.draft,undefined,{eligibility:()=>true,verifyCurrent:async()=>++calls===1});
  await x.form.onsubmit({preventDefault(){}});
  assert.equal(calls,2,'one check before and one after PDF bytes are generated');
  assert.match(x.feedback.textContent,/newer version/);
  assert.equal(x.dialog.open,true);
});
test('saved roster, Play printing, and Play export are wired to the same freshness gate and offline cache',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  const play=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
  const cache=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(app,/verifyCurrent:\(\)=>checkSavedExportFreshness\(record/);
  assert.match(play,/verifyCurrent:\(\)=>checkSavedExportFreshness\(opened/);
  assert.match(play,/if\(!await checkSavedExportFreshness\(opened/);
  assert.match(play,/record!==opened\|\|activeId!==opened\.id/);
  assert.match(cache,/\.\/saved-character-freshness\.js/);
  assert.match(cache,/open-5e-v0\.25\.7-inventory-dev/);
});
test('stale export warning is actionable in English and Bahasa Indonesia',()=>{
  const key='A newer version of this saved character may exist. Reopen it before exporting or printing.';
  setLanguage('en');assert.match(copy(key),/Reopen/);
  setLanguage('id');
  try {assert.match(copy(key),/Buka kembali/);} finally {setLanguage('en');}
});
