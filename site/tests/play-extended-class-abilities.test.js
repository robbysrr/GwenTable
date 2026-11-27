import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter,build} from '../dist/lib/character.js';
import {advancePlay,normalizePlay,playProfile,reconcilePlay,validatePlay,smiteDice} from '../dist/lib/play.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {messages} from '../dist/locale-copy.js';

function setup(cls,level) {
  const draft=level>12?{...templateCharacter(cls),level}:build({...templateCharacter(cls),level}).draft;
  const profile=playProfile(draft);
  let state=normalizePlay(profile);
  const act=(type,params={})=>state=advancePlay(profile,state,{type,...params});
  const fail=(type,params,pattern)=>{
    const snapshot=structuredClone(state);
    assert.throws(()=>act(type,params),pattern);
    assert.deepEqual(state,snapshot,'rejected action cannot change saved state');
  };
  return {draft,profile,act,fail,get state(){return state;}};
}
const hit={confirmedHit:true,free:true,fiendOrUndead:false,damageRoll:9};

test('Paladin free Divine Smite uses Bonus Action and a once-per-Long-Rest casting',()=>{
  const p=setup('Paladin',2);
  assert.equal(p.state.counters['smite-free'],0);
  p.act('combat-start',{initiative:12});p.act('combat-turn',{stage:'start'});
  p.act('divine-smite',hit);
  assert.equal(p.state.counters['smite-free'],1);
  assert.equal(p.state.combat.bonusUsed,true);
  assert.ok(p.state.log.at(-1).includes('2d8'));
  p.fail('divine-smite',hit,/already been used/);
  p.act('combat-turn',{stage:'end'});p.act('combat-end');
  p.act('short-rest');assert.equal(p.state.counters['smite-free'],1);
  p.act('long-rest');assert.equal(p.state.counters['smite-free'],0);
});

test('Paladin level 3 slot Smite expends exactly one slot and grants extra die for Fiend/Undead',()=>{
  const p=setup('Paladin',3);
  assert.equal(smiteDice(1,true),3);
  p.act('divine-smite',{confirmedHit:true,free:false,level:1,fiendOrUndead:true,damageRoll:19});
  assert.equal(p.state.slots[1],1);
  assert.equal(p.state.counters['smite-free'],0);
  assert.match(p.state.log.at(-1),/3d8/);
  assert.deepEqual(validatePlay(p.profile,p.state),p.state);
});

test('Paladin smite accepts higher spell slots and checks dice sum boundaries',()=>{
  const p=setup('Paladin',9);
  assert.equal(smiteDice(3,true),5);
  p.act('divine-smite',{confirmedHit:true,free:false,level:3,fiendOrUndead:true,damageRoll:40});
  assert.equal(p.state.slots[3],1);
  p.fail('divine-smite',{confirmedHit:true,free:false,level:3,fiendOrUndead:true,damageRoll:41},/No spell slot|total of 5d8/);
});

test('Smite requires verified table hit and rejects invalid rolls, false free flags and other classes',()=>{
  const p=setup('Paladin',2);
  p.fail('divine-smite',{...hit,confirmedHit:false},/Confirm a melee weapon/);
  p.fail('divine-smite',{...hit,fiendOrUndead:'false'},/Choose the target category/);
  p.fail('divine-smite',{...hit,damageRoll:17},/2d8/);
  p.fail('divine-smite',{...hit,damageRoll:'9'},/2d8/);
  p.fail('divine-smite',{...hit,free:'true'},/Choose the target category/);
  setup('Fighter',3).fail('divine-smite',hit,/requires a Paladin/);
});

test('Paladin slot Smite needs a remaining slot and a free Bonus Action on your turn',()=>{
  const p=setup('Paladin',2);
  p.act('combat-start',{initiative:8});
  p.fail('divine-smite',hit,/requires your turn/);
  p.act('combat-turn',{stage:'start'});
  p.act('combat-use',{key:'bonusUsed',used:true});
  p.fail('divine-smite',hit,/Bonus Action/);
  p.act('combat-use',{key:'bonusUsed',used:false});
  const count=p.profile.slots.find(item=>item.level===1).count;
  for(let i=0;i<count;i++)p.act('slot',{level:1,delta:1});
  p.fail('divine-smite',{...hit,free:false,level:1},/No spell slot/);
  p.act('divine-smite',hit);assert.equal(p.state.slots[1],count);
});

