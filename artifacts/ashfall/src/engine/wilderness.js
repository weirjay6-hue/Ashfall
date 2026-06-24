const TERRAIN_LANDMARKS = {
  plains: [
    ['The Standing Stone', 'A single weathered monolith rises from the grass, covered in faded carvings of a war no one remembers.'],
    ['The Broken Barrow', 'An ancient burial mound, half-collapsed, opens into a dark passage. Old iron spearheads ring the entrance.'],
    ['Crossroads Shrine', 'A crumbling stone shrine stands at an overgrown crossroads. Offerings of bone and dried flowers cover its base.'],
    ['The Old Watchtower', 'A crumbled watchtower offers a view of the surrounding land. Its flags have rotted to threads.'],
    ['Widow\'s Field', 'A field of tall grass where an old farmstead burned long ago. Bones and melted nails in the foundation.'],
    ['The Pilgrim\'s Rest', 'A carved stone bench beside a worn road, smoothed by centuries of tired travelers.'],
    ['Twin Cairns', 'Two stacked-stone cairns stand facing each other across a narrow gap. A chain once connected them — links still hang from each.'],
    ['The Sunken Road', 'A road that has sunk three feet below the surrounding field. Old enough that trees grow from its edges.'],
  ],
  forest: [
    ['The Witch\'s Hollow', 'A clearing where the trees grow in a perfect circle, leaving a dark hollow at the center. The soil is black and soft.'],
    ['The Hanging Tree', 'An ancient oak from which old iron chains still dangle. No bodies remain — just the chains, and the silence.'],
    ['The Druid\'s Ring', 'Seven standing stones overgrown with moss, radiating a faint warmth even in rain.'],
    ['The Woodcutter\'s Ruin', 'A collapsed logging camp, tools still scattered across the ground. The last entry in a pocket journal reads: "They came at dusk."'],
    ['The Silent Pool', 'A forest pool of perfectly still black water. Nothing lives in or around it. Your reflection looks wrong.'],
    ['The Root Cathedral', 'Ancient trees have grown together overhead, creating a vaulted chamber of living wood. Candles, long dead, line the roots.'],
    ['The Marked Trees', 'A path of trees each carved with the same symbol — a circle with three lines. The carving is very old. And very fresh.'],
    ['The Ash Grove', 'A grove of ash trees, all dead, all standing. No wind moves them. Blackened bark that smells of old fire.'],
  ],
  mountains: [
    ['The Frozen Throne', 'A seat carved into a mountain spur, oriented to watch the valley. Who sat here, and when, is unknown.'],
    ['The Shattered Gate', 'Two massive stone pillars mark the entrance to something long demolished. The stonework is not local.'],
    ['The Eagle\'s Eyrie', 'A high ledge overlooking the valleys below. An old camp. Boot prints in the stone dust, recently pressed.'],
    ['The Collapsed Mine', 'An old mine entrance, long caved in. Cold air still drifts out. Something made the original collapse from inside.'],
    ['The Mountain Tomb', 'A square-cut opening in the rock face, sealed with stones that someone has pried loose from within.'],
    ['The Ice Mirror', 'A glacial pool of clear water that reflects the sky even on overcast days. Objects thrown in are not recovered.'],
    ['The Forge-Ruins', 'The remains of a forge, built at altitude for some old purpose. The bellows are ash. The anvil is missing.'],
    ['The Cairn Road', 'A road of stone cairns ascending the peak. The highest cairns are taller and older, cairns built by giants or men standing on the shoulders of other men.'],
  ],
  desert: [
    ['The Glass Pillar', 'A shaft of fused sand, taller than a man, formed by lightning or something hotter. The center is still warm.'],
    ['The Bleached Ruin', 'Sun-bleached walls of a structure whose purpose is impossible to determine. The floor is clean.'],
    ['The Dry Well', 'A stone well with no water — but the bucket is new and recently wet.'],
    ['The Bone Road', 'A path marked with animal skulls on stakes. Built recently. Something built it for someone approaching from the north.'],
    ['The Sand Mausoleum', 'A half-buried structure, entrance open. Wind moves the dust inside. Footprints lead in. None lead out.'],
    ['The Oasis Trap', 'A pool of fresh water surrounded by the bones of animals. The water smells of sulfur. The ripple has no source.'],
    ['The Sunken Circle', 'A ring of stones pressed two feet into the sand, as if the earth swallowed them slowly over centuries.'],
    ['The Caravan Grave', 'Bleached wagon wheels and scattered cargo from a caravan that stopped here and never moved again.'],
  ],
  swamp: [
    ['The Sunken Temple', 'Stone columns rising from black water, carved with faces that have no eyes and mouths open in silence.'],
    ['The Witch\'s Barge', 'A rotting flat-bottomed boat, permanently moored at an invisible dock. Smoke still rises from its chimney.'],
    ['The Drowning Stone', 'A flat rock where iron chains are bolted. The iron is new. The stone is very old and very smooth.'],
    ['The Dead Grove', 'Leafless trees in a perfect circle, all facing inward. The ground between them is bare and warm.'],
    ['The Fog Altar', 'A low stone altar half-submerged, covered in offerings — coins, feathers, locks of hair still bound.'],
    ['The Sinking Fort', 'A small fortification slowly vanishing into the bog. One tower still stands. A light moves inside at night.'],
    ['The Peat Idol', 'A figure pressed from peat, man-sized and man-shaped, standing at the water\'s edge. Not old.'],
    ['The Black Mill', 'A watermill with no water source. The wheel turns anyway, slowly, in the wrong direction.'],
  ],
  coast: [
    ['The Shipwreck Shore', 'The bleached ribs of a wrecked vessel, cargo long rotted. A name is still visible on the prow: HESPER.'],
    ['The Fisherman\'s Watch', 'A wooden platform on stilts over the water. A lantern still hangs there, lit, with oil.'],
    ['The Sea Cave', 'A cave accessible at low tide, walls covered in carvings left by many hands over many centuries.'],
    ['The Drowned Market', 'Stone stalls from an old trading post, now half-submerged at high tide. Fish still swim through the stalls.'],
    ['The Lighthouse Ruin', 'A collapsed lighthouse. The lens mechanism still works somehow, sweeping the sea in silence.'],
    ['The Corsair\'s Grave', 'A clearing where pirates were buried standing up, facing the sea. Some of the markers have been moved recently.'],
    ['The Tidal Pool', 'A pool cut by hand into the rock face, filled and emptied by tides. Offerings left on the rim.'],
    ['The Sea Arch', 'A stone arch carved by the sea, framing the horizon. Old rope grooves cut into the top — a signal station once.'],
  ],
  lake: [
    ['The Drowned Dock', 'Rotted pilings mark where a dock once stood. The boats are long gone — or sunken.'],
    ['The Fisher\'s Shrine', 'A small stone shrine to luck and the lake. Nets and fish bones hang from the eaves.'],
    ['The Reed Island', 'A small island of dense reeds, barely visible from shore. Smoke rises from it at dusk.'],
    ['The Glass Shore', 'The water here is still and perfectly clear. You can see the bottom — and something on it.'],
  ],
};

