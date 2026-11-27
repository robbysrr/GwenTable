import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter} from '../dist/lib/character.js';
import {advancePlay,normalizePlay,playProfile,reconcilePlay,validatePlay} from '../dist/lib/play.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {messages} from '../dist/locale-copy.js';

function setup(cls,level) {
  const draft={...templateCharacter(cls),level};
  const profile=playProfile(draft);
  let state=normalizePlay(profile);
  const act=(type,params={})=>(state=advancePlay(profile,state,{type,...params}));
  const fail=(type,params,pattern)=>{
    const before=structuredClone(state);
    assert.throws(()=>act(type,params),pattern);
    assert.deepEqual(state,before,'rejected action must not write');
  };
  return {draft,profile,act,fail,get state(){return state;}};
}

test('Paladin Lay On Hands heals self and spends exactly the declared number of points',()=>{
  const p=setup('Paladin',5);
  p.act('damage',{value:15});
  const before=p.state.hp;
  p.act('lay-on-hands',{target:'self',effect:'heal',points:7});
  assert.equal(p.state.hp,Math.min(p.profile.maxHP,before+7));
  assert.equal(p.state.counters['lay-on-hands'],7);
  assert.deepEqual(validatePlay(p.profile,p.state),p.state);
});

test('Paladin ally healing records resource spending without fabricating ally HP',()=>{
  const p=setup('Paladin',2);
  const old=p.state.hp;
  p.act('lay-on-hands',{target:'other',effect:'heal',points:9});
  assert.equal(p.state.hp,old);
  assert.equal(p.state.counters['lay-on-hands'],9);
  assert.match(p.state.log.at(-1),/apply HP on their sheet/i);
  p.fail('lay-on-hands',{target:'other',effect:'heal',points:2},/Not enough/);
});

test('Paladin cleanses Poisoned at a fixed five-point cost on self or ally',()=>{
  const p=setup('Paladin',3);
  p.act('condition',{name:'Poisoned',active:true});
  p.act('lay-on-hands',{target:'self',effect:'poison'});
  assert.equal(p.state.conditions.includes('Poisoned'),false);
  assert.equal(p.state.counters['lay-on-hands'],5);
  p.fail('lay-on-hands',{target:'self',effect:'poison'},/do not have the Poisoned/);
  p.act('lay-on-hands',{target:'other',effect:'poison'});
  assert.equal(p.state.counters['lay-on-hands'],10);
});

test('Lay On Hands consumes Bonus Action in encounter, blocks second use and outside-turn use',()=>{
  const p=setup('Paladin',2);
  p.act('combat-start',{initiative:7});
  p.fail('lay-on-hands',{target:'other',effect:'heal',points:1},/requires your turn/);
  p.act('combat-turn',{stage:'start'});
  p.act('lay-on-hands',{target:'other',effect:'heal',points:1});
  assert.equal(p.state.combat.bonusUsed,true);
  p.fail('lay-on-hands',{target:'other',effect:'heal',points:1},/Bonus Action/);
  p.act('combat-turn',{stage:'end'});
  p.act('combat-turn',{stage:'start'});
  p.act('lay-on-hands',{target:'other',effect:'heal',points:1});
  assert.equal(p.state.counters['lay-on-hands'],2);
});

test('Lay On Hands rejects invalid recipients, modes, amounts and other classes',()=>{
  const p=setup('Paladin',1);
  for(const params of [{target:'self',effect:'heal',points:0},{target:'self',effect:'heal',points:6},
    {target:'self',effect:'heal',points:1.5},{target:'anyone',effect:'heal',points:1},
    {target:'other',effect:'poisonX'},{target:'other',effect:'poison',points:100}]){
    if(params.effect==='poison'&&params.target==='other')continue; // fixed cost ignores any numeric input
    p.fail('lay-on-hands',params,/remain|Choose yourself/);
  }
  const fighter=setup('Fighter',2);
  fighter.fail('lay-on-hands',{target:'self',effect:'heal',points:1},/only available to Paladins/);
});

test('Lay On Hands short rest does not refill the pool; Long Rest does',()=>{
  const p=setup('Paladin',2);
  p.act('lay-on-hands',{target:'other',effect:'heal',points:4});
  p.act('short-rest');assert.equal(p.state.counters['lay-on-hands'],4);
  p.act('long-rest');assert.equal(p.state.counters['lay-on-hands'],0);
});

test('Druid Wild Shape consumes use, grants nonstacking temporary HP and tracks form',()=>{
  const p=setup('Druid',4);
  p.act('wild-shape',{form:'Wolf'});
  assert.deepEqual(p.state.shape,{active:true,form:'Wolf'});
  assert.equal(p.state.temp,4);
  assert.equal(p.state.counters['wild-shape'],1);
  p.act('temp',{value:12});
  p.act('wild-shape',{form:'Spider'});
  assert.equal(p.state.temp,12);
  assert.equal(p.state.counters['wild-shape'],2);
  assert.deepEqual(validatePlay(p.profile,p.state),p.state);
});

