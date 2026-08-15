import { RNG } from './rng.js';

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export const RARITY_WEIGHTS = [
  { value: 'common', weight: 55 },
  { value: 'uncommon', weight: 25 },
  { value: 'rare', weight: 12 },
  { value: 'epic', weight: 5 },
  { value: 'legendary', weight: 2.5 },
  { value: 'mythic', weight: 0.5 },
];

export const RARITY_MULTIPLIERS = {
  common: 1, uncommon: 1.5, rare: 2.2, epic: 3.5, legendary: 5, mythic: 8,
};

export const AFFIXES = {
  flaming:    { id: 'flaming',    name: 'Flaming',    type: 'weapon', stat: 'fireDmg', value: [3,8], desc: 'Burns enemies with fire.' },
  frozen:     { id: 'frozen',     name: 'Frozen',     type: 'weapon', stat: 'iceDmg',  value: [3,8], desc: 'Slows enemies with ice.' },
  poisonous:  { id: 'poisonous',  name: 'Poisonous',  type: 'weapon', stat: 'poison',  value: [2,5], desc: 'Poisons on hit.' },
  vampiric:   { id: 'vampiric',   name: 'Vampiric',   type: 'weapon', stat: 'lifesteal', value: [5,15], desc: 'Drain life on hit.' },
  swift:      { id: 'swift',      name: 'Swift',      type: 'weapon', stat: 'speed',   value: [2,4], desc: 'Increases attack speed.' },
  blessed:    { id: 'blessed',    name: 'Blessed',    type: 'armor',  stat: 'holyRes', value: [10,20], desc: 'Protection from dark magic.' },
  cursed:     { id: 'cursed',     name: 'Cursed',     type: 'any',    stat: 'curse',   value: [0,0], desc: 'Carries a dark curse.' },
  lucky:      { id: 'lucky',      name: 'Lucky',      type: 'any',    stat: 'luck',    value: [5,10], desc: 'Increases luck.' },
  ancient:    { id: 'ancient',    name: 'Ancient',    type: 'any',    stat: 'allStats', value: [2,4], desc: 'Forged in a forgotten age.' },
  sturdy:     { id: 'sturdy',     name: 'Sturdy',     type: 'armor',  stat: 'defense', value: [3,8], desc: 'Extra durability.' },
  sharpened:  { id: 'sharpened',  name: 'Sharpened',  type: 'weapon', stat: 'attack',  value: [3,7], desc: 'Finely honed edge.' },
  enchanted:  { id: 'enchanted',  name: 'Enchanted',  type: 'any',    stat: 'mpBonus', value: [10,25], desc: 'Resonates with magic.' },
  fortified:  { id: 'fortified',  name: 'Fortified',  type: 'armor',  stat: 'hpBonus', value: [10,25], desc: 'Reinforced beyond normal.' },
};

