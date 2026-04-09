import { StageData } from '../types';
import { getStageBackground } from '../services/imageService';

// Simple seeded random number generator
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export async function generateStage(lat: number, lng: number): Promise<StageData> {
  // We use lat/lng to seed the stage generation so the same location always gives the same stage
  const seed = Math.abs(lat * 1000 + lng);
  
  const themes = [
    { name: "Neon Alley", top: "#0f0c29", bottom: "#302b63", type: "cyberpunk" },
    { name: "Ancient Ruins", top: "#11998e", bottom: "#38ef7d", type: "jungle" },
    { name: "Volcanic Crater", top: "#cb2d3e", bottom: "#ef473a", type: "volcano" },
    { name: "Glacial Peaks", top: "#83a4d4", bottom: "#b6fbff", type: "ice" },
    { name: "Desert Mirage", top: "#ffb347", bottom: "#ffcc33", type: "desert" },
    { name: "Abyssal Depths", top: "#000000", bottom: "#0f2027", type: "ocean" },
    { name: "Celestial Void", top: "#1a2a6c", bottom: "#b21f1f", type: "space" },
    { name: "Toxic Wasteland", top: "#56ab2f", bottom: "#a8e063", type: "toxic" }
  ];

  const themeIndex = Math.floor(seededRandom(seed) * themes.length);
  const theme = themes[themeIndex];

  // Generate platforms
  const platforms = [];
  const numPlatforms = 3 + Math.floor(seededRandom(seed + 1) * 4); // 3 to 6
  
  for (let i = 0; i < numPlatforms; i++) {
    platforms.push({
      x: 50 + seededRandom(seed + 2 + i) * 500,
      y: 200 + seededRandom(seed + 10 + i) * 250,
      w: 80 + seededRandom(seed + 20 + i) * 150,
      h: 20
    });
  }

  const bgImageUrl = await getStageBackground(theme.name);

  return {
    name: theme.name,
    theme: theme.type,
    bgTop: theme.top,
    bgBottom: theme.bottom,
    bgImageUrl,
    platforms: platforms
  };
}
