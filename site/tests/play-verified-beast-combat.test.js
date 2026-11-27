import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {templateCharacter,build} from '../dist/lib/character.js';
import {playProfile,normalizePlay,advancePlay,validatePlay} from '../dist/lib/play.js';
import {beastQuickReference} from '../dist/lib/beast-reference.js';
import {curatedBeastNames,beastCombatProfile,planBeastAttack,resolveBeastAttack,beastAttackSummary} from '../dist/lib/beast-combat.js';
import {srdPages} from '../dist/lib/srd-reader-pages.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';
import {messages} from '../dist/locale-copy.js';

const wolfEntry={attack:'Bite',targetAC:12,confirmedHit:false,advantage:false,disadvantage:false,
 rolls:[15],damageRolls:[[3]]};
function fixture(level=8,form='Wolf'){
 const draft=build({...templateCharacter('Druid'),level}).draft;
 const profile=playProfile(draft);
 let state=normalizePlay(profile);
 const act=(action)=>{state=advancePlay(profile,state,action);return state;};
 act({type:'wild-shape',form});
 return {draft,profile,act,get state(){return state;}};
}
function fails(f,entry,pattern){
 const prior=structuredClone(f.state);
 assert.throws(()=>f.act({type:'beast-attack-assist',...entry}),pattern);
 assert.deepEqual(f.state,prior,'a rejected attack must not alter the snapshot');
}

