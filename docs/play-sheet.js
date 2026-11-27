import {shieldSlots} from './lib/srd-shield.mjs';
import {liveArmorClass,liveD20Dice} from './lib/srd-live-modifiers.mjs';
import {dodgeAvailable,dodgeActive} from './lib/srd-dodge.mjs';
import {pendingOwnEndSaves,hasOwnEndEffects,boundaryEffects} from './lib/srd-condition-lifecycle.mjs';
import {conditionSourcesHTML,conditionSourceCommand} from './condition-sources.js';
import {liveCheckHTML,resolveLiveCheckForm,concentrationRollHTML,concentrationRollCommand} from './live-check-preview.js';
import {attackPanelHTML,attackFormChanged,fillAttackDice,attackFormResult} from './attack-panel.js';
import {savedEquipmentLines} from './lib/saved-inventory.js';
import {commitSavedInventory} from './lib/inventory-storage.js';
import {inventoryPanel, inventoryFormCommand} from './inventory-panel.js';
import {savedCharacterIsComplete} from './saved-character-completion.js';
import {checkSavedExportFreshness} from './saved-character-freshness.js';
import {distance} from './lib/distances.js';
import {mountCharacterEntityLists,jumpToSheetSection,sheetSectionNav,sheetReturnLink} from './character-entity-list.js';
import {sheetEntities,sheetGroup} from './sheet-entities.js';
import {appearanceEntries} from './lib/appearance.js';
import {icon} from './ui-icons.js';
import {copy,htmlCopy} from './locale.js';
import {prepGuide} from './builder-magic.js';
import {playAdviceHTML} from './play-guide.js';
import {rollDice} from './dice-geometry.js';
import {attackRollMode,planAttack} from './lib/combat-assist.js';
import {beastQuickReference,beastFormLimit} from './lib/beast-reference.js';
import {beastCombatProfile,planBeastAttack} from './lib/beast-combat.js';
import {animateDice} from './dice-tools.js';
import {abilities, source} from './lib/rules.js';
import {characters,characterStorageRevision,characterConflictCode,CharacterConflictError} from './lib/storage.js';
import {playProfile, normalizePlay, advancePlay, playConditions, hasIncapacitatingCondition, smiteDice} from './lib/play.js';
import {makeSavedCharacterExport} from './lib/portable.js';
import {prepareInventoryActivationBackup} from './lib/inventory-activation-backup.js';
import {levelsFor} from './lib/character.js';
import {classes} from './lib/catalog.js';
import {setSavedMulticlassPlan,clearSavedMulticlassPlan,inspectSavedMulticlassPlan,multiclassPlanChoices} from './lib/saved-multiclass-plan.mjs';
import {prepareMulticlassLevelUp,clearMulticlassLevelUp,inspectMulticlassLevelUp} from './lib/saved-multiclass-levelup.mjs';
import {setSavedRogueEntry,clearSavedRogueEntry,inspectSavedRogueEntry,rogueEntryOptions} from './lib/saved-multiclass-rogue-entry.mjs';
import {activateFighterRogue} from './lib/activate-fighter-rogue.mjs';
import {advanceFighterRogue2} from './lib/advance-fighter-rogue2.mjs';
import {advanceFighterRogue3} from './lib/advance-fighter-rogue3.mjs';
import {restoringTouchConditions} from './lib/paladin-progression.js';
import {isHuntersMark} from './lib/ranger-progression.js';
import {statExplanations} from './stat-explanations.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const signed=n=>n>=0?'+'+n:String(n);
const die=sides=>1+Math.floor(Math.random()*sides);
const stat=(label,value)=>`<div class="stat"><strong>${value}</strong><small>${label}</small></div>`;
const link=(page,text)=>`<a class="rule" href="${source.url}#page=${page}" target="_blank" rel="noopener">${text} ↗</a>`;
const list=rows=>`<ul class="sheet-list">${rows.map(row=>'<li>'+row+'</li>').join('')}</ul>`;
const section=(key,title,body,open)=>`<details data-panel="${key}" ${open?'open':''}><summary>${title}</summary><div class="play-details">${body}</div></details>`;

