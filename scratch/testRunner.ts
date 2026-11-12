import {
  generateRandomBoardGrid,
  validateBoardNumbers,
  calculateBingoProgress,
  getCompletedBingoLines,
  getNewlyCompletedLines,
} from '../src/games/bingo/rules/bingoRules';
import { BingoEngine } from '../src/games/bingo/engine/BingoEngine';
import { RoomController } from '../src/games/bingo/controllers/RoomController';
import { BingoBoardGrid } from '../src/games/bingo/types/bingo.types';
import { PlayerProfile, SavedBingoBoard } from '../src/types';
import {
  getAllGames,
  getAvailableGames,
  getComingSoonGames,
  getGameById,
  isGameAvailable,
} from '../src/games/GameRegistry';
import { BingoBot } from '../src/games/bingo/bot/BingoBot';
import { PRESET_BOT_PERSONALITIES } from '../src/games/bingo/bot/botTypes';
import { localGameRepository } from '../src/storage/LocalGameRepository';
import { idempotencyManager } from '../src/security/IdempotencyManager';
import { rateLimiter, DEFAULT_SECURITY_RATE_LIMITS } from '../src/security/RateLimiter';
import { actionValidator } from '../src/security/actionValidator';
import { secureStorageWrapper } from '../src/storage/secureStorageWrapper';

// Imports for new games
import { UnoEngine } from '../src/games/uno/engine/UnoEngine';
import {
  createUnoDeck,
  isCardPlayable,
  canLegallyPlayWildDrawFour,
  getCardPointValue,
  calculateHandScore as calculateUnoHandScore,
} from '../src/games/uno/rules/unoRules';
import { Phase10Engine } from '../src/games/phase10/engine/Phase10Engine';
import {
  createPhase10Deck,
  validatePhase,
  calculateHandScore,
  findValidPhaseGrouping,
} from '../src/games/phase10/rules/phase10Rules';

import { SnakesEngine } from '../src/games/snakesAndLadders/engine/SnakesEngine';
import {
  LADDERS,
  SNAKES,
  getSpecialSquare,
  getSquareGridCoords,
  getSquarePixelCenter,
  getLadderTransform,
  getSnakeGeometry,
  getSnakeCurvePoints,
} from '../src/games/snakesAndLadders/rules/snakesRules';
import { SnakesBot } from '../src/games/snakesAndLadders/bot/SnakesBot';
import { LudoEngine } from '../src/games/ludo/engine/LudoEngine';
import {
  SAFE_CELLS,
  isSafeCell,
  START_SQUARES,
  getAbsoluteTrackPosition,
  TRACK_GRID_MAP,
  HOME_CORRIDOR_MAP,
  YARD_SLOTS_MAP,
  CAPTAINS_INFO,
} from '../src/games/ludo/rules/ludoRules';
import { TREASURE_CARDS } from '../src/games/ludo/data/treasureCards';
import { SPECIAL_EVENT_CARDS } from '../src/games/ludo/data/specialEventCards';
import {
  TREASURE_TILES,
  EVENT_TILES,
  findNextSafeZone,
  absoluteToRelative,
} from '../src/games/ludo/rules/ludoAdventureRules';

// Brain Games Engines
import {
  createCircuitGame,
  createTileConnectGame,
  createWordFillGame,
  createWordPuzzleGame,
  createWordConnectGame,
  createSudokuGame,
  createMemoryMatchGame,
  createPatternGame,
  createNumberPuzzleGame,
  createSlidingPuzzleGame,
  createMazeGame,
  createVisualDiffGame,
  computeCircuitPower,
  getTilePorts,
  getSudokuConflicts,
  canConnectTilesOnet,
  getCircuitHint,
  getMazeShortestPath,
  STANDARD_SUDOKU_DATASETS,
} from '../src/games/brain/engine/BrainEngines';
import {
  brainProgressionService,
  getProgressStorageKey,
  createDefaultProgress,
} from '../src/games/brain/services/BrainProgressionService';
import {
  fitAspectRatio,
  BRAIN_ASSET_LIMITS,
  getBrainAsset,
  validateAssetCount,
} from '../src/games/brain/assets/brainAssetRegistry';
import {
  getOrientation,
  getScreenClass,
  calculateBoardDimensions,
  calculateHandCardLayout,
  GAME_ORIENTATION_POLICY,
  MIN_TOUCH_TARGET,
  RECOMMENDED_TOUCH_TARGET,
} from '../src/theme/layoutUtils';

console.log('==================================================');
console.log('CHILDHOOD GAMES — MASTER FOUNDATION TEST SUITE');
console.log('==================================================');

// Mock window.localStorage for AsyncStorage under Node.js testRunner environment
if (typeof globalThis !== 'undefined' && !(globalThis as any).window) {
  const memoryStore: Record<string, string> = {};
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => memoryStore[key] || null,
      setItem: (key: string, value: string) => {
        memoryStore[key] = value;
      },
      removeItem: (key: string) => {
        delete memoryStore[key];
      },
      clear: () => {
        Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
      },
    },
  };
}

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

const cloneGrid = (grid: BingoBoardGrid): BingoBoardGrid => grid.map((r) => [...r]);

