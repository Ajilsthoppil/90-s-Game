/**
 * Brain Games Asset Management & Fallback Registry
 *
 * Enforces per-puzzle asset limits, provides robust fallbacks for missing artwork,
 * prevents crash on missing assets, and calculates aspect-ratio fits.
 */

export interface BrainImageAsset {
  id: string;
  category: 'FRUIT' | 'ITEMS' | 'TOYS' | 'RETRO' | 'CARDS' | 'TILES';
  label: string;
  fallbackEmoji: string;
  source?: any; // Native require() image reference if available
  aspectRatio?: number; // width / height
}

export const BRAIN_ASSET_LIMITS = {
  MAX_IMAGES_PER_PUZZLE: 16,
  MAX_IMAGE_FILE_SIZE_BYTES: 500 * 1024, // 500 KB per asset
  RECOMMENDED_IMAGE_RESOLUTION: { width: 256, height: 256 },
};

/**
 * Controlled registry for brain game assets.
 */
export const BRAIN_ASSET_REGISTRY: Record<string, BrainImageAsset> = {
  // Fruit / Nature theme (Visual Diff, Memory Match)
  apple: { id: 'apple', category: 'FRUIT', label: 'Apple', fallbackEmoji: '🍎' },
  banana: { id: 'banana', category: 'FRUIT', label: 'Banana', fallbackEmoji: '🍌' },
  grapes: { id: 'grapes', category: 'FRUIT', label: 'Grapes', fallbackEmoji: '🍇' },
  orange: { id: 'orange', category: 'FRUIT', label: 'Orange', fallbackEmoji: '🍊' },
  strawberry: { id: 'strawberry', category: 'FRUIT', label: 'Strawberry', fallbackEmoji: '🍓' },
  pineapple: { id: 'pineapple', category: 'FRUIT', label: 'Pineapple', fallbackEmoji: '🍍' },
  watermelon: { id: 'watermelon', category: 'FRUIT', label: 'Watermelon', fallbackEmoji: '🍉' },
  peach: { id: 'peach', category: 'FRUIT', label: 'Peach', fallbackEmoji: '🍑' },
  cherries: { id: 'cherries', category: 'FRUIT', label: 'Cherries', fallbackEmoji: '🍒' },
  mango: { id: 'mango', category: 'FRUIT', label: 'Mango', fallbackEmoji: '🥭' },

  // Nostalgic 90s items (Tile Connect, Memory Match)
  cassette: { id: 'cassette', category: 'RETRO', label: 'Cassette Tape', fallbackEmoji: '📼' },
  radio: { id: 'radio', category: 'RETRO', label: 'Transistor Radio', fallbackEmoji: '📻' },
  pencil: { id: 'pencil', category: 'ITEMS', label: 'Natraj Pencil', fallbackEmoji: '✏️' },
  kite: { id: 'kite', category: 'TOYS', label: 'Paper Kite', fallbackEmoji: '🪁' },
  cricket: { id: 'cricket', category: 'ITEMS', label: 'Cricket Bat', fallbackEmoji: '🏏' },
  gameboy: { id: 'gameboy', category: 'RETRO', label: 'Brick Game', fallbackEmoji: '🕹️' },
  candy: { id: 'candy', category: 'ITEMS', label: 'Orange Candy', fallbackEmoji: '🍬' },
  scooter: { id: 'scooter', category: 'RETRO', label: 'Bajaj Chetak', fallbackEmoji: '🛵' },
  ticket: { id: 'ticket', category: 'RETRO', label: 'Bus Ticket', fallbackEmoji: '🎟️' },
  cards: { id: 'cards', category: 'TOYS', label: 'Trump Cards', fallbackEmoji: '🃏' },
  dice: { id: 'dice', category: 'TOYS', label: 'Dice', fallbackEmoji: '🎲' },
  boat: { id: 'boat', category: 'ITEMS', label: 'Paper Boat', fallbackEmoji: '⛵' },
};

/**
 * Retrieves asset by key with guaranteed fallback emoji and label.
 * Never throws or crashes if the key is unknown.
 */
export function getBrainAsset(key: string): BrainImageAsset {
  if (BRAIN_ASSET_REGISTRY[key]) {
    return BRAIN_ASSET_REGISTRY[key];
  }
  return {
    id: key,
    category: 'ITEMS',
    label: key,
    fallbackEmoji: '🧩',
  };
}

/**
 * Validates that the requested asset count is within the safe memory/render limit.
 * Emits a warning during development if exceeded.
 */
export function validateAssetCount(count: number, puzzleName: string): boolean {
  if (count > BRAIN_ASSET_LIMITS.MAX_IMAGES_PER_PUZZLE) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        `[BrainAssetRegistry] Warning: ${puzzleName} requested ${count} images, exceeding limit of ${BRAIN_ASSET_LIMITS.MAX_IMAGES_PER_PUZZLE}.`
      );
    }
    return false;
  }
  return true;
}

/**
 * Helper to preserve image aspect ratio within constrained box dimensions.
 */
export function fitAspectRatio(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }
  const ratio = naturalWidth / naturalHeight;
  let targetWidth = maxWidth;
  let targetHeight = targetWidth / ratio;

  if (targetHeight > maxHeight) {
    targetHeight = maxHeight;
    targetWidth = targetHeight * ratio;
  }

  return {
    width: Math.round(targetWidth),
    height: Math.round(targetHeight),
  };
}
