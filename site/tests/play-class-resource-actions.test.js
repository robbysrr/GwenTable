import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay,validatePlay,reconcilePlay} from '../dist/lib/play.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {messages} from '../dist/locale-copy.js';

const setup=(className,level)=>{
  const draft={...templateCharacter(className),...(level?{level}:{})};
  const profile=playProfile(draft);
  let state=normalizePlay(profile);
  const act=(type,other={})=>state=advancePlay(profile,state,{type,...other});
  return {draft,profile,act,get state(){return state;},set state(next){state=next;}};
};
const wound=(p,amount=9)=>p.act('damage',{value:amount});

test('Monk initiative recovery restores all spent Focus Points and heals from the submitted Martial Arts die',()=>{
  const monk=setup('Monk');
  assert.ok(monk.profile.d.level>=2);
  monk.act('counter',{id:'focus-points',delta:1});
  wound(monk,8);
  const hp=monk.state.hp;
  monk.act('combat-start',{initiative:12,metabolismRoll:3});
  assert.equal(monk.state.counters['focus-points'],0);
  assert.equal(monk.state.counters.metabolism,1);
  assert.equal(monk.state.hp,Math.min(monk.profile.maxHP,hp+monk.profile.d.level+3));
  assert.equal(monk.state.combat.initiative,12);
  assert.ok(monk.state.log.some(item=>item.includes('Uncanny Metabolism')));
  assert.deepEqual(validatePlay(monk.profile,monk.state),monk.state);
});

test('Monk may decline the optional initiation feature and use it in a later encounter',()=>{
  const monk=setup('Monk');
  monk.act('counter',{id:'focus-points',delta:1});
  monk.act('combat-start',{initiative:4});
  assert.equal(monk.state.counters.metabolism,0);
  assert.equal(monk.state.counters['focus-points'],1);
  monk.act('combat-end');
  monk.act('combat-start',{initiative:7,metabolismRoll:1});
  assert.equal(monk.state.counters.metabolism,1);
  monk.act('combat-end');
  assert.throws(()=>monk.act('combat-start',{initiative:3,metabolismRoll:1}),/already been used/);
  monk.act('long-rest');
  monk.act('combat-start',{initiative:3,metabolismRoll:1});
  assert.equal(monk.state.counters.metabolism,1);
});

test('Uncanny Metabolism rejects non-monks, invalid dice and a second use without changing the prior state',()=>{
  const monk=setup('Monk');
  const earlier=structuredClone(monk.state);
  for(const dieRoll of [0,-1,7,1.5,'3',null,NaN]) {
    assert.throws(()=>monk.act('combat-start',{initiative:10,metabolismRoll:dieRoll}),/valid Martial Arts die/);
    assert.deepEqual(monk.state,earlier);
  }
  const fighter=setup('Fighter');
  assert.throws(()=>fighter.act('combat-start',{initiative:10,metabolismRoll:2}),/requires a Monk/);
  assert.equal(fighter.state.combat.active,false);
});

test('higher-level Monks use a d8 for Uncanny Metabolism at level 5',()=>{
  const monk=setup('Monk',5);
  assert.equal(monk.profile.martialDie,8);
  monk.act('combat-start',{initiative:12,metabolismRoll:8});
  assert.equal(monk.state.counters.metabolism,1);
  assert.ok(monk.state.log.some(line=>line.includes('d8 result 8')));
  assert.throws(()=>advancePlay(monk.profile,normalizePlay(monk.profile),{type:'combat-start',initiative:12,metabolismRoll:9}),/Martial Arts die/);
});

test('Second Wind heals from a d10 result, expends one use, and marks the Bonus Action during a turn',()=>{
  const fighter=setup('Fighter');
  wound(fighter,12);
  const hp=fighter.state.hp;
  fighter.act('combat-start',{initiative:15});
  fighter.act('combat-turn',{stage:'start'});
  fighter.act('second-wind',{roll:7});
  assert.equal(fighter.state.hp,Math.min(fighter.profile.maxHP,hp+7+fighter.profile.d.level));
  assert.equal(fighter.state.counters['second-wind'],1);
  assert.equal(fighter.state.combat.bonusUsed,true);
  assert.throws(()=>fighter.act('second-wind',{roll:4}),/Bonus Action/);
  assert.deepEqual(validatePlay(fighter.profile,fighter.state),fighter.state);
});

