export type ScreenClass = 'compact' | 'regular' | 'large';
export type Orientation = 'PORTRAIT' | 'LANDSCAPE';

export type OrientationPolicy =
  | 'PORTRAIT_ONLY'
  | 'LANDSCAPE_PRIORITY'
  | 'PORTRAIT_PRIORITY'
  | 'DUAL';

export const MIN_TOUCH_TARGET = 48; // dp standard for accessible touch targets
export const RECOMMENDED_TOUCH_TARGET = 44; // dp

/**
 * Defined orientation policy per game.
 * Used by responsive containers to provide appropriate layouts and orientation hints.
 */
export const GAME_ORIENTATION_POLICY: Record<string, OrientationPolicy> = {
  // Multiplayer / Board / Card / Classic
  bingo: 'DUAL',
  ludo: 'LANDSCAPE_PRIORITY',
  snakes_ladders: 'LANDSCAPE_PRIORITY',
  uno: 'DUAL',
  phase10: 'DUAL',

  // Single-player Brain Games (prioritize portrait)
  circuit_connect: 'PORTRAIT_PRIORITY',
  tile_connect: 'PORTRAIT_PRIORITY',
  word_fill: 'PORTRAIT_PRIORITY',
  word_puzzle: 'PORTRAIT_PRIORITY',
  word_connect: 'PORTRAIT_PRIORITY',
  sudoku: 'PORTRAIT_PRIORITY',
  memory_match: 'PORTRAIT_PRIORITY',
  pattern_complete: 'PORTRAIT_PRIORITY',
  number_puzzles: 'PORTRAIT_PRIORITY',
  sliding_puzzle: 'PORTRAIT_PRIORITY',
  maze: 'PORTRAIT_PRIORITY',
  visual_diff: 'PORTRAIT_PRIORITY',
};

/**
 * Computes safe Android status-bar clearance height.
 * In landscape mode, status bar is 0dp.
 * In portrait mode, accounts for punch-hole cameras and status bars (min 32dp).
 */
export function getStatusBarHeight(
  isLandscape: boolean = false,
  rawStatusHeight?: number
): number {
  if (isLandscape) return 0;
  return Math.max(32, rawStatusHeight ?? 32);
}

/**
 * Computes safe Android bottom navigation / gesture pill clearance inset.
 */
export function getBottomNavInset(isLandscape: boolean = false): number {
  return isLandscape ? 4 : 8;
}

/**
 * Returns 'PORTRAIT' if height >= width, otherwise 'LANDSCAPE'.
 */
export function getOrientation(width: number, height: number): Orientation {
  return height >= width ? 'PORTRAIT' : 'LANDSCAPE';
}

/**
 * Classifies screen size by shortest dimension:
 * - compact: < 380 dp (narrow phones)
 * - regular: 380 - 600 dp (standard smartphones)
 * - large: > 600 dp (tablets / foldables)
 */
export function getScreenClass(width: number, height: number = 800): ScreenClass {
  const minDim = Math.min(width, height);
  if (minDim < 380) return 'compact';
  if (minDim <= 600) return 'regular';
  return 'large';
}

export interface BoardCalculationOptions {
  width: number;
  height: number;
  gridCount: number; // e.g. 15 for Ludo, 10 for Snakes & Ladders, 5 for Bingo
  isLandscape?: boolean;
  sidePanelWidth?: number;
  topHeaderHeight?: number;
  bottomTrayHeight?: number;
  padding?: number;
}

export interface BoardCalculationResult {
  boardSize: number;
  cellSize: number;
  availableWidth: number;
  availableHeight: number;
  isLandscape: boolean;
}

/**
 * Pure calculation utility to compute responsive square board dimensions
 * without clipping across both portrait and landscape screen sizes.
 */
export function calculateBoardDimensions(
  options: BoardCalculationOptions
): BoardCalculationResult {
  const {
    width,
    height,
    gridCount,
    isLandscape = width > height,
    sidePanelWidth = isLandscape ? 140 : 0,
    topHeaderHeight = 52,
    bottomTrayHeight = isLandscape ? 36 : 100,
    padding = 16,
  } = options;

  const availableWidth = Math.max(0, width - sidePanelWidth - padding * 2);
  const availableHeight = Math.max(
    0,
    height - topHeaderHeight - bottomTrayHeight - padding
  );

  const maxDimension = Math.min(availableWidth, availableHeight);
  const cellSize = Math.max(1, Math.floor(maxDimension / gridCount));
  const boardSize = cellSize * gridCount;

  return {
    boardSize,
    cellSize,
    availableWidth,
    availableHeight,
    isLandscape,
  };
}

export interface HandCardLayoutOptions {
  cardCount: number;
  availableWidth: number;
  cardWidth?: number;
  minOverlap?: number;
  maxOverlap?: number;
}

export interface HandCardLayoutResult {
  overlapMargin: number;
  needsScroll: boolean;
  totalWidth: number;
}

/**
 * Calculates card hand layout and negative overlap margin for card games (UNO, Phase 10)
 * so hands with many cards remain as visible as possible without overflowing.
 */
export function calculateHandCardLayout(
  options: HandCardLayoutOptions
): HandCardLayoutResult {
  const {
    cardCount,
    availableWidth,
    cardWidth = 66,
    minOverlap = 8,
    maxOverlap = 36,
  } = options;

  if (cardCount <= 0) {
    return { overlapMargin: 0, needsScroll: false, totalWidth: 0 };
  }

  if (cardCount === 1) {
    return { overlapMargin: 0, needsScroll: cardWidth > availableWidth, totalWidth: cardWidth };
  }

  // Width if cards had zero overlap
  const unoverlappedWidth = cardCount * cardWidth;

  if (unoverlappedWidth <= availableWidth) {
    return { overlapMargin: 0, needsScroll: false, totalWidth: unoverlappedWidth };
  }

  // Calculate needed overlap per card to fit into availableWidth
  // totalWidth = cardWidth + (cardCount - 1) * (cardWidth - overlap) = availableWidth
  // (cardCount - 1) * overlap = cardCount * cardWidth - availableWidth
  const neededOverlap = Math.ceil(
    (unoverlappedWidth - availableWidth) / (cardCount - 1)
  );

  const clampedOverlap = Math.min(maxOverlap, Math.max(minOverlap, neededOverlap));
  const totalWidth = cardWidth + (cardCount - 1) * (cardWidth - clampedOverlap);

  return {
    overlapMargin: clampedOverlap,
    needsScroll: totalWidth > availableWidth,
    totalWidth,
  };
}
