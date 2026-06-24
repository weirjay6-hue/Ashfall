// Regional lore-based enemy names — replaces generic placeholder names per biome

const REGIONAL_NAMES = {
  wolf: {
    forest:    ['Mossfang Stalker', 'Briarcoat Predator', 'Thornwood Hunter', 'Darkroot Prowler', 'Hollow Grove Tracker'],
    mountain:  ['Frostback Ravager', 'Stonepeak Stalker', 'Highridge Predator', 'Ironjaw Prowler'],
    plains:    ['Dustfang Marauder', 'Grassland Prowler', 'Windchaser', 'Prairie Stalker'],
    swamp:     ['Mirecoat Lurker', 'Bogfang Hunter', 'Marshback Prowler', 'Rotfur Tracker'],
    desert:    ['Sandmane Predator', 'Dustback Ravager', 'Scorchfang Stalker'],
    cave:      ['Cavefang Hunter', 'Deep Prowler', 'Darkpit Stalker'],
    coast:     ['Saltcoat Stalker', 'Shorewind Hunter'],
  },
  dire_wolf: {
    forest:    ['Blackroot Devourer', 'Ancient Thornfang', 'Elder Mossstalker'],
    mountain:  ['Ironpeak Ravager', 'Glacierfang Devourer', 'Stormcrest Beast'],
    plains:    ['Doomfang Marauder', 'Elder Prairie Stalker'],
    swamp:     ['Plague-Rotted Devourer', 'Ancient Bogfang'],
    cave:      ['Abyssal Devourer', 'Cavern Lord'],
  },
  bandit: {
    forest:    ['Briarfoot Poacher', 'Wildwood Cutthroat', 'Thornpath Brigand', 'Deepwood Raider', 'Hollow Grove Rogue'],
    mountain:  ['Highpass Raider', 'Stoneback Brigand', 'Mountain Cutthroat', 'Ironpass Ruffian'],
    plains:    ['Dustroad Brigand', 'Plains Highwayman', 'Road Cutthroat', 'Crossroads Raider'],
    swamp:     ['Bogland Thief', 'Mirerunner', 'Marsh Brigand', 'Fetid Water Cutthroat'],
    desert:    ['Sandstone Raider', 'Dune Cutthroat', 'Scorched Road Brigand'],
    cave:      ['Cave Brigand', 'Deeppit Raider'],
    coast:     ['Saltwind Pirate', 'Tideline Raider', 'Shore Brigand'],
    ruins:     ['Ruin Scavenger', 'Ancient Hall Looter', 'Collapsed Tower Raider'],
  },
  skeleton: {
    crypt:     ['Gravebound Revenant', 'Hollow King\'s Soldier', 'Cairn Walker', 'Burial Sentinel'],
    ruins:     ['Ancient Shade', 'Ruinborn Soldier', 'Fallen Legionnaire', 'Dust-Forged Warrior'],
    dungeon:   ['Fallen Sentry', 'Bone Warden', 'Cursed Soldier'],
    cave:      ['Cavern Remnant', 'Lost Wanderer'],
    forest:    ['Barrow Risen', 'Grovebound Revenant'],
    mountain:  ['Peak Remnant', 'Fallen Climber'],
  },
  zombie: {
    crypt:     ['Graveborn Shambler', 'Wretched Revenant', 'Plague-Touched Walker', 'Tomb Risen'],
    swamp:     ['Rotfen Creeper', 'Mireborn Lurker', 'Bog Shambler', 'Marshfang Horror'],
    dungeon:   ['Dungeon Shambler', 'Cursed Risen', 'Festering Walker'],
    forest:    ['Root-Wrapped Walker', 'Barrow Risen'],
    ruins:     ['Ancient Shambler', 'Ruin-Touched Walker'],
  },
  giant_spider: {
    cave:      ['Venomfang Cave Lurker', 'Darkpit Weaver', 'Silk Tomb Stalker', 'Blind Cave Stalker'],
    forest:    ['Thornweb Weaver', 'Briar Stalker', 'Deepwood Lurker', 'Silk Ambusher'],
    dungeon:   ['Dungeon Weaver', 'Shadow Stalker', 'Cobweb Sentinel'],
    swamp:     ['Bog Lurker', 'Mire Weaver', 'Marsh Stalker'],
    ruins:     ['Ruin Weaver', 'Ancient Web Stalker'],
  },
  orc_warrior: {
    mountain:  ['Ironback Brute', 'Stonefist Ravager', 'Highpeak Crusher', 'Rockshield Warrior'],
    dungeon:   ['Dungeon Warden', 'Deep Crusher', 'Iron Sentinel', 'Vault Guardian'],
    ruins:     ['Ruin Marauder', 'Ancient Hall Crusher'],
    plains:    ['Plains Marauder', 'Warchief\'s Soldier', 'Borderland Crusher'],
    cave:      ['Cavern Warlord', 'Deeprock Crusher'],
  },
  goblin: {
    cave:      ['Ratscuttle Runt', 'Darkpit Skulker', 'Gravel Grabber', 'Cave Sneaker'],
    forest:    ['Underbrush Skulker', 'Thorn Sneaker', 'Roothole Scavenger', 'Mossy Pilferer'],
    ruins:     ['Ruin Scavenger', 'Shard Picker', 'Debris Lurker'],
    dungeon:   ['Dungeon Runt', 'Vault Scavenger', 'Hall Skulker'],
    mountain:  ['Crag Sneaker', 'Ledge Lurker', 'Stone Skulker'],
  },
  troll: {
    cave:      ['Warden of the Deep', 'Tunnel Crusher', 'Grotto Beast', 'Stonehide Brute'],
    mountain:  ['Highpeak Ravager', 'Glacierback Titan', 'Cragmaw Behemoth', 'Summit Terror'],
    dungeon:   ['Vault Keeper', 'Deep Guardian', 'Dungeon Titan'],
    swamp:     ['Bogmire Hulk', 'Marshland Terror', 'Rot-Hide Brute'],
  },
  dark_mage: {
    dungeon:   ['Shadowcaller', 'Void Channeler', 'Dark Arcanist', 'Forbidden Mage'],
    ruins:     ['Ancient Hexbinder', 'Ruin Warlock', 'Lost Sorcerer'],
    tower:     ['Tower Arcanist', 'Shadowspire Mage', 'Cursed Scholar'],
    cave:      ['Cavern Ritualist', 'Deep Spellbinder'],
    forest:    ['Darkwood Hexer', 'Cursed Grove Mage'],
  },
  witch: {
    swamp:     ['Marshcurse Hag', 'Bogfen Witch', 'Mire Hexer', 'Fetid Water Crone'],
    forest:    ['Thornwood Crone', 'Deeproot Hexer', 'Ancient Grove Witch'],
    cave:      ['Cavern Witch', 'Darkpit Hexer'],
    ruins:     ['Ruin Hexer', 'Ancient Spellcaster'],
  },
  banshee: {
    crypt:     ['Wailing Cairn Spirit', 'Hollow Mourner', 'Shrieking Revenant', 'Tomb Wail'],
    ruins:     ['Ancient Lament', 'Lost Queen\'s Wail', 'Ruin Screamer'],
    dungeon:   ['Dungeon Wail', 'Vault Screamer', 'Cursed Spirit'],
  },
  wight: {
    crypt:     ['Burial Wight', 'Gravebound Knight', 'Tomb Stalker', 'Cairn Guardian'],
    dungeon:   ['Vault Wight', 'Deep Walker', 'Cursed Knight'],
    ruins:     ['Ancient Wight', 'Ruin Stalker', 'Fallen Guardian'],
  },
  vampire: {
    crypt:     ['Bloodbound Lord', 'Ancient Nightstalker', 'Crimson Revenant', 'Dusk Predator'],
    dungeon:   ['Vault Bloodlord', 'Cursed Nightstalker'],
    tower:     ['Spire Bloodlord', 'Tower Nightstalker'],
    ruins:     ['Ancient Bloodlord', 'Fallen Scion'],
  },
  werewolf: {
    forest:    ['Moonbound Ravager', 'Thornwood Lycanthrope', 'Ancient Barrow Beast', 'Cursed Howler'],
    mountain:  ['Highpeak Ravager', 'Stoneback Lycanthrope', 'Storm Howler'],
    plains:    ['Fullmoon Ravager', 'Grassland Lycanthrope'],
    swamp:     ['Bogmire Lycanthrope', 'Marsh Howler'],
  },
  imp: {
    dungeon:   ['Arcane Pest', 'Void Imp', 'Shadow Gremlin', 'Hex Sprite'],
    tower:     ['Spire Gremlin', 'Arcane Familiar', 'Tower Sprite'],
    ruins:     ['Ruin Sprite', 'Ancient Familiar'],
  },
  gargoyle: {
    dungeon:   ['Stone Sentinel', 'Vault Guardian', 'Cursed Carving', 'Living Effigy'],
    tower:     ['Spire Guardian', 'Tower Sentinel', 'Carved Warden'],
    ruins:     ['Ancient Guardian', 'Ruin Sentinel'],
  },
  cult_fanatic: {
    dungeon:   ['Zealous Cultist', 'Dark Faith Fanatic', 'Bloodrite Initiate', 'Void Devotee'],
    ruins:     ['Ancient Cultist', 'Ruin Zealot', 'Fallen Devotee'],
    tower:     ['Spire Cultist', 'Arcane Zealot', 'Tower Fanatic'],
    cave:      ['Cavern Devotee', 'Deep Cultist'],
  },
  lizardman: {
    swamp:     ['Mireborn Scalehide', 'Bog Lizardman', 'Fetid Water Warrior', 'Marsh Scalehide'],
    cave:      ['Cavern Scalehide', 'Deep Lizardman'],
    coast:     ['Saltwater Scalehide', 'Shore Warrior'],
  },
  swamp_hag: {
    swamp:     ['Mother Thorn', 'Rotfen Crone', 'Bog Witch', 'Mirewater Hag', 'Ancient Mire Witch'],
    cave:      ['Cavern Hag', 'Darkpit Crone'],
    forest:    ['Deepwood Hag', 'Thornroot Crone'],
  },
  minotaur: {
    dungeon:   ['Warden of the Deep', 'Vault Keeper', 'Labyrinth Guardian', 'The Last Sentinel'],
    ruins:     ['Ancient Labyrinth Keeper', 'Ruin Guardian', 'Fallen Colossus'],
    mountain:  ['Peak Guardian', 'Ironback Colossus'],
  },
  earth_elemental: {
    cave:      ['Living Stone Colossus', 'Deep Earth Titan', 'Cavern Golem', 'Rockborn Sentinel'],
    mountain:  ['Mountain Titan', 'Peak Colossus', 'Glacial Golem'],
    dungeon:   ['Vault Colossus', 'Deep Guardian', 'Dungeon Titan'],
  },
  dark_assassin: {
    dungeon:   ['Shadowblade', 'Void Stalker', 'Cursed Slayer', 'Nightbringer'],
    ruins:     ['Ancient Shade', 'Ruin Stalker', 'Fallen Slayer'],
    tower:     ['Spire Blade', 'Tower Slayer', 'Arcane Assassin'],
    forest:    ['Darkwood Slayer', 'Shadow Stalker'],
  },
};

