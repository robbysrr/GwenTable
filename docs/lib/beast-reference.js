// A read-only, source-linked subset of the SRD 5.2.1 creature index.
// This does NOT replace the form's game statistics or authorize homebrew forms.
import {creatureIndex} from './creatures.js';
import {wildShapes} from './catalog.js';
const safeNames=new Set([...wildShapes,'Bat','Blood Hawk','Brown Bear','Dire Wolf','Eagle','Giant Bat',
  'Giant Hyena','Giant Octopus','Giant Owl','Giant Spider','Giant Toad','Giant Wasp','Hawk','Lion','Owl',
  'Raven','Tiger','Vulture']);
const flyNames=new Set(['Bat','Blood Hawk','Eagle','Giant Bat','Giant Owl','Giant Wasp','Hawk','Owl','Raven','Vulture']);
const slug=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
export function beastFormLimit(level){
  if(!Number.isInteger(level)||level<2)return null;
  return {cr:level>=8?1:level>=4?.5:.25,fly:level>=8};
}
export function beastQuickReference(name,level){
  if(typeof name!=='string'||!safeNames.has(name)||name==='Giant Owl')return null; // SRD 5.2.1: Giant Owl is a Celestial, not a Beast.
  const row=creatureIndex[slug(name)];
  if(!row)return null;
  const limit=beastFormLimit(level);
  const cr=Number(row[6].includes('/')?row[6].split('/').reduce((a,b)=>a/b):row[6]);
  if(!Number.isFinite(cr))return null;
  const flying=flyNames.has(name);
  return {name:row[0],page:row[1],ac:row[2],hp:row[3],cr:row[6],flying,
    eligible:Boolean(limit&&cr<=limit.cr&&(!flying||limit.fly)),
    limitation:!limit?'Druid level 2 required':cr>limit.cr?'CR exceeds current Wild Shape limit':
      flying&&!limit.fly?'Fly Speed is not yet available':'Check DM approval and form-specific restrictions'};
}
