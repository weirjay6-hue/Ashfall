import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import useGameStore from '../store/gameStore.js';
import {
  generateChunk, getHexLayout, getChunkName,
  ZT, ZONE_WALKABLE, CHUNK_W, CHUNK_H, CHUNK_GRID,
  generateMob,
} from '../engine/zoneTileMap.js';
import { TERRAIN_INFO, getAdjacentRegions } from '../engine/map.js';
import { spawnEnemy, getPlayerAttack, getPlayerDefense, getPlayerMaxHP } from '../engine/combat.js';
import { generateItem } from '../engine/items.js';
import WorldMap from './WorldMap.jsx';

const MOB_LOOT = {
  goblin:        { pool: ['lockpick','healing_potion'],           chance: 0.40 },
  orc_warrior:   { pool: ['iron_helm','leather_boots'],           chance: 0.38 },
  bandit:        { pool: ['lockpick','iron_sword','leather_armor'],chance: 0.55 },
  skeleton:      { pool: ['iron_helm'],                           chance: 0.22 },
  zombie:        { pool: ['antidote'],                            chance: 0.18 },
  wight:         { pool: ['healing_potion','mana_potion'],        chance: 0.32 },
  giant_spider:  { pool: ['antidote'],                            chance: 0.28 },
  dire_wolf:     { pool: ['antidote'],                            chance: 0.22 },
  ghost:         { pool: ['mana_potion'],                         chance: 0.30 },
  dark_assassin: { pool: ['lockpick','healing_potion','iron_sword'],chance: 0.62 },
  dark_mage:     { pool: ['mana_potion','healing_potion'],        chance: 0.58 },
  witch:         { pool: ['mana_potion','antidote'],              chance: 0.48 },
};

const TS = 28;

const TILE_BG = {
  [ZT.GRASS]:      '#357a28',
  [ZT.TREE]:       '#1a3e0e',
  [ZT.ROCK]:       '#54544a',
  [ZT.SAND]:       '#c4a038',
  [ZT.SWAMP]:      '#384e3c',
  [ZT.WATER]:      '#183c64',
  [ZT.PATH]:       '#886640',
  [ZT.COBBLE]:     '#6a6050',
  [ZT.BUSH]:       '#2a5018',
  [ZT.TALL_GRASS]: '#2e6020',
  [ZT.FLOWER]:     '#357a28',
  [ZT.MOUNTAIN]:   '#585850',
  [ZT.SNOW]:       '#c0d0dc',
  [ZT.MUD]:        '#5a4030',
  [ZT.SETTLEMENT]: '#706050',
  [ZT.DUNGEON]:    '#3a0a14',
  [ZT.POI]:        '#704820',
  [ZT.BORDER]:     '#0e1a0e',
};

const FLOWER_COLORS = ['#e04060','#e0c020','#8040d0','#40a0d0','#e08020'];

