#!/usr/bin/env python3
from pathlib import Path
from collections import Counter
import hashlib,zipfile,json
R=Path(__file__).resolve().parent
PKG=Path('/mnt/data/GwenTable_SRD521_Localization_Source_Fidelity_v0_82_Kit.zip')
files=[
'build_v082.py','test_v082.py','report_v082.py','release_v082.py','prose_patch_preview_v082.py',
'README_v082.md','PROJECT_STATE_v082.md','build_log.txt','test_log.txt','report_log.txt',
'GwenTable_v082_Four_Spell_Clause_Audit.csv','GwenTable_v082_Four_Spell_Evidence.json',
'GwenTable_v082_Arcane_Lock_Prose_Patch_PROPOSED.json','GwenTable_v082_Editor_Decision_Template.json',
'GwenTable_v082_Static_QA.json','GwenTable_v082_Browser_QA.json',
'GwenTable_v082_4_Spell_Bilingual_Workbench.html',
'GwenTable_v082_Source_Comparison_And_Correction_Report.pdf',
'GwenTable_v082_Arcane_Lock_Editorial_Proof.pdf',
'GwenTable_v082_Workbench_375_Proof.png',
'GwenTable_v082_Source_Comparison_And_Correction_Report_page1.png',
'GwenTable_v082_Arcane_Lock_Editorial_Proof_page1.png',
'source_v081/inputs/SRD_CC_v5.2.1_copy.pdf',
'source_v081/inputs/GwenTable_SRD521_Bahasa_Indonesia_Draf_v0_69_Table_Layout_Fixed.pdf',
'source_v081/inputs/GwenTable_v079_68_Candidate_Unsigned.json',
'source_v081/inputs/GwenTable_v080_Editor_Attestation_TEMPLATE.json',
]
assert len(files)==len(set(files))
for f in files:assert (R/f).is_file(),f
manifest={'edition':'v0.82','files':{f:hashlib.sha256((R/f).read_bytes()).hexdigest() for f in files},'zip_has_duplicate_entries':False}
(R/'SHA256_MANIFEST.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')
files.append('SHA256_MANIFEST.json')
with zipfile.ZipFile(PKG,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for f in files:z.write(R/f,arcname=f)
with zipfile.ZipFile(PKG) as z:
 assert len(z.namelist())==len(files)
 assert len(set(z.namelist()))==len(files)
 assert z.testzip() is None
 print(json.dumps({'kit':str(PKG),'size_bytes':PKG.stat().st_size,'zip_members':len(files),'sha256':hashlib.sha256(PKG.read_bytes()).hexdigest(),'archive_crc':'PASS','duplicate_entries':0},indent=2))