test('Second Wind cannot be used outside your turn during combat, or while incapacitated',()=>{
  const fighter=setup('Fighter');
  fighter.act('combat-start',{initiative:3});
  assert.throws(()=>fighter.act('second-wind',{roll:7}),/on your turn/);
  fighter.act('combat-turn',{stage:'start'});
  fighter.act('condition',{name:'Stunned',active:true});
  assert.throws(()=>fighter.act('second-wind',{roll:7}),/Incapacitated/);
  assert.equal(fighter.state.counters['second-wind'],0);
});

test('Second Wind can be used out of combat without falsely starting a turn',()=>{
  const fighter=setup('Fighter');
  wound(fighter,9);
  fighter.act('second-wind',{roll:1});
  assert.equal(fighter.state.counters['second-wind'],1);
  assert.equal(fighter.state.combat.active,false);
});

test('Second Wind validates die result, class and resource capacity',()=>{
  const fighter=setup('Fighter');
  const before=structuredClone(fighter.state);
  for(const roll of [0,11,1.2,-9,'3',null]) {
    assert.throws(()=>fighter.act('second-wind',{roll}),/valid d10/);
    assert.deepEqual(fighter.state,before);
  }
  assert.throws(()=>setup('Monk').act('second-wind',{roll:5}),/only available to Fighters/);
  const uses=fighter.profile.resources.find(r=>r.id==='second-wind').max;
  for(let i=0;i<uses;i++)fighter.act('counter',{id:'second-wind',delta:1});
  assert.throws(()=>fighter.act('second-wind',{roll:2}),/No Second Wind uses/);
});

test('Short Rest restores one expended Second Wind use and Long Rest restores all',()=>{
  const fighter=setup('Fighter');
  fighter.act('second-wind',{roll:1});
  fighter.act('second-wind',{roll:1});
  const uses=fighter.profile.resources.find(r=>r.id==='second-wind').max;
  assert.equal(fighter.state.counters['second-wind'],uses);
  fighter.act('short-rest');
  assert.equal(fighter.state.counters['second-wind'],uses-1);
  fighter.act('long-rest');
  assert.equal(fighter.state.counters['second-wind'],0);
});

test('Fighter level 5 or above shows tactical movement note but never moves automatically',()=>{
  const fighter=setup('Fighter',5);
  fighter.act('second-wind',{roll:5});
  assert.ok(fighter.state.log.some(line=>line.includes('Tactical Shift movement is resolved at the table')));
  assert.equal(fighter.state.combat.active,false);
});

test('previous Play and new class-action states survive backup, reconciliation and normalization',async()=>{
  const monk=setup('Monk');
  monk.act('combat-start',{initiative:14,metabolismRoll:4});
  const saved=await makePlayExport(monk.draft,monk.state);
  const restored=await readSavedCharacterExport(JSON.stringify(saved));
  assert.equal(restored.play.counters.metabolism,1);
  assert.deepEqual(restored.play.combat,monk.state.combat);
  assert.deepEqual(reconcilePlay(monk.profile,monk.profile,monk.state),monk.state);
  const old=normalizePlay(monk.profile,{hp:2});
  assert.equal(old.counters.metabolism,0);
});

test('pure-engine action results are suitable for one-step Play undo checkpoints',()=>{
  const fighter=setup('Fighter');
  const old=structuredClone(fighter.state);
  fighter.act('second-wind',{roll:4});
  assert.equal(fighter.state.counters['second-wind'],1);
  assert.equal(old.counters['second-wind'],0);
  const undone=normalizePlay(fighter.profile,old);
  assert.equal(undone.counters['second-wind'],0);
});

test('class-action controls remain translated, cached and in the Play Sheet',()=>{
  const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  for(const term of ['metabolism-roll','second-wind-roll','data-play-form="second-wind"'])assert.ok(ui.includes(term));
  for(const key of ['Use Uncanny Metabolism on Initiative','Second Wind d10 result','Use Second Wind'])assert.ok(messages[key]?.id);
  assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
});
