import React, { useState } from 'react';
import useGameStore from '../store/gameStore.js';
import { getAdjacentRegions, TERRAIN_INFO } from '../engine/map.js';
import { getWeatherForRegion, calcStaminaCost } from '../engine/world.js';
import { getPOIsForRegion } from '../engine/poi.js';

const HEX_SIZE = 22;
const HEX_H = HEX_SIZE * 1.5;
const HEX_V = HEX_SIZE * Math.sqrt(3);
const VISIBLE_RADIUS = 6;
const GRID_DIM = VISIBLE_RADIUS * 2 + 1;

const SVG_W = (GRID_DIM - 1) * HEX_H + HEX_SIZE * 2 + 4;
const SVG_H = (GRID_DIM - 1) * HEX_V + HEX_V / 2 + HEX_SIZE * 2 + 4;

const TERRAIN_HEX = {
  plains:    { fill: '#6aaa36', stroke: '#4a7a1c', light: '#82c44e' },
  forest:    { fill: '#267426', stroke: '#145214', light: '#32902e' },
  mountains: { fill: '#9a9a88', stroke: '#686858', light: '#b0b09e' },
  desert:    { fill: '#d4a828', stroke: '#9c7818', light: '#e8bc3e' },
  swamp:     { fill: '#46785a', stroke: '#265438', light: '#5a9070' },
  coast:     { fill: '#4a96d0', stroke: '#2a68b0', light: '#60aadf' },
  ocean:     { fill: '#14629e', stroke: '#0a3e72', light: '#1e76b4' },
  lake:      { fill: '#1e78b8', stroke: '#0e4888', light: '#2e8ecc' },
};

const SETTLEMENT_DOTS = {
  city:    { r: 6, fill: '#f5d020', stroke: '#a8880c' },
  town:    { r: 5, fill: '#f0e060', stroke: '#8a7010' },
  village: { r: 4, fill: '#e8dc90', stroke: '#7a6c30' },
  fort:    { r: 4, fill: '#90b8e0', stroke: '#4070a0' },
  ruins:   { r: 4, fill: '#c07060', stroke: '#803030' },
};

function flatHexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

function hexCenter(gx, gy) {
  return {
    x: gx * HEX_H + HEX_SIZE + 2,
    y: gy * HEX_V + (gx % 2 === 1 ? HEX_V / 2 : 0) + HEX_SIZE + 2,
  };
}

function abbrevName(name) {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 7);
  if (words[0].length <= 5) return words[0];
  return words[0].slice(0, 6);
}

function lighten(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + 28);
  const g = Math.min(255, ((n >> 8)  & 0xff) + 28);
  const b = Math.min(255, (n & 0xff) + 28);
  return `rgb(${r},${g},${b})`;
}

