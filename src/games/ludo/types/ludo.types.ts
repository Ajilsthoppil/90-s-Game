export type LudoColor = 'RED' | 'GREEN' | 'YELLOW' | 'BLUE';

export interface LudoToken {
  id: string; // e.g. 'RED_1'
  playerColor: LudoColor;
  position: number; // 0 = In Yard, 1..52 = Shared Track, 53..57 = Home Corridor, 58 = Home
}

export interface LudoPlayer {
  id: string;
  name: string;
  color: LudoColor;
  isBot: boolean;
  avatar: string;
  tokens: LudoToken[];
  finishedTokensCount: number;
  characterId?: string;
}

export interface LudoGameState {
  players: LudoPlayer[];
  currentTurnIdx: number;
  lastDiceRoll: number | null;
  consecutiveSixes: number;
  status: 'SETUP' | 'PLAYING' | 'FINISHED';
  winnerId: string | null;
  winnerColor: LudoColor | null;
  lastActionMessage: string | null;
  mustSelectToken: boolean;
  activeCardEvent?: import('./ludoAdventure.types').ActiveCardEvent | null;
  activeShields?: string[];
  wantedTargets?: { hunterPlayerId: string; targetTokenId: string; targetPlayerColor: LudoColor }[];
  isAdventureMode?: boolean;
  rollNonce?: number;
}
