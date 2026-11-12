import { Phase10Card, Phase10Color, LaidPhaseGroup } from '../types/phase10.types';

const COLORS: Phase10Color[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

export function createPhase10Deck(): Phase10Card[] {
  const deck: Phase10Card[] = [];
  let idCount = 1;

  // 96 Numbered cards: 1-12 (2 of each per color)
  COLORS.forEach((color) => {
    for (let num = 1; num <= 12; num++) {
      deck.push({ id: `p_${idCount++}`, color, value: `${num}` as any });
      deck.push({ id: `p_${idCount++}`, color, value: `${num}` as any });
    }
  });

  // 8 Wild cards
  for (let i = 0; i < 8; i++) {
    deck.push({ id: `p_${idCount++}`, color: 'WILD', value: 'WILD' });
  }

  // 4 Skip cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `p_${idCount++}`, color: 'WILD', value: 'SKIP' });
  }

  return deck;
}

export function shufflePhase10Deck(deck: Phase10Card[]): Phase10Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCardPointValue(card: Phase10Card): number {
  if (card.value === 'WILD') return 25;
  if (card.value === 'SKIP') return 15;
  const num = parseInt(card.value, 10);
  if (num >= 10 && num <= 12) return 10;
  return 5; // 1 to 9
}

export function calculateHandScore(hand: Phase10Card[]): number {
  return hand.reduce((sum, card) => sum + getCardPointValue(card), 0);
}

/**
 * Validates if a group of cards forms a valid SET of target length
 */
export function isValidSet(cards: Phase10Card[], minLength: number): boolean {
  if (cards.length < minLength) return false;
  // Exclude skips
  if (cards.some((c) => c.value === 'SKIP')) return false;

  // Needs at least 1 natural card
  const naturalCards = cards.filter((c) => c.value !== 'WILD');
  if (naturalCards.length === 0) return false;

  const targetValue = naturalCards[0].value;
  return naturalCards.every((c) => c.value === targetValue);
}

/**
 * Validates if a group of cards forms a valid RUN of target length
 */
export function isValidRun(cards: Phase10Card[], minLength: number): boolean {
  if (cards.length < minLength) return false;
  if (cards.some((c) => c.value === 'SKIP')) return false;

  const naturalCards = cards.filter((c) => c.value !== 'WILD');
  if (naturalCards.length === 0) return false;

  // Sort natural cards and check spacing vs available wild cards
  const nums = naturalCards.map((c) => parseInt(c.value, 10)).sort((a, b) => a - b);
  let wilds = cards.length - naturalCards.length;

  for (let i = 0; i < nums.length - 1; i++) {
    const diff = nums[i + 1] - nums[i];
    if (diff <= 0) return false; // Duplicate number
    const missing = diff - 1;
    if (missing > wilds) return false;
    wilds -= missing;
  }

  return true;
}

/**
 * Validates Phase 8: 7 cards of 1 color
 */
export function isValidColorSet(cards: Phase10Card[], count: number = 7): boolean {
  if (cards.length < count) return false;
  if (cards.some((c) => c.value === 'SKIP')) return false;

  const naturalCards = cards.filter((c) => c.value !== 'WILD');
  if (naturalCards.length === 0) return false;

  const targetColor = naturalCards[0].color;
  return naturalCards.every((c) => c.color === targetColor);
}

/**
 * Validates a complete Phase combination (Phase 1 to Phase 10)
 */
export function validatePhase(
  phaseNum: number,
  groups: Phase10Card[][]
): { isValid: boolean; message?: string } {
  switch (phaseNum) {
    case 1: // 2 sets of 3
      if (groups.length === 2 && isValidSet(groups[0], 3) && isValidSet(groups[1], 3)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Phase 1 requires 2 sets of 3' };

    case 2: // 1 set of 3 + 1 run of 4
      if (
        groups.length === 2 &&
        ((isValidSet(groups[0], 3) && isValidRun(groups[1], 4)) ||
          (isValidRun(groups[0], 4) && isValidSet(groups[1], 3)))
      ) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Phase 2 requires 1 set of 3 + 1 run of 4' };

    case 3: // 1 set of 4 + 1 run of 4
      if (
        groups.length === 2 &&
        ((isValidSet(groups[0], 4) && isValidRun(groups[1], 4)) ||
          (isValidRun(groups[0], 4) && isValidSet(groups[1], 4)))
      ) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Phase 3 requires 1 set of 4 + 1 run of 4' };

    case 4: // 1 run of 7
      if (groups.length === 1 && isValidRun(groups[0], 7)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Phase 4 requires 1 run of 7' };

    case 5: // 1 run of 8
      if (groups.length === 1 && isValidRun(groups[0], 8)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Phase 5 requires 1 run of 8' };

    case 6: // 1 run of 9
      if (groups.length === 1 && isValidRun(groups[0], 9)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Phase 6 requires 1 run of 9' };

    case 7: // 2 sets of 4
      if (groups.length === 2 && isValidSet(groups[0], 4) && isValidSet(groups[1], 4)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Phase 7 requires 2 sets of 4' };

    case 8: // 7 cards of 1 color
      if (groups.length === 1 && isValidColorSet(groups[0], 7)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Phase 8 requires 7 cards of 1 color' };

    case 9: // 1 set of 5 + 1 set of 2
      if (
        groups.length === 2 &&
        ((isValidSet(groups[0], 5) && isValidSet(groups[1], 2)) ||
          (isValidSet(groups[0], 2) && isValidSet(groups[1], 5)))
      ) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Phase 9 requires 1 set of 5 + 1 set of 2' };

    case 10: // 1 set of 5 + 1 set of 3
      if (
        groups.length === 2 &&
        ((isValidSet(groups[0], 5) && isValidSet(groups[1], 3)) ||
          (isValidSet(groups[0], 3) && isValidSet(groups[1], 5)))
      ) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Phase 10 requires 1 set of 5 + 1 set of 3' };

    default:
      return { isValid: false, message: 'Invalid Phase number' };
  }
}

function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  function backtrack(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      backtrack(i + 1, combo);
      combo.pop();
    }
  }
  backtrack(0, []);
  return result;
}

/**
 * Searches a set of cards to find an arrangement that satisfies the given Phase.
 * Returns the grouping of cards if valid, or null.
 */
export function findValidPhaseGrouping(
  phaseNum: number,
  cards: Phase10Card[]
): Phase10Card[][] | null {
  if ([4, 5, 6, 8].includes(phaseNum)) {
    if (validatePhase(phaseNum, [cards]).isValid) {
      return [cards];
    }
    return null;
  }

  const groupSizes: Record<number, [number, number]> = {
    1: [3, 3],
    2: [3, 4],
    3: [4, 4],
    7: [4, 4],
    9: [5, 2],
    10: [5, 3],
  };

  const sizes = groupSizes[phaseNum];
  if (!sizes) return null;

  const [s1, s2] = sizes;
  if (cards.length < s1 + s2) return null;

  const combos = getCombinations(cards, s1);
  for (const g1 of combos) {
    const g1Ids = new Set(g1.map((c) => c.id));
    const remainder = cards.filter((c) => !g1Ids.has(c.id));
    const g2Combos = remainder.length === s2 ? [remainder] : getCombinations(remainder, s2);
    for (const g2 of g2Combos) {
      if (validatePhase(phaseNum, [g1, g2]).isValid) {
        return [g1, g2];
      }
      if (validatePhase(phaseNum, [g2, g1]).isValid) {
        return [g2, g1];
      }
    }
  }

  return null;
}

