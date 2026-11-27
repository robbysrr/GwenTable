import test from 'node:test';
import assert from 'node:assert/strict';
import {build, templateCharacter} from '../dist/lib/character.js';
import {advancePlay, normalizePlay, playProfile} from '../dist/lib/play.js';
import {makeRosterExport, readRosterExport, rosterFileLimit} from '../dist/lib/portable.js';

test('roster backups preserve custom content, live play, and undo across multiple characters',async()=>{
  const feat={id:'custom-tutor',type:'Feat',name:'Guild Training',description:'A table-approved feat.',prerequisite:''};
  const wizard=build({...templateCharacter('Wizard'),name:'Spellcaster',custom:[feat]}).draft;
  const fighter=templateCharacter('Fighter');
  const profile=playProfile(wizard);
  const earlier=normalizePlay(profile);
  const now=advancePlay(profile,earlier,{type:'damage',value:3});
  const backup=await makeRosterExport([
    {id:'local-one',updatedAt:'2026-11-17',draft:wizard,play:now,playUndo:earlier},
    {id:'local-two',draft:fighter}
  ]);
  assert.deepEqual(await readRosterExport(JSON.stringify(backup)),[
    {draft:wizard,play:now,playUndo:earlier},{draft:fighter}
  ]);
  assert.equal(backup.payload.some(entry=>Object.hasOwn(entry,'id')),false);
});

test('roster backups reject empty rosters, invalid play state, tampering, and oversized input',async()=>{
  const draft=templateCharacter('Fighter');
  await assert.rejects(makeRosterExport([]),/at least one/);
  await assert.rejects(makeRosterExport([{draft,play:{hp:-100}}]),/invalid play state/);
  const record=await makeRosterExport([{draft}]);
  record.payload[0].draft={...draft,name:'Changed after export'};
  await assert.rejects(readRosterExport(JSON.stringify(record)),/integrity/);
  await assert.rejects(readRosterExport(' '.repeat(rosterFileLimit+1)),/8 MB/);
});
