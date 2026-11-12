import {
  BingoVariant,
  BotDifficulty,
  GameRoom,
  Match,
  PlayMode,
  Player,
  PlayerProfile,
} from '../../../types';
import { BingoEngine } from '../engine/BingoEngine';
import { generateRandomBoardGrid } from '../rules/bingoRules';
import { multiplayerEventBus } from '../events/MultiplayerEventBus';
import { BingoBoardGrid } from '../types/bingo.types';
import { BingoBot } from '../bot/BingoBot';
import { BotPersonality, PRESET_BOT_PERSONALITIES } from '../bot/botTypes';
import { localGameRepository } from '../../../storage/LocalGameRepository';
import { idempotencyManager } from '../../../security/IdempotencyManager';
import { rateLimiter, DEFAULT_SECURITY_RATE_LIMITS } from '../../../security/RateLimiter';
import { actionValidator } from '../../../security/actionValidator';
import { sanitizedLogger } from '../../../security/sanitizedLogger';

export function getRequiredMatchPlayers(room: GameRoom): Player[] {
  const mode = room.playMode || (room.players.some((p) => p.isBot) ? 'SYSTEM' : 'FRIENDS');
  if (mode === 'SYSTEM') {
    return room.players.filter((p) => p.status !== 'LEFT');
  } else {
    return room.players.filter((p) => !p.isBot && p.status !== 'LEFT');
  }
}

export class RoomController {
  private room: GameRoom;
  private currentMatch: Match | null = null;
  private playerEngines: Map<string, BingoEngine> = new Map();
  private bots: Map<string, BingoBot> = new Map();

  constructor(hostProfile: PlayerProfile, customRoomCode?: string) {
    const roomCode = customRoomCode || `90S-${Math.floor(1000 + Math.random() * 9000)}`;
    const hostPlayer: Player = {
      id: hostProfile.id || 'player_host',
      name: hostProfile.name || 'Ajil',
      nickname: hostProfile.nickname || 'Ajju',
      avatar: hostProfile.avatar || '🎒',
      isHost: true,
      isLocal: true,
      isBot: false,
      status: 'READY',
      wins: 0,
    };

    this.room = {
      id: roomCode,
      roomCode,
      hostPlayerId: hostPlayer.id,
      currentMatchNumber: 0,
      players: [hostPlayer],
      currentMatch: null,
      matchHistory: [],
      scoreboard: { [hostPlayer.name]: 0 },
      status: 'LOBBY',
      playMode: 'FRIENDS',
      variant: 'CLASSIC_1_25',
      createdAt: Date.now(),
    };

    this.initPlayerEngine(hostPlayer.id);

    multiplayerEventBus.createAndPublish(
      'ROOM_CREATED',
      this.room.id,
      hostPlayer.id,
      { room: this.getRoomData(hostPlayer.id) }
    );
  }

  // --- Engine & Player Setup ---

  private initPlayerEngine(playerId: string, initialGrid?: BingoBoardGrid): BingoEngine {
    const grid = initialGrid || generateRandomBoardGrid();
    const engine = new BingoEngine(grid);
    this.playerEngines.set(playerId, engine);
    return engine;
  }

  public getRequiredMatchPlayers(): Player[] {
    return getRequiredMatchPlayers(this.getRoomData());
  }

  /**
   * Board Privacy Security Gate (Requirement 15):
   * Sanitizes room state so Player A never receives Player B's active grid during gameplay.
   */
  public getRoomData(requestingPlayerId?: string): GameRoom {
    return {
      ...this.room,
      players: this.room.players.map((p) => {
        const engine = this.playerEngines.get(p.id);
        const isLocked = Boolean(engine?.getIsLocked());
        const isPlaying = Boolean(this.currentMatch && this.currentMatch.status === 'PLAYING');

        // Only include board if requesting player owns the board
        const isOwnBoard = requestingPlayerId !== undefined && requestingPlayerId === p.id;
        const shouldIncludeBoard = isOwnBoard && (isPlaying || isLocked);

        return {
          ...p,
          isLocked,
          board: shouldIncludeBoard ? engine?.getGrid() : undefined,
          markedNumbers: isOwnBoard && engine ? Array.from(engine.getMarkedNumbers()) : (p.isBot ? undefined : p.markedNumbers),
          bingoPhase: engine ? engine.getPhase() : p.bingoPhase,
          progress: engine ? engine.getProgress() : p.progress,
        };
      }),
      currentMatch: this.currentMatch ? { ...this.currentMatch } : null,
    };
  }

