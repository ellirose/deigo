"use client";

import { useEffect, useRef, type RefObject } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   Ambient — "ambilight" for the screening room. Every frame the playing film is
   sampled into a tiny canvas with temporal smoothing, so colour changes bloom
   instead of flickering. CSS upscales and blurs it: used once to fill the
   letterbox behind the picture and once to spill a glow onto the wall around it.
   ───────────────────────────────────────────────────────────────────────────── */

export default function Ambient({
  videoRef,
  className = "",
  w = 48,
  h = 30,
  smoothing = 0.2,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  className?: string;
  w?: number;
  h?: number;
  /** Share of the new frame mixed in per sample (lower = slower, softer colour drift). */
  smoothing?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#10221d";
    ctx.fillRect(0, 0, w, h);
    let raf = 0;
    let visible = false;
    let last = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const v = videoRef.current;
      // ~30 samples a second is plenty for a glow
      if (!visible || !v || v.readyState < 2 || !v.videoWidth || now - last < 33) return;
      last = now;
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      const s = Math.max(w / vw, h / vh);
      const sw = w / s;
      const sh = h / s;
      ctx.globalAlpha = smoothing;
      ctx.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h);
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [videoRef, w, h, smoothing]);

  return <canvas ref={ref} width={w} height={h} aria-hidden className={`pointer-events-none ${className}`} />;
}
