import {
  Phase10Card,
  Phase10GameState,
  Phase10Player,
  LaidPhaseGroup,
} from '../types/phase10.types';
import {
  calculateHandScore,
  createPhase10Deck,
  shufflePhase10Deck,
  validatePhase,
  isValidSet,
  isValidRun,
  isValidColorSet,
} from '../rules/phase10Rules';

export class Phase10Engine {
  private state: Phase10GameState;
  private listeners: Array<(state: Phase10GameState) => void> = [];

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): Phase10GameState {
    return {
      deck: [],
      discardPile: [],
      currentTurnIdx: 0,
      players: [],
      status: 'SETUP',
      roundNumber: 1,
      winnerId: null,
      roundWinnerId: null,
      lastActionMessage: null,
      hasDrawnThisTurn: false,
    };
  }


  public subscribe(listener: (state: Phase10GameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const copy = JSON.parse(JSON.stringify(this.state));
    this.listeners.forEach((l) => l(copy));
  }

  public getGameState(): Phase10GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public startMatch(
    playersConfig: { id: string; name: string; avatar?: string; isBot?: boolean }[]
  ): void {
    if (playersConfig.length < 2 || playersConfig.length > 8) {
      throw new Error('Phase 10 requires between 2 and 8 players.');
    }

    const defaultAvatars = ['👤', '🤖', '🦊', '🐯', '🐼', '🦁', '🐨', '🦄'];

    const players: Phase10Player[] = playersConfig.map((p, idx) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar || defaultAvatars[idx % defaultAvatars.length],
      isBot: !!p.isBot,
      hand: [],
      currentPhase: 1,
      hasLaidPhaseThisRound: false,
      laidPhaseGroups: [],
      totalScore: 0,
      isSkipped: false,
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
      ? shufflePhase10Deck([...createPhase10Deck(), ...createPhase10Deck()])
      : shufflePhase10Deck(createPhase10Deck());

    const players = this.state.players.map((p) => ({
      ...p,
      hand: fullDeck.splice(0, 10),
      hasLaidPhaseThisRound: false,
      laidPhaseGroups: [],
      isSkipped: false,
    }));

    let topDiscard = fullDeck.pop()!;
    // In official Phase 10 rules, if top card turned up is a Skip, turn another card so first player can draw normally
    while (topDiscard.value === 'SKIP' && fullDeck.length > 0) {
      fullDeck.unshift(topDiscard);
      topDiscard = fullDeck.pop()!;
    }

    this.state.deck = fullDeck;
    this.state.discardPile = [topDiscard];
    this.state.players = players;
    this.state.status = 'PLAYING';
    this.state.roundWinnerId = null;
    this.state.hasDrawnThisTurn = false;
    this.state.lastActionMessage = `Round ${this.state.roundNumber} started! Top discard: ${topDiscard.value}`;

    this.notify();
  }

  public drawCard(playerId: string, fromDiscard: boolean = false): Phase10Card {
    const player = this.state.players[this.state.currentTurnIdx];
    if (player.id !== playerId) throw new Error('Not your turn.');
    if (this.state.hasDrawnThisTurn) throw new Error('Already drew a card this turn.');

    let card: Phase10Card;

    if (fromDiscard) {
      if (this.state.discardPile.length === 0) throw new Error('Discard pile is empty.');
      const topDiscard = this.state.discardPile[this.state.discardPile.length - 1];
      if (topDiscard.value === 'SKIP') throw new Error('Cannot pick up Skip card from discard pile.');
      card = this.state.discardPile.pop()!;
    } else {
      if (this.state.deck.length === 0) this.replenishDeck();
      if (this.state.deck.length === 0) throw new Error('Deck is empty.');
      card = this.state.deck.pop()!;
    }

    player.hand.push(card);
    this.state.hasDrawnThisTurn = true;
    this.state.lastActionMessage = `${player.name} drew a card from ${fromDiscard ? 'discard pile' : 'draw pile'}.`;
    this.notify();
    return card;
  }

  public layDownPhase(playerId: string, cardGroups: Phase10Card[][]): boolean {
    const player = this.state.players[this.state.currentTurnIdx];
    if (player.id !== playerId) throw new Error('Not your turn.');
    if (!this.state.hasDrawnThisTurn) throw new Error('Must draw a card before laying down a Phase.');
    if (player.hasLaidPhaseThisRound) throw new Error('Already laid down phase this round.');

    const res = validatePhase(player.currentPhase, cardGroups);
    if (!res.isValid) {
      throw new Error(res.message || 'Invalid Phase combination.');
    }

    // Verify all cards exist in player hand
    const allCardIds = cardGroups.flat().map((c) => c.id);
    const handIds = player.hand.map((c) => c.id);
    if (!allCardIds.every((id) => handIds.includes(id))) {
      throw new Error('Cards not found in hand.');
    }

    // Remove cards from hand
    player.hand = player.hand.filter((c) => !allCardIds.includes(c.id));

    // Convert into laid groups
    player.laidPhaseGroups = cardGroups.map((grp) => ({
      type: isValidColorSet(grp) ? 'COLOR_SET' : isValidRun(grp, 3) ? 'RUN' : 'SET',
      cards: [...grp],
    }));

    player.hasLaidPhaseThisRound = true;
    this.state.lastActionMessage = `🎉 ${player.name} successfully laid down Phase ${player.currentPhase}!`;

    if (player.hand.length === 0) {
      this.handleRoundFinish(player);
    } else {
      this.notify();
    }

    return true;
  }

  public hitPhase(
    playerId: string,
    targetPlayerId: string,
    groupIndex: number,
    cardId: string
  ): boolean {
    const player = this.state.players[this.state.currentTurnIdx];
    if (player.id !== playerId) throw new Error('Not your turn.');
    if (!this.state.hasDrawnThisTurn) {
      throw new Error('Must draw a card before hitting.');
    }
    if (!player.hasLaidPhaseThisRound) {
      throw new Error('Must lay down your own Phase before hitting.');
    }

    const targetPlayer = this.state.players.find((p) => p.id === targetPlayerId);
    if (!targetPlayer || !targetPlayer.laidPhaseGroups[groupIndex]) {
      throw new Error('Target phase group not found.');
    }

    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) throw new Error('Card not in hand.');
    const card = player.hand[cardIdx];

    const group = targetPlayer.laidPhaseGroups[groupIndex];
    const testGroup = [...group.cards, card];

    let isValidHit = false;
    if (group.type === 'SET') {
      isValidHit = isValidSet(testGroup, group.cards.length + 1);
    } else if (group.type === 'RUN') {
      isValidHit = isValidRun(testGroup, group.cards.length + 1);
    } else if (group.type === 'COLOR_SET') {
      isValidHit = isValidColorSet(testGroup, group.cards.length + 1);
    }

    if (!isValidHit) {
      throw new Error(`Card ${card.value} does not legally hit this ${group.type}.`);
    }

    player.hand.splice(cardIdx, 1);
    group.cards.push(card);

    this.state.lastActionMessage = `${player.name} hit ${targetPlayer.name}'s Phase with ${card.value}!`;

    if (player.hand.length === 0) {
      this.handleRoundFinish(player);
    } else {
      this.notify();
    }

    return true;
  }

  public discardCard(playerId: string, cardId: string, skipTargetPlayerId?: string): void {
    const player = this.state.players[this.state.currentTurnIdx];
    if (player.id !== playerId) throw new Error('Not your turn.');
    if (!this.state.hasDrawnThisTurn) {
      throw new Error('Must draw a card before discarding.');
    }

    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) throw new Error('Card not in hand.');

    const card = player.hand[cardIdx];

    if (card.value === 'SKIP' && skipTargetPlayerId) {
      const target = this.state.players.find((p) => p.id === skipTargetPlayerId);
      if (target) {
        target.isSkipped = true;
        this.state.lastActionMessage = `🚫 ${player.name} played Skip on ${target.name}!`;
      }
    } else {
      this.state.lastActionMessage = `${player.name} discarded ${card.value}.`;
    }

    player.hand.splice(cardIdx, 1);
    this.state.discardPile.push(card);

    if (player.hand.length === 0) {
      this.handleRoundFinish(player);
      return;
    }

    this.advanceTurn();
    this.notify();
  }

  private advanceTurn(): void {
    const count = this.state.players.length;
    let nextIdx = (this.state.currentTurnIdx + 1) % count;

    // Reset drawn flag for next turn
    this.state.hasDrawnThisTurn = false;

    // Handle skip status
    if (this.state.players[nextIdx].isSkipped) {
      this.state.players[nextIdx].isSkipped = false;
      this.state.lastActionMessage = `${this.state.players[nextIdx].name}'s turn was SKIPPED!`;
      nextIdx = (nextIdx + 1) % count;
    }

    this.state.currentTurnIdx = nextIdx;
  }


  private replenishDeck(): void {
    if (this.state.discardPile.length <= 1) return;
    const top = this.state.discardPile.pop()!;
    this.state.deck = shufflePhase10Deck(this.state.discardPile);
    this.state.discardPile = [top];
  }

  private handleRoundFinish(winner: Phase10Player): void {
    this.state.roundWinnerId = winner.id;

    // Calculate round hand scores
    this.state.players.forEach((p) => {
      const handScore = calculateHandScore(p.hand);
      p.totalScore += handScore;

      // Phase advancement logic
      if (p.hasLaidPhaseThisRound) {
        p.currentPhase += 1;
      }
    });

    // Check if any player finished Phase 10
    const phase10Completers = this.state.players.filter((p) => p.currentPhase > 10);

    if (phase10Completers.length > 0) {
      // Find completer with lowest total score
      phase10Completers.sort((a, b) => a.totalScore - b.totalScore);
      this.state.winnerId = phase10Completers[0].id;
      this.state.status = 'MATCH_OVER';
      this.state.lastActionMessage = `🏆 MATCH WINNER! ${phase10Completers[0].name} completed Phase 10 with lowest score (${phase10Completers[0].totalScore} pts)!`;
    } else {
      this.state.status = 'ROUND_OVER';
      this.state.roundNumber += 1;
      this.state.lastActionMessage = `🎉 Round finished! Winner: ${winner.name} (0 pts).`;
    }

    this.notify();
  }
}
