import { useEffect, useRef } from "react";
import fenceSrc from "../assets/objects/vfence.png";

type FenceRect = { x: number; y: number; width: number; height: number };

export const AnimatedBackground = ({ onFenceRect, paused }: { onFenceRect?: (rect: FenceRect | null) => void, paused?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef<boolean>(!!paused);

  // keep pausedRef in sync without restarting the main animation effect (we want variables to persist)
  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

  let animationFrame: number;
  let cloudOffset = 0;
  let grassOffset = 0;
  // single fence X position (world coordinate). Start off to the right
  let fenceX = Infinity;
  let nextFenceGap = 0; // gap to next fence when scheduling

    const fenceImage = new Image();
    let fenceLoaded = false;
    fenceImage.src = fenceSrc;
    fenceImage.onload = () => {
      fenceLoaded = true;
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

      // draw tiled fence image if loaded; otherwise skip until available
      if (fenceLoaded) {
        const tileW = Math.max(60, Math.min(140, Math.floor(width / 10)));
        const tileH = Math.floor(
          tileW *
            (fenceImage.naturalHeight / Math.max(1, fenceImage.naturalWidth))
        );
  // place fence so its bottom aligns slightly into the grass (ground)
  const y = Math.floor(grassY) - tileH + 2;

        // schedule first fence if needed
        if (!isFinite(fenceX)) {
          // already scheduled
        } else if (fenceX === Infinity) {
          // initialize: place a fence just off the right edge
          fenceX = width + (Math.floor(Math.random() * tileW) + tileW);
          nextFenceGap = Math.floor(tileW * 1.5) + Math.floor(Math.random() * Math.floor(tileW * 1.5));
        }

        // draw the single fence at fenceX world coordinate (convert to screen)
        const screenX = Math.round(fenceX);
        ctx.drawImage(fenceImage, screenX, y, tileW, tileH);

        // emit fence rect (screen coordinates) for consumers who want to react
        if (typeof onFenceRect === 'function') {
          try {
            onFenceRect({ x: screenX, y, width: tileW, height: tileH });
          } catch (e) {
            // swallow to avoid breaking render loop
          }
        }

        // note: movement handled below by decrementing fenceX
      }

      // Only advance motion variables when not paused. When paused we still draw the current frame
      if (!pausedRef.current) {
        cloudOffset += 0.5;
        if (cloudOffset > width + 200) cloudOffset = 0;

        // Move grass leftward
        const scrollSpeed = 2; // pixels per frame
        grassOffset += scrollSpeed;
        if (grassOffset > width + 50) grassOffset -= (width + 50);

        // Move single fence leftward at same speed; when it goes off left, schedule the next one
        if (fenceLoaded) {
          if (fenceX === Infinity) {
            // initialize if not set
            fenceX = width + nextFenceGap;
          } else {
            fenceX -= scrollSpeed;
            const tileW = Math.max(60, Math.min(140, Math.floor(width / 10)));
            if (fenceX < -tileW) {
              // schedule next fence to appear to the right after a random gap
              const minGap = Math.floor(tileW * 1.5);
              const maxGap = Math.floor(tileW * 3);
              const gap = minGap + Math.floor(Math.random() * (maxGap - minGap + 1));
              fenceX = width + gap;
            }
          }
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
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
