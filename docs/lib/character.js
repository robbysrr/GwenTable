import {normalizeAppearance,normalizeAppearanceLocks} from './appearance.js';
import {barbarianProgression} from './barbarian-progression.js';
import {monkProgression} from './monk-progression.js';
import {paladinProgression} from './paladin-progression.js';
import {rangerProgression} from './ranger-progression.js';
import {validateCustomList} from "./custom.js";
import {abilities, alignments, array, languages, skills, styles, modifier, pointTotal, rollTotal, validate as validateLegacy} from './rules.js';
import {classes, backgrounds, species, tools, artisanTools, instruments, gamingSets, allLanguages, metamagic, wildShapes, scholarSkills,
  landSpells, originFeats, spellLists, weaponProfiles, templateOrigins} from './catalog.js';

const names = ['Ari','Bram','Cora','Dara','Elias','Fen','Hessa','Iona','Jori','Kael','Lark','Mara','Neri','Orla','Perrin','Quill','Riven','Sera','Tova','Vey'];
const bynames = ['Ash','Barrow','Bell','Bramble','Fen','Flint','Glass','Hale','Hollow','Linden','Moss','Reed','Rowan','Slate','Vale','Wren'];
const hooks = ['Find the traveler who returned a lost heirloom.','Pay off a favor owed to an old friend.','Find out why home stopped sending letters.','Earn a place in a storied company.','Prove a family story true.','Find a new calling after a broken promise.'];
const trinkets = ['A copper coin bent into a crescent.','A pebble wrapped in a ribbon.','An empty wooden spool tied with blue thread.','A button stamped with a tiny star.','A brass key with no teeth.','A dried flower pressed between playing cards.'];
const spellAbilities = [3,4,5];
export const characterLevels = Object.freeze(Array.from({length:12},(_,i)=>i+1));
const fighterLevels=Object.freeze([...characterLevels,13,14,15,16,17,18,19,20]);
export const levelsFor=className=>['Fighter','Rogue','Barbarian','Monk','Paladin','Ranger'].includes(className)?fighterLevels:characterLevels;
const xp = [0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
export const epicBoons={
  'Boon of Combat Prowess':'Peerless Aim: turn a missed attack into a hit once before the start of your next turn.',
  'Boon of Dimensional Travel':'Blink Steps: teleport up to 30 ft immediately after taking the Attack or Magic action.',
  'Boon of Fate':'Improve Fate: apply ±2d4 to a D20 Test within 60 ft. Refresh on Initiative or a Short or Long Rest.',
  'Boon of Irresistible Offense':'Your Bludgeoning, Piercing, and Slashing damage ignores Resistance. A natural 20 can deal extra damage equal to the score increased by this feat.',
  'Boon of the Night Spirit':'In Dim Light or Darkness, become Invisible as a Bonus Action until you act. In that light, resist all damage except Psychic and Radiant.',
  'Boon of Truesight':'You have Truesight out to 60 ft.'
};
export function fighterProgression(level) {
  return {
    secondWind:level>=10?4:level>=4?3:2,
    mastery:level>=16?6:level>=10?5:level>=4?4:3,
    surge:level>=17?2:level>=2?1:0,
    indomitable:level>=17?3:level>=13?2:level>=9?1:0,
    attacks:level>=20?4:level>=11?3:level>=5?2:1,
    critical:level>=15?18:level>=3?19:20,
    survivor:level>=18
  };
}
const spellProgression = {
  Bard:[5,2,[4,5,6,7,9,10,11,12,14,15,16,16]], Cleric:[4,3,[4,5,6,7,9,10,11,12,14,15,16,16]], Druid:[4,2,[4,5,6,7,9,10,11,12,14,15,16,16]], Paladin:[5,0,[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15]],
  Ranger:[4,0,[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15]], Sorcerer:[5,4,[2,4,6,7,9,10,11,12,14,15,16,16]], Warlock:[5,2,[2,3,4,5,6,7,8,9,10,10,11,11]], Wizard:[3,3,[4,5,6,7,9,10,11,12,14,15,16,16]]
};
const simpleInvocations = ['Armor of Shadows','Eldritch Mind','Pact of the Blade','Pact of the Chain','Pact of the Tome'];
const secondInvocations = ['Devil’s Sight','Fiendish Vigor','Lessons of the First Ones','Mask of Many Faces','Misty Visions','Otherworldly Leap'];
const invocationsAtFive = ['Ascendant Step','Gaze of Two Minds','Gift of the Depths','Master of Myriad Forms','One with Shadows'];
const invocationPacts = {'Eldritch Smite':'Pact of the Blade','Thirsting Blade':'Pact of the Blade','Investment of the Chain Master':'Pact of the Chain'};
const lineageAtFive = {Drow:'Darkness','High Elf':'Misty Step','Wood Elf':'Pass without Trace',Abyssal:'Hold Person',Chthonic:'Ray of Enfeeblement',Infernal:'Darkness'};
const landAtFive = {Arid:'Fireball',Polar:'Sleet Storm',Temperate:'Lightning Bolt',Tropical:'Stinking Cloud'};
const extraAttackClasses = ['Barbarian','Fighter','Monk','Paladin','Ranger'];
const featuresAtFive = {
  Barbarian:['Fast Movement (+10 ft while not wearing Heavy armor)'],
  Bard:['Font of Inspiration (Bardic Inspiration refreshes on Short or Long Rest)'],
  Cleric:['Sear Undead (Turn Undead deals Radiant damage equal to Wisdom modifier d8s, minimum 1d8)'],
  Druid:['Wild Resurgence'],
  Fighter:['Tactical Shift (move up to half Speed without Opportunity Attacks when you use Second Wind as a Bonus Action)'],
  Monk:['Stunning Strike (1 Focus Point; Constitution save)'],
  Paladin:['Faithful Steed'],
  Rogue:['Cunning Strike (Poison, Trip, or Withdraw; each costs 1d6 Sneak Attack)','Uncanny Dodge (Reaction; halve the damage from a visible attacker’s hit)'],
  Sorcerer:['Sorcerous Restoration'],
  Wizard:['Memorize Spell (swap one prepared Wizard spell from your spellbook after a Short Rest)']
};
const featuresAtSix = {
  Barbarian:['Mindless Rage (Charmed and Frightened end when you enter Rage; immune while raging)'],
  Bard:['Magical Discoveries'],
  Cleric:['Blessed Healer (level 1+ slotted healing of another creature also heals you for 2 plus the slot level)'],
  Druid:['Natural Recovery'], Monk:['Empowered Strikes (Unarmed Strikes can deal Force damage)','Wholeness of Body'],
  Paladin:['Aura of Protection (10 ft; add Charisma modifier, minimum +1, to saves while active)'],
  Ranger:['Roving (Climb and Swim Speeds equal to Speed; +10 ft Speed while not wearing Heavy armor)'],
  Rogue:['Expertise (two additional skills)'], Sorcerer:['Elemental Affinity'],
  Warlock:['Dark One’s Own Luck'], Wizard:['Sculpt Spells']
};
const featuresAtSeven = {
  Barbarian:['Feral Instinct (Advantage on Initiative)','Instinctive Pounce (move up to half Speed as part of entering Rage)'],
  Bard:['Countercharm'], Cleric:['Blessed Strikes'], Druid:['Elemental Fury'],
  Fighter:['Additional Fighting Style'], Monk:['Evasion'], Paladin:['Aura of Devotion (immunity to Charmed while in your Aura of Protection)'],
  Ranger:['Defensive Tactics'], Rogue:['Evasion','Reliable Talent (treat d20 rolls below 10 as 10 on proficient ability checks)'],
  Sorcerer:['Sorcery Incarnate']
};
const landAtSeven = {Arid:'Blight',Polar:'Ice Storm',Temperate:'Freedom of Movement',Tropical:'Polymorph'};
const beastFormsAtEight=['Bat','Blood Hawk','Brown Bear','Dire Wolf','Eagle','Giant Bat','Giant Hyena','Giant Octopus',
  'Giant Spider','Giant Toad','Giant Wasp','Hawk','Lion','Owl','Raven','Tiger','Vulture'];
const draconicAtSeven=['Arcane Eye','Charm Monster'];
const landAtNine={Arid:'Wall of Stone',Polar:'Cone of Cold',Temperate:'Tree Stride',Tropical:'Insect Plague'};
const damageTypes=['Acid','Bludgeoning','Cold','Fire','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'];
const featuresAtNine={
  Barbarian:['Brutal Strike (trade Reckless Attack Advantage for 1d10 bonus damage and Forceful Blow or Hamstring Blow)'],
  Bard:['Expertise (two additional skills)'],
  Fighter:['Indomitable (reroll a failed save with +Fighter level)','Tactical Master (use Push, Sap, or Slow instead of the weapon’s mastery)'],
  Monk:['Acrobatic Movement (move along vertical surfaces and across liquids during your turn)'],
  Paladin:['Abjure Foes (Channel Divinity)'],Ranger:['Expertise (two additional skills)'],
  Rogue:['Supreme Sneak (Stealth Attack for Cunning Strike)'],Warlock:['Contact Patron']
};
const featuresAtTen={
  Barbarian:['Retaliation (Reaction: make a Melee attack against a creature within 5 ft that damages you)'],
  Bard:['Magical Secrets'],Cleric:['Divine Intervention (one Cleric spell of level 5 or lower without a Reaction casting time)'],
  Druid:['Nature’s Ward (immune to Poisoned; land-dependent Resistance)'],Fighter:['Heroic Warrior (gain Heroic Inspiration when your combat turn starts without it)'],
  Monk:['Heightened Focus','Self-Restoration'],Paladin:['Aura of Courage (immunity to Frightened while in Aura of Protection)'],
  Ranger:['Tireless'],Sorcerer:['Metamagic (two additional options)'],Warlock:['Fiendish Resilience'],
  Wizard:['Empowered Evocation (add Intelligence modifier to one damage roll of a Wizard Evocation spell)']
};
const featuresAtEleven={
  Barbarian:['Relentless Rage (Constitution save when reduced to 0 HP while raging)'],
  Fighter:['Two Extra Attacks (3 attacks when you take the Attack action)'],Monk:['Fleet Step'],
  Paladin:['Radiant Strikes (add 1d8 Radiant to hits with melee weapons and Unarmed Strikes)'],
  Ranger:['Superior Hunter’s Prey'],Rogue:['Improved Cunning Strike (up to two effects per Sneak Attack)'],
  Warlock:['Mystic Arcanum (level 6)']
};
const spellMinimums = {
  Bard:{3:[4],4:[3],5:[2,6],6:[1,5],7:[0,4,9],8:[0,3,8],9:[0,2,7,11],10:[0,1,6,10],11:[0,0,5,9,14],12:[0,0,4,8,13]},
  Sorcerer:{3:[3],4:[2],5:[1,6],6:[0,5],7:[0,4,9],8:[0,3,8],9:[0,2,7,11],10:[0,1,6,10],11:[0,0,5,9,14],12:[0,0,4,8,13]},
  Warlock:{3:[2],4:[1],5:[0,4],6:[0,3],7:[0,2,6],8:[0,1,5],9:[0,0,4,8],10:[0,0,3,7],11:[0,0,2,6],12:[0,0,1,5]}
};
const damagingWarlockCantrips = ['Chill Touch','Eldritch Blast','Poison Spray','True Strike'];
const rangedWarlockCantrips = ['Eldritch Blast','Poison Spray'];
const different = (values, used) => values.filter(value=>!used.includes(value));
const unique = values => [...new Set(values)];
const keyList = Object.keys;
const standardScores = (priority, values=array) => {
  const scores = [];
  priority.forEach((ability,i)=>{scores[ability]=values[i];});
  return scores;
};
const spellPool = (className, levels) => keyList(spellLists[className]).filter(spell=>levels.includes(spellLists[className][spell][0]));
const namedSpell=(name, index, origin, note='')=>({name, ability:abilities[index], origin, note});
const martialTraining = (d,c) => d.order==='Warden'||d.order==='Protector' ? 'Martial' : c.weapon;
const weaponTrained = (weapon, training) => {
  const [, , category, properties] = weaponProfiles[weapon];
  return category.startsWith('Simple') || training==='Martial' ||
    training==='Monk' && properties.includes('Light') ||
    training==='Rogue' && (properties.includes('Finesse') || properties.includes('Light'));
};

export const armorProfiles = {
  'Leather Armor':[11,'Light',0,false], 'Studded Leather Armor':[12,'Light',0,false],
  'Chain Shirt':[13,'Medium',0,false], 'Chain Mail':[16,'Heavy',13,true]
};

function pickSet(old, count, options, choose) {
  const result = Array(count);
  const used = [];
  for (let i=0;i<count;i++) {
    if (options.includes(old?.[i]) && !used.includes(old[i])) {
      result[i]=old[i];
      used.push(old[i]);
    }
  }
  for (let i=0;i<count;i++) {
    if (result[i]!==undefined) continue;
    const available=different(options,used);
    if (!available.length) throw new Error('A character choice has no eligible options.');
    result[i]=choose(available);
    used.push(result[i]);
  }
  return result;
}

const pointArrays = [];
function fillPointArrays(prefix, min, remaining) {
  if (prefix.length===6) {
    if (remaining===0) pointArrays.push(prefix);
    return;
  }
  for (let n=min;n<=15;n++) {
    const cost=pointTotal([n]);
    if (cost <= remaining) fillPointArrays([...prefix,n],n,remaining-cost);
  }
}
fillPointArrays([],8,27);
const die = (sides,rng)=>1+Math.floor(rng()*sides);
const abilityRolls = rng=>Array.from({length:6},()=>Array.from({length:4},()=>die(6,rng)));
const diceValid = (rows, count, length, sides) => Array.isArray(rows) && rows.length===count &&
  rows.every(row=>Array.isArray(row) && row.length===length && row.every(n=>Number.isInteger(n)&&n>=1&&n<=sides));
const sameValues = (a,b) => {
  const sorted=[...b].sort((x,y)=>x-y);
  return a.length===b.length && [...a].sort((x,y)=>x-y).every((n,i)=>n===sorted[i]);
};

export function build(previous={}, {rng, gear=true}={}) {
  const random=Boolean(rng);
  const choose=options=>options[random ? Math.floor(rng()*options.length) : 0];
  const d={model:2};
  const controls=[];
  function choices(section,key,label,options,count) {
    if (!options.length) return undefined;
    controls.push({section,key,label,options,count});
    if (count===undefined) {
      d[key]=options.includes(previous[key])?previous[key]:choose(options);
    } else {
      d[key]=pickSet(Array.isArray(previous[key])?previous[key]:[],count,options,choose);
    }
    return d[key];
  }
  const identity=(...args)=>choices('identity',...args);
  const training=(...args)=>choices('training',...args);
  const equipment=(...args)=>choices('equipment',...args);
  const magic=(...args)=>choices('magic',...args);
  const className=identity('className','Class',Object.keys(classes));
  const c=classes[className];
  identity('level','Character level',levelsFor(className));
  const level=d.level;
  const background=identity('background','Background',Object.keys(backgrounds));
  const b=backgrounds[background];
  const ancestry=identity('species','Species',keyList(species));
  const s=species[ancestry];
  d.name=typeof previous.name==='string'?previous.name.slice(0,80):random?choose(names)+' '+choose(bynames):'';
  d.story=typeof previous.story==='string'?previous.story.slice(0,1000):random?choose(hooks):'';
  for(const key of ['appearance','personality']) {
    if(typeof previous[key]==='string'&&previous[key].length) d[key]=previous[key].slice(0,600);
  }
  const appearanceDetails=normalizeAppearance(previous.appearanceDetails);
  const appearanceLocks=normalizeAppearanceLocks(previous.appearanceLocks);
  if(Object.keys(appearanceDetails).length) d.appearanceDetails=appearanceDetails;
  if(appearanceLocks.length) d.appearanceLocks=appearanceLocks;
  d.trinket=typeof previous.trinket==='string'?previous.trinket.slice(0,160):random?choose(trinkets):'';
  identity('alignment','Alignment',alignments);
  identity('size','Size',s.size);
  if (keyList(s.lineages).length) identity('lineage','Lineage',keyList(s.lineages));
  if (['Elf','Gnome','Tiefling'].includes(ancestry)) identity('lineageAbility','Lineage spellcasting ability',spellAbilities);
  identity('languages','Starting language',languages,2);

  choices('abilities','method','Ability score method',['array','points','rolled']);
  const rolled=d.method==='rolled';
  d.rolls=rolled?(diceValid(previous.rolls,6,4,6)?previous.rolls:abilityRolls(rng??Math.random)):[];
  const totals=rolled?d.rolls.map(rollTotal).sort((a,b)=>b-a):array;
  const priority=className==='Fighter' && (previous.kit==='B'||random&&rng()<0.5)?[1,2,0,4,5,3]:c.priority;
  const validPriorScores=Array.isArray(previous.scores)&&previous.scores.length===6&&previous.scores.every(Number.isInteger)&&
    (d.method==='points'?pointTotal(previous.scores)<=27:sameValues(previous.scores,totals));
  d.scores=validPriorScores?previous.scores:standardScores(priority,d.method==='points'?[...(random?choose(pointArrays):[8,10,12,13,14,15])].reverse():totals);
  const boosts=['2,1,0','2,0,1','1,2,0','0,2,1','1,0,2','0,1,2','1,1,1'];
  choices('abilities','boost','Background boosts',boosts);
  if (level>=2) {
    choices('abilities','hpMethod','Hit Point increases',['fixed','rolled']);
    const retained=Array.isArray(previous.hpRolls)?previous.hpRolls.slice(0,level-1):[];
    const count=retained.length;
    const valid=diceValid([retained],1,count,c.die);
    d.hpRolls=d.hpMethod==='rolled'?Array.from({length:level-1},(_,i)=>(valid?retained[i]:undefined)??die(c.die,rng??Math.random)):[];
  }

  const trained=[...b.skills];
  const profTools=[];
  const bgTool=b.tool==='Gaming Set'?training('gamingSet','Gaming set',gamingSets):b.tool;
  profTools.push(bgTool);
  if (className==='Druid') profTools.push('Herbalism Kit');
  if (className==='Rogue') profTools.push('Thieves’ Tools');
  if (className==='Bard') {
    profTools.push(...training('instruments','Instrument proficiency',instruments,3));
  }
  if (className==='Monk') profTools.push(training('monkTool','Monk tool proficiency',[...artisanTools,...instruments]));
  if (ancestry==='Elf') trained.push(training('keen','Keen Senses',different(['Insight','Perception','Survival'],trained)));
  const eligibleClassSkills=different(c.skills,trained);
  trained.push(...training('classSkills','Class skill',eligibleClassSkills,c.count));
  if (ancestry==='Human') trained.push(training('humanSkill','Human Skillful',different(keyList(skills),trained)));
  const baseExpertise=[];
  if ((className==='Bard'&&level>=2)||className==='Rogue'||(className==='Ranger'&&level>=2)) {
    baseExpertise.push(...training('expertise','Expertise',trained,className==='Ranger'?1:2));
  }
  if (className==='Wizard'&&level>=2) baseExpertise.push(training('scholar','Scholar expertise',scholarSkills.filter(x=>trained.includes(x))));
  if (className==='Barbarian'&&level>=3) trained.push(training('primal','Primal Knowledge',different(c.skills,trained)));
  if (className==='Bard'&&level>=3) trained.push(...training('lore','College of Lore skill',different(keyList(skills),trained),3));

  if (className==='Rogue'||(className==='Ranger'&&level>=2)) {
    training('extraLanguages','Class language',different(allLanguages,[...d.languages,...(className==='Rogue'?['Thieves’ Cant']:[])]),className==='Rogue'?1:2);
  }

  if (className==='Cleric') training('order','Divine Order',['Protector','Thaumaturge']);
  if (className==='Druid') training('order','Primal Order',['Warden','Magician']);
  if (className==='Fighter'||(['Paladin','Ranger'].includes(className)&&level>=2)) {
    const extra=className==='Paladin'?['Blessed Warrior']:className==='Ranger'?['Druidic Warrior']:[];
    training('style','Fighting Style',[...styles,...extra]);
  }
  if (className==='Druid'&&level>=2) {
    const eligible=level>=4?[...wildShapes,'Ape','Black Bear','Crocodile','Giant Goat','Giant Seahorse','Reef Shark','Warhorse']:wildShapes;
    training('wildShapes','Wild Shape form',level>=8?[...eligible,...beastFormsAtEight]:eligible,level>=8?8:level>=4?6:4);
  }
  if (className==='Druid'&&level>=3) training('land','Circle of the Land',['Temperate','Arid','Polar','Tropical']);
  if (className==='Ranger'&&level>=3) training('prey','Hunter’s Prey',['Colossus Slayer','Horde Breaker']);
  if (className==='Sorcerer'&&level>=2) training('metamagic','Metamagic',metamagic,level>=10?4:2);
  if (className==='Sorcerer'&&level>=6) training('elementalAffinity','Elemental Affinity',['Acid','Cold','Fire','Lightning','Poison']);
  if(level>=7) {
    if(className==='Cleric') training('blessedStrikes','Blessed Strikes',['Divine Strike','Potent Spellcasting']);
    if(className==='Druid') training('elementalFury','Elemental Fury',['Potent Spellcasting','Primal Strike']);
    if(className==='Ranger') training('defensiveTactics','Defensive Tactics',['Escape the Horde','Multiattack Defense']);
  }

  if(className==='Warlock'&&level>=10) training('fiendishResilience','Fiendish Resilience',damageTypes);

  const gearKeys=keyList(c.kits);
  const classGear=gearKeys.filter(key=>c.kits[key].items.length);
  if (random&&gear&&previous.kit===undefined) previous={...previous,kit:choose(classGear)};
  equipment('kit','Class starting equipment',gearKeys);
  if (random&&gear&&previous.backgroundKit===undefined) previous={...previous,backgroundKit:'A'};
  equipment('backgroundKit','Background starting equipment',['A','B']);
  if (className==='Bard'&&d.kit==='A') equipment('instrument','Starting musical instrument',instruments);
  if (level>=2) equipment('higherGear','GM starting item',['standard','healing']);
  const inventory=[...c.kits[d.kit].items.map(item=>item==='Musical Instrument'?d.instrument:item==='Monk Tool'?d.monkTool:item),
    ...(d.backgroundKit==='A'?b.items.map(item=>item==='Gaming Set'?d.gamingSet:item):[])];
  if (d.higherGear==='healing') inventory.push('Potion of Healing (Common)');
  if (className==='Wizard'&&!inventory.includes('Spellbook')) inventory.push('Spellbook');
  if (d.trinket.trim()) inventory.push(d.trinket.trim()+' (trinket)');
  d.custom=validateCustomList(previous.custom)?previous.custom:[];
  const customArmor=d.custom.filter(entry=>entry.type==='Armor');
  const armorOptions=inventory.filter(item=>Object.hasOwn(armorProfiles,item));
  const customArmorOptions=customArmor.filter(entry=>entry.category!=='Shield').map(entry=>'custom:'+entry.id);
  if (armorOptions.length||customArmorOptions.length) equipment('armor','Worn armor',[...armorOptions,'Unarmored',...customArmorOptions]);
  const shields=customArmor.filter(entry=>entry.category==='Shield').map(entry=>'custom:'+entry.id);
  if (inventory.includes('Shield')||shields.length) {
    equipment('shield','Shield',[...(inventory.includes('Shield')?['Equipped']:[]),'Stowed',...shields]);
  }
  const inKit=unique(inventory.map(item=>item.replace(/^\d+ /,'').replace(/^(Arcane|Druidic) Focus \(Quarterstaff\)$/,'Quarterstaff'))
    .map(item=>Object.hasOwn(weaponProfiles,item)?item:Object.hasOwn(weaponProfiles,item.slice(0,-1))?item.slice(0,-1):null).filter(Boolean));
  if (['Barbarian','Fighter','Paladin','Ranger','Rogue'].includes(className)) {
    const allowed=keyList(weaponProfiles).filter(weapon=>weaponTrained(weapon,c.weapon)&&
      (className!=='Barbarian'||weaponProfiles[weapon][2].endsWith('Melee')));
    const ordered=[...inKit.filter(weapon=>allowed.includes(weapon)),...different(allowed,inKit)];
    const masteryCount=className==='Fighter'?fighterProgression(level).mastery:className==='Barbarian'?barbarianProgression(level).masteries:2;
    training('mastery','Weapon Mastery',ordered,masteryCount);
  }

  const granted=[];
  const featNames=[b.magic?'Magic Initiate ('+b.magic+')':b.feat];
  const initiationLists=b.magic?[b.magic]:[];
  function initiate(prefix, title, list) {
    const index=magic(prefix+'Ability',title+' ability',spellAbilities);
    const cantrips=magic(prefix+'Cantrips',title+' cantrip',spellPool(list,[0]),2);
    const level1=magic(prefix+'Spell',title+' level 1 spell',spellPool(list,[1]));
    granted.push(...cantrips.map(spell=>namedSpell(spell,index,title)),namedSpell(level1,index,title,'1 free cast per Long Rest'));
  }
  if (b.magic) initiate('backgroundMagic','Background Magic Initiate ('+b.magic+')',b.magic);
  const eligibleOrigin=()=>originFeats.filter(name=>name==='Skilled'||(name==='Magic Initiate'?initiationLists.length<3:!featNames.includes(name)));
  function applyOrigin(prefix,label,feat) {
    if (feat==='Magic Initiate') {
      const list=magic(prefix+'List',label+' spell list',different(['Cleric','Druid','Wizard'],initiationLists));
      initiationLists.push(list);
      featNames.push(feat+' ('+list+')');
      initiate(prefix,label+' ('+list+')',list);
    } else {
      featNames.push(feat);
      if (feat==='Skilled') {
        const selection=training(prefix+'Skilled',label+' skill or tool',different([...keyList(skills),...tools],[...trained,...profTools]),3);
        for (const entry of selection) (Object.hasOwn(skills,entry)?trained:profTools).push(entry);
      }
    }
  }
  const gainOrigin=(prefix,label)=>applyOrigin(prefix,label,training(prefix,label,eligibleOrigin()));
  if (ancestry==='Human') gainOrigin('humanFeat','Human Origin feat');

  if (ancestry==='Elf'||ancestry==='Tiefling'||ancestry==='Gnome') {
    const [first,second]=s.lineages[d.lineage];
    const speciesSpells=[first];
    if (ancestry==='Tiefling') speciesSpells.push('Thaumaturgy');
    if (ancestry==='Gnome'||level>=3) speciesSpells.push(second);
    if (level>=5&&lineageAtFive[d.lineage]) speciesSpells.push(lineageAtFive[d.lineage]);
    speciesSpells.forEach(spell=>granted.push(namedSpell(spell,d.lineageAbility,d.lineage,
      spell!==first&&spell!=='Thaumaturgy'&&d.lineage!=='Rock Gnome'?(d.lineage==='Forest Gnome'?'2 free casts per Long Rest':'1 free cast per Long Rest'):'')));
  }
  const book=[];
  const classSpells=[];
  const slots=[];
  let classAbility;
  if (Object.hasOwn(spellProgression,className)) {
    const [index,baseCantrips,counts]=spellProgression[className];
    classAbility=index;
    const cantrips=baseCantrips+(level>=4&&baseCantrips?1:0)+(level>=10&&baseCantrips?1:0)+(['Thaumaturge','Magician'].includes(d.order)?1:0);
    if (cantrips) classSpells.push(...magic('cantrips','Class cantrip',spellPool(className,[0]),cantrips));
    if (d.style==='Blessed Warrior'||d.style==='Druidic Warrior') {
      const list=d.style==='Blessed Warrior'?'Cleric':'Druid';
      magic('styleCantrips',d.style+' cantrip',spellPool(list,[0]),2).forEach(spell=>granted.push(namedSpell(spell,index,d.style)));
    }
    if (className==='Druid') granted.push(namedSpell('Speak with Animals',index,'Druidic'));
    if (className==='Ranger') granted.push(namedSpell('Hunter’s Mark',index,'Favored Enemy',rangerProgression(level).favoredEnemy+' free casts per Long Rest'));
    if (className==='Paladin'&&level>=2) granted.push(namedSpell('Divine Smite',index,'Paladin’s Smite','1 free cast per Long Rest'));
    if(className==='Paladin'&&level>=5) granted.push(namedSpell('Find Steed',index,'Faithful Steed','1 free cast per Long Rest'));
    if (level>=3) {
      const extras={Cleric:['Aid','Bless','Cure Wounds','Lesser Restoration'],Druid:landSpells[d.land],
        Paladin:['Protection from Evil and Good','Shield of Faith'],Sorcerer:['Alter Self','Chromatic Orb','Command','Dragon’s Breath'],
        Warlock:['Burning Hands','Command','Scorching Ray','Suggestion']};
      const fifth={Cleric:['Mass Healing Word','Revivify'],Druid:[landAtFive[d.land]],Paladin:['Aid','Zone of Truth'],
        Sorcerer:['Fear','Fly'],Warlock:['Fireball','Stinking Cloud']};
      const seventh={Cleric:['Aura of Life','Death Ward'],Druid:[landAtSeven[d.land]],Sorcerer:draconicAtSeven,Warlock:['Fire Shield','Wall of Fire']};
      const ninth={Cleric:['Greater Restoration','Mass Cure Wounds'],Druid:[landAtNine[d.land]],Paladin:['Beacon of Hope','Dispel Magic'],
        Sorcerer:['Legend Lore','Summon Dragon'],Warlock:['Geas','Insect Plague']};
      for (const spell of [...(extras[className]??[]),...(level>=5?fifth[className]??[]:[]),...(level>=7?seventh[className]??[]:[]),...(level>=9?ninth[className]??[]:[]),...(className==='Paladin'&&level>=13?['Freedom of Movement','Guardian of Faith']:[]),...(className==='Paladin'&&level>=17?['Commune','Flame Strike']:[])]) granted.push(namedSpell(spell,index,c.subclass));
    }
    const half=['Paladin','Ranger'].includes(className);
    const maxSpellLevel=half?(className==='Paladin'?paladinProgression(level).slots.at(-1).level:rangerProgression(level).slots.at(-1).level):className==='Warlock'?Math.min(5,Math.ceil(level/2)):Math.ceil(level/2);
    const availableLevels=Array.from({length:maxSpellLevel+1},(_,i)=>i);
    if(className==='Bard'&&level>=6) {
      const pool=unique(['Cleric','Druid','Wizard'].flatMap(name=>spellPool(name,availableLevels)));
      const discoveries=magic('magicalDiscoveries','Magical Discoveries spell',pool,2);
      granted.push(...discoveries.map(spell=>namedSpell(spell,index,'Magical Discoveries')));
    }
    if (className==='Wizard') {
      book.push(...magic('bookBasics','Spellbook level 1 spell',spellPool(className,[1]),level===1?6:8));
      if (level>=3) {
        book.push(...magic('bookAdvanced','Spellbook advancement spell',different(spellPool(className,[1,2]),book),2));
        book.push(...magic('bookSavant','Evocation Savant spell',different(spellPool(className,[1,2]).filter(spell=>spellLists.Wizard[spell][1]==='Evocation'),book),2));
      }
      if(level>=4) book.push(...magic('bookLevelFour','Level 4 spellbook additions',different(spellPool(className,[1,2]),book),2));
      if(level>=5) {
        const pool=spellPool(className,[1,2,3]);
        book.push(...magic('bookLevelFive','Level 5 spellbook additions',different(pool,book),2));
        book.push(magic('bookSavantFive','Level 5 Evocation Savant spell',different(pool.filter(spell=>spellLists.Wizard[spell][1]==='Evocation'),book)));
      }
      for(let at=6;at<=level;at++) {
        const highest=Math.ceil(at/2);
        const pool=spellPool(className,Array.from({length:highest},(_,i)=>i+1));
        book.push(...magic('bookAdded'+at,'Level '+at+' spellbook additions',different(pool,book),2));
        if([7,9,11].includes(at)) {
          const key=at===7?'bookSavantSeven':'bookSavant'+at;
          book.push(magic(key,'Level '+at+' Evocation Savant spell',different(pool.filter(spell=>spellLists.Wizard[spell][1]==='Evocation'),book)));
        }
      }
      classSpells.push(...magic('prepared','Prepared Wizard spell',book,counts[level-1]));
    } else {
      const grantedByClass=granted.filter(row=>row.origin===c.subclass||['Favored Enemy','Paladin’s Smite','Druidic','Faithful Steed','Magical Discoveries'].includes(row.origin)).map(row=>row.name);
      const count=counts[level-1];
      const own=spellPool(className,availableLevels.slice(1));
      const secrets=[];
      if(className==='Bard'&&level>=10) {
        const external=different(unique(['Cleric','Druid','Wizard'].flatMap(name=>spellPool(name,availableLevels.slice(1)))),[...grantedByClass,...own]);
        const requested=Number(magic('secretCount','Magical Secrets from other class lists',Array.from({length:({10:2,11:4,12:5})[level]+1},(_,i)=>String(i))));
        const sixthLevel=unique(['Cleric','Druid','Wizard'].flatMap(name=>spellPool(name,[6])));
        const high=level>=11&&requested?Number(magic('secretHighCount','Level 6 Magical Secrets spells',
          Array.from({length:Math.min(requested,level===11?2:3)+1},(_,i)=>String(i)))):0;
        if(high) secrets.push(...magic('secretHigh','Level 6 Magical Secrets spell',external.filter(name=>sixthLevel.includes(name)),high));
        if(requested>high) secrets.push(...magic('secretSpells','Magical Secrets spell',
          different(external,sixthLevel),requested-high));
      }
      const pool=different(own,grantedByClass);
      const floors=[];
      // External spells share the same preparation budget as Bard-list choices.
      for(const [i,floor] of (spellMinimums[className]?.[level]??[]).entries()) {
        const secretsAtTier=secrets.filter(name=>['Cleric','Druid','Wizard'].some(list=>spellLists[list][name]?.[0]<=i+1)).length;
        floors.push(Math.max(floors.at(-1)??0,floor-secretsAtTier));
      }
      const keys=['preparedBasics','preparedLower','preparedThroughThree','preparedThroughFour','preparedThroughFive'];
      const picks=[];
      const oldFlexible=Array.isArray(previous.prepared)?previous.prepared:[];
      const groups=keys.map((key,i)=>({key,amount:(floors[i]??floors.at(-1)??0)-(floors[i-1]??0)}));
      const overflow=groups.flatMap(({key,amount})=>Array.isArray(previous[key])?previous[key].slice(amount):[]);
      let reserve=[...oldFlexible,...overflow];
      for(const [i,floor] of floors.entries()) {
        const amount=floor-(floors[i-1]??0);
        if(!amount) continue;
        const key=keys[i];
        const allowed=different(pool,picks).filter(spell=>spellLists[className][spell][0]<=i+1);
        const prior=Array.isArray(previous[key])?previous[key].slice(0,amount):[];
        const keep=different(reserve.filter(spell=>allowed.includes(spell)),prior);
        previous={...previous,[key]:[...prior,...keep]};
        picks.push(...magic(key,i===0?'Prepared level 1 spell':'Prepared spell (level '+(i+1)+' or lower)',allowed,amount));
        reserve=different(reserve,picks);
      }
      previous={...previous,prepared:reserve};
      classSpells.push(...picks,...magic('prepared','Prepared class spell',different(pool,picks),count-picks.length-secrets.length),...secrets);
    }
    if (className==='Warlock') {
      slots.push({level:maxSpellLevel,count:level===1?1:level>=11?3:2});
      const expanded=[...simpleInvocations,...(level>=2?secondInvocations:[])];
      if (level>=2) {
        const cantrips=d.cantrips;
        expanded.push(...cantrips.filter(x=>damagingWarlockCantrips.includes(x)).map(x=>'Agonizing Blast · '+x));
        expanded.push(...cantrips.filter(x=>rangedWarlockCantrips.includes(x)).map(x=>'Eldritch Spear · '+x));
        expanded.push(...cantrips.filter(x=>['Chill Touch','Eldritch Blast','Poison Spray'].includes(x)).map(x=>'Repelling Blast · '+x));
      }
      if(level>=9) granted.push(namedSpell('Contact Other Plane',index,'Contact Patron','1 free cast per Long Rest'));
      if(level>=11) {
        const arcanum=magic('arcanumSix','Level 6 Mystic Arcanum',spellPool('Warlock',[6]));
        granted.push(namedSpell(arcanum,index,'Mystic Arcanum','1 free cast per Long Rest'));
      }
      const invocationCount=level>=12?8:level>=9?7:level>=7?6:level>=5?5:level>=2?3:1;
      if(level>=5) {
        expanded.push(...invocationsAtFive);
        if(level>=7) expanded.push('Whispers of the Grave');
        if(level>=9) expanded.push('Visions of Distant Realms');
        const requirements={...invocationPacts,...(level>=9?{'Gift of the Protectors':'Pact of the Tome','Lifedrinker':'Pact of the Blade'}:{}),
          ...(level>=12?{'Devouring Blade':'Thirsting Blade'}:{})};
        const candidate=pickSet(Array.isArray(previous.invocations)?previous.invocations:[],invocationCount,[...expanded,...Object.keys(requirements)],choose);
        expanded.push(...Object.keys(requirements).filter(name=>candidate.includes(requirements[name])&&(name!=='Devouring Blade'||candidate.includes('Pact of the Blade'))));
        previous={...previous,invocations:candidate};
      }
      magic('invocations','Eldritch Invocation',expanded,invocationCount);
      if (d.invocations.includes('Lessons of the First Ones')) gainOrigin('lessonFeat','Lessons of the First Ones feat');
      if (d.invocations.includes('Pact of the Blade')) magic('pactWeapon','Pact weapon',keyList(weaponProfiles).filter(name=>weaponProfiles[name][2].endsWith('Melee')));
      if (d.invocations.includes('Pact of the Tome')) {
        const any=(spellLevel)=>unique(Object.keys(spellLists).flatMap(cls=>spellPool(cls,[spellLevel])));
        const exclude=[...classSpells,...granted.map(spell=>spell.name)];
        const rituals=any(1).filter(name=>Object.values(spellLists).some(list=>list[name]?.[2].includes('R')));
        magic('tomeCantrips','Pact of the Tome cantrip',different(any(0),exclude),3);
        magic('tomeRituals','Pact of the Tome ritual',different(rituals,exclude),2);
        [...d.tomeCantrips,...d.tomeRituals].forEach(name=>granted.push(namedSpell(name,index,'Pact of the Tome')));
      }
      const invocationSpells={'Armor of Shadows':'Mage Armor','Pact of the Chain':'Find Familiar','Fiendish Vigor':'False Life',
        'Mask of Many Faces':'Disguise Self','Misty Visions':'Silent Image','Otherworldly Leap':'Jump','Ascendant Step':'Levitate','Gift of the Depths':'Water Breathing',
        'Master of Myriad Forms':'Alter Self','One with Shadows':'Invisibility','Whispers of the Grave':'Speak with Dead','Visions of Distant Realms':'Arcane Eye'};
      for(const invocation of d.invocations) {
        if (Object.hasOwn(invocationSpells,invocation)) granted.push(namedSpell(invocationSpells[invocation],index,invocation,
          ({'Pact of the Chain':'Cast as a Magic action without a slot','Gift of the Depths':'1 free cast per Long Rest',
            'Ascendant Step':'At will (self only)','One with Shadows':'At will (self only in Dim Light or Darkness)'})[invocation]??'At will'));
      }
    } else {
      const counts=half?[level>=5?4:level>=3?3:2,level>=7?3:2,level>=11?3:2]:
        [Math.min(4,level+1),level>=4?3:2,level>=6?3:2,level>=9?3:level>=8?2:1,level>=10?2:1,1];
      slots.push(...(className==='Paladin'?paladinProgression(level).slots:className==='Ranger'?rangerProgression(level).slots:counts.slice(0,maxSpellLevel).map((count,i)=>({level:i+1,count}))));
    }
  }
  const boostsApplied=d.boost.split(',').map(Number);
  const scores=d.scores.map((score,i)=>score+(boostsApplied[b.boosts.indexOf(i)]??0));
  const baseCon=modifier(scores[2]);
  const conIncreases={};
  const fightingStyles=d.style&&styles.includes(d.style)?[d.style]:[];
  function gainAdvancement(at,prefix,epic=false) {
    const before=modifier(scores[2]);
    const ableToIncrease=scores.some(score=>score<=18)||scores.filter(score=>score<20).length>=2;
    const feats=[...(epic?Object.keys(epicBoons):[]),...(ableToIncrease?['Ability Score Improvement']:[]),
      ...((scores[0]>=13||scores[1]>=13)&&!featNames.includes('Grappler')?['Grappler']:[]),...eligibleOrigin(),
      ...(d.style?different(styles,fightingStyles):[])];
    const feat=choices('abilities',prefix+'Feat','Level '+at+' feat',feats);
    if (feat==='Ability Score Improvement') {
      const increases=[];
      for (const first of priority) {
        if (scores[first]<=18) increases.push(first+','+first);
        if (scores[first]>=20) continue;
        for (const second of priority.slice(priority.indexOf(first)+1)) {
          if (scores[second]<20) increases.push([first,second].sort((a,b)=>a-b).join(','));
        }
      }
      const [first,second]=choices('abilities',prefix+'Boost','Level '+at+' Ability Score Improvement',increases).split(',').map(Number);
      scores[first]++;
      scores[second]++;
      featNames.push(feat);
    } else if(Object.hasOwn(epicBoons,feat)) {
      const allowed=feat==='Boon of Irresistible Offense'?[0,1]:priority;
      const ability=choices('abilities','epicBoonAbility','Level 19 ability increase',allowed.filter(index=>scores[index]<30));
      scores[ability]++;
      featNames.push(feat);
    } else if(feat==='Grappler') {
      const ability=choices('abilities',at===4?'grapplerAbility':prefix+'GrapplerAbility','Grappler ability increase',[0,1]);
      scores[ability]=Math.min(20,scores[ability]+1);
      featNames.push(feat);
    } else if(originFeats.includes(feat)) applyOrigin(prefix+'Origin','Level '+at+' '+feat,feat);
    else {
      featNames.push(feat);
      fightingStyles.push(feat);
    }
    conIncreases[at]=modifier(scores[2])-before;
  }
  if(level>=4) gainAdvancement(4,'advancement');
  if(level>=6&&className==='Fighter') gainAdvancement(6,'fighterSix');
  if(level>=7&&className==='Fighter') fightingStyles.push(training('championStyle','Champion fighting style',different(styles,fightingStyles)));
  if(level>=8) gainAdvancement(8,'advancementEight');
  if(level>=10&&className==='Rogue') gainAdvancement(10,'rogueTen');
  if(level>=12) gainAdvancement(12,'advancementTwelve');
  if(className==='Fighter'&&level>=14) gainAdvancement(14,'fighterFourteen');
  if(['Fighter','Rogue','Barbarian','Monk','Paladin','Ranger'].includes(className)&&level>=16) gainAdvancement(16,'advancementSixteen');
  if(['Fighter','Rogue','Barbarian','Monk','Paladin','Ranger'].includes(className)&&level>=19) gainAdvancement(19,'epicBoon',true);
  if(className==='Barbarian'&&level>=20) {
    const previousCon=modifier(scores[2]);
    scores[0]=Math.min(25,scores[0]+4);
    scores[2]=Math.min(25,scores[2]+4);
    // Retroactive HP: the new Constitution modifier applies to every Hit Die.
    conIncreases[20]=(conIncreases[20]??0)+modifier(scores[2])-previousCon;
  }
  if(className==='Monk'&&level>=20) {
    // Body and Mind: DEX/WIS +4, max 25; no Constitution HP retroactivity.
    scores[1]=Math.min(25,scores[1]+4);
    scores[4]=Math.min(25,scores[4]+4);
  }
  if(className==='Rogue'&&level>=6) baseExpertise.push(...training('expertiseSix','Additional Expertise',different(trained,baseExpertise),2));
  if(['Bard','Ranger'].includes(className)&&level>=9) baseExpertise.push(...training('expertiseNine','Additional Expertise',different(trained,baseExpertise),2));
  return {draft:d,scores,baseCon,conIncreases,fightingStyles,controls,trained,profTools:unique(profTools),expertise:baseExpertise,featNames,granted,classSpells,book,slots,classAbility,inventory,inKit};
}

export function generateCharacter({className,level=3,method,gear=true}={},rng=Math.random) {
  const eligible=Object.keys(classes).filter(name=>levelsFor(name).includes(level));
  const selected=className??eligible[Math.floor(rng()*eligible.length)];
  return build({className:selected,level,method,higherGear:'standard'},{rng,gear}).draft;
}
function seeded(seed) {
  return ()=> {
    seed=(Math.imul(1664525,seed)+1013904223)>>>0;
    return seed/4294967296;
  };
}
export function templateCharacter(className) {
  const [ancestry,background,name]=templateOrigins[className];
  const index=keyList(classes).indexOf(className);
  const data={className,species:ancestry,background,name,level:3,method:'array',hpMethod:'fixed',kit:'A',backgroundKit:'A',
    alignment:'Neutral Good',boost:'2,0,1',higherGear:'standard',shield:'Equipped',
    armor:classes[className].kits.A.items.find(item=>Object.hasOwn(armorProfiles,item)),story:hooks[index%hooks.length],trinket:trinkets[index%trinkets.length]};
  const prefs={
    Barbarian:{mastery:['Greataxe','Handaxe'],lineage:'Stone'},
    Bard:{instruments:['Flute','Lute','Drum'],instrument:'Lute',cantrips:['Vicious Mockery','Mage Hand'],preparedBasics:['Healing Word','Faerie Fire','Dissonant Whispers','Thunderwave'],prepared:['Invisibility','Shatter']},
    Cleric:{order:'Protector',cantrips:['Guidance','Sacred Flame','Thaumaturgy'],prepared:['Healing Word','Guiding Bolt','Sanctuary','Spiritual Weapon','Hold Person','Detect Magic']},
    Druid:{lineage:'Wood Elf',order:'Magician',land:'Temperate',wildShapes:['Wolf','Spider','Cat','Riding Horse'],cantrips:['Guidance','Produce Flame','Shillelagh'],prepared:['Entangle','Goodberry','Faerie Fire','Moonbeam','Pass without Trace','Enhance Ability']},
    Fighter:{style:'Defense',mastery:['Greatsword','Flail','Javelin'],humanFeat:'Alert'},
    Monk:{monkTool:'Woodcarver’s Tools'},
    Paladin:{style:'Defense',mastery:['Longsword','Javelin'],lineage:'Gold',prepared:['Bless','Cure Wounds','Heroism','Searing Smite']},
    Ranger:{style:'Archery',mastery:['Longbow','Shortsword'],prey:'Colossus Slayer',prepared:['Cure Wounds','Goodberry','Ensnaring Strike','Longstrider']},
    Rogue:{lineage:'Infernal',mastery:['Dagger','Shortbow']},
    Sorcerer:{lineage:'Blue',cantrips:['Fire Bolt','Mage Hand','Minor Illusion','Prestidigitation'],preparedBasics:['Magic Missile','Shield','Mage Armor'],prepared:['Misty Step','Web','Scorching Ray'],metamagic:['Quickened Spell','Subtle Spell']},
    Warlock:{lineage:'Forest Gnome',cantrips:['Eldritch Blast','Mage Hand'],preparedBasics:['Hex','Hellish Rebuke'],prepared:['Misty Step','Hold Person'],invocations:['Pact of the Chain','Agonizing Blast · Eldritch Blast','Eldritch Mind']},
    Wizard:{lineage:'High Elf',cantrips:['Fire Bolt','Mage Hand','Minor Illusion'],bookBasics:['Detect Magic','Feather Fall','Mage Armor','Magic Missile','Sleep','Thunderwave','Shield','Find Familiar'],
      bookAdvanced:['Misty Step','Web'],bookSavant:['Shatter','Scorching Ray'],prepared:['Magic Missile','Mage Armor','Shield','Misty Step','Web','Scorching Ray']}
  };
  const priority=classes[className].priority;
  const [first,second]=[...backgrounds[background].boosts].sort((a,b)=>priority.indexOf(a)-priority.indexOf(b));
  data.boost=backgrounds[background].boosts.map(n=>n===first?2:n===second?1:0).join(',');
  return build({...data,...prefs[className]},{rng:seeded(721+index)}).draft;
}

export function migrateDraft(old) {
  if (old?.model===2) {
    if(old.advancementFeat==='Ability Score Improvement'&&/^[0-5],[0-5]$/.test(old.advancementBoost)) {
      const boost=old.advancementBoost.split(',').sort().join(',');
      if(boost!==old.advancementBoost) return {...old,advancementBoost:boost};
    }
    if(old.className==='Druid'&&old.level===8&&Array.isArray(old.wildShapes)&&old.wildShapes.length===6) {
      const expanded=build(old).draft.wildShapes;
      if(old.wildShapes.every((form,index)=>form===expanded[index])) return {...old,wildShapes:expanded};
    }
    if(old.className==='Sorcerer'&&[7,8].includes(old.level)) {
      const fields=['preparedBasics','preparedLower','preparedThroughThree','prepared'];
      if(fields.some(key=>Array.isArray(old[key])&&old[key].some(name=>draconicAtSeven.includes(name)))) {
        const repaired=build(old).draft;
        return {...old,...Object.fromEntries(fields.filter(key=>Object.hasOwn(repaired,key)).map(key=>[key,repaired[key]]))};
      }
    }
    return old;
  }
  if (!old || typeof old!=='object') return initialDraft();
  return build({...old,level:1,className:'Fighter',background:'Soldier',species:'Human',
    boost:old.boosts?.join(','),classSkills:old.fighter,humanSkill:old.human,humanFeat:old.feat,
    humanFeatSkilled:old.skilled,gamingSet:old.game+' gaming set',
    armor:old.wear ? classes.Fighter.kits[old.kit]?.armor : 'Unarmored'}).draft;
}
export const initialDraft = () => build({className:'Fighter',species:'Human',background:'Soldier',alignment:'Neutral',level:1,boost:'2,0,1',style:'Defense',
  classSkills:['Perception','Survival'],humanSkill:'Insight',mastery:['Greatsword','Flail','Javelin']}).draft;

const compare = (expected, actual) => {
  if (expected===actual) return true;
  return expected&&actual&&typeof expected==='object'&&typeof actual==='object'&&
    Array.isArray(expected)===Array.isArray(actual)&&Object.keys(expected).length===Object.keys(actual).length&&
    Object.keys(expected).every(key=>Object.hasOwn(actual,key)&&compare(expected[key],actual[key]));
};
export function validateCharacter(d) {
  if (!d||typeof d!=='object') return ['Choose a character to validate.'];
  if (d.model!==2) return validateLegacy(d);
  if (typeof d.name!=='string'||!d.name.trim()||d.name.length>80) return ['Enter a character name of 1–80 characters.'];
  if (!validateCustomList(d.custom)) return ['Review custom entries. Names, categories, and IDs must be valid and IDs unique.'];
  try {
    const compatible=migrateDraft(d);
    const expected=build(compatible).draft;
    return compare(expected,compatible)?[]:['One or more choices are incompatible with the character’s class, level, or origin.'];
  } catch {
    return ['One or more character choices are invalid.'];
  }
}

export function deriveCharacter(d) {
  const {scores,baseCon,conIncreases,fightingStyles,trained,profTools,expertise,featNames,granted,classSpells,book,slots,classAbility,inventory,inKit}=build(d);
  const c=classes[d.className];
  const s=species[d.species];
  const b=backgrounds[d.background];
  const mods=scores.map(modifier);
  const proficiency=2+Math.floor((d.level-1)/4);
  const fighter=d.className==='Fighter'?fighterProgression(d.level):null;
  const barbarian=d.className==='Barbarian'?barbarianProgression(d.level):null;
  const monk=d.className==='Monk'?monkProgression(d.level):null;
  const paladin=d.className==='Paladin'?paladinProgression(d.level):null;
  const ranger=d.className==='Ranger'?rangerProgression(d.level):null;
  const customArmor=d.custom.find(entry=>entry.type==='Armor'&&'custom:'+entry.id===d.armor);
  const customShield=d.custom.find(entry=>entry.type==='Armor'&&entry.category==='Shield'&&'custom:'+entry.id===d.shield);
  const armor=customArmor?[customArmor.ac,customArmor.category,customArmor.strength,customArmor.stealth]:armorProfiles[d.armor];
  const usingShield=d.shield==='Equipped'||Boolean(customShield);
  const armorTraining=[...c.armor,...(d.order==='Protector'?['Heavy']:d.order==='Warden'?['Medium']:[])];
  const shieldBonus=armorTraining.includes('Shield')?(customShield?.ac??(usingShield?2:0)):0;
  const unarmored=10+mods[1];
  let baseAC=unarmored;
  if (armor) baseAC=armor[0]+(armor[1]==='Heavy'?0:armor[1]==='Medium'?Math.min(2,mods[1]):mods[1]);
  else if (d.className==='Barbarian') baseAC=Math.max(baseAC,unarmored+mods[2]);
  else if (d.className==='Monk'&&!usingShield) baseAC=Math.max(baseAC,unarmored+mods[4]);
  else if (d.className==='Sorcerer'&&d.level>=3) baseAC=Math.max(baseAC,unarmored+mods[5]);
  const defenseBonus=armor&&fightingStyles.includes('Defense')?1:0;
  const ac=baseAC+shieldBonus+defenseBonus;
  const speed=(d.species==='Goliath'||d.lineage==='Wood Elf'?35:30)
    +(monk&&monk.focus&&!armor&&!usingShield?monk.movement:
      ((d.className==='Barbarian'&&d.level>=5||d.className==='Ranger'&&d.level>=6)&&armor?.[1]!=='Heavy'?10:0))-(armor&&scores[0]<armor[2]?10:0);
  let hp=c.die+baseCon;
  let currentCon=baseCon;
  const hpSteps=[];
  for(let at=2;at<=d.level;at++) {
    const increase=conIncreases[at]??0;
    const die=d.hpMethod==='rolled'?d.hpRolls[at-2]:c.die/2+1;
    const gain=Math.max(1,die+currentCon);
    hpSteps.push({level:at,die,con:currentCon,gain,retroactive:at*increase});
    hp+=gain+at*increase;
    currentCon+=increase;
  }
  const speciesHP=d.species==='Dwarf'?d.level:0;
  const subclassHP=d.className==='Sorcerer'&&d.level>=3?d.level:0;
  const hpParts={first:c.die+baseCon,advancement:hp-(c.die+baseCon),species:speciesHP,subclass:subclassHP};
  hp+=speciesHP+subclassHP;
  const skillChecks=Object.entries(skills).map(([name,ability])=>{
    const hasTraining=trained.includes(name);
    const expert=expertise.includes(name);
    const jack=d.className==='Bard'&&d.level>=2&&!hasTraining;
    const orderBonus=d.order==='Thaumaturge'&&['Arcana','Religion'].includes(name)||d.order==='Magician'&&['Arcana','Nature'].includes(name);
    return {name,trained:hasTraining,expert,jack,total:mods[ability]+(orderBonus?Math.max(1,mods[4]):0)+(expert?2*proficiency:hasTraining?proficiency:jack?Math.floor(proficiency/2):0)};
  });
  const features=c.features.slice(0,d.level).flat().map(name=>{
    if(fighter?.critical===18&&name.startsWith('Improved Critical')) return 'Superior Critical (18–20 with weapons and Unarmed Strikes)';
    if(fighter?.surge===2&&name.startsWith('Action Surge')) return 'Action Surge (2 uses per Short or Long Rest, once per turn)';
    if(name.startsWith('Rage (')) return 'Rage ('+barbarian.rages+' uses, +'+barbarian.rageDamage+' damage)';
    if(d.level<4) return name;
    if(name.startsWith('Second Wind (')) return 'Second Wind ('+fighter.secondWind+' uses)';
    if(d.level>=5&&name.startsWith('Sneak Attack (')) return 'Sneak Attack ('+Math.ceil(d.level/2)+'d6)';
    if(d.level>=5&&name.startsWith('Martial Arts (')) return 'Martial Arts (d'+monk.martialDie+')';
    if(d.level>=5&&name.startsWith('Favored Enemy (')) return 'Favored Enemy ('+ranger.favoredEnemy+' free Hunter’s Mark casts)';
    if(d.level>=5&&name.startsWith('Bardic Inspiration (')) return 'Bardic Inspiration ('+(d.level>=10?'d10':'d8')+', Charisma modifier uses, minimum 1)';
    return name;
  });
  if(d.className==='Monk'&&d.level>=4) features.push('Slow Fall (reduce falling damage by '+5*d.level+')');
  if(d.level>=5) {
    if(extraAttackClasses.includes(d.className)&&!(d.className==='Fighter'&&d.level>=11)) features.push('Extra Attack (2 attacks when you take the Attack action)');
    if(d.invocations?.includes('Thirsting Blade')) features.push(d.invocations.includes('Devouring Blade')?'Devouring Blade (3 attacks with your pact weapon)':'Thirsting Blade (Extra Attack with your pact weapon)');
    features.push(...featuresAtFive[d.className]??[]);
  }
  if(d.level>=6) features.push(...featuresAtSix[d.className]??[]);
  if(d.level>=7) features.push(...featuresAtSeven[d.className]??[]);
  if(d.level>=9) features.push(...featuresAtNine[d.className]??[]);
  if(fighter?.indomitable>1) features.push('Indomitable: '+fighter.indomitable+' uses per Long Rest');
  if(d.level>=10) features.push(...featuresAtTen[d.className]??[]);
  if(d.level>=11&&fighter?.attacks!==4) features.push(...featuresAtEleven[d.className]??[]);
  if(monk) {
    if(monk.deflectEnergy) features.push('Deflect Energy: Deflect Attacks now works against any damage type.');
    if(monk.disciplinedSurvivor) features.push('Disciplined Survivor: proficiency in every saving throw; spend 1 Focus Point to reroll a failed save (new roll must be used).');
    if(monk.perfectFocus) features.push('Perfect Focus: on Initiative, if 3 or fewer Focus Points remain and Uncanny Metabolism is not used, regain Focus until 4 remain.');
    if(monk.quiveringPalm) features.push('Quivering Palm (Open Hand): after a confirmed Unarmed Strike hit, spend 4 Focus Points; one target at a time, 10d12 Force on failed Constitution save (half on success); DM tracks target and days.');
    if(monk.superiorDefense) features.push('Superior Defense: at the start of your turn spend 3 Focus Points for 1 minute of Resistance to damage except Force; ends if Incapacitated. DM tracks duration.');
    if(monk.bodyAndMind) features.push('Body and Mind: Dexterity and Wisdom +4, maximum 25 (included in derived abilities).');
  }
  if(paladin) {
    if(paladin.restoringTouch) features.push('Restoring Touch: when using Lay On Hands, spend 5 pool points per Blinded, Charmed, Deafened, Frightened, Paralyzed, or Stunned condition removed.');
    if(paladin.smiteProtection) features.push('Smite of Protection (Devotion): you and allies within Aura of Protection gain Half Cover after Divine Smite until the start of your next turn (DM tracks).');
    if(paladin.auraRadius===30) features.push('Aura Expansion: Aura of Protection, Courage, and Devotion expand to 30 feet.');
    if(paladin.holyNimbus) features.push('Holy Nimbus (Devotion): Bonus Action for up to 10 minutes; radiant aura damage and Holy Ward; once per Long Rest or recharge with a level 5 spell slot.');
  }
  if(ranger){
    if(ranger.relentlessHunter) features.push('Relentless Hunter: taking damage cannot break Concentration on Hunter’s Mark (Incapacitation still ends it).');
    if(ranger.naturesVeil) features.push('Nature’s Veil: Bonus Action to become Invisible until the end of your next turn; Wisdom modifier uses (minimum 1) per Long Rest. DM tracks duration.');
    if(ranger.superiorDefense) features.push('Superior Hunter’s Defense (Hunter): Reaction to gain Resistance to triggering damage and that damage type until the end of the current turn.');
    if(ranger.preciseHunter) features.push('Precise Hunter: Advantage on attacks against the creature currently marked by Hunter’s Mark.');
    if(ranger.feralSenses) features.push('Feral Senses: Blindsight within 30 feet.');
    if(ranger.foeSlayer) features.push('Foe Slayer: Hunter’s Mark bonus damage increases from d6 to d10.');
  }
  if(d.className==='Barbarian') {
    if(d.level>=13) features.push('Improved Brutal Strike: Staggering Blow and Sundering Blow options (DM resolves target effects).');
    if(d.level>=14) features.push('Intimidating Presence (Berserker): Bonus Action, 30-foot Emanation; Wisdom save DC '+(8+proficiency+mods[0])+', once per Long Rest or recharge with a Rage use.');
    if(d.level>=15) features.push('Persistent Rage: optionally refresh all Rage uses when rolling Initiative, once per Long Rest; Rage lasts up to 10 minutes.');
    if(d.level>=17) features.push('Brutal Strike: 2d10 extra damage and two different effects for one eligible hit (DM resolves effects).');
    if(d.level>=18) features.push('Indomitable Might: Strength checks and saving throws cannot total below Strength score '+scores[0]+'.');
    if(d.level>=20) features.push('Primal Champion: Strength and Constitution +4, maximum 25 (included in derived scores and HP).');
  }
  if(d.className==='Rogue') {
    if(d.level>=13) features.push('Use Magic Device (Thief): attune up to four magic items; magic-item charge and Spell Scroll rules are resolved with the DM.');
    if(d.level>=14) features.push('Devious Strikes: Daze (2d6), Knock Out (6d6), or Obscure (3d6) added to Cunning Strike.');
    if(d.level>=15) features.push('Slippery Mind: gain proficiency in Wisdom and Charisma saving throws.');
    if(d.level>=17) features.push('Thief’s Reflexes: two turns in the first combat round, at Initiative and Initiative minus 10 (not an automatic round tracker).');
    if(d.level>=18) features.push('Elusive: attack rolls cannot have Advantage against you unless Incapacitated.');
    if(d.level>=20) features.push('Stroke of Luck: turn a failed D20 Test into 20, once per Short or Long Rest.');
  }
  if(fighter&&d.level>=13) features.push('Studied Attacks: after missing, gain Advantage on your next attack against that creature before the end of your next turn.');
  if(fighter?.survivor) features.push('Survivor: Advantage on Death Saving Throws, and 18–20 restores 1 HP. Heroic Rally heals '+(5+mods[2])+' HP at the start of your turn while Bloodied with at least 1 HP.');
  if(Object.hasOwn(epicBoons,d.epicBoonFeat)) features.push(d.epicBoonFeat+': '+epicBoons[d.epicBoonFeat]);
  if(fighter?.attacks===4) features.push('Three Extra Attacks: four attacks when you take the Attack action.');
  if(d.className==='Druid'&&d.level>=10) features.push(({Arid:'Fire',Polar:'Cold',Temperate:'Lightning',Tropical:'Poison'})[d.land]+' resistance from Nature’s Ward');
  if(d.fiendishResilience) features.push(d.fiendishResilience+' resistance from Fiendish Resilience');
  for(const key of ['elementalAffinity','blessedStrikes','elementalFury','defensiveTactics','championStyle']) {
    if(d[key]) features.push(d[key]+(key==='elementalAffinity'?' resistance; add Charisma modifier to one matching damage roll':''));
  }
  const traits=s.traits.map(name=>name.replace('(2 uses','('+proficiency+' uses').replace('1d10, DEX save',d.level>=17?'4d10, DEX save':d.level>=11?'3d10, DEX save':d.level>=5?'2d10, DEX save':'1d10, DEX save'));
  if(d.level>=5&&d.species==='Dragonborn') traits.push('Draconic Flight (10 minutes, Fly Speed equal to Speed; once per Long Rest)');
  if(d.level>=5&&d.species==='Goliath') traits.push('Large Form (10 minutes, +10 ft Speed and Advantage on Strength checks; once per Long Rest)');
  if (d.species==='Dragonborn') traits.push(s.lineages[d.lineage]+' resistance and breath damage · DC '+(8+proficiency+mods[2]));
  if (d.species==='Goliath') traits.push(s.lineages[d.lineage]);
  if (d.species==='Tiefling') traits.push(s.lineages[d.lineage][2]+' resistance');
  const training=martialTraining(d,c);
  const monkRules=d.className==='Monk'&&!armor&&!usingShield;
  const martialDie=monk?'1d'+monk.martialDie:'1d6';
  const attacks=unique([...inKit,...(d.pactWeapon?[d.pactWeapon]:[])]).map(name=>{
    const [dice,type,category, properties, mastery]=weaponProfiles[name];
    const ranged=category.endsWith('Ranged');
    const finesse=properties.includes('Finesse');
    const monk=monkRules&&!ranged&&(category.startsWith('Simple')||properties.includes('Light'));
    const pact=d.pactWeapon===name;
    const scoreIndex=(finesse||monk)?(mods[1]>=mods[0]?1:0):ranged?1:0;
    const mod=pact?Math.max(mods[5],mods[scoreIndex]):mods[scoreIndex];
    const minAbility=ranged?1:0;
    const proficient=pact||weaponTrained(name,training);
    const otherBonus=ranged&&fightingStyles.includes('Archery')?2:0;
    // ability/proficient/otherBonus explain `bonus` (attack) and `mod` (damage) for the Play attack panel.
    return {name,dice:monk&&(dice==='1d4'||dice==='1d6'&&d.level>=5||dice==='1d8'&&d.level>=11)?martialDie:dice,type,mod,bonus:mod+(proficient?proficiency:0)+otherBonus,
      properties,mastery:d.mastery?.includes(name)?mastery:null,disadvantage:properties.includes('Heavy')&&scores[minAbility]<13,
      note:pact?'Pact weapon. May deal Necrotic, Psychic, Radiant, or its normal type.':'',
      ability:pact&&mods[5]>mods[scoreIndex]?5:scoreIndex,proficient,otherBonus,finesse,ranged,monk:Boolean(monk)};
  });
  const unarmedMod=monkRules?Math.max(mods[0],mods[1]):mods[0];
  attacks.push({name:'Unarmed Strike',dice:monkRules?martialDie:'1',mod:unarmedMod,bonus:unarmedMod+proficiency,type:'Bludgeoning',
    ability:monkRules&&mods[1]>mods[0]?1:0,proficient:true,otherBonus:0,unarmed:true,monk:monkRules});
  const extras=d.custom.filter(entry=>entry.type==='Weapon').map(entry=>{
    const index=entry.ability==='Finesse'?(mods[0]>mods[1]?0:1):abilities.indexOf(entry.ability);
    return {name:entry.name,dice:entry.dice,type:entry.damageType,mod:(mods[index]??0)+entry.bonus,
      bonus:(mods[index]??0)+(entry.trained?proficiency:0)+entry.bonus,properties:entry.properties,custom:true,
      ability:index,proficient:Boolean(entry.trained),otherBonus:entry.bonus,damageBonus:entry.bonus};
  });
  const known=[...classSpells.map(name=>namedSpell(name,classAbility,d.className)),...granted].map(spell=>{
    const metadata=Object.values(spellLists).find(list=>Object.hasOwn(list,spell.name))?.[spell.name];
    return {...spell,level:metadata?.[0],tags:metadata?.[2],dc:8+proficiency+mods[abilities.indexOf(spell.ability)],attack:proficiency+mods[abilities.indexOf(spell.ability)]};
  });
  return {scores,mods,hp,ac,speed,proficiency,fighter,barbarian,hpParts,hpSteps,acParts:{baseAC,shieldBonus,defenseBonus},xp:xp[d.level-1],nextXP:xp[d.level]??null,dice:d.level+'d'+c.die,
    initiative:mods[1]+(featNames.includes('Alert')?proficiency:0),initiativeAdvantage:d.className==='Fighter'&&d.level>=3||d.className==='Barbarian'&&d.level>=7,
    passive:10+skillChecks.find(skill=>skill.name==='Perception').total,skills:skillChecks,
    auraBonus:d.className==='Paladin'&&d.level>=6?Math.max(1,mods[5]):0,
    auraRadius:paladin?.auraRadius??0,
    climbSpeed:d.className==='Ranger'&&d.level>=6||d.className==='Rogue'&&d.level>=3?speed:null,
    swimSpeed:d.className==='Ranger'&&d.level>=6||d.invocations?.includes('Gift of the Depths')?speed:null,
    saves:mods.map((mod,i)=>mod+(c.saves.includes(i)||monk?.disciplinedSurvivor||d.className==='Rogue'&&d.level>=15&&[4,5].includes(i)?proficiency:0)),
    languages:['Common',...d.languages,...(d.extraLanguages??[]),...(d.className==='Rogue'?['Thieves’ Cant']:d.className==='Druid'?['Druidic']:[])],
    features,traits,featNames,inventory,gp:c.kits[d.kit].gp+(d.backgroundKit==='A'?b.gp:50),proficientTools:profTools,armorTraining,weaponTraining:training,
    armor:customArmor?.name??d.armor??'Unarmored', armorUntrained:Boolean(armor&&!armorTraining.includes(armor[1])),
    shield:customShield?.name??(usingShield?'Shield':null), shieldUntrained:usingShield&&!armorTraining.includes('Shield'),
    stealthDisadvantage:Boolean(armor?.[3]),attacks:[...attacks,...extras],known,slots,book,
    subclass:d.level>=3?c.subclass:null
  };
}
