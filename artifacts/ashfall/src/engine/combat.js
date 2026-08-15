import { RNG } from './rng.js';
import { gainSkillXP } from '../data/skills.js';
import { getTotalAttack, getTotalDefense, generateLoot } from './items.js';
import { MONSTER_TEMPLATES } from '../data/monsters.js';

export const DAMAGE_TYPES = ['slash', 'pierce', 'crush', 'magic', 'fire', 'ice', 'poison'];

export const BODY_PARTS = [
  { id: 'head', name: 'Head', hitChance: 0.15, damageMulti: 1.5, critMulti: 2.5, penaltyOnHit: 'stun' },
  { id: 'chest', name: 'Chest', hitChance: 0.35, damageMulti: 1.0, critMulti: 1.5, penaltyOnHit: null },
  { id: 'leftArm', name: 'Left Arm', hitChance: 0.15, damageMulti: 0.7, critMulti: 1.2, penaltyOnHit: 'disarm' },
  { id: 'rightArm', name: 'Right Arm', hitChance: 0.15, damageMulti: 0.7, critMulti: 1.2, penaltyOnHit: 'weakness' },
  { id: 'legs', name: 'Legs', hitChance: 0.20, damageMulti: 0.8, critMulti: 1.2, penaltyOnHit: 'slow' },
];

export const STATUS_EFFECTS = {
  poison:   { name: 'Poisoned', color: '#60a060', duration: 3, tickDamage: 4, desc: 'Taking poison damage each turn.' },
  stun:     { name: 'Stunned', color: '#c0a000', duration: 1, skipTurn: true, desc: 'Skips next turn.' },
  slow:     { name: 'Slowed', color: '#4080a0', duration: 2, speedPenalty: 3, desc: 'Reduced action speed.' },
  weakness: { name: 'Weakened', color: '#c06020', duration: 2, attackPenalty: 3, desc: 'Reduced attack damage.' },
  disarm:   { name: 'Disarmed', color: '#a04020', duration: 1, disarmed: true, desc: 'Weapon knocked aside.' },
  burning:  { name: 'Burning', color: '#e04020', duration: 2, tickDamage: 5, desc: 'On fire.' },
  frozen:   { name: 'Frozen', color: '#40a0e0', duration: 1, skipTurn: true, desc: 'Frozen solid.' },
  disease:  { name: 'Diseased', color: '#80a040', duration: 5, tickDamage: 2, statPenalty: 2, desc: 'Suffering from disease.' },
};

export function spawnEnemy(templateId, dangerLevel, rng) {
  const _rng = rng || new RNG(Math.random().toString());
  const template = MONSTER_TEMPLATES[templateId];
  if (!template) return null;

  const hpRange = template.hp;
  const atkRange = template.attack;
  const scaledHP = _rng.int(hpRange[0], hpRange[1]) + (dangerLevel - 1) * 5;
  const scaledAtk = _rng.int(atkRange[0], atkRange[1]) + (dangerLevel - 1) * 2;

  return {
    id: templateId + '_' + _rng.uid(),
    templateId,
    name: template.name,
    hp: scaledHP,
    maxHp: scaledHP,
    attack: scaledAtk,
    defense: template.defense + (dangerLevel - 1),
    speed: template.speed,
    abilities: [...template.abilities],
    statusEffects: [],
    xpReward: _rng.int(template.xpReward[0], template.xpReward[1]) + dangerLevel * 10,
    goldReward: _rng.int(template.goldReward[0], template.goldReward[1]) + dangerLevel * 3,
    lootTable: template.lootTable,
    dangerLevel,
    isBoss: template.isBoss || false,
  };
}

export function initCombat(player, enemyTemplateId, dangerLevel, seed) {
  const rng = new RNG(seed || Math.random().toString());
  const enemy = spawnEnemy(enemyTemplateId, dangerLevel, rng);

  return {
    active: true,
    round: 1,
    playerTurn: true,
    log: [`Combat begins! You face a ${enemy.name}!`],
    enemy,
    playerStatusEffects: [],
    fled: false,
    won: false,
    lost: false,
    seed,
    selectedBodyPart: 'chest',
    selectedAction: null,
    xpGained: 0,
    goldGained: 0,
    lootGained: [],
  };
}

