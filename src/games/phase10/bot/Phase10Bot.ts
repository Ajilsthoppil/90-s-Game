import { Phase10Engine } from '../engine/Phase10Engine';
import { Phase10Card } from '../types/phase10.types';
import { findValidPhaseGrouping } from '../rules/phase10Rules';

export class Phase10Bot {
  private engine: Phase10Engine;
  private botPlayerId: string;
  private timeoutId: any = null;

  constructor(engine: Phase10Engine, botPlayerId: string) {
    this.engine = engine;
    this.botPlayerId = botPlayerId;
  }

  public activate(): () => void {
    return this.engine.subscribe((state) => {
      if (state.status !== 'PLAYING') return;

      const currPlayer = state.players[state.currentTurnIdx];
      if (currPlayer.id === this.botPlayerId && !this.timeoutId) {
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          this.executeTurn();
        }, 800);
      }
    });
  }

  public executeTurn(): void {
    const state = this.engine.getGameState();
    const me = state.players.find((p) => p.id === this.botPlayerId);
    if (!me || state.players[state.currentTurnIdx].id !== this.botPlayerId) return;

    // Step 1: Draw (from draw pile)
    this.engine.drawCard(me.id, false);

    const updatedState = this.engine.getGameState();
    const updatedMe = updatedState.players.find((p) => p.id === this.botPlayerId)!;

    // Step 2: Try to lay down phase if not already laid down
    if (!updatedMe.hasLaidPhaseThisRound) {
      const group = findValidPhaseGrouping(updatedMe.currentPhase, updatedMe.hand);
      if (group) {
        try {
          this.engine.layDownPhase(me.id, group);
        } catch (e) {
          // Fallback if invalid
        }
      }
    }

    // Step 3: Try to hit on existing phases if already laid down
    const afterLayState = this.engine.getGameState();
    const afterLayMe = afterLayState.players.find((p) => p.id === this.botPlayerId)!;
    if (afterLayMe.hasLaidPhaseThisRound && afterLayMe.hand.length > 1) {
      for (const card of [...afterLayMe.hand]) {
        const currentMe = this.engine.getGameState().players.find((p) => p.id === this.botPlayerId);
        if (!currentMe || currentMe.hand.length <= 1) break; // Preserve at least 1 card to discard
        let hitSuccess = false;
        for (const p of this.engine.getGameState().players) {
          for (let gIdx = 0; gIdx < p.laidPhaseGroups.length; gIdx++) {
            try {
              this.engine.hitPhase(me.id, p.id, gIdx, card.id);
              hitSuccess = true;
              break;
            } catch (e) {
              // Not a valid hit
            }
          }
          if (hitSuccess) break;
        }
      }
    }

    // Step 4: Discard card with highest point value
    const latestMe = this.engine.getGameState().players.find((p) => p.id === this.botPlayerId)!;
    if (latestMe.hand.length > 0) {
      let highestCard = latestMe.hand[0];
      latestMe.hand.forEach((c) => {
        if (c.value === 'SKIP' || c.value === 'WILD') {
          highestCard = c;
        }
      });

      const skipTarget = highestCard.value === 'SKIP'
        ? latestStateOpponent(this.engine.getGameState(), me.id)
        : undefined;

      this.engine.discardCard(me.id, highestCard.id, skipTarget);
    }
  }
}


function latestStateOpponent(state: any, myId: string): string | undefined {
  const opp = state.players.find((p: any) => p.id !== myId);
  return opp ? opp.id : undefined;
}
