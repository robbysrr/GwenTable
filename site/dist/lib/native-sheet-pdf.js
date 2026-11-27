import {appearanceEntries} from './appearance.js';
import {playAdvice} from '../play-guide.js';
import {copy} from '../locale.js';
import {distance} from './distances.js';
import {PDFDocument,PDFName,PDFString,StandardFonts,rgb} from '../vendor/pdf-lib.min.js';
import {abilities} from './rules.js';
import {spellReference} from './spell-reference.js';

export const paperSizes={a4:[595.28,841.89],letter:[612,792]};
const signed=value=>value>=0?'+'+value:String(value);
const list=values=>values.filter(Boolean).join(', ');
const pairs=rows=>rows.map(([name,value])=>name+': '+value);

function sections(profile,play,notes,edition,equipment) {
  const {d,s}=profile;
  const mixed=profile.multiclass;
  const identity=list([s.subclass,d.species,d.background,d.alignment,d.size]);
  const hitDice=mixed?profile.hitDicePools.map(pool=>{
    const spent=play.hitDiceSpent?.[pool.die]??0;
    return pool.className+' '+Math.max(0,pool.count-spent)+'/'+pool.count+' d'+pool.die;
  }).join('  |  '):((profile.dice-play.dice)+'/'+profile.dice+' d'+profile.die);
  const combat=[
    'Armor Class '+s.ac+'  |  Initiative '+signed(s.initiative)+(s.initiativeAdvantage?' (Advantage)':'')+'  |  Speed '+distance(s.speed),
    'HP '+play.hp+'/'+s.hp+'  |  Temporary HP '+play.temp+'  |  Hit Dice '+hitDice,
    'Passive Perception '+s.passive+'  |  Proficiency '+signed(s.proficiency)+'  |  Exhaustion '+play.exhaustion,
    'Death saves: '+play.successes+' successes, '+play.failures+' failures'+(play.dead?' (Dead)':play.stable?' (Stable)':''),
    ...(play.focus?['Concentrating on '+play.focus]:[]),
    ...((s.climbSpeed||s.swimSpeed)?[list([s.climbSpeed?'Climb '+s.climbSpeed+' ft':'',s.swimSpeed?'Swim '+s.swimSpeed+' ft':''])]:[])
  ];
  const stats=abilities.map((name,i)=>name+' '+s.scores[i]+' ('+signed(s.mods[i])+') · Save '+signed(s.saves[i]));
  const checks=s.skills.map(skill=>skill.name+' '+signed(skill.total)+(skill.expert?' (Expertise)':skill.trained?' (Proficient)':''));
  const weapons=s.attacks.map(a=>(a.custom?'[CUSTOM] ':'')+a.name+' · '+signed(a.bonus)+' to hit · '+a.dice+(a.mod?signed(a.mod):'')+' '+a.type+
    (a.mastery?' · '+a.mastery:'')+(a.disadvantage?' · Disadvantage':'')+(a.note?' · '+a.note:''));
  const gear=equipment
    ? ['Build armor: '+list([s.armor,s.shield]), ...equipment]
    : ['Armor: '+list([s.armor,s.shield]),'Starting gold: '+s.gp+' GP',...s.inventory];
  const training=pairs([['Armor training',list(s.armorTraining)||'None'],['Weapons',s.weaponTraining],['Tools',list(s.proficientTools)||'None'],['Languages',list(s.languages)]]);
  const resources=profile.resources.map(pool=>pool.name+': '+(pool.max-play.counters[pool.id])+'/'+pool.max);
  const spells=s.known.map(spell=>{
    const record=spellReference(spell.name);
    const casting=record?.resolution==='none'?'':record?.resolution==='save'?' · Save DC '+spell.dc:
      record?.resolution==='attack'?' · Spell attack '+signed(spell.attack):' · Caster DC '+spell.dc+' / spell attack '+signed(spell.attack);
    return spell.name+' · '+(spell.level===0?'Cantrip':'Level '+(spell.level??'?'))+' · '+spell.origin+' ('+spell.ability+')'+casting+
      (spell.tags&&spell.tags!=='—'?' · '+spell.tags:'')+(spell.note?' · '+spell.note:'')+(record?' · SRD p. '+record.page:'');
  });
  const slots=s.slots.map(({level,count})=>'Level '+level+': '+(count-play.slots[level])+'/'+count+' remaining');
  const custom=d.custom.map(entry=>entry.type+' · '+entry.name+(entry.type==='Item'?' ×'+entry.quantity:'')+' [CUSTOM / MANUAL]'+
    (entry.description&&notes?' — '+entry.description:''));
  const first=edition==='2014'?
    [['Ability scores and saves',stats],['Skills',checks],['Combat profile',combat],['Attacks',weapons],['Equipment and treasure',gear],['Languages and proficiencies',training]]:
    [['Combat profile',combat],['Ability scores and saves',stats],['Attacks and mastery',weapons],['Class resources',resources],['Skills',checks],['Equipment',gear],['Training and languages',training]];
  return [
    ['Character', [identity,play.xp.toLocaleString('en-US')+' XP']],
    ...(mixed?[["Multiclass allocation",[
      'Character Level '+profile.totalLevel+' · Fighter '+mixed.primaryLevel+' / Rogue '+mixed.secondaryLevel,
      'Primary Fighter proficiencies and features remain tied to Fighter level '+mixed.primaryLevel,
      'Rogue 1 Expertise, Sneak Attack '+(mixed.secondaryLevel>=3?'2d6':'1d6')+', Thieves’ Cant, and Weapon Mastery; Rogue level '+mixed.secondaryLevel,
      ...(mixed.secondaryLevel>=3?['Rogue subclass: Thief · Steady Aim · Fast Hands · Second-Story Work']:[]),
      'Hit Dice are tracked separately; levels above the recorded allocation are not granted.'
    ]]]:[]),
    ...first,
    ...(edition==='2014'?[['Class resources',resources]]:[]),
    ['Feats, class features, and species traits',[...s.featNames,...s.features,...s.traits]],
    [profile.pact?'Pact Magic slots':'Spell slots',slots],['Prepared and granted spells',spells],['Wizard spellbook',s.book],
    ['Private custom entries',custom],
    ['Notes',notes?[d.story,d.appearance?'Appearance: '+d.appearance:'',...appearanceEntries(d).map(([label,value])=>copy(label)+': '+value),d.personality?'Personality: '+d.personality:''].filter(Boolean):[]],
    ...playAdvice(d,s).map(([title,rows])=>[copy('How to play')+' · '+title,rows.slice(0,4).map(([label,body,page])=>label+': '+body+(page?' (SRD p. '+page+')':''))]),
    ['Rules source',['This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.','GwenTable adapts SRD 5.2.1 for this original character sheet. Either layout uses the same 2024 rules.']]
  ].filter(([,rows])=>rows.length);
}

