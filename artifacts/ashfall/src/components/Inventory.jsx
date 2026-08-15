import React, { useState, useMemo } from 'react';
import useGameStore from '../store/gameStore.js';
import { getCarryWeight } from '../engine/player.js';
import { getSellPrice } from '../engine/economy.js';

const RARITY_COLOR = {
  common: '#808080', uncommon: '#60a860', rare: '#5890d8',
  epic: '#9858c8', legendary: '#e8a030', mythic: '#ff4488', unique: '#ff8844',
};
const RARITY_BG = {
  common: 'rgba(80,80,80,0.1)', uncommon: 'rgba(96,168,96,0.1)',
  rare: 'rgba(88,144,216,0.1)', epic: 'rgba(152,88,200,0.1)',
  legendary: 'rgba(232,160,48,0.12)', mythic: 'rgba(255,68,136,0.12)',
  unique: 'rgba(255,136,68,0.12)',
};
const RARITY_ORDER = { mythic: 6, legendary: 5, unique: 4, epic: 3, rare: 2, uncommon: 1, common: 0 };

const SLOT_LAYOUT = [
  { slot: 'helmet',   label: 'Head',    icon: '⛑' },
  { slot: 'necklace', label: 'Neck',    icon: '📿' },
  { slot: 'chest',    label: 'Chest',   icon: '🥻' },
  { slot: 'gloves',   label: 'Hands',   icon: '🧤' },
  { slot: 'belt',     label: 'Belt',    icon: '🪡' },
  { slot: 'legs',     label: 'Legs',    icon: '👖' },
  { slot: 'boots',    label: 'Feet',    icon: '👢' },
  { slot: 'mainHand', label: 'Main',    icon: '⚔️' },
  { slot: 'offHand',  label: 'Off',     icon: '🛡️' },
  { slot: 'ring1',    label: 'Ring',    icon: '💍' },
  { slot: 'ring2',    label: 'Ring 2',  icon: '💍' },
  { slot: 'trinket',  label: 'Trinket', icon: '⭐' },
];

const FILTER_TABS = [
  { id: 'all',         label: 'All',         icon: '📦' },
  { id: 'weapon',      label: 'Weapons',     icon: '⚔️' },
  { id: 'armor',       label: 'Armor',       icon: '🛡️' },
  { id: 'consumable',  label: 'Consumables', icon: '🧪' },
  { id: 'material',    label: 'Materials',   icon: '🪨' },
  { id: 'misc',        label: 'Misc',        icon: '🎲' },
];