export default function WorldMap() {
  const world = useGameStore(s => s.world);
  const player = useGameStore(s => s.player);
  const pois = useGameStore(s => s.pois);
  const travel = useGameStore(s => s.travel);
  const enterSettlement = useGameStore(s => s.enterSettlement);
  const setView = useGameStore(s => s.setView);
  const enterDungeon = useGameStore(s => s.enterDungeon);
  const [selectedRegion, setSelectedRegion] = useState(null);

  if (!world || !player) return null;

  const { regionX, regionY } = player.location;
  const currentRegion = world.regions.find(r => r.x === regionX && r.y === regionY);

  function handleRegionClick(region) {
    setSelectedRegion(prev => (prev?.id === region.id ? null : region));
  }

  function handleTravel(region) {
    if (region.x === regionX && region.y === regionY) return;
    if (region.terrain === 'ocean') return;
    travel(region.x, region.y);
    setSelectedRegion(region);
  }

  const adjacentDirs = getAdjacentRegions(world, regionX, regionY);
  const stamina = player.stamina?.current ?? 0;
  const info = currentRegion ? (TERRAIN_INFO[currentRegion.terrain] || TERRAIN_INFO.plains) : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '6px 12px', background: 'var(--ash-dark)', borderBottom: '1px solid var(--ash-border)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-title)', fontSize: '11px', color: 'var(--ash-amber)', letterSpacing: '0.12em' }}>WORLD MAP</span>
        {currentRegion && (
          <span style={{ fontSize: '12px', color: 'var(--ash-text-dim)' }}>
            {info?.emoji} {currentRegion.name}
            <span style={{ marginLeft: '6px', opacity: 0.55, fontSize: '10px' }}>
              {currentRegion.terrain} [{regionX},{regionY}]
            </span>
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#7ec850', fontFamily: 'var(--font-mono)' }}>
          ⚡{stamina}/{player.stamina?.max ?? 20}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--ash-text-dim)', fontFamily: 'var(--font-mono)' }}>
          Day {world.day} · {world.season}
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#040b10', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '8px 6px 2px', position: 'relative' }}>
          <svg
            width={SVG_W}
            height={SVG_H}
            style={{ display: 'block', filter: 'drop-shadow(0 3px 12px rgba(0,0,0,0.8))' }}
          >
            <defs>
              <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-soft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Compass labels */}
            <text x={SVG_W / 2} y={11} textAnchor="middle" fontSize="8" fill="rgba(200,180,120,0.45)" fontFamily="serif" letterSpacing="1">N</text>
            <text x={SVG_W / 2} y={SVG_H - 2} textAnchor="middle" fontSize="8" fill="rgba(200,180,120,0.45)" fontFamily="serif">S</text>
            <text x={5} y={SVG_H / 2 + 3} textAnchor="middle" fontSize="8" fill="rgba(200,180,120,0.45)" fontFamily="serif">W</text>
            <text x={SVG_W - 5} y={SVG_H / 2 + 3} textAnchor="middle" fontSize="8" fill="rgba(200,180,120,0.45)" fontFamily="serif">E</text>

            {Array.from({ length: GRID_DIM }, (_, gy) =>
              Array.from({ length: GRID_DIM }, (_, gx) => {
                const wx = regionX - VISIBLE_RADIUS + gx;
                const wy = regionY - VISIBLE_RADIUS + gy;
                const region = world.regions.find(r => r.x === wx && r.y === wy);
                const isPlayer = wx === regionX && wy === regionY;
                const isSelected = selectedRegion?.x === wx && selectedRegion?.y === wy;
                const { x: cx, y: cy } = hexCenter(gx, gy);

                if (!region) {
                  return (
                    <polygon key={`${gx}-${gy}`}
                      points={flatHexPoints(cx, cy, HEX_SIZE - 1)}
                      fill="#040b10" stroke="#08141c" strokeWidth="1" />
                  );
                }

                const isUnrevealed = !region.revealed;
                const terrain = region.terrain || 'plains';
                const col = TERRAIN_HEX[terrain] || TERRAIN_HEX.plains;
                const isOcean = terrain === 'ocean';
                const hasSettlement = region.settlements?.length > 0;
                const hasDungeon = region.dungeons?.length > 0;
                const fillColor = isSelected ? lighten(col.fill) : col.fill;
                const strokeColor = isSelected ? '#f0d060' : isPlayer ? '#f0b030' : col.stroke;
                const strokeW = isSelected || isPlayer ? 2.5 : 1;

                const regionPOIs = getPOIsForRegion(pois, wx, wy);
                const hasPOI = regionPOIs.length > 0;
                const discoveredPOI = regionPOIs.find(p => p.discovered);

                const mainSettlement = region.settlements?.[0];
                const sType = mainSettlement?.type || 'village';
                const sDot = SETTLEMENT_DOTS[sType] || SETTLEMENT_DOTS.village;

                const dangerTintAlpha = region.dangerLevel >= 4
                  ? (region.dangerLevel - 3) * 0.12
                  : 0;

                const tooltipText = isOcean
                  ? `${region.name} · Open Ocean`
                  : `${region.name} · ${terrain} · Danger ${region.dangerLevel}${hasSettlement ? ` · ${mainSettlement?.name} (${sType})` : ''}${hasDungeon ? ' · Dungeon' : ''}`;

                return (
                  <g key={`${gx}-${gy}`}
                    onClick={() => handleRegionClick(region)}
                    opacity={isUnrevealed ? 0.42 : 1}
                    style={{ cursor: isOcean ? 'default' : 'pointer' }}>
                    <title>{tooltipText}</title>

                    {/* Base hex */}
                    <polygon
                      points={flatHexPoints(cx, cy, HEX_SIZE - 1)}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeW}
                    />

                    {/* Inner highlight (top-left bevel) */}
                    <polygon
                      points={flatHexPoints(cx - 1, cy - 1.5, HEX_SIZE - 5)}
                      fill="rgba(255,255,255,0.07)"
                      stroke="none"
                      style={{ pointerEvents: 'none' }}
                    />

                    {/* Dark veil over unrevealed regions */}
                    {isUnrevealed && (
                      <polygon
                        points={flatHexPoints(cx, cy, HEX_SIZE - 1)}
                        fill="rgba(0,0,0,0.35)"
                        stroke="none"
                        style={{ pointerEvents: 'none' }}
                      />
                    )}

                    {/* Danger tint */}
                    {dangerTintAlpha > 0 && !isUnrevealed && (
                      <polygon
                        points={flatHexPoints(cx, cy, HEX_SIZE - 1)}
                        fill={`rgba(200,40,40,${dangerTintAlpha})`}
                        stroke="none"
                        style={{ pointerEvents: 'none' }}
                      />
                    )}

                    {/* Terrain icon — always visible, smaller for unrevealed */}
                    <text x={cx} y={region.visited && !isOcean ? cy + 1 : cy + 5}
                      textAnchor="middle"
                      fontSize={region.visited && !isOcean ? '11' : '14'}
                      opacity={isUnrevealed ? 0.5 : 1}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {TERRAIN_INFO[terrain]?.emoji || ''}
                    </text>

                    {/* Region name — shown for revealed regions */}
                    {region.revealed && !isOcean && (
                      <text x={cx} y={cy + 12}
                        textAnchor="middle"
                        fontSize="6"
                        fill={region.visited ? 'rgba(255,255,255,0.65)' : 'rgba(200,190,160,0.38)'}
                        fontFamily="serif"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {abbrevName(region.name)}
                      </text>
                    )}

                    {/* Settlement dot */}
                    {hasSettlement && (
                      <circle cx={cx + 9} cy={cy - 11}
                        r={sDot.r}
                        fill={sDot.fill}
                        stroke={sDot.stroke}
                        strokeWidth="1.5"
                        filter={isUnrevealed ? undefined : 'url(#glow-soft)'}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}

                    {/* Dungeon dot (no settlement) */}
                    {hasDungeon && !hasSettlement && (
                      <circle cx={cx + 9} cy={cy - 11} r="3.5"
                        fill="#c03030" stroke="#ff6060" strokeWidth="1.5"
                        style={{ pointerEvents: 'none' }}
                      />
                    )}

                    {/* POI marker — small diamond */}
                    {hasPOI && (
                      <g style={{ pointerEvents: 'none' }} opacity={discoveredPOI ? 1 : 0.55}>
                        <polygon
                          points={`${cx - 9},${cy + 11} ${cx - 6},${cy + 8} ${cx - 9},${cy + 5} ${cx - 12},${cy + 8}`}
                          fill={discoveredPOI ? (discoveredPOI.color || '#c08040') : '#706050'}
                          stroke={discoveredPOI ? 'rgba(255,220,120,0.7)' : '#504030'}
                          strokeWidth="0.8"
                        />
                      </g>
                    )}

                    {/* Player marker */}
                    {isPlayer && (
                      <>
                        <circle cx={cx} cy={cy} r="9"
                          fill="none" stroke="#f0b030" strokeWidth="1.5"
                          strokeDasharray="3 2" opacity="0.7"
                          style={{ pointerEvents: 'none' }}
                        />
                        <circle cx={cx} cy={cy} r="5"
                          fill="#f0b030" stroke="#ffffff" strokeWidth="2"
                          filter="url(#glow-amber)"
                          style={{ pointerEvents: 'none' }}
                        />
                      </>
                    )}
                  </g>
                );
              })
            )}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '10px', padding: '4px 10px 6px', justifyContent: 'center', flexWrap: 'wrap', background: '#040b10', borderBottom: '1px solid var(--ash-border)' }}>
          {[
            ['plains','#6aaa36','🌾'],
            ['forest','#267426','🌲'],
            ['mountains','#9a9a88','⛰️'],
            ['desert','#d4a828','🏜️'],
            ['swamp','#46785a','🌿'],
            ['coast','#4a96d0','🏖️'],
            ['ocean','#14629e','🌊'],
          ].map(([name, color, icon]) => (
            <span key={name} style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'9px', color:'var(--ash-text-dim)' }}>
              <span style={{ width:8,height:8,borderRadius:'50%',background:color,display:'inline-block',flexShrink:0 }}/>
              {icon} {name}
            </span>
          ))}
          <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'9px', color:'var(--ash-text-dim)' }}>
            <span style={{ width:8,height:8,borderRadius:'50%',background:'#f5d020',display:'inline-block',flexShrink:0 }}/>city
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'9px', color:'var(--ash-text-dim)' }}>
            <span style={{ width:8,height:8,borderRadius:'50%',background:'#f0e060',display:'inline-block',flexShrink:0 }}/>town/village
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'9px', color:'var(--ash-text-dim)' }}>
            <span style={{ width:8,height:8,borderRadius:'50%',background:'#c03030',display:'inline-block',flexShrink:0 }}/>dungeon
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'9px', color:'var(--ash-text-dim)' }}>
            <span style={{ display:'inline-block', width:7, height:7, background:'#c08040', transform:'rotate(45deg)', flexShrink:0 }}/>POI
          </span>
        </div>

        {selectedRegion && (
          <RegionPanel
            region={selectedRegion}
            isCurrentRegion={selectedRegion.x === regionX && selectedRegion.y === regionY}
            world={world}
            player={player}
            onTravel={() => handleTravel(selectedRegion)}
            pois={pois}
            onEnterSettlement={(id) => { enterSettlement(id); setView('town'); setSelectedRegion(null); }}
            onEnterDungeon={(d) => { enterDungeon(d); setSelectedRegion(null); }}
            onClose={() => setSelectedRegion(null)}
          />
        )}

        {!selectedRegion && currentRegion && (
          <div style={{ background: 'var(--ash-dark)', borderTop: '1px solid var(--ash-border)', flexShrink: 0 }}>

            {/* Enter settlements — always visible when in a region with one */}
            {currentRegion.settlements?.length > 0 && (
              <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--ash-border)' }}>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '10px', color: 'var(--ash-amber)', marginBottom: '6px', letterSpacing: '0.1em' }}>
                  📍 YOU ARE HERE · {currentRegion.name}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {currentRegion.settlements.map(s => (
                    <button
                      key={s.id}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                      onClick={() => { enterSettlement(s.id); setView('town'); }}
                    >
                      {s.type === 'city' ? '🏰' : s.type === 'fort' ? '🗼' : s.type === 'ruins' ? '💀' : '🏘️'} Enter {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dungeons in current region */}
            {currentRegion.dungeons?.length > 0 && (
              <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--ash-border)' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {currentRegion.dungeons.map(d => (
                    <button
                      key={d.id}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11px', borderColor: 'var(--ash-crimson)', color: 'var(--ash-crimson-light)', opacity: d.cleared ? 0.45 : 1 }}
                      disabled={d.cleared}
                      onClick={() => { enterDungeon(d); }}
                    >
                      ⚠️ Enter {d.name} {d.cleared ? '(Cleared)' : `· Danger ${d.dangerLevel}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick travel */}
            <div style={{ padding: '6px 12px 8px' }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '10px', color: 'var(--ash-amber)', marginBottom: '5px', letterSpacing: '0.1em' }}>
                QUICK TRAVEL
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {adjacentDirs.map(({ dir, region }) => {
                  const cost = calcStaminaCost(regionX, regionY, region.x, region.y);
                  const notEnough = stamina < cost;
                  const isOcean = region.terrain === 'ocean';
                  const tInfo = TERRAIN_INFO[region.terrain] || TERRAIN_INFO.plains;
                  return (
                    <button key={dir} className="btn btn-ghost btn-sm"
                      onClick={() => !isOcean && handleTravel(region)}
                      disabled={isOcean}
                      style={{ opacity: notEnough || isOcean ? 0.45 : 1, fontSize: '11px' }}>
                      {dir} {tInfo.emoji} {region.name}
                      {isOcean
                        ? <span style={{ color:'var(--ash-text-dim)', marginLeft:'4px', fontSize:'9px' }}>🌊</span>
                        : <span style={{ color: notEnough ? 'var(--ash-crimson-light)' : 'var(--ash-text-dim)', marginLeft:'4px', fontSize:'9px' }}>⚡{cost}</span>
                      }
                      {region.dangerLevel > 2 && !isOcean && <span style={{ color:'var(--ash-crimson-light)', marginLeft:'3px', fontSize:'9px' }}>⚠</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RegionPanel({ region, isCurrentRegion, world, player, pois, onTravel, onEnterSettlement, onEnterDungeon, onClose }) {
  const info = TERRAIN_INFO[region.terrain] || TERRAIN_INFO.plains;
  const weather = getWeatherForRegion(region, world);
  const regionPOIs = getPOIsForRegion(pois, region.x, region.y);
  const fromX = player.location?.regionX ?? 0;
  const fromY = player.location?.regionY ?? 0;
  const staminaCost = !isCurrentRegion ? calcStaminaCost(fromX, fromY, region.x, region.y) : 0;
  const notEnoughStamina = !isCurrentRegion && (player.stamina?.current ?? 0) < staminaCost;
  const isOcean = region.terrain === 'ocean';
  const dangerColor = ['','var(--uncommon)','var(--uncommon)','var(--ash-amber)','var(--legendary)','var(--ash-crimson-light)'][region.dangerLevel] || 'var(--ash-text)';

  return (
    <div style={{ background: 'var(--ash-charcoal)', borderTop: '1px solid var(--ash-border)', padding: '11px 12px', flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '7px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '15px', color: 'var(--ash-gold)' }}>
            {info.emoji} {region.name}
            <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--ash-text-dim)', fontFamily: 'var(--font-mono)' }}>
              [{region.x},{region.y}]
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ash-text-dim)', textTransform: 'capitalize', marginTop: '2px' }}>
            {region.terrain} · {weather}
            {!isOcean && (
              <span style={{ marginLeft: '8px', color: dangerColor }}>
                Danger {'★'.repeat(region.dangerLevel)}{'☆'.repeat(5 - region.dangerLevel)}
              </span>
            )}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '2px 6px' }}>✕</button>
      </div>

      {!isOcean && region.settlements?.length > 0 && (
        <div style={{ marginBottom: '7px' }}>
          <div style={{ fontSize: '10px', color: 'var(--ash-amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Settlements
          </div>
          {region.settlements.map(s => (
            <button key={s.id} className="btn btn-ghost btn-sm" style={{ marginRight: '5px', marginBottom: '4px' }}
              onClick={() => isCurrentRegion && onEnterSettlement(s.id)}
              disabled={!isCurrentRegion}>
              {s.type === 'city' ? '🏰' : s.type === 'fort' ? '🗼' : s.type === 'ruins' ? '💀' : '🏘️'} {s.name} ({s.type})
            </button>
          ))}
          {!isCurrentRegion && (
            <span style={{ fontSize: '10px', color: 'var(--ash-text-dim)', marginLeft: '4px' }}>Travel here to enter</span>
          )}
        </div>
      )}

      {!isOcean && region.dungeons?.length > 0 && (
        <div style={{ marginBottom: '7px' }}>
          <div style={{ fontSize: '10px', color: 'var(--ash-crimson-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Dungeons
          </div>
          {region.dungeons.map(d => (
            <button key={d.id} className="btn btn-ghost btn-sm"
              style={{ marginRight: '5px', marginBottom: '4px', borderColor: 'var(--ash-crimson)' }}
              onClick={() => isCurrentRegion && onEnterDungeon(d)}
              disabled={!isCurrentRegion || d.cleared}>
              ⚠️ {d.name} {d.cleared ? '(Cleared)' : `(Danger ${d.dangerLevel})`}
            </button>
          ))}
        </div>
      )}

      {!isOcean && regionPOIs.length > 0 && (
        <div style={{ marginBottom: '7px' }}>
          <div style={{ fontSize: '10px', color: '#c08040', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Points of Interest
          </div>
          {regionPOIs.map(poi => (
            <div key={poi.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '5px', opacity: poi.discovered ? 1 : 0.5 }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>{poi.discovered ? poi.icon : '◆'}</span>
              <div>
                <div style={{ fontSize: '12px', color: poi.discovered ? 'var(--ash-text)' : 'var(--ash-text-dim)' }}>
                  {poi.discovered ? poi.name : '???'}
                  {poi.discovered && (
                    <span style={{ marginLeft: '5px', fontSize: '10px', color: '#c08040' }}>
                      {poi.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                {poi.discovered && (
                  <div style={{ fontSize: '11px', color: 'var(--ash-text-dim)', fontStyle: 'italic', marginTop: '1px' }}>
                    {poi.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOcean && (
        <div style={{ fontSize: '12px', color: 'var(--ash-text-dim)', fontStyle: 'italic', padding: '4px 0' }}>
          🌊 Open ocean — impassable without a ship.
        </div>
      )}

      {!isCurrentRegion && !isOcean && (
        <button className="btn btn-primary btn-sm" onClick={onTravel}
          style={{ width: '100%', justifyContent: 'center', marginTop: '4px', opacity: notEnoughStamina ? 0.5 : 1 }}>
          Travel to {region.name}
          <span style={{ marginLeft: '8px', fontSize: '10px', color: notEnoughStamina ? 'var(--ash-crimson-light)' : 'rgba(255,255,255,0.7)' }}>
            ⚡{staminaCost}{notEnoughStamina ? ' (exhausted)' : ''}
          </span>
        </button>
      )}
    </div>
  );
}
