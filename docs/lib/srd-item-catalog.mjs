/**
 * SRD 5.2.1 carrying-load equipment index, not a complete item-mechanics compendium.
 * Weight source: official SRD 5.2.1, printed pp. 91-96; Bag of Holding p. 212.
 * Missing/dash entries remain null, NEVER 0. Ammunition bundles are explicitly labelled.
 * In particular an equipment PACK is a weighed bundle, not an empty container.
 * CC BY 4.0 attribution in ../NOTICE. All ids preserved from v0.25.14.
 */
const TABLE = `
# Weapons: SRD printed p.91
club|Club|2|weapon|91
dagger|Dagger|1|weapon|91
greatclub|Greatclub|10|weapon|91
handaxe|Handaxe|2|weapon|91
javelin|Javelin|2|weapon|91
light-hammer|Light Hammer|2|weapon|91
mace|Mace|4|weapon|91
quarterstaff|Quarterstaff|4|weapon|91
sickle|Sickle|2|weapon|91
spear|Spear|3|weapon|91
dart|Dart|0.25|weapon|91
light-crossbow|Light Crossbow|5|weapon|91
shortbow|Shortbow|2|weapon|91
sling|Sling|?|weapon|91
battleaxe|Battleaxe|4|weapon|91
flail|Flail|2|weapon|91
glaive|Glaive|6|weapon|91
greataxe|Greataxe|7|weapon|91
greatsword|Greatsword|6|weapon|91
halberd|Halberd|6|weapon|91
lance|Lance|6|weapon|91
longsword|Longsword|3|weapon|91
maul|Maul|10|weapon|91
morningstar|Morningstar|4|weapon|91
pike|Pike|18|weapon|91
rapier|Rapier|2|weapon|91
scimitar|Scimitar|3|weapon|91
shortsword|Shortsword|2|weapon|91
trident|Trident|4|weapon|91
warhammer|Warhammer|5|weapon|91
war-pick|War Pick|2|weapon|91
whip|Whip|3|weapon|91
blowgun|Blowgun|1|weapon|91
hand-crossbow|Hand Crossbow|3|weapon|91
heavy-crossbow|Heavy Crossbow|18|weapon|91
longbow|Longbow|2|weapon|91
musket|Musket|10|weapon|91
pistol|Pistol|3|weapon|91
# Armor: SRD printed p.92
padded-armor|Padded Armor|8|armor|92
leather-armor|Leather Armor|10|armor|92
studded-leather-armor|Studded Leather Armor|13|armor|92
hide-armor|Hide Armor|12|armor|92
chain-shirt|Chain Shirt|20|armor|92
scale-mail|Scale Mail|45|armor|92
breastplate|Breastplate|20|armor|92
half-plate-armor|Half Plate Armor|40|armor|92
ring-mail|Ring Mail|40|armor|92
chain-mail|Chain Mail|55|armor|92
splint-armor|Splint Armor|60|armor|92
plate-armor|Plate Armor|65|armor|92
shield|Shield|6|armor|92
# Adventuring gear table: SRD printed p.95. Unknown and variable generic entries omitted, except named unknowns.
acid|Acid|1|gear|95
alchemists-fire|Alchemist's Fire|1|gear|95
antitoxin|Antitoxin|?|gear|95
backpack|Backpack|5|container|95
ball-bearings|Ball Bearings (Bag)|2|gear|95
barrel|Barrel|70|container|95
basket|Basket|2|container|95
bedroll|Bedroll|7|gear|95
bell|Bell|?|gear|95
blanket|Blanket|3|gear|95
block-and-tackle|Block and Tackle|5|gear|95
book|Book|5|gear|95
glass-bottle|Bottle, Glass|2|container|95
bucket|Bucket|2|container|95
burglars-pack|Burglar's Pack (Complete)|42|bundle|95
caltrops|Caltrops (Bag)|2|gear|95
candle|Candle|?|gear|95
crossbow-bolt-case|Case, Crossbow Bolt|1|container|95
map-scroll-case|Case, Map or Scroll|1|container|95
chain|Chain|10|gear|95
chest|Chest|25|container|95
climbers-kit|Climber's Kit|12|gear|95
fine-clothes|Clothes, Fine|6|gear|95
travelers-clothes|Clothes, Traveler's|4|gear|95
component-pouch|Component Pouch|2|container|95
costume|Costume|4|gear|95
crowbar|Crowbar|5|gear|95
diplomats-pack|Diplomat's Pack (Complete)|39|bundle|95
dungeoneers-pack|Dungeoneer's Pack (Complete)|55|bundle|95
entertainers-pack|Entertainer's Pack (Complete)|58.5|bundle|95
explorers-pack|Explorer's Pack (Complete)|55|bundle|95
flask|Flask|1|container|95
grappling-hook|Grappling Hook|4|gear|95
healers-kit|Healer's Kit|3|gear|95
holy-water|Holy Water|1|gear|95
hunting-trap|Hunting Trap|25|gear|95
ink|Ink|?|gear|95
ink-pen|Ink Pen|?|gear|95
jug|Jug|4|container|95
ladder|Ladder|25|gear|95
lamp|Lamp|1|gear|95
bullseye-lantern|Lantern, Bullseye|2|gear|95
hooded-lantern|Lantern, Hooded|2|gear|95
lock|Lock|1|gear|95
magnifying-glass|Magnifying Glass|?|gear|95
manacles|Manacles|6|gear|95
map|Map|?|gear|95
mirror|Mirror|0.5|gear|95
net|Net|3|gear|95
oil|Oil|1|gear|95
paper|Paper|?|gear|95
parchment|Parchment|?|gear|95
perfume|Perfume|?|gear|95
basic-poison|Poison, Basic|?|gear|95
pole|Pole|7|gear|95
iron-pot|Pot, Iron|10|gear|95
potion-of-healing|Potion of Healing|0.5|gear|95
pouch|Pouch|1|container|95
priests-pack|Priest's Pack (Complete)|29|bundle|95
quiver|Quiver|1|container|95
portable-ram|Ram, Portable|35|gear|95
rations|Rations (One Day)|2|gear|95
robe|Robe|4|gear|95
rope|Rope|5|gear|95
sack|Sack|0.5|container|95
scholars-pack|Scholar's Pack (Complete)|22|bundle|95
shovel|Shovel|5|gear|95
signal-whistle|Signal Whistle|?|gear|95
spell-scroll-cantrip|Spell Scroll (Cantrip)|?|gear|95
spell-scroll-level-1|Spell Scroll (Level 1)|?|gear|95
iron-spikes|Spikes, Iron (10)|5|gear|95
spyglass|Spyglass|1|gear|95
string|String|?|gear|95
tent|Tent|20|gear|95
tinderbox|Tinderbox|1|gear|95
torch|Torch|1|gear|95
vial|Vial|?|container|95
waterskin-full|Waterskin (Full)|5|container|95
# Ammunition table p.96. Bundle weight DOES NOT include separately purchased storage.
arrows-20|Arrows (20)|1|ammo-bundle|96
bolts-20|Crossbow Bolts (20)|1.5|ammo-bundle|96
firearm-bullets-10|Firearm Bullets (10)|2|ammo-bundle|96
sling-bullets-20|Sling Bullets (20)|1.5|ammo-bundle|96
needles-50|Blowgun Needles (50)|1|ammo-bundle|96
# Explicit per-projectile calculated from bundle weights; compatible with individual ammunition tracking.
arrow|Arrow (Single, derived)|0.05|ammunition|96
bolt|Crossbow Bolt (Single, derived)|0.075|ammunition|96
firearm-bullet|Firearm Bullet (Single, derived)|0.2|ammunition|96
sling-bullet|Sling Bullet (Single, derived)|0.075|ammunition|96
blowgun-needle|Blowgun Needle (Single, derived)|0.02|ammunition|96
# Arcane Focus table p.96
arcane-crystal|Arcane Focus, Crystal|1|focus|96
arcane-orb|Arcane Focus, Orb|3|focus|96
arcane-rod|Arcane Focus, Rod|2|focus|96
arcane-staff|Arcane Focus, Staff (also Quarterstaff)|4|focus|96
arcane-wand|Arcane Focus, Wand|1|focus|96
# Druidic Focus examples p.97
druidic-sprig|Druidic Focus, Sprig of Mistletoe|?|focus|97
druidic-wooden-staff|Druidic Focus, Wooden Staff (also Quarterstaff)|4|focus|97
# Artisan's tools and kits pp.93-94
alchemists-supplies|Alchemist's Supplies|8|tool|93
brewers-supplies|Brewer's Supplies|9|tool|93
calligraphers-supplies|Calligrapher's Supplies|5|tool|93
carpenters-tools|Carpenter's Tools|6|tool|93
cartographers-tools|Cartographer's Tools|6|tool|93
cobblers-tools|Cobbler's Tools|5|tool|93
cooks-utensils|Cook's Utensils|8|tool|93
glassblowers-tools|Glassblower's Tools|5|tool|93
jewelers-tools|Jeweler's Tools|2|tool|93
leatherworkers-tools|Leatherworker's Tools|5|tool|93
masons-tools|Mason's Tools|8|tool|93
painters-supplies|Painter's Supplies|5|tool|93
potters-tools|Potter's Tools|3|tool|93
smiths-tools|Smith's Tools|8|tool|93
tinkers-tools|Tinker's Tools|10|tool|94
weavers-tools|Weaver's Tools|5|tool|94
woodcarvers-tools|Woodcarver's Tools|5|tool|94
disguise-kit|Disguise Kit|3|tool|94
forgery-kit|Forgery Kit|5|tool|94
herbalism-kit|Herbalism Kit|3|tool|94
navigators-tools|Navigator's Tools|2|tool|94
poisoners-kit|Poisoner's Kit|2|tool|94
thieves-tools|Thieves' Tools|1|tool|94
# Instruments pp.94
bagpipes|Bagpipes|6|instrument|94
drum|Drum|3|instrument|94
dulcimer|Dulcimer|10|instrument|94
flute|Flute|1|instrument|94
horn|Horn|2|instrument|94
lute|Lute|2|instrument|94
lyre|Lyre|2|instrument|94
pan-flute|Pan Flute|2|instrument|94
shawm|Shawm|1|instrument|94
viol|Viol|1|instrument|94
# Magic item p.212
bag-of-holding|Bag of Holding|5|container|212
`;

