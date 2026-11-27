import test from 'node:test';
import assert from 'node:assert/strict';
import {templateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay,validatePlay} from '../dist/lib/play.js';
import {makePlayExport,readSavedCharacterExport,makeExport} from '../dist/lib/portable.js';

function sheet(className) {
  const draft=templateCharacter(className);
  const profile=playProfile(draft);
  let state=normalizePlay(profile);
  const act=(type,fields={})=>state=advancePlay(profile,state,{type,...fields});
  return {draft,profile,act,get state(){return state;}};
}
const spend=(sheet,id)=>sheet.act('counter',{id,delta:1});
const slot=(sheet,level)=>sheet.act('slot',{level,delta:1});

test('temporary HP absorbs damage, Short Rest dice heal, and Long Rest restores all Hit Dice',()=>{
  const p=sheet('Fighter');
  const max=p.profile.maxHP;
  p.act('concentration',{value:'Bless'});
  p.act('temp',{value:5});
  p.act('damage',{value:11});
  assert.equal(p.state.hp,max-6);
  assert.equal(p.state.temp,0);
  assert.match(p.state.log.at(-1),/save DC 10/);
  p.act('hit-die',{value:2});
  assert.equal(p.state.hp,max-6+Math.max(1,2+p.profile.con));
  assert.equal(p.state.dice,1);
  p.act('exhaustion',{value:2});
  p.act('temp',{value:3});
  p.act('long-rest');
  assert.deepEqual([p.state.hp,p.state.temp,p.state.dice,p.state.exhaustion],[max,0,0,1]);
});

test('Fighter short rest restores one Second Wind and all Action Surge uses',()=>{
  const p=sheet('Fighter');
  spend(p,'second-wind');
  spend(p,'second-wind');
  spend(p,'surge');
  assert.throws(()=>spend(p,'second-wind'),/None remaining/);
  p.act('short-rest');
  assert.deepEqual([p.state.counters['second-wind'],p.state.counters.surge],[1,0]);
  p.act('long-rest');
  assert.equal(p.state.counters['second-wind'],0);
});

test('Warlock pact slots refill on Short Rest, Magical Cunning only on Long Rest',()=>{
  const p=sheet('Warlock');
  slot(p,2);
  slot(p,2);
  p.act('magical-cunning');
  assert.deepEqual([p.state.slots[2],p.state.counters.cunning],[1,1]);
  assert.throws(()=>p.act('magical-cunning'),/available use/);
  p.act('short-rest');
  assert.deepEqual([p.state.slots[2],p.state.counters.cunning],[0,1]);
  p.act('long-rest');
  assert.equal(p.state.counters.cunning,0);
});

test('Wizard short rest leaves ordinary slots spent and Arcane Recovery is bounded per long rest',()=>{
  const p=sheet('Wizard');
  slot(p,1);
  slot(p,2);
  p.act('short-rest');
  assert.deepEqual(p.state.slots,{1:1,2:1});
  assert.throws(()=>p.act('short-rest',{recover:{1:1,2:1}}),/combined slot levels/);
  p.act('short-rest',{recover:{2:1}});
  assert.deepEqual(p.state.slots,{1:1,2:0});
  assert.throws(()=>p.act('short-rest',{recover:{1:1}}),/available use/);
});

test('dead or downed characters cannot rest and death natural 20 restores HP',()=>{
  const p=sheet('Rogue');
  p.act('damage',{value:p.profile.maxHP});
  assert.equal(p.state.hp,0);
  assert.throws(()=>p.act('short-rest'),/at least 1 HP/);
  p.act('death-save',{value:1});
  assert.equal(p.state.failures,2);
  p.act('death-save',{value:20});
  assert.deepEqual([p.state.hp,p.state.failures],[1,0]);
  p.act('exhaustion',{value:6});
  assert.deepEqual([p.state.dead,p.state.hp],[true,0]);
  assert.throws(()=>p.act('heal',{value:1}),/dead/);
});

test('play backup preserves expended resources, HP and log alongside the character',async()=>{
  const p=sheet('Wizard');
  slot(p,2);
  p.act('damage',{value:3});
  const backup=await makePlayExport(p.draft,p.state);
  assert.deepEqual(await readSavedCharacterExport(JSON.stringify(backup)),{draft:p.draft,play:p.state});
  assert.deepEqual(await readSavedCharacterExport(JSON.stringify(await makeExport(p.draft))),{draft:p.draft});
  assert.throws(()=>validatePlay(p.profile,{...p.state,hp:p.profile.maxHP+50}),/invalid health/);
  backup.payload.play.hp=1;
  await assert.rejects(readSavedCharacterExport(JSON.stringify(backup)),/integrity/);
});
