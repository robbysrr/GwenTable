import test from 'node:test';
import assert from 'node:assert/strict';
import {skills} from '../dist/lib/rules.js';
import {classes, spellLists} from '../dist/lib/catalog.js';
import {build,deriveCharacter,generateCharacter,templateCharacter,validateCharacter} from '../dist/lib/character.js';
import {advancePlay,normalizePlay,playProfile,reconcilePlay} from '../dist/lib/play.js';
import {makePlayExport,readSavedCharacterExport} from '../dist/lib/portable.js';

const upgraded=name=>build({...templateCharacter(name),level:4}).draft;
test('each SRD class progresses to level 4 and retains its subclass and starting choices',()=>{
  for(const name of Object.keys(classes)) {
    const old=templateCharacter(name);
    const d=upgraded(name);
    const s=deriveCharacter(d);
    assert.deepEqual(validateCharacter(d),[],name);
    assert.equal(s.subclass,classes[name].subclass,name);
    assert.equal(s.xp,2700,name);
    assert.equal(s.nextXP,6500,name);
    assert.equal(s.dice,'4d'+classes[name].die,name);
    assert.equal(s.proficiency,2,name);
    assert.deepEqual(d.classSkills,old.classSkills,name);
    assert.deepEqual(d.scores,old.scores,name);
    assert.equal(d.kit,old.kit,name);
  }
  assert.equal(upgraded('Druid').wildShapes.length,6);
  assert.equal(upgraded('Barbarian').mastery.length,3);
  assert.equal(upgraded('Fighter').mastery.length,4);
  assert.equal(playProfile(upgraded('Fighter')).resources.find(p=>p.id==='second-wind').max,3);
  assert.ok(deriveCharacter(upgraded('Monk')).features.some(feature=>feature.startsWith('Slow Fall')));
});

test('level 4 Constitution increases update all Hit Dice and retain prior rolled results',()=>{
  const original=build({...templateCharacter('Fighter'),hpMethod:'rolled',hpRolls:[1,3]}).draft;
  const d=build({...original,level:4,advancementFeat:'Ability Score Improvement',advancementBoost:'2,2'},{rng:()=>0}).draft;
  assert.deepEqual(d.hpRolls,[1,3,1]);
  const old=deriveCharacter(original);
  const next=deriveCharacter(d);
  assert.equal(next.mods[2],old.mods[2]+1);
  assert.equal(next.hp,old.hp+Math.max(1,1+old.mods[2])+4);
  const wrong={...d,advancementBoost:'6,6'};
  assert.notDeepEqual(validateCharacter(wrong),[]);
});

test('level 4 casting tables, prepared spells and Wizard book follow published counts',()=>{
  const data={Bard:[3,7,[4,3]],Cleric:[4,7,[4,3]],Druid:[4,7,[4,3]],Paladin:[0,5,[3]],Ranger:[0,5,[3]],
    Sorcerer:[5,7,[4,3]],Warlock:[3,5,[2]],Wizard:[4,7,[4,3]]};
  for(const [name,[cantrips,prepared,slots]] of Object.entries(data)) {
    const before=deriveCharacter(templateCharacter(name));
    const current=deriveCharacter(upgraded(name));
    const spells=current.known.filter(entry=>entry.origin===name);
    assert.equal(spells.filter(entry=>entry.level===0).length,cantrips,name);
    assert.equal(spells.filter(entry=>entry.level>0).length,prepared,name);
    assert.deepEqual(current.slots.map(s=>s.count),slots,name);
    assert.ok(before.known.filter(entry=>entry.origin===name).every(old=>spells.some(spell=>spell.name===old.name)),name);
  }
  const wizard=deriveCharacter(upgraded('Wizard'));
  assert.equal(wizard.book.length,14);
  assert.ok(wizard.book.every(spell=>spellLists.Wizard[spell][0]>0));
});

test('level-4 generator chooses valid feats and caps ability scores',()=>{
  let seed=91;
  const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(const className of Object.keys(classes)) for(let i=0;i<100;i++) {
    const d=generateCharacter({className,level:4},rng);
    assert.deepEqual(validateCharacter(d),[],className);
    assert.ok(Math.max(...deriveCharacter(d).scores)<=20);
  }
  const fighter=upgraded('Fighter');
  const grappler=deriveCharacter(build({...fighter,advancementFeat:'Grappler',grapplerAbility:0}).draft);
  assert.ok(grappler.featNames.includes('Grappler'));
  const extraStyle=deriveCharacter(build({...fighter,advancementFeat:'Archery'}).draft);
  assert.ok(extraStyle.featNames.includes('Archery'));
});