export function resolveItemUse(combat, player, item) {
  const log = [];
  let updatedPlayer = { ...player };

  if (!item || item.type !== 'consumable') {
    log.push(`Nothing useful to use.`);
    return { combat: { ...combat, log: [...combat.log, ...log] }, player: updatedPlayer };
  }

  if (item.hpRestore) {
    const maxHP = getPlayerMaxHP(player);
    const restored = Math.min(item.hpRestore, maxHP - player.hp.current);
    updatedPlayer.hp = { ...updatedPlayer.hp, current: player.hp.current + restored };
    log.push(`You drink the ${item.name}, restoring ${restored} HP!`);
  } else if (item.mpRestore) {
    const maxMP = getPlayerMaxMP(player);
    const restored = Math.min(item.mpRestore, maxMP - player.mp.current);
    updatedPlayer.mp = { ...updatedPlayer.mp, current: player.mp.current + restored };
    log.push(`You drink the ${item.name}, restoring ${restored} MP!`);
  } else if (item.curesPoison) {
    log.push(`You drink the ${item.name}. The poison fades from your veins.`);
  } else {
    log.push(`You use the ${item.name}.`);
  }

  return {
    combat: { ...combat, log: [...combat.log, ...log], playerTurn: false },
    player: updatedPlayer,
    curedPoison: item.curesPoison || false,
  };
}

export function resolvePlayerAttack(combat, player, action, rng) {
  const _rng = rng || new RNG(Math.random().toString());
  const { enemy, selectedBodyPart } = combat;
  const part = BODY_PARTS.find(p => p.id === selectedBodyPart) || BODY_PARTS[1];
  const log = [];

  const equipped = player.equipment?.mainHand;
  const weaponSkill = equipped?.subtype || 'oneHanded';
  const skillLevel = player.skills[weaponSkill]?.level || player.skills.oneHanded?.level || 5;

  const playerAtk = getPlayerAttack(player) + skillLevel / 10;
  const hitRoll = _rng.next();
  const hitChance = Math.min(0.95, 0.6 + skillLevel * 0.005);

  if (hitRoll > hitChance) {
    log.push(`Your attack misses!`);
    return { ...combat, log: [...combat.log, ...log], playerTurn: false, _attackHit: false, _weaponSkill: weaponSkill };
  }

  const isCrit = _rng.next() < 0.05 + (player.skills.oneHanded?.level || 5) * 0.002;
  let dmg = Math.max(1, Math.floor(playerAtk * part.damageMulti) - Math.floor(enemy.defense / 2));
  if (isCrit) {
    dmg = Math.floor(dmg * part.critMulti);
    log.push(`Critical hit on ${part.name}! ${dmg} damage!`);
  } else {
    log.push(`You strike the ${part.name} for ${dmg} damage!`);
  }

  const newEnemy = { ...enemy, hp: Math.max(0, enemy.hp - dmg) };

  if (part.penaltyOnHit && _rng.bool(0.3)) {
    const status = STATUS_EFFECTS[part.penaltyOnHit];
    if (status) {
      log.push(`The ${enemy.name} is ${status.name.toLowerCase()}!`);
      const existingIdx = newEnemy.statusEffects?.findIndex(s => s.id === part.penaltyOnHit);
      const effects = [...(newEnemy.statusEffects || [])];
      if (existingIdx >= 0) effects[existingIdx] = { id: part.penaltyOnHit, ...status, remaining: status.duration };
      else effects.push({ id: part.penaltyOnHit, ...status, remaining: status.duration });
      newEnemy.statusEffects = effects;
    }
  }

  const won = newEnemy.hp <= 0;
  if (won) {
    log.push(`The ${enemy.name} has been defeated!`);
  }

  const updatedCombat = {
    ...combat,
    enemy: newEnemy,
    log: [...combat.log, ...log],
    playerTurn: false,
    won,
    active: !won,
    _attackHit: true,
    _weaponSkill: weaponSkill,
  };

  if (won) {
    return finalizeCombat(updatedCombat, player, _rng);
  }

  return updatedCombat;
}

