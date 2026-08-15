import React, { useState } from 'react';
import useGameStore from '../store/gameStore.js';
import { getTimeOfDay, formatTime, formatDay, getWeatherForRegion } from '../engine/world.js';
import { getPlayerMaxHP, getPlayerMaxMP, getPlayerMaxStamina } from '../engine/combat.js';

const WEATHER_ICONS = { Clear: '☀️', Cloudy: '☁️', Rainy: '🌧️', Foggy: '🌫️', Stormy: '⛈️' };
const TERRAIN_LABELS = {
  forest: '🌲 Forest', plains: '🌾 Plains', mountains: '⛰️ Mountains',
  swamp: '🌿 Swamp', desert: '🏜️ Desert', coast: '🌊 Coast',
  tundra: '❄️ Tundra', ruins: '🏛️ Ruins',
};

const NAV_ITEMS = [
  { id: 'world',     label: 'Zone',  icon: '🗺️' },
  { id: 'town',      label: 'Town',  icon: '🏘️' },
  { id: 'wilderness',label: 'Wild',  icon: '🌿' },
  { id: 'character', label: 'Char',  icon: '⚔️' },
  { id: 'inventory', label: 'Inv',   icon: '🎒' },
  { id: 'journal',   label: 'Log',   icon: '📜' },
];

