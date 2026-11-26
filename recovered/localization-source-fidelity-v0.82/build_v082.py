#!/usr/bin/env python3
"""Source-bound bilingual clause audit for 4 GwenTable spell entries.
Not a full translation signoff, not integrated into product or published PDF.
"""
from __future__ import annotations
import csv,hashlib,html,json,re,unicodedata
from pathlib import Path
import fitz
ROOT=Path(__file__).resolve().parent
OUT=ROOT
ROOT_INPUT=ROOT/'source_v081/inputs'
SRC=ROOT_INPUT/'SRD_CC_v5.2.1_copy.pdf'
LOC=ROOT_INPUT/'GwenTable_SRD521_Bahasa_Indonesia_Draf_v0_69_Table_Layout_Fixed.pdf'
assert SRC.exists() and LOC.exists()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
src_sha=sha(SRC); loc_sha=sha(LOC)
src=fitz.open(SRC);loc=fitz.open(LOC)
assert len(src)==364 and len(loc)==595

def extract(d,p):return d[p-1].get_text(sort=False)
def between(text,start,end=None):
 a=text.index(start);b=text.index(end,a+len(start)) if end else len(text)
 return text[a:b]
S={
'Arcane Lock':between(extract(src,110),'Arcane Lock\n','Arcane Sword\n'),
'Astral Projection':between(extract(src,111),'Astral Projection\n','Augury\n'),
'Augury':between(extract(src,111),'Augury\n','Aura of Life\n'),
'Awaken':between(extract(src,111),'Awaken\n')+extract(src,112).split('Bane\n',1)[0],
}
L={
'Arcane Lock':between(extract(loc,219),'Arcane Lock\n','Arcane Sword\n'),
'Astral Projection':between(extract(loc,222),'Astral Projection\n','Augury\n'),
'Augury':between(extract(loc,222),'Augury\n')+extract(loc,223).split('Aura of Life\n',1)[0],
'Awaken':between(extract(loc,223)+'\n'+extract(loc,224),'Awaken\n','Bane\n'),
}
FOLIOS={'Arcane Lock':([110],[219]),'Astral Projection':([111],[222]),'Augury':([111],[222,223]),'Awaken':([111,112],[223,224])}

def norm(s):
 # Remove PDF line-wrap word hyphenation only; preserve true compound units.
 s=s.replace('\u00ad','')
 s=re.sub(r'(?<=[A-Za-z])-\s*\n\s*(?=[a-z])','',s)
 s=unicodedata.normalize('NFKC',s).replace('’',"'").replace('−','-')
 return re.sub(r'\s+',' ',s).casefold().strip()

