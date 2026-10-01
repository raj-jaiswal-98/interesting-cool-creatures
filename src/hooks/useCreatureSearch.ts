import { useState, useEffect, useMemo } from 'react';
import { chromeAI } from '../services/ai/chromeAIService';
import type { Creature } from '../types/creature';
import type { StructuredSearchIntent } from '../types/ai';

export interface UseCreatureSearchOptions {
  activeHabitat?: string;
  activeEra?: string;
  isExtinctOnly?: boolean;
}

export interface UseCreatureSearchResult {
  results: Creature[];
  intent: StructuredSearchIntent | null;
  isSearching: boolean;
  clearSearch: () => void;
}

export function useCreatureSearch(
  catalog: Creature[],
  rawQuery: string,
  options: UseCreatureSearchOptions = {}
): UseCreatureSearchResult {
  const [intent, setIntent] = useState<StructuredSearchIntent | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      setIntent(null);
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const parsed = await chromeAI.parseSemanticSearchIntent(trimmed);
        if (isMounted) {
          setIntent(parsed);
          setIsSearching(false);
        }
      } catch {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [rawQuery]);

  const results = useMemo(() => {
    let filtered = [...catalog];

    // Filter by options first
    if (options.activeHabitat && options.activeHabitat !== 'all') {
      filtered = filtered.filter(
        (c) => c.habitatType.toLowerCase() === options.activeHabitat?.toLowerCase()
      );
    }

    if (options.activeEra && options.activeEra !== 'all') {
      filtered = filtered.filter((c) => c.era.toLowerCase() === options.activeEra?.toLowerCase());
    }

    if (options.isExtinctOnly) {
      filtered = filtered.filter((c) => c.extinctionYear !== null);
    }

    const trimmed = rawQuery.trim().toLowerCase();
    if (!trimmed) {
      return filtered;
    }

    // Direct lexical matching
    const directMatches = filtered.filter(
      (c) =>
        c.commonName.toLowerCase().includes(trimmed) ||
        c.scientificName.toLowerCase().includes(trimmed) ||
        c.habitat.toLowerCase().includes(trimmed) ||
        c.diet.toLowerCase().includes(trimmed) ||
        c.description.toLowerCase().includes(trimmed)
    );

    if (directMatches.length > 0 && !intent?.unusual && !intent?.size) {
      return directMatches;
    }

    // If semantic intent was extracted, apply weighted scoring
    if (intent) {
      const scored = filtered.map((c) => {
        let score = 0;
        const cText = `${c.commonName} ${c.scientificName} ${c.habitat} ${c.diet} ${c.description} ${c.era}`.toLowerCase();

        // Lexical bonus
        if (c.commonName.toLowerCase().includes(trimmed) || c.scientificName.toLowerCase().includes(trimmed)) {
          score += 50;
        }

        // Extinction filter match
        if (intent.extinct !== null && intent.extinct !== undefined) {
          const isExtinct = c.extinctionYear !== null;
          if (isExtinct === intent.extinct) score += 30;
          else score -= 40;
        }

        // Habitat type match
        if (intent.habitatType && c.habitatType.toLowerCase() === intent.habitatType.toLowerCase()) {
          score += 35;
        }

        // Size estimation match
        if (intent.size) {
          const weight = c.stats.weightKg;
          if (intent.size === 'micro' && weight < 0.1) score += 25;
          else if (intent.size === 'small' && weight < 5) score += 20;
          else if (intent.size === 'large' && weight > 100) score += 20;
          else if (intent.size === 'colossal' && weight > 1000) score += 30;
        }

        // Diet match
        if (intent.diet && c.diet.toLowerCase().includes(intent.diet.toLowerCase())) {
          score += 25;
        }

        // Danger level
        if (intent.dangerLevelMin && c.stats.dangerLevel >= intent.dangerLevelMin) {
          score += 20;
        }

        // Unusual / alien concept tags
        if (intent.unusual) {
          if (c.stats.rarityScore >= 8) score += 20;
          if (/alien|strange|weird|bizarre|bioluminescent|unique/i.test(c.description)) score += 25;
        }

        // Concept tokens
        for (const concept of intent.semanticConcepts) {
          if (cText.includes(concept.toLowerCase())) {
            score += 15;
          }
        }

        return { creature: c, score };
      });

      return scored
        .filter((item) => item.score > 10)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.creature);
    }

    return directMatches;
  }, [catalog, rawQuery, intent, options.activeHabitat, options.activeEra, options.isExtinctOnly]);

  const clearSearch = () => {
    setIntent(null);
  };

  return {
    results,
    intent,
    isSearching,
    clearSearch
  };
}
