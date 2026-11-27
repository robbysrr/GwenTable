import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=path=>readFileSync(new URL('../dist/'+path,import.meta.url),'utf8');
test('Convergence 05 UI: activation is opt-in and revision-checked in the existing saved Play Sheet',()=>{
 const ui=source('play-sheet.js');
 for(const name of ['data-play-form="activate-fighter-rogue"','name="confirmed" required',
  'activateFighterRogue(current,{confirmed:true})','expectedRevision:characterStorageRevision(record)',
  'profile=playProfile(next.draft,next.multiclassActive)','playProfile(current.draft,current.multiclassActive)',
  'profile.hitDicePools','profile.rogueLevel'])assert.ok(ui.includes(name),name);
});
test('Convergence 05 UI: active Fighter/Rogue cannot accidentally enter single-class Builder and uses validated composite PDF',()=>{
 const ui=source('play-sheet.js');
 assert.match(ui,/multiclassActive:opened\.multiclassActive\?\?null/);
 assert.match(ui,/if\(type==='advance'\) return record\.multiclassActive\?/);
 assert.match(source('saved-character-build.js'),/current\.multiclassActive/);
 assert.match(source('linked-gcx-update.js'),/current\?\.multiclassActive/);
 assert.match(source('lib/gwentable-gcx.js'),/const active=record\.multiclassActive\?\?null/);
});
test('Convergence 05 offline asset cache includes both active/activation modules',()=>{
 const sw=source('sw.js');
 assert.match(sw,/player-convergence08/);
 assert.match(sw,/lib\/activate-fighter-rogue\.mjs/);
 assert.match(sw,/lib\/srd-fighter-rogue-live\.mjs/);
});
