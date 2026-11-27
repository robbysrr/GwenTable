import {skills, kits, games, languages} from './rules.js';
export {spellLists, weaponProfiles} from './tables.js';

const list = text => text.split('|');
const profile = (page, subclassPage, subclass, die, saves, priority, count, choices, armor, weapon, gp, gear, cash, features) => ({
  page, subclassPage, subclass, die, saves, priority, count, skills:choices ? list(choices) : Object.keys(skills),
  armor:armor ? list(armor) : [], weapon, kits:{A:{gp, items:list(gear)}, B:{gp:cash, items:[]}}, features:features.map(list)
});
export const classes = {
  Barbarian: profile(28,30,'Path of the Berserker',12,[0,2],[0,2,1,4,5,3],2,'Animal Handling|Athletics|Intimidation|Nature|Perception|Survival','Light|Medium|Shield','Martial',15,'Greataxe|4 Handaxes|Explorer’s Pack',75,[
    'Rage (2 uses at levels 1–2, 3 at level 3, +2 damage)|Unarmored Defense|Weapon Mastery','Danger Sense|Reckless Attack','Primal Knowledge|Frenzy']),
  Bard: profile(31,35,'College of Lore',8,[1,5],[5,1,2,4,3,0],3,'','Light','Simple',19,'Leather Armor|2 Daggers|Musical Instrument|Entertainer’s Pack',90,[
    'Bardic Inspiration (d6, Charisma modifier uses, minimum 1)|Spellcasting','Expertise|Jack of All Trades','Bonus Proficiencies|Cutting Words']),
  Cleric: profile(36,40,'Life Domain',8,[4,5],[4,2,1,0,5,3],2,'History|Insight|Medicine|Persuasion|Religion','Light|Medium|Shield','Simple',7,'Chain Shirt|Shield|Mace|Holy Symbol|Priest’s Pack',110,[
    'Spellcasting|Divine Order','Channel Divinity (2 uses, Divine Spark and Turn Undead)','Disciple of Life|Life Domain Spells|Preserve Life']),
  Druid: profile(41,45,'Circle of the Land',8,[3,4],[4,2,1,3,5,0],2,'Animal Handling|Arcana|Insight|Medicine|Nature|Perception|Religion|Survival','Light|Shield','Simple',9,'Leather Armor|Shield|Sickle|Druidic Focus (Quarterstaff)|Explorer’s Pack|Herbalism Kit',50,[
    'Spellcasting|Druidic|Primal Order','Wild Shape (2 uses)|Wild Companion','Circle of the Land Spells|Land’s Aid']),
  Fighter: profile(47,49,'Champion',10,[0,2],[0,2,1,4,5,3],2,'Acrobatics|Animal Handling|Athletics|History|Insight|Intimidation|Persuasion|Perception|Survival','Light|Medium|Heavy|Shield','Martial',4,kits.A.items.join('|'),155,[
    'Fighting Style|Second Wind (2 uses)|Weapon Mastery','Action Surge (1 use)|Tactical Mind','Improved Critical (19–20)|Remarkable Athlete (Initiative and Athletics Advantage)']),
  Monk: profile(49,52,'Warrior of the Open Hand',8,[0,1],[1,4,2,0,3,5],2,'Acrobatics|Athletics|History|Insight|Religion|Stealth','','Monk',11,'Spear|5 Daggers|Monk Tool|Explorer’s Pack',50,[
    'Martial Arts (d6)|Unarmored Defense','Monk’s Focus (points equal to level)|Unarmored Movement (+10 ft)|Uncanny Metabolism','Deflect Attacks|Open Hand Technique']),
  Paladin: profile(53,56,'Oath of Devotion',10,[4,5],[0,5,2,4,1,3],2,'Athletics|Insight|Intimidation|Medicine|Persuasion|Religion','Light|Medium|Heavy|Shield','Martial',9,'Chain Mail|Shield|Longsword|6 Javelins|Holy Symbol|Priest’s Pack',150,[
    'Lay On Hands (5 HP per level)|Spellcasting|Weapon Mastery','Fighting Style|Paladin’s Smite','Channel Divinity (2 uses, Divine Sense and Sacred Weapon)|Oath of Devotion Spells']),
  Ranger: profile(57,61,'Hunter',10,[0,1],[1,4,2,0,3,5],3,'Animal Handling|Athletics|Insight|Investigation|Nature|Perception|Stealth|Survival','Light|Medium|Shield','Martial',7,'Studded Leather Armor|Scimitar|Shortsword|Longbow|20 Arrows|Quiver|Druidic Focus (sprig of mistletoe)|Explorer’s Pack',150,[
    'Spellcasting|Favored Enemy (2 free Hunter’s Mark casts)|Weapon Mastery','Deft Explorer|Fighting Style','Hunter’s Lore|Hunter’s Prey']),
  Rogue: profile(61,64,'Thief',8,[1,3],[1,2,3,4,5,0],4,'Acrobatics|Athletics|Deception|Insight|Intimidation|Investigation|Perception|Persuasion|Sleight of Hand|Stealth','Light','Rogue',8,'Leather Armor|2 Daggers|Shortsword|Shortbow|20 Arrows|Quiver|Thieves’ Tools|Burglar’s Pack',100,[
    'Expertise|Sneak Attack (1d6, 2d6 at level 3)|Thieves’ Cant|Weapon Mastery','Cunning Action','Steady Aim|Fast Hands|Second-Story Work']),
  Sorcerer: profile(64,69,'Draconic Sorcery',6,[2,5],[5,2,1,4,3,0],2,'Arcana|Deception|Insight|Intimidation|Persuasion|Religion','','Simple',28,'Spear|2 Daggers|Arcane Focus (crystal)|Dungeoneer’s Pack',50,[
    'Spellcasting|Innate Sorcery (2 uses)','Font of Magic (Sorcery Points equal to level)|Metamagic','Draconic Resilience|Draconic Spells']),
  Warlock: profile(70,76,'Fiend Patron',8,[4,5],[5,2,1,4,3,0],2,'Arcana|Deception|History|Intimidation|Investigation|Nature|Religion','Light','Simple',15,'Leather Armor|Sickle|2 Daggers|Arcane Focus (orb)|Book (occult lore)|Scholar’s Pack',100,[
    'Eldritch Invocations|Pact Magic','Magical Cunning','Dark One’s Blessing|Fiend Spells']),
  Wizard: profile(77,82,'Evoker',6,[3,4],[3,2,1,4,5,0],2,'Arcana|History|Insight|Investigation|Medicine|Nature|Religion','','Simple',5,'2 Daggers|Arcane Focus (Quarterstaff)|Robe|Spellbook|Scholar’s Pack',55,[
    'Spellcasting|Ritual Adept|Arcane Recovery','Scholar','Evocation Savant|Potent Cantrip'])
};
classes.Fighter.kits = kits;

