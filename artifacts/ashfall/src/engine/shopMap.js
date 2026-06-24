export const ST = {
  FLOOR:       0,
  FLOOR_STONE: 1,
  WALL:        2,
  DOOR:        3,
  COUNTER:     4,
  SHELF:       5,
  BARREL:      6,
  CRATE:       7,
  TABLE:       8,
  CHAIR:       9,
  RUG:        10,
  FORGE:      11,
  ANVIL:      12,
  STOOL:      13,
};

export const SHOP_WALKABLE = new Set([
  ST.FLOOR, ST.FLOOR_STONE, ST.DOOR, ST.RUG, ST.CHAIR, ST.STOOL,
]);

export const SHOP_NPC_INFO = {
  general_store: { name: 'Merchant',   emoji: '🧑‍💼', greeting: 'Fine goods for the road — what are you after?'  },
  market:        { name: 'Trader',     emoji: '🧑‍💼', greeting: 'Best prices in the region, I promise you that.'  },
  blacksmith:    { name: 'Blacksmith', emoji: '🧑‍🔧', greeting: 'Need steel? You came to the right forge.'         },
  inn:           { name: 'Innkeeper',  emoji: '🧑‍🍳', greeting: 'Rest your feet, have a drink — you\'ve earned it.' },
  tavern:        { name: 'Barkeep',    emoji: '🧑‍🍳', greeting: 'What can I pour for you, stranger?'               },
  alchemist:     { name: 'Alchemist',  emoji: '⚗️',    greeting: 'Potions brewed fresh. Ingredients sourced myself.' },
};

const W = 20, H = 14;

function fill(tiles, t) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tiles[y][x] = t;
}
function setT(tiles, x, y, t) {
  if (x >= 0 && y >= 0 && x < W && y < H) tiles[y][x] = t;
}
function hLine(tiles, y, x1, x2, t) {
  for (let x = x1; x <= x2; x++) setT(tiles, x, y, t);
}

