import { RNG } from './rng.js';

export const POI_TYPES = {
  ancient_ruins:     { name: 'Ancient Ruins',      icon: '🏛', threat: 2, lore: true,  color: '#c08040' },
  forgotten_temple:  { name: 'Forgotten Temple',   icon: '⛩', threat: 3, lore: true,  color: '#a060c0' },
  bandit_camp:       { name: 'Bandit Camp',         icon: '🏕', threat: 2, lore: false, color: '#c04040' },
  monster_lair:      { name: 'Monster Lair',        icon: '🐾', threat: 4, lore: false, color: '#802020' },
  hidden_cave:       { name: 'Hidden Cave',         icon: '🪨', threat: 2, lore: false, color: '#607050' },
  watchtower:        { name: 'Watchtower',          icon: '🗼', threat: 1, lore: false, color: '#6090b0' },
  graveyard:         { name: 'Graveyard',           icon: '⚰', threat: 2, lore: true,  color: '#708090' },
  shrine:            { name: 'Ancient Shrine',      icon: '🪬', threat: 1, lore: true,  color: '#60c090' },
  abandoned_village: { name: 'Abandoned Village',   icon: '🏚', threat: 2, lore: true,  color: '#907060' },
  wizard_tower:      { name: 'Wizard Tower',        icon: '🔮', threat: 3, lore: true,  color: '#7050d0' },
  battlefield:       { name: 'Battlefield Remains', icon: '⚔', threat: 1, lore: true,  color: '#806050' },
  merchant_camp:     { name: 'Merchant Camp',       icon: '🪙', threat: 0, lore: false, color: '#c0a030' },
  mine:              { name: 'Abandoned Mine',      icon: '⛏', threat: 2, lore: false, color: '#708070' },
  sacred_grove:      { name: 'Sacred Grove',        icon: '🌳', threat: 1, lore: true,  color: '#408040' },
  fortress_ruins:    { name: 'Ruined Fortress',     icon: '🏰', threat: 3, lore: true,  color: '#805040' },
};

const TERRAIN_POIS = {
  plains:    ['bandit_camp', 'merchant_camp', 'battlefield', 'ancient_ruins', 'shrine', 'abandoned_village'],
  forest:    ['monster_lair', 'hidden_cave', 'sacred_grove', 'abandoned_village', 'shrine', 'bandit_camp'],
  mountains: ['mine', 'hidden_cave', 'watchtower', 'fortress_ruins', 'monster_lair', 'ancient_ruins'],
  desert:    ['ancient_ruins', 'forgotten_temple', 'shrine', 'battlefield', 'abandoned_village', 'watchtower'],
  swamp:     ['graveyard', 'abandoned_village', 'wizard_tower', 'shrine', 'monster_lair', 'ancient_ruins'],
  coast:     ['watchtower', 'merchant_camp', 'shrine', 'ancient_ruins', 'bandit_camp', 'fortress_ruins'],
};

const POI_NAME_PREFIXES = {
  ancient_ruins:     ['The Shattered', 'The Sunken', 'The Broken', 'The Forgotten', 'The Ember'],
  forgotten_temple:  ['The Temple of', 'The Shrine of', 'The Sanctum of', 'The Hollow of'],
  bandit_camp:       ['The', 'Cutthroat', 'Iron Wolf', 'Scarred', 'Bleeding'],
  monster_lair:      ['The', 'The Black', 'The Crimson', 'The Bone', 'The Fetid'],
  hidden_cave:       ['The', 'The Deep', 'The Hollow', 'The Dark', 'The Wet'],
  watchtower:        ['The Old', 'The Broken', 'The Crumbled', 'The Rusted', 'The Sentinel'],
  graveyard:         ['The Unmarked', 'The Silent', 'The Ancient', 'The Forgotten', 'The Restless'],
  shrine:            ['The Mossy', 'The Cracked', 'The Ancient', 'The Hidden', 'The Weeping'],
  abandoned_village: ['The Hollow of', 'Old', 'The Ruins of', 'Desolate', 'Lost'],
  wizard_tower:      ['The Black', 'The Leaning', 'The Scorched', "The Mage's", 'The Tall'],
  battlefield:       ['The Fallen at', 'The Graves of', 'Bloodsoaked', 'The Silent', 'The Last'],
  merchant_camp:     ['The', 'Wandering', "The Trader's", 'The Roadside', 'Dusk'],
  mine:              ['The Old', 'The Deep', 'The Collapsed', 'The Haunted', 'The Iron'],
  sacred_grove:      ['The Ancient', 'The Whispering', 'The Hallowed', 'The Elder', 'The Moon'],
  fortress_ruins:    ['The Fallen', 'The Shattered', 'The Broken', 'The Crumbled', 'The Siege of'],
};