// -----------------------------------------------------------------------
// BIOME MOB ZONES — RuneScape/Endless Online style
// Each zone has a dangerMin/Max so only appropriate zones spawn per region
// -----------------------------------------------------------------------
const BIOME_MOB_ZONES = {
  plains: [
    { dangerMin: 1, dangerMax: 2, icon: '🐷', name: 'Wild Pig Pen',   enemy: 'boar',         desc: 'A group of feral pigs rooting through the grass. Dangerous when cornered.' },
    { dangerMin: 1, dangerMax: 2, icon: '🐔', name: 'Stray Chickens', enemy: 'chicken',      desc: 'Oversized chickens have escaped some ruined farmstead.' },
    { dangerMin: 1, dangerMax: 3, icon: '👺', name: 'Goblin Patch',   enemy: 'goblin',       desc: 'A small gang of goblins has set up camp in the tall grass.' },
    { dangerMin: 2, dangerMax: 4, icon: '⚔️', name: 'Bandit Outpost', enemy: 'bandit',       desc: 'Armed outlaws watch the road from a hastily built camp.' },
    { dangerMin: 3, dangerMax: 5, icon: '🗡️', name: 'Raider Camp',    enemy: 'bandit_leader',desc: 'A well-organized raider group — more professional than your average bandits.' },
  ],
  forest: [
    { dangerMin: 1, dangerMax: 2, icon: '🪲', name: 'Beetle Swarm',    enemy: 'beetle',       desc: 'Giant beetles click and skitter through the undergrowth.' },
    { dangerMin: 1, dangerMax: 3, icon: '🕷️', name: 'Spider Colony',   enemy: 'spider',       desc: 'Thick webs span between the trees. The spiders that made them are watching.' },
    { dangerMin: 2, dangerMax: 3, icon: '🐺', name: 'Wolf Pack',       enemy: 'wolf',         desc: 'A pack of wolves prowling through the trees, hunting in formation.' },
    { dangerMin: 2, dangerMax: 4, icon: '🐗', name: 'Boar Territory',  enemy: 'boar',         desc: 'Scarred and aggressive boars charge anything that moves near their rooting ground.' },
    { dangerMin: 3, dangerMax: 4, icon: '🐻', name: 'Bear\'s Range',   enemy: 'bear',         desc: 'A massive bear defends its territory with terrifying power.' },
    { dangerMin: 4, dangerMax: 5, icon: '👹', name: 'Forest Troll Bridge', enemy: 'troll',   desc: 'A hulking forest troll has claimed this part of the wood as its territory.' },
  ],
  mountains: [
    { dangerMin: 1, dangerMax: 2, icon: '🐐', name: 'Mountain Goats',  enemy: 'mountain_goat',desc: 'Wild mountain goats with vicious horns defending their rocky ledge.' },
    { dangerMin: 2, dangerMax: 3, icon: '🦅', name: 'Harpy Nest',      enemy: 'harpy',        desc: 'Winged creatures scream from rocky perches, diving at anything below.' },
    { dangerMin: 3, dangerMax: 4, icon: '🪨', name: 'Stone Golem Site',enemy: 'golem',        desc: 'Ancient stone constructs patrol this mountain pass as if still following old orders.' },
    { dangerMin: 3, dangerMax: 4, icon: '💀', name: 'Undead Barrow',   enemy: 'skeleton',     desc: 'Undead soldiers guard a barrow cut into the mountain face.' },
    { dangerMin: 4, dangerMax: 5, icon: '🐉', name: 'Dragon\'s Peak',  enemy: 'dragon',       desc: 'A dragon claims this peak. Its territory is marked by scorched stone and bones.' },
  ],
  desert: [
    { dangerMin: 1, dangerMax: 2, icon: '🦂', name: 'Scorpion Flat',   enemy: 'scorpion',     desc: 'The sand here is riddled with scorpion burrows. Step carefully.' },
    { dangerMin: 2, dangerMax: 3, icon: '🐍', name: 'Viper Pit',       enemy: 'viper',        desc: 'Sand vipers bask on sun-warmed rocks, striking without warning.' },
    { dangerMin: 2, dangerMax: 4, icon: '💀', name: 'Sand Mummy Tomb', enemy: 'mummy',        desc: 'A half-buried tomb vents dry air. The dead inside are not resting.' },
    { dangerMin: 3, dangerMax: 4, icon: '🌪️', name: 'Dust Elemental Vortex', enemy: 'elemental', desc: 'Swirling columns of sand walk these flats like living dust storms.' },
    { dangerMin: 4, dangerMax: 5, icon: '👁️', name: 'Ancient Guardian Ruins', enemy: 'construct', desc: 'A massive ancient construct guards these ruins. It has not forgotten its purpose.' },
  ],
  swamp: [
    { dangerMin: 1, dangerMax: 2, icon: '🐸', name: 'Giant Frog Bog',  enemy: 'giant_frog',   desc: 'Enormous frogs lurk in the mud, ambushing anything at the water\'s edge.' },
    { dangerMin: 2, dangerMax: 3, icon: '🐊', name: 'Crocodile Shallows', enemy: 'crocodile', desc: 'Huge crocodiles lie motionless in the black shallows. Only their eyes move.' },
    { dangerMin: 2, dangerMax: 3, icon: '🪱', name: 'Leech Pool',      enemy: 'swamp_leech',  desc: 'The water here writhes with giant leeches. They can drain a man dry.' },
    { dangerMin: 3, dangerMax: 4, icon: '🧟', name: 'Bog Zombie Mire', enemy: 'zombie',       desc: 'Shambling figures move through the mist. They haven\'t been alive for a long time.' },
    { dangerMin: 4, dangerMax: 5, icon: '🐍', name: 'Hydra Lair',      enemy: 'hydra',        desc: 'A multi-headed hydra claims this deep bog. Each head attacks independently.' },
  ],
  coast: [
    { dangerMin: 1, dangerMax: 2, icon: '🦀', name: 'Giant Crab Beach', enemy: 'giant_crab',  desc: 'Enormous crabs click their claws on the rocks, defending their stretch of beach.' },
    { dangerMin: 2, dangerMax: 3, icon: '🏴‍☠️', name: 'Pirate Cove',    enemy: 'pirate',       desc: 'A pirate crew has beached their ship here and made camp on the rocks.' },
    { dangerMin: 2, dangerMax: 3, icon: '🦈', name: 'Shark Shallows',  enemy: 'shark',        desc: 'The shallows here run red at low tide. Something large is hunting close to shore.' },
    { dangerMin: 3, dangerMax: 4, icon: '🐙', name: 'Kraken Tide Pool', enemy: 'sea_beast',   desc: 'Massive tentacles reach from a tidal pool large enough to swallow a boat.' },
    { dangerMin: 4, dangerMax: 5, icon: '🌊', name: 'Sea Elemental Cove', enemy: 'sea_elemental', desc: 'Water elementals walk the coast in the form of towering waves. They do not tolerate intruders.' },
  ],
  lake: [
    { dangerMin: 1, dangerMax: 2, icon: '🐟', name: 'Giant Fish Shoal', enemy: 'pike',       desc: 'Huge freshwater pike lurk in the shallows, snapping at anything within reach.' },
    { dangerMin: 2, dangerMax: 4, icon: '🐊', name: 'Lake Serpent Shallows', enemy: 'lake_serpent', desc: 'An enormous serpent coils just below the surface of the dark water.' },
    { dangerMin: 3, dangerMax: 5, icon: '👁️', name: 'Depths Watcher', enemy: 'lake_horror',  desc: 'Something ancient lives at the bottom of this lake. It is patient. It is awake.' },
  ],
};