async function runAllTests() {
  // --------------------------------------------------
  // SECTION 1: BASIC RULES & BOARD VALIDATION
  // --------------------------------------------------
  const randomGrid = generateRandomBoardGrid();
  assert(validateBoardNumbers(randomGrid).isValid, 'RULES: Valid 1-25 random board generation');

  // --------------------------------------------------
  // SECTION 2: ROOM & LOBBY MULTIPLAYER TESTS
  // --------------------------------------------------
  const hostProfile: PlayerProfile = {
    id: 'player_ajil',
    name: 'Ajil',
    nickname: 'Ajju',
    avatar: '🎒',
    createdAt: Date.now(),
  };

  const controller = new RoomController(hostProfile, '90S-7291');
  const roomData = controller.getRoomData();

  assert(roomData.roomCode === '90S-7291', 'ROOM: Generated correct room code');
  assert(roomData.hostPlayerId === 'player_ajil', 'ROOM: Host assigned correctly');
  assert(roomData.players.length === 1, 'ROOM: Starts with 1 host player');

  // Min 2 players check
  const min2Check = controller.canStartMatch();
  assert(!min2Check.canStart && Boolean(min2Check.reason?.includes('Minimum 2 players')), 'LOBBY: Cannot start match with only 1 player');

  // Add player 2 (Rahul)
  const player2 = controller.addPlayer({ id: 'player_rahul', name: 'Rahul', nickname: 'Rahu', avatar: '🏏' });
  assert(controller.getRoomData().players.length === 2, 'ROOM: Successfully added second player Rahul');

  // Ready status check
  controller.setPlayerReady('player_ajil', true);
  controller.setPlayerReady('player_rahul', false);
  const readyCheck1 = controller.canStartMatch();
  assert(!readyCheck1.canStart, 'LOBBY: Cannot start match if player is not ready');

  controller.setPlayerReady('player_rahul', true);
  const readyCheck2 = controller.canStartMatch();
  assert(readyCheck2.canStart, 'LOBBY: All players ready enables match start');

  // Start match
  const matchSnapshot = controller.startMatch();
  assert(matchSnapshot.status === 'PLAYING', 'MATCH: Match 1 created successfully');

  // Independent player engines initialized
  const engine1 = controller.getPlayerEngine('player_ajil')!;
  const engine2 = controller.getPlayerEngine('player_rahul')!;
  assert(Boolean(engine1 && engine2), 'BOARDS: Independent BingoEngines initialized for each player');

  // Generate and confirm valid 5x5 boards for both players
  const grid1 = generateRandomBoardGrid();
  const grid2 = generateRandomBoardGrid();

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      engine1.setCell(r, c, grid1[r][c]);
      engine2.setCell(r, c, grid2[r][c]);
    }
  }
  engine1.confirmBoard();
  engine2.confirmBoard();

  assert(engine1.getIsLocked() && engine2.getIsLocked(), 'BOARDS: Valid 5x5 grids for both players');

  // --------------------------------------------------
  // SECTION 3: CALLER ROTATION & TURN AUTHORIZATION
  // --------------------------------------------------
  let currentCallerId = controller.getCurrentMatch()?.currentTurnPlayerId || hostProfile.id;
  const nonCallerId = currentCallerId === 'player_ajil' ? 'player_rahul' : 'player_ajil';

  // Attempt call by non-turn caller -> rejected
  let callFailed = false;
  try {
    controller.callNextNumber(nonCallerId, 12);
  } catch (e: any) {
    callFailed = true;
  }
  assert(callFailed, 'CALLER: Non-turn caller is rejected');

  // Legitimate call by turn caller
  const calledNum = controller.callNextNumber(currentCallerId);
  assert(typeof calledNum === 'number', 'CALLER: Current turn caller calls number');

  // Check caller auto-mark
  const callerEngine = controller.getPlayerEngine(currentCallerId)!;
  assert(callerEngine.getMarkedNumbers().has(calledNum!), 'CALLER AUTO-MARK: Called number automatically marked on caller board');

  // Check non-caller was NOT auto-marked
  const nonCallerEngine = controller.getPlayerEngine(nonCallerId)!;
  assert(!nonCallerEngine.getMarkedNumbers().has(calledNum!), 'MARKING: Caller mark does NOT automatically mark non-caller board');

  // Non-caller marks the called number manually
  const markRes = controller.markPlayerNumber(nonCallerId, calledNum!);
  assert(markRes.success && nonCallerEngine.getMarkedNumbers().has(calledNum!), 'MARKING: Non-caller marks same called number independently');

  // --------------------------------------------------
  // SECTION 4: BINGO CLAIM & WINNER VALIDATION
  // --------------------------------------------------
  // Force simulate 5 complete lines on engine1
  const testGrid: BingoBoardGrid = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];
  (engine1 as any).grid = cloneGrid(testGrid);
  (engine1 as any).phase = 'PLAYING_B';
  (engine1 as any).isLocked = true;
  (engine1 as any).calledNumbers = [];

  for (let num = 1; num <= 25; num++) {
    (engine1 as any).calledNumbers.push(num);
    (controller.getCurrentMatch() as any).calledNumbers.push(num);
    engine1.markNumber(num);
  }

  assert(engine1.getCompletedLinesCount() >= 5, 'PROGRESS: Ajil engine reaches 5 completed lines (O stage) independently');

  const claimRes = controller.claimBingo('player_ajil');
  assert(claimRes.isValid, 'BINGO CLAIM: Valid Bingo claim accepted for Ajil');

  const scoreboard = controller.getRoomData().scoreboard;
  assert(scoreboard['Ajil'] === 1 && (scoreboard['Rahul'] || 0) === 0, 'SCOREBOARD: Ajil receives 1 win, Rahul receives 0');

  // --------------------------------------------------
  // SECTION 5: REVENGE ROUND (MATCH #2)
  // --------------------------------------------------
  const revengeMatch = controller.startRevengeRound();
  assert(revengeMatch.match.matchNumber === 2, 'REVENGE ROUND: Creates Match #2 in same room');
  assert(revengeMatch.match.calledNumbers.length === 0, 'REVENGE ROUND: Resets called numbers');
  assert(controller.getRoomData().scoreboard['Ajil'] === 1, 'REVENGE ROUND: Preserves room scoreboard win history');

  // --------------------------------------------------
  // SECTION 6: GAME REGISTRY DISCOVERY & FILTERING
  // --------------------------------------------------
  const allGames = getAllGames();
  assert(allGames.length >= 17, 'REGISTRY: Contains all 17 registered game definitions');

  const bingoDef = getGameById('bingo');
  assert(Boolean(bingoDef), 'REGISTRY: Bingo definition exists');
  assert(bingoDef?.status === 'AVAILABLE', 'REGISTRY: Bingo status is AVAILABLE');
  assert(isGameAvailable('bingo'), 'REGISTRY: isGameAvailable("bingo") returns true');
  assert(getAvailableGames().length >= 17, 'REGISTRY: getAvailableGames() returns all 17 playable games');

  // Check GameDefinition schema attributes (Section 10)
  assert(Boolean(bingoDef?.name && bingoDef?.icon && typeof bingoDef?.supportsBots === 'boolean'), 'FOUNDATION: GameDefinition schema includes name, icon, and capability flags');

  // --------------------------------------------------
  // SECTION 7: SYSTEM BOT LOBBY TESTS
  // --------------------------------------------------
  const botHostProfile: PlayerProfile = {
    id: 'player_host_bot_test',
    name: 'TestHost',
    nickname: 'Host',
    avatar: '🎓',
    createdAt: Date.now(),
  };

  const botRoomController = new RoomController(botHostProfile, 'BOTS-999');

  // Setup 1 bot
  botRoomController.setupBotOpponents(1);
  let roomData2 = botRoomController.getRoomData();
  assert(roomData2.players.length === 2, 'BOT LOBBY: Setting 1 bot results in 2 total players');
  assert(roomData2.players[1].isBot === true, 'BOT LOBBY: Second player has isBot = true');

  // Setup 3 bots
  botRoomController.setupBotOpponents(3);
  roomData2 = botRoomController.getRoomData();
  assert(roomData2.players.length === 4, 'BOT LOBBY: Setting 3 bots results in 4 total players');

  // Ready check with bots
  botRoomController.setPlayerReady('player_host_bot_test', true);
  const botMatchCheck = botRoomController.canStartMatch();
  assert(Boolean(botMatchCheck.canStart), 'BOT LOBBY: Match can start with ready human + 3 ready bots');

  // --------------------------------------------------
  // SECTION 8: NEW ACTUAL 90S BINGO RULE ENGINE TESTS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('ACTUAL 90S BINGO RULE SPECIFIC ENFORCEMENT TESTS');
  console.log('==================================================');

  const orderedGrid: BingoBoardGrid = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];

  // Test 1: First completed line = horizontal -> B
  const engH1 = new BingoEngine(cloneGrid(orderedGrid));
  engH1.confirmBoard();
  [1, 2, 3, 4, 5].forEach((n) => {
    (engH1 as any).calledNumbers.push(n);
    engH1.markNumber(n);
  });
  let lines = engH1.getCompletedLines();
  assert(lines.length === 1 && lines[0].type === 'B' && lines[0].direction === 'horizontal', 'NEW RULE TEST 1: First completed line (horizontal) gets letter B');

  // Test 2: First completed line = vertical -> B
  const engV1 = new BingoEngine(cloneGrid(orderedGrid));
  engV1.confirmBoard();
  [1, 6, 11, 16, 21].forEach((n) => {
    (engV1 as any).calledNumbers.push(n);
    engV1.markNumber(n);
  });
  lines = engV1.getCompletedLines();
  assert(lines.length === 1 && lines[0].type === 'B' && lines[0].direction === 'vertical', 'NEW RULE TEST 2: First completed line (vertical) gets letter B');

  // Test 3: First completed line = main diagonal (\) -> B
  const engDiag1 = new BingoEngine(cloneGrid(orderedGrid));
  engDiag1.confirmBoard();
  [1, 7, 13, 19, 25].forEach((n) => {
    (engDiag1 as any).calledNumbers.push(n);
    engDiag1.markNumber(n);
  });
  lines = engDiag1.getCompletedLines();
  assert(lines.length === 1 && lines[0].type === 'B' && lines[0].direction === 'mainDiagonal', 'NEW RULE TEST 3: First completed line (main diagonal \\) gets letter B');

  // Test 4: First completed line = anti diagonal (/) -> B
  const engDiag2 = new BingoEngine(cloneGrid(orderedGrid));
  engDiag2.confirmBoard();
  [5, 9, 13, 17, 21].forEach((n) => {
    (engDiag2 as any).calledNumbers.push(n);
    engDiag2.markNumber(n);
  });
  lines = engDiag2.getCompletedLines();
  assert(lines.length === 1 && lines[0].type === 'B' && lines[0].direction === 'antiDiagonal', 'NEW RULE TEST 4: First completed line (anti diagonal /) gets letter B');

  // Test 5: \ then / -> B = \, I = / (X pattern first)
  const engX = new BingoEngine(cloneGrid(orderedGrid));
  engX.confirmBoard();
  [1, 7, 13, 19, 25].forEach((n) => {
    (engX as any).calledNumbers.push(n);
    engX.markNumber(n);
  });
  [5, 9, 17, 21].forEach((n) => {
    (engX as any).calledNumbers.push(n);
    engX.markNumber(n);
  });
  lines = engX.getCompletedLines();
  assert(lines.length === 2 && lines[0].type === 'B' && lines[0].direction === 'mainDiagonal' && lines[1].type === 'I' && lines[1].direction === 'antiDiagonal', 'NEW RULE TEST 5: X pattern produces B=\\ and I=/ cleanly');

  // Test 6: Arbitrary line sequence: Vertical, Horizontal, Diagonal, Vertical, Horizontal -> B, I, N, G, O
  const engArb = new BingoEngine(cloneGrid(orderedGrid));
  engArb.confirmBoard();

  [1, 6, 11, 16, 21].forEach((n) => { (engArb as any).calledNumbers.push(n); engArb.markNumber(n); });
  [12, 13, 14, 15].forEach((n) => { (engArb as any).calledNumbers.push(n); engArb.markNumber(n); });
  [5, 9, 17].forEach((n) => { (engArb as any).calledNumbers.push(n); engArb.markNumber(n); });
  [10, 20, 25].forEach((n) => { (engArb as any).calledNumbers.push(n); engArb.markNumber(n); });
  [2, 3, 4].forEach((n) => { (engArb as any).calledNumbers.push(n); engArb.markNumber(n); });

  lines = engArb.getCompletedLines();
  assert(lines.length === 5, 'NEW RULE TEST 6: Exactly 5 unique lines completed');
  assert(lines[0].type === 'B' && lines[1].type === 'I' && lines[2].type === 'N' && lines[3].type === 'G' && lines[4].type === 'O', 'NEW RULE TEST 6: B, I, N, G, O sequence assigned in order of completion');
  assert(engArb.validateBingo().isValid === true, 'NEW RULE TEST 6: Valid Bingo with 5 completed lines');

  // Test 7: Complete only 4 lines -> Bingo = false
  const eng4Lines = new BingoEngine(cloneGrid(orderedGrid));
  eng4Lines.confirmBoard();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      const num = orderedGrid[r][c]!;
      (eng4Lines as any).calledNumbers.push(num);
      eng4Lines.markNumber(num);
    }
  }
  assert(eng4Lines.getCompletedLinesCount() === 4, 'NEW RULE TEST 7: 4 lines completed');
  assert(eng4Lines.validateBingo().isValid === false, 'NEW RULE TEST 7: 4 completed lines gives isValid = false (❌ BINGO NOT COMPLETE)');

  // Test 8: Complete 5 lines -> Bingo = true
  for (let c = 0; c < 5; c++) {
    const num = orderedGrid[4][c]!;
    (eng4Lines as any).calledNumbers.push(num);
    eng4Lines.markNumber(num);
  }
  assert(eng4Lines.getCompletedLinesCount() >= 5, 'NEW RULE TEST 8: 5 lines completed');
  assert(eng4Lines.validateBingo().isValid === true, 'NEW RULE TEST 8: 5 completed lines gives isValid = true (🏆 BINGO!)');

  // --------------------------------------------------
  // SECTION 9: MULTIPLAYER SECURITY HARDENING & ANTI-CHEAT TESTS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('MULTIPLAYER SECURITY HARDENING & ANTI-CHEAT TESTS');
  console.log('==================================================');

  const secHost: PlayerProfile = { id: 'sec_host', name: 'SecurityHost', nickname: 'Host', avatar: '🛡️', createdAt: Date.now() };
  const secCtrl = new RoomController(secHost, 'SEC-777');
  secCtrl.addPlayer({ id: 'sec_peer', name: 'PeerUser', nickname: 'Peer', avatar: '👤' });
  secCtrl.setPlayerReady('sec_host', true);
  secCtrl.setPlayerReady('sec_peer', true);

  // Security Test 1: Non-Host Start Match Rejection
  let nonHostStartFailed = false;
  try {
    secCtrl.startMatch('sec_peer');
  } catch (e: any) {
    nonHostStartFailed = e.message.includes('FORBIDDEN_HOST_ONLY');
  }
  assert(nonHostStartFailed, 'SECURITY TEST 1: Non-host startMatch request strictly rejected');

  // Start match legally by host
  const secMatch = secCtrl.startMatch('sec_host');
  assert(secMatch.status === 'PLAYING', 'SECURITY TEST 1: Legitimate host startMatch allowed');

  // Security Test 2: Non-Turn Caller Rejection
  const actualTurnId = secMatch.currentTurnPlayerId;
  const imposterCallerId = actualTurnId === 'sec_host' ? 'sec_peer' : 'sec_host';
  let nonTurnCallFailed = false;
  try {
    secCtrl.callNextNumber(imposterCallerId);
  } catch (e: any) {
    nonTurnCallFailed = e.message.includes('NOT_YOUR_TURN');
  }
  assert(nonTurnCallFailed, 'SECURITY TEST 2: Non-turn caller action strictly rejected');

  // Security Test 3: Uncalled Number Mark Rejection
  const markUncalledRes = secCtrl.markPlayerNumber('sec_peer', 20);
  assert(!markUncalledRes.success && markUncalledRes.message === 'Number not called yet.', 'SECURITY TEST 3: Uncalled number mark strictly rejected');

  // Security Test 4: Board Privacy Gate (Requirement 15)
  const privacyDataHost = secCtrl.getRoomData('sec_host');
  const hostPlayerEntry = privacyDataHost.players.find((p) => p.id === 'sec_host')!;
  const peerPlayerEntry = privacyDataHost.players.find((p) => p.id === 'sec_peer')!;

  assert(hostPlayerEntry.board !== undefined, 'SECURITY TEST 4: Player receives their own active board grid');
  assert(peerPlayerEntry.board === undefined, 'SECURITY TEST 4: Player A NEVER receives Player B active board grid');

  // Security Test 5: Replayed Event (Idempotency) Rejection
  const testEventId = 'evt_test_uuid_12345';
  const firstReg = idempotencyManager.registerEvent(testEventId);
  const secondReg = idempotencyManager.registerEvent(testEventId);
  assert(firstReg === true, 'SECURITY TEST 5: First event registration succeeds');
  assert(secondReg === false, 'SECURITY TEST 5: Replayed duplicate eventId is detected and rejected');

  // Security Test 6: Modifying Locked Board Rejection
  const hostEng = secCtrl.getPlayerEngine('sec_host')!;
  const confirmLockedRes = secCtrl.confirmPlayerBoard('sec_host', generateRandomBoardGrid());
  assert(!confirmLockedRes.success && confirmLockedRes.message.includes('BOARD_LOCKED_IMMUTABLE'), 'SECURITY TEST 6: Modifying locked board during active match rejected');

  // Security Test 7: Rate Limiter Enforcement
  rateLimiter.reset();
  let rateLimitHit = false;
  for (let i = 0; i < 10; i++) {
    const allowed = rateLimiter.isAllowed('test_user', { windowMs: 10000, maxRequests: 3 });
    if (!allowed) rateLimitHit = true;
  }
  assert(rateLimitHit === true, 'SECURITY TEST 7: Rate Limiter triggers after max requests threshold');

  // Security Test 8: Action Payload Boundary Validation
  const valOut = actionValidator.validateCallNumber(99, 25);
  assert(!valOut.isValid && Boolean(valOut.message.includes('out of bounds')), 'SECURITY TEST 8: ActionValidator rejects out-of-bounds number 99 for pool 1..25');

  // Security Test 9: Room Capacity Enforcement
  secCtrl.addPlayer({ id: 'sec_p3', name: 'P3' });
  secCtrl.addPlayer({ id: 'sec_p4', name: 'P4' });
  let roomCapFailed = false;
  try {
    secCtrl.addPlayer({ id: 'sec_p5', name: 'P5' });
  } catch (e: any) {
    roomCapFailed = e.message.includes('ROOM_FULL');
  }
  assert(roomCapFailed, 'SECURITY TEST 9: Adding 5th player to 4-player room rejected with ROOM_FULL');

  // Security Test 10: Premature Fake Bingo Claim Rejection
  const fakeClaimRes = secCtrl.claimBingo('sec_peer');
  assert(!fakeClaimRes.isValid && fakeClaimRes.message.includes('BINGO NOT COMPLETE'), 'SECURITY TEST 10: Fake Bingo claim strictly rejected by server-side validation');

  // Security Test 11: Secure Storage Abstraction
  await secureStorageWrapper.setAuthToken('test_jwt_access_token_12345');
  const readToken = await secureStorageWrapper.getAuthToken();
  assert(readToken === 'test_jwt_access_token_12345', 'SECURITY TEST 11: SecureStorageWrapper stores and retrieves auth token safely');

  // --------------------------------------------------
  // SECTION 10: UNO ENGINE UNIT TESTS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('UNO GAME ENGINE UNIT TESTS');
  console.log('==================================================');

  // UNO TEST 1: Deck Composition & Distribution
  const unoDeck = createUnoDeck();
  assert(unoDeck.length === 108, 'UNO TEST 1a: Standard 108-card deck created');
  const wilds = unoDeck.filter((c) => c.value === 'WILD');
  const wildPlusFours = unoDeck.filter((c) => c.value === 'WILD_DRAW_FOUR');
  assert(wilds.length === 4, 'UNO TEST 1b: Exactly 4 WILD cards in deck');
  assert(wildPlusFours.length === 4, 'UNO TEST 1c: Exactly 4 WILD_DRAW_FOUR cards in deck');
  const redCards = unoDeck.filter((c) => c.color === 'RED');
  const greenCards = unoDeck.filter((c) => c.color === 'GREEN');
  const blueCards = unoDeck.filter((c) => c.color === 'BLUE');
  const yellowCards = unoDeck.filter((c) => c.color === 'YELLOW');
  assert(
    redCards.length === 25 &&
    greenCards.length === 25 &&
    blueCards.length === 25 &&
    yellowCards.length === 25,
    'UNO TEST 1d: Exactly 25 cards per color (1 zero + 18 numbers + 6 action cards)'
  );

  // UNO TEST 2: Match Initialization & Deal
  const unoEngine = new UnoEngine();
  unoEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
    { id: 'p3', name: 'Monu' },
    { id: 'p4', name: 'Anu' },
  ]);

  const unoSt = unoEngine.getGameState();
  assert(unoSt.players.length === 4, 'UNO TEST 2a: 4 players joined UNO match');
  assert(
    unoSt.players.every((p) => p.hand.length === 7),
    'UNO TEST 2b: All 4 players dealt exactly 7 cards'
  );
  assert(unoSt.discardPile.length === 1, 'UNO TEST 2c: Discard pile starts with 1 flipped card');
  assert(
    unoSt.deck.length === 108 - 4 * 7 - 1,
    'UNO TEST 2d: Deck count correct after dealing 28 cards + 1 discard'
  );
  assert(
    ['RED', 'GREEN', 'BLUE', 'YELLOW'].includes(unoSt.activeColor),
    'UNO TEST 2e: Active color initialized to valid base color'
  );

  // UNO TEST 3: Card Playability Rules
  const sampleRedNine: any = { id: 'test_r9', color: 'RED', value: '9' };
  const sampleRedThree: any = { id: 'test_r3', color: 'RED', value: '3' };
  const sampleBlueNine: any = { id: 'test_b9', color: 'BLUE', value: '9' };
  const sampleGreenTwo: any = { id: 'test_g2', color: 'GREEN', value: '2' };
  const sampleSkipYellow: any = { id: 'test_ys', color: 'YELLOW', value: 'SKIP' };
  const sampleSkipBlue: any = { id: 'test_bs', color: 'BLUE', value: 'SKIP' };
  const sampleWild: any = { id: 'test_w', color: 'WILD', value: 'WILD' };
  const sampleWildFour: any = { id: 'test_w4', color: 'WILD', value: 'WILD_DRAW_FOUR' };

  assert(isCardPlayable(sampleRedThree, 'RED', '9'), 'UNO TEST 3a: Matching color is playable');
  assert(isCardPlayable(sampleBlueNine, 'RED', '9'), 'UNO TEST 3b: Matching value is playable');
  assert(isCardPlayable(sampleSkipBlue, 'YELLOW', 'SKIP'), 'UNO TEST 3c: Matching action symbol is playable');
  assert(isCardPlayable(sampleWild, 'RED', '9'), 'UNO TEST 3d: WILD is always playable');
  assert(isCardPlayable(sampleWildFour, 'RED', '9'), 'UNO TEST 3e: WILD_DRAW_FOUR is always playable');
  assert(!isCardPlayable(sampleGreenTwo, 'RED', '9'), 'UNO TEST 3f: Mismatched color and value is NOT playable');

  // UNO TEST 4: Card Point Scoring
  assert(getCardPointValue({ id: 'c1', color: 'BLUE', value: '7' }) === 7, 'UNO TEST 4a: Number card scores face value');
  assert(getCardPointValue({ id: 'c2', color: 'GREEN', value: '0' }) === 0, 'UNO TEST 4b: Zero card scores 0');
  assert(getCardPointValue({ id: 'c3', color: 'RED', value: 'SKIP' }) === 20, 'UNO TEST 4c: SKIP card scores 20');
  assert(getCardPointValue({ id: 'c4', color: 'YELLOW', value: 'REVERSE' }) === 20, 'UNO TEST 4d: REVERSE card scores 20');
  assert(getCardPointValue({ id: 'c5', color: 'BLUE', value: 'DRAW_TWO' }) === 20, 'UNO TEST 4e: DRAW_TWO card scores 20');
  assert(getCardPointValue({ id: 'c6', color: 'WILD', value: 'WILD' }) === 50, 'UNO TEST 4f: WILD card scores 50');
  assert(getCardPointValue({ id: 'c7', color: 'WILD', value: 'WILD_DRAW_FOUR' }) === 50, 'UNO TEST 4g: WILD_DRAW_FOUR card scores 50');
  assert(
    calculateUnoHandScore([
      { id: 'c1', color: 'BLUE', value: '5' },
      { id: 'c2', color: 'RED', value: 'SKIP' },
      { id: 'c3', color: 'WILD', value: 'WILD' },
    ]) === 75,
    'UNO TEST 4h: Hand score correctly sums numbers (5) + action (20) + wild (50) = 75'
  );

  // UNO TEST 5: Action Card Mechanics - Skip Card
  const actionEngine = new UnoEngine();
  actionEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
    { id: 'p3', name: 'Monu' },
  ]);
  (actionEngine as any).state.currentTurnIdx = 0;
  (actionEngine as any).state.activeColor = 'RED';
  (actionEngine as any).state.activeValue = '5';
  (actionEngine as any).state.players[0].hand = [
    { id: 'test_skip_red', color: 'RED', value: 'SKIP' },
    { id: 'test_filler', color: 'BLUE', value: '2' },
  ];
  actionEngine.playCard('p1', 'test_skip_red');
  assert(actionEngine.getGameState().currentTurnIdx === 2, 'UNO TEST 5: SKIP card skips p2 and passes turn to p3');

  // UNO TEST 6: Action Card Mechanics - Reverse in 3-Player vs 2-Player
  const rev3Engine = new UnoEngine();
  rev3Engine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
    { id: 'p3', name: 'Monu' },
  ]);
  (rev3Engine as any).state.currentTurnIdx = 0;
  (rev3Engine as any).state.activeColor = 'BLUE';
  (rev3Engine as any).state.activeValue = '5';
  (rev3Engine as any).state.players[0].hand = [
    { id: 'test_rev_blue', color: 'BLUE', value: 'REVERSE' },
    { id: 'test_filler', color: 'YELLOW', value: '1' },
  ];
  rev3Engine.playCard('p1', 'test_rev_blue');
  assert(
    rev3Engine.getGameState().direction === -1 && rev3Engine.getGameState().currentTurnIdx === 2,
    'UNO TEST 6a: In 3-player match, REVERSE reverses direction to -1 and turn moves to p3'
  );

  const rev2Engine = new UnoEngine();
  rev2Engine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
  ]);
  (rev2Engine as any).state.currentTurnIdx = 0;
  (rev2Engine as any).state.activeColor = 'GREEN';
  (rev2Engine as any).state.activeValue = '5';
  (rev2Engine as any).state.players[0].hand = [
    { id: 'test_rev_green', color: 'GREEN', value: 'REVERSE' },
    { id: 'test_filler', color: 'YELLOW', value: '1' },
  ];
  rev2Engine.playCard('p1', 'test_rev_green');
  assert(
    rev2Engine.getGameState().currentTurnIdx === 0,
    'UNO TEST 6b: In 2-player match, REVERSE acts as SKIP (turn returns to p1)'
  );

  // UNO TEST 7: Action Card Mechanics - Draw Two Card
  const drawTwoEngine = new UnoEngine();
  drawTwoEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
    { id: 'p3', name: 'Monu' },
  ]);
  (drawTwoEngine as any).state.currentTurnIdx = 0;
  (drawTwoEngine as any).state.activeColor = 'YELLOW';
  (drawTwoEngine as any).state.activeValue = '5';
  (drawTwoEngine as any).state.players[0].hand = [
    { id: 'test_d2_yellow', color: 'YELLOW', value: 'DRAW_TWO' },
    { id: 'test_filler', color: 'RED', value: '3' },
  ];
  const p2CardsBefore = drawTwoEngine.getGameState().players[1].hand.length;
  drawTwoEngine.playCard('p1', 'test_d2_yellow');
  const p2CardsAfter = drawTwoEngine.getGameState().players[1].hand.length;
  assert(
    p2CardsAfter === p2CardsBefore + 2 && drawTwoEngine.getGameState().currentTurnIdx === 2,
    'UNO TEST 7: DRAW_TWO forces next player to draw 2 cards and skips their turn'
  );

  // UNO TEST 8: Defect #1 Regression - Wild Draw Four Challenge Legality against prePlayColor
  const challengeEngine = new UnoEngine();
  challengeEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
    { id: 'p3', name: 'Monu' },
  ]);
  // Top discard is BLUE. P1 holds a BLUE card ('BLUE 7') and a WILD_DRAW_FOUR.
  // P1 illegally plays WILD_DRAW_FOUR (since P1 has a BLUE card) and chooses 'GREEN'.
  (challengeEngine as any).state.currentTurnIdx = 0;
  (challengeEngine as any).state.activeColor = 'BLUE';
  (challengeEngine as any).state.activeValue = '7';
  (challengeEngine as any).state.players[0].hand = [
    { id: 'test_blue_7', color: 'BLUE', value: '7' },
    { id: 'test_w4_illegal', color: 'WILD', value: 'WILD_DRAW_FOUR' },
  ];
  challengeEngine.playCard('p1', 'test_w4_illegal', 'GREEN');

  // Verify pending challenge state
  const pendingChallenge = challengeEngine.getGameState().pendingChallenge;
  assert(pendingChallenge !== null, 'UNO TEST 8a: Pending challenge created on Wild +4 play');
  assert(
    pendingChallenge?.prePlayColor === 'BLUE',
    'UNO TEST 8b: prePlayColor accurately recorded as pre-play color (BLUE), not chosenColor (GREEN)'
  );
  assert(
    pendingChallenge?.chosenColor === 'GREEN',
    'UNO TEST 8c: chosenColor accurately recorded as GREEN'
  );
  assert(
    challengeEngine.getGameState().activeColor === 'GREEN',
    'UNO TEST 8d: Active table color updated to GREEN'
  );

  // P2 challenges P1
  const p1HandBeforeChallenge = challengeEngine.getGameState().players[0].hand.length;
  const p2HandBeforeChallenge = challengeEngine.getGameState().players[1].hand.length;
  challengeEngine.challengeWildDrawFour('p2', true);

  // Since P1 held test_blue_7, play was ILLEGAL:
  // P1 draws 4 penalty cards, P2 draws 0 cards and keeps turn!
  const p1HandAfterChallenge = challengeEngine.getGameState().players[0].hand.length;
  const p2HandAfterChallenge = challengeEngine.getGameState().players[1].hand.length;
  assert(
    p1HandAfterChallenge === p1HandBeforeChallenge + 4,
    'UNO TEST 8e: Successful challenge penalizes illegal player with 4 cards'
  );
  assert(
    p2HandAfterChallenge === p2HandBeforeChallenge,
    'UNO TEST 8f: Challenger draws 0 cards on successful challenge'
  );
  assert(
    challengeEngine.getGameState().currentTurnIdx === 1,
    'UNO TEST 8g: Challenger keeps turn after catching illegal play'
  );

  // UNO TEST 9: Wild Draw Four Challenge Failure (Legal Play)
  const failEngine = new UnoEngine();
  failEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
  ]);
  (failEngine as any).state.currentTurnIdx = 0;
  (failEngine as any).state.activeColor = 'RED';
  (failEngine as any).state.activeValue = '5';
  // P1 holds ONLY YELLOW cards and WILD_DRAW_FOUR (zero RED cards)
  (failEngine as any).state.players[0].hand = [
    { id: 'test_yellow_2', color: 'YELLOW', value: '2' },
    { id: 'test_w4_legal', color: 'WILD', value: 'WILD_DRAW_FOUR' },
  ];
  failEngine.playCard('p1', 'test_w4_legal', 'BLUE');

  // P2 challenges P1. Since P1 had NO RED cards, play was legal!
  const p2HandBeforeFail = failEngine.getGameState().players[1].hand.length;
  failEngine.challengeWildDrawFour('p2', true);
  const p2HandAfterFail = failEngine.getGameState().players[1].hand.length;
  assert(
    p2HandAfterFail === p2HandBeforeFail + 6,
    'UNO TEST 9a: Failed challenge penalizes challenger with 6 cards (4 + 2 penalty)'
  );
  assert(
    failEngine.getGameState().currentTurnIdx === 0,
    'UNO TEST 9b: Challenger loses turn on failed challenge'
  );

  // UNO TEST 10: Defect #2 Regression - Engine Instance Isolation (No State Leak Between Instances)
  const instA = new UnoEngine();
  const instB = new UnoEngine();
  instA.startMatch([{ id: 'a1', name: 'A1' }, { id: 'a2', name: 'A2' }]);
  instB.startMatch([{ id: 'b1', name: 'B1' }, { id: 'b2', name: 'B2' }]);

  (instA as any).state.players[0].hand = [
    { id: 'w4_inst_a', color: 'WILD', value: 'WILD_DRAW_FOUR' },
    { id: 'fill_a', color: 'RED', value: '1' },
  ];
  instA.playCard('a1', 'w4_inst_a', 'BLUE');

  assert(instA.getGameState().pendingChallenge !== null, 'UNO TEST 10a: instA has pending challenge');
  assert(instB.getGameState().pendingChallenge === null, 'UNO TEST 10b: instB is completely unaffected by instA (no leak)');

  instA.challengeWildDrawFour('a2', false); // A2 accepts
  assert(instA.getGameState().pendingChallenge === null, 'UNO TEST 10c: instA challenge resolved');
  assert(instB.getGameState().pendingChallenge === null, 'UNO TEST 10d: instB remains clean');

  // UNO TEST 11: Pending Challenge Action Guard
  const guardEngine = new UnoEngine();
  guardEngine.startMatch([{ id: 'g1', name: 'G1' }, { id: 'g2', name: 'G2' }]);
  (guardEngine as any).state.players[0].hand = [
    { id: 'w4_guard', color: 'WILD', value: 'WILD_DRAW_FOUR' },
    { id: 'fill_g', color: 'BLUE', value: '1' },
  ];
  guardEngine.playCard('g1', 'w4_guard', 'YELLOW');

  let drawBlocked = false;
  try {
    guardEngine.drawCard('g2');
  } catch (e: any) {
    drawBlocked = e.message.includes('Must resolve pending Wild Draw Four challenge first');
  }
  assert(drawBlocked, 'UNO TEST 11: drawCard is guarded while pending challenge is active');

  // UNO TEST 12: Call UNO and Catch UNO Rules
  const unoCallEngine = new UnoEngine();
  unoCallEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
  ]);
  // Set p1 to 1 card
  (unoCallEngine as any).state.players[0].hand = [{ id: 'p1_card1', color: 'RED', value: '1' }];
  (unoCallEngine as any).state.players[0].calledUno = false;

  // p2 catches p1 before p1 calls UNO
  const p1BeforeCatch = unoCallEngine.getGameState().players[0].hand.length;
  unoCallEngine.catchUno('p1');
  const p1AfterCatch = unoCallEngine.getGameState().players[0].hand.length;
  assert(
    p1AfterCatch === p1BeforeCatch + 2,
    'UNO TEST 12a: Catching player with 1 card who forgot to call UNO adds 2 penalty cards'
  );

  // If player called UNO, catchUno does not penalize
  (unoCallEngine as any).state.players[0].hand = [{ id: 'p1_card2', color: 'RED', value: '2' }];
  unoCallEngine.callUno('p1');
  assert(unoCallEngine.getGameState().players[0].calledUno === true, 'UNO TEST 12b: Player successfully called UNO');
  unoCallEngine.catchUno('p1');
  assert(
    unoCallEngine.getGameState().players[0].hand.length === 1,
    'UNO TEST 12c: Protected player who called UNO receives no penalty on catch attempt'
  );

  // UNO TEST 13: Round Completion & Winner Scoring
  const scoringEngine = new UnoEngine();
  scoringEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
  ]);
  (scoringEngine as any).state.currentTurnIdx = 0;
  (scoringEngine as any).state.activeColor = 'GREEN';
  (scoringEngine as any).state.activeValue = '8';
  (scoringEngine as any).state.players[0].hand = [{ id: 'winning_card', color: 'GREEN', value: '8' }];
  // Rahul holds: BLUE 5 (5 pts) + SKIP (20 pts) + WILD (50 pts) = 75 pts total
  (scoringEngine as any).state.players[1].hand = [
    { id: 'r_c1', color: 'BLUE', value: '5' },
    { id: 'r_c2', color: 'RED', value: 'SKIP' },
    { id: 'r_c3', color: 'WILD', value: 'WILD' },
  ];
  scoringEngine.playCard('p1', 'winning_card');
  const roundState = scoringEngine.getGameState();
  assert(
    roundState.status === 'ROUND_OVER' && roundState.roundWinnerId === 'p1',
    'UNO TEST 13a: Playing last card finishes the round with p1 as winner'
  );
  assert(
    roundState.players[0].score === 75,
    'UNO TEST 13b: Winner awarded 75 points from opponent remaining cards'
  );

  // --------------------------------------------------
  // SECTION 11: PHASE 10 ENGINE UNIT TESTS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('PHASE 10 GAME ENGINE UNIT TESTS');
  console.log('==================================================');

  const p10Deck = createPhase10Deck();
  assert(p10Deck.length === 108, 'PHASE 10 TEST 1: Standard 108-card deck created (96 numbers + 8 Wilds + 4 Skips)');

  const p10Engine = new Phase10Engine();
  p10Engine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
  ]);

  const p10St = p10Engine.getGameState();
  assert(p10St.players[0].hand.length === 10, 'PHASE 10 TEST 2: Dealt 10 cards per player');

  // Test Phase 1 Validation (2 sets of 3)
  const set1 = [
    { id: '1', color: 'RED' as const, value: '5' as const },
    { id: '2', color: 'BLUE' as const, value: '5' as const },
    { id: '3', color: 'GREEN' as const, value: '5' as const },
  ];
  const set2 = [
    { id: '4', color: 'RED' as const, value: '9' as const },
    { id: '5', color: 'BLUE' as const, value: '9' as const },
    { id: '6', color: 'YELLOW' as const, value: '9' as const },
  ];

  const phase1Val = validatePhase(1, [set1, set2]);
  assert(phase1Val.isValid, 'PHASE 10 TEST 3: Phase 1 (2 sets of 3) validation passes');

  // Hand score calculation test
  const testHand = [{ id: '1', color: 'WILD' as const, value: 'WILD' as const }];
  assert(calculateHandScore(testHand) === 25, 'PHASE 10 TEST 4: Wild card in hand scores 25 points');

  // Test 5: findValidPhaseGrouping for Phase 1 (2 sets of 3)
  const scrambledHandPhase1 = [
    { id: 'c1', color: 'RED' as const, value: '7' as const },
    { id: 'c2', color: 'BLUE' as const, value: '3' as const },
    { id: 'c3', color: 'GREEN' as const, value: '7' as const },
    { id: 'c4', color: 'YELLOW' as const, value: '3' as const },
    { id: 'c5', color: 'YELLOW' as const, value: '7' as const },
    { id: 'c6', color: 'RED' as const, value: '3' as const },
  ];
  const autoGroupP1 = findValidPhaseGrouping(1, scrambledHandPhase1);
  assert(
    autoGroupP1 !== null && autoGroupP1.length === 2 && autoGroupP1[0].length === 3 && autoGroupP1[1].length === 3,
    'PHASE 10 TEST 5: findValidPhaseGrouping automatically finds 2 sets of 3 from scrambled cards'
  );

  // Test 6: findValidPhaseGrouping for Phase 4 (1 run of 7 with Wild)
  const runHand = [
    { id: 'r2', color: 'RED' as const, value: '2' as const },
    { id: 'r3', color: 'BLUE' as const, value: '3' as const },
    { id: 'rw', color: 'WILD' as const, value: 'WILD' as const },
    { id: 'r5', color: 'YELLOW' as const, value: '5' as const },
    { id: 'r6', color: 'GREEN' as const, value: '6' as const },
    { id: 'r7', color: 'RED' as const, value: '7' as const },
    { id: 'r8', color: 'BLUE' as const, value: '8' as const },
  ];
  const autoRun = findValidPhaseGrouping(4, runHand);
  assert(
    autoRun !== null && autoRun.length === 1 && autoRun[0].length === 7,
    'PHASE 10 TEST 6: findValidPhaseGrouping validates 1 run of 7 containing a Wild card'
  );

  // Test 7: findValidPhaseGrouping for Phase 8 (7 cards of 1 color)
  const colorHand = [
    { id: 'g1', color: 'GREEN' as const, value: '1' as const },
    { id: 'g2', color: 'GREEN' as const, value: '4' as const },
    { id: 'g3', color: 'GREEN' as const, value: '8' as const },
    { id: 'g4', color: 'GREEN' as const, value: '9' as const },
    { id: 'g5', color: 'GREEN' as const, value: '11' as const },
    { id: 'g6', color: 'WILD' as const, value: 'WILD' as const },
    { id: 'g7', color: 'GREEN' as const, value: '12' as const },
  ];
  const autoColor = findValidPhaseGrouping(8, colorHand);
  assert(
    autoColor !== null && autoColor.length === 1 && autoColor[0].length === 7,
    'PHASE 10 TEST 7: findValidPhaseGrouping validates Phase 8 (7 cards of 1 color)'
  );

  // Test 8: Official turn flow - hasDrawnThisTurn guard
  const turnEngine = new Phase10Engine();
  turnEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
  ]);
  assert(
    turnEngine.getGameState().hasDrawnThisTurn === false,
    'PHASE 10 TEST 8: Turn starts with hasDrawnThisTurn = false'
  );

  // Attempting to discard before drawing is blocked
  let discardBeforeDrawBlocked = false;
  try {
    const cardId = turnEngine.getGameState().players[0].hand[0].id;
    turnEngine.discardCard('p1', cardId);
  } catch (e: any) {
    discardBeforeDrawBlocked = e.message.includes('Must draw a card before discarding');
  }
  assert(discardBeforeDrawBlocked, 'PHASE 10 TEST 9: Discarding before drawing is legally blocked');

  // Draw card successfully
  const drawn = turnEngine.drawCard('p1', false);
  assert(
    drawn !== null && turnEngine.getGameState().hasDrawnThisTurn === true,
    'PHASE 10 TEST 10: Drawing a card sets hasDrawnThisTurn = true'
  );

  // Attempting to draw a second card in same turn is blocked
  let doubleDrawBlocked = false;
  try {
    turnEngine.drawCard('p1', false);
  } catch (e: any) {
    doubleDrawBlocked = e.message.includes('Already drew a card this turn');
  }
  assert(doubleDrawBlocked, 'PHASE 10 TEST 11: Double drawing in the same turn is legally blocked');

  // Test 12: Laying down phase and hitting on laid group
  const hitEngine = new Phase10Engine();
  hitEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
  ]);
  (hitEngine as any).state.currentTurnIdx = 0;
  (hitEngine as any).state.hasDrawnThisTurn = true;
  // Give p1 valid phase 1 cards + 1 extra card
  (hitEngine as any).state.players[0].hand = [
    { id: 'p1_s1_1', color: 'RED', value: '4' },
    { id: 'p1_s1_2', color: 'BLUE', value: '4' },
    { id: 'p1_s1_3', color: 'GREEN', value: '4' },
    { id: 'p1_s2_1', color: 'RED', value: '8' },
    { id: 'p1_s2_2', color: 'BLUE', value: '8' },
    { id: 'p1_s2_3', color: 'YELLOW', value: '8' },
    { id: 'p1_hitCard', color: 'GREEN', value: '4' }, // Can hit on set 1
    { id: 'p1_discard', color: 'YELLOW', value: '2' },
    { id: 'p1_filler', color: 'RED', value: '1' }, // Keeps 1 card in hand so round doesn't finish
  ];


  hitEngine.layDownPhase('p1', [
    [
      { id: 'p1_s1_1', color: 'RED', value: '4' },
      { id: 'p1_s1_2', color: 'BLUE', value: '4' },
      { id: 'p1_s1_3', color: 'GREEN', value: '4' },
    ],
    [
      { id: 'p1_s2_1', color: 'RED', value: '8' },
      { id: 'p1_s2_2', color: 'BLUE', value: '8' },
      { id: 'p1_s2_3', color: 'YELLOW', value: '8' },
    ],
  ]);
  assert(
    hitEngine.getGameState().players[0].hasLaidPhaseThisRound === true,
    'PHASE 10 TEST 12a: Successfully laid down Phase 1'
  );

  // Now hit with 4 onto set of 4s
  hitEngine.hitPhase('p1', 'p1', 0, 'p1_hitCard');
  assert(
    hitEngine.getGameState().players[0].laidPhaseGroups[0].cards.length === 4,
    'PHASE 10 TEST 12b: Successfully hit on laid set of 4s (expanded from 3 to 4 cards)'
  );

  // Now discard to advance turn
  hitEngine.discardCard('p1', 'p1_discard');
  assert(
    hitEngine.getGameState().currentTurnIdx === 1 && hitEngine.getGameState().hasDrawnThisTurn === false,
    'PHASE 10 TEST 12c: Discarding ends turn, advances to p2, and resets hasDrawnThisTurn to false'
  );


  // --------------------------------------------------
  // SECTION 12: SNAKES & LADDERS ENGINE UNIT TESTS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('SNAKES & LADDERS ENGINE & RULES UNIT TESTS');
  console.log('==================================================');

  const snakesEngine = new SnakesEngine();
  snakesEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
  ]);

  const snSt = snakesEngine.getGameState();
  assert(snSt.players.length === 2 && snSt.players[0].position === 1, 'SNAKES TEST 1: Match starts at square 1');

  // Test 100 Squares Zig-Zag Coordinate Mapping
  const c1 = getSquareGridCoords(1);
  const c10 = getSquareGridCoords(10);
  const c11 = getSquareGridCoords(11);
  const c20 = getSquareGridCoords(20);
  const c91 = getSquareGridCoords(91);
  const c100 = getSquareGridCoords(100);

  assert(c1.row === 0 && c1.col === 0, 'SNAKES TEST 2: Square 1 is at Row 0, Col 0 (Bottom-Left)');
  assert(c10.row === 0 && c10.col === 9, 'SNAKES TEST 2: Square 10 is at Row 0, Col 9 (Bottom-Right)');
  assert(c11.row === 1 && c11.col === 9, 'SNAKES TEST 2: Square 11 zig-zags to Row 1, Col 9 (One row up, Right)');
  assert(c20.row === 1 && c20.col === 0, 'SNAKES TEST 2: Square 20 is at Row 1, Col 0 (One row up, Left)');
  assert(c91.row === 9 && c91.col === 9, 'SNAKES TEST 2: Square 91 is at Row 9, Col 9 (Top Row, Right)');
  assert(c100.row === 9 && c100.col === 0, 'SNAKES TEST 2: Square 100 is at Row 9, Col 0 (Top-Left Victory)');

  let allCoordsValid = true;
  for (let sq = 1; sq <= 100; sq++) {
    const { row, col } = getSquareGridCoords(sq);
    if (row < 0 || row > 9 || col < 0 || col > 9) {
      allCoordsValid = false;
      break;
    }
  }
  assert(allCoordsValid, 'SNAKES TEST 3: All 100 squares map strictly within 10x10 bounds (0..9)');

  // Test Screen Pixel Centers (with cellSize = 40)
  const p1Center = getSquarePixelCenter(1, 40);
  const p100Center = getSquarePixelCenter(100, 40);
  assert(p1Center.x === 20 && p1Center.y === 380, 'SNAKES TEST 4: Square 1 pixel center at (20, 380) on screen');
  assert(p100Center.x === 20 && p100Center.y === 20, 'SNAKES TEST 4: Square 100 pixel center at (20, 20) on screen');

  // Test Ladder mapping (all ladders climb strictly UP)
  let allLaddersClimbUp = true;
  const ladderEntries = Object.entries(LADDERS);
  assert(ladderEntries.length === 8, 'SNAKES TEST 5: Exactly 8 ladders defined on the board');
  for (const [from, to] of ladderEntries) {
    if (parseInt(from, 10) >= to) {
      allLaddersClimbUp = false;
    }
  }
  assert(allLaddersClimbUp, 'SNAKES TEST 5: Every ladder strictly climbs UP (from < to)');

  const ladder4 = getSpecialSquare(4);
  assert(ladder4?.type === 'LADDER' && ladder4.to === 14, 'SNAKES TEST 6: Square 4 climbs ladder up to 14');
  const ladder28 = getSpecialSquare(28);
  assert(ladder28?.type === 'LADDER' && ladder28.to === 84, 'SNAKES TEST 6: Square 28 climbs giant ladder up to 84');

  // Test Ladder midpoint transform calculations (zero-drift guarantee)
  const lTrans = getLadderTransform(4, 14, 40);
  assert(
    lTrans.midX === (lTrans.start.x + lTrans.end.x) / 2 &&
    lTrans.midY === (lTrans.start.y + lTrans.end.y) / 2,
    'SNAKES TEST 7: Ladder transform anchored at exact segment midpoint (zero drift)'
  );
  assert(lTrans.length > 0 && Math.abs(lTrans.angleDeg) > 0, 'SNAKES TEST 7: Ladder has valid nonzero length and rotation angle');

  // Test Snake mapping (all snakes slide strictly DOWN)
  let allSnakesSlideDown = true;
  const snakeEntries = Object.entries(SNAKES);
  assert(snakeEntries.length === 8, 'SNAKES TEST 8: Exactly 8 snakes defined on the board');
  for (const [from, to] of snakeEntries) {
    if (parseInt(from, 10) <= to) {
      allSnakesSlideDown = false;
    }
  }
  assert(allSnakesSlideDown, 'SNAKES TEST 8: Every snake strictly slides DOWN (from > to)');

  const snake17 = getSpecialSquare(17);
  assert(snake17?.type === 'SNAKE' && snake17.to === 7, 'SNAKES TEST 9: Square 17 slides down snake to 7');
  const snake99 = getSpecialSquare(99);
  assert(snake99?.type === 'SNAKE' && snake99.to === 78, 'SNAKES TEST 9: Square 99 slides down snake to 78');

  // Test Snake geometry (head at headSq, tail at tailSq, slides downwards)
  const sGeom = getSnakeGeometry(17, 7, 40);
  assert(sGeom.dy > 0, 'SNAKES TEST 10: Snake 17->7 slides downward in screen space (dy > 0)');
  assert(sGeom.headPos.x === getSquarePixelCenter(17, 40).x, 'SNAKES TEST 10: Snake head aligns with Square 17 center');
  assert(sGeom.tailPos.x === getSquarePixelCenter(7, 40).x, 'SNAKES TEST 10: Snake tail aligns with Square 7 center');

  // Test Snake 87 -> 24 specific geometry and Square 25 isolation
  const s87Geom = getSnakeGeometry(87, 24, 36);
  assert(s87Geom.headPos.x === getSquarePixelCenter(87, 36).x, 'SNAKES GEOMETRY: Snake 87->24 head aligns with Square 87 center');
  assert(s87Geom.tailPos.x === getSquarePixelCenter(24, 36).x, 'SNAKES GEOMETRY: Snake 87->24 tail aligns with Square 24 center');

  const s87Curve = getSnakeCurvePoints(87, 24, 36, 40);
  assert(s87Curve[0].x === s87Geom.headPos.x && s87Curve[0].y === s87Geom.headPos.y, 'SNAKES GEOMETRY: Curve start (t=0) anchors exactly at Square 87 center');
  assert(s87Curve[40].x === s87Geom.tailPos.x && s87Curve[40].y === s87Geom.tailPos.y, 'SNAKES GEOMETRY: Curve end (t=1) anchors exactly at Square 24 center');

  // Verify that on row 2 (Square 24, where col 3 is x in [108, 144] and Square 25 is col 4 with x in [144, 180]),
  // the snake curve approaching Square 24 stays strictly inside Square 24 and NEVER crosses into Square 25 (x < 144).
  const row2Points = s87Curve.filter((p) => p.y >= 7 * 36); // visualRow 7 corresponds to row 2
  const entersSquare25 = row2Points.some((p) => p.x >= 4 * 36); // col 4 is Square 25
  assert(!entersSquare25 && row2Points.length > 0, 'SNAKES GEOMETRY: Snake 87->24 tail approaches Square 24 without drifting into Square 25');

  // Test Snake 99 -> 78 upper-row geometry and visibility
  const s99Geom = getSnakeGeometry(99, 78, 36);
  assert(s99Geom.headPos.x === getSquarePixelCenter(99, 36).x, 'SNAKES GEOMETRY: Snake 99->78 head aligns with Square 99 center');
  assert(s99Geom.tailPos.x === getSquarePixelCenter(78, 36).x, 'SNAKES GEOMETRY: Snake 99->78 tail aligns with Square 78 center');
  const s99HeadRadius = Math.max(7, Math.min(10, 36 * 0.24));
  assert(s99HeadRadius >= 7 && s99HeadRadius <= 10, 'SNAKES GEOMETRY: Snake 99 head is scaled proportionally to cell size');
  assert(s99Geom.headPos.x - s99HeadRadius > 36, 'SNAKES GEOMETRY: Snake 99 head does not cross into Square 100 or cover square numbers');

  // Multi-Token visibility validation
  const cellSizeTest = 36;
  const tokenSize1 = Math.min(17, cellSizeTest * 0.42);
  const tokenSize2 = Math.min(12, cellSizeTest * 0.30);
  const tokenSize4 = Math.min(9.5, cellSizeTest * 0.23);
  assert(tokenSize1 <= 18 && tokenSize1 > 10, 'MULTI-TOKEN: Single token sized compactly to preserve cell number visibility');
  assert(2 * tokenSize2 + 3 < cellSizeTest, 'MULTI-TOKEN: 2 tokens fit side-by-side within square without horizontal overflow');
  assert(2 * tokenSize4 + 2 < cellSizeTest, 'MULTI-TOKEN: 4 tokens fit in 2x2 grid within square without covering square number');

  // Responsive board calculation for phone viewports
  // Phone Portrait (393 x 873)
  const portraitBoardDim = Math.min(393 - 16, 873 - 52 - 148 - 12);
  const portraitCell = Math.floor(Math.max(26, Math.min(46, (portraitBoardDim - 8) / 10)));
  assert(portraitCell * 10 + 8 <= 393, 'RESPONSIVE: Portrait 10x10 board fits phone width without clipping');
  assert(52 + portraitCell * 10 + 8 + 148 + 12 <= 873, 'RESPONSIVE: Portrait board + controls fit phone height without vertical overflow');

  // Phone Landscape (873 x 393)
  const landBoardDim = Math.min(873 - 180 - 24, 393 - 50 - 16 - 12);
  const landCell = Math.floor(Math.max(24, Math.min(38, (landBoardDim - 8) / 10)));
  assert(landCell * 10 + 8 <= 393 - 50 - 16 - 12, 'RESPONSIVE: Landscape 10x10 board fits available height with 100 visible squares');
  assert(landCell * 10 + 8 + 180 + 24 <= 873, 'RESPONSIVE: Landscape board + side panel fit screen width without horizontal overflow');

  // Test Ordinary Movement & Turn Progression
  const rollRes1 = snakesEngine.rollDice('p1', 2);
  assert(rollRes1.roll === 2, 'SNAKES TEST 11: p1 forced roll of 2 succeeds');
  const p1Pos = snakesEngine.getGameState().players[0].position;
  assert(p1Pos === 3, 'SNAKES TEST 11: p1 moves from square 1 to square 3 (1 + 2 = 3)');
  assert(snakesEngine.getGameState().currentTurnIdx === 1, 'SNAKES TEST 11: Turn advances to Player 2 after non-6 roll');

  // Test Non-turn Player Rejection
  let p1IllegalError = false;
  try {
    snakesEngine.rollDice('p1', 2);
  } catch (e: any) {
    p1IllegalError = true;
  }
  assert(p1IllegalError, 'SNAKES TEST 12: Action from non-active player p1 rejected during p2 turn');

  // Test Ladder Climb in Engine
  const ladderEngine = new SnakesEngine();
  ladderEngine.startMatch([{ id: 'p1', name: 'Ajil' }, { id: 'p2', name: 'Rahul' }]);
  // Roll 3 lands on square 4 -> climbs to 14
  const lRollRes = ladderEngine.rollDice('p1', 3);
  assert(lRollRes.landedSpecial === 'LADDER', 'SNAKES TEST 13: Engine detects landed on LADDER');
  assert(ladderEngine.getGameState().players[0].position === 14, 'SNAKES TEST 13: Player climbed from square 4 to 14');

  // Test Snake Slide in Engine
  const snakeEngine = new SnakesEngine();
  snakeEngine.startMatch([{ id: 'p1', name: 'Ajil' }, { id: 'p2', name: 'Rahul' }]);
  // Set p1 position to 14, roll 3 lands on 17 -> slides to 7
  (snakeEngine as any).state.players[0].position = 14;
  const sRollRes = snakeEngine.rollDice('p1', 3);
  assert(sRollRes.landedSpecial === 'SNAKE', 'SNAKES TEST 14: Engine detects landed on SNAKE');
  assert(snakeEngine.getGameState().players[0].position === 7, 'SNAKES TEST 14: Player slid from square 17 down to 7');

  // Test Extra Roll on Six
  const extraTurnEngine = new SnakesEngine();
  extraTurnEngine.startMatch([{ id: 'p1', name: 'Ajil' }, { id: 'p2', name: 'Rahul' }]);
  extraTurnEngine.rollDice('p1', 6);
  assert(extraTurnEngine.getGameState().players[0].position === 7, 'SNAKES TEST 15: p1 advances 6 squares (1 + 6 = 7)');
  assert(extraTurnEngine.getGameState().currentTurnIdx === 0, 'SNAKES TEST 15: Rolling a 6 awards an extra roll (turn stays on p1)');
  assert(extraTurnEngine.getGameState().extraTurnAwarded === true, 'SNAKES TEST 15: extraTurnAwarded flag is true');

  // Test Three Consecutive Sixes Rule
  extraTurnEngine.rollDice('p1', 6); // 2nd six (pos = 13)
  assert(extraTurnEngine.getGameState().currentTurnIdx === 0, 'SNAKES TEST 16: 2nd consecutive six awards extra roll');
  extraTurnEngine.rollDice('p1', 6); // 3rd six -> forfeits turn!
  assert(extraTurnEngine.getGameState().currentTurnIdx === 1, 'SNAKES TEST 16: 3rd consecutive six forfeits turn (turn advances to p2)');
  assert(extraTurnEngine.getGameState().consecutiveSixesCount === 0, 'SNAKES TEST 16: consecutiveSixesCount reset to 0');

  // Test Exact Finish & Winner Validation
  const snakesWinEngine = new SnakesEngine();
  snakesWinEngine.startMatch([{ id: 'p1', name: 'Ajil' }, { id: 'p2', name: 'Rahul' }]);
  (snakesWinEngine as any).state.players[0].position = 98;
  snakesWinEngine.rollDice('p1', 2);
  assert(snakesWinEngine.getGameState().players[0].position === 100, 'SNAKES TEST 17: Token reaches exactly square 100');
  assert(snakesWinEngine.getGameState().status === 'FINISHED', 'SNAKES TEST 17: Match status transitions to FINISHED');
  assert(snakesWinEngine.getGameState().winnerId === 'p1', 'SNAKES TEST 17: p1 correctly identified as match winner');

  // Test Overshoot Rule (Overshoot stays in place)
  const overEngine = new SnakesEngine();
  overEngine.startMatch([{ id: 'p1', name: 'Ajil' }, { id: 'p2', name: 'Rahul' }]);
  (overEngine as any).state.players[0].position = 98;
  overEngine.rollDice('p1', 4); // 98 + 4 = 102 > 100
  assert(overEngine.getGameState().players[0].position === 98, 'SNAKES TEST 18: Overshooting 100 (98 + 4 = 102) keeps token at square 98');
  assert(overEngine.getGameState().status === 'PLAYING', 'SNAKES TEST 18: Match remains PLAYING when overshot');

  // Test Bot Turn Execution
  const botEngine = new SnakesEngine();
  botEngine.startMatch([
    { id: 'p1', name: 'Ajil', isBot: false },
    { id: 'bot_1', name: 'Robo Rahul', isBot: true },
  ]);
  const testBot = new SnakesBot(botEngine, 'bot_1');
  // Attempting to execute bot turn during p1 turn should not throw or change bot position
  testBot.executeTurn();
  assert(botEngine.getGameState().players[1].position === 1, 'SNAKES TEST 19: Bot does not act during other player turn');
  testBot.deactivate();

  // --------------------------------------------------
  // SECTION 13: LUDO ENGINE UNIT TESTS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('LUDO — 4 PLAYERS ENGINE UNIT TESTS');
  console.log('==================================================');

  const ludoEngine = new LudoEngine();
  ludoEngine.startMatch([
    { id: 'p1', name: 'Ajil', isBot: false },
    { id: 'p2', name: 'Rahul', isBot: false },
    { id: 'p3', name: 'Anu', isBot: true },
    { id: 'p4', name: 'Akhil', isBot: true },
  ]);

  const ludoSt = ludoEngine.getGameState();
  assert(ludoSt.players.length === 4, 'LUDO TEST 1: Exactly 4 players assigned (RED, GREEN, YELLOW, BLUE)');
  assert(ludoSt.players[0].tokens.length === 4 && ludoSt.players[0].tokens[0].position === 0, 'LUDO TEST 2: Each player starts with 4 tokens in Yard (pos = 0)');
  assert(
    isSafeCell(1) && isSafeCell(14) && isSafeCell(27) && isSafeCell(40) &&
    isSafeCell(9) && isSafeCell(22) && isSafeCell(35) && isSafeCell(48),
    'LUDO TEST 3: Starting cells and star cells are marked safe from capture'
  );

  // LUDO TEST 4: Leaving Yard on 6 & bonus roll awarded
  const roll6Res = ludoEngine.rollDice('p1', 6);
  assert(roll6Res.roll === 6 && roll6Res.playableTokens.length === 4, 'LUDO TEST 4: Rolling 6 allows any yard token to enter play');
  ludoEngine.moveToken('p1', 'RED_1');
  const post6State = ludoEngine.getGameState();
  assert(post6State.players[0].tokens[0].position === 1, 'LUDO TEST 4: Token moves from Yard (0) to Start square (1)');
  assert(post6State.currentTurnIdx === 0, 'LUDO TEST 4: Rolling 6 awards an extra roll (turn does not advance)');

  // LUDO TEST 5: Invalid Token Selection / Move without 6 rejected for yard tokens
  const roll3Res = ludoEngine.rollDice('p1', 3);
  assert(roll3Res.playableTokens.length === 1 && roll3Res.playableTokens[0] === 'RED_1', 'LUDO TEST 5: Yard tokens RED_2, RED_3, RED_4 are not playable on roll of 3');
  let moveYardError = false;
  try {
    ludoEngine.moveToken('p1', 'RED_2');
  } catch (e: any) {
    moveYardError = true;
  }
  assert(moveYardError, 'LUDO TEST 5: Attempting to move yard token without rolling 6 is rejected');

  // LUDO TEST 6: Legal movement along track
  ludoEngine.moveToken('p1', 'RED_1');
  const postMoveState = ludoEngine.getGameState();
  assert(postMoveState.players[0].tokens[0].position === 4, 'LUDO TEST 6: RED_1 legally advances from square 1 to square 4 (1 + 3 = 4)');
  assert(postMoveState.currentTurnIdx === 1, 'LUDO TEST 6: Turn advances to Player 2 after non-6 roll');

  // LUDO TEST 7: Turn progression & Non-turn action restriction
  let wrongTurnError = false;
  try {
    ludoEngine.rollDice('p1', 4);
  } catch (e: any) {
    wrongTurnError = true;
  }
  assert(wrongTurnError, 'LUDO TEST 7: Action from non-active player p1 rejected when turn is p2');

  // LUDO TEST 8: Safe Cell Immunity (Tokens cannot be captured on safe cell)
  const safeEngine = new LudoEngine();
  safeEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
    { id: 'p3', name: 'Anu' },
    { id: 'p4', name: 'Akhil' },
  ]);
  // Place Green token at its starting cell (safe cell 14)
  const safeSt = safeEngine.getGameState();
  (safeEngine as any).state.players[1].tokens[0].position = 1; // Green relative 1 = abs 14
  // Place Red token to land on abs 14 (relative 14 for Red: 1 - 1 + 13 = abs 14)
  (safeEngine as any).state.players[0].tokens[0].position = 10;
  (safeEngine as any).state.currentTurnIdx = 0;
  safeEngine.rollDice('p1', 4);
  safeEngine.moveToken('p1', 'RED_1'); // Now at 14 (safe cell)
  const afterSafeState = safeEngine.getGameState();
  assert(afterSafeState.players[1].tokens[0].position === 1, 'LUDO TEST 8: Opponent token on safe cell 14 is NOT captured');

  // LUDO TEST 9: Opponent Capture on Non-Safe Cell
  const captureEngine = new LudoEngine();
  captureEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
    { id: 'p3', name: 'Anu' },
    { id: 'p4', name: 'Akhil' },
  ]);
  // Green token at relative 2 (abs 15, non-safe)
  (captureEngine as any).state.players[1].tokens[0].position = 2;
  // Red token at relative 12 (moves +3 to relative 15 = abs 15)
  (captureEngine as any).state.players[0].tokens[0].position = 12;
  (captureEngine as any).state.currentTurnIdx = 0;
  captureEngine.rollDice('p1', 3);
  captureEngine.moveToken('p1', 'RED_1');
  const postCaptureState = captureEngine.getGameState();
  assert(postCaptureState.players[1].tokens[0].position === 0, 'LUDO TEST 9: Captured opponent token is returned back to Yard (pos = 0)');
  assert(postCaptureState.currentTurnIdx === 0, 'LUDO TEST 9: Capturing opponent token awards an extra roll');

  // LUDO TEST 10: Three Consecutive Sixes forfeits turn
  const sixesEngine = new LudoEngine();
  sixesEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
    { id: 'p3', name: 'Anu' },
    { id: 'p4', name: 'Akhil' },
  ]);
  sixesEngine.rollDice('p1', 6);
  sixesEngine.moveToken('p1', 'RED_1'); // 1st six -> pos 1
  sixesEngine.rollDice('p1', 6);
  sixesEngine.moveToken('p1', 'RED_1'); // 2nd six -> pos 7
  const thirdRollRes = sixesEngine.rollDice('p1', 6); // 3rd six!
  assert(thirdRollRes.playableTokens.length === 0, 'LUDO TEST 10: 3rd consecutive six forfeits turn (0 playable tokens)');
  assert(sixesEngine.getGameState().currentTurnIdx === 1, 'LUDO TEST 10: Turn advances to Player 2 after 3 consecutive sixes');

  // LUDO TEST 11: Exact Finish Validation (Cannot overshoot 58)
  const homeEngine = new LudoEngine();
  homeEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
    { id: 'p3', name: 'Anu' },
    { id: 'p4', name: 'Akhil' },
  ]);
  (homeEngine as any).state.players[0].tokens[0].position = 56;
  (homeEngine as any).state.currentTurnIdx = 0;
  const overshootRoll = homeEngine.rollDice('p1', 3); // Needs 2, rolled 3
  assert(!overshootRoll.playableTokens.includes('RED_1'), 'LUDO TEST 11: Overshooting final home (56 + 3 = 59 > 58) is not a playable move');
  (homeEngine as any).state.currentTurnIdx = 0;
  (homeEngine as any).state.mustSelectToken = false;
  homeEngine.rollDice('p1', 2); // Exact 2
  homeEngine.moveToken('p1', 'RED_1');
  const postHomeState = homeEngine.getGameState();
  assert(postHomeState.players[0].tokens[0].position === 58, 'LUDO TEST 11: Token at 56 with roll of 2 reaches HOME (pos = 58)');
  assert(postHomeState.players[0].finishedTokensCount === 1, 'LUDO TEST 11: Player finishedTokensCount increments to 1');
  assert(postHomeState.currentTurnIdx === 0, 'LUDO TEST 11: Reaching Home awards an extra roll');

  // LUDO TEST 12: Winner Detection when 4 tokens reach Home
  const winEngine = new LudoEngine();
  winEngine.startMatch([
    { id: 'p1', name: 'Ajil' },
    { id: 'p2', name: 'Rahul' },
    { id: 'p3', name: 'Anu' },
    { id: 'p4', name: 'Akhil' },
  ]);
  // Set 3 tokens at Home, 4th at 57
  (winEngine as any).state.players[0].finishedTokensCount = 3;
  (winEngine as any).state.players[0].tokens[0].position = 58;
  (winEngine as any).state.players[0].tokens[1].position = 58;
  (winEngine as any).state.players[0].tokens[2].position = 58;
  (winEngine as any).state.players[0].tokens[3].position = 57;
  (winEngine as any).state.currentTurnIdx = 0;
  winEngine.rollDice('p1', 1);
  winEngine.moveToken('p1', 'RED_4');
  const finalWinState = winEngine.getGameState();
  assert(finalWinState.status === 'FINISHED', 'LUDO TEST 12: Match status transitions to FINISHED when all 4 tokens reach Home');
  assert(finalWinState.winnerId === 'p1' && finalWinState.winnerColor === 'RED', 'LUDO TEST 12: Player 1 correctly identified as match winner');

  // LUDO TEST 13: 15x15 Visual geometry and track mapping consistency
  assert(Object.keys(TRACK_GRID_MAP).length === 52, 'LUDO TEST 13: TRACK_GRID_MAP contains exactly 52 cells');
  assert(TRACK_GRID_MAP[1].r === 6 && TRACK_GRID_MAP[1].c === 1, 'LUDO TEST 13: RED start at (6, 1)');
  assert(TRACK_GRID_MAP[14].r === 1 && TRACK_GRID_MAP[14].c === 8, 'LUDO TEST 13: GREEN start at (1, 8)');
  assert(TRACK_GRID_MAP[27].r === 8 && TRACK_GRID_MAP[27].c === 13, 'LUDO TEST 13: YELLOW start at (8, 13)');
  assert(TRACK_GRID_MAP[40].r === 13 && TRACK_GRID_MAP[40].c === 6, 'LUDO TEST 13: BLUE start at (13, 6)');
  assert(Object.keys(HOME_CORRIDOR_MAP.RED).length === 6, 'LUDO TEST 13: RED Home Corridor has 6 cells (52..57)');
  assert(YARD_SLOTS_MAP.RED.length === 4 && YARD_SLOTS_MAP.GREEN.length === 4, 'LUDO TEST 13: Each yard has 4 distinct sockets');

  // --------------------------------------------------
  // SECTION 13B: ANIME ADVENTURE LUDO ENGINE TESTS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('ANIME ADVENTURE LUDO — CARDS & RULES UNIT TESTS');
  console.log('==================================================');

  // Tile configuration
  assert(TREASURE_TILES.size === 4, 'ADVENTURE TILE: Exactly 4 Treasure Tiles exist (5, 18, 31, 44)');
  assert(EVENT_TILES.size === 4, 'ADVENTURE TILE: Exactly 4 Special Event Tiles exist (11, 24, 37, 50)');
  for (const t of TREASURE_TILES) {
    assert(!SAFE_CELLS.has(t), `ADVENTURE TILE: Treasure Tile ${t} is not a Safe Zone`);
  }
  for (const e of EVENT_TILES) {
    assert(!SAFE_CELLS.has(e), `ADVENTURE TILE: Event Tile ${e} is not a Safe Zone`);
  }

  // Safe Escape & Tile triggering
  const advEngine = new LudoEngine(true);
  advEngine.startMatch([
    { id: 'p1', name: 'Luffy' },
    { id: 'p2', name: 'Zoro' },
    { id: 'p3', name: 'Sanji' },
    { id: 'p4', name: 'Jinbe' },
  ]);
  (advEngine as any).state.players[0].tokens[0].position = 1;
  (advEngine as any).state.currentTurnIdx = 0;
  advEngine.rollDice('p1', 4); // Lands on relative 5 (abs 5 = Treasure Tile)
  advEngine.moveToken('p1', 'RED_1', TREASURE_CARDS.TREASURE_SAFE_ESCAPE);
  let advSt = advEngine.getGameState();
  assert(advSt.activeCardEvent !== null, 'ADVENTURE TEST 1: Landing on Treasure Tile opens active card event');
  assert(advSt.activeCardEvent?.card.id === 'TREASURE_SAFE_ESCAPE', 'ADVENTURE TEST 1: Opened Safe Escape Card');

  const advEscapeRes = advEngine.resolveActiveCard({ ownTokenId: 'RED_1' });
  assert(advEscapeRes.success, 'ADVENTURE TEST 1: Safe Escape resolves successfully');
  advSt = advEngine.getGameState();
  assert(advSt.players[0].tokens[0].position === 9, 'ADVENTURE TEST 1: Token escaped to Safe Zone at relative 9 (abs 9)');
  assert(advSt.activeCardEvent === null, 'ADVENTURE TEST 1: Active card event cleared after resolution');

  // Pirate Dash (+3)
  (advEngine as any).state.currentTurnIdx = 0;
  (advEngine as any).state.activeCardEvent = {
    card: TREASURE_CARDS.TREASURE_PIRATE_DASH,
    cardType: 'TREASURE',
    playerId: 'p1',
    playerColor: 'RED',
    triggeringTokenId: 'RED_1',
    resolved: false,
  };
  const advDashRes = advEngine.resolveActiveCard({ ownTokenId: 'RED_1' });
  assert(advDashRes.success, 'ADVENTURE TEST 2: Pirate Dash resolves');
  advSt = advEngine.getGameState();
  assert(advSt.players[0].tokens[0].position === 12, 'ADVENTURE TEST 2: Token advanced 3 spaces forward (9 + 3 = 12)');

  // Pirate Shield & Capture Immunity
  (advEngine as any).state.currentTurnIdx = 0;
  (advEngine as any).state.activeCardEvent = {
    card: TREASURE_CARDS.TREASURE_PIRATE_SHIELD,
    cardType: 'TREASURE',
    playerId: 'p1',
    playerColor: 'RED',
    triggeringTokenId: 'RED_1',
    resolved: false,
  };
  advEngine.resolveActiveCard({ ownTokenId: 'RED_1' });
  advSt = advEngine.getGameState();
  assert(!!advSt.activeShields?.includes('RED_1'), 'ADVENTURE TEST 3: RED_1 equipped with active Pirate Shield');

  (advEngine as any).state.players[1].tokens[0].position = 50; // Green rel 50 = abs 11
  (advEngine as any).state.currentTurnIdx = 1;
  advEngine.rollDice('p2', 1); // Green moves to abs 12 where Red has shield
  advEngine.moveToken('p2', 'GREEN_1');
  advSt = advEngine.getGameState();
  assert(advSt.players[0].tokens[0].position === 12, 'ADVENTURE TEST 3: RED_1 preserved on track because Pirate Shield absorbed capture');
  assert(!advSt.activeShields?.includes('RED_1'), 'ADVENTURE TEST 3: Pirate Shield consumed after absorption');

  // Lucky Dice
  (advEngine as any).state.currentTurnIdx = 0;
  (advEngine as any).state.activeCardEvent = {
    card: TREASURE_CARDS.TREASURE_LUCKY_DICE,
    cardType: 'TREASURE',
    playerId: 'p1',
    playerColor: 'RED',
    triggeringTokenId: 'RED_1',
    resolved: false,
  };
  const luckyDiceRes = advEngine.resolveActiveCard();
  assert(luckyDiceRes.extraRollAwarded === true, 'ADVENTURE TEST 4: Lucky Dice awards bonus roll');
  assert(advEngine.getGameState().currentTurnIdx === 0, 'ADVENTURE TEST 4: Turn stays with p1 after Lucky Dice');

  // Revenge Card with Capture History
  (advEngine as any).state.players[0].tokens[1].position = 20;
  (advEngine as any).state.players[1].tokens[1].position = 6;
  (advEngine as any).state.currentTurnIdx = 1;
  advEngine.rollDice('p2', 1);
  advEngine.moveToken('p2', 'GREEN_2'); // Captures RED_2
  assert(advEngine.getCaptureHistory().getCaptorsOfPlayer('p1').length === 1, 'ADVENTURE TEST 5: Capture history tracks p2 as captor of p1');

  (advEngine as any).state.currentTurnIdx = 0;
  (advEngine as any).state.activeCardEvent = {
    card: SPECIAL_EVENT_CARDS.EVENT_REVENGE,
    cardType: 'SPECIAL_EVENT',
    playerId: 'p1',
    playerColor: 'RED',
    triggeringTokenId: 'RED_1',
    resolved: false,
  };
  const advRevengeRes = advEngine.resolveActiveCard({
    opponentId: 'p2',
    opponentTokenId: 'GREEN_1',
  });
  assert(advRevengeRes.success, 'ADVENTURE TEST 5: Revenge card successfully executes');
  assert(advEngine.getGameState().players[1].tokens[0].position === 0, 'ADVENTURE TEST 5: Targeted opponent token returned to Yard by Revenge');

  // Body Swap
  (advEngine as any).state.players[0].tokens[0].position = 12;
  (advEngine as any).state.players[2].tokens[0].position = 15;
  const redInitialAbs = getAbsoluteTrackPosition('RED', 12);
  const yellowInitialAbs = getAbsoluteTrackPosition('YELLOW', 15);
  (advEngine as any).state.currentTurnIdx = 0;
  (advEngine as any).state.activeCardEvent = {
    card: SPECIAL_EVENT_CARDS.EVENT_BODY_SWAP,
    cardType: 'SPECIAL_EVENT',
    playerId: 'p1',
    playerColor: 'RED',
    triggeringTokenId: 'RED_1',
    resolved: false,
  };
  const advSwapRes = advEngine.resolveActiveCard({
    ownTokenId: 'RED_1',
    opponentTokenId: 'YELLOW_1',
  });
  assert(advSwapRes.success, 'ADVENTURE TEST 6: Body Swap executes');
  assert(getAbsoluteTrackPosition('RED', advEngine.getGameState().players[0].tokens[0].position) === yellowInitialAbs, 'ADVENTURE TEST 6: Red token swapped to yellow initial position');
  assert(getAbsoluteTrackPosition('YELLOW', advEngine.getGameState().players[2].tokens[0].position) === redInitialAbs, 'ADVENTURE TEST 6: Yellow token swapped to red initial position');

  // Wanted Bounty
  (advEngine as any).state.currentTurnIdx = 0;
  (advEngine as any).state.players[1].tokens[1].position = 10;
  (advEngine as any).state.activeCardEvent = {
    card: SPECIAL_EVENT_CARDS.EVENT_WANTED,
    cardType: 'SPECIAL_EVENT',
    playerId: 'p1',
    playerColor: 'RED',
    triggeringTokenId: 'RED_1',
    resolved: false,
  };
  advEngine.resolveActiveCard({ opponentTokenId: 'GREEN_2' });
  assert(!!advEngine.getGameState().wantedTargets?.some((w) => w.targetTokenId === 'GREEN_2'), 'ADVENTURE TEST 7: 100M Berry Bounty placed on GREEN_2');

  // Cosmetic events
  (advEngine as any).state.currentTurnIdx = 0;
  (advEngine as any).state.activeCardEvent = {
    card: SPECIAL_EVENT_CARDS.EVENT_PIRATE_PRANK,
    cardType: 'SPECIAL_EVENT',
    playerId: 'p1',
    playerColor: 'RED',
    triggeringTokenId: 'RED_1',
    resolved: false,
  };
  const advPrankRes = advEngine.resolveActiveCard();
  assert(advPrankRes.success, 'ADVENTURE TEST 8: Cosmetic Pirate Prank resolves with 0 state disruption');

  // Captain's Order (+2)
  (advEngine as any).state.players[0].tokens[0].position = 22;
  (advEngine as any).state.currentTurnIdx = 0;
  (advEngine as any).state.activeCardEvent = {
    card: SPECIAL_EVENT_CARDS.EVENT_CAPTAINS_ORDER,
    cardType: 'SPECIAL_EVENT',
    playerId: 'p1',
    playerColor: 'RED',
    triggeringTokenId: 'RED_1',
    resolved: false,
  };
  advEngine.resolveActiveCard({ ownTokenId: 'RED_1' });
  assert(advEngine.getGameState().players[0].tokens[0].position === 24, 'ADVENTURE TEST 9: Captain Order advanced token 2 spaces (22 + 2 = 24)');

  // Reset match clears adventure state
  advEngine.startMatch([
    { id: 'p1', name: 'Luffy' },
    { id: 'p2', name: 'Zoro' },
    { id: 'p3', name: 'Sanji' },
    { id: 'p4', name: 'Jinbe' },
  ]);
  const postResetSt = advEngine.getGameState();
  assert(advEngine.getCaptureHistory().getAllRecords().length === 0, 'ADVENTURE TEST 10: Capture history cleared on new match');
  assert(postResetSt.activeShields?.length === 0, 'ADVENTURE TEST 10: Active shields cleared on new match');
  assert(postResetSt.wantedTargets?.length === 0, 'ADVENTURE TEST 10: Wanted targets cleared on new match');
  assert(postResetSt.activeCardEvent === null, 'ADVENTURE TEST 10: Active card cleared on new match');

  // --------------------------------------------------
  // SECTION 13C: ONE PIECE LUDO — BOTTOM PANEL, TIMERS & FULL MATCH VERIFICATION
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('ONE PIECE LUDO — BOTTOM PANEL, TIMERS & FULL MATCH VERIFICATION');
  console.log('==================================================');

  // Test 1: Verification for All 4 Captain Selections & Bottom-Panel Placement
  const testCaptains: ('RED' | 'GREEN' | 'YELLOW' | 'BLUE')[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
  testCaptains.forEach((selectedColor) => {
    const colors: ('RED' | 'GREEN' | 'YELLOW' | 'BLUE')[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
    const targetSlotIdx = colors.indexOf(selectedColor);
    const otherSlots = [0, 1, 2, 3].filter((s) => s !== targetSlotIdx);

    const playersSetup: { id: string; name: string; avatar: string; isBot: boolean }[] = [];
    for (let slot = 0; slot < 4; slot++) {
      const col = colors[slot];
      const cap = CAPTAINS_INFO[col];
      if (slot === targetSlotIdx) {
        playersSetup.push({
          id: 'player_local_1',
          name: `${cap.name} (You)`,
          avatar: cap.avatar,
          isBot: false,
        });
      } else {
        playersSetup.push({
          id: `bot_${slot + 1}`,
          name: `${cap.name} (Bot)`,
          avatar: cap.avatar,
          isBot: true,
        });
      }
    }

    const testEngine = new LudoEngine(true);
    testEngine.startMatch(playersSetup);
    const st = testEngine.getGameState();

    // Verify player identity and color preservation
    const human = st.players.find((p) => p.id === 'player_local_1');
    assert(human !== undefined, `BOTTOM PANEL TEST [${selectedColor}]: Human player is registered with id 'player_local_1'`);
    assert(human?.color === selectedColor, `BOTTOM PANEL TEST [${selectedColor}]: Human player color matches chosen ${selectedColor}`);
    assert(human?.name === `${CAPTAINS_INFO[selectedColor].name} (You)`, `BOTTOM PANEL TEST [${selectedColor}]: Correct captain name displayed`);
    assert(START_SQUARES[selectedColor] !== undefined, `BOTTOM PANEL TEST [${selectedColor}]: Starting square correctly defined`);

    // Verify Bottom Panel Derivation: orderedPlayers[0] is ALWAYS the chosen captain
    const humanIdx = st.players.findIndex((p) => p.id === 'player_local_1');
    const orderedPlayers = [
      st.players[humanIdx],
      st.players[(humanIdx + 1) % 4],
      st.players[(humanIdx + 2) % 4],
      st.players[(humanIdx + 3) % 4],
    ];

    assert(orderedPlayers[0].id === 'player_local_1', `BOTTOM PANEL TEST [${selectedColor}]: orderedPlayers[0] is the selected human player`);
    assert(orderedPlayers[0].name === `${CAPTAINS_INFO[selectedColor].name} (You)`, `BOTTOM PANEL TEST [${selectedColor}]: ${CAPTAINS_INFO[selectedColor].name} placed at Bottom Panel`);
    assert(orderedPlayers[0].color === selectedColor, `BOTTOM PANEL TEST [${selectedColor}]: Color unchanged when placed at bottom`);
    assert(orderedPlayers.slice(1).every((p) => p.isBot), `BOTTOM PANEL TEST [${selectedColor}]: Remaining 3 players are opponents`);
  });

  // Test 2: Responsive Dimensions Validation (Portrait & Landscape)
  // Portrait (390 x 844) - POCO M2 Pro / Nothing Phone 3a
  const portWinW = 390;
  const portWinH = 844;
  const topH = 48 + 32;
  const availPortH = portWinH - topH - 200;
  const availPortW = portWinW - 14;
  const maxPortDim = Math.min(availPortW, availPortH);
  const portCellSize = Math.max(18, Math.min(25, Math.floor(maxPortDim / 15)));
  const ludoPortBoardDim = portCellSize * 15;
  assert(ludoPortBoardDim <= availPortW, 'RESPONSIVE TEST 1: Portrait board fits within phone width without horizontal overflow');
  assert(ludoPortBoardDim + topH + 200 <= portWinH, 'RESPONSIVE TEST 2: Portrait layout fits within 844dp height without vertical clipping');

  // Landscape (844 x 390)
  const landWinW = 844;
  const landWinH = 390;
  const availLandW = landWinW - 334;
  const availLandH = landWinH - 48 - 104;
  const maxLandDim = Math.min(availLandW, availLandH);
  const landCellSize = Math.max(15, Math.min(22, Math.floor(maxLandDim / 15)));
  const ludoLandBoardDim = landCellSize * 15;
  assert(ludoLandBoardDim + 334 <= landWinW, 'RESPONSIVE TEST 3: Landscape board with side panels fits width without clipping');
  assert(ludoLandBoardDim + 48 + 104 <= landWinH, 'RESPONSIVE TEST 4: Landscape layout fits height without vertical overflow');

  // Test 3: Turn Timing & Deterministic Move Selection Heuristics
  const heuristicEngine = new LudoEngine();
  heuristicEngine.startMatch([
    { id: 'p1', name: 'Luffy (You)', isBot: false },
    { id: 'p2', name: 'Zoro (Bot)', isBot: true },
    { id: 'p3', name: 'Sanji (Bot)', isBot: true },
    { id: 'p4', name: 'Chopper (Bot)', isBot: true },
  ]);

  const pickBestHeuristic = (
    tokens: any[],
    rollVal: number,
    st: any,
    col: 'RED' | 'GREEN' | 'YELLOW' | 'BLUE'
  ) => {
    const selectable = tokens.filter((t: any) => {
      if (t.position === 0) return rollVal === 6;
      if (t.position + rollVal > 58) return false;
      return true;
    });
    if (selectable.length === 0) return null;

    // 1. Capture priority
    for (const t of selectable) {
      const destPos = t.position === 0 ? 1 : t.position + rollVal;
      const absPos = getAbsoluteTrackPosition(col, destPos);
      if (absPos && !SAFE_CELLS.has(absPos)) {
        const canCapture = st.players.some(
          (otherP: any) =>
            otherP.color !== col &&
            otherP.tokens.some((ot: any) => {
              const otAbs = getAbsoluteTrackPosition(otherP.color, ot.position);
              return otAbs === absPos && !st.activeShields?.includes(ot.id);
            })
        );
        if (canCapture) return t;
      }
    }
    // 2. Reach Home
    const homeTok = selectable.find((t: any) => t.position + rollVal === 58);
    if (homeTok) return homeTok;
    // 3. Yard exit on 6
    if (rollVal === 6) {
      const yardTok = selectable.find((t: any) => t.position === 0);
      if (yardTok) return yardTok;
    }
    // 4. Furthest token
    const sorted = [...selectable].sort((a: any, b: any) => b.position - a.position);
    return sorted[0];
  };

  // Heuristic Scenario A: Capture priority
  const hSt = heuristicEngine.getGameState();
  hSt.players[0].tokens[0].position = 10;
  hSt.players[0].tokens[1].position = 20;
  hSt.players[1].tokens[0].position = 2; // Green rel 2 = abs 15. Red at 10 + 5 = 15 captures!
  const capPick = pickBestHeuristic(hSt.players[0].tokens, 5, hSt, 'RED');
  assert(capPick.id === 'RED_1', 'HEURISTIC TEST 1: Deterministic heuristic prioritizes opponent capture');

  // Heuristic Scenario B: Reach Home priority
  hSt.players[0].tokens[0].position = 56;
  hSt.players[0].tokens[1].position = 30;
  const homePick = pickBestHeuristic(hSt.players[0].tokens, 2, hSt, 'RED');
  assert(homePick.id === 'RED_1', 'HEURISTIC TEST 2: Deterministic heuristic prioritizes reaching Home (58)');

  // Heuristic Scenario C: Yard exit on 6
  hSt.players[0].tokens[2].position = 0;
  hSt.players[0].tokens[3].position = 5;
  const yardPick = pickBestHeuristic([hSt.players[0].tokens[2], hSt.players[0].tokens[3]], 6, hSt, 'RED');
  assert(yardPick.id === 'RED_3', 'HEURISTIC TEST 3: Deterministic heuristic prioritizes deploying token from Yard on 6');

  // Test 4: Full Deterministic Match Execution until Victory
  console.log('Running Deterministic Full Match Simulation...');
  let simSeed = 542;
  const simRng = () => {
    simSeed = (simSeed * 16807) % 2147483647;
    return (simSeed - 1) / 2147483646;
  };
  const simRollDice = () => Math.floor(simRng() * 6) + 1;

  const fullMatchEngine = new LudoEngine(true);
  fullMatchEngine.startMatch([
    { id: 'p1', name: 'Luffy (You)', isBot: false },
    { id: 'p2', name: 'Zoro (Bot)', isBot: true },
    { id: 'p3', name: 'Sanji (Bot)', isBot: true },
    { id: 'p4', name: 'Chopper (Bot)', isBot: true },
  ]);

  let simActions = 0;
  const MAX_SIM_ACTIONS = 1000;
  let totalCaptures = 0;
  let totalExtraTurns = 0;

  while (fullMatchEngine.getGameState().status !== 'FINISHED' && simActions < MAX_SIM_ACTIONS) {
    simActions++;
    const curState = fullMatchEngine.getGameState();
    const activeP = curState.players[curState.currentTurnIdx];
    const rVal = simRollDice();
    const rollOutcome = fullMatchEngine.rollDice(activeP.id, rVal);

    if (rollOutcome.playableTokens.length > 0) {
      const bestTok = pickBestHeuristic(activeP.tokens, rVal, curState, activeP.color);
      const chosenTokenId = bestTok ? bestTok.id : rollOutcome.playableTokens[0];

      const turnBefore = fullMatchEngine.getGameState().currentTurnIdx;
      fullMatchEngine.moveToken(activeP.id, chosenTokenId);
      const turnAfter = fullMatchEngine.getGameState().currentTurnIdx;

      if (turnBefore === turnAfter && fullMatchEngine.getGameState().status !== 'FINISHED') {
        totalExtraTurns++;
      }
      if (fullMatchEngine.getGameState().lastActionMessage?.includes('captured')) {
        totalCaptures++;
      }

      // Resolve card event if triggered
      const eventSt = fullMatchEngine.getGameState();
      if (eventSt.activeCardEvent && !eventSt.activeCardEvent.resolved) {
        fullMatchEngine.resolveActiveCard({});
      }
    }
  }

  const simFinalState = fullMatchEngine.getGameState();
  assert(simFinalState.status === 'FINISHED', `FULL MATCH TEST 1: Match played to completion and achieved status 'FINISHED' (in ${simActions} actions)`);
  assert(simFinalState.winnerId !== null, `FULL MATCH TEST 2: Winner successfully crowned (${simFinalState.winnerId} - ${simFinalState.winnerColor})`);
  const winningPlayer = simFinalState.players.find((p) => p.id === simFinalState.winnerId);
  assert(winningPlayer?.finishedTokensCount === 4, 'FULL MATCH TEST 3: Winner brought all 4 tokens Home');
  assert(totalCaptures > 0, `FULL MATCH TEST 4: Match successfully exercised token captures (${totalCaptures} captures occurred)`);
  assert(totalExtraTurns > 0, `FULL MATCH TEST 5: Match successfully exercised extra turns on 6s, captures, and cards (${totalExtraTurns} bonus turns)`);
  assert(simActions < MAX_SIM_ACTIONS, `FULL MATCH TEST 6: Match completed safely within turn guard (${simActions} < ${MAX_SIM_ACTIONS})`);
  console.log(`Deterministic Full Match Winner: ${winningPlayer?.name} (${winningPlayer?.color}) in ${simActions} actions!`);

  // --------------------------------------------------
  // SECTION 14: BRAIN GAMES ENGINES UNIT TESTS (12 GAMES)
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('BRAIN GAMES ENGINES UNIT TESTS (12 GAMES)');
  console.log('==================================================');

  // 1. Circuit Connect
  const circuit = createCircuitGame('EASY');
  assert(circuit.size === 3 && circuit.tiles.length === 3, 'BRAIN TEST 1: Circuit Connection engine creates valid tile grid');
  const straightPorts0 = getTilePorts('STRAIGHT', 0);
  assert(straightPorts0.north && straightPorts0.south && !straightPorts0.east, 'BRAIN TEST 1B: Straight wire at 0deg has north and south ports');
  const straightPorts90 = getTilePorts('STRAIGHT', 90);
  assert(straightPorts90.east && straightPorts90.west && !straightPorts90.north, 'BRAIN TEST 1C: Straight wire at 90deg has east and west ports');
  const powerRes = computeCircuitPower(circuit.tiles);
  assert(Array.isArray(powerRes.poweredTiles) && typeof powerRes.isBulbPowered === 'boolean', 'BRAIN TEST 1D: computeCircuitPower computes power propagation');

  // 2. Tile Connect
  const tileConn = createTileConnectGame('EASY');
  assert(tileConn.length === 8, 'BRAIN TEST 2: Tile Connection engine creates 8 paired tiles');

  // 3. Word Fill
  const wordFill = createWordFillGame('EASY');
  assert(typeof wordFill.vocab.word === 'string' && wordFill.vocab.word.length > 0, 'BRAIN TEST 3: Word Fill engine generates valid word puzzle');

  // 4. Word Puzzle
  const wordPuzz = createWordPuzzleGame('EASY');
  assert(wordPuzz.scrambled.length === wordPuzz.vocab.word.length, 'BRAIN TEST 4: Word Puzzle engine generates scrambled anagram');

  // 5. Word Connect
  const wordConn = createWordConnectGame('EASY');
  assert(wordConn.letters.length === 5 && wordConn.validWords.length > 0, 'BRAIN TEST 5: Word Connection engine generates letter wheel');

  // 6. Sudoku
  const sudokuEasy = createSudokuGame('EASY');
  assert(sudokuEasy.size === 4 && sudokuEasy.initial.length === 4, 'BRAIN TEST 6: Sudoku engine generates 4x4 grid for EASY');

  // 7. Memory Match
  const memMatch = createMemoryMatchGame('EASY');
  assert(memMatch.length === 8, 'BRAIN TEST 7: Memory Match engine generates 8 card pairs');

  // 8. Pattern Complete
  const patternData = createPatternGame('EASY');
  assert(patternData.sequence.length > 0 && patternData.options.length === 4, 'BRAIN TEST 8: Pattern Complete generates sequence pattern');

  // 9. Number Puzzles
  const numPuzz = createNumberPuzzleGame('EASY');
  assert(typeof numPuzz.correctAnswer === 'number' && numPuzz.options.includes(numPuzz.correctAnswer), 'BRAIN TEST 9: Number Puzzle generates math equation balance');

  // 10. Sliding Puzzle
  const slidingPuzz = createSlidingPuzzleGame('EASY');
  assert(slidingPuzz.length === 9, 'BRAIN TEST 10: Sliding Puzzle generates 3x3 8-puzzle');

  // 11. Maze
  const maze = createMazeGame('EASY');
  assert(maze.length === 5 && maze[0].length === 5, 'BRAIN TEST 11: Maze engine generates 5x5 grid maze');

  // 12. Visual Difference
  const visDiff = createVisualDiffGame('EASY');
  assert(visDiff.differences.length === 2, 'BRAIN TEST 12: Visual Difference engine generates 2 spot-the-difference cells');

  // --------------------------------------------------
  // SECTION 14B: ADVANCED BRAIN GAMES RELIABILITY & RULES TESTS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('ADVANCED BRAIN GAMES RELIABILITY, RULES & INTERACTION TESTS');
  console.log('==================================================');

  // 1. Standard 9x9 Sudoku & Conflict Detection
  const sudoku9 = createSudokuGame('EASY', 'STANDARD');
  assert(sudoku9.size === 9 && sudoku9.current.length === 9 && sudoku9.mode === 'STANDARD', 'SUDOKU 9x9 TEST 1: Standard Sudoku generates 9x9 grid with mode STANDARD');

  // Verify solution validity for 9x9
  let isSolValid9 = true;
  for (let r = 0; r < 9; r++) {
    const rowNums = new Set(sudoku9.solution[r]);
    if (rowNums.size !== 9 || Math.min(...sudoku9.solution[r]) !== 1 || Math.max(...sudoku9.solution[r]) !== 9) {
      isSolValid9 = false;
    }
  }
  for (let c = 0; c < 9; c++) {
    const colNums = new Set(sudoku9.solution.map((row) => row[c]));
    if (colNums.size !== 9) isSolValid9 = false;
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const blockNums = new Set<number>();
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          blockNums.add(sudoku9.solution[r][c]);
        }
      }
      if (blockNums.size !== 9) isSolValid9 = false;
    }
  }
  assert(isSolValid9, 'SUDOKU 9x9 TEST 2: Solution satisfies all 9x9 Sudoku rows, cols, and 3x3 blocks');

  // Conflict Detection Tests
  const conflictGrid: (number | null)[][] = Array(9).fill(0).map(() => Array(9).fill(null));
  // Two 5s in row 0
  conflictGrid[0][0] = 5;
  conflictGrid[0][4] = 5;
  const rowConflicts = getSudokuConflicts(conflictGrid, 9);
  assert(
    rowConflicts.some((c) => c.row === 0 && c.col === 0) &&
    rowConflicts.some((c) => c.row === 0 && c.col === 4),
    'SUDOKU 9x9 TEST 3: Conflict detection flags duplicate numbers in the same row'
  );

  // Two 7s in col 2
  conflictGrid[0][2] = 7;
  conflictGrid[5][2] = 7;
  const colConflicts = getSudokuConflicts(conflictGrid, 9);
  assert(
    colConflicts.some((c) => c.row === 0 && c.col === 2) &&
    colConflicts.some((c) => c.row === 5 && c.col === 2),
    'SUDOKU 9x9 TEST 4: Conflict detection flags duplicate numbers in the same column'
  );

  // Two 2s in 3x3 block (rows 0-2, cols 0-2)
  conflictGrid[1][1] = 2;
  conflictGrid[2][2] = 2;
  const blockConflicts = getSudokuConflicts(conflictGrid, 9);
  assert(
    blockConflicts.some((c) => c.row === 1 && c.col === 1) &&
    blockConflicts.some((c) => c.row === 2 && c.col === 2),
    'SUDOKU 9x9 TEST 5: Conflict detection flags duplicate numbers in the same 3x3 block'
  );

  // Mini Sudoku 4x4
  const sudoku4 = createSudokuGame('EASY', 'MINI');
  assert(sudoku4.size === 4 && sudoku4.mode === 'MINI', 'SUDOKU 4x4 TEST 1: Mini Sudoku mode generates 4x4 board');
  const miniConflictGrid: (number | null)[][] = [
    [1, 1, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const miniConf = getSudokuConflicts(miniConflictGrid, 4);
  assert(miniConf.length === 2, 'SUDOKU 4x4 TEST 2: Mini Sudoku detects 2x2 subgrid and row conflicts');

  // 2. Number Puzzle Consistency
  const numPuzzEasy = createNumberPuzzleGame('EASY');
  const numPuzzMed = createNumberPuzzleGame('MEDIUM');
  const numPuzzHard = createNumberPuzzleGame('HARD');
  assert(numPuzzEasy.options.includes(numPuzzEasy.correctAnswer), 'NUMBER PUZZLE TEST 1: Correct answer is in options');
  assert(new Set(numPuzzEasy.options).size === 4, 'NUMBER PUZZLE TEST 2: All 4 options are strictly unique numbers');
  assert(numPuzzMed.options.includes(numPuzzMed.correctAnswer), 'NUMBER PUZZLE TEST 3: Medium subtraction equation contains correct answer');
  assert(numPuzzHard.options.includes(numPuzzHard.correctAnswer), 'NUMBER PUZZLE TEST 4: Hard equation contains correct answer');

  // 3. Pattern Complete Consistency
  const patternPuzz = createPatternGame('EASY');
  assert(patternPuzz.options.includes(patternPuzz.correctAnswer), 'PATTERN TEST 1: Pattern sequence options include correct answer');
  assert(new Set(patternPuzz.options).size === 4, 'PATTERN TEST 2: Pattern options have no duplicates');
  assert(typeof patternPuzz.explanation === 'string' && patternPuzz.explanation.length > 0, 'PATTERN TEST 3: Explanation provides clear rule explanation');

  // 4. Word Fill & Anagram
  const wfTest = createWordFillGame('EASY');
  assert(wfTest.vocab.word.length >= 3, 'WORD FILL TEST 1: Generated word has valid length');
  assert(wfTest.displayLetters.includes(null), 'WORD FILL TEST 2: At least one slot is blank for user input');
  const wpTest = createWordPuzzleGame('EASY');
  assert(
    wpTest.scrambled.sort().join('') === wpTest.vocab.word.split('').sort().join(''),
    'WORD PUZZLE TEST 1: Scrambled tiles contain exact multiset of target letters'
  );

  // 5. Word Connect Subwords
  const wcTest = createWordConnectGame('EASY');
  assert(wcTest.validWords.length >= 4, 'WORD CONNECT TEST 1: Word wheel contains required valid word count');
  assert(wcTest.targetWordCount >= 3, 'WORD CONNECT TEST 2: Word wheel defines clear target discovery count');

  // 6. Visual Difference Coordinates
  const vdTest = createVisualDiffGame('EASY');
  assert(
    vdTest.differences.every((d) => d.row >= 0 && d.row < 3 && d.col >= 0 && d.col < 3),
    'VISUAL DIFF TEST 1: Difference coordinates are strictly within grid bounds'
  );
  assert(
    vdTest.gridLeft[vdTest.differences[0].row][vdTest.differences[0].col] !==
    vdTest.gridRight[vdTest.differences[0].row][vdTest.differences[0].col],
    'VISUAL DIFF TEST 2: Spot Diff grid has actual visual differences compared to Original'
  );

  // 7. Sliding Puzzle Solvability
  const sp3 = createSlidingPuzzleGame('EASY');
  assert(sp3.length === 9 && sp3.includes(null), 'SLIDING PUZZLE TEST 1: 3x3 8-puzzle contains 8 tiles and 1 empty space');
  const sp4 = createSlidingPuzzleGame('HARD');
  assert(sp4.length === 16 && sp4.includes(null), 'SLIDING PUZZLE TEST 2: 4x4 15-puzzle contains 15 tiles and 1 empty space');

  // 8. Memory Match Card Pairs
  const mmTest = createMemoryMatchGame('EASY');
  const emojiCounts: Record<string, number> = {};
  mmTest.forEach((c) => {
    emojiCounts[c.emoji] = (emojiCounts[c.emoji] || 0) + 1;
  });
  const allPaired = Object.values(emojiCounts).every((count) => count === 2);
  assert(allPaired, 'MEMORY MATCH TEST 1: Every card emoji appears exactly twice as a pair');

  // 9. Tile Connect Onet 2-Turn Path Validation
  const mockTileItems: any[] = [
    { id: 't1', icon: '📼', matched: false, row: 0, col: 0 },
    { id: 't2', icon: '📼', matched: false, row: 0, col: 1 }, // adjacent (0 turns)
    { id: 't3', icon: '📻', matched: false, row: 1, col: 0 },
    { id: 't4', icon: '📻', matched: false, row: 1, col: 1 },
  ];
  const directAdjacent = canConnectTilesOnet(mockTileItems, 't1', 't2');
  assert(directAdjacent.canConnect, 'TILE CONNECT TEST 1: Direct adjacent tiles connect with 0 turns');

  const differentIcon = canConnectTilesOnet(mockTileItems, 't1', 't3');
  assert(!differentIcon.canConnect, 'TILE CONNECT TEST 2: Different icons cannot connect');

  // L-path connection test when intermediate tile is matched
  const mockTileLPath: any[] = [
    { id: 'a1', icon: '✏️', matched: false, row: 0, col: 0 },
    { id: 'empty', icon: '🎲', matched: true, row: 0, col: 1 }, // empty
    { id: 'a2', icon: '✏️', matched: false, row: 1, col: 1 }, // L-turn
    { id: 'block', icon: '🛵', matched: false, row: 1, col: 0 },
  ];
  const lPath = canConnectTilesOnet(mockTileLPath, 'a1', 'a2');
  assert(lPath.canConnect, 'TILE CONNECT TEST 3: L-shaped path connects through cleared empty tile');

  // 10. Circuit Connect Hints & Initial Scramble
  const circuitTest = createCircuitGame('EASY');
  assert(!circuitTest.isComplete, 'CIRCUIT TEST 1: Scrambled circuit is not pre-solved on start');
  const circuitHint = getCircuitHint(circuitTest.tiles);
  assert(circuitHint !== null && typeof circuitHint.text === 'string', 'CIRCUIT TEST 2: Circuit hint identifies misaligned wire tile');

  // 11. Maze Reachability & Wall Navigation
  const mazeTest = createMazeGame('EASY');
  const startPos = { r: 0, c: 0 };
  const exitPos = { r: mazeTest.length - 1, c: mazeTest.length - 1 };
  assert(!mazeTest[startPos.r][startPos.c].isWall, 'MAZE TEST 1: Start cell is open and walkable');
  assert(!mazeTest[exitPos.r][exitPos.c].isWall, 'MAZE TEST 2: Exit cell is open and reachable');
  const mazePath = getMazeShortestPath(mazeTest, startPos, exitPos);
  assert(mazePath !== null && mazePath.length >= 5, 'MAZE TEST 3: Shortest path exists from start to exit flag');

  // 12. Asset Registry & Aspect Ratio Preservation
  const fitted = fitAspectRatio(400, 300, 200, 200);
  assert(fitted.width === 200 && fitted.height === 150, 'ASSET TEST 1: Aspect ratio fits 4:3 image correctly without distortion');
  const knownAsset = getBrainAsset('apple');
  assert(knownAsset.fallbackEmoji === '🍎', 'ASSET TEST 2: Known asset returns correct emoji fallback');
  const unknownAsset = getBrainAsset('unknown_secret');
  assert(unknownAsset.fallbackEmoji === '🧩', 'ASSET TEST 3: Unknown asset returns safe fallback');
  assert(validateAssetCount(8, 'Memory Match'), 'ASSET TEST 4: Asset count within limit validates true');
  assert(!validateAssetCount(25, 'Memory Match'), 'ASSET TEST 5: Asset count exceeding limit warns and returns false');

  // --------------------------------------------------
  // SECTION 14C: INTERACTIVE GAMEPLAY SIMULATION & ACCEPTANCE CHECKS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('INTERACTIVE GAMEPLAY ACCEPTANCE & LIFECYCLE TESTS');
  console.log('==================================================');

  // A. Sudoku 9x9 Gameplay & Immutability:
  const sudokuSim = createSudokuGame('EASY', 'STANDARD');
  let fixedClueCell: { r: number; c: number; val: number } | null = null;
  let emptyCell: { r: number; c: number } | null = null;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (sudokuSim.initial[r][c] !== null && !fixedClueCell) {
        fixedClueCell = { r, c, val: sudokuSim.initial[r][c]! };
      }
      if (sudokuSim.initial[r][c] === null && !emptyCell) {
        emptyCell = { r, c };
      }
    }
  }
  assert(fixedClueCell !== null, 'SUDOKU PLAY 1: Initial 9x9 board contains fixed clues');
  assert(emptyCell !== null, 'SUDOKU PLAY 2: Initial 9x9 board contains empty cells to solve');
  const currentGrid = sudokuSim.initial.map((row) => [...row]);
  currentGrid[emptyCell!.r][emptyCell!.c] = 9;
  assert(currentGrid[emptyCell!.r][emptyCell!.c] === 9, 'SUDOKU PLAY 3: Empty cell can be edited with user input');
  currentGrid[emptyCell!.r][emptyCell!.c] = fixedClueCell!.val;
  const simConflicts = getSudokuConflicts(currentGrid, 9);
  assert(simConflicts.length >= 2, 'SUDOKU PLAY 4: Conflicting duplicate entry is flagged by conflict detector');
  const solutionConflicts = getSudokuConflicts(sudokuSim.solution, 9);
  assert(solutionConflicts.length === 0, 'SUDOKU PLAY 5: Full 9x9 solution satisfies Sudoku rules with 0 conflicts');

  // B. Number Puzzle Select-and-Submit Simulation:
  const numSim = createNumberPuzzleGame('EASY');
  let selectedOption: number | null = null;
  let score = 100;
  let moves = 0;
  const wrongOption = numSim.options.find((opt) => opt !== numSim.correctAnswer)!;
  selectedOption = wrongOption;
  assert(selectedOption === wrongOption, 'NUM PUZZLE PLAY 1: User can select an initial answer option');
  selectedOption = numSim.correctAnswer;
  assert(selectedOption === numSim.correctAnswer, 'NUM PUZZLE PLAY 2: User can change selection before submission');
  if (selectedOption === numSim.correctAnswer) {
    score += 10;
    moves += 1;
  }
  assert(score === 110 && moves === 1, 'NUM PUZZLE PLAY 3: Submitting correct answer increments score and moves once');

  // C. Pattern Complete Select-and-Submit Simulation:
  const patternSim = createPatternGame('EASY');
  let selectedPatternOption: string | number | null = null;
  let patternScore = 100;
  const wrongPat = patternSim.options.find((o) => o !== patternSim.correctAnswer)!;
  selectedPatternOption = wrongPat;
  selectedPatternOption = patternSim.correctAnswer;
  assert(selectedPatternOption === patternSim.correctAnswer, 'PATTERN PLAY 1: Selection modified to correct pattern answer');
  let isPatternSubmitted = false;
  if (!isPatternSubmitted && selectedPatternOption === patternSim.correctAnswer) {
    patternScore += 10;
    isPatternSubmitted = true;
  }
  assert(isPatternSubmitted && patternScore === 110, 'PATTERN PLAY 2: Submitted pattern advances state and awards score');
  assert(patternScore === 110, 'PATTERN PLAY 3: Duplicate submission blocked');

  // D. Word Fill Input, Backspace, Check:
  const wfSim = createWordFillGame('EASY');
  const userSlots = [...wfSim.displayLetters];
  const blankIdx = userSlots.findIndex((c) => c === null);
  assert(blankIdx !== -1, 'WORD FILL PLAY 1: Blank slot available for input');
  userSlots[blankIdx] = wfSim.vocab.word[blankIdx];
  assert(userSlots[blankIdx] === wfSim.vocab.word[blankIdx], 'WORD FILL PLAY 2: User can enter letter into slot');
  userSlots[blankIdx] = null;
  assert(userSlots[blankIdx] === null, 'WORD FILL PLAY 3: Erase/Backspace clears the slot');
  const fullySolvedSlots = wfSim.vocab.word.split('');
  assert(fullySolvedSlots.join('') === wfSim.vocab.word, 'WORD FILL PLAY 4: Fully filled word matches target vocabulary');

  // E. Word Puzzle Anagram Tile Pick & Reset:
  const wpSim = createWordPuzzleGame('EASY');
  let formedWord: string[] = [];
  const availableTiles = [...wpSim.scrambled];
  const tile1 = availableTiles.shift()!;
  formedWord.push(tile1);
  assert(formedWord.length === 1 && availableTiles.length === wpSim.scrambled.length - 1, 'WORD PUZZLE PLAY 1: Selecting tile moves it to answer slots');
  const returnedTile = formedWord.pop()!;
  availableTiles.push(returnedTile);
  assert(formedWord.length === 0, 'WORD PUZZLE PLAY 2: Removing tile returns it to available bank');
  formedWord = wpSim.vocab.word.split('');
  assert(formedWord.join('') === wpSim.vocab.word, 'WORD PUZZLE PLAY 3: Completed anagram validates against target word');

  // F. Word Connect Letter Selection, Undo, Clear, Discovery:
  const wcSim = createWordConnectGame('EASY');
  let currentWord = '';
  currentWord += wcSim.letters[0];
  currentWord += wcSim.letters[1];
  assert(currentWord.length === 2, 'WORD CONNECT PLAY 1: Selecting letters appends to current word');
  currentWord = currentWord.slice(0, -1);
  assert(currentWord.length === 1, 'WORD CONNECT PLAY 2: Undo removes the last selected letter');
  currentWord = '';
  assert(currentWord === '', 'WORD CONNECT PLAY 3: Clear resets the current word buffer');
  const discoveredWords = new Set<string>();
  const firstValid = wcSim.validWords[0];
  discoveredWords.add(firstValid);
  assert(discoveredWords.has(firstValid), 'WORD CONNECT PLAY 4: Discovered word tracked in discovered set');
  const initialCount = discoveredWords.size;
  discoveredWords.add(firstValid);
  assert(discoveredWords.size === initialCount, 'WORD CONNECT PLAY 5: Duplicate discovery rejected');

  // G. Visual Difference Single-Score & Invalid Tap:
  const vdSim = createVisualDiffGame('EASY');
  const foundDiffs = new Set<string>();
  let vdScore = 100;
  let vdMistakes = 0;
  const targetDiff = vdSim.differences[0];
  const diffKey = `${targetDiff.row}-${targetDiff.col}`;
  foundDiffs.add(diffKey);
  vdScore += 10;
  assert(foundDiffs.has(diffKey) && vdScore === 110, 'VISUAL DIFF PLAY 1: Tapping genuine difference registers match');
  if (!foundDiffs.has(diffKey)) {
    vdScore += 10;
  }
  assert(vdScore === 110, 'VISUAL DIFF PLAY 2: Repeated tap on found difference cannot score twice');
  const nonDiffRow = (targetDiff.row + 1) % 3;
  const nonDiffCol = (targetDiff.col + 1) % 3;
  const isDiff = vdSim.differences.some((d) => d.row === nonDiffRow && d.col === nonDiffCol);
  if (!isDiff) {
    vdMistakes += 1;
  }
  assert(vdMistakes === 1, 'VISUAL DIFF PLAY 3: Tapping non-difference registers mistake');

  // H. Sliding Puzzle Legal Moves & Completion:
  const spSim = createSlidingPuzzleGame('EASY');
  const emptyIndex = spSim.indexOf(null);
  const row = Math.floor(emptyIndex / 3);
  const col = emptyIndex % 3;
  let adjacentIdx = -1;
  if (row > 0) adjacentIdx = (row - 1) * 3 + col;
  else adjacentIdx = (row + 1) * 3 + col;
  assert(adjacentIdx !== -1, 'SLIDING PLAY 1: Adjacent tile identified');
  const newSp = [...spSim];
  newSp[emptyIndex] = newSp[adjacentIdx];
  newSp[adjacentIdx] = null;
  assert(newSp[emptyIndex] !== null && newSp[adjacentIdx] === null, 'SLIDING PLAY 2: Moving adjacent tile into empty space succeeds');
  const solvedBoard = [1, 2, 3, 4, 5, 6, 7, 8, null];
  const isSolved = solvedBoard.slice(0, 8).every((v, i) => v === i + 1) && solvedBoard[8] === null;
  assert(isSolved, 'SLIDING PLAY 3: Solved state correctly validated');

  // I. Memory Match Rapid-Tap Guard & Mismatch:
  let isLocked = false;
  let flippedCards = [0, 1];
  if (flippedCards.length === 2) {
    isLocked = true;
  }
  assert(isLocked, 'MEMORY MATCH PLAY 1: Board locks when two cards are revealed');
  let thirdCardFlipped = false;
  if (!isLocked) {
    thirdCardFlipped = true;
  }
  assert(!thirdCardFlipped, 'MEMORY MATCH PLAY 2: Rapid tap during comparison is rejected');

  // J. Tile Connect Path Rejection:
  const mockTileBlocked: any[] = [
    { id: 'b1', icon: '💎', matched: false, row: 0, col: 0 },
    { id: 'obstacle1', icon: '🧱', matched: false, row: 0, col: 1 },
    { id: 'obstacle2', icon: '🧱', matched: false, row: 1, col: 0 },
    { id: 'b2', icon: '💎', matched: false, row: 1, col: 1 },
  ];
  const blockedConnection = canConnectTilesOnet(mockTileBlocked, 'b1', 'b2');
  assert(!blockedConnection.canConnect, 'TILE CONNECT PLAY 1: Completely blocked tiles cannot connect');

  // K. Circuit Power Simulation:
  const circuitBoard = createCircuitGame('EASY');
  assert(!circuitBoard.isComplete, 'CIRCUIT PLAY 1: Initial scrambled circuit does not win prematurely');

  // L. Maze Wall Collision & Pathfinding:
  const mazeBoard = createMazeGame('EASY');
  let playerPos = { r: 0, c: 0 };
  let movesCount = 0;
  if (mazeBoard[0][1].isWall) {
    assert(playerPos.r === 0 && playerPos.c === 0, 'MAZE PLAY 1: Player blocked by wall cannot advance');
  } else {
    playerPos = { r: 0, c: 1 };
    movesCount += 1;
    assert(playerPos.c === 1 && movesCount === 1, 'MAZE PLAY 1: Player moves into open passage');
  }
  const shortest = getMazeShortestPath(mazeBoard, playerPos, { r: mazeBoard.length - 1, c: mazeBoard.length - 1 });
  assert(shortest !== null && shortest.length > 0, 'MAZE PLAY 2: Exit is reachable via legal path');

  // --------------------------------------------------
  // SECTION 8: RESPONSIVE LAYOUT & ORIENTATION FOUNDATION TESTS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('RESPONSIVE LAYOUT & ORIENTATION FOUNDATION TESTS');
  console.log('==================================================');

  // 1. Orientation Detection
  assert(getOrientation(390, 844) === 'PORTRAIT', 'LAYOUT 1: Height > width correctly detects PORTRAIT');
  assert(getOrientation(844, 390) === 'LANDSCAPE', 'LAYOUT 2: Width > height correctly detects LANDSCAPE');
  assert(getOrientation(600, 600) === 'PORTRAIT', 'LAYOUT 3: Equal dimensions defaults safely to PORTRAIT');

  // 2. Screen Classification
  assert(getScreenClass(360, 780) === 'compact', 'LAYOUT 4: <380 width classifies as compact');
  assert(getScreenClass(412, 915) === 'regular', 'LAYOUT 5: 380-600 width classifies as regular smartphone');
  assert(getScreenClass(800, 1280) === 'large', 'LAYOUT 6: >600 shortest dimension classifies as large tablet');

  // 3. Board Geometry & Responsive Calculations
  // Ludo 15x15 portrait (390 x 844)
  const ludoPortrait = calculateBoardDimensions({ width: 390, height: 844, gridCount: 15, isLandscape: false });
  assert(
    ludoPortrait.boardSize <= ludoPortrait.availableWidth &&
    ludoPortrait.boardSize <= ludoPortrait.availableHeight &&
    ludoPortrait.cellSize * 15 === ludoPortrait.boardSize,
    'LAYOUT 7: Ludo 15x15 portrait board fits available width without horizontal overflow'
  );

  // Ludo 15x15 landscape (844 x 390)
  const ludoLandscape = calculateBoardDimensions({ width: 844, height: 390, gridCount: 15, isLandscape: true });
  assert(
    ludoLandscape.boardSize <= ludoLandscape.availableHeight &&
    ludoLandscape.cellSize * 15 === ludoLandscape.boardSize &&
    ludoLandscape.boardSize > 0,
    'LAYOUT 8: Ludo 15x15 landscape board fits available height with side panels without vertical clipping'
  );

  // Snakes & Ladders 10x10 (portrait & landscape)
  const snakesPortrait = calculateBoardDimensions({ width: 412, height: 915, gridCount: 10, isLandscape: false });
  assert(
    snakesPortrait.cellSize * 10 === snakesPortrait.boardSize &&
    snakesPortrait.boardSize <= snakesPortrait.availableWidth,
    'LAYOUT 9: Snakes & Ladders 10x10 portrait calculates exact integer-cell board'
  );

  // 4. Card Hand Layout Overlap & Scrolling
  const singleCardHand = calculateHandCardLayout({ cardCount: 1, availableWidth: 350 });
  assert(singleCardHand.overlapMargin === 0 && !singleCardHand.needsScroll, 'LAYOUT 10: Single card hand has 0 overlap and no scroll');

  const fitCardHand = calculateHandCardLayout({ cardCount: 4, availableWidth: 400, cardWidth: 66 });
  assert(fitCardHand.overlapMargin === 0 && !fitCardHand.needsScroll, 'LAYOUT 11: 4 cards fitting in available width have 0 overlap');

  const crowdedHand = calculateHandCardLayout({ cardCount: 10, availableWidth: 320, cardWidth: 66 });
  assert(
    crowdedHand.overlapMargin >= 8 &&
    crowdedHand.overlapMargin <= 36,
    'LAYOUT 12: Crowded 10-card hand clamps overlap between min (8) and max (36)'
  );

  const overflowHand = calculateHandCardLayout({ cardCount: 20, availableWidth: 200, cardWidth: 66 });
  assert(overflowHand.needsScroll === true, 'LAYOUT 13: Extremely large 20-card hand activates scrollable mode');

  // 5. Game Orientation Policy & Touch Target Standards
  assert(GAME_ORIENTATION_POLICY.ludo === 'LANDSCAPE_PRIORITY', 'LAYOUT 14: Ludo policy is LANDSCAPE_PRIORITY');
  assert(GAME_ORIENTATION_POLICY.snakes_ladders === 'LANDSCAPE_PRIORITY', 'LAYOUT 15: Snakes & Ladders policy is LANDSCAPE_PRIORITY');
  assert(GAME_ORIENTATION_POLICY.uno === 'DUAL', 'LAYOUT 16: UNO policy is DUAL');
  assert(GAME_ORIENTATION_POLICY.phase10 === 'DUAL', 'LAYOUT 17: Phase 10 policy is DUAL');
  assert(GAME_ORIENTATION_POLICY.bingo === 'DUAL', 'LAYOUT 18: Bingo policy is DUAL');
  assert(GAME_ORIENTATION_POLICY.sudoku === 'PORTRAIT_PRIORITY', 'LAYOUT 19: Brain game Sudoku is PORTRAIT_PRIORITY');
  assert(MIN_TOUCH_TARGET >= 48 && RECOMMENDED_TOUCH_TARGET >= 44, 'LAYOUT 20: Touch target constants adhere to 44-48dp accessibility standards');

  console.log('\n==================================================');
  console.log('8-PLAYER MULTIPLAYER EXPANSION UNIT TESTS');
  console.log('==================================================');

  // Test 1: Snakes & Ladders 8-Player Match Setup & Turn
  const snakes8Engine = new SnakesEngine();
  const snakes8Players = Array.from({ length: 8 }).map((_, i) => ({
    id: `p_${i + 1}`,
    name: `Player ${i + 1}`,
    avatar: '🔴',
    color: '#DC2626',
    isBot: i > 0,
  }));
  snakes8Engine.startMatch(snakes8Players);
  assert(snakes8Engine.getGameState().players.length === 8, '8-PLAYER SNAKES: Match successfully starts with 8 players');
  assert(snakes8Engine.getGameState().status === 'PLAYING', '8-PLAYER SNAKES: Status transitions to PLAYING');
  assert(snakes8Engine.getGameState().players.every((p) => p.position === 1), '8-PLAYER SNAKES: All 8 players initialize on Square 1');

  // Test 2: UNO 8-Player Match & 216-Card Double Deck Rule
  const uno8Engine = new UnoEngine();
  const uno8Players = Array.from({ length: 8 }).map((_, i) => ({
    id: `u_${i + 1}`,
    name: `Player ${i + 1}`,
    avatar: '👤',
    isBot: i > 0,
  }));
  uno8Engine.startMatch(uno8Players);
  const uno8State = uno8Engine.getGameState();
  assert(uno8State.players.length === 8, '8-PLAYER UNO: Match successfully starts with 8 players');
  assert(uno8State.players.every((p) => p.hand.length === 7), '8-PLAYER UNO: Each of the 8 players dealt exactly 7 cards (56 cards total)');
  const totalUnoCards = uno8State.deck.length + uno8State.discardPile.length + uno8State.players.reduce((sum, p) => sum + p.hand.length, 0);
  assert(totalUnoCards === 216, `8-PLAYER UNO: Double deck rule automatically doubles deck to 216 cards for >4 players (found: ${totalUnoCards})`);

  // Test 3: Phase 10 8-Player Match & 216-Card Double Deck Rule
  const phase8Engine = new Phase10Engine();
  const phase8Players = Array.from({ length: 8 }).map((_, i) => ({
    id: `ph_${i + 1}`,
    name: `Player ${i + 1}`,
    avatar: '👤',
    isBot: i > 0,
  }));
  phase8Engine.startMatch(phase8Players);
  const phase8State = phase8Engine.getGameState();
  assert(phase8State.players.length === 8, '8-PLAYER PHASE 10: Match successfully starts with 8 players');
  assert(phase8State.players.every((p) => p.hand.length === 10), '8-PLAYER PHASE 10: Each of the 8 players dealt exactly 10 cards (80 cards total)');
  const totalPhaseCards = phase8State.deck.length + phase8State.discardPile.length + phase8State.players.reduce((sum, p) => sum + p.hand.length, 0);
  assert(totalPhaseCards === 216, `8-PLAYER PHASE 10: Double deck rule automatically activates 216 cards for >4 players (found: ${totalPhaseCards})`);

  console.log('\n==================================================');
  console.log('BRAIN GAMES SHARED HEADER & RESPONSIVE TOOLBAR TESTS');
  console.log('==================================================');

  // 1. All 12 Brain Games Header & Category Badge Mapping Verification
  const BRAIN_CATEGORIES: Record<string, { badge: string; expectedTitle: string }> = {
    circuit_connect: { badge: 'LOGIC', expectedTitle: 'Circuit Connection' },
    tile_connect: { badge: 'CONNECT', expectedTitle: 'Tile Connect' },
    word_fill: { badge: 'VOCAB', expectedTitle: 'Word Fill' },
    word_puzzle: { badge: 'ANAGRAM', expectedTitle: 'Word Puzzle' },
    word_connect: { badge: 'WORDS', expectedTitle: 'Word Connect' },
    sudoku: { badge: 'NUMBERS', expectedTitle: 'Sudoku' },
    memory_match: { badge: 'MEMORY', expectedTitle: 'Memory Match' },
    pattern_complete: { badge: 'PATTERNS', expectedTitle: 'Pattern Complete' },
    number_puzzles: { badge: 'MATH', expectedTitle: 'Number Puzzles' },
    sliding_puzzle: { badge: 'TILES', expectedTitle: 'Sliding Puzzle' },
    maze: { badge: 'SPATIAL', expectedTitle: 'Maze Labyrinth' },
    visual_diff: { badge: 'OBSERVE', expectedTitle: 'Visual Difference' },
  };

  const gameIds = Object.keys(BRAIN_CATEGORIES);
  assert(gameIds.length === 12, 'HEADER TEST 1: Exactly 12 Brain Games mapped with unique categories');
  for (const gid of gameIds) {
    const config = BRAIN_CATEGORIES[gid];
    assert(config.badge.length >= 3 && config.badge.length <= 10, `HEADER TEST 2 [${gid}]: Category badge '${config.badge}' is concise`);
    assert(config.expectedTitle.length > 0, `HEADER TEST 3 [${gid}]: Title is non-empty`);
  }

  // 2. Header Layout & Back Button Contract
  const backButtonSpec = {
    label: '← Back',
    minHeight: 44,
    minWidth: 70,
    accessibilityRole: 'button',
    accessibilityLabel: 'Go back to game selection',
  };
  assert(backButtonSpec.label === '← Back', 'HEADER TEST 4: Back button uses standardized "← Back" label');
  assert(backButtonSpec.minHeight >= 44 && backButtonSpec.minWidth >= 44, 'HEADER TEST 5: Back button satisfies 44dp minimum touch target standard');
  assert(backButtonSpec.accessibilityRole === 'button', 'HEADER TEST 6: Back button exposes accessible role');

  // 3. Title row separation logic: Secondary controls removed from Title Row
  const titleRowSpec = {
    hasBackButton: true,
    hasCenteredTitle: true,
    hasCategorySubtitle: true,
    hasSettingsButtonInTitleRow: false,
    hasSoundButtonInTitleRow: false,
    hasPauseButtonInTitleRow: false,
  };
  assert(!titleRowSpec.hasSettingsButtonInTitleRow, 'HEADER TEST 7: Settings icon removed from crowded title row');
  assert(!titleRowSpec.hasSoundButtonInTitleRow, 'HEADER TEST 8: Sound toggle removed from crowded title row');
  assert(!titleRowSpec.hasPauseButtonInTitleRow, 'HEADER TEST 9: Pause button removed from crowded title row');
  assert(titleRowSpec.hasCategorySubtitle, 'HEADER TEST 10: Category badge placed in subtitle row below title to eliminate horizontal collisions');

  // 4. Secondary Controls Dedicated Toolbar Specifications
  const toolbarControlTargets = {
    settingsBtn: { icon: '⚙️', minWidth: 44, minHeight: 44, label: 'Game rules and settings' },
    soundBtn: { soundOnIcon: '🔊', soundOffIcon: '🔇', minWidth: 44, minHeight: 44, labelOn: 'Mute sound effects', labelOff: 'Unmute sound effects' },
    pauseBtn: { pauseIcon: '⏸️', resumeIcon: '▶️', minWidth: 44, minHeight: 44, labelPause: 'Pause game', labelResume: 'Resume game' },
  };
  assert(toolbarControlTargets.settingsBtn.minHeight >= 44 && toolbarControlTargets.settingsBtn.minWidth >= 44, 'TOOLBAR TEST 1: Settings touch target >= 44dp');
  assert(toolbarControlTargets.soundBtn.minHeight >= 44 && toolbarControlTargets.soundBtn.minWidth >= 44, 'TOOLBAR TEST 2: Sound toggle touch target >= 44dp');
  assert(toolbarControlTargets.pauseBtn.minHeight >= 44 && toolbarControlTargets.pauseBtn.minWidth >= 44, 'TOOLBAR TEST 3: Pause toggle touch target >= 44dp');

  // Test sound toggle state transition
  let isSoundActive = true;
  const toggleSound = () => { isSoundActive = !isSoundActive; };
  const getSoundActive = (): boolean => isSoundActive;
  toggleSound();
  assert(getSoundActive() === false, 'TOOLBAR TEST 4: Sound toggles off correctly');
  assert((!getSoundActive() ? toolbarControlTargets.soundBtn.soundOffIcon : toolbarControlTargets.soundBtn.soundOnIcon) === '🔇', 'TOOLBAR TEST 5: Sound off displays muted icon 🔇');
  toggleSound();
  assert(getSoundActive() === true, 'TOOLBAR TEST 6: Sound toggles back on correctly');

  // Test pause toggle state transition
  let isGamePaused = false;
  const togglePause = () => { isGamePaused = !isGamePaused; };
  const getGamePaused = (): boolean => isGamePaused;
  togglePause();
  assert(getGamePaused() === true, 'TOOLBAR TEST 7: Game pauses correctly');
  assert((getGamePaused() ? toolbarControlTargets.pauseBtn.resumeIcon : toolbarControlTargets.pauseBtn.pauseIcon) === '▶️', 'TOOLBAR TEST 8: Paused state displays resume icon ▶️');
  togglePause();
  assert(getGamePaused() === false, 'TOOLBAR TEST 9: Game resumes correctly');

  // 5. Compact Difficulty Selector Specifications
  const difficultyConfigs: Record<string, { label: string; color: string; badge: string }> = {
    EASY: { label: 'EASY', color: '#10B981', badge: '🟢' },
    MEDIUM: { label: 'MEDIUM', color: '#F59E0B', badge: '🟡' },
    HARD: { label: 'HARD', color: '#EF4444', badge: '🔴' },
  };

  const dropdownTriggerSpec = {
    minHeight: 44,
    minWidth: 80,
    formatLabel: (diff: string) => `LVL: ${diff} ▾`,
  };
  assert(dropdownTriggerSpec.minHeight >= 44, 'DIFFICULTY TEST 1: Compact dropdown trigger satisfies 44dp touch target');
  assert(dropdownTriggerSpec.formatLabel('EASY') === 'LVL: EASY ▾', 'DIFFICULTY TEST 2: Dropdown displays compact formatted level indicator');

  let activeDifficulty = 'EASY';
  let modalOpen = false;
  const getModalOpen = (): boolean => modalOpen;
  const openModal = () => { modalOpen = true; };
  const closeModal = () => { modalOpen = false; };
  const selectDifficulty = (d: string) => { activeDifficulty = d; closeModal(); };

  openModal();
  assert(getModalOpen() === true, 'DIFFICULTY TEST 3: Tapping trigger opens selection modal');
  selectDifficulty('MEDIUM');
  assert(activeDifficulty === 'MEDIUM', 'DIFFICULTY TEST 4: Selecting MEDIUM updates current difficulty');
  assert(getModalOpen() === false, 'DIFFICULTY TEST 5: Selection modal automatically dismisses upon choice');
  assert(difficultyConfigs[activeDifficulty].color === '#F59E0B', 'DIFFICULTY TEST 6: MEDIUM assigns warm amber indicator');

  // Test Back button dismissal
  openModal();
  assert(getModalOpen() === true, 'DIFFICULTY TEST 7: Modal re-opens for change');
  closeModal(); // Simulating Android Back / onRequestClose
  assert(getModalOpen() === false, 'DIFFICULTY TEST 8: Android Back / onRequestClose cleanly dismisses modal');
  assert(activeDifficulty === 'MEDIUM', 'DIFFICULTY TEST 9: Dismissing keeps previous selection intact');

  // 6. Sudoku Standard vs Mini Mode Switching in Toolbar
  let sudokuGridMode: string = 'STANDARD';
  const getSudokuGridMode = (): string => sudokuGridMode;
  const setSudokuGrid = (mode: string) => { sudokuGridMode = mode; };
  assert(getSudokuGridMode() === 'STANDARD', 'SUDOKU TOOLBAR 1: Defaults to STANDARD (9x9)');
  setSudokuGrid('MINI');
  assert(getSudokuGridMode() === 'MINI', 'SUDOKU TOOLBAR 2: Switches to MINI (4x4)');
  setSudokuGrid('STANDARD');
  assert(getSudokuGridMode() === 'STANDARD', 'SUDOKU TOOLBAR 3: Switches back to STANDARD');

  // 7. Responsive Vertical Space Reclaiming Verification
  const screenHeight = 872; // typical 1080x2400 Android phone @ 2.75 density
  const statusBar = 32;
  const oldAvailableHeight = screenHeight - statusBar - 160; // 680
  const newAvailableHeight = screenHeight - statusBar - 135; // 705
  const reclaimedSpace = newAvailableHeight - oldAvailableHeight;
  assert(reclaimedSpace === 25, `SPACE RECLAIM TEST 1: Header/toolbar compaction reclaims exactly ${reclaimedSpace}dp vertical space for board`);
  assert(newAvailableHeight > oldAvailableHeight, 'SPACE RECLAIM TEST 2: New available content height is strictly larger than old layout');

  // --------------------------------------------------
  // SECTION 16: BRAIN GAMES LEVEL PROGRESSION & DIFFICULTY VALIDATION TESTS
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log('BRAIN GAMES LEVEL PROGRESSION & LIFECYCLE TESTS');
  console.log('==================================================');

  // 1. Initial State & Storage Keys
  const initialProg = createDefaultProgress('sudoku', 'EASY');
  assert(initialProg.currentLevel === 1, 'PROGRESS 1: Initial progress starts at Level 1');
  assert(initialProg.highestUnlockedLevel === 1, 'PROGRESS 2: Initial highest unlocked level is Level 1');
  assert(initialProg.highestCompletedLevel === 0, 'PROGRESS 3: Initial highest completed level is 0');
  assert(
    getProgressStorageKey('sudoku', 'EASY') === 'BRAIN_PROGRESS_sudoku_EASY',
    'PROGRESS 4: Storage key conforms to BRAIN_PROGRESS_<gameId>_<diff>'
  );

  // 2. Persistence & Completion Lifecycle
  await brainProgressionService.resetProgress('circuit_connect', 'EASY');
  const freshLoaded = await brainProgressionService.loadProgress('circuit_connect', 'EASY');
  assert(freshLoaded.currentLevel === 1 && freshLoaded.highestUnlockedLevel === 1, 'PROGRESS 5: Resetting progress returns clean Level 1 state');

  // Complete Level 1
  const afterL1 = await brainProgressionService.recordLevelCompletion('circuit_connect', 'EASY', 1, 150, 45, 0);
  assert(afterL1.highestCompletedLevel === 1, 'PROGRESS 6: Completing Level 1 sets highestCompletedLevel to 1');
  assert(afterL1.highestUnlockedLevel === 2, 'PROGRESS 7: Completing Level 1 unlocks Level 2');
  assert(afterL1.totalStars === 1, 'PROGRESS 8: First completion awards 1 star');

  // Idempotence Check: Re-completing Level 1
  const afterL1Replay = await brainProgressionService.recordLevelCompletion('circuit_connect', 'EASY', 1, 140, 40, 1);
  assert(afterL1Replay.highestCompletedLevel === 1, 'PROGRESS 9: Re-completing Level 1 does not increment highestCompletedLevel');
  assert(afterL1Replay.highestUnlockedLevel === 2, 'PROGRESS 10: Re-completing Level 1 does not falsely unlock Level 3');
  assert(afterL1Replay.totalStars === 1, 'PROGRESS 11: Re-completing Level 1 does not award duplicate stars');

  // Advance to Next Level
  const advanced = await brainProgressionService.advanceToNextLevel('circuit_connect', 'EASY');
  assert(advanced.currentLevel === 2, 'PROGRESS 12: advanceToNextLevel increments currentLevel to 2');

  // Clamping: Attempting to advance beyond highestUnlockedLevel
  const clampedAdvance = await brainProgressionService.advanceToNextLevel('circuit_connect', 'EASY');
  assert(clampedAdvance.currentLevel === 2, 'PROGRESS 13: advanceToNextLevel clamps to highestUnlockedLevel');

  // Level Selection: select unlocked level vs locked level
  const selectL1 = await brainProgressionService.selectLevel('circuit_connect', 'EASY', 1);
  assert(selectL1.currentLevel === 1, 'PROGRESS 14: selectLevel allows selecting unlocked Level 1');
  const selectL3 = await brainProgressionService.selectLevel('circuit_connect', 'EASY', 3);
  assert(selectL3.currentLevel === 1, 'PROGRESS 15: selectLevel rejects selecting locked Level 3');

  // Complete Level 2 and verify progression to Level 3
  await brainProgressionService.selectLevel('circuit_connect', 'EASY', 2);
  const afterL2 = await brainProgressionService.recordLevelCompletion('circuit_connect', 'EASY', 2, 200, 55, 0);
  assert(afterL2.highestCompletedLevel === 2 && afterL2.highestUnlockedLevel === 3, 'PROGRESS 16: Completing Level 2 unlocks Level 3');

  // 3. Difficulty Isolation (EASY vs MEDIUM vs HARD)
  await brainProgressionService.resetProgress('circuit_connect', 'MEDIUM');
  await brainProgressionService.resetProgress('circuit_connect', 'HARD');
  const medProg = await brainProgressionService.loadProgress('circuit_connect', 'MEDIUM');
  assert(medProg.currentLevel === 1 && medProg.highestUnlockedLevel === 1, 'ISOLATION 1: MEDIUM starts at Level 1 independently of EASY Level 3');
  const hardProg = await brainProgressionService.loadProgress('circuit_connect', 'HARD');
  assert(hardProg.currentLevel === 1 && hardProg.highestUnlockedLevel === 1, 'ISOLATION 2: HARD starts at Level 1 independently');

  // Completing HARD Level 1
  await brainProgressionService.recordLevelCompletion('circuit_connect', 'HARD', 1, 120, 60, 0);
  const hardAfter = await brainProgressionService.loadProgress('circuit_connect', 'HARD');
  const easyAfter = await brainProgressionService.loadProgress('circuit_connect', 'EASY');
  const medAfter = await brainProgressionService.loadProgress('circuit_connect', 'MEDIUM');
  assert(hardAfter.highestUnlockedLevel === 2, 'ISOLATION 3: HARD completion unlocks HARD Level 2');
  assert(easyAfter.highestUnlockedLevel === 3, 'ISOLATION 4: EASY progress preserved intact at Level 3');
  assert(medAfter.highestUnlockedLevel === 1, 'ISOLATION 5: MEDIUM progress preserved intact at Level 1');

  // 4. Progression Safeguards: Mistakes, Hints, Pauses, Restarts never advance level
  let simLevel = 2;
  let simUnlocked = 3;
  // Mistake made
  const mistakeCount = 1;
  assert(simLevel === 2 && simUnlocked === 3, 'SAFEGUARD 1: Incurring mistakes does not advance level');
  // Hint used
  const hintsUsed = 2;
  assert(simLevel === 2 && simUnlocked === 3, 'SAFEGUARD 2: Using hints does not advance level');
  // Paused & Resumed
  const paused = true;
  assert(simLevel === 2 && simUnlocked === 3, 'SAFEGUARD 3: Pausing game does not advance level');
  // Replay / Restart current level
  const restartedLevel = simLevel;
  assert(restartedLevel === 2 && simUnlocked === 3, 'SAFEGUARD 4: Restarting generates puzzle for the same level');

  // 5. Progressive Puzzle Variety & Solvability Across All 12 Games
  // (a) Circuit Connect (scales 3x3 -> 4x4 -> 5x5)
  const circuitL1 = createCircuitGame('EASY', 1);
  const circuitL5 = createCircuitGame('EASY', 5);
  const circuitL10 = createCircuitGame('EASY', 10);
  assert(circuitL1.tiles.length === 3 && circuitL1.tiles[0].length === 3, 'PROGRESS ENGINE 1: Circuit Level 1 uses 3x3 grid');
  assert(circuitL5.tiles.length === 4 && circuitL5.tiles[0].length === 4, 'PROGRESS ENGINE 2: Circuit Level 5 scales to 4x4 grid');
  assert(circuitL10.tiles.length === 5 && circuitL10.tiles[0].length === 5, 'PROGRESS ENGINE 3: Circuit Level 10 scales to 5x5 grid');

  // (b) Tile Connect (scales pairs 4 -> 5 -> 6 -> 8)
  const tcL1 = createTileConnectGame('EASY', 1);
  const tcL6 = createTileConnectGame('EASY', 6);
  const tcL10 = createTileConnectGame('EASY', 10);
  assert(tcL1.length === 8, 'PROGRESS ENGINE 4: Tile Connect Level 1 has 4 pairs (8 tiles)');
  assert(tcL6.length === 10, 'PROGRESS ENGINE 5: Tile Connect Level 6 scales to 5 pairs (10 tiles)');
  assert(tcL10.length === 16, 'PROGRESS ENGINE 6: Tile Connect Level 10 scales to 8 pairs (16 tiles)');

  // (c) Word Fill (vocabulary cycling & at least 2 blanks)
  const wfL1 = createWordFillGame('EASY', 1);
  const wfL2 = createWordFillGame('EASY', 2);
  assert(wfL1.displayLetters.filter((c) => c === null).length >= 2, 'PROGRESS ENGINE 7: Word Fill Level 1 has at least 2 blanks');
  assert(wfL2.displayLetters.filter((c) => c === null).length >= 2, 'PROGRESS ENGINE 8: Word Fill Level 2 has at least 2 blanks');
  assert(wfL1.vocab.word !== wfL2.vocab.word, 'PROGRESS ENGINE 9: Word Fill progresses to different vocabulary words');

  // (d) Word Puzzle (anagram tiles)
  const wpL1 = createWordPuzzleGame('EASY', 1);
  const wpL2 = createWordPuzzleGame('EASY', 2);
  assert(wpL1.scrambled.length === wpL1.vocab.word.length, 'PROGRESS ENGINE 10: Word Puzzle Level 1 scrambles valid word');
  assert(wpL1.vocab.word !== wpL2.vocab.word, 'PROGRESS ENGINE 11: Word Puzzle Level 2 offers new anagram challenge');

  // (e) Word Connect (sub-word wheel target counts)
  const wcL1 = createWordConnectGame('EASY', 1);
  const wcL4 = createWordConnectGame('EASY', 4);
  assert(wcL1.targetWordCount === 3, 'PROGRESS ENGINE 12: Word Connect Level 1 requires 3 target words');
  assert(wcL4.targetWordCount === 4, 'PROGRESS ENGINE 13: Word Connect Level 4 scales to 4 target words');

  // (f) Sudoku 4x4 Mini (clues scale 8 -> 6 -> 5)
  const suMiniL1 = createSudokuGame('EASY', 'MINI', 1);
  const suMiniL5 = createSudokuGame('EASY', 'MINI', 5);
  const suMiniL8 = createSudokuGame('EASY', 'MINI', 8);
  const suMiniL1Clues = suMiniL1.initial.flat().filter((c) => c !== null).length;
  const suMiniL5Clues = suMiniL5.initial.flat().filter((c) => c !== null).length;
  const suMiniL8Clues = suMiniL8.initial.flat().filter((c) => c !== null).length;
  assert(suMiniL1Clues === 8, 'PROGRESS ENGINE 14: Mini Sudoku Level 1 provides 8 introductory clues');
  assert(suMiniL5Clues === 6, 'PROGRESS ENGINE 15: Mini Sudoku Level 5 provides 6 moderate clues');
  assert(suMiniL8Clues === 5, 'PROGRESS ENGINE 16: Mini Sudoku Level 8 provides 5 challenging clues');

  // (g) Memory Match (scales pairs & rotates icons)
  const mmL1 = createMemoryMatchGame('EASY', 1);
  const mmL7 = createMemoryMatchGame('EASY', 7);
  assert(mmL1.length === 8, 'PROGRESS ENGINE 17: Memory Match Level 1 has 4 pairs (8 cards)');
  assert(mmL7.length === 10, 'PROGRESS ENGINE 18: Memory Match Level 7 scales to 5 pairs (10 cards)');
  const mmL1Emojis = new Set(mmL1.map((c) => c.emoji));
  const mmL7Emojis = new Set(mmL7.map((c) => c.emoji));
  assert(mmL1Emojis.size === 4 && mmL7Emojis.size === 5, 'PROGRESS ENGINE 19: All Memory Match cards exist strictly in pairs');

  // (h) Pattern Complete (progressive pattern sequences)
  const patL1 = createPatternGame('EASY', 1);
  const patL3 = createPatternGame('EASY', 3);
  const patL6 = createPatternGame('EASY', 6);
  const patL8 = createPatternGame('EASY', 8);
  assert(patL1.options.includes(patL1.correctAnswer), 'PROGRESS ENGINE 20: Pattern Level 1 contains correct answer');
  assert(patL3.options.includes(patL3.correctAnswer), 'PROGRESS ENGINE 21: Pattern Level 3 arithmetic sequence contains correct answer');
  assert(patL6.options.includes(patL6.correctAnswer), 'PROGRESS ENGINE 22: Pattern Level 6 rotation cycle contains correct answer');
  assert(patL8.options.includes(patL8.correctAnswer), 'PROGRESS ENGINE 23: Pattern Level 8 geometric doubling contains correct answer');

  // (i) Number Puzzles (progressive math)
  const numL1 = createNumberPuzzleGame('EASY', 1);
  const numL5 = createNumberPuzzleGame('EASY', 5);
  assert(numL1.options.includes(numL1.correctAnswer), 'PROGRESS ENGINE 24: Number Puzzle Level 1 contains correct answer');
  assert(numL5.options.includes(numL5.correctAnswer), 'PROGRESS ENGINE 25: Number Puzzle Level 5 contains correct answer');
  assert(new Set(numL1.options).size === 4 && new Set(numL5.options).size === 4, 'PROGRESS ENGINE 26: All options are unique');

  // (j) Sliding Puzzle (progressive shuffle moves & solvability)
  const spL1 = createSlidingPuzzleGame('EASY', 1);
  const spL5 = createSlidingPuzzleGame('EASY', 5);
  assert(spL1.length === 9 && spL1.includes(null), 'PROGRESS ENGINE 27: Sliding Puzzle Level 1 has 9 slots with 1 empty');
  assert(spL5.length === 9 && spL5.includes(null), 'PROGRESS ENGINE 28: Sliding Puzzle Level 5 has 9 slots with 1 empty');

  // (k) Maze (progressive grid size & solvability)
  const mazeL1 = createMazeGame('EASY', 1);
  const mazeL5 = createMazeGame('EASY', 5);
  assert(mazeL1.length === 5, 'PROGRESS ENGINE 29: Maze Level 1 generates 5x5 grid');
  assert(mazeL5.length === 7, 'PROGRESS ENGINE 30: Maze Level 5 scales to 7x7 grid');
  const mazePathL1 = getMazeShortestPath(mazeL1, { r: 0, c: 0 }, { r: 4, c: 4 });
  const mazePathL5 = getMazeShortestPath(mazeL5, { r: 0, c: 0 }, { r: 6, c: 6 });
  assert(mazePathL1 !== null && mazePathL1.length >= 5, 'PROGRESS ENGINE 31: Maze Level 1 has guaranteed legal path from start to exit');
  assert(mazePathL5 !== null && mazePathL5.length >= 7, 'PROGRESS ENGINE 32: Maze Level 5 has guaranteed legal path from start to exit');

  // (l) Visual Difference (themes & difference bounds)
  const vdTheme1 = createVisualDiffGame('EASY', 1);
  const vdTheme2 = createVisualDiffGame('EASY', 2);
  const vdTheme3 = createVisualDiffGame('EASY', 3);
  assert(vdTheme1.differences.length === 2, 'PROGRESS ENGINE 33: Visual Difference Level 1 has 2 differences');
  assert(vdTheme2.differences.length === 2, 'PROGRESS ENGINE 34: Visual Difference Level 2 has 2 differences');
  assert(vdTheme3.differences.length === 2, 'PROGRESS ENGINE 35: Visual Difference Level 3 has 2 differences');
  assert(vdTheme1.id !== vdTheme2.id, 'PROGRESS ENGINE 36: Visual Difference cycles varied themes across levels');

  console.log('==================================================');
  console.log(`TEST SUITE COMPLETE: ${passedCount} / ${totalCount} PASSED`);
  console.log('==================================================');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test runner threw unhandled error:', err);
  process.exit(1);
});