test('Druid cannot Wild Shape without available use, while incapacitated, or with invalid names',()=>{
  const p=setup('Druid',2);
  for(const form of ['', '   ', 'A'.repeat(61),null])p.fail('wild-shape',{form},/Beast form/);
  p.act('condition',{name:'Stunned',active:true});
  p.fail('wild-shape',{form:'Rat'},/Incapacitated/);
  p.act('condition',{name:'Stunned',active:false});
  p.act('wild-shape',{form:'Rat'});
  p.act('wild-shape',{form:'Spider'});
  p.fail('wild-shape',{form:'Wolf'},/No Wild Shape uses/);
  setup('Fighter',2).fail('wild-shape',{form:'Wolf'},/requires a Druid/);
});

test('Wild Shape obeys Bonus Action use, reversion cost and retention of temporary HP',()=>{
  const p=setup('Druid',6);
  p.act('combat-start',{initiative:10});
  p.fail('wild-shape',{form:'Wolf'},/requires your turn/);
  p.act('combat-turn',{stage:'start'});
  p.act('wild-shape',{form:'Wolf'});
  p.fail('wild-shape-end',{},/Bonus Action/);
  p.act('combat-turn',{stage:'end'});p.act('combat-turn',{stage:'start'});
  p.act('wild-shape-end');
  assert.equal(p.state.shape.active,false);
  assert.equal(p.state.temp,6);
  p.fail('wild-shape-end',{},/No active Wild Shape/);
});

test('Incapacitation and HP zero immediately dismiss Wild Shape without reviving a form',()=>{
  for(const condition of ['Incapacitated','Stunned','Paralyzed']){
    const p=setup('Druid',4);p.act('wild-shape',{form:'Wolf'});
    p.act('condition',{name:condition,active:true});
    assert.deepEqual(p.state.shape,{active:false,form:''});
    p.act('condition',{name:condition,active:false});
    assert.equal(p.state.shape.active,false);
  }
  const p=setup('Druid',4);p.act('wild-shape',{form:'Wolf'});
  p.act('damage',{value:999});
  assert.equal(p.state.shape.active,false);
});

test('Druid short rest restores one Wild Shape use, Long Rest restores all',()=>{
  const p=setup('Druid',6);
  p.act('wild-shape',{form:'Wolf'});
  p.act('wild-shape',{form:'Wolf'});
  p.act('wild-shape',{form:'Wolf'});
  assert.equal(p.state.counters['wild-shape'],3);
  p.act('short-rest');assert.equal(p.state.counters['wild-shape'],2);
  p.act('long-rest');assert.equal(p.state.counters['wild-shape'],0);
});

test('Monk free and empowered techniques correctly spend Bonus Action and Focus',()=>{
  const monk=setup('Monk',5);
  monk.act('combat-start',{initiative:9});monk.act('combat-turn',{stage:'start'});
  monk.act('monk-technique',{technique:'patient',empowered:false});
  assert.equal(monk.state.counters['focus-points'],0);
  assert.equal(monk.state.combat.bonusUsed,true);
  monk.fail('monk-technique',{technique:'flurry',empowered:true},/Bonus Action/);
  monk.act('combat-turn',{stage:'end'});monk.act('combat-turn',{stage:'start'});
  monk.act('monk-technique',{technique:'step',empowered:true});
  assert.equal(monk.state.counters['focus-points'],1);
  monk.act('combat-turn',{stage:'end'});monk.act('combat-turn',{stage:'start'});
  monk.act('monk-technique',{technique:'flurry',empowered:true});
  assert.equal(monk.state.counters['focus-points'],2);
  assert.match(monk.state.log.at(-1),/2 Unarmed Strikes/);
});

test('Monk level 10 heightened Flurry has 3 strikes, enhanced Patient Defense gains 2 Martial dice temp HP',()=>{
  const monk=setup('Monk',10);
  monk.act('monk-technique',{technique:'flurry',empowered:true});
  assert.match(monk.state.log.at(-1),/3 Unarmed Strikes/);
  assert.equal(monk.profile.martialDie,8);
  monk.act('monk-technique',{technique:'patient',empowered:true,tempRoll:14});
  assert.equal(monk.state.temp,14);
  monk.act('temp',{value:20});
  monk.act('monk-technique',{technique:'patient',empowered:true,tempRoll:5});
  assert.equal(monk.state.temp,20);
  monk.fail('monk-technique',{technique:'patient',empowered:true,tempRoll:1},/two Martial Arts dice/);
  monk.fail('monk-technique',{technique:'patient',empowered:true,tempRoll:17},/two Martial Arts dice/);
});

