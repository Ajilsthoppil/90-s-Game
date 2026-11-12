import { BingoVariant, PlayMode } from '../types';

export const CURRENT_CLIENT_VERSION = '1.0.0';
export const CURRENT_PROTOCOL_VERSION = '1';

export type SecurityErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'FORBIDDEN_HOST_ONLY'
  | 'NOT_YOUR_TURN'
  | 'UNCALLED_NUMBER'
  | 'INVALID_MARK'
  | 'INVALID_BINGO'
  | 'MATCH_FINISHED'
  | 'BOARD_LOCKED_IMMUTABLE'
  | 'RATE_LIMITED'
  | 'DUPLICATE_EVENT_ID'
  | 'INCOMPATIBLE_PROTOCOL'
  | 'ROOM_FULL'
  | 'ROOM_NOT_FOUND'
  | 'INVALID_PAYLOAD';

export interface SecurityErrorResponse {
  success: false;
  errorCode: SecurityErrorCode;
  message: string;
  timestamp: number;
}

export type ActionType =
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'SET_READY'
  | 'CONFIRM_BOARD'
  | 'START_MATCH'
  | 'CALL_NUMBER'
  | 'MARK_NUMBER'
  | 'CLAIM_BINGO'
  | 'REVENGE_ROUND'
  | 'PLAY_AGAIN'
  | 'SEND_REACTION'
  | 'REPORT_ISSUE';

export interface ActionEnvelope<T = any> {
  eventId: string; // Idempotency UUID
  actionType: ActionType;
  roomId: string;
  matchId?: string;
  playerId: string;
  timestamp: number;
  clientVersion: string;
  protocolVersion: string;
  payload: T;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerId: string;
  playerName: string;
  nickname?: string;
  avatar?: string;
}

export interface CallNumberPayload {
  numberToCall?: number;
}

export interface MarkNumberPayload {
  number: number;
}

export interface ClaimBingoPayload {
  claimedAt: number;
}

export interface StartMatchPayload {
  variant?: BingoVariant;
  playMode?: PlayMode;
}

export interface ConfirmBoardPayload {
  grid: (number | null)[][];
}

export interface SendReactionPayload {
  reaction: string;
}

export interface ActionValidationResult<T = any> {
  isValid: boolean;
  errorCode?: SecurityErrorCode;
  message: string;
  sanitizedPayload?: T;
}

/**
 * Pydantic / OpenAPI Backend Contract Specification
 * Reference models for FastAPI backend integration
 */
export const FASTAPI_BACKEND_CONTRACT = {
  authEndpoint: '/api/v1/auth/token',
  wsEndpoint: '/ws/v1/room/{room_code}',
  rateLimits: {
    joinAttemptsPerMinute: 10,
    callsPerSecond: 1,
    marksPerSecond: 5,
    bingoClaimsPerMatch: 3,
    reactionsPerMinute: 15,
  },
  maxWebSocketMessageSizeBytes: 16384, // 16 KB
  maxRoomCapacity: 4,
};
