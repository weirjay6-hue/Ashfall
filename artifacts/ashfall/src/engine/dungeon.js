import { RNG } from './rng.js';
import { MONSTER_TEMPLATES } from '../data/monsters.js';
import { generateLoot } from './items.js';

export const TILE_TYPES = {
  WALL:        0,
  FLOOR:       1,
  DOOR:        2,
  STAIRS_DOWN: 3,
  STAIRS_UP:   4,
  CHEST:       5,
  TRAP:        6,
  ENTRANCE:    7,
  SHRINE:      8,
  PILLAR:      9,
  WATER:       10,
  SECRET_DOOR: 11,
  RUBBLE:      12,
  TORCH:       13,
};

export const ROOM_TYPES = {
  NORMAL:   'normal',
  ENTRY:    'entry',
  BOSS:     'boss',
  TREASURE: 'treasure',
  SECRET:   'secret',
  SHRINE:   'shrine',
  GUARD:    'guard',
};

export const DUNGEON_TYPES = {
  cave: {
    name: 'Cave System',
    desc: 'A natural cave network carved by ancient rivers. Water drips in the darkness.',
    monsters: ['wolf', 'giant_spider', 'goblin', 'troll'],
    bossPool: ['troll', 'werewolf', 'minotaur'],
    wallColor: '#504030', floorColor: '#1e1810', accent: '#a07840',
    wallGlyph: '▓', floorGlyph: '·', waterGlyph: '≈',
    tileVariants: true,
    hasWater: true,
    hasPillars: false,
    hasRubble: true,
  },
  crypt: {
    name: 'Ancient Crypt',
    desc: 'A burial vault of forgotten kings. The dead do not rest here.',
    monsters: ['skeleton', 'zombie', 'banshee', 'wight'],
    bossPool: ['lich', 'corrupted_knight', 'vampire'],
    wallColor: '#484050', floorColor: '#1c1824', accent: '#9858c8',
    wallGlyph: '█', floorGlyph: '·', waterGlyph: '≈',
    tileVariants: false,
    hasWater: false,
    hasPillars: true,
    hasRubble: false,
  },
  ruins: {
    name: 'Ancient Ruins',
    desc: 'Crumbling stone halls of a collapsed civilization. Danger hides in the rubble.',
    monsters: ['bandit', 'skeleton', 'dark_mage', 'cult_fanatic'],
    bossPool: ['corrupted_knight', 'dark_mage', 'minotaur'],
    wallColor: '#485048', floorColor: '#181e18', accent: '#70a860',
    wallGlyph: '▓', floorGlyph: '·', waterGlyph: '≈',
    tileVariants: true,
    hasWater: false,
    hasPillars: true,
    hasRubble: true,
  },
  tower: {
    name: 'Dark Tower',
    desc: 'A sorcerer\'s spire filled with arcane traps and conjured guardians.',
    monsters: ['dark_mage', 'imp', 'cult_fanatic', 'gargoyle'],
    bossPool: ['lich', 'dark_mage', 'vampire'],
    wallColor: '#2a3050', floorColor: '#10121e', accent: '#4870d8',
    wallGlyph: '█', floorGlyph: '·', waterGlyph: '≈',
    tileVariants: false,
    hasWater: false,
    hasPillars: true,
    hasRubble: false,
  },
  mine: {
    name: 'Abandoned Mine',
    desc: 'A collapsed mining shaft carved deep into the mountain. Something moved in.',
    monsters: ['goblin', 'orc_warrior', 'giant_spider', 'troll'],
    bossPool: ['troll', 'minotaur', 'earth_elemental'],
    wallColor: '#3a3028', floorColor: '#161410', accent: '#c8a838',
    wallGlyph: '▓', floorGlyph: '·', waterGlyph: '≈',
    tileVariants: true,
    hasWater: false,
    hasPillars: false,
    hasRubble: true,
  },
  banditHideout: {
    name: 'Bandit Hideout',
    desc: 'A fortified outlaw camp dug into the hillside. Armed and dangerous.',
    monsters: ['bandit', 'bandit', 'orc_warrior', 'dark_assassin'],
    bossPool: ['dark_assassin', 'orc_warrior', 'bandit'],
    wallColor: '#4a3828', floorColor: '#1c1408', accent: '#c08830',
    wallGlyph: '▓', floorGlyph: '·', waterGlyph: '≈',
    tileVariants: false,
    hasWater: false,
    hasPillars: false,
    hasRubble: true,
  },
  necromancerTower: {
    name: "Necromancer's Tower",
    desc: 'A tower of dark sorcery. The air smells of rot and forbidden magic.',
    monsters: ['zombie', 'skeleton', 'dark_mage', 'lich'],
    bossPool: ['lich', 'corrupted_knight', 'vampire'],
    wallColor: '#403050', floorColor: '#140e20', accent: '#b040f0',
    wallGlyph: '█', floorGlyph: '·', waterGlyph: '≈',
    tileVariants: false,
    hasWater: false,
    hasPillars: true,
    hasRubble: false,
  },
  swampDen: {
    name: 'Swamp Den',
    desc: 'A fetid underground lair carved beneath the bogs. Everything is wet and rotten.',
    monsters: ['lizardman', 'swamp_hag', 'zombie', 'giant_spider'],
    bossPool: ['swamp_hag', 'troll', 'werewolf'],
    wallColor: '#2a4030', floorColor: '#0e1810', accent: '#50a050',
    wallGlyph: '▓', floorGlyph: '·', waterGlyph: '≈',
    tileVariants: true,
    hasWater: true,
    hasPillars: false,
    hasRubble: true,
  },
};