  public getCurrentMatch(): Match | null {
    return this.currentMatch ? { ...this.currentMatch } : null;
  }

  public getPlayerEngine(playerId: string): BingoEngine | undefined {
    return this.playerEngines.get(playerId);
  }

  // --- Bot Opponents ---

  public addBotPlayer(personality?: BotPersonality): Player {
    const preset = personality || PRESET_BOT_PERSONALITIES[this.bots.size % PRESET_BOT_PERSONALITIES.length];
    const botId = `bot_${preset.id}_${Date.now()}`;

    const botPlayer: Player = {
      id: botId,
      name: preset.name,
      nickname: preset.nickname,
      avatar: preset.avatar,
      isHost: false,
      isLocal: false,
      isBot: true,
      botDifficulty: preset.difficulty,
      status: 'READY',
      wins: 0,
    };

    const bot = new BingoBot({ ...preset, id: botId });
    this.bots.set(botId, bot);
    this.playerEngines.set(botId, bot.engine);

    this.room.players.push(botPlayer);
    if (!(botPlayer.name in this.room.scoreboard)) {
      this.room.scoreboard[botPlayer.name] = 0;
    }

    multiplayerEventBus.createAndPublish(
      'PLAYER_JOINED',
      this.room.id,
      botId,
      { player: botPlayer, room: this.getRoomData() }
    );

    return botPlayer;
  }

  public setupBotOpponents(botCount: number, difficulty: BotDifficulty = 'NORMAL'): void {
    // Clear existing bots first
    this.bots.forEach((bot) => bot.destroy());
    this.bots.clear();
    this.room.players = this.room.players.filter((p) => !p.isBot);

    if (botCount > 0) {
      this.room.playMode = 'SYSTEM';
    }

    for (let i = 0; i < botCount; i++) {
      const preset = PRESET_BOT_PERSONALITIES[i % PRESET_BOT_PERSONALITIES.length];
      this.addBotPlayer({
        ...preset,
        id: `bot_${i + 1}_${Date.now()}`,
        difficulty,
      });
    }
  }

  /**
   * Host Authorization Gate (Requirement 10)
   */
  public setPlayMode(mode: PlayMode, requestingPlayerId?: string): void {
    if (requestingPlayerId && requestingPlayerId !== this.room.hostPlayerId) {
      sanitizedLogger.warn('Unauthorized setPlayMode attempt by non-host', { requestingPlayerId });
      throw new Error('FORBIDDEN_HOST_ONLY: Only host can set play mode.');
    }

    this.room.playMode = mode;
    const host = this.room.players.find((p) => p.isHost);
    if (host) {
      host.status = 'READY';
      const engine = this.playerEngines.get(host.id);
      if (engine && !engine.getIsLocked()) {
        const maxNumber = this.room.variant === 'BINGO_1_50' ? 50 : 25;
        engine.confirmBoard(maxNumber);
      }
    }
    if (mode === 'SYSTEM') {
      const hasBots = this.room.players.some((p) => p.isBot);
      if (!hasBots) {
        this.setupBotOpponents(1);
      }
    } else if (mode === 'FRIENDS') {
      this.setupBotOpponents(0);
    }
  }

  /**
   * Host Authorization Gate (Requirement 10)
   */
  public setVariant(variant: BingoVariant, requestingPlayerId?: string): void {
    if (requestingPlayerId && requestingPlayerId !== this.room.hostPlayerId) {
      sanitizedLogger.warn('Unauthorized setVariant attempt by non-host', { requestingPlayerId });
      throw new Error('FORBIDDEN_HOST_ONLY: Only host can set variant.');
    }
    this.room.variant = variant;
  }

  // --- Room & Lobby Operations ---

