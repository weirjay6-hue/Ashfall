import React, { useState } from 'react';
import useGameStore from '../store/gameStore.js';
import { getSaveSlots } from '../engine/save.js';

export default function TitleScreen() {
  const setPhase = useGameStore(s => s.setPhase);
  const loadSave = useGameStore(s => s.loadSave);
  const [showSlots, setShowSlots] = useState(false);
  const saves = getSaveSlots();
  const hasSaves = saves.some(Boolean);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 55%, #16100c 0%, #0a0810 50%, #050408 100%)',
      padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(200,136,42,0.025) 40px, rgba(200,136,42,0.025) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(200,136,42,0.025) 40px, rgba(200,136,42,0.025) 41px)',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', width: '100%' }}>
        <div style={{ marginBottom: '10px', color: 'rgba(200,136,42,0.5)', fontFamily: 'var(--font-title)', fontSize: '11px', letterSpacing: '0.5em', textTransform: 'uppercase' }}>
          An Open World RPG
        </div>

        <h1 style={{
          fontFamily: 'var(--font-title)', fontSize: 'clamp(56px, 15vw, 88px)', fontWeight: '900',
          color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text',
          backgroundImage: 'linear-gradient(180deg, #f0d870 0%, #c88830 40%, #784818 100%)',
          letterSpacing: '0.12em', lineHeight: 1, marginBottom: '6px',
          textShadow: 'none', filter: 'drop-shadow(0 0 40px rgba(200,136,42,0.4))',
        }}>
          ASHFALL
        </h1>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontStyle: 'italic', color: 'rgba(160,140,110,0.7)', marginBottom: '44px', letterSpacing: '0.04em', lineHeight: 1.6 }}>
          "The realm breathes without you.<br />The question is what you do with it."
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-primary" style={{ width: '240px', fontSize: '14px', padding: '13px 24px', justifyContent: 'center', letterSpacing: '0.2em' }}
            onClick={() => setPhase('create')}>
            NEW GAME
          </button>

          {hasSaves && (
            <button className="btn btn-ghost" style={{ width: '240px', fontSize: '13px', padding: '11px 24px', justifyContent: 'center', letterSpacing: '0.15em' }}
              onClick={() => setShowSlots(!showSlots)}>
              CONTINUE
            </button>
          )}
        </div>

        {showSlots && hasSaves && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {saves.map((save, i) => save ? (
              <button key={i} onClick={() => loadSave(i)} style={{
                background: 'rgba(12,12,24,0.9)', border: '1px solid rgba(200,136,42,0.2)',
                borderRadius: 'var(--radius)', padding: '10px 16px', color: 'var(--ash-text)',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,136,42,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(200,136,42,0.2)'}
              >
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '10px', color: 'var(--ash-amber)', marginBottom: '2px', letterSpacing: '0.1em' }}>SLOT {i + 1}</div>
                <div style={{ fontSize: '13px', color: 'var(--ash-text-bright)', fontFamily: 'monospace' }}>{save.characterName} — Level {save.characterLevel}</div>
                <div style={{ fontSize: '10px', color: 'var(--ash-text-dim)', fontFamily: 'monospace' }}>Day {save.daysSurvived}</div>
              </button>
            ) : null)}
          </div>
        )}

        <div style={{ marginTop: '52px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { icon: '⚔️', label: 'Living World', desc: 'Factions, economies, and NPCs evolve independently' },
            { icon: '🏰', label: 'Dungeons',     desc: 'Procedural dungeon crawling with DCSS-style combat' },
            { icon: '🌍', label: 'Open World',   desc: '400 regions to explore, each with unique stories' },
          ].map(f => (
            <div key={f.label} style={{
              background: 'rgba(12,10,8,0.75)', border: '1px solid rgba(200,136,42,0.1)',
              borderRadius: 'var(--radius-lg)', padding: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '9px', color: 'var(--ash-amber)', letterSpacing: '0.15em', marginBottom: '5px' }}>{f.label}</div>
              <div style={{ fontSize: '10px', color: 'rgba(120,110,90,0.8)', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
