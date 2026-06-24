import { RNG } from './rng.js';

// ============================================================
// NPC SOCIAL SIMULATION ENGINE
// Relationship graph, gossip, memories, and social dynamics
// ============================================================

// Relationship types
export const RELATIONSHIP_TYPES = {
  friend:    { label: 'Friend',    icon: '😊', baseDisposition: 30,  canGossip: true  },
  enemy:     { label: 'Enemy',     icon: '😠', baseDisposition: -40, canGossip: true  },
  family:    { label: 'Family',    icon: '👨‍👩‍👧', baseDisposition: 20,  canGossip: false },
  spouse:    { label: 'Spouse',    icon: '💍', baseDisposition: 50,  canGossip: false },
  rival:     { label: 'Rival',     icon: '⚔️', baseDisposition: -20, canGossip: true  },
  mentor:    { label: 'Mentor',    icon: '📚', baseDisposition: 25,  canGossip: false },
  apprentice:{ label: 'Apprentice',icon: '🎓', baseDisposition: 15,  canGossip: false },
  ally:      { label: 'Ally',      icon: '🤝', baseDisposition: 15,  canGossip: true  },
  neutral:   { label: 'Neutral',   icon: '😐', baseDisposition: 0,   canGossip: false },
};

// Memory types that NPCs record
export const MEMORY_TYPES = {
  player_helped:   { weight: 40,  disposition: 25,  decayDays: 60,  label: 'You helped them' },
  player_harmed:   { weight: -60, disposition: -40, decayDays: 90,  label: 'You harmed them' },
  player_crime:    { weight: -30, disposition: -20, decayDays: 45,  label: 'Witnessed your crime' },
  player_gift:     { weight: 20,  disposition: 15,  decayDays: 30,  label: 'You gave them a gift' },
  player_rude:     { weight: -15, disposition: -10, decayDays: 20,  label: 'You were rude to them' },
  player_charmed:  { weight: 20,  disposition: 15,  decayDays: 25,  label: 'You charmed them' },
  player_pickpock: { weight: -25, disposition: -20, decayDays: 40,  label: 'You stole from them' },
  player_killed:   { weight: 0,   disposition: -60, decayDays: 999, label: 'You killed someone they knew' },
  player_saved:    { weight: 50,  disposition: 30,  decayDays: 90,  label: 'You saved their life' },
};

// Gossip topic templates
const GOSSIP_TEMPLATES = [
  'I heard {name} has been seen in {place} — something is going on there.',
  'Word is that {name} is in debt to {faction}. Ugly business.',
  'Did you hear? {name} was caught stealing from the market.',
  '{name} and {name2} have not spoken in weeks. Trouble, they say.',
  'I saw {name} leave town in the middle of the night. Very suspicious.',
  'People say {name} found something valuable out near {place}.',
  'There is talk that {faction} is pushing for more influence in {place}.',
  '{name} owes {name2} a considerable sum. Do not lend to either of them.',
  'Rumor is there is a dungeon near {place} that nobody has come back from.',
  '{name} was seen arguing with a stranger at the gate. Loudly.',
  'I would not go to {place} alone after dark. Strange things happen there.',
  'A merchant told me {faction} agents have been asking questions in {place}.',
];

// Personality traits that affect behavior
export const PERSONALITY_TRAITS = [
  'generous', 'greedy', 'brave', 'cowardly', 'honest', 'deceptive',
  'curious', 'reclusive', 'loyal', 'treacherous', 'kind', 'cruel',
  'ambitious', 'content', 'spiritual', 'pragmatic',
];

/**
 * Initialize the social graph from existing world NPCs
 */
