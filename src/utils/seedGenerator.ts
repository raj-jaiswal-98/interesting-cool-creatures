/**
 * Deterministic daily creature selection utilities based on UTC YYYY-MM-DD string.
 * Ensures synchronized daily spotlight worldwide.
 */

import type { Creature } from '../types/creature';

export interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
  diffMs: number;
}

/**
 * Generates a deterministic integer index from a date string.
 * @param creatureListLength - Total number of available creatures
 * @param customDateStr - Optional YYYY-MM-DD date override (defaults to current UTC)
 * @returns Deterministic index in range [0, creatureListLength - 1]
 */
export function getDailyCreatureIndex(creatureListLength: number, customDateStr?: string): number {
  if (!creatureListLength || creatureListLength <= 0) return 0;
  const dateStr = customDateStr || new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0; // Convert to 32-bit signed integer
  }
  return Math.abs(hash) % creatureListLength;
}

/**
 * Returns the Creature of the Day from the catalog.
 */
export function getDailySpotlightCreature<T extends { id: string }>(
  creatureList: T[],
  customDateStr?: string
): T | null {
  if (!creatureList || creatureList.length === 0) return null;
  const index = getDailyCreatureIndex(creatureList.length, customDateStr);
  return creatureList[index];
}

/**
 * Computes hours, minutes, and seconds remaining until the next UTC midnight.
 */
export function getTimeUntilNextSpotlight(): CountdownTime {
  const now = new Date();
  const nextMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0
  ));
  const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, diffMs };
}
