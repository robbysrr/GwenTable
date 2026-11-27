// A saved character may enter Play/final PDF only after explicit builder review.
// This is a local product-state receipt, not a cryptographic identity token.
// Older records and imports deliberately start without a receipt. Their original
// Build, custom fields, Play resources and Undo history remain untouched.
import {draftRevision,canOpenFinalSheet,validatedSavedDraft} from './builder-completion.js';
import {choiceReviewVersion} from './builder-choice-review.js';
import {stageIndex} from './builder-stages.js';

export const savedCompletionVersion=1;
export function createSavedCompletionApproval(draft,flow,appearanceDecision) {
  if(!canOpenFinalSheet(draft,flow,appearanceDecision)) return null;
  return {
    version:savedCompletionVersion,sourceVersion:'SRD 5.2.1',
    draftRevision:draftRevision(draft),
    choiceReview:structuredClone(flow.choiceReview),
    appearanceDecision:structuredClone(appearanceDecision),
    unlocked:flow.unlocked,
    arrayAssigned:[...(flow.arrayAssigned??[])],
    waitingForRoll:Boolean(flow.waitingForRoll),
    waitingForHP:Boolean(flow.waitingForHP)
  };
}
export function savedCharacterIsComplete(record) {
  try {
  if(!record?.draft||!validatedSavedDraft(record.draft)) return false;
  const proof=record.completionApproval;
  if(!proof||proof.version!==savedCompletionVersion||proof.sourceVersion!=='SRD 5.2.1'||
    proof.draftRevision!==draftRevision(record.draft)||proof.choiceReview?.version!==choiceReviewVersion||
    !Array.isArray(proof.arrayAssigned)||proof.unlocked!==stageIndex('appearance')||
    proof.waitingForRoll!==false||proof.waitingForHP!==false) return false;
  const flow={unlocked:proof.unlocked,arrayAssigned:proof.arrayAssigned,
    waitingForRoll:proof.waitingForRoll,waitingForHP:proof.waitingForHP,
    choiceReview:proof.choiceReview,unavailable:false};
  return canOpenFinalSheet(record.draft,flow,proof.appearanceDecision);
  } catch {return false;} // Malformed legacy/custom records fail closed.
}
export function savedCharacterReviewState(record) {
  if(!savedCharacterIsComplete(record)) return null;
  const proof=record.completionApproval;
  return {choiceReview:structuredClone(proof.choiceReview),
    appearanceDecision:structuredClone(proof.appearanceDecision),
    unlocked:proof.unlocked,arrayAssigned:[...proof.arrayAssigned]};
}
