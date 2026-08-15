export function tickNPCs(settlement, world, rng) {
  const hour = world.hour;
  const updatedNPCs = settlement.npcs.map(npc => tickNPC(npc, hour, settlement, rng));
  return { ...settlement, npcs: updatedNPCs };
}

function tickNPC(npc, hour, settlement, rng) {
  const currentActivity = getScheduledActivity(npc, hour);
  const needs = updateNeeds(npc);
  const newGoal = selectGoal(npc, needs, currentActivity);
  const result = executeGoal(npc, newGoal, settlement, rng);

  return {
    ...npc,
    currentActivity,
    needs,
    currentGoal: newGoal,
    wealth: Math.max(0, npc.wealth + (result.goldChange || 0)),
    memory: addMemory(npc.memory, result.event),
  };
}

function getScheduledActivity(npc, hour) {
  if (hour >= 22 || hour < 6) return npc.schedule.night;
  if (hour < 12) return npc.schedule.morning;
  if (hour < 18) return npc.schedule.afternoon;
  return npc.schedule.evening;
}

function updateNeeds(npc) {
  const needs = npc.needs || { hunger: 0, rest: 0, safety: 0, social: 0 };
  return {
    hunger: Math.min(100, needs.hunger + 5),
    rest: Math.min(100, needs.rest + 3),
    safety: needs.safety,
    social: Math.min(100, needs.social + 2),
  };
}

function selectGoal(npc, needs, activity) {
  if (needs.hunger > 70) return 'eat';
  if (needs.rest > 80) return 'sleep';
  if (activity === 'working') return 'work';
  if (activity === 'at_tavern') return 'socialize';
  return 'idle';
}

function executeGoal(npc, goal, settlement, rng) {
  switch (goal) {
    case 'eat': return { goldChange: -rng.int(1, 3), event: null };
    case 'work': return { goldChange: rng.int(2, 8), event: null };
    case 'socialize': return { goldChange: -rng.int(1, 2), event: null };
    default: return { goldChange: 0, event: null };
  }
}

function addMemory(memory, event) {
  if (!event) return memory;
  const newMemory = [{ ...event, timestamp: Date.now() }, ...memory];
  return newMemory.slice(0, 20);
}

export function getDialogue(npc, player, context = 'greet') {
  const attitude = npc.attitude;
  const templates = DIALOGUE_TEMPLATES[context]?.[attitude] || DIALOGUE_TEMPLATES[context]?.neutral || ['...'];
  const line = templates[Math.floor(Math.random() * templates.length)];
  return line
    .replace('{player}', player.name)
    .replace('{npc}', npc.name.split(' ')[0])
    .replace('{occupation}', npc.occupation);
}

const DIALOGUE_TEMPLATES = {
  greet: {
    friendly: [
      'Ah, {player}! Good to see a friendly face. What brings you here?',
      'Welcome, traveler! I am {npc}, the local {occupation}.',
      'Come in, come in! The road has been dangerous lately.',
      'Sit, sit! You look like you\'ve had a long journey. Rest a spell.',
      'Good day to you, {player}. The weather\'s turned foul, hasn\'t it?',
      'Ah, a wanderer! We don\'t get many of your sort through here. Welcome!',
      'The inn\'s open, the fire is warm — what more could a traveler want?',
    ],
    neutral: [
      'Can I help you with something, stranger?',
      'Hmm. A traveler. What do you need?',
      'I am {npc}. State your business.',
      'Another face I don\'t recognize. What is it you want?',
      'If you\'re looking for work, check the notice board.',
      'Keep your hands where I can see them. We\'ve had thieves about.',
      'You buying or just browsing?',
    ],
    suspicious: [
      'I have nothing to say to strangers. Move along.',
      'Watch yourself around here. I know people.',
      'What are you staring at?',
      'I\'d sooner talk to my boots than a stranger like you.',
      'Don\'t linger. The guard watches everyone carefully these days.',
      'I\'ve nothing for you. Be on your way.',
    ],
    hostile: [
      'Get out of my sight.',
      'You\'ve got nerve showing your face here.',
      'Don\'t make me call the guard.',
    ],
  },
  rumor: {
    friendly: [
      "I shouldn't say this, but... {rumor}",
      "I heard from the caravan driver that {rumor}",
      "Between you and me... {rumor}",
      "My cousin in the north told me {rumor}",
      "Keep it quiet, but I overheard the guards saying {rumor}",
      "I've been hearing whispers that {rumor}",
    ],
    neutral: [
      "Word is that {rumor}",
      "People say {rumor}",
      "I don't know if it's true, but {rumor}",
      "There's talk in the tavern that {rumor}",
      "The merchants are saying {rumor}",
    ],
    suspicious: [
      "Why should I tell you anything?",
      "That's not your concern.",
      "Rumors are for fools and gossips. I'm neither.",
    ],
  },
  trade: {
    friendly: [
      "Good quality goods at fair prices, friend!",
      "I just got in a fresh shipment. Take a look.",
      "For you, {player}, I'll throw in a discount.",
    ],
    neutral: [
      "I buy and sell. What do you have?",
      "Browse at your leisure. No credit.",
      "Coin up front. No exceptions.",
    ],
    suspicious: [
      "Don't try to swindle me.",
      "I weigh every coin. Don't try anything funny.",
    ],
  },
};