export function initSocialGraph(world, rng) {
  const graph = {
    relationships: {},   // npcId -> { npcId: { type, strength, since } }
    memories: {},        // npcId -> [{ type, subject, day, details }]
    personalities: {},   // npcId -> [trait, trait]
    gossip: [],          // pending gossip items to spread
    reputationMap: {},   // regionId -> { criminal, hero, trader, etc. }
  };

  const allNPCs = [];
  for (const region of world.regions) {
    for (const s of (region.settlements || [])) {
      for (const npc of (s.npcs || [])) {
        allNPCs.push({ npc, settlementId: s.id, regionId: `${region.x}_${region.y}` });
      }
    }
  }

  // Assign personalities
  for (const { npc } of allNPCs) {
    const traits = [];
    const numTraits = 2;
    for (let i = 0; i < numTraits; i++) {
      traits.push(PERSONALITY_TRAITS[rng.int(0, PERSONALITY_TRAITS.length - 1)]);
    }
    graph.personalities[npc.id] = traits;
    graph.relationships[npc.id] = {};
    graph.memories[npc.id] = [];
  }

  // Generate relationships between NPCs in the same settlement
  const bySettlement = {};
  for (const { npc, settlementId } of allNPCs) {
    if (!bySettlement[settlementId]) bySettlement[settlementId] = [];
    bySettlement[settlementId].push(npc);
  }

  for (const [settlementId, npcs] of Object.entries(bySettlement)) {
    for (let i = 0; i < npcs.length; i++) {
      for (let j = i + 1; j < npcs.length; j++) {
        if (rng.float() > 0.55) continue; // not every NPC pair has a relationship
        const a = npcs[i];
        const b = npcs[j];
        const relType = pickRelationshipType(a, b, rng);
        const strength = rng.int(20, 80);
        setRelationship(graph, a.id, b.id, relType, strength);
      }
    }
  }

  return graph;
}

function pickRelationshipType(a, b, rng) {
  const roll = rng.float();
  // Same faction → more likely allied/friends
  if (a.faction && b.faction && a.faction === b.faction) {
    if (roll < 0.4) return 'friend';
    if (roll < 0.55) return 'ally';
    if (roll < 0.65) return 'rival';
    if (roll < 0.75) return 'family';
    return 'neutral';
  }
  // Different factions
  if (roll < 0.25) return 'neutral';
  if (roll < 0.40) return 'ally';
  if (roll < 0.55) return 'friend';
  if (roll < 0.68) return 'rival';
  if (roll < 0.78) return 'enemy';
  if (roll < 0.88) return 'family';
  return 'neutral';
}

export function setRelationship(graph, npcIdA, npcIdB, type, strength) {
  if (!graph.relationships[npcIdA]) graph.relationships[npcIdA] = {};
  if (!graph.relationships[npcIdB]) graph.relationships[npcIdB] = {};
  graph.relationships[npcIdA][npcIdB] = { type, strength: Math.max(0, Math.min(100, strength)), bidirectional: true };
  graph.relationships[npcIdB][npcIdA] = { type, strength: Math.max(0, Math.min(100, strength)), bidirectional: true };
}

export function getRelationship(graph, npcIdA, npcIdB) {
  return graph?.relationships?.[npcIdA]?.[npcIdB] || { type: 'neutral', strength: 0 };
}

export function getRelationshipsForNPC(graph, npcId) {
  return Object.entries(graph?.relationships?.[npcId] || {})
    .map(([otherId, rel]) => ({ otherId, ...rel }))
    .sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
}

/**
 * Record a player action in an NPC's memory
 */
export function recordPlayerMemory(graph, npcId, memoryType, details = {}, day = 0) {
  if (!graph.memories[npcId]) graph.memories[npcId] = [];
  const def = MEMORY_TYPES[memoryType];
  if (!def) return;
  graph.memories[npcId].push({
    type: memoryType,
    day,
    details,
    disposition: def.disposition,
    decayDays: def.decayDays,
    label: def.label,
  });
  // Spread to connected NPCs (gossip effect)
  const connections = graph.relationships[npcId] || {};
  for (const [otherId, rel] of Object.entries(connections)) {
    if (!RELATIONSHIP_TYPES[rel.type]?.canGossip) continue;
    if (rel.strength < 40) continue;
    // Friend/ally hears secondhand and it reduces in weight
    if (!graph.memories[otherId]) graph.memories[otherId] = [];
    const secondhand = {
      type: memoryType,
      day,
      details: { ...details, secondhand: true, sourceNpc: npcId },
      disposition: Math.round(def.disposition * 0.4),
      decayDays: Math.round(def.decayDays * 0.6),
      label: `${def.label} (heard from friend)`,
    };
    graph.memories[otherId].push(secondhand);
  }
}

/**
 * Calculate an NPC's effective disposition toward the player,
 * factoring in memories + base relationship
 */
export function calcNPCDispositionToPlayer(graph, npcId, player, world) {
  const memoryBias = getMemoryDispositionBias(graph, npcId, world?.day || 0);
  const personalityBias = getPersonalityBias(graph, npcId, player);
  return Math.max(-100, Math.min(100, memoryBias + personalityBias));
}

