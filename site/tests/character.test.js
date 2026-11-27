import test from 'node:test';
import assert from 'node:assert/strict';
import {newDraft,derive,validate,rollScores,rollTotal,pointTotal,modifier} from '../dist/lib/rules.js';
import {makeExport,readExport} from '../dist/lib/portable.js';
import {contact} from '../dist/lib/npc.js';
const fighter = () => ({...newDraft(),name:'Iona Fen'});

test('C-01 | Fighter/Human/Soldier with chain mail and Defense',()=>{
  const d=fighter();
  assert.deepEqual(validate(d),[]);
  const s=derive(d);
  assert.deepEqual([s.hp,s.ac,s.initiative,s.speed,s.proficiency,s.passive,s.gp],[12,17,3,30,2,13,18]);
  assert.deepEqual(s.saves,[5,1,4,-1,1,0]);
  assert.deepEqual([s.xp,s.nextLevelXP],[0,300]);
  assert.equal(s.stealthDisadvantage,true);
  assert.deepEqual(s.attacks.find(a=>a.name==='Greatsword'),{name:'Greatsword',dice:'2d6',type:'Slashing',mod:3,ability:0,bonus:5,disadvantage:false,mastery:'Graze'});
});
test('C-01 | leather with Archery and the cash alternative',()=>{
  const d={...fighter(),kit:'B',backgroundKit:'B',style:'Archery'};
  assert.deepEqual(validate(d),[]);
  const s=derive(d);
  assert.equal(s.ac,13);
  assert.equal(s.gp,61);
  assert.equal(s.attacks.find(a=>a.name==='Longbow').bonus,5);
  assert.equal(s.attacks.find(a=>a.name==='Scimitar').ability,0);
  assert.equal(derive({...d,kit:'C'}).ac,11);
  assert.equal(derive({...d,kit:'C'}).gp,205);
});
test('C-01 | chain mail penalties and unarmored Defense',()=>{
  const d={...fighter(),scores:[8,15,14,13,12,10]};
  assert.deepEqual(validate(d),[]);
  assert.equal(derive(d).speed,20);
  assert.equal(derive(d).attacks[0].disadvantage,true);
  assert.equal(derive({...d,wear:false}).speed,30);
  assert.equal(derive({...d,wear:false}).ac,12);
});
test('C-05 | conflicting proficiencies, invalid boosts, and duplicate mastery are rejected',()=>{
  const d={...fighter(),fighter:['Perception','Perception'],human:'Athletics',boosts:[3,0,0],mastery:['Flail','Javelin','Flail']};
  assert.equal(validate(d).length,4);
  assert.ok(validate({...fighter(),feat:'Skilled',skilled:['History','History','Nature']}).length);
  assert.doesNotThrow(()=>validate({...fighter(),fighter:null,feat:'Skilled'}));
});
test('ABILITY-01 | point costs and modifier boundaries',()=>{
  assert.equal(pointTotal([15,13,14,8,12,10]),27);
  assert.equal(modifier(9),-1);
  assert.equal(modifier(20),5);
  assert.deepEqual(validate({...fighter(),method:'points'}),[]);
  assert.ok(validate({...fighter(),method:'points',scores:[15,15,15,15,15,15]}).length);
  assert.ok(validate({...fighter(),method:'array',scores:[15,15,14,13,12,10]}).length);
});
test('C-06 | deterministic fixture drops lowest die, preserves duplicate assignments',()=>{
  let next=0;
  const rolls=rollScores(()=>[1,3,4,6][next++%4]);
  assert.equal(rolls.length,6);
  assert.equal(rollTotal(rolls[0]),13);
  assert.deepEqual(validate({...fighter(),method:'rolled',rolls,scores:rolls.map(rollTotal)}),[]);
});
test('C-09 | JSON round-trip keeps build and derived values',async()=>{
  const d={...fighter(),kit:'B'};
  const record=await makeExport(d);
  const imported=await readExport(JSON.stringify(record));
  assert.deepEqual(imported,d);
  assert.deepEqual(derive(imported),derive(d));
  record.payload.name='Changed';
  await assert.rejects(readExport(JSON.stringify(record)),/integrity/);
});
test('PORT-02 | malformed, oversized, and prohibited shapes are rejected',async()=>{
  await assert.rejects(readExport('null'));
  await assert.rejects(readExport('{"__proto__":{"p":1}}'));
  await assert.rejects(readExport(' '.repeat(512*1024+1)),/512 KB/);
});
test('NPC-01 | seeded fields reproduce, lock stays on reroll',()=>{
  const a=contact('tide','Courier');
  assert.deepEqual(contact('tide','Courier'),a);
  const b=contact('tide','Courier',1,{name:a.fields.name});
  assert.equal(b.fields.name,a.fields.name);
  assert.notDeepEqual(b.fields,a.fields);
});