export function generateShopInterior(buildingType) {
  const tiles = Array.from({ length: H }, () => Array(W).fill(ST.FLOOR));

  // Border walls
  hLine(tiles, 0,   0, W-1, ST.WALL);
  hLine(tiles, H-1, 0, W-1, ST.WALL);
  for (let y = 1; y < H-1; y++) { tiles[y][0] = ST.WALL; tiles[y][W-1] = ST.WALL; }

  // Exit door — bottom center
  const doorX = Math.floor(W / 2);
  tiles[H-1][doorX] = ST.DOOR;

  let npcPos    = { x: doorX, y: 4 };
  let playerSpawn = { x: doorX, y: H - 3 };

  switch (buildingType) {
    case 'general_store':
    case 'market': {
      // Shelves on north wall
      hLine(tiles, 1, 2, 17, ST.SHELF);
      // Barrels / crates in corners
      tiles[2][2]  = ST.BARREL; tiles[2][17] = ST.BARREL;
      tiles[3][2]  = ST.CRATE;  tiles[3][17] = ST.CRATE;
      // Counter row 5
      hLine(tiles, 5, 3, 16, ST.COUNTER);
      // Rugs
      hLine(tiles, 7, 6, 13, ST.RUG);
      hLine(tiles, 10, 6, 13, ST.RUG);
      // Side barrels
      tiles[9][2]  = ST.BARREL; tiles[9][17] = ST.BARREL;
      tiles[11][2] = ST.CRATE;  tiles[11][17] = ST.CRATE;
      npcPos = { x: 10, y: 4 };
      break;
    }

    case 'blacksmith': {
      // Stone floor area near forge
      for (let y = 1; y <= 4; y++) for (let x = 13; x <= 17; x++) tiles[y][x] = ST.FLOOR_STONE;
      // Forge top-right
      tiles[1][15] = ST.FORGE; tiles[1][16] = ST.FORGE; tiles[1][17] = ST.FORGE;
      tiles[2][15] = ST.FORGE; tiles[2][16] = ST.FORGE; tiles[2][17] = ST.FORGE;
      // Anvils
      tiles[3][3] = ST.ANVIL; tiles[3][4] = ST.ANVIL; tiles[3][5] = ST.ANVIL;
      tiles[4][3] = ST.ANVIL;
      // Weapon-rack shelves on north wall
      hLine(tiles, 1, 2, 12, ST.SHELF);
      // Counter row 6
      hLine(tiles, 6, 3, 16, ST.COUNTER);
      // Material barrels
      tiles[4][17] = ST.BARREL; tiles[5][17] = ST.BARREL;
      tiles[7][2]  = ST.BARREL; tiles[8][2]  = ST.CRATE;
      npcPos = { x: 10, y: 5 };
      playerSpawn = { x: 10, y: H - 3 };
      break;
    }

    case 'inn':
    case 'tavern': {
      // Tables + chairs upper half
      const tableSpots = [[4,4],[4,13],[6,4],[6,13]];
      tableSpots.forEach(([ty,tx]) => {
        tiles[ty][tx]   = ST.TABLE; tiles[ty][tx+1] = ST.TABLE;
        tiles[ty-1][tx] = ST.STOOL; tiles[ty-1][tx+1] = ST.STOOL;
        tiles[ty+1][tx] = ST.CHAIR; tiles[ty+1][tx+1] = ST.CHAIR;
      });
      // Bar counter row 8, left-right
      hLine(tiles, 8, 2, 17, ST.COUNTER);
      // Barrels behind bar
      tiles[9][3]  = ST.BARREL; tiles[9][4]  = ST.BARREL;
      tiles[9][15] = ST.BARREL; tiles[9][16] = ST.BARREL;
      tiles[10][3] = ST.CRATE;  tiles[10][16] = ST.CRATE;
      // Rugs
      hLine(tiles, 7, 5, 14, ST.RUG);
      hLine(tiles, 11, 4, 15, ST.RUG);
      // Stone floor behind bar
      for (let y = 9; y <= 12; y++) for (let x = 1; x <= 18; x++) tiles[y][x] = ST.FLOOR_STONE;
      npcPos = { x: 10, y: 9 };
      playerSpawn = { x: 10, y: H - 3 };
      break;
    }

    case 'alchemist': {
      // Two rows of shelves on north wall
      hLine(tiles, 1, 2, 17, ST.SHELF);
      hLine(tiles, 2, 2, 12, ST.SHELF);
      // Brewing area top-right
      tiles[2][14] = ST.BARREL; tiles[2][15] = ST.CRATE; tiles[2][16] = ST.BARREL;
      tiles[3][14] = ST.CRATE;  tiles[3][15] = ST.BARREL; tiles[3][16] = ST.CRATE;
      // Counter row 6
      hLine(tiles, 6, 3, 16, ST.COUNTER);
      // Rug
      hLine(tiles, 8, 6, 13, ST.RUG);
      hLine(tiles, 10, 6, 13, ST.RUG);
      // Side barrels
      tiles[9][2]  = ST.BARREL; tiles[9][17] = ST.BARREL;
      tiles[10][2] = ST.CRATE;  tiles[10][17] = ST.CRATE;
      npcPos = { x: 10, y: 5 };
      break;
    }

    default: {
      hLine(tiles, 1, 2, 17, ST.SHELF);
      hLine(tiles, 5, 3, 16, ST.COUNTER);
      tiles[9][2]  = ST.BARREL; tiles[9][17] = ST.BARREL;
      npcPos = { x: 10, y: 4 };
      break;
    }
  }

  return { tiles, width: W, height: H, npcPos, doorPos: { x: doorX, y: H - 1 }, playerSpawn };
}

export function getShopTemplates(buildingType) {
  switch (buildingType) {
    case 'blacksmith':
      return ['iron_sword','steel_sword','iron_shield','leather_armor','steel_armor','iron_helm','steel_helm','leather_boots'];
    case 'alchemist':
      return ['healing_potion','mana_potion','antidote','stamina_potion','fire_flask','smoke_bomb'];
    case 'inn': case 'tavern':
      return ['healing_potion','antidote','stamina_potion'];
    default:
      return ['iron_sword','iron_shield','leather_armor','healing_potion','mana_potion','antidote','steel_sword','steel_armor','lockpick','hunting_bow','iron_helm','leather_boots'];
  }
}
