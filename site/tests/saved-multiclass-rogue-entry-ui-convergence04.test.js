import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
test('Convergence 04: Play Sheet class-entry form remains explicit, nonactive and revision checked',()=>{
 const ui=file('play-sheet.js');
 for(const token of ['data-play-form="multiclass-rogue-entry"','name="skill" required',
  'name="expertise1" required','name="expertise2" required','name="language" required',
  'name="mastery1" required','name="mastery2" required','name="acknowledge" type="checkbox" required',
  'saveRogueEntryChoices','characterStorageRevision(record)','expectedRevision,requireExisting:true,skipUnchanged:true',
  'data-play-action="clear-rogue-entry"'])assert.ok(ui.includes(token),token);
 assert.match(ui,/these choices are not active yet/i);
});
test('Convergence 04: source grants no active Rogue features and offline worker precaches module',()=>{
 const code=file('lib/saved-multiclass-rogue-entry.mjs');
 assert.ok(code.includes('active:false'));
 assert.ok(code.includes('grantedStartingEquipment:false'));
 assert.ok(!code.includes('advancePlay('));
 const sw=file('sw.js');
 assert.match(sw,/player-convergence08/);
 assert.match(sw,/lib\/saved-multiclass-rogue-entry\.mjs/);
});
test('Convergence 04: reapproval and clearing of upstream plans invalidate the downstream Rogue choices',()=>{
 const plan=file('lib/saved-multiclass-plan.mjs');
 const checkpoint=file('lib/saved-multiclass-levelup.mjs');
 assert.ok(plan.includes('delete updated.multiclassRogueEntry'));
 assert.ok(checkpoint.includes('delete next.multiclassRogueEntry'));
});

test('Convergence 04: interface labels have natural Indonesian translations and dynamic labels are rendered',async()=>{
 const {messages}=await import('../dist/locale-copy.js');
 const {setLanguage,copy}=await import('../dist/locale.js');
 for(const key of ['New Rogue skill proficiency','Expertise skill 1','Expertise skill 2',
  'Weapon mastery kind 1','Save Rogue class-entry choices','Remove Rogue choices',
  'I confirm these are class-entry choices for future activation, not currently usable Rogue features.'])
  assert.ok(messages[key]?.id&&messages[key].id!==key,key);
 setLanguage('id');assert.equal(copy('Save Rogue class-entry choices'),'Simpan pilihan awal kelas Rogue');
 setLanguage('en');
 const ui=file('play-sheet.js');
 assert.ok(ui.includes('>${htmlCopy("Remove Rogue choices")}</button>`'));
 assert.ok(ui.includes('role="alert">${htmlCopy("Saved Rogue entry choices are malformed.'));
});
