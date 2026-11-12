import { safeStorage } from './asyncStorageWrapper';
import {
  ActiveMatchState,
  ActiveMultiplayerData,
  GameRepository,
  GameRoom,
  GameSettings,
  MatchRecord,
  MatchResultSnapshot,
  GameDisputeReport,
  PlayerProfile,
  SavedBingoBoard,
} from '../types';
import { validateBoardNumbers } from '../games/bingo/rules/bingoRules';

const PROFILE_KEY = '@90s_kids_player_profile';
const SETTINGS_KEY = '@90s_kids_game_settings';
const ROOM_KEY_PREFIX = '@90s_kids_room_';
const ROOMS_LIST_KEY = '@90s_kids_rooms_list';
const MATCH_HISTORY_KEY = '@90s_kids_match_history';
const ACTIVE_MATCH_KEY = '@90s_kids_active_match_state';
const ACTIVE_MULTIPLAYER_KEY = '@90s_kids_active_multiplayer_match';
const SCOREBOARD_KEY_PREFIX = '@90s_kids_scoreboard_';
const SAVED_BOARDS_KEY = '@90s_kids_saved_boards';
const RECENT_BOARDS_KEY = '@90s_kids_recent_boards';

export const DEFAULT_PROFILE: PlayerProfile = {
  id: 'player_local_1',
  name: 'Ajil',
  nickname: 'Ajju',
  avatar: '🎒',
  createdAt: Date.now(),
};

export const DEFAULT_SETTINGS: GameSettings = {
  voiceEnabled: true,
  soundEffectsEnabled: true,
  voiceVolume: 0.9,
  markingStyle: 'pencil',
};

