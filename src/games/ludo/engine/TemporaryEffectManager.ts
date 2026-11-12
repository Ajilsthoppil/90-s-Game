import { LudoColor } from '../types/ludo.types';
import { ActiveShield, WantedTarget } from '../types/ludoAdventure.types';

export class TemporaryEffectManager {
  private shields: Map<string, ActiveShield> = new Map(); // key = tokenId
  private wantedTargets: Map<string, WantedTarget> = new Map(); // key = hunterPlayerId

  public addShield(tokenId: string, playerColor: LudoColor): void {
    this.shields.set(tokenId, {
      tokenId,
      playerColor,
      assignedAt: Date.now(),
    });
  }

  public hasShield(tokenId: string): boolean {
    return this.shields.has(tokenId);
  }

  /**
   * Consumes the shield if present and returns true, or false if not shielded
   */
  public consumeShield(tokenId: string): boolean {
    if (this.shields.has(tokenId)) {
      this.shields.delete(tokenId);
      return true;
    }
    return false;
  }

  public getActiveShieldTokenIds(): string[] {
    return Array.from(this.shields.keys());
  }

  public setWantedTarget(
    hunterPlayerId: string,
    targetTokenId: string,
    targetPlayerColor: LudoColor,
    validForTurnIndex?: number
  ): void {
    this.wantedTargets.set(hunterPlayerId, {
      hunterPlayerId,
      targetTokenId,
      targetPlayerColor,
      validForTurnIndex,
      turnsRemaining: 1, // Active for the hunter's next opportunity
    });
  }

  public getWantedTargetForHunter(hunterPlayerId: string): WantedTarget | undefined {
    return this.wantedTargets.get(hunterPlayerId);
  }

  public getAllWantedTargets(): WantedTarget[] {
    return Array.from(this.wantedTargets.values());
  }

  /**
   * Checks if capturing this token fulfills a Wanted bounty for hunterPlayerId.
   * If fulfilled, deletes the bounty and returns true.
   */
  public checkAndClaimWanted(hunterPlayerId: string, capturedTokenId: string): boolean {
    const bounty = this.wantedTargets.get(hunterPlayerId);
    if (bounty && bounty.targetTokenId === capturedTokenId) {
      this.wantedTargets.delete(hunterPlayerId);
      return true;
    }
    return false;
  }

  /**
   * Called when a hunter's turn ends. If they had a Wanted bounty active, decrement or expire.
   */
  public onTurnEnded(playerId: string): void {
    const bounty = this.wantedTargets.get(playerId);
    if (bounty) {
      if (bounty.turnsRemaining <= 0) {
        this.wantedTargets.delete(playerId);
      } else {
        bounty.turnsRemaining -= 1;
      }
    }
  }

  public clear(): void {
    this.shields.clear();
    this.wantedTargets.clear();
  }
}