test('eleven curated profiles match their SRD 5.2.1 Beast index and page headers',()=>{
 assert.equal(curatedBeastNames.length,11);
 for(const name of curatedBeastNames){
   const ref=beastQuickReference(name,8),data=beastCombatProfile(name,8);
   assert.ok(ref?.eligible,name+' must be a legal level-8 Land Druid form');
   assert.ok(data,name+' needs verified combat information');
   assert.equal(data.ac,ref.ac);assert.equal(data.hp,ref.hp);assert.equal(data.page,ref.page);
   assert.match(srdPages[data.page],new RegExp(name.replaceAll(' ','\\s+')+'\\n(?:Small|Medium|Large) Beast'));
   assert.ok(data.attacks.length>0);
   assert.ok(data.attacks.every(attack=>attack.components.length>0));
 }
});
test('curated Beast AC, HP, attack bonuses and dice remain source-traceable',()=>{
 for(const name of curatedBeastNames){
   const beast=beastCombatProfile(name,8),sourceText=srdPages[beast.page];
   const start=sourceText.indexOf(name+'\n');
   const block=(sourceText.slice(start,start+1500)+'\n'+(srdPages[beast.page+1]??'')).slice(0,2300);
   assert.ok(start>=0,name+' missing SRD header');
   assert.match(block,new RegExp('AC '+beast.ac+'\\b'),name+' AC differs from SRD');
   assert.match(block,new RegExp('HP '+beast.hp+'\\b'),name+' HP differs from SRD');
   for(const attack of beast.attacks){
     assert.ok(block.includes(attack.name+'.'),name+' '+attack.name+' missing attack');
     assert.ok(block.includes('Melee Attack Roll: '+(attack.bonus>=0?'+':'')+attack.bonus),
       name+' '+attack.name+' bonus differs from SRD');
     for(const component of attack.components)assert.ok(block.includes(component.dice),
       name+' '+attack.name+' missing '+component.dice+' in SRD block');
   }
 }
});
test('2024 Giant Owl and Giant Eagle are Celestials, never Wild Shape Beasts',()=>{
 assert.match(srdPages[352],/Giant Owl\nLarge Celestial/);
 assert.match(srdPages[350],/Giant Eagle\nLarge Celestial/);
 for(const name of ['Giant Owl','Giant Eagle']){
   assert.equal(beastQuickReference(name,8),null);
   assert.equal(beastCombatProfile(name,8),null);
 }
});
test('ineligible forms and unsupported custom forms cannot be rolled automatically',()=>{
 assert.equal(beastCombatProfile('Brown Bear',2),null);
 assert.equal(beastCombatProfile('Tiger',4),null);
 assert.ok(beastCombatProfile('Brown Bear',8));
 assert.ok(beastCombatProfile('Giant Spider',8));
 assert.equal(beastCombatProfile('Invented Mega Dragon',20),null);
 assert.equal(beastCombatProfile('<img onerror=alert(1)>',8),null);
});
test('Beast attack base bonus includes the exact SRD bonus and character Exhaustion',()=>{
 const p=fixture();
 const r=resolveBeastAttack(p.profile,p.state,wolfEntry);
 assert.equal(r.total,19);assert.equal(r.bonus,4);assert.equal(r.hit,true);
 p.act({type:'exhaustion',value:2});
 assert.equal(planBeastAttack(p.profile,p.state,wolfEntry).total,15);
});
test('normal Beast hit uses its own dice and leaves target and personal state untouched',()=>{
 const p=fixture();const before=structuredClone(p.state);
 const out=resolveBeastAttack(p.profile,p.state,wolfEntry);
 assert.equal(out.totalDamage,5);
 assert.deepEqual(out.damage,[{type:'Piercing',amount:5,rolls:[3]}]);
 p.act({type:'beast-attack-assist',...wolfEntry});
 assert.equal(p.state.hp,before.hp);
 assert.deepEqual(p.state.combat,before.combat);
 assert.deepEqual(p.state.counters,before.counters);
 assert.match(p.state.log.at(-1),/5 TOTAL damage/);
 assert.deepEqual(validatePlay(p.profile,p.state),p.state);
});
test('natural 1 misses and never requests Beast damage dice',()=>{
 const p=fixture();const r=resolveBeastAttack(p.profile,p.state,{...wolfEntry,rolls:[1],damageRolls:[]});
 assert.equal(r.hit,false);assert.equal(r.totalDamage,null);
 fails(p,{...wolfEntry,rolls:[1]},/Damage rolls/);
 fails(p,{...wolfEntry,rolls:[1],confirmedHit:true},/natural 1/);
});
test('natural 20 doubles ALL Beast damage dice but not flat modifiers',()=>{
 const p=fixture(8,'Giant Wolf Spider');
 const data={...wolfEntry,rolls:[20],attack:'Bite',damageRolls:[[2,2],[1,2,3,4]]};
 const plan=planBeastAttack(p.profile,p.state,data);
 assert.equal(plan.critical,true);assert.deepEqual(plan.components.map(c=>c.roll.count),[2,4]);
 const out=resolveBeastAttack(p.profile,p.state,data);
 assert.equal(out.totalDamage,17);
 assert.deepEqual(out.damage.map(c=>c.type),['Piercing','Poison']);
 assert.deepEqual(out.damage.map(c=>c.amount),[7,10]);
});
test('advantage and disadvantage use two dice and cancel cleanly',()=>{
 const p=fixture();
 assert.equal(planBeastAttack(p.profile,p.state,{...wolfEntry,rolls:[3,16],advantage:true}).natural,16);
 assert.equal(planBeastAttack(p.profile,p.state,{...wolfEntry,rolls:[3,16],disadvantage:true}).natural,3);
 assert.equal(planBeastAttack(p.profile,p.state,{...wolfEntry,rolls:[12],advantage:true,disadvantage:true}).natural,12);
 fails(p,{...wolfEntry,rolls:[3],advantage:true},/correct number/);
});
test('unknown AC requires explicit confirmation and cannot be used to guess damage',()=>{
 const p=fixture();
 const unconfirmed={...wolfEntry,targetAC:null,damageRolls:[]};
 assert.equal(resolveBeastAttack(p.profile,p.state,unconfirmed).hit,null);
 const confirmed={...wolfEntry,targetAC:null,confirmedHit:true};
 assert.equal(resolveBeastAttack(p.profile,p.state,confirmed).hit,true);
 fails(p,{...wolfEntry,targetAC:99,confirmedHit:true},/conflicts/);
});
test('wrong beast, wrong attack, and missing Wild Shape all fail without state changes',()=>{
 const p=fixture();
 fails(p,{...wolfEntry,attack:'Flamethrower'},/listed Beast attack/);
 fails(p,{...wolfEntry,attack:0},/Choose a Beast attack/);
 p.act({type:'wild-shape-end'});
 fails(p,wolfEntry,/Enter Wild Shape/);
 const fighter=playProfile(templateCharacter('Fighter'));
 assert.throws(()=>resolveBeastAttack(fighter,normalizePlay(fighter),wolfEntry),/Enter Wild Shape/);
});
test('multiple SRD damage components are not confused with extra attacks',()=>{
 const p=fixture(8,'Giant Venomous Snake');
 const out=resolveBeastAttack(p.profile,p.state,{...wolfEntry,rolls:[12],damageRolls:[[4],[8]]});
 assert.deepEqual(out.damage.map(c=>c.amount),[8,8]);
 assert.equal(out.totalDamage,16);
 assert.match(beastAttackSummary(out),/Piercing.*Poison/);
});
test('Brown Bear has two separate attacks and verified Multiattack reminder',()=>{
 const p=fixture(8,'Brown Bear'),r=beastCombatProfile('Brown Bear',8);
 assert.deepEqual(r.attacks.map(x=>x.name),['Bite','Claw']);
 assert.match(r.traits.join(' '),/Multiattack/);
 assert.equal(resolveBeastAttack(p.profile,p.state,{...wolfEntry,attack:'Claw',damageRolls:[[4]]}).totalDamage,7);
});
test('conditional effects stay as reference reminders, never automatic target effects',()=>{
 for(const [name,attack,effect] of [['Wolf','Bite','Prone'],['Giant Crab','Claw','Grappled'],
    ['Boar','Gore','charge'],['Giant Toad','Bite','Grappled']]){
   const data=beastCombatProfile(name,8),row=data.attacks.find(item=>item.name===attack);
   assert.match(row.notes,new RegExp(effect,'i'));
 }
});
test('typed malformed damage, unconfirmed hit, and excessive dice fail atomically',()=>{
 const p=fixture(8,'Giant Wolf Spider');
 for(const damageRolls of [[[4]],[[5],[1,2]],[[2],['2','3']],[[2],[1,2],[3]]]){
   fails(p,{...wolfEntry,damageRolls},/damage/i);
 }
 fails(p,{...wolfEntry,targetAC:null,confirmedHit:false,damageRolls:[[3],[4,4]]},/Damage rolls/);
});
test('a downed, dead or Incapacitated Druid cannot roll a Beast attack',()=>{
 const p=fixture();p.act({type:'damage',value:p.profile.maxHP+p.state.temp});
 fails(p,wolfEntry,/at least 1 HP/);
 const q=fixture();q.act({type:'condition',name:'Stunned',active:true});
 fails(q,wolfEntry,/Incapacitated/);
});
test('Beast attacks leave Action, Bonus Action and target HP in the DM’s hands',()=>{
 const p=fixture();p.act({type:'combat-start',initiative:13});p.act({type:'combat-turn',stage:'start'});
 const before=structuredClone(p.state.combat);
 p.act({type:'beast-attack-assist',...wolfEntry});
 assert.deepEqual(p.state.combat,before);
 assert.equal(Object.hasOwn(p.state,'targetHP'),false);
});
test('existing one-step Undo checkpoint can restore the previous Beast combat log',()=>{
 const p=fixture();const old=structuredClone(p.state);
 const next=p.act({type:'beast-attack-assist',...wolfEntry});
 assert.equal(next.log.length,old.log.length+1);
 assert.deepEqual(old,normalizePlay(p.profile,old));
});
test('Play backup continues to preserve a Beast attack log through JSON roundtrip',async()=>{
 const p=fixture();p.act({type:'beast-attack-assist',...wolfEntry});
 const exported=await makePlayExport(p.draft,p.state);
 const parsed=await readSavedCharacterExport(JSON.stringify(exported));
 assert.deepEqual(parsed.play,p.state);
});
test('offline cache includes the new attack module and uses an isolated preview revision',()=>{
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 assert.match(sw,/open-5e-v0\.25\.7-inventory-dev/);
 assert.match(sw,/\.\/lib\/beast-combat\.js/);
 const script=readFileSync(new URL('../scripts/build-artwork-withheld-preview.mjs',import.meta.url),'utf8');
 assert.match(script,/artwork-withheld-v0\.25\.7-inventory-dev/);
});
test('Play UI provides guarded Beast attack controls with escaping and localized labels',()=>{
 const ui=readFileSync(new URL('../dist/play-sheet.js',import.meta.url),'utf8');
 assert.ok(ui.includes('data-play-form=\"beast-attack-assist\"'));
 assert.match(ui,/planBeastAttack\(profile,play/);
 assert.match(ui,/esc\(attack.name\)/);
 assert.ok(messages['Roll Beast attack']?.id);
 assert.ok(messages['Verified Beast combat reference']?.id);
});
