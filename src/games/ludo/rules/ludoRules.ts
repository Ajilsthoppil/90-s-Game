import { LudoColor } from '../types/ludo.types';

export const START_SQUARES: Record<LudoColor, number> = {
  RED: 1,    // Top-Left (Luffy)
  GREEN: 14, // Top-Right (Zoro)
  BLUE: 27,  // Bottom-Right (Chopper)
  YELLOW: 40, // Bottom-Left (Sanji)
};

export const CAPTAINS_INFO: Record<LudoColor, { name: string; title: string; avatar: string }> = {
  RED: { name: 'Luffy', title: 'Captain Luffy', avatar: '👒' },
  GREEN: { name: 'Zoro', title: 'Swordsman Zoro', avatar: '⚔️' },
  YELLOW: { name: 'Sanji', title: 'Cook Sanji', avatar: '🍳' },
  BLUE: { name: 'Chopper', title: 'Doctor Chopper', avatar: '🌸' },
};

export const SAFE_CELLS = new Set<number>([1, 9, 14, 22, 27, 35, 40, 48]);

export function isSafeCell(trackPos: number): boolean {
  return SAFE_CELLS.has(trackPos);
}

/**
 * Converts a player's token position (1..57) to absolute shared track position (1..52)
 * Position 0 = Yard, 1..51 = Shared Track, 52..57 = Home Corridor, 58 = Home
 */
export function getAbsoluteTrackPosition(color: LudoColor, relativePos: number): number | null {
  if (relativePos <= 0 || relativePos > 51) return null;
  const start = START_SQUARES[color];
  const abs = ((start - 1 + (relativePos - 1)) % 52) + 1;
  return abs;
}

// 15x15 Grid Track coordinates (contiguous clockwise perimeter of 52 cells)
export const TRACK_GRID_MAP: Record<number, { r: number; c: number }> = {
  1: { r: 6, c: 1 }, 2: { r: 6, c: 2 }, 3: { r: 6, c: 3 }, 4: { r: 6, c: 4 }, 5: { r: 6, c: 5 },
  6: { r: 5, c: 6 }, 7: { r: 4, c: 6 }, 8: { r: 3, c: 6 }, 9: { r: 2, c: 6 }, 10: { r: 1, c: 6 }, 11: { r: 0, c: 6 },
  12: { r: 0, c: 7 }, // Apex top
  13: { r: 0, c: 8 }, 14: { r: 1, c: 8 }, 15: { r: 2, c: 8 }, 16: { r: 3, c: 8 }, 17: { r: 4, c: 8 }, 18: { r: 5, c: 8 },
  19: { r: 6, c: 9 }, 20: { r: 6, c: 10 }, 21: { r: 6, c: 11 }, 22: { r: 6, c: 12 }, 23: { r: 6, c: 13 }, 24: { r: 6, c: 14 },
  25: { r: 7, c: 14 }, // Apex right
  26: { r: 8, c: 14 }, 27: { r: 8, c: 13 }, 28: { r: 8, c: 12 }, 29: { r: 8, c: 11 }, 30: { r: 8, c: 10 }, 31: { r: 8, c: 9 },
  32: { r: 9, c: 8 }, 33: { r: 10, c: 8 }, 34: { r: 11, c: 8 }, 35: { r: 12, c: 8 }, 36: { r: 13, c: 8 }, 37: { r: 14, c: 8 },
  38: { r: 14, c: 7 }, // Apex bottom
  39: { r: 14, c: 6 }, 40: { r: 13, c: 6 }, 41: { r: 12, c: 6 }, 42: { r: 11, c: 6 }, 43: { r: 10, c: 6 }, 44: { r: 9, c: 6 },
  45: { r: 8, c: 5 }, 46: { r: 8, c: 4 }, 47: { r: 8, c: 3 }, 48: { r: 8, c: 2 }, 49: { r: 8, c: 1 }, 50: { r: 8, c: 0 },
  51: { r: 7, c: 0 }, // Apex left
  52: { r: 6, c: 0 }, // Corner before start
};

