import { useState, useCallback, useEffect, useRef } from "react";
import { GameState, GameData, Level } from "../types/game";
import { supabase } from "../lib/supabase";
import { getPlayerProgress, savePlayerProgress, unlockLevel } from "../utils/localStorage";

const INITIAL_TIME = 60;
const MULTIPLIER_INCREMENT = 0.1; // 10% per consecutive perfect
const MAX_MULTIPLIER = 0.5; // Maximum 50% bonus

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>("menu");
  
  // Load initial progress from localStorage
  const initialProgress = getPlayerProgress();
  
  const [gameData, setGameData] = useState<GameData>({
    playerId: null,
    playerName: "",
    avatarId: 1,
    horseId: 1,
    score: 0,
    totalScore: initialProgress.totalScore,
    level: 1,
    highestLevelReached: initialProgress.highestLevelReached,
    unlockedLevels: initialProgress.unlockedLevels,
    jumpsCleared: 0,
    railsDown: 0,
    consecutivePerfect: 0,
    timeRemaining: INITIAL_TIME,
    isGameActive: false,
  });

  // stable ref to latest gameData so callbacks can be stable (prevents re-creating callbacks
  // that are used in effects and cause re-renders / max update depth)
  const gameDataRef = useRef(gameData);
  useEffect(() => {
    gameDataRef.current = gameData;
  }, [gameData]);

  const getLevelConfig = useCallback((levelNum: number): Level => {
    const baseJumps = 10;
    const baseTime = 60;
    const baseSpacing = 400;
    const baseHeight = 80;
    const baseMeterSpeed = 30;

    return {
      number: levelNum,
      timeLimit: baseTime,
      jumpsRequired: baseJumps + (levelNum - 1) * 2,
      jumpSpacing: Math.max(300, baseSpacing - (levelNum - 1) * 20),
      jumpHeight: Math.min(120, baseHeight + (levelNum - 1) * 5),
      meterSpeed: baseMeterSpeed + (levelNum - 1) * 4,
    };
  }, []);

  const startGame = useCallback(
    async (playerName: string, avatarId: number, horseId: number, startingLevel: number = 1) => {
      const { data: player, error } = await supabase
        .from("players")
        .insert({ name: playerName, avatar_id: avatarId, horse_id: horseId })
        .select()
        .maybeSingle();

      if (error || !player) {
        console.error("Error creating player:", error);
        return false;
      }

      const levelConfig = getLevelConfig(startingLevel);

      setGameData({
        playerId: player.id,
        playerName: player.name,
        avatarId: player.avatar_id,
        horseId: player.horse_id,
        score: 0,
        totalScore: 0,
        level: startingLevel,
        highestLevelReached: startingLevel,
        unlockedLevels: initialProgress.unlockedLevels,
        jumpsCleared: 0,
        railsDown: 0,
        consecutivePerfect: 0,
        timeRemaining: levelConfig.timeLimit,
        isGameActive: true,
      });
      setGameState("playing");
      return true;
    },
    [getLevelConfig]
  );

  const addScore = useCallback(
    (points: number, isPerfect: boolean, isCleared: boolean, isRail: boolean) => {
      setGameData((prev) => {
        const newConsecutivePerfect = isPerfect ? prev.consecutivePerfect + 1 : 0;
        // Fix: +10% per consecutive perfect (but first perfect gets no bonus)
        // 1st perfect: 0% bonus, 2nd perfect: +10%, 3rd perfect: +20%, etc.
        const multiplier = Math.min((newConsecutivePerfect - 1) * MULTIPLIER_INCREMENT, MAX_MULTIPLIER);
        const finalPoints = Math.floor(points * (1 + Math.max(0, multiplier)));

        return {
          ...prev,
          score: prev.score + finalPoints,
          totalScore: prev.totalScore + finalPoints, // Add to cumulative score
          jumpsCleared: isCleared ? prev.jumpsCleared + 1 : prev.jumpsCleared,
          railsDown: isRail ? prev.railsDown + 1 : prev.railsDown,
          consecutivePerfect: newConsecutivePerfect,
        };
      });
    },
    []
  );

  const nextLevel = useCallback(() => {
    setGameData((prev) => {
      const nextLevelNum = prev.level + 1;
      const levelConfig = getLevelConfig(nextLevelNum);
      return {
        ...prev,
        level: nextLevelNum,
        highestLevelReached: Math.max(prev.highestLevelReached, nextLevelNum), // Update highest level reached
        score: 0, // Reset score for new level
        jumpsCleared: 0, // Reset jumps cleared for new level
        railsDown: 0, // Reset rails down for new level
        consecutivePerfect: 0, // Reset perfect streak for new level
        timeRemaining: levelConfig.timeLimit,
        // totalScore remains unchanged - cumulative across all levels
      };
    });
    setGameState("playing");
  }, []);

  // Flag to prevent multiple endGame calls
  const isEndingRef = useRef(false);

  // make endGame stable so components can depend on it without causing re-registration loops
  const endGame = useCallback(async () => {
    const gd = gameDataRef.current;
    if (!gd || !gd.playerId || isEndingRef.current) return false;
    
    // Set flag to prevent multiple simultaneous calls
    isEndingRef.current = true;
    
    // mark local state inactive immediately
    setGameData((prev) => ({ ...prev, isGameActive: false }));
    
    try {
      // use supabase or your persistence layer here - read from gd to avoid depending on gameData
      const { error } = await supabase.from("game_scores").insert({
        player_id: gd.playerId,
        score: gd.totalScore, // Use total cumulative score
        level_reached: gd.highestLevelReached, // Use highest level reached
        jumps_cleared: gd.jumpsCleared,
        game_duration: INITIAL_TIME - gd.timeRemaining,
      });
      if (error) {
        console.error("Error saving score:", error);
        isEndingRef.current = false;
        return false;
      }
      setGameState("game-over");
      isEndingRef.current = false;
      return true;
    } catch (err) {
      console.error("Network error saving score:", err);
      isEndingRef.current = false;
      return false;
    }
  }, []);

  const decrementTime = useCallback(() => {
    setGameData((prev) => {
      if (prev.timeRemaining <= 0) {
        return prev;
      }
      return { ...prev, timeRemaining: prev.timeRemaining - 1 };
    });
  }, []);

  const resetGame = useCallback(() => {
    const currentProgress = getPlayerProgress();
    setGameData({
      playerId: null,
      playerName: "",
      avatarId: 1,
      horseId: 1,
      score: 0,
      totalScore: 0,
      level: 1,
      highestLevelReached: currentProgress.highestLevelReached,
      unlockedLevels: currentProgress.unlockedLevels,
      jumpsCleared: 0,
      railsDown: 0,
      consecutivePerfect: 0,
      timeRemaining: INITIAL_TIME,
      isGameActive: false,
    });
    setGameState("menu");
  }, []);

  const resetScore = useCallback(() => {
    setGameData((prev) => ({ ...prev, score: 0 }));
  }, []);

  const resetConsecutivePerfect = useCallback(() => {
    setGameData((prev) => ({ ...prev, consecutivePerfect: 0 }));
  }, []);

  // Save progress to localStorage whenever gameData changes
  const saveProgress = useCallback(() => {
    const gd = gameDataRef.current;
    if (gd) {
      savePlayerProgress({
        unlockedLevels: gd.unlockedLevels,
        highestLevelReached: gd.highestLevelReached,
        totalScore: gd.totalScore,
        lastPlayed: new Date().toISOString(),
      });
    }
  }, []);

  // Auto-save progress when gameData changes
  useEffect(() => {
    saveProgress();
  }, [gameData.unlockedLevels, gameData.highestLevelReached, gameData.totalScore, saveProgress]);

  // Function to unlock a new level
  const unlockNewLevel = useCallback((levelNumber: number) => {
    const newUnlockedCount = unlockLevel(levelNumber);
    setGameData((prev) => ({
      ...prev,
      unlockedLevels: newUnlockedCount,
    }));
    return newUnlockedCount;
  }, []);

  return {
    gameState,
    gameData,
    setGameState,
    getLevelConfig,
    startGame,
    addScore,
    resetScore,
    resetConsecutivePerfect,
    nextLevel,
    unlockNewLevel,
    endGame,
    decrementTime,
    resetGame,
  };
};