const RUMOR_POOL = [
  "there are bandits making camp in the old ruins to the east — the guard won't go near the place.",
  "a merchant found a door in the deep caves that leads nowhere. And yet, something comes through it at night.",
  "the miller's son vanished three nights ago. Some say he gambled away his soul to a wandering mage.",
  "wolves in the northern wood have grown unusually bold. Old Maren says they're being driven by something worse.",
  "the price of iron has doubled since the miners refuse to go below the third level.",
  "there's a chest buried beneath the old elm near the crossroads. Everyone knows it — nobody dares dig it up.",
  "a travelling alchemist sold half the village fake healing draughts. When the truth came out, he had already gone.",
  "the lord's chamberlain was seen leaving after dark. His clerks say he hasn't returned.",
  "an ancient stone circle lit up at midnight last week. Mages from the capital are on their way to investigate.",
  "the graveyard on the hill has fresh footprints every morning, but nobody goes in. Nobody living, anyway.",
  "the eastern road is safer than it looks — the bandits were bribed to let certain caravans through.",
  "someone in town is an informant for the guild. Nobody knows who.",
  "a dragon was spotted circling the mountain peaks at dusk. Haven't seen that in twenty years.",
  "the well water has tasted strange for a week. The herbalist says it's alchemical runoff from somewhere uphill.",
  "three dungeons in the region have been sealed by order of the Mages' Council. Nobody is saying why.",
  "there's a bounty on a creature called the Ashwolf. The reward is more gold than most see in a lifetime.",
  "one of the guard captains is taking bribes from the merchants' guild. Ask the innkeeper — he'll tell you the rest.",
  "they say whoever clears the old dungeon beneath the hill will find a king's ransom left over from the last war.",
];

export function generateRumorText(npc, world, player) {
  const npcRumors = npc.rumors || [];
  if (npcRumors.length > 0) return npcRumors[0];
  const idx = Math.floor(Math.random() * RUMOR_POOL.length);
  const rumor = RUMOR_POOL[idx];
  return rumor.charAt(0).toUpperCase() + rumor.slice(1);
}

const OCCUPATION_POCKETS = {
  guard:      [{ id: 'guard_pay',   name: 'Guard Pay',       type: 'gold', goldAmount: 12, difficulty: 'hard'   },
               { id: 'iron_key',    name: 'Iron Key',         type: 'item', value: 20,  itemId: 'lockpick', difficulty: 'hard'   }],
  merchant:   [{ id: 'coin_purse',  name: 'Coin Purse',       type: 'gold', goldAmount: 22, difficulty: 'medium' },
               { id: 'trade_gem',   name: 'Trade Gem',        type: 'item', value: 45,  itemId: null,       difficulty: 'hard'   }],
  innkeeper:  [{ id: 'night_take',  name: 'Night Earnings',   type: 'gold', goldAmount: 18, difficulty: 'medium' },
               { id: 'room_key',    name: 'Room Key',         type: 'item', value: 5,   itemId: null,       difficulty: 'easy'   }],
  blacksmith: [{ id: 'smith_coins', name: 'Loose Coins',      type: 'gold', goldAmount: 10, difficulty: 'easy'   }],
  herbalist:  [{ id: 'herb_coins',  name: 'Coin Pouch',       type: 'gold', goldAmount: 8,  difficulty: 'easy'   },
               { id: 'herb_satchel',name: 'Herb Bundle',      type: 'item', value: 12,  itemId: 'healing_herb', difficulty: 'easy' }],
  mage:       [{ id: 'mage_coins',  name: 'Coin Pouch',       type: 'gold', goldAmount: 8,  difficulty: 'medium' },
               { id: 'spell_scroll',name: 'Spell Scroll',     type: 'item', value: 30,  itemId: 'mana_crystal', difficulty: 'hard' }],
  priest:     [{ id: 'holy_icon',   name: 'Holy Icon',        type: 'item', value: 25,  itemId: null,       difficulty: 'medium' }],
  noble:      [{ id: 'gold_purse',  name: 'Gold Purse',       type: 'gold', goldAmount: 40, difficulty: 'medium' },
               { id: 'noble_seal',  name: "Noble's Seal",     type: 'item', value: 60,  itemId: null,       difficulty: 'hard'   }],
  beggar:     [{ id: 'meager_coins',name: 'Meager Coins',     type: 'gold', goldAmount: 2,  difficulty: 'easy'   }],
  farmer:     [{ id: 'farm_savings',name: 'Savings Coin',     type: 'gold', goldAmount: 5,  difficulty: 'easy'   }],
  hunter:     [{ id: 'hunter_coins',name: 'Loose Coins',      type: 'gold', goldAmount: 7,  difficulty: 'easy'   },
               { id: 'hunting_snare','name': 'Hunting Snare', type: 'item', value: 8,   itemId: null,       difficulty: 'easy'   }],
  alchemist:  [{ id: 'alch_coins',  name: 'Coin Pouch',       type: 'gold', goldAmount: 12, difficulty: 'medium' },
               { id: 'mystery_vial',name: 'Mystery Vial',     type: 'item', value: 20,  itemId: 'healing_potion', difficulty: 'medium' }],
};

export function generateNPCPocket(npc) {
  return OCCUPATION_POCKETS[npc.occupation] || [{ id: 'loose_coins', name: 'Loose Coins', type: 'gold', goldAmount: 4, difficulty: 'easy' }];
}

export function pickpocketSuccessChance(pocketItem, pickpocketLevel, sneaking) {
  const BASE = { easy: 0.72, medium: 0.48, hard: 0.22 };
  const base = BASE[pocketItem.difficulty] || 0.40;
  const skillBonus = pickpocketLevel * 0.005;
  const sneakBonus = sneaking ? 0.18 : 0;
  return Math.min(0.92, base + skillBonus + sneakBonus);
}

export function npcAttitudeChange(npc, reputationScore) {
  if (reputationScore >= 50) return { ...npc, attitude: 'friendly' };
  if (reputationScore >= 0) return { ...npc, attitude: 'neutral' };
  if (reputationScore >= -30) return { ...npc, attitude: 'suspicious' };
  return { ...npc, attitude: 'hostile' };
}
