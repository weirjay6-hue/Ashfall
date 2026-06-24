import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createPlayer, gainXP, addToInventory, changeReputation, equipItem, unequipItem, useConsumable, removeFromInventory, restPlayer } from '../engine/player.js';
import { generateWorld, getRegion, travelCost } from '../engine/map.js';
import { worldTick, travelToRegion, generateWorldSeed, calcStaminaCost, STAMINA_PER_TILE } from '../engine/world.js';
import { initFactions } from '../engine/faction.js';
import { initCombat, resolvePlayerAttack, resolveEnemyTurn, attemptFlee, castSpell, resolveItemUse, getPlayerDefense, getPlayerMaxHP, getPlayerMaxStamina } from '../engine/combat.js';
import { gainSkillXP, SKILLS } from '../data/skills.js';
import { generatePOIs, getPOIsForRegion } from '../engine/poi.js';
import { generateItem, ITEM_TEMPLATES } from '../engine/items.js';
import { generateDungeon, moveDungeon, openChest, killEnemy, useShrine as dungeonUseShrine, revealFog, moveEnemies } from '../engine/dungeon.js';
import { getRegionalName, getBossName } from '../engine/enemyNames.js';
import { generateQuest, updateQuestProgress } from '../engine/quest.js';
import { saveGame, loadGame, autosave, getSaveSlots } from '../engine/save.js';
import { RNG } from '../engine/rng.js';

const LOG_MAX = 200;

function addLog(logs, message, type = 'info') {
  const entry = { message, type, timestamp: Date.now() };
  return [entry, ...logs].slice(0, LOG_MAX);
}

// Skill XP helpers: detect level-ups and push to pendingLevelUps
function applySkillXP(state, skillId, amount) {
  const before = state.player.skills[skillId]?.level ?? 0;
  state.player.skills = gainSkillXP(state.player.skills, skillId, amount);
  const after = state.player.skills[skillId]?.level ?? 0;
  if (after > before) {
    if (!state.pendingLevelUps) state.pendingLevelUps = [];
    state.pendingLevelUps.push({ id: skillId, name: SKILLS[skillId]?.name || skillId, level: after });
  }
}
function applySkillXPPlayer(state, player, skillId, amount) {
  const before = player.skills[skillId]?.level ?? 0;
  const newSkills = gainSkillXP(player.skills, skillId, amount);
  const after = newSkills[skillId]?.level ?? 0;
  if (after > before) {
    if (!state.pendingLevelUps) state.pendingLevelUps = [];
    state.pendingLevelUps.push({ id: skillId, name: SKILLS[skillId]?.name || skillId, level: after });
  }
  return { ...player, skills: newSkills };
}

// Non-combat travel encounter definitions
const TRAVEL_ENCOUNTER_DEFS = {
  merchant: {
    title: 'Traveling Merchant',
    icon: '🪙',
    description: 'A weathered merchant pushes a loaded cart along the road. They eye you warily but wave in greeting.',
    choices: [
      { text: 'Buy a random supply (5–20g)', outcome: 'trade', icon: '🛒' },
      { text: 'Pass by with a nod', outcome: 'pass', icon: '👋' },
    ],
  },
  pilgrim: {
    title: 'Pilgrim Caravan',
    icon: '🙏',
    description: 'A small group of robed pilgrims moves slowly along the road, singing quietly. Their elder offers you a blessing.',
    choices: [
      { text: 'Accept the blessing (+HP restored)', outcome: 'bless', icon: '✨' },
      { text: 'Give them a healing item (if you have one)', outcome: 'donate', icon: '🍞' },
      { text: 'Continue on your way', outcome: 'pass', icon: '👋' },
    ],
  },
  adventurer: {
    title: 'Injured Adventurer',
    icon: '🧑‍⚔️',
    description: 'A wounded adventurer sits against a roadside stone, clutching their side. They look up as you approach, eyes desperate.',
    choices: [
      { text: 'Help bind their wounds (+XP, tip about nearby location)', outcome: 'help', icon: '🩹' },
      { text: 'Give them a potion', outcome: 'potion', icon: '🧪' },
      { text: 'Leave them be', outcome: 'pass', icon: '👋' },
    ],
  },
  cache: {
    title: 'Abandoned Cache',
    icon: '📦',
    description: 'Half-hidden under a fallen log, you spot a weathered oilskin bundle. Someone left it here and never came back.',
    choices: [
      { text: 'Open it and claim the contents', outcome: 'loot', icon: '🎁' },
      { text: 'Leave it undisturbed', outcome: 'pass', icon: '👋' },
    ],
  },
  fugitive: {
    title: 'Desperate Fugitive',
    icon: '🏃',
    description: 'A frantic figure rushes toward you, casting glances behind them. "Please — the guards are after me. Help me hide!"',
    choices: [
      { text: 'Help them hide (+XP, +reputation)', outcome: 'hide', icon: '🫂' },
      { text: 'Turn them in (reduce your own bounty)', outcome: 'turnin', icon: '⚖️' },
      { text: 'Back away slowly', outcome: 'pass', icon: '👋' },
    ],
  },
};

function buildTravelEncounter(type, region) {
  const def = TRAVEL_ENCOUNTER_DEFS[type];
  if (!def) return null;
  return { type, title: def.title, icon: def.icon, description: def.description, choices: def.choices, regionX: region.x, regionY: region.y, dangerLevel: region.dangerLevel };
}

function getCardinalDirection(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) === 0 && Math.abs(dy) === 0) return 'nearby';
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle > -22.5 && angle <= 22.5) return 'east';
  if (angle > 22.5 && angle <= 67.5) return 'south-east';
  if (angle > 67.5 && angle <= 112.5) return 'south';
  if (angle > 112.5 && angle <= 157.5) return 'south-west';
  if (angle > 157.5 || angle <= -157.5) return 'west';
  if (angle > -157.5 && angle <= -112.5) return 'north-west';
  if (angle > -112.5 && angle <= -67.5) return 'north';
  return 'north-east';
}

function findRegionForSettlement(world, settlementId) {
  for (const region of (world?.regions || [])) {
    if (region.settlements?.some(s => s.id === settlementId)) return region;
  }
  return null;
}

function buildGuardCombat(player, bounty, wave = 1) {
  const dangerLevel = Math.min(5, Math.max(1, Math.floor(bounty / 100) + 1));
  const rng = new RNG(Math.random().toString());
  const templates = ['bandit', 'bandit', 'orc_warrior', 'orc_warrior', 'dark_mage'];
  const templateId = templates[Math.min(dangerLevel - 1, 4)];
  const guardNames = ['Town Guard', 'City Guard', 'Guard Sergeant', 'Guard Captain', 'Elite Guard'];
  const combat = initCombat(player, templateId, dangerLevel + (wave - 1), rng.uid());
  combat.enemy.name = guardNames[Math.min(dangerLevel - 1, 4)] + (wave > 1 ? ` (Wave ${wave})` : '');
  return { combat, dangerLevel };
}

