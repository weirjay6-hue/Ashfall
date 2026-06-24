import React, { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore.js';
import { getDialogue, generateRumorText, generateNPCPocket, pickpocketSuccessChance } from '../engine/npc.js';
import { getSellPrice } from '../engine/economy.js';
import { generateItem } from '../engine/items.js';
import { RNG } from '../engine/rng.js';
import TownMap from './TownMap.jsx';
import WagonTravel from './WagonTravel.jsx';
import ShopView from './ShopView.jsx';

const BUILDING_TAB_MAP = {
  inn: 'shop', tavern: 'shop', market: 'shop',
  general_store: 'shop', blacksmith: 'shop', alchemist: 'craft',
  temple: 'overview', guild: 'overview', barracks: 'overview', keep: 'overview',
};

const SHOP_INTERIOR_TYPES = new Set(['inn','tavern','market','general_store','blacksmith','alchemist']);

export default function TownView() {
  const world = useGameStore(s => s.world);
  const player = useGameStore(s => s.player);
  const rest = useGameStore(s => s.rest);
  const restoreStamina = useGameStore(s => s.restoreStamina);
  const buyItem = useGameStore(s => s.buyItem);
  const sellItem = useGameStore(s => s.sellItem);
  const takeQuestFromNPC = useGameStore(s => s.takeQuestFromNPC);
  const craftItem = useGameStore(s => s.craftItem);
  const addLog = useGameStore(s => s.addLog);
  const setView = useGameStore(s => s.setView);
  const startCombat = useGameStore(s => s.startCombat);
  const stealFromNPC = useGameStore(s => s.stealFromNPC);
  const assistNPC = useGameStore(s => s.assistNPC);
  const attackNPC = useGameStore(s => s.attackNPC);
  const pickpocketNPCItem = useGameStore(s => s.pickpocketNPCItem);
  const lootHouseContainer = useGameStore(s => s.lootHouseContainer);
  const sneaking = useGameStore(s => s.sneaking);
  const lootedContainers = useGameStore(s => s.lootedContainers);
  const bounties = useGameStore(s => s.bounties);
  const killedNPCs = useGameStore(s => s.killedNPCs);
  const triggerGuardEncounter = useGameStore(s => s.triggerGuardEncounter);
  const assassinateNPC = useGameStore(s => s.assassinateNPC);
  const flattenNPC = useGameStore(s => s.flattenNPC);
  const bribeNPC = useGameStore(s => s.bribeNPC);
  const threatenNPC = useGameStore(s => s.threatenNPC);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedNPC, setSelectedNPC] = useState(null);
  const [showShop, setShowShop] = useState(null);
  const [expandedHouse, setExpandedHouse] = useState(null);
  const [townPhase, setTownPhase] = useState('map');
  const [activeBuildingLabel, setActiveBuildingLabel] = useState('');
  const [showWagon, setShowWagon] = useState(false);
  const [shopBuilding, setShopBuilding] = useState(null);

  useEffect(() => {
    if (!world || !player) return;
    const { regionX: rx, regionY: ry } = player.location;
    const reg = world.regions.find(r => r.x === rx && r.y === ry);
    const settl = reg?.settlements?.find(s => s.id === player.location.id) || reg?.settlements?.[0];
    if (!settl || !reg) return;
    const bounty = bounties[reg.id] || 0;
    if (bounty <= 0) return;
    const detectChance = bounty < 100 ? 0.22 : bounty < 300 ? 0.60 : 0.92;
    if (Math.random() < detectChance) {
      setTimeout(() => triggerGuardEncounter(reg.id, settl.id), 700);
    }
  }, [player?.location?.id]);

  if (!world || !player) return null;

  const { regionX, regionY } = player.location;
  const region = world.regions.find(r => r.x === regionX && r.y === regionY);
  const settlement = region?.settlements?.find(s => s.id === player.location.id) || region?.settlements?.[0];

  if (!settlement) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌍</div>
        <h3 style={{ marginBottom: '8px' }}>Wilderness</h3>
        <p style={{ color: 'var(--ash-text-dim)', textAlign: 'center', marginBottom: '16px' }}>You are in the wilderness. Find a settlement to rest and trade.</p>
        <button className="btn btn-primary" onClick={() => setView('world')}>View Map</button>
      </div>
    );
  }

  function handleEnterBuilding(buildingData) {
    if (buildingData.kind === 'house') {
      setSelectedNPC(buildingData.npc);
      setActiveTab('npcs');
      setActiveBuildingLabel(`🏠 ${buildingData.name}`);
      setTownPhase('panel');
    } else if (SHOP_INTERIOR_TYPES.has(buildingData.type)) {
      setShopBuilding(buildingData);
      setTownPhase('interior');
    } else {
      setSelectedNPC(null);
      const tab = BUILDING_TAB_MAP[buildingData.type] || 'overview';
      setActiveTab(tab);
      setActiveBuildingLabel(`${buildingData.icon} ${buildingData.name}`);
      setTownPhase('panel');
    }
  }

  function handleTalkToNPC(npc) {
    setSelectedNPC(npc);
    setActiveTab('npcs');
    setActiveBuildingLabel(`💬 ${npc.name}`);
    setTownPhase('panel');
  }

  if (townPhase === 'map') {
    return (
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TownMap
          settlement={settlement}
          onEnterBuilding={handleEnterBuilding}
          onExitTown={() => setView('world')}
          onTalkToNPC={handleTalkToNPC}
          onOpenWagon={() => setShowWagon(true)}
        />
        {showWagon && <WagonTravel onClose={() => setShowWagon(false)} />}
      </div>
    );
  }

  if (townPhase === 'interior' && shopBuilding) {
    return (
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ShopView
          buildingType={shopBuilding.type}
          buildingName={shopBuilding.name}
          buildingIcon={shopBuilding.icon}
          settlement={settlement}
          onExit={() => { setTownPhase('map'); setShopBuilding(null); }}
        />
      </div>
    );
  }

  const rng = new RNG(settlement.id || 'shop');
  const shopItems = generateShopInventory(settlement, rng);
  const houseRng = new RNG((settlement.id || 'house') + '_h');
  const settlementHouses = generateSettlementHouses(settlement, houseRng);
  const TABS = ['overview', 'npcs', 'burgle', 'shop', 'craft', 'quests'];
  const TAB_ICONS = { overview: '🏛️', npcs: '👥', burgle: '🗡️', shop: '🛒', craft: '⚒️', quests: '📜' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Back to town map bar */}
      <div style={{ padding: '5px 10px', background: 'var(--ash-dark)', borderBottom: '1px solid var(--ash-border)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setTownPhase('map'); setSelectedNPC(null); }}
          style={{ fontSize: '11px', padding: '3px 8px' }}
        >
          ← Town Map
        </button>
        <span style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--ash-gold)' }}>
          {activeBuildingLabel || settlement.name}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--ash-text-dim)', marginLeft: 'auto' }}>
          Pop. {settlement.population.toLocaleString()} · Stability {settlement.stability}%
        </span>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--ash-border)', background: 'var(--ash-dark)' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '6px 2px', border: 'none', background: activeTab === tab ? 'var(--ash-charcoal)' : 'transparent', color: activeTab === tab ? 'var(--ash-amber)' : 'var(--ash-text-dim)', borderBottom: activeTab === tab ? '2px solid var(--ash-amber)' : '2px solid transparent', cursor: 'pointer', fontFamily: 'var(--font-title)', fontSize: '9px', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
            <span style={{ fontSize: '13px' }}>{TAB_ICONS[tab]}</span>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {activeTab === 'overview' && (
          <div className="anim-fade">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {settlement.buildings?.map(b => (
                <div key={b} className="panel" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => {
                  if (b === 'inn') rest();
                  else if (b === 'market' || b === 'general_store' || b === 'blacksmith' || b === 'alchemist') { setActiveTab('shop'); setShowShop(b); }
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{getBuildingIcon(b)}</div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '11px', color: 'var(--ash-amber)', textTransform: 'capitalize', letterSpacing: '0.05em' }}>
                    {b.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-header">Local Events</div>
              {settlement.events?.length > 0 ? settlement.events.slice(0,3).map((e,i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--ash-text)', marginBottom: '6px' }}>{e.desc}</div>
              )) : (
                <div style={{ fontSize: '13px', color: 'var(--ash-text-dim)', fontStyle: 'italic' }}>The settlement is quiet today.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'npcs' && (
          <div className="anim-fade">
            {selectedNPC ? (
              <NPCDialog
                npc={selectedNPC}
                player={player}
                region={region}
                settlement={settlement}
                world={world}
                sneaking={sneaking}
                onClose={() => setSelectedNPC(null)}
                onTakeQuest={() => { takeQuestFromNPC(selectedNPC, region); setSelectedNPC(null); }}
                onAddLog={addLog}
                onPickpocket={(item) => pickpocketNPCItem(selectedNPC, item, settlement.id)}
                onSteal={() => { stealFromNPC(selectedNPC, settlement.id); setSelectedNPC(null); }}
                onAssist={() => { assistNPC(selectedNPC, settlement.id, 10); setSelectedNPC(null); }}
                onAttack={() => { attackNPC(selectedNPC, settlement.id); setSelectedNPC(null); }}
                onAssassinate={() => { assassinateNPC(selectedNPC, settlement.id); setSelectedNPC(null); }}
                onFlatten={() => flattenNPC(selectedNPC, settlement.id)}
                onBribe={(amount) => { bribeNPC(selectedNPC, settlement.id, amount); }}
                onThreaten={() => { threatenNPC(selectedNPC, settlement.id); setSelectedNPC(null); }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(() => {
                  const visibleNPCs = (settlement.npcs || []).filter(npc => {
                    if (!npc.deceased) return true;
                    const kill = killedNPCs[npc.id];
                    return !kill || (world.day - (kill.killedAt || 0)) < 7;
                  });
                  if (visibleNPCs.length === 0) {
                    return <div style={{ color: 'var(--ash-text-dim)', fontStyle: 'italic', textAlign: 'center', padding: '24px' }}>No notable people around.</div>;
                  }
                  return visibleNPCs.map(npc => {
                    const dead = !!npc.deceased;
                    return (
                      <div key={npc.id}
                        onClick={() => !dead && setSelectedNPC(npc)}
                        style={{ background: 'var(--ash-charcoal)', border: `1px solid ${dead ? 'rgba(80,80,80,0.25)' : 'var(--ash-border)'}`, borderRadius: 'var(--radius)', padding: '10px 12px', textAlign: 'left', cursor: dead ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '12px', opacity: dead ? 0.52 : 1, transition: 'border-color 0.12s' }}
                        onMouseEnter={e => !dead && (e.currentTarget.style.borderColor = 'rgba(200,136,42,0.4)')}
                        onMouseLeave={e => !dead && (e.currentTarget.style.borderColor = 'var(--ash-border)')}>
                        <div style={{ fontSize: '28px' }}>{dead ? '⚰️' : getNPCIcon(npc.occupation)}</div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-title)', fontSize: '14px', color: dead ? 'var(--ash-text-dim)' : 'var(--ash-text-bright)', textDecoration: dead ? 'line-through' : 'none' }}>{npc.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--ash-text-dim)', textTransform: 'capitalize' }}>{dead ? 'Deceased' : npc.occupation}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          {!dead && npc.hasQuest && <span style={{ background: 'rgba(212,168,67,0.2)', color: 'var(--ash-gold)', border: '1px solid var(--ash-amber-dim)', borderRadius: '2px', padding: '2px 6px', fontSize: '10px', fontFamily: 'var(--font-title)' }}>QUEST</span>}
                          {!dead && <span style={{ color: getAttitudeColor(npc.attitude), fontSize: '10px' }}>● {npc.attitude}</span>}
                          {dead && <span style={{ fontSize: '10px', color: 'var(--ash-text-dim)', fontFamily: 'var(--font-title)', fontStyle: 'italic' }}>deceased</span>}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'burgle' && (
          <div className="anim-fade">
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--ash-amber)', marginBottom: '4px' }}>🗡️ Burglary</div>
              <div style={{ fontSize: '12px', color: 'var(--ash-text-dim)', lineHeight: 1.5 }}>
                Search residences for valuables. Sneaking lowers the chance of being caught.
              </div>
              {sneaking && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#80d890', background: 'rgba(60,160,80,0.1)', border: '1px solid rgba(60,160,80,0.25)', borderRadius: 'var(--radius)', padding: '5px 10px' }}>
                  🤫 Sneaking active — reduced detection chance
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {settlementHouses.map(house => (
                <div key={house.idx} style={{ background: 'var(--ash-charcoal)', border: '1px solid var(--ash-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <button onClick={() => setExpandedHouse(expandedHouse === house.idx ? null : house.idx)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ash-text)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>🏠</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--ash-gold)' }}>{house.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--ash-text-dim)' }}>{house.containers.length} container{house.containers.length !== 1 ? 's' : ''} inside</div>
                      </div>
                    </div>
                    <span style={{ color: 'var(--ash-text-dim)', fontSize: '12px' }}>{expandedHouse === house.idx ? '▲' : '▼'}</span>
                  </button>
                  {expandedHouse === house.idx && (
                    <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--ash-border)' }}>
                      <div style={{ paddingTop: '10px', fontSize: '11px', color: 'var(--ash-text-dim)' }}>Lootable containers:</div>
                      {house.containers.map(container => {
                        const containerKey = `${settlement.id}_h${house.idx}_c${container.idx}`;
                        const isLooted = lootedContainers[containerKey];
                        return (
                          <div key={container.idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--ash-dark)', borderRadius: 'var(--radius)', border: `1px solid ${isLooted ? 'rgba(80,80,80,0.3)' : 'var(--ash-border)'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px' }}>{isLooted ? '📭' : '📦'}</span>
                              <div>
                                <div style={{ fontSize: '12px', color: isLooted ? 'var(--ash-text-dim)' : 'var(--ash-text)', fontFamily: 'var(--font-title)' }}>{container.name}</div>
                                <div style={{ fontSize: '10px', color: 'var(--ash-text-dim)' }}>{isLooted ? 'Already searched' : 'Unknown contents'}</div>
                              </div>
                            </div>
                            <button
                              disabled={isLooted}
                              onClick={() => lootHouseContainer(settlement.id, house.idx, container.idx)}
                              style={{ padding: '5px 12px', fontSize: '11px', fontFamily: 'var(--font-title)', letterSpacing: '0.06em', background: isLooted ? 'transparent' : 'rgba(200,136,42,0.12)', border: `1px solid ${isLooted ? 'rgba(80,80,80,0.3)' : 'rgba(200,136,42,0.35)'}`, color: isLooted ? 'var(--ash-text-dim)' : 'var(--ash-amber)', borderRadius: 'var(--radius)', cursor: isLooted ? 'not-allowed' : 'pointer' }}>
                              {isLooted ? 'Empty' : '🔍 Search'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="anim-fade">
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '14px' }}>Market</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--ash-gold)' }}>{player.gold}g</span>
            </div>

            <div style={{ fontSize: '11px', color: '#7ec850', fontFamily: 'var(--font-title)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase' }}>⚡ Provisions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {STAMINA_ITEMS.map(si => {
                const currentStamina = player.stamina?.current ?? 0;
                const maxStamina = player.stamina?.max ?? 30;
                const alreadyFull = currentStamina >= maxStamina;
                return (
                  <div key={si.id} style={{ background: 'var(--ash-charcoal)', border: '1px solid rgba(126,200,80,0.25)', borderRadius: 'var(--radius)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{si.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#7ec850', fontFamily: 'var(--font-title)' }}>{si.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ash-text-dim)' }}>{si.desc}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--ash-gold)', marginBottom: '4px' }}>{si.price}g</div>
                      <button className="btn btn-primary btn-sm"
                        disabled={player.gold < si.price || alreadyFull}
                        onClick={() => {
                          if (player.gold >= si.price) {
                            buyItem({ id: si.id, name: si.name, uid: si.id + '_' + Date.now(), value: si.price }, si.price);
                            restoreStamina(si.restore);
                          }
                        }}>
                        {alreadyFull ? 'Full' : 'Buy & Use'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--ash-amber)', fontFamily: 'var(--font-title)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase' }}>Equipment & Supplies</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {shopItems.map(({ item, price }) => (
                <div key={item.uid} style={{ background: 'var(--ash-charcoal)', border: '1px solid var(--ash-border)', borderRadius: 'var(--radius)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px' }} className={`rarity-${item.rarity}`}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ash-text-dim)' }}>{item.desc}</div>
                    {item.attack && <span style={{ fontSize: '11px', color: 'var(--ash-amber)', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>ATK +{item.attack}</span>}
                    {item.defense && <span style={{ fontSize: '11px', color: 'var(--ash-blue-light)', fontFamily: 'var(--font-mono)' }}>DEF +{item.defense}</span>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--ash-gold)', marginBottom: '4px' }}>{price}g</div>
                    <button className="btn btn-primary btn-sm" disabled={player.gold < price} onClick={() => buyItem(item, price)}>Buy</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'craft' && (
          <AlchemyTab player={player} craftItem={craftItem} />
        )}

        {activeTab === 'quests' && (
          <div className="anim-fade">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(player.journal || []).filter(q => q.status === 'active').map(quest => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
              {(player.journal || []).filter(q => q.status === 'active').length === 0 && (
                <div style={{ color: 'var(--ash-text-dim)', fontStyle: 'italic', textAlign: 'center', padding: '24px' }}>
                  No active quests. Talk to NPCs to find work.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const NPC_PANEL = { background: 'var(--ash-charcoal)', border: '1px solid var(--ash-amber-dim)', borderRadius: 'var(--radius-lg)', padding: '16px' };

function actionBtn(bg, color, border) {
  return { padding: '8px 10px', background: bg, color, border: `1px solid ${border}`, borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-title)', fontSize: '10px', letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.3 };
}

function NPCDialogHeader({ npc, onClose }) {
  const attitudeColor = getAttitudeColor(npc.attitude);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-title)', fontSize: '16px', color: 'var(--ash-gold)' }}>{npc.name}</div>
        <div style={{ fontSize: '12px', color: 'var(--ash-text-dim)', textTransform: 'capitalize' }}>{npc.occupation}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: attitudeColor }}>● {npc.attitude}</span>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

function NPCDialog({ npc, player, region, settlement, world, onClose, onTakeQuest, onAddLog, onPickpocket, onSteal, onAssist, onAttack, onAssassinate, onFlatten, onBribe, onThreaten, sneaking }) {
  const [confirm, setConfirm] = useState(null);
  const [dialogueText, setDialogueText] = useState(() => getDialogue(npc, player, 'greet'));

  const bribeAmount = { hostile: 40, suspicious: 20, neutral: 12, friendly: 8 }[npc.attitude] || 15;

  function say(context, overrideText) {
    const text = overrideText || getDialogue(npc, player, context);
    setDialogueText(text);
    onAddLog(`[${npc.name}]: "${text}"`, 'dialogue');
  }

  if (confirm === 'attack') {
    return (
      <div style={NPC_PANEL}>
        <NPCDialogHeader npc={npc} onClose={onClose} />
        <div style={{ fontFamily: 'var(--font-title)', fontSize: '14px', color: 'var(--ash-crimson-light)', marginBottom: '10px' }}>⚔️ Attack {npc.name}?</div>
        <p style={{ fontSize: '13px', color: 'var(--ash-text)', marginBottom: '16px', lineHeight: 1.6 }}>
          Starting a fight adds a regional bounty (+200g). Guards will take notice.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ background: 'var(--ash-crimson)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius)', padding: '8px 18px', fontFamily: 'var(--font-title)', fontSize: '11px', letterSpacing: '0.1em' }} onClick={onAttack}>Confirm</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Cancel</button>
        </div>
      </div>
    );
  }

  if (confirm === 'assassinate') {
    const sneakLevel = player.skills?.sneak?.level || 1;
    const chance = Math.min(0.82, 0.28 + sneakLevel * 0.012);
    return (
      <div style={{ ...NPC_PANEL, border: '1px solid rgba(150,30,150,0.45)' }}>
        <NPCDialogHeader npc={npc} onClose={onClose} />
        <div style={{ fontFamily: 'var(--font-title)', fontSize: '14px', color: '#d060d0', marginBottom: '10px' }}>🩸 Assassinate {npc.name}?</div>
        <div style={{ background: 'rgba(100,20,100,0.12)', border: '1px solid rgba(150,30,150,0.25)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: 'var(--ash-text)', lineHeight: 1.6 }}>
          A silent kill attempt. Adds a major bounty (+300g) regardless of outcome.
          <div style={{ marginTop: '8px', display: 'flex', gap: '14px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#d060d0' }}>Success: {Math.round(chance * 100)}%</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ash-text-dim)' }}>Sneak Lv.{sneakLevel}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ background: 'rgba(100,20,100,0.4)', color: '#e060e0', border: '1px solid rgba(150,30,150,0.5)', cursor: 'pointer', borderRadius: 'var(--radius)', padding: '8px 18px', fontFamily: 'var(--font-title)', fontSize: '11px', letterSpacing: '0.1em' }} onClick={() => { onAssassinate(); setConfirm(null); }}>Execute</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Cancel</button>
        </div>
      </div>
    );
  }

  if (confirm === 'pickpocket') {
    const pocketItems = generateNPCPocket(npc);
    const pickpocketLevel = player.skills?.pickpocket?.level || 1;
    const DIFF_COLOR = { easy: '#60d070', medium: '#d0a040', hard: '#d04040' };
    const DIFF_DOTS = { easy: '●○○', medium: '●●○', hard: '●●●' };
    return (
      <div style={{ ...NPC_PANEL, border: '1px solid rgba(200,136,42,0.5)' }}>
        <NPCDialogHeader npc={npc} onClose={() => setConfirm(null)} />
        <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: 'var(--ash-gold)', marginBottom: '6px' }}>🗡️ Pickpocket {npc.name}</div>
        {sneaking
          ? <div style={{ fontSize: '11px', color: '#80d890', marginBottom: '10px' }}>🤫 Sneaking — detection chance reduced</div>
          : <div style={{ fontSize: '11px', color: 'var(--ash-text-dim)', marginBottom: '10px' }}>Tip: Enable sneak first for better odds</div>
        }
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
          {pocketItems.map((item, i) => {
            const pct = Math.round(pickpocketSuccessChance(item, pickpocketLevel, sneaking) * 100);
            return (
              <button key={i} onClick={() => { onPickpocket(item); setConfirm(null); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--ash-dark)', border: '1px solid var(--ash-border)', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,136,42,0.5)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--ash-border)'}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--ash-text)', fontFamily: 'var(--font-title)' }}>{item.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--ash-text-dim)', marginTop: '2px' }}>{item.type === 'gold' ? `~${item.goldAmount}g` : `~${item.value || '?'}g value`}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                  <div style={{ fontSize: '14px', color: DIFF_COLOR[item.difficulty], fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{pct}%</div>
                  <div style={{ fontSize: '10px', color: DIFF_COLOR[item.difficulty] }}>{DIFF_DOTS[item.difficulty]}</div>
                </div>
              </button>
            );
          })}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Back</button>
      </div>
    );
  }

  const rumor = generateRumorText(npc, null, player);

  return (
    <div style={NPC_PANEL}>
      <NPCDialogHeader npc={npc} onClose={onClose} />

      <div style={{ background: 'var(--ash-brown)', borderRadius: 'var(--radius)', padding: '11px 14px', marginBottom: '14px', fontStyle: 'italic', fontSize: '13px', lineHeight: 1.7, color: 'var(--ash-text)', position: 'relative', minHeight: '52px' }}>
        <span style={{ position: 'absolute', top: '6px', left: '8px', fontSize: '20px', opacity: 0.25, lineHeight: 1 }}>"</span>
        <span style={{ paddingLeft: '14px' }}>{dialogueText}</span>
      </div>

      <div style={{ fontSize: '10px', color: 'var(--ash-text-dim)', fontFamily: 'var(--font-title)', letterSpacing: '0.1em', marginBottom: '7px' }}>CONVERSATION</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => say('greet')}>👋 Greet</button>
        <button className="btn btn-ghost btn-sm" onClick={() => say('rumor', rumor)}>💬 Rumor</button>
        <button className="btn btn-ghost btn-sm" onClick={() => say('trade')}>🛒 Trade</button>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const txt = `I've been working as a ${npc.occupation} here in ${settlement?.name || 'these parts'} for years now.`;
          say('greet', txt);
        }}>🔨 Work</button>
        {npc.hasQuest && <button className="btn btn-primary btn-sm" onClick={onTakeQuest}>📜 Quest</button>}
      </div>

      <div style={{ borderTop: '1px solid var(--ash-border)', paddingTop: '12px' }}>
        <div style={{ fontSize: '10px', color: 'var(--ash-text-dim)', fontFamily: 'var(--font-title)', letterSpacing: '0.1em', marginBottom: '8px' }}>SOCIAL</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
          <button onClick={onAssist} disabled={player.gold < 10}
            style={actionBtn('rgba(200,136,42,0.12)', player.gold < 10 ? 'var(--ash-text-dim)' : '#70b870', 'rgba(200,136,42,0.3)')}>
            💰 Assist<br /><span style={{ fontSize: '9px', opacity: 0.8 }}>-10g · improve attitude</span>
          </button>
          <button onClick={onFlatten}
            style={actionBtn('rgba(80,120,200,0.12)', '#8090d0', 'rgba(80,120,200,0.3)')}>
            😊 Flatter<br /><span style={{ fontSize: '9px', opacity: 0.8 }}>persuasion attempt</span>
          </button>
          <button onClick={() => onBribe(bribeAmount)} disabled={player.gold < bribeAmount}
            style={actionBtn('rgba(180,140,40,0.12)', player.gold < bribeAmount ? 'var(--ash-text-dim)' : 'var(--ash-gold)', 'rgba(180,140,40,0.3)')}>
            💸 Bribe<br /><span style={{ fontSize: '9px', opacity: 0.8 }}>-{bribeAmount}g · buy goodwill</span>
          </button>
          <button onClick={onThreaten}
            style={actionBtn('rgba(180,100,20,0.12)', '#d08040', 'rgba(180,100,20,0.3)')}>
            😤 Threaten<br /><span style={{ fontSize: '9px', opacity: 0.8 }}>extort gold · risky</span>
          </button>
        </div>

        <div style={{ fontSize: '10px', color: 'var(--ash-text-dim)', fontFamily: 'var(--font-title)', letterSpacing: '0.1em', marginBottom: '8px' }}>CRIME</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button onClick={() => setConfirm('pickpocket')}
            style={actionBtn('rgba(200,184,32,0.10)', 'var(--ash-gold)', 'rgba(200,184,32,0.3)')}>
            🗡️ Pickpocket<br /><span style={{ fontSize: '9px', opacity: 0.8 }}>choose item to lift</span>
          </button>
          <button onClick={onSteal}
            style={actionBtn('rgba(200,184,32,0.10)', 'var(--ash-amber)', 'rgba(200,184,32,0.3)')}>
            👜 Steal Item<br /><span style={{ fontSize: '9px', opacity: 0.8 }}>grab what they're holding</span>
          </button>
          {sneaking && (
            <button onClick={() => setConfirm('assassinate')}
              style={{ ...actionBtn('rgba(100,20,100,0.15)', '#d060d0', 'rgba(150,30,150,0.4)'), gridColumn: 'span 2' }}>
              🩸 Assassinate · <span style={{ fontSize: '9px', opacity: 0.8 }}>silent kill while sneaking · bounty +300g</span>
            </button>
          )}
          <button onClick={() => setConfirm('attack')}
            style={{ ...actionBtn('rgba(139,28,28,0.15)', 'var(--ash-crimson-light)', 'rgba(139,28,28,0.4)'), gridColumn: sneaking ? '1' : 'span 2' }}>
            ⚔️ Attack · <span style={{ fontSize: '9px', opacity: 0.8 }}>draw steel · bounty +200g</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const ALCHEMY_RECIPES = [
  { id: 'healing_potion',         name: 'Healing Potion',          result: '🧪 Restores 30 HP',       ingredients: [{ id: 'healing_herb', count: 2, label: 'Healing Herb' }],                                                               minAlchemy: 1 },
  { id: 'mana_potion',            name: 'Mana Potion',             result: '🔵 Restores 25 MP',       ingredients: [{ id: 'mana_crystal', count: 1, label: 'Mana Crystal' }, { id: 'healing_herb', count: 1, label: 'Healing Herb' }],      minAlchemy: 5 },
  { id: 'antidote',               name: 'Antidote',                result: '🟢 Cures Poison',         ingredients: [{ id: 'venom_sac', count: 1, label: 'Venom Sac' }, { id: 'healing_herb', count: 1, label: 'Healing Herb' }],          minAlchemy: 8 },
  { id: 'stamina_draught',        name: 'Stamina Draught',         result: '🟡 Restores 30 Stamina',  ingredients: [{ id: 'healing_herb', count: 2, label: 'Healing Herb' }, { id: 'wolf_pelt', count: 1, label: 'Wolf Pelt' }],          minAlchemy: 10 },
  { id: 'greater_healing_potion', name: 'Greater Healing Potion',  result: '❤️ Restores 70 HP',       ingredients: [{ id: 'healing_herb', count: 3, label: 'Healing Herb' }, { id: 'mana_crystal', count: 1, label: 'Mana Crystal' }],   minAlchemy: 20 },
  { id: 'elixir_of_warding',      name: 'Elixir of Warding',       result: '🛡️ +5 Defense (1 turn)', ingredients: [{ id: 'mana_crystal', count: 1, label: 'Mana Crystal' }, { id: 'spider_silk', count: 1, label: 'Spider Silk' }],     minAlchemy: 30 },
];

function AlchemyTab({ player, craftItem }) {
  const alchemyLevel = player.skills.alchemy?.level || 5;
  const inventory = player.inventory || [];

  function countItem(id) {
    return inventory.filter(i => i.id === id).length;
  }

  function canCraft(recipe) {
    if (alchemyLevel < recipe.minAlchemy) return false;
    return recipe.ingredients.every(ing => countItem(ing.id) >= ing.count);
  }

  return (
    <div className="anim-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px' }}>Alchemy</h3>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ash-amber)' }}>
          Skill: {alchemyLevel}
        </span>
      </div>

      <div style={{ background: 'var(--ash-dark)', border: '1px solid var(--ash-border)', borderRadius: 'var(--radius)', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: 'var(--ash-text-dim)' }}>
        Combine ingredients gathered from monsters and the wild to brew potions. Higher Alchemy skill unlocks advanced recipes.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ALCHEMY_RECIPES.map(recipe => {
          const craftable = canCraft(recipe);
          const locked = alchemyLevel < recipe.minAlchemy;
          return (
            <div key={recipe.id} style={{ background: 'var(--ash-charcoal)', border: `1px solid ${craftable ? 'var(--ash-amber-dim)' : 'var(--ash-border)'}`, borderRadius: 'var(--radius)', padding: '10px 12px', opacity: locked ? 0.5 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '13px', color: craftable ? 'var(--ash-gold)' : 'var(--ash-text)' }}>{recipe.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ash-text-dim)', marginTop: '2px' }}>{recipe.result}</div>
                </div>
                {locked ? (
                  <span style={{ fontSize: '10px', color: 'var(--ash-text-dim)', fontFamily: 'var(--font-title)' }}>
                    Needs Alchemy {recipe.minAlchemy}
                  </span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!craftable}
                    onClick={() => craftItem(recipe.id)}
                  >
                    Brew
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {recipe.ingredients.map(ing => {
                  const have = countItem(ing.id);
                  const enough = have >= ing.count;
                  return (
                    <span key={ing.id} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '2px', background: enough ? 'rgba(74,140,74,0.15)' : 'rgba(139,28,28,0.15)', color: enough ? 'var(--ash-green-light)' : 'var(--ash-crimson-light)', border: `1px solid ${enough ? 'rgba(74,140,74,0.3)' : 'rgba(139,28,28,0.3)'}`, fontFamily: 'var(--font-mono)' }}>
                      {have}/{ing.count} {ing.label}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestCard({ quest }) {
  const pct = quest.progressMax > 1 ? (quest.progress / quest.progressMax) * 100 : 0;
  return (
    <div style={{ background: 'var(--ash-charcoal)', border: '1px solid var(--ash-border)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
      <div style={{ fontFamily: 'var(--font-title)', fontSize: '14px', color: 'var(--ash-gold)', marginBottom: '4px' }}>{quest.title}</div>
      <div style={{ fontSize: '12px', color: 'var(--ash-text)', marginBottom: '6px' }}>{quest.objective}</div>
      {quest.progressMax > 1 && (
        <div style={{ marginBottom: '6px' }}>
          <div className="bar-container" style={{ height: '6px' }}>
            <div className="bar-fill bar-xp" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--ash-text-dim)', marginTop: '2px' }}>{quest.progress}/{quest.progressMax}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--ash-gold)', fontFamily: 'var(--font-mono)' }}>+{quest.reward?.gold}g</span>
        <span style={{ fontSize: '11px', color: 'var(--ash-amber)', fontFamily: 'var(--font-mono)' }}>+{quest.reward?.xp} XP</span>
      </div>
    </div>
  );
}

const STAMINA_ITEMS = [
  { id: 'trail_rations',   name: 'Trail Rations',    desc: 'Hard bread and dried meat. Restores 20⚡',  restore: 20,  price: 12,  icon: '🍖' },
  { id: 'energy_tonic',    name: 'Energy Tonic',     desc: 'Bitter herbal brew. Restores 40⚡',          restore: 40,  price: 28,  icon: '🍵' },
  { id: 'travelers_kit',   name: "Traveler's Kit",   desc: 'Full provisions for a long journey. Restores all⚡', restore: 999, price: 55, icon: '🎒' },
];

function generateShopInventory(settlement, rng) {
  const templates = ['iron_sword','iron_shield','leather_armor','healing_potion','mana_potion','antidote','steel_sword','steel_armor','lockpick','hunting_bow','iron_helm','steel_helm','leather_boots'];
  const count = { village: 4, town: 7, city: 12, fort: 6, ruins: 2 }[settlement.type] || 5;
  const picked = rng.shuffle(templates).slice(0, count);
  return picked.map(id => {
    const item = generateItem(id, null, rng);
    if (!item) return null;
    return { item, price: getBuyPrice(item.value, settlement) };
  }).filter(Boolean);
}

function getBuildingIcon(building) {
  const icons = { inn: '🍺', market: '🏪', blacksmith: '⚒️', general_store: '📦', alchemist: '⚗️', guild_hall: '🏛️', mages_tower: '🗼', temple: '⛪', bank: '🏦', barracks: '🛡️', armory: '⚔️' };
  return icons[building] || '🏠';
}

function getNPCIcon(occupation) {
  const icons = { blacksmith: '⚒️', innkeeper: '🍺', merchant: '💰', guard: '🛡️', herbalist: '🌿', mage: '🔮', priest: '⛪', beggar: '🙏', noble: '👑', farmer: '🌾', hunter: '🏹', alchemist: '⚗️' };
  return icons[occupation] || '👤';
}

function getAttitudeColor(attitude) {
  return { friendly: 'var(--uncommon)', neutral: 'var(--ash-text-dim)', suspicious: 'var(--ash-amber)', hostile: 'var(--ash-crimson-light)' }[attitude] || 'var(--ash-text-dim)';
}

function getBuyPrice(baseValue, settlement) {
  return Math.max(1, Math.floor(baseValue * 1.2));
}

function generateSettlementHouses(settlement, rng) {
  const HOUSE_NAMES = [
    "Farmer's Cottage", "Merchant's Dwelling", "Stone House", "Thatched Cottage",
    "Weaver's Home", "Old Mill Quarters", "Corner Tenement", "Guard Barracks",
    "Baker's House", "Herbalist's Cottage", "Woodsman's Lodge", "Miller's House",
  ];
  const CONTAINER_NAMES = ['Wooden Chest', 'Kitchen Drawer', 'Bedside Table', 'Storage Barrel', 'Lockbox', 'Supply Crate', 'Old Trunk'];
  const count = { village: 2, town: 4, city: 6, fort: 3, ruins: 2 }[settlement.type] || 3;
  return Array.from({ length: count }, (_, i) => ({
    idx: i,
    name: HOUSE_NAMES[rng.int(0, HOUSE_NAMES.length - 1)],
    containers: Array.from({ length: rng.int(1, 3) }, (_, j) => ({
      idx: j,
      name: CONTAINER_NAMES[rng.int(0, CONTAINER_NAMES.length - 1)],
    })),
  }));
}
