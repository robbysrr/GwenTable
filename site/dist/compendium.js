import {srdEquipment,srdMagicItems,srdTopics} from './lib/srd-compendium-index.js';
import {classes,backgrounds,species,weaponProfiles,originFeats} from './lib/catalog.js';
import {styles,skills,abilities} from './lib/rules.js';
import {armorProfiles} from './lib/character.js';
import {creatureIndex} from './lib/creatures.js';
import {spellHeaders} from './lib/spell-headers.js';
import {spellReference} from './lib/spell-reference.js';
import {copy,htmlCopy,htmlCanonicalOptionName} from './locale.js';
import {icon,iconFor} from './ui-icons.js';

export function catalogueEntries() {
  const row=(type,name,first,meta='',details={})=>({type,name,first,meta,entryKey:type+'|'+name,...details});
  return [
    ...Object.entries(classes).flatMap(([name,c])=>[row('Class',name,c.page),row('Subclass',c.subclass,c.subclassPage,name)]),
    ...Object.entries(species).map(([name,s])=>row('Species',name,s.page)),
    ...Object.keys(backgrounds).map(name=>row('Background',name,83)),
    ...originFeats.map(name=>row('Feat',name,87)),
    ...styles.map(name=>row('Feat',name,name==='Archery'?87:88,'Fighting Style')),
    row('Feat','Ability Score Improvement',87),row('Feat','Grappler',87),
    ...Object.entries(skills).map(([name,index])=>row('Skill',name,9,abilities[index])),
    ...Object.entries(weaponProfiles).map(([name,[dice,damage,category,properties,mastery]])=>row('Equipment',name,91,mastery,{end:92,
      summary:`${category} weapon\nDamage: ${dice} ${damage}\nProperties: ${properties||'—'}\nMastery: ${mastery}`})),
    ...srdEquipment.map(([name,page,price])=>row('Equipment',name,page,price,{end:page+1})),
    ...srdMagicItems.map(([name,page])=>row('Magic Item',name,page,'',{end:Math.min(page+1,253)})),
    ...srdTopics.map(([name,page])=>row('Rules topic',name,page,'',{end:Math.min(page+3,364)})),
    ...Object.entries(armorProfiles).map(([name,[ac,category,strength,stealth]])=>row('Equipment',name,92,'Armor',{
      summary:`${category} Armor\nArmor Class: ${ac}${category==='Light'?' + Dex modifier':category==='Medium'?' + Dex modifier (max 2)':''}\nStrength: ${strength?strength:'—'}\nStealth: ${stealth?'Disadvantage':'—'}`})),
    ...Object.keys(spellHeaders).flatMap(name=>{
      const spell=spellReference(name);
      return spell?[row('Spell',name,spell.page,(spell.level?'Level '+spell.level:'Cantrip')+' · '+spell.school,{spellName:name})]:[];
    }),
    ...Object.values(creatureIndex).map(([name,page,ac,hp,,,cr])=>row('Creature',name,page,'CR '+cr+' · AC '+ac+' · '+hp+' HP',{end:Math.min(page+1,364)}))
  ].sort((a,b)=>a.name.localeCompare(b.name)||a.type.localeCompare(b.type));
}
const fold=value=>value.toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu,'').trim();
export function filterCatalogue(entries,query,type) {
  const needle=fold(query);
  const terms=needle.split(/\s+/);
  return entries.filter(entry=>(!type||entry.type===type)&&terms.every(term=>fold(entry.name+' '+entry.type+' '+copy(entry.type)+' '+entry.meta).includes(term)))
    .sort((a,b)=>Number(fold(b.name)===needle)-Number(fold(a.name)===needle));
}
export function mountCompendium(root,open) {
  const entries=catalogueEntries();
  const list=root.querySelector('[data-catalogue-results]');
  const search=root.querySelector('[data-catalogue-search]');
  const category=root.querySelector('[data-catalogue-category]');
  const count=root.querySelector('[data-catalogue-count]');
  const more=root.querySelector('[data-more-results]');
  let limit=36, visible=[];
  function render() {
    const rows=filterCatalogue(entries,search.value,category.value);
    visible=rows.slice(0,limit);
    count.textContent=copy('{count} SRD entries',{count:rows.length});
    list.innerHTML=visible.map((entry,index)=>`<li><button type="button" data-entry-index="${index}">${icon(iconFor(entry.type))}<span><b>${htmlCanonicalOptionName(entry.name)}</b><br><small>${htmlCopy(entry.type)} · ${entry.meta?htmlCopy(entry.meta)+' · ':''}p. ${entry.first}</small></span></button></li>`).join('');
    more.hidden=visible.length===rows.length;
  }
  function localize() {
    const value=category.value;
    category.replaceChildren(new Option(copy('All categories'),''),...[...new Set(entries.map(row=>row.type))].sort().map(type=>new Option(copy(type),type)));
    category.value=value;
    render();
  }
  const reset=()=>{limit=36;render();};
  search.oninput=category.onchange=reset;
  more.onclick=()=>{const index=visible.length;limit+=36;render();list.querySelector('[data-entry-index="'+index+'"]')?.focus();};
  list.onclick=event=>{
    const button=event.target.closest('[data-entry-index]');
    if(button) open(visible[Number(button.dataset.entryIndex)]);
  };
  localize();
  return localize;
}
