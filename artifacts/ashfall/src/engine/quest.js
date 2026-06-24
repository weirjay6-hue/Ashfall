import { RNG } from './rng.js';

const QUEST_VERBS = {
  bounty:          { verb: 'Hunt', prep: 'in', reward: 'gold' },
  escort:          { verb: 'Escort', prep: 'to', reward: 'gold + rep' },
  retrieve:        { verb: 'Retrieve', prep: 'from', reward: 'item + gold' },
  cleanse_dungeon: { verb: 'Clear', prep: 'of monsters', reward: 'gold + rep' },
  deliver:         { verb: 'Deliver', prep: 'to', reward: 'gold' },
  investigate:     { verb: 'Investigate', prep: 'the', reward: 'gold + info' },
  protect:         { verb: 'Protect', prep: 'from', reward: 'rep' },
  assassination:   { verb: 'Eliminate', prep: 'in', reward: 'gold' },
};

const QUEST_SOURCES = [
  'A desperate farmer', 'The local innkeeper', 'A wounded guard',
  'A hooded figure', 'The guild representative', 'A travelling merchant',
  'An anxious noble', 'The settlement elder', 'A worried mother',
];

const THREATS = [
  'wolves terrorizing the road', 'bandits raiding caravans', 'undead rising from graves',
  'goblins pillaging farms', 'a stolen artifact', 'a missing person',
  'strange magical disturbances', 'a corrupt official', 'a poisoned well',
  'monsters blocking the pass',
];

const LOCATIONS = [
  'the northern ruins', 'the old mine', 'the forest path',
  'the southern road', 'the caves below', 'the abandoned fort',
  'the ancient temple', 'the dark swamp', 'the mountain pass',
];

export function generateQuest(world, player, region, npc, rng) {
  const _rng = rng || new RNG(Math.random().toString());
  const type = selectQuestType(region, player, _rng);
  const template = QUEST_VERBS[type] || QUEST_VERBS.bounty;
  const source = _rng.pick(QUEST_SOURCES);
  const threat = _rng.pick(THREATS);
  const location = _rng.pick(LOCATIONS);

  const dangerLevel = Math.max(1, Math.min(5, region.dangerLevel + _rng.int(-1, 1)));
  const baseReward = (dangerLevel * 30) + _rng.int(-10, 20);
  const xpReward = dangerLevel * 50;

  const quest = {
    id: `quest_${_rng.uid()}`,
    type,
    title: generateQuestTitle(type, threat, location, _rng),
    description: generateQuestDescription(source, threat, location, type, _rng),
    giverName: npc?.name || source,
    giverFaction: npc?.faction || null,
    regionId: region.id,
    regionX: region.x,
    regionY: region.y,
    dangerLevel,
    reward: { gold: baseReward, xp: xpReward, reputation: dangerLevel * 5, item: null },
    status: 'active',
    progress: 0,
    progressMax: type === 'cleanse_dungeon' ? 5 : 1,
    objective: generateObjective(type, threat, location),
    failCondition: null,
    timeLimit: null,
    createdDay: world.day,
    completedDay: null,
  };

  if (_rng.bool(0.25)) {
    quest.reward.item = _rng.pick(['healing_potion', 'mana_potion', 'iron_sword', 'steel_sword']);
  }

  return quest;
}

function selectQuestType(region, player, rng) {
  const types = ['bounty', 'retrieve', 'deliver', 'investigate'];
  if (region.dungeons?.length > 0) types.push('cleanse_dungeon', 'retrieve');
  if (player.skills.sneak?.level >= 20) types.push('assassination');
  return rng.pick(types);
}

function generateQuestTitle(type, threat, location, rng) {
  const verb = QUEST_VERBS[type]?.verb || 'Handle';
  const subjects = {
    bounty: [`Hunt the ${threat.split(' ')[0]}`, `Clear the Road`, `Monster Bounty`],
    retrieve: [`The Lost Artifact`, `Recover the Stolen Goods`, `Missing Relics`],
    deliver: [`Urgent Delivery`, `The Package`, `Safe Passage`],
    investigate: [`Strange Happenings`, `The Disappearances`, `Uncover the Truth`],
    cleanse_dungeon: [`Clear the Dungeon`, `Purge the Darkness`, `Monsters in the Deep`],
    assassination: [`A Delicate Matter`, `The Target`, `Permanent Solution`],
  };
  return rng.pick(subjects[type] || subjects.bounty);
}

function generateQuestDescription(source, threat, location, type, rng) {
  const templates = {
    bounty: `${source} asks for help. "${threat.charAt(0).toUpperCase() + threat.slice(1)} have been causing trouble near ${location}. We'll pay well for anyone who can deal with them."`,
    retrieve: `${source} needs assistance. "We lost something important in ${location}. It's worth a great deal to us—please recover it."`,
    deliver: `${source} has a request. "I need this package delivered safely. The roads are dangerous and I cannot go myself. Time is of the essence."`,
    investigate: `${source} is troubled. "Something strange has been happening near ${location}. People are scared. We need someone to find out what's going on."`,
    cleanse_dungeon: `${source} has a mission. "The dungeon to ${location} has become overrun. We need someone brave—or foolish—enough to clear it out."`,
    assassination: `A hooded figure approaches. "There is a target. They have caused much harm. Make it quiet. We pay generously for discretion."`,
  };
  return templates[type] || templates.bounty;
}

function generateObjective(type, threat, location) {
  const objectives = {
    bounty: `Defeat the ${threat} near ${location}`,
    retrieve: `Find and return the item from ${location}`,
    deliver: `Deliver the package to the destination`,
    investigate: `Discover the cause of strange events in ${location}`,
    cleanse_dungeon: `Clear the dungeon of all monsters`,
    assassination: `Eliminate the target`,
  };
  return objectives[type] || `Complete the task`;
}

export function updateQuestProgress(quest, eventType, amount = 1) {
  if (quest.status !== 'active') return quest;

  const relevant = {
    bounty: ['enemy_killed'],
    cleanse_dungeon: ['enemy_killed', 'dungeon_cleared'],
    retrieve: ['item_found'],
    deliver: ['arrived_at_destination'],
    investigate: ['clue_found', 'npc_talked'],
    assassination: ['target_killed'],
  };

  const tracked = relevant[quest.type] || [];
  if (!tracked.includes(eventType)) return quest;

  const newProgress = Math.min(quest.progressMax, quest.progress + amount);
  const completed = newProgress >= quest.progressMax;

  return {
    ...quest,
    progress: newProgress,
    status: completed ? 'completed' : 'active',
  };
}

export function generateEmergentQuest(worldEvent, world, rng) {
  const _rng = rng || new RNG(Math.random().toString());
  const eventToQuest = {
    bandit_raid: { type: 'bounty', title: 'Bandit Menace', desc: 'Bandits have raided the caravan. Stop them before they strike again!' },
    monster_attack: { type: 'bounty', title: 'Monster Attack', desc: 'Monsters are attacking settlements. The guard needs help!' },
    disease: { type: 'retrieve', title: 'The Plague', desc: 'A disease spreads. Retrieve medicinal herbs from the wilds.' },
    discovery: { type: 'investigate', title: 'Strange Discovery', desc: 'An expedition found something unusual. Investigate.' },
  };

  const template = eventToQuest[worldEvent.type];
  if (!template) return null;

  return {
    id: `eq_${_rng.uid()}`,
    ...template,
    reward: { gold: 100, xp: 75, reputation: 15 },
    status: 'active',
    progress: 0,
    progressMax: 1,
    objective: template.desc,
    source: 'world_event',
    createdDay: world.day,
    completedDay: null,
  };
}
