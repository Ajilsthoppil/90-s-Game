import {
  LudoColor,
  LudoGameState,
  LudoPlayer,
  LudoToken,
} from '../types/ludo.types';
import {
  ActiveCardEvent,
  AdventureCardDefinition,
} from '../types/ludoAdventure.types';
import { getAbsoluteTrackPosition, isSafeCell } from '../rules/ludoRules';
import {
  isTreasureTile,
  isEventTile,
} from '../rules/ludoAdventureRules';
import { TREASURE_CARD_LIST } from '../data/treasureCards';
import { SPECIAL_EVENT_CARD_LIST } from '../data/specialEventCards';
import { CaptureHistory } from './CaptureHistory';
import { TemporaryEffectManager } from './TemporaryEffectManager';
import {
  CardEffectResolver,
  CardResolveParams,
  CardResolveResult,
} from './CardEffectResolver';

const COLORS: LudoColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

export class LudoEngine {
  private state: LudoGameState;
  private listeners: Array<(state: LudoGameState) => void> = [];
  private captureHistory: CaptureHistory = new CaptureHistory();
  private tempEffects: TemporaryEffectManager = new TemporaryEffectManager();
  private isAdventureMode: boolean = true;
  private pendingExtraRoll: boolean = false;

  constructor(isAdventureMode: boolean = true) {
    this.isAdventureMode = isAdventureMode;
    this.state = this.createInitialState();
  }

  private createInitialState(): LudoGameState {
    return {
      players: [],
      currentTurnIdx: 0,
      lastDiceRoll: null,
      consecutiveSixes: 0,
      status: 'SETUP',
      winnerId: null,
      winnerColor: null,
      lastActionMessage: null,
      mustSelectToken: false,
      activeCardEvent: null,
      activeShields: [],
      wantedTargets: [],
      isAdventureMode: this.isAdventureMode,
      rollNonce: 0,
    };
  }