test('play state tracks recorded XP and migrates backups from before XP tracking',async()=>{
  const draft=upgraded('Wizard');
  const profile=playProfile(draft);
  const baseline=normalizePlay(profile);
  assert.equal(baseline.xp,2700);
  const state=advancePlay(profile,baseline,{type:'xp',value:3570});
  const backup=await makePlayExport(draft,state);
  assert.equal((await readSavedCharacterExport(JSON.stringify(backup))).play.xp,3570);
  const legacy={...baseline};
  delete legacy.xp;
  assert.equal((await readSavedCharacterExport(JSON.stringify(await makePlayExport(draft,legacy)))).play.xp,2700);
});

test('level 5 SRD classes gain proficiency and their tier-two spell slots or attack features',()=>{
  const fullCasters=['Bard','Cleric','Druid','Sorcerer','Wizard'];
  const extra=['Barbarian','Fighter','Monk','Paladin','Ranger'];
  for(const name of Object.keys(classes)) {
    const old=upgraded(name);
    const d=build({...old,level:5}).draft;
    const s=deriveCharacter(d);
    assert.deepEqual(validateCharacter(d),[],name);
    assert.equal(s.proficiency,3,name);
    assert.equal(s.xp,6500,name);
    assert.equal(s.nextXP,14000,name);
    assert.equal(s.subclass,classes[name].subclass,name);
    assert.deepEqual(d.hpRolls.slice(0,old.hpRolls.length),old.hpRolls,name);
    assert.deepEqual(s.saves,s.mods.map((mod,i)=>mod+(classes[name].saves.includes(i)?3:0)),name);
    assert.equal(s.features.some(x=>x.startsWith('Extra Attack')),extra.includes(name),name);
    const slots=fullCasters.includes(name)?[[1,4],[2,3],[3,2]]:['Paladin','Ranger'].includes(name)?[[1,4],[2,2]]:name==='Warlock'?[[3,2]]:[];
    assert.deepEqual(s.slots.map(({level,count})=>[level,count]),slots,name);
    assert.ok(s.known.every(spell=>spell.attack===s.mods[['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'].indexOf(spell.ability)]+3));
  }
  const wizard=deriveCharacter(build({...upgraded('Wizard'),level:5,bookSavantFive:'Fireball'}).draft);
  assert.equal(wizard.book.length,17);
  assert.ok(wizard.book.includes('Fireball'));
  const rogue=deriveCharacter(build({...upgraded('Rogue'),level:5}).draft);
  for(const skill of rogue.skills.filter(skill=>skill.expert)) {
    assert.equal(skill.total,rogue.mods[skills[skill.name]]+6);
  }
  const monk=deriveCharacter(build({...upgraded('Monk'),level:5}).draft);
  assert.equal(monk.attacks.find(a=>a.name==='Unarmed Strike').dice,'1d8');
});

test('tier-two unlocks refresh Bardic Inspiration and preserve spent Pact Magic on level change',()=>{
  const bard=playProfile(build({...upgraded('Bard'),level:5}).draft);
  let state=advancePlay(bard,normalizePlay(bard),{type:'counter',id:'bardic',delta:1});
  state=advancePlay(bard,state,{type:'font-of-inspiration',level:3});
  assert.equal(state.counters.bardic,0);
  assert.equal(state.slots[3],1);
  state=advancePlay(bard,state,{type:'counter',id:'bardic',delta:1});
  state=advancePlay(bard,state,{type:'short-rest'});
  assert.equal(state.counters.bardic,0);
  assert.equal(state.slots[3],1);
  const prior=playProfile(upgraded('Warlock'));
  const next=playProfile(build({...prior.d,level:5}).draft);
  const spent=advancePlay(prior,normalizePlay(prior),{type:'slot',level:2,delta:1});
  assert.deepEqual(reconcilePlay(prior,next,spent).slots,{3:1});
});