test('Druid expends a spell slot to regain exactly one empty Wild Shape use',()=>{
  const p=setup('Druid',5);
  const max=p.profile.resources.find(pool=>pool.id==='wild-shape').max;
  for(let i=0;i<max;i++)p.act('counter',{id:'wild-shape',delta:1});
  p.act('wild-resurgence',{exchange:'slot-to-shape',level:1});
  assert.equal(p.state.counters['wild-shape'],max-1);
  assert.equal(p.state.slots[1],1);
  assert.match(p.state.log.at(-1),/Wild Resurgence/);
  assert.deepEqual(validatePlay(p.profile,p.state),p.state);
});

test('Wild Resurgence slot-to-shape only when no uses remain and once per own tracked turn',()=>{
  const p=setup('Druid',6);
  p.fail('wild-resurgence',{exchange:'slot-to-shape',level:1},/no Wild Shape uses/);
  const max=p.profile.resources.find(pool=>pool.id==='wild-shape').max;
  for(let i=0;i<max;i++)p.act('counter',{id:'wild-shape',delta:1});
  p.act('combat-start',{initiative:5});
  p.fail('wild-resurgence',{exchange:'slot-to-shape',level:1},/Start your turn/);
  p.act('combat-turn',{stage:'start'});
  p.act('wild-resurgence',{exchange:'slot-to-shape',level:1});
  p.act('counter',{id:'wild-shape',delta:1});
  p.fail('wild-resurgence',{exchange:'slot-to-shape',level:1},/already used this turn/);
  p.act('combat-turn',{stage:'end'});p.act('combat-turn',{stage:'start'});
  p.act('wild-resurgence',{exchange:'slot-to-shape',level:1});
  assert.equal(p.state.resurgence.lastTurn,2);
});

test('Druid Wild Resurgence converts one Wild Shape into expended level-one slot once per Long Rest',()=>{
  const p=setup('Druid',5);
  p.fail('wild-resurgence',{exchange:'shape-to-slot'},/no expended level 1/i);
  p.act('slot',{level:1,delta:1});
  p.act('wild-resurgence',{exchange:'shape-to-slot'});
  assert.equal(p.state.slots[1],0);
  assert.equal(p.state.counters['wild-shape'],1);
  assert.equal(p.state.counters['resurgence-slot'],1);
  p.act('slot',{level:1,delta:1});
  p.fail('wild-resurgence',{exchange:'shape-to-slot'},/already used/);
  p.act('long-rest');
  assert.equal(p.state.counters['resurgence-slot'],0);
});

test('Wild Resurgence rejects invalid levels/classes/insufficient slots without mutating state',()=>{
  const p=setup('Druid',5);
  for(let i=0;i<2;i++)p.act('counter',{id:'wild-shape',delta:1});
  p.fail('wild-resurgence',{exchange:'slot-to-shape',level:99},/unexpended spell slot/);
  p.fail('wild-resurgence',{exchange:'slot-to-shape',level:'1'},/unexpended spell slot/);
  p.fail('wild-resurgence',{exchange:'invalid',level:1},/Choose which/);
  setup('Druid',4).fail('wild-resurgence',{exchange:'shape-to-slot'},/level 5/);
  setup('Monk',5).fail('wild-resurgence',{exchange:'shape-to-slot'},/level 5/);
});

test('Level 3 Monk Deflect Attacks reduces eligible damage and uses Reaction',()=>{
  const p=setup('Monk',3);
  const hp=p.state.hp;
  p.act('combat-start',{initiative:11});
  p.act('monk-deflect',{confirmedHit:true,damage:15,damageType:'physical',roll:5,redirect:false});
  assert.equal(p.state.hp,hp-Math.max(0,15-(5+p.profile.s.mods[1]+3)));
  assert.equal(p.state.combat.reactionUsed,true);
  p.fail('monk-deflect',{confirmedHit:true,damage:10,damageType:'physical',roll:10,redirect:false},/already used/);
  assert.deepEqual(validatePlay(p.profile,p.state),p.state);
});

test('Monk Deflect cannot trigger from an unconfirmed hit or a saving-throw-only effect',()=>{
  const p=setup('Monk',3);
  p.fail('monk-deflect',{confirmedHit:false,damage:10,damageType:'physical',roll:5,redirect:false},/Confirm an attack roll/);
  assert.equal(p.state.hp,p.profile.maxHP);
});

test('Monk Deflect Energy at 13 allows other damage; level 12 rejects it',()=>{
  setup('Monk',12).fail('monk-deflect',{confirmedHit:true,damage:20,damageType:'other',roll:8,redirect:false},/Before level 13/);
  const p=setup('Monk',13);
  p.act('monk-deflect',{confirmedHit:true,damage:30,damageType:'other',roll:8,redirect:false});
  assert.match(p.state.log.at(-1),/Deflect Attacks/);
});

