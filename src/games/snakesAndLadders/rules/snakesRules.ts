import { BoardSpecialSquare } from '../types/snakes.types';

export const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

export const SNAKES: Record<number, number> = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};

export function getSpecialSquare(position: number): BoardSpecialSquare | null {
  if (LADDERS[position]) {
    return { type: 'LADDER', from: position, to: LADDERS[position] };
  }
  if (SNAKES[position]) {
    return { type: 'SNAKE', from: position, to: SNAKES[position] };
  }
  return null;
}

/**
 * Calculates (row, col) 0-indexed coordinates on a 10x10 zig-zag board
 * Row 0 = Bottom (1-10 left-to-right)
 * Row 1 = (11-20 right-to-left)
 * Row 9 = Top (91-100 left-to-right or right-to-left)
 */
export function getSquareGridCoords(squareNum: number): { row: number; col: number } {
  if (squareNum <= 0) return { row: 0, col: 0 };
  const zeroBased = Math.min(99, Math.max(0, squareNum - 1));
  const row = Math.floor(zeroBased / 10);
  let col = zeroBased % 10;
  if (row % 2 === 1) {
    col = 9 - col; // Reverse column direction on odd rows (zig-zag)
  }
  return { row, col };
}

/**
 * Calculates pixel center coordinate for any square on the 10x10 board.
 * In screen space, (0,0) is top-left, so row 9 (top of board) renders at y=0,
 * and row 0 (bottom of board) renders at y=9 * cellSize.
 */
export function getSquarePixelCenter(
  squareNum: number,
  cellSize: number
): { x: number; y: number } {
  const { row, col } = getSquareGridCoords(squareNum);
  const visualRow = 9 - row; // Row 0 is at bottom, Row 9 is at top
  const x = col * cellSize + cellSize / 2;
  const y = visualRow * cellSize + cellSize / 2;
  return { x, y };
}

/**
 * Calculates exact midpoint-anchored transform for a wooden ladder.
 * Positioning at (midX - length/2, midY - thickness/2) and rotating around
 * the component center guarantees zero drift from the target square centers.
 */
export function getLadderTransform(
  from: number,
  to: number,
  cellSize: number,
  thickness: number = 18
): {
  start: { x: number; y: number };
  end: { x: number; y: number };
  midX: number;
  midY: number;
  left: number;
  top: number;
  length: number;
  angleDeg: number;
} {
  const start = getSquarePixelCenter(from, cellSize);
  const end = getSquarePixelCenter(to, cellSize);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = angleRad * (180 / Math.PI);

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  return {
    start,
    end,
    midX,
    midY,
    left: midX - length / 2,
    top: midY - thickness / 2,
    length,
    angleDeg,
  };
}

/**
 * Calculates exact geometry and segment points for a snake from head to tail.
 */
export function getSnakeGeometry(
  headSq: number,
  tailSq: number,
  cellSize: number
): {
  headPos: { x: number; y: number };
  tailPos: { x: number; y: number };
  length: number;
  angleDeg: number;
  angleRad: number;
  dx: number;
  dy: number;
} {
  const headPos = getSquarePixelCenter(headSq, cellSize);
  const tailPos = getSquarePixelCenter(tailSq, cellSize);
  const dx = tailPos.x - headPos.x;
  const dy = tailPos.y - headPos.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = angleRad * (180 / Math.PI);

  return {
    headPos,
    tailPos,
    length,
    angleDeg,
    angleRad,
    dx,
    dy,
  };
}

/**
 * Calculates smooth continuous curve segment coordinates for a snake from head to tail.
 * Uses a zero-boundary envelope tapering at head (t=0) and tail (t=1) so the snake
 * anchors strictly on target square centers and never drifts into adjacent squares.
 */
export function getSnakeCurvePoints(
  headSq: number,
  tailSq: number,
  cellSize: number,
  numSegments: number = 36
): Array<{ x: number; y: number; t: number; radius: number }> {
  const geom = getSnakeGeometry(headSq, tailSq, cellSize);
  const headRadius = Math.max(7, Math.min(10, cellSize * 0.24));
  const tailRadius = Math.max(2.5, cellSize * 0.08);

  const nx = -Math.sin(geom.angleRad);
  const ny = Math.cos(geom.angleRad);

  const maxAmplitude = Math.min(cellSize * 0.16, geom.length * 0.045);
  const waveFreq = 1.0;

  const points: Array<{ x: number; y: number; t: number; radius: number }> = [];

  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const envelope = Math.pow(Math.sin(t * Math.PI), 1.8);
    const wave = Math.sin(t * Math.PI * 2 * waveFreq) * maxAmplitude * envelope;

    const px = geom.headPos.x + t * geom.dx + nx * wave;
    const py = geom.headPos.y + t * geom.dy + ny * wave;
    const radius = Math.max(tailRadius, headRadius * 0.85 - t * (headRadius * 0.85 - tailRadius));

    points.push({ x: px, y: py, t, radius });
  }

  return points;
}