export default function Inventory() {
  const player      = useGameStore(s => s.player);
  const equipItem   = useGameStore(s => s.equipItem);
  const unequipItem = useGameStore(s => s.unequipItem);
  const useConsumable = useGameStore(s => s.useConsumable);
  const dropItem    = useGameStore(s => s.dropItem);
  const sellItem    = useGameStore(s => s.sellItem);

  const [tab,          setTab]          = useState('items');
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy,       setSortBy]       = useState('rarity');
  const [hoveredSlot,  setHoveredSlot]  = useState(null);

  if (!player) return null;

  const weight    = getCarryWeight(player);
  const weightPct = Math.min(100, (weight.current / weight.max) * 100);
  const tradingLevel = player.skills?.trading?.level || 5;

  const filteredInventory = useMemo(() => {
    let items = player.inventory.filter(item => {
      if (filter !== 'all') {
        if (filter === 'misc') return !['weapon','armor','consumable','material'].includes(item.type);
        if (item.type !== filter) return false;
      }
      if (search) {
        return item.name?.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
    if (sortBy === 'rarity') {
      items = [...items].sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0));
    } else if (sortBy === 'value') {
      items = [...items].sort((a, b) => (b.value || 0) - (a.value || 0));
    } else if (sortBy === 'name') {
      items = [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'weight') {
      items = [...items].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    }
    return items;
  }, [player.inventory, filter, search, sortBy]);

  function handleAction(action, item) {
    if (!item) return;
    const it = item || selectedItem;
    if (action === 'equip')   equipItem(it.uid);
    if (action === 'unequip') unequipItem(it.slot);
    if (action === 'use')     useConsumable(it.uid);
    if (action === 'drop')    dropItem(it.uid);
    if (action === 'sell') {
      const price = getSellPrice(it.value || 10, tradingLevel);
      sellItem(it.uid, price);
    }
    setSelectedItem(null);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0a12' }}>

      {/* ── Header ── */}
      <div style={{ padding: '8px 12px', background: '#0c0c18', borderBottom: '1px solid #1c1c28', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#c8882a', letterSpacing: '0.15em', fontWeight: 'bold' }}>
            🎒 INVENTORY
          </span>
          <div style={{ flex: 1 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              style={{
                width: '100%', padding: '3px 8px', background: '#080810',
                border: '1px solid #1c1c28', borderRadius: '3px',
                color: '#a0a0b0', fontSize: '11px', fontFamily: 'monospace', outline: 'none',
              }}
            />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: '2px 6px', background: '#080810', border: '1px solid #1c1c28',
            color: '#808090', fontSize: '10px', borderRadius: '3px', fontFamily: 'monospace',
          }}>
            <option value="rarity">Sort: Rarity</option>
            <option value="value">Sort: Value</option>
            <option value="name">Sort: Name</option>
            <option value="weight">Sort: Weight</option>
          </select>
        </div>
        {/* Weight bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, height: '4px', background: '#101018', borderRadius: '2px', overflow: 'hidden', border: '1px solid #1c1c28' }}>
            <div style={{ width: `${weightPct}%`, height: '100%', background: weightPct > 80 ? '#cc4444' : '#c8882a', borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: '9px', color: weightPct > 80 ? '#cc4444' : '#505060', fontFamily: 'monospace', flexShrink: 0 }}>
            {weight.current}/{weight.max}kg
          </span>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', background: '#0a0a14', borderBottom: '1px solid #1c1c28', flexShrink: 0 }}>
        {[{ id: 'equipment', label: 'Equipped', icon: '🗡️' }, { id: 'items', label: 'Pack', icon: '🎒' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '7px 4px', border: 'none',
            background: tab === t.id ? 'rgba(200,136,42,0.08)' : 'transparent',
            color: tab === t.id ? '#c8882a' : '#383848',
            borderBottom: tab === t.id ? '2px solid #c8882a' : '2px solid transparent',
            cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.08em',
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Equipment tab */}
        {tab === 'equipment' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              {SLOT_LAYOUT.map(({ slot, label, icon }) => {
                const eq = player.equipment?.[slot];
                const rc = eq ? (RARITY_COLOR[eq.rarity] || '#808080') : '#282838';
                return (
                  <div key={slot}
                    onMouseEnter={() => setHoveredSlot(slot)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={() => eq && handleAction('unequip', { slot })}
                    style={{
                      background: eq ? RARITY_BG[eq.rarity] || 'rgba(40,40,60,0.3)' : '#0c0c18',
                      border: `1px solid ${eq ? rc + '50' : '#1c1c28'}`,
                      borderRadius: '4px', padding: '6px 8px', cursor: eq ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                      ...(hoveredSlot === slot && eq ? { borderColor: rc + '80', background: RARITY_BG[eq.rarity] || 'rgba(40,40,60,0.5)' } : {}),
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', opacity: eq ? 1 : 0.4 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '8px', color: '#303040', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>
                          {label}
                        </div>
                        {eq ? (
                          <>
                            <div style={{ fontSize: '11px', color: rc, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                              {eq.name}
                            </div>
                            <div style={{ fontSize: '9px', color: '#404050', fontFamily: 'monospace' }}>
                              {eq.attack ? `⚔ ${eq.attack}  ` : ''}{eq.defense ? `🛡 ${eq.defense}` : ''}
                              {!eq.attack && !eq.defense && eq.hpBonus ? `❤ +${eq.hpBonus}` : ''}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '10px', color: '#1c1c28', fontStyle: 'italic' }}>Empty</div>
                        )}
                      </div>
                      {eq && hoveredSlot === slot && (
                        <span style={{ fontSize: '9px', color: '#882222', fontFamily: 'monospace', flexShrink: 0 }}>✕</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ color: '#252535', fontSize: '9px', textAlign: 'center', marginTop: '10px', fontFamily: 'monospace' }}>
              Click an equipped item to unequip it
            </div>
          </div>
        )}

        {/* Items tab */}
        {tab === 'items' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Category filters */}
            <div style={{ display: 'flex', gap: '2px', padding: '6px 8px', background: '#0c0c16', borderBottom: '1px solid #1c1c28', overflowX: 'auto', flexShrink: 0 }}>
              {FILTER_TABS.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: '3px 8px', border: `1px solid ${filter === f.id ? '#c8882a' : '#1c1c28'}`,
                  background: filter === f.id ? 'rgba(200,136,42,0.12)' : 'transparent',
                  color: filter === f.id ? '#c8882a' : '#383848',
                  borderRadius: '3px', cursor: 'pointer', fontSize: '9px', fontFamily: 'monospace',
                  whiteSpace: 'nowrap', transition: 'all 0.1s',
                }}>{f.icon} {f.label}</button>
              ))}
            </div>

            {/* Item count */}
            <div style={{ padding: '3px 10px', borderBottom: '1px solid #1a1a24', flexShrink: 0 }}>
              <span style={{ fontSize: '9px', color: '#282838', fontFamily: 'monospace' }}>
                {filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''}
                {search && ` matching "${search}"`}
              </span>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
              {filteredInventory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#1c1c28', fontFamily: 'monospace', fontSize: '12px', fontStyle: 'italic' }}>
                  {search ? `Nothing found for "${search}"` : 'Your pack is empty.'}
                </div>
              ) : filteredInventory.map(item => {
                const isSel   = selectedItem?.uid === item.uid;
                const rc      = RARITY_COLOR[item.rarity] || '#808080';
                const sellPx  = getSellPrice(item.value || 10, tradingLevel);
                const isEquipped = Object.values(player.equipment || {}).some(e => e?.uid === item.uid);
                return (
                  <div key={item.uid} style={{ marginBottom: '3px' }}>
                    <div
                      onClick={() => setSelectedItem(isSel ? null : item)}
                      style={{
                        padding: '7px 10px', cursor: 'pointer',
                        background: isSel ? (RARITY_BG[item.rarity] || 'rgba(40,40,60,0.4)') : '#0c0c18',
                        border: `1px solid ${isSel ? rc + '60' : '#1c1c28'}`,
                        borderRadius: isSel ? '4px 4px 0 0' : '4px',
                        transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.borderColor = '#2c2c40'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.borderColor = '#1c1c28'; }}
                    >
                      {/* Rarity indicator */}
                      <div style={{ width: '3px', height: '32px', background: rc, borderRadius: '2px', flexShrink: 0, opacity: 0.8 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '1px' }}>
                          <span style={{ fontSize: '12px', color: rc, fontFamily: 'monospace', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </span>
                          {isEquipped && (
                            <span style={{ fontSize: '8px', color: '#c8882a', background: 'rgba(200,136,42,0.15)', padding: '0 4px', borderRadius: '2px', flexShrink: 0 }}>
                              Equipped
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '9px', color: '#404050', fontFamily: 'monospace' }}>
                          <span style={{ color: '#383848', marginRight: '6px', textTransform: 'capitalize' }}>{item.rarity || 'common'}</span>
                          <span style={{ marginRight: '6px', textTransform: 'capitalize' }}>{item.type}</span>
                          {item.attack && <span style={{ marginRight: '5px' }}>⚔ {item.attack}</span>}
                          {item.defense && <span style={{ marginRight: '5px' }}>🛡 {item.defense}</span>}
                          {item.hpRestore && <span style={{ marginRight: '5px', color: '#44aa44' }}>❤ +{item.hpRestore}</span>}
                          {item.mpRestore && <span style={{ color: '#5890d8' }}>✦ +{item.mpRestore}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '10px', color: '#a09040', fontFamily: 'monospace' }}>{item.value || 0}g</div>
                        {item.weight > 0 && <div style={{ fontSize: '9px', color: '#282838', fontFamily: 'monospace' }}>{item.weight}kg</div>}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isSel && (
                      <div style={{
                        background: '#090910', border: `1px solid ${rc}30`,
                        borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '10px',
                      }}>
                        {item.description && (
                          <div style={{ fontSize: '11px', color: '#505068', fontStyle: 'italic', marginBottom: '8px', lineHeight: 1.5 }}>
                            "{item.description}"
                          </div>
                        )}
                        {/* Affixes */}
                        {item.affixes?.length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            {item.affixes.map((a, i) => (
                              <div key={i} style={{ fontSize: '10px', color: '#8860d0', fontFamily: 'monospace', marginBottom: '2px' }}>
                                ✦ {a.desc}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {item.slot && !isEquipped && (
                            <ActionBtn color="#c8882a" onClick={() => handleAction('equip', item)}>⚔ Equip</ActionBtn>
                          )}
                          {item.type === 'consumable' && (
                            <ActionBtn color="#60a860" onClick={() => handleAction('use', item)}>🧪 Use</ActionBtn>
                          )}
                          <ActionBtn color="#a09040" onClick={() => handleAction('sell', item)}>
                            💰 Sell ({sellPx}g)
                          </ActionBtn>
                          <ActionBtn color="#882222" onClick={() => handleAction('drop', item)}>🗑 Drop</ActionBtn>
                        </div>
                        <div style={{ fontSize: '8px', color: '#1c1c28', marginTop: '6px', fontFamily: 'monospace' }}>
                          Base value: {item.value || 0}g · Weight: {item.weight || 0}kg
                          {item.source && ` · From: ${item.source}`}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, color }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', fontSize: '10px', fontFamily: 'monospace',
        background: h ? `${color}20` : 'transparent',
        border: `1px solid ${h ? color : color + '60'}`,
        color, borderRadius: '3px', cursor: 'pointer', transition: 'all 0.1s',
      }}>
      {children}
    </button>
  );
}
