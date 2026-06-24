export const FACTION_TEMPLATES = {
  fighters_guild: {
    id: 'fighters_guild',
    name: "Fighters Guild",
    shortName: "Fighters",
    color: '#c8882a',
    description: 'A mercenary guild offering combat training and contracts.',
    type: 'guild',
    initialPower: 60,
    attitude: 'neutral',
    joinable: true,
    joinRequirements: { minSkill: { oneHanded: 10 } },
    ranks: ['Recruit','Warrior','Swordsman','Champion','Guildmaster'],
    questTypes: ['bounty','escort','cleanse_dungeon'],
    hatedFactions: ['assassin_brotherhood'],
    alliedFactions: [],
  },
  mages_guild: {
    id: 'mages_guild',
    name: "Mages Guild",
    shortName: "Mages",
    color: '#3060a0',
    description: 'Scholars of the arcane arts. Offer magical training and research.',
    type: 'guild',
    initialPower: 55,
    attitude: 'neutral',
    joinable: true,
    joinRequirements: { minSkill: { destruction: 10 } },
    ranks: ['Apprentice','Journeyman','Evoker','Conjurer','Magister'],
    questTypes: ['retrieve_artifact','research','protect_tower'],
    hatedFactions: ['necromancers'],
    alliedFactions: [],
  },
  thieves_guild: {
    id: 'thieves_guild',
    name: "Thieves Guild",
    shortName: "Thieves",
    color: '#4a8c4a',
    description: 'A shadow organization controlling theft and black markets.',
    type: 'guild',
    initialPower: 45,
    attitude: 'neutral',
    joinable: true,
    joinRequirements: { minSkill: { sneak: 10 } },
    ranks: ['Pickpocket','Cutpurse','Operative','Shadow','Shadowmaster'],
    questTypes: ['theft','heist','blackmail','smuggle'],
    hatedFactions: ['city_guard'],
    alliedFactions: [],
  },
  assassin_brotherhood: {
    id: 'assassin_brotherhood',
    name: "Brotherhood of Ash",
    shortName: "Brotherhood",
    color: '#8b1c1c',
    description: 'A secretive guild of killers. They worship death and sell murder.',
    type: 'guild',
    initialPower: 40,
    attitude: 'hostile',
    joinable: true,
    joinRequirements: { minSkill: { shortBlade: 20, sneak: 15 } },
    ranks: ['Initiate','Blade','Shade','Specter','Dread Master'],
    questTypes: ['assassination','sabotage','eliminate'],
    hatedFactions: ['fighters_guild','city_guard'],
    alliedFactions: [],
  },
  merchants_league: {
    id: 'merchants_league',
    name: "Merchant League",
    shortName: "League",
    color: '#d4a843',
    description: 'A powerful trade consortium controlling commerce in major cities.',
    type: 'guild',
    initialPower: 70,
    attitude: 'friendly',
    joinable: true,
    joinRequirements: { minSkill: { trading: 10 } },
    ranks: ['Associate','Trader','Factor','Director','Grandmaster'],
    questTypes: ['trade_route','deliver','invest','sabotage_rival'],
    hatedFactions: ['bandits'],
    alliedFactions: [],
  },
  city_guard: {
    id: 'city_guard',
    name: "City Guard",
    shortName: "Guard",
    color: '#5a7aaa',
    description: 'Law enforcement and military of the settled regions.',
    type: 'authority',
    initialPower: 75,
    attitude: 'friendly',
    joinable: false,
    joinRequirements: {},
    ranks: [],
    questTypes: ['patrol','arrest','defend'],
    hatedFactions: ['thieves_guild','assassin_brotherhood','bandits','necromancers'],
    alliedFactions: ['merchants_league'],
  },
  bandits: {
    id: 'bandits',
    name: "Bandit Clans",
    shortName: "Bandits",
    color: '#7a5218',
    description: 'Organized raider clans preying on travelers and trade routes.',
    type: 'hostile',
    initialPower: 50,
    attitude: 'hostile',
    joinable: false,
    joinRequirements: {},
    ranks: [],
    questTypes: ['raid','kidnap','extort'],
    hatedFactions: ['city_guard','merchants_league','fighters_guild'],
    alliedFactions: [],
  },
  necromancers: {
    id: 'necromancers',
    name: "Order of the Shroud",
    shortName: "Necromancers",
    color: '#7a3aaa',
    description: 'Cultists who raise the dead and seek forbidden knowledge.',
    type: 'hostile',
    initialPower: 35,
    attitude: 'hostile',
    joinable: false,
    joinRequirements: {},
    ranks: [],
    questTypes: ['summon_dead','corrupt_region','open_gate'],
    hatedFactions: ['mages_guild','city_guard'],
    alliedFactions: [],
  },
};

export function getAttitudeColor(attitude) {
  switch(attitude) {
    case 'friendly': return '#4a8c4a';
    case 'neutral': return '#c8882a';
    case 'hostile': return '#8b1c1c';
    case 'allied': return '#3060a0';
    default: return '#8a7a6a';
  }
}

export function getReputationLabel(rep) {
  if (rep >= 80) return { label: 'Champion', color: '#d4a843' };
  if (rep >= 50) return { label: 'Ally', color: '#4a8c4a' };
  if (rep >= 20) return { label: 'Friendly', color: '#60c060' };
  if (rep >= -20) return { label: 'Neutral', color: '#8a7a6a' };
  if (rep >= -50) return { label: 'Disliked', color: '#c8882a' };
  if (rep >= -80) return { label: 'Enemy', color: '#8b1c1c' };
  return { label: 'Nemesis', color: '#e03040' };
}
