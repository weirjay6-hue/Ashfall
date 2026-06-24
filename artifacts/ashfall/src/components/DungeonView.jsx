import React, { useEffect, useRef, useCallback } from 'react';
import useGameStore from '../store/gameStore.js';
import { TILE_TYPES, MONSTER_GLYPHS, DUNGEON_TYPES } from '../engine/dungeon.js';
import { getPlayerMaxHP, getPlayerMaxMP } from '../engine/combat.js';

const CELL = 22;
const VIS_X = 21;
const VIS_Y = 19;

const TILE_VIS = {
  [TILE_TYPES.WALL]:        { glyph: '#', liveColor: '#686878', memColor: '#252535', bg: '#0c0c12' },
  [TILE_TYPES.FLOOR]:       { glyph: '·', liveColor: '#353545', memColor: '#16162a', bg: '#101018' },
  [TILE_TYPES.DOOR]:        { glyph: '+', liveColor: '#c09040', memColor: '#503818', bg: '#1a1208' },
  [TILE_TYPES.STAIRS_DOWN]: { glyph: '>', liveColor: '#50d050', memColor: '#1e4820', bg: '#0a1408' },
  [TILE_TYPES.STAIRS_UP]:   { glyph: '<', liveColor: '#50a8d8', memColor: '#163848', bg: '#0a1018' },
  [TILE_TYPES.CHEST]:       { glyph: '$', liveColor: '#d4b840', memColor: '#484010', bg: '#120e00' },
  [TILE_TYPES.TRAP]:        { glyph: '^', liveColor: '#c03838', memColor: '#3c1818', bg: '#120808' },
  [TILE_TYPES.ENTRANCE]:    { glyph: '⊕', liveColor: '#50d050', memColor: '#1e4820', bg: '#0a1408' },
};

function lerpColor(hex1, hex2, t) {
  const r1 = parseInt(hex1.slice(1,3),16), g1 = parseInt(hex1.slice(3,5),16), b1 = parseInt(hex1.slice(5,7),16);
  const r2 = parseInt(hex2.slice(1,3),16), g2 = parseInt(hex2.slice(3,5),16), b2 = parseInt(hex2.slice(5,7),16);
  const r = Math.round(r1 + (r2-r1)*t), g = Math.round(g1 + (g2-g1)*t), b = Math.round(b1 + (b2-b1)*t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function hpBarColor(pct) {
  if (pct > 0.6) return '#44aa44';
  if (pct > 0.3) return '#cc8822';
  return '#aa2222';
}

function DungeonMinimap({ floor, dungeonType }) {
  const canvasRef = useRef(null);
  const accentHex = (dungeonType?.accent || '#606070').replace('#','');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height, grid, fogOfWar, seen, playerPos, enemies } = floor;
    const CW = canvas.width, CH = canvas.height;
    const sx = CW / width, sy = CH / height;

    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, CW, CH);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const fogged  = fogOfWar?.[y]?.[x] !== false;
        const wasSeen = seen?.[y]?.[x] === true;
        if (!wasSeen && fogged) continue;
        const t = grid[y][x];
        let color;
        if (fogged) {
          color = t === TILE_TYPES.WALL ? '#1a1a2c' : '#111122';
        } else {
          if (t === TILE_TYPES.WALL)        color = '#484858';
          else if (t === TILE_TYPES.FLOOR)  color = '#222232';
          else if (t === TILE_TYPES.CHEST)  color = '#806010';
          else if (t === TILE_TYPES.STAIRS_DOWN || t === TILE_TYPES.STAIRS_UP) color = '#206028';
          else if (t === TILE_TYPES.DOOR)   color = '#604820';
          else color = '#222232';
        }
        ctx.fillStyle = color;
        const px = Math.floor(x * sx), py = Math.floor(y * sy);
        const pw = Math.max(1, Math.ceil(sx)), ph = Math.max(1, Math.ceil(sy));
        ctx.fillRect(px, py, pw, ph);
      }
    }
    enemies.filter(e => e.alive).forEach(e => {
      if (fogOfWar?.[e.y]?.[e.x] !== false) return;
      ctx.fillStyle = e.isBoss ? '#ff3855' : '#cc3030';
      ctx.fillRect(Math.floor(e.x*sx), Math.floor(e.y*sy), Math.max(2,Math.ceil(sx)), Math.max(2,Math.ceil(sy)));
    });
    ctx.fillStyle = '#f0e050';
    const ppx = Math.floor(playerPos.x * sx), ppy = Math.floor(playerPos.y * sy);
    ctx.fillRect(ppx-1, ppy-1, 3, 3);
  }, [floor]);

  return (
    <canvas ref={canvasRef} width={160} height={96}
      style={{ display: 'block', width: '100%', border: '1px solid #1a1a28', borderRadius: '3px', imageRendering: 'pixelated' }}
    />
  );
}

