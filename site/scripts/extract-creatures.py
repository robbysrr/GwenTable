"""Extract encounter summary fields from the pinned SRD 5.2.1 PDF."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

pdf = Path(sys.argv[1])
assert hashlib.sha256(pdf.read_bytes()).hexdigest() == "8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87"
raw = subprocess.check_output(["pdftotext", "-raw", "-f", "258", "-l", "364", pdf, "-"], text=True)
starts = list(re.finditer(r"^AC (\d+)", raw, re.M))
creatures = {}
for pos, start in enumerate(starts):
    end = starts[pos + 1].start() if pos + 1 < len(starts) else len(raw)
    stat = raw[start.start():end]
    name, _type = raw[:start.start()].splitlines()[-2:]
    page = raw[:start.start()].count("\f") + 258
    if raw[:start.start()].rstrip().endswith("System Reference Document 5.2.1"):
        raise ValueError(name)
    initiative = re.search(r"\bInitiative ([+−-]\d+) \((\d+)\)", stat)
    hp = re.search(r"^HP (\d+)", stat, re.M)
    challenge = re.search(r"^CR ([0-9/]+) \((?:XP )?([\d,]+)(?: XP)?(?:, or ([\d,]+) in lair)?; PB", stat, re.M)
    assert initiative and hp and challenge, name
    key = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    assert key not in creatures, name
    row = [name, page, int(start[1]), int(hp[1]), int(initiative[1].replace("−", "-")),
           int(initiative[2]), challenge[1], int(challenge[2].replace(",", ""))]
    if challenge[3]:
        row.append(int(challenge[3].replace(",", "")))
    creatures[key] = row
assert len(creatures) == 330
output = "// SRD 5.2.1, pp. 258–364. Regenerate with scripts/extract-creatures.py.\nexport const creatureIndex = {\n"
for key, row in sorted(creatures.items(), key=lambda entry: entry[1][0].casefold()):
    output += f"  {json.dumps(key)}: {json.dumps(row, ensure_ascii=False)},\n"
Path("dist/lib/creatures.js").write_text(output + "};\n")
