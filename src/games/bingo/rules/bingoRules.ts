import {
  BingoBoardGrid,
  BingoLetter,
  BingoProgress,
  CellPosition,
  CompletedBingoLine,
} from '../types/bingo.types';

export const BINGO_LETTERS: BingoLetter[] = ['B', 'I', 'N', 'G', 'O'];

export interface DefinedLine {
  key: string;
  direction: 'horizontal' | 'vertical' | 'mainDiagonal' | 'antiDiagonal';
  index?: number;
  cells: CellPosition[];
}

/**
 * Returns all 12 possible valid lines on a 5x5 board in deterministic evaluation order:
 * 1. 5 Horizontal rows (row-0 .. row-4)
 * 2. 5 Vertical columns (col-0 .. col-4)
 * 3. Main diagonal \ (diag-main)
 * 4. Anti diagonal / (diag-anti)
 */
export function getAllPossibleLines(grid: BingoBoardGrid): DefinedLine[] {
  const lines: DefinedLine[] = [];

  // 1. 5 Horizontal rows
  for (let r = 0; r < 5; r++) {
    lines.push({
      key: `row-${r}`,
      direction: 'horizontal',
      index: r,
      cells: [
        { row: r, col: 0 },
        { row: r, col: 1 },
        { row: r, col: 2 },
        { row: r, col: 3 },
        { row: r, col: 4 },
      ],
    });
  }

  // 2. 5 Vertical columns
  for (let c = 0; c < 5; c++) {
    lines.push({
      key: `col-${c}`,
      direction: 'vertical',
      index: c,
      cells: [
        { row: 0, col: c },
        { row: 1, col: c },
        { row: 2, col: c },
        { row: 3, col: c },
        { row: 4, col: c },
      ],
    });
  }

  // 3. Main diagonal (\: [0,0], [1,1], [2,2], [3,3], [4,4])
  lines.push({
    key: 'diag-main',
    direction: 'mainDiagonal',
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
      { row: 4, col: 4 },
    ],
  });

  // 4. Anti diagonal (/: [0,4], [1,3], [2,2], [3,1], [4,0])
  lines.push({
    key: 'diag-anti',
    direction: 'antiDiagonal',
    cells: [
      { row: 0, col: 4 },
      { row: 1, col: 3 },
      { row: 2, col: 2 },
      { row: 3, col: 1 },
      { row: 4, col: 0 },
    ],
  });

  return lines;
}

/**
 * Checks if a specific line (5 cells) is fully marked on the grid.
 */