  public addPlayer(
    profile: { id: string; name: string; nickname?: string; avatar?: string },
    eventId?: string
  ): Player {
    if (eventId && !idempotencyManager.registerEvent(eventId)) {
      sanitizedLogger.warn('Replayed join event ignored', { eventId, playerId: profile.id });
      const existing = this.room.players.find((p) => p.id === profile.id);
      if (existing) return existing;
    }

    if (!rateLimiter.isAllowed(`join_${profile.id}`, DEFAULT_SECURITY_RATE_LIMITS.joinAttempt)) {
      sanitizedLogger.warn('Join rate limit exceeded', { playerId: profile.id });
      throw new Error('RATE_LIMITED: Too many join attempts. Please slow down.');
    }

    // Capacity Security Check (Requirement 9)
    if (this.room.players.length >= 4) {
      throw new Error('ROOM_FULL: Room capacity limit reached.');
    }

    const existing = this.room.players.find((p) => p.id === profile.id || p.name === profile.name);
    if (existing) {
      return existing;
    }

    const newPlayer: Player = {
      id: profile.id,
      name: profile.name,
      nickname: profile.nickname || '',
      avatar: profile.avatar || '👤',
      isHost: false,
      isLocal: false,
      isBot: false,
      status: 'LOBBY',
      wins: 0,
    };

    this.room.players.push(newPlayer);
    if (!(newPlayer.name in this.room.scoreboard)) {
      this.room.scoreboard[newPlayer.name] = 0;
    }

    this.initPlayerEngine(newPlayer.id);

    multiplayerEventBus.createAndPublish(
      'PLAYER_JOINED',
      this.room.id,
      newPlayer.id,
      { player: newPlayer, room: this.getRoomData() }
    );

    return newPlayer;
  }

  public removePlayer(playerId: string): void {
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.status = 'LEFT';
    this.room.players = this.room.players.filter((p) => p.id !== playerId);
    this.playerEngines.delete(playerId);

    const bot = this.bots.get(playerId);
    if (bot) {
      bot.destroy();
      this.bots.delete(playerId);
    }

    multiplayerEventBus.createAndPublish(
      'PLAYER_LEFT',
      this.room.id,
      playerId,
      { playerId, room: this.getRoomData() }
    );
  }

  public setPlayerReady(playerId: string, isReady: boolean): boolean {
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) return false;

    const engine = this.playerEngines.get(playerId);
    const maxNumber = this.room.variant === 'BINGO_1_50' ? 50 : 25;

    if (isReady && engine && !engine.getIsLocked()) {
      engine.confirmBoard(maxNumber);
    }

    player.status = isReady ? 'READY' : 'LOBBY';

    multiplayerEventBus.createAndPublish(
      'PLAYER_READY',
      this.room.id,
      playerId,
      { playerId, isReady, status: player.status }
    );

