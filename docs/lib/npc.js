const names=['Mera Fen','Orren Flint','Tamsin Vell','Caro Wick','Edda Quill','Noll Ash','Dana Amber','Rasil Turn','Aren Cove','Joss Vane','Vesha Morrow','Ona Light','Tal Orin','Pell Reed','Mara Still','Anwen Moor'];
const traits=['polishes a brass button when thinking','speaks in short questions','whispers the last word of each warning','interrupts with a brisk apology','pauses to listen for footsteps','wanders into metaphors when nervous','draws out each name as if tasting it','makes quiet jokes instead of answering directly','speaks calmly until interrupted','stops mid-sentence to write things down'];
const secrets=['hid an unsigned contract under the third stair','recognized the missing guest by their handwriting','owes a debt to someone who died last winter','gave yesterday’s visitor the wrong key on purpose','is keeping a disputed inheritance safe for its owner','knows why the river marker was moved','once lent their coat to the person everyone is looking for','receives letters addressed to a different name'];
const roles={
  Innkeeper:{
    look:['an ink-stained apron and silver spectacles','a leather vest with one bright red patch'],
    want:['find a witness to a theft before closing','move a stranded guest somewhere discreet'],
    fear:['the watch will seize the guest ledger','someone will find the cellar key'],
    twist:['sells rumors but keeps every promise made at the table','dislikes strangers yet keeps a free room for travelers'],
    line:['“Can you stay until the last table leaves?”','“Tell me which name they signed.”']
  },
  Courier:{
    look:['mended boots and a waxed canvas satchel','a ribbon-tied coat and a torn glove'],
    want:['find someone to witness a delivery','trade for a route that avoids the bridge'],
    fear:['another courier will arrive with a duplicate package','the seal has already been opened'],
    twist:['boasts about speed but always stops to help lost people','insists on signatures and cannot read them'],
    line:['“Have we met, or does someone want me to think so?”','“There was one address on this when I left.”']
  },
  Archivist:{
    look:['a charcoal smudge on each cuff','a weathered coat pinned with a plain copper ring'],
    want:['recover an entry that vanished from the index','compare two copies of a municipal record'],
    fear:['a family member is named in the missing entry','someone will close the archive for an inventory'],
    twist:['guards the catalogue but lends rare books to careful readers','demands proof of everything and keeps a book of local rumors'],
    line:['“Did you bring witnesses, or evidence?”','“The date is right. That’s the problem.”']
  }
};
const additional={
  Guide:['a weathered hood','mark a bypass on a sketch map','fresh tracks lead the wrong way','never crosses running water after dark','Which route do you think they used?'],
  Healer:['linen sleeves rolled up to the elbow','find a steady hand to help in the infirmary','their reliable supplies have stopped arriving','treats strangers first and forgets their own meals','Can you hold the light steady?'],
  Merchant:['a braided cord of sample beads','sell or trade for something a customer needs','someone will dispute a signed receipt','haggles over everything except food for travelers','Show me what you have to trade.'],
  Guard:['a coat with one shoulder carefully patched','get an account of what happened on the night shift','the wrong witness will be blamed','follows procedure but lends people their own lantern','Where were you when the bell sounded?'],
  Artisan:['a tool apron with several empty loops','finish a commission before a rival sees it','their favorite apprentice will leave','rejects lavish gifts but keeps every sketch','Do you want something beautiful or something that lasts?'],
  Sailor:['sun-faded cuffs and a set of knotted cords','find a crewmate before the tide turns','someone tampered with the manifest','cantankerous on deck and gentle with frightened passengers','How well do you know these waters?']
};
for(const [name,[look,want,fear,twist,line]] of Object.entries(additional)) {
  roles[name]={look:[look,'a heavy coat with a mismatched clasp','well-worn gloves and immaculate boots'],
    want:[want,'find someone discreet to explain an unsigned note','get a second opinion about an unexpected visitor'],
    fear:[fear,'an old friend will recognize them','they have waited too long to tell the truth'],
    twist:[twist,'is generous with strangers but guarded around old friends','collects local stories yet refuses to tell their own'],
    line:['“'+line+'”','“I didn’t expect anyone to ask about that.”','“I can explain, if you have a minute.”']};
}
export const npcRoles=Object.keys(roles);

function pick(list,key) {
  let hash=2166136261;
  for (const char of key) hash=Math.imul(hash^char.codePointAt(0),16777619);
  return list[(hash>>>0)%list.length];
}
export function contact(seed,role,reroll=0,locks={}) {
  if(!Object.hasOwn(roles,role)) role='Innkeeper';
  const fields={name:names, appearance:roles[role].look, voice:traits, immediateWant:roles[role].want,
    fear:roles[role].fear, contradiction:roles[role].twist, openingLine:roles[role].line, secret:secrets};
  return {version:'1',seed,role,reroll,fields:Object.fromEntries(Object.entries(fields).map(([key,options])=>
    [key,locks[key]??pick(options,JSON.stringify(['1',seed,role,key,reroll]))]))};
}
