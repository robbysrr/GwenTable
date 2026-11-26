#!/usr/bin/env python3
"""Original GwenTable compact fillable PDF. Editable AcroForm, SRD 5.2.1.
No rules calculations: accepts normalized, pre-validated field-value dictionary.
Usage: python build_compact.py --paper a4 --mode full --output sheet.pdf [--data fields.json]
"""
import argparse,json,os
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

COL={
 'ink':'#2C2633','plum':'#38293F','plum2':'#634B6A','mid':'#605B67','muted':'#6D6771',
 'line':'#C7C1CA','faint':'#EDE9EF','field':'#FCFBFD','wash':'#F7F4F8','gold':'#BB9556',
 'white':'#FFFFFF','pale':'#FAF8FB'
}
C={k:colors.HexColor(v) for k,v in COL.items()}
FONTS=[('Lato','/usr/share/fonts/truetype/lato/Lato-Regular.ttf'),('Lato-Bold','/usr/share/fonts/truetype/lato/Lato-Bold.ttf')]
for n,p in FONTS:
 if os.path.isfile(p):pdfmetrics.registerFont(TTFont(n,p))
REG='Lato' if 'Lato' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'
BOLD='Lato-Bold' if 'Lato-Bold' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold'
AB=[('STR','str'),('DEX','dex'),('CON','con'),('INT','int'),('WIS','wis'),('CHA','cha')]
SKILLS=[('Acrobatics','DEX'),('Animal Handling','WIS'),('Arcana','INT'),('Athletics','STR'),('Deception','CHA'),('History','INT'),('Insight','WIS'),('Intimidation','CHA'),('Investigation','INT'),('Medicine','WIS'),('Nature','INT'),('Perception','WIS'),('Performance','CHA'),('Persuasion','CHA'),('Religion','INT'),('Sleight of Hand','DEX'),('Stealth','DEX'),('Survival','WIS')]
PAPERS={'a4':A4,'letter':letter}

