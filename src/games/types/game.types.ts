export type GameStatus = 'AVAILABLE' | 'COMING_SOON' | 'LOCKED';

export type GameMode =
  | 'MULTIPLAYER'
  | 'SINGLE_PLAYER'
  | 'SINGLE_PLAYER_BOT'
  | 'ONLINE_MULTIPLAYER';

export type GameCategory =
  | 'CARD'
  | 'BOARD'
  | 'CLASSIC'
  | 'BRAIN'
  | 'WORD'
  | 'LOGIC'
  | 'MATH'
  | 'MEMORY'
  | 'PUZZLE'
  | 'BINGO';

export interface GameCapabilities {
  supportsLocalMultiplayer: boolean;
  supportsRemoteMultiplayer: boolean;
  supportsVoice: boolean;
  supportsReactions: boolean;
  supportsScoreboard: boolean;
  supportsReplay: boolean;
}

export interface GameDefinition {
  id: string;
  name: string;
  title: string;
  shortTitle?: string;
  subtitle?: string;
  description: string;
  category: GameCategory;
  mode: GameMode;
  icon: string;
  emoji?: string;
  banner?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  status: GameStatus;
  minPlayers: number;
  maxPlayers: number;
  supportsBots: boolean;
  supportsOnline: boolean;
  supportsOffline: boolean;
  supportsHints?: boolean;
  supportsLearningMode?: boolean;
  estimatedTime?: string;
  estimatedDuration?: string;
  nostalgiaText?: string;
  capabilities: GameCapabilities;
  gameType: string;
}

export interface GameSession {
  sessionId: string;
  roomId: string;
  gameId: string;
  matchId?: string;
  status: 'CREATED' | 'ACTIVE' | 'FINISHED';
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface GameEngine {
  getState(): unknown;
  start(): void;
  reset(): void;
}
