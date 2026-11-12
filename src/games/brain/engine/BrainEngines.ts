import { BrainDifficulty } from '../types/brain.types';

// ==========================================
// VOCABULARY WORD MEANING SYSTEM (Section 14)
// ==========================================
export interface VocabularyWord {
  word: string;
  meaning: string;
  exampleSentence?: string;
  difficulty: BrainDifficulty;
  category?: string;
}

export const VOCABULARY_BANK: VocabularyWord[] = [
  // Preserved original bank
  {
    word: 'CURIOUS',
    meaning: 'Eager to know or learn something new.',
    exampleSentence: 'The curious student read many books in the library.',
    difficulty: 'EASY',
    category: 'Personality',
  },
  {
    word: 'NOSTALGIA',
    meaning: 'A sentimental affection for happy memories of the past.',
    exampleSentence: 'Playing old classroom paper games brought back sweet nostalgia.',
    difficulty: 'MEDIUM',
    category: 'Emotions',
  },
  {
    word: 'CREATIVE',
    meaning: 'Having or showing imagination and original ideas.',
    exampleSentence: 'She drew a creative paper boat to float in rainwater.',
    difficulty: 'EASY',
    category: 'Skills',
  },
  {
    word: 'HARMONY',
    meaning: 'A pleasing combination of elements or peaceful agreement.',
    exampleSentence: 'The cousins played games together in perfect harmony.',
    difficulty: 'MEDIUM',
    category: 'Social',
  },
  {
    word: 'PERSEVERANCE',
    meaning: 'Continued effort to achieve something despite difficulties.',
    exampleSentence: 'Solving the hard Sudoku grid required great perseverance.',
    difficulty: 'HARD',
    category: 'Virtues',
  },
  // Expanded vocabulary
  {
    word: 'ADVENTURE',
    meaning: 'An unusual and exciting, typically hazardous, experience or activity.',
    exampleSentence: 'Childhood summer vacations were filled with outdoor adventure.',
    difficulty: 'EASY',
    category: 'Activities',
  },
  {
    word: 'CHILDHOOD',
    meaning: 'The state or period of being a child.',
    exampleSentence: 'Playing board games on veranda afternoons was the joy of childhood.',
    difficulty: 'EASY',
    category: 'Memories',
  },
  {
    word: 'TRIUMPH',
    meaning: 'A great victory or achievement.',
    exampleSentence: 'Solving the entire maze without backtracking was a true triumph.',
    difficulty: 'MEDIUM',
    category: 'Achievement',
  },
  {
    word: 'COMPASSION',
    meaning: 'Sympathetic pity and concern for the sufferings or misfortunes of others.',
    exampleSentence: 'Showing kindness to schoolmates reflects genuine compassion.',
    difficulty: 'HARD',
    category: 'Virtues',
  },
  {
    word: 'INGENUITY',
    meaning: 'The quality of being clever, original, and inventive.',
    exampleSentence: 'Fixing the broken paper kite required great ingenuity.',
    difficulty: 'HARD',
    category: 'Skills',
  },
];

// ==========================================
// 1. CIRCUIT CONNECT (Tile Rotation / Wiring)
// ==========================================
export interface CircuitWireTile {
  id: string;
  row: number;
  col: number;
  type: 'SOURCE' | 'BULB' | 'STRAIGHT' | 'CORNER' | 'CROSS' | 'T_SHAPE';
  rotation: 0 | 90 | 180 | 270;
  isPowered: boolean;
  correctRotation?: 0 | 90 | 180 | 270;
}

export function getTilePorts(
  type: CircuitWireTile['type'],
  rotation: number
): { north: boolean; east: boolean; south: boolean; west: boolean } {
  let base = { north: false, east: false, south: false, west: false };
  if (type === 'STRAIGHT') base = { north: true, east: false, south: true, west: false };
  else if (type === 'CORNER') base = { north: true, east: true, south: false, west: false };
  else if (type === 'T_SHAPE') base = { north: true, east: true, south: false, west: true };
  else if (type === 'CROSS') base = { north: true, east: true, south: true, west: true };
  else if (type === 'SOURCE') base = { north: false, east: true, south: true, west: false };
  else if (type === 'BULB') base = { north: true, east: false, south: false, west: true };

  const steps = ((Math.round(rotation / 90) % 4) + 4) % 4;
  const ports = [base.north, base.east, base.south, base.west];
  for (let i = 0; i < steps; i++) {
    const last = ports.pop()!;
    ports.unshift(last);
  }
  return { north: ports[0], east: ports[1], south: ports[2], west: ports[3] };
}