const useGameStore = create(immer((set, get) => ({
  phase: 'title',
  player: null,
  world: null,
  factions: null,
  combat: null,
  zoneCombat: null,
  dungeon: null,
  activeDungeon: null,
  currentView: 'world',
  selectedNPC: null,
  selectedQuest: null,
  pendingChest: null,
  pendingShrine: null,
  pendingQuestOffer: null,
  gameLog: [],
  saveSlots: getSaveSlots(),
  worldSeed: generateWorldSeed(),
  tickInterval: null,
  sneaking: false,
  lootedContainers: {},
  bounties: {},
  guardEncounter: null,
  killedNPCs: {},
  npcActionFeedback: null,
  gameOver: false,
  pois: [],
  pendingLevelUps: [],
  pendingTravelEncounter: null,

  setPhase: (phase) => set(state => { state.phase = phase; }),
  setView: (view) => set(state => { state.currentView = view; }),

  newGame: (name, raceId, backgroundId) => set(state => {
    const seed = state.worldSeed;
    const rng = new RNG(seed);
    const player = createPlayer(name, raceId, backgroundId, seed);
    const world = generateWorld(seed, 30);
    const factions = initFactions(rng);

    const prisonRegion =
      world.regions.find(r => Math.sqrt(r.x * r.x + r.y * r.y) >= 2 && Math.sqrt(r.x * r.x + r.y * r.y) <= 4 && r.settlements.length === 0) ||
      world.regions.find(r => r.x === 2 && r.y === 2) ||
      world.regions[0];

    world.regions = world.regions.map(r => {
      const dx = r.x - prisonRegion.x;
      const dy = r.y - prisonRegion.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (r.x === prisonRegion.x && r.y === prisonRegion.y) return { ...r, visited: true, revealed: true };
      if (dist <= 1.5) return { ...r, revealed: true };
      return r;
    });

    player.location = { regionX: prisonRegion.x, regionY: prisonRegion.y, type: 'wilderness', id: null };

    const startRng = new RNG(seed + '_start');
    const herbItem = generateItem('healing_herb', 'common', startRng);
    const herb2 = generateItem('healing_herb', 'common', startRng);
    if (herbItem) player.inventory.push(herbItem);
    if (herb2) player.inventory.push(herb2);

    state.player = player;
    state.world = world;
    state.factions = factions;
    state.phase = 'prologue';
    state.currentView = 'world';
    state.gameLog = [];
    state._prisonRegion = { x: prisonRegion.x, y: prisonRegion.y };
    state.pois = generatePOIs(world, new RNG(seed + '_pois'));
    state.pendingLevelUps = [];
    state.pendingTravelEncounter = null;
  }),

  completePrologue: () => set(state => {
    if (!state.player || !state.world) return;

    const px = state.player.location.regionX;
    const py = state.player.location.regionY;

    const nearestTown = state.world.regions
      .filter(r => r.settlements?.length > 0)
      .reduce((best, r) => {
        const dist = Math.sqrt((r.x - px) ** 2 + (r.y - py) ** 2);
        return (!best || dist < best.dist) ? { r, dist } : best;
      }, null);

    const directionLabel = nearestTown
      ? getCardinalDirection(px, py, nearestTown.r.x, nearestTown.r.y)
      : 'somewhere ahead';
    const townName = nearestTown?.r?.settlements?.[0]?.name || 'a settlement';

    state.phase = 'game';
    state.currentView = 'world';
    state.gameLog = addLog([], `${state.player.name} emerges from the prison into the open world. Green hills, ancient forest, cool open air — freedom.`, 'story');
    state.gameLog = addLog(state.gameLog, `You are in the wilderness with nothing but your wits and a few healing herbs. Find shelter before dark.`, 'warning');
    state.gameLog = addLog(state.gameLog, `${townName} lies to the ${directionLabel}. The smoke of its hearth fires is visible on the horizon.`, 'travel');
    state.gameLog = addLog(state.gameLog, `The road is not safe alone. Bandits and creatures hunt those who travel without companions or weapons.`, 'danger');
  }),

  loadSave: (slotIndex) => set(state => {
    const result = loadGame(slotIndex);
    if (result.success) {
      const gs = result.gameState;
      state.player = gs.player;
      state.world = gs.world;
      state.factions = gs.factions;
      state.gameLog = gs.gameLog || [];
      state.phase = 'game';
      state.currentView = 'town';
    } else {
      state.gameLog = addLog(state.gameLog, result.message, 'error');
    }
    state.saveSlots = getSaveSlots();
  }),

  saveToSlot: (slotIndex) => set(state => {
    const gs = get();
    const result = saveGame(slotIndex, { player: gs.player, world: gs.world, factions: gs.factions, gameLog: gs.gameLog });
    state.gameLog = addLog(state.gameLog, result.message, result.success ? 'success' : 'error');
    state.saveSlots = getSaveSlots();
  }),

  doWorldTick: () => set(state => {
    if (!state.world || !state.player) return;
    const rng = new RNG(state.world.tick.toString());
    const result = worldTick(state.world, state.factions, state.player, rng);
    state.world = result.world;
    state.factions = result.factions;
    for (const evt of result.newEvents) {
      state.gameLog = addLog(state.gameLog, `[World] ${evt.desc}`, 'world');
    }
    for (const quest of result.newQuestOffers) {
      if (!state.pendingQuestOffer) {
        state.pendingQuestOffer = quest;
      }
    }
    if (state.world.tick % 10 === 0) {
      const gs = { player: state.player, world: state.world, factions: state.factions, gameLog: state.gameLog };
      autosave(gs);
    }
  }),

  travel: (targetX, targetY) => set(state => {
    if (!state.world || !state.player) return;
    const rng = new RNG(Math.random().toString());

    const fromX = state.player.location?.regionX ?? 0;
    const fromY = state.player.location?.regionY ?? 0;
    const staminaCost = calcStaminaCost(fromX, fromY, targetX, targetY);
    const currentStamina = state.player.stamina?.current ?? 0;

    if (currentStamina < staminaCost) {
      state.gameLog = addLog(state.gameLog, `Too exhausted to travel! Need ${staminaCost}⚡, have ${currentStamina}⚡. Rest at an inn or eat provisions.`, 'warning');
      return;
    }

    const result = travelToRegion(state.world, state.player, targetX, targetY);
    if (result.success) {
      state.world = result.world;
      state.player = result.player;
      const maxStamina = state.player.stamina?.max ?? getPlayerMaxStamina(state.player);
      state.player.stamina = { current: Math.max(0, currentStamina - staminaCost), max: maxStamina };
      state.player.location = { regionX: targetX, regionY: targetY, type: 'travel', id: null };
      state.gameLog = addLog(state.gameLog, `${result.message} (-${staminaCost}⚡)`, 'travel');
      state.currentView = 'world';

      // Auto-discover POIs in destination region
      const destPOIs = getPOIsForRegion(state.pois, targetX, targetY);
      for (const poi of destPOIs) {
        if (!poi.discovered) {
          poi.discovered = true;
          state.gameLog = addLog(state.gameLog, `📍 Discovered: ${poi.icon} ${poi.name}`, 'story');
          if (poi.loreEntry) {
            if (!state.player.codex) state.player.codex = [];
            const exists = state.player.codex.some(e => e.id === poi.id);
            if (!exists) state.player.codex.push({ ...poi.loreEntry, discoveredAt: `${poi.regionX},${poi.regionY}`, id: poi.id });
          }
        }
      }

      if (result.encounter) {
        const targetRegion = result.encounter.region;
        const hour = state.world?.hour ?? 12;
        const isNight = hour < 6 || hour >= 21;
        const isDusk = (hour >= 18 && hour < 21) || (hour >= 5 && hour < 6);

        // 30% chance of a non-combat encounter during daytime
        if (!isNight && !isDusk && rng.float() < 0.30) {
          const ncTypes = ['merchant', 'pilgrim', 'adventurer', 'cache', 'fugitive'];
          const ncType = ncTypes[rng.int(0, ncTypes.length - 1)];
          state.pendingTravelEncounter = buildTravelEncounter(ncType, targetRegion);
        } else {
          const DAY_MONSTERS   = ['wolf', 'bandit', 'goblin', 'skeleton', 'giant_spider', 'orc_warrior'];
          const NIGHT_MONSTERS = ['wolf', 'bandit', 'zombie', 'skeleton', 'dire_wolf', 'wight', 'ghost', 'dark_assassin'];
          const DUSK_MONSTERS  = ['wolf', 'bandit', 'skeleton', 'giant_spider', 'zombie', 'dire_wolf'];

          const pool = isNight ? NIGHT_MONSTERS : isDusk ? DUSK_MONSTERS : DAY_MONSTERS;
          const baseDanger = targetRegion.dangerLevel;
          const nightBonus = isNight ? 1 : 0;
          const effectiveDanger = Math.min(5, baseDanger + nightBonus);

          const eligiblePool = pool.slice(0, Math.min(pool.length, effectiveDanger + 2));
          const randomMonster = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];

          const combat = initCombat(state.player, randomMonster, effectiveDanger, rng.uid());
          // Apply regional lore-based name based on biome
          const regionBiome = targetRegion.terrain || 'plains';
          const regionalEnemyName = getRegionalName(randomMonster, regionBiome, rng);
          if (regionalEnemyName) combat.enemy.name = regionalEnemyName;
          state.combat = combat;
          state.currentView = 'combat';

          const displayName = combat.enemy.name;
          const ambushMsg = isNight
            ? `Something lurches from the darkness — ${displayName}! Night is dangerous.`
            : isDusk
            ? `At dusk, a ${displayName} emerges from the shadows!`
            : `You are ambushed! A ${displayName} attacks!`;
          state.gameLog = addLog(state.gameLog, ambushMsg, 'combat');
        }
      }
    }
  }),

  enterSettlement: (settlementId) => set(state => {
    const region = state.world.regions.find(r =>
      r.settlements.some(s => s.id === settlementId)
    );
    if (region) {
      state.player.location = { regionX: region.x, regionY: region.y, type: 'settlement', id: settlementId };
      state.currentView = 'town';
    }
  }),

  startCombat: (enemyTemplateId, dangerLevel) => set(state => {
    const rng = new RNG(Math.random().toString());
    const combat = initCombat(state.player, enemyTemplateId, dangerLevel, rng.uid());
    state.combat = combat;
    state.currentView = 'combat';
    state.gameLog = addLog(state.gameLog, `Combat started against ${combat.enemy.name}!`, 'combat');
  }),

  combatAction: (action, targetBodyPart) => set(state => {
    if (!state.combat || !state.combat.playerTurn) return;
    const rng = new RNG(Math.random().toString());
    let combat = { ...state.combat };
    if (targetBodyPart) combat = { ...combat, selectedBodyPart: targetBodyPart };
    let updatedPlayer = state.player;

    if (action === 'attack') {
      combat = resolvePlayerAttack(combat, state.player, action, rng);
      const validWeaponSkills = ['oneHanded', 'twoHanded', 'shortBlade', 'archery', 'polearms', 'unarmed'];
      const gainSkill = validWeaponSkills.includes(combat._weaponSkill) ? combat._weaponSkill : 'oneHanded';
      const xpGain = combat._attackHit ? 4 : 1;
      updatedPlayer = applySkillXPPlayer(state, updatedPlayer, gainSkill, xpGain);
    } else if (action === 'spell') {
      if (state.player.mp.current >= 10) {
        combat = castSpell(combat, state.player, 'fire', rng);
        updatedPlayer = { ...state.player, mp: { ...state.player.mp, current: state.player.mp.current - 10 } };
        if (combat._mpUsed) {
          updatedPlayer = { ...updatedPlayer, mp: { ...updatedPlayer.mp, current: Math.max(0, updatedPlayer.mp.current - (combat._mpUsed - 10)) } };
        }
        if (combat._spellCast) {
          updatedPlayer = applySkillXPPlayer(state, updatedPlayer, 'destruction', 5);
        }
      } else {
        combat = { ...combat, log: [...combat.log, 'Not enough mana!'] };
      }
    } else if (action === 'flee') {
      combat = attemptFlee(combat, state.player, rng);
      if (combat.fled) {
        state.combat = null;
        state.currentView = 'world';
        state.gameLog = addLog(state.gameLog, 'You flee from combat!', 'combat');
        return;
      }
    } else if (action === 'item') {
      const inventory = state.player.inventory || [];
      const isPoisoned = state.combat.playerStatusEffects?.some(s => s.id === 'poison');
      const maxHP = 30 + state.player.attributes.endurance * 3 + (state.player.level - 1) * 5;
      const hpPct = state.player.hp.current / maxHP;

      let itemToUse = null;
      if (isPoisoned) itemToUse = inventory.find(i => i.curesPoison);
      if (!itemToUse && hpPct < 0.8) itemToUse = inventory.find(i => i.type === 'consumable' && i.hpRestore);
      if (!itemToUse) itemToUse = inventory.find(i => i.type === 'consumable' && i.mpRestore);
      if (!itemToUse) itemToUse = inventory.find(i => i.type === 'consumable');

      if (!itemToUse) {
        combat = { ...combat, log: [...combat.log, 'No usable items in your pack!'] };
      } else {
        const result = resolveItemUse(combat, state.player, itemToUse);
        combat = result.combat;
        updatedPlayer = result.player;
        if (result.curedPoison) {
          combat = { ...combat, playerStatusEffects: (combat.playerStatusEffects || []).filter(s => s.id !== 'poison') };
        }
        const itemIdx = updatedPlayer.inventory.findIndex(i => i.uid === itemToUse.uid);
        if (itemIdx >= 0) {
          const newInv = [...updatedPlayer.inventory];
          newInv.splice(itemIdx, 1);
          updatedPlayer = { ...updatedPlayer, inventory: newInv };
        }
      }
    } else if (action === 'backstab') {
      const sneakLevel = state.player.skills?.sneak?.level || 1;
      const dex = state.player.attributes?.dexterity || 5;
      const weapon = Object.values(state.player.equipment || {}).find(i => i?.attack);
      const weaponAtk = weapon?.attack || 0;
      const damageMulti = 1.5 + (sneakLevel / 100) * 1.5;
      const rawDmg = Math.floor((dex * 0.8 + weaponAtk + rng.int(3, 10)) * damageMulti);
      const isCrit = Math.random() < 0.35;
      const finalDmg = isCrit ? Math.floor(rawDmg * 1.5) : rawDmg;
      combat.enemy.hp = Math.max(0, combat.enemy.hp - finalDmg);
      combat.log = [...combat.log, `${isCrit ? '★ CRITICAL BACKSTAB' : 'Backstab'}: You strike from the shadows for ${finalDmg} damage!`];
      combat.playerTurn = false;
      state.sneaking = false;
      updatedPlayer = applySkillXPPlayer(state, updatedPlayer, 'sneak', 15);
      if (combat.enemy.hp <= 0) {
        combat.won = true;
        combat.log = [...combat.log, `${combat.enemy.name} falls before they could react.`];
      }
    }

    if (!combat.playerTurn && !combat.won && !combat.lost && !combat.fled) {
      const enemyResult = resolveEnemyTurn(combat, updatedPlayer, rng);
      combat = enemyResult;
      if (enemyResult._playerUpdate) {
        updatedPlayer = enemyResult._playerUpdate;
      }
      if (enemyResult._dodged) {
        updatedPlayer = applySkillXPPlayer(state, updatedPlayer, 'dodge', 3);
      }
    }

    if (combat.won) {
      const prevLevel = updatedPlayer.level;
      updatedPlayer = gainXP(updatedPlayer, combat.xpGained);
      updatedPlayer = { ...updatedPlayer, gold: updatedPlayer.gold + combat.goldGained };
      for (const item of combat.lootGained || []) {
        updatedPlayer = addToInventory(updatedPlayer, item);
      }
      updatedPlayer = { ...updatedPlayer, stats: { ...updatedPlayer.stats, kills: updatedPlayer.stats.kills + 1 } };
      state.gameLog = addLog(state.gameLog, `Victory! +${combat.xpGained} XP, +${combat.goldGained} gold.`, 'success');
      if (updatedPlayer.level > prevLevel) {
        state.gameLog = addLog(state.gameLog, `★ LEVEL UP! You are now level ${updatedPlayer.level}! Stats improved.`, 'story');
      }
      if (state.dungeon && combat._dungeonEnemyId) {
        state.dungeon = killEnemy(state.dungeon, combat._dungeonEnemyId);
      }

      if (combat._npcCombat) {
        const { npcId, settlementId } = combat._npcCombat;
        state.killedNPCs[npcId] = { settlementId, killedAt: state.world.day, name: combat.enemy.name };
        for (const r of state.world.regions) {
          for (const s of (r.settlements || [])) {
            if (s.id === settlementId) {
              for (const n of (s.npcs || [])) {
                if (n.id === npcId) { n.deceased = true; }
              }
            }
          }
        }
        const murderRegion = findRegionForSettlement(state.world, settlementId);
        if (murderRegion) state.bounties[murderRegion.id] = (state.bounties[murderRegion.id] || 0) + 250;
        state.gameLog = addLog(state.gameLog, `${combat.enemy.name} has been slain. Your bounty in this region grows.`, 'warning');
        setTimeout(() => { set(s => { s.combat = null; s.currentView = 'town'; }); }, 1600);

      } else if (combat._isGuardCombat) {
        const wave = combat._guardWave || 1;
        const danger = combat._guardDanger || 1;
        const regionId = combat._regionId;
        const settlementId = combat._settlementId;
        const nearSettlement = !!(state.world?.regions?.some(r => r.settlements?.some(s => s.id === settlementId)));
        const moreChance = nearSettlement ? Math.min(0.75, (0.28 + danger * 0.07) / wave) : 0;
        const moreGuards = wave < 3 && Math.random() < moreChance;

        if (moreGuards) {
          const nextWave = wave + 1;
          state.gameLog = addLog(state.gameLog, `Reinforcements! More guards are closing in! (Wave ${nextWave}/3)`, 'danger');
          const cWave = nextWave; const cDanger = danger; const cRegion = regionId; const cSettlement = settlementId;
          setTimeout(() => {
            set(s => {
              const { combat: nc, dangerLevel } = buildGuardCombat(s.player, s.bounties[cRegion] || 100, cWave);
              nc._isGuardCombat = true; nc._guardWave = cWave; nc._regionId = cRegion;
              nc._settlementId = cSettlement; nc._guardDanger = dangerLevel;
              s.combat = nc;
            });
          }, 2200);
        } else {
          state.bounties[regionId] = (state.bounties[regionId] || 0) + 100;
          state.gameLog = addLog(state.gameLog,
            wave >= 3 ? 'The guards fall back, exhausted. You are a fugitive in this region.' : 'The guard falls. Witnesses scatter. Your bounty grows.',
            'warning');
          setTimeout(() => { set(s => { s.combat = null; s.currentView = 'world'; }); }, 1800);
        }

      } else {
        const returnToDungeon = !!state.dungeon;
        setTimeout(() => {
          set(state => { state.combat = null; state.currentView = returnToDungeon ? 'dungeon' : 'world'; });
        }, 1500);
      }
    }

    if (combat.lost) {
      updatedPlayer = { ...updatedPlayer, hp: { ...updatedPlayer.hp, current: 1 } };
      if (combat._isGuardCombat) {
        const regionId = combat._regionId;
        state.gameLog = addLog(state.gameLog, 'You are overwhelmed and dragged to the cells. Bounty cleared.', 'danger');
        const daysServed = Math.max(3, Math.floor((state.bounties[regionId] || 100) / 30));
        if (regionId) state.bounties[regionId] = 0;
        state.world.day += daysServed;
        const goldLost = Math.floor(updatedPlayer.gold * 0.12);
        updatedPlayer = { ...updatedPlayer, gold: Math.max(0, updatedPlayer.gold - goldLost) };
        setTimeout(() => { set(s => { s.combat = null; s.dungeon = null; s.currentView = 'world'; }); }, 2200);
      } else if (combat._npcCombat) {
        state.gameLog = addLog(state.gameLog, 'You barely escape with your life and flee the settlement.', 'danger');
        setTimeout(() => { set(s => { s.combat = null; s.currentView = 'world'; }); }, 2000);
      } else {
        state.gameLog = addLog(state.gameLog, `You have been slain by ${combat.enemy?.name || 'your enemy'}. Your journey ends here.`, 'danger');
        setTimeout(() => { set(s => { s.gameOver = true; }); }, 1800);
      }
    }

    state.combat = combat;
    state.player = updatedPlayer;
  }),

  enterDungeon: (dungeonInfo) => set(state => {
    const dungeon = generateDungeon(dungeonInfo.seed, dungeonInfo.dangerLevel, dungeonInfo.type, dungeonInfo.floors || 3);
    const floor = dungeon.floors[0];
    const revealedFloor = revealFog(floor, floor.playerPos.x, floor.playerPos.y, 4);
    dungeon.floors[0] = revealedFloor;
    state.dungeon = dungeon;
    state.activeDungeon = dungeonInfo;
    state.currentView = 'dungeon';
    state.gameLog = addLog(state.gameLog, `You enter the ${dungeonInfo.name}. Darkness surrounds you.`, 'story');
  }),

  moveDungeonPlayer: (dx, dy) => set(state => {
    if (!state.dungeon || state.combat) return;
    const { dungeon, event } = moveDungeon(state.dungeon, dx, dy);
    state.dungeon = dungeon;

    if (event) {
      if (event.type === 'combat') {
        const rng = new RNG(Math.random().toString());
        const combat = initCombat(state.player, event.enemyId, dungeon.dangerLevel, rng.uid());
        combat._dungeonEnemyId = event.enemy.id;
        if (event.enemy.isBoss) {
          // Apply unique boss name
          const bossName = getBossName(dungeon.type, rng);
          combat.enemy.name = bossName || event.enemy.name;
          combat.enemy.hp = event.enemy.hp;
          combat.enemy.maxHp = event.enemy.maxHp;
          combat.enemy.attack = event.enemy.attack;
          combat.enemy.defense = event.enemy.defense;
          combat.enemy.xpReward = event.enemy.xpReward;
          combat.enemy.goldReward = event.enemy.goldReward;
          combat.enemy.isBoss = true;
        } else {
          // Apply regional lore name based on dungeon type
          const regional = getRegionalName(event.enemyId, dungeon.type, rng);
          if (regional) combat.enemy.name = regional;
        }
        state.combat = combat;
        state.currentView = 'combat';
        const combatMsg = event.enemy.isBoss
          ? `☠ ${combat.enemy.name} rises to defend the dungeon!`
          : `${combat.enemy.name} blocks your path!`;
        state.gameLog = addLog(state.gameLog, combatMsg, event.enemy.isBoss ? 'danger' : 'combat');
        return;
      } else if (event.type === 'chest') {
        state.pendingChest = { chest: event.chest, pos: { x: event.chest.x, y: event.chest.y } };
        state.gameLog = addLog(state.gameLog, 'You found a chest!', 'loot');
      } else if (event.type === 'shrine') {
        state.pendingShrine = { x: event.shrine?.x, y: event.shrine?.y };
        state.gameLog = addLog(state.gameLog, '✦ An ancient shrine radiates faint light.', 'info');
      } else if (event.type === 'trap') {
        const dmg = event.trap.damage;
        state.player.hp.current = Math.max(1, state.player.hp.current - dmg);
        state.gameLog = addLog(state.gameLog, `You triggered a trap! ${dmg} damage!`, 'danger');
        if (state.dungeon) {
          const fi = state.dungeon.currentFloor;
          const ti = state.dungeon.floors[fi].traps.findIndex(t => t.x === event.trap.x && t.y === event.trap.y);
          if (ti >= 0) state.dungeon.floors[fi].traps[ti].triggered = true;
        }
      } else if (event.type === 'stairs') {
        if (event.direction === 'down') {
          const nextFloor = state.dungeon.currentFloor + 1;
          if (nextFloor < state.dungeon.floors.length) {
            state.dungeon.currentFloor = nextFloor;
            state.gameLog = addLog(state.gameLog, `You descend deeper into the dungeon. Floor ${nextFloor + 1}.`, 'story');
          } else {
            state.dungeon.explored = true;
            state.currentView = 'world';
            state.player.stats.dungeonsCleared += 1;
            state.gameLog = addLog(state.gameLog, 'You have cleared the dungeon!', 'success');
          }
        }
        return;
      }
    }

    // Enemy turn — pathfind and attack
    const defense = getPlayerDefense(state.player);
    const { dungeon: afterEnemies, events: enemyEvents } = moveEnemies(state.dungeon, defense);
    state.dungeon = afterEnemies;
    for (const ev of enemyEvents) {
      if (ev.type === 'attack') {
        state.player.hp.current = Math.max(0, state.player.hp.current - ev.damage);
        state.gameLog = addLog(state.gameLog, `The ${ev.enemy.name} strikes you for ${ev.damage}!`, 'combat');
        if (state.player.hp.current <= 0) {
          state.player.hp.current = 1;
          state.gameLog = addLog(state.gameLog, 'You barely survive and are thrown from the dungeon!', 'danger');
          setTimeout(() => set(s => { s.dungeon = null; s.currentView = 'town'; }), 2000);
        }
      }
    }
  }),

  dungeonWait: () => set(state => {
    if (!state.dungeon || state.combat) return;
    const defense = getPlayerDefense(state.player);
    const { dungeon: afterEnemies, events: enemyEvents } = moveEnemies(state.dungeon, defense);
    state.dungeon = afterEnemies;

    const floor = afterEnemies.floors[afterEnemies.currentFloor];
    const liveEnemies = floor.enemies.filter(e => e.alive);
    const maxHP = getPlayerMaxHP(state.player);

    if (liveEnemies.length === 0 && state.player.hp.current < maxHP) {
      const healed = Math.min(3, maxHP - state.player.hp.current);
      state.player.hp.current += healed;
      state.gameLog = addLog(state.gameLog, `You rest a moment. [+${healed} HP]`, 'info');
    } else {
      state.gameLog = addLog(state.gameLog, 'You wait, listening...', 'info');
    }

    for (const ev of enemyEvents) {
      if (ev.type === 'attack') {
        state.player.hp.current = Math.max(0, state.player.hp.current - ev.damage);
        state.gameLog = addLog(state.gameLog, `The ${ev.enemy.name} strikes you for ${ev.damage}!`, 'combat');
        if (state.player.hp.current <= 0) {
          state.player.hp.current = 1;
          state.gameLog = addLog(state.gameLog, 'You collapse and are dragged out of the dungeon!', 'danger');
          setTimeout(() => set(s => { s.dungeon = null; s.currentView = 'town'; }), 2000);
        }
      }
    }
  }),

  openDungeonChest: () => set(state => {
    if (!state.pendingChest || !state.dungeon) return;
    const { chest, pos } = state.pendingChest;
    state.dungeon = openChest(state.dungeon, pos);
    const loot = chest.loot;
    if (loot) {
      state.player.gold += loot.gold || 0;
      for (const item of loot.items || []) {
        state.player.inventory.push(item);
      }
      state.gameLog = addLog(state.gameLog, `Chest opened! +${loot.gold} gold, ${loot.items?.length || 0} items.`, 'loot');
    }
    state.pendingChest = null;
  }),

  dismissChest: () => set(state => { state.pendingChest = null; }),

  useDungeonShrine: () => set(state => {
    if (!state.pendingShrine || !state.dungeon) return;
    const maxHP = getPlayerMaxHP(state.player);
    const maxMP = state.player.mp?.max ?? 30;
    const healHP = Math.floor(maxHP * 0.4);
    const healMP = Math.floor(maxMP * 0.3);
    state.player.hp.current = Math.min(maxHP, state.player.hp.current + healHP);
    state.player.mp.current = Math.min(maxMP, (state.player.mp?.current ?? 0) + healMP);
    // Mark shrine as used on the floor
    const fi = state.dungeon.currentFloor;
    const floor = state.dungeon.floors[fi];
    if (floor.shrines && state.pendingShrine) {
      const si = floor.shrines.findIndex(s => s.x === state.pendingShrine.x && s.y === state.pendingShrine.y);
      if (si >= 0) floor.shrines[si].used = true;
    }
    state.pendingShrine = null;
    state.gameLog = addLog(state.gameLog, `✦ The shrine's light fills you. +${healHP} HP, +${healMP} MP restored.`, 'success');
  }),

  dismissShrine: () => set(state => { state.pendingShrine = null; }),

  acceptQuestOffer: () => set(state => {
    if (!state.pendingQuestOffer) return;
    const quest = state.pendingQuestOffer;
    const reward = quest.reward || {};
    const goldGained = reward.gold || 0;
    const xpGained = reward.xp || 0;

    if (goldGained > 0) state.player.gold = (state.player.gold || 0) + goldGained;

    if (xpGained > 0) {
      state.player.xp = (state.player.xp || 0) + xpGained;
      const xpNeeded = (state.player.level || 1) * 100;
      if (state.player.xp >= xpNeeded) {
        state.player.xp -= xpNeeded;
        state.player.level = (state.player.level || 1) + 1;
        const hpBonus = 10;
        state.player.maxHp = (state.player.maxHp || 50) + hpBonus;
        state.player.hp = Math.min((state.player.hp || 50) + hpBonus, state.player.maxHp);
        state.gameLog = addLog(state.gameLog, `★ LEVEL UP! You are now level ${state.player.level}!`, 'level');
      }
    }

    const parts = [];
    if (goldGained > 0) parts.push(`+${goldGained}g`);
    if (xpGained > 0) parts.push(`+${xpGained} XP`);
    const rewardText = parts.length ? ` (${parts.join(', ')})` : '';
    state.gameLog = addLog(state.gameLog, `⚡ "${quest.title}" — reward claimed${rewardText}`, 'quest');
    state.pendingQuestOffer = null;
  }),

  declineQuestOffer: () => set(state => {
    if (!state.pendingQuestOffer) return;
    state.gameLog = addLog(state.gameLog, `Declined: "${state.pendingQuestOffer.title}"`, 'info');
    state.pendingQuestOffer = null;
  }),

  takeQuestFromNPC: (npc, region) => set(state => {
    const rng = new RNG(Math.random().toString());
    const quest = generateQuest(state.world, state.player, region, npc, rng);
    state.player.journal = [...(state.player.journal || []), quest];
    state.gameLog = addLog(state.gameLog, `Quest taken: "${quest.title}"`, 'quest');
    const npcIdx = -1;
  }),

  rest: () => set(state => {
    const goldCost = 10;
    if (state.player.gold < goldCost) {
      state.gameLog = addLog(state.gameLog, `Not enough gold to rest. Need ${goldCost} gold.`, 'warning');
      return;
    }
    state.player = restPlayer(state.player);
    state.player.gold -= goldCost;
    const maxStamina = state.player.stamina?.max ?? getPlayerMaxStamina(state.player);
    state.player.stamina = { current: maxStamina, max: maxStamina };
    state.gameLog = addLog(state.gameLog, `You rest at the inn. HP, MP & Stamina fully restored. (-${goldCost} gold)`, 'info');
  }),

  zoneMobKilled: (xpGained, goldGained) => set(state => {
    if (!state.player) return;
    const prevLevel = state.player.level;
    state.player = gainXP(state.player, xpGained);
    state.player.gold = (state.player.gold || 0) + goldGained;
    state.player.stats = { ...state.player.stats, kills: (state.player.stats?.kills || 0) + 1 };
    state.gameLog = addLog(state.gameLog, `⚔️ Foe defeated! +${xpGained} XP, +${goldGained}g`, 'success');
    if (state.player.level > prevLevel) {
      state.gameLog = addLog(state.gameLog, `★ LEVEL UP! Now level ${state.player.level}!`, 'story');
    }
  }),

  zoneTakeDamage: (amount) => set(state => {
    if (!state.player) return;
    const newHp = Math.max(0, state.player.hp.current - amount);
    state.player.hp = { ...state.player.hp, current: newHp };
    if (newHp <= 0) {
      state.player.hp = { ...state.player.hp, current: 1 };
      state.gameLog = addLog(state.gameLog, '💀 You narrowly escape with your life and are cast back to the world.', 'danger');
      state.currentView = 'world';
    }
  }),

  wagonTravel: (targetX, targetY, settlementId, goldCost) => set(state => {
    if (!state.world || !state.player) return;
    if (state.player.gold < goldCost) {
      state.gameLog = addLog(state.gameLog, `Not enough gold for wagon travel. Need ${goldCost}g.`, 'warning');
      return;
    }
    const targetRegion = state.world.regions.find(r => r.x === targetX && r.y === targetY);
    if (!targetRegion) return;
    const settlement = targetRegion.settlements?.find(s => s.id === settlementId) || targetRegion.settlements?.[0];
    if (!settlement) return;
    state.player.gold -= goldCost;
    state.world.regions = state.world.regions.map(r => {
      const dist = Math.abs(r.x - targetX) + Math.abs(r.y - targetY);
      if (dist <= 1) return { ...r, revealed: true };
      if (r.x === targetX && r.y === targetY) return { ...r, revealed: true, visited: true };
      return r;
    });
    state.player.location = { ...state.player.location, regionX: targetX, regionY: targetY, id: settlement.id };
    state.player.stats = { ...(state.player.stats || {}), regionsVisited: (state.player.stats?.regionsVisited || 0) + 1 };
    state.currentView = 'town';
    state.gameLog = addLog(state.gameLog, `Wagon arrives at ${settlement.name} after a swift journey. (-${goldCost}g)`, 'travel');
  }),

  restoreStamina: (amount) => set(state => {
    const maxStamina = state.player.stamina?.max ?? getPlayerMaxStamina(state.player);
    const current = state.player.stamina?.current ?? 0;
    const restored = Math.min(amount, maxStamina - current);
    if (restored <= 0) {
      state.gameLog = addLog(state.gameLog, `Stamina is already full!`, 'info');
      return;
    }
    state.player.stamina = { current: current + restored, max: maxStamina };
    state.gameLog = addLog(state.gameLog, `Stamina restored +${restored}⚡`, 'info');
  }),

  equipItem: (itemUid) => set(state => {
    state.player = equipItem(state.player, itemUid);
    const item = state.player.inventory.find(i => i.uid === itemUid) ||
      Object.values(state.player.equipment).find(i => i?.uid === itemUid);
    state.gameLog = addLog(state.gameLog, `Item equipped.`, 'info');
  }),

  unequipItem: (slot) => set(state => {
    state.player = unequipItem(state.player, slot);
  }),

  useConsumable: (itemUid) => set(state => {
    const result = useConsumable(state.player, itemUid);
    state.player = result.player;
    state.gameLog = addLog(state.gameLog, result.message, 'info');
  }),

  dropItem: (itemUid) => set(state => {
    state.player = removeFromInventory(state.player, itemUid);
    state.gameLog = addLog(state.gameLog, 'Item dropped.', 'info');
  }),

  craftItem: (recipeId) => set(state => {
    const CRAFT_RECIPES = {
      healing_potion:         { ingredients: [{ id: 'healing_herb', count: 2 }], result: 'healing_potion', skillXP: 10, minAlchemy: 1 },
      mana_potion:            { ingredients: [{ id: 'mana_crystal', count: 1 }, { id: 'healing_herb', count: 1 }], result: 'mana_potion', skillXP: 15, minAlchemy: 5 },
      antidote:               { ingredients: [{ id: 'venom_sac', count: 1 }, { id: 'healing_herb', count: 1 }], result: 'antidote', skillXP: 15, minAlchemy: 8 },
      stamina_draught:        { ingredients: [{ id: 'healing_herb', count: 2 }, { id: 'wolf_pelt', count: 1 }], result: 'stamina_draught', skillXP: 12, minAlchemy: 10 },
      greater_healing_potion: { ingredients: [{ id: 'healing_herb', count: 3 }, { id: 'mana_crystal', count: 1 }], result: 'greater_healing_potion', skillXP: 25, minAlchemy: 20 },
      elixir_of_warding:      { ingredients: [{ id: 'mana_crystal', count: 1 }, { id: 'spider_silk', count: 1 }], result: 'elixir_of_warding', skillXP: 30, minAlchemy: 30 },
    };

    const recipe = CRAFT_RECIPES[recipeId];
    if (!recipe) return;

    const alchemyLevel = state.player.skills.alchemy?.level || 5;
    if (alchemyLevel < recipe.minAlchemy) {
      state.gameLog = addLog(state.gameLog, `Alchemy level too low. Need level ${recipe.minAlchemy}.`, 'warning');
      return;
    }

    const inventory = state.player.inventory || [];
    for (const ing of recipe.ingredients) {
      const count = inventory.filter(i => i.id === ing.id).length;
      if (count < ing.count) {
        state.gameLog = addLog(state.gameLog, `Missing ingredients: need ${ing.count}x ${ing.id.replace(/_/g, ' ')}.`, 'warning');
        return;
      }
    }

    let newInv = [...inventory];
    for (const ing of recipe.ingredients) {
      let removed = 0;
      newInv = newInv.filter(i => {
        if (i.id === ing.id && removed < ing.count) { removed++; return false; }
        return true;
      });
    }

    const crafted = generateItem(recipe.result, 'common', new RNG(Math.random().toString()));
    if (crafted) {
      newInv.push(crafted);
      state.player.inventory = newInv;
      applySkillXP(state, 'alchemy', recipe.skillXP);
      state.gameLog = addLog(state.gameLog, `Crafted: ${crafted.name}! (+${recipe.skillXP} Alchemy XP)`, 'success');
    }
  }),

  buyItem: (item, price) => set(state => {
    if (state.player.gold < price) {
      state.gameLog = addLog(state.gameLog, `Not enough gold! Need ${price}g.`, 'warning');
      return;
    }
    state.player.gold -= price;
    state.player = addToInventory(state.player, item);
    state.gameLog = addLog(state.gameLog, `Bought ${item.name} for ${price}g.`, 'info');
  }),

  sellItem: (itemUid, price) => set(state => {
    const item = state.player.inventory.find(i => i.uid === itemUid);
    if (!item) return;
    state.player = removeFromInventory(state.player, itemUid);
    state.player.gold += price;
    state.gameLog = addLog(state.gameLog, `Sold ${item.name} for ${price}g.`, 'info');
  }),

  setSelectedNPC: (npc) => set(state => { state.selectedNPC = npc; }),
  setSelectedQuest: (quest) => set(state => { state.selectedQuest = quest; }),

  addLog: (message, type = 'info') => set(state => {
    state.gameLog = addLog(state.gameLog, message, type);
  }),

  toggleSneak: () => set(state => {
    state.sneaking = !state.sneaking;
    state.gameLog = addLog(state.gameLog,
      state.sneaking
        ? 'You crouch into the shadows. Enemies are slower to notice you.'
        : 'You stand upright. Sneaking disabled.',
      'info');
  }),

  sneakTakedown: () => set(state => {
    if (!state.combat || !state.sneaking) return;
    const enemyHpPct = state.combat.enemy.hp / state.combat.enemy.maxHp;
    if (enemyHpPct > 0.38) {
      state.gameLog = addLog(state.gameLog, 'Enemy is too healthy for a silent takedown (need < 38% HP).', 'warning');
      return;
    }
    const sneakLevel = state.player.skills?.sneak?.level || 1;
    const chance = Math.min(0.90, 0.40 + sneakLevel * 0.008);
    const success = Math.random() < chance;
    if (success) {
      const prevLevel = state.player.level;
      state.combat.enemy.hp = 0;
      state.combat.won = true;
      state.combat.log = [...state.combat.log, `Silent finish — ${state.combat.enemy.name} drops without a sound.`];
      state.sneaking = false;
      state.player = gainXP(state.player, state.combat.xpGained);
      state.player.gold += state.combat.goldGained;
      for (const item of state.combat.lootGained || []) {
        state.player = addToInventory(state.player, item);
      }
      state.player.stats.kills += 1;
      applySkillXP(state, 'sneak', 20);
      state.gameLog = addLog(state.gameLog, `Silent takedown! +${state.combat.xpGained} XP, +${state.combat.goldGained}g.`, 'success');
      if (state.player.level > prevLevel) {
        state.gameLog = addLog(state.gameLog, `★ LEVEL UP! Level ${state.player.level}!`, 'story');
      }
      if (state.dungeon && state.combat._dungeonEnemyId) {
        state.dungeon = killEnemy(state.dungeon, state.combat._dungeonEnemyId);
      }
      const returnToDungeon = !!state.dungeon;
      setTimeout(() => { set(s => { s.combat = null; s.currentView = returnToDungeon ? 'dungeon' : 'world'; }); }, 1500);
    } else {
      state.combat.log = [...state.combat.log, `Takedown failed! ${state.combat.enemy.name} breaks free and retaliates!`];
      state.sneaking = false;
      state.gameLog = addLog(state.gameLog, 'Silent takedown failed! Element of surprise lost.', 'danger');
    }
  }),

  pickpocketNPCItem: (npc, pocketItem, settlementId) => set(state => {
    const pickpocketLevel = state.player.skills?.pickpocket?.level || 1;
    const BASE_CHANCES = { easy: 0.72, medium: 0.48, hard: 0.22 };
    const baseChance = BASE_CHANCES[pocketItem.difficulty] || 0.40;
    const chance = Math.min(0.92, baseChance + pickpocketLevel * 0.005 + (state.sneaking ? 0.18 : 0));
    const success = Math.random() < chance;
    if (success) {
      if (pocketItem.type === 'gold') {
        state.player.gold += pocketItem.goldAmount;
        state.gameLog = addLog(state.gameLog, `Lifted ${pocketItem.name} from ${npc.name}. +${pocketItem.goldAmount}g.`, 'success');
      } else if (pocketItem.itemId) {
        const item = generateItem(pocketItem.itemId, 'common', new RNG(Math.random().toString()));
        if (item) { state.player.inventory.push(item); }
        state.gameLog = addLog(state.gameLog, `Lifted ${pocketItem.name} from ${npc.name}.${item ? ' +' + item.name : ''}`, 'success');
      } else {
        state.player.gold += pocketItem.value || 5;
        state.gameLog = addLog(state.gameLog, `Lifted ${pocketItem.name} from ${npc.name}. +${pocketItem.value || 5}g equivalent.`, 'success');
      }
      applySkillXP(state, 'pickpocket', 12);
    } else {
      const WORSEN = { friendly: 'neutral', neutral: 'suspicious', suspicious: 'hostile', hostile: 'hostile' };
      state.gameLog = addLog(state.gameLog, `${npc.name} grabs your wrist. "Thief!" The town guard stirs.`, 'danger');
      for (const r of state.world.regions) {
        for (const s of (r.settlements || [])) {
          if (s.id === settlementId) {
            for (const n of (s.npcs || [])) {
              if (n.id === npc.id) n.attitude = WORSEN[n.attitude] || 'hostile';
            }
          }
        }
      }
      const ppRegion = findRegionForSettlement(state.world, settlementId);
      if (ppRegion) state.bounties[ppRegion.id] = (state.bounties[ppRegion.id] || 0) + 50;
    }
    state.npcActionFeedback = { type: success ? 'pickpocket_success' : 'pickpocket_fail', npcId: npc.id };
  }),

  lootHouseContainer: (settlementId, houseIdx, containerIdx) => set(state => {
    const containerKey = `${settlementId}_h${houseIdx}_c${containerIdx}`;
    if (state.lootedContainers[containerKey]) {
      state.gameLog = addLog(state.gameLog, 'Already searched — nothing left.', 'info');
      return;
    }
    const sneakLevel = state.player.skills?.sneak?.level || 1;
    const catchChance = Math.max(0.05, 0.50 - sneakLevel * 0.004 - (state.sneaking ? 0.20 : 0));
    if (Math.random() < catchChance) {
      state.gameLog = addLog(state.gameLog, 'Someone spots you rummaging and shouts! You slip out before the guards arrive.', 'danger');
      const burgleRegion = findRegionForSettlement(state.world, settlementId);
      if (burgleRegion) state.bounties[burgleRegion.id] = (state.bounties[burgleRegion.id] || 0) + 75;
      return;
    }
    const rng = new RNG(containerKey);
    const gold = rng.int(0, 18);
    const templates = ['healing_herb', 'healing_potion', 'lockpick', 'healing_herb'];
    let found = [];
    if (gold > 0) { state.player.gold += gold; found.push(`${gold}g`); }
    if (rng.float() < 0.4) {
      const item = generateItem(templates[rng.int(0, templates.length - 1)], 'common', rng);
      if (item) { state.player.inventory.push(item); found.push(item.name); }
    }
    applySkillXP(state, 'sneak', 5);
    state.gameLog = addLog(state.gameLog, found.length ? `Searched container — found: ${found.join(', ')}.` : 'Container empty.', found.length ? 'loot' : 'info');
    state.lootedContainers[containerKey] = true;
  }),

  stealFromNPC: (npc, settlementId) => set(state => {
    const sneakLevel = state.player.skills?.sneak?.level || 1;
    const attitudePenalty = { friendly: 0.15, neutral: 0, suspicious: -0.10, hostile: -0.20 }[npc.attitude] || 0;
    const chance = Math.min(0.80, 0.18 + sneakLevel * 0.006 + attitudePenalty);
    const success = Math.random() < chance;

    if (success) {
      const stolen = Math.floor((npc.wealth || 20) * 0.15) + Math.floor(Math.random() * 10) + 3;
      state.player.gold += stolen;
      applySkillXP(state, 'sneak', 12);
      state.gameLog = addLog(state.gameLog, `You slip a hand into ${npc.name}'s purse. +${stolen}g — nobody noticed.`, 'success');
      for (const r of state.world.regions) {
        for (const s of (r.settlements || [])) {
          if (s.id === settlementId) {
            for (const n of (s.npcs || [])) {
              if (n.id === npc.id) n.wealth = Math.max(0, (n.wealth || 20) - stolen);
            }
          }
        }
      }
    } else {
      const WORSEN = { friendly: 'neutral', neutral: 'suspicious', suspicious: 'hostile', hostile: 'hostile' };
      state.gameLog = addLog(state.gameLog, `${npc.name} catches your hand! "Thief!" — the town guard takes notice.`, 'danger');
      for (const r of state.world.regions) {
        for (const s of (r.settlements || [])) {
          if (s.id === settlementId) {
            for (const n of (s.npcs || [])) {
              if (n.id === npc.id) n.attitude = WORSEN[n.attitude] || 'hostile';
            }
          }
        }
      }
      const stealRegion = findRegionForSettlement(state.world, settlementId);
      if (stealRegion) state.bounties[stealRegion.id] = (state.bounties[stealRegion.id] || 0) + 60;
    }
    state.npcActionFeedback = { type: success ? 'steal_success' : 'steal_fail', npcId: npc.id };
  }),

  assistNPC: (npc, settlementId, goldAmount = 10) => set(state => {
    if (state.player.gold < goldAmount) {
      state.gameLog = addLog(state.gameLog, `Not enough gold to help ${npc.name}.`, 'warning');
      return;
    }
    state.player.gold -= goldAmount;
    const IMPROVE = { hostile: 'suspicious', suspicious: 'neutral', neutral: 'friendly', friendly: 'friendly' };
    const prevAttitude = npc.attitude;
    for (const r of state.world.regions) {
      for (const s of (r.settlements || [])) {
        if (s.id === settlementId) {
          for (const n of (s.npcs || [])) {
            if (n.id === npc.id) n.attitude = IMPROVE[n.attitude] || 'neutral';
          }
        }
      }
    }
    const newAttitude = IMPROVE[prevAttitude] || 'neutral';
    if (prevAttitude === newAttitude) {
      state.gameLog = addLog(state.gameLog, `You give ${goldAmount}g to ${npc.name}. They already think fondly of you.`, 'info');
    } else {
      state.gameLog = addLog(state.gameLog, `You give ${goldAmount}g to ${npc.name}. Their expression warms. (-${goldAmount}g)`, 'success');
    }
    state.npcActionFeedback = { type: 'assist', npcId: npc.id };
  }),

  attackNPC: (npc, settlementId) => set(state => {
    if (npc.deceased) return;
    const OCCUPATION_ENEMY = { guard: ['bandit', 3], mage: ['dark_mage', 2], alchemist: ['witch', 2], noble: ['bandit', 2] };
    const [templateId, dangerLevel] = OCCUPATION_ENEMY[npc.occupation] || ['bandit', 1];
    const rng = new RNG(Math.random().toString());
    const combat = initCombat(state.player, templateId, dangerLevel, rng.uid());
    combat.enemy.name = npc.name;
    combat._npcCombat = { npcId: npc.id, settlementId };
    state.combat = combat;
    state.currentView = 'combat';
    state.gameLog = addLog(state.gameLog, `You draw on ${npc.name}! The settlement erupts into chaos.`, 'combat');
    for (const r of state.world.regions) {
      for (const s of (r.settlements || [])) {
        if (s.id === settlementId) {
          for (const n of (s.npcs || [])) {
            if (n.id === npc.id) n.attitude = 'hostile';
          }
        }
      }
    }
    const atkRegion = findRegionForSettlement(state.world, settlementId);
    if (atkRegion) state.bounties[atkRegion.id] = (state.bounties[atkRegion.id] || 0) + 200;
    state.npcActionFeedback = { type: 'attack', npcId: npc.id };
  }),

  assassinateNPC: (npc, settlementId) => set(state => {
    if (npc.deceased || !state.sneaking) return;
    const sneakLevel = state.player.skills?.sneak?.level || 1;
    const chance = Math.min(0.82, 0.28 + sneakLevel * 0.012);
    const success = Math.random() < chance;
    const region = findRegionForSettlement(state.world, settlementId);
    const regionId = region?.id;
    if (success) {
      state.killedNPCs[npc.id] = { settlementId, killedAt: state.world.day, name: npc.name };
      for (const r of state.world.regions) {
        for (const s of (r.settlements || [])) {
          if (s.id === settlementId) {
            for (const n of (s.npcs || [])) {
              if (n.id === npc.id) n.deceased = true;
            }
          }
        }
      }
      const xpGain = 40 + sneakLevel;
      state.player = gainXP(state.player, xpGain);
      applySkillXP(state, 'sneak', 30);
      if (regionId) state.bounties[regionId] = (state.bounties[regionId] || 0) + 300;
      state.sneaking = false;
      state.gameLog = addLog(state.gameLog, `${npc.name} falls without a sound. +${xpGain} XP. Major bounty added.`, 'danger');
      state.npcActionFeedback = { type: 'assassinate_success', npcId: npc.id };
    } else {
      const OCCUPATION_ENEMY = { guard: ['bandit', 3], mage: ['dark_mage', 2], alchemist: ['witch', 2], noble: ['bandit', 2] };
      const [templateId, dangerLevel] = OCCUPATION_ENEMY[npc.occupation] || ['bandit', 1];
      const rng = new RNG(Math.random().toString());
      const combat = initCombat(state.player, templateId, dangerLevel, rng.uid());
      combat.enemy.name = npc.name;
      combat.enemy.hp = Math.floor(combat.enemy.maxHp * 0.5);
      combat._npcCombat = { npcId: npc.id, settlementId };
      state.combat = combat;
      state.currentView = 'combat';
      if (regionId) state.bounties[regionId] = (state.bounties[regionId] || 0) + 150;
      state.sneaking = false;
      state.gameLog = addLog(state.gameLog, `${npc.name} turns just in time! Assassination failed — combat!`, 'combat');
      state.npcActionFeedback = { type: 'assassinate_fail', npcId: npc.id };
    }
  }),

  flattenNPC: (npc, settlementId) => set(state => {
    if (npc.deceased) return;
    const IMPROVE = { hostile: 'suspicious', suspicious: 'neutral', neutral: 'friendly', friendly: 'friendly' };
    const chance = { friendly: 0.25, neutral: 0.60, suspicious: 0.40, hostile: 0.20 }[npc.attitude] ?? 0.40;
    const success = Math.random() < chance;
    for (const r of state.world.regions) {
      for (const s of (r.settlements || [])) {
        if (s.id === settlementId) {
          for (const n of (s.npcs || [])) {
            if (n.id === npc.id && success) n.attitude = IMPROVE[n.attitude] || 'neutral';
          }
        }
      }
    }
    applySkillXP(state, 'speech', 5);
    state.gameLog = addLog(state.gameLog,
      success ? `${npc.name} smiles. "Well, aren't you the charming one."` : `${npc.name} looks unimpressed. "Save it."`,
      success ? 'success' : 'info');
    state.npcActionFeedback = { type: success ? 'flatter_success' : 'flatter_fail', npcId: npc.id };
  }),

  bribeNPC: (npc, settlementId, amount) => set(state => {
    if (npc.deceased || state.player.gold < amount) {
      state.gameLog = addLog(state.gameLog, state.player.gold < amount ? `Not enough gold (need ${amount}g).` : '', 'warning');
      return;
    }
    state.player.gold -= amount;
    const IMPROVE = { hostile: 'suspicious', suspicious: 'neutral', neutral: 'friendly', friendly: 'friendly' };
    for (const r of state.world.regions) {
      for (const s of (r.settlements || [])) {
        if (s.id === settlementId) {
          for (const n of (s.npcs || [])) {
            if (n.id === npc.id) n.attitude = IMPROVE[n.attitude] || 'neutral';
          }
        }
      }
    }
    state.gameLog = addLog(state.gameLog, `${npc.name} pockets the ${amount}g. "Speak of this to no one."`, 'success');
    state.npcActionFeedback = { type: 'bribe', npcId: npc.id };
  }),

  threatenNPC: (npc, settlementId) => set(state => {
    if (npc.deceased) return;
    const speechLevel = state.player.skills?.speech?.level || 1;
    const chance = Math.min(0.70, 0.22 + speechLevel * 0.008 + (npc.attitude === 'hostile' ? -0.2 : 0));
    const success = Math.random() < chance;
    if (success) {
      const extorted = Math.floor((npc.wealth || 20) * 0.22) + 5;
      state.player.gold += extorted;
      const WORSEN = { friendly: 'neutral', neutral: 'suspicious', suspicious: 'hostile', hostile: 'hostile' };
      for (const r of state.world.regions) {
        for (const s of (r.settlements || [])) {
          if (s.id === settlementId) {
            for (const n of (s.npcs || [])) {
              if (n.id === npc.id) { n.attitude = WORSEN[n.attitude] || 'hostile'; n.wealth = Math.max(0, (n.wealth || 20) - extorted); }
            }
          }
        }
      }
      applySkillXP(state, 'speech', 8);
      state.gameLog = addLog(state.gameLog, `${npc.name} hands over ${extorted}g, hands shaking. +${extorted}g`, 'success');
    } else {
      state.gameLog = addLog(state.gameLog, `${npc.name} stands firm. "I'm not afraid of you." The tension rises.`, 'danger');
      if (npc.attitude === 'hostile') {
        const OCCUPATION_ENEMY = { guard: ['bandit', 3], mage: ['dark_mage', 2], alchemist: ['witch', 2], noble: ['bandit', 2] };
        const [templateId, dangerLevel] = OCCUPATION_ENEMY[npc.occupation] || ['bandit', 1];
        const rng = new RNG(Math.random().toString());
        const combat = initCombat(state.player, templateId, dangerLevel, rng.uid());
        combat.enemy.name = npc.name;
        combat._npcCombat = { npcId: npc.id, settlementId };
        state.combat = combat;
        state.currentView = 'combat';
      }
    }
    state.npcActionFeedback = { type: success ? 'threaten_success' : 'threaten_fail', npcId: npc.id };
  }),

  triggerGuardEncounter: (regionId, settlementId) => set(state => {
    const bounty = state.bounties[regionId] || 0;
    if (bounty <= 0 || state.guardEncounter) return;
    state.guardEncounter = { regionId, settlementId, bounty };
  }),

  serveTime: () => set(state => {
    if (!state.guardEncounter) return;
    const { regionId, bounty } = state.guardEncounter;
    const daysServed = Math.max(3, Math.floor(bounty / 30));
    state.world.day += daysServed;
    const goldLost = Math.floor(state.player.gold * 0.12);
    state.player.gold = Math.max(0, state.player.gold - goldLost);
    const equippedUids = Object.values(state.player.equipment || {}).filter(Boolean).map(i => i?.uid).filter(Boolean);
    const confiscatable = state.player.inventory.filter(i => !equippedUids.includes(i.uid) && i.type !== 'key');
    let confiscatedName = null;
    if (confiscatable.length > 0) {
      const item = confiscatable[Math.floor(Math.random() * confiscatable.length)];
      state.player.inventory = state.player.inventory.filter(i => i.uid !== item.uid);
      confiscatedName = item.name;
    }
    state.bounties[regionId] = 0;
    state.guardEncounter = null;
    state.sneaking = false;
    state.currentView = 'world';
    state.gameLog = addLog(state.gameLog,
      confiscatedName
        ? `Served ${daysServed} days. Guards confiscated ${goldLost}g and your ${confiscatedName}. Bounty cleared.`
        : `Served ${daysServed} days. Guards confiscated ${goldLost}g. Bounty cleared.`,
      'warning');
  }),

  payBounty: () => set(state => {
    if (!state.guardEncounter) return;
    const { regionId, bounty } = state.guardEncounter;
    if (state.player.gold < bounty) {
      state.gameLog = addLog(state.gameLog, `Not enough gold. Need ${bounty}g to pay your bounty.`, 'warning');
      return;
    }
    state.player.gold -= bounty;
    state.bounties[regionId] = 0;
    state.guardEncounter = null;
    state.gameLog = addLog(state.gameLog, `Paid ${bounty}g bounty. The guard nods. "Be on your way."`, 'success');
  }),

  fightGuards: () => set(state => {
    if (!state.guardEncounter) return;
    const { regionId, settlementId, bounty } = state.guardEncounter;
    const { combat, dangerLevel } = buildGuardCombat(state.player, bounty, 1);
    combat._isGuardCombat = true;
    combat._guardWave = 1;
    combat._regionId = regionId;
    combat._settlementId = settlementId;
    combat._guardDanger = dangerLevel;
    state.combat = combat;
    state.currentView = 'combat';
    state.bounties[regionId] = (state.bounties[regionId] || 0) + 100;
    state.guardEncounter = null;
    state.gameLog = addLog(state.gameLog, 'You resist arrest! Drawing steel against the law!', 'danger');
  }),

  // --- Travel encounter actions ---
  dismissTravelEncounter: () => set(state => {
    const enc = state.pendingTravelEncounter;
    if (enc) state.gameLog = addLog(state.gameLog, 'You continue on your way.', 'travel');
    state.pendingTravelEncounter = null;
  }),

  resolveTravelEncounter: (choiceIdx) => set(state => {
    const enc = state.pendingTravelEncounter;
    if (!enc) return;
    const choice = enc.choices[choiceIdx];
    if (!choice) { state.pendingTravelEncounter = null; return; }
    const outcome = `${enc.type}_${choice.outcome}`;

    if (choice.outcome === 'pass') {
      state.gameLog = addLog(state.gameLog, 'You nod and continue on your way.', 'travel');
    } else if (outcome === 'merchant_trade') {
      const cost = 5 + Math.floor(Math.random() * 16);
      if (state.player.gold >= cost) {
        state.player.gold -= cost;
        const rng = new RNG(Math.random().toString());
        const tpls = ['healing_potion', 'healing_herb', 'iron_ration', 'bandage'];
        const tpl = tpls[rng.int(0, tpls.length - 1)];
        const item = generateItem(tpl, 'common', rng);
        if (item) { state.player = addToInventory(state.player, item); state.gameLog = addLog(state.gameLog, `Bought ${item.name} from the merchant for ${cost}g.`, 'loot'); }
        else { state.player.gold += cost; state.gameLog = addLog(state.gameLog, 'The merchant had nothing useful today.', 'info'); }
      } else {
        state.gameLog = addLog(state.gameLog, `Not enough gold (need at least 5g).`, 'warning');
      }
    } else if (outcome === 'pilgrim_bless') {
      const heal = Math.floor(10 + (state.player.level || 1) * 2);
      const maxHP = getPlayerMaxHP(state.player);
      state.player.hp = { ...state.player.hp, current: Math.min(maxHP, state.player.hp.current + heal) };
      state.gameLog = addLog(state.gameLog, `The elder pilgrim places a hand on your shoulder. You feel renewed. (+${heal} HP)`, 'story');
    } else if (outcome === 'pilgrim_donate') {
      const potion = state.player.inventory.find(i => i.type === 'consumable' && i.hpRestore);
      if (potion) {
        state.player.inventory = state.player.inventory.filter(i => i.uid !== potion.uid);
        state.gameLog = addLog(state.gameLog, `You share your ${potion.name} with the pilgrims. They bless you warmly.`, 'story');
      } else {
        state.gameLog = addLog(state.gameLog, 'You have nothing suitable. The pilgrims bless you anyway.', 'info');
      }
    } else if (outcome === 'adventurer_help') {
      const xp = 25 + enc.dangerLevel * 10;
      state.player = gainXP(state.player, xp);
      const hints = ['ancient ruins', 'a hidden cave', 'a bandit camp', 'a dungeon entrance'];
      const hint = hints[Math.floor(Math.random() * hints.length)];
      state.gameLog = addLog(state.gameLog, `You help bind their wounds. They mention ${hint} nearby. (+${xp} XP)`, 'story');
    } else if (outcome === 'adventurer_potion') {
      const potion = state.player.inventory.find(i => i.type === 'consumable' && i.hpRestore);
      if (potion) {
        state.player.inventory = state.player.inventory.filter(i => i.uid !== potion.uid);
        const xp = 40 + enc.dangerLevel * 10;
        state.player = gainXP(state.player, xp);
        state.gameLog = addLog(state.gameLog, `You give them your ${potion.name}. They recover and teach you a technique. (+${xp} XP)`, 'story');
      } else {
        state.gameLog = addLog(state.gameLog, 'You have no potions to spare. The adventurer nods grimly.', 'info');
      }
    } else if (outcome === 'cache_loot') {
      const gold = 15 + Math.floor(Math.random() * 40) + enc.dangerLevel * 8;
      state.player.gold += gold;
      state.gameLog = addLog(state.gameLog, `Inside the bundle: ${gold}g wrapped in oilcloth. Someone\'s emergency fund, now yours.`, 'loot');
    } else if (outcome === 'fugitive_hide') {
      const xp = 20 + enc.dangerLevel * 5;
      state.player = gainXP(state.player, xp);
      state.gameLog = addLog(state.gameLog, `You help the fugitive hide. They vanish into the brush. "I won\'t forget this." (+${xp} XP)`, 'story');
    } else if (outcome === 'fugitive_turnin') {
      const region = state.world?.regions?.find(r => r.x === enc.regionX && r.y === enc.regionY);
      if (region && state.bounties[region.id] > 0) {
        const cut = Math.min(50, state.bounties[region.id]);
        state.bounties[region.id] = Math.max(0, state.bounties[region.id] - cut);
        state.gameLog = addLog(state.gameLog, `You flag down a patrol. They take the fugitive and reduce your bounty by ${cut}g.`, 'info');
      } else {
        state.gameLog = addLog(state.gameLog, 'You flag down a patrol. They take the fugitive without a word of thanks.', 'info');
      }
    }
    state.pendingTravelEncounter = null;
  }),

  // --- Skill level-up toast ---
  dismissSkillLevelUp: () => set(state => {
    if (state.pendingLevelUps?.length > 0) state.pendingLevelUps.shift();
  }),

  returnToTitle: () => set(state => {
    state.phase = 'title';
    state.player = null;
    state.world = null;
    state.factions = null;
    state.combat = null;
    state.dungeon = null;
    state.currentView = 'world';
    state.gameLog = [];
    state.sneaking = false;
    state.lootedContainers = {};
    state.bounties = {};
    state.guardEncounter = null;
    state.killedNPCs = {};
    state.npcActionFeedback = null;
    state.gameOver = false;
  }),
})));

export default useGameStore;
