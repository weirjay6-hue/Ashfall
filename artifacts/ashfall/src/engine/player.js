import { RACES, BACKGROUNDS } from '../data/races.js';
import { initSkills, gainSkillXP, getSkillLevel } from '../data/skills.js';
import { getPlayerMaxHP, getPlayerMaxMP, getPlayerMaxStamina } from './combat.js';
import { generateItem } from './items.js';
import { RNG } from './rng.js';

export function createPlayer(name, raceId, backgroundId, seed) {
  const rng = new RNG(seed);
  const race = RACES[raceId] || RACES.human;
  const bg = BACKGROUNDS[backgroundId] || BACKGROUNDS.warrior;

  const baseAttributes = {
    strength: 5 + (race.attributes.strength || 0),
    dexterity: 5 + (race.attributes.dexterity || 0),
    intelligence: 5 + (race.attributes.intelligence || 0),
    endurance: 5 + (race.attributes.endurance || 0),
    willpower: 5 + (race.attributes.willpower || 0),
    personality: 5 + (race.attributes.personality || 0),
    luck: 5 + (race.attributes.luck || 0),
  };

  const combinedSkillBonuses = { ...race.skillBonuses, ...bg.skillBonuses };
  const skills = initSkills(combinedSkillBonuses);

  const maxHP = 30 + baseAttributes.endurance * 3;
  const maxMP = 10 + baseAttributes.intelligence * 3;
  const maxStamina = 20 + baseAttributes.endurance * 2;

  const equipment = {
    helmet: null, necklace: null, chest: null, gloves: null,
    belt: null, legs: null, boots: null, mainHand: null,
    offHand: null, ring1: null, ring2: null, trinket: null,
  };

  const startingInventory = bg.startingItems.map(id => {
    const item = generateItem(id, 'common', rng);
    return item;
  }).filter(Boolean);

  return {
    id: 'player',
    name,
    race: raceId,
    background: backgroundId,
    level: 1,
    xp: 0,
    xpNext: 100,
    attributes: baseAttributes,
    skills,
    hp: { current: maxHP, max: maxHP },
    mp: { current: maxMP, max: maxMP },
    stamina: { current: maxStamina, max: maxStamina },
    gold: (race.startingGold || 50) + (bg.startingGold || 0),
    inventory: startingInventory,
    equipment,
    reputation: {},
    bounties: {},
    factionMemberships: bg.startingFaction ? [bg.startingFaction] : [],
    perks: [],
    location: { regionX: 0, regionY: 0, type: 'settlement', id: null },
    knownLocations: ['region_0_0'],
    crimes: [],
    statusEffects: [],
    stats: {
      kills: 0, dungeonsCleared: 0, questsCompleted: 0,
      goldEarned: 0, damageDone: 0, timesRested: 0,
    },
  };
}

export function gainXP(player, amount) {
  let p = { ...player, xp: player.xp + amount };
  while (p.xp >= p.xpNext) {
    p = levelUp(p);
  }
  return p;
}

function levelUp(player) {
  const newLevel = player.level + 1;
  const attrs = { ...player.attributes };

  attrs.strength    += Math.random() > 0.5 ? 1 : 0;
  attrs.dexterity   += Math.random() > 0.5 ? 1 : 0;
  attrs.intelligence += Math.random() > 0.6 ? 1 : 0;
  attrs.endurance   += Math.random() > 0.5 ? 1 : 0;
  attrs.willpower   += Math.random() > 0.6 ? 1 : 0;
  attrs.personality += Math.random() > 0.7 ? 1 : 0;
  attrs.luck        += Math.random() > 0.7 ? 1 : 0;

  const maxHP = getPlayerMaxHP({ ...player, level: newLevel, attributes: attrs });
  const maxMP = getPlayerMaxMP({ ...player, level: newLevel, attributes: attrs });
  const maxStamina = getPlayerMaxStamina({ ...player, level: newLevel, attributes: attrs });

  return {
    ...player,
    level: newLevel,
    xp: player.xp - player.xpNext,
    xpNext: Math.floor(player.xpNext * 1.3),
    attributes: attrs,
    hp: { current: Math.min(player.hp.current + 10, maxHP), max: maxHP },
    mp: { current: Math.min(player.mp.current + 5, maxMP), max: maxMP },
    stamina: { current: maxStamina, max: maxStamina },
  };
}

