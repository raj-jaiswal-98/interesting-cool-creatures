/**
 * GBIF API Service
 * Fetches real-world geographic occurrence coordinates from the Global Biodiversity Information Facility.
 */

import type { CreatureCoordinate } from '../../types/creature';

export async function fetchGBIFCoordinates(scientificName?: string, limit = 15): Promise<CreatureCoordinate[]> {
  if (!scientificName) return [];

  try {
    const cleanQuery = scientificName.split('(')[0].trim();
    const res = await fetch(
      `https://api.gbif.org/v1/occurrence/search?q=${encodeURIComponent(cleanQuery)}&hasCoordinate=true&limit=${limit}`
    );
    if (!res.ok) {
      throw new Error(`GBIF API responded with status ${res.status}`);
    }
    const data = await res.json();

    return (data.results || [])
      .filter((item: any) => item.decimalLatitude != null && item.decimalLongitude != null)
      .map((item: any) => ({
        lat: Number(item.decimalLatitude.toFixed(3)),
        lng: Number(item.decimalLongitude.toFixed(3)),
        country: item.country || item.continent || 'International Waters',
        year: item.year || null,
        basisOfRecord: item.basisOfRecord || 'PRESERVED_SPECIMEN'
      }));
  } catch (err) {
    console.warn(`GBIF coordinate fetch failed for "${scientificName}":`, (err as Error).message);
    return [];
  }
}