test('Fully prevented damage can redirect by spending Focus Point but cannot change target HP',()=>{
  const p=setup('Monk',5);
  const prior=p.state.hp;
  p.act('monk-deflect',{confirmedHit:true,damage:1,damageType:'physical',roll:10,redirect:true,redirectRoll:16});
  assert.equal(p.state.hp,prior);
  assert.equal(p.state.counters['focus-points'],1);
  assert.match(p.state.log.at(-1),/Dexterity save/);
  assert.ok(p.state.log.at(-1).includes('damage'));
});

test('Monk redirect requires zero remaining damage, Focus Points and valid dice',()=>{
  const p=setup('Monk',3);
  p.fail('monk-deflect',{confirmedHit:true,damage:999,damageType:'physical',roll:1,redirect:true,redirectRoll:2},/requires reducing/);
  p.fail('monk-deflect',{confirmedHit:true,damage:1,damageType:'physical',roll:10,redirect:true,redirectRoll:100},/Martial Arts dice/);
  for(let i=0;i<3;i++)p.act('counter',{id:'focus-points',delta:1});
  p.fail('monk-deflect',{confirmedHit:true,damage:1,damageType:'physical',roll:10,redirect:true,redirectRoll:2},/No Focus Points/);
  p.fail('monk-deflect',{confirmedHit:true,damage:3,damageType:'physical',roll:10,redirect:false,redirectRoll:2},/only used when redirecting/);
});

test('Deflected incoming damage generates only the adjusted Concentration saving throw',()=>{
  const p=setup('Monk',3);
  p.act('concentration',{value:'Shield of Faith'});
  p.act('monk-deflect',{confirmedHit:true,damage:28,damageType:'physical',roll:1,redirect:false});
  const taken=28-(1+p.profile.s.mods[1]+3);
  assert.equal(p.state.concentrationChecks.length,1);
  assert.equal(p.state.concentrationChecks[0].damage,taken);
  assert.equal(p.state.concentrationChecks[0].dc,Math.max(10,Math.floor(taken/2)));
});

test('Legacy Play records add new class-resource flags without losing older gameplay data',()=>{
  for(const cls of ['Paladin','Druid']){
    const p=setup(cls,5),legacy=structuredClone(p.state);
    delete legacy.resurgence;delete legacy.counters['smite-free'];delete legacy.counters['resurgence-slot'];
    const restored=validatePlay(p.profile,legacy);
    assert.equal(restored.counters[cls==='Paladin'?'smite-free':'resurgence-slot'],0);
    assert.deepEqual(restored.resurgence,{lastTurn:null});
  }
});

test('Class action snapshots round-trip in private backups, normalization and reconciliation',async()=>{
  const paladin=setup('Paladin',2);
  const before=structuredClone(paladin.state);
  paladin.act('divine-smite',hit);
  assert.equal(before.counters['smite-free'],0);
  const file=await makePlayExport(paladin.draft,paladin.state);
  const imported=await readSavedCharacterExport(JSON.stringify(file));
  assert.equal(imported.play.counters['smite-free'],1);
  assert.deepEqual(reconcilePlay(paladin.profile,paladin.profile,paladin.state),paladin.state);
  const druid=setup('Druid',5);
  druid.act('slot',{level:1,delta:1});
  druid.act('wild-resurgence',{exchange:'shape-to-slot'});
  const round=await readSavedCharacterExport(JSON.stringify(await makePlayExport(druid.draft,druid.state)));
  assert.equal(round.play.counters['resurgence-slot'],1);
});

test('New class actions cannot bypass dedicated one-use flags using generic counters',()=>{
  const p=setup('Paladin',2);
  p.fail('counter',{id:'smite-free',delta:1},/dedicated class action/);
  const d=setup('Druid',5);
  d.fail('counter',{id:'resurgence-slot',delta:1},/dedicated class action/);
});

test('Play UI, Indonesian translations and offline cache expose all new actions',()=>{
  const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  for(const term of ['data-play-form="divine-smite"','data-play-form="wild-resurgence"',
    'data-play-form="monk-deflect"','data-play-action="wild-resurgence-slot"'])
    assert.ok(ui.includes(term),term);
  for(const key of ['Divine Smite','Wild Resurgence','Deflect Attacks','Confirmed melee or Unarmed Strike hit',
    'Redirect if all damage is prevented (1 Focus Point)'])assert.ok(messages[key]?.id,key);
  assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
});
