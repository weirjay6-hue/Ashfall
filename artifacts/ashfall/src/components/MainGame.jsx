import React from 'react';
import useGameStore from '../store/gameStore.js';
import HUD from './HUD.jsx';
import ZoneView from './ZoneView.jsx';
import TownView from './TownView.jsx';
import CombatScreen from './CombatScreen.jsx';
import DungeonView from './DungeonView.jsx';
import CharacterSheet from './CharacterSheet.jsx';
import Inventory from './Inventory.jsx';
import Journal from './Journal.jsx';
import SaveMenu from './SaveMenu.jsx';
import DeathScreen from './DeathScreen.jsx';
import WildernessView from './WildernessView.jsx';

export default function MainGame() {
  const currentView = useGameStore(s => s.currentView);
  const combat = useGameStore(s => s.combat);
  const dungeon = useGameStore(s => s.dungeon);
  const pendingQuestOffer = useGameStore(s => s.pendingQuestOffer);
  const acceptQuestOffer = useGameStore(s => s.acceptQuestOffer);
  const declineQuestOffer = useGameStore(s => s.declineQuestOffer);
  const guardEncounter = useGameStore(s => s.guardEncounter);
  const player = useGameStore(s => s.player);
  const serveTime = useGameStore(s => s.serveTime);
  const payBounty = useGameStore(s => s.payBounty);
  const fightGuards = useGameStore(s => s.fightGuards);
  const gameOver = useGameStore(s => s.gameOver);
  const pendingTravelEncounter = useGameStore(s => s.pendingTravelEncounter);
  const resolveTravelEncounter = useGameStore(s => s.resolveTravelEncounter);
  const dismissTravelEncounter = useGameStore(s => s.dismissTravelEncounter);
  const pendingLevelUps = useGameStore(s => s.pendingLevelUps);
  const dismissSkillLevelUp = useGameStore(s => s.dismissSkillLevelUp);

  if (gameOver) {
    return <DeathScreen />;
  }

  if (combat?.active) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CombatScreen />
      </div>
    );
  }

  if (dungeon && currentView === 'dungeon') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <DungeonView />
        {pendingQuestOffer && <QuestOfferModal quest={pendingQuestOffer} onAccept={acceptQuestOffer} onDecline={declineQuestOffer} />}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <HUD />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {currentView === 'world' && <ZoneView />}
        {currentView === 'town' && <TownView />}
        {currentView === 'wilderness' && <WildernessView />}
        {currentView === 'character' && <CharacterSheet />}
        {currentView === 'inventory' && <Inventory />}
        {currentView === 'journal' && <Journal />}
        {currentView === 'save' && <SaveMenu />}
      </div>
      {pendingQuestOffer && <QuestOfferModal quest={pendingQuestOffer} onAccept={acceptQuestOffer} onDecline={declineQuestOffer} />}
      {pendingTravelEncounter && (
        <TravelEncounterModal
          encounter={pendingTravelEncounter}
          onChoose={resolveTravelEncounter}
          onDismiss={dismissTravelEncounter}
        />
      )}
      {guardEncounter && (
        <GuardEncounterModal
          encounter={guardEncounter}
          player={player}
          onServeTime={serveTime}
          onPayBounty={payBounty}
          onFightGuards={fightGuards}
        />
      )}
      {pendingLevelUps?.length > 0 && (
        <SkillLevelUpToast levelUp={pendingLevelUps[0]} onDismiss={dismissSkillLevelUp} />
      )}
    </div>
  );
}

