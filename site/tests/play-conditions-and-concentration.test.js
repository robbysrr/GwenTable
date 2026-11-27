import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {playConditions,hasIncapacitatingCondition,concentrationSaveDC,playProfile,
  normalizePlay,advancePlay,validatePlay,reconcilePlay} from '../dist/lib/play.js';
import {makePlayExport,readSavedCharacterExport,makeRosterExport,readRosterExport} from '../dist/lib/portable.js';

const setup=()=>{
  const draft=templateCharacter('Fighter');
  const profile=playProfile(draft);
  let state=normalizePlay(profile);
  const act=(type,more={})=>state=advancePlay(profile,state,{type,...more});
  return {draft,profile,act,get state(){return state;}};
};

test('14 toggleable SRD 5.2.1 conditions, with Exhaustion tracked numerically',()=>{
  assert.equal(playConditions.length,14);
  assert.ok(!playConditions.includes('Exhaustion'));
  assert.equal(new Set(playConditions).size,14);
  assert.deepEqual(setup().state.conditions,[]);
});

test('conditions can be added and removed without modifying HP or resetting resources',()=>{
  const p=setup();p.act('counter',{id:'second-wind',delta:1});
  const before=p.state.hp;
  p.act('condition',{name:'Poisoned',active:true});
  p.act('condition',{name:'Prone',active:true});
  assert.deepEqual(p.state.conditions,['Poisoned','Prone']);
  assert.equal(p.state.hp,before);
  assert.equal(p.state.counters['second-wind'],1);
  p.act('condition',{name:'Poisoned',active:false});
  assert.deepEqual(p.state.conditions,['Prone']);
});

test('invalid, duplicate and nonsensical condition actions are rejected',()=>{
  const p=setup();
  for(const name of ['Exhaustion','CustomCondition','constructor',undefined])
    assert.throws(()=>p.act('condition',{name,active:true}),/valid SRD condition/);
  assert.throws(()=>p.act('condition',{name:'Blinded',active:'true'}),/valid SRD condition/);
  assert.throws(()=>p.act('condition',{name:'Blinded',active:false}),/already in/);
  p.act('condition',{name:'Blinded',active:true});
  assert.throws(()=>p.act('condition',{name:'Blinded',active:true}),/already in/);
});

for(const name of ['Incapacitated','Paralyzed','Petrified','Stunned','Unconscious']){
  test(`${name} immediately ends concentration and blocks action-like operations`,()=>{
    const p=setup();
    p.act('concentration',{value:'Bless'});
    p.act('damage',{value:2});
    p.act('condition',{name,active:true});
    assert.equal(p.state.focus,'');
    assert.deepEqual(p.state.concentrationChecks,[]);
    assert.ok(hasIncapacitatingCondition(p.state.conditions));
    assert.throws(()=>p.act('concentration',{value:'Shield of Faith'}),/Incapacitated/);
    assert.throws(()=>p.act('short-rest'),/Incapacitated/);
    p.act('heal',{value:1});
    p.act('condition',{name,active:false});
    assert.equal(p.state.focus,'','removing a condition cannot restore a lost spell');
    p.act('concentration',{value:'Bless'});
    assert.equal(p.state.focus,'Bless');
  });
}

test('non-incapacitating conditions do not silently remove concentration',()=>{
  const p=setup();p.act('concentration',{value:'Hex'});
  for(const name of ['Charmed','Poisoned','Restrained','Grappled'])p.act('condition',{name,active:true});
  assert.equal(p.state.focus,'Hex');
});

test('concentration DC rounds half damage down with a maximum of 30',()=>{
  assert.deepEqual([1,19,20,21,60,100].map(concentrationSaveDC),[10,10,10,10,30,30]);
});

test('damage creates one pending Constitution save per hit even with temporary HP',()=>{
  const p=setup();p.act('temp',{value:200});p.act('concentration',{value:'Bless'});
  p.act('damage',{value:11});p.act('damage',{value:60});
  assert.deepEqual(p.state.concentrationChecks,[{damage:11,dc:10},{damage:60,dc:30}]);
  assert.equal(p.state.focus,'Bless');
  assert.match(p.state.log.at(-1),/Concentration save DC 30/);
});

