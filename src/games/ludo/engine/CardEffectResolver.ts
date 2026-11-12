import { LudoGameState, LudoPlayer, LudoToken } from '../types/ludo.types';
import {
  ActiveCardEvent,
  AdventureCardDefinition,
} from '../types/ludoAdventure.types';
import {
  findNextSafeZone,
  absoluteToRelative,
} from '../rules/ludoAdventureRules';
import {
  getAbsoluteTrackPosition,
  isSafeCell,
} from '../rules/ludoRules';
import { CaptureHistory } from './CaptureHistory';
import { TemporaryEffectManager } from './TemporaryEffectManager';
import { TREASURE_CARDS, TREASURE_CARD_LIST } from '../data/treasureCards';
import { SPECIAL_EVENT_CARDS, SPECIAL_EVENT_CARD_LIST } from '../data/specialEventCards';

export interface CardResolveParams {
  ownTokenId?: string;
  opponentId?: string;
  opponentTokenId?: string;
}

export interface CardResolveResult {
  success: boolean;
  message: string;
  extraRollAwarded?: boolean;
  redrawnCard?: AdventureCardDefinition;
}

export class CardEffectResolver {
  public static resolve(
    state: LudoGameState,
    activeCardEvent: ActiveCardEvent,
    params: CardResolveParams,
    captureHistory: CaptureHistory,
    tempEffects: TemporaryEffectManager
  ): CardResolveResult {
    const player = state.players.find((p) => p.id === activeCardEvent.playerId);
    if (!player) {
      return { success: false, message: 'Active player not found.' };
    }

    const cardId = activeCardEvent.card.id;

    switch (cardId) {
      // ----------------------------------------------------
      // TREASURE 01 — SAFE ESCAPE
      // ----------------------------------------------------
      case 'TREASURE_SAFE_ESCAPE': {
        const tokenId = params.ownTokenId || activeCardEvent.triggeringTokenId;
        const token = player.tokens.find((t) => t.id === tokenId);
        if (!token || token.position <= 0 || token.position > 51) {
          return { success: false, message: 'Invalid token selected for Safe Escape.' };
        }

        const nextSafeRel = findNextSafeZone(player.color, token.position);
        if (nextSafeRel !== null) {
          token.position = nextSafeRel;
          return {
            success: true,
            message: `🗺️ SAFE ESCAPE! ${player.name}'s token sailed to Safe Zone!`,
          };
        }

        // Fallback: Token is already past the last safe zone (near home corridor)
        // Advance 2 spaces if within bounds, else redraw
        if (token.position + 2 <= 58) {
          token.position += 2;
          if (token.position === 58) {
            player.finishedTokensCount += 1;
            return {
              success: true,
              extraRollAwarded: true,
              message: `🗺️ SAFE ESCAPE (Fallback): Advanced 2 spaces into HOME!`,
            };
          }
          return {
            success: true,
            message: `🗺️ SAFE ESCAPE (Fallback): Advanced 2 spaces ahead!`,
          };
        }

        // Redraw fallback
        const redrawn = TREASURE_CARDS.TREASURE_LUCKY_DICE;
        return {
          success: true,
          extraRollAwarded: true,
          redrawnCard: redrawn,
          message: `🗺️ No safe harbor ahead! Converted to LUCKY DICE (+1 Roll)!`,
        };
      }

      // ----------------------------------------------------
      // TREASURE 02 — PIRATE DASH
      // ----------------------------------------------------
      case 'TREASURE_PIRATE_DASH': {
        const tokenId = params.ownTokenId || activeCardEvent.triggeringTokenId;
        const token = player.tokens.find((t) => t.id === tokenId);
        if (!token || token.position <= 0 || token.position + 3 > 58) {
          // Look for any other token that can move 3
          const altToken = player.tokens.find((t) => t.position > 0 && t.position + 3 <= 58);
          if (!altToken) {
            return {
              success: true,
              extraRollAwarded: true,
              redrawnCard: TREASURE_CARDS.TREASURE_LUCKY_DICE,
              message: `⛵ PIRATE DASH: No legal +3 move available. Redrawn as Lucky Dice!`,
            };
          }
        }

        const targetToken = (token && token.position > 0 && token.position + 3 <= 58)
          ? token
          : player.tokens.find((t) => t.position > 0 && t.position + 3 <= 58)!;

        targetToken.position += 3;
        let extraRoll = false;
        let msg = `⛵ PIRATE DASH! ${player.name} moved token ${targetToken.id} forward 3 spaces.`;

        if (targetToken.position === 58) {
          player.finishedTokensCount += 1;
          extraRoll = true;
          msg = `🏠 PIRATE DASH: ${player.name}'s token reached HOME!`;
        } else if (targetToken.position <= 51) {
          const captureMsg = this.checkCapture(state, player, targetToken, captureHistory, tempEffects);
          if (captureMsg) {
            msg += ` ${captureMsg}`;
            extraRoll = true;
          }
        }

        return {
          success: true,
          extraRollAwarded: extraRoll,
          message: msg,
        };
      }

      // ----------------------------------------------------
      // TREASURE 03 — PIRATE SHIELD
      // ----------------------------------------------------
      case 'TREASURE_PIRATE_SHIELD': {
        const tokenId = params.ownTokenId || activeCardEvent.triggeringTokenId;
        const token = player.tokens.find((t) => t.id === tokenId);
        const validToken = (token && token.position >= 1 && token.position <= 51)
          ? token
          : player.tokens.find((t) => t.position >= 1 && t.position <= 51);

        if (!validToken) {
          return {
            success: true,
            extraRollAwarded: true,
            redrawnCard: TREASURE_CARDS.TREASURE_LUCKY_DICE,
            message: `🛡️ PIRATE SHIELD: No active token to shield. Converted to Lucky Dice!`,
          };
        }

        tempEffects.addShield(validToken.id, player.color);
        return {
          success: true,
          message: `🛡️ PIRATE SHIELD! ${player.name} equipped token ${validToken.id} with an Iron Skull Shield!`,
        };
      }

      // ----------------------------------------------------
      // TREASURE 04 — LUCKY DICE
      // ----------------------------------------------------
      case 'TREASURE_LUCKY_DICE': {
        return {
          success: true,
          extraRollAwarded: true,
          message: `🎲 LUCKY DICE! ${player.name} gained a bonus dice roll!`,
        };
      }

      // ----------------------------------------------------
      // EVENT 01 — REVENGE
      // ----------------------------------------------------
      case 'EVENT_REVENGE': {
        const captors = captureHistory.getCaptorsOfPlayer(player.id);
        if (captors.length === 0) {
          // Fallback: No one has captured player yet -> fallback to Escape Artist or Prank
          return {
            success: true,
            redrawnCard: SPECIAL_EVENT_CARDS.EVENT_SECOND_CHANCE,
            extraRollAwarded: true,
            message: `⚡ REVENGE: No rival has captured you yet! Converted to Second Chance (+1 Roll)!`,
          };
        }

        let targetOpponentId = params.opponentId;
        let targetOpponentTokenId = params.opponentTokenId;

        // Auto-select if not provided
        if (!targetOpponentId || !targetOpponentTokenId) {
          for (const captor of captors) {
            const oppPlayer = state.players.find((p) => p.id === captor.playerId);
            if (oppPlayer) {
              const capturable = oppPlayer.tokens.find((t) => {
                if (t.position < 1 || t.position > 51) return false;
                const abs = getAbsoluteTrackPosition(oppPlayer.color, t.position);
                return abs && !isSafeCell(abs);
              });
              if (capturable) {
                targetOpponentId = oppPlayer.id;
                targetOpponentTokenId = capturable.id;
                break;
              }
            }
          }
        }

        if (!targetOpponentId || !targetOpponentTokenId) {
          return {
            success: true,
            redrawnCard: SPECIAL_EVENT_CARDS.EVENT_SECOND_CHANCE,
            extraRollAwarded: true,
            message: `⚡ REVENGE: Your captors have no vulnerable tokens on the track! Converted to Second Chance!`,
          };
        }

        const targetOppPlayer = state.players.find((p) => p.id === targetOpponentId);
        const targetOppToken = targetOppPlayer?.tokens.find((t) => t.id === targetOpponentTokenId);

        if (!targetOppPlayer || !targetOppToken) {
          return { success: false, message: 'Target opponent or token not found.' };
        }

        // Validate safe zone & home protection
        if (targetOppToken.position === 0 || targetOppToken.position > 51) {
          return { success: false, message: 'Cannot target tokens in Yard or Home.' };
        }

        const abs = getAbsoluteTrackPosition(targetOppPlayer.color, targetOppToken.position);
        if (abs && isSafeCell(abs)) {
          return { success: false, message: 'Cannot target tokens on a Safe Zone!' };
        }

        // Check if opponent token is shielded
        if (tempEffects.consumeShield(targetOppToken.id)) {
          return {
            success: true,
            message: `⚡ REVENGE blocked! ${targetOppPlayer.name}'s Pirate Shield absorbed the strike!`,
          };
        }

        // Execute Revenge: Send back to Yard
        targetOppToken.position = 0;
        return {
          success: true,
          message: `⚡ REVENGE! ${player.name} struck back and sent ${targetOppPlayer.name}'s token to Yard!`,
        };
      }

      // ----------------------------------------------------
      // EVENT 02 — BODY SWAP
      // ----------------------------------------------------
      case 'EVENT_BODY_SWAP': {
        const ownTokenId = params.ownTokenId || activeCardEvent.triggeringTokenId;
        let ownToken = player.tokens.find((t) => t.id === ownTokenId && t.position >= 1 && t.position <= 51);
        if (!ownToken) {
          ownToken = player.tokens.find((t) => t.position >= 1 && t.position <= 51);
        }

        // Find candidate opponent token
        let targetOppToken: LudoToken | undefined;
        let targetOppPlayer: LudoPlayer | undefined;

        if (params.opponentTokenId) {
          for (const opp of state.players) {
            if (opp.id !== player.id) {
              const found = opp.tokens.find((t) => t.id === params.opponentTokenId && t.position >= 1 && t.position <= 51);
              if (found) {
                targetOppToken = found;
                targetOppPlayer = opp;
                break;
              }
            }
          }
        }

        if (!targetOppToken) {
          // Auto-pick opponent token on track furthest ahead
          for (const opp of state.players) {
            if (opp.id !== player.id) {
              for (const ot of opp.tokens) {
                if (ot.position >= 1 && ot.position <= 51) {
                  if (!targetOppToken || ot.position > targetOppToken.position) {
                    targetOppToken = ot;
                    targetOppPlayer = opp;
                  }
                }
              }
            }
          }
        }

        if (!ownToken || !targetOppToken || !targetOppPlayer) {
          return {
            success: true,
            redrawnCard: SPECIAL_EVENT_CARDS.EVENT_CAPTAINS_ORDER,
            message: `🌀 BODY SWAP: No valid swap pair on track. Converted to Captain's Order!`,
          };
        }

        // Calculate absolute coordinates
        const abs1 = getAbsoluteTrackPosition(player.color, ownToken.position);
        const abs2 = getAbsoluteTrackPosition(targetOppPlayer.color, targetOppToken.position);

        if (!abs1 || !abs2) {
          return { success: false, message: 'Invalid track positions for swap.' };
        }

        // Swap relative positions
        const newOwnRel = absoluteToRelative(player.color, abs2);
        const newOppRel = absoluteToRelative(targetOppPlayer.color, abs1);

        ownToken.position = newOwnRel;
        targetOppToken.position = newOppRel;

        return {
          success: true,
          message: `🌀 BODY SWAP! ${player.name} swapped places with ${targetOppPlayer.name}!`,
        };
      }

      // ----------------------------------------------------
      // EVENT 03 — ESCAPE ARTIST
      // ----------------------------------------------------
      case 'EVENT_ESCAPE_ARTIST': {
        const tokenId = params.ownTokenId || activeCardEvent.triggeringTokenId;
        const token = player.tokens.find((t) => t.id === tokenId && t.position >= 1 && t.position <= 51)
          || player.tokens.find((t) => t.position >= 1 && t.position <= 51);

        if (!token) {
          return {
            success: true,
            extraRollAwarded: true,
            redrawnCard: SPECIAL_EVENT_CARDS.EVENT_SECOND_CHANCE,
            message: `🏃 ESCAPE ARTIST: No active token on track. Converted to Second Chance!`,
          };
        }

        const nextSafe = findNextSafeZone(player.color, token.position);
        if (nextSafe !== null) {
          token.position = nextSafe;
          return {
            success: true,
            message: `🏃 ESCAPE ARTIST! ${player.name}'s token slipped past danger into Safe Zone!`,
          };
        }

        // Fallback: move 2 spaces if possible
        if (token.position + 2 <= 58) {
          token.position += 2;
          return {
            success: true,
            message: `🏃 ESCAPE ARTIST (Fallback): Sprinted 2 spaces ahead!`,
          };
        }

        return {
          success: true,
          extraRollAwarded: true,
          redrawnCard: SPECIAL_EVENT_CARDS.EVENT_SECOND_CHANCE,
          message: `🏃 ESCAPE ARTIST: Converted to Second Chance (+1 Roll)!`,
        };
      }

      // ----------------------------------------------------
      // EVENT 04 — WANTED!
      // ----------------------------------------------------
      case 'EVENT_WANTED': {
        let oppToken: LudoToken | undefined;
        let oppPlayer: LudoPlayer | undefined;

        if (params.opponentTokenId) {
          for (const opp of state.players) {
            if (opp.id !== player.id) {
              const found = opp.tokens.find((t) => t.id === params.opponentTokenId && t.position >= 1 && t.position <= 51);
              if (found) {
                oppToken = found;
                oppPlayer = opp;
                break;
              }
            }
          }
        }

        if (!oppToken) {
          // Auto-pick opponent token closest ahead or on track
          for (const opp of state.players) {
            if (opp.id !== player.id) {
              const cand = opp.tokens.find((t) => t.position >= 1 && t.position <= 51);
              if (cand) {
                oppToken = cand;
                oppPlayer = opp;
                break;
              }
            }
          }
        }

        if (!oppToken || !oppPlayer) {
          return {
            success: true,
            extraRollAwarded: true,
            redrawnCard: SPECIAL_EVENT_CARDS.EVENT_SECOND_CHANCE,
            message: `📜 WANTED: No opponent on the track. Converted to Second Chance (+1 Roll)!`,
          };
        }

        tempEffects.setWantedTarget(player.id, oppToken.id, oppPlayer.color, state.currentTurnIdx);
        return {
          success: true,
          message: `📜 WANTED! 100M Bounty placed on ${oppPlayer.name}'s token ${oppToken.id}!`,
        };
      }

      // ----------------------------------------------------
      // EVENT 05 — PIRATE PRANK
      // ----------------------------------------------------
      case 'EVENT_PIRATE_PRANK': {
        return {
          success: true,
          message: `🎭 PIRATE PRANK! The crew is laughing at the upside-down map!`,
        };
      }

      // ----------------------------------------------------
      // EVENT 06 — CREW CHAOS
      // ----------------------------------------------------
      case 'EVENT_CREW_CHAOS': {
        return {
          success: true,
          message: `🐒 CREW CHAOS! The ship monkey threw coconut shells across the deck!`,
        };
      }

      // ----------------------------------------------------
      // EVENT 07 — CAPTAIN'S ORDER
      // ----------------------------------------------------
      case 'EVENT_CAPTAINS_ORDER': {
        const tokenId = params.ownTokenId || activeCardEvent.triggeringTokenId;
        let token = player.tokens.find((t) => t.id === tokenId && t.position > 0 && t.position + 2 <= 58);
        if (!token) {
          token = player.tokens.find((t) => t.position > 0 && t.position + 2 <= 58);
        }

        if (!token) {
          return {
            success: true,
            extraRollAwarded: true,
            redrawnCard: SPECIAL_EVENT_CARDS.EVENT_SECOND_CHANCE,
            message: `🏴‍☠️ CAPTAIN'S ORDER: No legal +2 move. Converted to Second Chance!`,
          };
        }

        token.position += 2;
        let extraRoll = false;
        let msg = `🏴‍☠️ CAPTAIN'S ORDER! ${player.name} moved token ${token.id} forward 2 spaces.`;

        if (token.position === 58) {
          player.finishedTokensCount += 1;
          extraRoll = true;
          msg = `🏠 CAPTAIN'S ORDER: ${player.name}'s token reached HOME!`;
        } else if (token.position <= 51) {
          const capMsg = this.checkCapture(state, player, token, captureHistory, tempEffects);
          if (capMsg) {
            msg += ` ${capMsg}`;
            extraRoll = true;
          }
        }

        return {
          success: true,
          extraRollAwarded: extraRoll,
          message: msg,
        };
      }

      // ----------------------------------------------------
      // EVENT 08 — SECOND CHANCE
      // ----------------------------------------------------
      case 'EVENT_SECOND_CHANCE': {
        return {
          success: true,
          extraRollAwarded: true,
          message: `✨ SECOND CHANCE! Sea spirits grant ${player.name} a bonus roll!`,
        };
      }

      default:
        return { success: false, message: `Unknown card type ${cardId}` };
    }
  }

