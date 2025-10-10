import { useEffect, useState, useRef } from 'react';
import { AnimatedBackground } from './AnimatedBackground';
import StartPanel from './StartPanel';
import { LevelSelect } from './LevelSelect';

// Use public directory paths for deployment
const tempGif = '/temp.gif';
const jumpGif = '/jump.gif';

interface MenuProps {
  onStartGame: (selectedLevel?: number) => void;
  onViewLeaderboard: () => void;
  unlockedLevels?: number;
}

export const Menu = ({ onStartGame, onViewLeaderboard, unlockedLevels = 1 }: MenuProps) => {
  const [gifState, setGifState] = useState<'start' | 'centered' | 'exiting'>('start');
  const [showUI, setShowUI] = useState(false);
  const [currentGif, setCurrentGif] = useState<string>(tempGif);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const timers = useRef<number[]>([]);
  const fencesRef = useRef<{ x: number; y: number; width: number; height: number }[]>([]);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lastSwapRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Show UI immediately for better LCP, animate gif after
    setShowUI(true);
    
    // Animate gif to center after a short delay (reduced from 300ms)
    timers.current.push(window.setTimeout(() => setGifState('centered'), 100));

    return () => {
      timers.current.forEach((id) => clearTimeout(id));
      timers.current = [];
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // collision/distance check loop: compare img center (DOM) to fence rects (canvas coords)
  useEffect(() => {
    const loop = () => {
      try {
        const fences = fencesRef.current;
        const img = imgRef.current;
        if (fences.length > 0 && img) {
          // find the canvas rendered by AnimatedBackground (assumes the first canvas)
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const canvasRect = canvas.getBoundingClientRect();
            const scaleX = canvasRect.width / (canvas as HTMLCanvasElement).width;
            const scaleY = canvasRect.height / (canvas as HTMLCanvasElement).height;

            const imgRect = img.getBoundingClientRect();
            const imgCenterX = imgRect.left + imgRect.width / 2;
            const imgCenterY = imgRect.top + imgRect.height / 2;

            let closestFence = null;
            let minDistance = Infinity;

            // Find the closest fence to the rider
            fences.forEach(fence => {
              const fenceLeft = canvasRect.left + fence.x * scaleX;
              const fenceTop = canvasRect.top + fence.y * scaleY;
              const fenceW = fence.width * scaleX;
              const fenceH = fence.height * scaleY;

              const distanceToFence = Math.abs(imgCenterX - (fenceLeft + fenceW / 2) + 150);
              const verticalDistance = Math.abs(imgCenterY - (fenceTop + fenceH / 2));
              
              // Only consider fences that are reasonably close horizontally
              if (distanceToFence < (fenceW + imgRect.width) && verticalDistance < fenceH + imgRect.height) {
                if (distanceToFence < minDistance) {
                  minDistance = distanceToFence;
                  closestFence = { fence, distanceToFence, verticalDistance, fenceW, fenceH };
                }
              }
            });

            if (closestFence) {
              const { distanceToFence, verticalDistance, fenceW, fenceH } = closestFence;
              
              // More accurate collision detection
              const horizontalThreshold = (fenceW + imgRect.width) / 4; // Even closer threshold
              const verticalThreshold = fenceH + imgRect.height; // Allow some vertical tolerance
              
              const now = performance.now();
              const cooldown = 600; // Increased cooldown to prevent rapid switching

              console.log('distanceToFence', distanceToFence);
              // Check if rider is horizontally close to fence and vertically aligned
              if (distanceToFence < horizontalThreshold && 
                  verticalDistance < verticalThreshold && 
                  now - lastSwapRef.current > cooldown) {
                // swap to jump.gif
                setCurrentGif(jumpGif);
                lastSwapRef.current = now;
              } else if (distanceToFence > horizontalThreshold * 2 && 
                         now - lastSwapRef.current > cooldown) {
                // restore default when far enough from fence
                setCurrentGif(tempGif);
                lastSwapRef.current = now;
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  const handleStartClick = () => {
    // hide the start panel and show level select
    setShowUI(false);
    setShowLevelSelect(true);
  };

  const handleLevelSelect = (level: number) => {
    // hide level select modal
    setShowLevelSelect(false);
    // trigger gif exit animation, then start game with selected level
    setGifState('exiting');
    const t = window.setTimeout(() => onStartGame(level), 650);
    timers.current.push(t);
  };

  const handleLevelSelectCancel = () => {
    // hide level select and show UI again
    setShowLevelSelect(false);
    setShowUI(true);
  };

  // compute gif positioning styles based on state
  const gifStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: currentGif === jumpGif ? '33%' : '30%',
    left: gifState === 'start' ? '-20%' : gifState === 'centered' ? '50%' : '120%',
    transform: 'translateX(-50%)',
    transition: gifState === 'exiting' ? 'left 5s cubic-bezier(0.4,0,1,1), transform 600ms ease-in' : 'left 5s cubic-bezier(0.2,0.8,0.2,1)',
    zIndex: 20,
    width: currentGif === jumpGif ? 270 : 300,
    height: 'auto',
    pointerEvents: 'none',
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <AnimatedBackground onFenceRect={(fences) => { fencesRef.current = fences }} />

      {/* animated gif rider */}
      <img ref={imgRef} src={currentGif} alt="rider" style={gifStyle} />

      <div className="relative z-10 text-center w-full">
        <StartPanel showUI={showUI} onStart={handleStartClick} onViewLeaderboard={onViewLeaderboard} />
      </div>

      {/* Level Select Modal */}
      {showLevelSelect && (
        <LevelSelect
          currentLevel={1}
          maxLevel={10}
          unlockedLevels={unlockedLevels}
          onSelect={handleLevelSelect}
          onCancel={handleLevelSelectCancel}
        />
      )}
    </div>
  );
};
