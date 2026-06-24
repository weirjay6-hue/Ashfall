import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import useGameStore from '../store/gameStore.js';
import { generateShopInterior, getShopTemplates, SHOP_WALKABLE, SHOP_NPC_INFO, ST } from '../engine/shopMap.js';
import { generateItem } from '../engine/items.js';
import { getSellPrice } from '../engine/economy.js';
import { RNG } from '../engine/rng.js';

const TS = 32;

// ─── Tile colours & renderer ─────────────────────────────────────────────────
const FLOOR_A = '#7a5530', FLOOR_B = '#6d4a28';

function drawShopTile(ctx, tx, ty, tile, sx, sy) {
  const h = (tx * 2053 + ty * 1009 + tile * 37) & 0xffff;

  switch (tile) {
    case ST.FLOOR: {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(sx, sy, TS, TS);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 0.5;
      if ((tx * 3 + ty) % 3 === 0) {
        ctx.beginPath(); ctx.moveTo(sx, sy + TS / 2); ctx.lineTo(sx + TS, sy + TS / 2); ctx.stroke();
      }
      if ((tx + ty * 5) % 4 === 0) {
        ctx.beginPath(); ctx.moveTo(sx + TS / 2, sy); ctx.lineTo(sx + TS / 2, sy + TS); ctx.stroke();
      }
      break;
    }
    case ST.FLOOR_STONE: {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#606058' : '#545450';
      ctx.fillRect(sx, sy, TS, TS);
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 2, sy + 2, TS - 4, TS - 4);
      break;
    }
    case ST.WALL: {
      const bh = Math.floor(TS / 2);
      ctx.fillStyle = '#2e2a26';
      ctx.fillRect(sx, sy, TS, TS);
      const offset = ty % 2 === 0 ? 0 : Math.floor(TS / 3);
      for (let row = 0; row <= 1; row++) {
        const bw = Math.floor(TS * 0.65);
        const bx = sx + ((offset + row * Math.floor(TS / 2)) % TS);
        const by = sy + row * bh;
        ctx.fillStyle = '#3e3a34';
        ctx.fillRect(bx - TS, by + 1, bw, bh - 2);
        ctx.fillRect(bx, by + 1, bw, bh - 2);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.4;
      ctx.strokeRect(sx, sy, TS, TS);
      break;
    }
    case ST.DOOR: {
      ctx.fillStyle = '#5a3410';
      ctx.fillRect(sx, sy, TS, TS);
      ctx.fillStyle = '#7a4a18';
      ctx.fillRect(sx + 4, sy + 2, TS - 8, TS - 4);
      ctx.fillStyle = '#9a6228';
      ctx.fillRect(sx + 7, sy + 5, TS - 14, TS - 8);
      ctx.fillStyle = '#f0c840';
      ctx.beginPath(); ctx.arc(sx + TS - 10, sy + TS / 2 + 1, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(255,220,100,0.7)'; ctx.fillText('EXIT', sx + TS / 2, sy + TS - 2);
      break;
    }
    case ST.COUNTER: {
      ctx.fillStyle = '#5a3010';
      ctx.fillRect(sx, sy, TS, TS);
      ctx.fillStyle = '#8a5220';
      ctx.fillRect(sx + 1, sy + 1, TS - 2, 12);
      ctx.fillStyle = '#b07030';
      ctx.fillRect(sx + 2, sy + 2, TS - 4, 9);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(sx, sy + 14, TS, TS - 14);
      ctx.strokeStyle = 'rgba(200,140,50,0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(sx, sy, TS, TS);
      break;
    }
    case ST.SHELF: {
      ctx.fillStyle = '#2e2a26';
      ctx.fillRect(sx, sy, TS, TS);
      ctx.fillStyle = '#6a4820';
      ctx.fillRect(sx + 1, sy + TS - 10, TS - 2, 4);
      ctx.fillRect(sx + 1, sy + TS - 20, TS - 2, 2);
      const ITEM_COLS = ['#e04040','#40a0e0','#40c060','#e0b020','#a040c0','#e06020'];
      const itemCount = 3 + (h % 3);
      const gap = Math.floor((TS - 6) / itemCount);
      for (let i = 0; i < itemCount; i++) {
        ctx.fillStyle = ITEM_COLS[(h + i * 7) % ITEM_COLS.length];
        const iw = Math.max(3, gap - 3);
        ctx.fillRect(sx + 3 + i * gap, sy + TS - 28, iw, 8);
        if (h % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(sx + 3 + i * gap, sy + TS - 28, 2, 3);
        }
      }
      break;
    }
    case ST.BARREL: {
      ctx.fillStyle = FLOOR_A;
      ctx.fillRect(sx, sy, TS, TS);
      const bx = sx + TS / 2, by = sy + TS / 2 + 2, br = TS / 2 - 5;
      ctx.fillStyle = '#6a4010';
      ctx.beginPath(); ctx.ellipse(bx, by, br, br - 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5820';
      ctx.beginPath(); ctx.ellipse(bx, by, br - 2, br - 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c09040'; ctx.lineWidth = 1.5;
      for (const oy of [-5, 0, 5]) {
        ctx.beginPath(); ctx.ellipse(bx, by + oy, br - 2, 2.5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#4a2808';
      ctx.beginPath(); ctx.ellipse(bx, sy + 6, br, 3, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case ST.CRATE: {
      ctx.fillStyle = FLOOR_A;
      ctx.fillRect(sx, sy, TS, TS);
      ctx.fillStyle = '#5a3820';
      ctx.fillRect(sx + 3, sy + 3, TS - 6, TS - 6);
      ctx.fillStyle = '#7a5030';
      ctx.fillRect(sx + 5, sy + 5, TS - 10, TS - 10);
      ctx.strokeStyle = '#4a2810'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx + 3, sy + 3); ctx.lineTo(sx + TS - 3, sy + TS - 3);
      ctx.moveTo(sx + TS - 3, sy + 3); ctx.lineTo(sx + 3, sy + TS - 3);
      ctx.stroke();
      break;
    }
    case ST.TABLE: {
      ctx.fillStyle = FLOOR_A;
      ctx.fillRect(sx, sy, TS, TS);
      ctx.fillStyle = '#8a6040';
      ctx.fillRect(sx + 2, sy + 4, TS - 4, TS / 2 - 2);
      ctx.fillStyle = '#a07850';
      ctx.fillRect(sx + 4, sy + 6, TS - 8, TS / 2 - 6);
      ctx.fillStyle = '#5a3820';
      ctx.fillRect(sx + 4, sy + TS / 2 + 2, 4, TS / 2 - 6);
      ctx.fillRect(sx + TS - 8, sy + TS / 2 + 2, 4, TS / 2 - 6);
      break;
    }
    case ST.CHAIR: {
      ctx.fillStyle = FLOOR_A;
      ctx.fillRect(sx, sy, TS, TS);
      ctx.fillStyle = '#7a5030';
      ctx.fillRect(sx + 4, sy + 6, TS - 8, TS / 2 - 4);
      ctx.fillStyle = '#5a3820';
      ctx.fillRect(sx + 4, sy + TS / 2 + 2, 4, TS / 2 - 8);
      ctx.fillRect(sx + TS - 8, sy + TS / 2 + 2, 4, TS / 2 - 8);
      ctx.fillRect(sx + 4, sy + TS - 8, TS - 8, 3);
      break;
    }
    case ST.STOOL: {
      ctx.fillStyle = FLOOR_A;
      ctx.fillRect(sx, sy, TS, TS);
      ctx.fillStyle = '#7a5030';
      ctx.beginPath(); ctx.ellipse(sx + TS / 2, sy + 10, TS / 2 - 6, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a3820';
      ctx.fillRect(sx + TS / 2 - 3, sy + 12, 6, TS - 18);
      break;
    }
    case ST.RUG: {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(sx, sy, TS, TS);
      ctx.fillStyle = '#7a1818';
      ctx.fillRect(sx + 1, sy + 1, TS - 2, TS - 2);
      ctx.fillStyle = '#a03030';
      ctx.fillRect(sx + 3, sy + 3, TS - 6, TS - 6);
      ctx.fillStyle = '#c04040';
      ctx.fillRect(sx + 6, sy + 6, TS - 12, TS - 12);
      ctx.fillStyle = 'rgba(255,200,60,0.25)';
      ctx.beginPath(); ctx.arc(sx + TS / 2, sy + TS / 2, 4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case ST.FORGE: {
      ctx.fillStyle = '#100808';
      ctx.fillRect(sx, sy, TS, TS);
      ctx.fillStyle = '#380c0c';
      ctx.fillRect(sx + 2, sy + 2, TS - 4, TS - 4);
      const glow = (Math.sin(Date.now() / 200 + tx) * 0.15 + 0.55);
      ctx.fillStyle = `rgba(255,70,0,${glow})`;
      ctx.beginPath(); ctx.ellipse(sx + TS / 2, sy + TS / 2 + 2, TS / 2 - 5, TS / 2 - 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,50,0.7)';
      ctx.beginPath(); ctx.ellipse(sx + TS / 2, sy + TS / 2 + 3, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case ST.ANVIL: {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(sx, sy, TS, TS);
      ctx.fillStyle = '#484848';
      ctx.fillRect(sx + 4, sy + TS / 2 - 2, TS - 8, 12);
      ctx.fillStyle = '#707070';
      ctx.fillRect(sx + 2, sy + TS / 2 - 9, TS - 4, 8);
      ctx.fillStyle = '#909090';
      ctx.fillRect(sx + 5, sy + TS / 2 - 12, TS - 10, 4);
      ctx.fillStyle = '#a0a0a0';
      ctx.fillRect(sx + 5, sy + TS / 2 - 13, 6, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(sx + 4, sy + TS / 2 - 12, TS - 8, 2);
      break;
    }
    default: {
      ctx.fillStyle = FLOOR_A;
      ctx.fillRect(sx, sy, TS, TS);
    }
  }
}

// ─── Local shop item generator ────────────────────────────────────────────────
function generateShopInventory(buildingType, settlement) {
  const templates = getShopTemplates(buildingType);
  const rng = new RNG((settlement?.id || 'shop') + buildingType);
  const count = Math.min(templates.length, { village: 4, town: 7, city: 12, fort: 6, ruins: 3 }[settlement?.type] || 6);
  const picked = rng.shuffle([...templates]).slice(0, count);
  return picked.map(id => {
    const item = generateItem(id, null, rng);
    if (!item) return null;
    return { item, price: Math.max(1, Math.floor((item.value || 10) * 1.25)) };
  }).filter(Boolean);
}

// ─── Trade Panel overlay ──────────────────────────────────────────────────────
function TradePanel({ npcInfo, buildingType, settlement, onClose }) {
  const player  = useGameStore(s => s.player);
  const buyItem = useGameStore(s => s.buyItem);
  const sellItem= useGameStore(s => s.sellItem);
  const restoreStamina = useGameStore(s => s.restoreStamina);

  const [tab, setTab] = useState('buy');
  const [flash, setFlash] = useState('');

  const shopItems = useMemo(() => generateShopInventory(buildingType, settlement), [buildingType, settlement?.id]);

  function handleBuy(entry) {
    if ((player?.gold ?? 0) < entry.price) { setFlash('Not enough gold!'); setTimeout(() => setFlash(''), 1800); return; }
    buyItem(entry.item, entry.price);
    setFlash(`Bought ${entry.item.name}!`);
    setTimeout(() => setFlash(''), 1800);
  }

  function handleSell(item, idx) {
    const price = Math.max(1, Math.floor(getSellPrice(item.value, settlement)));
    sellItem(idx);
    setFlash(`Sold ${item.name} for ${price}g`);
    setTimeout(() => setFlash(''), 1800);
  }

  const sellable = (player?.inventory || []).filter(it => it && it.value);

  const RARITY_COLOR = { common: '#ccc', uncommon: '#4ac04a', rare: '#4080e0', epic: '#a060e0', legendary: '#e0a020' };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 40,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--ash-dark)',
        border: '1px solid rgba(200,140,50,0.5)',
        borderRadius: '12px', width: '360px', maxWidth: '95vw',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(200,140,50,0.3)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '22px' }}>{npcInfo.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--ash-gold)', letterSpacing: '0.08em' }}>{npcInfo.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--ash-text-dim)', fontStyle: 'italic' }}>"{npcInfo.greeting}"</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0c830' }}>
            💰 {player?.gold ?? 0}g
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ash-text-dim)', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(200,140,50,0.2)', flexShrink: 0 }}>
          {['buy','sell'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px', background: tab === t ? 'rgba(200,140,50,0.12)' : 'transparent',
              border: 'none', borderBottom: tab === t ? '2px solid var(--ash-amber)' : '2px solid transparent',
              color: tab === t ? 'var(--ash-amber)' : 'var(--ash-text-dim)',
              fontFamily: 'var(--font-title)', fontSize: '11px', letterSpacing: '0.08em', cursor: 'pointer',
              textTransform: 'uppercase',
            }}>
              {t === 'buy' ? '🛒 Buy' : '💰 Sell'}
            </button>
          ))}
        </div>

        {/* Flash */}
        {flash && (
          <div style={{ padding: '6px 16px', background: 'rgba(200,140,50,0.15)', textAlign: 'center', fontSize: '11px', color: 'var(--ash-amber)', fontFamily: 'var(--font-mono)' }}>
            {flash}
          </div>
        )}

        {/* Item list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {tab === 'buy' && shopItems.length === 0 && (
            <div style={{ color: 'var(--ash-text-dim)', textAlign: 'center', padding: '24px', fontSize: '12px' }}>No items available.</div>
          )}
          {tab === 'buy' && shopItems.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', marginBottom: '4px',
              background: 'rgba(255,255,255,0.04)', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{entry.item.icon || '🗡️'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: RARITY_COLOR[entry.item.rarity] || '#ccc', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.item.name}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--ash-text-dim)' }}>
                  {entry.item.stats?.attack ? `⚔️${entry.item.stats.attack} ` : ''}
                  {entry.item.stats?.defense ? `🛡️${entry.item.stats.defense} ` : ''}
                  {entry.item.description?.slice(0, 40)}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', color: '#f0c830', fontFamily: 'var(--font-mono)' }}>{entry.price}g</div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '9px', padding: '2px 8px', marginTop: '2px', opacity: (player?.gold ?? 0) < entry.price ? 0.4 : 1 }}
                  onClick={() => handleBuy(entry)}
                >Buy</button>
              </div>
            </div>
          ))}

          {tab === 'sell' && sellable.length === 0 && (
            <div style={{ color: 'var(--ash-text-dim)', textAlign: 'center', padding: '24px', fontSize: '12px' }}>Nothing to sell.</div>
          )}
          {tab === 'sell' && sellable.map((item, idx) => {
            const realIdx = (player?.inventory || []).indexOf(item);
            const price = Math.max(1, Math.floor(getSellPrice(item.value, settlement)));
            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', marginBottom: '4px',
                background: 'rgba(255,255,255,0.04)', borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon || '🗡️'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: RARITY_COLOR[item.rarity] || '#ccc', fontWeight: 600 }}>{item.name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: '#f0c830', fontFamily: 'var(--font-mono)' }}>{price}g</div>
                  <button className="btn btn-sm" style={{ fontSize: '9px', padding: '2px 8px', marginTop: '2px' }} onClick={() => handleSell(item, realIdx)}>
                    Sell
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inn rest option */}
        {(buildingType === 'inn' || buildingType === 'tavern') && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(200,140,50,0.2)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '14px' }}>🛌</span>
            <div style={{ flex: 1, fontSize: '10px', color: 'var(--ash-text-dim)' }}>Rent a room — full HP/stamina restored</div>
            <div style={{ fontSize: '11px', color: '#f0c830', fontFamily: 'var(--font-mono)', marginRight: '6px' }}>10g</div>
            <button className="btn btn-primary btn-sm" style={{ fontSize: '9px' }}
              onClick={() => {
                if ((player?.gold ?? 0) < 10) { setFlash('Not enough gold!'); return; }
                buyItem({ id: 'rest', name: 'Room & Board' }, 10);
                restoreStamina?.(999);
                setFlash('You rest well. HP & stamina restored!');
                setTimeout(() => setFlash(''), 2500);
              }}>
              Rest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ShopView ────────────────────────────────────────────────────────────
export default function ShopView({ buildingType, buildingName, buildingIcon, settlement, onExit }) {
  const player    = useGameStore(s => s.player);
  const world     = useGameStore(s => s.world);

  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const posRef       = useRef(null);
  const moveLockRef  = useRef(false);
  const animRef      = useRef(null);
  const drawRef      = useRef(null);

  const interior = useMemo(() => generateShopInterior(buildingType), [buildingType]);
  const npcInfo  = SHOP_NPC_INFO[buildingType] || { name: 'Shopkeeper', emoji: '🧑‍💼', greeting: 'Welcome!' };

  const [pos,       setPos]       = useState(null);
  const [nearNPC,   setNearNPC]   = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [atDoor,    setAtDoor]    = useState(false);

  // Initialise player position
  useEffect(() => {
    const sp = interior.playerSpawn;
    posRef.current = { ...sp };
    setPos({ ...sp });
  }, [interior]);

  // ── Draw frame ──────────────────────────────────────────────────────────────
  function drawFrame(canvas, ctx, currentPos) {
    if (!canvas || !ctx || !currentPos) return;
    const { tiles, width: W, height: H, npcPos } = interior;
    const vw = canvas.width, vh = canvas.height;
    const totalW = W * TS, totalH = H * TS;
    const offX = Math.max(0, Math.min(currentPos.x * TS - vw / 2 + TS / 2, totalW - vw));
    const offY = Math.max(0, Math.min(currentPos.y * TS - vh / 2 + TS / 2, totalH - vh));

    ctx.clearRect(0, 0, vw, vh);

    // Tiles
    const tx0 = Math.max(0, Math.floor(offX / TS));
    const tx1 = Math.min(W - 1, Math.ceil((offX + vw) / TS));
    const ty0 = Math.max(0, Math.floor(offY / TS));
    const ty1 = Math.min(H - 1, Math.ceil((offY + vh) / TS));
    for (let ty = ty0; ty <= ty1; ty++)
      for (let tx = tx0; tx <= tx1; tx++)
        drawShopTile(ctx, tx, ty, tiles[ty][tx], tx * TS - offX, ty * TS - offY);

    // NPC
    const nsx = npcPos.x * TS - offX + TS / 2;
    const nsy = npcPos.y * TS - offY + TS;
    const dist = Math.abs(npcPos.x - currentPos.x) + Math.abs(npcPos.y - currentPos.y);
    const isClose = dist <= 2;
    if (isClose) { ctx.shadowColor = '#f0c840'; ctx.shadowBlur = 18; }
    ctx.font = `${TS + 4}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(npcInfo.emoji, nsx, nsy + 2);
    ctx.shadowBlur = 0;

    // NPC name label
    ctx.font = `bold 9px sans-serif`;
    ctx.fillStyle = isClose ? '#f0c840' : 'rgba(220,190,120,0.7)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(npcInfo.name, nsx, npcPos.y * TS - offY - 3);

    // Player
    ctx.shadowColor = '#a080f0'; ctx.shadowBlur = 14;
    ctx.font = `${TS + 4}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('🧙', currentPos.x * TS - offX + TS / 2, currentPos.y * TS - offY + TS + 2);
    ctx.shadowBlur = 0;

    // NPC speech bubble when close
    if (isClose && !showTrade) {
      const bx = nsx - 60, by = npcPos.y * TS - offY - 38;
      ctx.fillStyle = 'rgba(4,10,14,0.9)';
      ctx.beginPath();
      ctx.roundRect?.(bx, by, 120, 26, 6) ?? ctx.rect(bx, by, 120, 26);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,140,50,0.6)'; ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = '8px sans-serif'; ctx.fillStyle = 'rgba(240,200,120,0.9)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('[E] Trade / [Esc] Exit', nsx, by + 13);
    }

    // Player HP corner bar
    if (player) {
      const maxHP = player.stats?.hp || player.hp?.max || 50;
      const curHP = player.hp?.current ?? maxHP;
      const hpPct = Math.max(0, curHP / maxHP);
      const barW = 80, barH = 11, bx2 = 8, by2 = vh - barH - 8;
      ctx.fillStyle = 'rgba(4,6,4,0.9)'; ctx.fillRect(bx2 - 1, by2 - 1, barW + 2, barH + 2);
      ctx.fillStyle = hpPct > 0.5 ? '#3cc840' : hpPct > 0.25 ? '#c8c040' : '#c84040';
      ctx.fillRect(bx2, by2, Math.round(barW * hpPct), barH);
      ctx.strokeStyle = 'rgba(200,160,60,0.4)'; ctx.lineWidth = 1;
      ctx.strokeRect(bx2 - 1, by2 - 1, barW + 2, barH + 2);
      ctx.font = 'bold 8px monospace'; ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`♥ ${curHP}/${maxHP}`, bx2 + barW / 2, by2 + barH / 2);
    }

    // Gold display
    if (player) {
      ctx.font = '10px var(--font-mono, monospace)';
      ctx.fillStyle = '#f0c830';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(`💰 ${player.gold ?? 0}g`, vw - 8, vh - 8);
    }
  }

  drawRef.current = drawFrame;

  // Forge tile animation loop
  const hasForge = interior.tiles.some(row => row.some(t => t === ST.FORGE));
  useEffect(() => {
    if (!hasForge) return;
    const loop = () => {
      const canvas = canvasRef.current, container = containerRef.current;
      if (!canvas || !container || !posRef.current) return;
      const vw = container.clientWidth, vh = container.clientHeight;
      if (canvas.width !== vw || canvas.height !== vh) { canvas.width = vw; canvas.height = vh; }
      drawRef.current(canvas, canvas.getContext('2d'), posRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [hasForge]);

  // Static redraw
  useEffect(() => {
    if (hasForge) return;
    const canvas = canvasRef.current, container = containerRef.current;
    if (!canvas || !container || !pos) return;
    const vw = container.clientWidth || 400, vh = container.clientHeight || 500;
    if (canvas.width !== vw || canvas.height !== vh) { canvas.width = vw; canvas.height = vh; }
    drawRef.current(canvas, canvas.getContext('2d'), pos);
  }, [pos, player, showTrade, nearNPC, hasForge]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      if (posRef.current) drawRef.current(canvas, canvas.getContext('2d'), posRef.current);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [interior]);

  // ── Movement ────────────────────────────────────────────────────────────────
  const tryMove = useCallback((dx, dy) => {
    if (moveLockRef.current || !posRef.current || showTrade) return;
    moveLockRef.current = true;
    setTimeout(() => { moveLockRef.current = false; }, 90);

    const { tiles, width: W, height: H, npcPos, doorPos } = interior;
    const nx = posRef.current.x + dx;
    const ny = posRef.current.y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;

    // Block NPC tile
    if (nx === npcPos.x && ny === npcPos.y) return;

    const tile = tiles[ny]?.[nx];
    if (tile === ST.DOOR) {
      onExit();
      return;
    }
    if (!SHOP_WALKABLE.has(tile)) return;

    posRef.current = { x: nx, y: ny };
    setPos({ x: nx, y: ny });

    const dist = Math.abs(npcPos.x - nx) + Math.abs(npcPos.y - ny);
    setNearNPC(dist <= 2);
    setAtDoor(nx === doorPos.x && ny === doorPos.y);
  }, [interior, onExit, showTrade]);

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const KEYS = {
      ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],
      w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],
      W:[0,-1],S:[0,1],A:[-1,0],D:[1,0],
    };
    function onKey(e) {
      const dir = KEYS[e.key];
      if (dir) { e.preventDefault(); tryMove(dir[0], dir[1]); return; }
      if ((e.key === 'Enter' || e.key === 'e' || e.key === 'E') && nearNPC) {
        e.preventDefault(); setShowTrade(true); return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showTrade) { setShowTrade(false); } else { onExit(); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove, nearNPC, showTrade, onExit]);

  useEffect(() => { containerRef.current?.focus(); }, []);

  return (
    <div ref={containerRef} tabIndex={0}
      style={{ position: 'relative', flex: 1, overflow: 'hidden', background: '#1a1008', outline: 'none' }}>

      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '5px 12px',
        background: 'rgba(4,4,4,0.92)',
        borderBottom: '1px solid rgba(200,140,50,0.35)',
        display: 'flex', alignItems: 'center', gap: '10px',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: '16px' }}>{buildingIcon}</span>
        <span style={{ fontFamily: 'var(--font-title)', fontSize: '12px', color: 'var(--ash-gold)', letterSpacing: '0.1em' }}>
          {buildingName}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--ash-text-dim)', marginLeft: '4px' }}>
          — {npcInfo.name} is inside
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'rgba(200,180,120,0.45)' }}>
          WASD move · approach {npcInfo.name} to trade · E/Esc
        </span>
      </div>

      {/* Back button */}
      <div style={{ position: 'absolute', top: '36px', left: '8px', zIndex: 20 }}>
        <button className="btn btn-ghost btn-sm"
          style={{ fontSize: '10px', padding: '3px 10px', background: 'rgba(4,4,4,0.8)' }}
          onClick={onExit}>
          ← Town Map
        </button>
      </div>

      {/* Trade prompt badge */}
      {nearNPC && !showTrade && (
        <div style={{
          position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(4,10,4,0.96)', border: '1px solid rgba(200,140,50,0.7)',
          borderRadius: '8px', padding: '8px 18px',
          display: 'flex', alignItems: 'center', gap: '10px',
          zIndex: 15, whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '14px' }}>{npcInfo.emoji}</span>
          <span style={{ fontSize: '11px', color: 'var(--ash-text)' }}>
            {npcInfo.name} — <em style={{ color: 'var(--ash-text-dim)' }}>"{npcInfo.greeting.slice(0, 38)}"</em>
          </span>
          <button className="btn btn-primary btn-sm"
            style={{ fontSize: '10px', padding: '4px 12px' }}
            onClick={() => setShowTrade(true)}>
            Trade [E]
          </button>
        </div>
      )}

      {/* D-pad */}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'grid', gridTemplateColumns: 'repeat(3,38px)', gridTemplateRows: 'repeat(3,38px)', gap: '3px', zIndex: 10 }}>
        {[[null,[0,-1],null],[[-1,0],null,[1,0]],[null,[0,1],null]].flat().map((d, i) =>
          d ? (
            <button key={i} onPointerDown={e => { e.preventDefault(); tryMove(d[0], d[1]); }}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', color: 'rgba(255,255,255,0.85)', userSelect: 'none', touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {i === 1 ? '↑' : i === 3 ? '←' : i === 5 ? '→' : '↓'}
            </button>
          ) : <div key={i} />
        )}
      </div>

      {/* Trade modal */}
      {showTrade && (
        <TradePanel
          npcInfo={npcInfo}
          buildingType={buildingType}
          settlement={settlement}
          onClose={() => setShowTrade(false)}
        />
      )}
    </div>
  );
}