export class LocalGameRepository implements GameRepository {
  async getProfile(): Promise<PlayerProfile> {
    try {
      const data = await safeStorage.getItem(PROFILE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load profile from AsyncStorage:', e);
    }
    return DEFAULT_PROFILE;
  }

  async saveProfile(profile: PlayerProfile): Promise<void> {
    try {
      await safeStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  }

  async getSettings(): Promise<GameSettings> {
    try {
      const data = await safeStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  }

  async saveSettings(settings: GameSettings): Promise<void> {
    try {
      await safeStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    try {
      const data = await safeStorage.getItem(`${ROOM_KEY_PREFIX}${roomId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`Failed to get room ${roomId}:`, e);
    }
    return null;
  }

  async saveRoom(room: GameRoom): Promise<void> {
    try {
      await safeStorage.setItem(`${ROOM_KEY_PREFIX}${room.id}`, JSON.stringify(room));
      const rooms = await this.getRooms();
      const updated = [room, ...rooms.filter((r) => r.id !== room.id)];
      await safeStorage.setItem(ROOMS_LIST_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save room:', e);
    }
  }

  async getRooms(): Promise<GameRoom[]> {
    try {
      const data = await safeStorage.getItem(ROOMS_LIST_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to get rooms list:', e);
    }
    return [];
  }

  async deleteRoom(roomId: string): Promise<void> {
    try {
      await safeStorage.removeItem(`${ROOM_KEY_PREFIX}${roomId}`);
      const rooms = await this.getRooms();
      const updated = rooms.filter((r) => r.id !== roomId);
      await safeStorage.setItem(ROOMS_LIST_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(`Failed to delete room ${roomId}:`, e);
    }
  }

  async getMatchHistory(): Promise<MatchRecord[]> {
    try {
      const data = await safeStorage.getItem(MATCH_HISTORY_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load match history:', e);
    }
    return [];
  }

  async saveMatchHistory(match: MatchRecord): Promise<void> {
    try {
      const history = await this.getMatchHistory();
      const updated = [match, ...history].slice(0, 50);
      await safeStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save match history:', e);
    }
  }

  async getActiveMatchState(): Promise<ActiveMatchState | null> {
    try {
      const data = await safeStorage.getItem(ACTIVE_MATCH_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load active match state:', e);
    }
    return null;
  }

  async saveActiveMatchState(state: ActiveMatchState | null): Promise<void> {
    try {
      if (state === null) {
        await safeStorage.removeItem(ACTIVE_MATCH_KEY);
      } else {
        await safeStorage.setItem(ACTIVE_MATCH_KEY, JSON.stringify(state));
      }
    } catch (e) {
      console.error('Failed to save active match state:', e);
    }
  }

  async getActiveMultiplayerMatch(): Promise<ActiveMultiplayerData | null> {
    try {
      const data = await safeStorage.getItem(ACTIVE_MULTIPLAYER_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load active multiplayer match:', e);
    }
    return null;
  }

  async saveActiveMultiplayerMatch(data: ActiveMultiplayerData | null): Promise<void> {
    try {
      if (data === null) {
        await safeStorage.removeItem(ACTIVE_MULTIPLAYER_KEY);
      } else {
        await safeStorage.setItem(ACTIVE_MULTIPLAYER_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to save active multiplayer match:', e);
    }
  }

  async getScoreboard(roomId: string): Promise<Record<string, number>> {
    try {
      const data = await safeStorage.getItem(`${SCOREBOARD_KEY_PREFIX}${roomId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`Failed to get scoreboard for ${roomId}:`, e);
    }
    return { Ajil: 0, Rahul: 0, Anu: 0, Akhil: 0 };
  }

  async saveScoreboard(roomId: string, scoreboard: Record<string, number>): Promise<void> {
    try {
      await safeStorage.setItem(`${SCOREBOARD_KEY_PREFIX}${roomId}`, JSON.stringify(scoreboard));
    } catch (e) {
      console.error('Failed to save scoreboard:', e);
    }
  }

  // --- SAVED BOARDS & RECENT BOARDS (Section 19, 20, 21) ---

  async getSavedBoards(): Promise<SavedBingoBoard[]> {
    try {
      const data = await safeStorage.getItem(SAVED_BOARDS_KEY);
      if (data) {
        const list: SavedBingoBoard[] = JSON.parse(data);
        // Filter out invalid persisted boards
        return list.filter((b) => validateBoardNumbers(b.numbers).isValid);
      }
    } catch (e) {
      console.warn('Failed to load saved boards:', e);
    }
    return [];
  }

  async saveBoardTemplate(board: SavedBingoBoard): Promise<void> {
    // Validate board before saving
    const validation = validateBoardNumbers(board.numbers);
    if (!validation.isValid) {
      throw new Error(`Invalid board template: ${validation.errors.join(', ')}`);
    }

    try {
      const existing = await this.getSavedBoards();
      const updated = [board, ...existing.filter((b) => b.id !== board.id)];
      await safeStorage.setItem(SAVED_BOARDS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save board template:', e);
    }
  }

  async deleteSavedBoard(boardId: string): Promise<void> {
    try {
      const existing = await this.getSavedBoards();
      const updated = existing.filter((b) => b.id !== boardId);
      await safeStorage.setItem(SAVED_BOARDS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(`Failed to delete saved board ${boardId}:`, e);
    }
  }

  async getRecentlyUsedBoards(): Promise<SavedBingoBoard[]> {
    try {
      const data = await safeStorage.getItem(RECENT_BOARDS_KEY);
      if (data) {
        const list: SavedBingoBoard[] = JSON.parse(data);
        return list.filter((b) => validateBoardNumbers(b.numbers).isValid);
      }
    } catch (e) {
      console.warn('Failed to load recent boards:', e);
    }
    return [];
  }

  async addRecentlyUsedBoard(board: SavedBingoBoard): Promise<void> {
    const validation = validateBoardNumbers(board.numbers);
    if (!validation.isValid) return;

    try {
      const existing = await this.getRecentlyUsedBoards();
      // Keep last 10 recently used boards
      const updated = [
        { ...board, lastUsedAt: Date.now() },
        ...existing.filter((b) => b.id !== board.id),
      ].slice(0, 10);

      await safeStorage.setItem(RECENT_BOARDS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to add recently used board:', e);
    }
  }

  // --- MATCH RESULT SNAPSHOT & DISPUTE REPORTS (Requirement 13, 27, 28, 29) ---

  async saveMatchResultSnapshot(snapshot: MatchResultSnapshot): Promise<void> {
    try {
      await safeStorage.setItem(`@90s_kids_match_snapshot_${snapshot.matchId}`, JSON.stringify(snapshot));
    } catch (e) {
      console.error('Failed to save match result snapshot:', e);
    }
  }

  async getMatchResultSnapshot(matchId: string): Promise<MatchResultSnapshot | null> {
    try {
      const data = await safeStorage.getItem(`@90s_kids_match_snapshot_${matchId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`Failed to get match snapshot for ${matchId}:`, e);
    }
    return null;
  }

  async saveDisputeReport(report: GameDisputeReport): Promise<void> {
    try {
      const reports = await this.getDisputeReports();
      const updated = [report, ...reports.filter((r) => r.id !== report.id)];
      await safeStorage.setItem('@90s_kids_dispute_reports', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save dispute report:', e);
    }
  }

  async getDisputeReports(): Promise<GameDisputeReport[]> {
    try {
      const data = await safeStorage.getItem('@90s_kids_dispute_reports');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load dispute reports:', e);
    }
    return [];
  }
}

export const localGameRepository = new LocalGameRepository();