export function computeCircuitPower(tiles: CircuitWireTile[][]): {
  poweredTiles: CircuitWireTile[][];
  isBulbPowered: boolean;
} {
  const size = tiles.length;
  const isPoweredGrid = Array(size)
    .fill(0)
    .map(() => Array(size).fill(false));

  const queue: { r: number; c: number }[] = [{ r: 0, c: 0 }];
  isPoweredGrid[0][0] = true;
  let isBulbPowered = false;

  while (queue.length > 0) {
    const { r, c } = queue.shift()!;
    const currentTile = tiles[r][c];
    const currentPorts = getTilePorts(currentTile.type, currentTile.rotation);

    if (currentTile.type === 'BULB') {
      isBulbPowered = true;
    }

    const neighbors = [
      { dr: -1, dc: 0, dir: 'north', opp: 'south' },
      { dr: 0, dc: 1, dir: 'east', opp: 'west' },
      { dr: 1, dc: 0, dir: 'south', opp: 'north' },
      { dr: 0, dc: -1, dir: 'west', opp: 'east' },
    ] as const;

    for (const n of neighbors) {
      const nr = r + n.dr;
      const nc = c + n.dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      if (isPoweredGrid[nr][nc]) continue;

      if (!(currentPorts as any)[n.dir]) continue;

      const neighborTile = tiles[nr][nc];
      const neighborPorts = getTilePorts(neighborTile.type, neighborTile.rotation);
      if (!(neighborPorts as any)[n.opp]) continue;

      isPoweredGrid[nr][nc] = true;
      queue.push({ r: nr, c: nc });
    }
  }

  const poweredTiles = tiles.map((row, r) =>
    row.map((tile, c) => ({
      ...tile,
      isPowered: isPoweredGrid[r][c],
    }))
  );

  return { poweredTiles, isBulbPowered };
}

export function createCircuitGame(diff: BrainDifficulty, level: number = 1): {
  size: number;
  tiles: CircuitWireTile[][];
  isComplete: boolean;
} {
  let size = 3;
  if (diff === 'EASY') {
    size = level <= 4 ? 3 : level <= 9 ? 4 : 5;
  } else if (diff === 'MEDIUM') {
    size = level <= 4 ? 4 : 5;
  } else {
    size = 5;
  }

  let attempt = 0;
  while (attempt < 20) {
    attempt++;
    const tiles: CircuitWireTile[][] = [];

    // Generate a solvable zig-zag path from (0,0) to (size-1, size-1)
    const path: { r: number; c: number }[] = [];
    let currR = 0;
    let currC = 0;
    path.push({ r: currR, c: currC });

    while (currR < size - 1 || currC < size - 1) {
      if (currR === size - 1) {
        currC++;
      } else if (currC === size - 1) {
        currR++;
      } else if (Math.random() > 0.5) {
        currC++;
      } else {
        currR++;
      }
      path.push({ r: currR, c: currC });
    }

    // Populate grid with tiles matching the path solution
    for (let r = 0; r < size; r++) {
      const row: CircuitWireTile[] = [];
      for (let c = 0; c < size; c++) {
        let type: CircuitWireTile['type'] = (r + c) % 2 === 0 ? 'STRAIGHT' : 'CORNER';
        let correctRotation: 0 | 90 | 180 | 270 = 0;

        if (r === 0 && c === 0) {
          type = 'SOURCE';
          correctRotation = 0;
        } else if (r === size - 1 && c === size - 1) {
          type = 'BULB';
          correctRotation = 0;
        } else {
          const pathIdx = path.findIndex((p) => p.r === r && p.c === c);
          if (pathIdx > 0 && pathIdx < path.length - 1) {
            const prev = path[pathIdx - 1];
            const next = path[pathIdx + 1];
            const inDir = { dr: r - prev.r, dc: c - prev.c };
            const outDir = { dr: next.r - r, dc: next.c - c };

            if (inDir.dr === 0 && outDir.dr === 0) {
              type = 'STRAIGHT';
              correctRotation = 90;
            } else if (inDir.dc === 0 && outDir.dc === 0) {
              type = 'STRAIGHT';
              correctRotation = 0;
            } else {
              type = 'CORNER';
              if (
                (inDir.dc === 1 && outDir.dr === 1) ||
                (inDir.dr === -1 && outDir.dc === -1)
              ) {
                correctRotation = 180;
              } else if (
                (inDir.dr === 1 && outDir.dc === 1) ||
                (inDir.dc === -1 && outDir.dr === -1)
              ) {
                correctRotation = 0;
              } else if (
                (inDir.dc === 1 && outDir.dr === -1) ||
                (inDir.dr === 1 && outDir.dc === -1)
              ) {
                correctRotation = 270;
              } else {
                correctRotation = 90;
              }
            }
          }
        }

        // Add non-zero scramble ensuring initial state is not already solved
        const scramble = (Math.floor(Math.random() * 3) + 1) * 90;
        const initialRotation = ((correctRotation + scramble) % 360) as 0 | 90 | 180 | 270;

        row.push({
          id: `wire_${r}_${c}`,
          row: r,
          col: c,
          type,
          rotation: initialRotation,
          correctRotation,
          isPowered: r === 0 && c === 0,
        });
      }
      tiles.push(row);
    }

    const { poweredTiles, isBulbPowered } = computeCircuitPower(tiles);
    if (!isBulbPowered) {
      return { size, tiles: poweredTiles, isComplete: false };
    }
  }

  // Fallback
  const fallbackTiles: CircuitWireTile[][] = Array(size).fill(0).map((_, r) =>
    Array(size).fill(0).map((_, c) => ({
      id: `wire_${r}_${c}`,
      row: r,
      col: c,
      type: r === 0 && c === 0 ? 'SOURCE' : r === size - 1 && c === size - 1 ? 'BULB' : 'STRAIGHT',
      rotation: 90 as const,
      correctRotation: 0 as const,
      isPowered: r === 0 && c === 0,
    }))
  );
  const { poweredTiles } = computeCircuitPower(fallbackTiles);
  return { size, tiles: poweredTiles, isComplete: false };
}

