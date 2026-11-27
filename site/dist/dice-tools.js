import {rollDice} from './dice-geometry.js';
import {copy} from './locale.js';
const diceUses={
  4:'Small damage or bonuses, such as a dagger’s damage die.',
  6:'Common damage, including shortswords and many spells. Roll four d6s when generating a rolled ability score.',
  8:'Weapon and spell damage, and Hit Dice for classes such as Cleric and Rogue.',
  10:'Damage and Fighter, Paladin, or Ranger Hit Dice. Roll two d10s to generate a percentile result.',
  12:'Large weapon damage and Barbarian Hit Dice.',
  20:'Attack rolls, ability checks, and saving throws. Add the appropriate modifier.',
  100:'Percentile tables. A roll of 100 represents the top result.'
};
export async function animateDice(button,buttonText=copy("Rolling…")) {
  if(button.disabled) return false;
  const label=button.textContent;
  button.disabled=true;
  button.textContent=buttonText;
  button.classList.add('rolling-dice');
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)
    await new Promise(resolve=>setTimeout(resolve,400));
  button.classList.remove('rolling-dice');
  button.textContent=label;
  button.disabled=false;
  return true;
}
export function mountDiceTools(root) {
  const form=root.querySelector('form');
  const description=root.querySelector('[data-dice-use]');
  const result=root.querySelector('[data-dice-result]');
  const canvas=root.querySelector('[data-dice-tray]');
  const {sides,count}=form.elements;
  let last, tray, rolling=false;
  const explain=()=>{description.textContent=copy(diceUses[sides.value]);};
  const report=()=>{
    if(rolling) result.textContent=copy('Rolling…');
    else if(!last) result.textContent=copy('Choose a die and roll.');
    else {
      const {die,amount,values}=last;
      result.textContent=amount+'d'+die+' · '+values.join(' + ')+' = '+values.reduce((sum,value)=>sum+value,0);
      const shown=die===100?3:6;
      if(amount>shown) result.textContent+=' · '+copy('Tray shows {count} of these rolls.',{count:shown});
    }
  };
  sides.onchange=explain;
  explain();
  report();
  root.ownerDocument.addEventListener('gwentable-languagechange',()=>{explain();report();});
  form.onsubmit=async event=>{
    event.preventDefault();
    const die=Number(sides.value), amount=Number(count.value);
    if(rolling||!Object.hasOwn(diceUses,die)||!Number.isInteger(amount)||amount<1||amount>20) return;
    const button=event.submitter??form.querySelector('button');
    const values=rollDice(die,amount);
    rolling=true;
    button.disabled=true;
    report();
    try {
      if(!tray) tray=(await import('./dice-tray.js')).createDiceTray(canvas);
      await tray.roll(die,values,matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch {
      canvas.hidden=true;
    } finally {
      last={die,amount,values};
      rolling=false;
      button.disabled=false;
      report();
    }
  };
}
