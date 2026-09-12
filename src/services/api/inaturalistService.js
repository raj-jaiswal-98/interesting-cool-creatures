/**
 * iNaturalist API Service
 * Fetches verified photography, vernacular names, and taxa metadata.
 */

export async function fetchINaturalistTaxa(query) {
  if (!query) return null;

  try {
    const res = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=1&is_active=true`
    );
    if (!res.ok) {
      throw new Error(`iNaturalist API responded with ${res.status}`);
    }
    const data = await res.json();
    const match = data.results && data.results[0];
    if (!match) return null;

    return {
      id: match.id,
      commonName: match.preferred_common_name,
      scientificName: match.name,
      photoUrl: match.default_photo?.medium_url || match.default_photo?.url,
      attribution: match.default_photo?.attribution,
      licenseCode: match.default_photo?.license_code,
      wikiUrl: match.wikipedia_url,
      rank: match.rank
    };
  } catch (err) {
    console.warn(`iNaturalist fetch failed for "${query}":`, err.message);
    return null;
  }
}
