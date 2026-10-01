import { useQuery } from '@tanstack/react-query';
import { creatureResolver } from '../services/resolver/creatureResolver';
import type { NormalizedCreature } from '../types/normalizedCreature';
import type { Creature } from '../types/creature';

export interface UseCreatureResult {
  creature: Creature | null;
  normalized: NormalizedCreature | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * useCreature hook
 * Resolves a normalized biological creature from ID, scientific name, or existing Creature object.
 */
export function useCreature(target: string | Creature | null | undefined): UseCreatureResult {
  const queryKey = typeof target === 'string'
    ? ['creature', target.toLowerCase().trim()]
    : target
    ? ['creature', target.id.toLowerCase()]
    : ['creature', 'null'];

  const { data, isLoading, isError, error, refetch } = useQuery<NormalizedCreature | null, Error>({
    queryKey,
    queryFn: async () => {
      if (!target) return null;
      return await creatureResolver.resolve(target);
    },
    enabled: Boolean(target),
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  return {
    creature: typeof target === 'object' && target !== null ? target : null,
    normalized: data ?? null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch
  };
}
