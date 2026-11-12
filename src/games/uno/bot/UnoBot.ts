import { UnoEngine } from '../engine/UnoEngine';
import { UnoCard, UnoColor } from '../types/uno.types';
import { isCardPlayable } from '../rules/unoRules';

export type BotDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export class UnoBot {
  private engine: UnoEngine;
  private botPlayerId: string;
  private difficulty: BotDifficulty;
  private timeoutId: any = null;

  constructor(engine: UnoEngine, botPlayerId: string, difficulty: BotDifficulty = 'NORMAL') {
    this.engine = engine;
    this.botPlayerId = botPlayerId;
    this.difficulty = difficulty;
  }

  public activate(): () => void {
    const unsub = this.engine.subscribe((state) => {
      if (state.status !== 'PLAYING') return;

      // Handle pending challenge if this bot is the challenger
      if (
        state.pendingChallenge &&
        state.pendingChallenge.challengerId === this.botPlayerId &&
        !this.timeoutId
      ) {
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          this.respondToChallenge();
        }, 900);
        return;
      }

      const currPlayer = state.players[state.currentTurnIdx];
      if (currPlayer && currPlayer.id === this.botPlayerId && !this.timeoutId) {
        const delay =
          this.difficulty === 'EASY' ? 1200 : this.difficulty === 'NORMAL' ? 950 : 750;

        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          this.executeTurn();
        }, delay);
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

  public respondToChallenge(): void {
    const state = this.engine.getGameState();
    if (!state.pendingChallenge || state.pendingChallenge.challengerId !== this.botPlayerId) return;

    // Challenge probability based on difficulty
    const challengeChance =
      this.difficulty === 'HARD' ? 0.65 : this.difficulty === 'NORMAL' ? 0.4 : 0.2;
    const doChallenge = Math.random() < challengeChance;

    try {
      this.engine.challengeWildDrawFour(this.botPlayerId, doChallenge);
    } catch (e) {
      // Challenge catch
    }
  }

  public executeTurn(): void {
    const state = this.engine.getGameState();
    const currPlayer = state.players[state.currentTurnIdx];
    if (!currPlayer || currPlayer.id !== this.botPlayerId) return;

    const me = state.players.find((p) => p.id === this.botPlayerId);
    if (!me) return;

    // Check catch UNO on opponents
    state.players.forEach((p) => {
      if (p.id !== me.id && p.hand.length === 1 && !p.calledUno) {
        try {
          this.engine.catchUno(p.id);
        } catch (e) {}
      }
    });

    // Call UNO if 2 cards before playing
    if (me.hand.length === 2 && !me.calledUno) {
      if (this.difficulty !== 'EASY' || Math.random() > 0.35) {
        try {
          this.engine.callUno(me.id);
        } catch (e) {}
      }
    }

    const playable = me.hand.filter((c) =>
      isCardPlayable(c, state.activeColor, state.activeValue)
    );

    if (playable.length === 0) {
      // Must draw
      try {
        const { drawnCard, playable: isDrawnPlayable } = this.engine.drawCard(me.id);
        if (isDrawnPlayable) {
          const chosenColor =
            drawnCard.color === 'WILD' ? this.chooseBestColor(me.hand) : undefined;
          this.engine.playCard(me.id, drawnCard.id, chosenColor);
        } else {
          this.engine.passTurn(me.id);
        }
      } catch (e) {}
      return;
    }

    // Select card to play
    let chosenCard: UnoCard;

    if (this.difficulty === 'EASY') {
      chosenCard = playable[Math.floor(Math.random() * playable.length)];
    } else {
      // Prioritize Action cards (SKIP, REVERSE, DRAW_TWO, WILD_DRAW_FOUR)
      const actionCard = playable.find(
        (c) =>
          c.value === 'DRAW_TWO' ||
          c.value === 'WILD_DRAW_FOUR' ||
          c.value === 'SKIP' ||
          c.value === 'REVERSE'
      );
      chosenCard = actionCard || playable[0];
    }

    const chosenColor =
      chosenCard.color === 'WILD' ? this.chooseBestColor(me.hand) : undefined;

    try {
      this.engine.playCard(me.id, chosenCard.id, chosenColor);
    } catch (e) {}
  }

  private chooseBestColor(hand: UnoCard[]): UnoColor {
    const counts: Record<UnoColor, number> = { RED: 0, GREEN: 0, BLUE: 0, YELLOW: 0 };
    hand.forEach((c) => {
      if (c.color !== 'WILD') {
        counts[c.color]++;
      }
    });

    let bestColor: UnoColor = 'RED';
    let max = -1;
    (Object.keys(counts) as UnoColor[]).forEach((col) => {
      if (counts[col] > max) {
        max = counts[col];
        bestColor = col;
      }
    });

    return bestColor;
  }
}