const background = (boosts, feat, skills, tool, gp, items, magic='') => ({boosts,feat,skills:list(skills),tool,gp,items:list(items),magic});
export const backgrounds = {
  Acolyte: background([3,4,5],'Magic Initiate','Insight|Religion','Calligrapher’s Supplies',8,'Calligrapher’s Supplies|Book (prayers)|Holy Symbol|Parchment (10 sheets)|Robe','Cleric'),
  Criminal: background([1,2,3],'Alert','Sleight of Hand|Stealth','Thieves’ Tools',16,'2 Daggers|Thieves’ Tools|Crowbar|2 Pouches|Traveler’s Clothes'),
  Sage: background([2,3,4],'Magic Initiate','Arcana|History','Calligrapher’s Supplies',8,'Quarterstaff|Calligrapher’s Supplies|Book (history)|Parchment (8 sheets)|Robe','Wizard'),
  Soldier: background([0,1,2],'Savage Attacker','Athletics|Intimidation','Gaming Set',14,'Spear|Shortbow|20 Arrows|Gaming Set|Healer’s Kit|Quiver|Traveler’s Clothes')
};
const speciesEntry=(page,size,traits,lineages={})=>({page,size:list(size),traits:list(traits),lineages});
export const species = {
  Dragonborn:speciesEntry(84,'Medium','Breath Weapon (2 uses, 1d10, DEX save)|Damage Resistance|Darkvision 60 ft',{
    Black:'Acid',Blue:'Lightning',Brass:'Fire',Bronze:'Lightning',Copper:'Acid',Gold:'Fire',Green:'Poison',Red:'Fire',Silver:'Cold',White:'Cold'}),
  Dwarf:speciesEntry(84,'Medium','Darkvision 120 ft|Dwarven Resilience (Poison resistance and Advantage against the Poisoned condition)|Dwarven Toughness|Stonecunning (2 uses, Tremorsense 60 ft on stone)'),
  Elf:speciesEntry(84,'Medium','Darkvision 60 ft (120 ft for Drow)|Elven Lineage|Fey Ancestry|Keen Senses|Trance',{
    Drow:['Dancing Lights','Faerie Fire'],'High Elf':['Prestidigitation','Detect Magic'],'Wood Elf':['Druidcraft','Longstrider']}),
  Gnome:speciesEntry(85,'Small','Darkvision 60 ft|Gnomish Cunning|Gnomish Lineage',{
    'Forest Gnome':['Minor Illusion','Speak with Animals'],'Rock Gnome':['Mending','Prestidigitation']}),
  Goliath:speciesEntry(85,'Medium','Giant Ancestry (2 uses)|Powerful Build',{
    Cloud:'Cloud’s Jaunt',Fire:'Fire’s Burn',Frost:'Frost’s Chill',Hill:'Hill’s Tumble',Stone:'Stone’s Endurance',Storm:'Storm’s Thunder'}),
  Halfling:speciesEntry(86,'Small','Brave|Halfling Nimbleness|Luck|Naturally Stealthy'),
  Human:speciesEntry(86,'Medium|Small','Resourceful|Skillful|Versatile'),
  Orc:speciesEntry(86,'Medium','Adrenaline Rush (2 uses)|Darkvision 120 ft|Relentless Endurance'),
  Tiefling:speciesEntry(86,'Medium|Small','Darkvision 60 ft|Fiendish Legacy|Otherworldly Presence',{
    Abyssal:['Poison Spray','Ray of Sickness','Poison'],Chthonic:['Chill Touch','False Life','Necrotic'],Infernal:['Fire Bolt','Hellish Rebuke','Fire']})
};

