#!/usr/bin/env python3
"""Strict, non-deployable reversible *text preview* for the Arcane Lock proposal.
Never applies to PDF bytes or website source and cannot assert real editor approval.
"""
import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parent
sha=lambda t:hashlib.sha256(t.encode()).hexdigest()
class PreviewRejected(Exception):pass

def candidate_preview(local_spell_text: str, proposal:dict)->str:
 if proposal.get('status')!='PROPOSED_NOT_APPROVED' or proposal.get('editor_decision')!='PENDING' or proposal.get('editor_identity_verified') is not False:
  raise PreviewRejected('approval state cannot be asserted by this offline tool')
 old,new=proposal['old_fragment_pdf_extraction'],proposal['new_fragment_proposed']
 if sha(local_spell_text)!=proposal['local_section_sha256']:raise PreviewRejected('source section checksum mismatch')
 if sha(old)!=proposal['old_fragment_sha256']:raise PreviewRejected('source fragment checksum mismatch')
 if local_spell_text.count(old)!=1:raise PreviewRejected('expected exactly one source fragment')
 if new in local_spell_text:raise PreviewRejected('new text already in source')
 output=local_spell_text.replace(old,new,1)
 if sha(output)!=proposal['candidate_section_sha256']:raise PreviewRejected('candidate checksum mismatch')
 return output

def revert_preview(candidate_text:str,proposal:dict)->str:
 if sha(candidate_text)!=proposal['candidate_section_sha256']:raise PreviewRejected('candidate checksum mismatch')
 old,new=proposal['old_fragment_pdf_extraction'],proposal['new_fragment_proposed']
 if candidate_text.count(new)!=1:raise PreviewRejected('candidate fragment not unique')
 output=candidate_text.replace(new,old,1)
 if sha(output)!=proposal['local_section_sha256']:raise PreviewRejected('rollback mismatch')
 return output

if __name__=='__main__':
 p=json.loads((R/'GwenTable_v082_Arcane_Lock_Prose_Patch_PROPOSED.json').read_text())
 s=json.loads((R/'GwenTable_v082_Four_Spell_Evidence.json').read_text())['spells']['Arcane Lock']['draft_indonesian_excerpt']
 assert revert_preview(candidate_preview(s,p),p)==s
 print('PASS: preview-only text patch and exact rollback; no PDF, repository or website write')