function resolveEnemyAbilities(combat, player, updatedPlayer, newStatus, log, _rng) {
  const { enemy } = combat;
  const abilities = enemy.abilities || [];
  let result = { combat: { ...combat }, player: { ...updatedPlayer }, newStatus, extraLog: [] };

  for (const ability of abilities) {
    switch (ability) {
      case 'regenerate': {
        if (enemy.hp > 0 && enemy.hp < enemy.maxHp && _rng.bool(0.40)) {
          const regenAmt = Math.floor(enemy.maxHp * 0.07);
          result.combat = { ...result.combat, enemy: { ...result.combat.enemy, hp: Math.min(enemy.maxHp, enemy.hp + regenAmt) } };
          result.extraLog.push(`The ${enemy.name} regenerates ${regenAmt} HP!`);
        }
        break;
      }
      case 'disease': {
        const alreadyDiseased = newStatus.some(s => s.id === 'disease');
        if (!alreadyDiseased && _rng.bool(0.20)) {
          result.newStatus = [...result.newStatus, { id: 'disease', ...STATUS_EFFECTS.disease, remaining: STATUS_EFFECTS.disease.duration }];
          result.extraLog.push(`You have contracted a disease from the ${enemy.name}!`);
        }
        break;
      }
      case 'drain_life': {
        if (_rng.bool(0.25)) {
          const drainDmg = Math.floor(enemy.attack * 0.5) + _rng.int(1, 4);
          result.player = { ...result.player, hp: { ...result.player.hp, current: Math.max(0, result.player.hp.current - drainDmg) } };
          result.combat = { ...result.combat, enemy: { ...result.combat.enemy, hp: Math.min(enemy.maxHp, result.combat.enemy.hp + Math.floor(drainDmg * 0.5)) } };
          result.extraLog.push(`${enemy.name} drains ${drainDmg} life force from you! It grows stronger.`);
        }
        break;
      }
      case 'fireball': {
        if (_rng.bool(0.22)) {
          const fireDmg = Math.floor(enemy.attack * 0.9) + _rng.int(3, 8);
          result.player = { ...result.player, hp: { ...result.player.hp, current: Math.max(0, result.player.hp.current - fireDmg) } };
          const alreadyBurning = result.newStatus.some(s => s.id === 'burning');
          if (!alreadyBurning && _rng.bool(0.4)) {
            result.newStatus = [...result.newStatus, { id: 'burning', ...STATUS_EFFECTS.burning, remaining: STATUS_EFFECTS.burning.duration }];
          }
          result.extraLog.push(`${enemy.name} hurls a fireball! ${fireDmg} fire damage!`);
        }
        break;
      }
      case 'death_bolt': {
        if (_rng.bool(0.30)) {
          const boltDmg = Math.floor(enemy.attack * 1.2) + _rng.int(5, 15);
          result.player = { ...result.player, hp: { ...result.player.hp, current: Math.max(0, result.player.hp.current - boltDmg) } };
          result.extraLog.push(`The ${enemy.name} unleashes a Death Bolt! ${boltDmg} necrotic damage!`);
        }
        break;
      }
      case 'soul_rend': {
        if (_rng.bool(0.18)) {
          const mpDrain = _rng.int(8, 20);
          result.player = { ...result.player, mp: { ...result.player.mp, current: Math.max(0, result.player.mp.current - mpDrain) } };
          result.extraLog.push(`${enemy.name} rends your soul! -${mpDrain} MP!`);
        }
        break;
      }
      case 'raise_dead': {
        if (combat.round > 1 && _rng.bool(0.15)) {
          result.extraLog.push(`${enemy.name} chants dark words — the dead stir at its feet, lending it strength!`);
          result.combat = { ...result.combat, enemy: { ...result.combat.enemy, attack: result.combat.enemy.attack + 2 } };
        }
        break;
      }
      case 'berserk': {
        const hpPct = enemy.hp / enemy.maxHp;
        if (hpPct < 0.35 && !result.combat.enemy._berserkActive) {
          result.combat = { ...result.combat, enemy: { ...result.combat.enemy, attack: Math.floor(result.combat.enemy.attack * 1.4), _berserkActive: true } };
          result.extraLog.push(`${enemy.name} flies into a berserker rage! Its attacks grow fiercer!`);
        }
        break;
      }
      case 'taunt': {
        if (_rng.bool(0.20)) {
          result.extraLog.push(`${enemy.name} taunts you! "Is that all you've got?"`);
        }
        break;
      }
      case 'fire_breath': {
        if (_rng.bool(0.28)) {
          const breathDmg = Math.floor(enemy.attack * 1.5) + _rng.int(10, 20);
          result.player = { ...result.player, hp: { ...result.player.hp, current: Math.max(0, result.player.hp.current - breathDmg) } };
          const alreadyBurning2 = result.newStatus.some(s => s.id === 'burning');
          if (!alreadyBurning2) {
            result.newStatus = [...result.newStatus, { id: 'burning', ...STATUS_EFFECTS.burning, remaining: STATUS_EFFECTS.burning.duration }];
          }
          result.extraLog.push(`${enemy.name} breathes fire! ${breathDmg} damage — you are set ablaze!`);
        }
        break;
      }
      case 'frightful_presence': {
        if (combat.round === 1 && _rng.bool(0.5)) {
          result.newStatus = [...result.newStatus, { id: 'weakness', ...STATUS_EFFECTS.weakness, remaining: 2 }];
          result.extraLog.push(`${enemy.name}'s presence fills you with dread. You feel weakened!`);
        }
        break;
      }
      default:
        break;
    }
  }

  return result;
}

