import { useEffect, useRef } from "react";

// Use public directory path for deployment
const fenceSrc = "/vfence.png";

type FenceRect = { x: number; y: number; width: number; height: number };

interface Fence {
  x: number;
  y: number;
  width: number;
  height: number;
  id: number;
}

export const AnimatedBackground = ({ 
  onFenceRect, 
  paused, 
  animationSpeed = 1 
}: { 
  onFenceRect?: (rects: FenceRect[]) => void, 
  paused?: boolean,
  animationSpeed?: number // -1 (left), 0 (stop), 1 (right)
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef<boolean>(!!paused);
  const animationSpeedRef = useRef<number>(animationSpeed);
  const animationFrameRef = useRef<number | null>(null);

  // keep refs in sync without restarting the main animation effect (we want variables to persist)
  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);

  useEffect(() => {
    animationSpeedRef.current = animationSpeed;
  }, [animationSpeed]);

  useEffect(() => {
    // Small delay to let LCP elements render first
    const initTimer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let cloudOffset = 0;
      let grassOffset = 0;
      
      // Multiple fences system
      let fences: Fence[] = [];
      let fenceIdCounter = 0;

      const fenceImage = new Image();
      let fenceLoaded = false;
      fenceImage.src = fenceSrc;
      fenceImage.onload = () => {
        fenceLoaded = true;
      };

      // Helper function to generate variable distance between fences
      const getVariableFenceDistance = () => {
        return Math.random() * (800 - 500) + 500; // Random distance between 500-800 pixels
      };

      // Helper function to create a new fence
      const createFence = (x: number, tileW: number, tileH: number, y: number): Fence => {
        return {
          x,
          y,
          width: tileW,
          height: tileH,
          id: ++fenceIdCounter
        };
      };

      // Helper function to initialize fences
      const initializeFences = (width: number, tileW: number, tileH: number, y: number) => {
        if (fences.length === 0) {
          // Create initial fences with variable spacing
          let currentX = width + 600; // Start with initial distance within 500-800 range
          fences.push(createFence(currentX, tileW, tileH, y));
          
          // Add more fences to fill the screen with variable spacing
          for (let i = 0; i < 3; i++) {
            currentX += getVariableFenceDistance();
            fences.push(createFence(currentX, tileW, tileH, y));
          }
        }
      };

      const draw = () => {
        const width = canvas.width;
        const height = canvas.height;

        // compute integer band heights to avoid fractional gaps
        const skyH = Math.floor(height * 0.62);
  const soilH = Math.floor(height * 0.09);
  const grassY = skyH + soilH;
  const grassH = height - grassY;

  // sky
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, width, skyH);

      const sunRadius = 40;
      const sunX = width - 80;
      const sunY = 60;
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      const drawCloud = (x: number, y: number, scale: number) => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x, y, 30 * scale, 10 * scale);
        ctx.fillRect(x + 10 * scale, y - 10 * scale, 30 * scale, 10 * scale);
        ctx.fillRect(x + 20 * scale, y + 10 * scale, 20 * scale, 10 * scale);
      };

      // clouds move right-to-left by subtracting cloudOffset
      drawCloud(50 - cloudOffset * 0.3, 50, 1);
      drawCloud(200 - cloudOffset * 0.5, 80, 0.8);
      drawCloud(400 - cloudOffset * 0.4, 60, 1.2);
      drawCloud(-100 - cloudOffset * 0.6, 100, 0.9);

        // soil / track (draw immediately below sky)
        ctx.fillStyle = "#8B7355";
        ctx.fillRect(0, skyH, width, soilH);

        // grass (ground) - draw immediately below soil
        ctx.fillStyle = "#6B8E23";
        ctx.fillRect(0, grassY, width, grassH);

      const drawGrassBlade = (x: number, y: number) => {
        ctx.fillStyle = "#556B2F";
        ctx.fillRect(x, y, 4, 8);
        ctx.fillRect(x + 1, y - 4, 2, 4);
      };

      // grass blades scroll right-to-left (subtract offset). wrap properly
      for (let i = 0; i < 40; i++) {
        const space = width + 50;
        let x = (i * 25 - grassOffset) % space;
        if (x < 0) x += space;
        // place blades relative to grassY
        drawGrassBlade(x, grassY + 10);
        drawGrassBlade(x + 12, grassY + 20);
      }

      // draw multiple fences if loaded; otherwise skip until available
      if (fenceLoaded) {
        const tileW = Math.max(60, Math.min(140, Math.floor(width / 10)));
        const tileH = Math.floor(
          tileW *
            (fenceImage.naturalHeight / Math.max(1, fenceImage.naturalWidth))
        );
        // place fence so its bottom aligns slightly into the grass (ground)
        const y = Math.floor(grassY) - tileH + 2;

        // Initialize fences if needed
        initializeFences(width, tileW, tileH, y);

        // Collect all visible fences for collision detection
        const visibleFences: FenceRect[] = [];
        
        // Draw all visible fences
        fences.forEach((fence) => {
          const screenX = Math.round(fence.x);
          
          // Only draw if fence is visible on screen (with some buffer)
          if (screenX > -tileW && screenX < width + tileW) {
            ctx.drawImage(fenceImage, screenX, fence.y, fence.width, fence.height);
            
            // Add to visible fences list
            visibleFences.push({ 
              x: screenX, 
              y: fence.y, 
              width: fence.width, 
              height: fence.height 
            });
          }
        });
        
        // Emit all visible fences for collision detection
        if (typeof onFenceRect === 'function' && visibleFences.length > 0) {
          try {
            onFenceRect(visibleFences);
          } catch (e) {
            // swallow to avoid breaking render loop
          }
        }
      }

      // Only advance motion variables when not paused. When paused we still draw the current frame
      if (!pausedRef.current) {
        cloudOffset += 0.5;
        if (cloudOffset > width + 200) cloudOffset = 0;

        // Move grass based on animation speed (-1 left, 0 stop, 1 right)
        const baseScrollSpeed = 2; // base pixels per frame
        const scrollSpeed = baseScrollSpeed * animationSpeedRef.current;
        grassOffset += scrollSpeed;
        if (grassOffset > width + 50) grassOffset -= (width + 50);

        // Move all fences based on animation speed
        if (fenceLoaded) {
          const tileW = Math.max(60, Math.min(140, Math.floor(width / 10)));
          const tileH = Math.floor(
            tileW * (fenceImage.naturalHeight / Math.max(1, fenceImage.naturalWidth))
          );
          const y = Math.floor(grassY) - tileH + 2;

          // Move all fences based on speed direction
          fences.forEach(fence => {
            fence.x -= scrollSpeed; // negative moves left, positive moves right
          });

          // Handle fence cleanup and generation based on direction
          if (animationSpeedRef.current >= 0) {
            // Moving left or stopped - remove fences that moved off left side
            fences = fences.filter(fence => fence.x > -tileW);
            
            // Add new fences on the right when needed
            const rightmostFence = fences.reduce((rightmost, fence) => 
              fence.x > rightmost.x ? fence : rightmost, 
              fences[0] || { x: -Infinity }
            );

            if (fences.length < 5 || rightmostFence.x < width + 200) {
              const newFenceX = rightmostFence.x + getVariableFenceDistance();
              fences.push(createFence(newFenceX, tileW, tileH, y));
            }
          } else {
            // Moving right - remove fences that moved off right side
            fences = fences.filter(fence => fence.x < width + tileW);
            
            // Add new fences on the left when needed
            const leftmostFence = fences.reduce((leftmost, fence) => 
              fence.x < leftmost.x ? fence : leftmost, 
              fences[0] || { x: Infinity }
            );

            if (fences.length < 5 || leftmostFence.x > -200) {
              const newFenceX = leftmostFence.x - getVariableFenceDistance();
              fences.push(createFence(newFenceX, tileW, tileH, y));
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    }, 100); // 100ms delay to let LCP elements render first

    return () => {
      clearTimeout(initTimer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      className="absolute inset-0 w-full h-full pixelated"
      style={{ imageRendering: "pixelated" }}
    />
  );
};
