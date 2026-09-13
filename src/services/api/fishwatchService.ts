/**
 * NOAA FishWatch API Service
 * Fetches marine facts, biology, and harvest sustainability for aquatic creatures.
 */

export interface FishWatchResult {
  biology: string | null;
  habitat: string | null;
  physicalDescription: string | null;
  taste: string | null;
  texture: string | null;
  scientificName?: string;
}

export async function fetchFishWatchData(speciesName?: string): Promise<FishWatchResult | null> {
  if (!speciesName) return null;

  try {
    const slug = speciesName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const res = await fetch(`https://www.fishwatch.gov/api/species/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const item = data[0];
    const stripHtml = (str: string | null | undefined) => (str ? str.replace(/<[^>]*>?/gm, '').trim() : null);

    return {
      biology: stripHtml(item['Biology']),
      habitat: stripHtml(item['Habitat']),
      physicalDescription: stripHtml(item['Physical Description']),
      taste: stripHtml(item['Taste']),
      texture: stripHtml(item['Texture']),
      scientificName: item['Scientific Name']
    };
  } catch (err) {
    console.warn(`FishWatch fetch failed for "${speciesName}":`, (err as Error).message);
    return null;
  }
}
