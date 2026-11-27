"""Extract spell headers from the supplied SRD. Descriptions are separately reviewed."""
import hashlib
import json
import pathlib
import re
import subprocess
import sys

pdf = pathlib.Path(sys.argv[1])
assert hashlib.sha256(pdf.read_bytes()).hexdigest() == '93dda217a8cc63eb71bdcd4881b6c3a488e098063202b42e45967833fcbc412a'
data = subprocess.check_output(['pdftotext', '-f', '107', '-l', '175', '-raw', str(pdf), '-'], text=True)
schools = r'Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation'
heading = re.compile(rf'(?:Level [1-9] (?:{schools})|(?:{schools}) Cantrip) \(')
fields = ['Casting Time:', 'Range:', 'Component', 'Duration:']
lines = [(page, line) for page, content in enumerate(data.split('\f'), 107)
         for line in content.splitlines()[2:] if line.strip()]
references = {}
for i, (_, line) in enumerate(lines):
    if i == 0 or not heading.match(line):
        continue
    cursor = i + 1
    while cursor < i + 4 and not lines[cursor][1].startswith(fields[0]):
        cursor += 1
    values = []
    for j, field in enumerate(fields):
        if cursor >= len(lines) or not lines[cursor][1].startswith(field):
            break
        value = lines[cursor][1].split(': ', 1)[1]
        cursor += 1
        if j + 1 < len(fields):
            while cursor < len(lines) and not lines[cursor][1].startswith(fields[j + 1]):
                value += ' ' + lines[cursor][1]
                cursor += 1
                if len(value) > 800:
                    break
        values.append(value)
    if len(values) == 4:
        page, name = lines[i - 1]
        references[name] = [page, *values]
pathlib.Path('dist/lib/spell-headers.js').write_text(
    '// Generated from the supplied SRD 5.2.1, printed spell-description pages.\n'
    + 'export const spellHeaders = ' + json.dumps(references, indent=None, ensure_ascii=False) + ';\n'
)
print(f'{len(references)} spell headers extracted')
