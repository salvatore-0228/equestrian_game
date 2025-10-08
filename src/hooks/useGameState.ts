import { useState, useCallback, useEffect, useRef } from "react";
import { GameState, GameData, Level } from "../types/game";
import { supabase } from "../lib/supabase";

const INITIAL_TIME = 60;
const MULTIPLIER_INCREMENT = 0.1;
const MAX_MULTIPLIER = 0.5;

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [gameData, setGameData] = useState<GameData>({
    playerId: null,
    playerName: "",
    avatarId: 1,
    horseId: 1,
    score: 0,
    level: 1,
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

  const getLevelConfig = (levelNum: number): Level => {
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
  };

  const startGame = useCallback(
    async (playerName: string, avatarId: number, horseId: number) => {
      const { data: player, error } = await supabase
        .from("players")
        .insert({ name: playerName, avatar_id: avatarId, horse_id: horseId })
        .select()
        .maybeSingle();

      if (error || !player) {
        console.error("Error creating player:", error);
        return false;
      }

      setGameData({
        playerId: player.id,
        playerName: player.name,
        avatarId: player.avatar_id,
        horseId: player.horse_id,
        score: 0,
        level: 1,
        jumpsCleared: 0,
        railsDown: 0,
        consecutivePerfect: 0,
        timeRemaining: INITIAL_TIME,
        isGameActive: true,
      });
      setGameState("playing");
      return true;
    },
    []
  );

  const addScore = useCallback(
    (points: number, isPerfect: boolean, isCleared: boolean, isRail: boolean) => {
      setGameData((prev) => {
        const newConsecutivePerfect = isPerfect ? prev.consecutivePerfect + 1 : 0;
        const multiplier = Math.min(newConsecutivePerfect * MULTIPLIER_INCREMENT, MAX_MULTIPLIER);
        const finalPoints = Math.floor(points * (1 + multiplier));

        return {
          ...prev,
          score: prev.score + finalPoints,
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
        timeRemaining: levelConfig.timeLimit,
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
      const { data, error } = await supabase.from("game_scores").insert({
        player_id: gd.playerId,
        score: gd.score,
        level_reached: gd.level,
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
    setGameData({
      playerId: null,
      playerName: "",
      avatarId: 1,
      horseId: 1,
      score: 0,
      level: 1,
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

  return {
    gameState,
    gameData,
    setGameState,
    getLevelConfig,
    startGame,
    addScore,
    resetScore,
    nextLevel,
    endGame,
    decrementTime,
    resetGame,
  };
};
