import { LudoEngine } from '../engine/LudoEngine';
import { LudoColor, LudoGameState } from '../types/ludo.types';
import { getAbsoluteTrackPosition, isSafeCell } from '../rules/ludoRules';

export class LudoBot {
  private engine: LudoEngine;
  private botPlayerId: string;
  private timeoutId: any = null;

  private unsubscribe: (() => void) | null = null;

  constructor(engine: LudoEngine, botPlayerId: string) {
    this.engine = engine;
    this.botPlayerId = botPlayerId;
  }

  public activate(): () => void {
    this.deactivate();
    this.unsubscribe = this.engine.subscribe((state) => {
      this.handleStateUpdate(state);
    });

    // Check immediate current state upon activation in case match is already waiting on this bot
    const currentState = this.engine.getGameState();
    this.handleStateUpdate(currentState);

    return () => this.deactivate();
  }

  public deactivate(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private handleStateUpdate(state: LudoGameState): void {
    if (state.status !== 'PLAYING') {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      return;
    }

    const currPlayer = state.players[state.currentTurnIdx];
    if (!currPlayer || currPlayer.id !== this.botPlayerId) {
      // Not this bot's turn - clear any lingering action
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      return;
    }

    // It is this bot's turn! If an action is already scheduled, let it run
    if (this.timeoutId) return;

    // Case 1: If an active card event is awaiting this bot's choice
    if (state.activeCardEvent && state.activeCardEvent.playerId === this.botPlayerId) {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        this.resolveBotCard();
      }, 1100);
      return;
    }

    // Case 2: Must select token (e.g. after a roll)
    if (state.mustSelectToken) {
      const playable = this.engine.getPlayableTokenIds(this.botPlayerId);
      if (playable.length > 0) {
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          this.selectAndMoveToken(playable);
        }, 850);
      }
      return;
    }

    // Case 3: Need to roll dice - wait 950ms decision delay
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      this.executeTurn();
    }, 950);
  }

  public executeTurn(): void {
    const state = this.engine.getGameState();
    const currPlayer = state.players[state.currentTurnIdx];
    if (!currPlayer || currPlayer.id !== this.botPlayerId) return;

    if (state.activeCardEvent && state.activeCardEvent.playerId === this.botPlayerId) {
      this.resolveBotCard();
      return;
    }

    if (!state.mustSelectToken) {
      try {
        const { playableTokens } = this.engine.rollDice(this.botPlayerId);
        if (playableTokens.length > 0) {
          // Allow full 500ms dice rotation animation and 350ms reading pause before moving
          this.timeoutId = setTimeout(() => {
            this.timeoutId = null;
            this.selectAndMoveToken(playableTokens);
          }, 850);
        }
      } catch (e) {
        console.warn(`[LudoBot ${this.botPlayerId}] Roll error:`, e);
      }
    } else {
      const playable = this.engine.getPlayableTokenIds(this.botPlayerId);
      if (playable.length > 0) {
        this.selectAndMoveToken(playable);
      }
    }
  }

  private resolveBotCard(): void {
    const state = this.engine.getGameState();
    const event = state.activeCardEvent;
    if (!event || event.playerId !== this.botPlayerId) return;

    const me = state.players.find((p) => p.id === this.botPlayerId);
    if (!me) return;

    try {
      const cardId = event.card.id;

      if (cardId === 'EVENT_REVENGE') {
        const revengeOpps = event.eligibleTargets?.revengeOpponents || [];
        for (const opp of revengeOpps) {
          if (opp.tokenIds.length > 0) {
            this.engine.resolveActiveCard({
              opponentId: opp.playerId,
              opponentTokenId: opp.tokenIds[0],
            });
            return;
          }
        }
        this.engine.resolveActiveCard();
      } else if (cardId === 'EVENT_BODY_SWAP') {
        const ownTokens = me.tokens.filter((t) => t.position >= 1 && t.position <= 51);
        // Find token furthest behind
        ownTokens.sort((a, b) => a.position - b.position);
        const ownToken = ownTokens[0];

        // Find opponent token furthest ahead
        const oppTokenIds = event.eligibleTargets?.opponentTokenIds || [];
        this.engine.resolveActiveCard({
          ownTokenId: ownToken?.id,
          opponentTokenId: oppTokenIds[0],
        });
      } else if (cardId === 'EVENT_WANTED') {
        const oppTokenIds = event.eligibleTargets?.opponentTokenIds || [];
        this.engine.resolveActiveCard({
          opponentTokenId: oppTokenIds[0],
        });
      } else if (cardId === 'TREASURE_PIRATE_SHIELD') {
        const ownTokens = me.tokens.filter((t) => t.position >= 1 && t.position <= 51);
        ownTokens.sort((a, b) => b.position - a.position);
        this.engine.resolveActiveCard({
          ownTokenId: ownTokens[0]?.id,
        });
      } else if (
        cardId === 'TREASURE_PIRATE_DASH' ||
        cardId === 'EVENT_CAPTAINS_ORDER' ||
        cardId === 'TREASURE_SAFE_ESCAPE' ||
        cardId === 'EVENT_ESCAPE_ARTIST'
      ) {
        const ownTokens = me.tokens.filter((t) => t.position >= 1 && t.position <= 51);
        ownTokens.sort((a, b) => b.position - a.position);
        this.engine.resolveActiveCard({
          ownTokenId: ownTokens[0]?.id,
        });
      } else {
        this.engine.resolveActiveCard();
      }
    } catch (e) {
      this.engine.dismissActiveCard();
    }
  }

  private selectAndMoveToken(playableTokenIds: string[]): void {
    const state = this.engine.getGameState();
    const me = state.players.find((p) => p.id === this.botPlayerId);
    if (!me || !state.lastDiceRoll) return;

    const roll = state.lastDiceRoll;

    // AI Heuristics:
    // 1. Reaching home (58) -> 100
    // 2. Capturing an opponent -> 95
    // 3. Leaving yard on 6 -> 80
    // 4. Moving into safe cell -> 60
    // 5. Landing on Treasure / Event tile -> 70
    // 6. Advance furthest token -> 10 + pos
    let bestTokenId = playableTokenIds[0];
    let bestScore = -1;

    for (const tokenId of playableTokenIds) {
      const token = me.tokens.find((t) => t.id === tokenId);
      if (!token) continue;

      let score = 0;
      if (token.position === 0 && roll === 6) {
        score = 80;
      } else {
        const newPos = token.position + roll;
        if (newPos === 58) {
          score = 100;
        } else if (newPos <= 51) {
          const abs = getAbsoluteTrackPosition(me.color, newPos);
          if (abs) {
            if (isSafeCell(abs)) {
              score = 60;
            } else {
              const canCapture = state.players.some(
                (opp) =>
                  opp.id !== me.id &&
                  opp.tokens.some((ot) => {
                    if (ot.position >= 1 && ot.position <= 51) {
                      return getAbsoluteTrackPosition(opp.color, ot.position) === abs;
                    }
                    return false;
                  })
              );
              if (canCapture) score = 95;
            }
          }
        }
        if (score === 0) {
          score = 10 + token.position;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestTokenId = tokenId;
      }
    }

    try {
      this.engine.moveToken(this.botPlayerId, bestTokenId);
    } catch (e) {
      // Move catch
    }
  }
}
