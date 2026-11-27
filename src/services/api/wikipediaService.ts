/**
 * Wikipedia REST summaries: a short, human-written lead paragraph for almost
 * every named species. CORS-enabled and cached in IndexedDB.
 */
import { creatureCache, CACHE_TTLS } from '../cache/indexedDBCache';

export interface WikiSummary {
  title: string;
  /** Short tagline, e.g. "Subspecies of tiger". */
  tagline: string | null;
  /** Plain-text lead paragraph(s). */
  extract: string;
  url: string;
}

const ENDPOINT = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

function titleFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/wikipedia\.org\/wiki\/([^?#]+)/i);
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchSummary(title: string): Promise<WikiSummary | null> {
  const res = await fetch(ENDPOINT + encodeURIComponent(title.replace(/ /g, '_')), {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.type === 'disambiguation' || !data.extract) return null;
  return {
    title: data.title,
    tagline: data.description || null,
    extract: data.extract,
    url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
  };
}

/**
 * Looks up a creature's summary, trying the linked article, then the
 * scientific name, then the common name. Returns null when offline or unknown.
 */
export async function getWikiSummary(creature: {
  scientificName: string;
  commonName: string;
  wikiUrl?: string;
}): Promise<WikiSummary | null> {
  const cacheKey = `wiki:summary:${creature.scientificName.toLowerCase()}`;
  const cached = await creatureCache.get<WikiSummary | { missing: true }>(cacheKey);
  if (cached) return 'missing' in cached ? null : cached;

  const candidates = Array.from(
    new Set([titleFromUrl(creature.wikiUrl), creature.scientificName, creature.commonName].filter(Boolean) as string[])
  );

  for (const title of candidates) {
    try {
      const summary = await fetchSummary(title);
      if (summary) {
        await creatureCache.set(cacheKey, summary, CACHE_TTLS.WIKIDATA);
        return summary;
      }
    } catch {
      return null; // network failure: don't cache, try again next time
    }
  }
  await creatureCache.set(cacheKey, { missing: true }, CACHE_TTLS.SPECIES_METADATA);
  return null;
}