# Data fields: spell, aspect, concise SRD snippet, concise local draft snippet,
# provisional outcome, audit explanation. Each anchor is asserted only inside
# its own spell section, preventing adjacent spells or monster blocks from passing.
CLAUSES=[
('Arcane Lock','spell_level','Level 2 Abjuration','Level 2 Abjuration','MATCH','Spell level and school'),
('Arcane Lock','casting_time','Casting Time: Action','Casting Time\nAction','MATCH','Casting time'),
('Arcane Lock','range','Range: Touch','Range\nTouch','MATCH','Range'),
('Arcane Lock','material_cost','gold dust worth 25+ GP','Gold dust senilai minimal 25 GP','MATCH','Gold dust minimum cost; metadata remains English'),
('Arcane Lock','material_consumption','the spell consumes','habis digunakan saat spell di-cast','MATCH','Material consumed'),
('Arcane Lock','duration','Duration: Until dispelled','Duration\nUntil dispelled','MATCH','Duration metadata untranslated, separate issue'),
('Arcane Lock','target_closed','a closed door, window, gate, container','pintu, jendela, gerbang, container','MATCH','Closed object types'),
('Arcane Lock','magical_lock','magically lock it for the duration','terkunci secara magic selama Duration','MATCH','Magical lock for duration'),
('Arcane Lock','unlock_vs_open','This lock can’t be unlocked by any nonmagical means','tidak dapat dibuka menggunakan cara nonmagical','MISMATCH','Local overstates prohibition: SRD governs unlocking the lock, not every physical way of opening object'),
('Arcane Lock','designated_access','creatures you designate when you cast','creature yang kamu tentukan saat casting','MATCH','Designated creatures may open/close'),
('Arcane Lock','password','set a password','memasang password','MATCH','Optional password'),
('Arcane Lock','password_distance','within 5 feet of the object','dalam jarak 5 feet dari benda','MATCH','Password range'),
('Arcane Lock','password_duration','unlocks it for 1 minute','membuka kunci magic selama 1 menit','MATCH','Password opens lock for 1 minute'),
('Astral Projection','spell_level','Level 9 Necromancy','Level 9 Necromancy','MATCH','Level and school'),
('Astral Projection','casting_time','Casting Time: 1 hour','Casting Time\n1 hour','MATCH','Casting time metadata untranslated'),
('Astral Projection','range','Range: 10 feet','Range\n10 feet','MATCH','Range'),
('Astral Projection','number_targets','up to eight willing creatures','hingga 8 willing creatures','MATCH','Caster plus up to 8 willing creatures'),
('Astral Projection','already_on_plane','spell ends instantly if you are already on that','spell langsung berakhir','MATCH','Spell ends if caster already on Astral Plane'),
('Astral Projection','suspended_animation','state of suspended animation','keadaan suspended animation','MATCH','Bodies remain behind'),
('Astral Projection','unconscious','Unconscious condition','kondisi Unconscious','MATCH','Unconscious; English hyphenated line'),
('Astral Projection','no_food_air_age','doesn’t need food or air, and doesn’t age','tidak perlu makan atau bernapas, dan\ntidak mengalami penuaan','MATCH','No sustenance or aging'),
('Astral Projection','copies_stats','game statistics and possessions','game statistics serta barang miliknya','MATCH','Stats and possessions reproduced'),
('Astral Projection','silver_cord_location','between the shoulder','di antara kedua tulang belikat','MATCH','Silver cord origin'),
('Astral Projection','cord_one_foot','after 1 foot','setelah sekitar 1 foot','MATCH','Cord fades from sight after one foot'),
('Astral Projection','cord_specific_cut','only\nwhen an effect states','hanya bisa terjadi jika suatu\nefek secara khusus menyatakannya','MATCH','Cord severance only if explicitly specified'),
('Astral Projection','cord_death','body and astral form both die','tubuh fisik dan wujud astral target keduanya mati','MATCH','Severed cord kills both'),
('Astral Projection','leave_astral_plane','leaves that\nplane','meninggalkan Astral Plane','MATCH','Physical body/possessions follow cord'),
('Astral Projection','damage_nontransfer','no effect on the target’s body','tidak memengaruhi tubuh fisik','MATCH','Damage/effects on astral body not transferred'),
('Astral Projection','zero_hp','drops to\n0 Hit Points','turun ke 0','MATCH','Body or astral at zero ends spell for target'),
('Astral Projection','magic_action_end_all','Magic action to\ndismiss it','Magic action','MATCH','Caster may dismiss for all'),
('Astral Projection','return_to_body','target reappears in its body','target kembali ke tubuh fisiknya','MATCH','Alive target returns at spell end'),
('Astral Projection','per_target_components','for each of the spell’s targets','Untuk setiap target','MATCH','Each target needs both components'),
('Astral Projection','jacinth_price','one jacinth worth 1,000+ GP','1 jacinth seharga minimal 1,000 GP','MATCH','Jacinth minimum 1000 GP per target'),
('Astral Projection','silver_price','one silver bar worth\n100+ GP','1 silver bar\nseharga minimal 100 GP','MATCH','Silver bar minimum 100 GP per target'),
('Astral Projection','both_consumed','all of which the spell consumes','seluruhnya dikonsumsi','MATCH','Both materials consumed'),
('Augury','casting_time','Casting Time: 1 minute or Ritual','Casting Time\n1 minute or Ritual','MATCH','Casting time metadata untranslated'),
('Augury','specially_marked','specially marked sticks, bones,','specially marked sticks, bones,','MATCH','Current metadata remains English; candidate must apply marked condition across material set'),
('Augury','material_price','tokens worth 25+ GP','tokens worth 25+ GP','MATCH','Minimum cost for divinatory tokens'),
('Augury','omen_future','within the next 30 minutes','dalam 30 menit ke depan','MATCH','Omen concerns action within next 30 minutes'),
('Augury','gm_selects','The GM chooses\nthe omen','GM memilih satu pertanda','MATCH','GM picks omen'),
('Augury','omen_good','Weal\nGood','Weal\nHasil baik','MATCH','Good omen'),
('Augury','omen_bad','Woe\nBad','Woe\nHasil buruk','MATCH','Bad omen'),
('Augury','omen_mixed','Weal and woe','Weal and woe','MATCH','Mixed results'),
('Augury','other_circumstances','doesn’t account for circumstances','tidak memperhitungkan keadaan baru','MATCH','Does not account for changing future circumstances'),
('Augury','long_rest','before finish-\ning a Long Rest','sebelum menyelesaikan Long Rest','MATCH','Multiple casts within same long rest period'),
('Augury','repeat_cumulative','cumulative 25 percent chance','peluang kumulatif 25%','MATCH','Cumulative 25 percent chance of no answer after first'),
('Awaken','spell_level','Level 5 Transmutation','Level 5 Transmutation','MATCH','Spell level and school'),
('Awaken','casting_time','Casting Time: 8 hours','Casting Time\n8 hours','MATCH','Casting time metadata untranslated'),
('Awaken','range','Range: Touch','Range\nTouch','MATCH','Range'),
('Awaken','material','an agate worth 1,000+ GP','an agate worth 1,000+ GP','MATCH','Current metadata English; candidate needs agate min 1000 GP'),
('Awaken','casting_process','tracing magical path-\nways','menelusuri pola-pola magic','MATCH','Traces magic pathways within gemstone'),
('Awaken','eligible_creature','Beast or\nPlant creature with an Intelligence of 3 or less','Beast creature atau Plant creature dengan Intelligence 3 atau kurang','MATCH','Beast or Plant creature INT<=3'),
('Awaken','natural_plant','natural plant that isn’t a creature','tumbuhan alami yang bukan creature','MATCH','Natural non-creature plant eligible'),
('Awaken','int_ten','an Intelligence of 10','Intelligence 10','MATCH','Target gains INT 10'),
('Awaken','known_language','speak one\nlanguage you know','satu bahasa yang kamu ketahui','MATCH','One caster-known language'),
('Awaken','plant_becomes_creature','becomes a Plant creature','menjadi Plant creature','MATCH','Natural plant becomes Plant creature'),
('Awaken','moving_limbs','move its limbs, roots, vines','menggerakkan bagian tubuh seperti dahan, akar, atau sulur','MATCH','Movement of limbs roots vines'),
('Awaken','human_senses','senses similar to a human','kemampuan indra yang serupa\ndengan Human','MATCH','Human-like senses'),
('Awaken','gm_stats','GM\nchooses statistics','GM memilih game statistics','MATCH','GM selects creature stats'),
('Awaken','charm_30_days','Charmed condition\nfor 30 days','kondisi Charmed selama 30 hari','MATCH','Charm duration 30 days'),
('Awaken','charm_break_damage','allies deal damage','sekutumu\nmenyebabkan damage','MATCH','Charm ends when caster or ally damages'),
('Awaken','attitude_after','chooses its attitude toward you','menentukan sendiri\nsikapnya terhadapmu','MATCH','Attitude choice after charm ends'),
]

