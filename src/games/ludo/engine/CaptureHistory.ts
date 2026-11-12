import { LudoColor } from '../types/ludo.types';
import { CaptureRecord } from '../types/ludoAdventure.types';

export class CaptureHistory {
  private records: CaptureRecord[] = [];

  public recordCapture(
    capturingPlayerId: string,
    capturingColor: LudoColor,
    capturedPlayerId: string,
    capturedColor: LudoColor,
    capturedTokenId: string
  ): CaptureRecord {
    const record: CaptureRecord = {
      id: `cap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      capturingPlayerId,
      capturingColor,
      capturedPlayerId,
      capturedColor,
      capturedTokenId,
      timestamp: Date.now(),
    };
    this.records.push(record);
    return record;
  }

  /**
   * Returns list of unique opponent player IDs who have captured at least one of targetPlayerId's tokens
   */
  public getCaptorsOfPlayer(targetPlayerId: string): { playerId: string; color: LudoColor }[] {
    const captorsMap = new Map<string, LudoColor>();

    for (const record of this.records) {
      if (record.capturedPlayerId === targetPlayerId && record.capturingPlayerId !== targetPlayerId) {
        captorsMap.set(record.capturingPlayerId, record.capturingColor);
      }
    }

    return Array.from(captorsMap.entries()).map(([playerId, color]) => ({
      playerId,
      color,
    }));
  }

  public getAllRecords(): CaptureRecord[] {
    return [...this.records];
  }

  public clear(): void {
    this.records = [];
  }
}
