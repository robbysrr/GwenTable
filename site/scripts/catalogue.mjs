import {createHash} from 'node:crypto';
import {source, array, abilities, refs, alignments, skills, languages, styles} from '../dist/lib/rules.js';
import {classes, backgrounds, species, spellLists, weaponProfiles, tools, rareLanguages, originFeats} from '../dist/lib/catalog.js';
const spellListPages={Bard:33,Cleric:38,Druid:44,Paladin:55,Ranger:60,Sorcerer:67,Warlock:74,Wizard:79};
const items = [
  ...Object.entries(classes).flatMap(([name,c])=>[
    ['Class',name,[c.page,name],c],
    ['Subclass',c.subclass,[c.subclassPage,name+' subclass'],{level:3}]
  ]),
  ...Object.entries(species).map(([name,data])=>['Species',name,[data.page,name],data]),
  ...Object.entries(backgrounds).map(([name,data])=>['Background',name,'background',data]),
  ...abilities.map(name=>['Ability',name,'abilities',array]),
  ...Object.entries(skills).map(([name,ability])=>['Skill',name,'skills',{ability:abilities[ability]}]),
  ...alignments.map(name=>['Alignment',name,'abilities',null]),
  ...['Common',...languages,...rareLanguages].map(name=>['Language',name,'languages',null]),
  ...tools.map(name=>['Tool',name,[93,'Tools'],null]),
  ...originFeats.map(name=>['Origin feat',name,'feats',null]),
  ...styles.map(name=>['Fighting Style',name,name==='Archery'?'archery':'style',null]),
  ...Object.entries(weaponProfiles).map(([name,[damage,type,category,properties,mastery]])=>['Weapon',name,'weapons',{damage,type,category,properties,mastery}]),
  ...Object.entries(spellLists).map(([name,rows])=>['Spell list',name+' · levels 0–6',[spellListPages[name],name+' spell list'],{rows}])
];
export const entries = items.map(([type,canonicalLabel,ref,structuredData])=>{
  const [sourcePrintPage,sectionPath]=Array.isArray(ref)?ref:refs[ref];
  return {
    sourceId:source.id, slug:canonicalLabel.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
    canonicalLabel,type,sourcePrintPage,sectionPath,licenseId:source.license,structuredData,
    fieldProvenance:Object.fromEntries(Object.keys(structuredData??{}).map(key=>[key,sourcePrintPage])),
    manualReviewStatus:'included-slice',ruleRevision:source.version,changedFromSource:structuredData!==null,
    packageVersion:'0.2.0',contentHash:createHash('sha256').update(JSON.stringify([canonicalLabel,structuredData])).digest('hex')
  };
});
export const coverage={source,counts:entries.reduce((counts,item)=>({...counts,[item.type]:(counts[item.type]??0)+1}),{}),entries};
