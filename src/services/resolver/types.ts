/**
 * Provider Adapter Interfaces for CreatureResolver
 * Aligned with Section 14 of the architecture specification.
 */

import type { NormalizedCreature, CreatureGeoCoordinate, CreatureMedia } from '../../types/normalizedCreature';

export interface ProviderAdapter {
  readonly providerName: string;

  /**
   * Search for taxonomy, identification, and core metadata
   */
  resolveTaxon?(scientificOrCommonName: string): Promise<Partial<NormalizedCreature> | null>;

  /**
   * Fetch real-world observation or fossil occurrence coordinates
   */
  fetchOccurrences?(scientificName: string, limit?: number): Promise<CreatureGeoCoordinate[]>;

  /**
   * Fetch authenticated imagery, galleries, and license attribution
   */
  fetchMedia?(query: string): Promise<Partial<CreatureMedia> | null>;

  /**
   * Fetch extended biological/evolutionary/knowledge enrichment
   */
  fetchEnrichment?(scientificName: string): Promise<Partial<NormalizedCreature> | null>;
}