test('successful saves resolve one by one; a failure ends concentration and discards all pending',()=>{
  const p=setup();p.act('temp',{value:200});p.act('concentration',{value:'Bless'});
  p.act('damage',{value:4});p.act('damage',{value:40});
  p.act('concentration-check',{success:true});
  assert.deepEqual(p.state.concentrationChecks,[{damage:40,dc:20}]);
  p.act('concentration-check',{success:false});
  assert.equal(p.state.focus,'');
  assert.deepEqual(p.state.concentrationChecks,[]);
  assert.throws(()=>p.act('concentration-check',{success:true}),/no pending/);
});

test('resolving pending saves requires a boolean outcome and a pending check',()=>{
  const p=setup();p.act('concentration',{value:'Bless'});
  assert.throws(()=>p.act('concentration-check',{success:true}),/no pending/);
  p.act('damage',{value:3});
  for(const success of ['yes',1,null])
    assert.throws(()=>p.act('concentration-check',{success}),/no pending/);
  assert.equal(p.state.concentrationChecks.length,1);
});

test('replacing or ending concentration drops old pending saves',()=>{
  const p=setup();p.act('concentration',{value:'Bless'});
  p.act('damage',{value:1});p.act('concentration',{value:'Fly'});
  assert.equal(p.state.focus,'Fly');assert.deepEqual(p.state.concentrationChecks,[]);
  p.act('damage',{value:1});p.act('concentration',{value:''});
  assert.deepEqual(p.state.concentrationChecks,[]);
});

test('reaching 0 HP, death, and Exhaustion 6 remove concentration and pending checks',()=>{
  const p=setup();p.act('concentration',{value:'Bless'});
  p.act('damage',{value:1});p.act('damage',{value:p.state.hp});
  assert.equal(p.state.hp,0);assert.equal(p.state.focus,'');assert.deepEqual(p.state.concentrationChecks,[]);
  const q=setup();q.act('concentration',{value:'Fly'});
  q.act('damage',{value:1});q.act('exhaustion',{value:6});
  assert.equal(q.state.dead,true);assert.deepEqual(q.state.concentrationChecks,[]);
});

test('legacy play data without new optional fields remains valid, but malformed new fields are rejected',()=>{
  const p=setup();
  const {conditions,concentrationChecks,...legacy}=p.state;
  assert.deepEqual(validatePlay(p.profile,legacy),p.state);
  assert.throws(()=>validatePlay(p.profile,{...p.state,conditions:['Unknown']}),/invalid health/);
  assert.throws(()=>validatePlay(p.profile,{...p.state,conditions:['Prone','Prone']}),/invalid health/);
  assert.throws(()=>validatePlay(p.profile,{...p.state,concentrationChecks:[{dc:7,damage:3}]}),/invalid health/);
});

test('reconciled character levels retain valid conditions and concentration state',()=>{
  const p=setup();p.act('condition',{name:'Prone',active:true});
  p.act('concentration',{value:'Bless'});p.act('damage',{value:4});
  const advanced=templateCharacter('Fighter');
  advanced.level=4;
  const next=reconcilePlay(p.profile,playProfile(advanced),p.state);
  assert.deepEqual(next.conditions,['Prone']);
  assert.deepEqual(next.concentrationChecks,[{dc:10,damage:4}]);
});

test('single and roster JSON backups round-trip pending checks, conditions, and old-format payloads',async()=>{
  const p=setup();p.act('concentration',{value:'Bless'});p.act('damage',{value:2});
  p.act('condition',{name:'Poisoned',active:true});
  const file=await makePlayExport(p.draft,p.state);
  const saved=await readSavedCharacterExport(JSON.stringify(file));
  assert.deepEqual(saved.play,p.state);
  const roster=await makeRosterExport([{draft:p.draft,play:p.state}]);
  const imported=await readRosterExport(JSON.stringify(roster));
  assert.deepEqual(imported[0].play,p.state);
});

test('Play Sheet exposes pressed-state condition controls and explicit save outcomes',()=>{
  const text=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
  assert.match(text,/aria-pressed=/);
  assert.match(text,/data-play-action=\\?"concentration-save/);
  assert.match(text,/data-play-action=\\?"condition/);
  assert.match(text,/type:'concentration-check'/);
  assert.match(text,/type:'condition'/);
});
