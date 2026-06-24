import React, { useMemo, useState } from 'react';
import useGameStore from '../store/gameStore.js';

const COST_PER_REGION = 15;

function calcCost(fromX, fromY, toX, toY) {
  const dist = Math.abs(toX - fromX) + Math.abs(toY - fromY);
  return Math.max(COST_PER_REGION, dist * COST_PER_REGION);
}

const TYPE_ICON = { city: '🏰', town: '🏘️', village: '🏡', fort: '🗼', ruins: '💀' };

export default function WagonTravel({ onClose }) {
  const world      = useGameStore(s => s.world);
  const player     = useGameStore(s => s.player);
  const wagonTravel = useGameStore(s => s.wagonTravel);

  const [selected, setSelected] = useState(null);
  const [traveling, setTraveling] = useState(false);

  const { regionX: fromX, regionY: fromY } = player.location;

  const destinations = useMemo(() => {
    if (!world) return [];
    const list = [];
    for (const region of world.regions) {
      if (!region.visited && !region.revealed) continue;
      for (const s of (region.settlements || [])) {
        if (region.x === fromX && region.y === fromY) continue;
        const cost = calcCost(fromX, fromY, region.x, region.y);
        list.push({ settlement: s, regionX: region.x, regionY: region.y, cost, regionName: region.name });
      }
    }
    list.sort((a, b) => a.cost - b.cost);
    return list;
  }, [world, fromX, fromY]);

  function handleBook() {
    if (!selected || traveling) return;
    const canAfford = player.gold >= selected.cost;
    if (!canAfford) return;
    setTraveling(true);
    setTimeout(() => {
      wagonTravel(selected.regionX, selected.regionY, selected.settlement.id, selected.cost);
      onClose();
    }, 600);
  }

  const gold = player.gold ?? 0;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(2,6,2,0.93)',
      zIndex: 40,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        background: 'rgba(4,10,4,0.98)',
        borderBottom: '1px solid rgba(200,160,40,0.45)',
        display: 'flex', alignItems: 'center', gap: '10px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '20px' }}>🐴</span>
        <div>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--ash-gold)', letterSpacing: '0.1em' }}>
            WAGON DRIVER
          </div>
          <div style={{ fontSize: '10px', color: 'var(--ash-text-dim)', marginTop: '1px' }}>
            "Where to, traveler? Gold buys speed."
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#7ec850', fontFamily: 'var(--font-mono)' }}>
            🪙 {gold}g
          </span>
          <button onClick={onClose}
            style={{ background: 'none', border: '1px solid var(--ash-border)', color: 'var(--ash-text-dim)', cursor: 'pointer', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>
            ✕
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
        {destinations.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ash-text-dim)', padding: '32px 0', fontSize: '12px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗺️</div>
            Explore more of the world to discover destinations.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '9px', color: 'var(--ash-text-dim)', fontFamily: 'var(--font-title)', letterSpacing: '0.12em', marginBottom: '4px', paddingLeft: '2px' }}>
              KNOWN DESTINATIONS — {COST_PER_REGION}G PER REGION
            </div>
            {destinations.map(dest => {
              const canAfford = gold >= dest.cost;
              const isSel = selected?.settlement.id === dest.settlement.id;
              return (
                <button
                  key={dest.settlement.id}
                  onClick={() => setSelected(isSel ? null : dest)}
                  style={{
                    background: isSel ? 'rgba(200,160,40,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSel ? 'rgba(200,160,40,0.7)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    padding: '9px 12px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    opacity: canAfford ? 1 : 0.45,
                    textAlign: 'left',
                    transition: 'all 0.12s',
                  }}
                >
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>
                    {TYPE_ICON[dest.settlement.type] || '🏘️'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-title)', fontSize: '12px', color: isSel ? 'var(--ash-gold)' : 'var(--ash-text)', letterSpacing: '0.05em' }}>
                      {dest.settlement.name}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--ash-text-dim)', marginTop: '2px', textTransform: 'capitalize' }}>
                      {dest.settlement.type} · {dest.regionName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: canAfford ? '#f0d060' : 'var(--ash-crimson-light)', fontWeight: 'bold' }}>
                      {dest.cost}g
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--ash-text-dim)', marginTop: '1px' }}>
                      {Math.abs(dest.regionX - fromX) + Math.abs(dest.regionY - fromY)} regions
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        padding: '10px 14px',
        background: 'rgba(4,10,4,0.98)',
        borderTop: '1px solid rgba(200,160,40,0.3)',
        flexShrink: 0,
      }}>
        {selected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, fontSize: '11px', color: 'var(--ash-text-dim)' }}>
              <span style={{ color: 'var(--ash-gold)' }}>{selected.settlement.name}</span>
              {' '}· costs{' '}
              <span style={{ color: '#f0d060', fontWeight: 'bold' }}>{selected.cost}g</span>
            </div>
            <button
              className="btn btn-primary"
              disabled={traveling || gold < selected.cost}
              onClick={handleBook}
              style={{ fontSize: '12px', padding: '7px 20px', opacity: traveling ? 0.6 : 1 }}
            >
              {traveling ? '🐴 Departing…' : `🐴 Book Passage (${selected.cost}g)`}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '10px', color: 'var(--ash-text-dim)', textAlign: 'center' }}>
            Select a destination above to book passage
          </div>
        )}
      </div>
    </div>
  );
}
