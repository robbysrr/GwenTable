import {copy} from './locale.js';
const preparation = {
  Bard:'Choose from the Bard list. You can replace one prepared spell when you gain a Bard level. Magical Secrets expands your choices starting at level 10.',
  Cleric:'Choose from the Cleric list for the spell levels you can cast. After a Long Rest, you can change any of those choices.',
  Druid:'Choose from the Druid list for the spell levels you can cast. After a Long Rest, you can change any of those choices.',
  Paladin:'Choose from the Paladin list. You can replace one prepared Paladin spell after a Long Rest.',
  Ranger:'Choose from the Ranger list. You can replace one prepared Ranger spell after a Long Rest.',
  Sorcerer:'Choose from the Sorcerer list. You can replace one prepared Sorcerer spell when you gain a Sorcerer level.',
  Warlock:'Choose Warlock spells of a level your Pact Magic slots support. You can replace one prepared Warlock spell when you gain a Warlock level. Mystic Arcanum is a separate choice.',
  Wizard:'Start with six level 1 Wizard spells in your book and add two eligible Wizard spells per Wizard level gained. Prepare a separate list from the book. You can change that list after a Long Rest and cast rituals in your book without preparing them.'
};

export function magicGroup(key) {
  if(key==='cantrips') return 'cantrips';
  if(key.startsWith('book')) return 'book';
  if(key.startsWith('prepared')||key.startsWith('secret')) return 'prepared';
  return 'sources';
}

export function spellGroups(choices) {
  const groups=[
    {id:'prepared',title:'Prepared class spells',help:'Choose spells you can cast with your class feature. Cantrips and always-prepared grants use separate allowances.'},
    {id:'cantrips',title:'Class cantrips',help:'Cantrips use no spell slots.'},
    {id:'book',title:'Wizard spellbook',help:'Add spells at each advancement level. Evocation Savant additions are separate from ordinary spellbook additions.'},
    {id:'sources',title:'Spells and choices from other features',help:'Resolve choices from feats, subclass features, invocations, and other grants here.'}
  ];
  return groups.map(group=>{
    const controls=choices.filter(choice=>magicGroup(choice.key)===group.id);
    return {...group,title:copy(group.title),help:copy(group.help),controls};
  }).filter(group=>group.controls.length);
}

export const prepGuide=className=>preparation[className]?copy(preparation[className]):null;

export function spellSuggestions(options,count,mode,describe,rng=Math.random) {
  const available=[...new Set(options)];
  if(mode==='random') {
    for(let i=available.length-1;i>0;i--) {
      const j=Math.floor(rng()*(i+1));
      [available[i],available[j]]=[available[j],available[i]];
    }
    return available.slice(0,count);
  }
  const roles=[
    ['healing',/regains? .*hit points|restore.*hit points|heal/i],
    ['defense',/armor class|resistance|temporary hit|protect/i],
    ['control',/restrained|prone|speed becomes 0|can’t move|incapacitated|frightened/i],
    ['damage',/damage/i],
    ['utility',/ritual|detect|teleport|illusion|move|invisible/i]
  ];
  const candidates=available.map(name=>{
    const spell=describe(name);
    const text=[spell?.summary,spell?.effect,spell?.time].filter(Boolean).join(' ');
    return {name,roles:roles.filter(([,pattern])=>pattern.test(text)).map(([role])=>role),level:spell?.level??0};
  });
  const selected=[];
  const coverage=new Set();
  while(candidates.length&&selected.length<count) {
    const grade=spell=>spell.roles.reduce((score,role)=>score+(coverage.has(role)?1:5),0)+Math.min(spell.level,3)*.2;
    candidates.sort((a,b)=>grade(b)-grade(a)||a.name.localeCompare(b.name));
    const best=candidates.shift();
    selected.push(best.name);
    best.roles.forEach(role=>coverage.add(role));
  }
  return selected;
}
