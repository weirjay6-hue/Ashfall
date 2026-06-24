import { RNG } from './rng.js';

export const T = {
  GRASS:    0,
  PATH:     1,
  COBBLE:   2,
  WALL:     3,
  DOOR:     4,
  TREE:     5,
  WATER:    6,
  FENCE:    7,
  FOUNTAIN: 8,
  WELL:     9,
  BENCH:    10,
  FLOWER:   11,
};

export const WALKABLE = new Set([T.GRASS, T.PATH, T.COBBLE, T.DOOR, T.BENCH, T.FLOWER]);

const NPC_EMOJI_MAP = {
  merchant: '🧑‍💼', innkeeper: '🧑‍🍳', blacksmith: '🧑‍🔧', guard: '💂',
  farmer: '🧑‍🌾', mage: '🧙', priest: '🧝', thief: '🕵️', noble: '🤴',
  beggar: '🧎', scholar: '📖', bard: '🎶', hunter: '🏹', healer: '💊',
  alchemist: '⚗️', default: '🧑',
};

export function getNPCEmoji(occupation) {
  return NPC_EMOJI_MAP[occupation] || NPC_EMOJI_MAP.default;
}

const BUILDING_DEFS = {
  inn:           { name: 'The Inn',       icon: '🍺', w: 5, h: 4, roofHex: '#6B3310' },
  market:        { name: 'Market',        icon: '🛒', w: 6, h: 4, roofHex: '#8B6914' },
  blacksmith:    { name: 'Blacksmith',    icon: '⚒️', w: 4, h: 3, roofHex: '#505860' },
  alchemist:     { name: 'Alchemist',     icon: '⚗️', w: 4, h: 3, roofHex: '#4a1870' },
  general_store: { name: 'General Store', icon: '📦', w: 4, h: 3, roofHex: '#3a5010' },
  temple:        { name: 'Temple',        icon: '⛪', w: 5, h: 4, roofHex: '#8a8060' },
  barracks:      { name: 'Barracks',      icon: '⚔️', w: 6, h: 4, roofHex: '#304428' },
  keep:          { name: 'Keep',          icon: '🏰', w: 7, h: 5, roofHex: '#404040' },
  guild:         { name: 'Guild Hall',    icon: '📜', w: 5, h: 4, roofHex: '#182840' },
  tavern:        { name: 'Tavern',        icon: '🍻', w: 5, h: 4, roofHex: '#601010' },
};

const HOUSE_ROOF_COLORS = ['#5a3820','#4a3428','#623418','#3a4820','#482838'];

const SETTLEMENT_CONFIG = {
  village: {
    size: [18, 14],
    maxBuildings: 2,
    maxHouses: 3,
    roads: 'single',
    treeChance: 0.07,
    waterChance: 0.005,
    hasFountain: false,
    hasWell: true,
  },
  town: {
    size: [28, 20],
    maxBuildings: 5,
    maxHouses: 6,
    roads: 'cross',
    treeChance: 0.04,
    waterChance: 0.003,
    hasFountain: true,
    hasWell: true,
  },
  city: {
    size: [36, 28],
    maxBuildings: 9,
    maxHouses: 10,
    roads: 'grid',
    treeChance: 0.02,
    waterChance: 0.001,
    hasFountain: true,
    hasWell: true,
  },
  fort: {
    size: [24, 18],
    maxBuildings: 4,
    maxHouses: 2,
    roads: 'cross',
    treeChance: 0.01,
    waterChance: 0.0,
    hasFountain: false,
    hasWell: true,
  },
  ruins: {
    size: [22, 16],
    maxBuildings: 3,
    maxHouses: 4,
    roads: 'single',
    treeChance: 0.09,
    waterChance: 0.004,
    hasFountain: false,
    hasWell: false,
  },
};

function setTile(tiles, x, y, t, W, H) {
  if (x >= 0 && y >= 0 && x < W && y < H) tiles[y][x] = t;
}

function hLine(tiles, y, x1, x2, t, W, H) {
  for (let x = x1; x <= x2; x++) setTile(tiles, x, y, t, W, H);
}

