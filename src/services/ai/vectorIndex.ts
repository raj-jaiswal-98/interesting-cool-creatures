import type { Creature } from '../../types/creature';
import type { EmbeddingIndexFile } from '../../types/ai';
import { MODEL_ID, TEXT_VERSION } from './embeddingText';

export const dot = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
  let s = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    s += a[i] * b[i];
  }
  return s;
};

let cache: Promise<Map<string, Float32Array> | null> | null = null;

export function loadCatalogVectors(): Promise<Map<string, Float32Array> | null> {
  if (!cache) {
    cache = import('../../data/creatureEmbeddings.json')
      .then((m) => {
        const f = (m.default ?? m) as EmbeddingIndexFile;
        const ok =
          f?.header?.model === MODEL_ID &&
          f?.header?.textVersion === TEXT_VERSION &&
          Array.isArray(f?.ids) &&
          Array.isArray(f?.vectors);
        if (!ok) return null;
        return new Map(f.ids.map((id, i) => [id, Float32Array.from(f.vectors[i])]));
      })
      .catch(() => null);
  }
  return cache;
}

export interface FuseOptions {
  k?: number;
  minSim?: number;
  topSem?: number;
  wLex?: number;
  wSem?: number;
}

/**
 * Reciprocal rank fusion (RRF) of lexical order and vector semantic order.
 */
export function fuse(
  creatures: Creature[],
  lexical: Creature[],
  qv: Float32Array,
  vectors: Map<string, Float32Array>,
  activeEra: string,
  opts: FuseOptions = {}
): Creature[] {
  const {
    k = 60,
    minSim = 0.3,
    topSem = 30,
    wLex = 0.4,
    wSem = 0.6,
  } = opts;

  const eraOk = (c: Creature) =>
    activeEra === 'all' || c.era.toLowerCase() === activeEra.toLowerCase();

  const sem = creatures
    .filter(eraOk)
    .map((c) => ({
      c,
      s: vectors.has(c.id) ? dot(qv, vectors.get(c.id)!) : -1,
    }))
    .filter((x) => x.s >= minSim)
    .sort((a, b) => b.s - a.s)
    .slice(0, topSem);

  const score = new Map<string, { c: Creature; v: number }>();
  const add = (c: Creature, rank: number, w: number) => {
    const cur = score.get(c.id) ?? { c, v: 0 };
    cur.v += w / (k + rank);
    score.set(c.id, cur);
  };

  lexical.forEach((c, i) => add(c, i, wLex));
  sem.forEach((x, i) => add(x.c, i, wSem));

  return [...score.values()].sort((a, b) => b.v - a.v).map((x) => x.c);
}
