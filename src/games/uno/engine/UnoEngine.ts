import {
  ChallengeState,
  UnoCard,
  UnoColor,
  UnoGameState,
  UnoPlayer,
} from '../types/uno.types';
import {
  calculateHandScore,
  canLegallyPlayWildDrawFour,
  createUnoDeck,
  isCardPlayable,
  shuffleDeck,
} from '../rules/unoRules';

export class UnoEngine {
  private state: UnoGameState;
  private listeners: Array<(state: UnoGameState) => void> = [];

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): UnoGameState {
    return {
      deck: [],
      discardPile: [],
      activeColor: 'RED',
      activeValue: '0',
      currentTurnIdx: 0,
      direction: 1,
      players: [],
      status: 'SETUP',
      winnerId: null,
      roundWinnerId: null,
      lastActionMessage: null,
      pendingChallenge: null,
      matchTargetScore: 500,
    };
  }

  public subscribe(listener: (state: UnoGameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const copy = this.getGameState();
    this.listeners.forEach((l) => l(copy));
  }

  public getGameState(): UnoGameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public startMatch(
    playersConfig: { id: string; name: string; isBot?: boolean; avatar?: string }[]
  ): void {
    if (playersConfig.length < 2 || playersConfig.length > 8) {
      throw new Error('UNO requires between 2 and 8 players.');
    }

    const defaultAvatars = ['👤', '🤖', '🦊', '🐯', '🐼', '🦁', '🐨', '🦄'];

    const players: UnoPlayer[] = playersConfig.map((p, idx) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar || defaultAvatars[idx % defaultAvatars.length],
      isBot: !!p.isBot,
      hand: [],
      calledUno: false,
      score: 0,
    }));

    this.state = {
      ...this.createInitialState(),
      players,
      status: 'PLAYING',
    };

    this.startRound();
  }

  public startRound(): void {
    let fullDeck = this.state.players.length > 4
      ? shuffleDeck([...createUnoDeck(), ...createUnoDeck()])
      : shuffleDeck(createUnoDeck());

    // Deal 7 cards to each player
    const players = this.state.players.map((p) => {
      const hand = fullDeck.splice(0, 7);
      return {
        ...p,
        hand,
        calledUno: false,
      };
    });

    // Top card on discard pile (must not be WILD DRAW FOUR initially for smooth start)
    let topCard = fullDeck.pop()!;
    while (topCard.value === 'WILD_DRAW_FOUR') {
      fullDeck.unshift(topCard);
      fullDeck = shuffleDeck(fullDeck);
      topCard = fullDeck.pop()!;
    }

    const activeColor = topCard.color === 'WILD' ? 'RED' : topCard.color;

    this.state.deck = fullDeck;
    this.state.discardPile = [topCard];
    this.state.activeColor = activeColor;
    this.state.activeValue = topCard.value;
    this.state.players = players;
    this.state.status = 'PLAYING';
    this.state.roundWinnerId = null;
    this.state.pendingChallenge = null;
    this.state.lastActionMessage = `Round started! Top card: ${topCard.color} ${topCard.value}`;

    this.notify();
  }

  private advanceTurn(step: number = 1): void {
    const count = this.state.players.length;
    let nextIdx = (this.state.currentTurnIdx + this.state.direction * step) % count;
    while (nextIdx < 0) nextIdx += count;
    this.state.currentTurnIdx = nextIdx % count;
  }

  public drawCard(playerId: string): { drawnCard: UnoCard; playable: boolean } {
    if (this.state.pendingChallenge) {
      throw new Error('Must resolve pending Wild Draw Four challenge first.');
    }

    const currPlayer = this.state.players[this.state.currentTurnIdx];
    if (!currPlayer || currPlayer.id !== playerId) {
      throw new Error('Not your turn.');
    }

    if (this.state.deck.length === 0) {
      this.replenishDeck();
    }

    if (this.state.deck.length === 0) {
      throw new Error('Deck is completely empty.');
    }

    const card = this.state.deck.pop()!;
    currPlayer.hand.push(card);
    currPlayer.calledUno = false; // Reset UNO flag on draw

    const playable = isCardPlayable(
      card,
      this.state.activeColor,
      this.state.activeValue
    );

    this.state.lastActionMessage = `${currPlayer.name} drew a card.`;
    this.notify();
    return { drawnCard: card, playable };
  }

  public passTurn(playerId: string): void {
    if (this.state.pendingChallenge) {
      throw new Error('Must resolve pending Wild Draw Four challenge first.');
    }

    const currPlayer = this.state.players[this.state.currentTurnIdx];
    if (!currPlayer || currPlayer.id !== playerId) {
      throw new Error('Not your turn.');
    }

    this.state.lastActionMessage = `${currPlayer.name} passed turn.`;
    this.advanceTurn(1);
    this.notify();
  }

  public playCard(
    playerId: string,
    cardId: string,
    chosenColor?: UnoColor
  ): void {
    if (this.state.pendingChallenge) {
      throw new Error('Must resolve pending Wild Draw Four challenge first.');
    }

    const playerIdx = this.state.currentTurnIdx;
    const player = this.state.players[playerIdx];

    if (!player || player.id !== playerId) {
      throw new Error('Not your turn.');
    }

    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) {
      throw new Error('Card not found in hand.');
    }

    const card = player.hand[cardIdx];

    if (!isCardPlayable(card, this.state.activeColor, this.state.activeValue)) {
      throw new Error(
        `Cannot play ${card.color} ${card.value} on ${this.state.activeColor} ${this.state.activeValue}`
      );
    }

    if (card.color === 'WILD' && !chosenColor) {
      throw new Error('Must select a color for Wild card.');
    }

    // Capture pre-play color BEFORE activeColor is updated
    const prePlayColor = this.state.activeColor;

    // Remove card from hand
    player.hand.splice(cardIdx, 1);
    this.state.discardPile.push(card);

    const nextColor = card.color === 'WILD' ? chosenColor! : card.color;
    this.state.activeColor = nextColor;
    this.state.activeValue = card.value;

    let actionMsg = `${player.name} played ${card.color === 'WILD' ? chosenColor : card.color} ${card.value}`;
    if (chosenColor) actionMsg += ` (Color set to ${chosenColor})`;

    // Check if player went out (0 cards)
    if (player.hand.length === 0) {
      this.handleRoundFinish(player);
      return;
    }

    // Handle special action cards
    if (card.value === 'SKIP') {
      actionMsg += ' • Next player SKIPPED!';
      this.advanceTurn(2);
    } else if (card.value === 'REVERSE') {
      if (this.state.players.length === 2) {
        actionMsg += ' • Reversed! (Acts as SKIP in 2-player)';
        this.advanceTurn(2);
      } else {
        this.state.direction = (this.state.direction * -1) as 1 | -1;
        actionMsg += ' • Direction Reversed!';
        this.advanceTurn(1);
      }
    } else if (card.value === 'DRAW_TWO') {
      this.advanceTurn(1);
      const nextPlayer = this.state.players[this.state.currentTurnIdx];
      this.giveCardsToPlayer(nextPlayer, 2);
      actionMsg = `Draw Two: ${nextPlayer.name} draws 2 cards`;
      this.advanceTurn(1);
    } else if (card.value === 'WILD_DRAW_FOUR') {
      this.advanceTurn(1);
      const targetPlayer = this.state.players[this.state.currentTurnIdx];

      // Set pending challenge state with accurate prePlayColor
      this.state.pendingChallenge = {
        challengerId: targetPlayer.id,
        targetId: player.id,
        card,
        chosenColor: chosenColor!,
        prePlayColor,
      };

      actionMsg = `Wild Draw Four: ${targetPlayer.name} must accept 4 cards or challenge!`;
    } else {
      this.advanceTurn(1);
    }

    this.state.lastActionMessage = actionMsg;
    this.notify();
  }

  public challengeWildDrawFour(
    challengerId: string,
    doChallenge: boolean
  ): void {
    const pc = this.state.pendingChallenge;
    if (!pc || pc.challengerId !== challengerId) {
      throw new Error('No active challenge for you.');
    }

    const challenger = this.state.players.find((p) => p.id === pc.challengerId)!;
    const target = this.state.players.find((p) => p.id === pc.targetId)!;

    this.state.pendingChallenge = null;

    if (!doChallenge) {
      // Challenger accepted the +4: challenger draws 4 cards and loses turn
      this.giveCardsToPlayer(challenger, 4);
      this.state.lastActionMessage = `Wild Draw Four: ${challenger.name} draws 4 cards`;
      this.advanceTurn(1);
      this.notify();
      return;
    }

    // Check if target held any cards matching prePlayColor when playing Wild +4
    const wasIllegal = !canLegallyPlayWildDrawFour(
      target.hand.concat([pc.card]),
      pc.prePlayColor
    );

    if (wasIllegal) {
      // Challenge Success! Target played illegally. Target draws 4 penalty cards!
      // Challenger draws 0 cards and keeps turn.
      this.giveCardsToPlayer(target, 4);
      this.state.lastActionMessage = `🚨 CHALLENGE SUCCESSFUL! ${target.name} held ${pc.prePlayColor} cards and draws 4 penalty cards! ${challenger.name}'s turn.`;
      // Turn stays on challenger!
    } else {
      // Challenge Failed! Target played legally. Challenger draws 4 + 2 penalty cards = 6 cards total and loses turn!
      this.giveCardsToPlayer(challenger, 6);
      this.state.lastActionMessage = `❌ CHALLENGE FAILED! ${target.name} had no ${pc.prePlayColor} cards. ${challenger.name} draws 6 cards and loses turn!`;
      this.advanceTurn(1);
    }

    this.notify();
  }

  public callUno(playerId: string): void {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    if (player.hand.length <= 2) {
      player.calledUno = true;
      this.state.lastActionMessage = `📣 ${player.name} called UNO!`;
      this.notify();
    }
  }

  public catchUno(targetPlayerId: string): boolean {
    const target = this.state.players.find((p) => p.id === targetPlayerId);
    if (!target) return false;

    if (target.hand.length === 1 && !target.calledUno) {
      this.giveCardsToPlayer(target, 2);
      this.state.lastActionMessage = `⚡ ${target.name} was caught without calling UNO! Draws 2 penalty cards.`;
      this.notify();
      return true;
    }

    return false;
  }

  private giveCardsToPlayer(player: UnoPlayer, count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.state.deck.length === 0) {
        this.replenishDeck();
      }
      if (this.state.deck.length > 0) {
        player.hand.push(this.state.deck.pop()!);
      }
    }
  }

  private replenishDeck(): void {
    if (this.state.discardPile.length <= 1) return;
    const top = this.state.discardPile.pop()!;
    const rest = shuffleDeck(this.state.discardPile);
    this.state.deck = rest;
    this.state.discardPile = [top];
  }

  private handleRoundFinish(winner: UnoPlayer): void {
    let roundPoints = 0;
    this.state.players.forEach((p) => {
      if (p.id !== winner.id) {
        roundPoints += calculateHandScore(p.hand);
      }
    });

    winner.score += roundPoints;
    this.state.roundWinnerId = winner.id;
    this.state.status =
      winner.score >= this.state.matchTargetScore ? 'MATCH_OVER' : 'ROUND_OVER';

    if (winner.score >= this.state.matchTargetScore) {
      this.state.winnerId = winner.id;
      this.state.lastActionMessage = `🏆 MATCH OVER! ${winner.name} won the UNO match with ${winner.score} points!`;
    } else {
      this.state.lastActionMessage = `🎉 ROUND OVER! ${winner.name} won this round and scored ${roundPoints} points! (Total: ${winner.score})`;
    }

    this.notify();
  }
}
