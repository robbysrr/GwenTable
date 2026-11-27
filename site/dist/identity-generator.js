const trinkets = [
  'A copper coin bent into a crescent.', 'A brass key with no teeth.',
  'A wooden spool tied with blue thread.', 'A dried flower pressed between playing cards.',
  'A tiny glass vial holding sand from home.', 'A button stamped with a seven-pointed star.',
  'An unmarked signet ring wrapped in cloth.', 'A folded map with one town name crossed out.',
  'An envelope that still smells faintly of cedar.', 'A wooden bird with a wing painted gold.'
];
const beginnings = {
  Acolyte:'I once tended a small shrine on a road most travelers avoided.',
  Criminal:'My first honest job was carrying letters for someone who refused to give their name.',
  Sage:'I learned more in the margins of borrowed books than I did in any lecture hall.',
  Soldier:'My old company taught me to count on the person beside me when plans went wrong.'
};
const turns = [
  'One night, a stranger left me a letter addressed in my own handwriting.',
  'I made a promise to someone who vanished before I could keep it.',
  'I took the blame for a friend and never learned who had set us up.',
  'A debt I thought settled came due in a town where nobody should have known me.',
  'I found proof that a story I had dismissed as folklore was true.'
];
const aims = [
  'I travel to find out who knew enough about my past to leave that clue.',
  'I am looking for allies who will tell me when I am wrong and stand beside me when it matters.',
  'My first goal is to return home with an answer I can live with.',
  'I want to earn enough trust to finish the work I left behind.',
  'I carry the memory with me and refuse to leave the next person in trouble.'
];

const pick=(list,rng)=>list[Math.floor(rng()*list.length)];
const vary=(list,current,rng)=>{const unused=list.filter(text=>!current?.includes(text));return pick(unused.length?unused:list,rng);};

export function identitySuggestion(field,draft,rng=Math.random,locale='en') {
  if(field==='name') {
    const english=namesBySpecies[draft.species]??namesBySpecies.Human;
    const local=indonesianNames[draft.species]??indonesianNames.Human;
    const pool=locale==='id'?[...local,...english]:english;
    const alternatives=pool.filter(name=>!draft.name?.startsWith(name+' '));
    const family=locale==='id'?indonesianSurnames:surnames;
    return pick(alternatives.length?alternatives:pool,rng)+' '+pick(family,rng);
  }
  if(field==='appearance') return vary(looks,draft.appearance,rng)+' '+pick(manner,rng);
  if(field==='personality') return vary(habits,draft.personality,rng)+' '+pick(bonds,rng)+' '+pick(flaws,rng);
  if(field==='trinket') {
    if(rng()<.3) return pick(trinkets.filter(option=>option!==draft.trinket),rng);
    const pool=keepsakes.filter(item=>!draft.trinket?.startsWith(item));
    return pick(pool,rng)+' '+pick(marks,rng)+'.';
  }
  const opening=beginnings[draft.background]??'I left home with little more than a promise and a borrowed coat.';
  const alternatives=turns.filter(option=>!draft.story.includes(option));
  const turning=pick(alternatives.length?alternatives:turns,rng);
  const prop=['a cracked seal','a missing witness','a misplaced key','an heirloom','a mysterious map','a broken oath','a lost ledger','a whispered warning'];
  const tie=['I still have questions about','I promised a friend I would look into','I kept quiet when someone mentioned','I learned my mentor knew something about'];
  return [opening,turning,pick(tie,rng)+' '+pick(prop,rng)+'.',pick(aims,rng)].join(' ');
}

