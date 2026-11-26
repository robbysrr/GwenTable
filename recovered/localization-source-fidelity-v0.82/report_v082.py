#!/usr/bin/env python3
from pathlib import Path
import csv,html,json,fitz
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,KeepTogether,PageBreak
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
R=Path(__file__).resolve().parent
result=json.loads((R/'GwenTable_v082_Static_QA.json').read_text())
with (R/'GwenTable_v082_Four_Spell_Clause_Audit.csv').open(encoding='utf-8-sig',newline='') as f:rows=list(csv.DictReader(f))
by_spell={spell:[r for r in rows if r['spell']==spell] for spell in ['Arcane Lock','Astral Projection','Augury','Awaken']}
patch=json.loads((R/'GwenTable_v082_Arcane_Lock_Prose_Patch_PROPOSED.json').read_text())
pdfmetrics.registerFont(TTFont('DejaVu','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVu-Bold','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='T82',fontName='DejaVu-Bold',fontSize=16,leading=22,textColor=colors.HexColor('#1e3655'),spaceAfter=13))
styles.add(ParagraphStyle(name='H82',fontName='DejaVu-Bold',fontSize=11,leading=16,textColor=colors.HexColor('#1e3655'),spaceBefore=13,spaceAfter=5))
styles.add(ParagraphStyle(name='B82',fontName='DejaVu',fontSize=8.8,leading=14,spaceAfter=6))
styles.add(ParagraphStyle(name='Small82',fontName='DejaVu',fontSize=7.4,leading=11,spaceAfter=4))
styles.add(ParagraphStyle(name='Cell82',fontName='DejaVu',fontSize=8,leading=11))
P=lambda s,sty='B82':Paragraph(s,styles[sty])
E=lambda s:html.escape(str(s))

output=R/'GwenTable_v082_Source_Comparison_And_Correction_Report.pdf'
doc=SimpleDocTemplate(str(output),pagesize=A4,leftMargin=42,rightMargin=42,topMargin=39,bottomMargin=40,title='GwenTable v0.82 Source Comparison QA')
story=[P('GwenTable · Source-Based Localization QA v0.82','T82'),P('Audit empat spell prioritas | Draf Bahasa Indonesia | Belum disetujui editor independen'),P('Hasil yang benar-benar diperiksa','H82')]
result_table=[['Metrik','Hasil'],['Spell sumber diperiksa','4'],['Klausul berjangkar ganda','62 / 62'],['Klausul tampak selaras secara sementara','61'],['Cacat cakupan makna yang teridentifikasi','1 (Arcane Lock)'],['Patch kandidat pada salinan teks','1, dapat dibatalkan persis'],['Kandidat metadata v0.81 yang berubah','0 dari 68'],['Persetujuan editor independen','0'],['Keputusan rilis','NO-GO']]
t=Table([[P(E(a),'Cell82'),P(E(b),'Cell82')] for a,b in result_table],colWidths=[275,233],repeatRows=1,hAlign='LEFT')
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#edf2f7')),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#bdcbd7')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#fbfcfe')]),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
story.append(t)
story.append(P('Temuan P0 · Arcane Lock: membuka kunci vs membuka benda','H82'))
story.append(P('<b>SRD 5.2.1, halaman 110:</b> aturan menyatakan tidak ada cara nonmagis untuk membuka <i>kuncinya</i>.'))
story.append(P('<b>PDF Indonesia, halaman 219:</b> objeknya dinyatakan tidak bisa dibuka secara nonmagis. Kalimat ini dapat dibaca terlalu luas, seakan semua cara fisik membuka objek dilarang.'))
story.append(P('<b>Redaksi yang direkomendasikan untuk editor:</b>'))
story.append(P(E(patch['new_fragment_proposed'])))
story.append(P('<b>Status:</b> PROPOSED_NOT_APPROVED. Tidak ada perubahan terhadap PDF utama, aplikasi, data tersimpan, atau repository.'))
story.append(P('Metode dan batasan','H82'))
story.append(P('Setiap potongan kalimat dibandingkan <b>di dalam bagian spell yang tepat</b> pada PDF SRD dan PDF Indonesia. Ini menghindari pencocokan palsu dari spell tetangga atau stat block lain. Jangkar membuktikan lokasi, bukan secara otomatis ketepatan makna. Penilaian kecocokan dilakukan secara AI-assisted dan belum ditandatangani editor.'))
story.append(PageBreak())
story.append(P('Jejak per spell dan batas keputusan','T82'))
for spell,rs in by_spell.items():
 sf=','.join(map(str,sorted({int(y) for r in rs for y in r['source_folio'].split(',')})))
 lp=','.join(map(str,sorted({int(y) for r in rs for y in r['local_pdf_page'].split(',')})))
 issues=[r for r in rs if r['provisional_semantic']=='MISMATCH']
 story.append(P(f'<b>{E(spell)}</b> | SRD hlm. {sf} | PDF Indonesia hlm. {lp} | {len(rs)} klausul | {len(issues)} masalah teridentifikasi'))
story.append(P('Pemisahan dua antrean perbaikan','H82'))
story.append(P('A. <b>68 perubahan metadata v0.81:</b> tetap utuh, status PENDING dan belum ada persetujuan editor. Meliputi casting time, duration, dan material components.'))
story.append(P('B. <b>1 koreksi baru v0.82:</b> perubahan satu kalimat prosa efek <i>Arcane Lock</i>. Ini tidak boleh digabung diam-diam sebagai kandidat metadata nomor 69 tanpa catatan sumber dan keputusan independen.'))
story.append(P('Regresi yang dilakukan','H82'))
for item in ['62 jangkar English dan 62 jangkar Indonesia ditemukan di masing-masing entri spell.',
'Patch kandidat diterapkan ke salinan teks saja, lalu dibatalkan identik; SHA-256 sumber PDF tidak berubah.',
'68 kandidat metadata sebelumnya masih PENDING, bukan disetujui.',
'Chromium 320/375/768/1280 px, simulasi teks 200%, highlight mismatch, catatan review, ekspor JSON: lulus.',
'Pengujian v0.81 dijalankan ulang dan lulus pada 29/29 kasus mutasi yang ada.']:
 story.append(P('• '+E(item)))
story.append(P('Outstanding dan next','H82'))
story.append(P('Empat spell ini belum mendapat verifikasi manusia; belum ada PDF/UA, NVDA/TalkBack, atau browser produksi. Langkah terbaik adalah meminta editor bilingual independen menilai satu koreksi prosa serta redaksi empat material P0. Setelah disetujui, lakukan patch pada sumber terstruktur, bukan operasi find/replace binary PDF.'))
story.append(P('ENVIRONMENT: STAY Chat/lokal untuk review; PREPARE dossier; SWITCH Codex hanya untuk integrasi repository GwenTable, migrasi/CI, dan regresi rules engine yang nyata.'))
story.append(P('Atribusi sesuai SRD 5.2.1','H82'))
story.append(P('This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.','Small82'))

def footer(canvas,doc):
 canvas.saveState();canvas.setFont('DejaVu',7);canvas.setFillColor(colors.HexColor('#64748b'));canvas.drawString(43,22,'GwenTable v0.82 · Audit internal · Belum siap publikasi');canvas.drawRightString(A4[0]-43,22,str(doc.page));canvas.restoreState()
doc.build(story,onFirstPage=footer,onLaterPages=footer)

def proof():
 target=R/'GwenTable_v082_Arcane_Lock_Editorial_Proof.pdf'
 d=SimpleDocTemplate(str(target),pagesize=A4,leftMargin=42,rightMargin=42,topMargin=42,bottomMargin=42)
 blocks=[P('Arcane Lock · usulan koreksi semantik','T82'),P('SRD 5.2.1 hlm. 110 | PDF Indonesia hlm. 219 | P0 | Belum disetujui'),P('Pernyataan sumber','H82'),P('SRD membatasi cara untuk <b>membuka kunci magis</b> secara nonmagis, bukan menyatakan benda kebal terhadap semua tindakan fisik.'),P('Kutipan draf saat ini (potongan)','H82'),P(E(patch['old_fragment_pdf_extraction']).replace('\n',' ')),P('Usulan pengganti','H82'),P(E(patch['new_fragment_proposed'])),P('Mengapa penting','H82'),P('Kalimat lama dapat membuat DM menganggap pintu atau peti tidak dapat dibuka lewat seluruh metode nonmagis, termasuk metode yang bukan proses <i>unlocking</i>. SRD secara khusus berbicara tentang kunci. Tidak ada aturan baru yang ditambahkan.'),P('Keputusan editor: PENDING','H82'),P('Ini adalah proof untuk evaluasi. Tidak ada perubahan pada PDF utama, HTML website, atau aturan karakter.'),P('Sumber: SRD 5.2.1, CC BY 4.0. Terjemahan tidak resmi.')]
 d.build(blocks,onFirstPage=footer,onLaterPages=footer)
 return target
proofpath=proof()
assert len(fitz.open(output))>=2 and len(fitz.open(proofpath))==1
for pdfpath in (output,proofpath):
 p=fitz.open(pdfpath)
 for i,page in enumerate(p):
  for block in page.get_text('dict')['blocks']:
   if block.get('type')==0:
    rect=fitz.Rect(block['bbox']);assert rect.x0>=-1 and rect.y0>=-1 and rect.x1<=page.rect.width+1 and rect.y1<=page.rect.height+1,(pdfpath,i,rect)
  if i==0:
   page.get_pixmap(matrix=fitz.Matrix(1.3,1.3),alpha=False).save(str(R/(pdfpath.stem+'_page1.png')))
print('Reports',output.name,len(fitz.open(output)),'pages',proofpath.name)
