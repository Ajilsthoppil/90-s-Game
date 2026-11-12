import { safeStorage } from '../../../storage/asyncStorageWrapper';
import { BrainDifficulty, BrainGameId } from '../types/brain.types';

export interface BrainGameProgress {
  gameId: BrainGameId;
  difficulty: BrainDifficulty;
  currentLevel: number;
  highestUnlockedLevel: number;
  highestCompletedLevel: number;
  totalStars: number;
  lastPlayedAt: number;
  stats: {
    bestScore: number;
    bestTimeSeconds: number;
    totalGamesPlayed: number;
    totalWins: number;
    hintsUsedTotal: number;
  };
}

const STORAGE_PREFIX = 'BRAIN_PROGRESS_';

export function getProgressStorageKey(gameId: BrainGameId, difficulty: BrainDifficulty): string {
  return `${STORAGE_PREFIX}${gameId}_${difficulty}`;
}

export function createDefaultProgress(gameId: BrainGameId, difficulty: BrainDifficulty): BrainGameProgress {
  return {
    gameId,
    difficulty,
    currentLevel: 1,
    highestUnlockedLevel: 1,
    highestCompletedLevel: 0,
    totalStars: 0,
    lastPlayedAt: Date.now(),
    stats: {
      bestScore: 0,
      bestTimeSeconds: 0,
      totalGamesPlayed: 0,
      totalWins: 0,
      hintsUsedTotal: 0,
    },
  };
}

export const brainProgressionService = {
  /**
   * Load saved progress for a specific game and difficulty.
   * If none exists or data is corrupted, returns a clean Level 1 progress object.
   */
  async loadProgress(gameId: BrainGameId, difficulty: BrainDifficulty): Promise<BrainGameProgress> {
    const key = getProgressStorageKey(gameId, difficulty);
    try {
      const raw = await safeStorage.getItem(key);
      if (!raw) {
        return createDefaultProgress(gameId, difficulty);
      }
      const parsed = JSON.parse(raw);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof parsed.currentLevel === 'number' &&
        parsed.currentLevel >= 1
      ) {
        return {
          gameId,
          difficulty,
          currentLevel: parsed.currentLevel,
          highestUnlockedLevel: Math.max(1, parsed.highestUnlockedLevel || parsed.currentLevel),
          highestCompletedLevel: Math.max(0, parsed.highestCompletedLevel || 0),
          totalStars: parsed.totalStars || 0,
          lastPlayedAt: parsed.lastPlayedAt || Date.now(),
          stats: {
            bestScore: parsed.stats?.bestScore || 0,
            bestTimeSeconds: parsed.stats?.bestTimeSeconds || 0,
            totalGamesPlayed: parsed.stats?.totalGamesPlayed || 0,
            totalWins: parsed.stats?.totalWins || 0,
            hintsUsedTotal: parsed.stats?.hintsUsedTotal || 0,
          },
        };
      }
    } catch (e) {
      console.warn(`[BrainProgressionService] Failed to load progress for ${key}:`, e);
    }
    return createDefaultProgress(gameId, difficulty);
  },

  /**
   * Save progress to persistent storage.
   */
  async saveProgress(progress: BrainGameProgress): Promise<void> {
    const key = getProgressStorageKey(progress.gameId, progress.difficulty);
    try {
      await safeStorage.setItem(key, JSON.stringify(progress));
    } catch (e) {
      console.warn(`[BrainProgressionService] Failed to save progress for ${key}:`, e);
    }
  },

  /**
   * Record completion of a level.
   * Idempotent: If the level was already completed previously, highestCompletedLevel
   * and highestUnlockedLevel are not falsely re-incremented.
   */
  async recordLevelCompletion(
    gameId: BrainGameId,
    difficulty: BrainDifficulty,
    level: number,
    score: number,
    timeSeconds: number,
    hintsUsed: number = 0
  ): Promise<BrainGameProgress> {
    const currentProgress = await this.loadProgress(gameId, difficulty);

    const isNewHighCompletion = level > currentProgress.highestCompletedLevel;
    const newHighestCompleted = Math.max(currentProgress.highestCompletedLevel, level);
    const newHighestUnlocked = Math.max(currentProgress.highestUnlockedLevel, level + 1);

    const currentBestTime = currentProgress.stats.bestTimeSeconds;
    const newBestTime =
      currentBestTime === 0 ? timeSeconds : Math.min(currentBestTime, timeSeconds);

    const updated: BrainGameProgress = {
      ...currentProgress,
      highestCompletedLevel: newHighestCompleted,
      highestUnlockedLevel: newHighestUnlocked,
      totalStars: currentProgress.totalStars + (isNewHighCompletion ? 1 : 0),
      lastPlayedAt: Date.now(),
      stats: {
        bestScore: Math.max(currentProgress.stats.bestScore, score),
        bestTimeSeconds: newBestTime,
        totalGamesPlayed: currentProgress.stats.totalGamesPlayed + 1,
        totalWins: currentProgress.stats.totalWins + 1,
        hintsUsedTotal: currentProgress.stats.hintsUsedTotal + hintsUsed,
      },
    };

    await this.saveProgress(updated);
    return updated;
  },

  /**
   * Advance currentLevel to next level (clamped to highestUnlockedLevel).
   */
  async advanceToNextLevel(gameId: BrainGameId, difficulty: BrainDifficulty): Promise<BrainGameProgress> {
    const currentProgress = await this.loadProgress(gameId, difficulty);
    const targetLevel = Math.min(currentProgress.currentLevel + 1, currentProgress.highestUnlockedLevel);

    const updated: BrainGameProgress = {
      ...currentProgress,
      currentLevel: targetLevel,
      lastPlayedAt: Date.now(),
    };

    await this.saveProgress(updated);
    return updated;
  },

  /**
   * Select a specific unlocked level to play.
   */
  async selectLevel(
    gameId: BrainGameId,
    difficulty: BrainDifficulty,
    targetLevel: number
  ): Promise<BrainGameProgress> {
    const currentProgress = await this.loadProgress(gameId, difficulty);
    if (targetLevel >= 1 && targetLevel <= currentProgress.highestUnlockedLevel) {
      const updated: BrainGameProgress = {
        ...currentProgress,
        currentLevel: targetLevel,
        lastPlayedAt: Date.now(),
      };
      await this.saveProgress(updated);
      return updated;
    }
    return currentProgress;
  },

  /**
   * Reset game progress for a specific game and difficulty.
   */
  async resetProgress(gameId: BrainGameId, difficulty: BrainDifficulty): Promise<BrainGameProgress> {
    const fresh = createDefaultProgress(gameId, difficulty);
    await this.saveProgress(fresh);
    return fresh;
  },
};