export const ITEM_TEMPLATES = {
  iron_sword:       { id: 'iron_sword',       name: 'Iron Sword',       slot: 'mainHand', type: 'weapon', subtype: 'oneHanded', attack: 6, value: 30,  weight: 4, desc: 'A standard iron sword.' },
  iron_shield:      { id: 'iron_shield',      name: 'Iron Shield',      slot: 'offHand',  type: 'armor',  subtype: 'shield',    defense: 5, value: 25, weight: 5, desc: 'A battered iron shield.' },
  leather_armor:    { id: 'leather_armor',    name: 'Leather Armor',    slot: 'chest',    type: 'armor',  subtype: 'lightArmor', defense: 4, value: 40, weight: 6, desc: 'Cured leather armor.' },
  iron_dagger:      { id: 'iron_dagger',      name: 'Iron Dagger',      slot: 'mainHand', type: 'weapon', subtype: 'shortBlade', attack: 4, value: 15, weight: 1, desc: 'A short, sharp dagger.' },
  hunting_bow:      { id: 'hunting_bow',      name: 'Hunting Bow',      slot: 'mainHand', type: 'weapon', subtype: 'archery',    attack: 5, value: 35, weight: 3, desc: 'A simple recurve bow.' },
  iron_arrows:      { id: 'iron_arrows',      name: 'Iron Arrows',      slot: null,       type: 'ammo',   subtype: 'arrows',     attack: 2, value: 5,  weight: 1, desc: 'A quiver of iron arrows.' },
  apprentice_staff: { id: 'apprentice_staff', name: 'Apprentice Staff', slot: 'mainHand', type: 'weapon', subtype: 'staff',      attack: 3, mpBonus: 10, value: 45, weight: 3, desc: 'A basic magic focus.' },
  mage_robes:       { id: 'mage_robes',       name: 'Mage Robes',       slot: 'chest',    type: 'armor',  subtype: 'lightArmor', defense: 1, mpBonus: 15, value: 50, weight: 2, desc: 'Enchanted robes.' },
  steel_sword:      { id: 'steel_sword',      name: 'Steel Sword',      slot: 'mainHand', type: 'weapon', subtype: 'oneHanded', attack: 10, value: 80,  weight: 4, desc: 'A well-crafted steel sword.' },
  steel_armor:      { id: 'steel_armor',      name: 'Steel Breastplate',slot: 'chest',    type: 'armor',  subtype: 'heavyArmor', defense: 10, value: 120, weight: 12, desc: 'Heavy steel protection.' },
  iron_helm:        { id: 'iron_helm',        name: 'Iron Helm',        slot: 'helmet',   type: 'armor',  subtype: 'heavyArmor', defense: 3, value: 30,  weight: 4, desc: 'A dented iron helmet.' },
  steel_helm:       { id: 'steel_helm',       name: 'Steel Helm',       slot: 'helmet',   type: 'armor',  subtype: 'heavyArmor', defense: 6, value: 60,  weight: 4, desc: 'A polished steel helmet.' },
  leather_boots:    { id: 'leather_boots',    name: 'Leather Boots',    slot: 'boots',    type: 'armor',  subtype: 'lightArmor', defense: 2, value: 20,  weight: 2, desc: 'Worn travelling boots.' },
  healing_potion:   { id: 'healing_potion',   name: 'Healing Potion',   slot: null,       type: 'consumable', subtype: 'potion', hpRestore: 30, value: 25, weight: 1, desc: 'Restores 30 HP.' },
  mana_potion:      { id: 'mana_potion',      name: 'Mana Potion',      slot: null,       type: 'consumable', subtype: 'potion', mpRestore: 25, value: 25, weight: 1, desc: 'Restores 25 MP.' },
  antidote:         { id: 'antidote',         name: 'Antidote',         slot: null,       type: 'consumable', subtype: 'potion', curesPoison: true, value: 20, weight: 1, desc: 'Cures poison.' },
  lockpick:         { id: 'lockpick',         name: 'Lockpick',         slot: null,       type: 'tool',   subtype: 'rogue',    value: 8, weight: 0, desc: 'A fine steel lockpick.' },
  healing_herb:     { id: 'healing_herb',     name: 'Healing Herb',     slot: null,       type: 'material', subtype: 'alchemy', hpRestore: 10, value: 5, weight: 0, desc: 'A medicinal herb.' },
  fine_clothes:     { id: 'fine_clothes',     name: 'Fine Clothes',     slot: 'chest',    type: 'armor',  subtype: 'clothing',  defense: 0, socialBonus: 5, value: 60, weight: 2, desc: 'Expensive but fragile clothing.' },
  wolf_pelt:        { id: 'wolf_pelt',        name: 'Wolf Pelt',        slot: null,       type: 'material', subtype: 'alchemy', value: 12, weight: 2, desc: 'A thick wolf pelt.' },
  rusted_sword:     { id: 'rusted_sword',     name: 'Rusted Sword',     slot: 'mainHand', type: 'weapon', subtype: 'oneHanded', attack: 3, value: 5,   weight: 4, desc: 'A heavily corroded sword.' },
  spell_scroll:     { id: 'spell_scroll',     name: 'Spell Scroll',     slot: null,       type: 'consumable', subtype: 'scroll', mpRestore: 40, value: 40, weight: 0, desc: 'A scroll containing a spell. Restores 40 MP.' },
  merchants_ledger: { id: 'merchants_ledger', name: "Merchant's Ledger",slot: null,       type: 'quest',  value: 0, weight: 0, desc: 'Trade records.' },
  wolf_tooth:       { id: 'wolf_tooth',       name: 'Wolf Tooth',       slot: null,       type: 'material', subtype: 'alchemy', value: 6,  weight: 0, desc: 'A sharp fang from a wolf.' },
  wolf_fang:        { id: 'wolf_fang',        name: 'Wolf Fang',        slot: null,       type: 'material', subtype: 'alchemy', value: 8,  weight: 0, desc: 'A large curved fang from a dire wolf.' },
  spider_silk:      { id: 'spider_silk',      name: 'Spider Silk',      slot: null,       type: 'material', subtype: 'alchemy', value: 14, weight: 0, desc: 'Incredibly strong silk from a giant spider.' },
  venom_sac:        { id: 'venom_sac',        name: 'Venom Sac',        slot: null,       type: 'material', subtype: 'alchemy', value: 18, weight: 0, desc: 'A sac of potent venom.' },
  bone_fragment:    { id: 'bone_fragment',    name: 'Bone Fragment',    slot: null,       type: 'material', subtype: 'alchemy', value: 3,  weight: 0, desc: 'Shards of old bone.' },
  rotten_flesh:     { id: 'rotten_flesh',     name: 'Rotten Flesh',     slot: null,       type: 'material', subtype: 'alchemy', value: 2,  weight: 1, desc: 'Reeking zombie flesh.' },
  orcish_charm:     { id: 'orcish_charm',     name: 'Orcish Charm',     slot: null,       type: 'material', value: 20, weight: 0, desc: 'A crude talisman carved with orcish runes.' },
  mana_crystal:     { id: 'mana_crystal',     name: 'Mana Crystal',     slot: null,       type: 'material', subtype: 'alchemy', value: 30, weight: 0, desc: 'A crystallized droplet of raw mana.' },
  troll_hide:       { id: 'troll_hide',       name: 'Troll Hide',       slot: null,       type: 'material', value: 35, weight: 3, desc: 'Thick, regenerating hide from a cave troll.' },
  troll_claw:       { id: 'troll_claw',       name: 'Troll Claw',       slot: null,       type: 'material', value: 25, weight: 1, desc: 'A massive curved claw from a cave troll.' },
  blood_vial:       { id: 'blood_vial',       name: 'Vampire Blood',    slot: null,       type: 'material', subtype: 'alchemy', value: 50, weight: 0, desc: 'Dark ichor from an undead vampire. Alchemists pay handsomely.' },
  earth_shard:      { id: 'earth_shard',      name: 'Earth Shard',      slot: null,       type: 'material', subtype: 'alchemy', value: 22, weight: 1, desc: 'A fragment of animated stone from an earth elemental.' },
  death_crystal:    { id: 'death_crystal',    name: 'Death Crystal',    slot: null,       type: 'material', subtype: 'alchemy', value: 60, weight: 0, desc: 'A dark crystal resonating with necrotic energy.' },
  greater_healing_potion: { id: 'greater_healing_potion', name: 'Greater Healing Potion', slot: null, type: 'consumable', subtype: 'potion', hpRestore: 70, value: 60, weight: 1, desc: 'Restores 70 HP.' },
  stamina_draught:  { id: 'stamina_draught',  name: 'Stamina Draught',  slot: null,       type: 'consumable', subtype: 'potion', staminaRestore: 30, value: 20, weight: 1, desc: 'Restores 30 Stamina.' },
  elixir_of_warding: { id: 'elixir_of_warding', name: 'Elixir of Warding', slot: null,  type: 'consumable', subtype: 'potion', tempDefense: 5, value: 45, weight: 1, desc: 'Grants +5 defense for the next combat round.' },

  // ── Two-Handed Weapons ─────────────────────────────────────────────────────
  greatsword:       { id: 'greatsword',       name: 'Greatsword',       slot: 'mainHand', type: 'weapon', subtype: 'twoHanded', attack: 16, value: 140, weight: 10, twoHanded: true, desc: 'A massive two-handed sword. Requires both hands.' },
  battleaxe:        { id: 'battleaxe',        name: 'Battleaxe',        slot: 'mainHand', type: 'weapon', subtype: 'twoHanded', attack: 14, value: 120, weight: 9, twoHanded: true, desc: 'A heavy double-headed axe for cleaving through armor.' },
  war_hammer:       { id: 'war_hammer',       name: 'War Hammer',       slot: 'mainHand', type: 'weapon', subtype: 'twoHanded', attack: 13, value: 110, weight: 11, twoHanded: true, desc: 'A crushing weapon that ignores much of an enemy\'s armor.' },
  spear:            { id: 'spear',            name: 'Spear',            slot: 'mainHand', type: 'weapon', subtype: 'polearm',   attack: 9,  value: 65,  weight: 5, desc: 'A long thrusting weapon with excellent reach.' },
  crossbow:         { id: 'crossbow',         name: 'Crossbow',         slot: 'mainHand', type: 'weapon', subtype: 'archery',   attack: 10, value: 90,  weight: 6, desc: 'A mechanical bow with tremendous stopping power.' },

  // ── Rings ──────────────────────────────────────────────────────────────────
  ring_of_protection: { id: 'ring_of_protection', name: 'Ring of Protection', slot: 'ring1', type: 'armor', subtype: 'ring', defense: 4, value: 80, weight: 0, desc: 'A silver ring engraved with ward-runes. +4 defense.' },
  ring_of_power:      { id: 'ring_of_power',      name: 'Ring of Power',      slot: 'ring1', type: 'weapon', subtype: 'ring', attack: 4, value: 80, weight: 0, desc: 'A bronze ring set with a bloodstone. +4 attack.' },
  ring_of_swiftness:  { id: 'ring_of_swiftness',  name: 'Ring of Swiftness',  slot: 'ring1', type: 'armor', subtype: 'ring', defense: 1, value: 70, weight: 0, desc: 'A thin golden ring. Makes the wearer lighter on their feet.' },
  ring_of_mending:    { id: 'ring_of_mending',    name: 'Ring of Mending',    slot: 'ring1', type: 'armor', subtype: 'ring', hpBonus: 15, value: 90, weight: 0, desc: 'A jade ring that slowly mends wounds. +15 max HP.' },
  mage_ring:          { id: 'mage_ring',           name: 'Mage Ring',          slot: 'ring1', type: 'armor', subtype: 'ring', mpBonus: 20, value: 95, weight: 0, desc: 'A ring pulsing with arcane energy. +20 max MP.' },

  // ── Amulets / Necklaces ────────────────────────────────────────────────────
  amulet_of_health:  { id: 'amulet_of_health',  name: 'Amulet of Health',  slot: 'necklace', type: 'armor', subtype: 'amulet', hpBonus: 25, value: 100, weight: 0, desc: 'A carved bone amulet. +25 max HP.' },
  amulet_of_mana:    { id: 'amulet_of_mana',    name: 'Amulet of Mana',    slot: 'necklace', type: 'armor', subtype: 'amulet', mpBonus: 30, value: 110, weight: 0, desc: 'A crystal vial worn around the neck. +30 max MP.' },
  iron_talisman:     { id: 'iron_talisman',     name: 'Iron Talisman',     slot: 'necklace', type: 'armor', subtype: 'amulet', defense: 3, value: 55, weight: 0, desc: 'A crude iron disc on a leather cord. +3 defense.' },
  scholar_pendant:   { id: 'scholar_pendant',   name: 'Scholar\'s Pendant', slot: 'necklace', type: 'armor', subtype: 'amulet', mpBonus: 15, hpBonus: 10, value: 85, weight: 0, desc: 'A gilded pendant worn by arcane scholars.' },

  // ── Food & Supplies ────────────────────────────────────────────────────────
  rations:           { id: 'rations',           name: 'Trail Rations',    slot: null, type: 'consumable', subtype: 'food', hpRestore: 8, staminaRestore: 15, value: 4, weight: 1, desc: 'Dried meat and hardtack. Restores 8 HP and 15 Stamina.' },
  feast_bread:       { id: 'feast_bread',       name: 'Feast Bread',      slot: null, type: 'consumable', subtype: 'food', hpRestore: 20, staminaRestore: 35, value: 12, weight: 1, desc: 'A hearty loaf of enriched bread. Restores 20 HP and 35 Stamina.' },
  cooked_meat:       { id: 'cooked_meat',       name: 'Cooked Meat',      slot: null, type: 'consumable', subtype: 'food', hpRestore: 15, staminaRestore: 25, value: 8, weight: 1, desc: 'A satisfying meal that restores 15 HP and 25 Stamina.' },

  // ── Advanced Consumables ───────────────────────────────────────────────────
  greater_mana_potion:   { id: 'greater_mana_potion',   name: 'Greater Mana Potion',   slot: null, type: 'consumable', subtype: 'potion', mpRestore: 60, value: 65, weight: 1, desc: 'Restores 60 MP.' },
  strength_elixir:       { id: 'strength_elixir',       name: 'Elixir of Strength',    slot: null, type: 'consumable', subtype: 'potion', tempAttack: 6, value: 55, weight: 1, desc: 'Grants +6 attack for the next combat.' },
  shadow_draught:        { id: 'shadow_draught',        name: 'Shadow Draught',        slot: null, type: 'consumable', subtype: 'potion', staminaRestore: 20, tempSneak: true, value: 40, weight: 1, desc: 'Quiets your footsteps. Temporarily improves sneak.' },
  smoke_bomb:            { id: 'smoke_bomb',            name: 'Smoke Bomb',            slot: null, type: 'tool',   subtype: 'rogue', value: 15, weight: 0, desc: 'Creates a smoke screen. Useful for fleeing combat.' },
  rope:                  { id: 'rope',                  name: 'Rope',                  slot: null, type: 'tool',   subtype: 'exploration', value: 6, weight: 2, desc: 'A length of strong rope. Useful for climbing.' },

  // ── Legendary Unique Items ─────────────────────────────────────────────────
  ashen_blade:        { id: 'ashen_blade',        name: 'Ashen Blade',        slot: 'mainHand', type: 'weapon', subtype: 'oneHanded', attack: 18, value: 800, weight: 3, rarity: 'legendary', affixes: [{ id: 'flaming', name: 'Flaming', rollValue: 8 }], desc: 'A blade forged from volcanic ash-iron. Leaves smoldering wounds.' },
  wraithcaller_staff: { id: 'wraithcaller_staff', name: 'Wraithcaller Staff', slot: 'mainHand', type: 'weapon', subtype: 'staff',     attack: 14, mpBonus: 45, value: 950, weight: 3, rarity: 'legendary', affixes: [{ id: 'enchanted', name: 'Enchanted', rollValue: 25 }], desc: 'An ancient staff that resonates with the dead. Massively boosts spell capacity.' },
  dragonbone_shield:  { id: 'dragonbone_shield',  name: 'Dragonbone Shield',  slot: 'offHand',  type: 'armor',  subtype: 'shield',    defense: 18, hpBonus: 20, value: 1100, weight: 6, rarity: 'legendary', affixes: [], desc: 'Carved from the bones of a slain dragon. Nearly indestructible.' },
  shadow_cloak:       { id: 'shadow_cloak',        name: 'Shadow Cloak',       slot: 'chest',    type: 'armor',  subtype: 'lightArmor', defense: 6, value: 750, weight: 1, rarity: 'epic', affixes: [{ id: 'lucky', name: 'Lucky', rollValue: 10 }], desc: 'A cloak woven from shadow-silk. The wearer seems to fade from sight.' },
};