function wrap(value,font,size,maxWidth) {
  const rows=[];
  for(const paragraph of value.split('\n')) {
    let line='';
    for(const word of paragraph.split(/\s+/).filter(Boolean)) {
      const combined=line?line+' '+word:word;
      if(font.widthOfTextAtSize(combined,size)<=maxWidth) line=combined;
      else {
        if(line) rows.push(line);
        line='';
        for(const char of word) {
          if(line&&font.widthOfTextAtSize(line+char,size)>maxWidth) {
            rows.push(line);
            line='';
          }
          line+=char;
        }
      }
    }
    rows.push(line);
  }
  return rows;
}

export async function makeNativeSheetPDF(profile,play,{edition='2024',paper='a4',notes=true,clean=false,equipment}={}) {
  if(!Object.hasOwn(paperSizes,paper)||!['2014','2024'].includes(edition)) throw new Error('Choose a supported layout and paper size.');
  const pdf=await PDFDocument.create();
  const body=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const form=pdf.getForm();
  const fonts=pdf.context.obj({[body.name]:body.ref,[bold.name]:bold.ref});
  form.acroForm.dict.set(PDFName.of('DR'),pdf.context.obj({Font:fonts}));
  form.acroForm.dict.set(PDFName.of('DA'),PDFString.of('/Helvetica 10 Tf 0 g'));
  const [width,height]=paperSizes[paper];
  const margin=42;
  const textWidth=width-2*margin-6;
  const dark=rgb(.12,.14,.18);
  const muted=rgb(.26,.28,.31);
  const accent=edition==='2024'?rgb(.26,.14,.25):rgb(.37,.24,.15);
  const gold=rgb(.79,.63,.36);
  let substituted=false;
  let page;
  let y;
  let number=0;
  let fieldCount=0;
  function safe(value) {
    return Array.from(String(value).normalize('NFC').replace(/\r\n?/g,'\n'),char=>{
      if(char==='\n') return char;
      if(char==='\t') return ' ';
      try {body.encodeText(char);return char;}
      catch {substituted=true;return '[U+'+char.codePointAt(0).toString(16).toUpperCase()+']';}
    }).join('');
  }
  function write(text,size=10,font=body,color=dark) {
    page.drawText(text,{x:margin,y,size,font,color});
    y-=size+4;
  }
  function edit(text,label,size=10,font=body) {
    const field=form.createTextField(label+' '+(++fieldCount));
    field.setText(text);
    field.addToPage(page,{x:margin,y:y-4,width:width-2*margin,height:size+4,font,borderWidth:0,backgroundColor:undefined});
    field.setFontSize(size);
    field.updateAppearances(font);
    y-=size+4;
  }
  function newPage() {
    page=pdf.addPage([width,height]);
    number++;
    y=height-margin;
    page.drawRectangle({x:0,y:height-19,width,height:19,color:accent});
    page.drawRectangle({x:0,y:height-21,width,height:2,color:gold});
    write('GWENTABLE  /  '+edition+'-style  /  '+(clean?'Clean build':'Current play snapshot'),9,bold,muted);
    y-=12;
    const title=profile.d.name+' · Level '+(profile.totalLevel??profile.d.level)+' '+
      (profile.multiclass?'Fighter '+profile.multiclass.primaryLevel+' / Rogue '+profile.multiclass.secondaryLevel:profile.d.className);
    const size=number===1?20:13;
    for(const line of wrap(safe(title),bold,size,textWidth)) {
      if(number===1) edit(line,'Character name and level',size,bold);
      else write(line,size,bold,accent);
    }
    page.drawLine({start:{x:margin,y:y+3},end:{x:width-margin,y:y+3},color:accent,thickness:1});
    y-=12;
    page.drawText('GwenTable · SRD 5.2.1', {x:margin,y:25,size:8,font:body,color:muted});
    page.drawText(String(number), {x:width-margin-14,y:25,size:8,font:body,color:muted});
  }
  const blocks=sections(profile,play,notes,edition,equipment);
  newPage();
  for(const [title,rows] of blocks) {
    if(y<margin+50) newPage();
    write(title,12,bold,accent);
    for(const row of rows) {
      for(const line of wrap(safe(row),body,10,textWidth)) {
        if(y<margin) {
          newPage();
          write(title+' (continued)',11,bold,accent);
        }
        if(title==='Rules source'||!line) write(line);
        else edit(line,title.replace(/[.,]/g,''));
      }
    }
    y-=10;
  }
  pdf.setTitle(profile.d.name+' — '+edition+'-style GwenTable character sheet');
  return {bytes:await pdf.save({updateFieldAppearances:false}),pages:number,substituted};
}
