/**
 * Encyclopedia of Life (EOL) Service
 * Fetches academic biological and morphological overview descriptions.
 */

export interface EOLTaxonomyResult {
  eolId: number;
  description: string | null;
  scientificName?: string;
}

export async function fetchEOLTaxonomy(scientificName?: string): Promise<EOLTaxonomyResult | null> {
  if (!scientificName) return null;

  try {
    const searchRes = await fetch(
      `https://eol.org/api/search/1.0.json?q=${encodeURIComponent(scientificName)}&page=1&exact=true`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const pageId = searchData.results && searchData.results[0]?.id;
    if (!pageId) return null;

    const pageRes = await fetch(
      `https://eol.org/api/pages/1.0/${pageId}.json?details=true&text_page_id=1`
    );
    if (!pageRes.ok) return null;
    const pageData = await pageRes.json();

    const dataObjects = pageData.taxonConcept?.dataObjects || [];
    const textObject = dataObjects.find(
      (obj: any) => obj.dataType === 'http://purl.org/dc/dcmitype/Text' && obj.description
    );

    return {
      eolId: pageId,
      description: textObject ? textObject.description.replace(/<[^>]*>?/gm, '').trim() : null,
      scientificName: pageData.taxonConcept?.scientificName
    };
  } catch (err) {
    console.warn(`EOL fetch failed for "${scientificName}":`, (err as Error).message);
    return null;
  }
}