// Classic encounter types (kept for fallback and non-combat nodes)
const ENCOUNTER_TYPES = {
  bandit_camp: {
    icon: '⚔️',
    namePool: ['Bandit Camp', 'Outlaw Den', 'Raider\'s Post', 'Brigand Camp', 'Cutthroat\'s Hollow'],
    descriptions: [
      'Makeshift tents and fire pits are arranged around a lookout post. Armed figures patrol the perimeter.',
      'A ring of wagons forms a rough fortification on a hillside. Lookouts watch the approach roads.',
      'Rope bridges between trees connect a high camp. Half a dozen armed figures visible within.',
    ],
    loot: ['gold', 'weapons', 'armor'],
    dangerMod: 1,
    interactionType: 'combat',
    enemyTemplate: 'bandit',
  },
  hermit_hut: {
    icon: '🏚️',
    namePool: ['Hermit\'s Hut', 'Old Recluse\'s Shelter', 'Woodsfolk\'s Cabin', 'The Stranger\'s House'],
    descriptions: [
      'A crude hut built from branches and mud. Smoke from a small fire. Someone watches from within.',
      'A small cabin with bundles of herbs drying under the eaves. Very quiet inside.',
      'A dugout shelter with a sod roof and a carved wooden door. Someone lives here — and wants to.',
    ],
    loot: ['herbs', 'potions', 'food'],
    dangerMod: -1,
    interactionType: 'explore',
    enemyTemplate: null,
  },
  ruined_camp: {
    icon: '🔥',
    namePool: ['Ruined Camp', 'Abandoned Post', 'Dead Campfire', 'Scattered Bivouac'],
    descriptions: [
      'A camp abandoned in a hurry. A cold fire, scattered belongings, a boot left behind.',
      'Burned tent poles and scattered supplies — signs of a sudden attack, or a sudden departure.',
      'An old camp, long empty, but with signs of recent visitors who did not stay long.',
    ],
    loot: ['food', 'tools', 'gold'],
    dangerMod: -1,
    interactionType: 'loot',
    enemyTemplate: null,
  },
  travelers_rest: {
    icon: '🛖',
    namePool: ['Wayfarers\' Shelter', 'Road Shrine Rest', 'Waystone Hollow', 'Traveler\'s Post'],
    descriptions: [
      'A simple shelter maintained by passing travelers. Dry wood inside, a hook for a lantern.',
      'A covered bench and fire pit at a trail junction, worn smooth by use.',
      'A stone shelter, old but maintained. Someone left dry kindling and a small prayer token.',
    ],
    loot: ['food', 'herbs', 'notes'],
    dangerMod: -2,
    interactionType: 'rest',
    enemyTemplate: null,
  },
};

