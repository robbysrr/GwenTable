import {templateCharacter} from '../../dist/lib/character.js';
import {normalizePlay, playProfile} from '../../dist/lib/play.js';
import {stageIndex} from '../../dist/builder-stages.js';
import {draftRevision} from '../../dist/builder-completion.js';
import {emptyChoiceReview, acceptChoiceReview} from '../../dist/builder-choice-review.js';
import {createSavedCompletionApproval} from '../../dist/saved-character-completion.js';

export function inventoryFixture(draft = templateCharacter('Fighter')) {
  const fields=['species','className','background','gamingSet','languages','training','feats','boost','equipment','classMagic','originMagic'];
  const choiceReview=fields.reduce((state,field)=>acceptChoiceReview(state,draft,field),emptyChoiceReview());
  const flow={step:stageIndex('appearance'),unlocked:stageIndex('appearance'),choiceReview,
    waitingForRoll:false,waitingForHP:false,arrayAssigned:[0,1,2,3,4,5],unavailable:false};
  const completionApproval=createSavedCompletionApproval(draft,flow,{mode:'skipped',revision:draftRevision(draft)});
  if (!completionApproval) throw new Error('The synthetic fixture needs a reviewed build.');
  return {id:'inventory-fixture',draft,completionApproval,play:normalizePlay(playProfile(draft)),
    customMetadata:{notes:'Synthetic record', links:{foreignId:'retain-me'}}};
}