// Canonical SRD item names must remain English in both UI languages.
// nameId is a deprecated, read-only compatibility alias for older consumers;
// deliberately not a separate translated label.
const containerProperties = Object.freeze({
 backpack:{contentCapacityLb:30,contentVolumeCubicFt:1},
 basket:{contentCapacityLb:40,contentVolumeCubicFt:2},
 barrel:{contentVolumeCubicFt:4}, // dry goods; liquid limit is separately 40 gallons
 bucket:{contentVolumeCubicFt:0.5},
 chest:{contentVolumeCubicFt:12},
 'bag-of-holding':{contentCapacityLb:500,contentVolumeCubicFt:64,extradimensional:true}
});
const rows=TABLE.split('\n').map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));
const entries=rows.map(row=>{
  const parts=row.split('|');
  if(parts.length!==5)throw new Error(`bad SRD row ${row}`);
  const [slug,name,rawWeight,type,sourcePage]=parts;
  const id=`srd521:${slug}`;
  const weightLb=rawWeight==='?'?null:Number(rawWeight);
  if(!Number.isInteger(Number(sourcePage))||weightLb!==null&&(!Number.isFinite(weightLb)||weightLb<0))throw new Error(`bad SRD weight ${row}`);
  const spec={name,nameId:name,weightLb,type,sourcePage:Number(sourcePage),
    translationReviewed:true,...containerProperties[slug]};
  return [id,Object.freeze(spec)];
});
if(new Set(entries.map(([id])=>id)).size!==entries.length)throw new Error('duplicate SRD catalogue identifiers');
export const SRD_ITEMS=Object.freeze(Object.fromEntries(entries));
export const SRD_ITEM_COUNT=entries.length;
export const SRD_CATALOG_PROVENANCE=Object.freeze({source:'SRD 5.2.1',license:'CC BY 4.0',
  url:'https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf',
  unit:'lb',status:'audited-weight-only-candidate; not live GwenTable integration'});