export function getDungeonTypeForBiome(biome, rng) {
  const map = {
    plains:    ['banditHideout', 'ruins', 'cave'],
    forest:    ['cave', 'ruins', 'banditHideout'],
    mountains: ['cave', 'mine', 'ruins'],
    desert:    ['ruins', 'banditHideout', 'cave'],
    swamp:     ['swampDen', 'crypt', 'cave'],
    coast:     ['cave', 'ruins', 'banditHideout'],
    ocean:     ['cave', 'ruins'],
  };
  const options = map[biome] || ['cave'];
  return options[rng.int(0, options.length - 1)];
}

export function generateDungeon(seed, dangerLevel, type = 'cave', floors = 3) {
  const rng = new RNG(seed);
  const dungeonType = DUNGEON_TYPES[type] || DUNGEON_TYPES.cave;
  const dungeon = {
    id: `dungeon_${seed}`,
    seed, type,
    name: dungeonType.name,
    desc: dungeonType.desc,
    dangerLevel,
    floors: [],
    currentFloor: 0,
    explored: false,
    bossSlain: false,
  };
  const numFloors = Math.max(2, Math.min(5, floors));
  for (let f = 0; f < numFloors; f++) {
    const isBossFloor = f === numFloors - 1;
    dungeon.floors.push(isBossFloor
      ? generateBossFloor(rng, dangerLevel, dungeonType, f, numFloors)
      : generateFloor(rng, dangerLevel, dungeonType, f, numFloors));
  }
  return dungeon;
}

