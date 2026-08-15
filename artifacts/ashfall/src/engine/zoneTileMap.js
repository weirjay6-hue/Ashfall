import { RNG } from './rng.js';

export const TERRAIN_MOBS = {
  plains:    [{ id: 'wolf',        name: 'Wolf',         emoji: '🐺' }, { id: 'goblin',      name: 'Goblin',       emoji: '👺' }],
  forest:    [{ id: 'wolf',        name: 'Wolf',         emoji: '🐺' }, { id: 'giant_spider', name: 'Giant Spider', emoji: '🕷️' }],
  mountains: [{ id: 'orc_warrior', name: 'Orc Warrior',  emoji: '🗡️' }, { id: 'dire_wolf',   name: 'Dire Wolf',    emoji: '🐺' }],
  desert:    [{ id: 'bandit',      name: 'Bandit',       emoji: '⚔️' }, { id: 'skeleton',    name: 'Skeleton',     emoji: '💀' }],
  swamp:     [{ id: 'zombie',      name: 'Zombie',       emoji: '🧟' }, { id: 'wight',       name: 'Wight',        emoji: '👻' }],
  coast:     [{ id: 'giant_spider', name: 'Giant Spider', emoji: '🕷️'}, { id: 'bandit',      name: 'Bandit',       emoji: '⚔️' }],
  ocean:     null,
};

export function generateMob(region, chunkX, chunkY, tiles, W, H) {
  const terrain = region.terrain || 'plains';
  const pool = TERRAIN_MOBS[terrain];
  if (!pool) return null;

  const rng = new RNG(region.id + `_mob_${chunkX}_${chunkY}_v1`);
  const template = pool[rng.int(0, pool.length - 1)];

  const spawnX = Math.floor(W / 2);
  const spawnY = H - 2;

  for (let attempt = 0; attempt < 60; attempt++) {
    const x = rng.int(2, W - 3);
    const y = rng.int(2, H - 3);
    const tile = tiles[y]?.[x];
    if (!ZONE_WALKABLE.has(tile)) continue;
    if (tile === ZT.SETTLEMENT || tile === ZT.DUNGEON || tile === ZT.POI) continue;
    const distFromSpawn = Math.abs(x - spawnX) + Math.abs(y - spawnY);
    if (distFromSpawn < 4) continue;
    return { ...template, x, y };
  }
  return null;
}

export const ZT = {
  GRASS: 0,
  TREE: 1,
  ROCK: 2,
  SAND: 3,
  SWAMP: 4,
  WATER: 5,
  PATH: 6,
  COBBLE: 7,
  BUSH: 8,
  TALL_GRASS: 9,
  FLOWER: 10,
  MOUNTAIN: 11,
  SNOW: 12,
  MUD: 13,
  SETTLEMENT: 14,
  DUNGEON: 15,
  POI: 16,
  BORDER: 17,
};

export const ZONE_WALKABLE = new Set([
  ZT.GRASS, ZT.SAND, ZT.SWAMP, ZT.PATH, ZT.COBBLE,
  ZT.BUSH, ZT.TALL_GRASS, ZT.FLOWER, ZT.SNOW, ZT.MUD,
  ZT.SETTLEMENT, ZT.DUNGEON, ZT.POI,
]);

export const CHUNK_W = 22;
export const CHUNK_H = 16;
export const CHUNK_GRID = 4;

const CHUNK_NAMES = {
  plains:    ['Rolling Fields','Flower Meadow','Old Farm','Windmill Hill',"Shepherd's Path",'Brook Crossing','Hilltop View','Open Pasture','Harvest Fields'],
  forest:    ['Forest Entrance','Dense Thicket','Wolf Clearing','Ancient Tree','Hunter Camp','Hidden Grove','Dark Woods','Mossy Trail','Sylvan Lake'],
  mountains: ['Mountain Pass','Rocky Outcrop',"Eagle's Peak",'Frozen Summit','Stone Trail','Dwarf Mine','Blizzard Gap','Ice Shelf','Avalanche Ridge'],
  desert:    ['Desert Gate','Sand Dunes','Scorched Flats','Bone Wastes','Oasis Path','Caravan Route','Dust Devil','Ancient Ruins','Mirage Sands'],
  swamp:     ['Swamp Edge','Rotting Logs','Murk Pool','Fog Hollow','Serpent Trail','Bog Wallow',"Witch's Clearing",'Dead Mangrove','Croc Marsh'],
  coast:     ['Beach Trail','Coastal Cliffs','Tide Pools','Sandy Cove','Driftwood Shore',"Fisherman's Camp",'Sea Cave','Rocky Shore','Harbor Inlet'],
  ocean:     ['Open Water','Choppy Seas','Deep Currents','Coral Shallows','Storm Surge','Calm Bay','Sea Fog','Reef Edge','Abyss Approach'],
};

