"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LOGO } from "./Brand";
import { useI18n } from "./i18n";

/* ─────────────────────────────────────────────────────────────────────────────
   Intro — broad, unseen brush strokes lay a deep-green base coat over raw plaster, then a
   brilliant, colour-shifting laser raster-carves Diego's portrait, the logo and
   Brazilian landmarks into the wall from left to right. The carving is a true
   relief (inner shadow + lit bevel), and every pass knocks paint chips, plaster
   crumbs, dust, sparks and smoke loose. Shown once per browser session.
   ───────────────────────────────────────────────────────────────────────────── */

export const INTRO_KEY = "ds-intro";

const T_WALL = 0.35;
const N_STROKES = 4;
const T_STROKE = 0.46;
const T_BRUSH_END = T_WALL + N_STROKES * T_STROKE;
const T_LASER0 = T_BRUSH_END + 0.25;
const T_LASER = 3.5;
const T_LASER_END = T_LASER0 + T_LASER;
const T_GLINT = 1.0;
const T_DONE = T_LASER_END + T_GLINT;
const SCAN_HZ = 6;
const WALL = "#e6e0d4";
const CHIPS = ["#0f6550", "#0c5a47", "#13735b", "#0a4d3c", "#0f6550", "#e4dac8", "#d3c6ae"];

type Band = { dir: 1 | -1; xs: number[]; top: number[]; bot: number[]; front: number[]; h: number; yc: (x: number) => number };
type Chip = { x: number; y: number; vx: number; vy: number; rot: number; spin: number; s: number; col: string; age: number; life: number; shape: number[] };
type Mote = { x: number; y: number; vx: number; vy: number; s: number; age: number; life: number; light: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number; hue: number };
type Puff = { x: number; y: number; vx: number; vy: number; r: number; age: number; life: number };

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const eio = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

function mk(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  return [c, c.getContext("2d")!];
}

function loadImg(src: string) {
  return new Promise<HTMLImageElement | null>((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });
}

