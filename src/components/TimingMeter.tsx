import { useEffect, useState, useRef } from 'react';
import { JumpOutcome } from '../types/game';

interface TimingMeterProps {
  speed: number;
  onJumpAttempt: (outcome: JumpOutcome) => void;
  isActive: boolean;
}
export const TimingMeter = ({ speed, onJumpAttempt, isActive }: TimingMeterProps) => {
  const [indicatorPosition, setIndicatorPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const directionRef = useRef<'up' | 'down'>('down');
  const lastTimeRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(isActive);
  const speedRef = useRef<number>(speed);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState(0);
  const resumeTimeoutRef = useRef<number | null>(null);

  // color bands: red | orange | green (perfect) | orange | red
  // center green = 30%..70% by default
  const PERFECT_ZONE_START = 30;
  const PERFECT_ZONE_END = 70;

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
    const SPEED_MULTIPLIER = 2; // increase overall sweep speed

    // clear any existing interval
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current as any);
      intervalIdRef.current = null;
    }

    // only start if meter is active and not paused
    if (!isActive || paused) return;

    intervalIdRef.current = window.setInterval(() => {
  const movement = (speedRef.current * tickMs * SPEED_MULTIPLIER) / 1000; // percent per tick (sped up)

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
  }, [isActive, paused]);

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
    // pause the indicator and schedule auto-resume after 3 seconds
    setPaused(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current as any);
      resumeTimeoutRef.current = null;
    }
    resumeTimeoutRef.current = window.setTimeout(() => {
      // simply unpause and continue from the current indicatorPosition
      setPaused(false);
      resumeTimeoutRef.current = null;
    }, 3000) as unknown as number;
  };

  // cleanup auto-resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current as any);
        resumeTimeoutRef.current = null;
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
          style={{ left: '0%', width: '15%', background: 'linear-gradient(90deg,#7f0b0b,#a00b0b)', opacity: 0.9 }}
        />

        {/* left orange */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '15%', width: '15%', background: 'linear-gradient(90deg,#e07a36,#ea8a48)', opacity: 0.95 }}
        />

        {/* center green (perfect zone) */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '30%', width: '40%', background: 'linear-gradient(90deg,#16a34a,#10b981)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow-lg">
            PERFECT
          </div>
        </div>

        {/* right orange */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '70%', width: '15%', background: 'linear-gradient(90deg,#ea8a48,#e07a36)', opacity: 0.95 }}
        />

        {/* right red */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '85%', width: '15%', background: 'linear-gradient(90deg,#a00b0b,#7f0b0b)', opacity: 0.9 }}
        />

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
      </button>

      <div className="text-white font-bold text-sm drop-shadow-lg">TAP TO JUMP</div>
    </div>
  );
};
