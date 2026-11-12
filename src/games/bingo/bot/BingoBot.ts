import { BingoEngine } from '../engine/BingoEngine';
import { generateRandomBoardGrid } from '../rules/bingoRules';
import { BotPersonality } from './botTypes';
import { multiplayerEventBus } from '../events/MultiplayerEventBus';
import { BingoBoardGrid } from '../types/bingo.types';

export class BingoBot {
  public readonly personality: BotPersonality;
  public readonly engine: BingoEngine;
  private pendingTimer: NodeJS.Timeout | null = null;
  private isDestroyed: boolean = false;

  constructor(personality: BotPersonality, initialGrid?: BingoBoardGrid) {
    this.personality = personality;
    const grid = initialGrid || generateRandomBoardGrid();
    this.engine = new BingoEngine(grid);
    this.engine.confirmBoard();
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }

  public resetMatch(keepBoard: boolean = false): void {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
    this.engine.startNewMatch(keepBoard);
    if (!keepBoard) {
      this.engine.generateRandomBoard();
    }
    this.engine.confirmBoard();
  }

  /**
   * Processes a called number broadcast from the host caller.
   * Uses realistic delay based on difficulty.
   */
  public handleNumberCalled(
    num: number,
    onClaimBingo?: (botId: string) => void
  ): void {
    if (this.isDestroyed) return;

    // Check if number exists on bot's private board and is un-marked
    const botGrid = this.engine.getGrid();
    let hasNum = false;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (botGrid[r][c] === num) {
          hasNum = true;
          break;
        }
      }
    }

    if (!hasNum) return; // Number not on bot's board

    const delayMs =
      this.personality.difficulty === 'EASY'
        ? 800
        : this.personality.difficulty === 'NORMAL'
        ? 500
        : 250;

    this.pendingTimer = setTimeout(() => {
      if (this.isDestroyed) return;

      // Inject called number into bot's engine state cleanly
      const called = this.engine.getCalledNumbers();
      if (!called.includes(num)) {
        (this.engine as any).calledNumbers.push(num);
        (this.engine as any).currentCalledNumber = num;
      }

      // Perform legal mark via BingoEngine
      const markRes = this.engine.markNumber(num);
      if (markRes.success) {
        // Evaluate if Bingo sequence (5 unique completed lines) is complete
        const prog = this.engine.getProgress();

        if (prog.O || this.engine.getCompletedLinesCount() >= 5) {
          const claim = this.engine.validateBingo();
          if (claim.isValid && onClaimBingo) {
            onClaimBingo(this.personality.id);
            multiplayerEventBus.createAndPublish(
              'PLAYER_REACTION_SENT',
              'room',
              this.personality.id,
              { reaction: 'BINGO! 😎' }
            );
          }
        }
      }
    }, delayMs);
  }
}