export const rareLanguages = ['Abyssal','Celestial','Deep Speech','Druidic','Infernal','Primordial','Sylvan','Thieves’ Cant','Undercommon'];
export const allLanguages = [...languages,...rareLanguages];
export const artisanTools = list('Alchemist’s Supplies|Brewer’s Supplies|Calligrapher’s Supplies|Carpenter’s Tools|Cartographer’s Tools|Cobbler’s Tools|Cook’s Utensils|Glassblower’s Tools|Jeweler’s Tools|Leatherworker’s Tools|Mason’s Tools|Painter’s Supplies|Potter’s Tools|Smith’s Tools|Tinker’s Tools|Weaver’s Tools|Woodcarver’s Tools');
export const instruments = list('Bagpipes|Drum|Dulcimer|Flute|Horn|Lute|Lyre|Pan flute|Shawm|Viol');
export const gamingSets = games.map(game=>game+' gaming set');
export const tools = [...artisanTools,...instruments,...gamingSets,...list('Disguise Kit|Forgery Kit|Herbalism Kit|Navigator’s Tools|Poisoner’s Kit|Thieves’ Tools')];
export const metamagic = list('Careful Spell|Distant Spell|Empowered Spell|Extended Spell|Heightened Spell|Quickened Spell|Seeking Spell|Subtle Spell|Transmuted Spell|Twinned Spell');
export const wildShapes = list('Baboon|Badger|Boar|Camel|Cat|Constrictor Snake|Crab|Deer|Draft Horse|Elk|Frog|Giant Badger|Giant Centipede|Giant Crab|Giant Fire Beetle|Giant Frog|Giant Lizard|Giant Rat|Giant Venomous Snake|Giant Weasel|Giant Wolf Spider|Goat|Hyena|Jackal|Lizard|Mastiff|Mule|Octopus|Panther|Piranha|Pony|Rat|Riding Horse|Scorpion|Seahorse|Spider|Venomous Snake|Weasel|Wolf');
export const scholarSkills = list('Arcana|History|Investigation|Medicine|Nature|Religion');
export const landSpells = {
  Arid:['Fire Bolt','Blur','Burning Hands'], Polar:['Ray of Frost','Fog Cloud','Hold Person'],
  Temperate:['Shocking Grasp','Misty Step','Sleep'], Tropical:['Acid Splash','Ray of Sickness','Web']
};
export const originFeats = list('Alert|Magic Initiate|Savage Attacker|Skilled');

export const templateOrigins = {
  Barbarian:['Goliath','Soldier','Korra Flint'],
  Bard:['Human','Acolyte','Ariel Reed'],
  Cleric:['Dwarf','Acolyte','Tova Stonewell'],
  Druid:['Elf','Sage','Liora Bramble'],
  Fighter:['Human','Soldier','Iona Fen'],
  Monk:['Halfling','Soldier','Pip Vale'],
  Paladin:['Dragonborn','Soldier','Varek Emberward'],
  Ranger:['Orc','Criminal','Orla Moss'],
  Rogue:['Tiefling','Criminal','Neri Lockwood'],
  Sorcerer:['Dragonborn','Acolyte','Sera Ash'],
  Warlock:['Gnome','Acolyte','Nim Glass'],
  Wizard:['Elf','Sage','Mira Quill']
};
