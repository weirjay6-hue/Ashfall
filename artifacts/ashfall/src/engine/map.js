import { RNG } from './rng.js';
import { FACTION_TEMPLATES } from '../data/factions.js';
import { DUNGEON_TYPES, generateDungeon } from './dungeon.js';

const INTERIOR_BIOME_WEIGHTS = [
  { value: 'plains',    weight: 32 },
  { value: 'forest',    weight: 28 },
  { value: 'mountains', weight: 22 },
  { value: 'desert',    weight: 10 },
  { value: 'swamp',     weight: 8 },
];

const TERRAIN_EMOJIS = {
  plains: '🌾', forest: '🌲', mountains: '⛰️', desert: '🏜️', swamp: '🌿', coast: '🏖️', lake: '🏞️',
};

const TERRAIN_COLORS = {
  plains: '#5a9a2a', forest: '#1e6e18', mountains: '#7a8a6a', desert: '#c8b04a', swamp: '#3a7050', coast: '#2a6a9a', lake: '#1a5a8a',
};

const TOWN_TYPE_WEIGHTS = [
  { value: 'village', weight: 45 },
  { value: 'town',    weight: 30 },
  { value: 'city',    weight: 12 },
  { value: 'fort',    weight: 8 },
  { value: 'ruins',   weight: 5 },
];

function buildVoronoiBiomes(seed, size, rng) {
  const seeds = [];

  seeds.push({ x: 0.5,  y: 0.5,  terrain: 'plains' });
  seeds.push({ x: 2.0,  y: 1.0,  terrain: 'forest' });
  seeds.push({ x: 1.5,  y: 3.0,  terrain: 'plains' });

  const numExtra = 11;
  for (let i = 0; i < numExtra; i++) {
    seeds.push({
      x: 0.5 + rng.float() * (size - 1),
      y: 0.5 + rng.float() * (size - 1),
      terrain: rng.weighted(INTERIOR_BIOME_WEIGHTS),
    });
  }

  // Coastal edges
  for (let i = 0; i < 6; i++) {
    const t = rng.float() * size;
    const side = i % 4;
    if (side === 0)      seeds.push({ x: t,          y: 0.3,          terrain: 'coast' });
    else if (side === 1) seeds.push({ x: size - 0.8,  y: t,           terrain: 'coast' });
    else if (side === 2) seeds.push({ x: t,           y: size - 0.8,  terrain: 'coast' });
    else                 seeds.push({ x: 0.3,          y: t,           terrain: 'coast' });
  }

  // Ocean border (makes edges impassable ocean)
  for (let i = 0; i < 10; i++) {
    const t = rng.float() * size;
    seeds.push({ x: t,          y: -5,         terrain: 'ocean' });
    seeds.push({ x: t,          y: size + 4,   terrain: 'ocean' });
    seeds.push({ x: -5,         y: t,          terrain: 'ocean' });
    seeds.push({ x: size + 4,   y: t,          terrain: 'ocean' });
  }

  // --- INLAND LAKES (2-4 scattered in interior) ---
  const numLakes = rng.int(2, 4);
  for (let i = 0; i < numLakes; i++) {
    // Keep lakes away from the start area (origin) and away from edges
    const minDist = 4;
    const lx = minDist + rng.float() * (size - minDist * 2);
    const ly = minDist + rng.float() * (size - minDist * 2);
    // Lake center
    seeds.push({ x: lx, y: ly, terrain: 'lake' });
    seeds.push({ x: lx + 0.2, y: ly, terrain: 'lake' });
    seeds.push({ x: lx - 0.2, y: ly, terrain: 'lake' });
    seeds.push({ x: lx, y: ly + 0.2, terrain: 'lake' });
    seeds.push({ x: lx, y: ly - 0.2, terrain: 'lake' });
    // Shore around the lake
    seeds.push({ x: lx + 0.8, y: ly, terrain: 'coast' });
    seeds.push({ x: lx - 0.8, y: ly, terrain: 'coast' });
    seeds.push({ x: lx, y: ly + 0.8, terrain: 'coast' });
    seeds.push({ x: lx, y: ly - 0.8, terrain: 'coast' });
    seeds.push({ x: lx + 0.6, y: ly + 0.6, terrain: 'coast' });
    seeds.push({ x: lx - 0.6, y: ly + 0.6, terrain: 'coast' });
  }

  return function getBiome(x, y) {
    let minDist = Infinity;
    let best = seeds[0];
    for (const s of seeds) {
      const d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
      if (d < minDist) { minDist = d; best = s; }
    }
    return best.terrain;
  };
}

