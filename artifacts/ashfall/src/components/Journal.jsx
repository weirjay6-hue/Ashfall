import React, { useState } from 'react';
import useGameStore from '../store/gameStore.js';

const LOG_COLORS = {
  info:     '#808090', success:  '#60a860', error:   '#cc4444',
  warning:  '#e8a030', combat:   '#cc5050', world:   '#5890d8',
  travel:   '#c8882a', story:    '#f4e858', quest:   '#f4e858',
  loot:     '#c8882a', dialogue: '#a0a0a8', system:  '#9858c8',
  danger:   '#cc4444',
};

const LOG_ICONS = {
  combat: '⚔️', success: '✓', error: '✗', warning: '⚠',
  world: '🌍', travel: '🚶', story: '📖', quest: '📜',
  loot: '💰', system: '⚙', dialogue: '💬', danger: '⚡',
};

const QUEST_STATUS_COLORS = { active: '#c8882a', completed: '#60a860', failed: '#cc4444' };
const QUEST_STATUS_BG     = { active: 'rgba(200,136,42,0.08)', completed: 'rgba(96,168,96,0.06)', failed: 'rgba(204,68,68,0.06)' };

export default function Journal() {
  const player  = useGameStore(s => s.player);
  const world   = useGameStore(s => s.world);
  const gameLog = useGameStore(s => s.gameLog);
  const [tab,           setTab]           = useState('quests');
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [logFilter,     setLogFilter]     = useState('all');

  if (!player) return null;

  const quests = player.journal || [];
  const activeQuests    = quests.filter(q => q.status === 'active');
  const completedQuests = quests.filter(q => q.status === 'completed');
  const failedQuests    = quests.filter(q => q.status === 'failed');
  const worldHistory    = world?.history?.slice(-20).reverse() || [];

  const filteredLog = logFilter === 'all'
    ? gameLog.slice(0, 80)
    : gameLog.filter(e => e.type === logFilter || (logFilter === 'combat' && ['combat','danger'].includes(e.type))).slice(0, 80);

  const TABS = [
    { id: 'quests',  label: 'Quests',  icon: '📜', badge: activeQuests.length },
    { id: 'log',     label: 'Log',     icon: '📋', badge: 0 },
    { id: 'codex',   label: 'Codex',   icon: '📚', badge: player.codex?.length || 0 },
    { id: 'history', label: 'World',   icon: '🌍', badge: 0 },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0a12' }}>

      {/* ── Header ── */}
      <div style={{ padding: '7px 12px', background: '#0c0c18', borderBottom: '1px solid #1c1c28', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#c8882a', letterSpacing: '0.15em', fontWeight: 'bold' }}>📜 JOURNAL</span>
        {activeQuests.length > 0 && (
          <span style={{ background: 'rgba(200,136,42,0.15)', color: '#c8882a', border: '1px solid rgba(200,136,42,0.3)', borderRadius: '2px', padding: '1px 7px', fontSize: '10px', fontFamily: 'monospace' }}>
            {activeQuests.length} active
          </span>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', background: '#0a0a14', borderBottom: '1px solid #1c1c28', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '7px 4px', border: 'none',
            background: tab === t.id ? 'rgba(200,136,42,0.08)' : 'transparent',
            color: tab === t.id ? '#c8882a' : '#383848',
            borderBottom: tab === t.id ? '2px solid #c8882a' : '2px solid transparent',
            cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.06em',
          }}>
            {t.icon}{t.badge > 0 ? ` ${t.badge}` : ''} {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>

        {/* ── Quests ── */}
        {tab === 'quests' && (
          <div>
            {quests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#1c1c28', fontFamily: 'monospace', fontSize: '12px', fontStyle: 'italic' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.3 }}>📜</div>
                No quests yet. Talk to townsfolk to find work.
              </div>
            )}

            {activeQuests.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <SectionLabel color="#c8882a">ACTIVE — {activeQuests.length}</SectionLabel>
                {activeQuests.map(q => (
                  <QuestCard key={q.id} quest={q}
                    selected={selectedQuest?.id === q.id}
                    onClick={() => setSelectedQuest(selectedQuest?.id === q.id ? null : q)}
                  />
                ))}
              </div>
            )}

            {completedQuests.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <SectionLabel color="#404840">COMPLETED — {completedQuests.length}</SectionLabel>
                {completedQuests.slice(0, 8).map(q => (
                  <QuestCard key={q.id} quest={q} selected={false} onClick={() => {}} />
                ))}
              </div>
            )}

            {failedQuests.length > 0 && (
              <div>
                <SectionLabel color="#442020">FAILED — {failedQuests.length}</SectionLabel>
                {failedQuests.slice(0, 4).map(q => (
                  <QuestCard key={q.id} quest={q} selected={false} onClick={() => {}} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Game Log ── */}
        {tab === 'log' && (
          <div>
            {/* Quick filters */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['all','combat','quest','loot','travel','world'].map(f => (
                <button key={f} onClick={() => setLogFilter(f)} style={{
                  padding: '2px 8px', fontSize: '9px', fontFamily: 'monospace',
                  background: logFilter === f ? 'rgba(200,136,42,0.12)' : 'transparent',
                  border: `1px solid ${logFilter === f ? '#c8882a' : '#1c1c28'}`,
                  color: logFilter === f ? '#c8882a' : '#383848',
                  borderRadius: '3px', cursor: 'pointer', textTransform: 'capitalize',
                }}>{LOG_ICONS[f] || '●'} {f}</button>
              ))}
            </div>
            {filteredLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#1c1c28', fontFamily: 'monospace', fontStyle: 'italic' }}>No entries yet.</div>
            ) : filteredLog.map((entry, i) => {
              const c = LOG_COLORS[entry.type] || '#808090';
              const ic = LOG_ICONS[entry.type] || '';
              return (
                <div key={i} style={{
                  display: 'flex', gap: '8px', alignItems: 'flex-start',
                  padding: '5px 0', borderBottom: '1px solid #12121c',
                  fontSize: '11.5px', lineHeight: 1.55,
                }}>
                  <span style={{ fontSize: '12px', flexShrink: 0, width: '16px', textAlign: 'center', marginTop: '1px' }}>{ic}</span>
                  <span style={{ color: c, flex: 1, fontFamily: entry.type === 'dialogue' ? 'serif' : 'monospace', fontStyle: entry.type === 'dialogue' ? 'italic' : 'normal' }}>
                    {entry.message}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Codex ── */}
        {tab === 'codex' && (
          <div>
            {!player.codex?.length ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#1c1c28', fontFamily: 'monospace', fontStyle: 'italic' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.3 }}>📚</div>
                No lore discovered.<br />Explore ruins, shrines, and forgotten places.
              </div>
            ) : (
              <>
                <div style={{ fontSize: '9px', color: '#303040', marginBottom: '10px', fontFamily: 'monospace' }}>
                  {player.codex.length} lore fragment{player.codex.length !== 1 ? 's' : ''} recovered
                </div>
                {player.codex.map((entry, i) => (
                  <div key={entry.id || i} style={{ marginBottom: '10px', background: '#0c0c18', border: '1px solid rgba(88,144,216,0.15)', borderLeft: '3px solid rgba(88,144,216,0.4)', borderRadius: '4px', padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#f4e858', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                      📜 {entry.title || entry.type}
                    </div>
                    <div style={{ fontSize: '12px', color: '#808090', lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'serif' }}>
                      "{entry.text}"
                    </div>
                    {entry.source && (
                      <div style={{ fontSize: '9px', color: '#252535', marginTop: '7px', fontFamily: 'monospace' }}>
                        — {entry.source.replace(/_/g, ' ')} · Day {entry.discoveredAt}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── World History ── */}
        {tab === 'history' && (
          <div>
            <div style={{ fontSize: '9px', color: '#282838', marginBottom: '10px', fontFamily: 'monospace' }}>
              World Seed: <span style={{ color: '#404050' }}>{world?.seed}</span>
            </div>
            {worldHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#1c1c28', fontFamily: 'monospace', fontStyle: 'italic' }}>No world events yet.</div>
            ) : worldHistory.map((entry, i) => (
              <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid #12121c', fontSize: '12px', color: '#606070', fontFamily: 'monospace', lineHeight: 1.55, paddingLeft: '10px', borderLeft: '2px solid #1c2040' }}>
                {entry}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children, color }) {
  return (
    <div style={{ fontSize: '9px', color, fontFamily: 'monospace', letterSpacing: '0.12em', marginBottom: '6px', paddingBottom: '3px', borderBottom: '1px solid #1c1c28' }}>
      {children}
    </div>
  );
}

function QuestCard({ quest, selected, onClick }) {
  const sc = QUEST_STATUS_COLORS[quest.status] || '#808090';
  const pct = quest.progressMax > 1 ? Math.min(100, (quest.progress / quest.progressMax) * 100) : quest.status === 'completed' ? 100 : 0;

  return (
    <div style={{ marginBottom: '4px' }}>
      <div onClick={onClick} style={{
        cursor: 'pointer', background: selected ? QUEST_STATUS_BG[quest.status] : '#0c0c18',
        border: `1px solid ${selected ? sc + '50' : '#1c1c28'}`,
        borderRadius: selected ? '4px 4px 0 0' : '4px',
        padding: '9px 11px', transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#2c2c40'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#1c1c28'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: quest.status === 'active' ? '#f4e858' : '#606070', fontWeight: 'bold', flex: 1, paddingRight: '8px' }}>
            {quest.title}
          </div>
          <span style={{ fontSize: '9px', color: sc, fontFamily: 'monospace', letterSpacing: '0.08em', flexShrink: 0, fontWeight: 'bold' }}>
            {quest.status.toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#505060', fontFamily: 'monospace', marginBottom: pct > 0 ? '6px' : 0 }}>
          {quest.objective}
        </div>
        {pct > 0 && (
          <div style={{ height: '3px', background: '#0e0e18', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: sc, borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
        )}
      </div>

      {selected && (
        <div style={{ background: '#090910', border: `1px solid ${sc}30`, borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '10px 12px' }}>
          {quest.description && (
            <div style={{ fontSize: '12px', color: '#606070', lineHeight: 1.65, marginBottom: '10px', fontStyle: 'italic', fontFamily: 'serif' }}>
              {quest.description}
            </div>
          )}
          {(quest.reward?.gold || quest.reward?.xp || quest.reward?.reputation) && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '9px', color: '#282838', fontFamily: 'monospace', marginBottom: '3px' }}>REWARDS</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {quest.reward?.gold && (
              <span style={{ fontSize: '11px', color: '#c8a030', fontFamily: 'monospace', background: 'rgba(200,160,48,0.08)', padding: '2px 8px', borderRadius: '3px', border: '1px solid rgba(200,160,48,0.2)' }}>
                💰 +{quest.reward.gold}g
              </span>
            )}
            {quest.reward?.xp && (
              <span style={{ fontSize: '11px', color: '#c8882a', fontFamily: 'monospace', background: 'rgba(200,136,42,0.08)', padding: '2px 8px', borderRadius: '3px', border: '1px solid rgba(200,136,42,0.2)' }}>
                ⭐ +{quest.reward.xp} XP
              </span>
            )}
            {quest.reward?.reputation && (
              <span style={{ fontSize: '11px', color: '#60a860', fontFamily: 'monospace', background: 'rgba(96,168,96,0.08)', padding: '2px 8px', borderRadius: '3px', border: '1px solid rgba(96,168,96,0.2)' }}>
                🏛 +{quest.reward.reputation} rep
              </span>
            )}
          </div>
          {quest.giverName && (
            <div style={{ fontSize: '9px', color: '#252535', marginTop: '8px', fontFamily: 'monospace' }}>
              Given by: {quest.giverName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