// Boss unique names by dungeon type
const BOSS_NAMES = {
  cave: [
    'The Hollow King', 'Ashfang the Devourer', 'Warden of the Deep',
    'The Ancient Burrower', 'Grotto Titan', 'Deepcraw Sovereign',
  ],
  crypt: [
    'The Undying Monarch', 'Lord of the Sealed Tomb', 'Ancient Death Sovereign',
    'The Hollow King', 'Warden of the Final Rest', 'Ashborn the Eternal',
  ],
  ruins: [
    'The Last Sentinel', 'Ashfang the Devourer', 'Ancient Ruin Colossus',
    'Warden of Fallen Halls', 'The Buried Sovereign', 'Ironwrought Guardian',
  ],
  tower: [
    'The Spire Master', 'Lord of Forbidden Arts', 'Archon of the Dark Tower',
    'The Imprisoned Archon', 'Shadowspire Sovereign', 'The Unbound Mage',
  ],
  mine: [
    'The Deepwork Guardian', 'Iron Forge Colossus', 'Warden of the Lost Vein',
    'Ashfang the Devourer', 'The Buried Titan', 'Deepcraw Sovereign',
  ],
  banditHideout: [
    'The Warlord of Broken Roads', 'Commander of the Hollow', 'The Iron Brigand',
    'Scar-Captain', 'Dustroad Sovereign', 'The Ironclad Outlaw',
  ],
  necromancerTower: [
    'The Death Archon', 'Lord of Raised Souls', 'Ancient Lich Sovereign',
    'The Hollow Architect', 'Ashborn the Eternal', 'The Unbound Lich',
  ],
  swampDen: [
    'Mother Thorn', 'The Rotfen Sovereign', 'Ancient Mire Colossus',
    'Warden of Fetid Waters', 'Bogmire the Devourer', 'The Marsh King',
  ],
};