export function mountPlaySheet(root,download,advance,print,showDetail) {
  const body=root.querySelector('#play-body');
  const feedback=root.querySelector('#play-feedback');
  let activeId=null;
  let loadedId=null;
  let record=null;
  let profile=null;
  let play=null;
  let busy=false;
  let request=0;
  let retryInventory=null;
  let activationBackup=null;
  const clearActivationBackup=()=>{
    if(activationBackup?.url) URL.revokeObjectURL(activationBackup.url);
    activationBackup=null;
  };
  const renderLists=mountCharacterEntityLists(body,showDetail);
  let panels=new Set(['spells','features','how','identity']);
  const message=(text,bad=false)=>{
    feedback.textContent=text;
    feedback.classList.toggle('enc-problem',bad);
  };

  function takeRecord(next) {
    if(activationBackup && (activationBackup.characterId!==next.id ||
      activationBackup.revision!==characterStorageRevision(next)))clearActivationBackup();
    record=next;
    profile=playProfile(next.draft,next.multiclassActive);
    play=normalizePlay(profile,next.play);
    render();
  }
  function render() {
    const d=profile.d, s=profile.s, p=play;
    const live=!p.dead;
    const upright=p.hp>0&&live&&!hasIncapacitatingCondition(p.conditions);
    const stopped=p.dead?copy('Dead'):p.stable?copy("Stable at 0 HP"):p.hp===0?'Unconscious':'';
    const username=esc(d.name);
    const header=`<div class="play-header"><h1 class="character-identity">${icon('character')} ${username}</h1><p>${htmlCopy("Level")} ${profile.totalLevel??d.level} ${esc(d.className)}${profile.multiclass?' '+profile.multiclass.primaryLevel+' / Rogue '+profile.rogueLevel:''}${profile.rogueSubclass?' · Rogue subclass: '+esc(profile.rogueSubclass):s.subclass?' · '+esc(s.subclass):''} · ${esc(d.species)} · ${esc(d.background)}</p></div>`;
    const hpActions=live?`<form data-play-form="hp" class="enc-inline"><label>${htmlCopy("Amount")}<input name="value" type="number" min="0" max="9999" required></label>
      <button type="submit" name="action" value="damage" class="damage-action">${htmlCopy("Damage")}</button><button type="submit" name="action" value="heal" class="heal-action">${htmlCopy("Heal")}</button>
      <button type="submit" name="action" value="temp">${htmlCopy("Set temp HP")}</button><label class="enc-checkbox"><input type="checkbox" name="critical"> ${htmlCopy("Critical hit")}</label></form>`:'';
    const death=live&&p.hp===0&&!p.stable?`<p>Death saves · ${p.successes} successes · ${p.failures} failures</p>
      <form data-play-form="death-save" class="enc-inline"><label>${s.fighter?.survivor?copy("Final d20 result (Advantage)"):copy("d20 result")}<input type="number" name="value" min="1" max="20" required></label>
      <button type="submit">${htmlCopy("Record death save")}</button><button type="button" data-play-action="death-roll">${s.fighter?.survivor?copy("Roll with Advantage"):copy("Roll death save")}</button><button type="button" data-play-action="stable">${htmlCopy("Stabilize")}</button></form>`:'';
    const conditionsList=playConditions.map(name=>{
      const automatic=name==='Unconscious'&&p.hp===0&&!p.dead;
      const active=automatic||(p.manualConditions??p.conditions).includes(name);
      const tracked=(p.conditionEffects??[]).some(e=>e.name===name);
      return `<button type="button" class="play-condition ${active?'is-active':''}" data-play-action="condition" data-condition="${name}"
        aria-pressed="${active}" aria-label="${htmlCopy(active?'Remove {name}':'Apply {name}',{name})}"
        ${automatic||!live?'disabled':''}>${esc(name)}${automatic?' · 0 HP':''}${tracked?' · '+htmlCopy('Tracked source'):''}</button>`;
    }).join('');
    const pendingChecks=p.concentrationChecks.map(({dc,damage},index)=>`<div class="play-concentration-check">
      <p><strong>${htmlCopy('Constitution save DC {dc}',{dc})}</strong> · ${htmlCopy('{damage} damage',{damage})}${index?' · #'+(index+1):''}</p>
      ${index===0?`<div class="play-check-buttons"><button type="button" data-play-action="concentration-save" data-success="true">${htmlCopy('Save succeeded')}</button>
      <button type="button" data-play-action="concentration-save" data-success="false">${htmlCopy('Save failed')}</button></div>`:''}
    </div>`).join('');
    const ac=liveArmorClass(profile,p);
    const modifierPanel=`<details><summary>${htmlCopy('Temporary AC sources')}</summary>
      <p>${htmlCopy('Base AC {base}; live AC {total}',{base:ac.base,total:ac.total})}</p>
      ${ac.entries.map(e=>`<p>${esc(e.spell)}: +${e.bonus} AC · ${htmlCopy('{count} active source(s)',{count:e.sourceCount})}</p>`).join('')}
      <p class="play-note">${htmlCopy('Confirm actual AC, caster Concentration and duration at the table. Same spell bonuses do not stack. Transformed-form and inventory-dependent AC are not resolved here.')}</p>
      ${(p.modifierEffects??[]).filter(e=>e.spell==='Shield of Faith').map(e=>`<form data-play-form="modifier-remove" class="enc-inline">
        <p>${esc(e.spell)} · ${esc(e.caster)} · #${e.id}</p>
        <input type="hidden" name="id" value="${e.id}"><input type="hidden" name="spell" value="${esc(e.spell)}"><input type="hidden" name="caster" value="${esc(e.caster)}">
        <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('Confirm this source ended')}</label><button type="submit">${htmlCopy('End source')}</button></form>`).join('')}
      ${live&&!p.shape.active?`<form data-play-form="modifier-add" class="enc-inline"><h3>Shield of Faith (+2 AC)</h3>
        <p>${htmlCopy('Concentration, up to 10 minutes; table-managed duration.')}</p>
        <label>${htmlCopy('Other caster name or identifier')}<input name="caster" maxlength="60" required></label>
        <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('Confirm another caster applied this active spell to you.')}</label>
        <button type="submit">${htmlCopy('Record incoming Shield of Faith')}</button></form>`:''}
      </details>`;
    // Bless/Bane (SRD 5.2.1 pp.112-113): recorded incoming effects add or subtract a physical d4
    // on saving throws (and attack rolls, resolved at the table). Same spell overlaps; different spells both apply.
    const saveDice=liveD20Dice(p,'save');
    const diceSources=(p.modifierEffects??[]).filter(e=>e.spell==='Bless'||e.spell==='Bane');
    const diceModifierPanel=`<details${diceSources.length?' open':''}><summary>${htmlCopy('Bless and Bane')}</summary>
      ${saveDice.map(e=>`<p>${esc(e.spell)}: ${htmlCopy(e.sign>0?'add 1d4 to attack rolls and saving throws':'subtract 1d4 from attack rolls and saving throws')} · ${htmlCopy('{count} active source(s)',{count:e.sourceCount})}</p>`).join('')}
      <p class="play-note">${htmlCopy('Save forms on this sheet ask for the d4. Add or subtract it yourself on attack rolls. Ability checks are not affected. Two Bless spells give one d4; Bless and Bane both apply. Confirm the caster’s Concentration and the 1-minute duration at the table.')}</p>
      ${diceSources.map(e=>`<form data-play-form="modifier-remove" class="enc-inline">
        <p>${esc(e.spell)} · ${esc(e.caster)} · #${e.id}</p>
        <input type="hidden" name="id" value="${e.id}"><input type="hidden" name="spell" value="${esc(e.spell)}"><input type="hidden" name="caster" value="${esc(e.caster)}">
        <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('Confirm this source ended')}</label><button type="submit">${htmlCopy('End source')}</button></form>`).join('')}
      ${live&&!p.shape.active?`<form data-play-form="modifier-add" class="enc-inline"><h3>${htmlCopy('Record Bless or Bane on you')}</h3>
        <label>${htmlCopy('Spell')}<select name="spell"><option value="Bless">Bless (+1d4)</option><option value="Bane">Bane (−1d4)</option></select></label>
        <p>${htmlCopy('Bane applies only after you failed its Charisma saving throw.')}</p>
        <label>${htmlCopy('Caster name or identifier')}<input name="caster" maxlength="60" required></label>
        <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('Confirm this spell is active on you now.')}</label>
        <button type="submit">${htmlCopy('Record spell effect')}</button></form>`:''}
      </details>`;
    const statusCard=`<section class="card play-health"><h2>${htmlCopy("Health & status")}</h2>
      <div class="stats">${stat('Hit Points',p.hp+'/'+profile.maxHP)}${stat(copy("Temporary HP"),p.temp)}${stat('Armor Class',ac.total)}</div>
      ${p.shieldEffect?`<p role="status">${htmlCopy('Shield active: +5 AC. No damage from Magic Missile. Ends at start of your next turn.')}</p>`:''}
      ${modifierPanel}
      ${diceModifierPanel}
      ${stopped?`<p class="enc-down">${stopped}</p>`:''}
      ${hpActions}${death}
      ${upright&&s.fighter?.survivor&&p.hp<=Math.floor(profile.maxHP/2)?("<button type=\"button\" data-play-action=\"heroic-rally\">"+htmlCopy("Use Heroic Rally at turn start")+"</button>"):''}
      ${live?`<form data-play-form="exhaustion" class="enc-inline"><label>Exhaustion<input type="number" name="value" min="0" max="6" value="${p.exhaustion}" required></label><button type="submit">${htmlCopy("Set exhaustion")}</button></form>`:''}
      ${upright?`<form data-play-form="concentration" class="enc-inline"><label>Concentration<input name="value" maxlength="80" value="${esc(p.focus)}" placeholder="Spell or effect"></label>
      <button type="submit">${htmlCopy("Set concentration")}</button>${p.focus?("<button type=\"button\" data-play-action=\"clear-focus\">"+htmlCopy("End")+"</button>"):''}</form>`:''}
      ${p.focus?`<p class="play-note">${htmlCopy('Concentration: {effect}',{effect:p.focus})} · ${htmlCopy('Constitution save modifier {modifier}',{modifier:signed(s.saves[2]-2*p.exhaustion)})}</p>`:''}
      ${pendingChecks?`<div role="group" aria-label="${htmlCopy('Pending Concentration saves')}" class="play-pending-checks"><h3>${htmlCopy('Pending Concentration saves')} (${p.concentrationChecks.length})</h3>${pendingChecks}${concentrationRollHTML(p)}<p class="play-note">${htmlCopy('Roll each Constitution saving throw at the table. Resolve the oldest check first; any failure ends Concentration.')}</p></div>`:''}
      <details class="play-conditions"><summary>${htmlCopy('Conditions')} (${p.conditions.length+(p.hp===0&&!p.dead&&!p.conditions.includes('Unconscious')?1:0)})</summary>
        <p class="play-note">${htmlCopy('Toggle manual conditions as your DM applies or removes them. Tracked sources remain separate. Exhaustion is tracked above. Incapacitating conditions end Concentration and disable actions; other effects are resolved at the table.')}</p>
        <div class="play-condition-grid" role="group" aria-label="${htmlCopy('Character conditions')}">${conditionsList}</div>${conditionSourcesHTML(p)}
        <p class="play-note"><a href="${source.url}" target="_blank" rel="noopener">${htmlCopy('SRD 5.2.1 condition rules')} ↗</a></p>
      </details>
      ${link(17,copy("Damage and death saves"))}</section>`;
    const c=p.combat;
    const marker=(key,label)=>`<button type="button" class="play-combat-marker ${c[key]?'is-used':''}"
      data-play-action="combat-use" data-usage="${key}" aria-pressed="${c[key]}"
      aria-label="${htmlCopy(c[key]?'Mark {label} available':'Mark {label} used',{label})}"
      ${((key!=='reactionUsed')&&!c.turnActive)||(!c[key]&&!upright)||(p.shieldEffect&&key==='reactionUsed')||(p.dodge&&(key==='actionUsed'&&p.dodge.action||key==='bonusUsed'&&p.dodge.patient))?'disabled':''}>${htmlCopy(label)}: ${htmlCopy(c[key]?'Used':'Available')}</button>`;
    const combatCard=`<section class="card play-combat" aria-label="${htmlCopy('Personal combat tracker')}">
      <h2>${htmlCopy('Personal combat tracker')}</h2>
      ${!c.active?`<form data-play-form="combat-start" class="enc-inline"><label>${htmlCopy('Initiative total')}
        <input name="initiative" type="number" min="-100" max="200" value="${s.initiative-2*p.exhaustion}" required></label>
        ${d.className==='Barbarian'&&d.level>=15&&p.counters['persistent-rage']===0&&p.counters.rage>0?`<label class="enc-checkbox"><input type="checkbox" name="persistent-rage"> ${htmlCopy('Restore all Rage uses with Persistent Rage (once per Long Rest)')}</label>`:''}
        ${d.className==='Monk'&&d.level>=2&&p.counters.metabolism===0?`<label class="enc-checkbox"><input type="checkbox" name="metabolism"> ${htmlCopy('Use Uncanny Metabolism on Initiative')}</label>
        <label>${htmlCopy('Martial Arts die result (manual Initiative)')}<input name="metabolism-roll" type="number" min="1" max="${profile.martialDie}" placeholder="d${profile.martialDie}"></label>`:''}
        <button type="submit">${htmlCopy('Start encounter')}</button>
        <button type="button" data-play-action="initiative-roll">${htmlCopy('Roll initiative and start')}</button></form>`:
      `<p><strong>${htmlCopy('Initiative')}: ${c.initiative}</strong> · ${c.turns?htmlCopy('Your turn {number}',{number:c.turns}):htmlCopy('Your first turn has not started')}
        · ${htmlCopy(c.turnActive?'Your turn is active':'Outside your turn')}</p>
        <div class="play-combat-markers" role="group" aria-label="${htmlCopy('Action usage markers')}">
          ${marker('actionUsed','Action')}${marker('bonusUsed','Bonus Action')}${marker('reactionUsed','Reaction')}
        </div><div class="toolbar">
          <button type="button" data-play-action="combat-turn" data-stage="start" ${c.turnActive||pendingOwnEndSaves(p).length?'disabled':''}>${htmlCopy('Start my turn')}</button>
          <button type="button" data-play-action="combat-turn" data-stage="end" ${!c.turnActive?'disabled':''}>${htmlCopy('End my turn')}</button>
          <button type="button" data-play-action="combat-end" ${!p.dead&&(c.turnActive&&hasOwnEndEffects(p)||boundaryEffects(p).length||p.dodge||p.shieldEffect)?'disabled':''}>${htmlCopy('End encounter')}</button>
        </div>`}
      ${c.active?`<div class="play-class-feature"><h3>${htmlCopy('Dodge')}</h3>${dodgeActive(profile,p)?`<p role="status">${htmlCopy('Dodge active: Advantage on Dexterity saves. Attacks against you have Disadvantage if you can see the attacker. Ends at start of your next turn or earlier if Incapacitated or Speed 0.')}</p><button type="button" data-play-action="dodge-end">${htmlCopy('Confirm Dodge ended (Speed 0 or other table event)')}</button>`:`<label class="enc-checkbox"><input type="checkbox" data-dodge-confirm> ${htmlCopy('Confirm Speed is above 0 and take Dodge.')}</label><button type="button" data-play-action="dodge-action" ${!upright||!c.turnActive||c.actionUsed||!dodgeAvailable(profile,p)?'disabled':''}>${htmlCopy('Take Dodge Action')}</button>`}</div>`:''}
      ${c.active&&p.shieldEffect?`<button type="button" data-play-action="shield-end">${htmlCopy('Confirm Shield ended')}</button>`:c.active&&upright&&!c.reactionUsed&&shieldSlots(profile).some(slot=>p.slots[slot.level]<slot.count)?`<form data-play-form="shield-cast" class="enc-inline"><h3>${htmlCopy('Cast Shield')}</h3>
        <label>${htmlCopy('Trigger')}<select name="trigger"><option value="attack">${htmlCopy('Hit by attack roll')}</option><option value="missile">Magic Missile</option></select></label>
        <label>${htmlCopy('Spell slot')}<select name="level">${shieldSlots(profile).filter(slot=>p.slots[slot.level]<slot.count).map(slot=>`<option value="${slot.level}">${slot.level}</option>`).join('')}</select></label>
        <label>${htmlCopy('Attack total (optional, attack only)')}<input type="number" name="total" min="-100" max="200"></label>
        <label class="enc-checkbox"><input type="checkbox" name="automaticHit"> ${htmlCopy('Automatic hit (e.g. natural 20)')}</label>
        <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('Confirm trigger, components, actual live AC and slot-per-turn limit with DM; resolve damage at table.')}</label>
        <button type="submit">${htmlCopy('Cast Shield')}</button></form>`:''}
      ${boundaryEffects(p).length&&!p.dead?`<p role="status" class="play-note">${htmlCopy('Finish the timed effect or confirm its removal with the DM before ending the encounter.')}</p>`:''}
      ${pendingOwnEndSaves(p).length?`<p role="status" class="play-note">${htmlCopy('Resolve pending end-of-turn condition saves before starting another turn.')}</p>`:''}
      <p class="play-note">${htmlCopy('Personal turns are not encounter rounds. Starting your next turn refreshes these markers, including Reaction. Markers are reminders, not automatic enforcement of features or DM rulings.')}</p>
      ${(d.className==='Rogue'||profile.rogueLevel>=1)&&c.active&&!c.turnActive?`<button type="button" data-play-action="combat-window">${htmlCopy('DM confirms next creature turn (reset Sneak Attack)')}</button>`:''}
      ${(d.className==='Rogue'||profile.rogueLevel>=1)&&c.active?`<p class="play-note">${htmlCopy(c.sneakUsed?'Sneak Attack used in current turn':'Sneak Attack available in current turn')}</p>`:''}
      ${d.className==='Rogue'&&d.level>=17&&c.active&&c.turns<=1?`<p class="play-note">${htmlCopy('Thief’s Reflexes: in round one, the DM may grant a second turn at Initiative minus 10. Start the additional personal turn manually; this tracker does not control encounter rounds.')}</p>`:''}
      ${(d.className==='Rogue'&&d.level>=2||profile.rogueLevel>=2)?`<div class="play-class-feature"><h3>${htmlCopy('Cunning Action')}</h3>
        <p class="play-note">${htmlCopy('As a Bonus Action, take Dash, Disengage, or Hide. A successful Hide still requires the normal rules and table conditions.')}</p>
        <div class="toolbar">${['dash','disengage','hide'].map(option=>`<button type="button" data-play-action="rogue-cunning-action" data-option="${option}" ${!upright||c.active&&(!c.turnActive||c.bonusUsed)?'disabled':''}>${htmlCopy('Cunning Action')}: ${esc(option[0].toUpperCase()+option.slice(1))}</button>`).join('')}</div>
      </div>`:''}
      ${(d.className==='Rogue'&&d.level>=3||profile.rogueLevel>=3)?`<div class="play-class-feature"><h3>${htmlCopy('Steady Aim')}</h3>
        <p class="play-note">${htmlCopy('If you have not moved this turn, spend your Bonus Action for Advantage on your next attack roll this turn. Speed becomes 0 until this turn ends; this is not an extra attack.')}</p>
        ${c.aimLocked?`<p class="play-note" role="status">${htmlCopy(c.aimPending?'Steady Aim: Advantage pending; Speed 0 until end of turn.':'Steady Aim used: Speed remains 0 until end of turn.')}</p>`:
          `<label class="enc-checkbox"><input type="checkbox" data-rogue-no-move> ${htmlCopy('I confirm I have not moved during this turn.')}</label>
           <button type="button" data-play-action="rogue-steady-aim" ${!upright||!c.active||!c.turnActive||c.bonusUsed?'disabled':''}>${htmlCopy('Use Steady Aim (Bonus Action)')}</button>`}
      </div>`:''}
      ${profile.rogueSubclass==='Thief'?`<div class="play-class-feature"><h3>${htmlCopy('Thief: Fast Hands & Second-Story Work')}</h3>
        <p class="play-note">${htmlCopy('Climb Speed equals walking Speed. You can use Dexterity instead of Strength for jump distance. The GM resolves terrain and checks.')}</p>
        <form data-play-form="rogue-fast-hands" class="enc-inline">
        <label>${htmlCopy('Fast Hands option')}<select name="option" required>
          <option value="sleight">${htmlCopy('Sleight of Hand: pick lock / disarm trap / pick pocket')}</option>
          <option value="utilize">${htmlCopy('Utilize action')}</option>
          <option value="magic-item">${htmlCopy('Magic action: qualifying magic item')}</option></select></label>
        <label class="enc-checkbox"><input type="checkbox" name="magicItemEligible"> ${htmlCopy('Magic item normally requires the Magic action (if selected)')}</label>
        <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('GM confirmed action eligibility; resolve effects manually.')}</label>
        <button type="submit" ${!upright||c.active&&(!c.turnActive||c.bonusUsed)?'disabled':''}>${htmlCopy('Use Fast Hands (Bonus Action)')}</button></form></div>`:''}
      ${link(13,copy('Initiative and combat turns'))}</section>`;
    const barbarianActions=d.className==='Barbarian'&&d.level>=14?`<div class="play-class-feature"><h3>${htmlCopy('Intimidating Presence')}</h3>
      <p class="play-note">${htmlCopy('Bonus Action: creatures you choose in a 30-foot Emanation make a Wisdom save. The DM resolves Frightened and repeat saves.')}</p>
      <p class="play-note">${htmlCopy('Wisdom save DC')}: ${8+s.proficiency+s.mods[0]}</p>
      <button type="button" data-play-action="intimidating-presence" ${!upright||p.counters['intimidating-presence']!==0||c.active&&(!c.turnActive||c.bonusUsed)?'disabled':''}>${htmlCopy('Use Intimidating Presence')}</button>
      <button type="button" data-play-action="intimidating-presence-recharge" ${!live||p.counters['intimidating-presence']!==1||p.counters.rage>=profile.resources.find(x=>x.id==='rage').max?'disabled':''}>${htmlCopy('Spend Rage use to recharge')}</button>
      ${d.level>=15?`<p class="play-note">${htmlCopy('Persistent Rage can restore spent Rage when Initiative is rolled, once per Long Rest. Select it when starting an encounter.')}</p>`:''}
      ${d.level>=18?`<p class="play-note">${htmlCopy('Indomitable Might: Strength check or save total cannot be lower than your Strength score')} ${s.scores[0]}.</p>`:''}
      </div>`:'';
    const monkHigh=d.className==='Monk'&&d.level>=14?`<div class="play-class-feature">
      <h3>${htmlCopy('Disciplined Survivor')}</h3>
      <p class="play-note">${htmlCopy('You are proficient in all saving throws. After a failed save, spend 1 Focus Point to reroll. You must use the new roll.')}</p>
      <button type="button" data-play-action="monk-save-reroll" ${!live||p.counters['focus-points']>=d.level?'disabled':''}>${htmlCopy('Roll a failed saving throw again (1 Focus)')}</button>
      ${d.level>=15?`<p class="play-note">${htmlCopy('Perfect Focus: when rolling Initiative without Uncanny Metabolism, restore Focus until 4 points remain if you have 3 or fewer.')}</p>`:''}
      ${d.level>=17?`<p class="play-note">${htmlCopy('Quivering Palm (Open Hand): after an Unarmed Strike hit, expend 4 Focus Points. Track one target and duration with your DM.')}</p>
      ${p.quivering.active?`<p class="play-note">${htmlCopy('Quivering Palm active target')}: ${esc(p.quivering.target)}</p>
        <button type="button" data-play-action="monk-quivering-resolve" ${!upright||c.active&&!c.turnActive?'disabled':''}>${htmlCopy('Resolve Quivering Palm (Action, roll 10d12)')}</button>
        <button type="button" data-play-action="monk-quivering-dismiss">${htmlCopy('End Quivering Palm harmlessly')}</button>`:
        `<form data-play-form="monk-quivering-start" class="enc-inline">
          <label>${htmlCopy('Confirmed Unarmed Strike target')}<input name="target" maxlength="60" required></label>
          <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('Unarmed Strike hit confirmed')}</label>
          <button type="submit" ${!upright||d.level-p.counters['focus-points']<4?'disabled':''}>${htmlCopy('Apply Quivering Palm (4 Focus)')}</button></form>`}`:''}
      ${d.level>=18?`<p class="play-note">${htmlCopy('Superior Defense: at the start of your turn, spend 3 Focus Points for resistance to all damage except Force for up to 1 minute. Track duration with your DM.')}</p>`:''}
    </div>`:'';
    const rogueLuck=d.className==='Rogue'&&d.level>=20?`<div class="play-class-feature">
      <h3>${htmlCopy('Stroke of Luck')}</h3><p class="play-note">${htmlCopy('After failing a D20 Test, turn its roll into 20. Once per Short or Long Rest; adjudicate the result with your DM.')}</p>
      <button type="button" data-play-action="stroke-of-luck" ${!live||p.counters['stroke-of-luck']!==0?'disabled':''}>${htmlCopy('Confirm failed D20 Test and use Stroke of Luck')}</button>
    </div>`:'';
    const recovery=profile.slotRecovery;
    const recoverable=profile.slots.filter(({level})=>level<6&&p.slots[level]>0);
    const showRecovery=upright&&recovery&&p.counters[recovery.id]===0&&recoverable.length;
    const sorcerous=upright&&p.counters['sorcerous-restoration']===0&&p.counters.sorcery>0;
    const restCard=`<section class="card play-rest"><h2>${htmlCopy("Rests & Hit Dice")}</h2><p>${profile.hitDicePools?profile.hitDicePools.map(row=>row.count-(p.hitDiceSpent?.[row.die]??0)+' of '+row.count+' d'+row.die+' available').join(' · '):profile.dice-p.dice+' of '+profile.dice+' d'+profile.die+' available'} · CON ${signed(profile.con)}</p>
      ${upright?`<form data-play-form="hit-die" class="enc-inline">${profile.hitDicePools?`<label>${htmlCopy("Class Hit Die")}<select name="die">${profile.hitDicePools.map(row=>`<option value="${row.die}" ${(p.hitDiceSpent?.[row.die]??0)>=row.count?'disabled':''}>${esc(row.className)} · d${row.die}</option>`).join('')}</select></label>`:''}<label>${htmlCopy("Hit Die result")}<input name="value" type="number" min="1" max="${profile.die}" required></label>
      <button type="submit" ${p.dice>=profile.dice?'disabled':''}>${htmlCopy("Spend Hit Die")}</button><button type="button" data-play-action="hit-die-roll" ${p.dice>=profile.dice?'disabled':''}>Roll ${profile.hitDicePools?'next available class die':'d'+profile.die} &amp; spend</button></form>
      <p class="play-note">${htmlCopy("Spend Hit Dice one at a time during a Short Rest.")}</p>
      <form data-play-form="short-rest">
        ${showRecovery?`<fieldset class="play-recovery"><legend>${recovery.name} (optional)</legend><p>Recover up to ${Math.ceil(d.level/2)} combined levels of expended spell slots.</p>
          <div class="fields">${recoverable.map(({level})=>`<label>${htmlCopy("Level")} ${level} slots to recover<input type="number" name="recover-${level}" min="0" max="${p.slots[level]}" value="0"></label>`).join('')}</div></fieldset>`:''}
        ${sorcerous?("<label class=\"enc-checkbox play-note\"><input type=\"checkbox\" name=\"sorcerous\"> "+htmlCopy("Use Sorcerous Restoration")+"</label>"):''}
        <div class="toolbar"><button type="submit">${htmlCopy("Finish Short Rest")}</button><button type="button" data-play-action="long-rest" class="primary">${htmlCopy("Finish Long Rest")}</button></div>
      </form>`:("<p>"+htmlCopy("Resting requires at least 1 HP.")+"</p>")}
      ${link(185,'Long Rest')} ${link(187,'Short Rest')}</section>`;
    const counterActions=(type,id,title,left,max)=>{
      const attr=`data-pool="${esc(id)}" data-kind="${type}"`;
      return `<div class="play-counter-actions">
        <button type="button" data-play-action="counter" ${attr} data-delta="1" aria-label="${htmlCopy('Spend {resource}',{resource:title})}" ${!upright||!left?'disabled':''}>${htmlCopy("Spend")}</button>
        <button type="button" data-play-action="counter" ${attr} data-delta="-1" aria-label="${htmlCopy('Restore {resource}',{resource:title})}" ${!live||left===max?'disabled':''}>${htmlCopy("Restore")}</button></div>`;
    };
    const attackActions=(attack,index)=>upright?`<form class="enc-inline play-attack-assist" data-play-form="attack-assist">
      <input type="hidden" name="index" value="${index}">
      <label>${htmlCopy('Target AC (optional)')}<input name="ac" type="number" min="1" max="99" placeholder="AC"></label>
      <label class="enc-checkbox"><input name="advantage" type="checkbox" ${c.aimPending?'checked disabled':''}> ${htmlCopy('Advantage')}${c.aimPending?' · Steady Aim':''}</label>
      <label class="enc-checkbox"><input name="disadvantage" type="checkbox"> ${htmlCopy('Disadvantage')}</label>
      <label class="enc-checkbox"><input name="confirmed" type="checkbox"> ${htmlCopy('DM confirmed hit (if AC unknown)')}</label>
      ${d.className==='Ranger'?`<label class="enc-checkbox"><input name="markedTarget" type="checkbox" ${isHuntersMark(p.focus)?'':'disabled'}> ${htmlCopy('This target is affected by my active Hunter’s Mark (bonus damage; level 17 Advantage)')}</label>`:''}
      ${(d.className==='Rogue'||profile.rogueLevel)?`<div class="play-rogue-attack"><label class="enc-checkbox"><input name="sneak" type="checkbox"> ${htmlCopy('Apply Sneak Attack (once per turn)')}</label>
        <label class="enc-checkbox"><input name="ally" type="checkbox"> ${htmlCopy('Eligible ally within 5 feet of target, not Incapacitated')}</label>
        ${d.level>=5?`<label>${htmlCopy('Cunning Strike effect and Sneak Attack dice cost')}<select name="cunning"><option value="none">${htmlCopy('None')}</option>
          <option value="poison">${htmlCopy('Poison · 1d6')}</option><option value="trip">${htmlCopy('Trip · 1d6')}</option><option value="withdraw">${htmlCopy('Withdraw · 1d6')}</option>
          ${d.level>=14?`<option value="daze">${htmlCopy('Daze · 2d6')}</option><option value="knockout">${htmlCopy('Knock Out · 6d6')}</option><option value="obscure">${htmlCopy('Obscure · 3d6')}</option>`:''}</select></label>
          ${d.level>=11?`<label>${htmlCopy('Second Cunning Strike effect (optional)')}<select name="cunningExtra"><option value="none">${htmlCopy('None')}</option>
          <option value="poison">${htmlCopy('Poison · 1d6')}</option><option value="trip">${htmlCopy('Trip · 1d6')}</option><option value="withdraw">${htmlCopy('Withdraw · 1d6')}</option>
          ${d.level>=14?`<option value="daze">${htmlCopy('Daze · 2d6')}</option><option value="knockout">${htmlCopy('Knock Out · 6d6')}</option><option value="obscure">${htmlCopy('Obscure · 3d6')}</option>`:''}</select></label>`:''}
          <label class="enc-checkbox"><input name="poisonKit" type="checkbox"> ${htmlCopy('Poisoner’s Kit on my person')}</label>
          <label class="enc-checkbox"><input name="targetLargeOrSmaller" type="checkbox"> ${htmlCopy('Target is Large or smaller (Trip)')}</label>`:''}</div>`:''}
      <button type="submit">${htmlCopy('Roll and record attack')}</button>
    </form>`:'';
    const entities=sheetEntities(d,s,{attackActions,spent:p.slots,slotActions:(level,max)=>counterActions('slot',level,
      copy('Level {level} slot',{level}),max-p.slots[level],max)});

    const secondWind=d.className==='Fighter'&&p.counters['second-wind']<profile.resources.find(pool=>pool.id==='second-wind').max
      ?`<form class="enc-inline" data-play-form="second-wind"><label>${htmlCopy('Second Wind d10 result')}<input name="value" type="number" min="1" max="10" required></label>
        <button type="submit" ${!upright||c.active&&(!c.turnActive||c.bonusUsed)?'disabled':''}>${htmlCopy('Use Second Wind')}</button>
        <button type="button" data-play-action="second-wind-roll" ${!upright||c.active&&(!c.turnActive||c.bonusUsed)?'disabled':''}>${htmlCopy('Roll d10 and use Second Wind')}</button></form>
        ${d.level>=5?`<p class="play-note">${htmlCopy('Tactical Shift: when you use Second Wind as a Bonus Action, movement is resolved at the table.')}</p>`:''}`:'';
    const bonusReady=upright&&(!c.active||(c.turnActive&&!c.bonusUsed));
    const paladinPool=profile.pools.find(pool=>pool.id==='lay-on-hands');
    const paladinRemaining=paladinPool?paladinPool.max-p.counters[paladinPool.id]:0;
    const paladinActions=paladinPool?`<div class="play-class-feature"><h3>${htmlCopy('Lay On Hands')}</h3>
      <p class="play-note">${htmlCopy('Healing pool: {remaining} of {max} HP remaining',{remaining:paladinRemaining,max:paladinPool.max})}</p>
      <form class="enc-inline" data-play-form="lay-on-hands"><label>${htmlCopy('Spend healing points')}
        <input name="points" type="number" min="1" max="${paladinRemaining}" value="${Math.min(paladinRemaining,5)}" required></label>
        <label>${htmlCopy('Recipient')}<select name="target"><option value="self">${htmlCopy('My character')}</option>
          <option value="other">${htmlCopy('Another creature')}</option></select></label>
        <button type="submit" ${!bonusReady||paladinRemaining<1?'disabled':''}>${htmlCopy('Use Lay On Hands')}</button></form>
      <div class="toolbar"><button type="button" data-play-action="lay-on-hands-poison" data-target="self"
        ${!bonusReady||paladinRemaining<5||!p.conditions.includes('Poisoned')?'disabled':''}>${htmlCopy('Remove my Poisoned (5 points)')}</button>
        <button type="button" data-play-action="lay-on-hands-poison" data-target="other"
        ${!bonusReady||paladinRemaining<5?'disabled':''}>${htmlCopy('Remove another creature’s Poisoned (5 points)')}</button></div>
      <p class="play-note">${htmlCopy('Healing another creature updates this pool only. Apply its HP or condition on that creature’s sheet; this does not invent another creature’s stats.')}</p></div>`:'';
    const paladinRestoring=d.className==='Paladin'&&d.level>=14?`<div class="play-class-feature"><h3>${htmlCopy('Restoring Touch')}</h3>
      <p class="play-note">${htmlCopy('Spend 5 Lay On Hands points per condition removed. A Bonus Action is required; an ally’s condition is confirmed at the table.')}</p>
      <form data-play-form="restoring-touch" class="enc-inline">
        <label>${htmlCopy('Recipient')}<select name="target"><option value="self">${htmlCopy('My character')}</option><option value="other">${htmlCopy('Another creature')}</option></select></label>
        ${restoringTouchConditions.map(name=>`<label class="enc-checkbox"><input type="checkbox" name="condition" value="${name}"> ${esc(name)}</label>`).join('')}
        <button type="submit" ${!bonusReady||paladinRemaining<5?'disabled':''}>${htmlCopy('Remove selected conditions')}</button></form></div>`:'';
    const paladinNimbus=d.className==='Paladin'&&d.level>=20?`<div class="play-class-feature"><h3>${htmlCopy('Holy Nimbus')}</h3>
      <p class="play-note">${htmlCopy('30-foot aura, sunlight, and radiant damage when an enemy starts its turn inside. DM tracks ten-minute duration and targets.')}
      ${htmlCopy('Radiant damage')}: ${Math.max(0,s.mods[5]+s.proficiency)}.</p>
      <p class="play-note">${p.nimbus.active?htmlCopy('Holy Nimbus active; aura inactive while Incapacitated.'):htmlCopy('Holy Nimbus inactive.')}
      ${p.counters['holy-nimbus']===0?htmlCopy('Ready to activate.'):htmlCopy('Used since last Long Rest.')}</p>
      ${p.nimbus.active?`<button type="button" data-play-action="holy-nimbus-end">${htmlCopy('End Holy Nimbus')}</button>`:
        `<button type="button" data-play-action="holy-nimbus-start" ${!bonusReady||p.counters['holy-nimbus']!==0?'disabled':''}>${htmlCopy('Activate Holy Nimbus (Bonus Action)')}</button>`}
      <button type="button" data-play-action="holy-nimbus-recharge" ${!upright||p.counters['holy-nimbus']===0||!profile.slots.some(slot=>slot.level===5&&p.slots[5]<slot.count)?'disabled':''}>${htmlCopy('Recharge with a level 5 spell slot')}</button></div>`:'';
    const freeSmite=d.className==='Paladin'&&d.level>=2&&p.counters['smite-free']===0;
    const paladinSmite=d.className==='Paladin'&&d.level>=2?`<div class="play-class-feature"><h3>${htmlCopy('Divine Smite')}</h3>
      <p class="play-note">${htmlCopy('Confirm a melee weapon or Unarmed Strike hit first. Divine Smite uses a Bonus Action immediately after the hit. Target damage is recorded at the table.')}</p>
      <form class="enc-inline" data-play-form="divine-smite">
        <label class="enc-checkbox"><input name="confirmed" type="checkbox" required> ${htmlCopy('Confirmed melee or Unarmed Strike hit')}</label>
        <label class="enc-checkbox"><input name="free" type="checkbox" ${freeSmite?'':'disabled'}> ${htmlCopy('Use free level 1 casting (once per Long Rest)')}${freeSmite?'':htmlCopy(' · Already used')}</label>
        <label>${htmlCopy('Spell slot level')}<select name="level">
          ${profile.slots.map(slot=>`<option value="${slot.level}" ${p.slots[slot.level]>=slot.count?'disabled':''}>${htmlCopy('Level')} ${slot.level} (${slot.count-p.slots[slot.level]} ${htmlCopy('available')})</option>`).join('')}</select></label>
        <label class="enc-checkbox"><input type="checkbox" name="fiend"> ${htmlCopy('Target is a Fiend or Undead')}</label>
        <label>${htmlCopy('Radiant damage total (blank to roll d8s)')}<input type="number" name="damage" min="1" max="80" placeholder="${htmlCopy('Roll automatically')}"></label>
        <button type="submit" ${!bonusReady||(!freeSmite&&!profile.slots.some(slot=>p.slots[slot.level]<slot.count))?'disabled':''}>${htmlCopy('Cast Divine Smite')}</button>
      </form></div>`:'';
    const wildPool=profile.pools.find(pool=>pool.id==='wild-shape');
    const wildRemaining=wildPool?wildPool.max-p.counters[wildPool.id]:0;
    const druidActions=wildPool?`<div class="play-class-feature"><h3>${htmlCopy('Wild Shape')}</h3>
      <p class="play-note">${htmlCopy('Wild Shape uses remaining: {remaining} of {max}',{remaining:wildRemaining,max:wildPool.max})}
        · ${p.shape.active?htmlCopy('Current Beast form: {name}',{name:p.shape.form}):htmlCopy('No Beast form active')}</p>
      <form class="enc-inline" data-play-form="wild-shape"><label>${htmlCopy('Known Beast form (DM approved)')}
        <input name="form" type="text" maxlength="60" list="play-wild-shape-known" placeholder="${htmlCopy('Beast form')}" required></label>
        <datalist id="play-wild-shape-known">${(Array.isArray(d.wildShapes)?d.wildShapes:[]).filter(name=>typeof name==='string').map(name=>`<option value="${esc(name)}"></option>`).join('')}</datalist>
        <button type="submit" ${!bonusReady||wildRemaining===0?'disabled':''}>${htmlCopy('Use Wild Shape')}</button></form>
      ${p.shape.active?(()=>{const ref=beastQuickReference(p.shape.form,d.level);
        const beast=beastCombatProfile(p.shape.form,d.level);
        return ref?`<div class="play-beast-combat"><p class="play-note">${htmlCopy('Beast reference')}: ${esc(ref.name)} · CR ${esc(ref.cr)} · AC ${ref.ac} · ${ref.hp} HP · <a href="${source.url}#page=${ref.page}" target="_blank" rel="noopener">${htmlCopy('SRD page {page}',{page:ref.page})}</a>${!ref.eligible?` · <strong>${htmlCopy('Review Beast eligibility with your DM')}</strong>`:''}</p>
          ${beast?`<p class="play-note"><strong>${htmlCopy('Verified Beast combat reference')}</strong> · ${esc(beast.size)} · ${Object.entries(beast.speed).map(([kind,feet])=>esc(kind)+' '+distance(feet)).join(' · ')}</p>
            ${beast.traits.map(trait=>`<p class="play-note">${esc(trait)}</p>`).join('')}
            ${beast.attacks.map(attack=>`<form class="enc-inline" data-play-form="beast-attack-assist">
              <input type="hidden" name="attack" value="${esc(attack.name)}">
              <strong>${esc(attack.name)} ${attack.bonus>=0?'+':''}${attack.bonus}</strong>
              <span>${attack.components.map(component=>esc(component.dice+(component.mod?'+'+component.mod:'')+' '+component.type)).join(' + ')}</span>
              <label>${htmlCopy('Target AC (optional)')}<input name="ac" type="number" min="1" max="99" placeholder="AC"></label>
              <label class="enc-checkbox"><input name="advantage" type="checkbox" ${c.aimPending?'checked disabled':''}> ${htmlCopy('Advantage')}${c.aimPending?' · Steady Aim':''}</label>
              <label class="enc-checkbox"><input name="disadvantage" type="checkbox"> ${htmlCopy('Disadvantage')}</label>
              <label class="enc-checkbox"><input name="confirmed" type="checkbox"> ${htmlCopy('DM confirmed hit (if AC unknown)')}</label>
              <button type="submit" ${!upright?'disabled':''}>${htmlCopy('Roll Beast attack')}</button>
              ${attack.notes?`<small>${esc(attack.notes)}</small>`:''}
            </form>`).join('')}
            <p class="play-note">${htmlCopy('Beast form AC and movement are reference values. Your base character sheet stays unchanged. The DM resolves special effects, target HP and Action usage.')}</p>`:
            `<p class="play-note">${htmlCopy('No automated attack profile for this form; use the linked SRD stat block and ask your DM.')}</p>`}</div>`:
          `<p class="play-note">${htmlCopy('Beast statistics must be confirmed by your DM.')}</p>`;})():''}
      <p class="play-note">${htmlCopy('Wild Shape form limits')}: CR ≤ ${beastFormLimit(d.level)?.cr??0}; ${d.level>=8?htmlCopy('Fly Speed allowed'):htmlCopy('No Fly Speed yet')}.</p>
      <button type="button" data-play-action="wild-shape-end" ${!bonusReady||!p.shape.active?'disabled':''}>${htmlCopy('Leave Wild Shape')}</button>
      <p class="play-note">${htmlCopy('Wild Shape grants temporary HP equal to Druid level (temporary HP do not stack). Beast statistics, permitted forms, duration and spellcasting are resolved with the DM.')}</p></div>`:'';
    const canRestoreShape=d.className==='Druid'&&d.level>=5&&wildPool&&wildRemaining===0&&
      (!c.active||(c.turnActive&&p.resurgence.lastTurn!==c.turns));
    const expendedSlots=profile.slots.filter(slot=>p.slots[slot.level]<slot.count);
    const canRestoreFirstSlot=d.className==='Druid'&&d.level>=5&&wildRemaining>0&&p.slots[1]>0&&p.counters['resurgence-slot']===0;
    const druidResurgence=d.className==='Druid'&&d.level>=5?`<div class="play-class-feature"><h3>${htmlCopy('Wild Resurgence')}</h3>
      <p class="play-note">${htmlCopy('No action required. Spend a spell slot to regain Wild Shape only when no uses remain, once on each of your turns. You can also spend Wild Shape for a level 1 spell slot once per Long Rest.')}</p>
      <form data-play-form="wild-resurgence" class="enc-inline"><label>${htmlCopy('Spell slot to expend')}
        <select name="level">${expendedSlots.map(slot=>`<option value="${slot.level}">${htmlCopy('Level')} ${slot.level}</option>`).join('')}</select></label>
        <button type="submit" ${!upright||!canRestoreShape||!expendedSlots.length?'disabled':''}>${htmlCopy('Regain 1 Wild Shape use')}</button></form>
      <button type="button" data-play-action="wild-resurgence-slot" ${!upright||!canRestoreFirstSlot?'disabled':''}>${htmlCopy('Spend Wild Shape to regain level 1 slot')}</button>
      <p class="play-note">${htmlCopy('Out of combat, confirm turn timing with the DM. The once-per-turn limitation is tracked during an active encounter.')}</p></div>`:'';
    const monkRemaining=d.className==='Monk'&&d.level>=2?d.level-p.counters['focus-points']:0;
    const monkButton=(technique,empowered,label)=>`<button type="button" data-play-action="monk-technique"
      data-technique="${technique}" data-empowered="${empowered}" ${!bonusReady||(empowered&&monkRemaining===0)?'disabled':''}>${htmlCopy(label)}</button>`;
    const monkActions=d.className==='Monk'&&d.level>=2?`<div class="play-class-feature"><h3>${htmlCopy('Monk Focus techniques')}</h3>
      <p class="play-note">${htmlCopy('Focus Points remaining: {remaining} of {max}',{remaining:monkRemaining,max:d.level})}</p>
      <div class="play-feature-actions">${monkButton('flurry',true,d.level>=10?'Flurry of Blows · 3 strikes (1 Focus)':'Flurry of Blows · 2 strikes (1 Focus)')}
        ${monkButton('patient',false,'Patient Defense · Disengage (free)')}
        ${d.level<10?monkButton('patient',true,'Patient Defense · Disengage + Dodge (1 Focus)'):
          `<form data-play-form="monk-patient" class="enc-inline"><label>${htmlCopy('Two Martial Arts dice total (temporary HP)')}
            <input type="number" name="value" min="2" max="${2*profile.martialDie}" required></label>
            <button type="submit" ${!bonusReady||monkRemaining===0?'disabled':''}>${htmlCopy('Enhanced Patient Defense (1 Focus)')}</button>
            <button type="button" data-play-action="monk-patient-roll" ${!bonusReady||monkRemaining===0?'disabled':''}>${htmlCopy('Roll 2 dice and use')}</button></form>`}
        ${monkButton('step',false,'Step of the Wind · Dash (free)')}
        ${monkButton('step',true,'Step of the Wind · Dash + Disengage (1 Focus)')}
      </div><p class="play-note">${htmlCopy('Techniques spend your Bonus Action. Empowered Patient Defense tracks Dodge during personal combat; confirm movement and other effects at the table.')}</p></div>`:'';
    const rangerHigh=d.className==='Ranger'&&d.level>=13?`<div class="play-class-feature"><h3>${htmlCopy('Hunter Ranger: high-level features')}</h3>
      <p class="play-note">${htmlCopy('Relentless Hunter: damage cannot break Concentration on Hunter’s Mark, but Incapacitation still can.')}</p>
      ${d.level>=14?`<p class="play-note">${htmlCopy('Nature’s Veil: Bonus Action to become Invisible until the end of your next turn. Tracked automatically during personal combat; otherwise the DM tracks duration.')}</p>
        <button type="button" data-play-action="natures-veil" ${!bonusReady||p.counters['natures-veil']>=profile.resources.find(pool=>pool.id==='natures-veil').max?'disabled':''}>${htmlCopy('Use Nature’s Veil')} (${profile.resources.find(pool=>pool.id==='natures-veil').max-p.counters['natures-veil']} ${htmlCopy('remaining')})</button>`:''}
      ${d.level>=15?`<p class="play-note">${htmlCopy('Superior Hunter’s Defense: Reaction to gain Resistance to incoming damage and that damage type until this turn ends. Record this hit only once.')}</p>
        <form class="enc-inline" data-play-form="hunter-defense"><label>${htmlCopy('Incoming damage')}<input name="damage" type="number" min="1" max="9999" required></label>
          <label>${htmlCopy('Damage type')}<select name="damageType">${['Acid','Bludgeoning','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'].map(type=>`<option value="${type}">${type}</option>`).join('')}</select></label>
          <label class="enc-checkbox"><input name="confirmed" type="checkbox" required> ${htmlCopy('Confirmed damage and Reaction')}</label>
          <button type="submit" ${!upright||c.active&&c.reactionUsed?'disabled':''}>${htmlCopy('Use Superior Hunter’s Defense')}</button></form>`:''}
      ${d.level>=17?`<p class="play-note">${htmlCopy('Precise Hunter: tick the marked-target box when attacking the creature affected by your active Hunter’s Mark.')}</p>`:''}
      ${d.level>=18?`<p class="play-note">${htmlCopy('Feral Senses: Blindsight 30 feet.')}</p>`:''}
      ${d.level>=20?`<p class="play-note">${htmlCopy('Foe Slayer: Hunter’s Mark adds d10 damage (doubled on a critical hit).')}</p>`:''}
    </div>`:'';
    const rogueDodge=d.className==='Rogue'&&d.level>=5?`<div class="play-class-feature"><h3>${htmlCopy('Uncanny Dodge')}</h3>
      <p class="play-note">${htmlCopy('Use your Reaction when a visible attacker hits you. Do not enter the same damage again using the Damage button.')}</p>
      <form data-play-form="rogue-uncanny-dodge" class="enc-inline">
        <label class="enc-checkbox"><input type="checkbox" name="visible" required> ${htmlCopy('I can see the attacker')}</label>
        <label class="enc-checkbox"><input type="checkbox" name="hit" required> ${htmlCopy('Attack roll confirmed hit')}</label>
        <label>${htmlCopy('Incoming attack damage')}<input name="damage" type="number" min="1" max="9999" required></label>
        <button type="submit" ${!upright||(c.active&&c.reactionUsed)?'disabled':''}>${htmlCopy('Use Uncanny Dodge')}</button>
      </form></div>`:'';
    const monkDeflect=d.className==='Monk'&&d.level>=3?`<div class="play-class-feature"><h3>${htmlCopy('Deflect Attacks')}</h3>
      <p class="play-note">${htmlCopy('Use your Reaction when an attack roll hits. Enter incoming damage only once here, not again with the Damage button. At level 13, Deflect Energy also works on other damage types.')}</p>
      <form class="enc-inline" data-play-form="monk-deflect">
        <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('Confirmed an attack roll hit')}</label>
        <label>${htmlCopy('Incoming attack damage')}<input name="damage" type="number" min="1" max="9999" required></label>
        <label>${htmlCopy('Damage type')}<select name="damage-type"><option value="physical">${htmlCopy('Bludgeoning, Piercing or Slashing')}</option>
          ${d.level>=13?`<option value="other">${htmlCopy('Other damage type (Deflect Energy)')}</option>`:''}</select></label>
        <label>${htmlCopy('Reduction d10 (blank to roll)')}<input name="roll" type="number" min="1" max="10" placeholder="d10"></label>
        <label class="enc-checkbox"><input name="redirect" type="checkbox"> ${htmlCopy('Redirect if all damage is prevented (1 Focus Point)')}</label>
        <label>${htmlCopy('Two Martial Arts dice total (blank to roll)')}<input name="redirect-roll" type="number" min="2" max="${2*profile.martialDie}" placeholder="2d${profile.martialDie}"></label>
        <button type="submit" ${!upright||(c.active&&c.reactionUsed)?'disabled':''}>${htmlCopy('Deflect incoming attack')}</button>
      </form><p class="play-note">${htmlCopy('The target makes a Dexterity save against your Monk Focus DC. The DM applies redirected damage; no target HP is changed here.')}</p></div>`:'';
    const magical=Object.hasOwn(p.counters,'cunning')?`<p class="play-note">Magical Cunning · ${p.counters.cunning===0?'available':'used'}</p>
      <button type="button" data-play-action="magical-cunning" ${!upright||p.counters.cunning||!Object.values(p.slots).some(Boolean)?'disabled':''}>${htmlCopy("Use Magical Cunning after rite")}</button>`:'';
    const recoveryGroup=pool=>pool.short==='all'?'Short Rest':pool.short>0?'Recovers some on a Short Rest':'Long Rest';
    const resourceRows=pools=>pools.map(pool=>{
      const left=pool.max-p.counters[pool.id];
      const recovery=copy(recoveryGroup(pool));
      return {id:pool.id,label:pool.name,icon:'feat',summary:copy('{remaining} of {max} remaining',{remaining:left,max:pool.max}),
        description:recovery,facets:{recovery:[recoveryGroup(pool)]},actions:counterActions('counter',pool.id,pool.name,left,pool.max)};
    });
    const availableSlots=profile.slots.filter(slot=>p.slots[slot.level]<slot.count);
    const font=d.className==='Bard'&&d.level>=5&&upright&&p.counters.bardic&&availableSlots.length
      ?`<form class="enc-inline" data-play-form="font-of-inspiration"><label>${htmlCopy("Spell slot to expend")}<select name="value">
      ${availableSlots.map(slot=>`<option value="${slot.level}">${htmlCopy("Level")} ${slot.level}</option>`).join('')}</select></label><button type="submit">${htmlCopy("Recover Bardic Inspiration")}</button></form>`:'';
    const how=section('how',copy("How to play"),playAdviceHTML(d,s),panels.has('how'));
    const notes=[[copy('Appearance'),d.appearance],...appearanceEntries(d).map(([label,value])=>[copy(label),value]),[copy('Personality'),d.personality],[copy("Backstory"),d.story]].filter(([,text])=>text);
    const identity=notes.length?section('identity',copy("Character details"),notes.map(([title,text])=>'<p><strong>'+title+'</strong> '+esc(text)+'</p>').join(''),panels.has('identity')):'';
    const statsIntro=`<div class="ability-strip">${s.scores.map((value,i)=>stat(abilities[i].slice(0,3).toUpperCase(),value+' ('+signed(s.mods[i])+')')).join('')}</div>
      <p>Initiative ${signed(s.initiative)}${s.initiativeAdvantage?' (advantage)':''} · Speed ${distance(s.speed)}${s.climbSpeed?' · Climb '+distance(s.climbSpeed):''}${s.swimSpeed?' · Swim '+distance(s.swimSpeed):''} · Passive Perception ${s.passive}</p>
      ${s.fighter?`<p>Attack action: ${s.fighter.attacks} ${s.fighter.attacks===1?'attack':'attacks'} · Critical Hit on ${s.fighter.critical===20?'20':s.fighter.critical+'–20'} with weapons and Unarmed Strikes. ${link(48,'Fighter and Champion')}</p>`:''}
      
      <p class="play-note">${htmlCopy('Attack helper: choose target AC, or ask the DM to confirm a hit. Natural 1/20, Advantage and Disadvantage, Exhaustion, and critical damage dice are calculated. Apply target HP, cover and Action usage at the table. Learned Weapon Mastery adds reminders, and Rogues can roll Sneak Attack.')}</p>`;
    const next=(profile.totalLevel??d.level)+1;
    const advanceAvailable=!record.multiclassActive&&levelsFor(d.className).includes(next);
    const planInfo=inspectSavedMulticlassPlan(record);
    const pending=planInfo.plan;
    const planDetails=planInfo.status==='invalid'?`<p class="play-note" role="alert">A stored multiclass planning note has invalid data. It is not being used. Remove it or restore from a verified backup.</p>`:
      pending?`<p class="play-note"><strong>${planInfo.status==='current'?'Saved future-class plan':'Plan needs revalidation'}:</strong>
        ${esc(pending.primaryClass)} ${pending.primaryLevel} → ${esc(pending.nextClass)} 1
        (planned total ${pending.nextTotalLevel}). ${planInfo.status==='review'?'The saved build changed; review scores and save a fresh plan.':'This plan remains inactive.'}</p>`:'';
    const planChoices=multiclassPlanChoices(record);
    const anyEligible=planChoices.some(row=>row.eligible);
    const hasSavedPlan=Object.hasOwn(record,'multiclassPlan');
    const nextClassOptions=planChoices.map(row=>`<option value="${esc(row.className)}" ${!row.eligible?'disabled':''} ${pending?.nextClass===row.className?'selected':''}>${esc(row.className)} · ${esc(row.requirements)}${row.eligible?'':' · Not eligible'}</option>`).join('');
    const planForm=!record.multiclassActive&&d.level<20&&anyEligible?`<form data-play-form="multiclass-plan" class="play-multiclass-plan">
      <label>Plan your next class (does not grant features)<select name="nextClass" required>${nextClassOptions}</select></label>
      <label class="enc-checkbox"><input name="acknowledge" type="checkbox" required> I understand this is a saved planning note, not an active multiclass character.</label>
      <div class="toolbar"><button type="submit">Save next-class plan</button>${hasSavedPlan?`<button type="button" data-play-action="clear-multiclass-plan">Remove plan</button>`:''}</div>
    </form>`:`<p class="play-note">${d.level===20?'Character level 20 is the maximum.':'No eligible additional classes with the current ability scores.'}</p>${hasSavedPlan?`<button type="button" data-play-action="clear-multiclass-plan">Remove old plan</button>`:''}`;
    const planGuidance=`<p class="play-note">The chosen class must meet its SRD prerequisites, as must your current class. The menu labels show required ability scores and disable ineligible choices. Saving a future-class plan does not change level, HP, class features, Spellcasting, inventory, XP, or available actions.</p>`;
    const checkpoint=inspectMulticlassLevelUp(record);
    const savedCheckpoint=Object.hasOwn(record,'multiclassLevelUp');
    const checkpointStatus=checkpoint.status==='invalid'?'<p class="play-note" role="alert">Saved level-up checkpoint is malformed and will not be used. Remove it or restore from a verified backup.</p>':
      checkpoint.checkpoint?`<p class="play-note"><strong>Multiclass checkpoint ${checkpoint.status==='current'?'ready for review':'needs revalidation'}:</strong>
        ${esc(checkpoint.checkpoint.primaryClass)} ${checkpoint.checkpoint.primaryLevel} → ${esc(checkpoint.checkpoint.nextClass)} 1.
        Added HP <strong>+${checkpoint.checkpoint.hpGain}</strong> (projected max ${checkpoint.checkpoint.nextMaxHP}), +1 d${checkpoint.checkpoint.classHitDie} Hit Die,
        ${checkpoint.checkpoint.xpAuthority==='gm'?'GM-approved level':'XP threshold'}.
        ${checkpoint.status==='current'?'These values are stored as preparation, not active character statistics.':'Your character or planning data changed. Prepare this level again.'}</p>`:'';
    const hpDie=pending&&Object.hasOwn(classes,pending.nextClass)?classes[pending.nextClass].die:null;
    const checkpointChoices=!record.multiclassActive&&planInfo.status==='current'&&hpDie!==null&&d.level<20&&p.hp>0&&!p.dead;
    const checkpointForm=checkpointChoices?`<form data-play-form="multiclass-levelup" class="play-multiclass-levelup">
      <p class="play-note">Prepare ${esc(pending.nextClass)} level 1 (d${hpDie} Hit Die). SRD 5.2.1 pp. 24–25: use higher-level HP, not the class's level 1 maximum. Your current HP and resources stay untouched.</p>
      <div class="fields"><label>Hit Point method<select name="hpMethod" required><option value="fixed">Fixed HP (${Math.floor(hpDie/2)+1} + CON modifier, minimum 1)</option><option value="rolled">Confirmed d${hpDie} roll + CON modifier</option></select></label>
      <label>Actual roll (only when selecting rolled HP)<input type="number" name="hpRoll" min="1" max="${hpDie}" placeholder="1–${hpDie}"></label>
      <label>Level approval<select name="xpAuthority" required><option value="xp">Meet total-level XP threshold${s.nextXP!==null?' ('+s.nextXP+' XP)':''}</option><option value="gm">GM-approved milestone</option></select></label></div>
      <label class="enc-checkbox"><input type="checkbox" name="gmApproved"> GM has approved this milestone (GM option only)</label>
      <label class="enc-checkbox"><input type="checkbox" name="acknowledged" required> I understand this is an HP/Hit Dice/slots checkpoint only. It does not change my active level, features, proficiencies, spell resources, or inventory.</label>
      <div class="toolbar"><button type="submit">Save level-up checkpoint</button>${savedCheckpoint?'<button type="button" data-play-action="clear-levelup-checkpoint">Clear checkpoint</button>':''}</div>
    </form>`:savedCheckpoint?'<p class="play-note">Your next-class plan needs review before preparing a checkpoint.</p><button type="button" data-play-action="clear-levelup-checkpoint">Clear checkpoint</button>':'';
    const checkpointPreview=checkpoint.preview&&checkpoint.status==='current'?`<p class="play-note">Total level ${checkpoint.preview.after.totalLevel} · Proficiency +${checkpoint.preview.after.proficiencyBonus} · Hit Dice ${checkpoint.preview.after.hitDice.map(x=>x.count+'d'+x.die).join(' + ')||'none'} · Shared Spellcasting slots ${checkpoint.preview.after.sharedSlots.map(x=>x.count+' × level '+x.level).join(', ')||'none'}. Pact Magic is separate. Class spell preparation and new features still need implementation.</p>`:'';


    // Fighter → Rogue level-1 class-entry choices. They are saved with the
    // current checkpoint but are NOT a license for the legacy single-class
    // Play engine to grant Rogue actions or to change its HP/Hit Dice.
    const rogueEntry=inspectSavedRogueEntry(record);
    const rogueOptions=rogueEntryOptions(record);
    const rogueSaved=Object.hasOwn(record,'multiclassRogueEntry');
    const rogueStatus=rogueEntry.status==='invalid'?`<p class="play-note" role="alert">${htmlCopy("Saved Rogue entry choices are malformed. They are not applied. Remove them or recover a verified backup.")}</p>`:
      rogueEntry.entry?`<p class="play-note"><strong>Rogue class-entry choices ${rogueEntry.status==='current'?'validated for review':'need revalidation'}:</strong>
        ${esc(rogueEntry.entry.skill)} (skill), ${rogueEntry.entry.expertise.map(esc).join(' + ')} (Expertise),
        ${esc(rogueEntry.entry.language)} (language), ${rogueEntry.entry.masteries.map(esc).join(' + ')} (masteries).
        These choices remain <strong>inactive</strong> until the composite character engine is complete.</p>`:'';
    const formOptions=(options,chosen)=>options.map(value=>`<option value="${esc(value)}" ${value===chosen?'selected':''}>${esc(value)}</option>`).join('');
    const expertisePool=rogueOptions.supported?[...new Set([...rogueOptions.expertise,...rogueOptions.skills])]:[];
    const rogueForm=!record.multiclassActive&&rogueOptions.supported?`<form data-play-form="multiclass-rogue-entry" class="play-multiclass-rogue-entry">
      <p class="play-note">SRD 5.2.1 pp. 25, 61–62: the Rogue multiclass grants one Rogue skill, Thieves’ Tools, Light Armor training, two Expertise skills, Thieves’ Cant and one other language, two weapon mastery choices, and Sneak Attack (1d6). No level-1 starting equipment is added. <strong>These choices are not active yet.</strong></p>
      <div class="fields">
        <label>${htmlCopy("New Rogue skill proficiency")}<select name="skill" required>${formOptions(rogueOptions.skills,rogueEntry.entry?.skill)}</select></label>
        <label>${htmlCopy("Expertise skill 1")}<select name="expertise1" required>${formOptions(expertisePool,rogueEntry.entry?.expertise[0])}</select></label>
        <label>${htmlCopy("Expertise skill 2")}<select name="expertise2" required>${formOptions(expertisePool,rogueEntry.entry?.expertise[1])}</select></label>
        <label>${htmlCopy("New language")}<select name="language" required>${formOptions(rogueOptions.languages,rogueEntry.entry?.language)}</select></label>
        <label>${htmlCopy("Weapon mastery kind 1")}<select name="mastery1" required>${formOptions(rogueOptions.masteries,rogueEntry.entry?.masteries[0])}</select></label>
        <label>${htmlCopy("Weapon mastery kind 2")}<select name="mastery2" required>${formOptions(rogueOptions.masteries,rogueEntry.entry?.masteries[1])}</select></label>
      </div>
      <p class="play-note">${htmlCopy("Each Expertise skill must already be proficient, or be the new Rogue skill selected above. Masteries must be different and not duplicate existing Fighter choices.")}</p>
      <label class="enc-checkbox"><input name="acknowledge" type="checkbox" required> ${htmlCopy("I confirm these are class-entry choices for future activation, not currently usable Rogue features.")}</label>
      <div class="toolbar"><button type="submit">${htmlCopy("Save Rogue class-entry choices")}</button>${rogueSaved?`<button type="button" data-play-action="clear-rogue-entry">${htmlCopy("Remove Rogue choices")}</button>`:''}</div>
    </form>`:rogueSaved?`<p class="play-note">${htmlCopy("Rogue entry requirements or the checkpoint have changed. Review the source records before continuing.")}</p><button type="button" data-play-action="clear-rogue-entry">${htmlCopy("Remove Rogue choices")}</button>`:
      checkpoint.status==='current'?`<p class="play-note">${esc(rogueOptions.reason)}</p>`:'';
    const rogueProjection=rogueEntry.status==='current'&&rogueEntry.projection?`<p class="play-note">Validated composite preview: ${rogueEntry.projection.classLevels.map(row=>esc(row.className)+' '+row.level).join(' / ')} · total level ${rogueEntry.projection.totalLevel} · Max HP ${rogueEntry.projection.maxHP} · Hit Dice ${rogueEntry.projection.hitDice.map(row=>row.count+'d'+row.die).join(' + ')} · proficiency +${rogueEntry.projection.proficiencyBonus}. No active class levels or resources were changed.</p>`:'';

    const activeSummary=record.multiclassActive?`<div class="play-note" role="status"><strong>Fighter 1 / Rogue ${profile.rogueLevel}${profile.rogueSubclass?' ('+profile.rogueSubclass+')':''}</strong> · Total level ${profile.totalLevel} · HP ${profile.maxHP} · 1d10 + ${profile.rogueLevel}d8 Hit Dice · Sneak Attack ${profile.rogueLevel>=3?'2d6':'1d6'}. ${htmlCopy("Fillable multiclass PDF and GCX exports are supported for this class pair. Further multiclass levels remain in development.")}</div>`:'';
    const rogue2Ready=record.multiclassActive?.secondaryLevel===1&&p.hp>0&&!p.dead&&!p.combat.active&&!p.focus&&!p.concentrationChecks.length;
    const rogue2Form=rogue2Ready?`<form data-play-form="advance-fighter-rogue2" class="play-multiclass-activation">
      <h3>${htmlCopy('Advance to Fighter 1 / Rogue 2')}</h3>
      <p class="play-note">${htmlCopy('Gain Rogue Cunning Action and a second d8 Hit Die. This changes your character to level 3 and cannot be undone with the previous Play Undo. Back up your character first.')}</p>
      <label>${htmlCopy('Rogue 2 HP method')}<select name="hpMethod"><option value="fixed">${htmlCopy('Fixed: 5 + CON modifier')}</option><option value="rolled">${htmlCopy('Rolled d8 + CON modifier')}</option></select></label>
      <label>${htmlCopy('Rolled d8 result (only for rolled HP)')}<input type="number" name="hpRoll" min="1" max="8" placeholder="1–8"></label>
      <label>${htmlCopy('XP or GM-approved advancement')}<select name="xpAuthority"><option value="xp">XP (900 minimum)</option><option value="gm">${htmlCopy('GM milestone approval')}</option></select></label>
      <label class="enc-checkbox"><input type="checkbox" name="gmApproved"> ${htmlCopy('GM explicitly approved a milestone (only if selecting GM approval above)')}</label>
      <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('I saved a private backup and explicitly approve advancing this saved character.')}</label>
      <button type="submit" class="primary">${htmlCopy('Advance to Fighter 1 / Rogue 2')}</button></form>`:'';
    const rogue3Ready=record.multiclassActive?.secondaryLevel===2&&p.hp>0&&!p.dead&&!p.combat.active&&!p.focus&&!p.concentrationChecks.length;
    const rogue3Form=rogue3Ready?`<form data-play-form="advance-fighter-rogue3" class="play-multiclass-activation">
      <h3>${htmlCopy('Advance to Fighter 1 / Rogue 3 (Thief)')}</h3>
      <p class="play-note">${htmlCopy('Rogue 3 grants Steady Aim, the SRD Thief subclass (Fast Hands and Second-Story Work), a third d8 Hit Die and Sneak Attack 2d6. Your character becomes level 4. Make a private backup first.')}</p>
      <label>${htmlCopy('Rogue subclass')}<select name="subclass" required><option value="Thief">Thief (SRD 5.2.1)</option></select></label>
      <label>${htmlCopy('Rogue 3 HP method')}<select name="hpMethod"><option value="fixed">${htmlCopy('Fixed: 5 + CON modifier')}</option><option value="rolled">${htmlCopy('Rolled d8 + CON modifier')}</option></select></label>
      <label>${htmlCopy('Rolled d8 result (only for rolled HP)')}<input type="number" name="hpRoll" min="1" max="8" placeholder="1–8"></label>
      <label>${htmlCopy('XP or GM-approved advancement')}<select name="xpAuthority"><option value="xp">XP (2,700 minimum)</option><option value="gm">${htmlCopy('GM milestone approval')}</option></select></label>
      <label class="enc-checkbox"><input type="checkbox" name="gmApproved"> ${htmlCopy('GM explicitly approved a milestone (only if selecting GM approval above)')}</label>
      <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy('I saved a private backup and explicitly approve advancing this saved character.')}</label>
      <button type="submit" class="primary">${htmlCopy('Advance to Fighter 1 / Rogue 3 (Thief)')}</button></form>`:'';
    const activateReady=!record.multiclassActive&&d.level===1&&rogueEntry.status==='current'&&checkpoint.status==='current'&&p.hp>0&&!p.dead&&!p.combat.active&&!p.focus;
    const activationForm=activateReady?`<form data-play-form="activate-fighter-rogue" class="play-multiclass-activation">
      <p class="play-note"><strong>Activate Fighter 1 / Rogue 1.</strong> Grants the validated Rogue 1 choices, maximum HP increase, and d8 Hit Die. End combat first and keep a verified private export: the single-class Builder cannot edit an active composite.</p>
      <label class="enc-checkbox"><input type="checkbox" name="confirmed" required> ${htmlCopy("I backed up my character and confirm this level-up.")}</label>
      <button type="submit" class="primary">${htmlCopy("Activate Fighter 1 / Rogue 1")}</button></form>`:'';
    const advancement=section('progress',copy("XP & advancement"),
      `<p><b>${p.xp.toLocaleString('en-US')} XP</b>${s.nextXP===null?' · Maximum level.':` · Level ${next} threshold ${s.nextXP.toLocaleString('en-US')} XP.${p.xp>=s.nextXP?' Threshold reached.':''}`}</p>
      <form data-play-form="xp" class="enc-inline"><label>${htmlCopy("Total XP")}<input type="number" name="value" min="0" max="999999" value="${p.xp}" required></label>
        <button type="submit">${htmlCopy("Save XP")}</button></form>
      ${advanceAvailable?`<p>${htmlCopy("Review the next level when you reach its XP threshold or your GM awards a milestone.")}</p><button type="button" data-play-action="advance">${htmlCopy("Review level")} ${next} build</button>`:s.nextXP===null?'':("<p>"+htmlCopy("Higher levels for this class are in development.")+"</p>")}
      ${record.multiclassActive?activeSummary+rogue2Form+rogue3Form:`<h3>Future multiclass planning</h3>${planDetails}${planForm}${planGuidance}
      <h3>Level-up preparation (not active)</h3>${checkpointStatus}${checkpointPreview}${checkpointForm}${activationForm}
      <h3>${htmlCopy("Rogue multiclass class-entry choices (not active)")}</h3>${rogueStatus}${rogueProjection}${rogueForm}`}
      ${link(23,copy("Character advancement"))}`,true);
    const calculations=section('calculations',copy("How stats are calculated"),statExplanations(s,link),panels.has('calculations'));
    const recent=section('log',copy("Recent changes"),p.log.length?list(p.log.slice().reverse().map(esc)):("<p>"+htmlCopy("No play activity yet.")+"</p>"),panels.has('log'));
    renderLists(activeId,collection=>{
      const group=(...keys)=>sheetGroup(collection,entities,...keys);
      const free=collection('free-spells',copy('Free casts'),resourceRows(profile.freeSpells));
      const resources=profile.pools.filter(pool=>!['arcane','natural','cunning','sorcerous-restoration','smite-free','resurgence-slot','natures-veil'].includes(pool.id));
      const counts=collection('limited-uses',copy('Limited-use features'),resourceRows(resources),{recovery:'Recovery'});
      const preparation=prepGuide(d.className);
      const spellHelp=preparation?`<p class="play-note">${htmlCopy('Spell choices are read-only in Play.')} ${esc(preparation)}</p>`:'';
      const sections=[
        ['reference','Attacks & checks',statsIntro+attackPanelHTML(profile,p)+liveCheckHTML(p)+group('attacks','mastery','checks','saves','training')],
        ['inventory','Inventory',inventoryPanel(record,panels)],
        ['spells','Spells & slots',spellHelp+group('cantrips','prepared','granted','slots','book')+magical+free],
        ['features','Features & uses',counts+secondWind+paladinActions+paladinRestoring+paladinSmite+paladinNimbus+druidActions+druidResurgence+monkActions+monkDeflect+monkHigh+rangerHigh+rogueDodge+rogueLuck+barbarianActions+font+group('classRows','origins','feats')],
        ['custom','Custom content',group('customRows')]
      ].filter(([, ,content])=>content);
      return header+`<div class="play-grid"><div class="play-left">${statusCard}${combatCard}${restCard}</div><section class="card play-reference" aria-label="${htmlCopy("Character reference")}">
        ${sheetSectionNav(sections)}${sections.map(([key,title,content])=>section(key,htmlCopy(title),content+sheetReturnLink(),panels.has(key))).join('')}
        ${how}${identity}${advancement}${calculations}${recent}</section></div>`;
    });
    // A locale-only rerender must not lose a prepared download or turn the
    // activation gate on without a user acknowledgement. Do not persist it.
    if(activationBackup && activationBackup.characterId===record.id &&
        activationBackup.revision===characterStorageRevision(record)) {
      const box=body.querySelector('[data-inventory-backup-confirmation]');
      const link=box?.querySelector('[data-inventory-backup-download]');
      const ack=box?.querySelector('[data-inventory-backup-ack]');
      if(link && ack){
        box.hidden=false;
        link.href=activationBackup.url;
        ack.disabled=!activationBackup.downloadAttempted;
        ack.checked=activationBackup.acknowledged;
        const activate=body.querySelector('[data-inventory-action="activate"]');
        if(activate)activate.disabled=!activationBackup.acknowledged;
      }
    }
    root.querySelector('[data-play-action="undo"]').disabled=!record.playUndo;
    root.querySelector('[data-play-action="export"]').disabled=false;
    root.querySelector('[data-play-action="print"]').disabled=false;
  }

  async function change(action) {
    if(busy||!record) return;
    busy=true;
    const id=activeId;
    const node=document.activeElement;
    const key=node?.dataset.playAction;
    const form=node?.closest('[data-play-form]')?.dataset.playForm;
    try {
      const expectedRevision=characterStorageRevision(record);
      const next=await characters.update(id,current=>{
        if(!current) throw new Error(copy("This character is no longer saved."));
        const currentProfile=playProfile(current.draft,current.multiclassActive);
        if(action.type==='undo') {
          if(!current.playUndo) throw new Error(copy("There is no change to undo."));
          return {...current,play:normalizePlay(currentProfile,current.playUndo),playUndo:null};
        }
        const previous=normalizePlay(currentProfile,current.play);
        return {...current,play:advancePlay(currentProfile,previous,action),playUndo:previous};
      },{expectedRevision,requireExisting:true});
      if(id!==activeId) return;
      takeRecord(next);
      message(action.type==='undo'?copy("Undid the last play change."):play.log.at(-1));
      if(form==='hp') body.querySelector('[data-play-form="hp"] input[name="value"]')?.focus({preventScroll:true});
      else if(key) Array.from(root.querySelectorAll('[data-play-action]')).find(el=>el.dataset.playAction===key&&el.getAttribute('aria-label')===node.getAttribute('aria-label')&&!el.disabled)?.focus({preventScroll:true});
    } catch(error) {
      if(id===activeId) message(error?.code===characterConflictCode
        ?copy('This saved character changed in another tab. Return to Saved Characters and reopen it before another Play action.')
        :error.message,true);
    } finally {busy=false;}
  }

  async function activateMulticlass(){
    if(busy||!record)return;
    busy=true;const id=activeId;
    try{
      const updated=await characters.update(id,current=>activateFighterRogue(current,{confirmed:true}),
        {expectedRevision:characterStorageRevision(record),requireExisting:true});
      if(id!==activeId)return;
      takeRecord(updated);
      message('Fighter 1 / Rogue 1 is active. The old single-class Play Undo was cleared.');
    }catch(error){if(id===activeId)message(error?.code===characterConflictCode?
      'Character changed in another tab. Reopen it before activating the level-up.':error.message,true);
    }finally{busy=false;}
  }

  async function advanceRogueSecondLevel({confirmed=false,xpAuthority='xp',gmApproved=false,hpMethod='fixed',hpRoll=null}={}){
    if(busy||!record)return;
    busy=true;const id=activeId;
    try{
      const updated=await characters.update(id,current=>advanceFighterRogue2(current,
        {confirmed,xpAuthority,gmApproved,hpMethod,hpRoll}),
        {expectedRevision:characterStorageRevision(record),requireExisting:true});
      if(id!==activeId)return;
      takeRecord(updated);
      message('Fighter 1 / Rogue 2 is active. Cunning Action and the new d8 Hit Die are available.');
    }catch(error){if(id===activeId)message(error?.code===characterConflictCode?
      'Character changed in another tab. Reopen it before advancing Rogue.':error.message,true);
    }finally{busy=false;}
  }

  async function advanceRogueThirdLevel({confirmed=false,xpAuthority='xp',gmApproved=false,hpMethod='fixed',hpRoll=null,subclass='Thief'}={}){
    if(busy||!record)return;
    busy=true;const id=activeId;
    try{
      const updated=await characters.update(id,current=>advanceFighterRogue3(current,
        {confirmed,xpAuthority,gmApproved,hpMethod,hpRoll,subclass}),
        {expectedRevision:characterStorageRevision(record),requireExisting:true});
      if(id!==activeId)return;
      takeRecord(updated);
      message('Fighter 1 / Rogue 3 (Thief) is active. Steady Aim, Fast Hands, Second-Story Work and Sneak Attack 2d6 are available.');
    }catch(error){if(id===activeId)message(error?.code===characterConflictCode?
      'Character changed in another tab. Reopen it before advancing Rogue.':error.message,true);
    }finally{busy=false;}
  }

  async function saveFutureClassPlan(targetClass){
    if(busy||!record)return;
    busy=true;
    const savedId=activeId;
    try{
      const expectedRevision=characterStorageRevision(record);
      const updated=await characters.update(savedId,current=>{
        if(!current)throw new Error('The saved character no longer exists.');
        return targetClass===null?clearSavedMulticlassPlan(current):setSavedMulticlassPlan(current,targetClass);
      },{expectedRevision,requireExisting:true,skipUnchanged:true});
      if(savedId!==activeId)return;
      takeRecord(updated);
      message(targetClass===null?'Removed the future-class plan.':
        'Saved a future-class plan. The active character and gameplay are unchanged.');
    }catch(error){
      if(savedId===activeId)message(error?.code===characterConflictCode?
        'This character changed in another tab. Reopen it before editing the future-class plan.':error.message,true);
    }finally{busy=false;}
  }

  async function saveLevelUpCheckpoint(input){
    if(busy||!record)return;
    busy=true;
    const savedId=activeId;
    try{
      const expectedRevision=characterStorageRevision(record);
      const updated=await characters.update(savedId,current=>{
        if(!current)throw new Error('The saved character no longer exists.');
        return input===null?clearMulticlassLevelUp(current):prepareMulticlassLevelUp(current,input);
      },{expectedRevision,requireExisting:true,skipUnchanged:true});
      if(savedId!==activeId)return;
      takeRecord(updated);
      message(input===null?'Removed the level-up checkpoint.':
        'Saved a multiclass level-up checkpoint. The playable character and all current resources remain unchanged.');
    }catch(error){
      if(savedId===activeId)message(error?.code===characterConflictCode?
        'This character changed in another tab. Reopen it before preparing the next level.':error.message,true);
    }finally{busy=false;}
  }

  async function saveRogueEntryChoices(input){
    if(busy||!record)return;
    busy=true;
    const savedId=activeId;
    try{
      const expectedRevision=characterStorageRevision(record);
      const updated=await characters.update(savedId,current=>{
        if(!current)throw new Error('The saved character no longer exists.');
        return input===null?clearSavedRogueEntry(current):setSavedRogueEntry(current,input);
      },{expectedRevision,requireExisting:true,skipUnchanged:true});
      if(savedId!==activeId)return;
      takeRecord(updated);
      message(input===null?copy('Removed saved Rogue class-entry choices.'):
        copy('Saved validated Rogue entry choices. Your active class features, HP, Hit Dice and spells remain unchanged.'));
    }catch(error){
      if(savedId===activeId)message(error?.code===characterConflictCode?
        copy('This character changed in another tab. Reopen it before updating the Rogue entry choices.'):error.message,true);
    }finally{busy=false;}
  }

  async function prepareActivationBackup() {
    if(busy||!record)return;
    busy=true;
    const opened=record;
    clearActivationBackup();
    render();
    try {
      if(!await checkSavedExportFreshness(opened,key=>characters.get(key)))throw new CharacterConflictError();
      const prepared=await prepareInventoryActivationBackup(opened);
      if(!await checkSavedExportFreshness(opened,key=>characters.get(key)))throw new CharacterConflictError();
      if(opened!==record || activeId!==prepared.characterId || root.hidden)return;
      const {file,characterId,revision}=prepared;
      const url=URL.createObjectURL(new Blob([JSON.stringify(file,null,2)],{type:'application/json'}));
      activationBackup={characterId,revision,url,downloadAttempted:false,acknowledged:false};
      render();
      body.querySelector('[data-inventory-backup-feedback]').textContent=copy('Backup prepared. Download it, then confirm that you saved it.');
      body.querySelector('[data-inventory-backup-download]').focus({preventScroll:true});
    } catch(error){
      if(opened!==record || root.hidden)return;
      if(error?.code===characterConflictCode) showInventoryConflict('This saved character changed in another tab. Reload it before preparing a backup.');
      else {
        body.querySelector('[data-inventory-backup-feedback]').textContent=copy(error?.message||'Could not prepare private backup.');
        body.querySelector('[data-inventory-action="prepare-backup"]').focus({preventScroll:true});
      }
    } finally{busy=false;}
  }

  function showInventoryConflict(text) {
    clearActivationBackup();
    render();
    message(copy(text),true);
    const button=document.createElement('button');
    button.type='button';
    button.dataset.inventoryAction='reload';
    button.textContent=copy('Reload saved character');
    feedback.append(' ',button);
    button.focus({preventScroll:true});
  }

  async function changeInventory(action) {
    if (busy || !record) return;
    busy=true;
    const opened=record;
    const command=action ?? retryInventory;
    if (!command) {busy=false;return;}
    const complete={operationId:crypto.randomUUID(),expectedRevision:characterStorageRevision(opened),...command};
    try {
      const next=await commitSavedInventory(opened.id,complete,activationBackup && {...activationBackup});
      if (opened!==record || root.hidden) return;
      retryInventory=null;
      takeRecord(next);
      message(copy('Inventory saved.'));
      body.querySelector('[data-inventory-summary]')?.focus({preventScroll:true});
    } catch (error) {
      if (opened!==record || root.hidden) return;
      if(error?.code===characterConflictCode) {
        retryInventory=null;
        showInventoryConflict(error.message);
        return;
      }
      retryInventory=complete;
      message(copy(error?.message || 'The inventory save failed.'),true);
      const button=document.createElement('button');
      button.type='button';
      button.dataset.inventoryAction='retry';
      button.textContent=copy('Retry inventory save');
      feedback.append(' ',button);
    } finally {busy=false;}
  }

  root.addEventListener('toggle',event=>{
    const key=event.target.dataset.panel;
    if(key) {
      if(event.target.open) panels.add(key);
      else panels.delete(key);
    }
  },true);
  root.addEventListener('change',event=>{
    if(event.target.matches('[data-play-form="hit-die"] select[name="die"]')){
      const input=event.target.closest('form')?.querySelector('input[name="value"]');
      if(input){input.max=event.target.value;input.value='';}
      return;
    }
    if(!event.target.matches('[data-inventory-backup-ack]'))return;
    if(!activationBackup?.downloadAttempted) {event.target.checked=false;return;}
    activationBackup.acknowledged=event.target.checked;
    const activate=body.querySelector('[data-inventory-action="activate"]');
    if(activate)activate.disabled=!activationBackup.acknowledged;
  });
  root.addEventListener('click',async event=>{
    const backupLink=event.target.closest('[data-inventory-backup-download]');
    if(backupLink){
      if(!activationBackup || backupLink.href!==activationBackup.url){event.preventDefault();return;}
      activationBackup.downloadAttempted=true;
      const acknowledgement=body.querySelector('[data-inventory-backup-ack]');
      if(acknowledgement)acknowledgement.disabled=false;
      return;
    }
    const inventoryButton=event.target.closest('[data-inventory-action]');
    if (inventoryButton && record) {
      const type=inventoryButton.dataset.inventoryAction;
      if (type==='reload') return loadCharacter(activeId,false,true);
      if (type==='retry') return changeInventory(null);
      if (type==='prepare-backup') return prepareActivationBackup();
      return changeInventory({type});
    }
    const jump=event.target.closest('[data-sheet-jump]');
    if(jump) return jumpToSheetSection(body,jump.dataset.sheetJump);
    const button=event.target.closest('[data-play-action]');
    if(!button||!record) return;
    const {playAction:type,pool,kind,delta}=button.dataset;
    if(type==='second-wind-roll') return change({type:'second-wind',roll:die(10)});
    if(type==='lay-on-hands-poison') return change({type:'lay-on-hands',target:button.dataset.target,effect:'poison'});
    if(type==='holy-nimbus-start') return change({type,confirmed:true});
    if(type==='holy-nimbus-end'||type==='holy-nimbus-recharge') return change({type});
    if(type==='wild-shape-end') return change({type:'wild-shape-end'});
    if(type==='wild-resurgence-slot') return change({type:'wild-resurgence',exchange:'shape-to-slot'});
    if(type==='monk-technique') return change({type:'monk-technique',technique:button.dataset.technique,empowered:button.dataset.empowered==='true'});
    if(type==='monk-patient-roll') return change({type:'monk-technique',technique:'patient',empowered:true,tempRoll:die(profile.martialDie)+die(profile.martialDie)});
    if(type==='initiative-roll') {
      const id=activeId;
      if(!await animateDice(button)||id!==activeId||!record)return;
      const rolls=rollDice(20,profile.s.initiativeAdvantage?2:1);
      const chosen=Math.max(...rolls);
      const useMetabolism=root.querySelector('[data-play-form="combat-start"] input[name="metabolism"]')?.checked;
      return change({type:'combat-start',initiative:chosen+profile.s.initiative-2*play.exhaustion,
        ...(root.querySelector('[data-play-form="combat-start"] input[name="persistent-rage"]')?.checked?{persistentRage:true}:{}),
        ...(useMetabolism?{metabolismRoll:die(profile.martialDie)}:{})});
    }
    if(type==='shield-end')return change({type,confirmed:true});
    if(type==='dodge-action')return change({type,confirmed:root.querySelector('[data-dodge-confirm]')?.checked===true});
    if(type==='dodge-end')return change({type,confirmed:true});
    if(type==='combat-turn') return change({type:'combat-turn',stage:button.dataset.stage});
    if(type==='combat-window') return change({type:'combat-window',confirmed:true});
    if(type==='rogue-cunning-action')return change({type:'rogue-cunning-action',option:button.dataset.option});
    if(type==='rogue-steady-aim')return change({type:'rogue-steady-aim',
      notMoved:root.querySelector('[data-rogue-no-move]')?.checked===true});
    if(type==='monk-save-reroll') return change({type,failed:true,newRoll:die(20)});
    if(type==='monk-quivering-dismiss') return change({type});
    if(type==='monk-quivering-resolve') return change({type,mode:'action',samePlane:true,rolls:rollDice(12,10)});
    if(type==='stroke-of-luck') return change({type:'stroke-of-luck',failed:true});
    if(type==='intimidating-presence') return change({type,confirmed:true});
    if(type==='natures-veil') return change({type,confirmed:true});
    if(type==='intimidating-presence-recharge') return change({type});
    if(type==='combat-use') return change({type:'combat-use',key:button.dataset.usage,used:button.getAttribute('aria-pressed')!=='true'});
    if(type==='advance') return record.multiclassActive?message('Use the upcoming composite-level advancement engine. Do not overwrite this character with a single-class build.',true):advance(record);
    if(type==='clear-multiclass-plan')return saveFutureClassPlan(null);
    if(type==='clear-levelup-checkpoint')return saveLevelUpCheckpoint(null);
    if(type==='clear-rogue-entry')return saveRogueEntryChoices(null);
    if(type==='print') {
      const opened=record;
      return print(opened.draft,play,{multiclassActive:opened.multiclassActive??null,showWebPrint:!opened.multiclassActive,equipment:savedEquipmentLines(opened),eligibility:()=>record===opened&&savedCharacterIsComplete(opened),
        verifyCurrent:()=>checkSavedExportFreshness(opened,key=>characters.get(key))});
    }
    if(type==='export') {
      const opened=record;
      if(!await checkSavedExportFreshness(opened,key=>characters.get(key))||record!==opened||activeId!==opened.id) {
        message(copy('A newer version of this saved character may exist. Reopen it before exporting or printing.'),true);
        return;
      }
      const filename=profile.d.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'character';
      download(makeSavedCharacterExport(opened,play),filename+'.open5e-play',feedback);
      return;
    }
    if(type==='death-roll'||type==='hit-die-roll') {
      const id=activeId;
      if(!await animateDice(button)||id!==activeId) return;
    }
    if(type==='death-roll') {
      const first=die(20);
      return change({type:'death-save',value:profile.s.fighter?.survivor?Math.max(first,die(20)):first});
    }
    if(type==='hit-die-roll') {
      const selected=Number(root.querySelector('[data-play-form="hit-die"] select[name="die"]')?.value);
      const pool=profile.hitDicePools?.find(row=>row.die===selected&&(play.hitDiceSpent?.[row.die]??0)<row.count);
      if(profile.hitDicePools&&!pool)return message('Choose a class with an unspent Hit Die.',true);
      return change({type:'hit-die',value:die(pool?.die??profile.die),...(pool?{die:pool.die}:{})});}
    if(type==='clear-focus') return change({type:'concentration',value:''});
    if(type==='condition') return change({type:'condition',name:button.dataset.condition,
      active:button.getAttribute('aria-pressed')!=='true'});
    if(type==='concentration-save') return change({type:'concentration-check',success:button.dataset.success==='true'});
    if(type==='counter') return change({type:kind,level:Number(pool),id:pool,delta:Number(delta)});
    change({type});
  });
  // Attack roller: previews only. These handlers never call change() or touch storage.
  root.addEventListener('change',event=>{
    const form=event.target.closest?.('[data-attack-form]');
    if(form&&profile&&['attack','ability'].includes(event.target.name))attackFormChanged(form,profile);
  });
  root.addEventListener('click',event=>{
    const fill=event.target.closest?.('[data-attack-fill]');
    if(!fill||!profile||!play)return;
    const form=fill.closest('[data-attack-form]');
    try {fillAttackDice(form,fill.dataset.attackFill,profile,play);form.requestSubmit(form.querySelector(`button[type=submit][value="${fill.dataset.attackFill}"]`));}
    catch(error){form.querySelector(fill.dataset.attackFill==='damage'?'[data-damage-result]':'[data-attack-result]').textContent=error?.message||copy('Roll unavailable.');}
  });
  root.addEventListener('submit',event=>{
    if(event.target.matches('[data-attack-form]')){
      event.preventDefault();
      const which=event.submitter?.value==='damage'?'damage':'attack';
      const output=event.target.querySelector(which==='damage'?'[data-damage-result]':'[data-attack-result]');
      if(!record||!profile||!play||!output)return;
      try {output.textContent=attackFormResult(event.target,which,profile,play);}
      catch(error){output.textContent=error instanceof RangeError||error instanceof TypeError?error.message:copy('Attack preview unavailable. Check the dice and modifiers.');}
      return;
    }
    if(event.target.matches('[data-live-check]')){
      event.preventDefault();
      const output=event.target.querySelector('[data-live-check-result]');
      if(!record||!profile||!play||!output)return;
      try {output.textContent=resolveLiveCheckForm(event.target,profile,play);}
      catch {output.textContent=copy('Check unavailable. Verify dice, modifiers, character state and confirmation.');}
      return;
    }

    if (event.target.dataset.inventoryForm) {
      event.preventDefault();
      return changeInventory(inventoryFormCommand(event.target));
    }
    const type=event.target.dataset.playForm;
    if(!type) return;
    event.preventDefault();
    const input=new FormData(event.target);
    if(['condition-source-add','condition-source-remove','condition-save-add','condition-save-queue','condition-save-roll','condition-turn-save-add','condition-time-advance'].includes(type)){
      if(!body.contains(event.target))return;
      return change(conditionSourceCommand(type,input));
    }
    if(type==='modifier-add'||type==='modifier-remove'){
      if(!body.contains(event.target))return;
      return change(type==='modifier-add'?{type,spell:input.get('spell')??'Shield of Faith',caster:String(input.get('caster')??'').trim(),confirmed:input.has('confirmed')}:{type,id:Number(input.get('id')),spell:input.get('spell'),caster:input.get('caster'),confirmed:input.has('confirmed')});
    }
    if(type==='shield-cast'){
      if(!body.contains(event.target))return;
      const total=input.get('total');
      return change({type,trigger:input.get('trigger'),level:Number(input.get('level')),confirmed:input.has('confirmed'),...(total!==''?{total:Number(total),automaticHit:input.has('automaticHit')}:{})});
    }
    if(type==='concentration-roll'){
      if(!body.contains(event.target))return;
      return change(concentrationRollCommand(event.target,input));
    }
    if(type==='attack-assist') {
      const index=Number(input.get('index'));
      const attack=profile.s.attacks[index];
      if(!attack) return message(copy('Select a valid character attack.'),true);
      const advantage=input.has('advantage')||play.combat.aimPending===true,disadvantage=input.has('disadvantage');
      const mode=attackRollMode({advantage,disadvantage,forcedDisadvantage:attack.disadvantage===true});
      const targetAC=input.get('ac')===''?null:Number(input.get('ac'));
      const rolls=rollDice(20,mode==='normal'?1:2);
      const entry={type,index,advantage,disadvantage,targetAC,confirmedHit:input.has('confirmed'),rolls,
        markedTarget:input.has('markedTarget'),sneak:input.has('sneak'),allyNear:input.has('ally'),cunning:input.get('cunning')||'none',cunningExtra:input.get('cunningExtra')||'none',
        poisonKit:input.has('poisonKit'),targetLargeOrSmaller:input.has('targetLargeOrSmaller')};
      // First validate hit and critical state, then generate exactly its damage dice.
      // Opponent HP and Action/Bonus Action markers stay with the DM and player.
      try {
        const planned=planAttack(profile,play,entry);
        const dice=planned.damageDice;
        return change({...entry,damageRolls:planned.hit?
          Array.from({length:dice.count},()=>die(dice.sides)):[],
          sneakRolls:Array.from({length:planned.rogue.count},()=>die(6)),
          markRolls:Array.from({length:planned.markDice.count},()=>die(planned.markDice.sides))});
      } catch(error){return message(error.message,true);}
    }
    if(type==='beast-attack-assist') {
      const entry={type,attack:input.get('attack'),targetAC:input.get('ac')===''?null:Number(input.get('ac')),
        advantage:input.has('advantage'),disadvantage:input.has('disadvantage'),confirmedHit:input.has('confirmed')};
      try {
        const mode=attackRollMode(entry);
        const rolls=rollDice(20,mode==='normal'?1:2);
        const actual=planBeastAttack(profile,play,{...entry,rolls});
        const damageRolls=actual.hit?actual.components.map(component=>
          Array.from({length:component.roll.count},()=>die(component.roll.sides))):[];
        return change({...entry,rolls,damageRolls});
      }catch(error){return message(error.message,true);}
    }
    if(type==='hunter-defense') return change({type,damage:Number(input.get('damage')),damageType:input.get('damageType'),confirmed:input.has('confirmed')});
    if(type==='rogue-uncanny-dodge') return change({type,damage:Number(input.get('damage')),
      visible:input.has('visible'),hit:input.has('hit')});
    if(type==='combat-start') return change({type:'combat-start',initiative:Number(input.get('initiative')),
      ...(input.has('persistent-rage')?{persistentRage:true}:{}),
      ...(input.has('metabolism')?{metabolismRoll:Number(input.get('metabolism-roll'))}:{})});
    if(type==='second-wind') return change({type,roll:Number(input.get('value'))});
    if(type==='lay-on-hands') return change({type,target:input.get('target'),effect:'heal',points:Number(input.get('points'))});
    if(type==='restoring-touch') return change({type:'lay-on-hands',target:input.get('target'),effect:'restore',conditions:input.getAll('condition')});
    if(type==='wild-shape') return change({type,form:input.get('form')});
    if(type==='wild-resurgence') return change({type,exchange:'slot-to-shape',level:Number(input.get('level'))});
    if(type==='divine-smite') {
      const free=input.has('free'),level=free?1:Number(input.get('level'));
      const fiendOrUndead=input.has('fiend');
      const dice=smiteDice(level,fiendOrUndead);
      const manual=input.get('damage');
      return change({type,free,level,fiendOrUndead,confirmedHit:input.has('confirmed'),
        damageRoll:manual?Number(manual):Array.from({length:dice},()=>die(8)).reduce((x,y)=>x+y,0)});
    }
    if(type==='monk-quivering-start') return change({type,target:input.get('target'),confirmedHit:input.has('confirmed')});
    if(type==='monk-deflect') {
      const redirect=input.has('redirect');
      const manual=input.get('roll'),manualRedirect=input.get('redirect-roll');
      return change({type,confirmedHit:input.has('confirmed'),damage:Number(input.get('damage')),damageType:input.get('damage-type'),
        roll:manual?Number(manual):die(10),redirect,
        ...(redirect?{redirectRoll:manualRedirect?Number(manualRedirect):die(profile.martialDie)+die(profile.martialDie)}:{})});
    }
    if(type==='monk-patient') return change({type:'monk-technique',technique:'patient',empowered:true,tempRoll:Number(input.get('value'))});
    if(type==='rogue-fast-hands')return change({type:'rogue-fast-hands',
      option:String(input.get('option')??''),confirmed:input.has('confirmed'),magicItemEligible:input.has('magicItemEligible')});
    if(type==='advance-fighter-rogue3'){
      const method=String(input.get('hpMethod')??'');
      const xpAuthority=String(input.get('xpAuthority')??'');
      return advanceRogueThirdLevel({confirmed:input.has('confirmed'),hpMethod:method,
        hpRoll:method==='rolled'?Number(input.get('hpRoll')):null,subclass:String(input.get('subclass')??''),
        xpAuthority,gmApproved:input.has('gmApproved')});
    }
    if(type==='advance-fighter-rogue2'){
      const method=String(input.get('hpMethod')??'');
      const xpAuthority=String(input.get('xpAuthority')??'');
      return advanceRogueSecondLevel({confirmed:input.has('confirmed'),hpMethod:method,
        hpRoll:method==='rolled'?Number(input.get('hpRoll')):null,
        xpAuthority,gmApproved:input.has('gmApproved')});
    }
    if(type==='activate-fighter-rogue')return input.has('confirmed')?activateMulticlass():message('Confirm advancement before activating.',true);
    if(type==='multiclass-plan') {
      if(!input.has('acknowledge'))return message('Confirm that the multiclass plan is not yet playable.',true);
      return saveFutureClassPlan(String(input.get('nextClass')??''));
    }
    if(type==='multiclass-levelup'){
      const hpMethod=String(input.get('hpMethod')??'');
      const xpAuthority=String(input.get('xpAuthority')??'');
      return saveLevelUpCheckpoint({hpMethod,hpRoll:hpMethod==='rolled'?Number(input.get('hpRoll')):null,
        xpAuthority,gmApproved:input.has('gmApproved'),acknowledged:input.has('acknowledged')});
    }
    if(type==='multiclass-rogue-entry'){
      return saveRogueEntryChoices({skill:String(input.get('skill')??''),
        expertise:[String(input.get('expertise1')??''),String(input.get('expertise2')??'')],
        language:String(input.get('language')??''),
        masteries:[String(input.get('mastery1')??''),String(input.get('mastery2')??'')],
        acknowledged:input.has('acknowledge')});
    }
    if(type==='hit-die')return change({type,value:Number(input.get('value')),
      ...(profile.hitDicePools?{die:Number(input.get('die'))}:{})});
    if(type==='hp') return change({type:event.submitter?.value||'damage',value:Number(input.get('value')),critical:input.has('critical')});
    if(type==='short-rest') {
      const recover=Object.fromEntries(profile.slots.filter(slot=>input.has('recover-'+slot.level)).map(({level})=>[level,Number(input.get('recover-'+level))]));
      return change({type,recover,sorcerous:input.has('sorcerous')});
    }
    if(type==='font-of-inspiration') return change({type,level:Number(input.get('value'))});
    change({type,value:type==='concentration'?input.get('value'):Number(input.get('value'))});
  });

  async function loadCharacter(id,localeOnly=false,showInventory=false) {
    if(localeOnly&&id===loadedId&&record) {render();return;}
    const token=++request;
    clearActivationBackup();
    activeId=id;
    if(loadedId!==id) panels=new Set(['spells','features','how','identity']);
    if (showInventory) panels.add('inventory');
    loadedId=id;
    record=null;
    retryInventory=null;
    root.querySelector('[data-play-action="undo"]').disabled=true;
    root.querySelector('[data-play-action="export"]').disabled=true;
    root.querySelector('[data-play-action="print"]').disabled=true;
    body.innerHTML=("<p>"+htmlCopy("Opening character…")+"</p>");
    message('');
    try {
      const saved=id&&await characters.get(id);
      if(token!==request) return;
      if(!saved) throw new Error(copy("This character is unavailable in this browser. Open a saved character to play."));
      if(!savedCharacterIsComplete(saved)) throw new Error(copy('This saved character needs builder review before Play or PDF. Open Saved Characters and choose Edit build.')); 
      takeRecord(saved);
      if (showInventory) jumpToSheetSection(body,'inventory');
    } catch(error) {
      if(token===request) body.innerHTML='<p>'+esc(error.message)+'</p>';
    }
  }
  return loadCharacter;
}