const RESOURCE_TYPES = {
  plains: [
    { id: 'herbs', name: 'Wild Herb Patch', icon: '🌿', description: 'Clusters of medicinal plants grow in the open grassland, well-lit and accessible.', yield: 'healing_herb', count: [1, 3] },
    { id: 'mushrooms', name: 'Mushroom Ring', icon: '🍄', description: 'A ring of edible fungi in a sheltered hollow, large and well-established.', yield: 'food', count: [1, 2] },
    { id: 'clay', name: 'Clay Bank', icon: '🪨', description: 'A clay-rich riverbank, exposed by recent rain. Good material.', yield: 'materials', count: [1, 2] },
    { id: 'berries', name: 'Berry Hedgerow', icon: '🫐', description: 'Wild berries in a dense hedgerow — tart but filling and useful.', yield: 'food', count: [1, 3] },
  ],
  forest: [
    { id: 'herbs', name: 'Deepwood Herbs', icon: '🌿', description: 'Rare plants that only grow in deep shade, favored by alchemists.', yield: 'healing_herb', count: [2, 4] },
    { id: 'mushrooms', name: 'Forest Mushrooms', icon: '🍄', description: 'A cluster of large edible fungi growing from a fallen log.', yield: 'food', count: [2, 3] },
    { id: 'berries', name: 'Berry Thicket', icon: '🫐', description: 'Wild berries growing thick in a sun-gap, branches heavy.', yield: 'food', count: [1, 3] },
    { id: 'wood', name: 'Fallen Hardwood', icon: '🪵', description: 'An ancient fallen tree, dry and hard — exceptional timber.', yield: 'materials', count: [2, 4] },
  ],
  mountains: [
    { id: 'ore', name: 'Iron Ore Seam', icon: '⛏️', description: 'A vein of iron ore exposed by erosion, easy to chip away.', yield: 'ore', count: [1, 3] },
    { id: 'gems', name: 'Gem Pocket', icon: '💎', description: 'A small pocket of semi-precious stones in a cracked rock face.', yield: 'gems', count: [1, 2] },
    { id: 'herbs', name: 'Mountain Moss', icon: '🌿', description: 'High-altitude medicinal moss, valued by alchemists for its rarity.', yield: 'healing_herb', count: [1, 2] },
    { id: 'flint', name: 'Flint Bed', icon: '🪨', description: 'Good quality flint, useful for tools and reliable firestarting.', yield: 'materials', count: [2, 4] },
  ],
  desert: [
    { id: 'herbs', name: 'Desert Succulent', icon: '🌵', description: 'Drought-resistant plants with concentrated medicinal sap.', yield: 'healing_herb', count: [1, 2] },
    { id: 'gems', name: 'Sand Crystal', icon: '💎', description: 'Desert glass and raw crystals formed by ancient heat events.', yield: 'gems', count: [1, 2] },
    { id: 'salt', name: 'Salt Flat Deposit', icon: '⬜', description: 'A deposit of pure salt — valuable for preserving food on long roads.', yield: 'food', count: [2, 4] },
  ],
  swamp: [
    { id: 'herbs', name: 'Swamp Root', icon: '🌿', description: 'Rare swamp plants with strong alchemical properties, hard to source elsewhere.', yield: 'healing_herb', count: [2, 3] },
    { id: 'mushrooms', name: 'Bog Mushrooms', icon: '🍄', description: 'Unusual fungi growing from dark, still water. Strong flavor.', yield: 'food', count: [1, 2] },
    { id: 'peat', name: 'Peat Deposit', icon: '🟫', description: 'Rich peat — burns well, and preserves objects buried within it.', yield: 'materials', count: [1, 3] },
  ],
  coast: [
    { id: 'fish', name: 'Fishing Spot', icon: '🐟', description: 'Shallow tidal water teeming with fish, easy to wade in and catch.', yield: 'food', count: [2, 4] },
    { id: 'shells', name: 'Alchemical Shells', icon: '🐚', description: 'Unusual shells with alchemical properties, gathered by those who know.', yield: 'materials', count: [1, 3] },
    { id: 'herbs', name: 'Sea Herb Patch', icon: '🌿', description: 'Salt-tolerant medicinal plants growing on the cliff-face ledges.', yield: 'healing_herb', count: [1, 2] },
    { id: 'driftwood', name: 'Driftwood Cache', icon: '🪵', description: 'Useful timber washed ashore and dried by weeks of sun.', yield: 'materials', count: [2, 3] },
  ],
  lake: [
    { id: 'fish', name: 'Lake Fishing Spot', icon: '🎣', description: 'Clear freshwater lake, fish visible near the reedy shallows.', yield: 'food', count: [2, 4] },
    { id: 'herbs', name: 'Lakeside Herbs', icon: '🌿', description: 'Water-loving medicinal plants thriving near the lake shore.', yield: 'healing_herb', count: [1, 3] },
    { id: 'clay', name: 'Lake Clay Deposit', icon: '🪨', description: 'Fine clay from the lake bed, exposed at low water.', yield: 'materials', count: [2, 3] },
  ],
};

