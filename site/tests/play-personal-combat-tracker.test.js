import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {combatActionKeys,normalizeCombat,playProfile,normalizePlay,advancePlay,validatePlay,reconcilePlay} from '../dist/lib/play.js';
import {makePlayExport,readSavedCharacterExport,makeRosterExport,readRosterExport} from '../dist/lib/portable.js';
import {messages} from '../dist/locale-copy.js';
const setup=(className='Fighter')=>{
  const draft=templateCharacter(className),profile=playProfile(draft);
  let state=normalizePlay(profile);
  const act=(type,extra={})=>state=advancePlay(profile,state,{type,...extra});
  return {draft,profile,act,get state(){return state;}};
};

test('legacy Play records without combat state remain valid and unchanged in other fields',()=>{
  const p=setup();const {combat,...legacy}=p.state;
  assert.deepEqual(validatePlay(p.profile,legacy),p.state);
  assert.deepEqual(p.state.combat,normalizeCombat(undefined));
  assert.equal(p.state.combat.active,false);
});

test('initiative must be explicitly valid; only one encounter can be started',()=>{
  const p=setup();
  for(const initiative of [-101,201,1.5,'13',null,undefined])assert.throws(()=>p.act('combat-start',{initiative}),/Initiative score/);
  p.act('combat-start',{initiative:-4});
  assert.deepEqual([p.state.combat.active,p.state.combat.initiative,p.state.combat.turns],[true,-4,0]);
  assert.throws(()=>p.act('combat-start',{initiative:20}),/current encounter/);
});

test('reaction can be spent before own first turn, resets at next turn, and persists out of turn',()=>{
  const p=setup();p.act('combat-start',{initiative:19});
  p.act('combat-use',{key:'reactionUsed',used:true});
  assert.equal(p.state.combat.reactionUsed,true);
  assert.throws(()=>p.act('combat-use',{key:'actionUsed',used:true}),/own turn/);
  p.act('combat-turn',{stage:'start'});
  assert.equal(p.state.combat.reactionUsed,false);
  p.act('combat-use',{key:'reactionUsed',used:true});
  p.act('combat-turn',{stage:'end'});
  assert.equal(p.state.combat.reactionUsed,true);
  p.act('combat-turn',{stage:'start'});
  assert.deepEqual([p.state.combat.turns,p.state.combat.reactionUsed],[2,false]);
});

test('action and bonus action markers can be corrected but only on own turn',()=>{
  const p=setup();p.act('combat-start',{initiative:12});p.act('combat-turn',{stage:'start'});
  p.act('combat-use',{key:'actionUsed',used:true});p.act('combat-use',{key:'bonusUsed',used:true});
  assert.deepEqual([p.state.combat.actionUsed,p.state.combat.bonusUsed],[true,true]);
  assert.throws(()=>p.act('combat-use',{key:'actionUsed',used:true}),/already in/);
  p.act('combat-use',{key:'bonusUsed',used:false});
  assert.equal(p.state.combat.bonusUsed,false);
  p.act('combat-turn',{stage:'end'});
  assert.throws(()=>p.act('combat-use',{key:'actionUsed',used:false}),/own turn/);
  p.act('combat-turn',{stage:'start'});
  assert.deepEqual([p.state.combat.actionUsed,p.state.combat.bonusUsed,p.state.combat.reactionUsed],[false,false,false]);
});

test('invalid turn operations cannot silently mutate combat state',()=>{
  const p=setup();
  assert.throws(()=>p.act('combat-turn',{stage:'start'}),/encounter/);
  assert.throws(()=>p.act('combat-end'),/No encounter/);
  p.act('combat-start',{initiative:0});
  assert.throws(()=>p.act('combat-turn',{stage:'end'}),/no active turn/);
  p.act('combat-turn',{stage:'start'});
  assert.throws(()=>p.act('combat-turn',{stage:'start'}),/Finish the current turn/);
  for(const key of ['invalid','__proto__',null])assert.throws(()=>p.act('combat-use',{key,used:true}),/valid combat action/);
  assert.throws(()=>p.act('combat-use',{key:'actionUsed',used:1}),/valid combat action/);
  assert.throws(()=>p.act('combat-turn',{stage:'invalid'}),/Start Turn or End Turn/);
});

