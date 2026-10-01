import { useQuery } from '@tanstack/react-query';
import { creatureResolver } from '../services/resolver/creatureResolver';
import type { Creature, CreatureCoordinate } from '../types/creature';

export interface UseLiveObservationsResult {
  coordinates: CreatureCoordinate[];
  observationCount: number;
  isLoading: boolean;
  isLive: boolean;
  refetch: () => void;
}

export function useLiveObservations(creature: Creature | null | undefined): UseLiveObservationsResult {
  const isExtinct = Boolean(creature && creature.extinctionYear !== null);

  const { data, isLoading, refetch } = useQuery<CreatureCoordinate[], Error>({
    queryKey: ['observations', creature?.scientificName?.toLowerCase() || 'none'],
    queryFn: async (): Promise<CreatureCoordinate[]> => {
      if (!creature) return [];
      const rawCoords = await creatureResolver.resolveOccurrences(creature);
      if (rawCoords && rawCoords.length > 0) {
        return rawCoords.map((c) => ({
          lat: c.lat,
          lng: c.lng,
          country: c.country || 'International Waters / Region',
          year: c.year ?? null,
          basisOfRecord: c.basisOfRecord
        }));
      }
      return creature.coordinates || [];
    },
    enabled: Boolean(creature?.scientificName),
    staleTime: 1000 * 60 * 30
  });

  const coordinates: CreatureCoordinate[] = data && data.length > 0 ? data : creature?.coordinates || [];

  return {
    coordinates,
    observationCount: coordinates.length,
    isLoading,
    isLive: !isExtinct && (data?.length ?? 0) > 0,
    refetch
  };
}