const POI_NAME_SUFFIXES = {
  ancient_ruins:     ['Hall', 'Citadel', 'Arch', 'Gate', 'Spire'],
  forgotten_temple:  ['the Ash', 'the Flame', 'the Stone', 'the Tide', 'the Dark'],
  bandit_camp:       ['Ravine', 'Camp', 'Hollow', 'Crossing', 'Ford'],
  monster_lair:      ['Cave', 'Den', 'Warren', 'Hollow', 'Pit'],
  hidden_cave:       ['Cave', 'Grotto', 'Cavern', 'Hollow', 'Gap'],
  watchtower:        ['Tower', 'Post', 'Keep', 'Spire', 'Watch'],
  graveyard:         ['Hill', 'Field', 'Rest', 'Ground', 'Moor'],
  shrine:            ['Stone', 'Altar', 'Idol', 'Grove', 'Spring'],
  abandoned_village: ['Crossing', 'Mill', 'Ford', 'Heath', 'Hollow'],
  wizard_tower:      ['Tower', 'Spire', 'Pinnacle', 'Needle', 'Turret'],
  battlefield:       ['Ridge', 'Vale', 'Cross', 'Ford', 'Field'],
  merchant_camp:     ['Market', 'Stop', 'Post', 'Crossing', 'Camp'],
  mine:              ['Shaft', 'Dig', 'Lode', 'Tunnel', 'Vein'],
  sacred_grove:      ['Grove', 'Glade', 'Wood', 'Copse', 'Hollow'],
  fortress_ruins:    ['Keep', 'Hold', 'Bastion', 'Garrison', 'Rampart'],
};

const LORE_ENTRIES = {
  ancient_ruins: [
    { title: 'Crumbling Inscription', text: 'The stone reads: "Here stood the First City of the Ember Age, before the Long Night swallowed its light. Remember us."' },
    { title: 'Mosaic Floor', text: 'Beneath centuries of dust, a mosaic depicts a great army marching under two moons. Ashfall has only one.' },
    { title: 'Collapsed Vault', text: 'Amid the rubble, a sealed ledger. The last entry tallies grain shipments for a population of 80,000 — more than live in the entire world today.' },
  ],
  forgotten_temple: [
    { title: 'Temple Codex Fragment', text: 'The text speaks of the Ashwalkers — wandering priests who carried a dying god\'s flame through the wilderness for a hundred years.' },
    { title: 'Ritual Chamber', text: 'The altar stone is stained black. Whatever was offered here was offered often. Strange that the stain is still warm to the touch.' },
  ],
  graveyard: [
    { title: 'Mass Grave Marker', text: 'A wooden post reads: "Year 112. The Plague of Whispers. 300 souls. Unnamed." The wood is strangely warm to the touch.' },
    { title: 'Carved Headstone', text: '"She who held the gate." No name. No date. Just those five words, and a carving of a woman with a spear.' },
  ],
  battlefield: [
    { title: 'Rusted Standard', text: 'The device is a black wolf on silver — the Ironmoor Wardens, a faction that no longer exists.' },
    { title: 'Burial Cairn', text: 'Under the cairn: a sword, a child\'s shoe, and a letter that has long since become unreadable. Some cairns mark victory. Some mark something else.' },
  ],
  shrine: [
    { title: 'Votive Offering', text: 'Someone left a fresh coin and fresh flowers at this ancient shrine within the last day. You are not alone in these lands.' },
    { title: 'Stone Prayer Wheel', text: 'The names of a hundred petitioners are scratched into the wheel. The oldest ones ask for rain. The most recent ask for forgiveness.' },
  ],
  sacred_grove: [
    { title: 'Carved Tree', text: 'Dozens of names are carved into the heartwood going back four centuries. The newest one reads: "Lyra. She came back."' },
    { title: 'Still Pool', text: 'The water reflects your face, then something behind you. When you turn, nothing is there. The reflection shows it still watching.' },
  ],
  wizard_tower: [
    { title: 'Partially Burned Journal', text: 'The legible pages describe experiments binding elemental spirits to mortal vessels. The final entry is a single word: "It worked."' },
    { title: 'Enchanted Mirror', text: 'The mirror shows not your reflection but a dark library. A robed figure in the mirror looks up, meets your eyes, and smiles.' },
  ],
  abandoned_village: [
    { title: 'Village Notice Board', text: 'A weathered notice: "Evacuation order — leave now, take only what you can carry. Do not look at the sky after the third bell."' },
    { title: 'Child\'s Drawing', text: 'Pinned to a wall: a child\'s drawing of their family. Below the figures, a large dark shape. They labeled it "the quiet one."' },
  ],
  fortress_ruins: [
    { title: 'Commander\'s Log', text: 'Final entry: "The siege has lasted sixty days. No relief comes. I have ordered the gates sealed from the inside. We will not let them in."' },
    { title: 'Garrison Records', text: 'The muster lists 400 defenders. The burial records list 22. The remaining 378 are not accounted for by either document.' },
  ],
};

