export type UnoColor = 'RED' | 'GREEN' | 'BLUE' | 'YELLOW';

export type UnoValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'SKIP'
  | 'REVERSE'
  | 'DRAW_TWO'
  | 'WILD'
  | 'WILD_DRAW_FOUR';

export interface UnoCard {
  id: string;
  color: UnoColor | 'WILD';
  value: UnoValue;
}

export interface UnoPlayer {
  id: string;
  name: string;
  avatar?: string;
  isBot: boolean;
  hand: UnoCard[];
  calledUno: boolean;
  score: number;
}

export interface ChallengeState {
  challengerId: string;
  targetId: string;
  card: UnoCard;
  chosenColor: UnoColor;
  prePlayColor: UnoColor;
}

export interface UnoGameState {
  deck: UnoCard[];
  discardPile: UnoCard[];
  activeColor: UnoColor;
  activeValue: UnoValue;
  currentTurnIdx: number;
  direction: 1 | -1;
  players: UnoPlayer[];
  status: 'SETUP' | 'PLAYING' | 'ROUND_OVER' | 'MATCH_OVER';
  winnerId: string | null;
  roundWinnerId: string | null;
  lastActionMessage: string | null;
  pendingChallenge: ChallengeState | null;
  matchTargetScore: number;
}
