#!/usr/bin/env python3
"""GwenTable Field Sheet v0.3. Generates editable, print-ready AcroForms."""
import argparse
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from build_compact import AB, C, PAPERS, SKILLS, Sheet

C.update({key: colors.HexColor(value) for key, value in {
    'ink':'#17292B', 'plum':'#153B3D', 'plum2':'#286063', 'mid':'#34484A',
    'muted':'#42585A', 'line':'#829697', 'faint':'#C6D0CF', 'field':'#FFFFFF',
    'wash':'#F0F5F4', 'gold':'#875734', 'pale':'#FBF7F1', 'health':'#763D40',
}.items()})

FONT_DIR = Path('/usr/share/fonts/truetype')
FONTS = {
    'SheetSans': (FONT_DIR/'liberation/LiberationSans-Regular.ttf', 'Helvetica'),
    'SheetSansBold': (FONT_DIR/'liberation/LiberationSans-Bold.ttf', 'Helvetica-Bold'),
    'SheetSerif': (FONT_DIR/'dejavu/DejaVuSerifCondensed.ttf', 'Times-Bold'),
}
for font, (path, _fallback) in FONTS.items():
    if path.is_file():
        pdfmetrics.registerFont(TTFont(font, str(path)))
SERIF = 'SheetSerif' if 'SheetSerif' in pdfmetrics.getRegisteredFontNames() else 'Times-Bold'
SANS = 'SheetSans' if 'SheetSans' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'
SANS_BOLD = 'SheetSansBold' if 'SheetSansBold' in pdfmetrics.getRegisteredFontNames() else 'Helvetica-Bold'

ICONS = {
    'compass': '12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9 12,1|12,6 12,18|6,12 18,12',
    'heart': '12,21 3,13 2,9 4,5 8,4 12,8 16,4 20,5 22,9 21,13 12,21|4,12 8,12 10,9 13,15 15,12 20,12',
    'shield': '4,4 12,2 20,4 20,12 18,17 12,22 6,17 4,12 4,4|12,6 12,17|8,10 16,10',
    'target': '12,4 17,6 20,12 17,18 12,20 7,18 4,12 7,6 12,4|12,1 12,8|12,16 12,23|1,12 8,12|16,12 23,12',
    'boot': '8,3 16,5 14,12 16,16 22,17 22,21 3,21 2,17 6,14 8,3|7,9 13,10',
    'eye': '2,12 6,7 12,5 18,7 22,12 18,17 12,19 6,17 2,12|12,8 15,12 12,16 9,12 12,8',
    'sword': '3,21 9,15|5,12 12,19|8,14 17,3 22,2 21,7 11,17|12,12 19,5',
    'book': '12,6 7,3 2,4 2,19 7,18 12,21 17,18 22,19 22,4 17,3 12,6 12,21',
    'pack': '8,6 8,3 16,3 16,6|6,6 18,6 21,10 21,21 3,21 3,10 6,6|3,13 21,13|10,11 14,11 14,16 10,16 10,11',
    'flask': '8,2 16,2|10,2 10,9 4,17 4,20 6,22 18,22 20,20 20,17 14,9 14,2|7,15 17,15',
    'spark': '12,2 14,9 22,12 14,14 12,22 9,14 2,12 9,9 12,2|19,2 19,7|17,4 22,4',
    'slots': '3,3 9,3 9,9 3,9 3,3|15,3 21,3 21,9 15,9 15,3|3,15 9,15 9,21 3,21 3,15|15,15 21,15 21,21 15,21 15,15',
    'trail': '3,19 8,12 12,15 21,4|15,4 21,4 21,10',
    'mount': '2,20 9,5 13,12 16,8 22,20 2,20|6,11 9,13 11,10',
    'voice': '3,4 21,4 21,16 12,16 6,21 6,16 3,16 3,4|7,9 17,9|7,12 14,12',
    'coins': '4,7 7,4 14,4 17,7 14,10 7,10 4,7 4,11 7,14 12,14|4,11 4,15 7,18 10,18|13,14 16,11 20,11 23,14 20,17 16,17 13,14 13,18 16,21 20,21 23,18 23,14',
}