  /**
   * Helper to perform standard capture resolution with shield handling & capture recording
   */
  private static checkCapture(
    state: LudoGameState,
    player: LudoPlayer,
    token: LudoToken,
    captureHistory: CaptureHistory,
    tempEffects: TemporaryEffectManager
  ): string | null {
    const absPos = getAbsoluteTrackPosition(player.color, token.position);
    if (!absPos || isSafeCell(absPos)) return null;

    for (const opp of state.players) {
      if (opp.id === player.id) continue;

      for (const oppToken of opp.tokens) {
        if (oppToken.position >= 1 && oppToken.position <= 51) {
          const oppAbs = getAbsoluteTrackPosition(opp.color, oppToken.position);
          if (oppAbs === absPos) {
            // Check shield
            if (tempEffects.consumeShield(oppToken.id)) {
              return `🛡️ ${opp.name}'s Pirate Shield absorbed the attack!`;
            }

            // Normal capture
            oppToken.position = 0;
            captureHistory.recordCapture(player.id, player.color, opp.id, opp.color, oppToken.id);

            // Check Wanted bounty
            const wasWanted = tempEffects.checkAndClaimWanted(player.id, oppToken.id);
            if (wasWanted) {
              return `⚔️ ${player.name} CAPTURED WANTED PIRATE ${opp.name}! (Bounty Claimed!)`;
            }

            return `⚔️ ${player.name} captured ${opp.name}'s token!`;
          }
        }
      }
    }

    return null;
  }
}
