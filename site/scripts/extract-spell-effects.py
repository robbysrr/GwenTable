"""Extract opening effect text from Wizard's CC BY 4.0 SRD 5.2.1."""
import hashlib
import json
import pathlib
import re
import subprocess
import sys

pdf = pathlib.Path(sys.argv[1])
assert hashlib.sha256(pdf.read_bytes()).hexdigest() == '8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87'
raw = subprocess.check_output(['pdftotext', '-f', '107', '-l', '175', '-raw', str(pdf), '-'], text=True)
lines = [line.strip() for page in raw.split('\f') for line in page.splitlines()[2:] if line.strip()]
schools = r'Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation'
heading = re.compile(rf'^(?:Level ([1-9]) ({schools})|({schools}) Cantrip) \(')
stops = re.compile(r'^(?:Using a Higher-Level Spell Slot|Cantrip Upgrade|At Higher Levels)\.')
starts = [(i, heading.match(line)) for i, line in enumerate(lines) if heading.match(line)]
effects = {}
full = {}
for n, (i, match) in enumerate(starts):
    end = starts[n + 1][0] - 1 if n + 1 < len(starts) else len(lines)
    duration = next(j for j in range(i, min(i + 20, end)) if lines[j].startswith('Duration:'))
    cursor = duration + 1
    while cursor < end and re.match(r'^(?:up to |\d+ (?:minutes?|hours?|days?)\b)', lines[cursor]):
        cursor += 1
    body = []
    for line in lines[cursor:end]:
        if stops.match(line):
            break
        body.append(line)
    text = re.sub(r'(?<=[a-z])-\n(?=[a-z])', '', '\n'.join(body)).replace('\n', ' ')
    sentences = re.split(r'(?<=[.!?]) (?=[A-Z0-9“])', text.strip())
    excerpt = []
    for sentence in sentences[:4]:
        if excerpt and len(' '.join([*excerpt, sentence])) > 430:
            break
        excerpt.append(sentence)
    level, school, cantrip_school = match.groups()
    if text:
        effects[lines[i - 1]] = [int(level or 0), school or cantrip_school, ' '.join(excerpt)]
        full[lines[i - 1]] = '\n'.join(lines[cursor:end])

print(len(effects), 'opening spell effects')
pathlib.Path('dist/lib/spell-effects.js').write_text(
    '// Opening excerpts from the SRD 5.2.1 spell descriptions (CC BY 4.0).\n'
    '// Excerpts omit later effects and options. See the linked SRD for each full spell.\n'
    'export const spellEffects = ' + json.dumps(effects, indent=None, ensure_ascii=False) + ';\n'
)

pages = subprocess.check_output(['pdftotext', '-f', '1', '-l', '190', '-raw', str(pdf), '-'], text=True)
pages = {page: '\n'.join(content.splitlines()[2:]).strip()
         for page, content in enumerate(pages.split('\f'), 1) if content.strip() and (6 <= page <= 105 or 176 <= page <= 183)}
pathlib.Path('dist/lib/official-rules.js').write_text(
    '// Complete spell effects and indexed printed pages from SRD 5.2.1 (CC BY 4.0).\n'
    'export const spellText = ' + json.dumps(full, ensure_ascii=False) + ';\n'
    'export const rulePages = ' + json.dumps(pages, ensure_ascii=False) + ';\n'
)
