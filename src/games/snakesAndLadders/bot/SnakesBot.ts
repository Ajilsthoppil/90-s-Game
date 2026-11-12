import { SnakesEngine } from '../engine/SnakesEngine';

export class SnakesBot {
  private engine: SnakesEngine;
  private botPlayerId: string;
  private timeoutId: any = null;

  constructor(engine: SnakesEngine, botPlayerId: string) {
    this.engine = engine;
    this.botPlayerId = botPlayerId;
  }

  public activate(): () => void {
    const unsub = this.engine.subscribe((state) => {
      if (state.status !== 'PLAYING') return;

      const currPlayer = state.players[state.currentTurnIdx];
      if (currPlayer && currPlayer.id === this.botPlayerId && !this.timeoutId) {
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          this.executeTurn();
        }, 900);
      }
    });

    return () => {
      this.deactivate();
      unsub();
    };
  }

  public deactivate(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  public executeTurn(): void {
    const state = this.engine.getGameState();
    const currPlayer = state.players[state.currentTurnIdx];
    if (currPlayer && currPlayer.id === this.botPlayerId) {
      try {
        this.engine.rollDice(this.botPlayerId);
      } catch (e) {
        // Roll catch
      }
    }
  }
}