ABILITY_NAMES = ('Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma')
ABILITY_ICONS = ('mount', 'trail', 'shield', 'book', 'eye', 'voice')
PAGE_ICONS = {'Play':'sword', 'Gear & features':'pack', 'Spellcasting':'spark',
              'Expanded record':'book', 'Spell continuation':'spark', 'Inventory & notes':'pack'}
SECTION_ICONS = {
    'Additional class features':'spark', 'Additional feats & traits':'compass',
    'Additional resources & carrying':'flask', 'Additional equipment':'pack',
    'Additional spells':'spark', 'Identity, personality & notes':'book',
    'More carried items':'pack', 'Story, goals & character notes':'book',
}


class FieldSheet(Sheet):
    def __init__(self, path, paper='a4', data=None, mode='full'):
        values = dict(data or {})
        for page in range(1, 5):
            for key in ('identity.name', 'identity.class', 'identity.level'):
                if key in values:
                    values.setdefault(f'{key}.page{page}', values[key])
        super().__init__(path, paper, values, mode)
        self.c.setTitle('GwenTable | Dungeons & Dragons Character Sheet | 2024 Field Sheet')
        self.c.setSubject('Editable character record for Dungeons & Dragons 2024, based on SRD 5.2.1')

    def icon(self, key, x, top, size=16, color='plum2'):
        self.c.saveState()
        self.c.setStrokeColor(C[color])
        self.c.setLineWidth(max(.65, size * .062) * self.scale)
        self.c.setLineCap(1)
        self.c.setLineJoin(1)
        p = self.c.beginPath()
        for shape in ICONS[key].split('|'):
            for i, point in enumerate(shape.split()):
                px, py = map(int, point.split(','))
                (p.moveTo if not i else p.lineTo)(self.x(x + px * size / 24),
                                                   self.y(top + py * size / 24))
        self.c.drawPath(p, stroke=1)
        self.c.restoreState()

    def txt(self,x,top,label,size=8,weight='regular',color='ink'):
        self.c.setFillColor(C[color])
        self.c.setFont(SANS_BOLD if weight=='bold' else SANS,size*self.scale)
        self.c.drawString(self.x(x),self.y(top),label)

    def right(self,x,top,label,size=8,weight='regular',color='ink'):
        self.c.setFillColor(C[color])
        self.c.setFont(SANS_BOLD if weight=='bold' else SANS,size*self.scale)
        self.c.drawRightString(self.x(x),self.y(top),label)

    def serif(self, x, top, label, size=21):
        self.c.setFillColor(C['plum'])
        self.c.setFont(SERIF, size * self.scale)
        self.c.drawString(self.x(x), self.y(top), label)

    def head(self, title, total):
        self.page += 1
        self._total = total
        self.line(24,23,571,23,'plum', 1.25)
        self.icon('compass',26,32,26)
        self.txt(62,47,'G W E N T A B L E',11.6,'bold','plum')
        self.right(571,46,'2024 RULESET',8,'bold','muted')
        self.serif(24,75,'Dungeons & Dragons Character Sheet',21.5)
        self.icon(PAGE_ICONS[title], 449, 60, 16)
        self.txt(470,73,title,11,'bold','plum')
        self.line(24,84,571,84,'line',.75)

    def footer(self):
        self.line(24,795,571,795,'line',.7)
        credit = [
            'This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC,',
            'available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons',
            'Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.',
        ]
        for index,line in enumerate(credit):
            self.txt(24,806+index*9,line,7.15,color='muted')
        self.right(571,806,f'{self.page:02d} / {self._total:02d}   {self.paper.upper()}',8,'bold','plum')
        self.right(571,824,'PRINT AT 100%',7.1,'bold','muted')
        self.c.showPage()

    def section(self,title,top,x=24,w=547,detail=None,icon=None):
        icon = icon or SECTION_ICONS.get(title, 'compass')
        self.icon(icon,x+2,top+1,15)
        self.serif(x+23,top+13,title,14)
        if detail:
            self.right(x+w-2,top+12,detail,8,color='muted')
        self.line(x,top+19,x+w,top+19,'line',.65)

    def textfield(self,name,x,t,w,h=19,label=None,size=9,maxlen=0,multiline=False,kind='normal',tip=None):
        if label:
            self.txt(x+1,t+7,label,7.8,'bold','health' if kind=='health' else 'muted')
        ty=t+11 if label else t
        value=self.data.get(name,'')
        if value is None:
            value=''
        elif not isinstance(value,(str,int,float)):
            value=json.dumps(value,ensure_ascii=True)
        assist = tip or label or name.replace('.', ' ').replace('_',' ').capitalize()
        self.line(x,ty+h+.25,x+w,ty+h+.25,'health' if kind=='health' else 'line',
                  .9 if kind=='health' else .55)
        self.c.acroForm.textfield(
            name=name, tooltip=assist, x=self.x(x), y=self.y(ty+h), width=self.w(w), height=self.h(h),
            borderStyle='solid', borderWidth=0,
            borderColor=C['health' if kind=='health' else 'line'],
            fillColor=C['pale' if kind=='health' else 'field'], textColor=C['ink'],
            fontName='Helvetica', fontSize=size*self.scale, forceBorder=False,
            value=str(value), maxlen=maxlen, fieldFlags='multiline' if multiline else '',
        )
        self.fields.append({'name':name,'page':self.page,'type':'text','label':assist,
                            'rect_master':[x,ty,w,h]})

    def checkbox(self,name,x,t,size=12,label=None):
        super().checkbox(name,x,t,size,label or name.replace('.', ' ').replace('_',' ').capitalize())

    def labeled_row(self, fields, top, height, x=24, gap=8, size=10):
        for name,label,width in fields:
            self.textfield(name,x,top,width,height,label,size)
            x += width+gap

    def identity(self):
        self.labeled_row([
            ('identity.name','Character name',201),('identity.class','Class',122),
            ('identity.subclass','Subclass',151),('identity.level','Level',49),
        ],96,22,size=11)
        self.labeled_row([
            ('identity.species','Species',103),('identity.background','Background',125),
            ('identity.origin_feat','Origin feat',134),('identity.player','Player',108),
            ('progression.xp','XP',45),
        ],136,19)

    def micro_identity(self):
        top = 91 if self.mode in {'spells','notes','overflow'} or self.page == 4 else 94
        height = 14 if top == 91 else 18
        self.labeled_row([
            (f'identity.name.page{self.page}','Character name',287),
            (f'identity.class.page{self.page}','Class',180),
            (f'identity.level.page{self.page}','Level',64),
        ],top,height)

    def combat_panel(self):
        self.section('Vitals & combat',178,icon='heart')
        self.rect(24,204,547,103,'wash','faint',6)
        x = 33
        for name,label,width, symbol in [
            ('hp_current','Current HP',116,'heart'),('hp_max','Max HP',63,None),
            ('hp_temporary','Temp HP',59,None),('ac','Armor Class',91,'shield'),
            ('initiative','Initiative',78,'target'),('speed','Speed (ft)',77,'boot'),
        ]:
            main = name == 'hp_current'
            self.textfield('combat.'+name,x,215,width,29,label,size=17 if main else 13,
                           kind='health' if main else 'normal')
            if symbol:
                self.icon(symbol,x+width-12,212,11,'health' if main else 'plum2')
            x += width+9
        self.labeled_row([
            ('combat.proficiency_bonus','Proficiency bonus',90),
            ('combat.passive_perception','Passive Perception',101),
            ('combat.hit_dice_remaining','Hit Dice left',81),
            ('combat.exhaustion','Exhaustion',67),('combat.conditions','Conditions',158),
        ],264,22,x=33,gap=8)
        self.rect(24,316,547,25,'pale','faint',4)
        self.txt(31,332,'Death saves',8.7,'bold','health')
        for category, label_x, box_x in [('success',93,135),('failure',194,228)]:
            self.txt(label_x,332,category.title(),7.8,color='muted')
            for n in range(1,4):
                self.checkbox(f'combat.death_{category}_{n}',box_x+17*(n-1),322,12,
                              f'Death save {category} {n}')
        for name,x,label in [
            ('stable',296,'Stable'),('concentrating',356,'Concentrating'),
            ('heroic_inspiration',457,'Heroic Inspiration'),
        ]:
            self.checkbox('combat.'+name,x,322,12,label)
            self.txt(x+16,332,label,8,'bold','muted')

    def table(self,prefix,top,rows,columns,step=21,start=0):
        x=24
        positions=[]
        for key,label,width,kind in columns:
            self.txt(x+2,top,label,7.7,'bold','muted')
            positions.append((key,label,x,width,kind))
            x+=width+6
        for row in range(rows):
            y=top+5+row*step
            if row%2==0:
                self.rect(24,y-1,547,step-1,'wash',r=2)
            for key,label,x,width,kind in positions:
                name=f'{prefix}.{start+row}.{key}'
                field_label={'P':'Prepared','R':'Ritual','Equip':'Equipped','Lvl':'Spell level'}.get(label,label)
                group={'inventory':'Inventory item','extra_inventory':'Extra inventory item',
                       'extra_spells':'Extra spell'}.get(prefix,prefix.rstrip('s').capitalize())
                assist=f'{group} {start+row+1}, {field_label}'
                if kind == 'box':
                    self.checkbox(name,x+(width-12)/2,y+(step-14)/2,12,assist)
                else:
                    self.textfield(name,x,y,width,step-4,size=9,tip=assist)

    def page_one(self,quick=False):
        self.head('Play',1 if quick else 4 if self.mode=='complete' else 3)
        self.identity()
        self.combat_panel()
        self.section('Attacks & weapon mastery',352,icon='sword')
        self.table('attacks',385,4,[
            ('name','Weapon / attack',155,'text'),('bonus','To hit',51,'text'),
            ('damage','Damage & type',136,'text'),('range','Reach / range',78,'text'),
            ('mastery','Mastery',103,'text'),
        ],step=20)
        self.labeled_row([
            ('combat.senses','Senses',142),('combat.resistances','Resistances / immunities',217),
            ('combat.other_defenses','Other defenses',172),
        ],473,19,size=9.3)
        self.section('Abilities & saving throws',515,icon='shield',detail='Check the box for save proficiency')
        for i,((_,key),name,symbol) in enumerate(zip(AB,ABILITY_NAMES,ABILITY_ICONS)):
            x=24+i*92
            self.rect(x,540,87,76,'wash','faint',5)
            self.icon(symbol,x+6,545,12)
            self.txt(x+22,555,name,8.5,'bold','plum')
            for suffix,label,dx,w in [('score','Score',6,30),('modifier','Mod',43,38)]:
                self.textfield(f'abilities.{key}.{suffix}',x+dx,559,w,16,label,10,
                               tip=f'{name} {label.lower() if suffix == "score" else "modifier"}')
            self.checkbox(f'abilities.{key}.save_proficient',x+6,591,12,f'{name} save proficiency')
            self.txt(x+21,601,'Save',7.8,'bold','muted')
            self.textfield(f'abilities.{key}.save_bonus',x+48,590,33,16,size=10,
                           tip=f'{name} saving throw bonus')
        self.section('Skills',623,detail='P  Proficient     E  Expertise',icon='compass')
        for col in range(2):
            x=24+278*col
            for label,dx in [('Skill',5),('Ability',145),('P',187),('E',210),('Bonus',233)]:
                self.txt(x+dx,652,label,7.7,'bold','muted')
            for row,(name,ability) in enumerate(SKILLS[col*9:(col+1)*9]):
                y=656+row*14.8
                if row%2==0:
                    self.rect(x,y,269,14,'wash',r=2)
                self.txt(x+5,y+10.3,name,8.9,color='ink')
                self.txt(x+147,y+10.3,ability,7.5,'bold','muted')
                slug=name.lower().replace(' ','_')
                self.checkbox(f'skills.{slug}.proficient',x+184,y+1,11,f'{name} proficiency')
                self.checkbox(f'skills.{slug}.expertise',x+207,y+1,11,f'{name} expertise')
                self.textfield(f'skills.{slug}.bonus',x+231,y+.4,37,13,size=8.3,tip=f'{name} bonus')
        self.footer()

    def page_two(self):
        self.head('Gear & features',4 if self.mode=='complete' else 3)
        self.micro_identity()
        self.section('Resources & recovery',132,icon='flask')
        self.table('resources',163,3,[
            ('name','Resource',177,'text'),('max','Max',50,'text'),
            ('remaining','Left',55,'text'),('recovery','Recovery / notes',247,'text'),
        ],step=22)
        self.section('Class & subclass features',243,icon='spark')
        self.table('features',274,7,[
            ('name','Feature / action',147,'text'),('activation','Activation',82,'text'),
            ('uses','Uses',42,'text'),('notes','Effect / notes',258,'text'),
        ],step=22)
        self.section('Feats & other traits',439,icon='compass')
        self.table('traits',470,4,[
            ('name','Feat / species / background trait',173,'text'),('source','Source',92,'text'),
            ('notes','Effect / notes',270,'text'),
        ],step=20)
        self.section('Equipment & inventory',562,icon='pack')
        self.table('inventory',593,7,[
            ('name','Item',192,'text'),('quantity','Qty',37,'text'),('weight','Weight (lb)',62,'text'),
            ('equipped','Equip',34,'box'),('notes','Notes / location',198,'text'),
        ],step=20)
        self.icon('coins',26,750,18)
        self.labeled_row([
            ('currency.cp','CP',47),('currency.sp','SP',47),('currency.ep','EP',47),
            ('currency.gp','GP',47),('currency.pp','PP',47),('currency.other','Other',74),
            ('inventory.carried_weight','Carried (lb)',88),('inventory.carry_limit','Limit (lb)',85),
        ],744,20,x=51,gap=5,size=9)
        self.footer()

    def spell_columns(self):
        return [('name','Spell',138,'text'),('level','Lvl',30,'text'),
                ('prepared','P',18,'box'),('ritual','R',18,'box'),
                ('casting_time','Cast time',76,'text'),('range','Range',63,'text'),
                ('notes','Duration / components / notes',168,'text')]

    def page_three(self):
        self.head('Spellcasting',4 if self.mode=='complete' else 3)
        self.micro_identity()
        self.section('Casting statistics',132,icon='spark')
        self.labeled_row([
            ('spellcasting.ability','Casting ability',99),('spellcasting.save_dc','Spell save DC',80),
            ('spellcasting.attack_bonus','Spell attack',83),('spellcasting.prepared_count','Prepared count',91),
            ('spellcasting.focus','Focus / Pact Magic',162),
        ],159,22,size=10)
        self.section('Spell slots',205,icon='slots',detail='Enter total and mark how many you have used')
        for n in range(1,10):
            x=24+(n-1)*61.25
            self.rect(x,232,57,56,'wash','faint',4)
            self.txt(x+6,244,f'Level {n}',8.4,'bold','plum')
            self.textfield(f'spellcasting.slots.{n}.total',x+5,249,22,19,'Total',9,
                           tip=f'Level {n} spell slots total')
            self.textfield(f'spellcasting.slots.{n}.used',x+30,249,22,19,'Used',9,
                           tip=f'Level {n} spell slots used')
        self.section('Cantrips',298,icon='spark')
        for n in range(5):
            self.textfield(f'spellcasting.cantrips.{n}',24+n*110,326,107,22,size=9.4,
                           tip=f'Cantrip {n+1}')
        self.section('Prepared, known & granted spells',362,icon='book',detail='P  Prepared     R  Ritual')
        self.table('spells',394,14,self.spell_columns(),step=21)
        self.section('Training & languages',705,icon='voice')
        self.labeled_row([
            ('proficiencies.armor','Armor training',135),('proficiencies.weapons','Weapons / tools',185),
            ('identity.languages','Languages',211),
        ],735,24,size=9.4)
        self.footer()

    def page_continuation(self):
        self.head('Spell continuation',1)
        self.micro_identity()
        self.section('Additional spells',124,detail='P  Prepared     R  Ritual',icon='spark')
        self.table('extra_spells',156,25,self.spell_columns(),step=23)
        self.textfield('spellcasting.extra_notes',24,750,547,23,'Other spell notes',9)
        self.footer()

    def page_equipment(self):
        self.head('Inventory & notes',1)
        self.micro_identity()
        self.section('More carried items',125,icon='pack')
        self.table('extra_inventory',156,17,[
            ('name','Item',192,'text'),('quantity','Qty',37,'text'),('weight','Weight (lb)',62,'text'),
            ('equipped','Equip',34,'box'),('notes','Notes / location',198,'text'),
        ],step=23)
        self.section('Story, goals & character notes',561,icon='book')
        self.labeled_row([
            ('story.personality','Personality / presentation',269),('story.goals','Goals / ideals',270),
        ],588,23)
        self.labeled_row([
            ('story.bonds','Bonds / allies',269),('identity.appearance','Appearance',270),
        ],627,23)
        self.textfield('story.notes',24,666,547,102,'Notes / reminders',10,multiline=True)
        self.footer()

    def page_overflow(self):
        self.head('Expanded record',4 if self.mode=='complete' else 1)
        # Standalone overflow preserves the original page-1 identity keys.
        self.micro_identity()
        self.section('Additional class features',124,icon='spark')
        self.table('features',154,2,[
            ('name','Feature / action',147,'text'),('activation','Activation',82,'text'),
            ('uses','Uses',42,'text'),('notes','Effect / notes',258,'text'),
        ],22,7)
        self.section('Additional feats & traits',208)
        self.table('traits',238,3,[
            ('name','Feat / trait',173,'text'),('source','Source',92,'text'),
            ('notes','Effect / notes',270,'text'),
        ],21,4)
        self.section('Additional resources & carrying',315)
        self.table('resources',344,1,[
            ('name','Resource',177,'text'),('max','Max',50,'text'),
            ('remaining','Left',55,'text'),('recovery','Recovery / notes',247,'text'),
        ],22,3)
        self.textfield('inventory.capacity_notes',24,373,547,18,'Capacity / special load notes',9)
        self.section('Additional equipment',412)
        self.table('inventory',443,4,[
            ('name','Item',192,'text'),('quantity','Qty',37,'text'),('weight','Weight (lb)',62,'text'),
            ('equipped','Equip',34,'box'),('notes','Notes / location',198,'text'),
        ],21,7)
        self.section('Additional spells',539,detail='P  Prepared     R  Ritual')
        self.table('spells',568,3,self.spell_columns(),21,14)
        self.section('Identity, personality & notes',645)
        self.labeled_row([
            ('identity.campaign','Campaign',125),('identity.alignment','Alignment',73),
            ('identity.pronouns','Pronouns',66),('identity.hit_die','Hit die',64),
            ('identity.appearance','Appearance',187),
        ],670,19,size=9)
        self.labeled_row([
            ('story.personality','Personality',269),('story.goals','Goals / ideals',270),
        ],705,18,size=9)
        self.textfield('story.bonds',24,742,269,32,'Bonds / allies',9,multiline=True)
        self.textfield('story.notes',301,742,270,32,'Notes / reminders',9,multiline=True)
        self.footer()

    def build(self):
        result=super().build()
        result['version']='0.3'
        return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--paper',choices=PAPERS,default='a4')
    parser.add_argument('--mode',choices=['full','complete','quick','spells','notes','overflow'],default='full')
    parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--data',type=Path)
    parser.add_argument('--fields-output',type=Path)
    args=parser.parse_args()
    values=json.loads(args.data.read_text(encoding='utf-8')) if args.data else None
    manifest=FieldSheet(args.output,args.paper,values,args.mode).build()
    if args.fields_output:
        args.fields_output.write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(f'{args.mode}/{args.paper}: {manifest["page_count"]} pages, {manifest["field_count"]} fields')


if __name__=='__main__':
    main()
