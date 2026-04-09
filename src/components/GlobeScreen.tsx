import React, { useState, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { generateStage } from '../lib/gemini';
import { StageData } from '../types';

interface Props {
  onStageSelected: (stage: StageData) => void;
}

export function GlobeScreen({ onStageSelected }: Props) {
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGlobeClick = async ({ lat, lng }: { lat: number, lng: number }) => {
    if (loading) return;
    setLoading(true);
    try {
      const stage = await generateStage(lat, lng);
      onStageSelected(stage);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute top-8 left-0 right-0 z-10 text-center pointer-events-none">
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
          {loading ? 'Generating Stage...' : 'Select Location'}
        </h2>
        <p className="text-neutral-300 mt-2 text-lg drop-shadow-md">Rotate the globe and click anywhere to fight</p>
      </div>
      
      <Globe
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        onGlobeClick={handleGlobeClick}
      />

      {loading && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white font-bold text-xl tracking-widest uppercase animate-pulse">AI is building the arena...</p>
        </div>
      )}
    </div>
  );
}