export default function DungeonView() {
  const dungeon           = useGameStore(s => s.dungeon);
  const player            = useGameStore(s => s.player);
  const moveDungeonPlayer = useGameStore(s => s.moveDungeonPlayer);
  const dungeonWait       = useGameStore(s => s.dungeonWait);
  const openDungeonChest  = useGameStore(s => s.openDungeonChest);
  const dismissChest      = useGameStore(s => s.dismissChest);
  const pendingChest      = useGameStore(s => s.pendingChest);
  const setView           = useGameStore(s => s.setView);
  const gameLog           = useGameStore(s => s.gameLog);

  const move = useCallback((dx, dy) => moveDungeonPlayer(dx, dy), [moveDungeonPlayer]);
  const wait = useCallback(() => dungeonWait(), [dungeonWait]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const MOVES = {
        ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
        w: [0,-1], s: [0,1], a: [-1,0], d: [1,0],
        k: [0,-1], j: [0,1], h: [-1,0], l: [1,0],
        q: [-1,-1], e: [1,-1], z: [-1,1], c: [1,1],
        y: [-1,-1], u: [1,-1], b: [-1,1], n: [1,1],
        '8': [0,-1], '2': [0,1], '4': [-1,0], '6': [1,0],
        '7': [-1,-1], '9': [1,-1], '1': [-1,1], '3': [1,1],
      };
      const WAIT_KEYS = ['.', 'r', '5'];
      const mv = MOVES[e.key];
      if (mv) { e.preventDefault(); move(mv[0], mv[1]); }
      else if (WAIT_KEYS.includes(e.key)) { e.preventDefault(); wait(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, wait]);

  if (!dungeon || !player) return null;

  const dungeonTypeDef = DUNGEON_TYPES[dungeon.type] || DUNGEON_TYPES.cave;
  const accentColor    = dungeonTypeDef.accent || '#9858c8';
  const floor          = dungeon.floors[dungeon.currentFloor];
  const { playerPos, grid, fogOfWar, seen, enemies, chests, traps } = floor;
  const { x: px, y: py } = playerPos;

  const halfX  = Math.floor(VIS_X / 2);
  const halfY  = Math.floor(VIS_Y / 2);
  const startX = Math.max(0, Math.min(px - halfX, Math.max(0, floor.width  - VIS_X)));
  const startY = Math.max(0, Math.min(py - halfY, Math.max(0, floor.height - VIS_Y)));
  const VIEW_RADIUS = Math.sqrt(halfX*halfX + halfY*halfY);

  const cells = [];
  for (let vy = 0; vy < VIS_Y; vy++) {
    for (let vx = 0; vx < VIS_X; vx++) {
      const rx = startX + vx;
      const ry = startY + vy;
      const inBounds = rx >= 0 && ry >= 0 && rx < floor.width && ry < floor.height;
      const fogged   = !inBounds || (fogOfWar?.[ry]?.[rx] !== false);
      const wasSeen  = inBounds  && (seen?.[ry]?.[rx] === true);
      const isPlayer = inBounds  && rx === px && ry === py;
      const tileType = inBounds  ? grid[ry][rx] : TILE_TYPES.WALL;
      const tv       = TILE_VIS[tileType] || TILE_VIS[TILE_TYPES.WALL];
      const dist     = Math.sqrt((rx - px) ** 2 + (ry - py) ** 2);
      const lightFactor = Math.max(0, 1 - dist / (VIEW_RADIUS * 0.9));

      const enemy = !fogged && enemies.find(e => e.alive && e.x === rx && e.y === ry);
      const chest = !fogged && chests.find(c => !c.opened && c.x === rx && c.y === ry);

      let glyph = '', color = '#000', bg = '#080810', bold = false, outline = 'none';

      if (!inBounds || (fogged && !wasSeen)) {
        bg = '#07070f';
      } else if (fogged && wasSeen) {
        glyph = tv.glyph;
        color = tv.memColor;
        bg    = '#0b0b16';
      } else {
        bg    = lerpColor(tv.bg, '#080810', 1 - lightFactor * 0.6);
        glyph = tv.glyph;
        color = lerpColor(tv.liveColor, tv.memColor, 1 - lightFactor);

        if (isPlayer) {
          glyph = '@'; color = '#f4e858'; bg = '#151400'; bold = true;
          outline = '1px solid rgba(244,232,88,0.5)';
        } else if (enemy) {
          const md = MONSTER_GLYPHS[enemy.templateId] || { glyph: 'x', color: '#d04040' };
          glyph   = enemy.isBoss ? md.glyph.toUpperCase() : md.glyph;
          color   = enemy.isBoss ? '#ff3855' : md.color;
          bg      = enemy.isBoss ? '#1c0408' : '#0e0c14';
          bold    = true;
          outline = enemy.isBoss ? '1px solid rgba(255,56,85,0.6)' : 'none';
        } else if (chest) {
          glyph = '$'; color = '#d4b840'; bg = '#120e00'; bold = true;
        }
      }

      cells.push(
        <div key={`${vx}-${vy}`} style={{
          width: CELL, height: CELL, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isPlayer ? '15px' : '13px',
          fontFamily: 'monospace', color,
          fontWeight: bold ? 'bold' : 'normal',
          userSelect: 'none', lineHeight: 1, outline,
        }}>
          {glyph}
        </div>
      );
    }
  }

  const liveEnemies = enemies.filter(e => e.alive);
  const maxHP = getPlayerMaxHP(player);
  const maxMP = getPlayerMaxMP(player);
  const hpPct = player.hp.current / maxHP;
  const mpPct = player.mp.current / maxMP;
  const recentLog = gameLog.slice(0, 8);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: '#07070f', overflow: 'hidden',
      fontFamily: 'monospace', position: 'relative',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '5px 12px', background: '#0a0a14',
        borderBottom: `1px solid ${accentColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <span style={{ color: accentColor, fontSize: '11px', letterSpacing: '0.15em', fontWeight: 'bold', flexShrink: 0 }}>
            {dungeon.name.toUpperCase()}
          </span>
          <span style={{ color: '#303050', fontSize: '10px', flexShrink: 0 }}>
            Floor {dungeon.currentFloor + 1}/{dungeon.floors.length}
          </span>
          {floor.isBossFloor && (
            <span style={{ color: '#ff3855', fontSize: '10px', letterSpacing: '0.1em', fontWeight: 'bold', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }}>
              ⚠ BOSS FLOOR
            </span>
          )}
          {liveEnemies.length > 0 && (
            <span style={{ color: '#882828', fontSize: '10px', flexShrink: 0 }}>
              {liveEnemies.length} hostile{liveEnemies.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '9px', color: '#202030' }}>WASD/↑↓←→/hjkl</span>
          <button onClick={() => setView('world')} style={{
            padding: '3px 9px', background: 'transparent', border: '1px solid #222238',
            color: '#404060', fontSize: '10px', cursor: 'pointer', borderRadius: '3px',
            fontFamily: 'monospace',
          }}>Exit</button>
        </div>
      </div>

      {/* ── Boss floor banner ── */}
      {floor.isBossFloor && floor.bossName && liveEnemies.some(e => e.isBoss) && (
        <div style={{
          padding: '5px 12px',
          background: 'rgba(30,4,8,0.95)',
          borderBottom: '1px solid rgba(255,56,85,0.3)',
          display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
        }}>
          <span style={{ fontSize: '12px' }}>💀</span>
          <span style={{ color: '#ff3855', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.08em' }}>
            <span style={{ color: 'rgba(255,56,85,0.5)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', marginRight: '6px' }}>Boss</span>
            {floor.bossName} lurks within
          </span>
        </div>
      )}

      {/* ── Main body: map-column + side-panel ── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Map column — scrollable so player can never be soft-locked ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '8px 6px',
          overflowY: 'auto', overflowX: 'hidden', gap: '8px',
        }}>
          {/* Tilemap */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${VIS_X}, ${CELL}px)`,
            gridTemplateRows:    `repeat(${VIS_Y}, ${CELL}px)`,
            border: '1px solid #141420',
            boxShadow: `0 0 60px rgba(0,0,0,0.95), inset 0 0 0 1px #0a0a14`,
            flexShrink: 0,
          }}>
            {cells}
          </div>

          {/* D-pad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 36px)', gridTemplateRows: 'repeat(3, 36px)', gap: '3px', flexShrink: 0 }}>
            {[
              { dx:-1, dy:-1, label:'↖' }, { dx: 0, dy:-1, label:'▲' }, { dx: 1, dy:-1, label:'↗' },
              { dx:-1, dy: 0, label:'◀' }, { wait: true },               { dx: 1, dy: 0, label:'▶' },
              { dx:-1, dy: 1, label:'↙' }, { dx: 0, dy: 1, label:'▼' }, { dx: 1, dy: 1, label:'↘' },
            ].map((btn, i) => {
              if (btn.wait) return (
                <button key={i} onClick={wait} title="Wait / Rest (.  r  5)" style={{
                  width: 36, height: 36, background: '#0c0c1a', border: '1px solid #1c1c2e',
                  borderRadius: '4px', color: '#2c2c48',
                  fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: 'monospace', transition: 'all 0.1s', flexDirection: 'column', gap: '1px',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#16162a'; e.currentTarget.style.color = '#7070a0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0c0c1a'; e.currentTarget.style.color = '#2c2c48'; }}
                ><span style={{ fontSize: '14px' }}>@</span><span style={{ fontSize: '7px', letterSpacing: '0.05em' }}>wait</span></button>
              );
              return (
                <button key={i} onClick={() => move(btn.dx, btn.dy)} style={{
                  width: 36, height: 36, background: '#0c0c1a', border: '1px solid #1c1c2e',
                  borderRadius: '4px', color: (btn.dx !== 0 && btn.dy !== 0) ? '#2c2c48' : '#444468',
                  fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: 'monospace', transition: 'all 0.1s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#16162a'; e.currentTarget.style.color = '#7070a0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0c0c1a'; e.currentTarget.style.color = (btn.dx !== 0 && btn.dy !== 0) ? '#2c2c48' : '#444468'; }}
                >{btn.label}</button>
              );
            })}
          </div>

          {/* Mobile keyboard hint */}
          <div style={{ fontSize: '9px', color: '#1a1a28', flexShrink: 0, textAlign: 'center' }}>
            Q E Z C · diagonals · HJKL · vi keys
          </div>
        </div>

        {/* ── Side panel — scrollable ── */}
        <div style={{
          width: '175px', flexShrink: 0,
          background: '#09090f', borderLeft: '1px solid #141420',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto', padding: '8px',
          gap: '10px', fontSize: '11px',
        }}>

          {/* Player stats */}
          <div>
            <div style={{ color: '#f4e858', fontWeight: 'bold', fontSize: '12px', marginBottom: '7px', fontFamily: 'monospace' }}>
              @ {player.name}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                <span style={{ color: '#383850' }}>HP</span>
                <span style={{ color: hpBarColor(hpPct), fontWeight: 'bold' }}>{player.hp.current}/{maxHP}</span>
              </div>
              <div style={{ height: '5px', background: '#141420', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${hpPct*100}%`, height: '100%', background: hpBarColor(hpPct), borderRadius: '2px', transition: 'width 0.25s' }} />
              </div>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                <span style={{ color: '#383850' }}>MP</span>
                <span style={{ color: '#5890d8' }}>{player.mp.current}/{maxMP}</span>
              </div>
              <div style={{ height: '4px', background: '#141420', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${mpPct*100}%`, height: '100%', background: '#5890d8', borderRadius: '2px', transition: 'width 0.25s' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '10px', color: '#383850' }}>
              <span>Lv<span style={{ color: '#9090b0' }}>{player.level}</span></span>
              <span><span style={{ color: '#a09040' }}>{player.gold}</span>g</span>
              <span>F<span style={{ color: '#9090b0' }}>{dungeon.currentFloor+1}</span></span>
            </div>
          </div>

          {/* Minimap */}
          <div style={{ borderTop: '1px solid #141420', paddingTop: '8px' }}>
            <div style={{ color: '#282840', fontSize: '9px', letterSpacing: '0.12em', marginBottom: '5px', textTransform: 'uppercase' }}>Map</div>
            <DungeonMinimap floor={floor} dungeonType={dungeonTypeDef} />
          </div>

          {/* Nearby enemies */}
          <div style={{ borderTop: '1px solid #141420', paddingTop: '8px' }}>
            <div style={{ color: '#282840', fontSize: '9px', letterSpacing: '0.12em', marginBottom: '5px', textTransform: 'uppercase' }}>Nearby</div>
            {liveEnemies.length === 0 ? (
              <div style={{ color: '#1c1c30', fontSize: '10px', fontStyle: 'italic' }}>All clear</div>
            ) : liveEnemies.slice(0, 5).map((e, i) => {
              const md  = MONSTER_GLYPHS[e.templateId] || { glyph: 'x', color: '#d04040' };
              const dist = Math.round(Math.sqrt((e.x-px)**2 + (e.y-py)**2));
              const inSight = fogOfWar?.[e.y]?.[e.x] === false;
              return (
                <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '3px', opacity: inSight ? 1 : 0.4 }}>
                  <span style={{ color: e.isBoss ? '#ff3855' : md.color, fontWeight: 'bold', width: '11px', textAlign: 'center', fontSize: '11px' }}>
                    {e.isBoss ? md.glyph.toUpperCase() : md.glyph}
                  </span>
                  <span style={{ color: e.isBoss ? '#a03040' : '#404055', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px' }}>
                    {e.name}
                  </span>
                  <span style={{ color: '#20202c', fontSize: '9px' }}>{dist}</span>
                </div>
              );
            })}
          </div>

          {/* Log */}
          <div style={{ borderTop: '1px solid #141420', paddingTop: '8px' }}>
            <div style={{ color: '#282840', fontSize: '9px', letterSpacing: '0.12em', marginBottom: '5px', textTransform: 'uppercase' }}>Log</div>
            {recentLog.map((entry, i) => (
              <div key={i} style={{
                fontSize: '10px', marginBottom: '3px', lineHeight: '1.4',
                color: i === 0 ? '#7070a0' : '#252535',
                borderLeft: i === 0 ? `2px solid ${accentColor}50` : '2px solid #141420',
                paddingLeft: '5px',
              }}>
                {entry.message}
              </div>
            ))}
          </div>

          {/* Key legend */}
          <div style={{ borderTop: '1px solid #141420', paddingTop: '8px' }}>
            <div style={{ color: '#282840', fontSize: '9px', letterSpacing: '0.12em', marginBottom: '5px', textTransform: 'uppercase' }}>Key</div>
            {[
              ['@','#f4e858','You'], ['#','#686878','Wall'], ['·','#353545','Floor'],
              ['+','#c09040','Door'], ['>','#50d050','Down'], ['$','#d4b840','Chest'], ['^','#c03838','Trap'],
            ].map(([g, c, lbl]) => (
              <div key={g+lbl} style={{ display: 'flex', gap: '5px', marginBottom: '2px', alignItems: 'center' }}>
                <span style={{ color: c, fontWeight: 'bold', width: '12px', textAlign: 'center', fontSize: '11px' }}>{g}</span>
                <span style={{ color: '#252535', fontSize: '10px' }}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chest modal ── */}
      {pendingChest && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          overflowY: 'auto',
        }}>
          <div style={{
            background: '#0e0e1c', border: '1px solid #c09030', borderRadius: '6px',
            padding: '28px 22px', minWidth: '220px', maxWidth: '90%', textAlign: 'center',
            boxShadow: '0 0 40px rgba(192,144,48,0.2)', margin: 'auto',
          }}>
            <div style={{ fontSize: '30px', color: '#d4b840', marginBottom: '10px' }}>$</div>
            <div style={{ fontSize: '14px', color: '#d4b840', marginBottom: '5px', fontWeight: 'bold', letterSpacing: '0.08em' }}>Treasure Chest</div>
            <div style={{ fontSize: '11px', color: '#505068', marginBottom: '16px', lineHeight: '1.5' }}>
              A locked chest sits before you.<br/>Open it?
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={openDungeonChest} style={{
                padding: '8px 18px', background: '#d4b840', border: 'none',
                color: '#080810', fontWeight: 'bold', cursor: 'pointer',
                borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px',
              }}>Open</button>
              <button onClick={dismissChest} style={{
                padding: '8px 18px', background: 'transparent', border: '1px solid #242440',
                color: '#404060', cursor: 'pointer', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px',
              }}>Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