export function getCircuitHint(tiles: CircuitWireTile[][]): { row: number; col: number; text: string } | null {
  for (let r = 0; r < tiles.length; r++) {
    for (let c = 0; c < tiles[r].length; c++) {
      const tile = tiles[r][c];
      if (tile.type !== 'SOURCE' && tile.type !== 'BULB' && tile.correctRotation !== undefined) {
        if (tile.rotation !== tile.correctRotation) {
          return {
            row: r,
            col: c,
            text: `Try rotating wire at Row ${r + 1}, Col ${c + 1} to align the circuit.`,
          };
        }
      }
    }
  }
  return null;
}

// ==========================================
// 2. TILE CONNECT (Onet Match with 2-Turn Path)
// ==========================================
export interface TileConnectItem {
  id: string;
  icon: string;
  matched: boolean;
  row: number;
  col: number;
}

export function createTileConnectGame(diff: BrainDifficulty, level: number = 1): TileConnectItem[] {
  const pool = ['📼', '📻', '✏️', '🪁', '🏏', '🕹️', '🍬', '🛵', '🎟️', '🃏', '🎲', '⛵', '⏰', '📷'];
  let count = 4;
  if (diff === 'EASY') {
    count = level <= 5 ? 4 : level <= 9 ? 5 : 8;
  } else if (diff === 'MEDIUM') {
    count = level <= 5 ? 6 : 8;
  } else {
    count = 8;
  }
  const cols = 4;
  const startOffset = ((level - 1) * 2) % Math.max(1, pool.length - count);
  const selected = pool.slice(startOffset, startOffset + count);

  const items: TileConnectItem[] = [];
  let idAcc = 0;
  selected.forEach((icon) => {
    items.push({ id: `tc_${++idAcc}`, icon, matched: false, row: 0, col: 0 });
    items.push({ id: `tc_${++idAcc}`, icon, matched: false, row: 0, col: 0 });
  });

  items.sort(() => Math.random() - 0.5);
  items.forEach((it, idx) => {
    it.row = Math.floor(idx / cols);
    it.col = idx % cols;
  });

  return items;
}

/**
 * Validates whether two tiles can legally connect via an orthogonal path
 * with AT MOST 2 right-angle turns (at most 3 segments) through empty spaces or outer margin.
 */
export function canConnectTilesOnet(
  items: TileConnectItem[],
  id1: string,
  id2: string
): { canConnect: boolean; reason?: string } {
  const t1 = items.find((it) => it.id === id1);
  const t2 = items.find((it) => it.id === id2);

  if (!t1 || !t2) return { canConnect: false, reason: 'Tile not found' };
  if (t1.id === t2.id) return { canConnect: false, reason: 'Same tile' };
  if (t1.icon !== t2.icon) return { canConnect: false, reason: 'Icons do not match' };
  if (t1.matched || t2.matched) return { canConnect: false, reason: 'Already cleared' };

  const maxRow = Math.max(...items.map((it) => it.row));
  const maxCol = Math.max(...items.map((it) => it.col));

  // Padded grid where boundary is row: 0 and maxRow + 2, col: 0 and maxCol + 2
  // Real rows are 1 to maxRow + 1, real cols are 1 to maxCol + 1
  const gridRows = maxRow + 3;
  const gridCols = maxCol + 3;

  // Occupied matrix: true if cell contains an unmatched tile
  const occupied = Array(gridRows)
    .fill(0)
    .map(() => Array(gridCols).fill(false));

  items.forEach((it) => {
    if (!it.matched) {
      occupied[it.row + 1][it.col + 1] = true;
    }
  });

  const startR = t1.row + 1;
  const startC = t1.col + 1;
  const endR = t2.row + 1;
  const endC = t2.col + 1;

  // Destination tile cell is considered reachable
  occupied[endR][endC] = false;

  // BFS with direction & turns count
  const dirs = [
    { dr: -1, dc: 0, dir: 0 }, // North
    { dr: 0, dc: 1, dir: 1 },  // East
    { dr: 1, dc: 0, dir: 2 },  // South
    { dr: 0, dc: -1, dir: 3 }, // West
  ];

  interface SearchNode {
    r: number;
    c: number;
    dir: number; // 0..3
    turns: number;
  }

  // Min turns to reach each state: minTurns[r][c][dir]
  const minTurns = Array(gridRows)
    .fill(0)
    .map(() =>
      Array(gridCols)
        .fill(0)
        .map(() => Array(4).fill(999))
    );

  const queue: SearchNode[] = [];

  for (const d of dirs) {
    const nr = startR + d.dr;
    const nc = startC + d.dc;
    if (nr >= 0 && nr < gridRows && nc >= 0 && nc < gridCols && !occupied[nr][nc]) {
      minTurns[nr][nc][d.dir] = 0;
      queue.push({ r: nr, c: nc, dir: d.dir, turns: 0 });
    }
  }

  while (queue.length > 0) {
    const { r, c, dir, turns } = queue.shift()!;

    if (r === endR && c === endC && turns <= 2) {
      return { canConnect: true };
    }

    if (turns > 2) continue;

    for (const d of dirs) {
      const nr = r + d.dr;
      const nc = c + d.dc;
      if (nr < 0 || nr >= gridRows || nc < 0 || nc >= gridCols || occupied[nr][nc]) {
        continue;
      }
      const newTurns = d.dir === dir ? turns : turns + 1;
      if (newTurns <= 2 && newTurns < minTurns[nr][nc][d.dir]) {
        minTurns[nr][nc][d.dir] = newTurns;
        queue.push({ r: nr, c: nc, dir: d.dir, turns: newTurns });
      }
    }
  }

  return {
    canConnect: false,
    reason: 'Path blocked or requires more than 2 turns',
  };
}

