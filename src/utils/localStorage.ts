// localStorage utilities for persistent game data

const STORAGE_KEYS = {
  UNLOCKED_LEVELS: 'equestrian_game_unlocked_levels',
  PLAYER_PROGRESS: 'equestrian_game_player_progress',
} as const;

export interface PlayerProgress {
  unlockedLevels: number;
  highestLevelReached: number;
  totalScore: number;
  lastPlayed: string;
}

/**
 * Get the number of unlocked levels from localStorage
 * @returns Number of unlocked levels (minimum 1)
 */
export const getUnlockedLevels = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UNLOCKED_LEVELS);
    if (stored) {
      const levels = parseInt(stored, 10);
      return Math.max(1, Math.min(10, levels)); // Ensure between 1 and 10
    }
  } catch (error) {
    console.warn('Error reading unlocked levels from localStorage:', error);
  }
  return 1; // Default to level 1 unlocked
};

/**
 * Save the number of unlocked levels to localStorage
 * @param levels Number of unlocked levels
 */
export const saveUnlockedLevels = (levels: number): void => {
  try {
    const validLevels = Math.max(1, Math.min(10, levels));
    localStorage.setItem(STORAGE_KEYS.UNLOCKED_LEVELS, validLevels.toString());
  } catch (error) {
    console.warn('Error saving unlocked levels to localStorage:', error);
  }
};

/**
 * Get complete player progress from localStorage
 * @returns Player progress data or default values
 */
export const getPlayerProgress = (): PlayerProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYER_PROGRESS);
    if (stored) {
      const progress = JSON.parse(stored) as PlayerProgress;
      return {
        unlockedLevels: Math.max(1, Math.min(10, progress.unlockedLevels || 1)),
        highestLevelReached: Math.max(1, Math.min(10, progress.highestLevelReached || 1)),
        totalScore: Math.max(0, progress.totalScore || 0),
        lastPlayed: progress.lastPlayed || new Date().toISOString(),
      };
    }
  } catch (error) {
    console.warn('Error reading player progress from localStorage:', error);
  }
  
  return {
    unlockedLevels: 1,
    highestLevelReached: 1,
    totalScore: 0,
    lastPlayed: new Date().toISOString(),
  };
};

/**
 * Save complete player progress to localStorage
 * @param progress Player progress data
 */
export const savePlayerProgress = (progress: PlayerProgress): void => {
  try {
    const validProgress: PlayerProgress = {
      unlockedLevels: Math.max(1, Math.min(10, progress.unlockedLevels)),
      highestLevelReached: Math.max(1, Math.min(10, progress.highestLevelReached)),
      totalScore: Math.max(0, progress.totalScore),
      lastPlayed: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.PLAYER_PROGRESS, JSON.stringify(validProgress));
  } catch (error) {
    console.warn('Error saving player progress to localStorage:', error);
  }
};

/**
 * Unlock a new level and save to localStorage
 * @param levelNumber Level number to unlock
 * @returns New number of unlocked levels
 */
export const unlockLevel = (levelNumber: number): number => {
  const currentUnlocked = getUnlockedLevels();
  const newUnlocked = Math.max(currentUnlocked, Math.min(10, levelNumber));
  saveUnlockedLevels(newUnlocked);
  return newUnlocked;
};

/**
 * Clear all progress data (for testing or reset functionality)
 */
export const clearProgress = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.UNLOCKED_LEVELS);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_PROGRESS);
  } catch (error) {
    console.warn('Error clearing progress from localStorage:', error);
  }
};