function generateFloor(rng, dangerLevel, dungeonType, floorIndex, totalFloors) {
  const WIDTH  = 56;
  const HEIGHT = 34;
  const grid   = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(TILE_TYPES.WALL));

  const rooms  = [];
  const ATTEMPTS = 80;

  for (let a = 0; a < ATTEMPTS; a++) {
    const rw = rng.int(4, 11);
    const rh = rng.int(3, 8);
    const rx = rng.int(1, WIDTH  - rw - 2);
    const ry = rng.int(1, HEIGHT - rh - 2);
    if (rooms.every(r => !rectsOverlap(r, { x: rx, y: ry, w: rw, h: rh }, 1))) {
      rooms.push({ x: rx, y: ry, w: rw, h: rh, type: ROOM_TYPES.NORMAL });
      carveRoom(grid, rx, ry, rw, rh);
    }
  }

  // Assign special room types
  if (rooms.length > 0) rooms[0].type = ROOM_TYPES.ENTRY;
  if (rooms.length > 1) rooms[rooms.length - 1].type = ROOM_TYPES.BOSS;
  for (let i = 1; i < rooms.length - 1; i++) {
    const roll = rng.float();
    if (roll < 0.10 && rooms.length > 5) rooms[i].type = ROOM_TYPES.SECRET;
    else if (roll < 0.18) rooms[i].type = ROOM_TYPES.TREASURE;
    else if (roll < 0.25) rooms[i].type = ROOM_TYPES.SHRINE;
    else if (roll < 0.40) rooms[i].type = ROOM_TYPES.GUARD;
  }

  // Connect rooms
  for (let i = 1; i < rooms.length; i++) {
    const a = roomCenter(rooms[i - 1]);
    const b = roomCenter(rooms[i]);
    if (rng.bool()) {
      carveLine(grid, a.x, a.y, b.x, a.y);
      carveLine(grid, b.x, a.y, b.x, b.y);
    } else {
      carveLine(grid, a.x, a.y, a.x, b.y);
      carveLine(grid, a.x, b.y, b.x, b.y);
    }
    if (rng.bool(0.35)) {
      const mid = { x: Math.floor((a.x + b.x) / 2), y: Math.floor((a.y + b.y) / 2) };
      if (mid.x > 0 && mid.y > 0 && mid.x < WIDTH - 1 && mid.y < HEIGHT - 1)
        grid[mid.y][mid.x] = TILE_TYPES.DOOR;
    }
  }

  // Place pillars in pillar-type dungeons
  if (dungeonType.hasPillars) {
    for (const room of rooms) {
      if (room.type !== ROOM_TYPES.ENTRY && room.w >= 6 && room.h >= 5 && rng.bool(0.5)) {
        const px1 = room.x + 1, py1 = room.y + 1;
        const px2 = room.x + room.w - 2, py2 = room.y + room.h - 2;
        grid[py1][px1] = TILE_TYPES.PILLAR;
        grid[py1][px2] = TILE_TYPES.PILLAR;
        grid[py2][px1] = TILE_TYPES.PILLAR;
        grid[py2][px2] = TILE_TYPES.PILLAR;
      }
    }
  }

  // Place water puddles
  if (dungeonType.hasWater) {
    const numPuddles = rng.int(1, 4);
    for (let p = 0; p < numPuddles; p++) {
      const room = rooms[rng.int(1, rooms.length - 1)];
      const wx = roomCenter(room).x + rng.int(-1, 1);
      const wy = roomCenter(room).y + rng.int(-1, 1);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = wx + dx, ny = wy + dy;
          if (nx > 0 && ny > 0 && nx < WIDTH - 1 && ny < HEIGHT - 1 && grid[ny][nx] === TILE_TYPES.FLOOR) {
            if (rng.bool(0.6)) grid[ny][nx] = TILE_TYPES.WATER;
          }
        }
      }
    }
  }

  // Place rubble
  if (dungeonType.hasRubble) {
    const numRubble = rng.int(3, 8);
    for (let r = 0; r < numRubble; r++) {
      const room = rooms[rng.int(0, rooms.length - 1)];
      const rx2 = room.x + rng.int(0, room.w - 1);
      const ry2 = room.y + rng.int(0, room.h - 1);
      if (grid[ry2][rx2] === TILE_TYPES.FLOOR) grid[ry2][rx2] = TILE_TYPES.RUBBLE;
    }
  }

  const enemies = [];
  const chests  = [];
  const traps   = [];
  const shrines = [];

  const startRoom   = rooms[0];
  const startPos    = roomCenter(startRoom);
  const startTile   = floorIndex === 0 ? TILE_TYPES.ENTRANCE : TILE_TYPES.STAIRS_UP;
  grid[startPos.y][startPos.x] = startTile;

  for (let i = 1; i < rooms.length; i++) {
    const room   = rooms[i];
    const center = roomCenter(room);

    if (room.type === ROOM_TYPES.BOSS && i === rooms.length - 1) {
      grid[center.y][center.x] = TILE_TYPES.STAIRS_DOWN;
      const bossId = dungeonType.bossPool[rng.int(0, dungeonType.bossPool.length - 1)];
      const boss   = spawnEnemy(bossId, dangerLevel, center, rng, true);
      if (boss) enemies.push(boss);

      // Add a mini-boss guard
      if (rng.bool(0.5) && dungeonType.monsters.length > 1) {
        const guardId = dungeonType.monsters[rng.int(0, dungeonType.monsters.length - 2)];
        const guard   = spawnEnemy(guardId, dangerLevel, { x: center.x + 2, y: center.y }, rng, false);
        if (guard) enemies.push(guard);
      }

    } else if (room.type === ROOM_TYPES.TREASURE) {
      // 2 chests, minimal enemies
      grid[center.y][center.x] = TILE_TYPES.CHEST;
      chests.push({ x: center.x, y: center.y, loot: generateLoot(dangerLevel + 1, rng), opened: false });
      if (room.w > 6) {
        const cx2 = center.x + 2;
        grid[center.y][cx2] = TILE_TYPES.CHEST;
        chests.push({ x: cx2, y: center.y, loot: generateLoot(dangerLevel, rng), opened: false });
      }
      // Guard the treasure
      if (rng.bool(0.7)) {
        const guardId = dungeonType.monsters[rng.int(0, dungeonType.monsters.length - 1)];
        const guard   = spawnEnemy(guardId, dangerLevel, { x: center.x - 2, y: center.y }, rng, false);
        if (guard) enemies.push(guard);
      }

    } else if (room.type === ROOM_TYPES.SHRINE) {
      grid[center.y][center.x] = TILE_TYPES.SHRINE;
      shrines.push({ x: center.x, y: center.y, used: false });

    } else if (room.type === ROOM_TYPES.SECRET) {
      // Mark corridor entrance as secret door
      grid[center.y][center.x] = TILE_TYPES.CHEST;
      chests.push({ x: center.x, y: center.y, loot: generateLoot(dangerLevel + 2, rng), opened: false, secret: true });

    } else if (room.type === ROOM_TYPES.GUARD) {
      // Multiple enemies, no chest
      const numEnemies = rng.int(2, 4);
      for (let e = 0; e < numEnemies; e++) {
        const tId = dungeonType.monsters[rng.int(0, dungeonType.monsters.length - 1)];
        const pos = {
          x: clamp(center.x + rng.int(-2, 2), room.x + 1, room.x + room.w - 2),
          y: clamp(center.y + rng.int(-2, 2), room.y + 1, room.y + room.h - 2),
        };
        const enemy = spawnEnemy(tId, dangerLevel, pos, rng, false);
        if (enemy) enemies.push(enemy);
      }

    } else {
      // Normal room
      if (rng.bool(0.55)) {
        const tId  = dungeonType.monsters[rng.int(0, dungeonType.monsters.length - 1)];
        const enemy = spawnEnemy(tId, dangerLevel, center, rng, false);
        if (enemy) {
          enemies.push(enemy);
          if (rng.bool(0.3) && room.w > 5) {
            const tId2 = dungeonType.monsters[rng.int(0, dungeonType.monsters.length - 1)];
            const extra = spawnEnemy(tId2, dangerLevel,
              { x: clamp(center.x + rng.int(-2, 2), room.x+1, room.x+room.w-2),
                y: clamp(center.y + rng.int(-1, 1), room.y+1, room.y+room.h-2) }, rng, false);
            if (extra) enemies.push(extra);
          }
        }
      }
      if (rng.bool(0.22)) {
        grid[center.y][center.x] = TILE_TYPES.CHEST;
        chests.push({ x: center.x, y: center.y, loot: generateLoot(dangerLevel, rng), opened: false });
      }
      if (rng.bool(0.20) && i > 1) {
        const trapX = rng.int(room.x + 1, room.x + room.w - 2);
        const trapY = rng.int(room.y + 1, room.y + room.h - 2);
        if (grid[trapY][trapX] === TILE_TYPES.FLOOR) {
          grid[trapY][trapX] = TILE_TYPES.TRAP;
          traps.push({ x: trapX, y: trapY, damage: rng.int(5, 15) * dangerLevel, triggered: false, detected: false });
        }
      }
    }

    // Torches in larger rooms
    if (room.w >= 6 && rng.bool(0.4)) {
      const tx = room.x + 1;
      const ty = room.y + 1;
      if (grid[ty][tx] === TILE_TYPES.FLOOR) grid[ty][tx] = TILE_TYPES.TORCH;
    }
  }

  const fogOfWar = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(true));
  const seen     = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(false));

  return {
    width: WIDTH, height: HEIGHT, grid, rooms,
    enemies, items: [], chests, traps, shrines,
    fogOfWar, seen,
    playerPos: startPos, floorIndex,
    isBossFloor: false,
  };
}

