export function tickEconomy(settlement, worldEvents, rng) {
  const eco = settlement.economy;
  let updatedEco = { ...eco };

  for (const [good, data] of Object.entries(eco)) {
    let { supply, demand, price } = data;

    const supplyChange = rng.int(-5, 5);
    const demandChange = rng.int(-3, 3);
    supply = Math.max(0, supply + supplyChange);
    demand = Math.max(5, demand + demandChange);

    for (const evt of worldEvents) {
      if (evt.type === 'bandit_raid') { supply = Math.max(0, supply - rng.int(5, 15)); }
      if (evt.type === 'good_harvest' && good === 'food') { supply += rng.int(10, 20); }
      if (evt.type === 'war') { demand += good === 'weapons' || good === 'armor' ? rng.int(10, 20) : 0; }
    }

    const ratio = supply > 0 ? demand / supply : 3;
    const targetPrice = Math.floor(data.price * ratio);
    price = Math.max(1, Math.round(price * 0.8 + targetPrice * 0.2));

    updatedEco[good] = { supply, demand, price };
  }

  return { ...settlement, economy: updatedEco };
}

export function getMarketPrices(settlement) {
  const eco = settlement.economy;
  return {
    healingPotion: Math.max(10, Math.floor((eco.potions?.price || 25) * 1.2)),
    manaPotion: Math.max(10, Math.floor((eco.potions?.price || 25) * 1.1)),
    antidote: Math.max(8, Math.floor((eco.potions?.price || 20) * 0.9)),
    food: Math.max(2, eco.food?.price || 8),
    ironSword: Math.max(20, eco.weapons?.price || 45),
    ironShield: Math.max(15, Math.floor((eco.weapons?.price || 40) * 0.8)),
    leatherArmor: Math.max(20, eco.armor?.price || 40),
    lockpick: 8,
  };
}

export function getBuyPrice(baseValue, settlement) {
  const eco = settlement?.economy;
  const modifier = eco ? 1 + (eco.weapons?.demand / (eco.weapons?.supply || 50) - 1) * 0.2 : 1;
  return Math.max(1, Math.floor(baseValue * Math.max(0.8, Math.min(1.5, modifier))));
}

export function getSellPrice(baseValue, playerTradingLevel) {
  const tradingBonus = Math.min(0.4, (playerTradingLevel - 5) * 0.01);
  return Math.max(1, Math.floor(baseValue * (0.4 + tradingBonus)));
}

export function canAfford(player, cost) {
  return player.gold >= cost;
}

export function generateWorldEvent(world, rng) {
  const events = [
    { type: 'bandit_raid', desc: 'Bandits raid a trade caravan!', probability: 0.15 },
    { type: 'good_harvest', desc: 'A bountiful harvest fills the granaries.', probability: 0.1 },
    { type: 'disease', desc: 'A sickness spreads through the region.', probability: 0.05 },
    { type: 'monster_attack', desc: 'Monsters attack an outlying settlement.', probability: 0.1 },
    { type: 'trade_boom', desc: 'Merchant caravans arrive, boosting trade.', probability: 0.1 },
    { type: 'drought', desc: 'A drought threatens food supplies.', probability: 0.05 },
    { type: 'discovery', desc: 'Explorers discover a new ruin.', probability: 0.08 },
    { type: 'festival', desc: 'A festival boosts morale across the region.', probability: 0.07 },
    { type: 'war', desc: 'Faction conflict erupts — demand for arms rises sharply.', probability: 0.04 },
    { type: 'plague', desc: 'A deadly plague sweeps the settlements. Healers are overwhelmed.', probability: 0.03 },
    { type: 'caravan_arrives', desc: 'A wealthy merchant caravan rolls in, bringing rare goods.', probability: 0.12 },
    { type: 'assassination', desc: 'A prominent noble is found dead. Tension grips the city.', probability: 0.04 },
    { type: 'earthquake', desc: 'A tremor collapses part of a mine, cutting ore supply.', probability: 0.03 },
    { type: 'magic_surge', desc: 'A wild surge of arcane energy floods the region. Mages are restless.', probability: 0.05 },
    { type: 'cold_snap', desc: 'An unexpected cold snap drives up demand for furs and firewood.', probability: 0.07 },
    { type: 'bandit_purge', desc: 'The guard rides out and scatters a bandit camp. Roads feel safer.', probability: 0.08 },
  ];

  const triggered = events.filter(e => rng.bool(e.probability));
  return triggered.map(e => ({ ...e, tick: world.tick, day: world.day }));
}

export function applyWorldEventToEconomy(eco, event) {
  switch (event.type) {
    case 'bandit_raid':
      return Object.fromEntries(
        Object.entries(eco).map(([k, v]) => [k, { ...v, supply: Math.max(0, v.supply - 10) }])
      );
    case 'good_harvest':
      return { ...eco, food: { ...eco.food, supply: (eco.food?.supply || 50) + 20 } };
    case 'trade_boom':
    case 'caravan_arrives':
      return Object.fromEntries(
        Object.entries(eco).map(([k, v]) => [k, { ...v, price: Math.max(1, Math.floor(v.price * 0.9)), supply: v.supply + 8 }])
      );
    case 'war':
      return {
        ...eco,
        weapons: { ...eco.weapons, demand: (eco.weapons?.demand || 30) + 25 },
        armor: { ...eco.armor, demand: (eco.armor?.demand || 30) + 20 },
      };
    case 'plague':
    case 'disease':
      return {
        ...eco,
        potions: { ...eco.potions, demand: (eco.potions?.demand || 20) + 30, supply: Math.max(0, (eco.potions?.supply || 30) - 15) },
      };
    case 'drought':
      return { ...eco, food: { ...eco.food, supply: Math.max(0, (eco.food?.supply || 50) - 20), demand: (eco.food?.demand || 20) + 15 } };
    case 'earthquake':
      return { ...eco, weapons: { ...eco.weapons, supply: Math.max(0, (eco.weapons?.supply || 30) - 15) } };
    case 'cold_snap':
      return { ...eco, food: { ...eco.food, demand: (eco.food?.demand || 20) + 10 } };
    case 'bandit_purge':
      return Object.fromEntries(
        Object.entries(eco).map(([k, v]) => [k, { ...v, supply: v.supply + 5 }])
      );
    default:
      return eco;
  }
}