export function generateItem(templateId, rarity, rng) {
  const _rng = rng || new RNG(Math.random().toString());
  const template = ITEM_TEMPLATES[templateId];
  if (!template) return null;

  const finalRarity = rarity || pickRarity(_rng);
  const mult = RARITY_MULTIPLIERS[finalRarity];

  const item = {
    ...template,
    uid: _rng.uid(),
    rarity: finalRarity,
    value: Math.floor(template.value * mult),
    affixes: [],
  };

  const affixCount = { common: 0, uncommon: 1, rare: 1, epic: 2, legendary: 2, mythic: 3 }[finalRarity];
  const validAffixes = Object.values(AFFIXES).filter(a => a.type === 'any' || a.type === template.type);

  const picked = _rng.shuffle(validAffixes).slice(0, affixCount);
  for (const affix of picked) {
    const val = _rng.int(affix.value[0], affix.value[1]);
    item.affixes.push({ ...affix, rollValue: val });
    if (affix.stat === 'attack') item.attack = (item.attack || 0) + val;
    if (affix.stat === 'defense') item.defense = (item.defense || 0) + val;
    if (affix.stat === 'hpBonus') item.hpBonus = (item.hpBonus || 0) + val;
    if (affix.stat === 'mpBonus') item.mpBonus = (item.mpBonus || 0) + val;
  }

  if (affixCount > 0 && picked.length > 0) {
    item.name = `${picked[0].name} ${template.name}`;
  }

  return item;
}