export default function HUD() {
  const player       = useGameStore(s => s.player);
  const world        = useGameStore(s => s.world);
  const currentView  = useGameStore(s => s.currentView);
  const setView      = useGameStore(s => s.setView);
  const sneaking     = useGameStore(s => s.sneaking);
  const toggleSneak  = useGameStore(s => s.toggleSneak);
  const bounties     = useGameStore(s => s.bounties);

  if (!player || !world) return null;

  const timeInfo     = getTimeOfDay(world.hour);
  const currentRegion = world.regions?.find(r =>
    r.x === player.location?.regionX && r.y === player.location?.regionY
  );
  const weather   = currentRegion ? getWeatherForRegion(currentRegion, world) : null;
  const maxHP     = getPlayerMaxHP(player);
  const maxMP     = getPlayerMaxMP(player);
  const maxStam   = getPlayerMaxStamina(player);
  const hpPct     = player.hp.current / maxHP;
  const mpPct     = player.mp.current / maxMP;
  const stamPct   = (player.stamina?.current ?? maxStam) / maxStam;
  const totalBounty = Object.values(bounties || {}).reduce((s, b) => s + b, 0);

  const terrain   = currentRegion?.terrain || 'plains';
  const terrainLabel = TERRAIN_LABELS[terrain] || terrain;

  function hpBarColor(pct) {
    if (pct > 0.6) return 'var(--ash-crimson-light)';
    if (pct > 0.3) return '#cc8822';
    return '#ff3855';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--ash-dark)', borderBottom: '1px solid var(--ash-border)', flexShrink: 0 }}>

      {/* ── Main info row ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', padding: '7px 12px', gap: '12px' }}>

        {/* Left: Player portrait + bars */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: 0 }}>
          {/* Portrait frame */}
          <div style={{
            width: '38px', height: '38px', flexShrink: 0,
            background: 'rgba(244,232,88,0.08)', border: '1px solid rgba(244,232,88,0.25)',
            borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace', fontSize: '20px', color: '#f4e858', fontWeight: 'bold',
            textShadow: '0 0 8px rgba(244,232,88,0.5)',
            position: 'relative',
          }}>
            @
            {sneaking && (
              <div style={{
                position: 'absolute', bottom: '-3px', right: '-3px', width: '10px', height: '10px',
                background: '#40c060', borderRadius: '50%', border: '1px solid #080808',
              }} />
            )}
          </div>

          {/* Name + bars */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--ash-gold)', fontWeight: '700', lineHeight: 1 }}>
                {player.name}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--ash-text-dim)', fontFamily: 'monospace' }}>Lv.{player.level}</span>
              <span style={{ fontSize: '9px', color: '#a09040', fontFamily: 'monospace' }}>{player.gold}g</span>
              {totalBounty > 0 && (
                <span title={`Wanted: ${totalBounty}g`} style={{
                  fontSize: '9px', color: 'var(--ash-crimson-light)', fontFamily: 'monospace',
                  background: 'rgba(139,28,28,0.2)', padding: '0 5px', borderRadius: '2px',
                  border: '1px solid rgba(139,28,28,0.4)',
                }}>⚠ {totalBounty}g</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <StatBar
                pct={hpPct} color={hpBarColor(hpPct)}
                label="HP" value={`${player.hp.current}/${maxHP}`}
              />
              <StatBar
                pct={mpPct} color="#5890d8"
                label="MP" value={`${player.mp.current}/${maxMP}`}
              />
              <StatBar
                pct={stamPct} color="#7ec850"
                label="⚡" value={`${Math.round((player.stamina?.current ?? maxStam))}/${maxStam}`}
                tiny
              />
            </div>
          </div>
        </div>

        {/* Right: World info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', color: timeInfo.color, fontFamily: 'monospace' }}>
              {timeInfo.emoji} {formatTime(world.hour)}
            </span>
            {weather && weather !== 'Clear' && (
              <span style={{ fontSize: '9px', color: '#505050' }}>{WEATHER_ICONS[weather]}</span>
            )}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--ash-text-dim)', fontFamily: 'monospace' }}>
            {formatDay(world.day)} · {world.season}
          </div>
          {currentRegion && (
            <div style={{ fontSize: '9px', color: '#404040', fontFamily: 'monospace' }}>
              {terrainLabel}
            </div>
          )}
          <button
            onClick={toggleSneak}
            title={sneaking ? 'Sneaking — click to stand up' : 'Hold breath and move quietly'}
            style={{
              marginTop: '2px', padding: '2px 8px', fontSize: '9px', fontFamily: 'monospace', letterSpacing: '0.06em',
              background: sneaking ? 'rgba(60,160,80,0.15)' : 'transparent',
              border: `1px solid ${sneaking ? 'rgba(60,160,80,0.5)' : 'var(--ash-border)'}`,
              color: sneaking ? '#80d890' : 'var(--ash-text-dim)',
              borderRadius: '3px', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'uppercase',
            }}>
            {sneaking ? '🤫 Sneaking' : '🚶 Sneak'}
          </button>
        </div>
      </div>

      {/* ── Navigation bar ── */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--ash-border)' }}>
        {NAV_ITEMS.map(item => {
          const active = currentView === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              flex: 1, padding: '7px 4px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
              background: active ? 'rgba(200,136,42,0.08)' : 'transparent',
              border: 'none',
              borderTop: active ? '2px solid var(--ash-amber)' : '2px solid transparent',
              color: active ? 'var(--ash-amber)' : 'var(--ash-text-dim)',
              cursor: 'pointer', fontSize: '9px', fontFamily: 'var(--font-title)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--ash-text)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--ash-text-dim)'; }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatBar({ pct, color, label, value, tiny }) {
  const clampedPct = Math.max(0, Math.min(100, pct * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '8px', color: 'var(--ash-text-dim)', fontFamily: 'monospace', width: '12px', textAlign: 'right', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{
        flex: 1, height: tiny ? '3px' : '5px',
        background: 'rgba(255,255,255,0.05)', borderRadius: '2px',
        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${clampedPct}%`, background: color,
          borderRadius: '2px', transition: 'width 0.3s ease',
          boxShadow: clampedPct < 30 ? `0 0 6px ${color}` : 'none',
        }} />
      </div>
      {!tiny && (
        <span style={{ fontSize: '8px', color, fontFamily: 'monospace', flexShrink: 0, minWidth: '50px', textAlign: 'right' }}>
          {value}
        </span>
      )}
    </div>
  );
}
