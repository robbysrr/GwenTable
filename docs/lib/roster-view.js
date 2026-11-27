// Never let one malformed saved record hide otherwise healthy characters.
// This is a read-only view classification; nothing is deleted, normalized in
// IndexedDB, or implicitly omitted from a standard full roster backup.
import {migrateDraft,validateCharacter} from './character.js';
import {portableRosterRecordIssue} from './portable.js';

export function inspectRosterRecord(record) {
  const portIssue=portableRosterRecordIssue(record);
  try {
    if(!record||typeof record!=='object'||Array.isArray(record)||
       typeof record.id!=='string'||!record.id) throw new Error('Invalid saved record');
    if(record.draft) {
      if(validateCharacter(record.draft).length) throw new Error('Invalid character build');
      const draft=migrateDraft(record.draft);
      if(validateCharacter(draft).length) throw new Error('Invalid migrated character build');
      return {record,kind:'build',draft,portable:portIssue===null,portIssue};
    }
    if(record.gcx) {
      const character=record.gcx.character;
      if(!character||typeof character.name!=='string'||!character.name.trim()||
          !Array.isArray(character.classes)||!character.classes.every(item=>item&&typeof item.name==='string'))
        throw new Error('Invalid GCX character');
      return {record,kind:'gcx',character,portable:portIssue===null,portIssue};
    }
  } catch(error) {
    return {record,kind:'unreadable',portable:false,portIssue:portIssue??error.message};
  }
  return {record,kind:'unreadable',portable:false,
    portIssue:portIssue??'No usable character build or GCX record'};
}

export function inspectRoster(records) {
  const inspected=records.map(inspectRosterRecord);
  return {inspected,portable:inspected.filter(row=>row.portable),
    excluded:inspected.filter(row=>!row.portable)};
}
