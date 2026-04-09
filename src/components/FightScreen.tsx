import React, { useEffect, useRef, useState } from 'react';
import { Character, StageData, Difficulty, AppSettings } from '../types';
import { Fighter, GameKeys } from '../game/engine';
import { sound } from '../game/audio';

interface Props {
  playerChar: Character;
  opponentChar: Character;
  stage: StageData;
  difficulty: Difficulty;
  settings: AppSettings;
  onBack: () => void;
}

export function FightScreen({ playerChar, opponentChar, stage, difficulty, settings, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<{win: boolean, score: number, time: number, maxCombo: number} | null>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  
  useEffect(() => {
    const ua = navigator.userAgent;
    let device = "Unknown Device";
    if (/Mobi|Android/i.test(ua)) {
      const match = ua.match(/Android\s+[\d\.]+(?:;\s+([^;)]+))?/);
      if (match && match[1]) {
        device = `Android (${match[1].trim()})`;
      } else if (/iPhone/i.test(ua)) {
        device = "iPhone";
      } else if (/iPad/i.test(ua)) {
        device = "iPad";
      } else {
        device = "Mobile Device";
      }
    } else if (/Windows NT/i.test(ua)) {
      device = "Windows PC";
    } else if (/Macintosh/i.test(ua)) {
      device = "Mac OS";
    } else if (/Linux/i.test(ua)) {
      device = "Linux PC";
    }
    setDeviceInfo(device);
  }, []);
  
  // Touch controls state
  const keysRef = useRef<GameKeys>({ left: false, right: false, jump: false, attack: false, ultimate: false, fever: false });

  // Fever Mode state
  const gameTimeRef = useRef(0);
  const feverUsed = useRef(false);
  const feverActiveUntil = useRef(0);

  useEffect(() => {
    let timeoutId: number;
    if (stage.bgImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setBgImage(img);
        setLoading(false);
        clearTimeout(timeoutId);
      };
      img.onerror = () => {
        setLoading(false); // Fallback if image fails
        clearTimeout(timeoutId);
      };
      img.src = stage.bgImageUrl;
      
      // Fallback timeout in case onload/onerror never fire or take too long
      timeoutId = window.setTimeout(() => {
        setLoading(false);
      }, 3000);
    } else {
      setLoading(false);
    }
    
    return () => clearTimeout(timeoutId);
  }, [stage.bgImageUrl]);

  useEffect(() => {
    if (loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const player = new Fighter(100, canvas.height - 150, playerChar, true);
    const opponent = new Fighter(canvas.width - 200, canvas.height - 150, opponentChar, false);
    
    let animationFrameId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (settings.keyBindings.left.includes(e.code)) keysRef.current.left = true;
      if (settings.keyBindings.right.includes(e.code)) keysRef.current.right = true;
      if (settings.keyBindings.jump.includes(e.code)) keysRef.current.jump = true;
      if (settings.keyBindings.attack.includes(e.code)) keysRef.current.attack = true;
      if (settings.keyBindings.ultimate.includes(e.code)) keysRef.current.ultimate = true;
      if (settings.keyBindings.fever.includes(e.code)) keysRef.current.fever = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (settings.keyBindings.left.includes(e.code)) keysRef.current.left = false;
      if (settings.keyBindings.right.includes(e.code)) keysRef.current.right = false;
      if (settings.keyBindings.jump.includes(e.code)) keysRef.current.jump = false;
      if (settings.keyBindings.attack.includes(e.code)) keysRef.current.attack = false;
      if (settings.keyBindings.ultimate.includes(e.code)) keysRef.current.ultimate = false;
      if (settings.keyBindings.fever.includes(e.code)) keysRef.current.fever = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const checkGamepad = () => {
      const gamepads = navigator.getGamepads();
      if (gamepads[0]) {
        const gp = gamepads[0];
        // D-pad or left stick
        keysRef.current.left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
        keysRef.current.right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;
        // A button (bottom face)
        keysRef.current.jump = gp.buttons[0]?.pressed;
        // X button (left face)
        keysRef.current.attack = gp.buttons[2]?.pressed || gp.buttons[3]?.pressed;
        // RB or RT for Ultimate
        keysRef.current.ultimate = gp.buttons[5]?.pressed || gp.buttons[7]?.pressed;
        // Y button (top face) for Fever
        keysRef.current.fever = gp.buttons[3]?.pressed;
      }
    };

    let lastTime = performance.now();
    let accumulator = 0;
    const timeStep = 1000 / 60; // 60fps base

    const loop = (time: number) => {
      checkGamepad();

      let dt = (time - lastTime) * settings.gameSpeed;
      lastTime = time;
      
      // Cap dt to avoid spiral of death if tab is backgrounded
      if (dt > 100) dt = 100;
      
      if (!gameOver) {
        accumulator += dt;

        while (accumulator >= timeStep) {
          gameTimeRef.current += timeStep;

          const canUseFever = !feverUsed.current && (gameTimeRef.current >= 7000);
          
          if (keysRef.current.fever && canUseFever) {
            feverUsed.current = true;
            feverActiveUntil.current = gameTimeRef.current + 10000; // 10 seconds of fever
            sound.playFever();
          }

          const isFever = gameTimeRef.current < feverActiveUntil.current;

          // Update
          if (player.health > 0 && opponent.health > 0) {
            player.update(keysRef.current, stage.platforms, false, opponent, difficulty, isFever, canvas.width, canvas.height);
            opponent.update({ left: false, right: false, jump: false, attack: false, ultimate: false, fever: false }, stage.platforms, true, player, difficulty, false, canvas.width, canvas.height);
          } else {
            const win = player.health > 0;
            const timeSeconds = Math.floor(gameTimeRef.current / 1000);
            const score = Math.floor(Math.max(0, player.health) * 100 + player.maxCombo * 500 - timeSeconds * 10);
            
            setScoreData({
              win,
              score,
              time: timeSeconds,
              maxCombo: player.maxCombo
            });
            setGameOver(win ? `${playerChar.name} WINS!` : `${opponentChar.name} WINS!`);
          }

          accumulator -= timeStep;
        }
      }

      const isFeverActiveBg = gameTimeRef.current < feverActiveUntil.current;

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      if (isFeverActiveBg) {
        // Fever Mode crazy background
        ctx.fillStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.5)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, stage.bgTop);
        gradient.addColorStop(1, stage.bgBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Procedural background elements based on theme
        ctx.save();
        const bgScaleX = canvas.width / 800;
        const bgScaleY = canvas.height / 600;
        ctx.scale(bgScaleX, bgScaleY);
        
        if (stage.theme === 'cyberpunk') {
          // Draw grid
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 800; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, 600); }
          for (let i = 0; i < 600; i += 40) { ctx.moveTo(0, i); ctx.lineTo(800, i); }
          ctx.stroke();
          // Distant buildings
          ctx.fillStyle = '#0a0a1a';
          ctx.fillRect(100, 300, 80, 300);
          ctx.fillRect(250, 200, 120, 400);
          ctx.fillRect(500, 250, 90, 350);
          ctx.fillRect(650, 150, 100, 450);
        } else if (stage.theme === 'jungle') {
          // Vines and trees
          ctx.fillStyle = '#0a3a1a';
          ctx.fillRect(50, 0, 40, 600);
          ctx.fillRect(700, 0, 60, 600);
          ctx.beginPath();
          ctx.arc(400, 600, 300, Math.PI, 0);
          ctx.fill();
        } else if (stage.theme === 'volcano') {
          // Distant mountains and lava
          ctx.fillStyle = '#2a0a0a';
          ctx.beginPath();
          ctx.moveTo(0, 600); ctx.lineTo(200, 300); ctx.lineTo(400, 600);
          ctx.moveTo(300, 600); ctx.lineTo(600, 200); ctx.lineTo(800, 600);
          ctx.fill();
          ctx.fillStyle = '#ff4400';
          ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.2;
          ctx.fillRect(0, 500, 800, 100);
          ctx.globalAlpha = 1.0;
        } else if (stage.theme === 'ice') {
          // Glaciers
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.moveTo(0, 600); ctx.lineTo(150, 250); ctx.lineTo(300, 600);
          ctx.moveTo(500, 600); ctx.lineTo(700, 150); ctx.lineTo(800, 600);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        } else if (stage.theme === 'space') {
          // Stars
          ctx.fillStyle = '#ffffff';
          for(let i=0; i<100; i++) {
            const x = Math.sin(i * 123) * 800;
            const y = Math.cos(i * 321) * 600;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now()/500 + i) * 0.5;
            ctx.fillRect(Math.abs(x), Math.abs(y), 2, 2);
          }
          ctx.globalAlpha = 1.0;
          // Planet
          ctx.fillStyle = '#444488';
          ctx.beginPath(); ctx.arc(600, 150, 80, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
      }

      // Floor
      const floorY = canvas.height - 50;
      ctx.fillStyle = '#111';
      ctx.fillRect(0, floorY, canvas.width, 50);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, floorY, canvas.width, 50);

      // Platforms (3D effect)
      // Scale platforms based on screen width relative to 800
      const scaleX = canvas.width / 800;
      const scaleY = canvas.height / 600;
      
      stage.platforms.forEach(p => {
        const px = p.x * scaleX;
        const py = p.y * scaleY;
        const pw = p.w * scaleX;
        const ph = p.h; // keep height constant
        
        // Platform shadow/depth
        ctx.fillStyle = '#111';
        ctx.fillRect(px + 5, py + 5, pw, ph);
        
        // Platform top
        const platGrad = ctx.createLinearGradient(px, py, px, py + ph);
        platGrad.addColorStop(0, '#555');
        platGrad.addColorStop(1, '#222');
        ctx.fillStyle = platGrad;
        ctx.fillRect(px, py, pw, ph);
        
        // Platform highlight
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(px, py, pw, 3);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);
      });

      // Fighters
      if (player.health > 0) player.draw(ctx, canvas.width);
      if (opponent.health > 0) opponent.draw(ctx, canvas.width);

      // Names
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(playerChar.name, 20, 30);
      ctx.textAlign = 'right';
      ctx.fillText(opponentChar.name, canvas.width - 20, 30);
      ctx.textAlign = 'left';

      // Health Bars Background (3D effect)
      const barWidth = Math.min(300, canvas.width / 2 - 40);
      const rightBarX = canvas.width - 20 - barWidth;
      
      ctx.fillStyle = '#330000'; // Dark red background
      ctx.fillRect(20, 40, barWidth, 20);
      ctx.fillRect(rightBarX, 40, barWidth, 20);
      
      // Player Health Gradient
      const pHealthGrad = ctx.createLinearGradient(20, 40, 20, 60);
      pHealthGrad.addColorStop(0, '#55ff55');
      pHealthGrad.addColorStop(0.5, '#00cc00');
      pHealthGrad.addColorStop(1, '#006600');
      ctx.fillStyle = pHealthGrad;
      ctx.fillRect(20, 40, Math.max(0, player.health) * (barWidth / 100), 20);

      // Opponent Health Gradient
      const oHealthGrad = ctx.createLinearGradient(rightBarX, 40, rightBarX, 60);
      oHealthGrad.addColorStop(0, '#ff5555');
      oHealthGrad.addColorStop(0.5, '#cc0000');
      oHealthGrad.addColorStop(1, '#660000');
      ctx.fillStyle = oHealthGrad;
      ctx.fillRect(rightBarX + (100 - Math.max(0, opponent.health)) * (barWidth / 100), 40, Math.max(0, opponent.health) * (barWidth / 100), 20);

      // Health Bar Highlights (3D shine)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(20, 40, Math.max(0, player.health) * (barWidth / 100), 6);
      ctx.fillRect(rightBarX + (100 - Math.max(0, opponent.health)) * (barWidth / 100), 40, Math.max(0, opponent.health) * (barWidth / 100), 6);

      // Health Bar Borders
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 40, barWidth, 20);
      ctx.strokeRect(rightBarX, 40, barWidth, 20);

      // Special Meters Background
      const specBarWidth = Math.min(200, canvas.width / 2 - 60);
      const rightSpecBarX = canvas.width - 20 - specBarWidth;
      
      ctx.fillStyle = '#111';
      ctx.fillRect(20, 65, specBarWidth, 10);
      ctx.fillRect(rightSpecBarX, 65, specBarWidth, 10);

      // Player Special Gradient
      const pSpecGrad = ctx.createLinearGradient(20, 65, 20, 75);
      pSpecGrad.addColorStop(0, player.specialMeter >= 100 ? '#ffffff' : '#00ffff');
      pSpecGrad.addColorStop(0.5, player.specialMeter >= 100 ? '#00ffff' : '#008888');
      pSpecGrad.addColorStop(1, player.specialMeter >= 100 ? '#008888' : '#004444');
      ctx.fillStyle = pSpecGrad;
      ctx.fillRect(20, 65, player.specialMeter * (specBarWidth / 100), 10);
      
      // Opponent Special Gradient
      const oSpecGrad = ctx.createLinearGradient(rightSpecBarX, 65, rightSpecBarX, 75);
      oSpecGrad.addColorStop(0, opponent.specialMeter >= 100 ? '#ffffff' : '#00ffff');
      oSpecGrad.addColorStop(0.5, opponent.specialMeter >= 100 ? '#00ffff' : '#008888');
      oSpecGrad.addColorStop(1, opponent.specialMeter >= 100 ? '#008888' : '#004444');
      ctx.fillStyle = oSpecGrad;
      ctx.fillRect(rightSpecBarX + (100 - opponent.specialMeter) * (specBarWidth / 100), 65, opponent.specialMeter * (specBarWidth / 100), 10);

      // Special Bar Highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(20, 65, player.specialMeter * (specBarWidth / 100), 3);
      ctx.fillRect(rightSpecBarX + (100 - opponent.specialMeter) * (specBarWidth / 100), 65, opponent.specialMeter * (specBarWidth / 100), 3);

      // Special Bar Borders
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 65, specBarWidth, 10);
      ctx.strokeRect(rightSpecBarX, 65, specBarWidth, 10);

      // Status Text
      ctx.font = 'bold 14px sans-serif';
      let statusX = 20;
      if (player.health <= 30) {
        ctx.fillStyle = '#ff4444';
        ctx.fillText('RAGE', statusX, 95);
        statusX += 50;
      }
      if (player.specialMeter >= 100) {
        ctx.fillStyle = '#0ff';
        ctx.fillText('ULTIMATE READY (Press K / RB)', statusX, 95);
        statusX += 220;
      }
      
      const isFeverActive = gameTimeRef.current < feverActiveUntil.current;
      const canUseFever = !feverUsed.current && (gameTimeRef.current >= 7000);
      
      if (isFeverActive) {
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FEVER MODE!!!', canvas.width / 2, 120);
        ctx.textAlign = 'left';
      } else if (canUseFever) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('FEVER READY! (Press F / Y)', statusX, 95);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [playerChar, opponentChar, stage, difficulty, settings, gameOver, loading]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white font-sans">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-3xl font-bold fire-title">LOADING STAGE...</h2>
        <p className="text-gray-400 mt-4">Preparing assets and backgrounds</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center touch-none overflow-y-auto">
      <div className="absolute top-2 md:top-4 text-white text-sm md:text-xl font-bold tracking-widest z-10 drop-shadow-md flex flex-col items-center">
        <span>{stage.name} - {stage.theme}</span>
        <span className="text-[10px] md:text-xs text-gray-400 mt-1 font-mono">Playing on: {deviceInfo}</span>
      </div>

      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {gameOver && scoreData && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in fade-in duration-500 backdrop-blur-sm">
            <h2 className={`text-6xl md:text-8xl font-black mb-8 fire-title ${scoreData.win ? 'text-green-500' : 'text-red-500'}`}>
              {gameOver}
            </h2>
            
            <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl mb-8 transform hover:scale-105 transition-transform">
              <h3 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">BATTLE RESULTS</h3>
              
              <div className="space-y-4 text-xl">
                <div className="flex justify-between text-gray-300">
                  <span>Time:</span>
                  <span className="font-mono text-white">{scoreData.time}s</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Max Combo:</span>
                  <span className="font-mono text-yellow-400">{scoreData.maxCombo} Hits</span>
                </div>
                <div className="flex justify-between text-gray-300 font-bold text-2xl mt-6 pt-4 border-t border-gray-700">
                  <span>FINAL SCORE:</span>
                  <span className="font-mono text-blue-400">{scoreData.score.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="px-8 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                BACK TO TITLE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch Controls Overlay */}
      <div className="absolute bottom-4 md:bottom-10 left-0 right-0 flex justify-between px-4 md:px-10 md:hidden pointer-events-none z-20">
        <div className="flex gap-2 pointer-events-auto">
          <button 
            className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full active:bg-white/40 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-2xl select-none"
            onTouchStart={(e) => { e.preventDefault(); keysRef.current.left = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current.left = false; }}
          >
            ←
          </button>
          <button 
            className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full active:bg-white/40 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-2xl select-none"
            onTouchStart={(e) => { e.preventDefault(); keysRef.current.right = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current.right = false; }}
          >
            →
          </button>
        </div>
        <div className="flex gap-2 pointer-events-auto flex-wrap justify-end max-w-[200px]">
          <button 
            className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500/40 rounded-full active:bg-yellow-500/70 backdrop-blur-sm border border-yellow-500/50 flex items-center justify-center text-white font-bold text-xs sm:text-base select-none"
            onTouchStart={(e) => { e.preventDefault(); keysRef.current.fever = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current.fever = false; }}
          >
            FVR
          </button>
          <button 
            className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/40 rounded-full active:bg-purple-500/70 backdrop-blur-sm border border-purple-500/50 flex items-center justify-center text-white font-bold text-xs sm:text-base select-none"
            onTouchStart={(e) => { e.preventDefault(); keysRef.current.ultimate = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current.ultimate = false; }}
          >
            ULT
          </button>
          <button 
            className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500/40 rounded-full active:bg-red-500/70 backdrop-blur-sm border border-red-500/50 flex items-center justify-center text-white font-bold text-sm sm:text-base select-none"
            onTouchStart={(e) => { e.preventDefault(); keysRef.current.attack = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current.attack = false; }}
          >
            ATK
          </button>
          <button 
            className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/40 rounded-full active:bg-blue-500/70 backdrop-blur-sm border border-blue-500/50 flex items-center justify-center text-white font-bold text-sm sm:text-base select-none"
            onTouchStart={(e) => { e.preventDefault(); keysRef.current.jump = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current.jump = false; }}
          >
            JMP
          </button>
        </div>
      </div>
    </div>
  );
}
