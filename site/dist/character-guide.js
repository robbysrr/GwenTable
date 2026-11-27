import {copy} from './locale.js';
import {abilities, skills} from './lib/rules.js';
import {metricText, weaponDistances} from './lib/distances.js';
import {weaponProfiles} from './lib/catalog.js';
import {armorProfiles} from './lib/character.js';
import {gearDescription, skillIntro} from './choice-reference.js';

export const abilityGuide=[
  'Physical power. Used to lift, push, grapple, or strike with most melee weapons.',
  'Coordination and reflexes. Helps initiative, ranged attacks, and Armor Class when your armor allows it.',
  'Stamina and resilience. Raises maximum Hit Points and helps you maintain Concentration after taking damage.',
  'Reasoning and memory. Helps you investigate and recall lore. Wizards cast using Intelligence.',
  'Awareness and judgment. Helps you notice danger, read people, and navigate. Clerics, Druids, and Rangers cast using Wisdom.',
  'Presence and force of personality. Helps you influence others. Bards, Paladins, Sorcerers, and Warlocks cast using Charisma.'
];
export const skillLabel=name=>Object.hasOwn(skills,name)?name+' ('+abilities[skills[name]].slice(0,3).toUpperCase()+')':name;
const examples={
  Acrobatics:'Keep your footing on a narrow, swaying bridge.',
  'Animal Handling':'Calm a horse spooked by thunder.',
  Arcana:'Recognize what a strange magical symbol means.',
  Athletics:'Climb a wall with few handholds.',
  Deception:'Convince a guard your invitation was lost.',
  History:'Identify the crest on a forgotten monument.',
  Insight:'Tell whether a merchant seems afraid.',
  Intimidation:'Demand that a lookout back away from the door.',
  Investigation:'Work out how the secret panel opens.',
  Medicine:'Determine what caused a traveler’s fever.',
  Nature:'Identify a poisonous plant.',
  Perception:'Hear footsteps behind a closed door.',
  Performance:'Keep a tavern crowd listening to your ballad.',
  Persuasion:'Ask a guard to give a lost traveler directions.',
  Religion:'Recognize the rite depicted on a temple wall.',
  'Sleight of Hand':'Palm a coin while someone watches.',
  Stealth:'Slip past a dozing guard without being noticed.',
  Survival:'Follow tracks after a storm.'
};
export const skillExample=name=>Object.hasOwn(examples,name)?copy(examples[name]):skillIntro[name]??'Use this proficiency when your DM calls for a relevant check.';
export const heightGuide={
  Dragonborn:{Medium:'5–7 ft (1.5–2.1 m)'}, Dwarf:{Medium:'4–5 ft (1.2–1.5 m)'},
  Elf:{Medium:'5–6 ft (1.5–1.8 m)'}, Gnome:{Small:'3–4 ft (0.9–1.2 m)'},
  Goliath:{Medium:'7–8 ft (2.1–2.4 m)'}, Halfling:{Small:'2–3 ft (0.6–0.9 m)'},
  Human:{Small:'2–4 ft (0.6–1.2 m)',Medium:'4–7 ft (1.2–2.1 m)'},
  Orc:{Medium:'6–7 ft (1.8–2.1 m)'}, Tiefling:{Small:'3–4 ft (0.9–1.2 m)',Medium:'4–7 ft (1.2–2.1 m)'}
};
export function sizeGuide(species,size) {
  return copy('Typically {height} tall. {size} creatures usually control a 5 × 5 ft (1.5 × 1.5 m) space in combat.',{height:heightGuide[species]?.[size],size});
}
export const speciesGuide={
  Dragonborn:'Dragonlike folk whose draconic ancestry shapes their breath weapon and resistance.',
  Dwarf:'Folks of exceptional endurance, with ancestral ties to stone and craft.',
  Elf:'Long-lived folk with fey ancestry and magic shaped by their lineage.',
  Gnome:'Small folk with keen minds whose lineages reflect forest magic or clever inventions.',
  Goliath:'Tall descendants of giants, carrying a supernatural gift from a particular giant ancestry.',
  Halfling:'Small, nimble folk known for courage and remarkable luck.',
  Human:'Adaptable folk with diverse cultures, sizes, interests, and talents.',
  Orc:'Powerful folk with sharp night vision and a reserve of stamina for sudden bursts of action.',
  Tiefling:'Folk touched by the Lower Planes, with magic and resistance shaped by their fiendish legacy.'
};
const lineages={
  Drow:'Underdark-adapted elves with longer Darkvision and magic that shapes light and darkness.',
  'High Elf':'Elves with a talent for arcane tricks, detecting magic, and short-range teleportation.',
  'Wood Elf':'Swift elves with woodland magic that helps them travel quietly and cover ground.',
  'Forest Gnome':'Forest magic grants Minor Illusion and lets you speak with animals.',
  'Rock Gnome':'Tinkering magic lets you repair objects and make tiny devices.',
  Abyssal:'Abyssal magic brings poison resistance and spells that weaken or restrain.',
  Chthonic:'Chthonic magic brings necrotic resistance and magic that saps or bolsters vitality.',
  Infernal:'Infernal magic brings fire resistance and spells that burn or obscure.',
  Cloud:'Cloud Giant ancestry lets you teleport a short distance.',
  Fire:'Fire Giant ancestry adds a burst of Fire damage to a hit.',
  Frost:'Frost Giant ancestry adds Cold damage and slows a target.',
  Hill:'Hill Giant ancestry can knock a smaller target Prone.',
  Stone:'Stone Giant ancestry lets you reduce damage you take.',
  Storm:'Storm Giant ancestry lets you retaliate with Thunder damage.'
};
export function lineageGuide(name,benefit) {
  return lineages[name]?copy(lineages[name]):typeof benefit==='string'?copy('Your {name} draconic ancestry gives you {type} resistance and sets your breath weapon’s damage type.',{name:name.toLowerCase(),type:benefit}):'';
}