test('level 5 Sorcerous Restoration is optional and resets on a Long Rest',()=>{
  const profile=playProfile(build({...upgraded('Sorcerer'),level:5}).draft);
  let state=normalizePlay(profile);
  for(let i=0;i<3;i++) state=advancePlay(profile,state,{type:'counter',id:'sorcery',delta:1});
  state=advancePlay(profile,state,{type:'short-rest',sorcerous:true});
  assert.equal(state.counters.sorcery,1);
  assert.equal(state.counters['sorcerous-restoration'],1);
  assert.throws(()=>advancePlay(profile,state,{type:'short-rest',sorcerous:true}),/available use/);
  assert.equal(advancePlay(profile,state,{type:'long-rest'}).counters['sorcerous-restoration'],0);
});

test('all SRD classes advance through levels 6–8 with the correct thresholds and slots',()=>{
  const full=['Bard','Cleric','Druid','Sorcerer','Wizard'];
  for(const name of Object.keys(classes)) {
    let draft=build({...upgraded(name),level:5}).draft;
    for(let level=6;level<=8;level++) {
      const next=build({...draft,level}).draft;
      const sheet=deriveCharacter(next);
      assert.deepEqual(validateCharacter(next),[],name);
      assert.equal(sheet.subclass,classes[name].subclass);
      assert.equal(sheet.proficiency,3);
      assert.equal(sheet.xp,[14000,23000,34000][level-6]);
      assert.equal(sheet.nextXP,[23000,34000,48000][level-6]);
      assert.equal(sheet.dice,level+'d'+classes[name].die);
      assert.deepEqual(next.classSkills,draft.classSkills);
      assert.equal(next.advancementFeat,draft.advancementFeat);
      const slotCounts=full.includes(name)?(level===6?[4,3,3]:[4,3,3,level-6]):
        name==='Warlock'?[2]:['Ranger','Paladin'].includes(name)?[4,level===6?2:3]:[];
      assert.deepEqual(sheet.slots.map(slot=>slot.count),slotCounts,name);
      for(const spell of sheet.known) assert.ok(Number.isInteger(spell.level),name+' '+spell.name);
      draft=next;
    }
    assert.ok(draft.advancementEightFeat);
  }
});

test('Champion gains a distinct fighting style and Fighter Constitution changes apply at both feat levels',()=>{
  const old=upgraded('Fighter');
  const d=build({...old,level:8,fighterSixFeat:'Ability Score Improvement',fighterSixBoost:'2,2',
    championStyle:'Archery',advancementEightFeat:'Ability Score Improvement',advancementEightBoost:'2,2'}).draft;
  const sheet=deriveCharacter(d);
  assert.equal(d.championStyle,'Archery');
  assert.equal(d.fighterSixBoost,'2,2');
  assert.equal(d.advancementEightBoost,'2,2');
  assert.equal(sheet.mods[2],deriveCharacter(old).mods[2]+2);
  assert.equal(sheet.hp,10+7*6+8*sheet.mods[2]);
  assert.equal(sheet.attacks.find(attack=>attack.name==='Shortbow').bonus,sheet.mods[1]+5);
  assert.notDeepEqual(validateCharacter({...d,championStyle:d.style}),[]);
});

test('level 7 Wizards can add 4th-level spells and level 8 Warlocks retain spent Pact Magic',()=>{
  const draft=build({...upgraded('Wizard'),level:8,bookSavantSeven:'Wall of Fire'}).draft;
  assert.equal(deriveCharacter(draft).book.length,24);
  assert.ok(deriveCharacter(draft).book.includes('Wall of Fire'));
  const old=playProfile(build({...upgraded('Warlock'),level:6}).draft);
  const current=playProfile(build({...old.d,level:8}).draft);
  const used=advancePlay(old,normalizePlay(old),{type:'slot',level:3,delta:1});
  assert.deepEqual(reconcilePlay(old,current,used).slots,{4:1});
  assert.equal(current.d.invocations.length,6);
});

test('Natural Recovery is separate from free casting and older Paladin backups remain valid',async()=>{
  const profile=playProfile(build({...upgraded('Druid'),level:7}).draft);
  let state=advancePlay(profile,normalizePlay(profile),{type:'slot',level:4,delta:1});
  state=advancePlay(profile,state,{type:'short-rest',recover:{4:1}});
  assert.equal(state.slots[4],0);
  assert.equal(state.counters.natural,1);
  assert.equal(state.counters['natural-cast'],0);
  const old=upgraded('Paladin');
  const play=normalizePlay(playProfile(old));
  delete play.counters.divinity;
  assert.equal((await readSavedCharacterExport(JSON.stringify(await makePlayExport(old,play)))).play.counters.divinity,0);
});

