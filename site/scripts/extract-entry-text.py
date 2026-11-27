"""Extract each compendium subject's own SRD 5.2.1 text (Integration 12).

Usage: python scripts/extract-entry-text.py SRD_CC_v5.2.1.pdf entries.json
entries.json: [{"type","name","first"}] from compendium.catalogueEntries().
A subject starts at its heading (GillSans-SemiBold, the SRD's heading face) and
ends before the next heading of the same or a larger size. Text is the SRD's own
wording; only line-break hyphenation and page furniture are removed.
"""
import hashlib, json, pathlib, re, sys
import fitz

pdf_path, entries_path = map(pathlib.Path, sys.argv[1:3])
OFFICIAL = '8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87'
assert hashlib.sha256(pdf_path.read_bytes()).hexdigest() == OFFICIAL, 'Use the official pinned SRD 5.2.1 PDF.'
doc = fitz.open(pdf_path)

def norm(s):
    s = s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    s = re.sub(r'\s*\((?:[\d,]+ (?:GP|SP|CP|EP|PP)|Varies)\)\s*$', '', s.strip())
    return re.sub(r'\s+', ' ', s).strip().lower()

# Reading order: the PDF's own text blocks, left column then right column; lines keep block order.
# A run-in heading ("Acid (25 GP). When you…") is split into a heading row and a body row.
lines = []
for pno in range(len(doc)):
    page = doc[pno]
    width, height = page.rect.width, page.rect.height
    blocks = []
    for block in page.get_text('dict')['blocks']:
        rows = []
        for line in block.get('lines', []):
            spans = [s for s in line['spans'] if s['text'].strip()]
            if not spans:
                continue
            x0, y0 = line['bbox'][0], line['bbox'][1]
            text = ''.join(s['text'] for s in spans).strip()
            if y0 > height - 45 and (re.search(r'System Reference Document', text) or re.fullmatch(r'\d+', text)):
                continue
            lead = []
            for s in spans:
                if s['font'].startswith('GillSans-SemiBold') and s['size'] >= 11.5:
                    lead.append(s['text'])
                else:
                    break
            size = round(spans[0]['size'], 1)
            base = dict(page=pno + 1, x=x0, y=y0, size=size)
            if lead:
                head = ''.join(lead).strip()
                rows.append(dict(base, text=head.rstrip('.').strip(), heading=True, runin=False))
                rest = text[len(''.join(lead)):].strip() if text.startswith(''.join(lead).strip()) else ''.join(s['text'] for s in spans[len(lead):]).strip()
                if rest:
                    rows.append(dict(base, text=rest, heading=False, runin=False, size=10.0))
            else:
                rows.append(dict(base, text=text, heading=False, runin='BoldItalic' in spans[0]['font'],
                                 italic='Italic' in spans[0]['font'] and 'Bold' not in spans[0]['font']))
        if rows:
            col = 0 if block['bbox'][0] < width / 2 - 10 else 1
            blocks.append((col, block['bbox'][1], rows))
    blocks.sort(key=lambda b: (b[0], b[1]))
    for col, _, rows in blocks:
        for r in rows:
            r['col'] = col
            lines.append(r)

LABEL = re.compile(r'(Casting Time|Range|Components?|Duration|Creature Type|Size|Speed|Ability Scores|Feat|Skill Proficiencies|Tool Proficiency|Equipment|Level \d+:|AC |HP |Initiative |Skills |Senses |Languages |CR |Gear |Resistances |Immunities |Vulnerabilities )')

def collect(start):
    head = lines[start]
    out, prev = [], None
    for row in lines[start + 1:]:
        if row['heading'] and row['size'] >= head['size']:
            break
        if prev is not None:
            new_para = (row['runin'] or row['heading'] or row['x'] - prev['x'] > 4 or row['y'] - prev['y'] > 17
                        or bool(LABEL.match(row['text'])) or prev.get('italic', False) != row.get('italic', False)
                        or (bool(re.match(r'(Duration|Speed):', prev['text'])) and bool(re.match(r'[A-Z]', row['text']))))
            if new_para:
                out.append('\n')
            elif out and re.search(r'[a-z]-$', out[-1]) and re.match(r'[a-z]', row['text']):
                out[-1] = out[-1][:-1]
                out.append('')
            else:
                out.append(' ')
        out.append(row['text'])
        prev = row
        if sum(len(x) for x in out) > 60000:
            break
    text = ''.join(out)
    text = re.sub(r' *\n *', '\n', text)
    return re.sub(r'\n{2,}', '\n', text).strip()

ABIL = re.compile(r'(Str|Dex|Con|Int|Wis|Cha)\s*(\d+)\s*([+−-]\d+)\s*([+−-]\d+)')
def tidy_abilities(text):
    # Stat-block ability grid: rebuild as one line when all six score/modifier/save triples are present.
    start = text.find('MOD')
    end = re.search(r'\n(Skills|Senses|Gear|Resistances|Immunities|Vulnerabilities|Languages|CR) ', text[start:]) if start >= 0 else None
    if start < 0 or not end:
        return text
    chunk = text[start:start + end.start()]
    found = ABIL.findall(chunk.replace('\t', ' ').replace('\n', ' '))
    if [f[0] for f in found] != ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha']:
        return text
    line = ' · '.join(f'{a} {s} ({m}, save {v})' for a, s, m, v in found)
    return text[:start] + line + text[start + end.start():]

index = {}
for i, row in enumerate(lines):
    if row['heading']:
        key = norm(row['text'])
        index.setdefault((row['page'], key), i)
        if ':' in key:  # "Fighter Subclass: Champion"
            index.setdefault((row['page'], key.split(':', 1)[1].strip()), i)

result, missing = {}, []
for entry in json.loads(entries_path.read_text()):
    # Weapons/armor exist only as table rows; Classes and chapter-sized Rules topics keep the page reader.
    if entry['type'] in ('Skill', 'Class', 'Rules topic'):
        continue
    want = norm(entry['name'])
    hit = None
    for page in [entry['first'], entry['first'] + 1, entry['first'] + 2, entry['first'] - 1]:
        hit = index.get((page, want))
        if hit is not None:
            break
    if hit is None:
        missing.append(f"{entry['type']}|{entry['name']}@{entry['first']}")
        continue
    text = collect(hit)
    if entry['type'] == 'Creature':
        text = tidy_abilities(text)
    if text:
        result[f"{entry['type']}|{entry['name']}"] = [lines[hit]['page'], text]

out = pathlib.Path('dist/lib/srd-entry-text.js')
out.write_text('// Generated from SRD 5.2.1 (CC BY 4.0), official PDF SHA-256 ' + OFFICIAL[:16] + '…, by scripts/extract-entry-text.py.\n'
               '// Each value: [printed page where the subject starts, the subject\'s own SRD text]. See Rules & Credits.\n'
               'export const entryText = ' + json.dumps(result, ensure_ascii=False) + ';\n', encoding='utf-8')
print(len(result), 'subjects extracted;', len(missing), 'not matched')
print('\n'.join(missing[:60]))
