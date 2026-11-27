"""Regenerate the low-level spell and weapon tables from the pinned SRD PDF."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

pdf = Path(sys.argv[1])
assert hashlib.sha256(pdf.read_bytes()).hexdigest() == '8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87'
raw = subprocess.check_output(['pdftotext', '-raw', '-f', '24', '-l', '104', pdf, '-'], text=True)
spells = {}
for cls in ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard']:
    block = raw.split(f'\n{cls} Spell List\n')[1].split(f'\n{cls} Subclass:')[0].split(f'\nLevel 7 {cls} Spells\n')[0]
    groups = re.split(rf'(?:Cantrips \(Level 0 {cls} Spells\)|Level [1-6] {cls} Spells)\n', block)[1:]
    entries = {}
    for level, group in enumerate(groups, 1 if cls in ('Paladin', 'Ranger') else 0):
        previous = ''
        for line in group.splitlines():
            match = re.fullmatch(r'(.+?) (Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation) ([CRM, ]+|[–—])', line)
            if match:
                name, school, tags = match.groups()
                if name[:1].islower() and previous and not previous.startswith('Spell'):
                    name = previous.rstrip('-') + ('' if previous.endswith('-') else ' ') + name
                entries[name] = [level, school, tags.replace("–", "—")]
            previous = line
    spells[cls] = entries

weapons = {}
block = raw.split('\nWeapons\nName Damage Properties Mastery Weight Cost\n')[1].split('\nArmor\n')[0]
for category, rows in re.findall(r'(Simple Melee|Simple Ranged|Martial Melee|Martial Ranged) Weapons\n(.*?)(?=\n(?:Simple|Martial) (?:Melee|Ranged) Weapons|\Z)', block, re.S):
    rows = re.sub(r'\nTwo-Handed\n', ' Two-Handed ', rows)
    rows = re.sub(r',\n', ', ', rows)
    for name, dice, damage, props, mastery in re.findall(r'^(.+?) (\d(?:d\d+)?) (Bludgeoning|Piercing|Slashing) (.*?) (Slow|Nick|Push|Vex|Sap|Topple|Graze|Cleave) ', rows, re.M):
        weapons[name] = [dice, damage, category, re.sub(r' +', ' ', props), mastery]
assert len(weapons) == 38, len(weapons)
out = ['// Source: SRD 5.2.1 low-level class spell lists (pp. 33–82) and weapons table (p. 91).']
for name, data in [('spellLists', spells), ('weaponProfiles', weapons)]:
    out.append(f'export const {name} = {{')
    out.extend(f'  {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)},' for k, v in data.items())
    out.append('};')
Path('dist/lib/tables.js').write_text('\n'.join(out) + '\n')