export const masteryGuide={
  Cleave:'After a melee hit, make a second attack against another target within 5 ft / 1.5 m of the first and within reach. The second hit normally omits your ability modifier to damage. Once per turn.',
  Graze:'On a miss, deal damage equal to the ability modifier used for the attack.',
  Nick:'Make the extra attack granted by the Light property as part of the Attack action. Once per turn.',
  Push:'On a hit, push a Large or smaller target up to 10 ft / 3 m straight away from you.',
  Sap:'On a hit, the target has Disadvantage on its next attack roll before your next turn.',
  Slow:'On a damaging hit, reduce the target’s Speed by 10 ft / 3 m until your next turn. Multiple Slow hits do not stack.',
  Topple:'On a hit, the target must make a Constitution saving throw or fall Prone. The DC is 8 + Proficiency Bonus + the ability modifier used for the attack.',
  Vex:'On a damaging hit, gain Advantage on your next attack against the same target before the end of your next turn.'
};
const weaponLooks={
  Longsword:'A straight, double-edged blade with a grip long enough for either one or two hands.', Greatsword:'A long, heavy blade with a two-handed grip.',
  Shortsword:'A short blade built for close quarters.', Dagger:'A short, pointed blade that can be wielded or thrown.',
  Greataxe:'A large axe head on a long haft.', Handaxe:'A compact axe that can be swung or thrown.', Flail:'A striking head attached to a handle by a chain.',
  Javelin:'A light spear shaped for throwing.', Spear:'A pointed head on a straight shaft.', Quarterstaff:'A straight wooden fighting staff.',
  Shortbow:'A compact bow for shooting arrows.', Longbow:'A tall bow with a long draw.', Crossbow:'A bow mounted on a stock that fires bolts.',
  Rapier:'A narrow thrusting sword with a protective hilt.', Scimitar:'A curved blade for quick cutting strikes.',
  Mace:'A weighted head on a short handle.', Sickle:'A curved hook-shaped blade.'
};
export function equipmentDetail(displayName) {
  let name=displayName.replace(/^\d+ /,'').replace(/^(?:Arcane|Druidic) Focus \(Quarterstaff\)$/,'Quarterstaff');
  if(!Object.hasOwn(weaponProfiles,name)&&Object.hasOwn(weaponProfiles,name.slice(0,-1))) name=name.slice(0,-1);
  const weapon=Object.hasOwn(weaponProfiles,name)?weaponProfiles[name]:null;
  if(weapon) {
    const [damage,type,category,properties,mastery]=weapon;
    const reach=category.endsWith('Melee')?' Reach '+(properties.includes('Reach')?'10 ft / 3 m.':'5 ft / 1.5 m.'):'';
    return {description:(weaponLooks[name]??(name.includes('Crossbow')?weaponLooks.Crossbow:'A '+category.toLowerCase()+' weapon.'))+' Deals '+damage+' '+type+' damage. '+weaponDistances(properties)+reach,page:91,mastery};
  }
  if(Object.hasOwn(armorProfiles,name)) {
    const [ac,category,strength,stealth]=armorProfiles[name];
    const dex=category==='Heavy'?'No Dexterity modifier.':category==='Medium'?'Add Dexterity, to a maximum of +2.':'Add your Dexterity modifier.';
    return {description:gearLooks[name]+' Base AC '+ac+'. '+dex+(strength?' Strength '+strength+' avoids the Speed penalty.':'')+
      (stealth?' Disadvantage on Stealth checks.':''),page:92};
  }
  const description=gearDescription(displayName)??(name==='Pouches'?'Small bags worn on a belt. Use them to carry coins or other small objects.':'');
  const appearance=Object.hasOwn(gearLooks,name)?gearLooks[name]:name.includes('Pack')?'A packed bundle of supplies.':
    name.includes('Kit')?'A bundle of specialized supplies.':name.includes('gaming set')?'A small set of pieces, cards, or dice.':'';
  return {description:[appearance,metricText(description)].filter(Boolean).join(' '),page:equipmentPage(name)};
}
const gearLooks={
  'Leather Armor':'Supple leather shaped into a protective coat.', 'Studded Leather Armor':'Flexible leather reinforced with closely set metal studs.',
  'Chain Shirt':'A shirt woven from metal rings.', 'Chain Mail':'A longer garment of interlocking metal rings.',
  Shield:'A hand-held board or plate with a grip or straps.', Quiver:'A tube or case with a strap.', 'Spellbook':'A bound book of magical notation.',
  Crowbar:'A bent metal bar with a flattened end.', 'Healer’s Kit':'A pouch with bandages, salves, and splints.',
  Robe:'A loose, long outer garment.', 'Traveler’s Clothes':'Sturdy everyday clothing suitable for the road.'
};

function equipmentPage(name) {
  if(name.endsWith('(trinket)')) return 22;
  if(name==='Shield') return 92;
  if(/gaming set|Woodcarver|Thieves’ Tools|Herbalism Kit|Lute/.test(name)) return 94;
  if(name.startsWith('Calligrapher')) return 93;
  if(/^(Potion|Parchment|Pouch|Priest|Quiver|Robe|Scholar|Spellbook)/.test(name)) return 99;
  if(/^(Crowbar|Druidic Focus|Dungeoneer|Entertainer|Explorer|Healer|Holy Symbol)/.test(name)) return 97;
  return 96;
}
