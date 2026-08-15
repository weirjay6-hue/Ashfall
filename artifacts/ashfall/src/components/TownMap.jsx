import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { generateTownMap, T, WALKABLE, getNPCEmoji } from '../engine/townMap.js';

const TS = 32;

const TILE_COLOR = {
  [T.GRASS]:    '#3a6828',
  [T.PATH]:     '#9a7040',
  [T.COBBLE]:   '#706858',
  [T.WALL]:     '#3e2810',
  [T.DOOR]:     '#c07820',
  [T.TREE]:     '#1c4010',
  [T.WATER]:    '#184878',
  [T.FENCE]:    '#6a5020',
  [T.FOUNTAIN]: '#2060a0',
  [T.WELL]:     '#604838',
  [T.BENCH]:    '#7a5830',
  [T.FLOWER]:   '#3a6828',
};

export default function TownMap({ settlement, onEnterBuilding, onExitTown, onTalkToNPC, onOpenWagon, entryDirection }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const posRef = useRef(null);
  const moveLockRef = useRef(false);
  const [pos, setPos] = useState(null);
  const [prompt, setPrompt] = useState(null);

  const map = useMemo(() => generateTownMap(settlement), [settlement.id]);

  useEffect(() => {
    // Spawn player at south entrance by default, or north if entering from north
    const startPos = entryDirection === 'north'
      ? (map.northEntry || { x: Math.floor(map.width / 2), y: 2 })
      : map.playerStart;
    posRef.current = { ...startPos };
    setPos({ ...startPos });
    setPrompt(null);
  }, [map, entryDirection]);

  function getNearbyNPC(px, py) {
    for (const house of map.houses) {
      if (!house.npc || house.npc.deceased) continue;
      const npcX = house.doorX;
      const npcY = house.doorY + 1;
      const dist = Math.abs(px - npcX) + Math.abs(py - npcY);
      if (dist <= 1) return house.npc;
    }
    return null;
  }

  function checkInteraction(px, py) {
    const { tiles, buildings, houses, height: H, wagon } = map;
    const tile = tiles[py]?.[px];
    if (tile === T.DOOR) {
      const b = [...buildings, ...houses].find(b => b.doorX === px && b.doorY === py);
      if (b) { setPrompt({ type: b.kind, data: b }); return; }
    }
    if (wagon && Math.abs(px - wagon.x) + Math.abs(py - wagon.y) <= 2) {
      setPrompt({ type: 'wagon' }); return;
    }
    if (py >= H - 2) { onExitTown(); return; }
    if (py >= H - 3) { setPrompt({ type: 'exit' }); return; }
    const nearbyNPC = getNearbyNPC(px, py);
    if (nearbyNPC) {
      setPrompt({ type: 'npc', data: nearbyNPC });
      return;
    }
    setPrompt(null);
  }

  const tryMove = useCallback((dx, dy) => {
    if (moveLockRef.current || !posRef.current) return;
    moveLockRef.current = true;
    setTimeout(() => { moveLockRef.current = false; }, 115);
    const { tiles, width: W, height: H } = map;
    const nx = posRef.current.x + dx;
    const ny = posRef.current.y + dy;

    // Walking off bottom edge exits town immediately
    if (ny >= H - 1) {
      onExitTown();
      return;
    }
    // Walking off top edge — wrap to south entrance of adjacent area (exit north)
    if (ny < 1) {
      onExitTown('north');
      return;
    }
    // Horizontal boundary
    if (nx < 1 || nx >= W - 1) return;
    if (!WALKABLE.has(tiles[ny]?.[nx])) return;

    posRef.current = { x: nx, y: ny };
    setPos({ x: nx, y: ny });
    checkInteraction(nx, ny);
  }, [map, onExitTown]);

  const activatePromptRef = useRef(null);
  activatePromptRef.current = (p) => {
    if (!p) return;
    if (p.type === 'building' || p.type === 'house') onEnterBuilding(p.data);
    else if (p.type === 'exit') onExitTown();
    else if (p.type === 'npc' && onTalkToNPC) onTalkToNPC(p.data);
    else if (p.type === 'wagon' && onOpenWagon) onOpenWagon();
  };

  useEffect(() => {
    const KEYS = {
      ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
      w: [0,-1], s: [0,1], a: [-1,0], d: [1,0],
      W: [0,-1], S: [0,1], A: [-1,0], D: [1,0],
    };
    function onKey(e) {
      const d = KEYS[e.key];
      if (d) { e.preventDefault(); tryMove(d[0], d[1]); }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setPrompt(cur => { activatePromptRef.current(cur); return cur; });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove]);

  function getOffsets(canvas, currentPos) {
    const vw = canvas.width;
    const vh = canvas.height;
    const { width: W, height: H } = map;
    const { x: px, y: py } = currentPos;
    const rawCX = px * TS - vw / 2 + TS / 2;
    const rawCY = py * TS - vh / 2 + TS / 2;
    const offX = Math.max(0, Math.min(rawCX, W * TS - vw));
    const offY = Math.max(0, Math.min(rawCY, H * TS - vh));
    return { offX, offY };
  }

  function handleCanvasClick(e) {
    const canvas = canvasRef.current;
    if (!canvas || !posRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const { offX, offY } = getOffsets(canvas, posRef.current);
    const tileX = Math.floor((clickX + offX) / TS);
    const tileY = Math.floor((clickY + offY) / TS);

    for (const house of map.houses) {
      if (!house.npc || house.npc.deceased) continue;
      const npcX = house.doorX;
      const npcY = house.doorY + 1;
      if (Math.abs(tileX - npcX) <= 1 && Math.abs(tileY - npcY) <= 1) {
        if (onTalkToNPC) onTalkToNPC(house.npc);
        return;
      }
    }

    const allStructures = [...map.buildings, ...map.houses];
    const tile = map.tiles[tileY]?.[tileX];
    if (tile === T.DOOR) {
      const b = allStructures.find(b => b.doorX === tileX && b.doorY === tileY);
      if (b) { onEnterBuilding(b); return; }
    }
    if (tileY >= map.height - 3) { onExitTown(); return; }
  }

  function drawFrame(canvas, ctx, currentPos) {
    if (!canvas || !ctx || !currentPos) return;
    const vw = canvas.width;
    const vh = canvas.height;
    const { width: W, height: H, tiles, buildings, houses, decorations = [] } = map;
    const allStructures = [...buildings, ...houses];
    const { x: px, y: py } = currentPos;

    const { offX, offY } = getOffsets(canvas, currentPos);

    ctx.clearRect(0, 0, vw, vh);

    const tx0 = Math.max(0, Math.floor(offX / TS));
    const tx1 = Math.min(W - 1, Math.ceil((offX + vw) / TS));
    const ty0 = Math.max(0, Math.floor(offY / TS));
    const ty1 = Math.min(H - 1, Math.ceil((offY + vh) / TS));

    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const tile = tiles[ty][tx];
        const sx = tx * TS - offX;
        const sy = ty * TS - offY;

        ctx.fillStyle = TILE_COLOR[tile] || '#3a6828';
        ctx.fillRect(sx, sy, TS, TS);

        if (tile === T.GRASS) {
          if ((tx * 3 + ty * 7) % 9 === 0) {
            ctx.fillStyle = 'rgba(60,100,30,0.3)';
            ctx.fillRect(sx + 5, sy + 7, 2, 5);
            ctx.fillRect(sx + 14, sy + 3, 2, 6);
            ctx.fillRect(sx + 22, sy + 9, 2, 4);
          }
          if ((tx * 5 + ty * 11) % 13 === 0) {
            ctx.fillStyle = 'rgba(80,130,40,0.2)';
            ctx.fillRect(sx + 9, sy + 13, 2, 4);
            ctx.fillRect(sx + 20, sy + 5, 2, 5);
          }
        } else if (tile === T.PATH) {
          if ((tx + ty) % 2 === 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(sx + 4, sy + 4, TS - 8, TS - 8);
          }
          ctx.fillStyle = 'rgba(255,255,200,0.05)';
          ctx.fillRect(sx + 2, sy + 2, 5, 2);
        } else if (tile === T.COBBLE) {
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.fillRect(sx + 2, sy + 2, TS/2 - 4, TS/2 - 4);
          ctx.fillRect(sx + TS/2 + 2, sy + TS/2 + 2, TS/2 - 4, TS/2 - 4);
          ctx.strokeStyle = 'rgba(0,0,0,0.18)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(sx + 2, sy + 2, TS/2 - 4, TS/2 - 4);
          ctx.strokeRect(sx + TS/2 + 2, sy + TS/2 + 2, TS/2 - 4, TS/2 - 4);
        } else if (tile === T.TREE) {
          ctx.fillStyle = '#1a3e0e';
          ctx.beginPath();
          ctx.arc(sx + TS/2, sy + TS/2, TS/2 - 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2e5e1c';
          ctx.beginPath();
          ctx.arc(sx + TS/2, sy + TS/2 - 4, TS/2 - 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4a3010';
          ctx.fillRect(sx + TS/2 - 2, sy + TS - 6, 4, 5);
        } else if (tile === T.DOOR) {
          ctx.fillStyle = '#7a4008';
          ctx.fillRect(sx + 6, sy + 4, TS - 12, TS - 7);
          ctx.fillStyle = '#d09020';
          ctx.fillRect(sx + 8, sy + 6, TS - 16, TS - 11);
          ctx.fillStyle = '#f0d040';
          ctx.beginPath();
          ctx.arc(sx + TS/2 + 5, sy + TS/2 + 1, 2, 0, Math.PI * 2);
          ctx.fill();
          if (px === tx && py === ty) {
            ctx.strokeStyle = '#ffee44';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#ffee44';
            ctx.shadowBlur = 6;
            ctx.strokeRect(sx + 2, sy + 2, TS - 4, TS - 4);
            ctx.shadowBlur = 0;
          }
        } else if (tile === T.WALL) {
          const row = ty % 2;
          const half = TS / 2;
          const off = row * (half / 2);
          ctx.fillStyle = 'rgba(0,0,0,0.14)';
          for (let bx2 = -half / 2; bx2 < TS; bx2 += half) {
            ctx.fillRect(sx + bx2 + off + 1, sy + 1, half - 2, TS - 2);
          }
        } else if (tile === T.FOUNTAIN) {
          // Fountain basin
          ctx.fillStyle = '#1e6090';
          ctx.beginPath();
          ctx.arc(sx + TS/2, sy + TS/2, TS/2 - 3, 0, Math.PI * 2);
          ctx.fill();
          // Water shimmer
          ctx.fillStyle = 'rgba(80,180,255,0.5)';
          ctx.beginPath();
          ctx.arc(sx + TS/2, sy + TS/2, TS/2 - 7, 0, Math.PI * 2);
          ctx.fill();
          // Center spout
          ctx.fillStyle = '#a0d8ff';
          ctx.beginPath();
          ctx.arc(sx + TS/2, sy + TS/2 - 2, 3, 0, Math.PI * 2);
          ctx.fill();
          // Rim
          ctx.strokeStyle = '#3080b8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sx + TS/2, sy + TS/2, TS/2 - 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (tile === T.WELL) {
          // Well base
          ctx.fillStyle = '#5a3c24';
          ctx.fillRect(sx + 6, sy + 10, TS - 12, TS - 14);
          // Well opening
          ctx.fillStyle = '#1a1a2a';
          ctx.beginPath();
          ctx.ellipse(sx + TS/2, sy + 10, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          // Rim
          ctx.strokeStyle = '#8a6040';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx + 6, sy + 10, TS - 12, TS - 14);
          // Rope post
          ctx.fillStyle = '#7a5830';
          ctx.fillRect(sx + TS/2 - 1, sy + 4, 2, 8);
        } else if (tile === T.BENCH) {
          ctx.fillStyle = '#8a6030';
          ctx.fillRect(sx + 4, sy + TS/2 - 2, TS - 8, 5);
          ctx.fillRect(sx + 4, sy + TS/2 + 5, 4, 6);
          ctx.fillRect(sx + TS - 8, sy + TS/2 + 5, 4, 6);
          ctx.fillStyle = '#6a4820';
          ctx.fillRect(sx + 4, sy + TS/2 - 5, TS - 8, 3);
        } else if (tile === T.FLOWER) {
          // Draw as grass + flowers on top
          if ((tx * 3 + ty * 7) % 9 === 0) {
            ctx.fillStyle = 'rgba(60,100,30,0.3)';
            ctx.fillRect(sx + 5, sy + 7, 2, 5);
          }
          ctx.font = '10px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const flowerEmojis = ['🌸','🌼','🌺','🌻'];
          const fIdx = (tx * 3 + ty * 7) % flowerEmojis.length;
          ctx.fillText(flowerEmojis[fIdx], sx + TS/2, sy + TS/2);
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.07)';
        ctx.lineWidth = 0.3;
        ctx.strokeRect(sx, sy, TS, TS);
      }
    }

    // Draw buildings
    for (const b of allStructures) {
      const bsx = b.x * TS - offX;
      const bsy = b.y * TS - offY;
      const bsw = b.w * TS;
      const roofH = (b.h - 1) * TS;
      if (bsx + bsw < -TS || bsx > vw + TS || bsy + roofH < -TS || bsy > vh + TS) continue;

      ctx.fillStyle = b.roofHex;
      ctx.fillRect(bsx, bsy, bsw, roofH);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(bsx, bsy, bsw, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(bsx, bsy + roofH - 5, bsw, 5);
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bsx, bsy, bsw, roofH);

      if (b.w >= 3) {
        const winY = bsy + Math.max(4, Math.floor(roofH / 2) - 4);
        const winH = Math.min(9, roofH - 8);
        ctx.fillStyle = 'rgba(255,220,80,0.65)';
        ctx.fillRect(bsx + 7, winY, 7, winH);
        if (b.w >= 4) ctx.fillRect(bsx + bsw - 14, winY, 7, winH);
        ctx.strokeStyle = 'rgba(80,40,0,0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bsx + 7, winY, 7, winH);
        if (b.w >= 4) ctx.strokeRect(bsx + bsw - 14, winY, 7, winH);
      }

      ctx.font = `${Math.min(TS - 2, 22)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.icon, bsx + bsw / 2, bsy + roofH / 2);

      if (roofH >= 24) {
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = 'rgba(255,248,220,0.88)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(b.name, bsx + bsw / 2, bsy + roofH - 5);
      }
    }

    // Fountain/well labels
    for (const dec of decorations) {
      const dsx = dec.x * TS - offX;
      const dsy = dec.y * TS - offY;
      if (dsx < -TS || dsx > vw + TS || dsy < -TS || dsy > vh + TS) continue;
      if (dec.type === 'fountain') {
        ctx.font = '10px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(160,210,255,0.85)';
        ctx.fillText('⛲', dsx + TS/2, dsy + TS/2 + 6);
      }
    }

    // NPCs
    for (const house of houses) {
      if (!house.npc || house.npc.deceased) continue;
      const npcX = house.doorX;
      const npcY = house.doorY + 1;
      const nsx = npcX * TS - offX + TS / 2;
      const nsy = npcY * TS - offY;
      if (nsx < -TS || nsx > vw + TS || nsy < -TS || nsy > vh + TS) continue;

      const isNearby = (Math.abs(px - npcX) + Math.abs(py - npcY)) <= 1;

      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(nsx, nsy + TS - 4, TS / 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isNearby) { ctx.shadowColor = '#a0c8ff'; ctx.shadowBlur = 12; }
      ctx.font = `${TS - 4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(getNPCEmoji(house.npc.occupation), nsx, nsy + TS - 2);
      ctx.shadowBlur = 0;

      ctx.font = '8px sans-serif';
      ctx.fillStyle = isNearby ? 'rgba(180,210,255,0.95)' : 'rgba(255,250,210,0.85)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(house.npc.name, nsx, nsy - 1);

      if (isNearby) { ctx.font = '11px serif'; ctx.fillText('💬', nsx + 14, nsy - 10); }
    }

    // Wagon
    if (map.wagon) {
      const { x: wx, y: wy } = map.wagon;
      const wsx = wx * TS - offX;
      const wsy = wy * TS - offY;
      const isNear = (Math.abs(px - wx) + Math.abs(py - wy)) <= 2;
      if (isNear) { ctx.shadowColor = '#f0d060'; ctx.shadowBlur = 16; }
      ctx.font = `${TS + 8}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('🪵', wsx + TS / 2, wsy + TS - 1);
      ctx.font = `${TS - 2}px serif`;
      ctx.fillText('🐴', wsx - TS / 2 + TS / 2, wsy + TS - 1);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = isNear ? '#f0d060' : 'rgba(255,240,160,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('WAGON', wsx + TS / 2, wsy - 2);
    }

    // Player
    const psx = px * TS - offX;
    const psy = py * TS - offY;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(psx + TS / 2, psy + TS - 3, TS / 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#f0b030';
    ctx.shadowBlur = 12;
    ctx.font = `${TS + 4}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('🧙', psx + TS / 2, psy + TS);
    ctx.shadowBlur = 0;

    // Exit indicator at bottom
    if (py >= map.height - 5) {
      ctx.fillStyle = 'rgba(255,200,80,0.25)';
      ctx.fillRect(0, vh - 18, vw, 18);
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = 'rgba(255,220,120,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▼ Walk south to leave town', vw / 2, vh - 9);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !pos) return;
    const vw = container.clientWidth;
    const vh = container.clientHeight;
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw || 360;
      canvas.height = vh || 480;
    }
    const ctx = canvas.getContext('2d');
    drawFrame(canvas, ctx, pos);
  }, [pos, map]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = container.clientWidth || 360;
      canvas.height = container.clientHeight || 480;
      if (posRef.current) {
        const ctx = canvas.getContext('2d');
        drawFrame(canvas, ctx, posRef.current);
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  function handlePromptAction() {
    setPrompt(cur => { activatePromptRef.current(cur); return cur; });
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{ position: 'relative', flex: 1, overflow: 'hidden', background: '#0a120a', outline: 'none' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: 'pointer' }}
        onClick={handleCanvasClick}
      />

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '5px 12px',
        background: 'rgba(4,10,4,0.88)',
        borderBottom: '1px solid rgba(200,136,42,0.35)',
        display: 'flex', alignItems: 'center', gap: '8px',
        pointerEvents: 'none',
      }}>
        <span style={{ fontFamily: 'var(--font-title)', fontSize: '14px', color: 'var(--ash-gold)' }}>
          {settlement.name}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--ash-text-dim)', textTransform: 'capitalize' }}>
          · {settlement.type}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'rgba(200,180,120,0.5)' }}>
          WASD / ↑↓←→ · ENTER or tap to interact
        </span>
      </div>

      {prompt && prompt.type !== 'exit' && (
        <div style={{
          position: 'absolute', bottom: '78px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(4,10,4,0.94)',
          border: `1px solid ${prompt.type === 'npc' ? '#7aabff' : 'var(--ash-amber)'}`,
          borderRadius: '8px', padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
          whiteSpace: 'nowrap', zIndex: 10,
          boxShadow: prompt.type === 'npc'
            ? '0 0 14px rgba(80,140,255,0.28)'
            : '0 0 12px rgba(200,136,42,0.3)',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--ash-text)' }}>
            {prompt.type === 'building' && `${prompt.data.icon} Enter ${prompt.data.name}`}
            {prompt.type === 'house' && `🚪 ${prompt.data.name}`}
            {prompt.type === 'npc' && `💬 Talk to ${prompt.data.name}`}
            {prompt.type === 'wagon' && '🐴 Wagon Driver — Fast Travel'}
          </span>
          <button
            className="btn btn-primary btn-sm"
            style={{
              fontSize: '10px', padding: '4px 10px',
              ...(prompt.type === 'npc' ? { background: 'rgba(80,140,255,0.18)', borderColor: 'rgba(80,140,255,0.5)', color: '#8ab8ff' } : {}),
              ...(prompt.type === 'wagon' ? { background: 'rgba(200,160,40,0.22)', borderColor: 'rgba(200,160,40,0.6)', color: '#f0d060' } : {}),
            }}
            onClick={handlePromptAction}
          >
            {prompt.type === 'npc' ? 'Talk' : prompt.type === 'wagon' ? 'Book' : 'Enter'} [↵]
          </button>
        </div>
      )}

      {/* D-pad */}
      <div style={{
        position: 'absolute', bottom: '12px', left: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 40px)',
        gridTemplateRows: 'repeat(3, 40px)',
        gap: '3px',
      }}>
        {[
          [null,    [0,-1], null   ],
          [[-1,0],  null,   [1,0]  ],
          [null,    [0,1],  null   ],
        ].flat().map((d, i) =>
          d ? (
            <button
              key={i}
              onPointerDown={e => { e.preventDefault(); tryMove(d[0], d[1]); }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px',
                color: 'rgba(255,255,255,0.85)',
                userSelect: 'none',
                touchAction: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {i === 1 ? '↑' : i === 3 ? '←' : i === 5 ? '→' : '↓'}
            </button>
          ) : (
            <div key={i} />
          )
        )}
      </div>

      {prompt?.type === 'npc' && (
        <button
          onClick={handlePromptAction}
          style={{
            position: 'absolute', bottom: '12px', right: '12px',
            background: 'rgba(80,140,255,0.18)',
            border: '1px solid rgba(80,140,255,0.5)',
            borderRadius: '10px',
            padding: '10px 18px',
            color: '#8ab8ff',
            fontFamily: 'var(--font-title)',
            fontSize: '12px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 0 10px rgba(80,140,255,0.2)',
          }}
        >
          💬 TALK
        </button>
      )}
    </div>
  );
}