# Exact clause-specific anchors; mechanical safety checks do NOT sign off translation.
rows=[]
for i,(spell,aspect,eng,ind,status,note) in enumerate(CLAUSES,1):
 se=norm(S[spell]);li=norm(L[spell]);found_en=norm(eng) in se;found_id=norm(ind) in li
 rows.append(dict(id=f'GT082-{i:03d}',spell=spell,aspect=aspect,source_folio=','.join(map(str,FOLIOS[spell][0])),local_pdf_page=','.join(map(str,FOLIOS[spell][1])),english_anchor=eng.replace('\n',' '),local_anchor=ind.replace('\n',' '),source_found=found_en,local_found=found_id,provisional_semantic=status,editorial_status='PENDING',audit_note=note))
issues=[(x['id'],x['spell'],x['aspect'],x['source_found'],x['local_found']) for x in rows if not(x['source_found'] and x['local_found'])]
if issues:
 print('ANCHOR VALIDATION ERRORS',issues)
 raise RuntimeError('Source or draft anchors failed; correct evidence before reporting passing tests')
assert len(rows)>=50 and sum(x['provisional_semantic']=='MISMATCH' for x in rows)==1
with (OUT/'GwenTable_v082_Four_Spell_Clause_Audit.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)

# Exact local excerpt patch proposal, not a PDF operation or accepted editorial approval.
OLD='Benda itu terkunci secara\nmagic selama Duration dan tidak dapat dibuka menggunakan cara nonmagical.'
NEW='Selama durasi spell, benda itu terkunci secara magis. Tidak ada cara nonmagis yang dapat membuka kunci tersebut.'
assert OLD in L['Arcane Lock']
assert L['Arcane Lock'].count(OLD)==1
patched=L['Arcane Lock'].replace(OLD,NEW,1)
assert patched.count(NEW)==1 and patched.replace(NEW,OLD,1)==L['Arcane Lock']
assert 'tidak dapat dibuka menggunakan cara nonmagical' not in patched
patch={
'patch_id':'GT082-PROSE-001','status':'PROPOSED_NOT_APPROVED','spell':'Arcane Lock',
'field':'spell_effect_prose','source_srd_folio':110,'local_draft_page':219,
'srd_sha256':src_sha,'local_pdf_sha256':loc_sha,
'old_fragment_pdf_extraction':OLD,
'new_fragment_proposed':NEW,
'old_fragment_sha256':hashlib.sha256(OLD.encode()).hexdigest(),
'local_section_sha256':hashlib.sha256(L['Arcane Lock'].encode()).hexdigest(),
'candidate_section_sha256':hashlib.sha256(patched.encode()).hexdigest(),
'reversible_test_passed':True,
'status_note':'Patch applies to a structured/plain-text extraction copy only. Never perform blind find-and-replace on the binary PDF. Human approval needed.',
'editor_decision':'PENDING','editor_identity_verified':False,
}
(OUT/'GwenTable_v082_Arcane_Lock_Prose_Patch_PROPOSED.json').write_text(json.dumps(patch,ensure_ascii=False,indent=2),encoding='utf-8')
# Provide source-anchored, self-contained textual evidence for independent review.
context={spell:{'srd_pages':FOLIOS[spell][0],'local_pages':FOLIOS[spell][1],'source_english_excerpt':S[spell], 'draft_indonesian_excerpt':L[spell]} for spell in S}
(OUT/'GwenTable_v082_Four_Spell_Evidence.json').write_text(json.dumps({'status':'AI_SOURCE_COMPARED_EDITORIAL_PENDING','source_sha256':src_sha,'local_pdf_sha256':loc_sha,'spells':context,'clause_count':len(rows),'confirmed_scope_mismatch_count':1},ensure_ascii=False,indent=2))

# Manifest for the four editorial decisions. Do NOT populate approvals.
decisions=[{'spell':spell,'review_area':'full_spell_effect_prose_and_components','source_folios':FOLIOS[spell][0], 'local_pages':FOLIOS[spell][1], 'source_anchored_clauses':sum(x['spell']==spell for x in rows), 'known_issue':'GT082-PROSE-001' if spell=='Arcane Lock' else None,'editor_decision':'PENDING','editor_identity':'','review_reason':'','approval_reference':'','approved_at':''} for spell in S]
(OUT/'GwenTable_v082_Editor_Decision_Template.json').write_text(json.dumps({'schema':'GT-v082-source-compared-editorial-review','status':'NO_EDITOR_APPROVAL','source_pdf_sha256':src_sha,'local_pdf_sha256':loc_sha,'decisions':decisions},ensure_ascii=False,indent=2))

# HTML source review, no ability to mark authentic approval, export notes only.
DATA=json.dumps([{'spell':spell,'clauses':[x for x in rows if x['spell']==spell],**context[spell]} for spell in S],ensure_ascii=False).replace('</','<\\/')
CSS='''*{box-sizing:border-box}body{margin:0;background:#f7f8fb;color:#1e293b;font:16px/1.55 system-ui,sans-serif;overflow-wrap:anywhere}main{max-width:1160px;margin:0 auto;padding:18px}h1{font-size:clamp(1.45rem,3vw,2rem);line-height:1.25}h2{font-size:1.3rem}small,.muted{color:#475569}.panel{background:white;border:1px solid #cbd5e1;padding:14px;border-radius:12px;margin:14px 0}.warning{border-left:4px solid #b45309;padding:10px;background:#fffbeb}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.grid>*{min-width:0}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:490px;overflow-y:auto;border:1px solid #94a3b8;padding:12px;border-radius:8px;background:#f8fafc;font:13px/1.55 ui-monospace,monospace}.scroll{max-width:100%;overflow-x:auto}table{border-collapse:collapse;min-width:690px}th,td{padding:7px;border:1px solid #cbd5e1;vertical-align:top;text-align:left}th{background:#e2e8f0}tr.issue{background:#fff1f2}label{display:block;font-weight:650;margin:8px 0 4px}select,textarea,input,button{font:inherit;padding:8px;max-width:100%;border:1px solid #64748b;border-radius:6px}textarea{width:100%;min-height:70px}button{background:#1e293b;color:white;cursor:pointer}a{color:#1e40af}*:focus-visible{outline:3px solid #2563eb;outline-offset:2px}@media(max-width:800px){.grid{grid-template-columns:minmax(0,1fr)}main{padding:10px}table{min-width:690px}}@media print{button,textarea{display:none}pre{max-height:none}body{background:white}}'''
body=[f'''<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GwenTable v0.82: empat spell prioritas</title><style>{CSS}</style></head><body><main><h1>GwenTable · Audit empat spell prioritas v0.82</h1><p class="warning"><b>Belum mendapat persetujuan editorial.</b> {len(rows)} klausul memiliki jangkar sumber dan draf yang dapat ditelusuri. Penilaian semantik adalah review AI sementara; usulan Arcane Lock tidak diterapkan ke PDF.</p><label for="pick">Pilih spell</label><select id="pick"></select> <button id="download">Ekspor catatan review JSON</button><p class="muted" id="progress" aria-live="polite"></p><section class="panel" id="review"></section><p class="muted">SRD 5.2.1 © Wizards of the Coast, CC BY 4.0. Terjemahan tidak resmi, masih draf. Alat tidak melakukan verifikasi identitas editor.</p></main><script id="dataset" type="application/json">{DATA}</script><script>''']
body.append('''const data=JSON.parse(document.getElementById('dataset').textContent);const state={};const $=x=>document.getElementById(x);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){let d=data.find(x=>x.spell===$('pick').value)||data[0],s=state[d.spell]||{status:'PENDING',note:''};const rs=d.clauses.map(c=>'<tr'+(c.provisional_semantic==='MISMATCH'?' class="issue"':'')+'><th scope="row">'+esc(c.aspect)+'</th><td>'+esc(c.english_anchor)+'</td><td>'+esc(c.local_anchor)+'</td><td>'+esc(c.provisional_semantic)+'</td></tr>').join('');
$('review').innerHTML='<h2>'+esc(d.spell)+'</h2><p>SRD halaman '+d.srd_pages.join(', ')+' · PDF Indonesia halaman '+d.local_pages.join(', ')+' · '+d.clauses.length+' klausul</p><div class="grid"><section><h3>SRD bahasa Inggris</h3><pre lang="en">'+esc(d.source_english_excerpt)+'</pre></section><section><h3>Draf Bahasa Indonesia</h3><pre lang="id">'+esc(d.draft_indonesian_excerpt)+'</pre></section></div><h3>Klausul yang dibandingkan</h3><div class="scroll" role="region" aria-label="Matriks klausul" tabindex="0"><table><thead><tr><th>Klausul</th><th>SRD</th><th>Draf</th><th>Penilaian sementara</th></tr></thead><tbody>'+rs+'</tbody></table></div><label for="status">Status catatan, bukan persetujuan</label><select id="status"><option value="PENDING">Belum ditinjau editor</option><option value="REVIEWING">Sedang ditinjau</option><option value="NEEDS_CHANGE">Perlu perubahan</option><option value="RECOMMENDATION_READY">Usulan siap ditinjau lanjutan</option></select><label for="note">Catatan pemeriksaan</label><textarea id="note" placeholder="Masukkan nomor klausul, keputusan, alasan, dan referensi sumber..."></textarea>';
$('status').value=s.status;$('note').value=s.note;$('status').onchange=()=>save();$('note').oninput=()=>save();$('progress').textContent=d.clauses.length+' klausul untuk '+d.spell+'; seluruh status adalah catatan saja, bukan pengesahan.';}
function save(){const k=$('pick').value;state[k]={status:$('status').value,note:$('note').value}}
$('pick').innerHTML=data.map(x=>'<option value="'+esc(x.spell)+'">'+esc(x.spell)+'</option>').join('');$('pick').onchange=render;
$('download').onclick=()=>{const o=JSON.stringify({edition:'v0.82',human_approval_claimed:false,review_notes:state},null,2),b=new Blob([o],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='GwenTable_v082_Reviewer_Notes_NOT_APPROVAL.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};render();
</script></body></html>''')
(OUT/'GwenTable_v082_4_Spell_Bilingual_Workbench.html').write_text('\n'.join(body),encoding='utf-8')

metrics={'baseline_spell_count':339,'priority_spells':len(S),'clause_anchors':len(rows),'source_anchor_passes':sum(x['source_found'] for x in rows),'local_anchor_passes':sum(x['local_found'] for x in rows),'confirmed_provisional_meaning_mismatches':sum(x['provisional_semantic']=='MISMATCH' for x in rows),'prose_patch_proposals':1,'new_editor_signoffs':0,'master_pdf_modified':False,'repository_modified':False,'source_srd_sha256':src_sha,'local_pdf_sha256':loc_sha,'source_prose_review':'AI_ASSISTED_NOT_INDEPENDENT_CERTIFICATION','publication_gate':'NO_GO'}
(OUT/'GwenTable_v082_Static_QA.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2))
print(json.dumps(metrics,ensure_ascii=False,indent=2))
