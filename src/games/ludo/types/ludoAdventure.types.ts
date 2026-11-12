import { LudoColor } from './ludo.types';

export type TreasureCardId =
  | 'TREASURE_SAFE_ESCAPE'
  | 'TREASURE_PIRATE_DASH'
  | 'TREASURE_PIRATE_SHIELD'
  | 'TREASURE_LUCKY_DICE';

export type SpecialEventCardId =
  | 'EVENT_REVENGE'
  | 'EVENT_BODY_SWAP'
  | 'EVENT_ESCAPE_ARTIST'
  | 'EVENT_WANTED'
  | 'EVENT_PIRATE_PRANK'
  | 'EVENT_CREW_CHAOS'
  | 'EVENT_CAPTAINS_ORDER'
  | 'EVENT_SECOND_CHANCE';

export type AdventureCardType = 'TREASURE' | 'SPECIAL_EVENT';

export interface AdventureCardDefinition {
  id: TreasureCardId | SpecialEventCardId;
  cardType: AdventureCardType;
  title: string;
  subtitle: string;
  description: string;
  quote?: string;
  icon: string;
  badgeText: string;
  accentColor: string;
  requiresTarget: boolean;
  targetType?: 'OWN_TOKEN' | 'OPPONENT_TOKEN' | 'TOKEN_SWAP' | 'REVENGE_TARGET' | 'NONE';
}

export interface CaptureRecord {
  id: string;
  capturingPlayerId: string;
  capturingColor: LudoColor;
  capturedPlayerId: string;
  capturedColor: LudoColor;
  capturedTokenId: string;
  timestamp: number;
}

export interface ActiveShield {
  tokenId: string;
  playerColor: LudoColor;
  assignedAt: number;
}

export interface WantedTarget {
  hunterPlayerId: string;
  targetTokenId: string;
  targetPlayerColor: LudoColor;
  validForTurnIndex?: number;
  turnsRemaining: number;
}

export interface ActiveCardEvent {
  card: AdventureCardDefinition;
  cardType: AdventureCardType;
  playerId: string;
  playerColor: LudoColor;
  triggeringTokenId: string;
  eligibleTargets?: {
    ownTokenIds?: string[];
    opponentTokenIds?: string[];
    revengeOpponents?: { playerId: string; color: LudoColor; tokenIds: string[] }[];
  };
  resolved: boolean;
  resultMessage?: string;
}

export interface AdventureTileInfo {
  type: 'TREASURE' | 'SPECIAL_EVENT';
  name: string;
  icon: string;
}
