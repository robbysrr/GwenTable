// GwenTable Character Sheet v0.3 (approved fillable kit): map canonical character state
// onto the kit's stable AcroForm field names, then fill the matching template in the browser.
// Values come only from the derived profile and saved play state; nothing is recalculated here.
import {abilities} from './rules.js';
import {spellHeaders} from './spell-headers.js';
import {distance} from './distances.js';

export const sheetV03Variants=Object.freeze({
  quick:{label:'Quick Reference',file:'Quick_Reference',pages:1},
  compact:{label:'Compact',file:'Compact',pages:3},
  complete:{label:'Complete',file:'Complete',pages:4}
});
export const sheetV03Papers=Object.freeze({a4:'A4',letter:'LETTER'});
export const sheetV03TemplatePath=(variant,paper)=>{
  if(!Object.hasOwn(sheetV03Variants,variant)||!Object.hasOwn(sheetV03Papers,paper))throw new Error('Choose a supported sheet and paper size.');
  return `./sheets/GwenTable_${sheetV03Variants[variant].file}_${sheetV03Papers[paper]}_v03_Fillable.pdf`;
};

const signed=n=>Number.isFinite(n)?(n>=0?'+'+n:String(n)):'';
const key=name=>name.toLowerCase().replace(/[^a-z]+/g,'_').replace(/^_|_$/g,'');
const abbreviations=['str','dex','con','int','wis','cha'];
const senseWords=/^(Darkvision|Blindsight|Tremorsense|Truesight)\b/;

function recovery(pool){
  if(pool.short==='all')return 'Short or Long Rest';
  if(pool.short)return 'Long Rest; '+pool.short+' on Short Rest';
  return 'Long Rest';
}
function rangeOf(properties=''){
  const match=/Range ([0-9/]+)/.exec(properties)||/Thrown \(Range ([0-9/]+)\)/.exec(properties);
  return match?match[1]+' ft':'Melee';
}
function inventoryRow(text){
  const match=/^(\d+)\s+(.+)$/.exec(text);
  return match?{name:match[2],quantity:match[1]}:{name:text,quantity:'1'};
}

/** Flat {fieldName: string|boolean} for the v0.3 kit. `clean` shows a fresh, fully rested build. */
export function sheetV03Values(profile,play,{clean=false}={}){
  const {d,s}=profile;
  const v={};
  const level=profile.totalLevel??d.level;
  const className=profile.multiclass?`Fighter ${profile.multiclass.primaryLevel} / Rogue ${profile.multiclass.secondaryLevel}`:d.className;
  Object.assign(v,{
    'identity.name':d.name,'identity.class':className,'identity.subclass':s.subclass??'','identity.level':String(level),
    'identity.species':d.lineage?`${d.species} (${d.lineage})`:d.species,'identity.background':d.background,
    'identity.origin_feat':s.featNames?.[0]??'','identity.languages':(s.languages??[]).join(', '),
    'identity.alignment':d.alignment??'','identity.hit_die':s.dice??''
  });
  for(const page of [2,3,4])Object.assign(v,{[`identity.name.page${page}`]:d.name,[`identity.class.page${page}`]:className,[`identity.level.page${page}`]:String(level)});
  const hp=clean?s.hp:play.hp,temp=clean?0:play.temp;
  const usedDice=clean?0:play.dice;
  const deathS=clean?0:play.successes,deathF=clean?0:play.failures;
  Object.assign(v,{
    'progression.xp':String(play.xp??s.xp??''),
    'combat.hp_current':String(hp),'combat.hp_max':String(s.hp),'combat.hp_temporary':temp?String(temp):'',
    'combat.ac':String(s.ac),'combat.initiative':signed(s.initiative)+(s.initiativeAdvantage?' (Adv.)':''),
    'combat.speed':distance(s.speed),'combat.proficiency_bonus':signed(s.proficiency),'combat.passive_perception':String(s.passive),
    'combat.hit_dice_remaining':profile.hitDicePools?profile.hitDicePools.map(pool=>`${pool.count-(clean?0:(play.hitDiceSpent?.[pool.die]??0))}/${pool.count} d${pool.die}`).join(', '):`${profile.dice-usedDice}/${profile.dice} d${profile.die}`,
    'combat.exhaustion':String(clean?0:play.exhaustion),'combat.conditions':clean?'':(play.conditions??[]).join(', '),
    'combat.stable':!clean&&Boolean(play.stable),'combat.concentrating':!clean&&Boolean(play.focus),
    'combat.senses':(s.traits??[]).filter(t=>senseWords.test(t)).join('; ')
  });
  for(let i=1;i<=3;i++){v[`combat.death_success_${i}`]=deathS>=i;v[`combat.death_failure_${i}`]=deathF>=i;}
  (s.attacks??[]).forEach((a,i)=>Object.assign(v,{
    [`attacks.${i}.name`]:a.name,[`attacks.${i}.bonus`]:signed(a.bonus),
    [`attacks.${i}.damage`]:`${a.dice}${a.mod?signed(a.mod):''} ${a.type}`,[`attacks.${i}.range`]:rangeOf(a.properties),
    [`attacks.${i}.mastery`]:a.mastery??''
  }));
  abbreviations.forEach((abbr,i)=>Object.assign(v,{
    [`abilities.${abbr}.score`]:String(s.scores[i]),[`abilities.${abbr}.modifier`]:signed(s.mods[i]),
    [`abilities.${abbr}.save_bonus`]:signed(s.saves[i]),[`abilities.${abbr}.save_proficient`]:s.saves[i]-s.mods[i]>=s.proficiency
  }));
  for(const row of s.skills??[])Object.assign(v,{
    [`skills.${key(row.name)}.proficient`]:Boolean(row.trained||row.expert),[`skills.${key(row.name)}.expertise`]:Boolean(row.expert),
    [`skills.${key(row.name)}.bonus`]:signed(row.total)
  });
  (profile.resources??[]).forEach((pool,i)=>Object.assign(v,{
    [`resources.${i}.name`]:pool.name,[`resources.${i}.max`]:String(pool.max),
    [`resources.${i}.remaining`]:String(clean?pool.max:pool.max-(play.counters?.[pool.id]??0)),[`resources.${i}.recovery`]:recovery(pool)
  }));
  const features=[...(s.features??[]).map(name=>({name,activation:'Class'})),...(s.featNames??[]).map(name=>({name,activation:'Feat'}))];
  features.forEach((f,i)=>Object.assign(v,{[`features.${i}.name`]:f.name,[`features.${i}.activation`]:f.activation}));
  (s.traits??[]).forEach((name,i)=>Object.assign(v,{[`traits.${i}.name`]:name,[`traits.${i}.source`]:d.species}));
  (s.inventory??[]).map(inventoryRow).forEach((item,i)=>Object.assign(v,{[`inventory.${i}.name`]:item.name,[`inventory.${i}.quantity`]:item.quantity}));
  v['currency.gp']=String(s.gp??0);
  v['proficiencies.armor']=(s.armorTraining??[]).join(', ')||'None';
  v['proficiencies.weapons']=Array.isArray(s.weaponTraining)?s.weaponTraining.join(', '):String(s.weaponTraining??'');
  const known=s.known??[];
  const caster=known.find(spell=>spell.level>0)??known[0];
  if(caster)Object.assign(v,{'spellcasting.ability':caster.ability,'spellcasting.save_dc':String(caster.dc),'spellcasting.attack_bonus':signed(caster.attack),
    'spellcasting.prepared_count':String(known.filter(spell=>spell.level>0).length)});
  for(const {level:slot,count} of s.slots??[])Object.assign(v,{[`spellcasting.slots.${slot}.total`]:String(count),[`spellcasting.slots.${slot}.used`]:clean?'':String(play.slots?.[slot]??0)});
  known.filter(spell=>spell.level===0).forEach((spell,i)=>{v[`spellcasting.cantrips.${i}`]=spell.name;});
  const leveled=[...known.filter(spell=>spell.level>0).map(spell=>({...spell,prepared:true})),
    ...(s.book??[]).filter(name=>!known.some(spell=>spell.name===name)).map(name=>({name,level:null,prepared:false,note:'Spellbook'}))];
  leveled.forEach((spell,i)=>{
    const header=spellHeaders[spell.name];
    Object.assign(v,{[`spells.${i}.name`]:spell.name,[`spells.${i}.level`]:spell.level===null?'':String(spell.level),
      [`spells.${i}.prepared`]:spell.prepared,[`spells.${i}.ritual`]:/Ritual/.test(header?.[1]??'')||/\bR\b/.test(spell.tags??''),
      [`spells.${i}.casting_time`]:header?.[1]??'',[`spells.${i}.range`]:header?.[2]??'',[`spells.${i}.notes`]:[spell.origin,spell.note].filter(Boolean).join(' · ')});
  });
  const tools=(s.proficientTools??[]).join(', ');
  v['story.notes']=[tools&&'Tools: '+tools,d.story,d.trinket&&'Trinket: '+d.trinket].filter(Boolean).join('\n');
  return v;
}