export function resolveEnemyTurn(combat, player, rng) {
  const _rng = rng || new RNG(Math.random().toString());
  const { enemy } = combat;
  const log = [];

  if (enemy.hp <= 0 || combat.won || combat.lost) return combat;

  const isStunned = enemy.statusEffects?.some(s => s.id === 'stun' && s.remaining > 0);

  let updatedPlayer = { ...player };
  let updatedCombat = { ...combat };
  let newStatus = [...(combat.playerStatusEffects || [])];

  for (let i = 0; i < newStatus.length; i++) {
    const s = newStatus[i];
    if (s.tickDamage) {
      const dmg = s.tickDamage;
      updatedPlayer.hp = { ...updatedPlayer.hp, current: Math.max(0, updatedPlayer.hp.current - dmg) };
      log.push(`${s.name} deals ${dmg} damage to you!`);
    }
    newStatus[i] = { ...s, remaining: s.remaining - 1 };
  }
  newStatus = newStatus.filter(s => s.remaining > 0);

  if (!isStunned) {
    const hitRoll = _rng.next();
    const playerDefense = getPlayerDefense(player);
    const dodgeChance = Math.min(0.35, (player.skills.dodge?.level || 5) * 0.005 + (player.skills.lightArmor?.level || 5) * 0.003);

    if (hitRoll < dodgeChance) {
      log.push(`You dodge the ${enemy.name}'s attack!`);
      updatedCombat = { ...updatedCombat, _dodged: true };
    } else {
      let dmg = Math.max(1, enemy.attack - playerDefense + _rng.int(-2, 2));
      const weakened = enemy.statusEffects?.find(s => s.id === 'weakness');
      if (weakened) dmg = Math.max(1, dmg - weakened.attackPenalty);

      updatedPlayer.hp = { ...updatedPlayer.hp, current: Math.max(0, updatedPlayer.hp.current - dmg) };
      log.push(`The ${enemy.name} attacks you for ${dmg} damage!`);

      if (enemy.abilities.includes('poison') && _rng.bool(0.25)) {
        const alreadyPoisoned = newStatus.some(s => s.id === 'poison');
        if (!alreadyPoisoned) {
          log.push(`You have been poisoned!`);
          newStatus.push({ id: 'poison', ...STATUS_EFFECTS.poison, remaining: STATUS_EFFECTS.poison.duration });
        }
      }
    }

    const abilityResult = resolveEnemyAbilities(
      { ...updatedCombat, enemy },
      player,
      updatedPlayer,
      newStatus,
      log,
      _rng
    );
    updatedPlayer = abilityResult.player;
    newStatus = abilityResult.newStatus;
    updatedCombat = { ...abilityResult.combat };
    for (const l of abilityResult.extraLog) log.push(l);
  } else {
    log.push(`The ${enemy.name} is stunned and cannot act!`);
    const enemyEffects = (enemy.statusEffects || [])
      .map(s => ({ ...s, remaining: s.remaining - 1 }))
      .filter(s => s.remaining > 0);
    updatedCombat = { ...updatedCombat, enemy: { ...enemy, statusEffects: enemyEffects } };
  }

  const lost = updatedPlayer.hp.current <= 0;
  if (lost) log.push(`You have been defeated!`);

  return {
    ...updatedCombat,
    playerStatusEffects: newStatus,
    log: [...updatedCombat.log, ...log],
    playerTurn: true,
    round: combat.round + 1,
    lost,
    active: !lost,
    _playerUpdate: updatedPlayer,
  };
}

