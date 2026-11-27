// Save-completion guard: the builder review/route envelope is part of a saved
// draft, even when the underlying character model has not changed.
import {draftRevision} from './builder-completion.js';
export function snapshotPersistenceRevision(snapshot={}) {
  return draftRevision({
    draft:snapshot.draft, id:snapshot.id, draftId:snapshot.draftId,
    step:snapshot.step, unlocked:snapshot.unlocked,
    waitingForRoll:snapshot.waitingForRoll,waitingForHP:snapshot.waitingForHP,
    arrayAssigned:snapshot.arrayAssigned, choiceReview:snapshot.choiceReview,
    appearanceDecision:snapshot.appearanceDecision,
    finished:snapshot.finished
  });
}

// Injectable and deterministic. An older async completion cannot claim that a
// newer review acknowledgement has been saved. A failed write stays failed.
export function createLatestDraftWriter({save,currentRevision,onStatus}) {
  let queue=Promise.resolve();
  let latestRequest=0;
  let conflicted=false;
  return snapshot=>{
    if(conflicted) {onStatus('conflict');return Promise.resolve(false);}
    const request=++latestRequest;
    const revision=snapshotPersistenceRevision(snapshot);
    onStatus('saving');
    queue=queue.then(()=>{
      if(conflicted) {const error=new Error('Draft storage conflict');error.code='DRAFT_REVISION_CONFLICT';throw error;}
      return save(snapshot);
    }).then(()=>{
      // A committed older snapshot is not proof the latest on-screen edits
      // were saved. Report success only for the still-current request.
      const acknowledged=request===latestRequest&&revision===currentRevision();
      if(request===latestRequest) onStatus(acknowledged?'saved':'unsaved');
      return acknowledged;
    }).catch(error=>{
      if(error?.code==='DRAFT_REVISION_CONFLICT') conflicted=true;
      if(request===latestRequest) onStatus(conflicted?'conflict':'failed');
      return false;
    });
    return queue;
  };
}
