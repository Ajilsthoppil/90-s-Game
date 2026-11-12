export type Phase10Color = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';

export type Phase10Value =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | 'WILD'
  | 'SKIP';

export interface Phase10Card {
  id: string;
  color: Phase10Color | 'WILD';
  value: Phase10Value;
}

export interface LaidPhaseGroup {
  type: 'SET' | 'RUN' | 'COLOR_SET';
  cards: Phase10Card[];
}

export interface Phase10Player {
  id: string;
  name: string;
  avatar?: string;
  isBot: boolean;
  hand: Phase10Card[];
  currentPhase: number; // 1 to 10
  hasLaidPhaseThisRound: boolean;
  laidPhaseGroups: LaidPhaseGroup[];
  totalScore: number;
  isSkipped: boolean;
}

export interface Phase10GameState {
  deck: Phase10Card[];
  discardPile: Phase10Card[];
  currentTurnIdx: number;
  players: Phase10Player[];
  status: 'SETUP' | 'PLAYING' | 'ROUND_OVER' | 'MATCH_OVER';
  roundNumber: number;
  winnerId: string | null;
  roundWinnerId: string | null;
  lastActionMessage: string | null;
  hasDrawnThisTurn: boolean;
}

