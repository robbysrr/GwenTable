import {copy} from './locale.js';
export function statExplanations(sheet,rule) {
  const {baseAC,shieldBonus,defenseBonus}=sheet.acParts;
  const {first,advancement,species,subclass}=sheet.hpParts;
  const ac=[baseAC+' worn armor or unarmored base',shieldBonus&&shieldBonus+' shield',defenseBonus&&defenseBonus+' Defense style'].filter(Boolean);
  const hp=[first+' at level 1',advancement&&advancement+' from advancement and Constitution changes',species&&species+' from species',subclass&&subclass+' from subclass'].filter(Boolean);
  return `<p><b>Armor Class ${sheet.ac}.</b> ${ac.join(' + ')}. ${rule(7,'Armor Class')}</p>
    <p><b>Maximum HP ${sheet.hp}.</b> ${hp.join(' + ')}. ${rule(23,'Hit Points and advancement')}</p>
    <p><b>Proficiency bonus +${sheet.proficiency}.</b> Based on character level. ${rule(23,copy("Character advancement"))}</p>`;
}