const CACHE_NAMES = [
  'Weathered Oilskin Bundle', 'Buried Iron Box', 'Hidden Satchel',
  'Loose Stone Hiding Spot', 'Waterproof Cache', 'Hollow Log Cache',
  'Stone Cairn with Hollow Base', 'Rusted Lock-Box', 'Traveler\'s Stash',
  'Merchant\'s Secret Hiding Spot', 'Soldier\'s Buried Kit', 'Hermit\'s Cache',
];

const LORE_FRAGMENTS = [
  ['stone inscription', 'The deep places remember what the surface forgets.'],
  ['weathered journal page', 'Day 43: The village is gone. I alone escaped the fog.'],
  ['carved wooden marker', 'Here fell Brennan of the Thornwood. He kept his word.'],
  ['iron plaque', 'This road was built by order of the Third Council, in the year of the Ashfall.'],
  ['burned letter fragment', '...do not go north. Whatever hunts in the Ashwood is not an animal...'],
  ['child\'s drawing scratched into rock', 'A crude figure with a circle of teeth around it. Offerings drawn beneath.'],
  ['old road sign', 'The destination name has been chiseled away. Only "BEWARE" remains.'],
  ['grave marker without name', 'BELOVED. FORGIVEN. TOO LATE.'],
  ['torn map fragment', 'A section of a larger map — this region is circled in red ink, with the word "AVOID".'],
  ['soldier\'s pocket diary', 'We were told the dungeon was cleared. It was not cleared.'],
  ['trade receipt', 'Receipt for one soul. Signed. The signature is illegible. The price is blank.'],
  ['carved door lintel', 'All who enter leave something behind.'],
];