test('incapacitated and downed characters still have a turn, but cannot mark unavailable actions used',()=>{
  const p=setup();p.act('combat-start',{initiative:10});p.act('combat-turn',{stage:'start'});
  p.act('condition',{name:'Stunned',active:true});
  assert.throws(()=>p.act('combat-use',{key:'reactionUsed',used:true}),/Incapacitated/);
  assert.throws(()=>p.act('combat-use',{key:'actionUsed',used:true}),/Incapacitated/);
  p.act('combat-turn',{stage:'end'});p.act('combat-turn',{stage:'start'});
  p.act('condition',{name:'Stunned',active:false});
  p.act('damage',{value:p.profile.maxHP});
  assert.equal(p.state.hp,0);
  assert.throws(()=>p.act('combat-use',{key:'bonusUsed',used:true}),/at least 1 HP/);
  p.act('combat-turn',{stage:'end'});
});

test('rests require encounter closure, and end-combat does not erase health or resource history',()=>{
  const p=setup();p.act('counter',{id:'second-wind',delta:1});p.act('combat-start',{initiative:14});
  assert.throws(()=>p.act('short-rest'),/End the encounter/);
  assert.throws(()=>p.act('long-rest'),/End the encounter/);
  p.act('combat-turn',{stage:'start'});p.act('combat-use',{key:'actionUsed',used:true});
  p.act('combat-end');
  assert.deepEqual(p.state.combat,normalizeCombat(undefined));
  assert.equal(p.state.counters['second-wind'],1);
  assert.ok(p.state.log.some(entry=>entry.includes('Encounter ended')));
});

test('malformed and spoofed combat state is rejected by strict Play validation',()=>{
  const p=setup();p.act('combat-start',{initiative:10});p.act('combat-turn',{stage:'start'});
  for(const combat of [null,{}, {...p.state.combat,turns:-1}, {...p.state.combat,reactionUsed:'true'},
    {...p.state.combat,initiative:999}, {...p.state.combat,extra:'secret'}]){
    assert.throws(()=>validatePlay(p.profile,{...p.state,combat}),/invalid health or resources/);
  }
  assert.ok(validatePlay(p.profile,p.state).combat.active);
});

test('Play profile reconciliation keeps action markers and initiative during build-only edits',()=>{
  const p=setup();p.act('combat-start',{initiative:7});p.act('combat-turn',{stage:'start'});
  p.act('combat-use',{key:'bonusUsed',used:true});
  const next=reconcilePlay(p.profile,p.profile,p.state);
  assert.deepEqual(next.combat,p.state.combat);
});

test('private single-character backup round-trips combat state',async()=>{
  const p=setup();p.act('combat-start',{initiative:18});p.act('combat-turn',{stage:'start'});
  p.act('combat-use',{key:'reactionUsed',used:true});
  const backup=await makePlayExport(p.draft,p.state);
  const read=await readSavedCharacterExport(JSON.stringify(backup));
  assert.deepEqual(read.play.combat,p.state.combat);
});

test('max turn counter cannot overflow; action flags cannot be forged for idle combat',()=>{
  const p=setup();p.act('combat-start',{initiative:10});
  const max={...p.state,combat:{...p.state.combat,turns:9999,turnActive:false}};
  assert.throws(()=>advancePlay(p.profile,max,{type:'combat-turn',stage:'start'}),/limit/);
  assert.throws(()=>validatePlay(p.profile,{...p.state,combat:{...p.state.combat,active:false,actionUsed:true}}),/invalid health/);
});

test('user-facing Play controls are wired and bilingual',()=>{
  const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
  const engine=readFileSync(new URL('../dist/lib/play.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  for(const name of ['combat-start','combat-turn','combat-use','combat-end','initiative-roll'])assert.ok(ui.includes(name));
  for(const key of ['Personal combat tracker','Start my turn','Mark {label} used','End encounter'])assert.ok(messages[key]?.id);
  assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
  assert.match(engine,/case 'combat-turn'/);
  assert.deepEqual(combatActionKeys,['actionUsed','bonusUsed','reactionUsed']);
});
