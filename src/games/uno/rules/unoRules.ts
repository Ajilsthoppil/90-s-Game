import { UnoCard, UnoColor, UnoValue } from '../types/uno.types';

const COLORS: UnoColor[] = ['RED', 'GREEN', 'BLUE', 'YELLOW'];

export function createUnoDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  let cardIdCounter = 1;

  COLORS.forEach((color) => {
    // One '0' per color
    deck.push({ id: `c_${cardIdCounter++}`, color, value: '0' });

    // Two '1' through '9' per color
    for (let num = 1; num <= 9; num++) {
      const val = `${num}` as UnoValue;
      deck.push({ id: `c_${cardIdCounter++}`, color, value: val });
      deck.push({ id: `c_${cardIdCounter++}`, color, value: val });
    }

    // Two Action Cards per color: SKIP, REVERSE, DRAW_TWO
    const actions: UnoValue[] = ['SKIP', 'REVERSE', 'DRAW_TWO'];
    actions.forEach((val) => {
      deck.push({ id: `c_${cardIdCounter++}`, color, value: val });
      deck.push({ id: `c_${cardIdCounter++}`, color, value: val });
    });
  });

  // Four WILD cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c_${cardIdCounter++}`, color: 'WILD', value: 'WILD' });
  }

  // Four WILD DRAW FOUR cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c_${cardIdCounter++}`, color: 'WILD', value: 'WILD_DRAW_FOUR' });
  }

  return deck;
}

export function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function isCardPlayable(
  card: UnoCard,
  activeColor: UnoColor,
  activeValue: UnoValue
): boolean {
  if (card.color === 'WILD') return true;
  if (card.color === activeColor) return true;
  if (card.value === activeValue) return true;
  return false;
}

export function canLegallyPlayWildDrawFour(
  hand: UnoCard[],
  activeColor: UnoColor
): boolean {
  // Can only legally play Wild +4 if hand does NOT contain any card matching activeColor
  return !hand.some((c) => c.color === activeColor);
}

export function getCardPointValue(card: UnoCard): number {
  if (card.value === 'WILD' || card.value === 'WILD_DRAW_FOUR') {
    return 50;
  }
  if (card.value === 'SKIP' || card.value === 'REVERSE' || card.value === 'DRAW_TWO') {
    return 20;
  }
  return parseInt(card.value, 10) || 0;
}

export function calculateHandScore(hand: UnoCard[]): number {
  return hand.reduce((sum, card) => sum + getCardPointValue(card), 0);
}