export default function Intro() {
  const { t } = useI18n();
  const ref = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<"run" | "exit" | "done">("run");

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}
    document.documentElement.classList.add("intro-seen");
    setStage((s) => (s === "run" ? "exit" : s));
  }, []);

  useEffect(() => {
    if (stage !== "exit") return;
    const id = setTimeout(() => setStage("done"), 900);
    return () => clearTimeout(id);
  }, [stage]);

  useEffect(() => {
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(INTRO_KEY);
    } catch {}
    if (seen) {
      document.documentElement.classList.add("intro-seen");
      setStage("done");
      return;
    }
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const fDisplay = css.getPropertyValue("--font-bricolage").trim() || "system-ui, sans-serif";
    const fSans = css.getPropertyValue("--font-manrope").trim() || "system-ui, sans-serif";

    let W = 0;
    let H = 0;
    let dpr = 1;
    let cw = 0;
    let ch = 0;
    let wallC: HTMLCanvasElement;
    let paintFull: HTMLCanvasElement;
    let paintBaked: HTMLCanvasElement;
    let pbg: CanvasRenderingContext2D;
    let artC: HTMLCanvasElement;
    let carved: HTMLCanvasElement;
    let maskC: HTMLCanvasElement;
    let mg: CanvasRenderingContext2D;
    let hotC: HTMLCanvasElement;
    let hg: CanvasRenderingContext2D;
    let tmpC: HTMLCanvasElement;
    let tg: CanvasRenderingContext2D;
    let alpha4: Uint8ClampedArray | null = null;
    let a4w = 0;
    let a4h = 0;
    let bands: Band[] = [];
    let baked = 0;
    const laser = { x0: 0, x1: 0, y0: 0, y1: 0, lw: 30 };
    let tauPrev = 0;
    let built = false;
    let photo: HTMLImageElement | null = null;
    let plaster: HTMLImageElement | null = null;
    let glow: HTMLCanvasElement | null = null;
    let smoke: HTMLCanvasElement | null = null;

    const chips: Chip[] = [];
    const motes: Mote[] = [];
    const sparks: Spark[] = [];
    const puffs: Puff[] = [];

    /* ---------- static layers ---------- */

    function lightFalloff(g: CanvasRenderingContext2D, strength = 1) {
      const rg = g.createRadialGradient(W * 0.28, H * 0.18, 0, W * 0.28, H * 0.18, Math.hypot(W, H) * 0.95);
      rg.addColorStop(0, `rgba(255,248,230,${0.22 * strength})`);
      rg.addColorStop(0.55, "rgba(255,248,230,0)");
      rg.addColorStop(1, `rgba(30,22,12,${0.3 * strength})`);
      g.fillStyle = rg;
      g.fillRect(0, 0, W, H);
    }

    function plasterFill(g: CanvasRenderingContext2D, alpha: number, op: GlobalCompositeOperation = "source-over") {
      if (!plaster) return;
      const pat = g.createPattern(plaster, "repeat");
      if (!pat) return;
      pat.setTransform(new DOMMatrix().scale(0.8));
      g.save();
      g.globalAlpha = alpha;
      g.globalCompositeOperation = op;
      g.fillStyle = pat;
      g.fillRect(0, 0, W, H);
      g.restore();
    }

    function buildWall() {
      const [c, g] = mk(cw, ch);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = WALL;
      g.fillRect(0, 0, W, H);
      plasterFill(g, 0.6);
      lightFalloff(g);
      return c;
    }

    function buildPaint() {
      const [c, g] = mk(cw, ch);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const lg = g.createLinearGradient(0, 0, 0, H);
      lg.addColorStop(0, "#106752");
      lg.addColorStop(1, "#0a4d3c");
      g.fillStyle = lg;
      g.fillRect(0, 0, W, H);
      // bristle streaks dragged along each pass
      const n = Math.round((W * H) / 520);
      for (let i = 0; i < n; i++) {
        const y = Math.random() * H;
        const x = rnd(-0.05, 1.05) * W;
        const len = rnd(90, 640);
        const light = Math.random() < 0.45;
        g.strokeStyle = light ? `rgba(150,232,200,${rnd(0.02, 0.07).toFixed(3)})` : `rgba(0,22,15,${rnd(0.04, 0.13).toFixed(3)})`;
        g.lineWidth = rnd(0.5, 2.1);
        g.beginPath();
        g.moveTo(x, y);
        g.bezierCurveTo(x + len * 0.33, y + rnd(-2, 2), x + len * 0.66, y + rnd(-2, 2), x + len, y + rnd(-3, 3));
        g.stroke();
      }
      plasterFill(g, 0.32, "multiply");
      lightFalloff(g, 0.8);
      return c;
    }

    function buildBands() {
      const out: Band[] = [];
      const bh = H / (N_STROKES - 0.8);
      for (let i = 0; i < N_STROKES; i++) {
        const dir = (i % 2 ? -1 : 1) as 1 | -1;
        const y0 = (H * (i + 0.5)) / N_STROKES;
        const amp = bh * 0.06;
        const ph = rnd(0, 6.28);
        const yc = (x: number) => y0 + Math.sin((x / W) * Math.PI * 1.3 + ph) * amp;
        const p = [rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28)];
        const xs: number[] = [];
        const top: number[] = [];
        const bot: number[] = [];
        for (let x = -80; x <= W + 80; x += 14) {
          const nT = Math.sin(x * 0.012 + p[0]) * 0.5 + Math.sin(x * 0.029 + p[1]) * 0.3 + Math.sin(x * 0.083 + p[2]) * 0.2;
          const nB = Math.sin(x * 0.011 + p[3]) * 0.5 + Math.sin(x * 0.033 + p[4]) * 0.3 + Math.sin(x * 0.077 + p[5]) * 0.2;
          xs.push(x);
          top.push(yc(x) - bh / 2 + nT * bh * 0.05 + rnd(-2.5, 2.5) - (i === 0 ? bh * 0.4 : 0));
          bot.push(yc(x) + bh / 2 + nB * bh * 0.05 + rnd(-2.5, 2.5) + (i === N_STROKES - 1 ? bh * 0.4 : 0));
        }
        const front = Array.from({ length: 34 }, () => Math.pow(Math.random(), 1.6));
        out.push({ dir, xs, top, bot, front, h: bh, yc });
      }
      return out;
    }

    /** Traces a brush band; with fx it stops at the ragged, bristle-tipped leading edge. */
    function bandPath(g: CanvasRenderingContext2D, b: Band, fx: number | null) {
      const idx: number[] = [];
      for (let k = 0; k < b.xs.length; k++) if (fx === null || (b.dir > 0 ? b.xs[k] <= fx : b.xs[k] >= fx)) idx.push(k);
      if (idx.length < 2) return false;
      const ord = b.dir > 0 ? idx : idx.slice().reverse();
      g.beginPath();
      g.moveTo(b.xs[ord[0]], b.top[ord[0]]);
      for (const k of ord) g.lineTo(b.xs[k], b.top[k]);
      if (fx !== null) {
        const yc = b.yc(fx);
        const m = b.front.length;
        for (let j = 0; j < m; j++) g.lineTo(fx - b.dir * b.front[j] * b.h * 0.16, yc - b.h / 2 + (j / (m - 1)) * b.h);
      }
      for (let i = ord.length - 1; i >= 0; i--) g.lineTo(b.xs[ord[i]], b.bot[ord[i]]);
      g.closePath();
      return true;
    }

    /* ---------- the carving (art + relief) ---------- */

    function archPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, close = true) {
      g.beginPath();
      g.moveTo(x, y + h);
      g.lineTo(x, y + w / 2);
      g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
      g.lineTo(x + w, y + h);
      if (close) g.closePath();
    }

    function star(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.44 : r;
        g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      g.closePath();
      g.fill();
    }

    function drawLogo(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
      const k = s / 48;
      g.save();
      g.translate(x, y);
      g.scale(k, k);
      const tile = new Path2D(LOGO.tile);
      const tg2 = g.createLinearGradient(0, 0, 48, 48);
      tg2.addColorStop(0, "#17a07a");
      tg2.addColorStop(1, "#0b6e53");
      g.fillStyle = tg2;
      g.fill(tile);
      // the D sits proud of the tile
      g.save();
      g.shadowColor = "rgba(0,30,20,.5)";
      g.shadowBlur = 2.2 * k * dpr;
      g.shadowOffsetX = 0.9 * k * dpr;
      g.shadowOffsetY = 1.3 * k * dpr;
      const dg = g.createLinearGradient(12, 11, 36, 37);
      dg.addColorStop(0, "#ffdc6e");
      dg.addColorStop(1, "#f0a313");
      g.fillStyle = dg;
      g.fill(new Path2D(LOGO.d));
      g.restore();
      const { cx, cy, r } = LOGO.counter;
      const cg = g.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, r);
      cg.addColorStop(0, "#3b62c8");
      cg.addColorStop(1, "#203d8f");
      g.fillStyle = cg;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#fff";
      g.lineWidth = 1.5;
      g.lineCap = "round";
      g.stroke(new Path2D(LOGO.band));
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(LOGO.star.cx, LOGO.star.cy, LOGO.star.r, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    function drawPortrait(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
      // a carved frame line around the arch, separated from it by a ridge of wall
      const gap = w * 0.06;
      g.save();
      g.strokeStyle = "#efe4cf";
      g.lineWidth = Math.max(3, w * 0.022);
      archPath(g, x - gap, y - gap, w + gap * 2, h + gap * 0.4, false);
      g.stroke();
      g.restore();
      g.save();
      g.globalCompositeOperation = "destination-out";
      archPath(g, x - gap * 0.45, y - gap * 0.45, w + gap * 0.9, h + gap * 0.45);
      g.fill();
      g.restore();
      g.save();
      archPath(g, x, y, w, h);
      g.clip();
      if (photo) {
        const iw = photo.naturalWidth;
        const ih = photo.naturalHeight;
        const sc = Math.max(w / iw, h / ih) * 1.08;
        const sw = w / sc;
        const sh = h / sc;
        g.drawImage(photo, Math.max(0, Math.min(iw - sw, iw * 0.52 - sw / 2)), Math.max(0, Math.min(ih - sh, ih * 0.36 - sh / 2.4)), sw, sh, x, y, w, h);
      } else {
        g.fillStyle = "#1fb5a6";
        g.fillRect(x, y, w, h);
      }
      const vg = g.createLinearGradient(0, y, 0, y + h);
      vg.addColorStop(0.6, "rgba(10,40,30,0)");
      vg.addColorStop(1, "rgba(10,40,30,.35)");
      g.fillStyle = vg;
      g.fillRect(x, y, w, h);
      g.restore();
    }

    function drawSun(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
      const sg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      sg.addColorStop(0, "#ffe08a");
      sg.addColorStop(1, "#f4a614");
      g.fillStyle = sg;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }

    function drawWaves(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
      g.save();
      g.beginPath();
      g.roundRect(x, y, w, h, h * 0.22);
      g.clip();
      g.fillStyle = "#f3e9d6";
      g.fillRect(x, y, w, h);
      g.strokeStyle = "#0c5a47";
      g.lineWidth = h * 0.16;
      const wl = h * 1.25;
      for (const row of [0.3, 0.72]) {
        g.beginPath();
        for (let xx = x - wl; xx <= x + w + wl; xx += 3) {
          const yy = y + h * row + Math.sin(((xx - x) / wl) * Math.PI * 2) * h * 0.16;
          if (xx === x - wl) g.moveTo(xx, yy);
          else g.lineTo(xx, yy);
        }
        g.stroke();
      }
      g.restore();
    }

    function drawSkyline(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
      const base = y + h * 0.78;
      // Corcovado with the Redeemer
      const cg = g.createLinearGradient(0, y + h * 0.25, 0, base);
      cg.addColorStop(0, "#54c495");
      cg.addColorStop(1, "#1f8a64");
      g.fillStyle = cg;
      g.beginPath();
      g.moveTo(x, base);
      g.bezierCurveTo(x + w * 0.08, y + h * 0.62, x + w * 0.14, y + h * 0.36, x + w * 0.2, y + h * 0.33);
      g.bezierCurveTo(x + w * 0.26, y + h * 0.36, x + w * 0.36, y + h * 0.6, x + w * 0.46, base);
      g.closePath();
      g.fill();
      const sx = x + w * 0.2;
      const sy = y + h * 0.33;
      const sh = h * 0.27;
      g.fillStyle = "#fff8ea";
      g.fillRect(sx - sh * 0.045, sy - sh, sh * 0.09, sh);
      g.beginPath();
      g.roundRect(sx - sh * 0.42, sy - sh * 0.78, sh * 0.84, sh * 0.075, sh * 0.03);
      g.fill();
      g.beginPath();
      g.arc(sx, sy - sh * 1.04, sh * 0.065, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(sx - sh * 0.09, sy - sh * 0.7);
      g.lineTo(sx + sh * 0.09, sy - sh * 0.7);
      g.lineTo(sx + sh * 0.13, sy - sh * 0.05);
      g.lineTo(sx - sh * 0.13, sy - sh * 0.05);
      g.closePath();
      g.fill();
      // palm
      const px = x + w * 0.5;
      g.strokeStyle = "#c98d4b";
      g.lineWidth = Math.max(2.5, w * 0.011);
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(px, base);
      g.quadraticCurveTo(px + w * 0.02, y + h * 0.55, px - w * 0.012, y + h * 0.3);
      g.stroke();
      g.fillStyle = "#8fd36c";
      const cx = px - w * 0.012;
      const cy = y + h * 0.3;
      for (const a of [-2.7, -2.2, -1.6, -1.0, -0.45, 0.1]) {
        const L = h * rnd(0.2, 0.26);
        const ex = cx + Math.cos(a) * L;
        const ey = cy + Math.sin(a) * L * 0.75 + L * 0.35;
        const nx = -Math.sin(a) * L * 0.18;
        const ny = Math.cos(a) * L * 0.18;
        g.beginPath();
        g.moveTo(cx, cy);
        g.quadraticCurveTo((cx + ex) / 2 + nx, (cy + ey) / 2 - Math.abs(ny) - L * 0.1, ex, ey);
        g.quadraticCurveTo((cx + ex) / 2 - nx * 0.2, (cy + ey) / 2 + L * 0.04, cx, cy);
        g.fill();
      }
      // Morro da Urca and Sugarloaf, with the cable car
      const sgr = g.createLinearGradient(0, y + h * 0.15, 0, base);
      sgr.addColorStop(0, "#6fd3a6");
      sgr.addColorStop(1, "#2a9a72");
      g.fillStyle = sgr;
      g.beginPath();
      g.moveTo(x + w * 0.55, base);
      g.bezierCurveTo(x + w * 0.57, y + h * 0.58, x + w * 0.63, y + h * 0.52, x + w * 0.67, y + h * 0.55);
      g.bezierCurveTo(x + w * 0.7, y + h * 0.58, x + w * 0.72, y + h * 0.7, x + w * 0.73, base);
      g.closePath();
      g.fill();
      g.beginPath();
      g.moveTo(x + w * 0.7, base);
      g.bezierCurveTo(x + w * 0.73, y + h * 0.45, x + w * 0.79, y + h * 0.13, x + w * 0.86, y + h * 0.13);
      g.bezierCurveTo(x + w * 0.93, y + h * 0.13, x + w * 0.97, y + h * 0.45, x + w, base);
      g.closePath();
      g.fill();
      g.strokeStyle = "#fff8ea";
      g.lineWidth = Math.max(1.2, w * 0.004);
      g.beginPath();
      g.moveTo(x + w * 0.66, y + h * 0.55);
      g.quadraticCurveTo(x + w * 0.76, y + h * 0.4, x + w * 0.85, y + h * 0.14);
      g.stroke();
      g.fillStyle = "#ffc23d";
      g.fillRect(x + w * 0.755 - w * 0.012, y + h * 0.36, w * 0.024, h * 0.05);
      // the sea
      const sea = g.createLinearGradient(0, base, 0, y + h);
      sea.addColorStop(0, "#2bb6cc");
      sea.addColorStop(1, "#167f99");
      g.fillStyle = sea;
      g.beginPath();
      g.roundRect(x, base - 1, w, y + h - base + 1, [0, 0, h * 0.06, h * 0.06]);
      g.fill();
      g.strokeStyle = "rgba(255,255,255,.85)";
      g.lineWidth = Math.max(1.2, h * 0.018);
      for (const row of [0.38, 0.72]) {
        g.beginPath();
        for (let xx = x + w * 0.04; xx <= x + w * 0.96; xx += 3) {
          const yy = base + (y + h - base) * row + Math.sin(xx * 0.06 + row * 4) * h * 0.012;
          if (xx === x + w * 0.04) g.moveTo(xx, yy);
          else g.lineTo(xx, yy);
        }
        g.stroke();
      }
    }

    function drawCross(g: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
      g.fillStyle = "#ffcf4f";
      const pts: [number, number, number][] = [
        [0, -1, 1],
        [0, 1.15, 1.1],
        [-0.78, 0.04, 0.82],
        [0.72, -0.22, 0.74],
        [0.36, 0.5, 0.48],
      ];
      for (const [dx, dy, r] of pts) star(g, cx + dx * s, cy + dy * s, s * 0.32 * r);
    }

    function fitFont(g: CanvasRenderingContext2D, lines: string[], maxW: number, maxFs: number) {
      g.font = `800 100px ${fDisplay}`;
      const wmax = Math.max(...lines.map((l) => g.measureText(l).width));
      return Math.min(maxFs, (100 * maxW) / wmax);
    }

    function drawName(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tagline: string) {
      const fs = fitFont(g, ["Diego", "Silveira"], w, h / 2.35);
      const grad = g.createLinearGradient(0, y, 0, y + fs * 2);
      grad.addColorStop(0, "#fff8ea");
      grad.addColorStop(1, "#ead9b8");
      g.fillStyle = grad;
      g.font = `800 ${fs}px ${fDisplay}`;
      g.textBaseline = "alphabetic";
      (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(-0.025 * fs).toFixed(1)}px`;
      g.fillText("Diego", x, y + fs * 0.88);
      g.fillStyle = "#ffcf4f";
      g.fillText("Silveira", x, y + fs * 1.78);
      const ts = Math.max(9, fs * 0.15);
      g.font = `800 ${ts}px ${fSans}`;
      (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(ts * 0.28).toFixed(1)}px`;
      g.fillStyle = "#f3e9d6";
      g.fillText(tagline, x + fs * 0.04, y + fs * 1.78 + ts * 2.3);
      (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
    }

    function buildArt() {
      const [c, g] = mk(cw, ch);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const tagline = "CREATIVE DEVELOPER · BRASIL";
      let box: { x: number; y: number; w: number; h: number };
      if (W / H >= 1.05) {
        const bw = Math.min(W * 0.86, 1360);
        const bh = Math.min(H * 0.6, bw * 0.44);
        const bx = (W - bw) / 2;
        const by = (H - bh) / 2;
        const ls = bh * 0.52;
        drawLogo(g, bx, by + bh * 0.06, ls);
        drawCross(g, bx + ls * 0.5, by + bh * 0.06 + ls + bh * 0.22, bh * 0.09);
        const aw = bh * 0.58;
        const ah = bh * 0.8;
        const ax = bx + bw * 0.27;
        drawSun(g, ax + aw * 0.5, by + aw * 0.14, aw * 0.56);
        drawPortrait(g, ax, by + bh * 0.02, aw, ah);
        drawWaves(g, ax - aw * 0.16, by + bh * 0.02 + ah + bh * 0.06, aw * 1.32, bh * 0.1);
        const tx = bx + bw * 0.57;
        drawName(g, tx, by + bh * 0.02, bw * 0.43, bh * 0.58, tagline);
        drawSkyline(g, tx, by + bh * 0.64, bw * 0.43, bh * 0.36);
        box = { x: bx, y: by, w: bw, h: bh };
      } else {
        const bw = Math.min(W * 0.86, (H * 0.82) / 1.84);
        const bh = bw * 1.84;
        const bx = (W - bw) / 2;
        const by = (H - bh) / 2;
        const ls = bw * 0.26;
        drawLogo(g, bx, by, ls);
        drawName(g, bx + ls + bw * 0.06, by - ls * 0.02, bw - ls - bw * 0.06, ls * 1.05, "CREATIVE DEV · BRASIL");
        const aw = bw * 0.56;
        const ah = aw * 1.3;
        const ax = bx + (bw - aw) / 2 - bw * 0.07;
        const ay = by + ls + bw * 0.34;
        drawSun(g, ax + aw * 0.5, ay + aw * 0.14, aw * 0.5);
        drawPortrait(g, ax, ay, aw, ah);
        drawCross(g, ax + aw + bw * 0.16, ay + ah * 0.66, bw * 0.055);
        drawWaves(g, ax - aw * 0.14, ay + ah + bw * 0.05, aw * 1.28, bw * 0.07);
        drawSkyline(g, bx, ay + ah + bw * 0.2, bw, bw * 0.32);
        box = { x: bx, y: by, w: bw, h: bh };
      }
      artC = c;

      // relief: plaster grain on every cavity floor, then shadowed and lit cut walls
      const [car, cg] = mk(cw, ch);
      cg.drawImage(c, 0, 0);
      if (plaster) {
        const [grain, gg] = mk(cw, ch);
        gg.setTransform(dpr, 0, 0, dpr, 0, 0);
        plasterFill(gg, 1);
        gg.setTransform(1, 0, 0, 1, 0, 0);
        gg.globalCompositeOperation = "destination-in";
        gg.drawImage(c, 0, 0);
        cg.save();
        cg.globalAlpha = 0.3;
        cg.globalCompositeOperation = "multiply";
        cg.drawImage(grain, 0, 0);
        cg.restore();
      }
      const [inv, ig] = mk(cw, ch);
      ig.fillStyle = "#000";
      ig.fillRect(0, 0, cw, ch);
      ig.globalCompositeOperation = "destination-out";
      ig.drawImage(c, 0, 0);
      const inner = (color: string, blur: number, dx: number, dy: number) => {
        cg.save();
        cg.globalCompositeOperation = "source-atop";
        cg.shadowColor = color;
        cg.shadowBlur = blur * dpr;
        cg.shadowOffsetX = cw + dx * dpr;
        cg.shadowOffsetY = dy * dpr;
        cg.drawImage(inv, -cw, 0);
        cg.restore();
      };
      const depth = Math.max(0.7, Math.min(1.4, W / 1300));
      inner("rgba(0,24,17,.78)", 8 * depth, 6 * depth, 8 * depth);
      inner("rgba(0,24,17,.55)", 1.5, 1.6 * depth, 2.2 * depth);
      inner("rgba(255,250,232,.75)", 2, -1.8 * depth, -2.2 * depth);
      carved = car;

      // coarse alpha map: the beam only fires (and throws debris) where there is something to carve
      a4w = Math.ceil(W / 4);
      a4h = Math.ceil(H / 4);
      const [sm, sg] = mk(a4w, a4h);
      sg.drawImage(c, 0, 0, a4w, a4h);
      alpha4 = sg.getImageData(0, 0, a4w, a4h).data;

      let minX = a4w;
      let maxX = 0;
      let minY = a4h;
      let maxY = 0;
      for (let y = 0; y < a4h; y++) {
        for (let x = 0; x < a4w; x++) {
          if (alpha4[(y * a4w + x) * 4 + 3] > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < minX) {
        minX = box.x / 4;
        maxX = (box.x + box.w) / 4;
        minY = box.y / 4;
        maxY = (box.y + box.h) / 4;
      }
      const pad = Math.max(14, W * 0.01);
      laser.x0 = minX * 4 - pad;
      laser.x1 = maxX * 4 + 4 + pad;
      laser.y0 = minY * 4 - pad;
      laser.y1 = maxY * 4 + 4 + pad;
      const adv = (laser.x1 - laser.x0) / T_LASER / (2 * SCAN_HZ);
      laser.lw = Math.max(18, adv * 2.6);
      void sm;
    }

    function onArt(x: number, y: number) {
      if (!alpha4) return false;
      const ix = Math.floor(x / 4);
      const iy = Math.floor(y / 4);
      if (ix < 0 || iy < 0 || ix >= a4w || iy >= a4h) return false;
      return alpha4[(iy * a4w + ix) * 4 + 3] > 30;
    }

    function hitAt(tau: number): [number, number] {
      const u = clamp01(tau / T_LASER);
      const ph = (tau * SCAN_HZ) % 1;
      const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
      return [lerp(laser.x0, laser.x1, u), lerp(laser.y0, laser.y1, tri)];
    }

    function sprites() {
      if (!glow) {
        const [c, g] = mk(128, 128);
        const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        rg.addColorStop(0, "rgba(255,255,255,1)");
        rg.addColorStop(0.2, "rgba(255,255,255,.6)");
        rg.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = rg;
        g.fillRect(0, 0, 128, 128);
        glow = c;
      }
      if (!smoke) {
        const [c, g] = mk(96, 96);
        const rg = g.createRadialGradient(48, 48, 0, 48, 48, 48);
        rg.addColorStop(0, "rgba(236,230,218,.9)");
        rg.addColorStop(1, "rgba(236,230,218,0)");
        g.fillStyle = rg;
        g.fillRect(0, 0, 96, 96);
        smoke = c;
      }
    }

    /* ---------- layout / resize ---------- */

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      cw = Math.round(W * dpr);
      ch = Math.round(H * dpr);
      canvas!.width = cw;
      canvas!.height = ch;
      wallC = buildWall();
      paintFull = buildPaint();
      [paintBaked, pbg] = mk(cw, ch);
      pbg.setTransform(dpr, 0, 0, dpr, 0, 0);
      baked = 0;
      bands = buildBands();
      buildArt();
      [maskC, mg] = mk(cw, ch);
      mg.setTransform(dpr, 0, 0, dpr, 0, 0);
      [hotC, hg] = mk(cw, ch);
      hg.setTransform(dpr, 0, 0, dpr, 0, 0);
      [tmpC, tg] = mk(cw, ch);
      sprites();
      // replay the carving so far (deterministic in time), without debris
      if (tauPrev > 0) stamp(0, tauPrev, false);
      chips.length = motes.length = sparks.length = puffs.length = 0;
      built = true;
    }

    function bake(i: number) {
      pbg.save();
      if (bandPath(pbg, bands[i], null)) {
        pbg.clip();
        pbg.drawImage(paintFull, 0, 0, W, H);
      }
      pbg.restore();
    }

    /* ---------- carving ---------- */

    function stamp(from: number, to: number, debris: boolean) {
      const step = 1 / 420;
      let [px, py] = hitAt(from);
      mg.lineCap = hg.lineCap = "round";
      mg.lineJoin = hg.lineJoin = "round";
      mg.lineWidth = hg.lineWidth = laser.lw;
      mg.strokeStyle = hg.strokeStyle = "#fff";
      mg.beginPath();
      hg.beginPath();
      mg.moveTo(px, py);
      hg.moveTo(px, py);
      for (let tau = from + step; tau <= to + 1e-9; tau += step) {
        const [x, y] = hitAt(tau);
        mg.lineTo(x, y);
        hg.lineTo(x, y);
        if (debris && onArt(x, y)) spawn(x, y, (x - px) / step, tau);
        px = x;
        py = y;
      }
      mg.stroke();
      hg.stroke();
    }

    function spawn(x: number, y: number, vxBeam: number, tau: number) {
      const hue = beamHue(tau);
      if (sparks.length < 520) {
        for (let i = 0; i < 2; i++) {
          const a = rnd(-Math.PI, 0) + rnd(-0.4, 0.4);
          const sp = rnd(260, 900);
          sparks.push({ x, y, vx: Math.cos(a) * sp + vxBeam * 0.02, vy: Math.sin(a) * sp, age: 0, life: rnd(0.18, 0.5), hue: hue + rnd(-50, 50) });
        }
      }
      if (chips.length < 460 && Math.random() < 0.42) {
        const s = Math.random() < 0.12 ? rnd(6, 11) : rnd(2, 6);
        const n = 4 + Math.floor(Math.random() * 2);
        const shape: number[] = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rnd(-0.3, 0.3);
          const r = rnd(0.55, 1);
          shape.push(Math.cos(a) * r, Math.sin(a) * r);
        }
        chips.push({ x: x + rnd(-5, 5), y: y + rnd(-5, 5), vx: rnd(-170, 170), vy: rnd(-300, -30), rot: rnd(0, 6.28), spin: rnd(-14, 14), s, col: pick(CHIPS), age: 0, life: rnd(1.4, 2.4), shape });
      }
      if (motes.length < 900 && Math.random() < 0.9) {
        motes.push({ x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: rnd(-70, 70), vy: rnd(-90, 20), s: rnd(0.8, 2.6), age: 0, life: rnd(1.2, 2.6), light: Math.random() < 0.7 });
      }
      if (puffs.length < 90 && Math.random() < 0.05) {
        puffs.push({ x, y, vx: rnd(-20, 20), vy: rnd(-60, -25), r: rnd(14, 26), age: 0, life: rnd(1.1, 1.9) });
      }
    }

    const beamHue = (tau: number) => (140 + tau * 105) % 360;

    function drawParticles(dt: number) {
      const c = ctx!;
      // smoke
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.age += dt;
        if (p.age >= p.life) {
          puffs.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const lt = p.age / p.life;
        const r = p.r * (1 + lt * 2.4);
        c.globalAlpha = 0.16 * Math.sin(Math.PI * lt);
        c.drawImage(smoke!, p.x - r, p.y - r, r * 2, r * 2);
      }
      // chips of paint and plaster, tumbling with a hint of thickness
      for (let i = chips.length - 1; i >= 0; i--) {
        const p = chips[i];
        p.age += dt;
        p.vy += 1500 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        if (p.age >= p.life || p.y > H + 40) {
          chips.splice(i, 1);
          continue;
        }
        c.globalAlpha = Math.min(1, (p.life - p.age) * 3);
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        const sq = 0.35 + 0.65 * Math.abs(Math.cos(p.rot * 0.7 + p.spin));
        c.scale(p.s, p.s * sq);
        c.beginPath();
        for (let k = 0; k < p.shape.length; k += 2) c.lineTo(p.shape[k] + 0.18, p.shape[k + 1] + 0.28);
        c.closePath();
        c.fillStyle = "rgba(0,20,14,.55)";
        c.fill();
        c.beginPath();
        for (let k = 0; k < p.shape.length; k += 2) c.lineTo(p.shape[k], p.shape[k + 1]);
        c.closePath();
        c.fillStyle = p.col;
        c.fill();
        c.restore();
      }
      // fine dust drifting down
      for (let i = motes.length - 1; i >= 0; i--) {
        const p = motes[i];
        p.age += dt;
        if (p.age >= p.life) {
          motes.splice(i, 1);
          continue;
        }
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 240 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const lt = p.age / p.life;
        c.globalAlpha = 0.75 * (1 - lt);
        c.fillStyle = p.light ? "#efe6d4" : "#3d8f74";
        c.fillRect(p.x, p.y, p.s, p.s);
      }
      // sparks
      c.globalCompositeOperation = "lighter";
      c.lineCap = "round";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.age += dt;
        if (p.age >= p.life) {
          sparks.splice(i, 1);
          continue;
        }
        p.vy += 900 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const lt = p.age / p.life;
        c.globalAlpha = 1 - lt;
        c.strokeStyle = `hsl(${p.hue | 0},100%,${(72 - lt * 20) | 0}%)`;
        c.lineWidth = 1.7 * (1 - lt * 0.5);
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - p.vx * 0.022, p.y - p.vy * 0.022);
        c.stroke();
      }
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
    }

    function drawBeam(tau: number, tauFrom: number) {
      const c = ctx!;
      const [hx, hy] = hitAt(tau);
      const live = onArt(hx, hy);
      const hue = beamHue(tau);
      const sx = hx * 0.55 + W * 0.22;
      const sy = -40;
      c.save();
      c.globalCompositeOperation = "lighter";
      // afterimage of the raster sweep since the last frame
      const n = 6;
      for (let i = 1; i <= n; i++) {
        const [tx, ty] = hitAt(lerp(tauFrom, tau, i / n));
        c.globalAlpha = 0.06 * (i / n);
        c.strokeStyle = `hsl(${hue},100%,62%)`;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(tx, ty);
        c.stroke();
      }
      const grad = c.createLinearGradient(sx, sy, hx, hy);
      grad.addColorStop(0, `hsla(${hue + 120},100%,60%,0)`);
      grad.addColorStop(0.45, `hsla(${hue + 60},100%,62%,1)`);
      grad.addColorStop(1, `hsla(${hue},100%,64%,1)`);
      c.strokeStyle = grad;
      c.globalAlpha = live ? 0.16 : 0.06;
      c.lineWidth = 16;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(hx, hy);
      c.stroke();
      c.globalAlpha = live ? 0.7 : 0.25;
      c.lineWidth = 4.5;
      c.stroke();
      c.globalAlpha = live ? 1 : 0.4;
      c.strokeStyle = "#fff";
      c.lineWidth = 1.4;
      c.stroke();
      // the burn point
      const gs = live ? rnd(70, 96) : 36;
      const halo = c.createRadialGradient(hx, hy, 0, hx, hy, gs * 0.9);
      halo.addColorStop(0, `hsla(${hue},100%,62%,${live ? 0.75 : 0.25})`);
      halo.addColorStop(1, `hsla(${hue},100%,62%,0)`);
      c.globalAlpha = 1;
      c.fillStyle = halo;
      c.fillRect(hx - gs, hy - gs, gs * 2, gs * 2);
      c.globalAlpha = live ? 0.95 : 0.4;
      c.drawImage(glow!, hx - gs / 2, hy - gs / 2, gs, gs);
      // anamorphic streak
      c.globalAlpha = live ? 0.5 : 0.15;
      c.drawImage(glow!, hx - gs * 1.3, hy - gs * 0.06, gs * 2.6, gs * 0.12);
      c.restore();
    }

    /* ---------- loop ---------- */

    // ?introdebug freezes the clock at a chosen time for visual testing
    let dbgT: number | null = null;
    const debug = location.search.includes("introdebug");
    if (debug) (window as unknown as { __intro: unknown }).__intro = { seek: (x: number | null) => (dbgT = x) };

    let raf = 0;
    let t0 = 0;
    let last = 0;
    let done = false;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!built) return;
      const t = dbgT ?? (now - t0) / 1000;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const c = ctx!;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.globalCompositeOperation = "source-over";
      c.globalAlpha = 1;
      c.drawImage(wallC, 0, 0, W, H);

      // base coat
      const sIdx = Math.floor((t - T_WALL) / T_STROKE);
      while (baked < Math.min(N_STROKES, Math.max(0, sIdx))) bake(baked++);
      c.drawImage(paintBaked, 0, 0, W, H);
      if (sIdx >= 0 && sIdx < N_STROKES) {
        const b = bands[sIdx];
        const s = eio(clamp01((t - T_WALL - sIdx * T_STROKE) / T_STROKE));
        const fx = b.dir > 0 ? lerp(-0.12 * W, 1.14 * W, s) : lerp(1.12 * W, -0.14 * W, s);
        c.save();
        if (bandPath(c, b, fx)) {
          c.clip();
          c.drawImage(paintFull, 0, 0, W, H);
          // wet sheen trailing the brush
          const wg = c.createLinearGradient(fx, 0, fx - b.dir * 220, 0);
          wg.addColorStop(0, "rgba(200,255,235,.16)");
          wg.addColorStop(1, "rgba(200,255,235,0)");
          c.fillStyle = wg;
          c.fillRect(0, 0, W, H);
        }
        c.restore();
      }

      // carving
      if (t >= T_LASER0) {
        const tau = Math.min(T_LASER, t - T_LASER0);
        if (tau > tauPrev) {
          stamp(tauPrev, tau, true);
        }
        const tauFrom = tauPrev;
        tauPrev = tau;
        tg.globalCompositeOperation = "source-over";
        tg.clearRect(0, 0, cw, ch);
        tg.drawImage(maskC, 0, 0);
        tg.globalCompositeOperation = "source-in";
        tg.drawImage(carved, 0, 0);
        c.drawImage(tmpC, 0, 0, W, H);
        // molten edges where the beam has just passed
        hg.save();
        hg.setTransform(1, 0, 0, 1, 0, 0);
        hg.globalCompositeOperation = "destination-out";
        hg.fillStyle = `rgba(0,0,0,${(1 - Math.exp(-dt * 6)).toFixed(3)})`;
        hg.fillRect(0, 0, cw, ch);
        hg.restore();
        if (t < T_LASER_END + 0.6) {
          tg.globalCompositeOperation = "source-over";
          tg.clearRect(0, 0, cw, ch);
          tg.drawImage(hotC, 0, 0);
          tg.globalCompositeOperation = "source-in";
          tg.fillStyle = `hsl(${beamHue(tau)},100%,60%)`;
          tg.fillRect(0, 0, cw, ch);
          tg.globalCompositeOperation = "destination-in";
          tg.drawImage(artC, 0, 0);
          c.save();
          c.globalCompositeOperation = "lighter";
          c.globalAlpha = 0.55;
          c.drawImage(tmpC, 0, 0, W, H);
          c.restore();
        }
        drawParticles(dt);
        if (t < T_LASER_END) drawBeam(tau, tauFrom);
        // a slow light sweep across the finished relief
        const gl = clamp01((t - T_LASER_END) / T_GLINT);
        if (gl > 0 && gl < 1) {
          const sx = lerp(-0.4, 1.4, eio(gl)) * W;
          tg.globalCompositeOperation = "source-over";
          tg.clearRect(0, 0, cw, ch);
          tg.setTransform(dpr, 0, 0, dpr, 0, 0);
          const sg = tg.createLinearGradient(sx - W * 0.16, 0, sx + W * 0.16, H * 0.25);
          sg.addColorStop(0, "rgba(255,250,235,0)");
          sg.addColorStop(0.5, "rgba(255,250,235,.55)");
          sg.addColorStop(1, "rgba(255,250,235,0)");
          tg.fillStyle = sg;
          tg.fillRect(0, 0, W, H);
          tg.setTransform(1, 0, 0, 1, 0, 0);
          tg.globalCompositeOperation = "destination-in";
          tg.drawImage(carved, 0, 0);
          c.save();
          c.globalCompositeOperation = "lighter";
          c.drawImage(tmpC, 0, 0, W, H);
          c.restore();
        }
      }
      if (t >= T_DONE && !done && !debug) {
        done = true;
        finish();
      }
    }

    let alive = true;
    const fontsReady = (document.fonts?.ready ?? Promise.resolve()).then(() => null);
    const timeout = new Promise((r) => setTimeout(r, 1800));
    Promise.race([Promise.all([loadImg("/photos/diego-01-teal-headphones.jpg"), loadImg("/textures/plaster.jpg"), fontsReady]), timeout]).then((res) => {
      if (!alive) return;
      if (Array.isArray(res)) {
        photo = res[0] as HTMLImageElement | null;
        plaster = res[1] as HTMLImageElement | null;
      }
      build();
      t0 = last = performance.now();
      raf = requestAnimationFrame(frame);
    });

    let rt = 0;
    const onResize = () => {
      clearTimeout(rt);
      rt = window.setTimeout(() => {
        if (alive && built) build();
      }, 160);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(rt);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
    // the sequence runs once; stage changes only fade the overlay out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (stage === "done") return null;
  return (
    <div
      className={`intro fixed inset-0 z-[200] overflow-hidden bg-[#e6e0d4] transition-[opacity,transform,filter] duration-[850ms] ease-[cubic-bezier(.65,0,.35,1)] ${
        stage === "exit" ? "pointer-events-none scale-[1.04] opacity-0 blur-[2px]" : ""
      }`}
      role="img"
      aria-label={t.intro.label}
    >
      <canvas ref={ref} className="absolute inset-0 block h-full w-full" />
      <button
        type="button"
        onClick={finish}
        className="absolute bottom-5 right-5 z-10 rounded-full bg-paper/85 px-5 py-2.5 text-[12px] font-extrabold uppercase tracking-[.2em] text-ink shadow-soft ring-1 ring-line backdrop-blur transition hover:bg-paper sm:bottom-8 sm:right-8"
      >
        {t.intro.skip}
      </button>
    </div>
  );
}