function st(tiles, x, y, t, W, H) {
  if (x >= 0 && y >= 0 && x < W && y < H) tiles[y][x] = t;
}

function hLine(tiles, y, x1, x2, t, W, H) {
  for (let x = x1; x <= x2; x++) st(tiles, x, y, t, W, H);
}

function vLine(tiles, x, y1, y2, t, W, H) {
  for (let y = y1; y <= y2; y++) st(tiles, x, y, t, W, H);
}

function cluster(tiles, t, cx, cy, r, W, H, rng) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (Math.sqrt(dx * dx + dy * dy) <= r && rng.next() > 0.25)
        st(tiles, cx + dx, cy + dy, t, W, H);
    }
  }
}

function scatter(tiles, t, chance, W, H, rng, allowed) {
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++)
      if ((!allowed || allowed.has(tiles[y][x])) && rng.next() < chance)
        tiles[y][x] = t;
}

function isWalkish(t) {
  return ZONE_WALKABLE.has(t) && t !== ZT.SETTLEMENT && t !== ZT.DUNGEON && t !== ZT.POI;
}

function applyTerrain(tiles, terrain, W, H, rng) {
  const G = new Set([ZT.GRASS]);
  const S = new Set([ZT.SAND]);
  const SW = new Set([ZT.SWAMP]);
  const M = new Set([ZT.MOUNTAIN]);

  if (terrain === 'plains') {
    scatter(tiles, ZT.TALL_GRASS, 0.13, W, H, rng, G);
    scatter(tiles, ZT.FLOWER,     0.06, W, H, rng, new Set([ZT.GRASS, ZT.TALL_GRASS]));
    scatter(tiles, ZT.BUSH,       0.05, W, H, rng, G);
    const nc = rng.int(1, 3);
    for (let i = 0; i < nc; i++)
      cluster(tiles, ZT.TREE, rng.int(3, W-4), rng.int(2, H-4), rng.int(1, 3), W, H, rng);
    if (rng.bool(0.4)) cluster(tiles, ZT.WATER, rng.int(4, W-5), rng.int(3, H-5), rng.int(1, 2), W, H, rng);
  } else if (terrain === 'forest') {
    for (let y = 1; y < H-1; y++)
      for (let x = 1; x < W-1; x++)
        if (rng.next() < 0.55) tiles[y][x] = ZT.TREE;
    scatter(tiles, ZT.BUSH, 0.05, W, H, rng, G);
    if (rng.bool(0.5)) cluster(tiles, ZT.WATER, rng.int(4, W-5), rng.int(3, H-5), rng.int(1, 3), W, H, rng);
    const nc = rng.int(2, 5);
    for (let i = 0; i < nc; i++)
      cluster(tiles, ZT.GRASS, rng.int(3, W-4), rng.int(2, H-4), rng.int(2, 4), W, H, rng);
  } else if (terrain === 'mountains') {
    for (let y = 1; y < H-1; y++)
      for (let x = 1; x < W-1; x++)
        tiles[y][x] = ZT.MOUNTAIN;
    scatter(tiles, ZT.SNOW,  0.3, W, H, rng, M);
    scatter(tiles, ZT.ROCK,  0.05, W, H, rng, M);
    for (let i = 0; i < rng.int(2, 5); i++)
      cluster(tiles, ZT.GRASS, rng.int(3, W-4), rng.int(Math.floor(H*0.4), H-3), rng.int(1, 3), W, H, rng);
  } else if (terrain === 'desert') {
    for (let y = 1; y < H-1; y++)
      for (let x = 1; x < W-1; x++)
        tiles[y][x] = ZT.SAND;
    scatter(tiles, ZT.ROCK, 0.07, W, H, rng, S);
    scatter(tiles, ZT.BUSH, 0.03, W, H, rng, S);
    if (rng.bool(0.5)) {
      const ox = rng.int(5, W-6);
      const oy = rng.int(4, H-6);
      cluster(tiles, ZT.GRASS, ox, oy, 3, W, H, rng);
      cluster(tiles, ZT.WATER, ox, oy, 1, W, H, rng);
    }
  } else if (terrain === 'swamp') {
    for (let y = 1; y < H-1; y++)
      for (let x = 1; x < W-1; x++)
        tiles[y][x] = ZT.SWAMP;
    for (let i = 0; i < rng.int(3, 6); i++)
      cluster(tiles, ZT.WATER, rng.int(3, W-4), rng.int(2, H-4), rng.int(1, 4), W, H, rng);
    scatter(tiles, ZT.MUD,  0.1, W, H, rng, SW);
    scatter(tiles, ZT.TREE, 0.06, W, H, rng, new Set([ZT.SWAMP, ZT.MUD]));
  } else if (terrain === 'coast' || terrain === 'ocean') {
    for (let y = 1; y < H-1; y++)
      for (let x = 1; x < W-1; x++) {
        tiles[y][x] = y > H * 0.65 ? ZT.WATER : y > H * 0.5 ? ZT.SAND : ZT.GRASS;
      }
    scatter(tiles, ZT.FLOWER, 0.04, W, H, rng, G);
    scatter(tiles, ZT.BUSH,   0.03, W, H, rng, G);
  }
}