test('Monk Martial Arts dice increase correctly to d12 at level 17',()=>{
  assert.deepEqual([2,5,11,16,17,20].map(level=>setup('Monk',level).profile.martialDie),[6,8,10,10,12,12]);
  const p=setup('Monk',17);
  p.act('monk-technique',{technique:'patient',empowered:true,tempRoll:24});
  assert.equal(p.state.temp,24);
  p.act('combat-start',{initiative:10,metabolismRoll:12});
  assert.equal(p.state.counters.metabolism,1);
});

test('Monk invalid options and depleted Focus cannot forge a successful spend',()=>{
  const p=setup('Monk',2);
  p.fail('monk-technique',{technique:'__proto__',empowered:true},/valid Monk Focus/);
  p.fail('monk-technique',{technique:'step',empowered:'true'},/valid Monk Focus/);
  p.fail('monk-technique',{technique:'flurry',empowered:false},/costs 1 Focus/);
  p.fail('monk-technique',{technique:'step',empowered:false,tempRoll:3},/does not roll temporary HP/);
  p.act('monk-technique',{technique:'flurry',empowered:true});
  p.act('monk-technique',{technique:'flurry',empowered:true});
  p.fail('monk-technique',{technique:'flurry',empowered:true},/No Focus Points/);
  p.act('short-rest');assert.equal(p.state.counters['focus-points'],0);
  p.act('monk-technique',{technique:'patient',empowered:false});
  assert.equal(p.state.counters['focus-points'],0);
});

test('Legacy Play backups, strict shape validation, advancement and individual JSON round-trip',async()=>{
  const p=setup('Druid',4);
  assert.deepEqual(p.state.shape,{active:false,form:''});
  const legacy=structuredClone(p.state);delete legacy.shape;
  assert.deepEqual(validatePlay(p.profile,legacy).shape,{active:false,form:''});
  p.act('wild-shape',{form:'Wolf'});
  for(const invalid of [null,{}, {active:true,form:''},{active:true,form:'Wolf',unsafe:true},
    {active:'yes',form:'Wolf'},{active:true,form:'A'.repeat(61)}]){
    assert.throws(()=>validatePlay(p.profile,{...p.state,shape:invalid}),/invalid health or resources/);
  }
  const valid=setup('Druid',3);valid.act('wild-shape',{form:'Wolf'});
  const round=await readSavedCharacterExport(JSON.stringify(await makePlayExport(valid.draft,valid.state)));
  assert.deepEqual(round.play.shape,valid.state.shape);
  const next=reconcilePlay(p.profile,p.profile,p.state);
  assert.deepEqual(next.shape,p.state.shape);
  assert.equal(normalizePlay(setup('Fighter',4).profile,p.state).shape.active,false);
});

test('UI exposes localized player actions and accessible native form controls',()=>{
  const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
  for(const key of ['lay-on-hands','wild-shape','wild-shape-end','monk-technique','monk-patient-roll'])
    assert.match(ui,new RegExp(key));
  for(const key of ['Use Lay On Hands','Another creature','Known Beast form (DM approved)',
    'Use Wild Shape','Monk Focus techniques','Enhanced Patient Defense (1 Focus)',
    'Techniques spend your Bonus Action. Resolve attacks, movement, Dodge and jump effects at the table.'])
    assert.ok(messages[key]?.id,'missing Indonesian label: '+key);
  assert.match(ui,/maxlength="60"/);
  assert.match(ui,/play-wild-shape-known/);
  assert.match(ui, /esc\(name\)/);
});

test('Druid Wild Shape retains concentration on valid entry and does not reset on healing',()=>{
  const p=setup('Druid',3);
  p.act('concentration',{value:'Entangle'});
  p.act('wild-shape',{form:'  Wolf  '});
  assert.equal(p.state.shape.form,'Wolf');
  assert.equal(p.state.focus,'Entangle');
  p.act('heal',{value:2});
  assert.equal(p.state.shape.active,true);
  assert.equal(p.state.focus,'Entangle');
});

test('Paladin poisoned removal respects the pool limit and manual ally effects',()=>{
  const p=setup('Paladin',3);
  p.act('lay-on-hands',{target:'other',effect:'poison'});
  assert.equal(p.state.counters['lay-on-hands'],5);
  p.act('lay-on-hands',{target:'other',effect:'heal',points:6});
  p.fail('lay-on-hands',{target:'other',effect:'poison'},/Not enough/);
  assert.equal(p.state.counters['lay-on-hands'],11);
});

test('same saved-action snapshot can be restored using one-step Undo',()=>{
  const p=setup('Druid',3);
  const before=structuredClone(p.state);
  p.act('wild-shape',{form:'Wolf'});
  assert.equal(p.state.shape.active,true);
  const undo=normalizePlay(p.profile,before);
  assert.equal(undo.shape.active,false);
  assert.equal(undo.counters['wild-shape'],0);
  assert.equal(p.state.shape.active,true);
});