test('Magic Initiate stops offering an extra pick after all three class lists are used',()=>{
  const draft=build({...templateCharacter('Fighter'),level:8,background:'Sage',
    humanFeat:'Magic Initiate',humanFeatList:'Druid',advancementFeat:'Magic Initiate',
    advancementOriginList:'Cleric',fighterSixFeat:'Magic Initiate',advancementEightFeat:'Magic Initiate'}).draft;
  assert.deepEqual(validateCharacter(draft),[]);
  assert.equal(draft.fighterSixFeat,'Ability Score Improvement');
  assert.equal(draft.advancementEightFeat,'Ability Score Improvement');
  assert.equal(deriveCharacter(draft).featNames.filter(name=>name.startsWith('Magic Initiate')).length,3);
});

test('all classes advance through levels 9–12 with their spell slots and new feat choices',()=>{
  const thresholds=[48000,64000,85000,100000,120000];
  const fullCasters=['Bard','Cleric','Druid','Sorcerer','Wizard'];
  for(const name of Object.keys(classes)) {
    let draft=templateCharacter(name);
    for(let level=4;level<=12;level++) {
      const prior=draft;
      draft=build({...draft,level}).draft;
      if(level<9) continue;
      assert.deepEqual(validateCharacter(draft),[],name);
      assert.equal(draft.kit,prior.kit,name);
      const sheet=deriveCharacter(draft);
      assert.equal(sheet.proficiency,4,name);
      assert.equal(sheet.xp,thresholds[level-9],name);
      assert.equal(sheet.nextXP,thresholds[level-8],name);
      if(fullCasters.includes(name)) assert.deepEqual(sheet.slots.map(slot=>slot.count),
        [4,3,3,3,level===9?1:2,...(level>=11?[1]:[])],name);
      if(['Paladin','Ranger'].includes(name)) assert.deepEqual(sheet.slots.map(slot=>slot.count),[4,3,level>=11?3:2],name);
      if(name==='Warlock') assert.deepEqual(sheet.slots,[{level:5,count:level>=11?3:2}]);
      if(level===10&&name==='Rogue') assert.ok(draft.rogueTenFeat);
      if(level===12) assert.ok(draft.advancementTwelveFeat,name);
    }
  }
});

test('higher-level resources follow rest rules and Mystic Arcanum survives a backup',async()=>{
  const at=(name,level)=>build({...templateCharacter(name),level}).draft;
  const wizard=playProfile(at('Wizard',11));
  const cast=advancePlay(wizard,normalizePlay(wizard),{type:'slot',level:6,delta:1});
  assert.throws(()=>advancePlay(wizard,cast,{type:'short-rest',recover:{6:1}}),/level 5 or lower/);
  assert.equal(advancePlay(wizard,cast,{type:'short-rest'}).slots[6],1);

  const warlock=playProfile(at('Warlock',11));
  const arcanum=warlock.freeSpells.find(pool=>pool.id.startsWith('spell:Mystic Arcanum:'));
  const spent=advancePlay(warlock,normalizePlay(warlock),{type:'counter',id:arcanum.id,delta:1});
  const rested=advancePlay(warlock,spent,{type:'short-rest'});
  const backup=await makePlayExport(warlock.d,rested);
  const restored=await readSavedCharacterExport(JSON.stringify(backup));
  assert.equal(restored.play.counters[arcanum.id],1);
  assert.equal(advancePlay(warlock,restored.play,{type:'long-rest'}).counters[arcanum.id],0);

  const ranger=playProfile(at('Ranger',10));
  const tired=advancePlay(ranger,normalizePlay(ranger),{type:'exhaustion',value:2});
  assert.equal(advancePlay(ranger,tired,{type:'short-rest'}).exhaustion,1);
  assert.equal(playProfile(at('Fighter',10)).resources.find(pool=>pool.id==='second-wind').max,4);
});

test('older Druids retain their six Wild Shape choices when importing with room for eight',async()=>{
  const draft=build({...templateCharacter('Druid'),level:8}).draft;
  const old={...draft,wildShapes:draft.wildShapes.slice(0,6)};
  const profile=playProfile(old);
  const backup=await makePlayExport(old,normalizePlay(profile));
  const restored=await readSavedCharacterExport(JSON.stringify(backup));
  const rebuilt=playProfile(restored.payload??restored.draft).d;
  assert.deepEqual(rebuilt.wildShapes.slice(0,6),old.wildShapes);
  assert.equal(rebuilt.wildShapes.length,8);
});
