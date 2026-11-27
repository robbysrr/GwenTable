const clearSaves=a=>{a.successes=0;a.failures=0;};
export const stabilize=a=>{a.stable=true;clearSaves(a);};
export function kill(a) {
  a.dead=true;
  a.stable=false;
  a.focus='';
}
export function heal(a,value) {
  a.hp=Math.min(a.maxHP,a.hp+value);
  if (a.hp>0) {clearSaves(a);a.stable=false;}
}
export function damage(a,amount,critical) {
  const startingHP=a.hp;
  const absorbed=Math.min(a.temp,amount);
  a.temp-=absorbed;
  const remaining=amount-absorbed;
  a.hp=Math.max(0,startingHP-remaining);
  if (a.hp!==0) return absorbed;
  a.focus='';
  if ((startingHP===0?amount:remaining-startingHP)>=a.maxHP) kill(a);
  else if (a.side==='pc'&&startingHP===0) {
    a.stable=false;
    a.failures=Math.min(3,a.failures+(critical?2:1));
    if (a.failures===3) kill(a);
  }
  return absorbed;
}

export function deathSave(a,roll) {
  if (roll===20) heal(a,1);
  else if (roll>=10) {
    a.successes++;
    if (a.successes===3) stabilize(a);
  } else {
    a.failures=Math.min(3,a.failures+(roll===1?2:1));
    if (a.failures===3) kill(a);
  }
}
