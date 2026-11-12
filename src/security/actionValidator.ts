import {
  ActionEnvelope,
  ActionValidationResult,
  CURRENT_PROTOCOL_VERSION,
} from './securityTypes';

export class ActionValidator {
  /**
   * Validates action envelope structure, payload types, boundaries, and protocol version.
   */
  public validateEnvelope<T = any>(envelope: ActionEnvelope<T>): ActionValidationResult<T> {
    if (!envelope || typeof envelope !== 'object') {
      return { isValid: false, errorCode: 'INVALID_PAYLOAD', message: 'Payload must be an object.' };
    }

    if (!envelope.eventId || typeof envelope.eventId !== 'string' || envelope.eventId.trim().length === 0) {
      return { isValid: false, errorCode: 'INVALID_PAYLOAD', message: 'Missing or invalid eventId.' };
    }

    if (!envelope.playerId || typeof envelope.playerId !== 'string' || envelope.playerId.trim().length === 0) {
      return { isValid: false, errorCode: 'UNAUTHORIZED', message: 'Missing or invalid playerId.' };
    }

    if (!envelope.roomId || typeof envelope.roomId !== 'string' || envelope.roomId.trim().length === 0) {
      return { isValid: false, errorCode: 'INVALID_PAYLOAD', message: 'Missing or invalid roomId.' };
    }

    if (envelope.protocolVersion !== CURRENT_PROTOCOL_VERSION) {
      return {
        isValid: false,
        errorCode: 'INCOMPATIBLE_PROTOCOL',
        message: `Protocol mismatch. Expected ${CURRENT_PROTOCOL_VERSION}, got ${envelope.protocolVersion}.`,
      };
    }

    return { isValid: true, message: 'Envelope valid.', sanitizedPayload: envelope.payload };
  }

  /**
   * Validates number calling action payload against variant pool (1..25 or 1..50).
   */
  public validateCallNumber(num: number | undefined | null, maxNumber: number = 25): ActionValidationResult<number> {
    if (num !== undefined && num !== null) {
      if (typeof num !== 'number' || !Number.isInteger(num) || num < 1 || num > maxNumber) {
        return {
          isValid: false,
          errorCode: 'INVALID_PAYLOAD',
          message: `Number ${num} is out of bounds for pool 1..${maxNumber}.`,
        };
      }
      return { isValid: true, message: 'Valid call number.', sanitizedPayload: num };
    }
    return { isValid: true, message: 'Random number call request.' };
  }

  /**
   * Validates number marking payload.
   */
  public validateMarkNumber(num: number, maxNumber: number = 25): ActionValidationResult<number> {
    if (typeof num !== 'number' || !Number.isInteger(num) || num < 1 || num > maxNumber) {
      return {
        isValid: false,
        errorCode: 'INVALID_PAYLOAD',
        message: `Number ${num} is invalid for marking.`,
      };
    }
    return { isValid: true, message: 'Valid mark number.', sanitizedPayload: num };
  }
}

export const actionValidator = new ActionValidator();