function GuardEncounterModal({ encounter, player, onServeTime, onPayBounty, onFightGuards }) {
  const daysServed = Math.max(3, Math.floor(encounter.bounty / 30));
  const canPay = player && player.gold >= encounter.bounty;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}>
      <div style={{ background: 'var(--ash-charcoal)', border: '2px solid var(--ash-crimson)', borderRadius: 'var(--radius-lg)', padding: '22px', maxWidth: '360px', width: '100%' }}>
        <div style={{ fontSize: '11px', color: 'var(--ash-crimson-light)', fontFamily: 'var(--font-title)', letterSpacing: '0.15em', marginBottom: '8px' }}>⚔️ GUARD ENCOUNTER</div>
        <h3 style={{ marginBottom: '10px', fontSize: '17px' }}>Halt! You Are Wanted!</h3>
        <div style={{ background: 'rgba(139,28,28,0.12)', border: '1px solid rgba(139,28,28,0.3)', borderRadius: 'var(--radius)', padding: '11px 14px', marginBottom: '14px', fontSize: '13px', color: 'var(--ash-text)', fontStyle: 'italic', lineHeight: 1.6 }}>
          "Stop right there, criminal! You have outstanding crimes in this region. Submit to justice or face the consequences."
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: '11px', color: 'var(--ash-text-dim)', letterSpacing: '0.1em' }}>BOUNTY</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--ash-crimson-light)', fontWeight: 'bold' }}>{encounter.bounty}g</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={onServeTime}
            style={{ padding: '12px 16px', background: 'rgba(70,80,200,0.12)', border: '1px solid rgba(70,80,200,0.35)', color: '#8090e0', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-title)', fontSize: '11px', letterSpacing: '0.08em', textAlign: 'left', lineHeight: 1.6 }}>
            🔒 SERVE TIME
            <span style={{ display: 'block', fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>{daysServed} days in the cells · some gold &amp; items confiscated · bounty cleared</span>
          </button>
          <button onClick={onPayBounty} disabled={!canPay}
            style={{ padding: '12px 16px', background: canPay ? 'rgba(180,140,40,0.12)' : 'rgba(50,50,50,0.12)', border: `1px solid ${canPay ? 'rgba(180,140,40,0.4)' : 'rgba(80,80,80,0.3)'}`, color: canPay ? 'var(--ash-gold)' : 'var(--ash-text-dim)', borderRadius: 'var(--radius)', cursor: canPay ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-title)', fontSize: '11px', letterSpacing: '0.08em', textAlign: 'left', lineHeight: 1.6 }}>
            💰 PAY BOUNTY — {encounter.bounty}g
            <span style={{ display: 'block', fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>{canPay ? 'Walk free immediately.' : `Need ${encounter.bounty - (player?.gold || 0)}g more.`}</span>
          </button>
          <button onClick={onFightGuards}
            style={{ padding: '12px 16px', background: 'rgba(139,28,28,0.12)', border: '1px solid rgba(139,28,28,0.4)', color: 'var(--ash-crimson-light)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-title)', fontSize: '11px', letterSpacing: '0.08em', textAlign: 'left', lineHeight: 1.6 }}>
            ⚔️ RESIST ARREST
            <span style={{ display: 'block', fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>Fight the guards · more may respond nearby · bounty +100g</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TravelEncounterModal({ encounter, onChoose, onDismiss }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 250, padding: '20px' }}>
      <div style={{ background: 'var(--ash-charcoal)', border: '2px solid var(--ash-amber-dim)', borderRadius: 'var(--radius-lg)', padding: '22px', maxWidth: '380px', width: '100%', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '22px' }}>{encounter.icon}</span>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: '12px', color: 'var(--ash-amber)', letterSpacing: '0.12em' }}>ROAD ENCOUNTER</span>
          <button onClick={onDismiss} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ash-text-dim)', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>✕</button>
        </div>
        <h3 style={{ marginBottom: '10px', fontSize: '18px', color: 'var(--ash-gold)' }}>{encounter.title}</h3>
        <p style={{ fontSize: '13px', color: 'var(--ash-text)', marginBottom: '18px', lineHeight: 1.65, fontStyle: 'italic' }}>
          {encounter.description}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {encounter.choices.map((choice, i) => (
            <button key={i} onClick={() => onChoose(i)}
              style={{ padding: '11px 14px', background: 'rgba(200,136,42,0.08)', border: '1px solid var(--ash-border)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-title)', fontSize: '11px', letterSpacing: '0.06em', color: 'var(--ash-text)', textAlign: 'left', transition: 'border-color 0.15s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--ash-amber-dim)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--ash-border)'}
            >
              {choice.icon} {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillLevelUpToast({ levelUp, onDismiss }) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [levelUp?.id, levelUp?.level]);
  if (!levelUp) return null;
  const SKILL_ICONS = { oneHanded: '⚔️', twoHanded: '🗡️', shortBlade: '🔪', archery: '🏹', polearms: '🪙', unarmed: '👊', destruction: '🔥', restoration: '💚', alteration: '🌀', sneak: '🌑', pickpocket: '🤲', lockpick: '🗝️', speech: '💬', alchemy: '⚗️', dodge: '💨', block: '🛡️' };
  return (
    <div style={{ position: 'fixed', bottom: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 400, pointerEvents: 'none', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ background: 'rgba(10,20,30,0.95)', border: '1px solid var(--ash-amber)', borderRadius: 'var(--radius-lg)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.7)' }}>
        <span style={{ fontSize: '20px' }}>{SKILL_ICONS[levelUp.id] || '⭐'}</span>
        <div>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '10px', color: 'var(--ash-amber)', letterSpacing: '0.12em' }}>SKILL LEVEL UP</div>
          <div style={{ fontSize: '14px', color: 'var(--ash-gold)', fontFamily: 'var(--font-title)' }}>{levelUp.name} → Rank {levelUp.level}</div>
        </div>
        <span style={{ fontSize: '18px', marginLeft: '4px' }}>★</span>
      </div>
    </div>
  );
}

function QuestOfferModal({ quest, onAccept, onDecline }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
      <div style={{ background: 'var(--ash-charcoal)', border: '2px solid var(--ash-amber-dim)', borderRadius: 'var(--radius-lg)', padding: '20px', maxWidth: '360px', width: '100%', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ fontSize: '11px', color: 'var(--ash-amber-dim)', fontFamily: 'var(--font-title)', letterSpacing: '0.15em', marginBottom: '8px' }}>⚡ WORLD EVENT</div>
        <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{quest.title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--ash-text)', marginBottom: '14px', lineHeight: 1.6 }}>{quest.description}</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {quest.reward?.gold && <span style={{ color: 'var(--ash-gold)', fontSize: '13px' }}>+{quest.reward.gold}g</span>}
          {quest.reward?.xp && <span style={{ color: 'var(--ash-amber)', fontSize: '13px' }}>+{quest.reward.xp} XP</span>}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onAccept}>Accept</button>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onDecline}>Decline</button>
        </div>
      </div>
    </div>
  );
}