const PATH_BLOCK = new Set([ZT.WATER, ZT.SETTLEMENT, ZT.DUNGEON, ZT.POI]);

function ensureExits(tiles, W, H) {
  const midX = Math.floor(W / 2);
  const midY = Math.floor(H / 2);
  const EXITS = [
    [midX, 0], [midX, 1],
    [midX, H-1], [midX, H-2],
    [0, midY], [1, midY],
    [W-1, midY], [W-2, midY],
  ];
  for (const [x, y] of EXITS) {
    if (!PATH_BLOCK.has(tiles[y]?.[x]))
      tiles[y][x] = ZT.PATH;
  }
  for (let x = 2; x < W-2; x++)
    if (!PATH_BLOCK.has(tiles[midY]?.[x]))
      tiles[midY][x] = ZT.PATH;
  for (let y = 2; y < H-2; y++)
    if (!PATH_BLOCK.has(tiles[y]?.[midX]))
      tiles[y][midX] = ZT.PATH;
}

export function getHexLayout(region) {
  const layout = Array(CHUNK_GRID * CHUNK_GRID).fill(null);
  if (region.settlements?.length > 0) {
    layout[4] = { type: 'settlement', data: region.settlements[0] };
  }
  if (region.dungeons?.length > 0) {
    layout[2] = { type: 'dungeon', data: region.dungeons[0] };
  }
  if (region.pointsOfInterest?.length > 0) {
    layout[6] = { type: 'poi', data: region.pointsOfInterest[0] };
  }
  return layout;
}

export function getChunkName(region, chunkX, chunkY) {
  const rng = new RNG(region.id + '_names_v1');
  const names = CHUNK_NAMES[region.terrain] || CHUNK_NAMES.plains;
  const shuffled = [...names];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled[chunkY * CHUNK_GRID + chunkX] || names[chunkY * CHUNK_GRID + chunkX] || 'Unknown Area';
}

export function generateChunk(region, chunkX, chunkY) {
  const seed = region.id + `_chunk_${chunkX}_${chunkY}_v1`;
  const rng = new RNG(seed);
  const W = CHUNK_W;
  const H = CHUNK_H;
  const terrain = region.terrain || 'plains';
  const tiles = Array.from({ length: H }, () => Array(W).fill(ZT.GRASS));

  applyTerrain(tiles, terrain, W, H, rng);

  const borderTile = terrain === 'mountains' ? ZT.MOUNTAIN
    : terrain === 'desert' ? ZT.ROCK : ZT.TREE;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (x === 0 || y === 0 || x === W-1 || y === H-1)
        tiles[y][x] = borderTile;

  ensureExits(tiles, W, H);

  const layout = getHexLayout(region);
  const rawSpecial = layout[chunkY * CHUNK_GRID + chunkX] || null;
  const midX = Math.floor(W / 2);
  const midY = Math.floor(H / 2);

  let special = null;
  if (rawSpecial) {
    const sx = midX;
    const sy = midY - 2;
    special = { ...rawSpecial, x: sx, y: sy };

    if (rawSpecial.type === 'settlement') {
      // Wide cobblestone plaza around the gate (5 wide, 4 tall)
      for (let dy = -3; dy <= 1; dy++)
        for (let dx = -4; dx <= 4; dx++)
          st(tiles, sx+dx, sy+dy, ZT.COBBLE, W, H);
      // Gate tile in the center
      tiles[sy][sx] = ZT.SETTLEMENT;
      // 3-tile-wide cobblestone road leading down to the player spawn
      for (let y = sy+1; y <= midY+1; y++) {
        st(tiles, sx-1, y, ZT.COBBLE, W, H);
        st(tiles, sx,   y, ZT.COBBLE, W, H);
        st(tiles, sx+1, y, ZT.COBBLE, W, H);
      }
    } else if (rawSpecial.type === 'dungeon') {
      tiles[Math.max(1, sy)][sx] = ZT.DUNGEON;
      vLine(tiles, sx, Math.max(1, sy)+1, midY, ZT.PATH, W, H);
    } else if (rawSpecial.type === 'poi') {
      tiles[Math.max(1, sy)][sx] = ZT.POI;
      vLine(tiles, sx, Math.max(1, sy)+1, midY, ZT.PATH, W, H);
    }
  }

  const spawnX = midX;
  const spawnY = H - 2;
  for (let dy = -1; dy <= 0; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if (!PATH_BLOCK.has(tiles[spawnY + dy]?.[spawnX + dx]))
        st(tiles, spawnX + dx, spawnY + dy, ZT.PATH, W, H);

  return { width: W, height: H, tiles, playerStart: { x: spawnX, y: spawnY }, special, terrain };
}