const namesBySpecies={
  Dragonborn:['Rhogar','Kava','Mishann','Arjhan','Nala','Torinn'],
  Dwarf:['Bera','Dagna','Eberk','Orik','Runa','Torra'],
  Elf:['Aelar','Amari','Lethiel','Neris','Sylwen','Vaelis'],
  Gnome:['Bimp','Glim','Nissa','Orla','Tavish','Wrenn'],
  Goliath:['Aukan','Gara','Keothi','Nalla','Uthal','Vimak'],
  Halfling:['Brenna','Clem','Fenn','Mira','Pip','Rosie'],
  Human:['Adra','Darian','Elin','Mara','Niko','Rafi','Suri','Tamsin'],
  Orc:['Baggi','Dren','Emen','Keth','Oona','Ront','Shura'],
  Tiefling:['Amity','Cinder','Ishri','Kairon','Merit','Vesper']
};
// Original fantasy name ideas with Indonesian-friendly spelling and cadence.
const indonesianNames={
  Dragonborn:['Arkana','Jagra','Sagara','Rembana','Naraka','Tarsana'],
  Dwarf:['Bara','Giri','Damar','Ratna','Arga','Ranu'],
  Elf:['Laras','Arunika','Ariani','Kiranaa','Seruni','Lembayung'],
  Gnome:['Tilik','Gatra','Tami','Wira','Luri','Lumu'],
  Goliath:['Bimara','Agara','Wisesa','Anggara','Gantara','Rangga'],
  Halfling:['Nala','Asri','Pipit','Tari','Rara','Kendi'],
  Human:['Nara','Lintang','Mira','Kirana','Bayu','Surya','Jati','Sari'],
  Orc:['Darsa','Jagru','Galang','Tarak','Barga','Karti'],
  Tiefling:['Niraya','Ratri','Jentara','Sembara','Kalira','Rasmi']
};
const indonesianSurnames=['Awanpagi','Arunika','Batutua','Bayangsenja','Bintangsurut','Daunperak','Emberang','Girimara',
  'Kabutrawa','Karangtimur','Kayuputih','Lentera','Matarana','Pagarhujan','Selaangin','Sungaisenja','Terasbulan','Wanasari'];
const surnames=['Amberwake','Ashford','Barrow','Brightbrook','Dawnmere','Fairwind','Fen','Flint','Glass','Hollow','Kestrel','Moonwell','Quill','Reed','Slate','Vale','Wintermark','Wren'];
const keepsakes=['A damaged compass','A tiny stone lion','An old theater ticket','A torn playing card','A silver thimble','A wooden fish','A broken quill','A brass whistle','A chipped teacup','A copper bead','An unsealed letter','A wax impression','A knotted cord','A crystal button','A piece of blue sea glass'];
const marks=['engraved with a name you do not recognize','that once belonged to your first friend','wrapped in faded red cloth','found beside an empty campfire','bearing an unfamiliar crest','stained with a single drop of ink','that you promised never to sell','marked with a tiny sun','repaired by someone you lost touch with'];
const looks=['Your traveling clothes have been carefully mended in several colors.','You have a distinctive crooked smile.','You wear an old cloak with a hand-sewn clasp.','Your hair is cut to stay out of your eyes on the road.','You keep your gear polished and neatly arranged.','Your voice is soft enough that people lean in to hear.','You wear a spare ribbon tied around one wrist.'];
const manner=['You tilt your head when you hear an unfamiliar name.','You study exits before choosing a seat.','You always carry something warm to offer a guest.','You often pause to sketch what you see.','You greet strangers as if they might become friends.'];
const habits=['Asks one extra question before committing.','Collects little stories from strangers.','Cracks a joke under pressure.','Keeps promises in a handwritten list.','Offers help before asking what it costs.','Uses names carefully and remembers them.'];
const bonds=['Feels responsible for a childhood friend.','Wants to prove themselves to a patient mentor.','Writes home often, even without a reply.','Owes a debt to a small community.','Carries a memory of a kindness they cannot repay.','Protects the people who stay behind.'];
const flaws=['Hesitates to ask for help.','Gets distracted by a good mystery.','Takes a harmless wager too seriously.','Tries to solve problems alone first.','Remembers slights longer than they mean to.','Promises too much when someone needs them.'];