function generateBossFloor(rng, dangerLevel, dungeonType, floorIndex, totalFloors) {
  const WIDTH  = 60;
  const HEIGHT = 36;
  const grid   = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(TILE_TYPES.WALL));

  // Entry hall
  const entryRoom = { x: 2, y: 14, w: 9, h: 8 };
  carveRoom(grid, entryRoom.x, entryRoom.y, entryRoom.w, entryRoom.h);

  // Approach corridor with side alcoves
  const corridorY = entryRoom.y + Math.floor(entryRoom.h / 2);
  for (let x = entryRoom.x + entryRoom.w; x <= 38; x++) {
    grid[corridorY][x]     = TILE_TYPES.FLOOR;
    grid[corridorY + 1][x] = TILE_TYPES.FLOOR;
  }
  grid[corridorY][entryRoom.x + entryRoom.w + 4] = TILE_TYPES.DOOR;
  grid[corridorY + 1][entryRoom.x + entryRoom.w + 4] = TILE_TYPES.DOOR;

  // Side alcoves for pre-boss guards
  const alcoves = [
    { x: 15, y: corridorY - 4, w: 5, h: 4 },
    { x: 25, y: corridorY - 4, w: 5, h: 4 },
    { x: 15, y: corridorY + 2, w: 5, h: 4 },
    { x: 25, y: corridorY + 2, w: 5, h: 4 },
  ];
  for (const alc of alcoves) {
    if (alc.x + alc.w < WIDTH && alc.y + alc.h < HEIGHT && alc.y >= 0) {
      carveRoom(grid, alc.x, alc.y, alc.w, alc.h);
      // Connect to corridor
      for (let cy = Math.min(corridorY, alc.y); cy <= Math.max(corridorY + 1, alc.y + alc.h - 1); cy++) {
        if (cy >= 0 && cy < HEIGHT && alc.x + 2 < WIDTH) grid[cy][alc.x + 2] = TILE_TYPES.FLOOR;
      }
    }
  }

  // Boss chamber — grand room
  const bossRoom = { x: 38, y: 6, w: 20, h: 24 };
  carveRoom(grid, bossRoom.x, bossRoom.y, bossRoom.w, bossRoom.h);

  // Boss room pillars
  if (dungeonType.hasPillars) {
    grid[bossRoom.y + 2][bossRoom.x + 2] = TILE_TYPES.PILLAR;
    grid[bossRoom.y + 2][bossRoom.x + bossRoom.w - 3] = TILE_TYPES.PILLAR;
    grid[bossRoom.y + bossRoom.h - 3][bossRoom.x + 2] = TILE_TYPES.PILLAR;
    grid[bossRoom.y + bossRoom.h - 3][bossRoom.x + bossRoom.w - 3] = TILE_TYPES.PILLAR;
  }

  // Boss chamber entrance door
  grid[corridorY][bossRoom.x]     = TILE_TYPES.DOOR;
  grid[corridorY + 1][bossRoom.x] = TILE_TYPES.DOOR;

  const bossCenter = {
    x: bossRoom.x + Math.floor(bossRoom.w / 2),
    y: bossRoom.y + Math.floor(bossRoom.h / 2),
  };

  // Boss
  const bossId = dungeonType.bossPool[rng.int(0, dungeonType.bossPool.length - 1)];
  const boss   = spawnEnemy(bossId, dangerLevel, bossCenter, rng, true);
  const enemies = boss ? [boss] : [];

  // Pre-boss guards in alcoves
  for (const alc of alcoves.slice(0, 2)) {
    if (rng.bool(0.7) && dungeonType.monsters.length > 0) {
      const gId  = dungeonType.monsters[rng.int(0, dungeonType.monsters.length - 1)];
      const gPos = { x: alc.x + 2, y: alc.y + 2 };
      const g    = spawnEnemy(gId, Math.max(1, dangerLevel - 1), gPos, rng, false);
      if (g) enemies.push(g);
    }
  }

  const startPos = { x: entryRoom.x + 3, y: entryRoom.y + Math.floor(entryRoom.h / 2) };
  grid[startPos.y][startPos.x] = TILE_TYPES.STAIRS_UP;

  // Exit / victory stairs
  const exitPos = { x: bossRoom.x + bossRoom.w - 2, y: bossRoom.y + Math.floor(bossRoom.h / 2) };
  if (exitPos.x < WIDTH && exitPos.y < HEIGHT) grid[exitPos.y][exitPos.x] = TILE_TYPES.STAIRS_DOWN;

  // Boss room treasure chests
  const chests = [];
  const chestPositions = [
    { x: bossRoom.x + 2, y: bossRoom.y + 2 },
    { x: bossRoom.x + 2, y: bossRoom.y + bossRoom.h - 3 },
    { x: bossRoom.x + bossRoom.w - 3, y: bossRoom.y + 2 },
  ];
  for (let ci = 0; ci < 2; ci++) {
    const cp = chestPositions[ci];
    if (cp.x < WIDTH && cp.y < HEIGHT) {
      grid[cp.y][cp.x] = TILE_TYPES.CHEST;
      chests.push({ x: cp.x, y: cp.y, loot: generateLoot(dangerLevel + 2 - ci, rng), opened: false });
    }
  }

  // Shrine before boss
  const shrinePos = { x: 34, y: corridorY - 2 };
  if (shrinePos.x < WIDTH && shrinePos.y >= 0 && shrinePos.y < HEIGHT) {
    grid[shrinePos.y][shrinePos.x]     = TILE_TYPES.FLOOR;
    grid[shrinePos.y + 1][shrinePos.x] = TILE_TYPES.SHRINE;
  }
  const shrines = [{ x: shrinePos.x, y: shrinePos.y + 1, used: false }];

  const fogOfWar = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(true));
  const seen     = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(false));

  return {
    width: WIDTH, height: HEIGHT, grid, rooms: [entryRoom, bossRoom],
    enemies, items: [], chests, traps: [], shrines,
    fogOfWar, seen,
    playerPos: startPos, floorIndex,
    isBossFloor: true,
    bossName: boss?.name || 'Unknown Horror',
  };
}

