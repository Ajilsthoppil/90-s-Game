import { BingoEngine } from '../BingoEngine';
import { BingoBoardGrid } from '../../types/bingo.types';

describe('BingoEngine Unit Tests for 90s Rules', () => {
  let engine: BingoEngine;

  beforeEach(() => {
    engine = new BingoEngine();
    engine.generateRandomBoard();
    engine.confirmBoard();
  });

  test('Calling numbers produces unique numbers between 1 and 25', () => {
    const called: number[] = [];
    for (let i = 0; i < 25; i++) {
      const num = engine.callNextNumber();
      expect(num).not.toBeNull();
      if (num !== null) {
        expect(called.includes(num)).toBe(false);
        called.push(num);
      }
    }
    expect(called.length).toBe(25);
    expect(engine.callNextNumber()).toBeNull(); // All 25 called
  });

  test('Cannot mark a number unless it has been called', () => {
    const grid = engine.getGrid();
    const firstCellNum = grid[0][0]!;

    // Attempt to mark before calling
    const uncalledResult = engine.markNumber(firstCellNum);
    expect(uncalledResult.success).toBe(false);
    expect(uncalledResult.message).toBe('Number not called yet.');

    // Now call numbers until firstCellNum is called
    let calledNum: number | null = null;
    while (calledNum !== firstCellNum) {
      calledNum = engine.callNextNumber();
    }

    // Now mark should succeed
    const validResult = engine.markNumber(firstCellNum);
    expect(validResult.success).toBe(true);
    expect(engine.getMarkedNumbers().has(firstCellNum)).toBe(true);
  });

  test('Bingo validation fails if < 5 lines completed', () => {
    const called = engine.callNextNumber()!;
    engine.markNumber(called);

    const validation = engine.validateBingo();
    expect(validation.isValid).toBe(false);
    expect(validation.message).toContain('BINGO NOT COMPLETE');
  });

  test('Bingo validation passes when 5 unique lines are completed', () => {
    const orderedGrid: BingoBoardGrid = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15],
      [16, 17, 18, 19, 20],
      [21, 22, 23, 24, 25],
    ];
    const testEngine = new BingoEngine(orderedGrid);
    testEngine.confirmBoard();

    // Call and mark numbers to complete 5 horizontal rows
    for (let n = 1; n <= 25; n++) {
      let called = testEngine.callNextNumber();
      while (called !== n) {
        called = testEngine.callNextNumber();
      }
      testEngine.markNumber(n);
    }

    const res = testEngine.validateBingo();
    expect(res.isValid).toBe(true);
    expect(res.message).toBe('🏆 BINGO!');
  });
});