/** Fill the v0.3 template in the browser. Fields missing from a shorter variant are skipped and counted. */
export async function makeSheetV03PDF(profile,play,{variant='complete',paper='a4',clean=false,fetchTemplate=url=>fetch(url).then(r=>{if(!r.ok)throw new Error('Template unavailable.');return r.arrayBuffer();})}={}){
  const {PDFDocument,StandardFonts}=await import('../vendor/pdf-lib.min.js');
  const pdf=await PDFDocument.load(await fetchTemplate(sheetV03TemplatePath(variant,paper)));
  const font=await pdf.embedFont(StandardFonts.Helvetica);
  const form=pdf.getForm();
  const values=sheetV03Values(profile,play,{clean});
  let filled=0,skipped=0,substituted=false;
  const safe=text=>Array.from(String(text).replace(/\r\n?/g,'\n'),ch=>{
    if(ch==='\n')return ch;
    try{font.encodeText(ch);return ch;}catch{substituted=true;return '?';}
  }).join('');
  const find=name=>form.getFieldMaybe?form.getFieldMaybe(name):form.getFields().find(f=>f.getName()===name);
  // Rows beyond this variant's capacity are listed in the notes field instead of being dropped.
  const overflow=[];
  for(const [name,value] of Object.entries(values)){
    const row=/^(attacks|resources|features|traits|inventory|spells)\.\d+\.name$/.exec(name);
    if(row&&value&&!find(name))overflow.push(value);
  }
  if(overflow.length&&find('story.notes'))values['story.notes']=[values['story.notes'],'Also: '+overflow.join(', ')].filter(Boolean).join('\n');
  for(const [name,value] of Object.entries(values)){
    const field=find(name);
    if(!field){if(value!==''&&value!==false)skipped++;continue;}
    if(typeof value==='boolean'){if('check' in field){value?field.check():field.uncheck();filled++;}continue;}
    if('setText' in field){
      const text=safe(value);
      const max=field.getMaxLength?.();
      field.setText(max?text.slice(0,max):text);filled++;
    }
  }
  form.updateFieldAppearances(font);
  return {bytes:await pdf.save(),pages:pdf.getPageCount(),filled,skipped,substituted,overflow:overflow.length,overflowListed:overflow.length>0&&Boolean(find('story.notes'))};
}