export function isLineComplete(
  grid: BingoBoardGrid,
  markedNumbers: Set<number>,
  cells: CellPosition[]
): boolean {
  for (const cell of cells) {
    const num = grid[cell.row]?.[cell.col];
    if (num === null || num === undefined || !markedNumbers.has(num)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns newly completed lines (lines that are complete but not yet in existingHistoryKeys),
 * evaluated in deterministic order.
 */
export function getNewlyCompletedLines(
  grid: BingoBoardGrid,
  markedNumbers: Set<number>,
  existingHistoryKeys: string[]
): DefinedLine[] {
  const existingSet = new Set(existingHistoryKeys);
  const allLines = getAllPossibleLines(grid);
  const newlyCompleted: DefinedLine[] = [];

  for (const line of allLines) {
    if (!existingSet.has(line.key)) {
      if (isLineComplete(grid, markedNumbers, line.cells)) {
        newlyCompleted.push(line);
      }
    }
  }

  return newlyCompleted;
}

/**
 * Derives completed lines for a grid and marked numbers set.
 * If historyKeys is supplied, preserves that exact sequence order.
 * Otherwise, orders completed lines deterministically (rows -> cols -> diag-main -> diag-anti).
 *
 * Each line gets sequenceNumber (1-indexed) and type ('B', 'I', 'N', 'G', 'O' for 1st..5th).
 */
export function getCompletedBingoLines(
  grid: BingoBoardGrid,
  markedNumbers: Set<number>,
  historyKeys?: string[]
): CompletedBingoLine[] {
  const allLinesMap = new Map<string, DefinedLine>();
  getAllPossibleLines(grid).forEach((l) => allLinesMap.set(l.key, l));

  const resultKeys: string[] = [];

  if (historyKeys && historyKeys.length > 0) {
    for (const key of historyKeys) {
      const def = allLinesMap.get(key);
      if (def && isLineComplete(grid, markedNumbers, def.cells)) {
        if (!resultKeys.includes(key)) {
          resultKeys.push(key);
        }
      }
    }
  }

  // Find any completed lines not in history (or if no history supplied)
  for (const line of getAllPossibleLines(grid)) {
    if (!resultKeys.includes(line.key)) {
      if (isLineComplete(grid, markedNumbers, line.cells)) {
        resultKeys.push(line.key);
      }
    }
  }

  return resultKeys.map((key, index) => {
    const lineDef = allLinesMap.get(key)!;
    const seq = index + 1;
    const letter = index < 5 ? BINGO_LETTERS[index] : `L${seq}`;
    return {
      key: lineDef.key,
      type: letter,
      direction: lineDef.direction,
      index: lineDef.index,
      cells: lineDef.cells,
      sequenceNumber: seq,
    };
  });
}

/**
 * Calculates current B-I-N-G-O progress based on the count of unique completed lines.
 */
export function calculateBingoProgress(completedLinesCount: number): BingoProgress {
  return {
    B: completedLinesCount >= 1,
    I: completedLinesCount >= 2,
    N: completedLinesCount >= 3,
    G: completedLinesCount >= 4,
    O: completedLinesCount >= 5,
    completedLinesCount,
  };
}

export interface BoardValidationResult {
  isValid: boolean;
  errors: string[];
  missingNumbers: number[];
  duplicateNumbers: number[];
  emptyCount: number;
  invalidRangeNumbers: number[];
  formattedAlertMessage: string | null;
}

/**
 * Board validation: 25 numbers within 1..maxNumber without duplicate values
 */
export function validateBoardNumbers(
  grid: BingoBoardGrid,
  maxNumber: number = 25
): BoardValidationResult {
  const errors: string[] = [];
  const foundNumbers = new Map<number, number>();
  const invalidRangeNumbers: number[] = [];
  let emptyCount = 0;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const num = grid[r]?.[c];
      if (num === null || num === undefined) {
        emptyCount++;
        errors.push(`Cell [${r + 1}, ${c + 1}] is empty.`);
      } else if (typeof num !== 'number' || num < 1 || num > maxNumber) {
        invalidRangeNumbers.push(num);
        errors.push(`Number ${num} at [${r + 1}, ${c + 1}] must be between 1 and ${maxNumber}.`);
      } else {
        foundNumbers.set(num, (foundNumbers.get(num) || 0) + 1);
      }
    }
  }

  const duplicateNumbers: number[] = [];
  foundNumbers.forEach((count, num) => {
    if (count > 1) {
      duplicateNumbers.push(num);
    }
  });

  if (duplicateNumbers.length > 0) {
    errors.push(`Duplicate number(s): ${duplicateNumbers.join(', ')}`);
  }

  const missingNumbers: number[] = [];
  if (maxNumber === 25) {
    for (let n = 1; n <= 25; n++) {
      if (!foundNumbers.has(n)) {
        missingNumbers.push(n);
      }
    }
    if (missingNumbers.length > 0) {
      errors.push(`Missing number(s): ${missingNumbers.join(', ')}`);
    }
  }

  let formattedAlertMessage: string | null = null;
  if (errors.length > 0) {
    if (emptyCount > 0) {
      formattedAlertMessage = '⚠ Enter all 25 numbers.';
    } else if (invalidRangeNumbers.length > 0) {
      formattedAlertMessage = `⚠ Number ${invalidRangeNumbers[0]} is invalid for the 1–${maxNumber} variant.`;
    } else if (duplicateNumbers.length > 0) {
      formattedAlertMessage = `⚠ Number ${duplicateNumbers[0]} is entered twice.`;
    } else if (missingNumbers.length > 0) {
      formattedAlertMessage = `⚠ Missing number: ${missingNumbers[0]}.`;
    } else if (maxNumber === 50) {
      formattedAlertMessage = '⚠ You need 25 unique numbers between 1 and 50.';
    } else {
      formattedAlertMessage = `⚠ ${errors[0]}`;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingNumbers,
    duplicateNumbers,
    emptyCount,
    invalidRangeNumbers,
    formattedAlertMessage,
  };
}

/**
 * Random board generator supporting 1..maxNumber
 */
export function generateRandomBoardGrid(maxNumber: number = 25): BingoBoardGrid {
  const pool = Array.from({ length: maxNumber }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selected = pool.slice(0, 25);
  const grid: BingoBoardGrid = [];
  for (let r = 0; r < 5; r++) {
    grid.push(selected.slice(r * 5, (r + 1) * 5));
  }
  return grid;
}