export function attemptFlee(combat, player, rng) {
  const _rng = rng || new RNG(Math.random().toString());
  const { enemy } = combat;
  const fleeChance = Math.min(0.8, 0.4 + (player.skills.dodge?.level || 5) * 0.01 - enemy.speed * 0.02);
  const success = _rng.next() < fleeChance;
  const log = success
    ? ['You flee from combat!']
    : [`The ${enemy.name} blocks your escape!`];

  return {
    ...combat,
    fled: success,
    active: !success,
    playerTurn: !success,
    log: [...combat.log, ...log],
  };
}

function finalizeCombat(combat, player, rng) {
  const { enemy } = combat;
  const loot = generateLoot(enemy.dangerLevel, rng);
  return {
    ...combat,
    xpGained: enemy.xpReward,
    goldGained: enemy.goldReward + loot.gold,
    lootGained: loot.items,
  };
}

export function getPlayerAttack(player) {
  const base = 3 + Math.floor(player.attributes.strength / 2);
  const equipBonus = getTotalAttack(player.equipment || {});
  return base + equipBonus;
}

export function getPlayerDefense(player) {
  const base = Math.floor(player.attributes.endurance / 3);
  const equipBonus = getTotalDefense(player.equipment || {});
  return base + equipBonus;
}

export function getPlayerMaxHP(player) {
  return 30 + player.attributes.endurance * 3 + (player.level - 1) * 5;
}

export function getPlayerMaxMP(player) {
  return 10 + player.attributes.intelligence * 3 + (player.skills.destruction?.level || 5);
}

export function getPlayerMaxStamina(player) {
  return 20 + player.attributes.endurance * 2;
}

export function castSpell(combat, player, spellId, rng) {
  const _rng = rng || new RNG(Math.random().toString());
  const { enemy } = combat;
  const log = [];
  const mpCost = 10 + (combat.round * 2);
  const _spellCast = true;

  if (player.mp.current < mpCost) {
    log.push(`Not enough mana! (need ${mpCost} MP)`);
    return { ...combat, log: [...combat.log, ...log] };
  }

  const spellPower = (player.skills.destruction?.level || 5) + player.attributes.intelligence * 2;
  const dmg = Math.floor(spellPower * _rng.float(0.8, 1.3));
  const newEnemy = { ...enemy, hp: Math.max(0, enemy.hp - dmg) };
  log.push(`You cast a spell dealing ${dmg} magic damage!`);

  if (_rng.bool(0.25)) {
    const effects = [...(newEnemy.statusEffects || [])];
    const alreadyBurning = effects.some(s => s.id === 'burning');
    if (!alreadyBurning) {
      effects.push({ id: 'burning', ...STATUS_EFFECTS.burning, remaining: STATUS_EFFECTS.burning.duration });
      log.push(`The ${enemy.name} is set ablaze!`);
      newEnemy.statusEffects = effects;
    }
  }

  const won = newEnemy.hp <= 0;
  if (won) log.push(`The ${enemy.name} is destroyed!`);

  const updated = {
    ...combat,
    enemy: newEnemy,
    log: [...combat.log, ...log],
    playerTurn: false,
    won,
    active: !won,
    _mpUsed: mpCost,
    _spellCast: true,
  };

  if (won) return finalizeCombat(updated, player, _rng);
  return updated;
}
