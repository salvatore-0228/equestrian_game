import levelsConfig from './levels.json';
import { LevelConfig, Level, Difficulty, Environment } from './levels.types';

// Load the level configuration
const config: LevelConfig = levelsConfig as LevelConfig;

/**
 * Get a specific level configuration by ID
 */
export const getLevelConfig = (levelId: number): Level | null => {
  return config.levels.find(level => level.id === levelId) || null;
};

/**
 * Get all unlocked levels up to a certain level
 */
export const getUnlockedLevels = (highestCompletedLevel: number): number => {
  return Math.min(highestCompletedLevel + 1, config.maxLevel);
};

/**
 * Check if a level is unlocked based on progress
 */
export const isLevelUnlocked = (levelId: number, highestCompletedLevel: number): boolean => {
  if (levelId === 1) return true; // Level 1 is always unlocked
  return levelId <= highestCompletedLevel + 1;
};

/**
 * Get difficulty settings for a level
 */
export const getDifficultySettings = (difficulty: Difficulty) => {
  return config.difficultySettings[difficulty];
};

/**
 * Get environment settings for a level
 */
export const getEnvironmentSettings = (environment: Environment) => {
  return config.environmentSettings[environment];
};

/**
 * Get the environment gradient for a level
 */
export const getEnvironmentGradient = (levelId: number): string => {
  const level = getLevelConfig(levelId);
  if (!level) return config.environmentSettings.meadow.gradient;
  
  const envSettings = getEnvironmentSettings(level.environment);
  return envSettings.gradient;
};

/**
 * Get difficulty color for a level
 */
export const getDifficultyColor = (levelId: number): string => {
  const level = getLevelConfig(levelId);
  if (!level) return config.difficultySettings.beginner.color;
  
  const diffSettings = getDifficultySettings(level.difficulty);
  return diffSettings.color;
};

/**
 * Get difficulty label for a level
 */
export const getDifficultyLabel = (levelId: number): string => {
  const level = getLevelConfig(levelId);
  if (!level) return config.difficultySettings.beginner.label;
  
  const diffSettings = getDifficultySettings(level.difficulty);
  return diffSettings.label;
};

/**
 * Get scoring configuration
 */
export const getScoringConfig = () => {
  return config.scoring;
};

/**
 * Get all levels
 */
export const getAllLevels = (): Level[] => {
  return config.levels;
};

/**
 * Get max level
 */
export const getMaxLevel = (): number => {
  return config.maxLevel;
};

/**
 * Get default level
 */
export const getDefaultLevel = (): number => {
  return config.defaultLevel;
};

/**
 * Calculate level progression based on rules
 */
export const calculateLevelStats = (levelId: number) => {
  const level = getLevelConfig(levelId);
  if (!level) return null;

  return {
    timeLimit: level.timeLimit,
    requiredJumps: level.requiredJumps,
    meterSpeed: level.meterSpeed,
    difficulty: level.difficulty,
    environment: level.environment,
    name: level.name,
    description: level.description
  };
};

/**
 * Get the next level after completing a level
 */
export const getNextLevel = (completedLevelId: number): number | null => {
  const nextLevelId = completedLevelId + 1;
  return nextLevelId <= config.maxLevel ? nextLevelId : null;
};

/**
 * Get level progression summary
 */
export const getLevelProgressionSummary = (currentLevel: number) => {
  const level = getLevelConfig(currentLevel);
  if (!level) return null;

  return {
    levelId: level.id,
    name: level.name,
    difficulty: level.difficulty,
    timeLimit: level.timeLimit,
    requiredJumps: level.requiredJumps,
    meterSpeed: level.meterSpeed,
    isUnlocked: true, // This would be determined by game state
    nextLevel: getNextLevel(currentLevel)
  };
};

export default config;
