export const customTypes = ['Feat','Trait','Spell','Weapon','Armor','Item','Feature'];
export const maxFileBytes = 512*1024;
export const customLimit = 40;
const damageTypes = ['Acid','Bludgeoning','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'];
export const customFields = {
  Spell:[['level','Spell level','number',0,9],['ability','Casting ability','choice',['Intelligence','Wisdom','Charisma']],
    ['castingTime','Casting time'],['range','Range'],['components','Components'],['duration','Duration']],
  Weapon:[['dice','Damage dice'],['damageType','Damage type','choice',damageTypes],['ability','Attack ability','choice',['Strength','Dexterity','Finesse','Intelligence','Wisdom','Charisma']],
    ['trained','Add proficiency','checkbox'],['bonus','Magic bonus to hit and damage','number',0,10],['properties','Weapon properties']],
  Armor:[['category','Armor category','choice',['Light','Medium','Heavy','Shield']],['ac','Base AC / shield bonus','number',1,30],['strength','Minimum Strength','number',0,30],['stealth','Stealth disadvantage','checkbox']],
  Item:[['quantity','Quantity','number',1,999]],
  Feat:[['prerequisite','Prerequisite']],
  Trait:[], Feature:[['prerequisite','Prerequisite']]
};
export function newCustom(type='Feat') {
  const fields=Object.fromEntries(customFields[type].map(([key,,format,options])=>[key,
    format==='number'?options:format==='choice'?options[0]:format==='checkbox'?false:'']));
  if (type==='Armor') fields.ac=11;
  if (type==='Weapon') fields.dice='1d6';
  return {id:crypto.randomUUID(),type,name:'',description:'',...fields};
}
const validText = (text,length) => typeof text==='string'&&text.length<=length;
export function validateCustom(entry) {
  if (!entry||typeof entry!=='object'||!Object.hasOwn(customFields,entry.type)||!validText(entry.id,80)||
      !/^[a-z0-9-]{1,80}$/i.test(entry.id)||!validText(entry.name,80)||!entry.name.trim()||
      !validText(entry.description,1600)) return false;
  const fields=customFields[entry.type];
  if (Object.keys(entry).length!==fields.length+4) return false;
  for (const [key,,format,options,max] of fields) {
    const value=entry[key];
    if (format==='number'&&(!Number.isInteger(value)||value<options||value>max)) return false;
    if (format==='choice'&&!options.includes(value)) return false;
    if (format==='checkbox'&&typeof value!=='boolean') return false;
    if (format===undefined&&!validText(value,160)) return false;
  }
  return entry.type!=='Weapon'||/^(?:[1-9]\d?d(?:4|6|8|10|12|20|100)|[1-9]\d?)$/i.test(entry.dice);
}
export const validateCustomList = entries => Array.isArray(entries)&&entries.length<=customLimit&&entries.every(validateCustom)&&
  new Set(entries.map(entry=>entry.id)).size===entries.length;