// ==========================================
// 3. WORD FILL (Vocabulary Fill + Meaning)
// ==========================================
export interface WordFillPuzzle {
  vocab: VocabularyWord;
  displayLetters: (string | null)[];
  userInputs: (string | null)[];
}

export function createWordFillGame(diff: BrainDifficulty, level: number = 1): WordFillPuzzle {
  const choices = VOCABULARY_BANK.filter((v) => v.difficulty === diff || diff === 'EASY');
  const vocab = choices[(level - 1) % choices.length] || VOCABULARY_BANK[0];

  // Guaranteed at least 2 blank slots
  const display = vocab.word.split('').map((ch, idx) => {
    if (idx === 0) return ch; // Reveal first letter
    if (idx === vocab.word.length - 1 && vocab.word.length > 5) return ch;
    return Math.random() > 0.45 ? null : ch;
  });

  // Ensure at least two blanks
  const blanks = display.filter((d) => d === null).length;
  if (blanks < 2 && vocab.word.length > 2) {
    display[1] = null;
    display[Math.min(2, vocab.word.length - 1)] = null;
  }

  return {
    vocab,
    displayLetters: display,
    userInputs: display.map((d) => d),
  };
}

// ==========================================
// 4. WORD PUZZLE (Anagram Unscramble)
// ==========================================
export interface WordPuzzleData {
  vocab: VocabularyWord;
  scrambled: string[];
}

export function createWordPuzzleGame(diff: BrainDifficulty, level: number = 1): WordPuzzleData {
  const choices = VOCABULARY_BANK.filter((v) => v.difficulty === diff || diff === 'EASY');
  const vocab = choices[(level - 1) % choices.length] || VOCABULARY_BANK[0];

  let scrambled = vocab.word.split('').sort(() => Math.random() - 0.5);
  // Ensure not identical to original
  if (vocab.word.length > 2 && scrambled.join('') === vocab.word) {
    const temp = scrambled[0];
    scrambled[0] = scrambled[1];
    scrambled[1] = temp;
  }

  return { vocab, scrambled };
}

// ==========================================
// 5. WORD CONNECTION (Wheel Sub-words)
// ==========================================
export interface WordConnectData {
  letters: string[];
  validWords: string[];
  foundWords: string[];
  targetWordCount: number;
}

export const WORD_CONNECT_DATASETS: { letters: string[]; validWords: string[] }[] = [
  {
    letters: ['P', 'A', 'P', 'E', 'R'],
    validWords: ['PAPER', 'PEAR', 'REAP', 'PAR', 'APE', 'EAR', 'ERA', 'ARE'],
  },
  {
    letters: ['T', 'R', 'A', 'I', 'N'],
    validWords: ['TRAIN', 'RAIN', 'RANT', 'TARN', 'ANTI', 'TIN', 'TAN', 'AIR', 'RAT', 'ART'],
  },
  {
    letters: ['S', 'M', 'I', 'L', 'E'],
    validWords: ['SMILE', 'SLIME', 'MILE', 'LIME', 'SLIM', 'LIES', 'ISLE', 'ELM'],
  },
  {
    letters: ['B', 'R', 'E', 'A', 'D'],
    validWords: ['BREAD', 'BEARD', 'BARE', 'BEAR', 'READ', 'DEAR', 'DARE', 'BED', 'RED', 'EAR'],
  },
  {
    letters: ['P', 'L', 'A', 'N', 'T'],
    validWords: ['PLANT', 'PLAN', 'PANT', 'PLAT', 'TAN', 'PAN', 'TAP', 'PAT', 'ANT', 'LAP'],
  },
];

export function createWordConnectGame(diff: BrainDifficulty, level: number = 1): WordConnectData {
  const dataset = WORD_CONNECT_DATASETS[(level - 1) % WORD_CONNECT_DATASETS.length];
  const targetWordCount =
    diff === 'EASY'
      ? level <= 3
        ? 3
        : 4
      : level <= 6
      ? 4
      : Math.min(5, dataset.validWords.length);

  return {
    letters: [...dataset.letters],
    validWords: [...dataset.validWords],
    foundWords: [],
    targetWordCount,
  };
}

// ==========================================
// 6. SUDOKU (4x4 Mini & 9x9 Standard Solver)
// ==========================================
export interface SudokuGrid {
  size: 4 | 9;
  mode: 'MINI' | 'STANDARD';
  initial: (number | null)[][];
  current: (number | null)[][];
  solution: number[][];
  mistakes: number;
}