class Sheet:
 def __init__(self,path,paper='a4',data=None,mode='full'):
  self.W,self.H=PAPERS[paper];self.paper=paper;self.mode=mode
  self.sx=(self.W-48)/(A4[0]-48);self.sy=(self.H-48)/(A4[1]-48);self.scale=min(self.sx,self.sy)
  self.c=canvas.Canvas(str(path),pagesize=(self.W,self.H),pageCompression=1)
  self.c.setTitle('GwenTable | Compact 2024 Character Sheet (Fillable)')
  self.c.setAuthor('GwenTable | independent original sheet | SRD 5.2.1')
  self.data=data or {};self.fields=[];self.page=0;self.total_override=4 if mode=='complete' else None
 def x(self,x):return 24+(x-24)*self.sx
 def y(self,t):return self.H-(24+(t-24)*self.sy)
 def w(self,n):return n*self.sx
 def h(self,n):return n*self.sy
 def rect(self,x,t,w,h,fill=None,stroke=None,r=0,line=.6):
  c=self.c;c.setLineWidth(line*self.scale)
  if stroke:c.setStrokeColor(C.get(stroke,stroke))
  if fill:c.setFillColor(C.get(fill,fill))
  fn=c.roundRect if r else c.rect
  args=(self.x(x),self.y(t+h),self.w(w),self.h(h))
  if r:args+= (r*self.scale,)
  fn(*args,fill=int(bool(fill)),stroke=int(bool(stroke)))
 def line(self,x,t,x2,t2,color='line',weight=.6):
  c=self.c;c.setStrokeColor(C.get(color,color));c.setLineWidth(weight*self.scale)
  c.line(self.x(x),self.y(t),self.x(x2),self.y(t2))
 def txt(self,x,t,s,size=8,weight='regular',color='ink'):
  c=self.c;c.setFillColor(C.get(color,color));c.setFont(BOLD if weight=='bold' else REG,size*self.scale);c.drawString(self.x(x),self.y(t),str(s))
 def right(self,x,t,s,size=8,weight='regular',color='ink'):
  c=self.c;c.setFillColor(C.get(color,color));c.setFont(BOLD if weight=='bold' else REG,size*self.scale);c.drawRightString(self.x(x),self.y(t),str(s))
 def head(self,title,tag,number,total):
  self.page+=1
  self.rect(0,0,595,7,'plum')
  self.rect(24,21,3,33,'gold')
  self.txt(37,37,'GWENTABLE',17,'bold','plum')
  self.txt(38,50,'ORIGINAL 2024 CHARACTER RECORD',7.3,'regular','muted')
  self.right(571,36,title,13,'bold','plum')
  self.right(571,50,tag.upper(),7.1,'bold','plum2')
  self.line(24,61,571,61,'line',.7)
  self._total=self.total_override or total
 def footer(self):
  self.line(24,802,571,802,'line',.6)
  self.txt(24,815,'SRD 5.2.1   /   ORIGINAL & INDEPENDENT   /   PRINT AT 100%',7.2,'regular','muted')
  self.right(571,815,f'{self.page:02d} / {self._total:02d}     {self.paper.upper()}',7.2,'bold','plum2')
  self.c.showPage()
 def section(self,title,top,x=24,w=547,detail=None):
  self.rect(x,top,3,15,'plum2')
  self.txt(x+11,top+11.5,title.upper(),9.15,'bold','plum')
  if detail:self.right(x+w,top+11,detail,7.1,'regular','muted')
  self.line(x,top+19,x+w,top+19,'faint',.85)
 def textfield(self,name,x,t,w,h=19,label=None,size=9,maxlen=0,multiline=False,kind='normal'):
  if label:self.txt(x,t+6.5,label.upper(),6.5,'bold','muted')
  ty=t+9 if label else t
  val=self.data.get(name,'')
  if val is None:val=''
  if not isinstance(val,(str,int,float)):val=json.dumps(val,ensure_ascii=True)
  val=str(val)
  self.c.acroForm.textfield(name=name,tooltip=label or name,x=self.x(x),y=self.y(ty+h),
   width=self.w(w),height=self.h(h),borderStyle='solid',borderWidth=.55*self.scale,
   borderColor=C['line'],fillColor=C['field'],textColor=C['ink'],fontName='Helvetica',
   fontSize=size*self.scale,forceBorder=True,value=val,maxlen=maxlen or 0,
   fieldFlags='multiline' if multiline else '')
  self.fields.append({'name':name,'page':self.page,'type':'text','label':label or name,'rect_master':[x,ty,w,h]})
 def checkbox(self,name,x,t,size=11,label=None):
  raw=self.data.get(name,False)
  checked=raw is True or str(raw).lower() in ('yes','on','true','1','checked')
  self.c.acroForm.checkbox(name=name,tooltip=label or name,x=self.x(x),y=self.y(t+size),
   size=size*self.scale,buttonStyle='check',shape='square',checked=checked,
   borderWidth=.8,borderColor=C['line'],fillColor=C['white'],textColor=C['plum'],forceBorder=True)
  self.fields.append({'name':name,'page':self.page,'type':'checkbox','label':label or name,'rect_master':[x,t,size,size]})
 def micro_identity(self):
  self.textfield(f'identity.name.page{self.page}',24,72,284,18,'Character name',9.5)
  self.textfield(f'identity.class.page{self.page}',317,72,145,18,'Class',9.2)
  self.textfield(f'identity.level.page{self.page}',471,72,100,18,'Level',9.2)
 def identity(self):
  self.textfield('identity.name',24,72,240,20,'Character name',11)
  self.textfield('identity.class',274,72,98,20,'Class',9)
  self.textfield('identity.subclass',381,72,142,20,'Subclass',9)
  self.textfield('identity.level',533,72,38,20,'Level',10)
  self.textfield('identity.species',24,110,116,19,'Species',8.5)
  self.textfield('identity.background',148,110,113,19,'Background',8.5)
  self.textfield('identity.origin_feat',269,110,130,19,'Origin feat',8.5)
  self.textfield('identity.player',407,110,101,19,'Player',8.5)
  self.textfield('progression.xp',516,110,55,19,'XP',8.5)
 def combat(self,offset=0):
  y=148+offset
  self.section('Survival & combat',y,detail='Your most-used numbers, all in one place')
  # five prominent values
  fields=[('combat.ac','ARMOR CLASS',51),('combat.initiative','INITIATIVE',66),('combat.speed','SPEED (FT)',68),('combat.proficiency_bonus','PROFICIENCY',76),('combat.passive_perception','PASSIVE PERCEPTION',104)]
  x=24
  for name,label,width in fields:
   self.textfield(name,x,y+27,width,26,label,12.3)
   x+=width+9
  self.checkbox('combat.heroic_inspiration',x+2,y+41,12,'Heroic Inspiration')
  self.txt(x+18,y+43,'HEROIC',6.5,'bold','plum2');self.txt(x+18,y+53,'INSP.',6.5,'bold','plum2')
  x=24
  for name,label,width in [('combat.hp_current','CURRENT HP',72),('combat.hp_max','MAX HP',72),('combat.hp_temporary','TEMP HP',72),('combat.hit_dice_remaining','HIT DICE LEFT',86),('combat.conditions','CONDITIONS',128),('combat.exhaustion','EXHAUSTION',72)]:
   self.textfield(name,x,y+72,width,22,label,11 if width<100 else 8.5)
   x+=width+9
  self.txt(25,y+127,'DEATH SAVES',7.6,'bold','plum')
  self.txt(117,y+127,'SUCCESS',7,'regular','muted')
  for i in range(1,4):self.checkbox(f'combat.death_success_{i}',169+(i-1)*18,y+116,11)
  self.txt(241,y+127,'FAILURE',7,'regular','muted')
  for i in range(1,4):self.checkbox(f'combat.death_failure_{i}',295+(i-1)*18,y+116,11)
  self.checkbox('combat.stable',369,y+116,11,'Stable');self.txt(386,y+127,'STABLE',7,'regular','muted')
  self.checkbox('combat.concentrating',439,y+116,11,'Concentrating');self.txt(456,y+127,'CONCENTRATING',7,'regular','muted')
 def abilities(self,top=290):
  self.section('Ability scores & saves',top,detail='Score / modifier / saving throw')
  cw=85.4;gap=6.85
  for i,(lab,key) in enumerate(AB):
   x=24+i*(cw+gap)
   self.rect(x,top+26,cw,75,'wash','faint',5)
   self.txt(x+8,top+39,lab,8.6,'bold','plum')
   self.textfield(f'abilities.{key}.score',x+7,top+43,31,22,size=11.5)
   self.textfield(f'abilities.{key}.modifier',x+44,top+43,34,22,size=11.5)
   self.txt(x+9,top+72,'SCORE',6.3,'regular','muted');self.txt(x+47,top+72,'MOD',6.3,'regular','muted')
   self.checkbox(f'abilities.{key}.save_proficient',x+8,top+84,11,f'{lab} save proficient')
   self.txt(x+22,top+93,'SAVE',6.3,'bold','plum2')
   self.textfield(f'abilities.{key}.save_bonus',x+52,top+79,26,17,size=8.5)
 def skills(self,top=401):
  self.section('Skills',top,detail='P: proficient   E: expertise')
  for col in range(2):
   x=24+276*col
   self.txt(x+170,top+29,'ABILITY',6.2,'bold','muted')
   self.txt(x+213,top+29,'P',6.2,'bold','muted')
   self.txt(x+231,top+29,'E',6.2,'bold','muted')
   self.txt(x+252,top+29,'BONUS',6.2,'bold','muted')
  for idx,(name,ability) in enumerate(SKILLS):
   col=idx//9;row=idx%9;x=24+276*col;y=top+34+row*18.05
   if row%2==0:self.rect(x,y,270,17,'wash',None,2)
   self.txt(x+5,y+12,name,8.2,'regular','ink')
   self.txt(x+177,y+12,ability,6.7,'bold','mid')
   slug=name.lower().replace(' ','_')
   self.checkbox(f'skills.{slug}.proficient',x+208,y+2,10,f'{name} proficient')
   self.checkbox(f'skills.{slug}.expertise',x+226,y+2,10,f'{name} expertise')
   self.textfield(f'skills.{slug}.bonus',x+245,y+1,24,15,size=8.0)
 def attacks(self,top=609):
  self.section('Attacks & weapon mastery',top,detail='Include reach or range where relevant')
  columns=[(24,'WEAPON / ATTACK'),(206,'TO HIT'),(266,'DAMAGE & TYPE'),(422,'RANGE'),(488,'MASTERY')]
  for x,lab in columns:self.txt(x,top+30,lab,6.3,'bold','muted')
  for i in range(4):
   y=top+35+i*25
   for name,x,w,size in [('name',24,175,8.6),('bonus',206,53,8.6),('damage',266,148,8.6),('range',422,59,8.6),('mastery',488,83,8.6)]:
    self.textfield(f'attacks.{i}.{name}',x,y,w,19,size=size)
  self.textfield('combat.senses',24,top+143,163,19,'Senses',8.6)
  self.textfield('combat.resistances',197,top+143,177,19,'Resistances / immunities',8.6)
  self.textfield('combat.other_defenses',384,top+143,187,19,'Other defenses',8.6)
 def page_one(self,quick=False):
  self.head('AT THE TABLE','combat / checks / attacks',1 if quick else 1,1 if quick else 3)
  self.identity();self.combat();self.abilities();self.skills();self.attacks();self.footer()
 def page_two(self):
  self.head('TOOLS & BELONGINGS','abilities / features / inventory',2,3);self.micro_identity()
  self.section('Class & subclass features',105,detail='Name, trigger, uses and short effect')
  for x,lab in [(24,'FEATURE / ACTION'),(195,'ACTIVATION'),(277,'USES'),(329,'EFFECT / NOTES')]:self.txt(x,136,lab,6.5,'bold','muted')
  for i in range(7):
   y=141+i*23
   for name,x,w in [('name',24,163),('activation',195,74),('uses',277,44),('notes',329,242)]:self.textfield(f'features.{i}.{name}',x,y,w,18,size=8.2)
  self.section('Feats & species / background traits',310)
  for x,lab in [(24,'FEAT / TRAIT'),(233,'SOURCE'),(331,'EFFECT / NOTES')]:self.txt(x,341,lab,6.5,'bold','muted')
  for i in range(4):
   y=346+i*23
   for name,x,w in [('name',24,201),('source',233,90),('notes',331,240)]:self.textfield(f'traits.{i}.{name}',x,y,w,18,size=8.2)
  self.section('Resources & recovery',445,detail='Track uses here, not only in the description')
  for x,lab in [(24,'RESOURCE'),(237,'MAX'),(290,'LEFT'),(343,'RECOVERY / NOTES')]:self.txt(x,476,lab,6.5,'bold','muted')
  for i in range(3):
   y=481+i*23
   for name,x,w in [('name',24,205),('max',237,45),('remaining',290,45),('recovery',343,228)]:self.textfield(f'resources.{i}.{name}',x,y,w,18,size=8.2)
  self.section('Equipment & carried items',566,detail='Use the continuation if you need more room')
  for x,lab in [(24,'ITEM'),(244,'QTY'),(288,'WEIGHT'),(348,'EQUIP'),(390,'NOTES / LOCATION')]:self.txt(x,598,lab,6.5,'bold','muted')
  for i in range(7):
   y=603+i*21
   for name,x,w in [('name',24,212),('quantity',244,36),('weight',288,52),('notes',390,181)]:self.textfield(f'inventory.{i}.{name}',x,y,w,16,size=8.1)
   self.checkbox(f'inventory.{i}.equipped',359,y+3,10)
  for name,x,w,label in [('currency.cp',24,65,'CP'),('currency.sp',97,65,'SP'),('currency.ep',170,65,'EP'),('currency.gp',243,65,'GP'),('currency.pp',316,65,'PP'),('currency.other',389,77,'OTHER'),('inventory.carried_weight',474,46,'WT (LB)'),('inventory.carry_limit',528,43,'MAX (LB)')]:
   self.textfield(name,x,755,w,20,label,8.7)
  self.footer()
 def slotgrid(self,top=169):
  self.txt(24,top+8,'SPELL SLOTS',8.1,'bold','plum')
  self.txt(24,top+19,'Left box: total  /  right box: used',6.8,'regular','muted')
  step=61.0
  for i in range(1,10):
   x=24+(i-1)*step
   self.rect(x,top+26,54,61,'wash','faint',4)
   self.txt(x+9,top+39,f'LEVEL {i}',6.3,'bold','plum')
   self.textfield(f'spellcasting.slots.{i}.total',x+5,top+44,20,18,size=8)
   self.textfield(f'spellcasting.slots.{i}.used',x+29,top+44,20,18,size=8)
   self.txt(x+8,top+78,'TOTAL',5.6,'regular','muted');self.txt(x+32,top+78,'USED',5.6,'regular','muted')
 def spellrow(self,i,top,prefix='spells',lineh=21.8):
  y=top+i*lineh
  if i%2==0:self.rect(24,y-1,547,lineh,'wash')
  for n,x,w in [('name',24,193),('level',225,31),('casting_time',313,81),('range',402,70),('notes',480,91)]:
   self.textfield(f'{prefix}.{i}.{n}',x,y, w,lineh-3.4,size=8.2)
  self.checkbox(f'{prefix}.{i}.prepared',265,y+3,10)
  self.checkbox(f'{prefix}.{i}.ritual',287,y+3,10)
 def spellheader(self,top):
  for x,label in [(24,'SPELL'),(225,'LV'),(265,'P'),(287,'R'),(313,'CAST TIME'),(402,'RANGE'),(480,'DURATION / NOTES')]:
   self.txt(x,top,label,6.5,'bold','muted')
 def page_three(self):
  self.head('SPELLS & DETAILS','prepared spells / training / notes',3,3);self.micro_identity()
  self.section('Spellcasting',104,detail='P: prepared   R: ritual')
  for name,x,w,label in [('spellcasting.ability',24,103,'Casting ability'),('spellcasting.save_dc',135,73,'Save DC'),('spellcasting.attack_bonus',216,86,'Spell attack'),('spellcasting.prepared_count',310,72,'Prepared'),('spellcasting.focus',390,181,'Focus / pact notes')]:self.textfield(name,x,135,w,20,label,9.1)
  self.slotgrid(181)
  self.section('Cantrips',279)
  for i in range(5):self.textfield(f'spellcasting.cantrips.{i}',24+i*110.5,307,105,20,size=8.5)
  self.section('Prepared, known & granted spells',348,detail='P: prepared   R: ritual')
  self.spellheader(381)
  for i in range(14):self.spellrow(i,387,'spells',21.7)
  self.section('Training & notes',701)
  self.textfield('proficiencies.armor',24,730,135,18,'Armor training',8.2)
  self.textfield('proficiencies.weapons',167,730,174,18,'Weapons / tools',8.2)
  self.textfield('identity.languages',349,730,222,18,'Languages',8.2)
  self.rect(24,761,547,37,'wash',None,3)
  self.txt(29,770,'SOURCE & LICENSE',7,'bold','plum')
  self.txt(29,779,'This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC,',7.1,'regular','mid')
  self.txt(29,787,'available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons',7.1,'regular','mid')
  self.txt(29,795,'Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.',7.1,'regular','mid')
  self.footer()
 def page_continuation(self):
  self.head('SPELL CONTINUATION','optional extra page',1,1);self.micro_identity()
  self.section('Additional spells',106,detail='P: prepared   R: ritual   /   duplicate this page as needed')
  self.spellheader(143)
  for i in range(25):self.spellrow(i,149,'extra_spells',23.8)
  self.textfield('spellcasting.extra_notes',24,754,547,22,'Other spell notes',8.8)
  self.footer()
 def page_equipment(self):
  self.head('EXTRA NOTES & GEAR','optional additional page',1,1);self.micro_identity()
  self.section('More carried items',106)
  for x,lab in [(24,'ITEM'),(244,'QTY'),(288,'WEIGHT'),(348,'EQUIP'),(390,'NOTES / LOCATION')]:self.txt(x,144,lab,6.5,'bold','muted')
  for i in range(17):
   y=150+i*23
   for name,x,w in [('name',24,212),('quantity',244,36),('weight',288,52),('notes',390,181)]:self.textfield(f'extra_inventory.{i}.{name}',x,y,w,18,size=8.1)
   self.checkbox(f'extra_inventory.{i}.equipped',359,y+4,10)
  self.section('Story, goals & character notes',565)
  self.textfield('story.personality',24,595,266,20,'Personality / presentation',8.8)
  self.textfield('story.goals',299,595,272,20,'Goals / ideals',8.8)
  self.textfield('story.bonds',24,633,266,20,'Bonds / allies',8.8)
  self.textfield('identity.appearance',299,633,272,20,'Appearance',8.8)
  self.textfield('story.notes',24,672,547,80,'Notes / reminders',8.7,multiline=True)
  self.footer()
 def page_overflow(self):
  """Retains every v0.1 full-form field excluded from the compact three-page view."""
  self.head('EXPANDED RECORD','additional entries / character story',4,4);self.micro_identity()
  self.section('Additional class features',106)
  for x,lab in [(24,'FEATURE / ACTION'),(195,'ACTIVATION'),(277,'USES'),(329,'EFFECT / NOTES')]:self.txt(x,138,lab,6.5,'bold','muted')
  for i in range(7,9):
   y=144+(i-7)*23
   for n,x,w in [('name',24,163),('activation',195,74),('uses',277,44),('notes',329,242)]:self.textfield(f'features.{i}.{n}',x,y,w,18,size=8.2)
  self.section('Additional feats & traits',200)
  for x,lab in [(24,'FEAT / TRAIT'),(233,'SOURCE'),(331,'EFFECT / NOTES')]:self.txt(x,232,lab,6.5,'bold','muted')
  for i in range(4,7):
   y=238+(i-4)*23
   for n,x,w in [('name',24,201),('source',233,90),('notes',331,240)]:self.textfield(f'traits.{i}.{n}',x,y,w,18,size=8.2)
  self.section('Additional resources & carrying',314)
  for n,x,w,lab in [('name',24,200,'Resource'),('max',232,49,'Max'),('remaining',289,49,'Left'),('recovery',346,225,'Recovery / notes')]:
   self.textfield(f'resources.3.{n}',x,341,w,17,lab,8)
  self.textfield('inventory.capacity_notes',24,375,547,16,'Capacity / special load notes',8)
  self.section('Additional equipment',411)
  for x,lab in [(24,'ITEM'),(244,'QTY'),(288,'WEIGHT'),(348,'EQUIP'),(390,'NOTES / LOCATION')]:self.txt(x,443,lab,6.5,'bold','muted')
  for i in range(7,11):
   y=448+(i-7)*21
   for n,x,w in [('name',24,212),('quantity',244,36),('weight',288,52),('notes',390,181)]:self.textfield(f'inventory.{i}.{n}',x,y,w,16,size=8.2)
   self.checkbox(f'inventory.{i}.equipped',359,y+3,10)
  self.section('Additional spells',540,detail='P: prepared   R: ritual')
  self.spellheader(571)
  for i in range(14,17):self.spellrow(i,578-14*21.5,'spells',21.5)
  self.section('Identity, personality & notes',664)
  for name,x,w,label in [('identity.campaign',24,121,'Campaign'),('identity.alignment',152,81,'Alignment'),('identity.pronouns',240,86,'Pronouns'),('identity.hit_die',333,70,'Hit die'),('identity.appearance',410,161,'Appearance')]:
   self.textfield(name,x,689,w,16,label,8.1)
  self.textfield('story.personality',24,725,267,16,'Personality',8.1)
  self.textfield('story.goals',299,725,272,16,'Goals / ideals',8.1)
  self.textfield('story.bonds',24,762,267,16,'Bonds / allies',8.1)
  self.textfield('story.notes',299,762,272,16,'Notes / reminders',8.1)
  self.footer()

 def build(self):
  if self.mode=='full':self.page_one();self.page_two();self.page_three()
  elif self.mode=='complete':self.page_one();self.page_two();self.page_three();self.page_overflow()
  elif self.mode=='quick':self.page_one(quick=True)
  elif self.mode=='spells':self.page_continuation()
  elif self.mode=='notes':self.page_equipment()
  elif self.mode=='overflow':self.page_overflow()
  else:raise ValueError(self.mode)
  self.c.save()
  return {'version':'0.2','paper':self.paper,'mode':self.mode,'page_count':self.page,'field_count':len(self.fields),'fields':self.fields}

def main():
 p=argparse.ArgumentParser();p.add_argument('--paper',choices=PAPERS,default='a4');p.add_argument('--mode',choices=['full','complete','quick','spells','notes','overflow'],default='full');p.add_argument('--output',required=True);p.add_argument('--data');p.add_argument('--fields-output');args=p.parse_args()
 values=json.load(open(args.data,encoding='utf8')) if args.data else None
 sheet=Sheet(args.output,args.paper,values,args.mode);manifest=sheet.build()
 if args.fields_output:Path(args.fields_output).write_text(json.dumps(manifest,indent=2),encoding='utf8')
 print(f'{args.mode}/{args.paper}: {manifest["page_count"]} page(s), {manifest["field_count"]} fields -> {args.output}')
if __name__=='__main__':main()
