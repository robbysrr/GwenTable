"""Build the public glossary, equipment headings and reader from the pinned SRD."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

import fitz

pdf = Path(sys.argv[1])
digest = '8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87'
if hashlib.sha256(pdf.read_bytes()).hexdigest() != digest:
    raise SystemExit('Provide the pinned SRD 5.2.1 PDF.')
doc = fitz.open(pdf)
assert len(doc) == 364
raw = subprocess.check_output(['pdftotext', '-raw', str(pdf), '-'], text=True)
pages = {number: '\n'.join(text.splitlines()[2:]).strip()
         for number, text in enumerate(raw.split('\f'), 1) if number <= 364 and text.strip()}
assert len(pages) == 364

def headings(first, last):
    for number in range(first, last + 1):
        for block in doc[number - 1].get_text('dict')['blocks']:
            current = []
            for line in block.get('lines', []):
                spans = line['spans']
                if spans and all(s['font'] == 'GillSans-SemiBold' and abs(s['size'] - 12) < .05 for s in spans):
                    current.append(''.join(s['text'] for s in spans).strip())
                elif current:
                    yield ' '.join(current), number
                    current = []
            if current:
                yield ' '.join(current), number

equipment = [(name[:match.start()].strip(), page, name[match.start()+1:-1])
             for name, page in headings(93, 100)
             if (match := re.search(r'\((?:[\d,]+ (?:GP|SP|CP)|Varies)\)$', name))]
magic = [(name, page) for name, page in headings(209, 253) if name]
assert len(dict(magic)) == len(magic) and len(magic) > 200
assert dict(magic)['Armor of Vulnerability'] == 211 and dict(magic)['Winged Boots'] == 253
topics = [(name, page) for depth, name, page in doc.get_toc() if depth == 2 or depth == 3 and 176 <= page <= 208]
out = Path('dist/lib')
def write(name, bindings):
    lines = ['// Generated from SRD 5.2.1 (CC BY 4.0). See Rules & Credits.']
    for binding, value in bindings.items():
        lines.append('export const ' + binding + ' = ' + json.dumps(value, ensure_ascii=False) + ';')
    (out / name).write_text('\n'.join(lines) + '\n')
write('srd-compendium-index.js', {'srdEquipment':equipment, 'srdMagicItems':magic, 'srdTopics':topics})
write('srd-reader-pages.js', {'srdPages':pages})
print(len(pages), 'source pages,', len(equipment), 'equipment headings,', len(magic), 'magic item headings')