function pickRarity(rng) {
  const total = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);
  let roll = rng.next() * total;
  for (const r of RARITY_WEIGHTS) {
    roll -= r.weight;
    if (roll <= 0) return r.value;
  }
  return 'common';
}

export function generateLoot(dangerLevel, rng) {
  const _rng = rng || new RNG(Math.random().toString());
  const loot = [];
  const numItems = _rng.int(1, Math.min(3, dangerLevel));
  const weapons = ['iron_sword', 'iron_dagger', 'hunting_bow', 'steel_sword', 'rusted_sword'];
  const armors = ['leather_armor', 'iron_helm', 'steel_helm', 'steel_armor', 'leather_boots'];
  const consumables = ['healing_potion', 'mana_potion', 'antidote'];
  const materials = ['wolf_pelt', 'healing_herb', 'spell_scroll'];
  const allTemplates = [...weapons, ...armors, ...consumables, ...materials];

  for (let i = 0; i < numItems; i++) {
    const templateId = _rng.pick(allTemplates);
    const item = generateItem(templateId, null, _rng);
    if (item) loot.push(item);
  }

  const gold = _rng.int(dangerLevel * 5, dangerLevel * 20);
  return { items: loot, gold };
}

export function getEquipmentBonus(equipment, stat) {
  let total = 0;
  for (const item of Object.values(equipment)) {
    if (!item) continue;
    if (item[stat]) total += item[stat];
  }
  return total;
}

export function getTotalDefense(equipment) {
  return getEquipmentBonus(equipment, 'defense');
}

export function getTotalAttack(equipment) {
  return getEquipmentBonus(equipment, 'attack');
}
