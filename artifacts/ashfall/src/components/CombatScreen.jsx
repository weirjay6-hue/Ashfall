import React, { useEffect, useRef, useState } from 'react';
import useGameStore from '../store/gameStore.js';
import { BODY_PARTS, getPlayerMaxHP, getPlayerMaxMP } from '../engine/combat.js';
import { MONSTER_GLYPHS, DUNGEON_TYPES } from '../engine/dungeon.js';

export default function CombatScreen() {
  const combat         = useGameStore(s => s.combat);
  const player         = useGameStore(s => s.player);
  const dungeon        = useGameStore(s => s.dungeon);
  const combatAction   = useGameStore(s => s.combatAction);
  const sneaking       = useGameStore(s => s.sneaking);
  const sneakTakedown  = useGameStore(s => s.sneakTakedown);
  const logRef       = useRef(null);
  const [selectedPart, setSelectedPart] = useState('chest');
  const [hitFlash, setHitFlash]         = useState(false);
  const prevHP = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [combat?.log]);

  useEffect(() => {
    if (!player) return;
    if (prevHP.current !== null && player.hp.current < prevHP.current) {
      setHitFlash(true);
      setTimeout(() => setHitFlash(false), 350);
    }
    prevHP.current = player.hp.current;
  }, [player?.hp?.current]);

  if (!combat || !player) return null;

  const { enemy, playerStatusEffects = [], won, lost, fled, playerTurn, round } = combat;
  const isOver    = won || lost || fled;
  const canBackstab = sneaking && round === 1 && !isOver && playerTurn;
  const enemyHpPct2 = enemy ? enemy.hp / enemy.maxHp : 1;
  const canFinish = sneaking && enemyHpPct2 < 0.38 && !isOver && playerTurn;
  const isDungeon = !!dungeon && !!combat._dungeonEnemyId;
  const dungeonTypeDef = dungeon ? DUNGEON_TYPES[dungeon.type] : null;
  const accentColor    = dungeonTypeDef?.accent || '#883030';

  const isPoisoned = playerStatusEffects?.some(s => s.id === 'poison');
  const maxHP      = getPlayerMaxHP(player);
  const maxMP      = getPlayerMaxMP(player);
  const hpPct      = player.hp.current / maxHP;
  const inventory  = player.inventory || [];

  let nextConsumable = null;
  if (isPoisoned) nextConsumable = inventory.find(i => i.curesPoison);
  if (!nextConsumable && hpPct < 0.8) nextConsumable = inventory.find(i => i.type === 'consumable' && i.hpRestore);
  if (!nextConsumable) nextConsumable = inventory.find(i => i.type === 'consumable' && i.mpRestore);
  if (!nextConsumable) nextConsumable = inventory.find(i => i.type === 'consumable');
  const hasConsumable = !!nextConsumable;

  const enemyHpPct  = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  const playerHpPct = Math.max(0, hpPct * 100);
  const playerMpPct = Math.max(0, (player.mp.current / maxMP) * 100);

  const playerMd   = { glyph: '@', color: '#f4e858' };
  const enemyMd    = MONSTER_GLYPHS[enemy.templateId] || { glyph: 'x', color: '#d04040' };
  const enemyGlyph = enemy.isBoss ? enemyMd.glyph.toUpperCase() : enemyMd.glyph;
  const enemyColor = enemy.isBoss ? '#ff3855' : enemyMd.color;

  function hpColor(pct) {
    if (pct > 60) return '#44aa44';
    if (pct > 30) return '#cc8822';
    return '#aa2222';
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: isDungeon ? '#090812' : '#0a0604',
      overflow: 'hidden', minHeight: 0,
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '6px 12px', flexShrink: 0,
        background: isDungeon
          ? `linear-gradient(90deg, ${accentColor}28, rgba(120,20,20,0.35))`
          : 'rgba(120,20,20,0.3)',
        borderBottom: `1px solid ${isDungeon ? accentColor+'50' : '#5a1a1a'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#c05050', letterSpacing: '0.15em', flexShrink: 0 }}>⚔ COMBAT</span>
          {sneaking && (
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#80d890', letterSpacing: '0.1em', background: 'rgba(60,160,80,0.15)', padding: '1px 6px', borderRadius: '3px', border: '1px solid rgba(60,160,80,0.3)', flexShrink: 0 }}>
              🤫 HIDDEN
            </span>
          )}
          {isDungeon && dungeon && (
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: accentColor, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {dungeon.name} · F{dungeon.currentFloor+1}
            </span>
          )}
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#2a2a2a', flexShrink: 0 }}>Round {round}</span>
        </div>
        {!playerTurn && !isOver && (
          <span style={{ color: '#c05050', fontSize: '10px', fontFamily: 'monospace', animation: 'anim-pulse 1s ease infinite', flexShrink: 0 }}>
            Enemy...
          </span>
        )}
      </div>

      {/* ── Scrollable combat body ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        {/* Arena — fixed height, never grows to push buttons off */}
        <div style={{
          flexShrink: 0, padding: '12px 14px',
          display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '8px', alignItems: 'center',
          borderBottom: '1px solid #1a1a1a',
          background: hitFlash ? 'rgba(160,24,24,0.22)' : 'transparent',
          transition: 'background 0.2s',
        }}>
          {/* Player side */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '26px', color: '#f4e858', fontWeight: 'bold', textShadow: '0 0 10px rgba(244,232,88,0.6)', lineHeight: 1 }}>@</span>
              <div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--ash-gold)', lineHeight: 1, marginBottom: '2px' }}>{player.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#3a3a3a' }}>Lv.{player.level}</div>
              </div>
            </div>
            <MiniBar current={player.hp.current} max={maxHP} color={hpColor(playerHpPct)} label="HP" />
            <MiniBar current={player.mp.current} max={maxMP} color="#5890d8" label="MP" small />
            <StatusPips effects={playerStatusEffects} />
          </div>

          {/* VS */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#222222', letterSpacing: '0.1em' }}>VS</div>
          </div>

          {/* Enemy side */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '6px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: enemy.isBoss ? 'var(--mythic)' : '#c05050', lineHeight: 1, marginBottom: '2px' }}>
                  {enemy.name}{enemy.isBoss ? ' ★' : ''}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#3a3a3a' }}>{enemy.hp}/{enemy.maxHp} HP</div>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '26px', color: enemyColor, fontWeight: 'bold', lineHeight: 1,
                textShadow: enemy.isBoss ? `0 0 14px ${enemyColor}` : `0 0 6px ${enemyColor}60` }}>
                {enemyGlyph}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', maxWidth: '120px' }}>
                <div style={{ height: '6px', background: '#141414', borderRadius: '3px', overflow: 'hidden', border: '1px solid #1e1e1e' }}>
                  <div style={{ width: `${enemyHpPct}%`, height: '100%', background: hpColor(enemyHpPct), borderRadius: '3px', transition: 'width 0.35s', float: 'right' }} />
                </div>
              </div>
            </div>
            <StatusPips effects={enemy.statusEffects || []} right />
          </div>
        </div>

        {/* Combat log — flex fills remaining space, always scrollable */}
        <div ref={logRef} style={{
          flex: 1, overflowY: 'auto', padding: '6px 12px',
          fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.7,
          background: 'rgba(0,0,0,0.15)', minHeight: 0,
        }}>
          {combat.log.slice(-16).map((line, i, arr) => (
            <div key={i} style={{
              color: getLogColor(line),
              marginBottom: '1px', paddingLeft: '6px',
              borderLeft: i === arr.length-1 ? `2px solid ${getLogColor(line)}50` : '2px solid transparent',
              opacity: i < arr.length - 10 ? 0.45 : 1,
            }}>
              {line}
            </div>
          ))}
        </div>

        {/* Action panel — always visible, flexShrink 0 */}
        {!isOver && (
          <div style={{ flexShrink: 0, padding: '8px 10px', borderTop: '1px solid #1a1a1a', background: '#0c0c0c' }}>
            {/* Body parts — wraps so it never clips */}
            <div style={{ marginBottom: '7px' }}>
              <div style={{ fontSize: '9px', color: '#282828', marginBottom: '4px', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Target
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {BODY_PARTS.map(part => (
                  <button key={part.id} onClick={() => setSelectedPart(part.id)} style={{
                    padding: '3px 7px',
                    border: `1px solid ${selectedPart === part.id ? 'var(--ash-amber)' : '#282828'}`,
                    background: selectedPart === part.id ? 'rgba(200,136,42,0.15)' : 'transparent',
                    color: selectedPart === part.id ? 'var(--ash-amber)' : '#383838',
                    borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace',
                    transition: 'all 0.1s',
                  }}>
                    {part.name}
                    <span style={{ marginLeft: '3px', fontSize: '9px', opacity: 0.6 }}>{Math.round(part.damageMulti*100)}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
              <ActionBtn disabled={!playerTurn} onClick={() => combatAction('attack', selectedPart)}
                color="#c05050" border="#5a1a1a">⚔ Attack</ActionBtn>
              <ActionBtn disabled={!playerTurn || player.mp.current < 10} onClick={() => combatAction('spell', selectedPart)}
                color={player.mp.current >= 10 ? '#5890d8' : '#383838'} border={player.mp.current >= 10 ? '#1a3060' : '#282828'}>
                ✦ Spell</ActionBtn>
              <ActionBtn disabled={!playerTurn || !hasConsumable} onClick={() => combatAction('item', selectedPart)}
                color={hasConsumable ? 'var(--ash-green-light)' : '#383838'}
                border={hasConsumable ? '#1a4020' : '#282828'}
                title={hasConsumable ? `Use ${nextConsumable?.name}` : 'No items'}>
                🧪 {hasConsumable ? (nextConsumable?.name?.split(' ')[0] || 'Use') : 'None'}
              </ActionBtn>
              <ActionBtn disabled={!playerTurn} onClick={() => combatAction('flee')}
                color="#585858" border="#282828">💨 Flee</ActionBtn>
            </div>
            {/* Stealth actions row */}
            {(canBackstab || canFinish) && (
              <div style={{ display: 'grid', gridTemplateColumns: canBackstab && canFinish ? '1fr 1fr' : '1fr', gap: '5px', marginTop: '5px', paddingTop: '5px', borderTop: '1px dashed rgba(80,160,90,0.25)' }}>
                {canBackstab && (
                  <ActionBtn onClick={() => combatAction('backstab')} color="#80d890" border="#2a5030"
                    title="Strike from the shadows — 2–3× damage (round 1 only)">
                    🗡️ Backstab
                  </ActionBtn>
                )}
                {canFinish && (
                  <ActionBtn onClick={sneakTakedown} color="#a080e8" border="#302060"
                    title="Attempt a silent takedown — instantly end combat">
                    💀 Finish
                  </ActionBtn>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result banner */}
        {isOver && (
          <div style={{
            flexShrink: 0, padding: '16px', borderTop: '1px solid #1a1a1a', textAlign: 'center',
            background: won ? 'rgba(50,100,50,0.12)' : fled ? 'rgba(30,30,30,0.2)' : 'rgba(100,20,20,0.15)',
            overflowY: 'auto',
          }}>
            {won && (
              <>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '20px', color: 'var(--ash-gold)', marginBottom: '5px', letterSpacing: '0.05em' }}>Victory!</div>
                <div style={{ color: '#888', fontSize: '12px', fontFamily: 'monospace', marginBottom: '3px' }}>+{combat.xpGained} XP · +{combat.goldGained}g</div>
                {combat.lootGained?.length > 0 && (
                  <div style={{ color: 'var(--ash-amber)', fontSize: '11px', marginTop: '4px', fontFamily: 'monospace' }}>
                    {combat.lootGained.map(i => i.name).join(', ')}
                  </div>
                )}
                <div style={{ color: '#282828', fontSize: '9px', marginTop: '8px', fontFamily: 'monospace' }}>
                  {isDungeon ? 'Returning to dungeon…' : 'Returning to world…'}
                </div>
              </>
            )}
            {lost && (
              <>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '20px', color: '#c05050', marginBottom: '4px' }}>Defeated</div>
                <div style={{ color: '#282828', fontSize: '9px', fontFamily: 'monospace' }}>You retreat…</div>
              </>
            )}
            {fled && (
              <>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '16px', color: '#585858', marginBottom: '4px' }}>You escaped.</div>
                <div style={{ color: '#282828', fontSize: '9px', fontFamily: 'monospace' }}>
                  {isDungeon ? 'Back to dungeon…' : 'Back to world…'}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ children, disabled, onClick, color, border, title }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      padding: '9px 3px', fontSize: '11px', fontFamily: 'monospace',
      background: 'transparent', border: `1px solid ${disabled ? '#1e1e1e' : border}`,
      color: disabled ? '#282828' : color,
      borderRadius: '3px', cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.1s', opacity: disabled ? 0.4 : 1,
      letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden',
    }}>{children}</button>
  );
}

function MiniBar({ current, max, color, label, small }) {
  const pct = Math.max(0, Math.min(100, (current/max)*100));
  return (
    <div style={{ marginBottom: small ? '2px' : '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '1px' }}>
        <span style={{ color: '#2a2a2a' }}>{label}</span>
        <span style={{ color, fontFamily: 'monospace' }}>{current}/{max}</span>
      </div>
      <div style={{ height: small ? '4px' : '6px', background: '#141414', borderRadius: '2px', overflow: 'hidden', border: '1px solid #1c1c1c' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function StatusPips({ effects, right }) {
  if (!effects?.length) return null;
  return (
    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: right ? 'flex-end' : 'flex-start', marginTop: '3px' }}>
      {effects.map((e, i) => (
        <span key={i} style={{
          fontSize: '9px', padding: '1px 4px', borderRadius: '2px',
          background: `${e.color}18`, color: e.color, border: `1px solid ${e.color}35`,
          fontFamily: 'monospace',
        }}>
          {e.name}{e.remaining ? ` ${e.remaining}t` : ''}
        </span>
      ))}
    </div>
  );
}

function getLogColor(line) {
  if (/critical/i.test(line)) return 'var(--legendary)';
  if (/victory|defeated/i.test(line)) return 'var(--uncommon)';
  if (/You.*damage|You.*hit|You take/i.test(line)) return '#c05050';
  if (/miss/i.test(line)) return '#2a2a2a';
  if (/cast|spell|Spell/i.test(line)) return '#5890d8';
  if (/strike|attack|slash|crush/i.test(line)) return 'var(--ash-amber)';
  if (/flee|escape/i.test(line)) return '#585858';
  if (/poison/i.test(line)) return '#60a030';
  return 'var(--ash-text)';
}