function spawnEnemy(templateId, dangerLevel, pos, rng, isBoss) {
  const template = MONSTER_TEMPLATES[templateId];
  if (!template) return null;
  const hpScale  = isBoss ? dangerLevel * 18 : dangerLevel * 5;
  const atkScale = isBoss ? dangerLevel * 5  : dangerLevel * 2;
  const hp = rng.int(template.hp[0], template.hp[1]) + hpScale;
  return {
    id: `enemy_${rng.uid()}`,
    templateId,
    name: template.name,
    hp, maxHp: hp,
    attack:  rng.int(template.attack[0], template.attack[1]) + atkScale,
    defense: template.defense + dangerLevel + (isBoss ? 4 : 0),
    xpReward:   rng.int(template.xpReward[0],   template.xpReward[1])   * (isBoss ? 4 : 1),
    goldReward: rng.int(template.goldReward[0],  template.goldReward[1]) * (isBoss ? 5 : 1),
    x: pos.x, y: pos.y,
    alive: true, isBoss,
    // AI patrol state
    patrolDir: { x: rng.int(-1, 1), y: rng.int(-1, 1) },
    patrolTimer: 0,
    aggro: false,
  };
}

export function revealFog(floor, px, py, radius = 5) {
  const newFog  = Array.from({ length: floor.height }, () => Array(floor.width).fill(true));
  const newSeen = (floor.seen || Array.from({ length: floor.height }, () => Array(floor.width).fill(false)))
    .map(row => [...row]);

  for (let y = Math.max(0, py - radius); y <= Math.min(floor.height - 1, py + radius); y++) {
    for (let x = Math.max(0, px - radius); x <= Math.min(floor.width - 1, px + radius); x++) {
      if (Math.sqrt((x - px) ** 2 + (y - py) ** 2) <= radius) {
        newFog[y][x]  = false;
        newSeen[y][x] = true;
      }
    }
  }
  return { ...floor, fogOfWar: newFog, seen: newSeen };
}

