import { SnakesGameState, SnakesPlayer } from '../types/snakes.types';
import { getSpecialSquare } from '../rules/snakesRules';

export class SnakesEngine {
  private state: SnakesGameState;
  private listeners: Array<(state: SnakesGameState) => void> = [];

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): SnakesGameState {
    return {
      players: [],
      currentTurnIdx: 0,
      lastDiceRoll: null,
      status: 'SETUP',
      winnerId: null,
      lastActionMessage: null,
      isRolling: false,
      consecutiveSixesCount: 0,
      extraTurnAwarded: false,
    };
  }

  public subscribe(listener: (state: SnakesGameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const copy = JSON.parse(JSON.stringify(this.state));
    this.listeners.forEach((l) => l(copy));
  }

  public getGameState(): SnakesGameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public startMatch(
    playersConfig: { id: string; name: string; avatar?: string; color?: string; isBot?: boolean }[]
  ): void {
    if (playersConfig.length < 2 || playersConfig.length > 8) {
      throw new Error('Snakes & Ladders requires between 2 and 8 players.');
    }

    const defaultColors = [
      '#DC2626', // Red
      '#2563EB', // Blue
      '#16A34A', // Green
      '#D97706', // Gold
      '#9333EA', // Purple
      '#EA580C', // Orange
      '#06B6D4', // Cyan
      '#EC4899', // Pink
    ];

    const players: SnakesPlayer[] = playersConfig.map((p, idx) => ({
      id: p.id,
      name: p.name,
      isBot: !!p.isBot,
      avatar: p.avatar || '🎮',
      color: p.color || defaultColors[idx % defaultColors.length],
      position: 1, // Start at square 1
    }));

    this.state = {
      ...this.createInitialState(),
      players,
      status: 'PLAYING',
      lastActionMessage: `Match started! ${players[0].name}'s turn to roll.`,
    };

    this.notify();
  }

  public rollDice(
    playerId: string,
    forcedRoll?: number
  ): { roll: number; landedSpecial: string | null } {
    const player = this.state.players[this.state.currentTurnIdx];
    if (!player || player.id !== playerId) {
      throw new Error('Not your turn.');
    }
    if (this.state.status !== 'PLAYING') {
      throw new Error('Match is not active.');
    }

    const roll =
      forcedRoll !== undefined
        ? forcedRoll
        : Math.floor(Math.random() * 6) + 1;
    this.state.lastDiceRoll = roll;

    let actionMsg = `${player.name} rolled a ${roll}!`;
    let landedSpecial: string | null = null;

    const newPos = player.position + roll;

    if (newPos > 100) {
      actionMsg += ` (Overshot 100, needs exact roll. Position stays at ${player.position}).`;
    } else {
      player.position = newPos;

      const special = getSpecialSquare(newPos);
      if (special) {
        if (special.type === 'LADDER') {
          player.position = special.to;
          landedSpecial = 'LADDER';
          actionMsg = `🪜 ${player.name} climbed a ladder! (${special.from} ➔ ${special.to})`;
        } else if (special.type === 'SNAKE') {
          player.position = special.to;
          landedSpecial = 'SNAKE';
          actionMsg = `🐍 ${player.name} slid down a snake! (${special.from} ➔ ${special.to})`;
        }
      }

      if (player.position === 100) {
        this.state.winnerId = player.id;
        this.state.status = 'FINISHED';
        this.state.consecutiveSixesCount = 0;
        this.state.extraTurnAwarded = false;
        actionMsg += ` 🏆 REACHED 100 AND WON THE MATCH!`;
        this.state.lastActionMessage = actionMsg;
        this.notify();
        return { roll, landedSpecial };
      }
    }

    // Handle extra roll on 6 and consecutive sixes rule
    if (roll === 6) {
      this.state.consecutiveSixesCount += 1;
      if (this.state.consecutiveSixesCount >= 3) {
        actionMsg += ` ⚠️ Rolled 3 consecutive sixes! Turn forfeited.`;
        this.state.consecutiveSixesCount = 0;
        this.state.extraTurnAwarded = false;
        this.advanceTurn();
      } else {
        actionMsg += ` 🎲 Rolled a 6! Extra turn awarded.`;
        this.state.extraTurnAwarded = true;
        // Turn does not advance
      }
    } else {
      this.state.consecutiveSixesCount = 0;
      this.state.extraTurnAwarded = false;
      this.advanceTurn();
    }

    this.state.lastActionMessage = actionMsg;
    this.notify();

    return { roll, landedSpecial };
  }

  private advanceTurn(): void {
    const count = this.state.players.length;
    this.state.currentTurnIdx = (this.state.currentTurnIdx + 1) % count;
  }
}
