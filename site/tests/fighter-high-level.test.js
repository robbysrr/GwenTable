import test from 'node:test';
import assert from 'node:assert/strict';
import {build,deriveCharacter,generateCharacter,levelsFor,templateCharacter,validateCharacter} from '../dist/lib/character.js';
import {advancePlay,normalizePlay,playProfile,reconcilePlay} from '../dist/lib/play.js';
import {makePlayExport,makeRosterExport,readRosterExport,readSavedCharacterExport} from '../dist/lib/portable.js';

const fighter=templateCharacter('Fighter');
const at=(level,choices={})=>build({...fighter,level,...choices}).draft;
const caps=[
  [2,3,2,0,0,1,20],[2,3,2,1,0,1,20],[2,3,2,1,0,1,19],[2,4,3,1,0,1,19],
  [3,4,3,1,0,2,19],[3,4,3,1,0,2,19],[3,4,3,1,0,2,19],[3,4,3,1,0,2,19],
  [4,4,3,1,1,2,19],[4,5,4,1,1,2,19],[4,5,4,1,1,3,19],[4,5,4,1,1,3,19],
  [5,5,4,1,2,3,19],[5,5,4,1,2,3,19],[5,5,4,1,2,3,18],[5,6,4,1,2,3,18],
  [6,6,4,2,3,3,18],[6,6,4,2,3,3,18],[6,6,4,2,3,3,18],[6,6,4,2,3,4,18]
];
test('Fighter levels 1–20 match the SRD table and canonical Play Sheet resources',()=>{
  const thresholds=[0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
  assert.equal(levelsFor('Fighter').at(-1),20);
  assert.equal(levelsFor('Wizard').at(-1),12);
  for(const [i,expected] of caps.entries()) {
    const level=i+1;
    const draft=at(level);
    const sheet=deriveCharacter(draft);
    const profile=playProfile(draft);
    const max=id=>profile.resources.find(resource=>resource.id===id)?.max??0;
    assert.deepEqual(validateCharacter(draft),[],String(level));
    assert.deepEqual([sheet.proficiency,draft.mastery.length,max('second-wind'),max('surge'),max('indomitable'),sheet.fighter.attacks,sheet.fighter.critical],expected,String(level));
    assert.deepEqual(profile.s,sheet);
    assert.equal(sheet.xp,thresholds[i]);
    assert.equal(sheet.nextXP,thresholds[i+1]??null);
    assert.equal(Object.values(sheet.acParts).reduce((total,n)=>total+n,0),sheet.ac);
    assert.equal(Object.values(sheet.hpParts).reduce((total,n)=>total+n,0),sheet.hp);
  }
});
test('high-level Fighter unlocks support feats, legal Epic Boons, and chronological Constitution changes',()=>{
  assert.ok(deriveCharacter(at(13)).features.some(feature=>feature.startsWith('Studied Attacks')));
  const lower=at(13,{fighterSixFeat:'Alert',advancementEightFeat:'Archery',advancementTwelveFeat:'Skilled'});
  const level14=build({...lower,level:14,fighterFourteenFeat:'Ability Score Improvement',fighterFourteenBoost:'2,2'}).draft;
  assert.equal(deriveCharacter(level14).hp,deriveCharacter(lower).hp+6+deriveCharacter(lower).mods[2]+14);
  const high=at(19,{epicBoonFeat:'Boon of Irresistible Offense',epicBoonAbility:1});
  assert.ok(deriveCharacter(high).featNames.includes('Boon of Irresistible Offense'));
  assert.notDeepEqual(validateCharacter({...high,epicBoonAbility:2}),[]);
  assert.notDeepEqual(validateCharacter({...high,epicBoonFeat:'Boon of Spell Recall'}),[]);
  assert.ok(!deriveCharacter(at(15)).features.some(feature=>feature.startsWith('Improved Critical')));
});
test('Survivor only rallies a living Bloodied Champion and restores 1 HP on a death save of 18–20',async()=>{
  const draft=at(18);
  const profile=playProfile(draft);
  const full=normalizePlay(profile);
  const bloodied=advancePlay(profile,full,{type:'damage',value:Math.ceil(profile.maxHP/2)});
  const rally=advancePlay(profile,bloodied,{type:'heroic-rally'});
  assert.equal(rally.hp,bloodied.hp+5+profile.con);
  assert.throws(()=>advancePlay(profile,full,{type:'heroic-rally'}),/requires Survivor/);
  const down=advancePlay(profile,full,{type:'damage',value:profile.maxHP});
  assert.throws(()=>advancePlay(profile,down,{type:'heroic-rally'}));
  assert.equal(advancePlay(profile,down,{type:'death-save',value:17}).successes,1);
  assert.equal(advancePlay(profile,down,{type:'death-save',value:18}).hp,1);
  const baseline=playProfile(at(17));
  const baselineDown=advancePlay(baseline,normalizePlay(baseline),{type:'damage',value:baseline.maxHP});
  assert.equal(advancePlay(baseline,baselineDown,{type:'death-save',value:18}).hp,0);
  const file=await makePlayExport(draft,rally);
  assert.deepEqual(await readSavedCharacterExport(JSON.stringify(file)),{draft,play:rally});
});
test('Fighter advancement preserves spent uses, new capacity, and roster undo snapshots',async()=>{
  const before=playProfile(at(16));
  const after=playProfile(at(19,{epicBoonFeat:'Boon of Fate',epicBoonAbility:1}));
  const ready=normalizePlay(before);
  const spent=advancePlay(before,ready,{type:'counter',id:'surge',delta:1});
  const play=reconcilePlay(before,after,spent);
  const playUndo=reconcilePlay(before,after,ready);
  assert.equal(play.counters.surge,1);
  assert.equal(play.xp,305000);
  assert.equal(play.counters['improve-fate'],0);
  const once=advancePlay(after,play,{type:'counter',id:'improve-fate',delta:1});
  assert.equal(advancePlay(after,once,{type:'short-rest'}).counters['improve-fate'],0);
  const file=await makeRosterExport([{draft:after.d,play,playUndo}]);
  assert.deepEqual(await readRosterExport(JSON.stringify(file)),[{draft:after.d,play,playUndo}]);
});
test('800 seeded high-level Fighters are valid and start with gear or starting gold',()=>{
  let seed=1;
  const rng=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
  for(let level=13;level<=20;level++) for(let i=0;i<100;i++) {
    const draft=generateCharacter({className:'Fighter',level},rng);
    assert.deepEqual(validateCharacter(draft),[],String(seed));
    assert.equal(draft.level,level);
    const sheet=deriveCharacter(draft);
    assert.ok(sheet.inventory.length||sheet.gp>0,String(seed));
  }
});
