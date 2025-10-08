import { useEffect, useState, useRef } from 'react';
import { Play, Trophy } from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground';
import tempGif from '../assets/temp.gif';
import jumpGif from '../assets/jump.gif';

interface MenuProps {
  onStartGame: () => void;
  onViewLeaderboard: () => void;
}

export const Menu = ({ onStartGame, onViewLeaderboard }: MenuProps) => {
  const [gifState, setGifState] = useState<'start' | 'centered' | 'exiting'>('start');
  const [showUI, setShowUI] = useState(false);
  const [currentGif, setCurrentGif] = useState<string>(tempGif);
  const timers = useRef<number[]>([]);
  const fenceRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lastSwapRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // animate gif to center after a short delay
    timers.current.push(window.setTimeout(() => setGifState('centered'), 300));
    // reveal UI after gif settles
    timers.current.push(window.setTimeout(() => setShowUI(true), 900));

    return () => {
      timers.current.forEach((id) => clearTimeout(id));
      timers.current = [];
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // collision/distance check loop: compare img center (DOM) to fence rect (canvas coords)
  useEffect(() => {
    const loop = () => {
      try {
        const fence = fenceRef.current;
        const img = imgRef.current;
        if (fence && img) {
          // find the canvas rendered by AnimatedBackground (assumes the first canvas)
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const canvasRect = canvas.getBoundingClientRect();
            const scaleX = canvasRect.width / (canvas as HTMLCanvasElement).width;
            const scaleY = canvasRect.height / (canvas as HTMLCanvasElement).height;

            const fenceLeft = canvasRect.left + fence.x * scaleX;
            const fenceTop = canvasRect.top + fence.y * scaleY;
            const fenceW = fence.width * scaleX;
            const fenceH = fence.height * scaleY;

            const fenceCenterX = fenceLeft + fenceW / 2;
            const fenceCenterY = fenceTop + fenceH / 2;

            const imgRect = img.getBoundingClientRect();
            const imgCenterX = imgRect.left + imgRect.width / 2;
            const imgCenterY = imgRect.top + imgRect.height / 2;

            const dx = imgCenterX - fenceCenterX;
            const dy = imgCenterY - fenceCenterY;
            const dist = Math.hypot(dx, dy);

            // normalize by average size (so threshold scales across resolutions)
            const norm = dist / ((fenceW + imgRect.width) / 2);
            const now = performance.now();
            const cooldown = 250; // ms

            if (norm < 1 && now - lastSwapRef.current > cooldown) {
              // swap to jump.gif
              setCurrentGif(jumpGif);
              lastSwapRef.current = now;
            } else if (norm > 1.2 && now - lastSwapRef.current > cooldown) {
              // restore default
              setCurrentGif(tempGif);
              lastSwapRef.current = now;
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
    // trigger gif exit animation, hide UI, then call onStartGame
    setShowUI(false);
    setGifState('exiting');
    // wait for exit animation, then start game
    const t = window.setTimeout(() => onStartGame(), 650);
    timers.current.push(t);
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
      <AnimatedBackground onFenceRect={(r) => { fenceRef.current = r ?? null }} />

      {/* animated gif rider */}
      <img ref={imgRef} src={currentGif} alt="rider" style={gifStyle} />

      <div className="relative z-10 text-center w-full">
        <div className="animate-slide-down" style={{ animationDelay: '0.5s', opacity: showUI ? 1 : 0, transition: 'opacity 300ms ease' }}>
          <h1 className="text-7xl font-black text-white mb-4 drop-shadow-2xl tracking-tight" style={{ marginTop: '-15rem' }}>
            <span className="inline-block" style={{
              fontFamily: "'Press Start 2P', monospace",
              textShadow: '4px 4px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.2)',
              WebkitTextStroke: '2px rgba(0,0,0,0.2)'
            }}>
              CECILIA JUMPER
            </span>
          </h1>
          <h2 className="text-8xl font-black text-yellow-300 mb-8 drop-shadow-2xl tracking-tight">
            <span className="inline-block" style={{
              fontFamily: "'Press Start 2P', monospace",
              textShadow: '4px 4px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.2)',
              WebkitTextStroke: '2px rgba(0,0,0,0.2)'
            }}>
              CLASSIC
            </span>
          </h2>
        </div>

        {/* START button moved to bottom-center */}
        <div className="fixed left-1/2 transform -translate-x-1/2" style={{ bottom: '6.5rem', opacity: showUI ? 1 : 0, transition: 'opacity 300ms ease' }}>
          <button
            onClick={handleStartClick}
            className="relative group animate-fade-in-up mx-auto block"
            style={{ animationDelay: '1.8s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse-glow"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black text-3xl py-6 px-16 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-blue-500/50 border-4 border-white overflow-hidden">
              <div className="absolute inset-0 animate-shimmer"></div>
              <div className="relative flex items-center justify-center gap-4">
                <Play className="w-10 h-10 fill-current" />
                <span>START GAME</span>
              </div>
            </div>
          </button>
        </div>

        {/* Leaderboard moved to bottom-center (below START) */}
        <div className="fixed left-1/2 transform -translate-x-1/2" style={{ bottom: '1.5rem', opacity: showUI ? 1 : 0, transition: 'opacity 300ms ease' }}>
          <button
            onClick={onViewLeaderboard}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2 border-2 border-yellow-300"
          >
            <Trophy className="w-6 h-6" />
            <span>LEADERBOARD</span>
          </button>
        </div>

        <div className="fixed bottom-8 right-8 animate-fade-in-up" style={{ animationDelay: '2.5s', opacity: showUI ? 1 : 0, transition: 'opacity 300ms ease' }}>
          <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg backdrop-blur-sm border-2 border-white shadow-lg">
            <p className="text-sm font-semibold">Press SPACE to jump over obstacles!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
