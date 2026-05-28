"use client";

import { useEffect, useRef } from "react";

const GRID = {
  color: "rgba(255,255,255,0.12)",
  lineWidth: 0.8,
  cellSize: 60,
  distortion: 0.4,
};

const CROSSES = {
  color: "rgba(255,255,255,0.4)",
  size: 8,
  spacing: 80,
};

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];

function fisheye(
  x: number,
  y: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  strength: number,
): [number, number] {
  const nx = (x - cx) / (w / 2);
  const ny = (y - cy) / (h / 2);
  const r = Math.sqrt(nx * nx + ny * ny);
  const factor = 1 + strength * r * r;
  return [cx + (nx / factor) * (w / 2), cy + (ny / factor) * (h / 2)];
}

function drawCross(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x + size / 2, y);
  ctx.moveTo(x, y - size / 2);
  ctx.lineTo(x, y + size / 2);
  ctx.stroke();
}

export function GridBackground({
  className = "",
  parallaxOffset = 0,
}: {
  className?: string;
  parallaxOffset?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const cx = w * 0.5;
      const cy = h * 0.45 + parallaxOffset * 0.1;

      ctx.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / GRID.cellSize) + 4;
      const rows = Math.ceil(h / GRID.cellSize) + 4;

      ctx.strokeStyle = GRID.color;
      ctx.lineWidth = GRID.lineWidth;

      for (let i = -2; i <= cols; i++) {
        const x0 = i * GRID.cellSize;
        ctx.beginPath();
        for (let j = 0; j <= rows; j++) {
          const y0 = j * GRID.cellSize;
          const [px, py] = fisheye(x0, y0, cx, cy, w, h, GRID.distortion);
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      for (let j = -2; j <= rows; j++) {
        const y0 = j * GRID.cellSize;
        ctx.beginPath();
        for (let i = 0; i <= cols; i++) {
          const x0 = i * GRID.cellSize;
          const [px, py] = fisheye(x0, y0, cx, cy, w, h, GRID.distortion);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      YEARS.forEach((year, idx) => {
        const y = 80 + idx * ((h - 160) / (YEARS.length - 1));
        ctx.fillText(String(year), 16, y);
      });

      const rulerY = h - 36;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, rulerY);
      ctx.lineTo(w - 40, rulerY);
      ctx.stroke();

      ctx.font = "9px JetBrains Mono, monospace";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      const ticks = [-4000, -2000, 0, 2000, 4000];
      ticks.forEach((tick, i) => {
        const x = 40 + (i / (ticks.length - 1)) * (w - 80);
        ctx.fillText(String(tick), x - 12, rulerY + 14);
      });

      for (let xi = 0; xi < Math.ceil(w / CROSSES.spacing); xi++) {
        for (let yi = 0; yi < Math.ceil(h / CROSSES.spacing); yi++) {
          if ((xi * 7 + yi * 3) % 5 !== 0) continue;
          const x = xi * CROSSES.spacing + (CROSSES.spacing / 2);
          const y = yi * CROSSES.spacing + (CROSSES.spacing / 2);
          drawCross(ctx, x, y, CROSSES.size, CROSSES.color);
        }
      }
    };

    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [parallaxOffset]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
