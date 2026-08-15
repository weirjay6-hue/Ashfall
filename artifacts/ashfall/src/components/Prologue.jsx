import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore.js';
import { RACES, BACKGROUNDS } from '../data/races.js';

const RACE_LORE = {
  human:   'The blood of a dozen kingdoms runs in your veins. Adaptable. Resilient. Unremarkable to those who do not look closely — which has always been your advantage.',
  nord:    'You are a Nord — shaped by the highland clans who carved survival out of cold peaks and ancient forests. Your body endures what would break others. So do your grudges.',
  elf:     'You are a High Elf. Your people measure time in centuries and speak of empires that crumbled before this prison\'s stones were quarried. In a cell, your mind never stopped working.',
  orc:     'You are an Orc. The guards gave you the largest cell and the heaviest chains. Wise of them. You have spent your captivity counting every stone, every shift change, every weakness in the mortar.',
  khajiit: 'You are Khajiit. In the dark, your eyes adjusted immediately. You have heard every whispered conversation, memorised every guard\'s schedule, mapped every crack in every wall. You have been ready for this moment for a long time.',
};

const BACKGROUND_LORE = {
  warrior:   'You served under arms once — guard, soldier, mercenary, it barely matters now. The calluses on your sword-hand have softened in captivity. The instincts have not.',
  mage:      'You catalogued the cracks in the ceiling, calculated the structural weaknesses of the north wall, and composed three theoretical essays on the arcane properties of the stonework. Your captors took your books. They could not take your mind.',
  rogue:     'In the first week you identified two ways out. You were waiting for the right moment — a door left unlocked, a guard who slept too soundly, a tremor in the earth. You always knew opportunity would come.',
  merchant:  'You have bartered with six different guards in the past month alone. Nothing significant — a favour here, a rumour there — but you have learned more about this prison than any of its architects intended.',
  scholar:   'You spent your imprisonment recording everything you observed. Prisoner movements. Guard rotations. Structural irregularities. Knowledge is the only weapon that cannot be taken from you.',
};

function buildScenes(player, race, background) {
  const raceLore = RACE_LORE[player.race] || RACE_LORE.human;
  const bgLore = BACKGROUND_LORE[player.background] || BACKGROUND_LORE.warrior;
  const raceName = race?.name || 'traveller';
  const bgName = background?.name || 'wanderer';

  return [
    {
      title: 'DARKNESS',
      subtitle: 'Somewhere in the realm — day unknown',
      paragraphs: [
        'You wake to the smell of cold stone and damp straw.',
        `A cell. Iron bars, slick with condensation. A single torch gutters beyond the door, casting shadows that do not quite hold still.`,
        `Your name is ${player.name}. ${raceLore}`,
        `How you came to be here is a story for another time. That you are here — that is the only truth that matters now.`,
      ],
    },
    {
      title: 'THE WAIT',
      subtitle: 'Hours become days. Days become noise.',
      paragraphs: [
        bgLore,
        `The other prisoners have long since stopped talking. The guards cycle through their shifts. The torch beyond the bars burns low and is replaced. The rhythm of captivity becomes its own kind of world.`,
        `But you have not stopped watching.`,
        `You have learned patience. And you have learned to recognise the moment when patience ends.`,
      ],
    },
    {
      title: 'THE BREAK',
      subtitle: 'Something vast gives way.',
      paragraphs: [
        `It begins with a sound — low and enormous, somewhere deep in the earth.`,
        `Then the tremor strikes.`,
        `Stone dust rains from the ceiling. The bars shudder in their housings. Somewhere in the structure above, a supporting wall cracks and falls. The guard post erupts in shouting — boots on stone, fast and receding. Abandoning post.`,
        `Your cell door swings. The bolt, loose in its housing for weeks, falls free with the shaking.`,
        `You do not waste the moment.`,
      ],
    },
    {
      title: 'THE REALM',
      subtitle: 'Freedom has a particular smell. It smells like rain and pine.',
      paragraphs: [
        `You emerge through a collapsed section of outer wall into open air.`,
        `Cool. Green. Vast.`,
        `This is the realm — rolling hills of emerald grass stretching in every direction, ancient oaks whose canopies reach fifty feet, streams that catch the afternoon light like scattered coins. The air smells of rain and living earth.`,
        `The prison — a squat fort of grey stone on a hillside — continues to groan behind you. Below, valleys and meadows spread out like a painted map. Distant chimney smoke. Birdsong. The world, entirely indifferent to your recent captivity.`,
        `You have no weapon. Little coin. The road ahead is long and not entirely safe.`,
        `But the road is there. And you are free to walk it.`,
      ],
    },
    {
      title: 'FIRST LIGHT',
      subtitle: 'Something warm flickers on the valley floor.',
      paragraphs: [
        `As the cool air steadies you, you spot it.`,
        `Down in the valley: warm light. Hearth fires and lanterns. A settlement — real, inhabited, alive. The sounds of it drift up faintly on the evening wind. Voices. The smell of woodsmoke and something cooking.`,
        `The road between here and there winds through forest and meadow. You have been warned about what walks the roads after dark — bandits, creatures, the desperate — and now you are the most desperate thing on this hillside.`,
        `But the settlement is there. And the alternative is the cold hillside.`,
      ],
    },
    {
      title: 'YOUR STORY BEGINS',
      subtitle: null,
      paragraphs: [
        `${player.name}.`,
        `${raceName}. ${bgName}.`,
        `The realm does not care who you were. The world ahead will only know what you do in it.`,
        `The grass is wet under your feet. The forest waits. The road leads down into the valley.`,
        `What you become is entirely up to you.`,
      ],
      isFinal: true,
    },
  ];
}

