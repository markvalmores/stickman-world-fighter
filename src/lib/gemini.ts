import { GoogleGenAI } from '@google/genai';
import { StageData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateStage(lat: number, lng: number): Promise<StageData> {
  try {
    const prompt = `You are a game level designer for a 2D fighting game. 
Based on the geographic coordinates latitude ${lat}, longitude ${lng}, generate a 2D fighting game stage.
Think about what this location is on Earth (e.g., ocean, desert, city, mountains, ice, forest) and theme it accordingly.

Return ONLY valid JSON matching this exact schema, with no markdown formatting or extra text:
{
  "name": "Stage Name (e.g. Neo Tokyo, Sahara Ruins, Pacific Abyss)",
  "theme": "A highly detailed visual description of the landscape (e.g. 'cyberpunk neon city streets at night with rain', 'ancient overgrown temple ruins in a lush jungle'). This will be used as an image generation prompt.",
  "bgTop": "#hexcolor",
  "bgBottom": "#hexcolor",
  "platforms": [
    { "x": number, "y": number, "w": number, "h": number }
  ]
}

Rules for platforms:
- The canvas is 800 wide by 600 high.
- There is already a main floor at y=550. Do not create a platform there.
- Create 3 to 6 floating platforms.
- x should be between 50 and 650.
- y should be between 200 and 450.
- w (width) should be between 80 and 250.
- h (height) should be 20.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text) as StageData;
    
    // Generate a unique background image URL using Pollinations AI based on the detailed theme
    const imagePrompt = `${data.theme}, 2d fighting game stage background, landscape, empty, no characters, masterpiece, highly detailed`;
    data.bgImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=800&height=600&nologo=true`;
    
    return data;
  } catch (error) {
    // Suppress the scary console error for 429s and provide a variety of offline fallbacks
    const fallbacks: StageData[] = [
      {
        name: "Neon Alley",
        theme: "Cyberpunk city streets in the rain",
        bgTop: "#0f0c29",
        bgBottom: "#302b63",
        bgImageUrl: "https://image.pollinations.ai/prompt/cyberpunk%20neon%20city%20street%20alley%20rain%202d%20fighting%20game%20stage%20background?width=800&height=600&nologo=true",
        platforms: [
          { x: 100, y: 350, w: 200, h: 20 },
          { x: 500, y: 350, w: 200, h: 20 },
          { x: 300, y: 200, w: 200, h: 20 }
        ]
      },
      {
        name: "Ancient Ruins",
        theme: "Overgrown temple in a dense jungle",
        bgTop: "#11998e",
        bgBottom: "#38ef7d",
        bgImageUrl: "https://image.pollinations.ai/prompt/ancient%20overgrown%20temple%20ruins%20jungle%202d%20fighting%20game%20stage%20background?width=800&height=600&nologo=true",
        platforms: [
          { x: 150, y: 400, w: 150, h: 20 },
          { x: 500, y: 400, w: 150, h: 20 },
          { x: 325, y: 250, w: 150, h: 20 }
        ]
      },
      {
        name: "Volcanic Crater",
        theme: "Lava flows and dark obsidian rocks",
        bgTop: "#cb2d3e",
        bgBottom: "#ef473a",
        bgImageUrl: "https://image.pollinations.ai/prompt/volcanic%20crater%20lava%20flows%20dark%20obsidian%202d%20fighting%20game%20stage%20background?width=800&height=600&nologo=true",
        platforms: [
          { x: 50, y: 300, w: 150, h: 20 },
          { x: 600, y: 300, w: 150, h: 20 },
          { x: 325, y: 400, w: 150, h: 20 }
        ]
      }
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}
