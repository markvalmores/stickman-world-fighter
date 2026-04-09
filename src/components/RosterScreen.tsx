import React, { useState, useEffect, useRef } from 'react';
import { Character } from '../types';
import { ROSTER } from '../game/characters';
import { Fighter } from '../game/engine';

interface Props {
  onSelect: (character: Character) => void;
}

const FASHIONS = ['none', 'bandana', 'tophat', 'shades', 'cape', 'scarf', 'crown', 'headphones', 'horns', 'halo'] as const;

export function RosterScreen({ onSelect }: Props) {
  const [customizingChar, setCustomizingChar] = useState<Character | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (customizingChar && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw a nice background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a floor
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 150, canvas.width, 50);

        // Draw the fighter
        const dummyFighter = new Fighter(60, 70, customizingChar, true);
        dummyFighter.isGrounded = true;
        dummyFighter.draw(ctx);
      }
    }
  }, [customizingChar]);

  if (customizingChar) {
    return (
      <div className="flex flex-col items-center w-full min-h-screen bg-neutral-950 text-white p-8 font-sans overflow-y-auto">
        <h2 className="text-4xl font-black mb-8 uppercase tracking-widest text-neutral-200 mt-8">Customize Fighter</h2>
        
        <div className="flex flex-col md:flex-row gap-8 items-center bg-neutral-900 p-8 rounded-2xl border-2 border-neutral-800 w-full max-w-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-12">
          <div className="flex flex-col items-center gap-4">
            <canvas 
              ref={canvasRef} 
              width={200} 
              height={200} 
              className="rounded-xl border-2 border-neutral-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] bg-black"
            />
            <h3 className="text-2xl font-bold uppercase tracking-widest" style={{ color: customizingChar.color }}>
              {customizingChar.name}
            </h3>
          </div>

          <div className="flex-1 flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-400 uppercase tracking-wider text-sm font-bold">Color</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={customizingChar.color}
                  onChange={(e) => setCustomizingChar({ ...customizingChar, color: e.target.value })}
                  className="w-16 h-16 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="font-mono text-neutral-300 text-lg">{customizingChar.color}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-neutral-400 uppercase tracking-wider text-sm font-bold">Fashion</label>
              <select 
                value={customizingChar.fashion}
                onChange={(e) => setCustomizingChar({ ...customizingChar, fashion: e.target.value as Character['fashion'] })}
                className="bg-neutral-800 text-white p-4 rounded-lg border-2 border-neutral-700 outline-none focus:border-white uppercase tracking-wider font-bold appearance-none cursor-pointer"
              >
                {FASHIONS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-2 text-center text-sm">
              <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700">
                <div className="text-neutral-500 uppercase text-xs mb-1 font-bold">Speed</div>
                <div className="font-black text-blue-400 text-xl">{customizingChar.stats.speed}</div>
              </div>
              <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700">
                <div className="text-neutral-500 uppercase text-xs mb-1 font-bold">Power</div>
                <div className="font-black text-red-400 text-xl">{customizingChar.stats.power}</div>
              </div>
              <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700">
                <div className="text-neutral-500 uppercase text-xs mb-1 font-bold">Jump</div>
                <div className="font-black text-green-400 text-xl">{customizingChar.stats.jump}</div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => setCustomizingChar(null)}
                className="flex-1 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors border border-neutral-600"
              >
                BACK
              </button>
              <button 
                onClick={() => onSelect(customizingChar)}
                className="flex-1 py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-neutral-950 text-white p-8 font-sans overflow-y-auto">
      <div className="flex justify-between w-full max-w-6xl mb-8">
        <h2 className="text-4xl font-black uppercase tracking-widest text-neutral-200">Select Fighter</h2>
        <button 
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(err => console.error(err));
            } else {
              document.exitFullscreen();
            }
          }}
          className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition-colors"
        >
          FULLSCREEN
        </button>
      </div>
      
      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-4 max-w-6xl w-full pb-12">
        {ROSTER.map((char) => (
          <button
            key={char.id}
            onClick={() => setCustomizingChar({ ...char })}
            className="group relative flex flex-col items-center p-4 rounded-xl bg-neutral-900 border-2 border-neutral-800 hover:border-white transition-all hover:-translate-y-1"
          >
            <div 
              className="w-12 h-12 rounded-full mb-3 shadow-[0_0_15px_currentColor]"
              style={{ backgroundColor: char.color, color: char.color }}
            />
            <span className="font-bold text-sm uppercase tracking-wider group-hover:text-white text-neutral-400">
              {char.name}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
}