export function useSkill(player, skillId, baseXP = 15) {
  const skills = gainSkillXP(player.skills, skillId, baseXP);
  return { ...player, skills };
}

export function restPlayer(player) {
  const maxHP = getPlayerMaxHP(player);
  const maxMP = getPlayerMaxMP(player);
  const maxStamina = getPlayerMaxStamina(player);
  return {
    ...player,
    hp: { current: maxHP, max: maxHP },
    mp: { current: maxMP, max: maxMP },
    stamina: { current: maxStamina, max: maxStamina },
    statusEffects: [],
    stats: { ...player.stats, timesRested: player.stats.timesRested + 1 },
  };
}

export function addToInventory(player, item) {
  return { ...player, inventory: [...player.inventory, item] };
}

export function removeFromInventory(player, itemUid) {
  return { ...player, inventory: player.inventory.filter(i => i.uid !== itemUid) };
}

export function equipItem(player, itemUid) {
  const item = player.inventory.find(i => i.uid === itemUid);
  if (!item || !item.slot) return player;

  const oldEquipped = player.equipment[item.slot];
  const newEquipment = { ...player.equipment, [item.slot]: item };
  let newInventory = player.inventory.filter(i => i.uid !== itemUid);
  if (oldEquipped) newInventory = [...newInventory, oldEquipped];

  return { ...player, equipment: newEquipment, inventory: newInventory };
}

export function unequipItem(player, slot) {
  const item = player.equipment[slot];
  if (!item) return player;
  return {
    ...player,
    equipment: { ...player.equipment, [slot]: null },
    inventory: [...player.inventory, item],
  };
}

export function useConsumable(player, itemUid) {
  const item = player.inventory.find(i => i.uid === itemUid);
  if (!item || item.type !== 'consumable') return { player, message: 'Cannot use this item.' };

  let updated = removeFromInventory(player, itemUid);
  const messages = [];

  if (item.hpRestore) {
    const maxHP = getPlayerMaxHP(player);
    const restored = Math.min(item.hpRestore, maxHP - player.hp.current);
    updated = { ...updated, hp: { ...player.hp, current: player.hp.current + restored } };
    messages.push(`Restored ${restored} HP.`);
  }
  if (item.mpRestore) {
    const maxMP = getPlayerMaxMP(player);
    const restored = Math.min(item.mpRestore, maxMP - player.mp.current);
    updated = { ...updated, mp: { ...player.mp, current: player.mp.current + restored } };
    messages.push(`Restored ${restored} MP.`);
  }
  if (item.curesPoison) {
    updated = { ...updated, statusEffects: (player.statusEffects || []).filter(s => s.id !== 'poison') };
    messages.push('Poison cured!');
  }

  return { player: updated, message: messages.join(' ') || 'Used.' };
}

export function changeReputation(player, factionOrLocationId, amount) {
  const current = player.reputation[factionOrLocationId] || 0;
  const newRep = Math.max(-100, Math.min(100, current + amount));
  return { ...player, reputation: { ...player.reputation, [factionOrLocationId]: newRep } };
}

export function addBounty(player, regionId, amount) {
  const current = player.bounties[regionId] || 0;
  return { ...player, bounties: { ...player.bounties, [regionId]: current + amount } };
}

export function getCarryWeight(player) {
  const maxWeight = 50 + player.attributes.strength * 5;
  const currentWeight = player.inventory.reduce((s, i) => s + (i.weight || 0), 0)
    + Object.values(player.equipment).reduce((s, i) => s + (i?.weight || 0), 0);
  return { current: currentWeight, max: maxWeight };
}
