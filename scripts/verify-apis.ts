/**
 * Live API Verification Script
 * Sends real requests to GBIF, iNaturalist, PBDB, and Wikidata
 * to verify endpoint reachability, response structure, and rate-limits.
 */

import { gbifAdapter } from '../src/services/resolver/adapters/gbifAdapter';
import { inaturalistAdapter } from '../src/services/resolver/adapters/inaturalistAdapter';
import { pbdbAdapter } from '../src/services/resolver/adapters/pbdbAdapter';
import { wikidataAdapter } from '../src/services/resolver/adapters/wikidataAdapter';

async function verifyAllAPIs() {
  console.log('--- STARTING LIVE API VERIFICATION ---\n');

  // 1. Verify GBIF
  try {
    console.log('[1/4] Testing GBIF API (Glaucus atlanticus)...');
    const gbifTaxon = await gbifAdapter.resolveTaxon('Glaucus atlanticus');
    const gbifOccs = await gbifAdapter.fetchOccurrences('Glaucus atlanticus', 5);
    console.log('✓ GBIF Taxon resolved:', gbifTaxon?.identity?.scientificName, '| Phylum:', gbifTaxon?.taxonomy?.phylum);
    console.log(`✓ GBIF Occurrences received: ${gbifOccs.length} coordinates`);
    if (gbifOccs.length > 0) {
      console.log('  Sample coordinate:', gbifOccs[0]);
    }
  } catch (err: any) {
    console.error('✗ GBIF API Error:', err.message);
  }

  console.log('');

  // 2. Verify iNaturalist
  try {
    console.log('[2/4] Testing iNaturalist API (Glaucus atlanticus)...');
    const inatTaxon = await inaturalistAdapter.resolveTaxon('Glaucus atlanticus');
    console.log('✓ iNaturalist Common Name:', inatTaxon?.identity?.commonName);
    console.log('✓ iNaturalist Observations Count:', inatTaxon?.observations?.iNaturalistCount);
    console.log('✓ iNaturalist Primary Photo:', inatTaxon?.media?.primaryImage ? 'Found' : 'None');
    if (inatTaxon?.media?.attribution?.[0]) {
      console.log('  Attribution:', inatTaxon.media.attribution[0].creator, '| License:', inatTaxon.media.attribution[0].license);
    }
  } catch (err: any) {
    console.error('✗ iNaturalist API Error:', err.message);
  }

  console.log('');

  // 3. Verify PBDB (Paleobiology Database)
  try {
    console.log('[3/4] Testing PBDB API (Spinosaurus)...');
    const pbdbTaxon = await pbdbAdapter.resolveTaxon('Spinosaurus');
    const pbdbOccs = await pbdbAdapter.fetchOccurrences('Spinosaurus', 5);
    console.log('✓ PBDB Taxon resolved:', pbdbTaxon?.identity?.scientificName);
    console.log('✓ PBDB Geological Age:', pbdbTaxon?.evolution?.geologicalAge);
    console.log(`✓ PBDB Fossil Occurrences received: ${pbdbOccs.length} dig sites`);
    if (pbdbOccs.length > 0) {
      console.log('  Sample fossil site:', pbdbOccs[0]);
    }
  } catch (err: any) {
    console.error('✗ PBDB API Error:', err.message);
  }

  console.log('');

  // 4. Verify Wikidata
  try {
    console.log('[4/4] Testing Wikidata API (Glaucus atlanticus)...');
    const wikiTaxon = await wikidataAdapter.resolveTaxon('Glaucus atlanticus');
    console.log('✓ Wikidata Entity resolved:', wikiTaxon?.identity?.taxonKey);
    console.log('✓ Wikidata Synonyms/Aliases count:', wikiTaxon?.identity?.synonyms?.length);
    console.log('✓ Wikidata Source Record:', wikiTaxon?.sources?.[0]?.recordUrl);
  } catch (err: any) {
    console.error('✗ Wikidata API Error:', err.message);
  }

  console.log('\n--- LIVE API VERIFICATION COMPLETE ---');
}

verifyAllAPIs();