export default function Prologue() {
  const player = useGameStore(s => s.player);
  const completePrologue = useGameStore(s => s.completePrologue);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [allTyped, setAllTyped] = useState(false);
  const [sceneVisible, setSceneVisible] = useState(true);
  const intervalRef = useRef(null);

  const race = player ? RACES[player.race] : null;
  const background = player ? BACKGROUNDS[player.background] : null;
  const scenes = player ? buildScenes(player, race, background) : [];
  const scene = scenes[sceneIndex] || { title: '', subtitle: null, paragraphs: [], isFinal: false };
  const fullText = scene.paragraphs.join('\n\n');

  useEffect(() => {
    if (!player) return;
    setDisplayedText('');
    setCharIndex(0);
    setAllTyped(false);
    setSceneVisible(true);
  }, [sceneIndex, player]);

  useEffect(() => {
    if (!player || allTyped) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCharIndex(prev => {
        const next = prev + 2;
        if (next >= fullText.length) {
          clearInterval(intervalRef.current);
          setAllTyped(true);
          setDisplayedText(fullText);
          return fullText.length;
        }
        setDisplayedText(fullText.slice(0, next));
        return next;
      });
    }, 18);
    return () => clearInterval(intervalRef.current);
  }, [sceneIndex, fullText, player]);

  if (!player) return null;

  function skipTyping() {
    if (!allTyped) {
      clearInterval(intervalRef.current);
      setDisplayedText(fullText);
      setAllTyped(true);
    }
  }

  function advanceScene() {
    if (!allTyped) { skipTyping(); return; }
    if (sceneIndex < scenes.length - 1) {
      setSceneVisible(false);
      setTimeout(() => setSceneIndex(s => s + 1), 400);
    } else {
      completePrologue();
    }
  }

  const paragraphs = displayedText.split('\n\n');
  const isFinal = scene.isFinal;

  return (
    <div
      onClick={allTyped ? advanceScene : skipTyping}
      style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: 'radial-gradient(ellipse at 30% 40%, #0a2010 0%, #030c06 100%)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(ellipse at 20% 80%, rgba(30,80,40,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(20,60,30,0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '32px 24px', opacity: sceneVisible ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>
        <div style={{ width: '100%', maxWidth: '480px', animation: 'fadeIn 0.8s ease' }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-title)', fontSize: '10px', letterSpacing: '0.3em',
              color: 'var(--ash-amber-dim)', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.8,
            }}>
              ASHFALL
            </div>
            <div style={{
              fontFamily: 'var(--font-title)', fontSize: '22px', color: 'var(--ash-gold)',
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px',
            }}>
              {scene.title}
            </div>
            {scene.subtitle && (
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--ash-text-dim)',
                fontStyle: 'italic', letterSpacing: '0.04em',
              }}>
                {scene.subtitle}
              </div>
            )}
          </div>

          <div style={{
            borderLeft: '2px solid rgba(200,136,42,0.25)',
            paddingLeft: '20px', marginBottom: '40px',
          }}>
            {paragraphs.map((para, i) => (
              <p key={i} style={{
                fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.9,
                color: (isFinal && i < 2) ? 'var(--ash-gold)' : 'var(--ash-text)',
                marginBottom: '14px', whiteSpace: 'pre-wrap',
              }}>
                {para}
                {i === paragraphs.length - 1 && !allTyped && (
                  <span style={{ animation: 'blink 1s step-end infinite', color: 'var(--ash-amber)' }}>▍</span>
                )}
              </p>
            ))}
          </div>

          {allTyped && (
            <div style={{ display: 'flex', justifyContent: 'center', animation: 'fadeIn 0.5s ease' }}>
              {isFinal ? (
                <button
                  onClick={(e) => { e.stopPropagation(); completePrologue(); }}
                  style={{
                    fontFamily: 'var(--font-title)', fontSize: '13px', letterSpacing: '0.15em',
                    color: '#fff', background: 'var(--ash-amber)',
                    border: 'none', padding: '14px 36px', cursor: 'pointer',
                    textTransform: 'uppercase', borderRadius: 'var(--radius)',
                    boxShadow: '0 0 28px rgba(200,136,42,0.35)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = 'var(--ash-amber-light)'}
                  onMouseLeave={e => e.target.style.background = 'var(--ash-amber)'}
                >
                  Begin Your Journey →
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); advanceScene(); }}
                  style={{
                    fontFamily: 'var(--font-title)', fontSize: '11px', letterSpacing: '0.18em',
                    color: 'var(--ash-amber)', background: 'transparent',
                    border: '1px solid rgba(200,136,42,0.4)', padding: '10px 28px', cursor: 'pointer',
                    textTransform: 'uppercase', borderRadius: 'var(--radius)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--ash-amber)'; e.target.style.background = 'rgba(200,136,42,0.08)'; }}
                  onMouseLeave={e => { e.target.style.borderColor = 'rgba(200,136,42,0.4)'; e.target.style.background = 'transparent'; }}
                >
                  Continue →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: '16px', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: '8px',
      }}>
        {scenes.map((_, i) => (
          <div key={i} style={{
            width: i === sceneIndex ? '20px' : '6px', height: '4px',
            borderRadius: '2px',
            background: i === sceneIndex ? 'var(--ash-amber)' : 'rgba(200,136,42,0.2)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {!allTyped && (
        <div style={{
          position: 'absolute', bottom: '36px', right: '20px',
          fontSize: '9px', color: 'rgba(200,136,42,0.4)', fontFamily: 'var(--font-title)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Tap to skip
        </div>
      )}
    </div>
  );
}
