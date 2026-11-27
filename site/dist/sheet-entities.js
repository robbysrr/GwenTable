import {abilities,skills} from './lib/rules.js';
import {classes,species,weaponProfiles} from './lib/catalog.js';
import {armorProfiles,epicBoons} from './lib/character.js';
import {customFields} from './lib/custom.js';
import {spellReference} from './lib/spell-reference.js';
import {metricText,weaponDistances} from './lib/distances.js';
import {classIntro,subclassIntro,backgroundIntro,featureIntro,traitIntro,featDescription,isSubclassFeature} from './choice-reference.js';
import {skillLabel,skillExample,equipmentDetail,masteryGuide,speciesGuide} from './character-guide.js';
import {copy} from './locale.js';

const signed=n=>n>=0?'+'+n:String(n);
const sr='SRD 5.2.1';
const levelLabel=n=>n===0?'Cantrip':n==null?'Unclassified spell':'Level '+n;
const parts=text=>{
  const match=/^(.+?)\s+\((.+)\)$/.exec(text);
  if(match) return [match[1],match[2]];
  const colon=text.indexOf(': ');
  return colon<0?[text,'']:[text.slice(0,colon),text.slice(colon+2)];
};
function idRows(rows) {
  const count=new Map();
  return rows.map(row=>{
    const identity=row.id??row.label;
    const index=count.get(identity)??0;
    count.set(identity,index+1);
    return {...row,id:JSON.stringify([identity,index]),source:row.source??sr,description:metricText(row.description??'')};
  });
}

function spellRow(name,details={}) {
  const reference=spellReference(name);
  const level=levelLabel(reference?.level??details.level);
  const info=reference?[reference.school,metricText(reference.range),reference.time]:[];
  const traits=reference?[
    ...(reference.duration.startsWith('Concentration')?['Concentration']:[]),
    ...(reference.time.includes('Ritual')?['Ritual']:[]),
    ...reference.components.split(/,\s*/).map(value=>value[0]).filter(value=>['V','S','M'].includes(value))
  ]:[];
  return {label:name,icon:'spell',spell:reference?name:null,page:reference?.page,
    summary:[copy(level),details.origin,...info].filter(Boolean).join(' · '),
    description:[details.calculation,details.note,reference?.summary??reference?.effect??copy('Full definition unavailable.')].filter(Boolean).join('\n\n'),
    facets:{level:[level],school:reference?[reference.school]:[],trait:traits,origin:details.origin?[details.origin]:[]},
    id:[name,details.origin].join('|'),status:details.status};
}

