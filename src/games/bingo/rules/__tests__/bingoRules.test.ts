import {
  generateRandomBoardGrid,
  validateBoardNumbers,
  calculateBingoProgress,
  getCompletedBingoLines,
  getNewlyCompletedLines,
} from '../bingoRules';
import { BingoBoardGrid } from '../../types/bingo.types';

describe('Actual 90s Bingo Rules Engine Tests', () => {
  test('Random board generation generates valid 5x5 board with numbers 1-25', () => {
    const grid = generateRandomBoardGrid();
    expect(grid.length).toBe(5);
    grid.forEach((row) => expect(row.length).toBe(5));

    const validation = validateBoardNumbers(grid);
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
    expect(validation.missingNumbers.length).toBe(0);
    expect(validation.duplicateNumbers.length).toBe(0);
  });

  test('Detects missing and duplicate numbers in manual board entry', () => {
    const invalidGrid: BingoBoardGrid = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
      [16, 17, 18, 19, 20],
      [21, 22, 23, 24, 24], // Duplicate 24, missing 25
    ];

    const validation = validateBoardNumbers(invalidGrid);
    expect(validation.isValid).toBe(false);
    expect(validation.duplicateNumbers).toEqual([24]);
    expect(validation.missingNumbers).toEqual([25]);
  });

  test('1st completed line = B (Horizontal, Vertical, Main Diag, or Anti Diag)', () => {
    const grid: BingoBoardGrid = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
      [16, 17, 18, 19, 20],
      [21, 22, 23, 24, 25],
    ];

    // Horizontal 1st line -> B
    const hMarks = new Set([1, 2, 3, 4, 5]);
    const hLines = getCompletedBingoLines(grid, hMarks);
    expect(hLines.length).toBe(1);
    expect(hLines[0].type).toBe('B');
    expect(hLines[0].direction).toBe('horizontal');

    // Vertical 1st line -> B
    const vMarks = new Set([1, 6, 11, 16, 21]);
    const vLines = getCompletedBingoLines(grid, vMarks);
    expect(vLines.length).toBe(1);
    expect(vLines[0].type).toBe('B');
    expect(vLines[0].direction).toBe('vertical');

    // Main Diagonal 1st line -> B
    const mainMarks = new Set([1, 7, 13, 19, 25]);
    const mainLines = getCompletedBingoLines(grid, mainMarks);
    expect(mainLines.length).toBe(1);
    expect(mainLines[0].type).toBe('B');
    expect(mainLines[0].direction).toBe('mainDiagonal');

    // Anti Diagonal 1st line -> B
    const antiMarks = new Set([5, 9, 13, 17, 21]);
    const antiLines = getCompletedBingoLines(grid, antiMarks);
    expect(antiLines.length).toBe(1);
    expect(antiLines[0].type).toBe('B');
    expect(antiLines[0].direction).toBe('antiDiagonal');
  });

  test('X pattern (Main Diag then Anti Diag) produces B=\\ and I=/', () => {
    const grid: BingoBoardGrid = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
      [16, 17, 18, 19, 20],
      [21, 22, 23, 24, 25],
    ];

    const historyKeys = ['diag-main', 'diag-anti'];
    const xMarks = new Set([1, 7, 13, 19, 25, 5, 9, 17, 21]);
    const xLines = getCompletedBingoLines(grid, xMarks, historyKeys);

    expect(xLines.length).toBe(2);
    expect(xLines[0].key).toBe('diag-main');
    expect(xLines[0].type).toBe('B');
    expect(xLines[1].key).toBe('diag-anti');
    expect(xLines[1].type).toBe('I');
  });

  test('Calculates completed lines count and B-I-N-G-O progress based on line count', () => {
    let progress = calculateBingoProgress(0);
    expect(progress.B).toBe(false);
    expect(progress.completedLinesCount).toBe(0);

    progress = calculateBingoProgress(1);
    expect(progress.B).toBe(true);
    expect(progress.I).toBe(false);

    progress = calculateBingoProgress(4);
    expect(progress.B).toBe(true);
    expect(progress.I).toBe(true);
    expect(progress.N).toBe(true);
    expect(progress.G).toBe(true);
    expect(progress.O).toBe(false);

    progress = calculateBingoProgress(5);
    expect(progress.O).toBe(true);
  });
});
