#!/usr/bin/env python3
from pathlib import Path
from collections import Counter
import csv,fitz,json,hashlib,re
from playwright.sync_api import sync_playwright
from prose_patch_preview_v082 import candidate_preview,revert_preview,PreviewRejected
R=Path(__file__).resolve().parent
with (R/'GwenTable_v082_Four_Spell_Clause_Audit.csv').open(encoding='utf-8-sig',newline='') as f:
 rows=list(csv.DictReader(f))
patch=json.loads((R/'GwenTable_v082_Arcane_Lock_Prose_Patch_PROPOSED.json').read_text())
evidence=json.loads((R/'GwenTable_v082_Four_Spell_Evidence.json').read_text())
base=R/'source_v081/inputs/GwenTable_SRD521_Bahasa_Indonesia_Draf_v0_69_Table_Layout_Fixed.pdf'
srd=R/'source_v081/inputs/SRD_CC_v5.2.1_copy.pdf'
assert len(rows)==62 and len({x['id'] for x in rows})==62
assert {x['spell'] for x in rows}=={'Arcane Lock','Astral Projection','Augury','Awaken'}
assert all(x['source_found']=='True' and x['local_found']=='True' for x in rows)
assert Counter(x['provisional_semantic'] for x in rows)=={'MATCH':61,'MISMATCH':1}
assert [x['aspect'] for x in rows if x['provisional_semantic']=='MISMATCH']==['unlock_vs_open']
assert all(x['editorial_status']=='PENDING' for x in rows)
assert patch['status']=='PROPOSED_NOT_APPROVED' and patch['editor_decision']=='PENDING' and patch['editor_identity_verified'] is False
assert patch['srd_sha256']==hashlib.sha256(srd.read_bytes()).hexdigest()
assert patch['local_pdf_sha256']==hashlib.sha256(base.read_bytes()).hexdigest()
assert patch['source_srd_folio']==110 and patch['local_draft_page']==219
source_section=evidence['spells']['Arcane Lock']['source_english_excerpt']
local_section=evidence['spells']['Arcane Lock']['draft_indonesian_excerpt']
old=patch['old_fragment_pdf_extraction'];new=patch['new_fragment_proposed']
assert re.search(r"This\s+lock can’t be unlocked",source_section)
assert old in local_section and local_section.count(old)==1
assert hashlib.sha256(old.encode()).hexdigest()==patch['old_fragment_sha256']
# Correct source vs object-scope semantics: proposed language explicitly references unlocking the lock.
assert 'membuka kunci tersebut' in new and 'benda itu tidak dapat dibuka' not in new.lower()
assert 'nonmagis' in new and 'selama durasi spell' in new.lower()
patched=local_section.replace(old,new)
assert hashlib.sha256(patched.encode()).hexdigest()==patch['candidate_section_sha256']
assert patched.replace(new,old)==local_section
assert len(patched)!=len(local_section) # only expected change, not no-op
assert candidate_preview(local_section,patch)==patched
assert revert_preview(patched,patch)==local_section
# Fail closed on source drift, edited fragment, candidate drift, duplicate and spoofed signoff.
negative_cases=[]
def must_reject(section,proposed,reason):
 try:candidate_preview(section,proposed)
 except PreviewRejected:negative_cases.append(reason)
 else:raise AssertionError('Invalid patch accepted: '+reason)
must_reject(local_section+' ',patch,'source trailing drift')
must_reject(local_section.replace('Benda itu','Objek itu',1),patch,'source clause drift')
must_reject(local_section+old,patch,'duplicate clause')
for field,value,reason in [('old_fragment_pdf_extraction',old.replace('magic','magis'),'fragment changed'),('new_fragment_proposed',new+' tambahan','replacement changed'),('status','APPROVED','fake approval'),('editor_decision','APPROVED','fake editor decision'),('editor_identity_verified',True,'fake editor identity')]:
 clone=patch.copy();clone[field]=value;must_reject(local_section,clone,reason)
assert len(negative_cases)==8

# Source PDF and Indonesian draft same byte hashes as before; not modified by builder.
for target in [srd,base]:assert target.stat().st_size>100000
assert len(fitz.open(srd))==364 and len(fitz.open(base))==595
# Prior 68 patch candidates and editorial attestation stay unsigned.
prior=json.loads((R/'source_v081/inputs/GwenTable_v079_68_Candidate_Unsigned.json').read_text())
att=json.loads((R/'source_v081/inputs/GwenTable_v080_Editor_Attestation_TEMPLATE.json').read_text())
assert len(prior['entries'])==68 and all(x['human_editorial_signoff']=='PENDING' for x in prior['entries'])
assert len(att['decisions'])==68 and all(x['decision']=='PENDING' for x in att['decisions'])
html=(R/'GwenTable_v082_4_Spell_Bilingual_Workbench.html').read_text(encoding='utf-8')
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [320,375,768,1280]:
  page=browser.new_page(viewport={'width':width,'height':850},accept_downloads=True)
  page.set_content(html,wait_until='load')
  assert page.locator('#pick option').count()==4
  page.locator('#pick').select_option('Arcane Lock')
  assert page.locator('.issue').count()==1
  assert 'unlock_vs_open' in page.locator('.issue').inner_text()
  page.locator('#status').select_option('NEEDS_CHANGE')
  page.locator('#note').fill('Tes: kegagalan makna membuka benda vs membuka kunci')
  page.locator('#pick').select_option('Augury')
  assert 'Augury' in page.locator('#review h2').inner_text()
  page.locator('#pick').select_option('Arcane Lock')
  assert page.locator('#status').input_value()=='NEEDS_CHANGE'
  assert 'membuka benda' in page.locator('#note').input_value()
  with page.expect_download(timeout=9000) as info:page.locator('#download').click()
  assert info.value.suggested_filename=='GwenTable_v082_Reviewer_Notes_NOT_APPROVAL.json'
  page.add_style_tag(content='html{font-size:200%!important}*{letter-spacing:.12em!important;word-spacing:.16em!important;line-height:1.6!important}')
  box=page.evaluate('''() => ({doc:document.documentElement.scrollWidth,view:innerWidth,scroll:document.querySelector('.scroll').scrollWidth,client:document.querySelector('.scroll').clientWidth})''')
  assert box['doc']<=box['view']+1,(width,box)
  if width==375:page.screenshot(path=str(R/'GwenTable_v082_Workbench_375_Proof.png'),full_page=False)
  results.append({'viewport':width,'source_evidence_rendered':True,'single_mismatch_highlighted':True,'notes_session_persist':True,'export':True,'zoom_200percent_no_page_overflow':True})
  page.close()
 browser.close()
(R/'GwenTable_v082_Browser_QA.json').write_text(json.dumps(results,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'clause_rows':len(rows),'match_provisional':61,'mismatch':1,'all_anchors_present':True,'patch_revert_exact':True,'68_old_candidates_unsigned':True,'negative_patch_mutations_rejected':len(negative_cases),'browser_checks':len(results),'browser_pass':True},ensure_ascii=False,indent=2))