function getMemoryDispositionBias(graph, npcId, currentDay) {
  const memories = graph?.memories?.[npcId] || [];
  let total = 0;
  for (const mem of memories) {
    const age = currentDay - (mem.day || 0);
    const decay = Math.max(0, 1 - age / mem.decayDays);
    total += mem.disposition * decay;
  }
  return Math.round(total);
}

function getPersonalityBias(graph, npcId, player) {
  const traits = graph?.personalities?.[npcId] || [];
  let bias = 0;
  if (traits.includes('generous') && player?.reputation > 50) bias += 10;
  if (traits.includes('greedy') && player?.gold > 200) bias += 8;
  if (traits.includes('loyal') && player?.reputation > 30) bias += 5;
  if (traits.includes('kind')) bias += 5;
  if (traits.includes('suspicious') && player?.reputation < 0) bias -= 10;
  return bias;
}

/**
 * Get NPC memories about the player as readable strings
 */
export function getPlayerMemoriesForNPC(graph, npcId, world) {
  const currentDay = world?.day || 0;
  const memories = (graph?.memories?.[npcId] || [])
    .filter(m => {
      const age = currentDay - (m.day || 0);
      return age < m.decayDays;
    })
    .sort((a, b) => b.day - a.day)
    .slice(0, 5);
  return memories;
}

/**
 * Generate a gossip item for an NPC to share with the player
 */
export function generateGossip(graph, npcId, world, rng) {
  const npc = findNPCById(world, npcId);
  if (!npc) return null;
  const relations = getRelationshipsForNPC(graph, npcId);
  const template = GOSSIP_TEMPLATES[rng.int(0, GOSSIP_TEMPLATES.length - 1)];
  const region = getRegionForNPC(world, npcId);
  const place = region?.name || 'the countryside';
  const faction = npc.faction || world.factions?.[rng.int(0, (world.factions?.length || 1) - 1)]?.name || 'the guild';
  const namePair = getGossipNames(world, relations, rng);

  const text = template
    .replace(/{name2}/g, namePair[1] || 'someone')
    .replace(/{name}/g, namePair[0] || 'someone')
    .replace(/{place}/g, place)
    .replace(/{faction}/g, faction);

  return { text, npcId, regionId: region?.id };
}

function getGossipNames(world, relations, rng) {
  const names = [];
  for (const rel of relations.slice(0, 3)) {
    const other = findNPCById(world, rel.otherId);
    if (other?.name) names.push(other.name);
  }
  if (names.length < 2) {
    const allNames = ['Ser Edwick', 'Mara', 'Old Griggs', 'the blacksmith', 'the innkeeper', 'a traveler'];
    names.push(allNames[rng.int(0, allNames.length - 1)]);
    names.push(allNames[rng.int(0, allNames.length - 1)]);
  }
  return names;
}

/**
 * Get a relationship summary string for display
 */
export function getRelationshipSummary(graph, npcId) {
  const rels = getRelationshipsForNPC(graph, npcId);
  if (rels.length === 0) return 'No known connections.';
  const strong = rels.filter(r => r.strength >= 50);
  if (strong.length === 0) return 'Acquaintances only.';
  return strong.slice(0, 3).map(r => {
    const def = RELATIONSHIP_TYPES[r.type] || RELATIONSHIP_TYPES.neutral;
    return `${def.icon} ${def.label}`;
  }).join('  ');
}

/**
 * Simulate one day of social updates — decay memories, spread gossip
 */
export function tickSocialGraph(graph, world, rng) {
  const currentDay = world?.day || 0;
  // Clean up fully-decayed memories
  for (const npcId of Object.keys(graph.memories)) {
    graph.memories[npcId] = (graph.memories[npcId] || []).filter(m => {
      const age = currentDay - (m.day || 0);
      return age < m.decayDays;
    });
  }
}

// --- Helpers ---

function findNPCById(world, npcId) {
  for (const region of (world?.regions || [])) {
    for (const s of (region.settlements || [])) {
      const npc = (s.npcs || []).find(n => n.id === npcId);
      if (npc) return npc;
    }
  }
  return null;
}

function getRegionForNPC(world, npcId) {
  for (const region of (world?.regions || [])) {
    for (const s of (region.settlements || [])) {
      if ((s.npcs || []).some(n => n.id === npcId)) return region;
    }
  }
  return null;
}