export function generateWorld(seed, size = 20) {
  const rng = new RNG(seed);
  const factionIds = Object.keys(FACTION_TEMPLATES);
  const getBiome = buildVoronoiBiomes(seed, size, rng);
  const regions = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const terrain = getBiome(x, y);
      const isImpassable = terrain === 'ocean' || terrain === 'lake';
      const dangerLevel = Math.min(5, Math.max(1, Math.floor(Math.sqrt(x * x + y * y) / 5) + rng.int(-1, 1)));
      const region = {
        id: `region_${x}_${y}`,
        x, y,
        name: rng.townName(),
        terrain,
        dangerLevel,
        settlements: [],
        dungeons: [],
        pointsOfInterest: [],
        factionControl: {},
        economy: generateEconomy(terrain, rng),
        events: [],
        weather: rng.pick(['clear', 'cloudy', 'rainy', 'foggy', 'stormy']),
        visited: x === 0 && y === 0,
        revealed: x === 0 && y === 0 || (Math.abs(x) <= 1 && Math.abs(y) <= 1),
      };

      if (!isImpassable) {
        if (rng.bool(0.55)) {
          const townType = rng.weighted(TOWN_TYPE_WEIGHTS);
          region.settlements.push(generateSettlement(region, townType, rng, factionIds));
        }

        const dungeonChance = terrain === 'mountains' ? 0.4 : terrain === 'swamp' ? 0.35 : 0.22;
        if (rng.bool(dungeonChance)) {
          const dungeonTypeKeys = Object.keys(DUNGEON_TYPES);
          const dtype = rng.pick(dungeonTypeKeys);
          const dungeonFloors = rng.int(1, Math.min(5, dangerLevel + 1));
          region.dungeons.push({
            id: `dungeon_${x}_${y}_${rng.uid()}`,
            type: dtype,
            name: DUNGEON_TYPES[dtype].name,
            dangerLevel: Math.min(5, dangerLevel + rng.int(0, 1)),
            floors: dungeonFloors,
            explored: false,
            cleared: false,
            seed: `${seed}_${x}_${y}`,
          });
        }

        if (rng.bool(0.18)) {
          region.pointsOfInterest.push(generatePOI(region, rng));
        }

        const dominant = rng.pick(factionIds.slice(0, 6));
        region.factionControl[dominant] = rng.int(40, 80);
        const rival = rng.pick(factionIds.filter(f => f !== dominant));
        region.factionControl[rival] = rng.int(5, 30);
      }

      regions.push(region);
    }
  }

  const startRegion = regions[0];
  if (startRegion.settlements.length === 0) {
    startRegion.settlements.push(generateSettlement(startRegion, 'town', rng, factionIds));
  }
  startRegion.visited = true;
  startRegion.revealed = true;

  return {
    seed,
    size,
    regions,
    day: 1,
    hour: 8,
    tick: 0,
    season: 'spring',
    yearEvents: [],
    history: [`Year 1: The world of ${startRegion.name} was born from the ${seed.toUpperCase()} seed.`],
  };
}

function generateSettlement(region, type, rng, factionIds) {
  const pop = { village: rng.int(50, 200), town: rng.int(200, 1000), city: rng.int(1000, 5000), fort: rng.int(30, 100), ruins: 0 };
  const faction = rng.pick(factionIds.slice(0, 6));
  const settlement = {
    id: `settlement_${region.x}_${region.y}_${rng.uid()}`,
    name: rng.townName(),
    type,
    population: pop[type] || 0,
    factionControl: faction,
    dangerLevel: type === 'ruins' ? region.dangerLevel + 1 : Math.max(0, region.dangerLevel - 1),
    economy: generateSettlementEconomy(region.terrain, rng),
    npcs: generateNPCs(type, rng, factionIds),
    buildings: generateBuildings(type, rng),
    marketPrices: {},
    events: [],
    stability: rng.int(40, 90),
  };
  return settlement;
}

function generateNPCs(settlementType, rng, factionIds) {
  const count = { village: 3, town: 5, city: 8, fort: 4, ruins: 0 }[settlementType] || 0;
  const occupations = ['blacksmith','innkeeper','merchant','guard','herbalist','mage','priest','beggar','noble','farmer','hunter','alchemist'];
  const npcs = [];
  for (let i = 0; i < count; i++) {
    npcs.push({
      id: `npc_${rng.uid()}`,
      name: `${rng.name('npc')} ${rng.pick(['the', 'of', 'from', ''])} ${rng.townName()}`.trim(),
      occupation: rng.pick(occupations),
      faction: rng.pick(factionIds),
      attitude: rng.pick(['friendly', 'neutral', 'neutral', 'suspicious']),
      wealth: rng.int(10, 500),
      hasQuest: rng.bool(0.3),
      rumors: generateRumors(rng),
      schedule: generateSchedule(rng),
      memory: [],
    });
  }
  return npcs;
}

function generateRumors(rng) {
  const allRumors = [
    'A strange light was seen over the mountains last night.',
    'Bandits have been raiding caravans on the northern road.',
    'The old dungeon to the east has become active again.',
    'A powerful artifact was spotted in the market square.',
    'The Fighters Guild is looking for capable adventurers.',
    'Strange creatures have been emerging from the swamp.',
    'A wealthy merchant is paying top coin for monster parts.',
    'The necromancers have established a new stronghold.',
    'Trade routes to the south have been disrupted.',
    'An ancient ruin holds untold treasure, they say.',
    'The city guard is stretched thin protecting the roads.',
    'Prices for iron ore have doubled in the last month.',
    'Something moves beneath the lake to the east — fishermen refuse to go near it.',
    'A pack of wolves has been terrorizing the forest path.',
    'Giant beetles have overrun the old mill. Nobody dares go near.',
  ];
  return [rng.pick(allRumors)];
}

