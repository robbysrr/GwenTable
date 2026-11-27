export const source = Object.freeze({
  id: 'srd-5.2.1', version: '5.2.1', license: 'CC-BY-4.0',
  url: 'https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf',
  sha256: '8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87'
});
export const abilities = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
export const array = [15, 14, 13, 12, 10, 8];
const suggested = [15, 13, 14, 8, 12, 10];
const pointCosts = [0, 1, 2, 3, 4, 5, 7, 9];
export const skills = {
  Acrobatics: 1, 'Animal Handling': 4, Arcana: 3, Athletics: 0, Deception: 5,
  History: 3, Insight: 4, Intimidation: 5, Investigation: 3, Medicine: 4,
  Nature: 3, Perception: 4, Performance: 5, Persuasion: 5, Religion: 3,
  'Sleight of Hand': 1, Stealth: 1, Survival: 4
};
export const fighterSkills = ['Acrobatics', 'Animal Handling', 'History', 'Insight', 'Persuasion', 'Perception', 'Survival'];
const soldierSkills = ['Athletics', 'Intimidation'];
export const languages = ['Common Sign Language', 'Draconic', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc'];
export const games = ['Dice', 'Dragonchess', 'Playing cards', 'Three-dragon ante'];
export const styles = ['Defense', 'Archery', 'Great Weapon Fighting', 'Two-Weapon Fighting'];
export const alignments = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
export const feats = ['Alert', 'Skilled'];
export const weapons = {
  Club:'Slow', Dagger:'Nick', Greatclub:'Push', Handaxe:'Vex', Javelin:'Slow', 'Light Hammer':'Nick',
  Mace:'Sap', Quarterstaff:'Topple', Sickle:'Nick', Spear:'Sap', Dart:'Vex', 'Light Crossbow':'Slow',
  Shortbow:'Vex', Sling:'Slow', Battleaxe:'Topple', Flail:'Sap', Glaive:'Graze', Greataxe:'Cleave',
  Greatsword:'Graze', Halberd:'Cleave', Lance:'Topple', Longsword:'Sap', Maul:'Topple',
  Morningstar:'Sap', Pike:'Push', Rapier:'Vex', Scimitar:'Nick', Shortsword:'Vex', Trident:'Topple',
  Warhammer:'Push', 'War Pick':'Sap', Whip:'Slow', Blowgun:'Vex', 'Hand Crossbow':'Vex',
  'Heavy Crossbow':'Push', Longbow:'Slow', Musket:'Slow', Pistol:'Vex'
};
const attackProfiles = {
  Greatsword:['2d6','Slashing',0,13], Flail:['1d8','Bludgeoning',0], Javelin:['1d6','Piercing',0],
  Scimitar:['1d6','Slashing',-1], Shortsword:['1d6','Piercing',-1], Longbow:['1d8','Piercing',1,13],
  Spear:['1d6','Piercing',0], Shortbow:['1d6','Piercing',1]
};
export const kits = {
  A: {label:'Chain Mail kit', armor:'Chain Mail', gp:4, items:['Chain Mail','Greatsword','Flail','8 Javelins','Dungeoneer’s Pack']},
  B: {label:'Studded Leather kit', armor:'Studded Leather Armor', gp:11, items:['Studded Leather Armor','Scimitar','Shortsword','Longbow','20 Arrows','Quiver','Dungeoneer’s Pack']},
  C: {label:'155 GP', armor:'', gp:155, items:[]}
};
export const refs = {
  skills: [9, 'Skills'], creation: [19, 'Character Creation'], languages: [20, 'Choose Languages'],
  abilities: [21, 'Ability Scores'], sheet: [22, 'Character Creation Details'],
  advancement: [23, 'Character Advancement'], class: [47, 'Core Fighter Traits'], mastery: [48, 'Second Wind and Weapon Mastery'],
  background: [83, 'Character Origins · Soldier'], species: [86, 'Character Origins · Human'],
  feats: [87, 'Origin Feats'], style: [88, 'Fighting Style Feats'], archery: [87, 'Archery'],
  weapons: [91, 'Weapons'], armor: [92, 'Armor'], games: [94, 'Gaming Set']
};
export const newDraft = () => ({
  name:'', alignment:'Neutral', size:'Medium', method:'array', scores:[...suggested], rolls:[],
  boosts:[2,0,1], fighter:['Perception','Survival'], human:'Insight', feat:'Alert',
  skilled:['Arcana','Medicine','Investigation'], languages:['Dwarvish','Elvish'], game:'Dice',
  kit:'A', backgroundKit:'A', wear:true, style:'Defense', mastery:['Greatsword','Flail','Javelin']
});
export const modifier = score => Math.floor((score - 10) / 2);
export const pointTotal = scores => scores.reduce((total, score) => total + (pointCosts[score-8] ?? NaN), 0);
export const rollTotal = dice => [...dice].sort((a,b)=>b-a).slice(0,3).reduce((a,b)=>a+b,0);
export function secureD6() {
  const byte = new Uint8Array(1);
  do { crypto.getRandomValues(byte); } while (byte[0] > 251);
  return byte[0] % 6 + 1;
}
export const rollScores = (die = secureD6) => Array.from({length:6}, () => Array.from({length:4}, die));
const same = (a,b) => JSON.stringify([...a].sort((x,y)=>x-y)) === JSON.stringify([...b].sort((x,y)=>x-y));
const choices = (list, count, allowed) => Array.isArray(list) && list.length === count &&
  new Set(list).size === count && list.every(value=>allowed.includes(value));
export function validate(d, {final = true} = {}) {
  const issues = [];
  if (typeof d.name !== 'string' || d.name.length > 80 || (final && !d.name.trim())) issues.push('Enter a character name of 1–80 characters.');
  if (!alignments.includes(d.alignment) || !['Medium','Small'].includes(d.size)) issues.push('Choose an alignment and Human size.');
  const diceValid = Array.isArray(d.rolls) && (d.rolls.length === 0 || (d.rolls.length === 6 &&
    d.rolls.every(dice => Array.isArray(dice) && dice.length===4 && dice.every(v=>Number.isInteger(v)&&v>=1&&v<=6))));
  if (!diceValid) issues.push('The stored dice history is invalid.');
  const scoreShape = Array.isArray(d.scores) && d.scores.length === 6 && d.scores.every(v=>Number.isInteger(v)&&v>=3&&v<=18);
  const validMethod = scoreShape && (
    (d.method==='array' && same(d.scores,array)) ||
    (d.method==='points' && Number.isFinite(pointTotal(d.scores)) && pointTotal(d.scores)<=27) ||
    (d.method==='rolled' && diceValid && d.rolls.length===6 && same(d.scores,d.rolls.map(rollTotal)))
  );
  if (!validMethod) issues.push('Assign six scores from the selected method. Point cost must stay within 27.');
  if (!Array.isArray(d.boosts) || !(same(d.boosts,[0,1,2]) || same(d.boosts,[1,1,1])) ||
      (scoreShape && d.scores.slice(0,3).some((v,i)=>v+d.boosts[i]>20))) issues.push('Apply Soldier boosts as +2 / +1 or +1 / +1 / +1.');
  const fighterPicks = Array.isArray(d.fighter) ? d.fighter : [];
  if (!choices(d.fighter,2,fighterSkills)) issues.push('Choose two different Fighter skills outside Soldier’s grants.');
  if (!choices([d.human],1,Object.keys(skills)) || [...soldierSkills,...fighterPicks].includes(d.human)) issues.push('Choose a different skill for Human Skillful.');
  if (!Array.isArray(d.skilled) || d.skilled.length!==3 || !d.skilled.every(v=>Object.hasOwn(skills,v)) ||
      !feats.includes(d.feat) || (d.feat==='Skilled' && (!choices(d.skilled,3,Object.keys(skills)) ||
      d.skilled.some(s=>[...soldierSkills,...fighterPicks,d.human].includes(s))))) issues.push('Choose a supported Human feat and three distinct new skills if using Skilled.');
  if (!choices(d.languages,2,languages)) issues.push('Choose two different languages in addition to Common.');
  if (!games.includes(d.game) || !Object.keys(kits).includes(d.kit) || !['A','B'].includes(d.backgroundKit) ||
      typeof d.wear!=='boolean' || !styles.includes(d.style)) issues.push('Check your starting equipment, gaming set, and Fighting Style.');
  if (!choices(d.mastery,3,Object.keys(weapons))) issues.push('Choose three distinct weapon masteries.');
  return issues;
}
export function derive(d) {
  const scores = d.scores.map((v,i)=>v+(d.boosts[i]??0));
  const mods = scores.map(modifier);
  const training = [...soldierSkills,...d.fighter,d.human,...(d.feat==='Skilled'?d.skilled:[])];
  const kit = kits[d.kit];
  const armor = d.wear ? kit.armor : '';
  const defense = armor && d.style==='Defense' ? 1 : 0;
  const proficiency = 2;
  const acBase = armor==='Chain Mail' ? 16 : (armor ? 12 : 10)+mods[1];
  const names = {A:['Greatsword','Flail','Javelin'],B:['Scimitar','Shortsword','Longbow'],C:[]}[d.kit];
  if (d.backgroundKit==='A') names.push('Spear','Shortbow');
  const attacks = names.map(name=>{
    const [dice,type,mode,minimum] = attackProfiles[name];
    const dexterity=mode===1 || (mode===-1 && mods[1]>mods[0]);
    const ability=dexterity?1:0;
    return {name,dice,type,mod:mods[ability],ability,bonus:mods[ability]+proficiency+(mode===1&&d.style==='Archery'?2:0),
      disadvantage:minimum!==undefined&&scores[ability]<minimum, mastery:d.mastery.includes(name)?weapons[name]:null};
  });
  return {
    scores, mods, proficiency, attacks, hp:10+mods[2], ac:acBase+defense,
    initiative:mods[1]+(d.feat==='Alert'?proficiency:0), speed:armor==='Chain Mail'&&scores[0]<13?20:30,
    passive:10+mods[4]+(training.includes('Perception')?proficiency:0),
    saves:mods.map((mod,i)=>mod+([0,2].includes(i)?proficiency:0)),
    skills:Object.entries(skills).map(([name,i])=>({name, trained:training.includes(name), total:mods[i]+(training.includes(name)?proficiency:0)})),
    armor:armor||'Unarmored', stealthDisadvantage:armor==='Chain Mail',
    hpDice:'1d10', xp:0, nextLevelXP:300, secondWind:2, gp:kit.gp+(d.backgroundKit==='A'?14:50),
    items:[...kit.items,...(d.backgroundKit==='A'?['Spear','Shortbow','20 Arrows',d.game+' gaming set','Healer’s Kit','Quiver','Traveler’s Clothes']:[])]
  };
}
