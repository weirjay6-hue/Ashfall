import React, { useEffect, useState } from 'react';
import useGameStore from '../store/gameStore.js';

const EPITAPHS = [
  'Here lies a hero whose story ended too soon.',
  'The realm mourns another fallen soul.',
  'Darkness claims another, but the memory lingers.',
  'They walked boldly where others feared to tread.',
  'Fortune favours the bold — until it doesn\'t.',
  'The dungeon keeps what the dungeon takes.',
  'Even the bravest stumble in the dark.',
  'Not all who wander find their way back.',
];

export default function DeathScreen() {
  const player = useGameStore(s => s.player);
  const combat = useGameStore(s => s.combat);
  const returnToTitle = useGameStore(s => s.returnToTitle);
  const [revealed, setRevealed] = useState(false);
  const [epitaph] = useState(() => EPITAPHS[Math.floor(Math.random() * EPITAPHS.length)]);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (!player) return null;

  const stats = player.stats || {};
  const skills = player.skills || {};
  const topSkills = Object.entries(skills)
    .filter(([, v]) => v && v.level > 1)
    .sort(([, a], [, b]) => (b.level || 0) - (a.level || 0))
    .slice(0, 4);

  const slayerName = combat?.enemy?.name || 'unknown forces';
  const playtime = Math.floor((stats.stepsWalked || 0) / 10);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at 50% 30%, #1a0505 0%, #000 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      animation: 'fadeIn 1.2s ease',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: '1px', height: `${20 + Math.random() * 60}px`,
            background: `rgba(139,28,28,${0.05 + Math.random() * 0.1})`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
      </div>

      <div style={{
        width: '100%', maxWidth: '400px',
        opacity: revealed ? 1 : 0,
        transition: 'opacity 1.0s ease',
      }}>
        <div style={{
          textAlign: 'center', marginBottom: '24px',
        }}>
          <div style={{
            fontSize: '48px', marginBottom: '8px',
            filter: 'drop-shadow(0 0 16px rgba(139,28,28,0.8))',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            💀
          </div>
          <div style={{
            fontFamily: 'var(--font-title)', fontSize: '28px', letterSpacing: '0.25em',
            color: 'var(--ash-crimson-light)', textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(139,28,28,0.6)',
            marginBottom: '4px',
          }}>
            You Have Fallen
          </div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(200,120,120,0.7)',
            fontStyle: 'italic',
          }}>
            Slain by {slayerName}
          </div>
        </div>

        <div style={{
          background: 'rgba(20,0,0,0.6)',
          border: '1px solid rgba(139,28,28,0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '16px',
        }}>
          <div style={{
            fontFamily: 'var(--font-title)', fontSize: '10px', letterSpacing: '0.25em',
            color: 'rgba(200,120,120,0.5)', textTransform: 'uppercase',
            marginBottom: '14px',
          }}>
            ── Final Record ──
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontFamily: 'var(--font-title)', fontSize: '16px', color: 'var(--ash-gold)' }}>
              {player.name}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ash-text-dim)' }}>
              Level {player.level} · {player.race} {player.background}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Enemies Slain', value: stats.kills || 0, icon: '⚔️' },
              { label: 'Gold Earned', value: `${stats.goldEarned || player.gold || 0}g`, icon: '💰' },
              { label: 'Days Survived', value: stats.daysPlayed || 0, icon: '📅' },
              { label: 'Dungeons Cleared', value: stats.dungeonsCleared || 0, icon: '🗝️' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                background: 'rgba(139,28,28,0.08)',
                border: '1px solid rgba(139,28,28,0.2)',
                borderRadius: 'var(--radius)',
                padding: '10px 12px',
              }}>
                <div style={{ fontSize: '16px', marginBottom: '2px' }}>{icon}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ash-crimson-light)', fontWeight: 'bold' }}>
                  {value}
                </div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--ash-text-dim)', textTransform: 'uppercase' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {topSkills.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(200,120,120,0.5)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Mastered Skills
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {topSkills.map(([key, skill]) => (
                  <div key={key} style={{
                    fontFamily: 'var(--font-title)', fontSize: '10px', letterSpacing: '0.08em',
                    color: 'var(--ash-text-dim)', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '3px', padding: '3px 8px',
                  }}>
                    {key.replace(/_/g, ' ')} · {skill.level}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(200,140,140,0.6)',
            fontStyle: 'italic', textAlign: 'center', lineHeight: 1.7,
            borderTop: '1px solid rgba(139,28,28,0.2)',
            paddingTop: '12px',
          }}>
            "{epitaph}"
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={returnToTitle}
            style={{
              flex: 1, padding: '14px', fontFamily: 'var(--font-title)', fontSize: '11px',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              background: 'rgba(139,28,28,0.2)', border: '1px solid rgba(139,28,28,0.5)',
              color: 'var(--ash-crimson-light)', borderRadius: 'var(--radius)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(139,28,28,0.35)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(139,28,28,0.2)'; }}
          >
            ☠ Return to Title
          </button>
        </div>
      </div>
    </div>
  );
}
