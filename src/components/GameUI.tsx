import { Timer, XCircle } from "lucide-react";
import { TimingMeter } from "./TimingMeter";
import { AnimatedBackground } from "./AnimatedBackground";
import { useEffect, useRef, useState, useCallback } from "react";
import { Horse, Jump, GameConfig, Level, JumpOutcome, GameState } from "../types/game";

import { EndModal } from "./EndModal";
import isJumpSuccessful from "../lib/jumpChecker";

// Lazy load GIFs for better LCP performance
const tempGif = "/src/assets/temp.gif";
const jumpGif = "/src/assets/jump.gif";

interface GameUIProps {
  score: number;
  level: Level;
  timeRemaining: number;
  jumpsCleared: number;
  jumpsRequired: number;
  railsDown: number;
  // canvas/game props
  isGameActive?: boolean;
  onJumpOutcome?: (outcome: JumpOutcome) => void;
  onJumpCleared?: () => void;
  onJumpFailed?: (reason?: "perfect-miss" | "too-early" | "too-late" | "fence-passed") => void;
  onLevelComplete?: () => void;
  onGameOver?: () => void;
  onJumpAttemptReady?: (attemptFn: (outcome: JumpOutcome) => void) => void;
  setGameState: (state: GameState) => void;
}

export const GameUI = ({
  score,
  level,
  timeRemaining,
  jumpsCleared,
  jumpsRequired,
  railsDown,
  isGameActive = false,
  onJumpOutcome,
  onJumpCleared,
  onJumpFailed,
  onLevelComplete,
  onGameOver,
  onJumpAttemptReady,
}: GameUIProps) => {
  const progress = (jumpsCleared / jumpsRequired) * 100;

  // ---- Embedded canvas/game logic (previously in GameCanvas) ----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const riderRef = useRef<HTMLImageElement | null>(null);
  const riderJumpTimeoutRef = useRef<number | null>(null);
  const origHorseSizeRef = useRef<{ width: number; height: number } | null>(
    null
  );
  const riderElevatedRef = useRef<boolean>(false);
  const ELEVATION_OFFSET = 40; // pixels to lift rider GIF while jumping

  // duration to display the jump GIF (ms). Set to 3000ms so jump.gif remains visible for 3 seconds.
  const JUMP_GIF_DURATION = 1500;
  const pendingOutcomeRef = useRef<JumpOutcome | null>(null);
  const outcomeTimerRef = useRef<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [readyToPlay, setReadyToPlay] = useState<boolean>(false);
  const countdownTimerRef = useRef<number | null>(null);
  const [showGo, setShowGo] = useState(false);
  const [bgPaused, setBgPaused] = useState(false);
  const timingContainerRef = useRef<HTMLDivElement | null>(null);

  // start countdown whenever the parent activates the game
  useEffect(() => {
    if (!isGameActive) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current as any);
        countdownTimerRef.current = null;
      }
      return;
    }

    // begin 3-2-1-0 countdown and pause background during the entire sequence
    setCountdown(3);
    setShowGo(false);
    setBgPaused(true);
    
    let value = 3;
    countdownTimerRef.current = window.setInterval(() => {
      value -= 1;
      setCountdown(value >= 0 ? value : 0);
      if (value < 0) {
        // show "Let's go" for a brief moment, then hide and start
        setCountdown(null);
        setShowGo(true);
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current as any);
          countdownTimerRef.current = null;
        }
        // hide GO and mark ready after 700ms
        window.setTimeout(() => {
          setShowGo(false);
          setReadyToPlay(true);
          // resume background motion after GO disappears
          setBgPaused(false);
        }, 700);
      }
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current as any);
        countdownTimerRef.current = null;
      }
    };
  }, [isGameActive]);

  const config: GameConfig = {
    canvasWidth: typeof window !== "undefined" ? window.innerWidth : 800,
    canvasHeight: typeof window !== "undefined" ? window.innerHeight : 600,
    gravity: 0.6,
    jumpPower: -12,
    horseSpeed: 5,
  };

  const sizeRef = useRef({
    width: config.canvasWidth,
    height: config.canvasHeight,
  });

  // compute the grass/ground position to match AnimatedBackground
  const getGrassY = (height: number) => {
    const skyH = Math.floor(height * 0.62);
    const soilH = Math.floor(height * 0.09);
    return skyH + soilH;
  };

  const horse = useRef<Horse>({
    x: 0,
    y: 0,
    velocityY: 0,
    width: 300,
    height: 230,
    isJumping: false,
    animationState: "running",
  });

  const currentJumpObstacle = useRef<Jump>({
    x: 600,
    y: 320,
    width: 20,
    height: 80,
    cleared: false,
  });

  useEffect(() => {
    const grassY = getGrassY(sizeRef.current.height);
    currentJumpObstacle.current = {
      x: 600,
      y: grassY - level.jumpHeight,
      width: 20,
      height: level.jumpHeight,
      cleared: false,
    };
  }, [jumpsCleared, level]);

  // Flag to ensure we only call game end callbacks once
  const gameEndCalledRef = useRef(false);

  // Minimal canvas/game stub: previously a full requestAnimationFrame loop
  // ran the physics and collision logic. That logic has been removed to
  // simplify the component. This effect preserves canvas sizing and keeps
  // the rider aligned to the ground so the rest of the UI remains functional.
  useEffect(() => {
    // Reset game end flag when game becomes active
    if (isGameActive) {
      gameEndCalledRef.current = false;
    }

    // If game isn't active or not ready, no per-frame work is required here.
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => {
      const w = Math.max(320, window.innerWidth);
      const h = Math.max(300, window.innerHeight);
      canvas.width = Math.floor(w);
      canvas.height = Math.floor(h);
      sizeRef.current.width = canvas.width;
      sizeRef.current.height = canvas.height;
      // keep the rider on the ground (align with AnimatedBackground grass)
      try {
        const grassY = getGrassY(sizeRef.current.height);
        horse.current.y = grassY - horse.current.height + 2;
        // update rider DOM overlay position/size to match horse
        const riderEl = riderRef.current;
        if (riderEl) {
          // if currently showing the jump GIF, reduce width slightly and
          // re-center the image so the pose fits visually; otherwise restore
          // to full horse width.
          const isJump = riderEl.src && riderEl.src.indexOf('jump.gif') !== -1;
          const targetWidth = isJump
            ? Math.round(horse.current.width * 0.9)
            : Math.round(horse.current.width);
          const leftPos = Math.round(horse.current.x + (horse.current.width - targetWidth) / 2);
          riderEl.style.left = `${leftPos}px`;
          const topPos = Math.round(horse.current.y) - (riderElevatedRef.current ? ELEVATION_OFFSET : 0);
          riderEl.style.top = `${topPos}px`;
          riderEl.style.width = `${targetWidth}px`;
          riderEl.style.height = `${Math.round(horse.current.height)}px`;
        }
      } catch (e) {}
    };

    onResize();
    window.addEventListener("resize", onResize);

    // Only call end callbacks once if time ran out while inactive
    if (timeRemaining <= 0 && !gameEndCalledRef.current) {
      gameEndCalledRef.current = true;
      if (jumpsCleared >= jumpsRequired) {
        onLevelComplete?.();
      } else {
        onGameOver?.();
      }
    }

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [isGameActive, level, jumpsCleared, jumpsRequired, timeRemaining]);

  const handleJumpAttempt = useCallback(
    (outcome: JumpOutcome) => {
      // allow multiple jump attempts per fence: set/replace the pending outcome even if one exists
      pendingOutcomeRef.current = outcome;
      outcomeTimerRef.current = 0;
      onJumpOutcome?.(outcome);

      // consult current positions
      const fenceX = currentJumpObstacle.current?.x ?? 0;
      const horseX = horse.current?.x ?? 0;

      // map timing outcomes to feedback using jump checker
      try {
        if (outcome === 'too-late') {
          onJumpFailed?.('too-late');
        } else if (outcome === 'too-early') {
          onJumpFailed?.('too-early');
        } else if (outcome === 'perfect') {
          // perfect timing; verify spatially that the horse jumped before the fence-buffer
          const ok = isJumpSuccessful(horseX, fenceX);
          console.log(ok, horseX, fenceX)
          if (ok) {
            onJumpCleared?.();
          } else {
            // timing was perfect but spatially the jump missed the fence buffer
            // report a perfect-miss so the UI shows the 'Miss' feedback message
            onJumpFailed?.('perfect-miss');
          }
        }
      } catch (e) {
        // swallow checker errors
      }

      // swap to jump GIF for visual feedback (preserve previous behavior)
      try {
        if (riderRef.current) {
          // clear any pending restore timer
          if (riderJumpTimeoutRef.current) {
            clearTimeout(riderJumpTimeoutRef.current as any);
            riderJumpTimeoutRef.current = null;
          }

          // store original horse size so we can restore later
          origHorseSizeRef.current = {
            width: horse.current.width,
            height: horse.current.height,
          };

          riderRef.current.src = jumpGif;
          riderElevatedRef.current = true;
          // nudge rider DOM overlay upwards while showing jump GIF
          try {
            const riderEl = riderRef.current;
            if (riderEl) {
              const reducedWidth = Math.round(horse.current.width * 0.9);
              const widthDiff = horse.current.width - reducedWidth;
              const leftPos = Math.round(horse.current.x + widthDiff / 2);
              const topPos = Math.round(horse.current.y) - ELEVATION_OFFSET;
              riderEl.style.left = `${leftPos}px`;
              riderEl.style.top = `${topPos}px`;
              riderEl.style.width = `${reducedWidth}px`;
              riderEl.style.height = `${Math.round(horse.current.height)}px`;
            }
          } catch (e) {}
          riderJumpTimeoutRef.current = window.setTimeout(() => {
            try {
              if (riderRef.current) riderRef.current.src = tempGif;
              riderElevatedRef.current = false;
              try {
                const riderEl = riderRef.current;
                if (riderEl) {
                  // restore original sizing and position
                  riderEl.style.width = `${Math.round(horse.current.width)}px`;
                  riderEl.style.height = `${Math.round(horse.current.height)}px`;
                  riderEl.style.left = `${Math.round(horse.current.x)}px`;
                  const topPos = Math.round(horse.current.y);
                  riderEl.style.top = `${topPos}px`;
                }
              } catch (e) {}
            } catch (e) {}
            riderJumpTimeoutRef.current = null;
          }, JUMP_GIF_DURATION) as unknown as number;
        }
      } catch (e) {}
    },
    [onJumpOutcome, onJumpCleared, onJumpFailed]
  );

  // cleanup any leftover timeout when component unmounts
  useEffect(() => {
    return () => {
      if (riderJumpTimeoutRef.current) {
        clearTimeout(riderJumpTimeoutRef.current as any);
        riderJumpTimeoutRef.current = null;
      }
      try {
        // ensure rider image is restored if component unmounts during a jump GIF
        if (riderRef.current) {
          riderRef.current.src = tempGif;
        }
        riderElevatedRef.current = false;
        // restore original horse size if present
        if (origHorseSizeRef.current) {
          horse.current.width = origHorseSizeRef.current.width;
          horse.current.height = origHorseSizeRef.current.height;
          origHorseSizeRef.current = null;
          if (sizeRef.current.height) {
            const grassY = getGrassY(sizeRef.current.height);
            horse.current.y = grassY - horse.current.height + 2;
          }
        }
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (onJumpAttemptReady) onJumpAttemptReady(handleJumpAttempt);
  }, [onJumpAttemptReady, handleJumpAttempt]);

  return (
    <>
      {/* small top-left level badge */}
  <EndModal onOpen={() => setBgPaused(true)} onClose={() => setBgPaused(false)} />
      <div className="fixed top-32 left-16 z-50">
        <div
          className="text-white font-bold px-5 py-2 rounded-xl shadow-lg text-4xl tracking-wider"
          style={{
            textShadow:
              "2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 0, 0, 0.3)",
          }}
        >
          LVL {level.number}
        </div>
      </div>
      {/* small top-right score badge */}
      <div className="fixed top-32 right-16 z-50">
        <div
          className="text-white font-bold px-6 py-2 rounded-xl shadow-lg text-4xl tracking-wider"
          style={{
            textShadow:
              "2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 0, 0, 0.3)",
          }}
        >
          SCR {score}
        </div>
      </div>
      {/* Scoreboard and helper fixed at top-center */}
      <div className="fixed left-1/2 top-4 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
          <div className="flex flex-row justify-center gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Timer
                className={`w-12 h-12 ${
                  timeRemaining <= 10 ? "text-red-500" : "text-green-500"
                }`}
              />
              <div>
                <div className="text-xs text-gray-500">Time</div>
                <div
                  className={`text-2xl font-bold ${
                    timeRemaining <= 10 ? "text-red-600" : "text-gray-800"
                  }`}
                >
                  {timeRemaining}s
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <XCircle className="w-12 h-12 text-red-500" />
              <div>
                <div className="text-xs text-gray-500">Rails Down</div>
                <div className="text-2xl font-bold text-gray-800">
                  {railsDown}
                </div>
              </div>
            </div>
          </div>
        <div className="bg-white rounded-lg shadow-lg p-4 relative z-30">

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Jumps Cleared</span>
              <span className="font-semibold">
                {jumpsCleared} / {jumpsRequired}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 text-center text-white bg-gray-800 bg-opacity-75 rounded-lg py-2 px-4 left-1/2 transform z-50">
          <p className="text-sm">
            Click the timing meter when the indicator is in the green zone!
          </p>
        </div>
      </div>

      {/* Timing meter embedded into the GameUI - fixed bottom-center */}
      <div
        ref={timingContainerRef}
        className="fixed left-1/2 bottom-8 transform -translate-x-1/2 z-40"
        aria-hidden="false"
      >
        <TimingMeter
          speed={level.meterSpeed}
          isActive={(isGameActive ?? false) && readyToPlay}
          onJumpAttempt={handleJumpAttempt}
        />
      </div>

      {/* Large circular button that proxies to the timing meter click */}
      <div className="fixed right-64 bottom-32 z-50">
        <button
          type="button"
          aria-label="Large timing button"
          onClick={() => {
            // find the inner button rendered by TimingMeter and trigger a click
            try {
              const innerBtn = timingContainerRef.current?.querySelector(
                "button"
              ) as HTMLButtonElement | null;
              if (innerBtn && typeof innerBtn.click === "function") {
                innerBtn.click();
              }
            } catch (e) {
              // swallow errors — fallback: call handler with a conservative outcome if needed
              // handleJumpAttempt("perfect"); // optional fallback
            }
          }}
          className="w-36 h-36 rounded-full bg-green-600 border-4 border-white shadow-lg focus:outline-none"
        />
      </div>

      {/* Animated background behind canvas */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
        <AnimatedBackground
          paused={bgPaused}
          onFenceRect={(rects) => {
            if (!rects || rects.length === 0) return;
            try {
              // Use the first fence for game logic (closest to rider)
              const rect = rects[0];
              
              // Check if rider is after (behind) the fence with no jump outcome
              if (horse.current.x > rect.x + rect.width && !currentJumpObstacle.current.cleared) {
                // Rider is behind fence and fence wasn't cleared - reset consecutive perfect bonus
                onJumpFailed?.('fence-passed');
              }
              
              // forward the fence rectangle to the game's obstacle so visuals align
              currentJumpObstacle.current.x = rect.x;
              currentJumpObstacle.current.y = rect.y;
              currentJumpObstacle.current.width = rect.width;
              currentJumpObstacle.current.height = rect.height;
              // keep cleared flag if already true
              // (do not reset cleared here to preserve game state)
            } catch (e) {
              // swallow errors to avoid breaking render
            }
          }}
        />
      </div>

      {/* Fullscreen canvas rendered by the GameUI container */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0 pixelated"
        style={{ imageRendering: "pixelated" }}
      />
      {/* Rider HTML overlay */}
      <img
        ref={riderRef}
        src={tempGif}
        alt="rider"
        style={{
          position: "absolute",
          left: horse.current.x,
          top: horse.current.y,
          width: horse.current.width,
          height: horse.current.height,
          pointerEvents: "none",
          zIndex: 10,
          transform: "translateZ(0)",
        }}
        className="pointer-events-none select-none"
      />
      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none countdown-overlay">
          <div
            className="text-center text-white drop-shadow-2xl text-8xl font-extrabold animate-count-pop"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            {countdown > 0 ? countdown : 0}
          </div>
        </div>
      )}

      {showGo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="text-center text-white drop-shadow-2xl text-6xl font-extrabold animate-go-pop"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            LET&apos;S GO!
          </div>
        </div>
      )}
    </>
  );
};