  public subscribe(listener: (state: LudoGameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.syncAdventureState();
    const copy = JSON.parse(JSON.stringify(this.state));
    this.listeners.forEach((l) => l(copy));
  }

  private syncAdventureState(): void {
    this.state.activeShields = this.tempEffects.getActiveShieldTokenIds();
    this.state.wantedTargets = this.tempEffects.getAllWantedTargets().map((w) => ({
      hunterPlayerId: w.hunterPlayerId,
      targetTokenId: w.targetTokenId,
      targetPlayerColor: w.targetPlayerColor,
    }));
    this.state.isAdventureMode = this.isAdventureMode;
  }

  public getGameState(): LudoGameState {
    this.syncAdventureState();
    return JSON.parse(JSON.stringify(this.state));
  }

  public getCaptureHistory(): CaptureHistory {
    return this.captureHistory;
  }

  public getTemporaryEffectManager(): TemporaryEffectManager {
    return this.tempEffects;
  }

  public setAdventureMode(enabled: boolean): void {
    this.isAdventureMode = enabled;
    this.state.isAdventureMode = enabled;
    this.notify();
  }

  public startMatch(
    playersConfig: { id: string; name: string; color?: LudoColor; isBot?: boolean; avatar?: string; characterId?: string }[]
  ): void {
    if (playersConfig.length !== 4) {
      throw new Error('Ludo requires exactly 4 players (Humans + Bots).');
    }

    this.captureHistory.clear();
    this.tempEffects.clear();
    this.pendingExtraRoll = false;

    // Anime Pirate Adventure avatars
    const defaultAvatars = this.isAdventureMode
      ? ['👒', '⚔️', '🍳', '🌸']
      : ['🔴', '🟢', '🟡', '🔵'];

    const players: LudoPlayer[] = playersConfig.map((p, idx) => {
      const color = p.color || COLORS[idx];
      const tokens: LudoToken[] = [1, 2, 3, 4].map((tNum) => ({
        id: `${color}_${tNum}`,
        playerColor: color,
        position: 0, // Yard
      }));

      return {
        id: p.id,
        name: p.name,
        color,
        isBot: !!p.isBot,
        avatar: p.avatar || defaultAvatars[idx],
        tokens,
        finishedTokensCount: 0,
        characterId: p.characterId,
      };
    });

    this.state = {
      ...this.createInitialState(),
      players,
      status: 'PLAYING',
      lastActionMessage: this.isAdventureMode
        ? `🏴‍☠️ Anime Adventure Ludo started! Captain ${players[0].name} sets sail!`
        : `Ludo match started! ${players[0].name} (${players[0].color}) turn.`,
    };

    this.notify();
  }

  public rollDice(playerId: string, forcedRoll?: number): { roll: number; playableTokens: string[] } {
    const player = this.state.players[this.state.currentTurnIdx];
    if (player.id !== playerId) throw new Error('Not your turn.');
    if (this.state.mustSelectToken) throw new Error('Must select token to move first.');
    if (this.state.activeCardEvent) throw new Error('Must resolve active event card first.');

    const roll =
      forcedRoll !== undefined && forcedRoll >= 1 && forcedRoll <= 6
        ? forcedRoll
        : Math.floor(Math.random() * 6) + 1;
    this.state.lastDiceRoll = roll;
    this.state.rollNonce = (this.state.rollNonce || 0) + 1;

    if (roll === 6) {
      this.state.consecutiveSixes += 1;
    } else {
      this.state.consecutiveSixes = 0;
    }

    // 3 consecutive 6s rule -> forfeit turn
    if (this.state.consecutiveSixes === 3) {
      this.state.consecutiveSixes = 0;
      this.state.lastActionMessage = `⚠️ 3 consecutive 6s! ${player.name} forfeits turn.`;
      this.advanceTurn();
      this.notify();
      return { roll, playableTokens: [] };
    }

    const playable = this.getPlayableTokensForRoll(player, roll);

    if (playable.length === 0) {
      this.state.lastActionMessage = `${player.name} rolled ${roll} (No legal moves).`;
      this.advanceTurn();
      this.notify();
      return { roll, playableTokens: [] };
    }

    this.state.mustSelectToken = true;
    this.state.lastActionMessage = `${player.name} rolled ${roll}! Select token to move.`;
    this.notify();
    return { roll, playableTokens: playable.map((t) => t.id) };
  }

  public getPlayableTokenIds(playerId?: string): string[] {
    const player = playerId
      ? this.state.players.find((p) => p.id === playerId)
      : this.state.players[this.state.currentTurnIdx];
    if (!player || !this.state.lastDiceRoll) return [];
    return this.getPlayableTokensForRoll(player, this.state.lastDiceRoll).map((t) => t.id);
  }

  public moveToken(playerId: string, tokenId: string, forcedCardDraw?: AdventureCardDefinition): void {
    const player = this.state.players[this.state.currentTurnIdx];
    if (player.id !== playerId) throw new Error('Not your turn.');
    if (!this.state.mustSelectToken || !this.state.lastDiceRoll) {
      throw new Error('Must roll dice before moving.');
    }
    if (this.state.activeCardEvent) {
      throw new Error('Must resolve active event card first.');
    }

    const token = player.tokens.find((t) => t.id === tokenId);
    if (!token) throw new Error('Token not found.');

    const roll = this.state.lastDiceRoll;
    let grantExtraRoll = roll === 6;

    let actionMsg = `${player.name} moved token ${token.id}`;

    if (token.position === 0) {
      if (roll !== 6) throw new Error('Must roll 6 to leave yard.');
      token.position = 1; // Enter start square
      actionMsg = `🎉 ${player.name} entered token into play!`;
    } else {
      const newPos = token.position + roll;
      if (newPos > 58) throw new Error('Overshot home entrance.');

      token.position = newPos;

      if (token.position === 58) {
        player.finishedTokensCount += 1;
        grantExtraRoll = true; // Award extra roll for reaching Home
        actionMsg = `🏠 ${player.name}'s token reached HOME! (${player.finishedTokensCount}/4)`;

        if (player.finishedTokensCount === 4) {
          this.state.winnerId = player.id;
          this.state.winnerColor = player.color;
          this.state.status = 'FINISHED';
          actionMsg = `🏆 ${player.name} (${player.color}) GOT ALL 4 TOKENS HOME AND WON LUDO!`;
          this.state.lastActionMessage = actionMsg;
          this.notify();
          return;
        }
      } else if (newPos <= 51) {
        // Check capture on shared track
        const absPos = getAbsoluteTrackPosition(player.color, newPos);
        if (absPos && !isSafeCell(absPos)) {
          // Check opponent tokens on same absolute track position
          this.state.players.forEach((opp) => {
            if (opp.id !== player.id) {
              opp.tokens.forEach((oppToken) => {
                if (oppToken.position >= 1 && oppToken.position <= 51) {
                  const oppAbs = getAbsoluteTrackPosition(opp.color, oppToken.position);
                  if (oppAbs === absPos) {
                    // Check if opponent token is protected by Pirate Shield
                    if (this.tempEffects.consumeShield(oppToken.id)) {
                      actionMsg = `🛡️ ${opp.name}'s Pirate Shield absorbed the attack!`;
                    } else {
                      // Normal capture
                      oppToken.position = 0; // Send back to Yard
                      grantExtraRoll = true;
                      this.captureHistory.recordCapture(
                        player.id,
                        player.color,
                        opp.id,
                        opp.color,
                        oppToken.id
                      );

                      // Check Wanted bounty
                      const wasWanted = this.tempEffects.checkAndClaimWanted(player.id, oppToken.id);
                      if (wasWanted) {
                        actionMsg = `⚔️ ${player.name} CAPTURED WANTED PIRATE ${opp.name}! (Bounty Claimed!)`;
                      } else {
                        actionMsg = `⚔️ ${player.name} captured ${opp.name}'s token!`;
                      }
                    }
                  }
                }
              });
            }
          });
        }

        // Check Treasure or Special Event tile landing (if Adventure Mode is on)
        if (this.isAdventureMode && absPos) {
          if (isTreasureTile(absPos)) {
            const card = forcedCardDraw || this.drawRandomCard('TREASURE');
            this.state.activeCardEvent = {
              card,
              cardType: 'TREASURE',
              playerId: player.id,
              playerColor: player.color,
              triggeringTokenId: token.id,
              eligibleTargets: this.getEligibleTargetsForCard(player, card),
              resolved: false,
            };
            this.pendingExtraRoll = grantExtraRoll;
            this.state.mustSelectToken = false;
            this.state.lastDiceRoll = null;
            this.state.lastActionMessage = `🎁 ${player.name} landed on a Treasure Tile! Opened "${card.title}"!`;
            this.notify();
            return;
          } else if (isEventTile(absPos)) {
            const card = forcedCardDraw || this.drawRandomCard('SPECIAL_EVENT');
            this.state.activeCardEvent = {
              card,
              cardType: 'SPECIAL_EVENT',
              playerId: player.id,
              playerColor: player.color,
              triggeringTokenId: token.id,
              eligibleTargets: this.getEligibleTargetsForCard(player, card),
              resolved: false,
            };
            this.pendingExtraRoll = grantExtraRoll;
            this.state.mustSelectToken = false;
            this.state.lastDiceRoll = null;
            this.state.lastActionMessage = `⚡ ${player.name} landed on a Special Event Tile! Triggered "${card.title}"!`;
            this.notify();
            return;
          }
        }
      }
    }

    this.state.mustSelectToken = false;
    this.state.lastDiceRoll = null;

    if (!grantExtraRoll) {
      this.state.consecutiveSixes = 0;
      this.advanceTurn();
    } else {
      actionMsg += ' (Bonus Roll Awarded!)';
    }

    this.state.lastActionMessage = actionMsg;
    this.notify();
  }

  /**
   * Resolves the currently active card event
   */
  public resolveActiveCard(params: CardResolveParams = {}): CardResolveResult {
    if (!this.state.activeCardEvent) {
      return { success: false, message: 'No active card to resolve.' };
    }

    const event = this.state.activeCardEvent;
    const result = CardEffectResolver.resolve(
      this.state,
      event,
      params,
      this.captureHistory,
      this.tempEffects
    );

    if (!result.success) {
      return result;
    }

    const grantExtraRoll = this.pendingExtraRoll || !!result.extraRollAwarded;
    this.pendingExtraRoll = false;

    // Check if redrawn card
    if (result.redrawnCard) {
      event.card = result.redrawnCard;
      event.cardType = result.redrawnCard.cardType;
    }

    event.resolved = true;
    event.resultMessage = result.message;

    this.state.lastActionMessage = result.message;
    if (grantExtraRoll) {
      this.state.lastActionMessage += ' (Bonus Roll Awarded!)';
    }

    // Dismiss active card from state
    this.state.activeCardEvent = null;

    // If game ended from card movement (e.g. token reached 58 and was 4th token)
    const player = this.state.players.find((p) => p.id === event.playerId);
    if (player && player.finishedTokensCount === 4) {
      this.state.winnerId = player.id;
      this.state.winnerColor = player.color;
      this.state.status = 'FINISHED';
      this.state.lastActionMessage = `🏆 ${player.name} (${player.color}) WON THE ANIME PIRATE GRAND PRIX!`;
      this.notify();
      return result;
    }

    if (!grantExtraRoll) {
      this.state.consecutiveSixes = 0;
      this.advanceTurn();
    }

    this.notify();
    return result;
  }

  /**
   * Dismisses an active card (e.g. after viewing comic prank or animation)
   */
  public dismissActiveCard(): void {
    if (!this.state.activeCardEvent) return;
    this.resolveActiveCard();
  }

  public drawRandomCard(type: 'TREASURE' | 'SPECIAL_EVENT'): AdventureCardDefinition {
    const deck = type === 'TREASURE' ? TREASURE_CARD_LIST : SPECIAL_EVENT_CARD_LIST;
    const idx = Math.floor(Math.random() * deck.length);
    return deck[idx];
  }

  private getEligibleTargetsForCard(
    player: LudoPlayer,
    card: AdventureCardDefinition
  ): ActiveCardEvent['eligibleTargets'] {
    const ownTokenIds = player.tokens
      .filter((t) => t.position >= 1 && t.position <= 51)
      .map((t) => t.id);

    const opponentTokenIds: string[] = [];
    this.state.players.forEach((opp) => {
      if (opp.id !== player.id) {
        opp.tokens.forEach((t) => {
          if (t.position >= 1 && t.position <= 51) {
            opponentTokenIds.push(t.id);
          }
        });
      }
    });

    const captors = this.captureHistory.getCaptorsOfPlayer(player.id);
    const revengeOpponents = captors.map((c) => {
      const opp = this.state.players.find((p) => p.id === c.playerId);
      const tokenIds = (opp?.tokens || [])
        .filter((t) => {
          if (t.position < 1 || t.position > 51) return false;
          const abs = getAbsoluteTrackPosition(c.color, t.position);
          return abs && !isSafeCell(abs) && !this.tempEffects.hasShield(t.id);
        })
        .map((t) => t.id);
      return {
        playerId: c.playerId,
        color: c.color,
        tokenIds,
      };
    });

    return {
      ownTokenIds,
      opponentTokenIds,
      revengeOpponents,
    };
  }

  private getPlayableTokensForRoll(player: LudoPlayer, roll: number): LudoToken[] {
    return player.tokens.filter((t) => {
      if (t.position === 58) return false; // Already Home
      if (t.position === 0) return roll === 6; // Requires 6 to leave yard
      return t.position + roll <= 58; // Exact roll validation
    });
  }

  private advanceTurn(): void {
    const prevPlayer = this.state.players[this.state.currentTurnIdx];
    if (prevPlayer) {
      this.tempEffects.onTurnEnded(prevPlayer.id);
    }
    this.state.currentTurnIdx = (this.state.currentTurnIdx + 1) % 4;
  }
}
