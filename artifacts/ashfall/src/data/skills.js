export const SKILL_CATEGORIES = {
  combat: 'Combat',
  defensive: 'Defensive',
  rogue: 'Rogue',
  social: 'Social',
  crafting: 'Crafting',
  magic: 'Magic',
  survival: 'Survival',
};

export const SKILLS = {
  oneHanded: { id: 'oneHanded', name: 'One-Handed', category: 'combat', attr: 'strength', desc: 'Swords, axes, maces.' },
  twoHanded: { id: 'twoHanded', name: 'Two-Handed', category: 'combat', attr: 'strength', desc: 'Greatswords, warhammers, battleaxes.' },
  shortBlade: { id: 'shortBlade', name: 'Short Blade', category: 'combat', attr: 'dexterity', desc: 'Daggers and short swords. Critical hit chance.' },
  archery: { id: 'archery', name: 'Archery', category: 'combat', attr: 'dexterity', desc: 'Bows and crossbows. Range attacks.' },
  polearms: { id: 'polearms', name: 'Polearms', category: 'combat', attr: 'strength', desc: 'Spears, halberds, glaives.' },
  unarmed: { id: 'unarmed', name: 'Unarmed', category: 'combat', attr: 'strength', desc: 'Fists and claws.' },
  heavyArmor: { id: 'heavyArmor', name: 'Heavy Armor', category: 'defensive', attr: 'endurance', desc: 'Plate and chain armor.' },
  lightArmor: { id: 'lightArmor', name: 'Light Armor', category: 'defensive', attr: 'dexterity', desc: 'Leather and studded armor.' },
  blocking: { id: 'blocking', name: 'Blocking', category: 'defensive', attr: 'endurance', desc: 'Shield and parry defense.' },
  dodge: { id: 'dodge', name: 'Dodge', category: 'defensive', attr: 'dexterity', desc: 'Evade attacks entirely.' },
  sneak: { id: 'sneak', name: 'Sneak', category: 'rogue', attr: 'dexterity', desc: 'Move unseen and unheard.' },
  lockpicking: { id: 'lockpicking', name: 'Lockpicking', category: 'rogue', attr: 'dexterity', desc: 'Open locked doors and chests.' },
  pickpocket: { id: 'pickpocket', name: 'Pickpocket', category: 'rogue', attr: 'dexterity', desc: 'Steal from others without notice.' },
  trapDetection: { id: 'trapDetection', name: 'Trap Detection', category: 'rogue', attr: 'intelligence', desc: 'Find and disarm traps.' },
  speech: { id: 'speech', name: 'Speech', category: 'social', attr: 'personality', desc: 'Persuade and negotiate.' },
  leadership: { id: 'leadership', name: 'Leadership', category: 'social', attr: 'personality', desc: 'Command followers and inspire allies.' },
  intimidation: { id: 'intimidation', name: 'Intimidation', category: 'social', attr: 'strength', desc: 'Coerce through fear.' },
  trading: { id: 'trading', name: 'Trading', category: 'social', attr: 'personality', desc: 'Buy low and sell high.' },
  blacksmithing: { id: 'blacksmithing', name: 'Blacksmithing', category: 'crafting', attr: 'strength', desc: 'Forge and repair weapons and armor.' },
  alchemy: { id: 'alchemy', name: 'Alchemy', category: 'crafting', attr: 'intelligence', desc: 'Brew potions and poisons.' },
  enchanting: { id: 'enchanting', name: 'Enchanting', category: 'crafting', attr: 'intelligence', desc: 'Imbue items with magical properties.' },
  cooking: { id: 'cooking', name: 'Cooking', category: 'crafting', attr: 'endurance', desc: 'Prepare food for buffs.' },
  destruction: { id: 'destruction', name: 'Destruction', category: 'magic', attr: 'intelligence', desc: 'Offensive magic: fire, ice, lightning.' },
  restoration: { id: 'restoration', name: 'Restoration', category: 'magic', attr: 'willpower', desc: 'Healing and defensive magic.' },
  conjuration: { id: 'conjuration', name: 'Conjuration', category: 'magic', attr: 'intelligence', desc: 'Summon creatures and weapons.' },
  alteration: { id: 'alteration', name: 'Alteration', category: 'magic', attr: 'willpower', desc: 'Manipulate the physical world.' },
  illusion: { id: 'illusion', name: 'Illusion', category: 'magic', attr: 'willpower', desc: 'Deceive and control minds.' },
  riding: { id: 'riding', name: 'Riding', category: 'survival', attr: 'dexterity', desc: 'Ride horses and mounts.' },
  survival: { id: 'survival', name: 'Survival', category: 'survival', attr: 'endurance', desc: 'Forage, track, and navigate the wild.' },
};

export function initSkills(bonuses = {}) {
  const skills = {};
  for (const id of Object.keys(SKILLS)) {
    skills[id] = { level: 5 + (bonuses[id] || 0), xp: 0, xpNext: 100 };
  }
  return skills;
}

export function getSkillLevel(skills, id) {
  return skills[id]?.level || 5;
}

export function gainSkillXP(skills, id, amount) {
  if (!skills[id]) return skills;
  const s = { ...skills[id] };
  s.xp += amount;
  while (s.xp >= s.xpNext) {
    s.xp -= s.xpNext;
    s.level += 1;
    s.xpNext = Math.floor(s.xpNext * 1.2);
  }
  return { ...skills, [id]: s };
}

export function getSkillModifier(skillLevel) {
  return Math.floor((skillLevel - 5) / 10);
}