export function sheetEntities(d,s,{spent,slotActions,attackActions}={}) {
  const c=classes[d.className];
  const classRows=[{label:d.className,icon:'class',summary:levelLabel(d.level),description:copy(classIntro[d.className]),page:c.page,end:c.subclassPage,facets:{origin:[d.className]}}];
  if(s.subclass) classRows.push({label:s.subclass,icon:'subclass',description:copy(subclassIntro[s.subclass]),page:c.subclassPage,facets:{origin:[s.subclass]}});
  for(const text of s.features) {
    const [name,notes]=parts(text);
    const sub=isSubclassFeature(d.className,name);
    classRows.push({label:name,summary:notes,icon:sub?'subclass':'class',
      description:copy(featureIntro[name]??text),page:sub?c.subclassPage:c.page,end:sub?undefined:c.subclassPage,
      facets:{origin:[sub?s.subclass:d.className]}});
  }
  const origins=[{label:d.species,icon:'species',summary:d.lineage||d.size,description:speciesGuide[d.species],page:species[d.species].page,facets:{origin:['Species']}},
    {label:d.background,icon:'background',description:copy(backgroundIntro[d.background]),page:83,end:84,facets:{origin:['Background']}}];
  for(const trait of s.traits) {
    const [name,notes]=parts(trait);
    origins.push({label:name,summary:notes,icon:'trait',description:copy(traitIntro[name]??trait),page:species[d.species].page,facets:{origin:['Species']}});
  }
  const feats=s.featNames.map(name=>({label:name,icon:'feat',description:featDescription(name)??epicBoons[name],page:name.startsWith('Boon')?88:87}));
  const checks=s.skills.map(skill=>{
    const ability=abilities[skills[skill.name]];
    const training=skill.expert?'Expertise':skill.trained?'Proficient':skill.jack?'Jack of All Trades':'Untrained';
    return {label:skillLabel(skill.name),icon:'check',summary:signed(skill.total)+' · '+copy(training),description:skillExample(skill.name),
      page:9,facets:{ability:[ability],training:[training]}};
  });
  const saves=s.saves.map((bonus,index)=>{
    const training=c.saves.includes(index)?'Proficient':'Untrained';
    return {label:abilities[index],icon:'check',summary:signed(bonus)+' · '+copy(training),
      description:s.auraBonus?signed(s.auraBonus)+' '+copy('while Aura of Protection is active.'):null,page:11,facets:{training:[training]}};
  });
  const weaponTraining={Simple:'Simple weapons',Martial:'Simple and Martial weapons',
    Monk:'Simple weapons and Martial Melee weapons with the Light property',
    Rogue:'Simple weapons and Martial weapons with the Finesse or Light property'};
  const training=[
    ...s.armorTraining.map(label=>({label,kind:'Armor training',page:92})),
    {label:copy(weaponTraining[s.weaponTraining]??s.weaponTraining),kind:'Weapon proficiency',page:c.page},
    ...s.proficientTools.map(label=>({label,kind:'Tool proficiency',page:93})),
    ...s.languages.map(label=>({label,kind:'Languages',page:20}))
  ].map(({label,kind,page})=>({label,icon:kind==='Languages'?'language':'check',summary:copy(kind),page,facets:{kind:[kind]},id:kind+'|'+label}));
  const attacks=s.attacks.map((a,index)=>{
    const category=Object.hasOwn(weaponProfiles,a.name)&&!a.custom?weaponProfiles[a.name][2]:null;
    const reach=category?.endsWith('Melee')?copy('Reach')+' '+(a.properties?.includes('Reach')?'10 ft / 3 m':'5 ft / 1.5 m'):'';
    return {label:a.name,icon:'attack',actions:attackActions?.(a,index),summary:signed(a.bonus)+' · '+a.dice+signed(a.mod)+' '+a.type,
      description:[a.properties?weaponDistances(a.properties):'',reach,a.mastery?masteryGuide[a.mastery]??a.mastery:'',
        a.disadvantage?'Disadvantage':null,a.note].filter(Boolean).join(' · '),
      source:a.custom?copy('Custom'):sr,page:a.custom?null:a.name==='Unarmed Strike'?190:91,
      facets:{damage:[a.type],category:category?[category]:[],mastery:a.mastery?[a.mastery]:[]}};
  });
  const mastery=(d.mastery??[]).filter(name=>Object.hasOwn(weaponProfiles,name)).map(label=>{
    const name=weaponProfiles[label][4];
    return {label,icon:'attack',summary:name,description:masteryGuide[name],page:90,facets:{mastery:[name]}};
  });
  const equipped=[!d.armor?.startsWith('custom:')?s.armor:null,!d.shield?.startsWith('custom:')?s.shield:null].filter(name=>name&&name!=='Unarmored');
  const remaining=[...equipped];
  const armorNames=new Set(Object.keys(armorProfiles));
  const gear=s.inventory.map(label=>{
    const name=label.replace(/^\d+ /,'');
    const kind=Object.hasOwn(weaponProfiles,name)||Object.hasOwn(weaponProfiles,name.slice(0,-1))?'Weapon':
      armorNames.has(name)||name==='Shield'?'Armor':'Gear';
    const index=remaining.indexOf(label);
    if(index>=0) remaining.splice(index,1);
    const status=index>=0?'Equipped':'Carried';
    return {label,icon:kind==='Weapon'?'attack':'item',status:copy(status),...equipmentDetail(label),
      facets:{state:[status],kind:[kind],source:[sr]}};
  });
  for(const name of remaining) {
    if(!armorNames.has(name)&&name!=='Shield') continue;
    gear.push({label:name,icon:'item',status:copy('Equipped'),...equipmentDetail(name),
      facets:{state:['Equipped'],kind:['Armor'],source:[sr]}});
  }
  const customRows=d.custom.map(entry=>{
    const attributes=customFields[entry.type].filter(([key])=>entry[key]!==''&&entry[key]!==false)
      .map(([key,label])=>copy(label)+' '+entry[key]);
    if(entry.type==='Spell') {
      const mod=s.mods[abilities.indexOf(entry.ability)];
      attributes.push('DC '+(8+s.proficiency+mod)+' · '+signed(s.proficiency+mod)+' '+copy('spell attack'));
    }
    return {id:entry.id,label:entry.name,icon:entry.type==='Spell'?'spell':entry.type==='Weapon'?'attack':'item',
      source:copy('Custom'),status:entry.type==='Armor'&&[d.armor,d.shield].includes('custom:'+entry.id)?copy('Equipped'):copy('Custom'),
      summary:[copy(entry.type),entry.type==='Spell'?copy(levelLabel(entry.level)):'',entry.type==='Item'?'×'+entry.quantity:''].filter(Boolean).join(' · '),
      description:[entry.description,attributes.join(' · '),copy('Review custom rules with your DM.')].filter(Boolean).join('\n\n'),
      facets:{kind:[entry.type],level:entry.type==='Spell'?[levelLabel(entry.level)]:[]}};
  });
  const cantrips=[], prepared=[], granted=[];
  const always=new Set([c.subclass,'Favored Enemy','Paladin’s Smite','Faithful Steed','Magical Discoveries','Contact Patron']);
  for(const spell of s.known) {
    const atWill=(spellReference(spell.name)?.level??spell.level)===0;
    const group=atWill?cantrips:spell.origin===d.className?prepared:granted;
    const status=atWill?null:group===prepared?'Prepared':always.has(spell.origin)?'Always prepared':'Granted';
    group.push(spellRow(spell.name,{...spell,status:status?copy(status):null,
      calculation:'DC '+spell.dc+' · '+signed(spell.attack)+' '+copy('spell attack')}));
  }
  const book=s.book.map(name=>spellRow(name,{status:prepared.some(row=>row.label===name)?copy('Prepared'):null}));
  const slots=s.slots.map(({level,count})=>({
    label:levelLabel(level),icon:'slot',pact:d.className==='Warlock',summary:spent?copy('{remaining} of {max} remaining',{remaining:count-(spent[level]??0),max:count}):
      copy('{max} at full resources',{max:count}),page:d.className==='Warlock'?71:104,
    description:d.className==='Warlock'?copy('Pact Magic slots return after a Short or Long Rest.'):copy('Expended spell slots return after a Long Rest.'),
    actions:slotActions?.(level,count),facets:{level:[levelLabel(level)]}
  }));
  gear.sort((a,b)=>Number(b.facets.state.includes('Equipped'))-Number(a.facets.state.includes('Equipped')));
  return Object.fromEntries(Object.entries({classRows,origins,feats,checks,saves,training,attacks,mastery,gear,customRows,cantrips,prepared,granted,book,slots})
    .map(([key,rows])=>[key,idRows(rows)]));
}

