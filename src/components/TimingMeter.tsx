import { useEffect, useState, useRef } from 'react';
import { JumpOutcome } from '../types/game';

interface TimingMeterProps {
  speed: number;
  onJumpAttempt: (outcome: JumpOutcome) => void;
  isActive: boolean;
}
export const TimingMeter = ({ speed, onJumpAttempt, isActive }: TimingMeterProps) => {
  const [indicatorPosition, setIndicatorPosition] = useState(0);
  const directionRef = useRef<'up' | 'down'>('down');
  const lastTimeRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(isActive);
  const speedRef = useRef<number>(speed);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState(0);
  const resumeTimeoutRef = useRef<number | null>(null);
  
  // Afterimage system for click feedback
  const [afterimages, setAfterimages] = useState<Array<{
    position: number;
    timestamp: number;
    outcome: JumpOutcome;
  }>>([]);
  const afterimageCleanupRef = useRef<number | null>(null);

  // color bands: red | orange | green (perfect) | orange | red
  // center green = 40%..60% (reduced from 30%..70% to make perfect zone half the size)
  const PERFECT_ZONE_START = 40;
  const PERFECT_ZONE_END = 60;

  // keep refs in sync with props
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // measure button width for pixel-based translation
  useEffect(() => {
    const measure = () => {
      const el = buttonRef.current;
      if (el) setButtonWidth(el.clientWidth || 0);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Reset indicator when meter becomes active
  useEffect(() => {
    if (isActive) {
      setIndicatorPosition(0);
      directionRef.current = 'down';
      lastTimeRef.current = 0;
    }
  }, [isActive]);

  // resumeSignal handling removed - meter will auto-resume 3s after a click

  // Single rAF loop that runs continuously but only moves indicator while active
  // Interval-based tick (~60 FPS) to update indicator; start/stop based on paused/isActive
  const intervalIdRef = useRef<number | null>(null);
  useEffect(() => {
  const tickMs = 10; // ~100fps for snappier motion
    
    // Calculate speed based on fence synchronization
    // Fence spacing: 400px, Movement speed: 2px/frame, FPS: 60
    // Time between fences: 400px ÷ 2px/frame ÷ 60fps = 3.33 seconds
    // For 2 jumps per cycle: 3.33s ÷ 2 = 1.67s per full cycle
    // Speed calculation: 100% (full cycle) ÷ 1.67s = 60% per second
    const FENCE_SPACING = 400; // pixels
    const MOVEMENT_SPEED = 2; // pixels per frame
    const FPS = 60; // frames per second
    const JUMPS_PER_CYCLE = 2; // target jumps per timing meter cycle
    
    const timeBetweenFences = FENCE_SPACING / (MOVEMENT_SPEED * FPS); // seconds
    const timePerCycle = timeBetweenFences / JUMPS_PER_CYCLE; // seconds
    const calculatedSpeed = 100 / timePerCycle; // percent per second
    
    // Debug logging for synchronization verification
    console.log('Timing Meter Sync:', {
      fenceSpacing: FENCE_SPACING,
      movementSpeed: MOVEMENT_SPEED,
      fps: FPS,
      timeBetweenFences: timeBetweenFences.toFixed(2) + 's',
      jumpsPerCycle: JUMPS_PER_CYCLE,
      timePerCycle: timePerCycle.toFixed(2) + 's',
      calculatedSpeed: calculatedSpeed.toFixed(2) + '%/s'
    });

    // clear any existing interval
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current as any);
      intervalIdRef.current = null;
    }

    // only start if meter is active
    if (!isActive) return;

    intervalIdRef.current = window.setInterval(() => {
      // Use calculated speed instead of prop speed for fence synchronization
      const movement = (calculatedSpeed * tickMs) / 1000; // percent per tick

      setIndicatorPosition((prev) => {
        const delta = directionRef.current === 'down' ? movement : -movement;
        let newPos = prev + delta;

        if (newPos >= 100) {
          newPos = 100;
          directionRef.current = 'up';
        } else if (newPos <= 0) {
          newPos = 0;
          directionRef.current = 'down';
        }

        return Math.min(100, Math.max(0, newPos));
      });
    }, tickMs) as unknown as number;

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current as any);
        intervalIdRef.current = null;
      }
    };
  }, [isActive]);

  // (no CSS cycle; indicator is driven by rAF loop using indicatorPosition)

  const handleClick = () => {
    // allow clicks regardless of isActive/paused state
    let outcome: JumpOutcome;

    if (indicatorPosition >= PERFECT_ZONE_START && indicatorPosition <= PERFECT_ZONE_END) {
      outcome = 'perfect';
    } else if (indicatorPosition < PERFECT_ZONE_START) {
      outcome = 'too-early';
    } else {
      outcome = 'too-late';
    }

    onJumpAttempt(outcome);
    
    // Create afterimage at current position instead of pausing
    const newAfterimage = {
      position: indicatorPosition,
      timestamp: Date.now(),
      outcome: outcome
    };
    
    setAfterimages(prev => [...prev, newAfterimage]);
  };

  // cleanup auto-resume timer and afterimages on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current as any);
        resumeTimeoutRef.current = null;
      }
      if (afterimageCleanupRef.current) {
        clearInterval(afterimageCleanupRef.current as any);
        afterimageCleanupRef.current = null;
      }
    };
  }, []);

  // Cleanup expired afterimages every 100ms
  useEffect(() => {
    if (afterimageCleanupRef.current) {
      clearInterval(afterimageCleanupRef.current as any);
    }

    afterimageCleanupRef.current = window.setInterval(() => {
      const now = Date.now();
      setAfterimages(prev => prev.filter(img => now - img.timestamp < 3000)); // Keep for 3 seconds
    }, 100) as unknown as number;

    return () => {
      if (afterimageCleanupRef.current) {
        clearInterval(afterimageCleanupRef.current as any);
        afterimageCleanupRef.current = null;
      }
    };
  }, []);



  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-white font-bold text-xl drop-shadow-lg">TIMING</div>

      <button
        onClick={handleClick}
        ref={buttonRef}
        className="relative w-96 h-16 bg-gray-800 rounded-lg border-4 border-gray-700 shadow-2xl overflow-hidden cursor-pointer hover:border-yellow-500 transition-colors"
      >
        {/* left red */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '0%', width: '20%', background: 'linear-gradient(90deg,#7f0b0b,#a00b0b)', opacity: 0.9 }}
        />

        {/* left orange */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '20%', width: '20%', background: 'linear-gradient(90deg,#e07a36,#ea8a48)', opacity: 0.95 }}
        />

        {/* center green (perfect zone) */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '40%', width: '20%', background: 'linear-gradient(90deg,#16a34a,#10b981)' }}
        >
          {/* <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow-lg">
            PERFECT
          </div> */}
        </div>

        {/* right orange */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '60%', width: '20%', background: 'linear-gradient(90deg,#ea8a48,#e07a36)', opacity: 0.95 }}
        />

        {/* right red */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '80%', width: '20%', background: 'linear-gradient(90deg,#a00b0b,#7f0b0b)', opacity: 0.9 }}
        />

        {/* Main indicator */}
        <div
          className={`absolute top-0 bottom-0 w-2 bg-yellow-400 shadow-lg`}
          style={{
            left: 0,
            transform: `translateX(${Math.round((indicatorPosition / 100) * buttonWidth)}px)`,
            willChange: 'transform',
          }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-300 rotate-45 shadow-xl"></div>
        </div>

        {/* Afterimages - rendered behind main indicator */}
        {afterimages.map((afterimage, index) => {
          const age = Date.now() - afterimage.timestamp;
          const opacity = Math.max(0, 1 - (age / 3000)); // Fade out over 3 seconds
          
          // Light yellow color for all afterimages
          const afterimageColor = 'bg-yellow-200';
          const afterimageDiamondColor = 'bg-yellow-100';
          
          return (
            <div
              key={`${afterimage.timestamp}-${index}`}
              className={`absolute top-0 bottom-0 w-2 ${afterimageColor} shadow-lg transition-opacity duration-100`}
              style={{
                left: 0,
                transform: `translateX(${Math.round((afterimage.position / 100) * buttonWidth)}px)`,
                opacity: opacity,
                willChange: 'transform',
              }}
            >
              <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 ${afterimageDiamondColor} rotate-45 shadow-xl`}></div>
            </div>
          );
        })}
      </button>

      <div className="text-white font-bold text-sm drop-shadow-lg">TAP TO JUMP</div>
    </div>
  );
};
