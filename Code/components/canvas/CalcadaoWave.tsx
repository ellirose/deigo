"use client";

import { useEffect, useRef } from "react";

/* The Copacabana promenade wave (calçadão), redrawn as a living band.
   Parallel sine stripes drift slowly; the pointer raises a soft swell beneath it.
   Above the first curve the canvas stays transparent so the section texture shows through. */
export default function CalcadaoWave({
  className = "",
  stripes = 4,
  light = "#FBF6EC",
  dark = "#0B7A5C",
}: {
  className?: string;
  stripes?: number;
  light?: string;
  dark?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let t = 0;
    const swell = { x: -1e4, power: 0, target: 0 };
    const n = stripes % 2 === 0 ? stripes : stripes + 1; // even count so the bottom ends on the dark tone

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const band = h / (n + 1.35);
      const amp = band * 0.62;
      const k = (Math.PI * 2) / Math.max(150, band * 8.5);
      const sigma2 = 2 * 150 * 150;
      for (let i = 0; i <= n; i++) {
        const base = band * 0.95 + i * band;
        ctx.beginPath();
        for (let x = 0; x <= w + 6; x += 6) {
          const bump = swell.power * Math.exp(-((x - swell.x) ** 2) / sigma2);
          const y = base + Math.sin(x * k + t) * amp * (1 + bump * 0.85) - bump * band * 0.35;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? dark : light;
        ctx.fill();
      }
    };

    const tick = () => {
      t += 0.0075;
      swell.power += (swell.target - swell.power) * 0.06;
      swell.target *= 0.985;
      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientY < r.top - 160 || e.clientY > r.bottom + 40) return;
      swell.x = e.clientX - r.left;
      swell.target = 1;
    };

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    resize();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [stripes, light, dark]);

  return <canvas ref={ref} aria-hidden className={`block w-full ${className}`} />;
}
