"use client";

import { useEffect, useRef, type RefObject } from "react";

const C = {
  paper: "#FFFDF8",
  ink: "#1C2B27",
  muted: "#5B6B65",
  line: "#E7DFCF",
  mata: "#0B7A5C",
  mar: "#17A2B8",
  sol: "#FFC23D",
  coral: "#F26B4F",
  azul: "#2A4BA8",
};

type Clip = { a: number; b: number; label?: string; color: string };

/* An editing-suite timeline drawn in canvas: ruler, title/footage clips and two audio
   waveforms. The playhead follows the real <video>; click or drag anywhere to scrub. */
export default function EditTimeline({
  videoRef,
  timecodeRef,
  tracks,
  clips,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  timecodeRef: RefObject<HTMLSpanElement | null>;
  tracks: string[];
  clips: string[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const labels = useRef({ tracks, clips });
  useEffect(() => {
    labels.current = { tracks, clips };
  }, [tracks, clips]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let hoverX: number | null = null;
    let dragging = false;
    const font = getComputedStyle(document.body).fontFamily;

    // Deterministic "audio": layered sines with a soft envelope.
    const wave = (u: number, seed: number) => {
      const v =
        Math.abs(Math.sin(u * 61 + seed) * 0.55 + Math.sin(u * 23 + seed * 2) * 0.3 + Math.sin(u * 151 + seed * 3) * 0.18);
      return Math.min(1, 0.18 + v * (0.65 + 0.35 * Math.sin(u * Math.PI)));
    };

    const layout = () => {
      const L = labels.current.clips;
      const rows: { kind: "clips" | "wave"; clips: Clip[]; color: string; seed?: number }[] = [
        { kind: "clips", color: C.sol, clips: [ { a: 0.01, b: 0.17, label: L[0], color: C.sol }, { a: 0.8, b: 0.99, label: L[4], color: C.sol } ] },
        {
          kind: "clips",
          color: C.mar,
          clips: [
            { a: 0, b: 0.27, label: L[1], color: C.mar },
            { a: 0.27, b: 0.52, label: L[2], color: C.mata },
            { a: 0.52, b: 0.79, label: L[3], color: C.mar },
            { a: 0.79, b: 1, color: C.mata },
          ],
        },
        { kind: "wave", color: C.mata, seed: 1.3, clips: [{ a: 0, b: 1, color: C.mata }] },
        { kind: "wave", color: C.coral, seed: 4.1, clips: [ { a: 0.06, b: 0.36, color: C.coral }, { a: 0.47, b: 0.74, color: C.coral } ] },
      ];
      return rows;
    };

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

    const gutter = () => (w < 520 ? 56 : 84);

    const draw = () => {
      const v = videoRef.current;
      const dur = v && isFinite(v.duration) && v.duration > 0 ? v.duration : 8;
      const time = v ? v.currentTime : 0;
      const g = gutter();
      const ruler = 26;
      const pad = 8;
      const trackW = w - g - pad;
      const rows = layout();
      const rowH = (h - ruler - pad) / rows.length;
      const X = (u: number) => g + u * trackW;
      const playX = X(Math.min(1, time / dur));

      ctx.clearRect(0, 0, w, h);

      // Ruler
      ctx.font = `700 10px ${font}`;
      ctx.textBaseline = "middle";
      const steps = Math.round(dur * 2);
      for (let s = 0; s <= steps; s++) {
        const x = X(s / steps);
        const major = s % 2 === 0;
        ctx.strokeStyle = major ? "rgba(28,43,39,.45)" : "rgba(28,43,39,.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 0.5, ruler - (major ? 10 : 6));
        ctx.lineTo(x + 0.5, ruler - 2);
        ctx.stroke();
        if (major && s < steps && w > 380) {
          ctx.fillStyle = C.muted;
          ctx.fillText(`00:0${Math.floor(s / 2)}`, x + 4, 9);
        }
      }

      rows.forEach((row, i) => {
        const y = ruler + i * rowH + 4;
        const rh = rowH - 8;
        // Track label chip
        ctx.fillStyle = i < 2 ? "rgba(11,122,92,.1)" : "rgba(242,107,79,.1)";
        ctx.beginPath();
        ctx.roundRect(6, y, g - 14, rh, 8);
        ctx.fill();
        ctx.fillStyle = C.ink;
        ctx.font = `800 ${w < 520 ? 9 : 10.5}px ${font}`;
        ctx.fillText(`${i < 2 ? "V" + (2 - i) : "A" + (i - 1)}`, 13, y + rh / 2 - (w < 520 ? 0 : 6));
        if (w >= 520) {
          ctx.font = `600 10px ${font}`;
          ctx.fillStyle = C.muted;
          ctx.fillText(labels.current.tracks[i] ?? "", 13, y + rh / 2 + 7);
        }

        // Lane
        ctx.fillStyle = "rgba(28,43,39,.035)";
        ctx.beginPath();
        ctx.roundRect(g, y, trackW, rh, 8);
        ctx.fill();

        for (const c of row.clips) {
          const x0 = X(c.a) + 1.5;
          const x1 = X(c.b) - 1.5;
          if (row.kind === "clips") {
            ctx.fillStyle = c.color;
            ctx.beginPath();
            ctx.roundRect(x0, y, x1 - x0, rh, 8);
            ctx.fill();
            // filmstrip ticks
            ctx.strokeStyle = "rgba(255,255,255,.28)";
            for (let fx = x0 + 18; fx < x1 - 8; fx += 18) {
              ctx.beginPath();
              ctx.moveTo(fx, y + 4);
              ctx.lineTo(fx, y + rh - 4);
              ctx.stroke();
            }
            if (c.label && x1 - x0 > 54) {
              ctx.fillStyle = c.color === C.sol ? C.ink : C.paper;
              ctx.font = `800 ${w < 520 ? 9.5 : 11}px ${font}`;
              ctx.save();
              ctx.beginPath();
              ctx.rect(x0, y, x1 - x0 - 6, rh);
              ctx.clip();
              ctx.fillText(c.label, x0 + 9, y + rh / 2);
              ctx.restore();
            }
          } else {
            ctx.fillStyle = c.color === C.coral ? "rgba(242,107,79,.12)" : "rgba(11,122,92,.1)";
            ctx.beginPath();
            ctx.roundRect(x0, y, x1 - x0, rh, 8);
            ctx.fill();
            for (let x = x0 + 3; x < x1 - 2; x += 3) {
              const a = wave((x - g) / trackW, row.seed ?? 1) * (rh / 2 - 3);
              ctx.fillStyle = x < playX ? c.color : c.color === C.coral ? "rgba(242,107,79,.42)" : "rgba(11,122,92,.36)";
              ctx.fillRect(x, y + rh / 2 - a, 1.8, a * 2);
            }
          }
        }
      });

      // Hover ghost
      if (hoverX !== null && hoverX > g && !dragging) {
        ctx.strokeStyle = "rgba(28,43,39,.25)";
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(hoverX + 0.5, ruler);
        ctx.lineTo(hoverX + 0.5, h - 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Playhead
      ctx.strokeStyle = C.coral;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playX, ruler - 4);
      ctx.lineTo(playX, h - 2);
      ctx.stroke();
      ctx.fillStyle = C.coral;
      ctx.beginPath();
      ctx.roundRect(playX - 7, 2, 14, ruler - 8, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(playX - 5, ruler - 6);
      ctx.lineTo(playX + 5, ruler - 6);
      ctx.lineTo(playX, ruler - 1);
      ctx.fill();

      // Timecode readout (HH:MM:SS:FF at 24 fps)
      const tc = timecodeRef.current;
      if (tc) {
        const f = Math.floor((time % 1) * 24);
        const s = Math.floor(time);
        tc.textContent = `00:00:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
      }
    };

    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const seek = (clientX: number) => {
      const v = videoRef.current;
      if (!v || !isFinite(v.duration)) return;
      const r = canvas.getBoundingClientRect();
      const g = gutter();
      const u = Math.max(0, Math.min(1, (clientX - r.left - g) / (r.width - g - 8)));
      v.currentTime = u * v.duration;
      draw();
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      seek(e.clientX);
    };
    const move = (e: PointerEvent) => {
      hoverX = e.clientX - canvas.getBoundingClientRect().left;
      if (dragging) seek(e.clientX);
    };
    const up = () => (dragging = false);
    const leave = () => (hoverX = null);

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", leave);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, [videoRef, timecodeRef]);

  return <canvas ref={ref} aria-hidden className="block h-[150px] w-full cursor-ew-resize touch-none sm:h-[172px]" />;
}
