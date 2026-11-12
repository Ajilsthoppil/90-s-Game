import { LudoColor } from '../types/ludo.types';
import { START_SQUARES, SAFE_CELLS, isSafeCell, getAbsoluteTrackPosition } from './ludoRules';

// Symmetrically distributed across all 4 quadrants (neither overlaps safe cells nor start squares)
export const TREASURE_TILES = new Set<number>([5, 18, 31, 44]);
export const EVENT_TILES = new Set<number>([11, 24, 37, 50]);

// Direction tiles on key navigation turns that show clockwise flow (Tile 5 in design sheet)
export const DIRECTION_TILES: Record<number, string> = {
  6: '⬆️',
  12: '➡️',
  19: '➡️',
  25: '⬇️',
  32: '⬇️',
  38: '⬅️',
  45: '⬅️',
  51: '⬆️',
};

export function isTreasureTile(absPos: number): boolean {
  return TREASURE_TILES.has(absPos);
}

export function isEventTile(absPos: number): boolean {
  return EVENT_TILES.has(absPos);
}

export function isDirectionTile(absPos: number): boolean {
  return absPos in DIRECTION_TILES;
}

/**
 * Converts an absolute track position (1..52) to a specific player's relative track position (1..52)
 */
export function absoluteToRelative(color: LudoColor, absPos: number): number {
  const start = START_SQUARES[color];
  return ((absPos - start + 52) % 52) + 1;
}

/**
 * Searches forward along the player's track path (from relativePos + 1 up to 52)
 * for the nearest cell that is a Safe Zone.
 * Returns the destination relative position, or null if no safe zone exists ahead before the home corridor.
 */
export function findNextSafeZone(color: LudoColor, relativePos: number): number | null {
  if (relativePos < 0 || relativePos >= 51) return null;

  for (let nextRel = relativePos + 1; nextRel <= 51; nextRel++) {
    const abs = getAbsoluteTrackPosition(color, nextRel);
    if (abs && isSafeCell(abs)) {
      return nextRel;
    }
  }

  return null;
}
