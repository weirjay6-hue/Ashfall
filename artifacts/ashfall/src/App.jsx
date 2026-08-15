import React, { useEffect, useRef } from 'react';
import useGameStore from './store/gameStore.js';
import TitleScreen from './components/TitleScreen.jsx';
import CharacterCreation from './components/CharacterCreation.jsx';
import Prologue from './components/Prologue.jsx';
import MainGame from './components/MainGame.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

export default function App() {
  const phase = useGameStore(s => s.phase);
  const doWorldTick = useGameStore(s => s.doWorldTick);
  const combat = useGameStore(s => s.combat);
  const dungeon = useGameStore(s => s.dungeon);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (phase === 'game' && !combat && !dungeon) {
      intervalRef.current = setInterval(() => {
        doWorldTick();
      }, 8000);
    }
    return () => clearInterval(intervalRef.current);
  }, [phase, combat, dungeon, doWorldTick]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ash-black)' }}>
      <ErrorBoundary key={phase}>
        {phase === 'title' && <TitleScreen />}
        {phase === 'create' && <CharacterCreation />}
        {phase === 'prologue' && <Prologue />}
        {phase === 'game' && <MainGame />}
      </ErrorBoundary>
    </div>
  );
}
