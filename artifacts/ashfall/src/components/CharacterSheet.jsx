import React, { useState } from 'react';
import useGameStore from '../store/gameStore.js';
import { SKILLS, SKILL_CATEGORIES } from '../data/skills.js';
import { RACES, BACKGROUNDS } from '../data/races.js';
import { FACTION_TEMPLATES, getReputationLabel } from '../data/factions.js';
import { getPlayerMaxHP, getPlayerMaxMP, getPlayerMaxStamina, getPlayerAttack, getPlayerDefense } from '../engine/combat.js';
import { getPlayerFactionRank } from '../engine/faction.js';

const SKILL_ICONS = {
  oneHanded:'⚔️', twoHanded:'🗡️', shortBlade:'🔪', archery:'🏹', polearms:'🪙',
  unarmed:'👊', destruction:'🔥', restoration:'💚', alteration:'🌀',
  sneak:'🌑', pickpocket:'🤲', lockpick:'🗝️', speech:'💬',
  alchemy:'⚗️', dodge:'💨', block:'🛡️',
};

const ATTR_ICONS = {
  strength: '💪', agility: '🏃', endurance: '❤️', intelligence: '🧠',
  willpower: '🔮', perception: '👁️', charisma: '💬', luck: '🍀',
};

export default function CharacterSheet() {
  const player = useGameStore(s => s.player);
  const world  = useGameStore(s => s.world);
  const [tab, setTab] = useState('stats');

  if (!player) return null;

  const race    = RACES[player.race];
  const bg      = BACKGROUNDS[player.background];
  const maxHP   = getPlayerMaxHP(player);
  const maxMP   = getPlayerMaxMP(player);
  const maxStam = getPlayerMaxStamina(player);
  const xpPct   = Math.min(100, ((player.xp || 0) / (player.xpNext || 100)) * 100);
  const atk     = getPlayerAttack(player);
  const def     = getPlayerDefense(player);

  const critChance  = Math.min(30, 5 + (player.attributes?.agility || 0) * 0.4);
  const evasion     = Math.min(40, Math.floor((player.attributes?.agility || 0) * 0.8 + (player.skills?.dodge?.level || 0) * 0.3));
  const carryMax    = 50 + (player.attributes?.strength || 0) * 5;
  const magicResist = Math.min(60, Math.floor((player.attributes?.willpower || 0) * 1.2));

  const skillsByCategory = Object.entries(SKILL_CATEGORIES).map(([catId, catName]) => ({
    catId, catName,
    skills: Object.values(SKILLS).filter(s => s.category === catId),
  }));

  const factionReps = Object.entries(player.reputation || {})
    .filter(([id]) => FACTION_TEMPLATES[id])
    .map(([id, rep]) => ({ id, name: FACTION_TEMPLATES[id]?.name || id, rep, ...getReputationLabel(rep) }));

  const TABS = [
    { id: 'stats',    label: 'Stats',    icon: '📊' },
    { id: 'skills',   label: 'Skills',   icon: '⚔️' },
    { id: 'factions', label: 'Factions', icon: '🏛️' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0a12' }}>

      {/* ── Character header ── */}
      <div style={{ padding: '12px', background: '#0c0c18', borderBottom: '1px solid #1c1c28', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Portrait */}
          <div style={{
            width: '52px', height: '52px', flexShrink: 0,
            background: 'rgba(244,232,88,0.07)', border: '1px solid rgba(244,232,88,0.2)',
            borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace', fontSize: '28px', color: '#f4e858',
            textShadow: '0 0 12px rgba(244,232,88,0.5)', fontWeight: 'bold',
          }}>@</div>

          {/* Name + info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'monospace', fontSize: '17px', color: '#f4e858', fontWeight: 'bold', marginBottom: '1px', letterSpacing: '0.02em' }}>
              {player.name}
            </div>
            <div style={{ fontSize: '10px', color: '#606070', fontFamily: 'monospace', marginBottom: '4px' }}>
              {race?.name} {bg?.name} · Level {player.level} · Day {world?.day}
            </div>
            {/* XP bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ flex: 1, height: '4px', background: '#0e0e18', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${xpPct}%`, height: '100%', background: 'linear-gradient(90deg, #806020, #c8a030)', borderRadius: '2px', transition: 'width 0.4s' }} />
              </div>
              <span style={{ fontSize: '9px', color: '#504020', fontFamily: 'monospace', flexShrink: 0 }}>
                {player.xp || 0}/{player.xpNext || 100} XP
              </span>
            </div>
          </div>

          {/* Gold */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '16px', color: '#c8a030', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {player.gold}g
            </div>
            <div style={{ fontSize: '9px', color: '#404040', fontFamily: 'monospace' }}>Gold</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', background: '#0a0a14', borderBottom: '1px solid #1c1c28', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '7px 4px', border: 'none',
            background: tab === t.id ? 'rgba(200,136,42,0.08)' : 'transparent',
            color: tab === t.id ? '#c8882a' : '#383848',
            borderBottom: tab === t.id ? '2px solid #c8882a' : '2px solid transparent',
            cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.06em',
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>

        {tab === 'stats' && (
          <>
            {/* Vitals */}
            <div style={{ marginBottom: '10px' }}>
              <SectionHeader>Vitals</SectionHeader>
              <VitalBar label="HP" current={player.hp.current} max={maxHP} color="#c05050" />
              <VitalBar label="MP" current={player.mp.current} max={maxMP} color="#5890d8" />
              <VitalBar label="Stamina" current={player.stamina?.current ?? maxStam} max={maxStam} color="#60a040" />
            </div>

            {/* Combat */}
            <div style={{ marginBottom: '10px' }}>
              <SectionHeader>Combat</SectionHeader>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <StatCard icon="⚔️" label="Attack"    value={atk}               color="#c05050" />
                <StatCard icon="🛡️" label="Defense"   value={def}               color="#5890d8" />
                <StatCard icon="⚡" label="Crit %"    value={`${critChance.toFixed(0)}%`} color="#e8a030" />
                <StatCard icon="💨" label="Evasion"   value={`${evasion}%`}     color="#60a860" />
                <StatCard icon="🔮" label="Mag. Res." value={`${magicResist}%`} color="#9858c8" />
                <StatCard icon="📦" label="Carry"     value={`/${carryMax}kg`}  color="#808080" />
              </div>
            </div>

            {/* Attributes */}
            <div style={{ marginBottom: '10px' }}>
              <SectionHeader>Attributes</SectionHeader>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {Object.entries(player.attributes || {}).map(([attr, val]) => (
                  <div key={attr} style={{
                    background: '#0c0c18', border: '1px solid #1c1c28', borderRadius: '3px',
                    padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{ fontSize: '14px' }}>{ATTR_ICONS[attr] || '◆'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', color: '#303040', textTransform: 'capitalize', fontFamily: 'monospace' }}>{attr}</div>
                      <div style={{ fontSize: '13px', color: '#c0c0d0', fontFamily: 'monospace', fontWeight: 'bold' }}>{val}</div>
                    </div>
                    {/* mini bar */}
                    <div style={{ width: '24px', height: '24px', position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '100%', height: '3px', background: '#101020',
                        borderRadius: '2px', overflow: 'hidden', position: 'absolute', bottom: 0,
                      }}>
                        <div style={{ width: `${Math.min(100, (val / 10) * 100)}%`, height: '100%', background: '#c8882a', borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            {(player.stats?.kills > 0 || player.stats?.dungeonsCleared > 0 || player.stats?.questsCompleted > 0) && (
              <div>
                <SectionHeader>Milestones</SectionHeader>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                  <MilestoneCell icon="💀" label="Kills" value={player.stats?.kills || 0} />
                  <MilestoneCell icon="🏛️" label="Dungeons" value={player.stats?.dungeonsCleared || 0} />
                  <MilestoneCell icon="📜" label="Quests" value={player.stats?.questsCompleted || 0} />
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'skills' && (
          <div>
            {skillsByCategory.map(({ catId, catName, skills }) => {
              const validSkills = skills.filter(s => player.skills?.[s.id]);
              if (!validSkills.length) return null;
              return (
                <div key={catId} style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', color: '#c8882a', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', paddingBottom: '3px', borderBottom: '1px solid #1c1c28' }}>
                    {catName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {validSkills.map(skill => {
                      const ps = player.skills[skill.id];
                      if (!ps) return null;
                      const xpP = Math.min(100, ((ps.xp || 0) / (ps.xpNext || 100)) * 100);
                      const tierColor = ps.level >= 50 ? '#e8a030' : ps.level >= 25 ? '#9858c8' : ps.level >= 10 ? '#5890d8' : '#808080';
                      return (
                        <div key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', width: '18px', textAlign: 'center', flexShrink: 0 }}>{SKILL_ICONS[skill.id] || '●'}</span>
                          <div style={{ width: '90px', flexShrink: 0 }}>
                            <div style={{ fontSize: '11px', color: '#a0a0b0', fontFamily: 'monospace' }}>{skill.name}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ height: '4px', background: '#0e0e18', borderRadius: '2px', overflow: 'hidden', marginBottom: '1px' }}>
                              <div style={{ width: `${xpP}%`, height: '100%', background: tierColor, borderRadius: '2px', transition: 'width 0.3s' }} />
                            </div>
                          </div>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: tierColor, minWidth: '24px', textAlign: 'right', flexShrink: 0, fontWeight: 'bold' }}>
                            {ps.level}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'factions' && (
          <div>
            {factionReps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#1c1c28', fontFamily: 'monospace', fontSize: '12px', fontStyle: 'italic' }}>
                No faction relationships yet.<br />Complete quests and interact with the world.
              </div>
            ) : factionReps.map(({ id, name, rep, label, color }) => {
              const repPct = ((rep + 100) / 200) * 100;
              return (
                <div key={id} style={{ background: '#0c0c18', border: '1px solid #1c1c28', borderRadius: '4px', padding: '10px 12px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#c0c0d0', fontWeight: 'bold' }}>{name}</div>
                    <span style={{ color, fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}>{label}</span>
                  </div>
                  <div style={{ height: '5px', background: '#0e0e18', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px' }}>
                    <div style={{ width: `${repPct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize: '9px', color: '#303040', fontFamily: 'monospace' }}>
                    {rep > 0 ? '+' : ''}{rep} reputation
                  </div>
                </div>
              );
            })}
            {player.factionMemberships?.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '10px', color: '#c8882a', fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: '6px' }}>MEMBERSHIPS</div>
                {player.factionMemberships.map(fid => (
                  <div key={fid} style={{ fontSize: '12px', color: '#c8882a', marginBottom: '3px', fontFamily: 'monospace' }}>
                    ✓ {FACTION_TEMPLATES[fid]?.name || fid}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{ fontSize: '9px', color: '#c8882a', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', paddingBottom: '3px', borderBottom: '1px solid #1c1c28' }}>
      {children}
    </div>
  );
}

function VitalBar({ label, current, max, color }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
      <span style={{ fontSize: '9px', color: '#383848', fontFamily: 'monospace', width: '44px', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '7px', background: '#0e0e18', borderRadius: '3px', overflow: 'hidden', border: '1px solid #1c1c28' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.3s', boxShadow: pct < 30 ? `0 0 6px ${color}` : 'none' }} />
      </div>
      <span style={{ fontSize: '10px', color, fontFamily: 'monospace', minWidth: '60px', textAlign: 'right', flexShrink: 0, fontWeight: 'bold' }}>
        {current}/{max}
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: '#0c0c18', border: '1px solid #1c1c28', borderRadius: '3px', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '8px', color: '#303040', fontFamily: 'monospace', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '14px', color: color || '#c0c0d0', fontFamily: 'monospace', fontWeight: 'bold' }}>{value}</div>
      </div>
    </div>
  );
}

function MilestoneCell({ icon, label, value }) {
  return (
    <div style={{ background: '#0c0c18', border: '1px solid #1c1c28', borderRadius: '3px', padding: '6px', textAlign: 'center' }}>
      <div style={{ fontSize: '16px', marginBottom: '2px' }}>{icon}</div>
      <div style={{ fontSize: '13px', color: '#c0c0d0', fontFamily: 'monospace', fontWeight: 'bold' }}>{value}</div>
      <div style={{ fontSize: '8px', color: '#303040', fontFamily: 'monospace', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}
