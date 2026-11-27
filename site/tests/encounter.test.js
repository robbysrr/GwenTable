import test from 'node:test';
import assert from 'node:assert/strict';
import {creatureIndex} from '../dist/lib/creatures.js';
import {createActor, getCreature, encounterBudget, initiativeOrder, rolledInitiative, buildEncounter, appendEncounter} from '../dist/lib/encounter.js';
import {makeEncounterExport, readEncounterExport} from '../dist/lib/portable.js';

const makePC=(id='pc',level=3,maxHP=20)=>createActor({id,name:id,side:'pc',level,maxHP,ac:14,initBonus:2});
const makeFoe=(id='wolf',group=null)=>{
  const c=getCreature('wolf');
  return createActor({id,name:id,side:'foe',maxHP:c.hp,ac:c.ac,initBonus:c.initBonus,passiveInitiative:c.passiveInitiative,xp:c.xp,creatureId:'wolf',group});
};
const initial=(...actors)=>[{type:'brief',name:'The Road',objective:'Drive the pack off',terrain:'Road and ditch',rewards:'Paid on return'},
  {type:'add',actors}];
const withCombat=(...actors)=>[...initial(...actors),{type:'initiative',entries:actors.map((a,i)=>[a.id,14-i])},{type:'start'}];
const hp=(type,id,value,critical=false)=>type==='damage'?{type,id,value,critical}:{type,id,value};

test('SRD catalogue contains 330 source-linked stat blocks and distinct lair XP',()=>{
  assert.equal(Object.keys(creatureIndex).length,330);
  assert.deepEqual(getCreature('wolf'),{name:'Wolf',page:364,ac:12,hp:11,initBonus:2,passiveInitiative:12,cr:'1/4',xp:50,lairXP:undefined});
  assert.equal(getCreature('goblin-warrior').xp,50);
  assert.equal(getCreature('ancient-red-dragon').lairXP,75000);
  assert.equal(getCreature('constructor'),null);
  assert.ok(Object.values(creatureIndex).every(([name,page,ac,hp,mod,score])=>name&&page>=258&&page<=364&&ac>=0&&hp>0&&Number.isInteger(mod)&&Number.isInteger(score)));
  assert.equal(getCreature('gray-ooze').passiveInitiative,13);
  assert.equal(getCreature('invisible-stalker').passiveInitiative,22);
});

test('mixed-level budgets sum the SRD thresholds without multiplying XP',()=>{
  assert.deepEqual(encounterBudget([makePC('zero',1),makePC('one',3),makePC('two',20),makeFoe('wolf-1'),makeFoe('wolf-2')]),
    {counts:[6600,13500,22500],partySize:3,spent:100});
  assert.deepEqual(encounterBudget(Array.from({length:5},(_,i)=>makePC('pc'+i))).counts,[750,1125,2000]);
});

test('group rolls, tied order, and round rollover are deterministic',()=>{
  const pc={...makePC(),initAdvantage:true};
  const wolf1=makeFoe('wolf-1','pack'), wolf2=makeFoe('wolf-2','pack');
  const dice=[0.0,0.7,0.3];
  assert.deepEqual(rolledInitiative([pc,wolf1,wolf2],()=>dice.shift()),[17,9,9]);
  let events=initial(pc,wolf1,wolf2);
  assert.throws(()=>appendEncounter(events,{type:'start'}),/Set initiative/);
  events=appendEncounter(events,{type:'initiative',entries:[['pc',17],['wolf-1',9],['wolf-2',9]]});
  events=appendEncounter(events,{type:'tie',id:'wolf-2',direction:-1});
  assert.deepEqual(initiativeOrder(buildEncounter(events).actors).map(a=>a.id),['pc','wolf-2','wolf-1']);
  events.push({type:'start'},{type:'next'},{type:'next'},{type:'next'});
  assert.equal(buildEncounter(events).round,2);
  assert.equal(buildEncounter(events).active,'pc');
  assert.equal(buildEncounter(events.slice(0,-1)).active,'wolf-1');
});

test('temp HP, concentration, death saves, stabilization and undo keep replay consistent',()=>{
  const events=withCombat(makePC(),makeFoe());
  const apply=event=>{events.push(event);return buildEncounter(events).actors[0];};
  apply({type:'focus',id:'pc',value:'Bless'});
  apply(hp('temp','pc',7));
  let pc=apply(hp('damage','pc',13));
  assert.deepEqual([pc.hp,pc.temp,pc.focus],[14,0,'Bless']);
  assert.match(buildEncounter(events).log.at(-1).text,/CON save DC 10/);
  assert.equal(apply({type:'condition',id:'pc',name:'Stunned'}).focus,'');
  assert.equal(apply(hp('damage','pc',14)).hp,0);
  assert.equal(apply({type:'deathSave',id:'pc',value:1}).failures,2);
  apply({type:'deathSave',id:'pc',value:12});
  apply({type:'deathSave',id:'pc',value:12});
  pc=apply({type:'deathSave',id:'pc',value:12});
  assert.deepEqual([pc.stable,pc.successes,pc.failures],[true,0,0]);
  apply(hp('temp','pc',3));
  pc=apply(hp('damage','pc',2,true));
  assert.deepEqual([pc.stable,pc.failures,pc.temp],[false,2,1]);
  pc=apply({type:'deathSave',id:'pc',value:20});
  assert.deepEqual([pc.hp,pc.temp,pc.failures],[1,1,0]);
  events.pop();
  assert.equal(buildEncounter(events).actors[0].hp,0);
  assert.equal(apply(hp('damage','pc',20)).dead,true);
  assert.throws(()=>appendEncounter(events,hp('heal','pc',20)),/living combatant/);
});

test('portable JSON replays the exact live and completed encounter and checks integrity',async()=>{
  const events=[...withCombat(makePC(),makeFoe()),hp('damage','wolf',6),
    {type:'note',value:'The wolf retreats toward the ravine.'},{type:'next'}];
  const live=await makeEncounterExport(events);
  const imported=await readEncounterExport(JSON.stringify(live));
  assert.deepEqual(imported,events);
  assert.deepEqual(buildEncounter(imported),buildEncounter(events));
  const finished=[...events,{type:'finish'}];
  assert.equal(buildEncounter(await readEncounterExport(JSON.stringify(await makeEncounterExport(finished)))).phase,'finished');
  assert.throws(()=>appendEncounter(finished,{type:'next'}),/Start combat/);
  const tampered=structuredClone(live);
  tampered.payload.events.at(-1).type='finish';
  await assert.rejects(readEncounterExport(JSON.stringify(tampered)),/integrity check/);
  await assert.rejects(makeEncounterExport([{type:'damage',id:'none',value:13,critical:false}]),/Combatant no longer exists/);
});