export function moveDungeon(dungeon, dx, dy) {
  const floor      = dungeon.floors[dungeon.currentFloor];
  const { playerPos } = floor;
  const nx = playerPos.x + dx;
  const ny = playerPos.y + dy;

  if (nx < 0 || ny < 0 || nx >= floor.width || ny >= floor.height) return { dungeon, event: null };

  const tile = floor.grid[ny][nx];
  if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.PILLAR) return { dungeon, event: null };

  const enemy = floor.enemies.find(e => e.alive && e.x === nx && e.y === ny);
  if (enemy) return { dungeon, event: { type: 'combat', enemyId: enemy.templateId, enemy } };

  let event = null;
  const trap  = floor.traps?.find(t => !t.triggered && t.x === nx && t.y === ny);
  if (trap) {
    event = { type: 'trap', trap };
  } else if (tile === TILE_TYPES.CHEST) {
    const chest = floor.chests?.find(c => c.x === nx && c.y === ny && !c.opened);
    if (chest) event = { type: 'chest', chest };
  } else if (tile === TILE_TYPES.SHRINE) {
    const shrine = floor.shrines?.find(s => s.x === nx && s.y === ny && !s.used);
    if (shrine) event = { type: 'shrine', shrine };
  } else if (tile === TILE_TYPES.STAIRS_DOWN) {
    event = { type: 'stairs', direction: 'down' };
  } else if (tile === TILE_TYPES.WATER) {
    event = { type: 'water' };
  }

  const newFloor  = revealFog({ ...floor, playerPos: { x: nx, y: ny } }, nx, ny);
  const newFloors = dungeon.floors.map((f, i) => i === dungeon.currentFloor ? newFloor : f);
  return { dungeon: { ...dungeon, floors: newFloors }, event };
}

export function openChest(dungeon, chestPos) {
  const floorIdx = dungeon.currentFloor;
  const floor    = dungeon.floors[floorIdx];
  const chestIdx = floor.chests.findIndex(c => c.x === chestPos.x && c.y === chestPos.y);
  if (chestIdx < 0) return dungeon;
  const newChests     = [...floor.chests];
  newChests[chestIdx] = { ...newChests[chestIdx], opened: true };
  const newGrid       = floor.grid.map(row => [...row]);
  newGrid[chestPos.y][chestPos.x] = TILE_TYPES.FLOOR;
  const newFloor  = { ...floor, chests: newChests, grid: newGrid };
  const newFloors = dungeon.floors.map((f, i) => i === floorIdx ? newFloor : f);
  return { ...dungeon, floors: newFloors };
}

