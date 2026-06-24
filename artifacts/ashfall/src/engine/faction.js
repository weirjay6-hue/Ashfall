import { FACTION_TEMPLATES } from '../data/factions.js';

export function initFactions(rng) {
  const factions = {};
  for (const [id, template] of Object.entries(FACTION_TEMPLATES)) {
    factions[id] = {
      ...template,
      power: template.initialPower + rng.int(-10, 10),
      territory: [],
      resources: { gold: rng.int(500, 2000), troops: rng.int(20, 100) },
      reputation: {},
      goals: [selectFactionGoal(template, rng)],
      atWarWith: [],
      alliedWith: [],
      currentAction: 'consolidate',
    };
  }
  return factions;
}

function selectFactionGoal(template, rng) {
  const goals = ['expand', 'recruit', 'trade', 'research', 'patrol'];
  if (template.type === 'hostile') return rng.pick(['raid', 'expand', 'recruit']);
  if (template.type === 'guild') return rng.pick(['recruit', 'trade', 'research']);
  return rng.pick(goals);
}

export function tickFactions(factions, world, rng) {
  const updatedFactions = { ...factions };

  for (const [id, faction] of Object.entries(factions)) {
    if (faction.type === 'authority' || faction.type === 'guild') continue;
    updatedFactions[id] = tickFaction(faction, id, world, updatedFactions, rng);
  }

  return updatedFactions;
}

function tickFaction(faction, id, world, allFactions, rng) {
  const action = assessFaction(faction, allFactions, rng);
  let goldChange = 0;
  let powerChange = 0;
  let event = null;

  switch (action) {
    case 'expand':
      powerChange = rng.int(1, 3);
      goldChange = -rng.int(10, 30);
      event = { type: 'faction_expand', factionId: id };
      break;
    case 'raid':
      goldChange = rng.int(20, 60);
      powerChange = rng.int(-2, 3);
      event = { type: 'faction_raid', factionId: id };
      break;
    case 'recruit':
      goldChange = -rng.int(15, 40);
      faction.resources.troops = Math.min(200, faction.resources.troops + rng.int(2, 8));
      break;
    case 'trade':
      goldChange = rng.int(15, 50);
      break;
    default:
      goldChange = rng.int(-5, 5);
  }

  const war = checkForWar(faction, id, allFactions, rng);

  return {
    ...faction,
    power: Math.max(5, Math.min(100, faction.power + powerChange)),
    resources: {
      ...faction.resources,
      gold: Math.max(0, faction.resources.gold + goldChange),
    },
    currentAction: action,
    atWarWith: war ? [...new Set([...faction.atWarWith, war])] : faction.atWarWith,
    goals: [selectFactionGoal(faction, rng)],
  };
}

function assessFaction(faction, allFactions, rng) {
  if (faction.resources.gold < 100) return 'raid';
  if (faction.power < 30) return 'recruit';
  if (faction.type === 'hostile' && rng.bool(0.4)) return 'raid';
  return rng.pick(['expand', 'recruit', 'trade', 'patrol', 'consolidate']);
}

function checkForWar(faction, id, allFactions, rng) {
  if (faction.type !== 'hostile') return null;
  if (rng.bool(0.05)) {
    const hated = faction.hatedFactions || [];
    const target = hated.find(f => allFactions[f] && !faction.atWarWith.includes(f));
    return target || null;
  }
  return null;
}

export function getPlayerFactionRank(factionId, rep) {
  const faction = FACTION_TEMPLATES[factionId];
  if (!faction || !faction.ranks?.length) return null;
  const idx = Math.min(faction.ranks.length - 1, Math.floor((rep + 100) / 40));
  return faction.ranks[Math.max(0, idx)];
}

export function canJoinFaction(factionId, player) {
  const template = FACTION_TEMPLATES[factionId];
  if (!template || !template.joinable) return false;
  const reqs = template.joinRequirements?.minSkill || {};
  for (const [skill, minLevel] of Object.entries(reqs)) {
    if ((player.skills[skill]?.level || 0) < minLevel) return false;
  }
  return true;
}

export function joinFaction(factionId, player) {
  const faction = FACTION_TEMPLATES[factionId];
  if (!faction) return player;
  const newRep = { ...player.reputation, [factionId]: Math.max(player.reputation[factionId] || 0, 10) };
  const hatedFactions = faction.hatedFactions || [];
  for (const hated of hatedFactions) {
    newRep[hated] = Math.min(newRep[hated] || 0, -20);
  }
  return { ...player, factionMemberships: [...(player.factionMemberships || []), factionId], reputation: newRep };
}

export function getFactionEventText(event, factionId) {
  const faction = FACTION_TEMPLATES[factionId];
  const name = faction?.name || factionId;
  switch (event.type) {
    case 'faction_expand': return `${name} expands their territory.`;
    case 'faction_raid': return `${name} raids nearby settlements.`;
    case 'faction_war': return `${name} declares war!`;
    default: return `${name} takes action.`;
  }
}