const POI_DESCRIPTIONS = {
  ancient_ruins:     ['The crumbling foundations of a structure older than memory. What once stood here is difficult to imagine.', 'Weathered stone arches rise from encroaching vegetation. Runes line the walls in a script no scholar can read.'],
  forgotten_temple:  ['A temple to a god with no name. The altar is intact. Someone has been leaving offerings here recently.', 'Columns mark the entrance to a collapsed nave. Something about this place unsettles your bones.'],
  bandit_camp:       ['The smoke of campfires. Scattered equipment. This camp is active — and the occupants would not welcome visitors.', 'A rough encampment with lookout posts and sharpened stakes. Dangerous people live here.'],
  monster_lair:      ['Bones, claw marks, and a smell that makes you want to leave quickly. Something large lives here.', 'The entrance to a den. The tracks around it belong to something you would prefer not to meet.'],
  hidden_cave:       ['A narrow opening in the rock face, almost invisible from the road. Hard to find — which may be why someone else already did.', 'A cave entrance partially concealed by vegetation. Cool air drifts from inside.'],
  watchtower:        ['A crumbling tower still tall enough to offer a view of the surrounding land. It has not been staffed in a long time.', 'The old watchtower leans slightly but holds. Someone has left supplies at its base.'],
  graveyard:         ['Unmarked graves in uneven rows. Whatever happened here, the dead were buried in a hurry.', 'A small graveyard fenced with rotted timber. Some of the graves are very old. Some are not.'],
  shrine:            ['A small stone shrine surrounded by offerings — coins, flowers, carved tokens. The god it honors is not clearly named.', 'This wayside shrine is tended despite its remoteness. The offerings are fresh.'],
  abandoned_village: ['Empty houses with doors standing open. Whatever drove the inhabitants away, they left everything behind.', 'A village that could not have been empty for long — yet feels as though it has been empty for centuries.'],
  wizard_tower:      ['A narrow tower scorched black at its summit. The door is sealed with something that resists mundane tools.', 'A mage once worked here. The experiments that ended that arrangement are unclear, but the residue is visible.'],
  battlefield:       ['Rusted weapons and shattered shields half-buried in the earth. Crows still circle this place.', 'The ground is too flat here — it was leveled for battle. The scars of that day are still visible.'],
  merchant_camp:     ['A traveling merchant\'s camp, well-stocked and welcoming. A rare sight on these roads.', 'Colorful trade banners and the smell of cooking. A small merchant operation has set up here temporarily.'],
  mine:              ['The entrance to an old mine, shored up with timber that has seen better centuries. Something still moves inside.', 'Carts and tools rust outside this collapsed mine entrance. The vein it tapped is still rich, according to old maps.'],
  sacred_grove:      ['Trees so old they predate any settlement in this region. The silence here is different from ordinary silence.', 'A glade where the light falls strangely and the air smells of something ancient and green.'],
  fortress_ruins:    ['What was once a formidable keep now stands as broken walls and filled-in moats. It fell hard.', 'The outline of a fortress. Whatever force took it did not spare the structure.'],
};

function pickRng(arr, rng) {
  return arr[rng.int(0, arr.length - 1)];
}

function generatePOIName(typeId, rng) {
  const prefixes = POI_NAME_PREFIXES[typeId] || ['The'];
  const suffixes = POI_NAME_SUFFIXES[typeId] || ['Place'];
  return `${pickRng(prefixes, rng)} ${pickRng(suffixes, rng)}`;
}

function generatePOIDescription(typeId, rng) {
  const descs = POI_DESCRIPTIONS[typeId] || ['An unusual location.'];
  return pickRng(descs, rng);
}

function pickLoreEntry(typeId, rng) {
  const entries = LORE_ENTRIES[typeId];
  if (!entries?.length) return null;
  return { ...pickRng(entries, rng), source: typeId };
}

function generatePOIRewards(threat, rng) {
  const goldBase = (threat + 1) * 20;
  return {
    gold: rng.int(goldBase, goldBase * 2),
    xp: (threat + 1) * 30,
    hasItem: rng.float() < 0.3 + threat * 0.1,
  };
}

export function generatePOIs(world, rng) {
  const pois = [];
  let id = 0;
  for (const region of world.regions) {
    if (region.terrain === 'ocean') continue;
    const density = 0.30 + region.dangerLevel * 0.06;
    if (rng.float() > density) continue;
    const pool = TERRAIN_POIS[region.terrain] || TERRAIN_POIS.plains;
    const typeId = pickRng(pool, rng);
    const typeDef = POI_TYPES[typeId];
    if (!typeDef) continue;
    pois.push({
      id: `poi_${id++}`,
      type: typeId,
      name: generatePOIName(typeId, rng),
      icon: typeDef.icon,
      color: typeDef.color,
      description: generatePOIDescription(typeId, rng),
      regionX: region.x,
      regionY: region.y,
      threatLevel: Math.min(5, typeDef.threat + Math.floor(region.dangerLevel / 2)),
      discovered: false,
      loreEntry: typeDef.lore ? pickLoreEntry(typeId, rng) : null,
      rewards: generatePOIRewards(typeDef.threat, rng),
    });
  }
  return pois;
}

export function getPOIsForRegion(pois, regionX, regionY) {
  return (pois || []).filter(p => p.regionX === regionX && p.regionY === regionY);
}
