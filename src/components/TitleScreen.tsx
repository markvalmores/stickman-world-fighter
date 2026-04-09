import React, { useState, useEffect } from 'react';
import { Difficulty, AppSettings, KeyBindings } from '../types';

interface Props {
  onStart: () => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

const DIFFICULTIES: Difficulty[] = ['EASY', 'NORMAL', 'HARD', 'INSANITY'];

export function TitleScreen({ onStart, difficulty, setDifficulty, settings, setSettings }: Props) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [listeningKey, setListeningKey] = useState<keyof KeyBindings | null>(null);

  useEffect(() => {
    if (!listeningKey) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      setSettings({
        ...settings,
        keyBindings: {
          ...settings.keyBindings,
          [listeningKey]: [e.code]
        }
      });
      setListeningKey(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listeningKey, settings, setSettings]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen bg-neutral-950 text-white font-sans overflow-y-auto">
      {/* 3D Video Background */}
      <div className="fixed inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-60"
          src="https://assets.mixkit.co/videos/preview/mixkit-neon-abstract-lines-background-22732-large.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
      </div>

      <div className="relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic fire-title mb-8">
          Stickman<br />World Fighters
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-md mx-auto">
          Cross-platform 2D fighting game with AI-generated stages.
        </p>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <span className="text-neutral-500 font-bold tracking-widest uppercase text-sm">Select Difficulty</span>
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                  difficulty === d 
                    ? d === 'INSANITY' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.8)]' : 'bg-white text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onStart}
            className="px-8 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            PRESS START
          </button>
          <button
            onClick={() => setShowHowToPlay(true)}
            className="px-8 py-4 bg-blue-600 text-white font-bold text-xl rounded-full hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(37,99,235,0.3)]"
          >
            HOW TO PLAY
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="px-8 py-4 bg-gray-600 text-white font-bold text-xl rounded-full hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(75,85,99,0.3)]"
          >
            SETTINGS
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-neutral-500 text-sm flex gap-4 z-10">
        <span>✅ Touch Controls</span>
        <span>✅ Keyboard</span>
        <span>✅ Gamepad</span>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl max-w-2xl w-full text-left shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-4xl font-bold mb-6 text-center text-blue-400">HOW TO PLAY</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">Keyboard</h3>
                <ul className="space-y-2 text-lg">
                  <li><span className="font-mono bg-gray-800 px-2 py-1 rounded text-white">A</span> / <span className="font-mono bg-gray-800 px-2 py-1 rounded text-white">D</span> : Move</li>
                  <li><span className="font-mono bg-gray-800 px-2 py-1 rounded text-white">W</span> / <span className="font-mono bg-gray-800 px-2 py-1 rounded text-white">SPACE</span> : Jump</li>
                  <li><span className="font-mono bg-gray-800 px-2 py-1 rounded text-white">J</span> / <span className="font-mono bg-gray-800 px-2 py-1 rounded text-white">Z</span> : Attack</li>
                  <li><span className="font-mono bg-gray-800 px-2 py-1 rounded text-white">K</span> / <span className="font-mono bg-gray-800 px-2 py-1 rounded text-white">X</span> : Ultimate</li>
                  <li><span className="font-mono bg-gray-800 px-2 py-1 rounded text-white">F</span> : FEVER MODE</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-4 text-green-400">Gamepad</h3>
                <ul className="space-y-2 text-lg">
                  <li><span className="font-bold text-white">D-Pad</span> : Move</li>
                  <li><span className="font-bold text-white">A Button</span> : Jump</li>
                  <li><span className="font-bold text-white">X Button</span> : Attack</li>
                  <li><span className="font-bold text-white">RB / RT</span> : Ultimate</li>
                  <li><span className="font-bold text-white">Y Button</span> : FEVER MODE</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg mb-8">
              <h3 className="text-xl font-bold mb-2 text-red-400">Mechanics</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Hit the opponent to build your Special Meter.</li>
                <li>When health is below 30%, you enter RAGE mode and auto-charge Special.</li>
                <li><strong>FEVER MODE:</strong> Can only be used ONCE per match after 7 seconds. Grants infinite Ultimate and speed for 10 seconds!</li>
              </ul>
            </div>

            <div className="text-center">
              <button 
                onClick={() => setShowHowToPlay(false)}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full text-xl transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl max-w-2xl w-full text-left shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-4xl font-bold mb-6 text-center text-gray-200">SETTINGS</h2>
            
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-gray-400 font-bold mb-2">Master Volume: {Math.round(settings.volume * 100)}%</label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={settings.volume}
                  onChange={(e) => setSettings({...settings, volume: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 font-bold mb-2">Fight Speed: {settings.gameSpeed.toFixed(1)}x</label>
                <input 
                  type="range" 
                  min="0.5" max="2.0" step="0.1" 
                  value={settings.gameSpeed}
                  onChange={(e) => setSettings({...settings, gameSpeed: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-300">Key Bindings</h3>
                <p className="text-sm text-gray-500 mb-4">Click a button below, then press the key you want to bind to that action.</p>
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(settings.keyBindings) as Array<keyof KeyBindings>).map(action => (
                    <div key={action} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="uppercase font-bold text-gray-400">{action}</span>
                      <button 
                        onClick={() => setListeningKey(action)}
                        className={`px-4 py-2 rounded font-mono font-bold ${listeningKey === action ? 'bg-yellow-500 text-black animate-pulse' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                      >
                        {listeningKey === action ? 'PRESS KEY...' : settings.keyBindings[action][0]}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-xl transition-colors"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