function generateSchedule(rng) {
  return {
    morning: rng.pick(['working', 'at_market', 'at_tavern']),
    afternoon: rng.pick(['working', 'at_home', 'wandering']),
    evening: rng.pick(['at_tavern', 'at_home', 'at_temple']),
    night: 'sleeping',
  };
}

function generateBuildings(type, rng) {
  const always = ['inn', 'market'];
  const byType = {
    village: ['blacksmith', 'general_store'],
    town: ['blacksmith', 'general_store', 'alchemist', 'guild_hall', 'temple'],
    city: ['blacksmith', 'general_store', 'alchemist', 'guild_hall', 'mages_tower', 'temple', 'bank'],
    fort: ['barracks', 'armory'],
    ruins: [],
  };
  return [...always, ...(byType[type] || [])].filter(() => rng.bool(0.85));
}

function generateEconomy(terrain, rng) {
  const base = { food: rng.int(40, 80), wood: rng.int(20, 60), ore: rng.int(10, 40), gems: rng.int(0, 10), cloth: rng.int(20, 50) };
  if (terrain === 'forest') { base.wood += 30; base.food += 10; }
  if (terrain === 'mountains') { base.ore += 40; base.gems += 15; }
  if (terrain === 'plains') { base.food += 40; base.cloth += 20; }
  if (terrain === 'coast' || terrain === 'lake') { base.food += 20; }
  return base;
}

function generateSettlementEconomy(terrain, rng) {
  return {
    food: { supply: rng.int(40, 100), demand: rng.int(30, 80), price: rng.int(5, 15) },
    weapons: { supply: rng.int(10, 50), demand: rng.int(20, 60), price: rng.int(30, 80) },
    armor: { supply: rng.int(10, 40), demand: rng.int(20, 50), price: rng.int(40, 100) },
    potions: { supply: rng.int(5, 30), demand: rng.int(20, 40), price: rng.int(20, 50) },
    gems: { supply: rng.int(0, 20), demand: rng.int(5, 20), price: rng.int(50, 200) },
  };
}

function generatePOI(region, rng) {
  const types = [
    { type: 'shrine', name: `Shrine of ${rng.pick(['The Fallen','The Wanderer','The Storm','The Flame'])}` },
    { type: 'campsite', name: 'Abandoned Campsite' },
    { type: 'monolith', name: `Ancient Monolith` },
    { type: 'cave', name: `${rng.pick(['Dark','Deep','Howling','Lost'])} Cave` },
    { type: 'landmark', name: `${rng.pick(['Twin','Broken','Ancient','Black'])} ${rng.pick(['Stones','Tower','Gate','Well'])}` },
  ];
  const poi = rng.pick(types);
  return { ...poi, id: `poi_${rng.uid()}`, x: region.x, y: region.y, discovered: false };
}

export function getRegion(world, x, y) {
  return world.regions.find(r => r.x === x && r.y === y);
}

export function getAdjacentRegions(world, x, y) {
  return [
    { dx: 0, dy: -1, name: 'North' }, { dx: 1, dy: 0, name: 'East' },
    { dx: 0, dy: 1, name: 'South' }, { dx: -1, dy: 0, name: 'West' },
  ].map(d => ({
    dir: d.name,
    region: getRegion(world, x + d.dx, y + d.dy),
  })).filter(d => d.region);
}

export function travelCost(from, to) {
  const terrain = to.terrain;
  if (terrain === 'ocean' || terrain === 'lake') return Infinity;
  const base = { plains: 2, forest: 3, mountains: 5, desert: 4, swamp: 4, coast: 3 };
  return base[terrain] || 3;
}

export function revealAdjacentRegions(world, x, y) {
  const dirs = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  const newRegions = world.regions.map(r => {
    if (dirs.some(([dx, dy]) => r.x === x + dx && r.y === y + dy)) {
      return { ...r, revealed: true };
    }
    return r;
  });
  return { ...world, regions: newRegions };
}

export const TERRAIN_INFO = {
  plains:    { emoji: '🌾', color: '#7cb942', bgColor: '#4a8028' },
  forest:    { emoji: '🌲', color: '#2d7c2d', bgColor: '#1a5a1a' },
  mountains: { emoji: '⛰️', color: '#9c9c8a', bgColor: '#5a5a4a' },
  desert:    { emoji: '🏜️', color: '#d4a832', bgColor: '#a47822' },
  swamp:     { emoji: '🌿', color: '#4a7a54', bgColor: '#2a5a34' },
  coast:     { emoji: '🏖️', color: '#5a9cd4', bgColor: '#3a6ca4' },
  ocean:     { emoji: '🌊', color: '#1e6e9e', bgColor: '#0a3a5e' },
  lake:      { emoji: '🏞️', color: '#1e78b0', bgColor: '#0e4a78' },
};