export function useShrine(dungeon, shrinePos) {
  const floorIdx  = dungeon.currentFloor;
  const floor     = dungeon.floors[floorIdx];
  const shrineIdx = floor.shrines?.findIndex(s => s.x === shrinePos.x && s.y === shrinePos.y);
  if (shrineIdx == null || shrineIdx < 0) return dungeon;
  const newShrines     = [...(floor.shrines || [])];
  newShrines[shrineIdx] = { ...newShrines[shrineIdx], used: true };
  const newFloor  = { ...floor, shrines: newShrines };
  const newFloors = dungeon.floors.map((f, i) => i === floorIdx ? newFloor : f);
  return { ...dungeon, floors: newFloors };
}

export function killEnemy(dungeon, enemyId) {
  const floorIdx = dungeon.currentFloor;
  const floor    = dungeon.floors[floorIdx];
  const idx      = floor.enemies.findIndex(e => e.id === enemyId);
  if (idx < 0) return dungeon;
  const newEnemies  = [...floor.enemies];
  newEnemies[idx]   = { ...newEnemies[idx], alive: false };
  const newFloor    = { ...floor, enemies: newEnemies };
  const newFloors   = dungeon.floors.map((f, i) => i === floorIdx ? newFloor : f);
  const bossSlain   = newEnemies.some(e => e.isBoss && !e.alive) && floor.isBossFloor;
  return { ...dungeon, floors: newFloors, bossSlain: dungeon.bossSlain || bossSlain };
}

export function moveEnemies(dungeon, playerDefense) {
  const floorIdx = dungeon.currentFloor;
  const floor    = dungeon.floors[floorIdx];
  const { playerPos, grid, enemies, fogOfWar } = floor;
  const ENEMY_VISION = 8;
  const events = [];

  const occupied = new Set(enemies.filter(e => e.alive).map(e => `${e.x},${e.y}`));

  const newEnemies = enemies.map(e => {
    if (!e.alive) return e;

    const distX = playerPos.x - e.x;
    const distY = playerPos.y - e.y;
    const dist  = Math.sqrt(distX * distX + distY * distY);
    const cheby = Math.max(Math.abs(distX), Math.abs(distY));
    const canSeePlayer = dist <= ENEMY_VISION && fogOfWar?.[e.y]?.[e.x] === false;

    // Aggro when player enters vision
    if (canSeePlayer && !e.aggro) {
      return { ...e, aggro: true };
    }

    if (canSeePlayer || e.aggro) {
      // Chase player
      if (cheby <= 1) {
        const rawDmg = Math.max(1, (e.attack || 5) - Math.floor(playerDefense / 2));
        events.push({ type: 'attack', enemy: e, damage: rawDmg });
        return e;
      }

      const allMoves = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      const sorted = allMoves
        .map(([mx, my]) => {
          const nx = e.x + mx, ny = e.y + my;
          const nd = Math.sqrt((playerPos.x - nx) ** 2 + (playerPos.y - ny) ** 2);
          return { mx, my, nx, ny, nd };
        })
        .sort((a, b) => a.nd - b.nd);

      occupied.delete(`${e.x},${e.y}`);
      for (const { mx, my, nx, ny } of sorted) {
        if (nx < 0 || ny < 0 || nx >= floor.width || ny >= floor.height) continue;
        const t = grid[ny][nx];
        if (t === TILE_TYPES.WALL || t === TILE_TYPES.PILLAR) continue;
        if (nx === playerPos.x && ny === playerPos.y) continue;
        if (occupied.has(`${nx},${ny}`)) continue;
        occupied.add(`${nx},${ny}`);
        return { ...e, x: nx, y: ny, aggro: true };
      }
      occupied.add(`${e.x},${e.y}`);
      return e;

    } else {
      // Patrol / wander
      let { patrolDir, patrolTimer } = e;
      patrolTimer = (patrolTimer || 0) + 1;
      let pd = patrolDir || { x: 0, y: 0 };

      if (patrolTimer % 4 === 0 || (pd.x === 0 && pd.y === 0)) {
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        pd = { x: d[0], y: d[1] };
      }

      const nx = e.x + pd.x;
      const ny = e.y + pd.y;
      occupied.delete(`${e.x},${e.y}`);

      if (nx >= 0 && ny >= 0 && nx < floor.width && ny < floor.height) {
        const t = grid[ny][nx];
        if (t !== TILE_TYPES.WALL && t !== TILE_TYPES.PILLAR &&
            nx !== playerPos.x && ny !== playerPos.y && !occupied.has(`${nx},${ny}`)) {
          occupied.add(`${nx},${ny}`);
          return { ...e, x: nx, y: ny, patrolDir: pd, patrolTimer };
        }
      }
      occupied.add(`${e.x},${e.y}`);
      return { ...e, patrolDir: { x: -pd.x, y: -pd.y }, patrolTimer };
    }
  });

  const newFloor  = { ...floor, enemies: newEnemies };
  const newFloors = dungeon.floors.map((f, i) => i === floorIdx ? newFloor : f);
  return { dungeon: { ...dungeon, floors: newFloors }, events };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function carveRoom(grid, rx, ry, rw, rh) {
  for (let y = ry; y < ry + rh; y++)
    for (let x = rx; x < rx + rw; x++)
      grid[y][x] = TILE_TYPES.FLOOR;
}

function rectsOverlap(a, b, margin = 0) {
  return !(a.x + a.w + margin <= b.x || b.x + b.w + margin <= a.x ||
           a.y + a.h + margin <= b.y || b.y + b.h + margin <= a.y);
}

function roomCenter(room) {
  return { x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) };
}

