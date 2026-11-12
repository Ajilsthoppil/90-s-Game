export type BrainDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export type BrainGameId =
  | 'circuit_connect'
  | 'tile_connect'
  | 'word_fill'
  | 'word_puzzle'
  | 'word_connect'
  | 'sudoku'
  | 'memory_match'
  | 'pattern_complete'
  | 'number_puzzles'
  | 'sliding_puzzle'
  | 'maze'
  | 'visual_diff';

export type BrainSessionStatus = 'READY' | 'PLAYING' | 'PAUSED' | 'COMPLETED' | 'FAILED';

export interface BrainGameSession {
  gameId: BrainGameId;
  puzzleId: string;
  difficulty: BrainDifficulty;
  startedAt: number;
  elapsedTime: number;
  score: number;
  moves: number;
  hintsUsed: number;
  mistakes: number;
  status: BrainSessionStatus;
}

export interface BrainGameState extends BrainGameSession {
  timeSeconds: number;
  hintsRemaining: number;
  isCompleted: boolean;
  isLearningMode: boolean;
  customData: any;
}