function drawTile(ctx, tx, ty, tile, sx, sy) {
  const h = (tx * 2053 + ty * 1009 + tile * 7) & 0xffff;
  ctx.fillStyle = TILE_BG[tile] ?? TILE_BG[ZT.GRASS];
  ctx.fillRect(sx, sy, TS, TS);

  switch (tile) {
    case ZT.GRASS:
      if (h % 7 === 0) {
        ctx.fillStyle = 'rgba(60,110,30,0.5)';
        ctx.fillRect(sx+4, sy+7, 2, 6); ctx.fillRect(sx+12, sy+4, 2, 7); ctx.fillRect(sx+20, sy+9, 2, 5);
      }
      if (h % 11 === 0) { ctx.fillStyle='rgba(80,140,40,0.3)'; ctx.fillRect(sx+8,sy+13,2,5); ctx.fillRect(sx+19,sy+5,2,6); }
      break;
    case ZT.TALL_GRASS:
      ctx.fillStyle = 'rgba(50,100,25,0.7)';
      ctx.fillRect(sx+3,sy+5,2,10); ctx.fillRect(sx+8,sy+3,2,12); ctx.fillRect(sx+14,sy+6,2,9); ctx.fillRect(sx+20,sy+4,2,11);
      break;
    case ZT.FLOWER: {
      ctx.fillStyle = 'rgba(50,100,25,0.5)';
      ctx.fillRect(sx+4,sy+7,2,7); ctx.fillRect(sx+15,sy+5,2,9);
      ctx.fillStyle = FLOWER_COLORS[h % FLOWER_COLORS.length];
      ctx.beginPath(); ctx.arc(sx+5,sy+6,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx+16,sy+4,2.5,0,Math.PI*2); ctx.fill();
      if (h%3===0){ctx.beginPath();ctx.arc(sx+22,sy+10,2,0,Math.PI*2);ctx.fill();}
      break;
    }
    case ZT.TREE:
      ctx.fillStyle='#142e08'; ctx.beginPath(); ctx.arc(sx+TS/2,sy+TS/2,TS/2-1,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#225c14'; ctx.beginPath(); ctx.arc(sx+TS/2-2,sy+TS/2-3,TS/2-7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#2e7a1e'; ctx.beginPath(); ctx.arc(sx+TS/2+2,sy+TS/2-5,TS/2-10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#4a3010'; ctx.fillRect(sx+TS/2-2,sy+TS-6,4,5);
      break;
    case ZT.BUSH:
      ctx.fillStyle='#1e3e10'; ctx.beginPath(); ctx.arc(sx+TS/2,sy+TS/2+2,TS/2-3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#347020'; ctx.beginPath(); ctx.arc(sx+TS/2-3,sy+TS/2-1,6,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx+TS/2+3,sy+TS/2-2,5,0,Math.PI*2); ctx.fill();
      if(h%5===0){ctx.fillStyle='#e04060';ctx.beginPath();ctx.arc(sx+8,sy+9,2,0,Math.PI*2);ctx.fill();}
      break;
    case ZT.ROCK:
      ctx.fillStyle='#6a6a60'; ctx.beginPath(); ctx.ellipse(sx+TS/2,sy+TS/2+2,TS/2-3,TS/2-6,-0.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(sx+6,sy+5,8,4);
      ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(sx+6,sy+TS-8,10,4);
      break;
    case ZT.MOUNTAIN:
      ctx.fillStyle='#484840'; ctx.beginPath();
      ctx.moveTo(sx+TS/2,sy+1); ctx.lineTo(sx+TS-2,sy+TS-1); ctx.lineTo(sx+2,sy+TS-1); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.beginPath();
      ctx.moveTo(sx+TS/2,sy+1); ctx.lineTo(sx+TS/2+5,sy+8); ctx.lineTo(sx+TS/2-5,sy+8); ctx.closePath(); ctx.fill();
      break;
    case ZT.SNOW:
      ctx.fillStyle='rgba(255,255,255,0.18)';
      if(h%4===0){ctx.beginPath();ctx.arc(sx+6,sy+8,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(sx+18,sy+12,5,0,Math.PI*2);ctx.fill();}
      break;
    case ZT.SAND:
      if(h%8===0){ctx.fillStyle='rgba(180,130,10,0.3)';ctx.fillRect(sx+3,sy+5,4,2);ctx.fillRect(sx+15,sy+12,5,2);}
      if(h%13===0){ctx.fillStyle='rgba(255,220,80,0.1)';ctx.fillRect(sx+8,sy+3,10,6);}
      break;
    case ZT.SWAMP:
      if(h%4===0){ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(sx+8,sy+14,5,3,0.3,0,Math.PI*2);ctx.fill();}
      if(h%5===0){ctx.fillStyle='rgba(50,80,30,0.35)';ctx.fillRect(sx+16,sy+7,3,8);ctx.fillRect(sx+21,sy+5,2,10);}
      break;
    case ZT.MUD:
      ctx.fillStyle='rgba(0,0,0,0.18)';
      for(let i=0;i<4;i++){const mx=sx+(h*(i+1)*7)%(TS-4)+2;const my=sy+(h*(i+2)*11)%(TS-4)+2;ctx.fillRect(mx,my,2,2);}
      break;
    case ZT.WATER: {
      const wo=(tx+ty*3)%4;
      ctx.fillStyle='rgba(40,100,180,0.15)';ctx.fillRect(sx,sy+6+wo,TS,3);ctx.fillRect(sx,sy+16+wo,TS,2);
      ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(sx+4,sy+4+wo,8,1);ctx.fillRect(sx+16,sy+14+wo,7,1);
      break;
    }
    case ZT.PATH:
      if((tx+ty)%2===0){ctx.fillStyle='rgba(0,0,0,0.06)';ctx.fillRect(sx+3,sy+3,TS-6,TS-6);}
      ctx.fillStyle='rgba(255,220,150,0.06)';ctx.fillRect(sx+2,sy+2,6,2);
      break;
    case ZT.COBBLE:
      ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(sx+2,sy+2,TS/2-3,TS/2-3);ctx.fillRect(sx+TS/2+1,sy+TS/2+1,TS/2-3,TS/2-3);
      ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=0.5;
      ctx.strokeRect(sx+2,sy+2,TS/2-3,TS/2-3);ctx.strokeRect(sx+TS/2+1,sy+TS/2+1,TS/2-3,TS/2-3);
      break;
    case ZT.SETTLEMENT: {
      // Stone gate pillars (left and right)
      ctx.fillStyle='#8a7e6e';
      ctx.fillRect(sx+1,sy+4,8,TS-5);
      ctx.fillRect(sx+TS-9,sy+4,8,TS-5);
      // Stone texture detail
      ctx.fillStyle='rgba(255,255,255,0.09)';
      ctx.fillRect(sx+2,sy+5,3,3);ctx.fillRect(sx+2,sy+10,3,3);ctx.fillRect(sx+2,sy+15,3,2);
      ctx.fillRect(sx+TS-8,sy+7,3,3);ctx.fillRect(sx+TS-8,sy+12,3,3);ctx.fillRect(sx+TS-8,sy+17,3,2);
      ctx.fillStyle='rgba(0,0,0,0.15)';
      ctx.fillRect(sx+5,sy+5,3,3);ctx.fillRect(sx+5,sy+10,3,3);ctx.fillRect(sx+5,sy+15,3,2);
      ctx.fillRect(sx+TS-6,sy+7,3,3);ctx.fillRect(sx+TS-6,sy+12,3,3);ctx.fillRect(sx+TS-6,sy+17,3,2);
      // Arch lintel across top
      ctx.fillStyle='#7a6e5e';
      ctx.fillRect(sx+1,sy+2,TS-2,5);
      // Arch opening (dark interior)
      ctx.fillStyle='#2a1e14';
      ctx.beginPath();ctx.arc(sx+TS/2,sy+7,5,Math.PI,0);ctx.fill();
      // Gate passage interior
      ctx.fillStyle='#1e1410';
      ctx.fillRect(sx+9,sy+7,TS-18,TS-8);
      // Cobble path inside passage
      ctx.fillStyle='#7a6a58';
      ctx.fillRect(sx+10,sy+12,TS-20,TS-13);
      // Wooden gate doors (held open against pillars)
      ctx.fillStyle='#6a4020';
      ctx.fillRect(sx+2,sy+7,6,TS-8);
      ctx.fillRect(sx+TS-8,sy+7,6,TS-8);
      // Door plank lines
      ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=0.7;
      for(let i=0;i<3;i++){
        ctx.beginPath();ctx.moveTo(sx+2,sy+9+i*5);ctx.lineTo(sx+8,sy+9+i*5);ctx.stroke();
        ctx.beginPath();ctx.moveTo(sx+TS-8,sy+9+i*5);ctx.lineTo(sx+TS-2,sy+9+i*5);ctx.stroke();
      }
      // Iron hinges
      ctx.fillStyle='#403830';
      ctx.fillRect(sx+2,sy+9,2,2);ctx.fillRect(sx+2,sy+17,2,2);
      ctx.fillRect(sx+TS-4,sy+9,2,2);ctx.fillRect(sx+TS-4,sy+17,2,2);
      // Lanterns on pillar tops
      ctx.fillStyle='#c8a010';
      ctx.fillRect(sx+3,sy+1,4,4);
      ctx.fillRect(sx+TS-7,sy+1,4,4);
      // Lantern warm glow
      ctx.fillStyle='rgba(255,195,20,0.22)';
      ctx.beginPath();ctx.arc(sx+5,sy+3,8,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(sx+TS-5,sy+3,8,0,Math.PI*2);ctx.fill();
      // Lantern bright center
      ctx.fillStyle='#ffe050';
      ctx.fillRect(sx+4,sy+2,2,2);ctx.fillRect(sx+TS-6,sy+2,2,2);
      // Small flag/banner on lintel center
      ctx.fillStyle='#802010';
      ctx.fillRect(sx+TS/2-1,sy+0,2,4);
      ctx.fillStyle='#c03020';
      ctx.fillRect(sx+TS/2+1,sy+0,5,3);
      break;
    }
    case ZT.DUNGEON:
      ctx.fillStyle='#5a1020';ctx.fillRect(sx+2,sy+2,TS-4,TS-4);
      ctx.fillStyle='#200510';ctx.fillRect(sx+TS/2-5,sy+6,10,TS-8);
      ctx.fillStyle='rgba(200,0,50,0.4)';ctx.beginPath();ctx.arc(sx+TS/2,sy+4,4,Math.PI,0);ctx.fill();
      ctx.fillStyle='#ff4444';ctx.font='10px serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('☠',sx+TS/2,sy+TS/2+2);
      break;
    case ZT.POI:
      ctx.fillStyle='#7a5030';ctx.fillRect(sx+TS/2-2,sy+6,4,TS-9);
      ctx.fillStyle='#c07828';ctx.fillRect(sx+TS/2-8,sy+4,16,8);
      ctx.fillStyle='#f0a030';ctx.beginPath();ctx.arc(sx+TS/2,sy+4,4,0,Math.PI*2);ctx.fill();
      break;
    default: break;
  }
  ctx.strokeStyle='rgba(0,0,0,0.06)';ctx.lineWidth=0.3;ctx.strokeRect(sx,sy,TS,TS);
}

// ── Hex Minimap ──────────────────────────────────────────────────────────────
const MM_S      = 9;                       // hex radius in px
const MM_H      = MM_S * 1.5;             // col-to-col horizontal step
const MM_V      = MM_S * Math.sqrt(3);    // row-to-row vertical step
const MM_RAD    = 4;                       // visible radius (4 hexes each way)
const MM_COLS   = MM_RAD * 2 + 1;         // 9 visible columns/rows
const MM_PAD    = 5;
const MM_HEADER = 18;
const MM_FOOTER = 14;
const MM_CW     = Math.ceil((MM_COLS - 1) * MM_H + MM_S * 2 + MM_PAD * 2);
const MM_HEX_H  = Math.ceil((MM_COLS - 1) * MM_V + MM_V * 0.5 + MM_S * 2);
const MM_CH     = MM_HEX_H + MM_PAD * 2 + MM_HEADER + MM_FOOTER;

const MM_TERRAIN = {
  plains:'#4a8830', forest:'#1a5c14', mountains:'#787868',
  desert:'#b89228', swamp:'#3a6848', coast:'#2a7898',
  ocean:'#0e3e72', lake:'#0e4a88',
};

function mmHexPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    else         ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
}

function mmHexCenter(dx, dy, regionX) {
  const absCol = regionX + dx;
  const playerParityOffset = (regionX & 1) ? MM_V / 2 : 0;
  const cellParityOffset   = (((absCol % 2) + 2) % 2) ? MM_V / 2 : 0;
  return {
    x: MM_PAD + MM_S + (MM_RAD + dx) * MM_H,
    y: MM_PAD + MM_HEADER + MM_S + (MM_RAD + dy) * MM_V + (cellParityOffset - playerParityOffset),
  };
}

function WorldMinimap({ world, player }) {
  const canvasRef = React.useRef(null);
  const { regionX, regionY } = player?.location ?? { regionX: 0, regionY: 0 };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !world || !player) return;
    canvas.width  = MM_CW;
    canvas.height = MM_CH;
    const ctx = canvas.getContext('2d');

    const regionMap = new Map();
    for (const r of world.regions) regionMap.set(`${r.x},${r.y}`, r);

    // Panel
    ctx.fillStyle = 'rgba(2,6,10,0.96)';
    ctx.beginPath(); ctx.roundRect(0, 0, MM_CW, MM_CH, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(200,158,50,0.75)'; ctx.lineWidth = 1.2; ctx.stroke();

    // Header
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = 'rgba(210,172,58,0.9)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('MINIMAP', MM_CW / 2, MM_HEADER / 2 + 1);
    ctx.strokeStyle = 'rgba(200,158,50,0.22)'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(MM_PAD, MM_HEADER - 1); ctx.lineTo(MM_CW - MM_PAD, MM_HEADER - 1);
    ctx.stroke();

    // Hex cells
    for (let dy = -MM_RAD; dy <= MM_RAD; dy++) {
      for (let dx = -MM_RAD; dx <= MM_RAD; dx++) {
        const { x: cx, y: cy } = mmHexCenter(dx, dy, regionX);
        const r = regionMap.get(`${regionX + dx},${regionY + dy}`);

        if (!r) {
          mmHexPath(ctx, cx, cy, MM_S - 0.5);
          ctx.fillStyle = '#080c10'; ctx.fill();
          continue;
        }

        const base = MM_TERRAIN[r.terrain] || MM_TERRAIN.plains;

        mmHexPath(ctx, cx, cy, MM_S - 0.5);
        if (r.revealed) {
          ctx.fillStyle = base; ctx.fill();
          if (r.dangerLevel >= 4) {
            ctx.fillStyle = `rgba(180,20,20,${(r.dangerLevel - 3) * 0.13})`; ctx.fill();
          }
          ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 0.4; ctx.stroke();

          if (r.settlements?.length) {
            const sz = r.settlements[0].type === 'city' ? 2.8 : r.settlements[0].type === 'town' ? 2.2 : 1.5;
            ctx.fillStyle = '#f5d020';
            ctx.beginPath(); ctx.arc(cx + 3, cy - 3, sz, 0, Math.PI * 2); ctx.fill();
          } else if (r.dungeons?.length) {
            ctx.fillStyle = '#cc2020';
            ctx.beginPath(); ctx.arc(cx + 3, cy - 3, 1.8, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.fillStyle = 'rgba(8,14,20,0.94)'; ctx.fill();
          ctx.strokeStyle = 'rgba(28,38,50,0.5)'; ctx.lineWidth = 0.4; ctx.stroke();
        }
      }
    }

    // Player marker at exact center hex
    const { x: pmx, y: pmy } = mmHexCenter(0, 0, regionX);
    ctx.strokeStyle = 'rgba(248,200,50,0.85)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(pmx, pmy, MM_S - 2.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f8c832';
    ctx.beginPath(); ctx.arc(pmx, pmy, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,248,220,0.9)'; ctx.lineWidth = 0.8; ctx.stroke();

    // Compass
    const midX = MM_CW / 2;
    const midY = MM_HEADER + MM_PAD + (MM_HEX_H + MM_PAD * 2) / 2;
    ctx.font = 'bold 6px sans-serif';
    ctx.fillStyle = 'rgba(200,170,80,0.6)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', midX, MM_HEADER + MM_PAD + 4);
    ctx.fillText('S', midX, MM_CH - MM_FOOTER - MM_PAD - 4);
    ctx.textAlign = 'left';  ctx.fillText('W', MM_PAD + 2, midY);
    ctx.textAlign = 'right'; ctx.fillText('E', MM_CW - MM_PAD - 2, midY);

    // Footer
    const curR = regionMap.get(`${regionX},${regionY}`);
    if (curR) {
      ctx.strokeStyle = 'rgba(200,158,50,0.22)'; ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(MM_PAD, MM_CH - MM_FOOTER); ctx.lineTo(MM_CW - MM_PAD, MM_CH - MM_FOOTER);
      ctx.stroke();
      ctx.font = '7px sans-serif'; ctx.fillStyle = 'rgba(220,198,138,0.9)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(
        curR.name.length > 20 ? curR.name.slice(0, 18) + '…' : curR.name,
        MM_CW / 2, MM_CH - MM_FOOTER / 2,
      );
    }
  }, [world, regionX, regionY]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:'absolute', top:'38px', right:'10px', borderRadius:'8px', pointerEvents:'none', zIndex:6 }}
    />
  );
}