const WANDERING_NPC_TYPES = [
  { occupation: 'wanderer', gender: 'npc', attitude: 'neutral', dialogue: ['I\'ve been walking since before dawn.', 'The road gets lonelier the further you go.', 'Seen anything strange ahead? I saw lights last night.'] },
  { occupation: 'peddler', gender: 'npc', attitude: 'friendly', dialogue: ['Wares for sale — not much, but it\'s quality.', 'Long road, short coin. Story of my life, friend.', 'You look like you could use supplies.'] },
  { occupation: 'outlaw', gender: 'npc', attitude: 'hostile', dialogue: ['Stand and deliver, traveler.', 'Your coin or your life.', 'The road has a toll today. Pay up.'] },
  { occupation: 'pilgrim', gender: 'female', attitude: 'friendly', dialogue: ['The shrine is just ahead, if that\'s where you\'re bound.', 'Walk in peace, stranger.', 'Have you seen any signs? The old gods speak through stone and wind.'] },
  { occupation: 'hunter', gender: 'npc', attitude: 'neutral', dialogue: ['Good hunting today.', 'Stay off the northern trail — something big moved through.', 'The deer are running. Something spooked them from the east.'] },
  { occupation: 'soldier', gender: 'npc', attitude: 'suspicious', dialogue: ['State your business on this road.', 'Keep moving. Nothing to see here.', 'Carry on, but stay to the road and don\'t stray.'] },
  { occupation: 'scholar', gender: 'female', attitude: 'friendly', dialogue: ['Have you seen any ruins nearby? I\'m cataloguing them.', 'Fascinating biome out here. Truly fascinating.', 'The old empire had a road through here once. You\'re standing on it.'] },
  { occupation: 'refugee', gender: 'female', attitude: 'neutral', dialogue: ['Please — is there a town nearby? Any town.', 'We were driven from our village three nights ago.', 'I just need to reach somewhere safe. Is anywhere safe?'] },
];

