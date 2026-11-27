import test from 'node:test';
import assert from 'node:assert/strict';
import {pointTotal, newDraft} from '../dist/lib/rules.js';
import {classes, backgrounds, species, spellLists, weaponProfiles} from '../dist/lib/catalog.js';
import {build, generateCharacter, templateCharacter, deriveCharacter, validateCharacter, migrateDraft} from '../dist/lib/character.js';
import {newCustom} from '../dist/lib/custom.js';
import {makeExport, readExport, makeCustomExport, readCustomExport} from '../dist/lib/portable.js';

let seed=2441;
const rng=()=>{
  seed=(Math.imul(1664525,seed)+1013904223)>>>0;
  return seed/4294967296;
};

test('every starter template is a ready-to-play level 3 subclass with class and background equipment',()=>{
  assert.equal(Object.keys(classes).length,12);
  for (const [name,c] of Object.entries(classes)) {
    const draft=templateCharacter(name);
    assert.deepEqual(validateCharacter(draft),[],name);
    assert.deepEqual(draft,templateCharacter(name),name);
    const sheet=deriveCharacter(draft);
    assert.equal(draft.level,3);
    assert.equal(sheet.subclass,c.subclass);
    assert.equal(sheet.xp,900);
    assert.equal(sheet.gp,c.kits.A.gp+backgrounds[draft.background].gp);
    assert.ok(sheet.inventory.length>c.kits.A.items.length);
    assert.ok(sheet.attacks.length>1);
  }
  assert.equal(deriveCharacter(templateCharacter('Paladin')).ac,19);
  const wizard=deriveCharacter(templateCharacter('Wizard'));
  assert.equal(wizard.book.length,12);
  assert.deepEqual(wizard.slots,[{level:1,count:4},{level:2,count:2}]);
  assert.equal(wizard.known.filter(row=>row.origin==='Wizard'&&row.level>0).length,6);
  const warlock=deriveCharacter(templateCharacter('Warlock'));
  assert.deepEqual(warlock.slots,[{level:2,count:2}]);
  assert.ok(warlock.known.some(row=>row.name==='Find Familiar'));
});

test('generator produces legal choices across all class, background, species and level combinations',()=>{
  for (const className of Object.keys(classes)) {
    for (const background of Object.keys(backgrounds)) {
      for (const ancestry of Object.keys(species)) {
        for (let level=1;level<=3;level++) {
          for (const method of ['array','points','rolled']) {
            const d=build({className,background,species:ancestry,level,method},{rng}).draft;
            assert.deepEqual(validateCharacter(d),[],[className,background,ancestry,level,method].join(' '));
            const s=deriveCharacter(d);
            assert.ok(s.hp>0&&s.ac>0&&s.attacks.length>=1);
            assert.ok(s.known.every(spell=>Number.isInteger(spell.level)&&Number.isInteger(spell.dc)));
            if (method==='points') assert.equal(pointTotal(d.scores),27);
            if (d.mastery&&className==='Barbarian') assert.ok(d.mastery.every(name=>weaponProfiles[name][2].endsWith('Melee')));
          }
        }
      }
    }
  }
  const results=Array.from({length:250},()=>generateCharacter({},rng));
  assert.equal(new Set(results.map(d=>d.className)).size,12);
  assert.equal(new Set(results.map(d=>d.species)).size,9);
});

test('prepared spells and Invocations constrain class, prerequisites and advancement',()=>{
  const d=templateCharacter('Warlock');
  assert.equal(d.invocations.length,3);
  assert.ok(d.invocations.includes('Agonizing Blast · Eldritch Blast'));
  assert.notDeepEqual(validateCharacter({...d,cantrips:['Mage Hand','Minor Illusion']}),[]);
  assert.notDeepEqual(validateCharacter({...d,invocations:['Thirsting Blade','Pact of the Blade','Pact of the Chain']}),[]);
  const lower=build({...d,level:1}).draft;
  assert.equal(lower.invocations.length,1);
  assert.ok(lower.prepared.every(name=>spellLists.Warlock[name][0]===1));
  const wizard=templateCharacter('Wizard');
  assert.notDeepEqual(validateCharacter({...wizard,bookSavant:['Hold Person','Shatter']}),[]);
  for (const name of ['Bard','Sorcerer','Warlock']) {
    const d=templateCharacter(name);
    assert.ok(d.preparedBasics.every(spell=>spellLists[name][spell][0]===1));
  }
});

test('custom equipment updates the sheet and both portable formats preserve custom content',async()=>{
  const armor={...newCustom('Armor'),name:'Temple Plate',category:'Heavy',ac:18,strength:15};
  const shield={...newCustom('Armor'),name:'Blackwood Shield',category:'Shield',ac:3};
  const weapon={...newCustom('Weapon'),name:'Silverthorn',bonus:1,trained:true,damageType:'Slashing'};
  const spell={...newCustom('Spell'),name:'Lantern Glyph',level:1,ability:'Wisdom'};
  const d=build({...templateCharacter('Paladin'),armor:'custom:'+armor.id,shield:'custom:'+shield.id,custom:[armor,shield,weapon,spell]}).draft;
  const s=deriveCharacter(d);
  assert.equal(s.ac,22);
  assert.equal(s.armor,armor.name);
  assert.equal(s.shield,shield.name);
  assert.equal(s.attacks.find(row=>row.name===weapon.name).bonus,6);
  assert.deepEqual(await readExport(JSON.stringify(await makeExport(d))),d);
  assert.deepEqual(await readCustomExport(JSON.stringify(await makeCustomExport(d.custom))),d.custom);
  await assert.rejects(makeCustomExport([armor,armor]),/valid custom entry/);
  await assert.rejects(makeExport({...d,level:8}),/Fix build choices/);
  const monk=build({...templateCharacter('Monk'),custom:[armor,shield],armor:'custom:'+armor.id,shield:'custom:'+shield.id}).draft;
  const untrained=deriveCharacter(monk);
  assert.ok(untrained.armorUntrained&&untrained.shieldUntrained);
  assert.equal(untrained.attacks.find(row=>row.name==='Unarmed Strike').dice,'1');
});

test('v1 imports keep Fighter build choices, unarmored selection and base scores',async()=>{
  const old={...newDraft(),name:'Legacy Rangerwood',kit:'B',wear:false,style:'Archery'};
  const record=await makeExport(old);
  assert.equal(record.schemaVersion,'1.0.0');
  const d=migrateDraft(await readExport(JSON.stringify(record)));
  assert.deepEqual(validateCharacter(d),[]);
  assert.deepEqual(d.scores,old.scores);
  assert.equal(d.armor,'Unarmored');
  assert.equal(d.className,'Fighter');
  assert.equal(d.style,'Archery');
  assert.deepEqual(d.classSkills,old.fighter);
});
