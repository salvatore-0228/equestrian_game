import { useEffect, useRef, useState } from 'react';
import { Horse, Jump, GameConfig, Level, JumpOutcome } from '../types/game';
import horseImage from '../assets/image_S.jpg';

interface GameCanvasProps {
  level: Level;
  onJumpOutcome: (outcome: JumpOutcome) => void;
  onLevelComplete: () => void;
  onGameOver: () => void;
  timeRemaining: number;
  isGameActive: boolean;
  currentJump: number;
  totalJumps: number;
  onJumpAttemptReady?: (attemptFn: (outcome: JumpOutcome) => void) => void;
}

export const GameCanvas = ({
  level,
  onJumpOutcome,
  onLevelComplete,
  onGameOver,
  timeRemaining,
  isGameActive,
  currentJump,
  totalJumps,
  onJumpAttemptReady,
}: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const horseImgRef = useRef<HTMLImageElement>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const pendingOutcomeRef = useRef<JumpOutcome | null>(null);
  const outcomeTimerRef = useRef<number>(0);

  // dynamic canvas configuration — width/height set from window size
  const config: GameConfig = {
    canvasWidth: typeof window !== 'undefined' ? window.innerWidth : 800,
    canvasHeight: typeof window !== 'undefined' ? window.innerHeight : 600,
    gravity: 0.6,
    jumpPower: -12,
    horseSpeed: 3,
  };

  const sizeRef = useRef({ width: config.canvasWidth, height: config.canvasHeight });

  const horse = useRef<Horse>({
    x: 100,
    y: 280,
    velocityY: 0,
    width: 80,
    height: 60,
    isJumping: false,
    animationState: 'running',
  });

  const currentJumpObstacle = useRef<Jump>({
    x: 600,
    y: 320,
    width: 20,
    height: 80,
    cleared: false,
  });

  useEffect(() => {
    const img = new Image();
    img.src = horseImage;
    img.onload = () => {
      horseImgRef.current = img;
      setImageLoaded(true);
    };
  }, []);

  // handle resize: update canvas pixel size and internal sizeRef
  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = Math.max(320, window.innerWidth);
      const h = Math.max(240, window.innerHeight);
      // set the drawing buffer to match CSS pixels for crisp drawing
      canvas.width = Math.floor(w);
      canvas.height = Math.floor(h);
      sizeRef.current.width = canvas.width;
      sizeRef.current.height = canvas.height;
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    currentJumpObstacle.current = {
      x: 600,
      y: config.canvasHeight - level.jumpHeight,
      width: 20,
      height: level.jumpHeight,
      cleared: false,
    };
  }, [currentJump, level]);

  useEffect(() => {
    if (!isGameActive || timeRemaining <= 0) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (timeRemaining <= 0) {
        if (currentJump >= totalJumps) {
          onLevelComplete();
        } else {
          onGameOver();
        }
      }
      return;
    }

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas || !imageLoaded) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cw = sizeRef.current.width;
      const ch = sizeRef.current.height;

      ctx.clearRect(0, 0, cw, ch);

      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, cw, ch * 0.7);
      ctx.fillStyle = '#90EE90';
      ctx.fillRect(0, ch * 0.7, cw, ch * 0.3);

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, ch - 20, cw, 20);

      if (pendingOutcomeRef.current) {
        outcomeTimerRef.current++;

        if (pendingOutcomeRef.current === 'too-late') {
          if (horse.current.animationState !== 'backing-up') {
            horse.current.animationState = 'backing-up';
            outcomeTimerRef.current = 0;
          }

          if (outcomeTimerRef.current < 60) {
            horse.current.x -= 1;
          } else {
            horse.current.x = 100;
            horse.current.animationState = 'running';
            pendingOutcomeRef.current = null;
            outcomeTimerRef.current = 0;
          }
        } else if (pendingOutcomeRef.current === 'too-early') {
          if (horse.current.animationState !== 'slowing') {
            horse.current.animationState = 'slowing';
            outcomeTimerRef.current = 0;
            currentJumpObstacle.current.cleared = true;
          }

          if (outcomeTimerRef.current < 60) {
          } else {
            currentJumpObstacle.current.x = 600;
            currentJumpObstacle.current.cleared = false;
            horse.current.animationState = 'running';
            pendingOutcomeRef.current = null;
            outcomeTimerRef.current = 0;
          }
        } else if (pendingOutcomeRef.current === 'perfect') {
          if (!horse.current.isJumping) {
            horse.current.velocityY = config.jumpPower;
            horse.current.isJumping = true;
            horse.current.animationState = 'jumping';
          }
        }
      }

      if (horse.current.isJumping || horse.current.velocityY !== 0) {
        horse.current.velocityY += config.gravity;
        horse.current.y += horse.current.velocityY;

        const groundLevel = ch - 120;
        if (horse.current.y >= groundLevel) {
          horse.current.y = groundLevel;
          horse.current.velocityY = 0;
          horse.current.isJumping = false;

          if (pendingOutcomeRef.current === 'perfect' && currentJumpObstacle.current.cleared) {
            currentJumpObstacle.current.x = 600;
            currentJumpObstacle.current.cleared = false;
            horse.current.animationState = 'running';
            pendingOutcomeRef.current = null;
            outcomeTimerRef.current = 0;
          } else {
            horse.current.animationState = 'running';
          }
        }
      }

      if (horseImgRef.current) {
        ctx.drawImage(
          horseImgRef.current,
          horse.current.x,
          horse.current.y,
          horse.current.width,
          horse.current.height
        );
      } else {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(horse.current.x, horse.current.y, horse.current.width, horse.current.height);
      }

  const jump = currentJumpObstacle.current;

      if (pendingOutcomeRef.current !== 'too-early') {
        ctx.fillStyle = jump.cleared ? '#4ADE80' : '#FF6B6B';
  // adjust obstacle y relative to current canvas height if needed
  ctx.fillRect(jump.x, jump.y, jump.width, jump.height);

        ctx.fillStyle = '#FFFFFF';
        const stripeCount = 3;
        const stripeHeight = jump.height / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
          if (i % 2 === 0) {
            ctx.fillRect(jump.x, jump.y + i * stripeHeight, jump.width, stripeHeight / 2);
          }
        }
      } else {
        ctx.fillStyle = '#6B7280';
        ctx.fillRect(jump.x, config.canvasHeight - 20, jump.width, 5);
      }

      if (
        !jump.cleared &&
        !pendingOutcomeRef.current &&
        horse.current.x < jump.x + jump.width &&
        horse.current.x + horse.current.width > jump.x &&
        horse.current.y + horse.current.height > jump.y
      ) {
        jump.cleared = true;
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isGameActive, timeRemaining, imageLoaded, level, currentJump, totalJumps]);

  const handleJumpAttempt = (outcome: JumpOutcome) => {
    if (pendingOutcomeRef.current) return;

    pendingOutcomeRef.current = outcome;
    outcomeTimerRef.current = 0;
    onJumpOutcome(outcome);
  };

  useEffect(() => {
    if (onJumpAttemptReady) {
      onJumpAttemptReady(handleJumpAttempt);
    }
  }, [onJumpAttemptReady]);

  return (
    <canvas
      ref={canvasRef}
      width={config.canvasWidth}
      height={config.canvasHeight}
      className="border-4 border-gray-800 rounded-lg shadow-2xl pixelated"
    />
  );
};
