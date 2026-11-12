export interface PlayerProfile {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  createdAt: number;
}

export type MarkingStyle = 'pencil' | 'pen';

export interface GameSettings {
  voiceEnabled: boolean;
  soundEffectsEnabled: boolean;
  voiceVolume: number; // 0.0 to 1.0
  markingStyle: MarkingStyle;
}

export type PlayerStatus = 'LOBBY' | 'READY' | 'PLAYING' | 'FINISHED' | 'LEFT';

export type BotDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface Player {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  isLocal: boolean;
  isBot?: boolean;
  botDifficulty?: BotDifficulty;
  status: PlayerStatus;
  isLocked?: boolean;
  wins: number;
  board?: (number | null)[][];
  markedNumbers?: number[];
  bingoPhase?: string;
  progress?: {
    B: boolean;
    I: boolean;
    N: boolean;
    G: boolean;
    O: boolean;
    completedLinesCount: number;
  };
}

export type RoomStatus = 'LOBBY' | 'BOARD_SETUP' | 'PLAYING' | 'FINISHED';

export type PlayMode = 'FRIENDS' | 'SYSTEM';

export type BingoVariant = 'CLASSIC_1_25' | 'BINGO_1_50';

export interface GameRoom {
  id: string; // e.g. "90S-7291"
  roomCode: string; // "90S-7291"
  hostPlayerId: string;
  currentMatchNumber: number;
  players: Player[];
  currentMatch: Match | null;
  matchHistory: MatchRecord[];
  scoreboard: Record<string, number>; // playerId or name -> win count
  status: RoomStatus;
  playMode?: PlayMode;
  variant?: BingoVariant;
  createdAt: number;
}

export type MatchStatus = 'CREATED' | 'BOARD_SETUP' | 'PLAYING' | 'FINISHED';

export interface Match {
  id: string;
  matchNumber: number;
  roomId: string;
  players: Player[];
  callerPlayerId: string;
  currentTurnPlayerId: string;
  turnOrder: string[];
  currentTurnIndex: number;
  calledNumbers: number[];
  lastCalledNumber: number | null;
  lastCallerPlayerId: string | null;
  status: MatchStatus;
  startedAt: number;
  finishedAt?: number;
  winnerId?: string | null;
  winnerName?: string | null;
  variant?: BingoVariant;
  maxNumber: number;
}

export interface MatchRecord {
  id: string;
  roomId: string;
  matchNumber: number;
  winnerName: string;
  winnerNickname?: string;
  totalCalls: number;
  completedAt: number;
  completedPatterns: string[];
}

export interface SavedBingoBoard {
  id: string;
  name: string;
  numbers: (number | null)[][];
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
}

export interface ActiveMatchState {
  roomId: string;
  matchNumber: number;
  grid: (number | null)[][];
  isLocked: boolean;
  phase: string;
  calledNumbers: number[];
  currentNumber: number | null;
  markedNumbers: number[];
  scoreboard: Record<string, number>;
  updatedAt: number;
}

export interface ActiveMultiplayerData {
  room: GameRoom;
  match: Match;
  playerBoards: Record<string, (number | null)[][]>;
  playerMarks: Record<string, number[]>;
}

export interface MatchResultSnapshot {
  matchId: string;
  roomId: string;
  matchNumber: number;
  winnerId: string;
  winnerName: string;
  winnerNickname?: string;
  winnerAvatar?: string;
  winningBoard: (number | null)[][];
  winningMarks: number[];
  calledNumbers: number[];
  winningProgress: {
    B: boolean;
    I: boolean;
    N: boolean;
    G: boolean;
    O: boolean;
    completedLinesCount: number;
  };
  completedPatterns: string[];
  finishedAt: number;
}

export interface GameDisputeReport {
  id: string;
  matchId: string;
  reportingPlayerId: string;
  reportingPlayerName: string;
  winnerId: string;
  winnerName: string;
  winnerBoardSnapshot: (number | null)[][];
  calledNumbers: number[];
  playerMarks: number[];
  reportReason: string;
  additionalNotes?: string;
  createdAt: number;
}

export interface GameRepository {
  getProfile(): Promise<PlayerProfile>;
  saveProfile(profile: PlayerProfile): Promise<void>;
  getSettings(): Promise<GameSettings>;
  saveSettings(settings: GameSettings): Promise<void>;
  getRoom(roomId: string): Promise<GameRoom | null>;
  saveRoom(room: GameRoom): Promise<void>;
  getRooms(): Promise<GameRoom[]>;
  deleteRoom(roomId: string): Promise<void>;
  getMatchHistory(): Promise<MatchRecord[]>;
  saveMatchHistory(match: MatchRecord): Promise<void>;
  getActiveMatchState(): Promise<ActiveMatchState | null>;
  saveActiveMatchState(state: ActiveMatchState | null): Promise<void>;
  getActiveMultiplayerMatch(): Promise<ActiveMultiplayerData | null>;
  saveActiveMultiplayerMatch(data: ActiveMultiplayerData | null): Promise<void>;
  getScoreboard(roomId: string): Promise<Record<string, number>>;
  saveScoreboard(roomId: string, scoreboard: Record<string, number>): Promise<void>;
  getSavedBoards(): Promise<SavedBingoBoard[]>;
  saveBoardTemplate(board: SavedBingoBoard): Promise<void>;
  deleteSavedBoard(boardId: string): Promise<void>;
  getRecentlyUsedBoards(): Promise<SavedBingoBoard[]>;
  addRecentlyUsedBoard(board: SavedBingoBoard): Promise<void>;
  saveMatchResultSnapshot(snapshot: MatchResultSnapshot): Promise<void>;
  getMatchResultSnapshot(matchId: string): Promise<MatchResultSnapshot | null>;
  saveDisputeReport(report: GameDisputeReport): Promise<void>;
  getDisputeReports(): Promise<GameDisputeReport[]>;
}
