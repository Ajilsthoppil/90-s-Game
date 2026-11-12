import {
  BingoBoardGrid,
  BingoEvent,
  BingoEventListener,
  BingoEventType,
  BingoProgress,
  CompletedBingoLine,
  GamePhase,
  ValidationResult,
} from '../types/bingo.types';
import {
  BINGO_LETTERS,
  calculateBingoProgress,
  generateRandomBoardGrid,
  getCompletedBingoLines,
  getNewlyCompletedLines,
  validateBoardNumbers,
} from '../rules/bingoRules';

export interface BingoEngineExportedState {
  grid: BingoBoardGrid;
  isLocked: boolean;
  phase: GamePhase;
  calledNumbers: number[];
  currentCalledNumber: number | null;
  markedNumbers: number[];
  progress: BingoProgress;
  completedLineHistory: CompletedBingoLine[];
}

export class BingoEngine {
  private grid: BingoBoardGrid;
  private isLocked: boolean = false;
  private phase: GamePhase = 'SETUP';
  private calledNumbers: number[] = [];
  private currentCalledNumber: number | null = null;
  private markedNumbers: Set<number> = new Set();
  private completedLineHistory: CompletedBingoLine[] = [];
  private listeners: Map<BingoEventType | '*', Set<BingoEventListener>> = new Map();
  private progress: BingoProgress = {
    B: false,
    I: false,
    N: false,
    G: false,
    O: false,
    completedLinesCount: 0,
  };

  constructor(initialGrid?: BingoBoardGrid) {
    if (initialGrid) {
      this.grid = initialGrid.map((row) => [...row]);
    } else {
      this.grid = Array.from({ length: 5 }, () => Array(5).fill(null));
    }
  }

  // --- State Getters ---

  public getGrid(): BingoBoardGrid {
    return this.grid.map((row) => [...row]);
  }

  public getIsLocked(): boolean {
    return this.isLocked;
  }

  public getPhase(): GamePhase {
    return this.phase;
  }

  public getCalledNumbers(): number[] {
    return [...this.calledNumbers];
  }

  public getCurrentCalledNumber(): number | null {
    return this.currentCalledNumber;
  }

  public getMarkedNumbers(): Set<number> {
    return new Set(this.markedNumbers);
  }

  public getProgress(): BingoProgress {
    return { ...this.progress };
  }

  public getCompletedLines(): CompletedBingoLine[] {
    const historyKeys = this.completedLineHistory.map((l) => l.key);
    return getCompletedBingoLines(this.grid, this.markedNumbers, historyKeys);
  }

  public getCompletedLinesCount(): number {
    return this.getCompletedLines().length;
  }

  // --- Event Handling ---

