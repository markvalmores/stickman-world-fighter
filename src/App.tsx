/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, Character, StageData, Difficulty, AppSettings } from './types';
import { TitleScreen } from './components/TitleScreen';
import { RosterScreen } from './components/RosterScreen';
import { GlobeScreen } from './components/GlobeScreen';
import { FightScreen } from './components/FightScreen';
import { ROSTER } from './game/characters';
import { sound } from './game/audio';

const DEFAULT_SETTINGS: AppSettings = {
  volume: 0.5,
  gameSpeed: 1.0,
  keyBindings: {
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    jump: ['KeyW', 'ArrowUp', 'Space'],
    attack: ['KeyJ', 'KeyZ'],
    ultimate: ['KeyK', 'KeyX', 'KeyC'],
    fever: ['KeyF']
  }
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [playerChar, setPlayerChar] = useState<Character | null>(null);
  const [opponentChar, setOpponentChar] = useState<Character | null>(null);
  const [stage, setStage] = useState<StageData | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    sound.masterVolume = settings.volume;
  }, [settings.volume]);

  const handleStart = () => setGameState('ROSTER');
  
  const handleCharacterSelect = (char: Character) => {
    setPlayerChar(char);
    // Pick random opponent
    const opponent = ROSTER[Math.floor(Math.random() * ROSTER.length)];
    setOpponentChar(opponent);
    setGameState('GLOBE');
  };

  const handleStageSelect = (selectedStage: StageData) => {
    setStage(selectedStage);
    setGameState('FIGHT');
  };

  const handleBackToTitle = () => {
    setPlayerChar(null);
    setOpponentChar(null);
    setStage(null);
    setGameState('TITLE');
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {gameState === 'TITLE' && (
        <TitleScreen 
          onStart={handleStart} 
          difficulty={difficulty} 
          setDifficulty={setDifficulty} 
          settings={settings}
          setSettings={setSettings}
        />
      )}
      {gameState === 'ROSTER' && <RosterScreen onSelect={handleCharacterSelect} />}
      {gameState === 'GLOBE' && <GlobeScreen onStageSelected={handleStageSelect} />}
      {gameState === 'FIGHT' && playerChar && opponentChar && stage && (
        <FightScreen 
          playerChar={playerChar} 
          opponentChar={opponentChar} 
          stage={stage} 
          difficulty={difficulty}
          settings={settings}
          onBack={handleBackToTitle} 
        />
      )}
    </div>
  );
}