export function getRegionalName(templateId, biome, rng) {
  const table = REGIONAL_NAMES[templateId];
  if (!table) return null;
  const names = table[biome] || table.cave || table.dungeon || null;
  if (!names?.length) return null;
  if (rng) return names[rng.int(0, names.length - 1)];
  return names[Math.floor(Math.random() * names.length)];
}

export function getBossName(dungeonType, rng) {
  const names = BOSS_NAMES[dungeonType] || BOSS_NAMES.cave;
  if (rng) return names[rng.int(0, names.length - 1)];
  return names[Math.floor(Math.random() * names.length)];
}

export function getEnemyTitle(templateId) {
  const TITLES = {
    wolf: 'Beast', dire_wolf: 'Alpha Beast', bandit: 'Brigand', skeleton: 'Undead',
    zombie: 'Undead', giant_spider: 'Arachnid', orc_warrior: 'Warrior',
    goblin: 'Goblinoid', troll: 'Brute', dark_mage: 'Spellcaster',
    banshee: 'Wraith', wight: 'Revenant', vampire: 'Bloodborn',
    werewolf: 'Lycanthrope', lich: 'Lich Lord', dragon: 'Wyrm',
    imp: 'Demonic', gargoyle: 'Construct', cult_fanatic: 'Cultist',
    lizardman: 'Scalehide', swamp_hag: 'Hag', minotaur: 'Minotaur',
    earth_elemental: 'Elemental', dark_assassin: 'Assassin',
  };
  return TITLES[templateId] || 'Creature';
}