const spellFacets={level:'Spell level',school:'School',trait:'Spell properties',origin:'Feature source'};
export const sheetCollections={
  classRows:['Class & subclass features',{origin:'Feature source'}], origins:['Species & background',{origin:'Feature source'}],
  feats:['Feats'], checks:['Ability checks',{ability:'Ability',training:'Proficiency'}], saves:['Saving throws',{training:'Proficiency'}],
  training:['Training, proficiencies & languages',{kind:'Category'}], attacks:['Attacks',{category:'Category',damage:'Damage type',mastery:'Weapon Mastery'}],
  mastery:['Weapon Mastery',{mastery:'Weapon Mastery'}],gear:['Inventory & equipment',{kind:'Category',state:'Equipment state',source:'Source'}],
  customRows:['Custom content',{kind:'Category',level:'Spell level'}],cantrips:['Cantrips',spellFacets],
  prepared:['Prepared class spells',spellFacets],granted:['Granted spells',spellFacets],
  book:['Wizard spellbook',spellFacets],slots:['Spell slots',{level:'Spell level'}]
};

export function sheetGroup(render,entities,...keys) {
  return keys.map(key=>{
    const [title,facets]=sheetCollections[key];
    const label=key==='slots'&&entities.slots.some(row=>row.pact)?'Pact Magic slots':title;
    return render(key,copy(label),entities[key],facets);
  }).join('');
}
