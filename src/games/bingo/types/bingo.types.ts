export type BingoLetter = 'B' | 'I' | 'N' | 'G' | 'O';

export type PatternStage = 'B' | 'I' | 'N' | 'G' | 'O';

export interface CellPosition {
  row: number; // 0 to 4
  col: number; // 0 to 4
}

export interface CompletedBingoLine {
  key: string; // e.g., 'row-0', 'col-2', 'diag-main', 'diag-anti'
  type: BingoLetter | string; // 'B' | 'I' | 'N' | 'G' | 'O' for 1st..5th completed lines
  direction: 'horizontal' | 'vertical' | 'mainDiagonal' | 'antiDiagonal';
  index?: number;
  cells: CellPosition[];
  sequenceNumber: number; // 1-indexed (1 for B, 2 for I, 3 for N, 4 for G, 5 for O)
}

export interface BoardCell {
  row: number;
  col: number;
  number: number | null; // 1 to 25 or null during manual entry
  isMarked: boolean;
  markedTimestamp?: number;
}

export type BingoBoardGrid = (number | null)[][]; // 5x5 array of numbers

export type GamePhase =
  | 'SETUP'
  | 'BOARD_LOCKED'
  | 'PLAYING_B'
  | 'PLAYING_I'
  | 'PLAYING_N'
  | 'PLAYING_G'
  | 'PLAYING_O'
  | 'BINGO_CLAIMED'
  | 'MATCH_FINISHED';

export interface BingoProgress {
  B: boolean;
  I: boolean;
  N: boolean;
  G: boolean;
  O: boolean;
  completedLinesCount: number;
}

export type BingoEventType =
  | 'NUMBER_CALLED'
  | 'PLAYER_MARKED'
  | 'LINE_COMPLETED'
  | 'B_PATTERN_COMPLETED'
  | 'I_PATTERN_COMPLETED'
  | 'N_PATTERN_COMPLETED'
  | 'G_PATTERN_COMPLETED'
  | 'O_PATTERN_COMPLETED'
  | 'BINGO_CLAIMED'
  | 'MATCH_FINISHED'
  | 'MATCH_RESTARTED'
  | 'REACTION_SENT'
  | 'STATE_CHANGED'
  | 'INVALID_CLAIM';

export interface BingoEvent {
  type: BingoEventType;
  timestamp: number;
  data?: any;
}

export type BingoEventListener = (event: BingoEvent) => void;

// --- Phase 3 Multiplayer Events ---

export type MultiplayerEventType =
  | 'ROOM_CREATED'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'PLAYER_READY'
  | 'BOARD_CONFIRMED'
  | 'ALL_PLAYERS_READY'
  | 'STATE_CHANGED'
  | 'MATCH_CREATED'
  | 'MATCH_STARTED'
  | 'FIRST_CALLER_SELECTED'
  | 'TURN_CHANGED'
  | 'BOT_CALLING_STARTED'
  | 'NUMBER_CALLED'
  | 'PLAYER_MARKED'
  | 'LINE_COMPLETED'
  | 'B_PATTERN_COMPLETED'
  | 'I_PATTERN_COMPLETED'
  | 'N_PATTERN_COMPLETED'
  | 'G_PATTERN_COMPLETED'
  | 'O_PATTERN_COMPLETED'
  | 'BINGO_CLAIMED'
  | 'MATCH_FINISHED'
  | 'PLAYER_REACTION_SENT'
  | 'MATCH_RESTARTED'
  | 'ROOM_CLOSED'
  | 'INVALID_CLAIM';

export interface MultiplayerEvent<T = any> {
  eventId: string;
  eventType: MultiplayerEventType;
  roomId: string;
  matchId?: string;
  playerId: string;
  timestamp: number;
  payload: T;
}

export type MultiplayerEventListener = (event: MultiplayerEvent) => void;

export interface ValidationResult {
  isValid: boolean;
  message: string;
  B?: boolean;
  I?: boolean;
  N?: boolean;
  G?: boolean;
  O?: boolean;
  completedLinesCount?: number;
  completedLines?: CompletedBingoLine[];
  failedReason?:
    | 'UNCALLED_NUMBER_MARKED'
    | 'PATTERN_NOT_COMPLETE'
    | 'INVALID_BOARD'
    | 'SEQUENCE_NOT_MET'
    | 'INVALID_MARK';
}
