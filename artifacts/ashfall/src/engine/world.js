import { RNG } from './rng.js';
import { tickFactions } from './faction.js';
import { generateWorldEvent, applyWorldEventToEconomy, tickEconomy } from './economy.js';
import { tickNPCs } from './npc.js';
import { generateEmergentQuest } from './quest.js';

export const HOURS_PER_DAY = 24;
export const TICKS_PER_HOUR = 1;

export function advanceTime(world, hours = 1) {
  let { day, hour, tick } = world;
  hour += hours;
  while (hour >= HOURS_PER_DAY) {
    hour -= HOURS_PER_DAY;
    day += 1;
  }
  tick += hours;
  return { ...world, day, hour, tick };
}

export function worldTick(world, factions, player, rng) {
  const _rng = rng || new RNG((world.tick * 7).toString());
  let updatedWorld = advanceTime(world, 1);
  let newEvents = [];
  let newQuestOffers = [];

  const globalEvents = generateWorldEvent(updatedWorld, _rng);
  if (globalEvents.length > 0) {
    newEvents.push(...globalEvents);
    updatedWorld = {
      ...updatedWorld,
      history: [
        ...updatedWorld.history,
        ...globalEvents.map(e => `Day ${updatedWorld.day}: ${e.desc}`),
      ].slice(-100),
    };

    for (const evt of globalEvents) {
      const eq = generateEmergentQuest(evt, updatedWorld, _rng);
      if (eq) newQuestOffers.push(eq);
    }
  }

  let updatedRegions = updatedWorld.regions.map(region => {
    let r = { ...region };
    for (const evt of globalEvents) {
      if (r.economy) {
        r.economy = applyWorldEventToEconomy(r.economy, evt);
      }
    }
    r.settlements = r.settlements.map(s => {
      const ticked = tickEconomy(s, globalEvents, _rng);
      return tickNPCs(ticked, updatedWorld, _rng);
    });
    return r;
  });

  const updatedFactions = tickFactions(factions, updatedWorld, _rng);
  const season = getSeason(updatedWorld.day);
  updatedWorld = { ...updatedWorld, regions: updatedRegions, season };

  return {
    world: updatedWorld,
    factions: updatedFactions,
    newEvents,
    newQuestOffers,
  };
}

function getSeason(day) {
  const seasonDay = day % 120;
  if (seasonDay < 30) return 'spring';
  if (seasonDay < 60) return 'summer';
  if (seasonDay < 90) return 'autumn';
  return 'winter';
}

export function getTimeOfDay(hour) {
  if (hour >= 6 && hour < 12) return { name: 'Morning', color: '#d4a843', emoji: '🌅' };
  if (hour >= 12 && hour < 18) return { name: 'Afternoon', color: '#e8a84a', emoji: '☀️' };
  if (hour >= 18 && hour < 21) return { name: 'Evening', color: '#c8882a', emoji: '🌇' };
  if (hour >= 21 || hour < 6) return { name: 'Night', color: '#3060a0', emoji: '🌙' };
  return { name: 'Day', color: '#e8a84a', emoji: '☀️' };
}

export function formatTime(hour) {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:00 ${ampm}`;
}

export function formatDay(day) {
  return `Day ${day}`;
}

export function getWeatherForRegion(region, world) {
  const weatherList = ['Clear', 'Cloudy', 'Rainy', 'Foggy', 'Stormy'];
  const idx = (world.tick + region.x * 7 + region.y * 13) % weatherList.length;
  return weatherList[idx];
}

export function getWeatherEffect(weather) {
  switch (weather.toLowerCase()) {
    case 'rainy': return { travelPenalty: 1, combatPenalty: 0, description: 'Heavy rain slows travel.' };
    case 'stormy': return { travelPenalty: 2, combatPenalty: 1, description: 'Storm makes travel dangerous.' };
    case 'foggy': return { travelPenalty: 0, combatPenalty: 0, description: 'Fog reduces visibility.' };
    default: return { travelPenalty: 0, combatPenalty: 0, description: '' };
  }
}

export function generateWorldSeed() {
  const words = ['ash', 'ember', 'frost', 'doom', 'iron', 'raven', 'storm', 'blood', 'dusk', 'void'];
  const a = words[Math.floor(Math.random() * words.length)];
  const b = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(Math.random() * 9999);
  return `${a}_${b}_${n}`;
}

export const STAMINA_PER_TILE = 10;

export function calcStaminaCost(fromX, fromY, targetX, targetY) {
  const distance = Math.max(1, Math.abs(targetX - fromX) + Math.abs(targetY - fromY));
  return distance * STAMINA_PER_TILE;
}

export function travelToRegion(world, player, targetX, targetY) {
  const targetRegion = world.regions.find(r => r.x === targetX && r.y === targetY);
  if (!targetRegion) return { world, player, success: false, message: 'Unknown region.' };

  const fromX = player.location?.regionX ?? 0;
  const fromY = player.location?.regionY ?? 0;
  const distance = Math.max(1, Math.abs(targetX - fromX) + Math.abs(targetY - fromY));

  const updatedWorld = advanceTime(world, 2);
  const revealedRegions = updatedWorld.regions.map(r => {
    const dist = Math.abs(r.x - targetX) + Math.abs(r.y - targetY);
    if (dist <= 1) return { ...r, revealed: true };
    return r;
  });
  const visitedRegions = revealedRegions.map(r =>
    r.x === targetX && r.y === targetY ? { ...r, visited: true } : r
  );

  const updatedPlayer = {
    ...player,
    location: { regionX: targetX, regionY: targetY, type: 'travel', id: null },
    knownLocations: [...new Set([...player.knownLocations, `region_${targetX}_${targetY}`])],
  };

  const encounter = Math.random() < (targetRegion.dangerLevel * 0.08 * Math.min(distance, 3));

  return {
    world: { ...updatedWorld, regions: visitedRegions },
    player: updatedPlayer,
    success: true,
    message: `You travel to ${targetRegion.name}.`,
    encounter: encounter ? { type: 'random', region: targetRegion } : null,
  };
}