function carveLine(grid, x0, y0, x1, y1) {
  let x = x0, y = y0;
  while (x !== x1 || y !== y1) {
    if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length)
      grid[y][x] = TILE_TYPES.FLOOR;
    if (x !== x1) x += x < x1 ? 1 : -1;
    else y += y < y1 ? 1 : -1;
  }
  if (y1 >= 0 && y1 < grid.length && x1 >= 0 && x1 < grid[0].length)
    grid[y1][x1] = TILE_TYPES.FLOOR;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Glyph / visual exports ───────────────────────────────────────────────────

export const MONSTER_GLYPHS = {
  skeleton:        { glyph: 's', color: '#d4d0c8' },
  zombie:          { glyph: 'z', color: '#8ab890' },
  lich:            { glyph: 'L', color: '#c890e0' },
  wolf:            { glyph: 'd', color: '#c49050' },
  dire_wolf:       { glyph: 'D', color: '#e08838' },
  giant_spider:    { glyph: 'a', color: '#70c060' },
  troll:           { glyph: 'T', color: '#a0c880' },
  bandit:          { glyph: '@', color: '#e0ac48' },
  dark_mage:       { glyph: 'W', color: '#6898d8' },
  orc_warrior:     { glyph: 'o', color: '#90b868' },
  goblin:          { glyph: 'g', color: '#80a850' },
  ghost:           { glyph: 'G', color: '#88a8d8' },
  vampire:         { glyph: 'V', color: '#d85858' },
  earth_elemental: { glyph: 'E', color: '#a08858' },
  dark_assassin:   { glyph: 'A', color: '#6868a0' },
  wight:           { glyph: 'w', color: '#98a8b8' },
  dragon:          { glyph: 'D', color: '#e05020' },
  imp:             { glyph: 'i', color: '#d05828' },
  lizardman:       { glyph: 'l', color: '#70a858' },
  cult_fanatic:    { glyph: 'f', color: '#a060d0' },
  swamp_hag:       { glyph: 'h', color: '#60a860' },
  gargoyle:        { glyph: 'q', color: '#909090' },
  werewolf:        { glyph: 'W', color: '#c0a050' },
  minotaur:        { glyph: 'M', color: '#c06040' },
  corrupted_knight:{ glyph: 'K', color: '#8080a0' },
  banshee:         { glyph: 'B', color: '#a0c8e0' },
  frost_giant:     { glyph: 'F', color: '#80c8f0' },
};

export function getDungeonSymbol(tileType) {
  switch (tileType) {
    case TILE_TYPES.WALL:        return '#';
    case TILE_TYPES.FLOOR:       return '·';
    case TILE_TYPES.DOOR:        return '+';
    case TILE_TYPES.STAIRS_DOWN: return '>';
    case TILE_TYPES.STAIRS_UP:   return '<';
    case TILE_TYPES.CHEST:       return '$';
    case TILE_TYPES.TRAP:        return '^';
    case TILE_TYPES.ENTRANCE:    return '⊕';
    case TILE_TYPES.SHRINE:      return '✦';
    case TILE_TYPES.PILLAR:      return 'O';
    case TILE_TYPES.WATER:       return '~';
    case TILE_TYPES.RUBBLE:      return '%';
    case TILE_TYPES.TORCH:       return '!';
    default: return ' ';
  }
}

export { getDungeonBoss } from '../data/monsters.js';
