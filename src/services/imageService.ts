export async function getStageBackground(themeName: string): Promise<string> {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn("Unsplash API key not found. Using placeholder.");
    return `https://picsum.photos/seed/${themeName}/1920/1080?blur=4`;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(themeName)}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );
    const data = await response.json();
    return data.urls.regular;
  } catch (error) {
    console.error("Error fetching background image:", error);
    return `https://picsum.photos/seed/${themeName}/1920/1080?blur=4`;
  }
}
