import React, { useState } from 'react';
import useGameStore from '../store/gameStore.js';
import { TERRAIN_INFO } from '../engine/map.js';

const DANGER_COLORS = ['', '#60a860', '#c8c050', '#c8882a', '#cc6030', '#cc4444'];
const DANGER_LABELS = ['', 'Calm', 'Unsettled', 'Dangerous', 'Lethal', 'Death Zone'];

const TERRAIN_GLOW = {
  forest: 'rgba(40,120,40,0.06)', plains: 'rgba(180,160,40,0.04)',
  mountains: 'rgba(80,80,120,0.06)', swamp: 'rgba(40,100,60,0.07)',
  desert: 'rgba(180,120,40,0.06)', coast: 'rgba(40,100,160,0.06)',
  tundra: 'rgba(100,140,180,0.05)', ruins: 'rgba(80,60,140,0.06)',
};

export default function WildernessView() {
  const player                = useGameStore(s => s.player);
  const world                 = useGameStore(s => s.world);
  const setView               = useGameStore(s => s.setView);
  const exploreWildernessNode = useGameStore(s => s.exploreWildernessNode);
  const harvestResource       = useGameStore(s => s.harvestResource);
  const searchCache           = useGameStore(s => s.searchCache);
  const interactWanderingNPC  = useGameStore(s => s.interactWanderingNPC);
  const restAtCamp            = useGameStore(s => s.restAtCamp);

  const [activeTab, setActiveTab] = useState('explore');

  const region    = world?.regions?.find(r => r.x === player?.location?.regionX && r.y === player?.location?.regionY);
  const wilderness = region?.wilderness;

  if (!region || !wilderness) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', background: '#0a0a12' }}>
        <div style={{ color: '#282838', fontSize: '14px', fontFamily: 'monospace' }}>No wilderness data for this region.</div>
        <button onClick={() => setView('world')} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #1c1c28', color: '#383848', borderRadius: '3px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px' }}>← Back to Map</button>
      </div>
    );
  }

  const terrainInfo     = TERRAIN_INFO[region.terrain] || TERRAIN_INFO.plains;
  const activeEncounters = wilderness.encounters.filter(e => !e.cleared && !e.looted);
  const activeNPCs      = wilderness.wanderingNPCs.filter(n => !n.departed);
  const activeCaches    = wilderness.caches || [];
  const dc              = DANGER_COLORS[region.dangerLevel] || '#808080';
  const glow            = TERRAIN_GLOW[region.terrain] || 'transparent';

  const exploreCount = activeEncounters.length + activeNPCs.length + activeCaches.filter(c => !c.looted).length;
  const forageCount  = (wilderness.resources || []).filter(r => !r.harvested).length;

  const TABS = [
    { id: 'explore', label: 'Explore', icon: '⚔️', badge: exploreCount },
    { id: 'forage',  label: 'Forage',  icon: '🌿', badge: forageCount },
    { id: 'camp',    label: 'Camp',    icon: '🏕️', badge: 0 },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0a12' }}>

      {/* ── Header with terrain banner ── */}
      <div style={{
        padding: '10px 12px', background: glow || '#0c0c18',
        borderBottom: '1px solid #1c1c28', flexShrink: 0,
        backgroundImage: `linear-gradient(to right, ${glow}, transparent)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>{terrainInfo.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#f4e858', fontWeight: 'bold' }}>{region.name}</div>
            <div style={{ fontSize: '10px', color: '#404050', fontFamily: 'monospace', textTransform: 'capitalize' }}>
              {region.terrain} Wilderness
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: dc, fontFamily: 'monospace', fontWeight: 'bold' }}>
              ⚠ {DANGER_LABELS[region.dangerLevel] || 'Unknown'}
            </div>
            <div style={{ fontSize: '9px', color: '#282838', fontFamily: 'monospace' }}>Danger {region.dangerLevel}</div>
          </div>
          <button onClick={() => setView('world')} style={{
            padding: '4px 10px', background: 'transparent', border: '1px solid #1c1c28',
            color: '#383848', borderRadius: '3px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px',
          }}>← Map</button>
        </div>
      </div>

      {/* ── Landmark ── */}
      {wilderness.landmarkName && (
        <div style={{ padding: '8px 12px', background: '#0c0c1a', borderBottom: '1px solid #1c1c28', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#c8882a', fontWeight: 'bold', marginBottom: '2px' }}>
                {wilderness.landmarkName}
              </div>
              <div style={{ fontSize: '11px', color: '#505060', fontFamily: 'serif', fontStyle: 'italic', lineHeight: 1.5 }}>
                {wilderness.landmarkDesc}
              </div>
            </div>
            {!wilderness.landmarkExplored ? (
              <button onClick={() => exploreWildernessNode(region.id, 'landmark')} style={{
                padding: '5px 10px', background: 'transparent', border: '1px solid rgba(200,136,42,0.3)',
                color: '#c8882a', borderRadius: '3px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', flexShrink: 0,
              }}>🔍 Investigate</button>
            ) : (
              <span style={{ fontSize: '9px', color: '#252535', fontFamily: 'monospace' }}>EXPLORED</span>
            )}
          </div>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', background: '#0a0a14', borderBottom: '1px solid #1c1c28', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: '7px 4px', border: 'none',
            background: activeTab === t.id ? 'rgba(200,136,42,0.08)' : 'transparent',
            color: activeTab === t.id ? '#c8882a' : '#383848',
            borderBottom: activeTab === t.id ? '2px solid #c8882a' : '2px solid transparent',
            cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.06em',
          }}>
            {t.icon} {t.label}
            {t.badge > 0 && (
              <span style={{ marginLeft: '4px', background: activeTab === t.id ? 'rgba(200,136,42,0.3)' : '#1c1c28', color: activeTab === t.id ? '#c8882a' : '#505060', borderRadius: '8px', padding: '0 5px', fontSize: '9px' }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>

        {/* Explore */}
        {activeTab === 'explore' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

            {/* Wandering NPCs */}
            {activeNPCs.map(npc => {
              const isHostile = npc.attitude === 'hostile';
              const borderC = isHostile ? 'rgba(180,40,40,0.3)' : npc.attitude === 'friendly' ? 'rgba(40,160,80,0.2)' : '#1c1c28';
              return (
                <EncounterCard key={npc.id} borderColor={borderC}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '16px' }}>{isHostile ? '⚔️' : npc.attitude === 'friendly' ? '😊' : '👤'}</span>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', color: isHostile ? '#cc5050' : npc.attitude === 'friendly' ? '#60a860' : '#c0c0d0', fontWeight: 'bold' }}>
                        {npc.name}
                      </div>
                      <div style={{ fontSize: '9px', color: '#303040', fontFamily: 'monospace', textTransform: 'capitalize' }}>{npc.occupation}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#505060', fontStyle: 'italic', fontFamily: 'serif', lineHeight: 1.55, marginBottom: '8px' }}>
                    "{npc.dialogue?.[0]}"
                  </div>
                  <WildBtn
                    color={isHostile ? '#cc5050' : '#808090'}
                    onClick={() => interactWanderingNPC(region.id, npc.id)}
                  >
                    {isHostile ? '⚔️ Fight' : '💬 Speak'}
                  </WildBtn>
                </EncounterCard>
              );
            })}

            {/* Encounters */}
            {wilderness.encounters.map(enc => {
              const cleared = enc.cleared || enc.looted;
              const isCombat = enc.interactionType === 'combat';
              return (
                <EncounterCard key={enc.id} borderColor={cleared ? '#181820' : isCombat ? 'rgba(180,60,60,0.25)' : '#1c1c28'} dim={cleared}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px', opacity: cleared ? 0.4 : 1 }}>{enc.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', color: cleared ? '#282838' : '#c0c0d0', fontWeight: 'bold' }}>
                        {enc.name}
                      </div>
                    </div>
                    {cleared
                      ? <span style={{ fontSize: '9px', color: '#1c1c28', fontFamily: 'monospace' }}>CLEARED</span>
                      : <span style={{ fontSize: '9px', color: DANGER_COLORS[enc.dangerLevel] || '#808080', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          ⚠ {enc.dangerLevel}
                        </span>
                    }
                  </div>
                  <div style={{ fontSize: '11.5px', color: cleared ? '#202030' : '#505060', fontFamily: 'monospace', lineHeight: 1.5, marginBottom: cleared ? 0 : '8px' }}>
                    {enc.description}
                  </div>
                  {!cleared && (
                    <WildBtn
                      color={isCombat ? '#cc5050' : '#808090'}
                      onClick={() => exploreWildernessNode(region.id, 'encounter', enc.id)}
                    >
                      {isCombat ? '⚔️ Engage' : enc.interactionType === 'rest' ? '🏕️ Enter' : enc.interactionType === 'loot' ? '📦 Loot' : '🔍 Explore'}
                    </WildBtn>
                  )}
                </EncounterCard>
              );
            })}

            {/* Caches */}
            {activeCaches.map(cache => (
              <EncounterCard key={cache.id} borderColor={cache.looted ? '#181820' : '#1c2840'} dim={cache.looted}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', opacity: cache.looted ? 0.3 : 1 }}>📦</span>
                  <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px', color: cache.looted ? '#282838' : '#c0c0d0', fontWeight: 'bold' }}>
                    {cache.found ? cache.name : 'Something Hidden Nearby'}
                  </div>
                  {cache.looted && <span style={{ fontSize: '9px', color: '#1c1c28', fontFamily: 'monospace' }}>LOOTED</span>}
                </div>
                <div style={{ fontSize: '11.5px', color: '#505060', fontFamily: 'monospace', lineHeight: 1.5, marginBottom: cache.looted ? 0 : '8px' }}>
                  {cache.found && !cache.looted ? 'You found a hidden cache. Open it?' : !cache.found ? 'Something may be concealed in this area...' : 'Empty.'}
                </div>
                {!cache.looted && (
                  <WildBtn color="#5890d8" onClick={() => searchCache(region.id, cache.id)}>
                    {cache.found ? '📦 Open Cache' : '🔍 Search Area'}
                  </WildBtn>
                )}
              </EncounterCard>
            ))}

            {/* Lore fragment */}
            {wilderness.loreFragment && (
              <EncounterCard borderColor={wilderness.loreFragment.found ? '#1a1a2a' : 'rgba(88,144,216,0.15)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>📜</span>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c0c0d0', fontWeight: 'bold' }}>
                    {wilderness.loreFragment.found
                      ? (wilderness.loreFragment.type?.charAt(0).toUpperCase() + wilderness.loreFragment.type?.slice(1) || 'Inscription')
                      : 'Unusual Markings'
                    }
                  </div>
                </div>
                {wilderness.loreFragment.found
                  ? <div style={{ fontSize: '12px', color: '#808090', fontStyle: 'italic', fontFamily: 'serif', lineHeight: 1.65 }}>"{wilderness.loreFragment.text}"</div>
                  : (
                    <>
                      <div style={{ fontSize: '11.5px', color: '#505060', fontFamily: 'monospace', marginBottom: '8px' }}>
                        You notice something inscribed nearby...
                      </div>
                      <WildBtn color="#5890d8" onClick={() => exploreWildernessNode(region.id, 'lore')}>🔍 Examine</WildBtn>
                    </>
                  )
                }
              </EncounterCard>
            )}

            {exploreCount === 0 && wilderness.landmarkExplored && (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: '#1c1c28', fontFamily: 'monospace', fontSize: '12px', fontStyle: 'italic' }}>
                You have explored everything this region offers.
              </div>
            )}
          </div>
        )}

        {/* Forage */}
        {activeTab === 'forage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(wilderness.resources || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#1c1c28', fontFamily: 'monospace', fontStyle: 'italic' }}>No resources in this region.</div>
            )}
            {(wilderness.resources || []).map(res => (
              <EncounterCard key={res.id} borderColor={res.harvested ? '#181820' : 'rgba(40,160,80,0.15)'} dim={res.harvested}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', opacity: res.harvested ? 0.3 : 1 }}>{res.icon}</span>
                  <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px', color: res.harvested ? '#282838' : '#c0c0d0', fontWeight: 'bold' }}>
                    {res.name}
                  </div>
                  {!res.harvested && <span style={{ fontSize: '10px', color: '#60a860', fontFamily: 'monospace' }}>×{res.count}</span>}
                  {res.harvested && <span style={{ fontSize: '9px', color: '#1c1c28', fontFamily: 'monospace' }}>HARVESTED</span>}
                </div>
                <div style={{ fontSize: '11.5px', color: '#505060', fontFamily: 'monospace', lineHeight: 1.5, marginBottom: res.harvested ? 0 : '8px' }}>
                  {res.description}
                </div>
                {!res.harvested && (
                  <WildBtn color="#60a860" onClick={() => harvestResource(region.id, res.id)}>🌿 Harvest</WildBtn>
                )}
              </EncounterCard>
            ))}
            {(wilderness.resources || []).every(r => r.harvested) && wilderness.resources?.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#1c1c28', fontFamily: 'monospace', fontStyle: 'italic', fontSize: '12px' }}>
                All resources harvested.
              </div>
            )}
          </div>
        )}

        {/* Camp */}
        {activeTab === 'camp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <EncounterCard borderColor="rgba(200,136,42,0.15)">
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c8882a', fontWeight: 'bold', marginBottom: '8px' }}>🏕️ Set Camp</div>
              <p style={{ fontSize: '12px', color: '#606070', lineHeight: 1.65, marginBottom: '12px', fontFamily: 'monospace' }}>
                Find cover and rest to recover your strength.
                {region.dangerLevel >= 3 && ' This region is dangerous — a night attack is possible.'}
                {wilderness.campSetHere && ' You have camped here before.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <CampBtn icon="💤" label="Short Rest" detail="2 hrs · +30% HP &amp; Stamina" onClick={() => restAtCamp(region.id, 'short')} />
                <CampBtn icon="🌙" label="Long Rest" detail="Until dawn · Full HP · Advances day" onClick={() => restAtCamp(region.id, 'long')} />
              </div>
            </EncounterCard>

            <div style={{ background: '#0c0c18', border: '1px solid #1c1c28', borderLeft: `3px solid ${dc}`, borderRadius: '4px', padding: '10px 12px' }}>
              <div style={{ fontSize: '10px', color: dc, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: '4px' }}>
                NIGHT ATTACK RISK
              </div>
              <div style={{ fontSize: '11px', color: '#505060', fontFamily: 'monospace', lineHeight: 1.6 }}>
                Danger {region.dangerLevel}: ~{Math.min(75, 7 + (region.dangerLevel - 1) * 15)}% chance of ambush during a long rest.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EncounterCard({ children, borderColor, dim }) {
  return (
    <div style={{
      background: '#0c0c18', border: `1px solid ${borderColor || '#1c1c28'}`,
      borderRadius: '4px', padding: '10px 12px',
      opacity: dim ? 0.5 : 1, transition: 'opacity 0.2s',
    }}>
      {children}
    </div>
  );
}

function WildBtn({ children, onClick, color }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 12px', fontSize: '10px', fontFamily: 'monospace',
        background: h ? `${color}18` : 'transparent',
        border: `1px solid ${h ? color : color + '50'}`,
        color, borderRadius: '3px', cursor: 'pointer', transition: 'all 0.1s',
      }}>{children}</button>
  );
}

function CampBtn({ icon, label, detail, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '8px 12px', background: h ? 'rgba(200,136,42,0.06)' : 'transparent',
        border: `1px solid ${h ? 'rgba(200,136,42,0.3)' : '#1c1c28'}`,
        borderRadius: '3px', cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.12s',
      }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: h ? '#c8882a' : '#c0c0d0', fontWeight: 'bold' }}>{label}</div>
        <div style={{ fontSize: '9px', color: '#383848', fontFamily: 'monospace' }}>{detail}</div>
      </div>
    </button>
  );
}
