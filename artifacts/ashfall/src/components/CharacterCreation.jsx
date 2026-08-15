import React, { useState } from 'react';
import useGameStore from '../store/gameStore.js';
import { RACES, BACKGROUNDS } from '../data/races.js';
import { generateWorldSeed } from '../engine/world.js';

const STEPS = ['name', 'race', 'background', 'summary'];

export default function CharacterCreation() {
  const newGame = useGameStore(s => s.newGame);
  const setPhase = useGameStore(s => s.setPhase);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [race, setRace] = useState('human');
  const [background, setBackground] = useState('warrior');

  const canNext = step === 0 ? name.trim().length >= 2 : true;

  function handleCreate() {
    newGame(name.trim(), race, background);
  }

  const raceData = RACES[race];
  const bgData = BACKGROUNDS[background];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '20px', overflowY: 'auto', background: 'var(--ash-black)' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }} onClick={() => setPhase('title')}>← Back</button>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= step ? 'var(--ash-amber)' : 'var(--ash-border)', transition: 'background 0.3s' }} />
          ))}
        </div>

        {step === 0 && (
          <div className="anim-fade">
            <h2 style={{ marginBottom: '8px' }}>Your Name</h2>
            <p style={{ color: 'var(--ash-text-dim)', marginBottom: '24px', fontSize: '15px' }}>What shall the realm call you?</p>
            <input
              type="text" value={name} maxLength={20} placeholder="Enter your name..."
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canNext && setStep(1)}
              style={{ width: '100%', padding: '14px 16px', fontSize: '18px', background: 'var(--ash-charcoal)', border: '2px solid var(--ash-amber-dim)', borderRadius: 'var(--radius-lg)', color: 'var(--ash-text-bright)', fontFamily: 'var(--font-title)', letterSpacing: '0.05em', marginBottom: '16px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
              {['Aldric','Mira','Corvus','Lyra','Bran','Sael'].map(n => (
                <button key={n} className="btn btn-ghost btn-sm" onClick={() => setName(n)}>{n}</button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="anim-fade">
            <h2 style={{ marginBottom: '8px' }}>Choose Your Race</h2>
            <p style={{ color: 'var(--ash-text-dim)', marginBottom: '16px', fontSize: '15px' }}>Each race has unique strengths and histories.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.values(RACES).map(r => (
                <button key={r.id} onClick={() => setRace(r.id)}
                  style={{ background: race === r.id ? 'rgba(200,136,42,0.15)' : 'var(--ash-charcoal)', border: `2px solid ${race === r.id ? 'var(--ash-amber)' : 'var(--ash-border)'}`, borderRadius: 'var(--radius-lg)', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontFamily: 'var(--font-title)', color: race === r.id ? 'var(--ash-gold)' : 'var(--ash-text-bright)', fontSize: '16px', marginBottom: '4px' }}>{r.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--ash-text-dim)', marginBottom: '8px' }}>{r.description}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(r.attributes).filter(([, v]) => v !== 0).map(([attr, val]) => (
                      <span key={attr} style={{ fontSize: '11px', color: val > 0 ? 'var(--uncommon)' : 'var(--ash-crimson-light)', fontFamily: 'var(--font-mono)' }}>
                        {attr.toUpperCase()} {val > 0 ? '+' : ''}{val}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="anim-fade">
            <h2 style={{ marginBottom: '8px' }}>Your Background</h2>
            <p style={{ color: 'var(--ash-text-dim)', marginBottom: '16px', fontSize: '15px' }}>Your past shapes your abilities.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.values(BACKGROUNDS).map(b => (
                <button key={b.id} onClick={() => setBackground(b.id)}
                  style={{ background: background === b.id ? 'rgba(200,136,42,0.15)' : 'var(--ash-charcoal)', border: `2px solid ${background === b.id ? 'var(--ash-amber)' : 'var(--ash-border)'}`, borderRadius: 'var(--radius-lg)', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontFamily: 'var(--font-title)', color: background === b.id ? 'var(--ash-gold)' : 'var(--ash-text-bright)', fontSize: '16px', marginBottom: '4px' }}>{b.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--ash-text-dim)', marginBottom: '8px' }}>{b.description}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(b.skillBonuses || {}).map(([skill, val]) => (
                      <span key={skill} style={{ fontSize: '11px', color: 'var(--uncommon)', fontFamily: 'var(--font-mono)' }}>
                        {skill} +{val}
                      </span>
                    ))}
                    <span style={{ fontSize: '11px', color: 'var(--ash-gold)', fontFamily: 'var(--font-mono)' }}>+{b.startingGold}g</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="anim-fade">
            <h2 style={{ marginBottom: '16px' }}>Your Character</h2>
            <div className="panel" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ color: 'var(--ash-text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Name</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '20px', color: 'var(--ash-gold)' }}>{name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ash-text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Race</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '16px', color: 'var(--ash-amber)' }}>{raceData?.name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ash-text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Background</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '16px', color: 'var(--ash-amber)' }}>{bgData?.name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ash-text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Starting Gold</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--ash-gold)' }}>
                    {(raceData?.startingGold || 50) + (bgData?.startingGold || 0)}g
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div style={{ marginBottom: '8px', color: 'var(--ash-text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Starting Items</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(bgData?.startingItems || []).map(item => (
                  <span key={item} style={{ background: 'var(--ash-brown)', border: '1px solid var(--ash-border-light)', borderRadius: 'var(--radius)', padding: '4px 10px', fontSize: '12px', color: 'var(--ash-text)' }}>
                    {item.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                ))}
              </div>

              <div className="divider" />
              <div style={{ fontSize: '13px', color: 'var(--ash-text-dim)', fontStyle: 'italic', lineHeight: 1.5 }}>{bgData?.lore}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '16px' }}>
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn btn-primary" style={{ padding: '14px 32px' }} onClick={handleCreate}>
              Begin Journey
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