export function generateWilderness(region, rng) {
  const { terrain, dangerLevel, x, y } = region;

  const landmarkPool = TERRAIN_LANDMARKS[terrain] || TERRAIN_LANDMARKS.plains;
  const [landmarkName, landmarkDesc] = rng.pick(landmarkPool);

  // --- BIOME MOB ZONES (RuneScape style) ---
  // Filter mob zones appropriate for this biome + danger level
  const biomeMobs = BIOME_MOB_ZONES[terrain] || BIOME_MOB_ZONES.plains;
  const validMobs = biomeMobs.filter(m => dangerLevel >= m.dangerMin && dangerLevel <= m.dangerMax);

  const mobZones = [];
  const numMobZones = rng.int(1, Math.min(3, validMobs.length));
  const usedMobTypes = new Set();
  for (let i = 0; i < numMobZones && i < validMobs.length; i++) {
    let mob;
    let attempts = 0;
    do { mob = rng.pick(validMobs); attempts++; } while (usedMobTypes.has(mob.enemy) && attempts < 10);
    usedMobTypes.add(mob.enemy);
    mobZones.push({
      id: `mob_${x}_${y}_${i}`,
      type: 'mob_zone',
      interactionType: 'combat',
      enemyTemplate: mob.enemy,
      icon: mob.icon,
      name: mob.name,
      description: mob.desc,
      lootTypes: ['gold', 'pelts', 'claws'],
      dangerLevel: Math.max(1, Math.min(5, dangerLevel)),
      cleared: false,
      looted: false,
      isMobZone: true,
    });
  }

  // Non-combat encounters
  const nonCombatKeys = Object.keys(ENCOUNTER_TYPES);
  const nonCombatCount = rng.int(0, 2);
  const nonCombatEncounters = [];
  const usedNC = new Set();
  for (let i = 0; i < nonCombatCount; i++) {
    let eType;
    let attempts = 0;
    do { eType = rng.pick(nonCombatKeys); attempts++; } while (usedNC.has(eType) && attempts < 8);
    usedNC.add(eType);
    const def = ENCOUNTER_TYPES[eType];
    nonCombatEncounters.push({
      id: `enc_${x}_${y}_${i}`,
      type: eType,
      interactionType: def.interactionType,
      enemyTemplate: def.enemyTemplate,
      icon: def.icon,
      name: rng.pick(def.namePool),
      description: rng.pick(def.descriptions),
      lootTypes: def.loot,
      dangerLevel: Math.max(1, Math.min(5, dangerLevel + def.dangerMod)),
      cleared: false,
      looted: false,
    });
  }

  // Combined encounters = mob zones first (they're the main content), then non-combat
  const encounters = [...mobZones, ...nonCombatEncounters];

  const resourcePool = RESOURCE_TYPES[terrain] || RESOURCE_TYPES.plains;
  const resourceCount = rng.int(2, 4);
  const resources = [];
  const usedResTypes = new Set();
  for (let i = 0; i < resourceCount; i++) {
    const res = rng.pick(resourcePool);
    if (!usedResTypes.has(res.id)) {
      usedResTypes.add(res.id);
      resources.push({
        id: `res_${x}_${y}_${i}`,
        resType: res.id,
        name: res.name,
        icon: res.icon,
        description: res.description,
        yield: res.yield,
        count: rng.int(res.count[0], res.count[1]),
        harvested: false,
      });
    }
  }

  const cacheCount = rng.int(0, 2);
  const caches = [];
  for (let i = 0; i < cacheCount; i++) {
    caches.push({
      id: `cache_${x}_${y}_${i}`,
      name: rng.pick(CACHE_NAMES),
      found: false,
      looted: false,
      gold: rng.int(5, 30 + dangerLevel * 15),
      hasItem: rng.bool(0.45),
    });
  }

  let loreFragment = null;
  if (rng.bool(0.32)) {
    const [type, text] = rng.pick(LORE_FRAGMENTS);
    loreFragment = { type, text, found: false };
  }

  const npcCount = rng.int(1, 2);
  const wanderingNPCs = [];
  const usedNpcTypes = new Set();
  for (let i = 0; i < npcCount; i++) {
    let npcDef;
    let attempts = 0;
    do { npcDef = rng.pick(WANDERING_NPC_TYPES); attempts++; } while (usedNpcTypes.has(npcDef.occupation) && attempts < 8);
    usedNpcTypes.add(npcDef.occupation);
    wanderingNPCs.push({
      id: `wnpc_${x}_${y}_${i}`,
      name: rng.name(npcDef.gender),
      occupation: npcDef.occupation,
      attitude: npcDef.attitude,
      dialogue: npcDef.dialogue,
      departed: false,
    });
  }

  return {
    landmarkName,
    landmarkDesc,
    landmarkExplored: false,
    encounters,
    resources,
    caches,
    loreFragment,
    wanderingNPCs,
    campSetHere: false,
  };
}
