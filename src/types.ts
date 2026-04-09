export type GameState = 'TITLE' | 'ROSTER' | 'GLOBE' | 'FIGHT';
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'INSANITY';

export interface Character {
  id: string;
  name: string;
  color: string;
  fashion: 'bandana' | 'tophat' | 'shades' | 'cape' | 'scarf' | 'crown' | 'headphones' | 'horns' | 'halo' | 'none';
  stats: {
    speed: number;
    power: number;
    jump: number;
  };
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface KeyBindings {
  left: string[];
  right: string[];
  jump: string[];
  attack: string[];
  ultimate: string[];
  fever: string[];
}

export interface AppSettings {
  volume: number;
  gameSpeed: number;
  keyBindings: KeyBindings;
}

export interface StageData {
  name: string;
  theme: string;
  bgTop: string;
  bgBottom: string;
  bgImageUrl?: string;
  platforms: Platform[];
}
