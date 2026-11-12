export interface SnakesPlayer {
  id: string;
  name: string;
  isBot: boolean;
  avatar: string;
  color: string;
  position: number; // 1 to 100 (0 means off board start)
}

export interface BoardSpecialSquare {
  type: 'LADDER' | 'SNAKE';
  from: number;
  to: number;
}

export interface SnakesGameState {
  players: SnakesPlayer[];
  currentTurnIdx: number;
  lastDiceRoll: number | null;
  status: 'SETUP' | 'PLAYING' | 'FINISHED';
  winnerId: string | null;
  lastActionMessage: string | null;
  isRolling: boolean;
  consecutiveSixesCount: number;
  extraTurnAwarded: boolean;
}