  public on(eventType: BingoEventType | '*', listener: BingoEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  public emit(type: BingoEventType, data?: any): void {
    const event: BingoEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach((fn) => fn(event));
    }

    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((fn) => fn(event));
    }
  }

  private setPhase(newPhase: GamePhase): void {
    if (this.phase !== newPhase) {
      const oldPhase = this.phase;
      this.phase = newPhase;
      this.emit('STATE_CHANGED', { oldPhase, newPhase });
    }
  }

  // --- Board Setup & Management ---

  public setCell(row: number, col: number, num: number | null): boolean {
    if (this.isLocked || this.phase !== 'SETUP') {
      return false;
    }
    if (row < 0 || row >= 5 || col < 0 || col >= 5) {
      return false;
    }
    this.grid[row][col] = num;
    return true;
  }

  public generateRandomBoard(maxNumber: number = 25): void {
    if (this.isLocked || (this.phase !== 'SETUP' && this.phase !== 'BOARD_LOCKED')) {
      return;
    }
    this.grid = generateRandomBoardGrid(maxNumber);
  }

  public confirmBoard(maxNumber: number = 25): ValidationResult {
    const validation = validateBoardNumbers(this.grid, maxNumber);
    if (!validation.isValid) {
      return {
        isValid: false,
        message: validation.errors.join(' '),
        failedReason: 'INVALID_BOARD',
      };
    }

    this.isLocked = true;
    this.setPhase('BOARD_LOCKED');
    return {
      isValid: true,
      message: 'Board locked. Good luck! 😄',
    };
  }

  // --- Calling Numbers ---

  public callNextNumber(): number | null {
    if (!this.isLocked || this.phase === 'SETUP' || this.phase === 'MATCH_FINISHED') {
      return null;
    }

    const calledSet = new Set(this.calledNumbers);
    const uncalled: number[] = [];
    for (let i = 1; i <= 25; i++) {
      if (!calledSet.has(i)) {
        uncalled.push(i);
      }
    }

    if (uncalled.length === 0) {
      return null; // All 25 numbers called
    }

    const randomIndex = Math.floor(Math.random() * uncalled.length);
    const nextNumber = uncalled[randomIndex];

    this.calledNumbers.push(nextNumber);
    this.currentCalledNumber = nextNumber;

    this.emit('NUMBER_CALLED', {
      number: nextNumber,
      calledNumbers: [...this.calledNumbers],
    });

    return nextNumber;
  }

  public hasNumberOnBoard(num: number): boolean {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (this.grid[r]?.[c] === num) {
          return true;
        }
      }
    }
    return false;
  }

  // --- Marking Numbers ---

  public markNumber(num: number): { success: boolean; message: string } {
    if (!this.isLocked || this.phase === 'SETUP' || this.phase === 'MATCH_FINISHED') {
      return { success: false, message: 'Game is not active.' };
    }

    // Strict Marking Rule: Must be called before marking!
    if (!this.calledNumbers.includes(num)) {
      return { success: false, message: 'Number not called yet.' };
    }

    if (this.markedNumbers.has(num)) {
      return { success: true, message: 'Number already marked.' };
    }

    this.markedNumbers.add(num);
    this.emit('PLAYER_MARKED', { number: num });

    // Evaluate line completions
    this.evaluateLineCompletions();

    return { success: true, message: 'Marked!' };
  }

  /**
   * Detects newly completed lines in deterministic order, assigns sequence B-I-N-G-O letters,
   * updates line history, progress, and phase.
   */
  private evaluateLineCompletions(): void {
    if (this.phase === 'BOARD_LOCKED') {
      this.setPhase('PLAYING_B');
    }

    const historyKeys = this.completedLineHistory.map((l) => l.key);
    const newlyCompleted = getNewlyCompletedLines(this.grid, this.markedNumbers, historyKeys);

    for (const lineDef of newlyCompleted) {
      const sequenceNumber = this.completedLineHistory.length + 1;
      const type = sequenceNumber <= 5 ? BINGO_LETTERS[sequenceNumber - 1] : `L${sequenceNumber}`;

      const completedLine: CompletedBingoLine = {
        key: lineDef.key,
        type,
        direction: lineDef.direction,
        index: lineDef.index,
        cells: lineDef.cells,
        sequenceNumber,
      };

      this.completedLineHistory.push(completedLine);

      this.emit('LINE_COMPLETED', {
        line: completedLine,
        sequenceNumber,
        type,
      });

      if (sequenceNumber === 1) {
        this.emit('B_PATTERN_COMPLETED', { progress: calculateBingoProgress(1) });
      } else if (sequenceNumber === 2) {
        this.emit('I_PATTERN_COMPLETED', { progress: calculateBingoProgress(2) });
      } else if (sequenceNumber === 3) {
        this.emit('N_PATTERN_COMPLETED', { progress: calculateBingoProgress(3) });
      } else if (sequenceNumber === 4) {
        this.emit('G_PATTERN_COMPLETED', { progress: calculateBingoProgress(4) });
      } else if (sequenceNumber === 5) {
        this.emit('O_PATTERN_COMPLETED', { progress: calculateBingoProgress(5) });
      }
    }

    const totalCount = this.completedLineHistory.length;
    this.progress = calculateBingoProgress(totalCount);

    if (totalCount >= 5) {
      this.setPhase('PLAYING_O');
    } else if (totalCount >= 4) {
      this.setPhase('PLAYING_O');
    } else if (totalCount >= 3) {
      this.setPhase('PLAYING_G');
    } else if (totalCount >= 2) {
      this.setPhase('PLAYING_N');
    } else if (totalCount >= 1) {
      this.setPhase('PLAYING_I');
    }
  }

  // --- Strict Bingo Claim Validation ---

  public validateBingo(): ValidationResult {
    if (!this.isLocked) {
      return {
        isValid: false,
        message: 'Board is not locked.',
        failedReason: 'INVALID_BOARD',
      };
    }

    const calledSet = new Set(this.calledNumbers);

    // 1. Verify every marked number exists on player board & was actually called
    for (const num of this.markedNumbers) {
      if (!calledSet.has(num)) {
        this.emit('INVALID_CLAIM', { reason: 'UNCALLED_NUMBER_MARKED' });
        return {
          isValid: false,
          message: '❌ BINGO NOT COMPLETE. Uncalled number marked.',
          failedReason: 'UNCALLED_NUMBER_MARKED',
        };
      }
    }

    // 2. Evaluate actual completed lines
    const historyKeys = this.completedLineHistory.map((l) => l.key);
    const completedLines = getCompletedBingoLines(this.grid, this.markedNumbers, historyKeys);
    const count = completedLines.length;

    const b = count >= 1;
    const i = count >= 2;
    const n = count >= 3;
    const g = count >= 4;
    const o = count >= 5;

    if (count < 5) {
      const msg = `❌ BINGO NOT COMPLETE. Completed lines: ${count}/5.`;
      this.emit('INVALID_CLAIM', { reason: 'SEQUENCE_NOT_MET', count });
      return {
        isValid: false,
        message: msg,
        B: b,
        I: i,
        N: n,
        G: g,
        O: o,
        completedLinesCount: count,
        completedLines,
        failedReason: 'SEQUENCE_NOT_MET',
      };
    }

    this.setPhase('BINGO_CLAIMED');
    this.emit('BINGO_CLAIMED', {
      markedNumbers: Array.from(this.markedNumbers),
      calledNumbers: [...this.calledNumbers],
    });

    this.setPhase('MATCH_FINISHED');
    this.emit('MATCH_FINISHED', {
      totalCalls: this.calledNumbers.length,
    });

    return {
      isValid: true,
      message: '🏆 BINGO!',
      B: true,
      I: true,
      N: true,
      G: true,
      O: true,
      completedLinesCount: count,
      completedLines,
    };
  }

  // --- Restart Match / Revenge Round ---

  public startNewMatch(keepBoard: boolean = false): void {
    if (!keepBoard) {
      this.grid = Array.from({ length: 5 }, () => Array(5).fill(null));
      this.isLocked = false;
      this.setPhase('SETUP');
    } else {
      this.isLocked = true;
      this.setPhase('PLAYING_B');
    }

    this.calledNumbers = [];
    this.currentCalledNumber = null;
    this.markedNumbers.clear();
    this.completedLineHistory = [];
    this.progress = {
      B: false,
      I: false,
      N: false,
      G: false,
      O: false,
      completedLinesCount: 0,
    };

    this.emit('MATCH_RESTARTED', { keptBoard: keepBoard });
  }

  // --- Serialization & Recovery ---

  public exportState(): BingoEngineExportedState {
    return {
      grid: this.grid.map((row) => [...row]),
      isLocked: this.isLocked,
      phase: this.phase,
      calledNumbers: [...this.calledNumbers],
      currentCalledNumber: this.currentCalledNumber,
      markedNumbers: Array.from(this.markedNumbers),
      progress: { ...this.progress },
      completedLineHistory: [...this.completedLineHistory],
    };
  }

  public restoreState(state: BingoEngineExportedState): void {
    this.grid = state.grid.map((row) => [...row]);
    this.isLocked = state.isLocked;
    this.phase = state.phase;
    this.calledNumbers = [...state.calledNumbers];
    this.currentCalledNumber = state.currentCalledNumber;
    this.markedNumbers = new Set(state.markedNumbers);
    this.completedLineHistory = state.completedLineHistory ? [...state.completedLineHistory] : [];

    // Re-evaluate newly completed lines if history was empty but marks exist
    if (this.completedLineHistory.length === 0 && this.markedNumbers.size > 0) {
      this.evaluateLineCompletions();
    } else {
      this.progress = calculateBingoProgress(this.completedLineHistory.length);
    }

    this.emit('STATE_CHANGED', { oldPhase: 'SETUP', newPhase: this.phase });
  }
}
