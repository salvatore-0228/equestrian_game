import { useEffect, useState, useRef } from 'react';
import { JumpOutcome } from '../types/game';
import { getTimingZones } from '../config/levels.utils';

interface TimingMeterProps {
  onJumpAttempt: (val: boolean) => void;
  isActive: boolean;
  distanceToFence: number;
  setVal: (outcome: JumpOutcome) => void;
  disabled?: boolean;
  level: number;
}

export const TimingMeter = ({ onJumpAttempt, isActive, distanceToFence, disabled = false, setVal, level }: TimingMeterProps) => {
  const [indicatorPosition, setIndicatorPosition] = useState(0); // Start at left edge
  const directionRef = useRef<'left' | 'right'>('right');
  const intervalRef = useRef<number | null>(null);

  // Get dynamic timing zones based on level configuration
  const timingZones = getTimingZones(level);
  
  // Calculate zone positions based on level configuration
  const PERFECT_ZONE_WIDTH = timingZones.perfect;
  const GOOD_ZONE_WIDTH = timingZones.good;
  
  // Perfect zone is centered, good zones on each side, poor zones on edges
  const PERFECT_ZONE_START = (100 - PERFECT_ZONE_WIDTH) / 2;
  const PERFECT_ZONE_END = PERFECT_ZONE_START + PERFECT_ZONE_WIDTH;
  
  // Good zones are adjacent to perfect zone
  const LEFT_GOOD_START = PERFECT_ZONE_START - GOOD_ZONE_WIDTH / 2;
  const RIGHT_GOOD_END = PERFECT_ZONE_END + GOOD_ZONE_WIDTH / 2;
  
  // Poor zones are on the edges
  const LEFT_POOR_WIDTH = LEFT_GOOD_START;
  const RIGHT_POOR_WIDTH = 100 - RIGHT_GOOD_END;

  // Distance-based visibility logic
  // Hide timing meter when distance to fence is greater than 300 pixels
  const shouldShowMeter = distanceToFence <= 300 && distanceToFence > -100;
  const isMeterActive = isActive && shouldShowMeter && !disabled;

  // Animation setup
  useEffect(() => {
    if (!isMeterActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start the indicator animation
    intervalRef.current = window.setInterval(() => {
      setIndicatorPosition(prev => {
        const speed = 2; // Adjust speed as needed
        let newPos = prev + (directionRef.current === 'right' ? speed : -speed);

        // Bounce off edges
        if (newPos >= 100) {
          newPos = 100;
          directionRef.current = 'left';
        } else if (newPos <= 0) {
          newPos = 0;
          directionRef.current = 'right';
        }

        return newPos;
      });
    }, 50); // 20 FPS

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMeterActive]);

  // Reset indicator when becoming active
  useEffect(() => {
    if (isMeterActive) {
      setIndicatorPosition(0);
      directionRef.current = 'right';
    }
  }, [isMeterActive]);

  const handleClick = () => {
    if (!isMeterActive || disabled) return;

    let outcome: JumpOutcome;

    // Determine outcome based on indicator position
    if (indicatorPosition >= PERFECT_ZONE_START && indicatorPosition <= PERFECT_ZONE_END) {
      outcome = 'perfect';
    } else if (
      (indicatorPosition >= LEFT_GOOD_START && indicatorPosition < PERFECT_ZONE_START) ||
      (indicatorPosition > PERFECT_ZONE_END && indicatorPosition <= RIGHT_GOOD_END)
    ) {
      outcome = 'good';
    } else {
      outcome = 'poor';
    }
    setVal(outcome);
    onJumpAttempt (true);
    // onJumpAttempt(outcome);
  };

  // Don't render if not active or distance is too far
  if (!shouldShowMeter) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-white font-bold text-xl drop-shadow-lg">TIMING</div>
      
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`relative w-96 h-16 bg-gray-800 rounded-lg border-4 shadow-2xl overflow-hidden transition-colors focus:outline-none ${
          disabled 
            ? 'border-gray-500 cursor-not-allowed opacity-50' 
            : 'border-gray-700 cursor-pointer hover:border-yellow-500 focus:border-yellow-400'
        }`}
      >
        {/* Left Poor Zone */}
        <div
          className="absolute top-0 bottom-0 bg-red-600"
          style={{ 
            left: '0%', 
            width: `${LEFT_POOR_WIDTH}%`
          }}
        />

        {/* Left Good Zone */}
        <div
          className="absolute top-0 bottom-0 bg-yellow-500"
          style={{ 
            left: `${LEFT_POOR_WIDTH}%`, 
            width: `${GOOD_ZONE_WIDTH / 2}%`
          }}
        />

        {/* Perfect Zone */}
        <div
          className="absolute top-0 bottom-0 bg-green-500"
          style={{ 
            left: `${PERFECT_ZONE_START}%`, 
            width: `${PERFECT_ZONE_WIDTH}%`
          }}
        />

        {/* Right Good Zone */}
        <div
          className="absolute top-0 bottom-0 bg-yellow-500"
          style={{ 
            left: `${PERFECT_ZONE_END}%`, 
            width: `${GOOD_ZONE_WIDTH / 2}%`
          }}
        />

        {/* Right Poor Zone */}
        <div
          className="absolute top-0 bottom-0 bg-red-600"
          style={{ 
            left: `${RIGHT_GOOD_END}%`, 
            width: `${RIGHT_POOR_WIDTH}%`
          }}
        />

        {/* Moving Indicator */}
        <div
          className="absolute top-0 bottom-0 w-2 bg-yellow-300 shadow-lg"
          style={{
            left: `${indicatorPosition}%`,
            transform: 'translateX(-50%)',
            willChange: 'left',
          }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-200 rotate-45 shadow-xl"></div>
        </div>
      </button>

      <div className="text-white font-bold text-sm drop-shadow-lg">TAP TO JUMP</div>
    </div>
  );
};
