"""Check generated forms and optional exact field identity against the v0.2 kit."""
import argparse
from io import BytesIO
from itertools import combinations
from pathlib import Path
from zipfile import ZipFile

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import A4, letter

from build_field_sheet import FieldSheet

FORMATS = {
    'quick': ('Quick_Reference', 1, 130),
    'full': ('Compact', 3, 360),
    'complete': ('Complete', 4, 435),
    'spells': ('Spell_Continuation', 1, 179),
    'notes': ('Inventory_Notes', 1, 93),
    'overflow': ('Expanded_Entries', 1, 75),
}
PAPERS = {'A4': A4, 'LETTER': letter}
SAMPLE = {
    'identity.name':'Neris Vale', 'identity.class':'Wizard', 'identity.subclass':'Evoker',
    'identity.species':'Human', 'identity.background':'Sage', 'identity.level':'5',
    'combat.ac':'15', 'combat.initiative':'+2', 'combat.speed':'30', 'combat.hp_current':'24',
    'combat.hp_max':'32', 'combat.hp_temporary':'3', 'combat.exhaustion':'0',
    'combat.conditions':'Blessed', 'combat.proficiency_bonus':'+3',
    'combat.heroic_inspiration':True, 'combat.concentrating':True,
    'combat.hit_dice_remaining':'3d6', 'combat.passive_perception':'13',
    'abilities.int.score':'18','abilities.int.modifier':'+4','abilities.int.save_bonus':'+7',
    'abilities.int.save_proficient':True, 'skills.arcana.bonus':'+7',
    'skills.arcana.proficient':True, 'attacks.0.name':'Fire Bolt', 'attacks.0.bonus':'+7',
    'attacks.0.damage':'2d10 Fire', 'attacks.0.range':'120 ft',
    'features.0.name':'Arcane Recovery','features.0.activation':'Short Rest',
    'features.0.notes':'Recover expended spell slots within the recovery limit.',
    'inventory.0.name':'Arcane focus','inventory.0.quantity':'1','inventory.0.equipped':True,
    'currency.gp':'32','resources.0.name':'Arcane Recovery','resources.0.max':'1',
    'resources.0.remaining':'1','resources.0.recovery':'Long Rest',
    'spellcasting.ability':'Intelligence','spellcasting.save_dc':'15',
    'spellcasting.attack_bonus':'+7','spellcasting.slots.1.total':'4',
    'spellcasting.slots.1.used':'1','spellcasting.cantrips.0':'Fire Bolt',
    'spells.0.name':'Detect Magic','spells.0.level':'1','spells.0.prepared':True,
    'spells.0.ritual':True,'spells.0.casting_time':'Action','spells.0.range':'Self',
    'spells.0.notes':'Concentration, up to 10 min',
    'extra_spells.0.name':'Identify','extra_spells.0.ritual':True,
    'extra_inventory.0.name':'Traveler’s journal','extra_inventory.0.equipped':True,
    'story.notes':'Meet the archivist at first light.\nBring the expedition journal.',
}


def verify_pdf(path, manifest, dimensions, page_count, field_count, original):
    reader = PdfReader(path)
    fields = reader.get_fields()
    assert len(reader.pages) == page_count
    assert len(fields) == len(manifest['fields']) == field_count
    assert set(fields) == {f['name'] for f in manifest['fields']}
    if original:
        assert {key: str(value['/FT']) for key,value in fields.items()} == {
            key: str(value['/FT']) for key,value in original.get_fields().items()
        }, path.name
    for i,page in enumerate(reader.pages,1):
        assert abs(float(page.mediabox.width)-dimensions[0]) < .01
        assert abs(float(page.mediabox.height)-dimensions[1]) < .01
        text = page.extract_text()
        assert 'Dungeons & Dragons Character Sheet' in text
        assert 'https://creativecommons.org/licenses/by/4.0/legalcode.' in text
        widgets = [entry.get_object() for entry in page['/Annots']]
        assert [str(widget['/T']) for widget in widgets] == [
            f['name'] for f in manifest['fields'] if f['page'] == i
        ]
        rectangles = {}
        for widget in widgets:
            key = str(widget['/T'])
            x1,y1,x2,y2 = map(float,widget['/Rect'])
            assert 18 < x1 < x2 < dimensions[0]-18, (path.name,key)
            assert 18 < y1 < y2 < dimensions[1]-18, (path.name,key)
            assert widget['/TU'] and '/N' in widget['/AP'] and key not in rectangles
            rectangles[key] = (x1,y1,x2,y2)
        for (k,a),(j,b) in combinations(rectangles.items(),2):
            overlap = max(0,min(a[2],b[2])-max(a[0],b[0])) * max(0,min(a[3],b[3])-max(a[1],b[1]))
            assert overlap < .05, (path.name,k,j,overlap)
    return reader


def round_trip(reader,path):
    writer = PdfWriter(clone_from=reader)
    values = {
        name:(('/Yes' if value else '/Off') if isinstance(value,bool) else value)
        for name,value in SAMPLE.items() if name in reader.get_fields()
    }
    writer.update_page_form_field_values(None, values, auto_regenerate=False)
    with path.open('wb') as out:
        writer.write(out)
    reread = PdfReader(path)
    assert set(reread.get_fields()) == set(reader.get_fields())
    for k,v in values.items():
        assert str(reread.get_fields()[k]['/V']) == v, (path.name,k,v)
    for page in reread.pages:
        for entry in page['/Annots']:
            widget = entry.get_object()
            name = str(widget['/T'])
            if name not in values:
                continue
            assert str(widget['/V']) == values[name]
            appearance = widget['/AP']['/N'].get_object()
            if widget['/FT'] == '/Btn':
                assert str(widget['/AS']) == values[name]
                appearance = appearance[widget['/AS']].get_object()
            assert appearance.get_data()
    return len(values)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory',type=Path,required=True)
    parser.add_argument('--baseline',type=Path)
    parser.add_argument('--qa-directory',type=Path,required=True)
    args=parser.parse_args()
    args.directory.mkdir(parents=True,exist_ok=True)
    args.qa_directory.mkdir(parents=True,exist_ok=True)
    archive = ZipFile(args.baseline) if args.baseline else None
    for paper,dimensions in PAPERS.items():
        for mode,(label,pages,field_count) in FORMATS.items():
            old_name=f'GwenTable_{label}_{paper}_Fillable.pdf'
            path=args.directory/f'GwenTable_{label}_{paper}_v03_Fillable.pdf'
            manifest=FieldSheet(path,paper.lower(),mode=mode).build()
            original=PdfReader(BytesIO(archive.read(old_name))) if archive else None
            reader=verify_pdf(path,manifest,dimensions,pages,field_count,original)
            sampled=round_trip(reader,args.qa_directory/('saved_'+path.name))
            print(f'PASS {paper} {label}: {pages} page(s), {field_count} fields, {sampled} fill/save/reopen values')
    prefilled=args.qa_directory/'Prefilled_Complete_A4.pdf'
    FieldSheet(prefilled,data={'identity.name':'Neris Vale','identity.name.page3':'N. Vale'},
               mode='complete').build()
    fields=PdfReader(prefilled).get_fields()
    for key in ('identity.name','identity.name.page2','identity.name.page4'):
        assert str(fields[key]['/V']) == 'Neris Vale'
    assert str(fields['identity.name.page3']['/V']) == 'N. Vale'
    if archive:
        archive.close()
    print('PASS tab insertion order, distinct fields, widget bounds and appearances, SRD attribution, generator prefill')
    if archive:
        print('PASS exact v0.2 field names and types for all twelve variants')


if __name__=='__main__':
    main()