// Verified 9x9 Standard Sudoku Puzzle Datasets
export const STANDARD_SUDOKU_DATASETS: {
  difficulty: BrainDifficulty;
  initial: (number | null)[][];
  solution: number[][];
}[] = [
  {
    difficulty: 'EASY',
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
    initial: [
      [5, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, 9, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
      [8, null, null, null, 6, null, null, null, 3],
      [4, null, null, 8, null, 3, null, null, 1],
      [7, null, null, null, 2, null, null, null, 6],
      [null, 6, null, null, null, null, 2, 8, null],
      [null, null, null, 4, 1, 9, null, null, 5],
      [null, null, null, null, 8, null, null, 7, 9],
    ],
  },
  {
    difficulty: 'MEDIUM',
    solution: [
      [2, 4, 6, 8, 5, 7, 9, 1, 3],
      [1, 7, 9, 3, 2, 4, 5, 6, 8],
      [3, 5, 8, 6, 1, 9, 2, 4, 7],
      [4, 6, 2, 1, 9, 5, 7, 3, 8],
      [7, 9, 1, 4, 3, 8, 6, 2, 5],
      [5, 8, 3, 2, 7, 6, 4, 9, 1],
      [6, 1, 4, 5, 8, 2, 3, 7, 9],
      [8, 2, 7, 9, 4, 3, 1, 5, 6],
      [9, 3, 5, 7, 6, 1, 8, 4, 2],
    ],
    initial: [
      [2, null, null, 8, null, 7, null, null, 3],
      [null, 7, null, null, 2, null, null, 6, null],
      [null, null, 8, 6, null, 9, 2, null, null],
      [4, null, 2, null, null, null, 7, null, 8],
      [null, 9, null, null, 3, null, null, 2, null],
      [5, null, 3, null, null, null, 4, null, 1],
      [null, null, 4, 5, null, 2, 3, null, null],
      [null, 2, null, null, 4, null, null, 5, null],
      [9, null, null, 7, null, 1, null, null, 2],
    ],
  },
  {
    difficulty: 'HARD',
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
    initial: [
      [null, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, null, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
      [8, null, null, null, 6, null, null, null, 3],
      [4, null, null, null, null, 3, null, null, 1],
      [7, null, null, null, 2, null, null, null, null],
      [null, 6, null, null, null, null, 2, 8, null],
      [null, null, null, 4, 1, null, null, null, 5],
      [null, null, null, null, 8, null, null, 7, null],
    ],
  },
];

export function createSudokuGame(
  diff: BrainDifficulty,
  mode: 'MINI' | 'STANDARD' = diff === 'HARD' ? 'STANDARD' : 'MINI',
  level: number = 1
): SudokuGrid {
  if (mode === 'MINI' && diff !== 'HARD') {
    // 4x4 Mini Sudoku
    const solution = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ];
    // Scale initial clues based on level:
    // Level 1-3: 8 clues (gentle intro)
    // Level 4-7: 6 clues
    // Level 8+: 5 clues
    let initial: (number | null)[][];
    if (level <= 3) {
      initial = [
        [1, null, 3, null],
        [null, 4, null, 2],
        [2, null, 4, null],
        [null, 3, null, 1],
      ];
    } else if (level <= 7) {
      initial = [
        [1, null, 3, null],
        [null, 4, null, null],
        [2, null, null, null],
        [null, 3, null, 1],
      ];
    } else {
      initial = [
        [1, null, null, null],
        [null, 4, null, null],
        [2, null, 4, null],
        [null, null, null, 1],
      ];
    }

    return {
      size: 4,
      mode: 'MINI',
      initial,
      current: initial.map((row) => [...row]),
      solution,
      mistakes: 0,
    };
  } else {
    // 9x9 Standard Sudoku
    const dsList = STANDARD_SUDOKU_DATASETS.filter((d) => d.difficulty === diff);
    const ds =
      (dsList.length > 0 ? dsList[(level - 1) % dsList.length] : null) ||
      STANDARD_SUDOKU_DATASETS.find((d) => d.difficulty === diff) ||
      STANDARD_SUDOKU_DATASETS[0];

    return {
      size: 9,
      mode: 'STANDARD',
      initial: ds.initial.map((row) => [...row]),
      current: ds.initial.map((row) => [...row]),
      solution: ds.solution.map((row) => [...row]),
      mistakes: 0,
    };
  }
}

/**
 * Detects all cells in a Sudoku board that have duplicates in their
 * row, column, or subgrid (2x2 for 4x4, 3x3 for 9x9).
 */
export function getSudokuConflicts(
  grid: (number | null)[][],
  size: 4 | 9
): { row: number; col: number }[] {
  const conflicts = new Set<string>();
  const subSize = size === 4 ? 2 : 3;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = grid[r][c];
      if (val === null) continue;

      // Row check
      for (let c2 = 0; c2 < size; c2++) {
        if (c2 !== c && grid[r][c2] === val) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r},${c2}`);
        }
      }

      // Column check
      for (let r2 = 0; r2 < size; r2++) {
        if (r2 !== r && grid[r2][c] === val) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r2},${c}`);
        }
      }

      // Subgrid check
      const boxR = Math.floor(r / subSize) * subSize;
      const boxC = Math.floor(c / subSize) * subSize;
      for (let br = boxR; br < boxR + subSize; br++) {
        for (let bc = boxC; bc < boxC + subSize; bc++) {
          if ((br !== r || bc !== c) && grid[br][bc] === val) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${br},${bc}`);
          }
        }
      }
    }
  }

  return Array.from(conflicts).map((coord) => {
    const [row, col] = coord.split(',').map(Number);
    return { row, col };
  });
}

// ==========================================
// 7. MEMORY MATCH (Nostalgic Card Pairs)
// ==========================================
export interface MemoryCardItem {
  id: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// ==========================================
// 7. MEMORY MATCH (Nostalgic Card Pairs)
// ==========================================
export interface MemoryCardItem {
  id: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function createMemoryMatchGame(diff: BrainDifficulty, level: number = 1): MemoryCardItem[] {
  const pool = ['🎟️', '🃏', '🐍', '🎲', '📼', '📻', '✏️', '🪁', '🏏', '🕹️', '🍬', '🛵', '⛵', '⏰', '📷', '📺'];
  
  // Scale pair counts progressively:
  // EASY: 4 pairs (introductory), 5 pairs on lvl 6+
  // MEDIUM: 5 pairs on lvl 1-4, 6 pairs on lvl 5+
  // HARD: 6 pairs on lvl 1-4, 8 pairs on lvl 5+
  let pairCount = 4;
  if (diff === 'EASY') {
    pairCount = level <= 5 ? 4 : 5;
  } else if (diff === 'MEDIUM') {
    pairCount = level <= 4 ? 5 : 6;
  } else {
    pairCount = level <= 4 ? 6 : 8;
  }

  // Rotate icon pool deterministically by level so every level feels fresh
  const offset = ((level - 1) * 3) % pool.length;
  const selected: string[] = [];
  for (let i = 0; i < pairCount; i++) {
    selected.push(pool[(offset + i) % pool.length]);
  }

  const cards: MemoryCardItem[] = [];
  let id = 0;
  selected.forEach((emoji) => {
    cards.push({ id: `mc_${++id}`, emoji, isFlipped: false, isMatched: false });
    cards.push({ id: `mc_${++id}`, emoji, isFlipped: false, isMatched: false });
  });

  return cards.sort(() => Math.random() - 0.5);
}

// ==========================================
// 8. PATTERN COMPLETE (Pattern Recognition)
// ==========================================
export interface PatternPuzzleData {
  sequence: string[];
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export const PATTERN_DATASETS: PatternPuzzleData[] = [
  // Levels 1-2: Alternating shapes / colors
  {
    sequence: ['🔴', '🔵', '🔴', '🔵', '❓'],
    options: ['🔴', '🔵', '🟡', '🟢'],
    correctAnswer: '🔴',
    explanation: 'The pattern alternates between Red and Blue circle shapes.',
  },
  {
    sequence: ['⭐️', '🌙', '⭐️', '🌙', '❓'],
    options: ['☀️', '🌙', '⭐️', '☁️'],
    correctAnswer: '⭐️',
    explanation: 'The pattern alternates between Star and Crescent Moon.',
  },
  // Levels 3-5: Simple arithmetic progressions
  {
    sequence: ['2', '4', '6', '8', '❓'],
    options: ['9', '10', '11', '12'],
    correctAnswer: '10',
    explanation: 'The sequence increases by 2 each step: 2 -> 4 -> 6 -> 8 -> 10.',
  },
  {
    sequence: ['3', '6', '9', '12', '❓'],
    options: ['13', '14', '15', '16'],
    correctAnswer: '15',
    explanation: 'Multiples of 3: each step adds 3 (3, 6, 9, 12, 15).',
  },
  {
    sequence: ['5', '10', '15', '20', '❓'],
    options: ['22', '24', '25', '30'],
    correctAnswer: '25',
    explanation: 'Increases by 5 at each position (5, 10, 15, 20, 25).',
  },
  // Levels 6-8: Rotations & cyclical transitions
  {
    sequence: ['⬆️', '➡️', '⬇️', '⬅️', '❓'],
    options: ['⬆️', '↗️', '↘️', '⬇️'],
    correctAnswer: '⬆️',
    explanation: 'Clockwise 90-degree rotations loop back to pointing UP.',
  },
  {
    sequence: ['🌑', '🌓', '🌕', '🌗', '❓'],
    options: ['🌑', '🌘', '☀️', '⭐'],
    correctAnswer: '🌑',
    explanation: 'Lunar cycle phases: New Moon -> Half -> Full -> Half -> New Moon.',
  },
  // Levels 9+: Geometric, exponential & multi-step
  {
    sequence: ['1', '2', '4', '8', '❓'],
    options: ['12', '14', '16', '18'],
    correctAnswer: '16',
    explanation: 'Geometric sequence where each number doubles (1, 2, 4, 8, 16).',
  },
  {
    sequence: ['1', '1', '2', '3', '5', '❓'],
    options: ['6', '7', '8', '9'],
    correctAnswer: '8',
    explanation: 'Fibonacci sequence: each number is sum of preceding two (3 + 5 = 8).',
  },
  {
    sequence: ['🟧', '🔺', '🟧', '🔺', '❓'],
    options: ['🟧', '🔺', '🟢', '🔷'],
    correctAnswer: '🟧',
    explanation: 'Alternating square and triangle geometry.',
  },
];

export function createPatternGame(diff: BrainDifficulty, level: number = 1): PatternPuzzleData {
  // Deterministic progression index based on level with cycling
  const idx = (level - 1) % PATTERN_DATASETS.length;
  return { ...PATTERN_DATASETS[idx] };
}

// ==========================================
// 9. NUMBER PUZZLES (Equation Balance)
// ==========================================
export interface NumberPuzzleData {
  equation: string;
  options: number[];
  correctAnswer: number;
}

export function createNumberPuzzleGame(diff: BrainDifficulty, level: number = 1): NumberPuzzleData {
  let equation = '';
  let correctAnswer = 0;

  if (diff === 'EASY') {
    // Addition scaling:
    // Level 1-3: sums up to 12
    // Level 4-7: sums up to 25
    // Level 8+: sums up to 50
    const maxA = level <= 3 ? 6 : level <= 7 ? 12 : 25;
    const num1 = Math.floor(Math.random() * maxA) + 2;
    const num2 = Math.floor(Math.random() * maxA) + 2;
    const target = num1 + num2;
    equation = `${num1} + ❓ = ${target}`;
    correctAnswer = num2;
  } else if (diff === 'MEDIUM') {
    // Subtraction scaling:
    const base = level <= 4 ? 20 : 40;
    const num2 = Math.floor(Math.random() * (base / 2)) + 3;
    const num1 = num2 + Math.floor(Math.random() * (base / 2)) + 5;
    const target = num1 - num2;
    equation = `${num1} - ❓ = ${target}`;
    correctAnswer = num2;
  } else {
    // Multiplication / multi-step scaling:
    const factorMax = level <= 4 ? 6 : 9;
    const num1 = Math.floor(Math.random() * (factorMax - 2)) + 2;
    const num2 = Math.floor(Math.random() * (factorMax - 2)) + 2;
    const target = num1 * num2;
    equation = `${num1} × ❓ = ${target}`;
    correctAnswer = num2;
  }

  // Generate 4 unique options guaranteed to contain correct answer
  const optSet = new Set<number>([correctAnswer]);
  const offsets = [2, -1, 3, -2, 4, 1, 5, -3, 6, -4];
  for (const off of offsets) {
    if (optSet.size >= 4) break;
    const val = correctAnswer + off;
    if (val >= 0) optSet.add(val);
  }
  while (optSet.size < 4) {
    optSet.add(optSet.size + 1);
  }

  const options = Array.from(optSet).sort(() => Math.random() - 0.5);

  return {
    equation,
    options,
    correctAnswer,
  };
}

// ==========================================
// 10. SLIDING PUZZLE (8/15 Sliding Grid)
// ==========================================
export function createSlidingPuzzleGame(diff: BrainDifficulty, level: number = 1): (number | null)[] {
  const dim = diff === 'EASY' ? 3 : 4;
  const size = dim * dim;
  const board: (number | null)[] = Array.from({ length: size - 1 }, (_, i) => i + 1);
  board.push(null);

  // Progressive shuffle count:
  // Level 1-2: 6 to 10 moves (accessible intro, easily solved)
  // Level 3-5: 16 to 22 moves
  // Level 6-10: 26 to 34 moves
  // Level 11+: 40+ moves
  let numMoves = 24;
  if (diff === 'EASY') {
    numMoves = level <= 2 ? 8 : level <= 5 ? 18 : level <= 10 ? 28 : 40;
  } else {
    numMoves = level <= 3 ? 20 : level <= 7 ? 36 : 50;
  }

  // Perform random valid slides to ensure 100% solvable
  let blankIdx = size - 1;

  for (let m = 0; m < numMoves; m++) {
    const r = Math.floor(blankIdx / dim);
    const c = blankIdx % dim;
    const neighbors: number[] = [];
    if (r > 0) neighbors.push(blankIdx - dim);
    if (r < dim - 1) neighbors.push(blankIdx + dim);
    if (c > 0) neighbors.push(blankIdx - 1);
    if (c < dim - 1) neighbors.push(blankIdx + 1);

    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    board[blankIdx] = board[pick];
    board[pick] = null;
    blankIdx = pick;
  }

  return board;
}

// ==========================================
// 11. MAZE (Pathfinding Grid & Solver)
// ==========================================
export interface MazeCell {
  row: number;
  col: number;
  isWall: boolean;
  isStart: boolean;
  isExit: boolean;
}

export function createMazeGame(diff: BrainDifficulty, level: number = 1): MazeCell[][] {
  // Scale size progressively:
  // EASY: Level 1-4 = 5x5, Level 5+ = 7x7
  // MEDIUM: Level 1-4 = 7x7, Level 5+ = 9x9
  // HARD: 9x9
  let size = 5;
  if (diff === 'EASY') {
    size = level <= 4 ? 5 : 7;
  } else if (diff === 'MEDIUM') {
    size = level <= 4 ? 7 : 9;
  } else {
    size = 9;
  }

  const grid: MazeCell[][] = [];

  for (let r = 0; r < size; r++) {
    const row: MazeCell[] = [];
    for (let c = 0; c < size; c++) {
      row.push({
        row: r,
        col: c,
        isWall: true,
        isStart: r === 0 && c === 0,
        isExit: r === size - 1 && c === size - 1,
      });
    }
    grid.push(row);
  }

  // Carve clear guaranteed primary path from (0,0) to (size-1, size-1)
  let cr = 0;
  let cc = 0;
  grid[cr][cc].isWall = false;

  while (cr < size - 1 || cc < size - 1) {
    if (cr === size - 1) cc++;
    else if (cc === size - 1) cr++;
    else if (Math.random() > 0.5) cc++;
    else cr++;
    grid[cr][cc].isWall = false;
  }

  // Open structured branching pathways
  const density = level <= 3 ? 0.45 : 0.35;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].isWall && Math.random() < density) {
        grid[r][c].isWall = false;
      }
    }
  }

  // Ensure start and exit are always walkable
  grid[0][0].isWall = false;
  grid[size - 1][size - 1].isWall = false;

  return grid;
}

export function getMazeShortestPath(
  grid: MazeCell[][],
  start: { r: number; c: number },
  end: { r: number; c: number }
): { r: number; c: number }[] | null {
  const size = grid.length;
  const visited = Array(size)
    .fill(0)
    .map(() => Array(size).fill(false));

  const queue: { r: number; c: number; path: { r: number; c: number }[] }[] = [
    { r: start.r, c: start.c, path: [start] },
  ];
  visited[start.r][start.c] = true;

  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  while (queue.length > 0) {
    const { r, c, path } = queue.shift()!;
    if (r === end.r && c === end.c) {
      return path;
    }

    for (const d of dirs) {
      const nr = r + d.dr;
      const nc = c + d.dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !grid[nr][nc].isWall && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push({ r: nr, c: nc, path: [...path, { r: nr, c: nc }] });
      }
    }
  }

  return null;
}

// ==========================================
// 12. VISUAL DIFFERENCE (Grid Comparison)
// ==========================================
export interface VisualDiffData {
  id: string;
  gridLeft: string[][];
  gridRight: string[][];
  differences: { row: number; col: number }[];
}

export function createVisualDiffGame(diff: BrainDifficulty, level: number = 1): VisualDiffData {
  if (diff === 'EASY') {
    // 3x3 grids with 2 differences
    // Multiple themes based on level
    const themeIdx = (level - 1) % 3;
    if (themeIdx === 0) {
      // Fruits theme (Preserved baseline)
      const baseGrid = [
        ['🍎', '🍌', '🍇'],
        ['🍊', '🍓', '🍍'],
        ['🍉', '🍑', '🍒'],
      ];
      const gridRight = baseGrid.map((row) => [...row]);
      const diffs = [
        { row: 0, col: 1 },
        { row: 2, col: 2 },
      ];
      diffs.forEach((d) => {
        gridRight[d.row][d.col] = '🥭';
      });
      return { id: `diff_fruits_lvl${level}`, gridLeft: baseGrid, gridRight, differences: diffs };
    } else if (themeIdx === 1) {
      // Ocean / Sky theme
      const baseGrid = [
        ['🐟', '🐬', '🐳'],
        ['🦀', '🐙', '🐚'],
        ['⛵', '🌊', '🌴'],
      ];
      const gridRight = baseGrid.map((row) => [...row]);
      const diffs = [
        { row: 0, col: 2 },
        { row: 1, col: 0 },
      ];
      gridRight[0][2] = '🦈';
      gridRight[1][0] = '🦞';
      return { id: `diff_ocean_lvl${level}`, gridLeft: baseGrid, gridRight, differences: diffs };
    } else {
      // Garden / Nature theme
      const baseGrid = [
        ['🌻', '🌺', '🌸'],
        ['🐝', '🦋', '🐞'],
        ['🌿', '🌾', '🌱'],
      ];
      const gridRight = baseGrid.map((row) => [...row]);
      const diffs = [
        { row: 1, col: 1 },
        { row: 2, col: 0 },
      ];
      gridRight[1][1] = '🦗';
      gridRight[2][0] = '🍀';
      return { id: `diff_garden_lvl${level}`, gridLeft: baseGrid, gridRight, differences: diffs };
    }
  } else if (diff === 'MEDIUM') {
    // 3x3 classroom items with 3 differences
    const baseGrid = [
      ['✏️', '📏', '📎'],
      ['✂️', '🎨', '📐'],
      ['📓', '🎒', '🖋️'],
    ];
    const gridRight = baseGrid.map((row) => [...row]);
    const diffs = [
      { row: 0, col: 2 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
    ];
    gridRight[0][2] = '📌';
    gridRight[1][1] = '🖌️';
    gridRight[2][0] = '📚';

    return {
      id: `diff_classroom_lvl${level}`,
      gridLeft: baseGrid,
      gridRight,
      differences: diffs,
    };
  } else {
    // 4x4 with 4 differences
    const baseGrid = [
      ['📼', '📻', '🕹️', '🍬'],
      ['🪁', '🏏', '🛵', '🎟️'],
      ['🃏', '🎲', '⛵', '⏰'],
      ['📷', '📺', '🧮', '🎈'],
    ];
    const gridRight = baseGrid.map((row) => [...row]);
    const diffs = [
      { row: 0, col: 3 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 0 },
    ];
    gridRight[0][3] = '🍫';
    gridRight[1][1] = '⚽';
    gridRight[2][2] = '🚤';
    gridRight[3][0] = '📹';

    return {
      id: `diff_toys_4x4_lvl${level}`,
      gridLeft: baseGrid,
      gridRight,
      differences: diffs,
    };
  }
}