export const HOME_CORRIDOR_MAP: Record<LudoColor, Record<number, { r: number; c: number }>> = {
  // RED (Luffy - Top-Left): Enters left corridor (row 7, cols 1..6) moving right to center finish
  RED: {
    52: { r: 7, c: 1 },
    53: { r: 7, c: 2 },
    54: { r: 7, c: 3 },
    55: { r: 7, c: 4 },
    56: { r: 7, c: 5 },
    57: { r: 7, c: 6 },
  },
  // GREEN (Zoro - Top-Right): Enters top corridor (col 7, rows 1..6) moving down to center finish
  GREEN: {
    52: { r: 1, c: 7 },
    53: { r: 2, c: 7 },
    54: { r: 3, c: 7 },
    55: { r: 4, c: 7 },
    56: { r: 5, c: 7 },
    57: { r: 6, c: 7 },
  },
  // BLUE (Chopper - Bottom-Right): Enters right corridor (row 7, cols 13..8) moving left to center finish
  BLUE: {
    52: { r: 7, c: 13 },
    53: { r: 7, c: 12 },
    54: { r: 7, c: 11 },
    55: { r: 7, c: 10 },
    56: { r: 7, c: 9 },
    57: { r: 7, c: 8 },
  },
  // YELLOW (Sanji - Bottom-Left): Enters bottom corridor (col 7, rows 13..8) moving up to center finish
  YELLOW: {
    52: { r: 13, c: 7 },
    53: { r: 12, c: 7 },
    54: { r: 11, c: 7 },
    55: { r: 10, c: 7 },
    56: { r: 9, c: 7 },
    57: { r: 8, c: 7 },
  },
};

export const YARD_HUB_CENTERS: Record<LudoColor, { r: number; c: number }> = {
  RED: { r: 2.0, c: 3.0 },
  GREEN: { r: 2.0, c: 12.0 },
  YELLOW: { r: 10.6, c: 2.9 },
  BLUE: { r: 10.6, c: 12.1 },
};

export const YARD_SLOTS_MAP: Record<LudoColor, { r: number; c: number }[]> = {
  // RED (Top-Left Yard)
  RED: [
    { r: 2.7, c: 1.2 }, // Arc slot 1 (Upper-Left)
    { r: 4.2, c: 1.8 }, // Arc slot 2 (Lower-Left)
    { r: 4.2, c: 4.2 }, // Arc slot 3 (Lower-Right)
    { r: 2.7, c: 4.8 }, // Arc slot 4 (Upper-Right)
  ],
  // GREEN (Top-Right Yard)
  GREEN: [
    { r: 2.7, c: 10.2 }, // Arc slot 1 (Upper-Left)
    { r: 4.2, c: 10.8 }, // Arc slot 2 (Lower-Left)
    { r: 4.2, c: 13.2 }, // Arc slot 3 (Lower-Right)
    { r: 2.7, c: 13.8 }, // Arc slot 4 (Upper-Right)
  ],
  // YELLOW (Bottom-Left Yard)
  YELLOW: [
    { r: 11.6, c: 1.1 }, // Arc slot 1 (Upper-Left)
    { r: 13.2, c: 1.8 }, // Arc slot 2 (Lower-Left)
    { r: 13.2, c: 4.2 }, // Arc slot 3 (Lower-Right)
    { r: 11.6, c: 4.9 }, // Arc slot 4 (Upper-Right)
  ],
  // BLUE (Bottom-Right Yard)
  BLUE: [
    { r: 11.6, c: 10.1 }, // Arc slot 1 (Upper-Left)
    { r: 13.2, c: 10.8 }, // Arc slot 2 (Lower-Left)
    { r: 13.2, c: 13.2 }, // Arc slot 3 (Lower-Right)
    { r: 11.6, c: 14.0 }, // Arc slot 4 (Upper-Right)
  ],
};