function vLine(tiles, x, y1, y2, t, W, H) {
  for (let y = y1; y <= y2; y++) setTile(tiles, x, y, t, W, H);
}

function cobblePlaza(tiles, cx, cy, r, W, H) {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++)
      setTile(tiles, cx + dx, cy + dy, T.COBBLE, W, H);
}

function placeBuilding(tiles, bx, by, bw, bh, W, H) {
  for (let dy = 0; dy < bh - 1; dy++)
    for (let dx = 0; dx < bw; dx++)
      setTile(tiles, bx + dx, by + dy, T.WALL, W, H);
  for (let dx = 0; dx < bw; dx++)
    setTile(tiles, bx + dx, by + bh - 1, T.WALL, W, H);
}

function connectDoorToRoad(tiles, doorX, doorY, roadY, W, H) {
  const minY = Math.min(doorY + 1, roadY);
  const maxY = Math.max(doorY + 1, roadY);
  for (let py = minY; py <= maxY; py++) {
    const t = tiles[py]?.[doorX];
    if (t !== T.COBBLE && t !== T.WALL && t !== T.DOOR)
      setTile(tiles, doorX, py, T.PATH, W, H);
  }
}

export function generateTownMap(settlement) {
  const rng = new RNG(settlement.id + '_tilemap_v3');
  const cfg = SETTLEMENT_CONFIG[settlement.type] || SETTLEMENT_CONFIG.town;
  const [W, H] = cfg.size;

  const tiles = Array.from({ length: H }, () => Array(W).fill(T.GRASS));
  const buildings = [];
  const houses = [];
  const decorations = [];

  // Border trees
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1)
        tiles[y][x] = T.TREE;

  // Road layout
  const midX = Math.floor(W / 2);
  const roadY = Math.floor(H * 0.52);
  const topRoadY = Math.floor(H * 0.25);
  const road2X = Math.floor(W * 0.28);
  const road3X = Math.floor(W * 0.72);

  // Always: main horizontal road + south exit path
  hLine(tiles, roadY, 1, W - 2, T.PATH, W, H);
  vLine(tiles, midX, roadY, H - 2, T.PATH, W, H);

  if (cfg.roads === 'cross' || cfg.roads === 'grid') {
    vLine(tiles, midX, 1, H - 2, T.PATH, W, H);
    cobblePlaza(tiles, midX, roadY, 1, W, H);
  }

  if (cfg.roads === 'grid') {
    hLine(tiles, topRoadY, 1, W - 2, T.PATH, W, H);
    vLine(tiles, road2X, 1, H - 2, T.PATH, W, H);
    vLine(tiles, road3X, 1, H - 2, T.PATH, W, H);
    cobblePlaza(tiles, road2X, roadY, 1, W, H);
    cobblePlaza(tiles, road3X, roadY, 1, W, H);
    cobblePlaza(tiles, midX, topRoadY, 1, W, H);
    cobblePlaza(tiles, road2X, topRoadY, 1, W, H);
    cobblePlaza(tiles, road3X, topRoadY, 1, W, H);
  }

  // --- FOUNTAIN in center plaza (towns + cities) ---
  if (cfg.hasFountain && (cfg.roads === 'cross' || cfg.roads === 'grid')) {
    // Place fountain one tile north of the road intersection
    const fx = midX;
    const fy = roadY - 2;
    if (fy > 1) {
      setTile(tiles, fx, fy, T.FOUNTAIN, W, H);
      // surround with cobble
      setTile(tiles, fx - 1, fy, T.COBBLE, W, H);
      setTile(tiles, fx + 1, fy, T.COBBLE, W, H);
      setTile(tiles, fx, fy - 1, T.COBBLE, W, H);
      setTile(tiles, fx, fy + 1, T.COBBLE, W, H);
      decorations.push({ x: fx, y: fy, type: 'fountain', icon: '⛲', label: 'Fountain' });
    }

    // Extra fountains at other plazas in grid cities
    if (cfg.roads === 'grid') {
      const extraFountainSpots = [
        { x: road2X, y: topRoadY - 2 },
        { x: road3X, y: topRoadY - 2 },
      ];
      for (const { x: efx, y: efy } of extraFountainSpots) {
        if (efy > 1 && tiles[efy]?.[efx] === T.GRASS) {
          setTile(tiles, efx, efy, T.WELL, W, H);
          decorations.push({ x: efx, y: efy, type: 'well', icon: '🪣', label: 'Well' });
        }
      }
    }
  }

  // --- WELL in village / fort ---
  if (cfg.hasWell && !cfg.hasFountain) {
    const wx = midX + 2;
    const wy = roadY - 3;
    if (wy > 1 && tiles[wy]?.[wx] === T.GRASS) {
      setTile(tiles, wx, wy, T.WELL, W, H);
      setTile(tiles, wx - 1, wy, T.COBBLE, W, H);
      setTile(tiles, wx + 1, wy, T.COBBLE, W, H);
      decorations.push({ x: wx, y: wy, type: 'well', icon: '🪣', label: 'Well' });
    }
  }

  // --- BUILDING SLOTS (above road) ---
  const buildingSlots = [];
  if (cfg.roads === 'single') {
    buildingSlots.push(
      { bx: 2, by: 2 },
      { bx: W - 8, by: 2 },
      { bx: 2, by: roadY - 7 },
      { bx: W - 8, by: roadY - 7 },
    );
  } else if (cfg.roads === 'cross') {
    buildingSlots.push(
      { bx: 2,        by: 2 },
      { bx: midX + 2, by: 2 },
      { bx: 2,        by: roadY - 8 },
      { bx: midX + 2, by: roadY - 8 },
      { bx: midX - 3, by: 2 },
    );
  } else {
    buildingSlots.push(
      { bx: 2,          by: 2 },
      { bx: road2X + 2, by: 2 },
      { bx: road3X + 1, by: 2 },
      { bx: 2,          by: topRoadY + 2 },
      { bx: road2X + 2, by: topRoadY + 2 },
      { bx: road3X + 1, by: topRoadY + 2 },
      { bx: 2,          by: roadY - 8 },
      { bx: road2X + 2, by: roadY - 8 },
      { bx: road3X + 1, by: roadY - 8 },
    );
  }

  const buildingList = (settlement.buildings || []).slice(0, cfg.maxBuildings);
  for (let i = 0; i < buildingList.length && i < buildingSlots.length; i++) {
    const bType = buildingList[i];
    const def = BUILDING_DEFS[bType] || { name: bType.replace(/_/g,' '), icon: '🏠', w: 4, h: 3, roofHex: '#5a3820' };
    const slot = buildingSlots[i];
    const bx = Math.max(1, Math.min(slot.bx, W - def.w - 1));
    const by = Math.max(1, Math.min(slot.by, roadY - def.h - 1));
    if (bx < 1 || by < 1 || bx + def.w >= W - 1 || by + def.h >= roadY) continue;

    placeBuilding(tiles, bx, by, def.w, def.h, W, H);

    const doorX = bx + Math.floor(def.w / 2);
    const doorY = by + def.h - 1;
    setTile(tiles, doorX, doorY, T.DOOR, W, H);
    connectDoorToRoad(tiles, doorX, doorY, roadY, W, H);

    // Benches / flowers near buildings
    if (rng.bool(0.5) && doorX + 2 < W - 1 && tiles[doorY]?.[doorX + 2] === T.GRASS) {
      setTile(tiles, doorX + 2, doorY, T.FLOWER, W, H);
    }
    if (rng.bool(0.35) && doorX - 2 >= 1 && tiles[doorY]?.[doorX - 2] === T.GRASS) {
      setTile(tiles, doorX - 2, doorY, T.BENCH, W, H);
    }

    buildings.push({ id: bType, type: bType, name: def.name, icon: def.icon, roofHex: def.roofHex, x: bx, y: by, w: def.w, h: def.h, doorX, doorY, kind: 'building' });
  }

  // --- HOUSE SLOTS (below road) ---
  const houseSlots = [];
  const belowY = roadY + 2;
  if (cfg.roads === 'single') {
    houseSlots.push({ hx: 2, hy: belowY }, { hx: 7, hy: belowY }, { hx: W - 7, hy: belowY }, { hx: 2, hy: belowY + 5 }, { hx: 7, hy: belowY + 5 });
  } else if (cfg.roads === 'cross') {
    houseSlots.push(
      { hx: 2, hy: belowY }, { hx: 7, hy: belowY }, { hx: midX + 2, hy: belowY }, { hx: midX + 7, hy: belowY },
      { hx: 2, hy: belowY + 5 }, { hx: 7, hy: belowY + 5 }, { hx: midX + 2, hy: belowY + 5 }, { hx: midX + 7, hy: belowY + 5 },
    );
  } else {
    for (const hx of [2, 7, 13, 19, 25, 31]) {
      houseSlots.push({ hx, hy: belowY });
      houseSlots.push({ hx, hy: belowY + 5 });
    }
  }

  const npcList = (settlement.npcs || []).filter(n => !n.deceased).slice(0, cfg.maxHouses);
  for (let i = 0; i < npcList.length && i < houseSlots.length; i++) {
    const npc = npcList[i];
    const slot = houseSlots[i];
    const roofHex = HOUSE_ROOF_COLORS[i % HOUSE_ROOF_COLORS.length];
    const hx = Math.max(1, Math.min(slot.hx, W - 4));
    const hy = Math.max(roadY + 1, Math.min(slot.hy, H - 4));
    if (hx + 3 >= W - 1 || hy + 3 >= H - 1) continue;

    placeBuilding(tiles, hx, hy, 3, 3, W, H);
    const doorX = hx + 1;
    const doorY = hy + 2;
    setTile(tiles, doorX, doorY, T.DOOR, W, H);
    for (let py = doorY + 1; py <= Math.min(H - 2, doorY + 2); py++)
      if (tiles[py][doorX] !== T.PATH) setTile(tiles, doorX, py, T.PATH, W, H);

    // Flower box by house door
    if (hx + 3 < W - 1 && tiles[doorY]?.[hx + 3] !== T.WALL) {
      setTile(tiles, hx + 3, hy, T.FLOWER, W, H);
    }

    houses.push({ id: npc.id + '_house', type: 'house', name: `${npc.name}'s House`, icon: '🏠', roofHex, x: hx, y: hy, w: 3, h: 3, doorX, doorY, kind: 'house', npc });
  }

  // --- SCATTER TREES + FLOWERS ---
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (tiles[y][x] !== T.GRASS) continue;
      if (rng.next() < cfg.treeChance) {
        const nearDoor = [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy]) => tiles[y+dy]?.[x+dx] === T.DOOR || tiles[y+dy]?.[x+dx] === T.PATH || tiles[y+dy]?.[x+dx] === T.COBBLE);
        if (!nearDoor) tiles[y][x] = T.TREE;
      } else if (rng.next() < 0.03) {
        const nearPath = [[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy]) => tiles[y+dy]?.[x+dx] === T.PATH || tiles[y+dy]?.[x+dx] === T.COBBLE);
        if (nearPath) tiles[y][x] = T.FLOWER;
      }
    }
  }

  // --- PLAYER SPAWN (south entrance) ---
  const spawnX = midX;
  const spawnY = H - 3;
  setTile(tiles, spawnX, spawnY, T.PATH, W, H);
  setTile(tiles, spawnX, spawnY + 1, T.PATH, W, H);

  // --- WAGON ---
  const wagonX = Math.min(W - 3, midX + 3);
  const wagonY = H - 4;
  setTile(tiles, wagonX,     wagonY,     T.PATH, W, H);
  setTile(tiles, wagonX - 1, wagonY,     T.PATH, W, H);
  setTile(tiles, wagonX,     wagonY + 1, T.PATH, W, H);
  setTile(tiles, wagonX - 1, wagonY + 1, T.PATH, W, H);
  const wagon = { x: wagonX, y: wagonY };

  return { width: W, height: H, tiles, buildings, houses, decorations, playerStart: { x: spawnX, y: spawnY }, northEntry: { x: spawnX, y: 2 }, wagon };
}
