import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Creature } from '../types/creature';
import { embeddingService } from '../services/ai/embeddingService';
import { fuse, loadCatalogVectors } from '../services/ai/vectorIndex';

export function useEmbeddingStatus() {
  return useSyncExternalStore(embeddingService.subscribe, embeddingService.getStatus);
}

export function useEmbeddingProgress() {
  return useSyncExternalStore(embeddingService.subscribe, embeddingService.getProgress);
}

export function useSemanticRerank(
  creatures: Creature[],
  lexical: Creature[],
  query: string,
  activeEra: string
): Creature[] {
  const status = useEmbeddingStatus();
  const [semantic, setSemantic] = useState<Creature[] | null>(null);
  const lexRef = useRef(lexical);
  lexRef.current = lexical;
  const lexKey = lexical.map((c) => c.id).join('|');

  useEffect(() => {
    const q = query.trim();
    if (!q || status !== 'ready') {
      setSemantic(null);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const [qv, vectors] = await Promise.all([
          embeddingService.embed(q),
          loadCatalogVectors(),
        ]);
        if (cancelled || !vectors) {
          setSemantic(null);
          return;
        }
        setSemantic(fuse(creatures, lexRef.current, qv, vectors, activeEra));
      } catch {
        if (!cancelled) setSemantic(null);
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [creatures, query, status, activeEra, lexKey]);

  return semantic ?? lexical;
}