    this.checkAndStartMatchIfAllReady();
    return true;
  }

  public prepareBoardSetupPhase(): void {
    this.room.status = 'LOBBY';
    const maxNumber = this.room.variant === 'BINGO_1_50' ? 50 : 25;

    this.room.players.forEach((p) => {
      const engine = this.playerEngines.get(p.id);
      if (p.isBot) {
        if (engine) {
          engine.generateRandomBoard(maxNumber);
          engine.confirmBoard(maxNumber);
        }
        p.status = 'READY';
      } else {
        if (engine && !engine.getIsLocked()) {
          p.status = 'LOBBY';
        } else if (engine && engine.getIsLocked()) {
          p.status = 'READY';
        }
      }
    });

    multiplayerEventBus.createAndPublish(
      'STATE_CHANGED',
      this.room.id,
      this.room.hostPlayerId,
      { room: this.getRoomData() }
    );

    this.checkAndStartMatchIfAllReady();
  }

  /**
   * Board Lock Security Gate (Requirement 31):
   * Once confirmed, board is locked and immutable for active match.
   */
  public confirmPlayerBoard(
    playerId: string,
    customGrid?: BingoBoardGrid
  ): { success: boolean; message: string; allReady?: boolean } {
    const engine = this.playerEngines.get(playerId);
    if (!engine) {
      return { success: false, message: 'Player engine not found.' };
    }

    if (engine.getIsLocked()) {
      return { success: false, message: 'BOARD_LOCKED_IMMUTABLE: Board is already confirmed and locked.' };
    }

    const maxNumber = this.room.variant === 'BINGO_1_50' ? 50 : 25;

    if (customGrid) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          engine.setCell(r, c, customGrid[r][c]);
        }
      }
    }

    const val = engine.confirmBoard(maxNumber);
    if (!val.isValid) {
      return { success: false, message: val.message };
    }

    const player = this.room.players.find((p) => p.id === playerId);
    if (player) {
      player.status = 'READY';
    }

    multiplayerEventBus.createAndPublish(
      'PLAYER_READY',
      this.room.id,
      playerId,
      { playerId, isReady: true, status: 'READY' },
      this.currentMatch?.id
    );

    const allReady = this.checkAndStartMatchIfAllReady();

    return {
      success: true,
      message: '✓ BOARD READY',
      allReady,
    };
  }

  public checkAndStartMatchIfAllReady(): boolean {
    const startCheck = this.canStartMatch();
    if (startCheck.canStart) {
      multiplayerEventBus.createAndPublish(
        'ALL_PLAYERS_READY',
        this.room.id,
        this.room.hostPlayerId,
        { room: this.getRoomData() }
      );
      this.startMatch();
      return true;
    }
    return false;
  }

  public canStartMatch(): { canStart: boolean; reason?: string } {
    const roomData = this.getRoomData();
    const requiredPlayers = getRequiredMatchPlayers(roomData);
    const mode = roomData.playMode || (roomData.players.some((p) => p.isBot) ? 'SYSTEM' : 'FRIENDS');
    const humanPlayers = requiredPlayers.filter((p) => !p.isBot);
    const botPlayers = requiredPlayers.filter((p) => p.isBot);

    if (mode === 'SYSTEM') {
      if (humanPlayers.length === 0) {
        return {
          canStart: false,
          reason: 'Human player required to start match.',
        };
      }
      if (botPlayers.length === 0) {
        return {
          canStart: false,
          reason: 'Choose at least 1 bot opponent to start.',
        };
      }

      const unready = requiredPlayers.filter((p) => {
        const isReadyStatus = p.status === 'READY' || p.status === 'PLAYING';
        return !isReadyStatus || !p.isLocked;
      });

      if (unready.length > 0) {
        return {
          canStart: false,
          reason: 'Waiting for everyone to get ready...',
        };
      }

      const botLabel = botPlayers.length === 1 ? '1 bot' : `${botPlayers.length} bots`;
      return { canStart: true, reason: `1 human + ${botLabel} — Ready!` };
    } else {
      if (humanPlayers.length < 2) {
        return {
          canStart: false,
          reason: 'Minimum 2 players required to start.',
        };
      }

      const unready = requiredPlayers.filter((p) => {
        const isReadyStatus = p.status === 'READY' || p.status === 'PLAYING';
        return !isReadyStatus || !p.isLocked;
      });

      if (unready.length > 0) {
        return {
          canStart: false,
          reason: 'Waiting for everyone to get ready...',
        };
      }

      return { canStart: true, reason: 'All players ready!' };
    }
  }

  // --- Match Lifecycle ---

  /**
   * Host Authorization & Match Start Gate (Requirement 10 & 32)
   */
  public startMatch(requestingPlayerId?: string): Match {
    if (requestingPlayerId && requestingPlayerId !== this.room.hostPlayerId) {
      sanitizedLogger.warn('Unauthorized startMatch by non-host', { requestingPlayerId });
      throw new Error('FORBIDDEN_HOST_ONLY: Only host can start match.');
    }

    if (this.currentMatch && this.currentMatch.status === 'PLAYING') {
      return this.currentMatch;
    }
    const startCheck = this.canStartMatch();
    if (!startCheck.canStart) {
      throw new Error(startCheck.reason || 'Cannot start match.');
    }

    const matchNumber = (this.room.currentMatchNumber || 0) + 1;
    this.room.currentMatchNumber = matchNumber;
    const maxNumber = this.room.variant === 'BINGO_1_50' ? 50 : 25;

    this.room.players.forEach((p) => {
      p.status = 'PLAYING';
      const engine = this.playerEngines.get(p.id);
      if (engine) {
        if (!engine.getIsLocked()) {
          engine.confirmBoard(maxNumber);
        }
        (engine as any).setPhase('PLAYING_B');
      }
    });

    const turnOrder = this.room.players.map((p) => p.id);
    const initialTurnIndex = Math.floor(Math.random() * turnOrder.length);
    const firstCallerId = turnOrder[initialTurnIndex];

    const match: Match = {
      id: `match_${this.room.id}_${matchNumber}_${Date.now()}`,
      matchNumber,
      roomId: this.room.id,
      players: [...this.room.players],
      callerPlayerId: firstCallerId,
      currentTurnPlayerId: firstCallerId,
      turnOrder,
      currentTurnIndex: initialTurnIndex,
      calledNumbers: [],
      lastCalledNumber: null,
      lastCallerPlayerId: null,
      status: 'PLAYING',
      startedAt: Date.now(),
      variant: this.room.variant || 'CLASSIC_1_25',
      maxNumber,
    };

    this.currentMatch = match;
    this.room.currentMatch = match;
    this.room.status = 'PLAYING';

    multiplayerEventBus.createAndPublish(
      'MATCH_STARTED',
      this.room.id,
      this.room.hostPlayerId,
      { match, room: this.getRoomData() },
      match.id
    );

    multiplayerEventBus.createAndPublish(
      'FIRST_CALLER_SELECTED',
      this.room.id,
      firstCallerId,
      { firstCallerId, callerName: this.room.players.find((p) => p.id === firstCallerId)?.name },
      match.id
    );

    if (this.bots.has(firstCallerId)) {
      this.triggerBotTurn(firstCallerId);
    }

    return match;
  }

  // --- Caller Functionality & Turn System ---

  /**
   * Caller Authorization & Validation Security Gate (Requirement 11, 12, 19, 23)
   */
  public callNextNumber(
    callingPlayerId: string,
    specificNumber?: number,
    eventId?: string
  ): number | null {
    if (eventId && !idempotencyManager.registerEvent(eventId)) {
      sanitizedLogger.warn('Replayed callNextNumber event ignored', { eventId, callingPlayerId });
      return this.currentMatch?.lastCalledNumber || null;
    }

    if (!rateLimiter.isAllowed(`call_${callingPlayerId}`, DEFAULT_SECURITY_RATE_LIMITS.callNumber)) {
      sanitizedLogger.warn('Call rate limit exceeded', { callingPlayerId });
      throw new Error('RATE_LIMITED: Calling numbers too fast.');
    }

    if (!this.currentMatch || this.currentMatch.status !== 'PLAYING') {
      return null;
    }

    // Caller Authorization Check (Requirement 11)
    if (callingPlayerId !== this.currentMatch.currentTurnPlayerId) {
      sanitizedLogger.warn('Unauthorized caller action', { callingPlayerId, turnId: this.currentMatch.currentTurnPlayerId });
      throw new Error('NOT_YOUR_TURN: Only the current turn caller can call numbers.');
    }

    const maxNum = this.currentMatch.maxNumber || 25;
    const valCall = actionValidator.validateCallNumber(specificNumber, maxNum);
    if (!valCall.isValid) {
      throw new Error(valCall.message);
    }

    const calledSet = new Set(this.currentMatch.calledNumbers);
    const uncalled: number[] = [];
    for (let i = 1; i <= maxNum; i++) {
      if (!calledSet.has(i)) {
        uncalled.push(i);
      }
    }

    if (uncalled.length === 0) {
      return null;
    }

    let nextNumber: number;
    if (specificNumber !== undefined) {
      if (calledSet.has(specificNumber)) {
        throw new Error(`Number ${specificNumber} has already been called.`);
      }
      nextNumber = specificNumber;
    } else {
      const randomIndex = Math.floor(Math.random() * uncalled.length);
      nextNumber = uncalled[randomIndex];
    }

    this.currentMatch.calledNumbers.push(nextNumber);
    this.currentMatch.lastCalledNumber = nextNumber;
    this.currentMatch.lastCallerPlayerId = callingPlayerId;

    // Notify all human player engines
    this.playerEngines.forEach((engine, pid) => {
      if (!this.bots.has(pid)) {
        const internalCalled = engine.getCalledNumbers();
        if (!internalCalled.includes(nextNumber)) {
          (engine as any).calledNumbers.push(nextNumber);
          (engine as any).currentCalledNumber = nextNumber;
        }
      }
    });

    // Caller Automatic Marking Rule (Requirement 14)
    if (!this.bots.has(callingPlayerId)) {
      const callerEngine = this.playerEngines.get(callingPlayerId);
      if (callerEngine && callerEngine.hasNumberOnBoard(nextNumber)) {
        this.markPlayerNumber(callingPlayerId, nextNumber);
      }
    } else {
      // When a bot calls, automatically mark valid called number on all human player boards
      this.playerEngines.forEach((engine, pid) => {
        if (!this.bots.has(pid)) {
          if (engine.hasNumberOnBoard(nextNumber) && !engine.getMarkedNumbers().has(nextNumber)) {
            this.markPlayerNumber(pid, nextNumber);
          }
        }
      });
    }

    // Notify all System Bots
    this.bots.forEach((bot) => {
      bot.handleNumberCalled(nextNumber, (botId) => this.claimBingo(botId));
    });

    multiplayerEventBus.createAndPublish(
      'NUMBER_CALLED',
      this.room.id,
      callingPlayerId,
      {
        number: nextNumber,
        callerId: callingPlayerId,
        callerName: this.room.players.find((p) => p.id === callingPlayerId)?.name,
        calledNumbers: [...this.currentMatch.calledNumbers],
      },
      this.currentMatch.id
    );

    // Turn rotation
    const nextIndex = (this.currentMatch.currentTurnIndex + 1) % this.currentMatch.turnOrder.length;
    this.currentMatch.currentTurnIndex = nextIndex;
    const nextTurnPlayerId = this.currentMatch.turnOrder[nextIndex];
    this.currentMatch.currentTurnPlayerId = nextTurnPlayerId;
    this.currentMatch.callerPlayerId = nextTurnPlayerId;

    multiplayerEventBus.createAndPublish(
      'TURN_CHANGED',
      this.room.id,
      nextTurnPlayerId,
      {
        currentTurnPlayerId: nextTurnPlayerId,
        turnPlayerName: this.room.players.find((p) => p.id === nextTurnPlayerId)?.name,
      },
      this.currentMatch.id
    );

    if (this.bots.has(nextTurnPlayerId)) {
      this.triggerBotTurn(nextTurnPlayerId);
    }

    return nextNumber;
  }

  public triggerBotTurn(botId: string): void {
    const bot = this.bots.get(botId);
    if (!bot || !this.currentMatch || this.currentMatch.status !== 'PLAYING') {
      return;
    }

    multiplayerEventBus.createAndPublish(
      'BOT_CALLING_STARTED',
      this.room.id,
      botId,
      { botName: bot.personality.name },
      this.currentMatch.id
    );

    // 3-second auto-calling interval pacing for bot turns
    const delayMs =
      bot.personality.difficulty === 'EASY'
        ? 3000
        : bot.personality.difficulty === 'NORMAL'
        ? 3000
        : 2500;

    setTimeout(() => {
      if (!this.currentMatch || this.currentMatch.status !== 'PLAYING') return;
      if (this.currentMatch.currentTurnPlayerId !== botId) return;

      const maxNum = this.currentMatch.maxNumber || 25;
      const calledSet = new Set(this.currentMatch.calledNumbers);

      const botGrid = bot.engine.getGrid();
      const botUncalledNumbers: number[] = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const val = botGrid[r][c];
          if (val !== null && val >= 1 && val <= maxNum && !calledSet.has(val)) {
            botUncalledNumbers.push(val);
          }
        }
      }

      let pickedNumber: number;
      if (botUncalledNumbers.length > 0) {
        const idx = Math.floor(Math.random() * botUncalledNumbers.length);
        pickedNumber = botUncalledNumbers[idx];
      } else {
        const globalUncalled: number[] = [];
        for (let i = 1; i <= maxNum; i++) {
          if (!calledSet.has(i)) {
            globalUncalled.push(i);
          }
        }
        if (globalUncalled.length === 0) return;
        const idx = Math.floor(Math.random() * globalUncalled.length);
        pickedNumber = globalUncalled[idx];
      }

      try {
        this.callNextNumber(botId, pickedNumber);
      } catch (e) {
        // Fallback
      }
    }, delayMs);
  }

  // --- Player Marking ---

  /**
   * Marking Validation Security Gate (Requirement 13)
   */
  public markPlayerNumber(
    playerId: string,
    num: number,
    eventId?: string
  ): { success: boolean; message: string } {
    if (eventId && !idempotencyManager.registerEvent(eventId)) {
      sanitizedLogger.warn('Replayed markPlayerNumber event ignored', { eventId, playerId });
      return { success: true, message: 'Duplicate event ignored.' };
    }

    if (!rateLimiter.isAllowed(`mark_${playerId}`, DEFAULT_SECURITY_RATE_LIMITS.markNumber)) {
      sanitizedLogger.warn('Mark rate limit exceeded', { playerId });
      return { success: false, message: 'RATE_LIMITED: Marking too fast.' };
    }

    const engine = this.playerEngines.get(playerId);
    if (!engine) {
      return { success: false, message: 'Player engine not found.' };
    }

    const maxNum = this.currentMatch?.maxNumber || 25;
    const valMark = actionValidator.validateMarkNumber(num, maxNum);
    if (!valMark.isValid) {
      return { success: false, message: valMark.message };
    }

    const res = engine.markNumber(num);
    if (res.success) {
      multiplayerEventBus.createAndPublish(
        'PLAYER_MARKED',
        this.room.id,
        playerId,
        { number: num, progress: engine.getProgress() },
        this.currentMatch?.id
      );
    }

    return res;
  }

  // --- Bingo Claim Validation ---

  /**
   * Bingo Anti-Cheat Validation Gate (Requirement 16, 17, 34)
   * Client claims are NEVER trusted; engine validates 5 unique lines from called numbers & history authoritatively.
   */
  public claimBingo(
    claimingPlayerId: string,
    eventId?: string
  ): { isValid: boolean; message: string; winnerName?: string } {
    if (eventId && !idempotencyManager.registerEvent(eventId)) {
      sanitizedLogger.warn('Replayed claimBingo event ignored', { eventId, claimingPlayerId });
      return { isValid: false, message: 'DUPLICATE_EVENT_ID: Claim already processed.' };
    }

    if (!rateLimiter.isAllowed(`claim_${claimingPlayerId}`, DEFAULT_SECURITY_RATE_LIMITS.claimBingo)) {
      sanitizedLogger.warn('Bingo claim rate limit exceeded', { claimingPlayerId });
      return { isValid: false, message: 'RATE_LIMITED: Please wait before claiming Bingo again.' };
    }

    if (!this.currentMatch || this.currentMatch.status !== 'PLAYING') {
      return { isValid: false, message: 'MATCH_FINISHED: Match is not playing.' };
    }

    const claimingPlayer = this.room.players.find((p) => p.id === claimingPlayerId);
    const engine = this.playerEngines.get(claimingPlayerId);

    if (!claimingPlayer || !engine) {
      return { isValid: false, message: 'UNAUTHORIZED: Player engine not found.' };
    }

    // Authoritative Bingo validation
    const val = engine.validateBingo();
    if (!val.isValid) {
      multiplayerEventBus.createAndPublish(
        'INVALID_CLAIM',
        this.room.id,
        claimingPlayerId,
        { reason: val.failedReason },
        this.currentMatch.id
      );
      return { isValid: false, message: val.message };
    }

    this.currentMatch.status = 'FINISHED';
    this.currentMatch.finishedAt = Date.now();
    this.currentMatch.winnerId = claimingPlayerId;
    this.currentMatch.winnerName = claimingPlayer.name;

    // Server-Authoritative Scoreboard Update (Requirement 34)
    claimingPlayer.wins += 1;
    this.room.scoreboard[claimingPlayer.name] = (this.room.scoreboard[claimingPlayer.name] || 0) + 1;
    this.room.status = 'FINISHED';

    const record = {
      id: `match_${Date.now()}`,
      roomId: this.room.id,
      matchNumber: this.currentMatch.matchNumber,
      winnerName: claimingPlayer.name,
      winnerNickname: claimingPlayer.nickname,
      totalCalls: this.currentMatch.calledNumbers.length,
      completedAt: Date.now(),
      completedPatterns: ['B', 'I', 'N', 'G', 'O'],
    };

    this.room.matchHistory.unshift(record);

    // Persist immutable MatchResultSnapshot for winner verification
    const snapshot = {
      matchId: this.currentMatch.id,
      roomId: this.room.id,
      matchNumber: this.currentMatch.matchNumber,
      winnerId: claimingPlayerId,
      winnerName: claimingPlayer.name,
      winnerNickname: claimingPlayer.nickname,
      winnerAvatar: claimingPlayer.avatar,
      winningBoard: engine.getGrid(),
      winningMarks: Array.from(engine.getMarkedNumbers()),
      calledNumbers: [...this.currentMatch.calledNumbers],
      winningProgress: engine.getProgress(),
      completedPatterns: ['B', 'I', 'N', 'G', 'O'],
      finishedAt: Date.now(),
    };
    localGameRepository.saveMatchResultSnapshot(snapshot);

    multiplayerEventBus.createAndPublish(
      'BINGO_CLAIMED',
      this.room.id,
      claimingPlayerId,
      { winnerId: claimingPlayerId, winnerName: claimingPlayer.name, snapshot },
      this.currentMatch.id
    );

    multiplayerEventBus.createAndPublish(
      'MATCH_FINISHED',
      this.room.id,
      claimingPlayerId,
      { winnerId: claimingPlayerId, winnerName: claimingPlayer.name, match: this.currentMatch, snapshot },
      this.currentMatch.id
    );

    return { isValid: true, message: '🏆 BINGO!', winnerName: claimingPlayer.name };
  }

  // --- Rematch & Revenge Round ---

  public startRevengeRound(requestingPlayerId?: string): { room: GameRoom; match: Match } {
    if (requestingPlayerId && requestingPlayerId !== this.room.hostPlayerId) {
      sanitizedLogger.warn('Unauthorized startRevengeRound by non-host', { requestingPlayerId });
      throw new Error('FORBIDDEN_HOST_ONLY: Only host can start revenge round.');
    }

    this.room.players.forEach((p) => {
      p.status = 'READY';
      const engine = this.playerEngines.get(p.id);
      if (engine) {
        engine.startNewMatch(true); // keep board
      }
      const bot = this.bots.get(p.id);
      if (bot) {
        bot.resetMatch(true);
      }
    });

    return {
      room: this.getRoomData(requestingPlayerId),
      match: this.startMatch(requestingPlayerId),
    };
  }

  public startPlayAgain(requestingPlayerId?: string): { room: GameRoom; match: Match | null } {
    if (requestingPlayerId && requestingPlayerId !== this.room.hostPlayerId) {
      sanitizedLogger.warn('Unauthorized startPlayAgain by non-host', { requestingPlayerId });
      throw new Error('FORBIDDEN_HOST_ONLY: Only host can initiate play again.');
    }

    this.currentMatch = null;
    this.room.currentMatch = null;
    this.room.status = 'BOARD_SETUP';
    const maxNumber = this.room.variant === 'BINGO_1_50' ? 50 : 25;

    this.room.players.forEach((p) => {
      const engine = this.playerEngines.get(p.id);
      if (engine) {
        engine.startNewMatch(false);
      }

      const bot = this.bots.get(p.id);
      if (bot) {
        bot.resetMatch(false);
      }

      if (p.isBot) {
        if (engine) {
          engine.generateRandomBoard(maxNumber);
          engine.confirmBoard(maxNumber);
        }
        p.status = 'READY';
      } else {
        if (engine) {
          engine.generateRandomBoard(maxNumber);
        }
        p.status = 'LOBBY';
      }
    });

    multiplayerEventBus.createAndPublish(
      'STATE_CHANGED',
      this.room.id,
      this.room.hostPlayerId,
      { room: this.getRoomData() }
    );

    return {
      room: this.getRoomData(requestingPlayerId),
      match: null,
    };
  }
}