export default function ZoneView() {
  const world           = useGameStore(s => s.world);
  const player          = useGameStore(s => s.player);
  const travel          = useGameStore(s => s.travel);
  const enterSettlement = useGameStore(s => s.enterSettlement);
  const enterDungeon    = useGameStore(s => s.enterDungeon);
  const setView         = useGameStore(s => s.setView);
  const zoneMobKilled   = useGameStore(s => s.zoneMobKilled);
  const zoneTakeDamage  = useGameStore(s => s.zoneTakeDamage);
  const pickupLoot      = useGameStore(s => s.pickupLoot);

  const containerRef  = useRef(null);
  const canvasRef     = useRef(null);
  const posRef        = useRef(null);
  const moveLockRef   = useRef(false);
  const chunkMobRef   = useRef(null);
  const playerRef     = useRef(player);
  const floatIdRef    = useRef(0);
  const damageFloatsRef = useRef([]);
  const animFrameRef  = useRef(null);
  const lootPileRef   = useRef(null);
  const bonesRef      = useRef([]);
  const spawnDirRef   = useRef('south'); // which edge player came FROM (spawn opposite)

  const [chunkPos,     setChunkPos]     = useState({ x: 1, y: CHUNK_GRID - 1 });
  const [pos,          setPos]          = useState(null);
  const [prompt,       setPrompt]       = useState(null);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showLocalMap, setShowLocalMap] = useState(false);
  const [flashChunk,   setFlashChunk]   = useState(null);
  const [combatLog,    setCombatLog]    = useState([]);

  const [chunkMob, _setChunkMob] = useState(null);
  const setChunkMob = useCallback((updaterOrVal) => {
    const newVal = typeof updaterOrVal === 'function' ? updaterOrVal(chunkMobRef.current) : updaterOrVal;
    chunkMobRef.current = newVal;
    _setChunkMob(newVal);
  }, []);

  useEffect(() => { playerRef.current = player; }, [player]);

  const currentRegion = useMemo(() => {
    if (!world || !player) return null;
    const { regionX, regionY } = player.location;
    return world.regions.find(r => r.x === regionX && r.y === regionY);
  }, [world, player?.location?.regionX, player?.location?.regionY]);

  const hexLayout = useMemo(() => currentRegion ? getHexLayout(currentRegion) : [], [currentRegion?.id]);

  const chunk = useMemo(() => {
    if (!currentRegion) return null;
    return generateChunk(currentRegion, chunkPos.x, chunkPos.y);
  }, [currentRegion?.id, chunkPos.x, chunkPos.y]);

  const chunkName = useMemo(() => {
    if (!currentRegion) return '';
    return getChunkName(currentRegion, chunkPos.x, chunkPos.y);
  }, [currentRegion?.id, chunkPos.x, chunkPos.y]);

  const adjRegions = useMemo(() => {
    if (!world || !currentRegion) return {};
    const adj = getAdjacentRegions(world, currentRegion.x, currentRegion.y);
    const map = {};
    adj.forEach(({ dir, region }) => { map[dir] = region; });
    return map;
  }, [world, currentRegion?.id]);

  function spawnForDirection(fromEdge) {
    const midX = Math.floor(CHUNK_W / 2);
    const midY = Math.floor(CHUNK_H / 2);
    if (fromEdge === 'south') return { x: midX, y: CHUNK_H - 2 };
    if (fromEdge === 'north') return { x: midX, y: 1 };
    if (fromEdge === 'east')  return { x: CHUNK_W - 2, y: midY };
    if (fromEdge === 'west')  return { x: 1, y: midY };
    return { x: midX, y: CHUNK_H - 2 };
  }

  useEffect(() => {
    if (!chunk || !currentRegion) return;
    const spawn = spawnForDirection(spawnDirRef.current);
    posRef.current = { ...spawn };
    setPos({ ...spawn });
    setPrompt(null);
    setCombatLog([]);

    const template = generateMob(currentRegion, chunkPos.x, chunkPos.y, chunk.tiles, chunk.width, chunk.height);
    if (template) {
      const dangerLevel = Math.max(1, currentRegion.dangerLevel || 1);
      const enemy = spawnEnemy(template.id, dangerLevel, null);
      if (enemy) {
        setChunkMob({ ...enemy, emoji: template.emoji, x: template.x, y: template.y, dead: false });
      } else {
        setChunkMob(null);
      }
    } else {
      setChunkMob(null);
    }
  }, [currentRegion?.id, chunkPos.x, chunkPos.y]);

  const addFloat = useCallback((text, worldX, worldY, color) => {
    const id = ++floatIdRef.current;
    const entry = { id, text, worldX, worldY, color, born: Date.now() };
    damageFloatsRef.current = [...damageFloatsRef.current, entry];
    if (!animFrameRef.current) {
      const animate = () => {
        const now = Date.now();
        damageFloatsRef.current = damageFloatsRef.current.filter(f => now - f.born < 1100);
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (canvas && container && posRef.current && chunkMobRef.current !== undefined) {
          const vw = container.clientWidth || 360, vh = container.clientHeight || 480;
          if (canvas.width !== vw || canvas.height !== vh) { canvas.width = vw; canvas.height = vh; }
          drawFrameRef.current(canvas, canvas.getContext('2d'), posRef.current);
        }
        if (damageFloatsRef.current.length > 0) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          animFrameRef.current = null;
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
    }
    setTimeout(() => { damageFloatsRef.current = damageFloatsRef.current.filter(f => f.id !== id); }, 1200);
  }, []);

  const addToLog = useCallback((msg) => {
    setCombatLog(prev => [msg, ...prev].slice(0, 5));
  }, []);

  const attackMob = useCallback(() => {
    const mob = chunkMobRef.current;
    const p = playerRef.current;
    if (!mob || mob.dead || !p) return;

    const atk = getPlayerAttack(p);
    const isCrit = Math.random() < 0.09;
    let dmg = Math.max(1, atk + Math.floor(Math.random() * 5) - Math.floor(mob.defense / 2));
    if (isCrit) dmg = Math.floor(dmg * 1.6);

    addFloat(isCrit ? `★${dmg}!` : `${dmg}`, mob.x, mob.y, isCrit ? '#ffdd00' : '#ff7070');
    addToLog(isCrit ? `★ CRIT! You strike the ${mob.name} for ${dmg}!` : `You hit the ${mob.name} for ${dmg}.`);

    const newHp = Math.max(0, mob.hp - dmg);
    if (newHp <= 0) {
      setChunkMob({ ...mob, hp: 0, dead: true });
      addToLog(`The ${mob.name} is slain!`);
      addFloat(`+${mob.xpReward}xp`, mob.x, mob.y, '#ffd700');
      zoneMobKilled(mob.xpReward, mob.goldReward);
    } else {
      setChunkMob({ ...mob, hp: newHp });
      const def = getPlayerDefense(p);
      const eDmg = Math.max(1, Math.floor(mob.attack * (0.6 + Math.random() * 0.7)) - def);
      const px = posRef.current?.x ?? 0, py = posRef.current?.y ?? 0;
      addFloat(`-${eDmg}`, px, py, '#ff4400');
      addToLog(`The ${mob.name} retaliates for ${eDmg}!`);
      zoneTakeDamage(eDmg);
    }
  }, [addFloat, addToLog, setChunkMob, zoneMobKilled, zoneTakeDamage]);

  const chaseMob = useCallback((playerX, playerY, currentChunk) => {
    const mob = chunkMobRef.current;
    if (!mob || mob.dead || !currentChunk) return;
    const dist = Math.abs(mob.x - playerX) + Math.abs(mob.y - playerY);
    if (dist > 9) return;

    const dx = playerX > mob.x ? 1 : playerX < mob.x ? -1 : 0;
    const dy = playerY > mob.y ? 1 : playerY < mob.y ? -1 : 0;
    const absX = Math.abs(playerX - mob.x);
    const absY = Math.abs(playerY - mob.y);

    let nx = mob.x, ny = mob.y;
    if (absX >= absY) { nx = mob.x + dx; }
    else              { ny = mob.y + dy; }

    if (!ZONE_WALKABLE.has(currentChunk.tiles[ny]?.[nx])) {
      nx = mob.x + (absX < absY ? dx : 0);
      ny = mob.y + (absX >= absY ? dy : 0);
    }
    if (!ZONE_WALKABLE.has(currentChunk.tiles[ny]?.[nx])) return;

    if (nx === playerX && ny === playerY) {
      const p = playerRef.current;
      if (!p) return;
      const def = getPlayerDefense(p);
      const eDmg = Math.max(1, Math.floor(mob.attack * (0.7 + Math.random() * 0.6)) - def);
      addFloat(`-${eDmg}`, playerX, playerY, '#ff4400');
      addToLog(`The ${mob.name} lunges at you for ${eDmg}!`);
      zoneTakeDamage(eDmg);
      return;
    }

    setChunkMob({ ...mob, x: nx, y: ny });
  }, [addFloat, addToLog, setChunkMob, zoneTakeDamage]);

  function checkPrompt(px, py, activeChunk) {
    if (!activeChunk?.special) { setPrompt(null); return; }
    const s = activeChunk.special;
    const dist = Math.abs(s.x - px) + Math.abs(s.y - py);
    setPrompt(dist <= 1 ? s : null);
  }

  const tryMove = useCallback((dx, dy) => {
    if (moveLockRef.current || !posRef.current || !chunk) return;
    moveLockRef.current = true;
    setTimeout(() => { moveLockRef.current = false; }, 70);

    const nx = posRef.current.x + dx;
    const ny = posRef.current.y + dy;
    const { width: W, height: H, tiles } = chunk;

    const mob = chunkMobRef.current;
    if (mob && !mob.dead && nx === mob.x && ny === mob.y) {
      attackMob();
      return;
    }

    const hitLeft   = nx <= 0;
    const hitRight  = nx >= W - 1;
    const hitTop    = ny <= 0;
    const hitBottom = ny >= H - 1;

    if (hitLeft || hitRight || hitTop || hitBottom) {
      // Only allow crossing at the actual PATH exit tiles — not through border walls
      if (!ZONE_WALKABLE.has(tiles[ny]?.[nx])) return;

      const ncx = hitLeft ? chunkPos.x - 1 : hitRight ? chunkPos.x + 1 : chunkPos.x;
      const ncy = hitTop  ? chunkPos.y - 1 : hitBottom ? chunkPos.y + 1 : chunkPos.y;

      if (ncx < 0 || ncy < 0 || ncx >= CHUNK_GRID || ncy >= CHUNK_GRID) {
        // Leaving the region entirely — determine direction and target edge chunk
        let travelDir = null;
        if (hitLeft)   { travelDir = 'West';  spawnDirRef.current = 'east'; }
        if (hitRight)  { travelDir = 'East';  spawnDirRef.current = 'west'; }
        if (hitTop)    { travelDir = 'North'; spawnDirRef.current = 'south'; }
        if (hitBottom) { travelDir = 'South'; spawnDirRef.current = 'north'; }
        const destRegion = adjRegions[travelDir];
        if (destRegion && destRegion.terrain !== 'ocean' && destRegion.terrain !== 'lake') {
          travel(destRegion.x, destRegion.y);
          // Enter the far edge of the destination region's chunk grid
          const newChunkX = hitLeft  ? CHUNK_GRID - 1 : hitRight  ? 0 : chunkPos.x;
          const newChunkY = hitTop   ? CHUNK_GRID - 1 : hitBottom ? 0 : chunkPos.y;
          setChunkPos({ x: newChunkX, y: newChunkY });
          setFlashChunk(travelDir);
          setTimeout(() => setFlashChunk(null), 600);
        }
        return;
      }

      // Moving to adjacent chunk within same region — enter from opposite edge
      if (hitLeft)   spawnDirRef.current = 'east';
      if (hitRight)  spawnDirRef.current = 'west';
      if (hitTop)    spawnDirRef.current = 'south';
      if (hitBottom) spawnDirRef.current = 'north';
      setFlashChunk({ x: ncx, y: ncy });
      setTimeout(() => setFlashChunk(null), 300);
      setChunkPos({ x: ncx, y: ncy });
      return;
    }

    if (!ZONE_WALKABLE.has(tiles[ny]?.[nx])) return;
    posRef.current = { x: nx, y: ny };
    setPos({ x: nx, y: ny });

    // Auto-enter town when stepping on the gate tile
    if (tiles[ny]?.[nx] === ZT.SETTLEMENT && chunk.special?.type === 'settlement') {
      enterSettlement(chunk.special.data.id);
      setView('town');
      return;
    }

    checkPrompt(nx, ny, chunk);
    chaseMob(nx, ny, chunk);
  }, [chunk, chunkPos, adjRegions, travel, attackMob, chaseMob, enterSettlement, setView]);

  const activatePrompt = useCallback(() => {
    setPrompt(cur => {
      if (!cur) return cur;
      if (cur.type === 'settlement') { enterSettlement(cur.data.id); setView('town'); }
      else if (cur.type === 'dungeon') { enterDungeon(cur.data); }
      return cur;
    });
  }, [enterSettlement, enterDungeon, setView]);

  useEffect(() => {
    const KEYS = {
      ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],
      w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],
      W:[0,-1],S:[0,1],A:[-1,0],D:[1,0],
    };
    function onKey(e) {
      if (showWorldMap) return;
      const dir = KEYS[e.key];
      if (dir) { e.preventDefault(); tryMove(dir[0], dir[1]); }
      if (e.key==='Enter'||e.key===' ') { e.preventDefault(); activatePrompt(); }
      if (e.key==='m'||e.key==='M') setShowWorldMap(v=>!v);
      if (e.key==='Tab') { e.preventDefault(); setShowLocalMap(v=>!v); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove, activatePrompt, showWorldMap]);

  useEffect(() => { containerRef.current?.focus(); }, []);

  const drawFrameRef = useRef(null);

  function drawFrame(canvas, ctx, currentPos) {
    if (!canvas||!ctx||!currentPos||!chunk) return;
    const vw=canvas.width, vh=canvas.height;
    const {width:W,height:H,tiles}=chunk;
    const {x:px,y:py}=currentPos;

    const rawCX=px*TS-vw/2+TS/2, rawCY=py*TS-vh/2+TS/2;
    const offX=Math.max(0,Math.min(rawCX,W*TS-vw));
    const offY=Math.max(0,Math.min(rawCY,H*TS-vh));

    ctx.clearRect(0,0,vw,vh);

    const tx0=Math.max(0,Math.floor(offX/TS));
    const tx1=Math.min(W-1,Math.ceil((offX+vw)/TS));
    const ty0=Math.max(0,Math.floor(offY/TS));
    const ty1=Math.min(H-1,Math.ceil((offY+vh)/TS));
    for(let ty=ty0;ty<=ty1;ty++) for(let tx=tx0;tx<=tx1;tx++)
      drawTile(ctx,tx,ty,tiles[ty][tx],tx*TS-offX,ty*TS-offY);

    const mob = chunkMobRef.current;
    if (mob && !mob.dead) {
      const msx = mob.x * TS - offX + TS / 2;
      const msy = mob.y * TS - offY + TS;
      const dist = Math.abs(mob.x - px) + Math.abs(mob.y - py);
      const isAdj = dist <= 1;

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(msx, msy - 2, TS / 3, 4, 0, 0, Math.PI * 2); ctx.fill();
      if (isAdj) { ctx.shadowColor = '#e04040'; ctx.shadowBlur = 22; }
      ctx.font = `${TS + 2}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(mob.emoji, msx, msy + 1);
      ctx.shadowBlur = 0;

      const barW = TS + 6, barH = 5;
      const barX = mob.x * TS - offX - 3;
      const barY = mob.y * TS - offY - 10;
      const hpPct = Math.max(0, mob.hp / mob.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = hpPct > 0.5 ? '#3cc840' : hpPct > 0.25 ? '#c8c040' : '#c84040';
      ctx.fillRect(barX, barY, Math.round(barW * hpPct), barH);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.5; ctx.strokeRect(barX, barY, barW, barH);

      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = isAdj ? '#ff9090' : 'rgba(255,190,190,0.85)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(mob.name, msx, barY - 1);
    }

    ctx.fillStyle='rgba(0,0,0,0.22)';
    ctx.beginPath();ctx.ellipse(px*TS-offX+TS/2,py*TS-offY+TS-2,TS/3,4,0,0,Math.PI*2);ctx.fill();
    ctx.shadowColor='#f0b030';ctx.shadowBlur=14;
    ctx.font=`${TS+4}px serif`;ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.fillText('🧙',px*TS-offX+TS/2,py*TS-offY+TS+1);
    ctx.shadowBlur=0;

    const p = playerRef.current;
    if (p) {
      const maxHP = getPlayerMaxHP(p);
      const hpPct = Math.max(0, p.hp.current / maxHP);
      const barW = 90, barH = 13;
      const bx = 8, by = vh - barH - 6;
      ctx.fillStyle = 'rgba(4,10,4,0.9)'; ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
      ctx.fillStyle = hpPct > 0.5 ? '#3cc840' : hpPct > 0.25 ? '#c8c040' : '#c84040';
      ctx.fillRect(bx, by, Math.round(barW * hpPct), barH);
      ctx.strokeStyle = 'rgba(200,160,60,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 1, by - 1, barW + 2, barH + 2);
      ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`♥ ${p.hp.current}/${maxHP}`, bx + barW / 2, by + barH / 2);
    }

    const now = Date.now();
    for (const f of damageFloatsRef.current) {
      const age = (now - f.born) / 1100;
      if (age >= 1) continue;
      const fsx = f.worldX * TS - offX + TS / 2;
      const fsy = f.worldY * TS - offY - age * 30;
      ctx.globalAlpha = 1 - age;
      ctx.font = `bold ${14 + Math.floor(age * 4)}px monospace`;
      ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 3;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.strokeText(f.text, fsx, fsy);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, fsx, fsy);
      ctx.globalAlpha = 1;
    }

  }

  drawFrameRef.current = drawFrame;

  useEffect(() => {
    const canvas=canvasRef.current, container=containerRef.current;
    if(!canvas||!container||!pos||!chunk) return;
    const vw=container.clientWidth||360, vh=container.clientHeight||480;
    if(canvas.width!==vw||canvas.height!==vh){canvas.width=vw;canvas.height=vh;}
    drawFrame(canvas, canvas.getContext('2d'), pos);
  }, [pos, chunk, world, player, chunkMob]);

  useEffect(() => {
    const container=containerRef.current;
    if(!container) return;
    const ro=new ResizeObserver(()=>{
      const canvas=canvasRef.current;
      if(!canvas) return;
      canvas.width=container.clientWidth||360;
      canvas.height=container.clientHeight||480;
      if(posRef.current) drawFrameRef.current(canvas,canvas.getContext('2d'),posRef.current);
    });
    ro.observe(container);
    return ()=>ro.disconnect();
  }, [chunk, world, player, chunkMob]);

  if (!currentRegion || !chunk) return null;

  const tInfo = TERRAIN_INFO[currentRegion.terrain] || TERRAIN_INFO.plains;
  const activeMob = chunkMob && !chunkMob.dead ? chunkMob : null;

  return (
    <div ref={containerRef} tabIndex={0} style={{ position:'relative', flex:1, overflow:'hidden', background:'#0a120a', outline:'none' }}>
      <canvas ref={canvasRef} style={{ display:'block' }} />

      <div style={{
        position:'absolute',top:0,left:0,right:0,
        padding:'5px 12px',
        background:'rgba(4,10,4,0.9)',
        borderBottom:'1px solid rgba(200,136,42,0.35)',
        display:'flex',alignItems:'center',gap:'8px',
        pointerEvents:'none',
      }}>
        <span style={{ fontFamily:'var(--font-title)',fontSize:'11px',color:'var(--ash-amber)',letterSpacing:'0.1em' }}>
          {tInfo.emoji} {currentRegion.name}
        </span>
        <span style={{ fontSize:'10px',color:'var(--ash-text-dim)' }}>›</span>
        <span style={{ fontFamily:'var(--font-title)',fontSize:'11px',color:'var(--ash-gold)' }}>{chunkName}</span>
        <span style={{ fontSize:'10px',color:'var(--ash-text-dim)' }}>
          [{chunkPos.x},{chunkPos.y}]
        </span>
        {chunk.special && (
          <span style={{ fontSize:'10px',color:chunk.special.type==='dungeon'?'#e06060':'var(--ash-amber)' }}>
            {chunk.special.type==='settlement'?'🏘️ ':'☠️ '}{chunk.special.data?.name}
          </span>
        )}
        {activeMob && (
          <span style={{ fontSize:'10px',color:'#e08080',marginLeft:'4px' }}>
            ⚔️ {activeMob.emoji} {activeMob.name} [{activeMob.hp}/{activeMob.maxHp}]
          </span>
        )}
        <span style={{ marginLeft:'auto',fontSize:'9px',color:'rgba(200,180,120,0.5)',pointerEvents:'none' }}>
          WASD move · bump enemy to attack
        </span>
      </div>

      {combatLog.length > 0 && (
        <div style={{
          position:'absolute', top:'34px', left:'8px',
          zIndex:15, pointerEvents:'none', maxWidth:'280px',
        }}>
          {combatLog.slice(0,4).map((msg,i) => (
            <div key={i} style={{
              background:'rgba(4,6,4,0.88)',
              borderLeft:`2px solid ${i===0?'#dd4444':'rgba(180,70,70,0.3)'}`,
              padding:'2px 8px', marginBottom:'1px',
              fontSize:'10px',
              color: i===0 ? '#ffaaaa' : 'rgba(220,160,160,0.6)',
              fontFamily:'var(--font-mono)',
              whiteSpace:'nowrap',
            }}>{msg}</div>
          ))}
        </div>
      )}

      {prompt && (
        <div style={{
          position:'absolute',bottom:'90px',left:'50%',transform:'translateX(-50%)',
          background:'rgba(4,10,4,0.95)',
          border:`1px solid ${prompt.type==='dungeon'?'var(--ash-crimson)':'var(--ash-amber)'}`,
          borderRadius:'8px',padding:'8px 16px',
          display:'flex',alignItems:'center',gap:'10px',
          whiteSpace:'nowrap',zIndex:10,
        }}>
          <span style={{ fontSize:'13px',color:'var(--ash-text)' }}>
            {prompt.type==='settlement'&&`🏘️ Enter ${prompt.data.name}`}
            {prompt.type==='dungeon'&&`☠️ Enter ${prompt.data.name}`}
            {prompt.type==='poi'&&`◆ ${prompt.data.name||'Point of Interest'}`}
          </span>
          {prompt.type!=='poi'&&(
            <button className="btn btn-primary btn-sm"
              style={{ fontSize:'10px',padding:'4px 10px',
                ...(prompt.type==='dungeon'?{background:'rgba(200,0,50,0.18)',borderColor:'rgba(200,0,50,0.5)',color:'#e06060'}:{}) }}
              onClick={activatePrompt}>
              Enter [↵]
            </button>
          )}
        </div>
      )}

      <div style={{ position:'absolute',bottom:'12px',left:'12px',display:'grid',gridTemplateColumns:'repeat(3,38px)',gridTemplateRows:'repeat(3,38px)',gap:'3px' }}>
        {[[null,[0,-1],null],[[-1,0],null,[1,0]],[null,[0,1],null]].flat().map((d,i)=>
          d?(
            <button key={i} onPointerDown={e=>{e.preventDefault();tryMove(d[0],d[1]);}}
              style={{ background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',cursor:'pointer',fontSize:'16px',color:'rgba(255,255,255,0.85)',userSelect:'none',touchAction:'none',display:'flex',alignItems:'center',justifyContent:'center' }}>
              {i===1?'↑':i===3?'←':i===5?'→':'↓'}
            </button>
          ):<div key={i}/>
        )}
      </div>

      <div style={{ position:'absolute',bottom:'12px',right:'12px',display:'flex',flexDirection:'column',gap:'6px',alignItems:'flex-end' }}>
        <button onClick={()=>setShowLocalMap(v=>!v)}
          style={{ background:'rgba(4,10,14,0.85)',border:`1px solid ${showLocalMap?'rgba(200,160,60,0.8)':'rgba(200,160,60,0.4)'}`,borderRadius:'8px',padding:'7px 12px',color:'#c8a840',fontFamily:'var(--font-title)',fontSize:'10px',letterSpacing:'0.08em',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px' }}>
          📍 AREA MAP [TAB]
        </button>
        <button onClick={()=>setShowWorldMap(true)}
          style={{ background:'rgba(4,10,14,0.85)',border:'1px solid rgba(200,160,60,0.4)',borderRadius:'8px',padding:'7px 12px',color:'#c8a840',fontFamily:'var(--font-title)',fontSize:'10px',letterSpacing:'0.08em',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px' }}>
          🗺️ WORLD MAP [M]
        </button>
      </div>

      {showLocalMap && currentRegion && (
        <div style={{
          position:'absolute',bottom:'110px',right:'12px',
          background:'rgba(4,10,16,0.97)',
          border:'1px solid rgba(200,160,60,0.6)',
          borderRadius:'10px',padding:'12px',
          zIndex:20,minWidth:'200px',
        }}>
          <div style={{ fontFamily:'var(--font-title)',fontSize:'10px',color:'var(--ash-amber)',letterSpacing:'0.12em',marginBottom:'10px',textAlign:'center' }}>
            {tInfo.emoji} {currentRegion.name} — LOCAL AREA
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'4px' }}>
            {Array.from({length:CHUNK_GRID*CHUNK_GRID},(_,i)=>{
              const cx=i%CHUNK_GRID, cy=Math.floor(i/CHUNK_GRID);
              const isCurrent=cx===chunkPos.x&&cy===chunkPos.y;
              const isFlash=flashChunk&&flashChunk.x===cx&&flashChunk.y===cy;
              const special=hexLayout[i];
              const name=getChunkName(currentRegion,cx,cy);
              const icon=special?.type==='settlement'?'🏘️':special?.type==='dungeon'?'☠️':special?.type==='poi'?'◆':null;
              return (
                <button key={i}
                  onClick={()=>{setChunkPos({x:cx,y:cy});setShowLocalMap(false);}}
                  style={{
                    background: isCurrent?'rgba(200,160,60,0.22)':isFlash?'rgba(100,180,255,0.22)':'rgba(255,255,255,0.04)',
                    border:`1px solid ${isCurrent?'rgba(200,160,60,0.8)':isFlash?'rgba(100,180,255,0.6)':'rgba(255,255,255,0.12)'}`,
                    borderRadius:'6px',padding:'6px 4px',cursor:'pointer',
                    display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',
                    transition:'all 0.15s',
                  }}>
                  <span style={{ fontSize:'11px' }}>{icon||'·'}</span>
                  <span style={{ fontSize:'7px',color:isCurrent?'var(--ash-gold)':'var(--ash-text-dim)',fontFamily:'var(--font-title)',letterSpacing:'0.04em',textAlign:'center',lineHeight:1.2 }}>
                    {name.split(' ').slice(0,2).join(' ')}
                  </span>
                  {isCurrent&&<span style={{ fontSize:'6px',color:'var(--ash-amber)' }}>YOU</span>}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop:'8px',fontSize:'9px',color:'var(--ash-text-dim)',textAlign:'center',fontFamily:'var(--font-mono)' }}>
            Click any area to teleport there
          </div>
          <button onClick={()=>setShowLocalMap(false)}
            style={{ position:'absolute',top:'6px',right:'8px',background:'none',border:'none',color:'var(--ash-text-dim)',cursor:'pointer',fontSize:'12px',padding:'2px 4px' }}>
            ✕
          </button>
        </div>
      )}

      {showWorldMap && (
        <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.92)',zIndex:50,display:'flex',flexDirection:'column',overflow:'hidden' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',background:'rgba(4,10,4,0.96)',borderBottom:'1px solid var(--ash-border)',flexShrink:0 }}>
            <span style={{ fontFamily:'var(--font-title)',fontSize:'12px',color:'var(--ash-amber)',letterSpacing:'0.12em' }}>
              🗺️ WORLD OVERVIEW
            </span>
            <button onClick={()=>setShowWorldMap(false)}
              style={{ background:'none',border:'1px solid var(--ash-border)',color:'var(--ash-text-dim)',cursor:'pointer',padding:'2px 8px',borderRadius:'4px',fontSize:'13px' }}>
              ✕ Close [M]
            </button>
          </div>
          <div style={{ flex:1,overflow:'hidden' }}><WorldMap /></div>
        </div>
      )}
    </div>
  );
}
