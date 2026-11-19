"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type { Cat, WorkItem } from "@/lib/work";

/* ─────────────────────────────────────────────────────────────────────────────
   PaperStage — every project is printed on a sheet of paper, and each sheet leaves
   the stack with a technique that suits its discipline: brand marks dissolve into
   stardust that swirls and re-forms as the next print, posters turn like glossy
   magazine pages, web prints tear apart, apps drift away as glittering dust,
   illustrations flip as 3D shutters, styling looks ripple over as a mosaic and
   uniforms burst into shards. Everything is real geometry: textured polygons and
   particles projected with perspective, lit with a soft diffuse + specular model.
   ───────────────────────────────────────────────────────────────────────────── */

export type Technique = "pageTurn" | "tear" | "particles" | "strips" | "reform" | "shatter" | "mosaic" | "fade";
export type StageHandle = { next: () => void; prev: () => void; setPaused: (p: boolean) => void };

export function techniqueFor(item: WorkItem, index: number): Technique {
  switch (item.cat) {
    case "web":
      return "tear";
    case "app":
      return "particles";
    case "brand":
      return "reform";
    case "poster":
      return "pageTurn";
    case "illustration":
      return "strips";
    case "fashion":
      return "mosaic";
    case "apparel":
      return (["mosaic", "shatter", "strips", "particles"] as const)[index % 4];
  }
}

const HOLD = 3.2;
const DUR: Record<Technique, number> = { pageTurn: 2.4, tear: 2.6, particles: 3.6, strips: 2.4, reform: 3.8, shatter: 2.8, mosaic: 2.7, fade: 1.2 };
const SETTLE_AT: Record<Technique, number> = { pageTurn: 0.12, tear: 0.22, particles: 0.06, strips: 0, reform: 0, shatter: 0.14, mosaic: 0, fade: 0 };
/** Techniques whose outgoing sheet reveals the next print itself (so the stack must not draw it). */
const SELF_REVEAL: Partial<Record<Technique, true>> = { strips: true, reform: true, mosaic: true };
const FOCAL = 1700;
const PAPER = "#FFFDF8";
const CAT_CODE: Record<Cat, string> = {
  web: "WEB · PRODUCT",
  app: "MOBILE APP",
  brand: "BRANDING",
  poster: "POSTER",
  illustration: "ILLUSTRATION",
  apparel: "UNIFORM",
  fashion: "STYLING",
};
const SUB = [
  [0.3, 0.3],
  [0.7, 0.3],
  [0.3, 0.7],
  [0.7, 0.7],
];

type P3 = [number, number, number];
type UV = [number, number];
type V = { x: number; y: number; u: number; v: number };
type Pose = { x: number; y: number; z: number; rz: number; s: number };
type Tex = HTMLCanvasElement;
type Face = { world: P3[]; uv: UV[]; uvBack?: UV[] };
type Grid = { cols: number; rows: number; cs: number; csy: number; count: number; x: Float32Array; y: Float32Array; rgb: Uint8ClampedArray };

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const ein = (x: number) => x * x * x;
const eout = (x: number) => 1 - Math.pow(1 - x, 3);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
  rz: lerp(a.rz, b.rz, t),
  s: lerp(a.s, b.s, t),
});
/** Twinkle: mostly dim with short bright flashes. */
const twinkle = (t: number, ph: number) => 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(t * 11 + ph), 3);

/* ---------- colour helpers (pure) ---------- */

/** 0 = neutral (gets a sun-gold glint), 1–12 = hue buckets of 30°. */
function hueBucket(r: number, g: number, b: number) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (d < 38 || mx + mn > 470) return 0;
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return 1 + (Math.round(h / 30) % 12);
}

function hslRgb(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return `${f(0)},${f(8)},${f(4)}`;
}

/* ---------- 2D geometry (pure) ---------- */

function area2(pts: { x: number; y: number }[]) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

function lerpV(a: V, b: V, t: number): V {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), u: lerp(a.u, b.u, t), v: lerp(a.v, b.v, t) };
}

/** Splits a convex polygon by a line; returns [side ≥ 0, side ≤ 0]. */
function split(poly: V[], L: { px: number; py: number; dx: number; dy: number }): [V[], V[]] {
  const side = (q: V) => L.dx * (q.y - L.py) - L.dy * (q.x - L.px);
  const A: V[] = [];
  const B: V[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);
    if (sa >= 0) A.push(a);
    if (sa <= 0) B.push(a);
    if ((sa > 0 && sb < 0) || (sa < 0 && sb > 0)) {
      const m = lerpV(a, b, sa / (sa - sb));
      A.push(m);
      B.push(m);
    }
  }
  return [A, B];
}

/** Rotates (x, y, z) about the unit axis k by angle a (Rodrigues). */
function rotAxis(x: number, y: number, z: number, kx: number, ky: number, kz: number, a: number): P3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const d = (kx * x + ky * y + kz * z) * (1 - c);
  return [x * c + (ky * z - kz * y) * s + kx * d, y * c + (kz * x - kx * z) * s + ky * d, z * c + (kx * y - ky * x) * s + kz * d];
}

/* ───────────────────────────── Component ───────────────────────────── */

export default function PaperStage({
  items,
  anchorRef,
  progressRef,
  controlRef,
  onChange,
  className = "",
}: {
  items: WorkItem[];
  anchorRef: RefObject<HTMLElement | null>;
  progressRef: RefObject<HTMLElement | null>;
  controlRef: MutableRefObject<StageHandle | null>;
  onChange: (index: number, technique: Technique) => void;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const changeRef = useRef(onChange);
  useEffect(() => {
    changeRef.current = onChange;
  });

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(hover: none)").matches;
    const rootCss = getComputedStyle(document.documentElement);
    const serif = rootCss.getPropertyValue("--font-instrument").trim() || "Georgia, serif";
    const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    const n = items.length;

    let W = 0;
    let H = 0;
    let dpr = 1;
    const sheet = { cx: 0, cy: 0, w: 0, h: 0 };
    const imgs: (HTMLImageElement | null)[] = Array(n).fill(null);
    const ready: boolean[] = Array(n).fill(false);
    const texCache = new Map<number, Tex>();
    let backTex: Tex | null = null;
    let shadowSprite: { c: HTMLCanvasElement; pad: number } | null = null;
    let sparkSprites: HTMLCanvasElement[] | null = null;

    let cur = 0;
    let phase: "hold" | "trans" = "hold";
    let tStart = performance.now();
    let tech: Technique = "fade";
    let paused = false;
    let raf = 0;
    let running = false;
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    let cyR = 1;
    let syR = 0;
    let cxR = 1;
    let sxR = 0;

    /* ---------- per-transition data ---------- */
    let pose0: Pose = { x: 0, y: 0, z: 0, rz: 0, s: 1 };
    let tear: {
      jag: { x: number; y: number }[];
      left: V[];
      right: V[];
      pv: { x: number; y: number };
      flecks: { x: number; y: number; vx: number; vy: number; vz: number; b: number; s: number; rot: number; spin: number; col: string; spark: number }[];
    } | null = null;
    let dust: {
      g: Grid;
      t0: Float32Array;
      life: Float32Array;
      rho0: Float32Array;
      th0: Float32Array;
      ph: Float32Array;
      spark: Uint8Array;
      col: string[];
      rowNoise: Float32Array;
      vcx: number;
      vcy: number;
    } | null = null;
    let reform: {
      g: Grid;
      tx: Float32Array;
      ty: Float32Array;
      d: Float32Array;
      R: Float32Array;
      ang: Float32Array;
      spin: Float32Array;
      yb: Float32Array;
      ph: Float32Array;
      spark: Uint8Array;
      col: string[];
      K: number;
    } | null = null;
    let shards: {
      list: { pts: V[]; cx: number; cy: number; dx: number; dy: number; vx: number; vy: number; vz: number; kx: number; ky: number; kz: number; om: number; delay: number }[];
      ix: number;
      iy: number;
      bits: { x: number; y: number; vx: number; vy: number; vz: number; life: number; s: number; col: string; delay: number }[];
      sparks: { vx: number; vy: number; vz: number; life: number; s: number; hue: number; ph: number }[];
      hue: number;
    } | null = null;
    let tiles: {
      list: { cx: number; cy: number; hw: number; hh: number; ua: number; ub: number; va: number; vb: number; d: number; vert: boolean; sgn: number; spark: boolean }[];
    } | null = null;
    let page: { dust: { b: number; v: number; vx: number; vy: number; vz: number; life: number; s: number; ph: number; hue: number }[] } | null = null;

    const dbg: { p: number | null; tech: Technique | null } = { p: null, tech: null };
    const idx = (k: number) => ((k % n) + n) % n;
    // The paper techniques are the showcase itself (and can be paused), so they always run;
    // reduced-motion only removes the ambient float/tilt and slows the pace.
    const techOf = (i: number) => techniqueFor(items[idx(i)], idx(i));
    const hold = reduce ? HOLD * 1.8 : HOLD;

    /* ---------- assets ---------- */

    function load(i: number) {
      i = idx(i);
      if (imgs[i]) return;
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        ready[i] = true;
      };
      im.src = items[i].src;
      imgs[i] = im;
    }

    function texSize() {
      const td = Math.min(dpr, 1.6);
      return [Math.max(2, Math.round(sheet.w * td)), Math.max(2, Math.round(sheet.h * td)), td] as const;
    }

    function getBack(): Tex {
      if (backTex) return backTex;
      const [tw, th] = texSize();
      const c = document.createElement("canvas");
      c.width = tw;
      c.height = th;
      const g = c.getContext("2d")!;
      g.fillStyle = "#F2EADA";
      g.fillRect(0, 0, tw, th);
      // faint ruled fibres
      g.strokeStyle = "rgba(28,43,39,.035)";
      g.lineWidth = 1;
      for (let y = th * 0.06; y < th; y += th * 0.045) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(tw, y + th * 0.004);
        g.stroke();
      }
      // a printer's mark, mirrored so it reads correctly from behind
      g.save();
      g.translate(tw, 0);
      g.scale(-1, 1);
      g.fillStyle = "rgba(11,122,92,.28)";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `italic ${Math.round(tw * 0.075)}px ${serif}`;
      g.fillText("Diego Silveira", tw / 2, th / 2);
      g.font = `700 ${Math.round(tw * 0.026)}px ${mono}`;
      g.fillText("DESIGN · CODE · MOTION", tw / 2, th / 2 + tw * 0.08);
      g.restore();
      backTex = c;
      return c;
    }

    function getTex(k: number): Tex | null {
      const i = idx(k);
      const hit = texCache.get(i);
      if (hit) return hit;
      if (!ready[i] || !sheet.w) return null;
      const [tw, th, td] = texSize();
      const c = document.createElement("canvas");
      c.width = tw;
      c.height = th;
      const g = c.getContext("2d", { willReadFrequently: false })!;
      g.fillStyle = PAPER;
      g.fillRect(0, 0, tw, th);
      const m = tw * 0.05;
      const band = tw * 0.15;
      const ax = m;
      const ay = m;
      const aw = tw - 2 * m;
      const ah = th - m - band;
      const im = imgs[i]!;
      const iw = im.naturalWidth;
      const ih = im.naturalHeight;
      const sc = Math.max(aw / iw, ah / ih);
      const sw = aw / sc;
      const sh = ah / sc;
      const top = (items[i].cat === "web" || items[i].cat === "app") && ih / iw > (ah / aw) * 1.1;
      g.drawImage(im, (iw - sw) / 2, top ? 0 : (ih - sh) / 2, sw, sh, ax, ay, aw, ah);
      g.strokeStyle = "rgba(28,43,39,.10)";
      g.lineWidth = Math.max(1, td);
      g.strokeRect(ax + 0.5, ay + 0.5, aw - 1, ah - 1);
      const by = ay + ah + band * 0.52;
      g.textBaseline = "middle";
      g.fillStyle = "#1C2B27";
      g.font = `italic ${Math.round(tw * 0.064)}px ${serif}`;
      g.fillText(`Nº ${String(i + 1).padStart(2, "0")}`, ax, by);
      g.textAlign = "right";
      g.fillStyle = "#586862";
      g.font = `700 ${Math.round(tw * 0.027)}px ${mono}`;
      g.fillText(CAT_CODE[items[i].cat], ax + aw - tw * 0.05, by);
      g.fillStyle = "#FFC23D";
      g.beginPath();
      g.arc(ax + aw - tw * 0.017, by, tw * 0.014, 0, Math.PI * 2);
      g.fill();
      texCache.set(i, c);
      if (texCache.size > 7) {
        for (const key of texCache.keys()) {
          if (idx(key - cur) > 3) {
            texCache.delete(key);
            if (texCache.size <= 7) break;
          }
        }
      }
      return c;
    }

    /** Glints: a white-hot core, a halo in the image's own hue and four soft rays. */
    function getSparks() {
      if (sparkSprites) return sparkSprites;
      const S = 64;
      const m = S / 2;
      sparkSprites = [-1, ...Array.from({ length: 12 }, (_, i) => i * 30)].map((h) => {
        const c = document.createElement("canvas");
        c.width = c.height = S;
        const g = c.getContext("2d")!;
        const col = h < 0 ? "255,190,52" : hslRgb(h, 96, 60);
        const rg = g.createRadialGradient(m, m, 0, m, m, m * 0.62);
        rg.addColorStop(0, "rgba(255,255,255,1)");
        rg.addColorStop(0.14, "rgba(255,255,255,.95)");
        rg.addColorStop(0.32, `rgba(${col},.62)`);
        rg.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = rg;
        g.fillRect(0, 0, S, S);
        const rays: [number, number, number, number][] = [
          [1, 0, m, 2.2],
          [0, 1, m, 2.2],
          [0.707, 0.707, m * 0.42, 1.4],
          [0.707, -0.707, m * 0.42, 1.4],
        ];
        g.lineCap = "round";
        for (const [ax, ay, len, wd] of rays) {
          const lg = g.createLinearGradient(m - ax * len, m - ay * len, m + ax * len, m + ay * len);
          lg.addColorStop(0, `rgba(${col},0)`);
          lg.addColorStop(0.36, `rgba(${col},.75)`);
          lg.addColorStop(0.5, "rgba(255,255,255,1)");
          lg.addColorStop(0.64, `rgba(${col},.75)`);
          lg.addColorStop(1, `rgba(${col},0)`);
          g.strokeStyle = lg;
          g.lineWidth = wd;
          g.beginPath();
          g.moveTo(m - ax * len, m - ay * len);
          g.lineTo(m + ax * len, m + ay * len);
          g.stroke();
        }
        return c;
      });
      return sparkSprites;
    }

    function spark(x: number, y: number, size: number, alpha: number, hue = 0) {
      if (alpha <= 0.02 || size < 1) return;
      const c = ctx!;
      c.globalAlpha = Math.min(1, alpha);
      c.drawImage(getSparks()[hue], x - size / 2, y - size / 2, size, size);
    }

    /** Samples a print into a grid of cells (average of four taps per cell). */
    function sampleGrid(tex: Tex, cols: number): Grid {
      const { w, h } = sheet;
      const tw = tex.width;
      const th = tex.height;
      const data = tex.getContext("2d")!.getImageData(0, 0, tw, th).data;
      const rows = Math.max(2, Math.round((h / w) * cols));
      const count = cols * rows;
      const x = new Float32Array(count);
      const y = new Float32Array(count);
      const rgb = new Uint8ClampedArray(count * 3);
      let k = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++, k++) {
          x[k] = -w / 2 + ((c + 0.5) / cols) * w;
          y[k] = -h / 2 + ((r + 0.5) / rows) * h;
          let R = 0;
          let G = 0;
          let B = 0;
          for (const [fx, fy] of SUB) {
            const px = Math.min(tw - 1, Math.floor(((c + fx) / cols) * tw));
            const py = Math.min(th - 1, Math.floor(((r + fy) / rows) * th));
            const o = (py * tw + px) * 4;
            R += data[o];
            G += data[o + 1];
            B += data[o + 2];
          }
          rgb[k * 3] = R / 4;
          rgb[k * 3 + 1] = G / 4;
          rgb[k * 3 + 2] = B / 4;
        }
      }
      return { cols, rows, cs: w / cols, csy: h / rows, count, x, y, rgb };
    }

    /* ---------- projection & drawing ---------- */

    function view(p: P3): P3 {
      const x = p[0] * cyR + p[2] * syR;
      const z1 = -p[0] * syR + p[2] * cyR;
      return [x, p[1] * cxR - z1 * sxR, p[1] * sxR + z1 * cxR];
    }
    function proj(p: P3): [number, number] {
      const s = FOCAL / (FOCAL + p[2]);
      return [sheet.cx + p[0] * s, sheet.cy + p[1] * s];
    }
    // allocation-free projection for particle systems
    let PX = 0;
    let PY = 0;
    let PS = 1;
    function projPt(x: number, y: number, z: number) {
      const xr = x * cyR + z * syR;
      const z1 = -x * syR + z * cyR;
      const yr = y * cxR - z1 * sxR;
      const zr = y * sxR + z1 * cxR;
      PS = FOCAL / (FOCAL + Math.max(-FOCAL * 0.7, zr));
      PX = sheet.cx + xr * PS;
      PY = sheet.cy + yr * PS;
    }

    function tracePath(s: [number, number][], inflate = 0, ox = 0) {
      let cx = 0;
      let cy = 0;
      for (const q of s) {
        cx += q[0];
        cy += q[1];
      }
      cx /= s.length;
      cy /= s.length;
      ctx!.beginPath();
      s.forEach((q, i) => {
        let x = q[0];
        let y = q[1];
        if (inflate) {
          const dx = x - cx;
          const dy = y - cy;
          const l = Math.hypot(dx, dy) || 1;
          x += (dx / l) * inflate;
          y += (dy / l) * inflate;
        }
        if (i) ctx!.lineTo(x + ox, y);
        else ctx!.moveTo(x + ox, y);
      });
      ctx!.closePath();
    }

    /**
     * Draws a planar textured polygon with correct front/back texture, diffuse shading and an
     * optional specular glint (gloss) that flares when the surface turns toward the key light.
     */
    function drawPoly(world: P3[], uv: UV[], front: Tex, back: Tex | null, alpha = 1, uvBack?: UV[], gloss = 0) {
      const c = ctx!;
      const k = world.length;
      const v = world.map(view);
      const s = v.map(proj);
      let area = 0;
      for (let i = 0; i < k; i++) area += s[i][0] * s[(i + 1) % k][1] - s[(i + 1) % k][0] * s[i][1];
      if (Math.abs(area) < 1) return;
      const isFront = area > 0;
      const tex = isFront ? front : back ?? getBack();
      const uvs = isFront ? uv : uvBack ?? uv;

      // pick the largest fan triangle for a stable affine map
      let i1 = 1;
      let best = 0;
      for (let i = 1; i < k - 1; i++) {
        const a = Math.abs((s[i][0] - s[0][0]) * (s[i + 1][1] - s[0][1]) - (s[i + 1][0] - s[0][0]) * (s[i][1] - s[0][1]));
        if (a > best) {
          best = a;
          i1 = i;
        }
      }
      const i2 = i1 + 1;

      // lambert shade (two-sided), relative to a sheet facing the camera
      const ax = v[i1][0] - v[0][0];
      const ay = v[i1][1] - v[0][1];
      const az = v[i1][2] - v[0][2];
      const bx = v[i2][0] - v[0][0];
      const by = v[i2][1] - v[0][1];
      const bz = v[i2][2] - v[0][2];
      let nx = ay * bz - az * by;
      let ny = az * bx - ax * bz;
      let nz = ax * by - ay * bx;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl;
      ny /= nl;
      nz /= nl;
      const lam = Math.abs(nx * -0.3 + ny * -0.5 + nz * -0.81);
      const shade = Math.min(0.55, Math.max(0, 0.81 - lam) * 0.75 + (isFront ? 0 : 0.03));
      const spec = gloss > 0 ? Math.min(0.8, Math.pow(lam, 26) * gloss) : 0;

      const tw = tex.width;
      const th = tex.height;
      const u0 = uvs[0][0] * tw;
      const v0 = uvs[0][1] * th;
      const u1 = uvs[i1][0] * tw;
      const v1 = uvs[i1][1] * th;
      const u2 = uvs[i2][0] * tw;
      const v2 = uvs[i2][1] * th;
      const d = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
      if (!d) return;
      const [x0, y0] = s[0];
      const [x1, y1] = s[i1];
      const [x2, y2] = s[i2];
      const A = (x0 * (v1 - v2) + x1 * (v2 - v0) + x2 * (v0 - v1)) / d;
      const B = (y0 * (v1 - v2) + y1 * (v2 - v0) + y2 * (v0 - v1)) / d;
      const C = (x0 * (u2 - u1) + x1 * (u0 - u2) + x2 * (u1 - u0)) / d;
      const D = (y0 * (u2 - u1) + y1 * (u0 - u2) + y2 * (u1 - u0)) / d;
      const E = (x0 * (u1 * v2 - u2 * v1) + x1 * (u2 * v0 - u0 * v2) + x2 * (u0 * v1 - u1 * v0)) / d;
      const F = (y0 * (u1 * v2 - u2 * v1) + y1 * (u2 * v0 - u0 * v2) + y2 * (u0 * v1 - u1 * v0)) / d;
      if (![A, B, C, D, E, F].every(Number.isFinite)) return;

      c.save();
      c.globalAlpha = alpha;
      tracePath(s, 0.6);
      c.clip();
      c.transform(A, B, C, D, E, F);
      c.drawImage(tex, 0, 0);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (shade > 0.01) {
        c.fillStyle = `rgba(28,43,39,${shade.toFixed(3)})`;
        c.fill(); // the clip path is still current, so only the polygon is shaded
      }
      if (spec > 0.02) {
        c.globalCompositeOperation = "lighter";
        c.fillStyle = `rgba(255,244,222,${spec.toFixed(3)})`;
        c.fill();
      }
      c.restore();
    }

    function fillPoly(world: P3[], color: string, alpha = 1) {
      ctx!.save();
      ctx!.globalAlpha = alpha;
      tracePath(world.map((p) => proj(view(p))));
      ctx!.fillStyle = color;
      ctx!.fill();
      ctx!.restore();
    }

    /** Soft drop shadow via the off-canvas shadow trick (only the shadow lands on screen). */
    function shadowPoly(world: P3[], blur: number, alpha: number, oy = 16) {
      if (alpha <= 0.005) return;
      const c = ctx!;
      c.save();
      c.shadowColor = `rgba(28,43,39,${alpha.toFixed(3)})`;
      c.shadowBlur = blur * dpr;
      c.shadowOffsetX = 10000 * dpr;
      c.shadowOffsetY = oy * dpr;
      tracePath(
        world.map((p) => proj(view(p))),
        0,
        -10000,
      );
      c.fillStyle = "#000";
      c.fill();
      c.restore();
    }

    /** A soft sheet shadow, blurred once into a sprite and then just transformed per frame. */
    function getShadowSprite() {
      if (shadowSprite) return shadowSprite;
      const pad = 56;
      const c = document.createElement("canvas");
      c.width = Math.ceil(sheet.w + pad * 2);
      c.height = Math.ceil(sheet.h + pad * 2);
      const g = c.getContext("2d")!;
      g.shadowColor = "rgba(28,43,39,1)";
      g.shadowBlur = 34;
      g.shadowOffsetX = 10000;
      g.fillStyle = "#000";
      g.fillRect(pad - 10000, pad, sheet.w, sheet.h);
      shadowSprite = { c, pad };
      return shadowSprite;
    }

    function drawShadowSprite(p: Pose, alpha: number, oy = 20) {
      if (alpha <= 0.005 || !sheet.w) return;
      const { c: spr, pad } = getShadowSprite();
      const hw = (sheet.w / 2 + pad) * p.s;
      const hh = (sheet.h / 2 + pad) * p.s;
      const cr = Math.cos(p.rz);
      const sr = Math.sin(p.rz);
      const pt = (x: number, y: number) => proj(view([p.x + x * cr - y * sr, p.y + oy + x * sr + y * cr, p.z + 2]));
      const [x0, y0] = pt(-hw, -hh);
      const [x1, y1] = pt(hw, -hh);
      const [x3, y3] = pt(-hw, hh);
      const c = ctx!;
      c.save();
      c.globalAlpha = alpha;
      c.transform((x1 - x0) / spr.width, (y1 - y0) / spr.width, (x3 - x0) / spr.height, (y3 - y0) / spr.height, x0, y0);
      c.drawImage(spr, 0, 0);
      c.restore();
    }

    function drawFaces(faces: Face[], front: Tex, back: Tex | null, alpha = 1, gloss = 0) {
      // Depth-sort in stage space (before the pointer tilt): the tilt is a rigid rotation, but it
      // would swamp the small offsets that keep neighbouring pieces in the right order.
      const sorted = faces
        .map((f) => ({ f, z: f.world.reduce((s, p) => s + p[2], 0) / f.world.length }))
        .sort((a, b) => b.z - a.z);
      for (const { f } of sorted) drawPoly(f.world, f.uv, front, back, alpha, f.uvBack, gloss);
    }

    /* ---------- poses ---------- */

    const REST: Pose = { x: 0, y: 0, z: 0, rz: 0, s: 1 };
    const S1: Pose = { x: -12, y: 14, z: 30, rz: -0.05, s: 0.985 };
    const S2: Pose = { x: 16, y: 26, z: 60, rz: 0.068, s: 0.97 };
    const UVQ: UV[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    function corners(p: Pose): P3[] {
      const hw = (sheet.w / 2) * p.s;
      const hh = (sheet.h / 2) * p.s;
      const c = Math.cos(p.rz);
      const s = Math.sin(p.rz);
      return [
        [-hw, -hh],
        [hw, -hh],
        [hw, hh],
        [-hw, hh],
      ].map(([x, y]) => [p.x + x * c - y * s, p.y + x * s + y * c, p.z] as P3);
    }

    function drawSheet(k: number, p: Pose, alpha = 1, shadow = true) {
      const c = corners(p);
      if (shadow) drawShadowSprite(p, 0.24 * alpha);
      const tex = getTex(k);
      if (tex) drawPoly(c, UVQ, tex, null, alpha, undefined, 0.6);
      else fillPoly(c, PAPER, alpha);
    }

    function restPose(t: number): Pose {
      if (reduce) return REST;
      return { x: 0, y: Math.sin(t * 1.1) * 4, z: 0, rz: Math.sin(t * 0.7) * 0.01, s: 1 };
    }

    function drawStack(settle: number, t: number, skipNext = false) {
      if (settle > 0) drawSheet(cur + 3, S2, settle);
      drawSheet(cur + 2, lerpPose(S2, S1, settle));
      if (!skipNext) drawSheet(cur + 1, lerpPose(S1, restPose(t), eio(settle)));
    }

    /* ---------- transition set-up ---------- */

    function initTear() {
      const { w, h } = sheet;
      const N = 28;
      const x0 = (Math.random() - 0.5) * 0.28 * w;
      const x1 = (Math.random() - 0.5) * 0.28 * w;
      const jag: { x: number; y: number }[] = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const edge = i === 0 || i === N ? 0 : 1;
        jag.push({ x: lerp(x0, x1, t) + edge * ((Math.random() - 0.5) * w * 0.04 + Math.sin(t * 31) * w * 0.006), y: -h / 2 + t * h });
      }
      const toV = (q: { x: number; y: number }): V => ({ x: q.x, y: q.y, u: q.x / w + 0.5, v: q.y / h + 0.5 });
      const left = [toV({ x: -w / 2, y: -h / 2 }), ...jag.map(toV), toV({ x: -w / 2, y: h / 2 })];
      const right = [toV(jag[0]), toV({ x: w / 2, y: -h / 2 }), toV({ x: w / 2, y: h / 2 }), ...jag.slice().reverse().map(toV)];
      // paper fibres and print flecks shaken loose along the tear
      const g = sampleGrid(getTex(cur)!, 24);
      const flecks = Array.from({ length: coarse ? 46 : 80 }, () => {
        const t = Math.random();
        const j = Math.min(N - 1, Math.floor(t * N));
        const q = { x: lerp(jag[j].x, jag[j + 1].x, t * N - j), y: lerp(jag[j].y, jag[j + 1].y, t * N - j) };
        const side = Math.random() < 0.5 ? -1 : 1;
        const cell = Math.min(g.count - 1, Math.floor((q.y / h + 0.5) * g.rows) * g.cols + Math.floor((q.x / w + 0.5) * g.cols));
        const paper = Math.random() < 0.45;
        return {
          x: q.x,
          y: q.y,
          vx: side * rnd(40, 260),
          vy: rnd(-220, -30),
          vz: rnd(-380, 40),
          b: rnd(0.1, 0.34) + (t * 0.08),
          s: rnd(2, 6.5),
          rot: rnd(0, 6.28),
          spin: rnd(-9, 9),
          col: paper ? PAPER : `rgb(${g.rgb[cell * 3]},${g.rgb[cell * 3 + 1]},${g.rgb[cell * 3 + 2]})`,
          spark: Math.random() < 0.22 ? hueBucket(g.rgb[cell * 3], g.rgb[cell * 3 + 1], g.rgb[cell * 3 + 2]) + 1 : 0,
        };
      });
      tear = { jag, left, right, pv: jag[N], flecks };
    }

    function initDrift() {
      const { w, h } = sheet;
      const T = DUR.particles;
      const g = sampleGrid(getTex(cur)!, coarse ? 40 : 58);
      const N = g.count;
      const rowNoise = Float32Array.from({ length: g.rows }, () => Math.random());
      const vcx = w * 0.5;
      const vcy = -h * 0.04;
      const D = {
        g,
        t0: new Float32Array(N),
        life: new Float32Array(N),
        rho0: new Float32Array(N),
        th0: new Float32Array(N),
        ph: new Float32Array(N),
        spark: new Uint8Array(N),
        col: new Array<string>(N),
        rowNoise,
        vcx,
        vcy,
      };
      for (let k = 0; k < N; k++) {
        const r = Math.floor(k / g.cols);
        const u = ((k % g.cols) + 0.5) / g.cols;
        const t0 = (DRIFT_SPAN * (1 - u + 0.3 * rowNoise[r])) / 1.3;
        const tau = t0 * T;
        const dx = g.x[k] - (vcx + VORTEX_VX * tau);
        const dy = g.y[k] - (vcy + VORTEX_VY * tau);
        const R = g.rgb[k * 3];
        const G = g.rgb[k * 3 + 1];
        const B = g.rgb[k * 3 + 2];
        D.t0[k] = t0;
        D.life[k] = Math.min(rnd(1.8, 2.8), (1 - t0) * T - 0.05);
        D.rho0[k] = Math.hypot(dx, dy);
        D.th0[k] = Math.atan2(dy, dx);
        D.ph[k] = rnd(0, 6.283);
        D.col[k] = `rgb(${R},${G},${B})`;
        D.spark[k] = Math.random() < 0.12 ? hueBucket(R, G, B) + 1 : 0;
      }
      dust = D;
    }

    function initReform() {
      const { w, h } = sheet;
      const cols = coarse ? 38 : 58;
      const A = sampleGrid(getTex(cur)!, cols);
      const Bg = sampleGrid(getTex(cur + 1)!, cols);
      const N = A.count;
      const K = 7;
      // pair departures and arrivals by distance from two wave origins: the old print
      // lifts away from one point while the new one re-forms outward from another
      const oA = { x: rnd(-0.5, 0.5) * w, y: rnd(-0.5, 0.5) * h };
      const oB = { x: rnd(-0.3, 0.3) * w, y: rnd(-0.3, 0.3) * h };
      const maxD = Math.hypot(w, h);
      const keyA = Array.from({ length: N }, (_, k) => ({ k, d: Math.hypot(A.x[k] - oA.x, A.y[k] - oA.y) / maxD + Math.random() * 0.18 }));
      const keyB = Array.from({ length: N }, (_, k) => ({ k, d: Math.hypot(Bg.x[k] - oB.x, Bg.y[k] - oB.y) / maxD + Math.random() * 0.18 }));
      keyA.sort((a, b) => a.d - b.d);
      keyB.sort((a, b) => a.d - b.d);
      const R0 = Math.max(w, h) * 0.78;
      const F = {
        g: A,
        tx: new Float32Array(N),
        ty: new Float32Array(N),
        d: new Float32Array(N),
        R: new Float32Array(N),
        ang: new Float32Array(N),
        spin: new Float32Array(N),
        yb: new Float32Array(N),
        ph: new Float32Array(N),
        spark: new Uint8Array(N),
        col: new Array<string>(N * K),
        K,
      };
      for (let rank = 0; rank < N; rank++) {
        const k = keyA[rank].k;
        const j = keyB[rank].k;
        F.tx[k] = Bg.x[j];
        F.ty[k] = Bg.y[j];
        F.d[k] = 0.04 + 0.2 * (rank / N);
        F.R[k] = (0.28 + 0.72 * Math.sqrt(Math.random())) * R0;
        F.ang[k] = Math.atan2(A.y[k], A.x[k]) + rnd(-0.4, 0.4);
        F.spin[k] = rnd(2.6, 4.6);
        F.yb[k] = rnd(-0.5, 0.5) * h * 0.12;
        F.ph[k] = rnd(0, 6.283);
        const ra = A.rgb[k * 3];
        const ga = A.rgb[k * 3 + 1];
        const ba = A.rgb[k * 3 + 2];
        const rb = Bg.rgb[j * 3];
        const gb = Bg.rgb[j * 3 + 1];
        const bb = Bg.rgb[j * 3 + 2];
        for (let s = 0; s < K; s++) {
          const t = s / (K - 1);
          // mid-flight the dust glows a touch brighter, like motes catching the sun
          const lift = Math.sin(Math.PI * t) * 0.22;
          const mix = (a: number, b: number) => Math.round(lerp(lerp(a, b, t), 255, lift));
          F.col[k * K + s] = `rgb(${mix(ra, rb)},${mix(ga, gb)},${mix(ba, bb)})`;
        }
        F.spark[k] = Math.random() < 0.085 ? hueBucket(rb, gb, bb) + 1 : 0;
      }
      reform = F;
    }

    function initShatter() {
      const { w, h } = sheet;
      const ix = rnd(-0.16, 0.16) * w;
      const iy = rnd(-0.14, 0.1) * h;
      let polys: V[][] = [
        [
          { x: -w / 2, y: -h / 2, u: 0, v: 0 },
          { x: w / 2, y: -h / 2, u: 1, v: 0 },
          { x: w / 2, y: h / 2, u: 1, v: 1 },
          { x: -w / 2, y: h / 2, u: 0, v: 1 },
        ],
      ];
      const ok = (p: V[]) => p.length >= 3 && Math.abs(area2(p)) > 4;
      // radial cracks through the impact point…
      const K = coarse ? 5 : 7;
      const base = rnd(0, Math.PI);
      for (let k = 0; k < K; k++) {
        const a = base + (k * Math.PI) / K + rnd(-0.18, 0.18);
        const L = { px: ix, py: iy, dx: Math.cos(a), dy: Math.sin(a) };
        polys = polys.flatMap((p) => split(p, L)).filter(ok);
      }
      // …then two concentric rings of cross cracks
      const diag = Math.hypot(w, h);
      for (const ring of [0.14, 0.33]) {
        polys = polys.flatMap((p) => {
          const cx = p.reduce((s, q) => s + q.x, 0) / p.length - ix;
          const cy = p.reduce((s, q) => s + q.y, 0) / p.length - iy;
          const l = Math.hypot(cx, cy) || 1;
          const r = ring * diag * rnd(0.8, 1.2);
          return split(p, { px: ix + (cx / l) * r, py: iy + (cy / l) * r, dx: -cy / l, dy: cx / l }).filter(ok);
        });
      }
      const list = polys.map((pts) => {
        const cx = pts.reduce((s, q) => s + q.x, 0) / pts.length;
        const cy = pts.reduce((s, q) => s + q.y, 0) / pts.length;
        const dx0 = cx - ix;
        const dy0 = cy - iy;
        const dist = Math.hypot(dx0, dy0) || 1;
        const dx = dx0 / dist;
        const dy = dy0 / dist;
        const sp = rnd(170, 440) * (1.2 - 0.5 * Math.min(1, dist / (0.6 * diag)));
        let kx = rnd(-1, 1);
        let ky = rnd(-1, 1);
        let kz = rnd(-0.4, 0.4);
        const kl = Math.hypot(kx, ky, kz) || 1;
        kx /= kl;
        ky /= kl;
        kz /= kl;
        return {
          pts,
          cx,
          cy,
          dx,
          dy,
          vx: dx * sp,
          vy: dy * sp - rnd(60, 200),
          vz: -rnd(160, 560),
          kx,
          ky,
          kz,
          om: rnd(2.2, 6.5) * (Math.random() < 0.5 ? -1 : 1),
          delay: (dist / diag) * 0.22,
        };
      });
      const g = sampleGrid(getTex(cur)!, 30);
      const cellAt = (x: number, y: number) =>
        Math.min(g.count - 1, Math.max(0, Math.floor((y / h + 0.5) * g.rows)) * g.cols + Math.max(0, Math.min(g.cols - 1, Math.floor((x / w + 0.5) * g.cols))));
      const bits = Array.from({ length: coarse ? 70 : 130 }, () => {
        const x = rnd(-0.5, 0.5) * w;
        const y = rnd(-0.5, 0.5) * h;
        const c = cellAt(x, y);
        const dx = x - ix;
        const dy = y - iy;
        const l = Math.hypot(dx, dy) || 1;
        const sp = rnd(160, 620);
        return {
          x,
          y,
          vx: (dx / l) * sp,
          vy: (dy / l) * sp - rnd(40, 200),
          vz: -rnd(60, 620),
          life: rnd(0.6, 1.5),
          s: rnd(1.6, 4.6),
          col: `rgb(${g.rgb[c * 3]},${g.rgb[c * 3 + 1]},${g.rgb[c * 3 + 2]})`,
          delay: (l / diag) * 0.22,
        };
      });
      const ci = cellAt(ix, iy);
      const hue = hueBucket(g.rgb[ci * 3], g.rgb[ci * 3 + 1], g.rgb[ci * 3 + 2]);
      const sparks = Array.from({ length: coarse ? 22 : 36 }, () => {
        const a = rnd(0, 6.283);
        const sp = rnd(220, 820);
        return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, vz: -rnd(0, 420), life: rnd(0.45, 1.15), s: rnd(12, 30), hue: Math.random() < 0.55 ? 0 : hue, ph: rnd(0, 6.283) };
      });
      shards = { list, ix, iy, bits, sparks, hue };
    }

    function initMosaic() {
      const { w, h } = sheet;
      const cols = coarse ? 5 : 7;
      const rows = Math.max(3, Math.round((cols * h) / w));
      const tw = w / cols;
      const th = h / rows;
      const origins = [
        [-w / 2, -h / 2],
        [w / 2, -h / 2],
        [-w / 2, h / 2],
        [w / 2, h / 2],
        [0, 0],
      ];
      const [ox, oy] = origins[Math.floor(Math.random() * origins.length)];
      const maxD = Math.max(...[-w / 2, w / 2].flatMap((x) => [-h / 2, h / 2].map((y) => Math.hypot(x - ox, y - oy))));
      const list = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = -w / 2 + (c + 0.5) * tw;
          const cy = -h / 2 + (r + 0.5) * th;
          const dx = cx - ox;
          const dy = cy - oy;
          const vert = Math.abs(dx) / w >= Math.abs(dy) / h;
          list.push({
            cx,
            cy,
            hw: tw / 2,
            hh: th / 2,
            ua: c / cols,
            ub: (c + 1) / cols,
            va: r / rows,
            vb: (r + 1) / rows,
            d: 0.02 + 0.5 * (Math.hypot(dx, dy) / maxD) + rnd(0, 0.04),
            vert,
            sgn: (vert ? dx : dy) >= 0 ? 1 : -1,
            spark: Math.random() < 0.35,
          });
        }
      }
      tiles = { list };
    }

    function initPage() {
      page = {
        dust: Array.from({ length: coarse ? 26 : 44 }, () => ({
          b: rnd(0.1, 0.74),
          v: Math.random(),
          vx: rnd(-30, 90),
          vy: rnd(-150, -20),
          vz: rnd(-160, 40),
          life: rnd(0.5, 1.1),
          s: rnd(9, 22),
          ph: rnd(0, 6.283),
          hue: 0,
        })),
      };
    }

    function startTransition(now: number) {
      if (!getTex(cur) || !getTex(cur + 1)) return false;
      tech = dbg.tech ?? techOf(cur);
      pose0 = restPose(now / 1000);
      if (tech === "tear") initTear();
      if (tech === "particles") initDrift();
      if (tech === "reform") initReform();
      if (tech === "shatter") initShatter();
      if (tech === "mosaic") initMosaic();
      if (tech === "pageTurn") initPage();
      phase = "trans";
      tStart = now;
      return true;
    }

    /* ---------- transition renderers ---------- */

    const off = (p: P3): P3 => [p[0] + pose0.x, p[1] + pose0.y, p[2] + pose0.z];

    function drawTearFx(p: number) {
      const d = tear!;
      const tex = getTex(cur)!;
      const c = ctx!;
      const a = eio(seg(p, 0, 0.28));
      const b = ein(seg(p, 0.2, 1));
      const alpha = 1 - seg(p, 0.8, 1);
      const T = DUR.tear;
      for (const side of [-1, 1]) {
        const pts = side < 0 ? d.left : d.right;
        const cxp = pts.reduce((s, q) => s + q.x, 0) / pts.length;
        const rz = side * (0.075 * a + 0.85 * b);
        const ry = side * 0.6 * b;
        const tx = side * sheet.w * 0.62 * b;
        const ty = sheet.h * 0.9 * b * b - 24 * a;
        const tz = -70 * b;
        const cr = Math.cos(rz);
        const sr = Math.sin(rz);
        const tf = (q: { x: number; y: number }): P3 => {
          const rx = q.x - d.pv.x;
          const rq = q.y - d.pv.y;
          const x1 = rx * cr - rq * sr + d.pv.x;
          const y1 = rx * sr + rq * cr + d.pv.y;
          const dx = x1 - cxp;
          return off([cxp + dx * Math.cos(ry) + tx, y1 + ty, dx * Math.sin(ry) + tz]);
        };
        const world = pts.map(tf);
        shadowPoly(world, 18, 0.17 * alpha, 14);
        drawPoly(
          world,
          pts.map((q) => [q.u, q.v] as UV),
          tex,
          null,
          alpha,
          undefined,
          1.1,
        );
        // fibrous torn edge
        const edge = d.jag.map((q) => proj(view(tf(q))));
        c.save();
        c.globalAlpha = alpha;
        c.lineJoin = "round";
        c.beginPath();
        edge.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.strokeStyle = "rgba(255,253,248,.95)";
        c.lineWidth = 3.4;
        c.stroke();
        c.strokeStyle = "rgba(28,43,39,.16)";
        c.lineWidth = 1;
        c.translate(side * 1.6, 0.6);
        c.stroke();
        c.restore();
      }
      // flecks of paper and ink tumbling out of the tear, a few catching the light
      for (const f of d.flecks) {
        if (p < f.b) continue;
        const age = (p - f.b) * T;
        const lt = age / 1.5;
        if (lt >= 1) continue;
        projPt(f.x + f.vx * age + pose0.x, f.y + f.vy * age + 260 * age * age + pose0.y, f.vz * age + pose0.z);
        const s = f.s * PS * (1 - lt * 0.4);
        const fa = (1 - lt) * Math.min(1, age * 6);
        c.save();
        c.globalAlpha = fa;
        c.translate(PX, PY);
        c.rotate(f.rot + f.spin * age);
        c.scale(1, Math.abs(Math.cos(f.rot * 3 + age * f.spin * 0.7)) * 0.8 + 0.2);
        c.fillStyle = f.col;
        c.fillRect(-s / 2, -s / 2, s, s * 0.7);
        c.restore();
        if (f.spark) spark(PX, PY, s * 4.2, fa * twinkle(age, f.rot), f.spark - 1);
      }
      c.globalAlpha = 1;
    }

    const DRIFT_SPAN = 0.55;
    const VORTEX_VX = 22;
    const VORTEX_VY = -14;

    /** Pixel drift: the print dissolves right-to-left into a 3D vortex of its own coloured dust. */
    function drawDriftFx(p: number) {
      const D = dust!;
      const { g } = D;
      const { w, h } = sheet;
      const T = DUR.particles;
      const c = ctx!;
      const tau = p * T;
      // what is left of the print, behind a ragged dissolving front
      const pts: P3[] = [off([-w / 2, -h / 2, 0])];
      for (let r = 0; r < g.rows; r++) {
        const bu = (p / DRIFT_SPAN) * 1.3 - 0.3 * D.rowNoise[r];
        const bx = Math.max(-w / 2, Math.min(w / 2, w / 2 - bu * w));
        const y0 = -h / 2 + r * g.csy;
        pts.push(off([bx, y0, 0]), off([bx, Math.min(h / 2, y0 + g.csy), 0]));
      }
      pts.push(off([-w / 2, h / 2, 0]));
      drawShadowSprite(pose0, 0.24 * (1 - seg(p, 0, DRIFT_SPAN)));
      c.save();
      tracePath(pts.map((q) => proj(view(q))));
      c.clip();
      drawSheet(cur, pose0, 1, false);
      c.restore();

      const vx = D.vcx + VORTEX_VX * tau;
      const vy = D.vcy + VORTEX_VY * tau;
      for (let k = 0; k < g.count; k++) {
        if (p < D.t0[k]) continue;
        const a = tau - D.t0[k] * T;
        const lt = a / D.life[k];
        if (lt >= 1) continue;
        const rho0 = D.rho0[k];
        const rho = rho0 * (1 + 0.16 * a) + 10 * a;
        const th = D.th0[k] + (0.6 + 3.6 * (110 / (rho0 + 110))) * a;
        const ramp = Math.min(1, a * 1.4);
        const x = vx + Math.cos(th) * rho + 22 * a * a;
        const y = vy + Math.sin(th) * rho * 0.82 - 20 * a * a + Math.sin(a * 3.1 + D.ph[k]) * 8 * a;
        const z = Math.sin(th * 1.3 + D.ph[k]) * rho * 0.5 * ramp - 110 * a;
        projPt(x + pose0.x, y + pose0.y, z + pose0.z);
        const sz = (1.05 - 0.45 * ramp) * (1 - 0.3 * lt) * PS;
        c.globalAlpha = 1 - lt * lt * lt;
        c.fillStyle = D.col[k];
        c.fillRect(PX - (g.cs * sz) / 2, PY - (g.csy * sz) / 2, g.cs * sz, g.csy * sz);
      }
      // glitter riding the vortex, tinted by the colour of the pixel it came from
      for (let k = 0; k < g.count; k++) {
        const sp = D.spark[k];
        if (!sp || p < D.t0[k]) continue;
        const a = tau - D.t0[k] * T;
        const lt = a / D.life[k];
        if (lt >= 1) continue;
        const rho0 = D.rho0[k];
        const rho = rho0 * (1 + 0.16 * a) + 10 * a;
        const th = D.th0[k] + (0.6 + 3.6 * (110 / (rho0 + 110))) * a;
        const ramp = Math.min(1, a * 1.4);
        projPt(
          vx + Math.cos(th) * rho + 22 * a * a + pose0.x,
          vy + Math.sin(th) * rho * 0.82 - 20 * a * a + Math.sin(a * 3.1 + D.ph[k]) * 8 * a + pose0.y,
          Math.sin(th * 1.3 + D.ph[k]) * rho * 0.5 * ramp - 110 * a + pose0.z,
        );
        spark(PX, PY, g.cs * (3 + 2.2 * ramp) * PS, ramp * (1 - lt) * twinkle(a, D.ph[k]), sp - 1);
      }
      c.globalAlpha = 1;
    }

    /** Stardust reform: the print bursts into a swirling 3D galaxy of dust that re-forms as the next one. */
    function drawReformFx(p: number, t: number) {
      const F = reform!;
      const { g, K } = F;
      const c = ctx!;
      const T = DUR.reform;
      const poseB = restPose(t);
      const gEnv = Math.sin(Math.PI * seg(p, 0.06, 0.9));
      const spin = p * 1.3;

      drawShadowSprite(lerpPose(pose0, poseB, p), 0.24 * Math.max(1 - seg(p, 0, 0.18), seg(p, 0.8, 1)));
      // a warm bloom at the heart of the swirl
      if (gEnv > 0.02) {
        projPt(pose0.x, pose0.y, pose0.z);
        const rr = Math.max(sheet.w, sheet.h) * 0.7 * PS;
        const rg = c.createRadialGradient(PX, PY, 0, PX, PY, rr);
        rg.addColorStop(0, `rgba(255,214,120,${(0.34 * gEnv).toFixed(3)})`);
        rg.addColorStop(0.45, `rgba(255,194,61,${(0.12 * gEnv).toFixed(3)})`);
        rg.addColorStop(1, "rgba(255,194,61,0)");
        c.fillStyle = rg;
        c.fillRect(PX - rr, PY - rr, rr * 2, rr * 2);
      }

      const sx: number[] = [];
      for (let k = 0; k < g.count; k++) {
        const q = eio(seg(p, F.d[k], F.d[k] + 0.64));
        const env = Math.sin(Math.PI * q);
        const bx = lerp(g.x[k], F.tx[k], q);
        const by = lerp(g.y[k], F.ty[k], q);
        const an = F.ang[k] + F.spin[k] * q + spin;
        const R = F.R[k];
        const x = lerp(bx, Math.cos(an) * R, env);
        const y = lerp(by, F.yb[k] + Math.sin(an) * R * 0.2 + Math.sin(an * 2 + F.ph[k]) * 10, env);
        const z = Math.sin(an) * R * 0.9 * env - 50 * env;
        projPt(x + lerp(pose0.x, poseB.x, q), y + lerp(pose0.y, poseB.y, q), z);
        const sz = (1.05 - 0.62 * env) * PS;
        c.globalAlpha = 1;
        c.fillStyle = F.col[k * K + Math.round(q * (K - 1))];
        c.fillRect(PX - (g.cs * sz) / 2, PY - (g.csy * sz) / 2, g.cs * sz, g.csy * sz);
        if (F.spark[k] && env > 0.05) sx.push(PX, PY, PS, env, k);
      }
      for (let i = 0; i < sx.length; i += 5) {
        const k = sx[i + 4];
        spark(sx[i], sx[i + 1], g.cs * 3.6 * sx[i + 2], Math.pow(sx[i + 3], 1.4) * twinkle(p * T, F.ph[k]), F.spark[k] - 1);
      }
      c.globalAlpha = 1;
      // crisp prints at both ends hide the pixel grid
      const aOut = 1 - seg(p, 0.02, 0.16);
      if (aOut > 0) drawSheet(cur, pose0, aOut, false);
      const aIn = seg(p, 0.84, 0.97);
      if (aIn > 0) drawSheet(cur + 1, poseB, aIn, false);
    }

    /** Shard burst: cracks race out from an impact point, then the print bursts into 3D shards. */
    function drawShatterFx(p: number) {
      const S = shards!;
      const tex = getTex(cur)!;
      const c = ctx!;
      const T = DUR.shatter;
      const CR = 0.16;
      const pc = eout(seg(p, 0, CR));
      const tau = (p - CR) * T;
      const alpha = 1 - seg(p, 0.74, 1);
      const shake = p < CR ? Math.sin(p * 260) * 1.6 * pc : 0;
      drawShadowSprite(pose0, 0.24 * (1 - seg(p, CR, CR + 0.2)));

      const drawn = S.list.map((s) => {
        const tt = Math.max(0, tau - s.delay);
        let world: P3[];
        if (tt <= 0) {
          const gap = 2.4 * pc;
          world = s.pts.map((q) => off([q.x + s.dx * gap + shake, q.y + s.dy * gap, 0]));
        } else {
          const ang = s.om * tt;
          const tx = s.cx + s.vx * tt;
          const ty = s.cy + s.vy * tt + 430 * tt * tt;
          const tz = Math.max(-1100, s.vz * tt);
          world = s.pts.map((q) => {
            const r = rotAxis(q.x - s.cx, q.y - s.cy, 0, s.kx, s.ky, s.kz, ang);
            return off([tx + r[0], ty + r[1], tz + r[2]]);
          });
        }
        return { s, world, z: world.reduce((a, q) => a + q[2], 0) / world.length, moving: tt > 0 };
      });
      drawn.sort((a, b) => b.z - a.z);
      for (const it of drawn) {
        drawPoly(
          it.world,
          it.s.pts.map((q) => [q.u, q.v] as UV),
          tex,
          null,
          alpha,
          undefined,
          1.5,
        );
        // cut edges catch the light like glass
        const sp = it.world.map((q) => proj(view(q)));
        c.save();
        c.globalAlpha = alpha * (it.moving ? 0.9 : pc);
        tracePath(sp);
        c.lineJoin = "round";
        c.strokeStyle = "rgba(255,253,248,.95)";
        c.lineWidth = it.moving ? 1.4 : 1.2;
        c.stroke();
        c.restore();
      }
      // print crumbs
      for (const b of S.bits) {
        const tt = tau - b.delay;
        if (tt <= 0) continue;
        const lt = tt / b.life;
        if (lt >= 1) continue;
        projPt(b.x + b.vx * tt + pose0.x, b.y + b.vy * tt + 380 * tt * tt + pose0.y, b.vz * tt + pose0.z);
        const s = b.s * PS;
        c.globalAlpha = 1 - lt;
        c.fillStyle = b.col;
        c.fillRect(PX - s / 2, PY - s / 2, s, s);
      }
      // impact flash and glints thrown from it
      projPt(S.ix + pose0.x, S.iy + pose0.y, pose0.z);
      const fl = Math.sin(Math.PI * seg(p, 0.05, 0.3));
      spark(PX, PY, Math.min(sheet.w, 260) * (0.4 + 0.6 * fl), fl, S.hue);
      for (const s of S.sparks) {
        const tt = tau + 0.05;
        if (tt <= 0) continue;
        const lt = tt / s.life;
        if (lt >= 1) continue;
        projPt(S.ix + s.vx * tt + pose0.x, S.iy + s.vy * tt + 300 * tt * tt + pose0.y, s.vz * tt + pose0.z);
        spark(PX, PY, s.s * PS * (1 - lt * 0.5), (1 - lt) * twinkle(tt, s.ph), s.hue);
      }
      c.globalAlpha = 1;
    }

    /** Mosaic ripple: tiles flip in a wave from one corner, each revealing its piece of the next print. */
    function drawMosaicFx(p: number, t: number) {
      const M = tiles!;
      const texA = getTex(cur)!;
      const texB = getTex(cur + 1)!;
      const poseB = restPose(t);
      drawShadowSprite(lerpPose(pose0, poseB, p), 0.24);
      const faces: Face[] = [];
      const glints: number[] = [];
      for (const tl of M.list) {
        const f = eio(seg(p, tl.d, tl.d + 0.42));
        const th = f * Math.PI * tl.sgn;
        const wave = Math.sin(Math.PI * f);
        const lift = -wave * 78;
        const sc = 1 - 0.1 * wave;
        const ox = lerp(pose0.x, poseB.x, f);
        const oy = lerp(pose0.y, poseB.y, f);
        const ct = Math.cos(th);
        const st = Math.sin(th);
        const pt = (lx: number, ly: number): P3 => {
          lx *= sc;
          ly *= sc;
          if (tl.vert) return [tl.cx + lx * ct + ox, tl.cy + ly + oy, lx * st + lift];
          return [tl.cx + lx + ox, tl.cy + ly * ct + oy, ly * st + lift];
        };
        const { hw, hh, ua, ub, va, vb } = tl;
        faces.push({
          world: [pt(-hw, -hh), pt(hw, -hh), pt(hw, hh), pt(-hw, hh)],
          uv: [
            [ua, va],
            [ub, va],
            [ub, vb],
            [ua, vb],
          ],
          // the back carries the next print, mirrored across the flip axis
          uvBack: tl.vert
            ? [
                [ub, va],
                [ua, va],
                [ua, vb],
                [ub, vb],
              ]
            : [
                [ua, vb],
                [ub, vb],
                [ub, va],
                [ua, va],
              ],
        });
        if (tl.spark && wave > 0.2) glints.push(tl.cx + ox, tl.cy + oy - hh * 0.6 * ct, lift, wave);
      }
      drawFaces(faces, texA, texB, 1, 1.6);
      for (let i = 0; i < glints.length; i += 4) {
        projPt(glints[i], glints[i + 1], glints[i + 2]);
        spark(PX, PY, Math.min(sheet.w, sheet.h) * 0.26 * PS, Math.pow(glints[i + 3], 5), 0);
      }
      ctx!.globalAlpha = 1;
    }

    function drawStripsFx(p: number) {
      const { w, h } = sheet;
      const texA = getTex(cur)!;
      const texB = getTex(cur + 1)!;
      const N = coarse ? 7 : 11;
      const R = 3;
      drawShadowSprite(pose0, 0.24);
      const faces: Face[] = [];
      const glints: number[] = [];
      for (let i = 0; i < N; i++) {
        const ua = i / N;
        const ub = (i + 1) / N;
        const xa = -w / 2 + ua * w;
        const xb = -w / 2 + ub * w;
        const xc = (xa + xb) / 2;
        const hw = (xb - xa) / 2;
        const di = (i / (N - 1)) * 0.42;
        const th = eio(seg(p, di, di + 0.58)) * Math.PI;
        const bulge = -Math.sin(th) * 46;
        const lx = xc - hw * Math.cos(th);
        const lz = -hw * Math.sin(th) + bulge;
        const rx = xc + hw * Math.cos(th);
        const rz = hw * Math.sin(th) + bulge;
        for (let r = 0; r < R; r++) {
          const va = r / R;
          const vb = (r + 1) / R;
          const ya = -h / 2 + va * h;
          const yb = -h / 2 + vb * h;
          faces.push({
            world: [off([lx, ya, lz]), off([rx, ya, rz]), off([rx, yb, rz]), off([lx, yb, lz])],
            uv: [
              [ua, va],
              [ub, va],
              [ub, vb],
              [ua, vb],
            ],
            uvBack: [
              [ub, va],
              [ua, va],
              [ua, vb],
              [ub, vb],
            ],
          });
        }
        const sw = Math.sin(th);
        if (sw > 0.25) glints.push(lx, -h / 2 + h * (0.18 + ((i * 0.37) % 0.64)), lz, sw);
      }
      drawFaces(faces, texA, texB, 1, 1.5);
      for (let i = 0; i < glints.length; i += 4) {
        projPt(glints[i] + pose0.x, glints[i + 1] + pose0.y, glints[i + 2] + pose0.z);
        spark(PX, PY, 46 * PS, Math.pow(glints[i + 3], 6), 0);
      }
      ctx!.globalAlpha = 1;
    }

    /** A point on the curling page: u along the width (0 = spine), v down the height. */
    function curlPt(e: number, u: number, v: number): P3 {
      const { w, h } = sheet;
      const beta = 1.7 * Math.sin(Math.PI * e);
      const dd = u * w;
      const th = Math.min(Math.PI, Math.max(0, e * Math.PI + (v - 0.5) * 0.6 * Math.sin(Math.PI * e)));
      let x: number;
      let z: number;
      if (beta < 1e-3) {
        x = -w / 2 + dd * Math.cos(th);
        z = -dd * Math.sin(th);
      } else {
        x = -w / 2 + (w / beta) * (Math.sin(th + (beta * dd) / w) - Math.sin(th));
        z = -(w / beta) * (Math.cos(th) - Math.cos(th + (beta * dd) / w));
      }
      // a flatter arc keeps the lifted page elegant instead of ballooning toward the lens
      return [x, -h / 2 + v * h, z * 0.5];
    }

    function drawPageFx(p: number) {
      const tex = getTex(cur)!;
      const e = eio(p);
      const nx = coarse ? 12 : 18;
      const ny = coarse ? 6 : 8;
      const grid: P3[][] = [];
      for (let j = 0; j <= ny; j++) {
        const row: P3[] = [];
        for (let i = 0; i <= nx; i++) row.push(off(curlPt(e, i / nx, j / ny)));
        grid.push(row);
      }
      const alpha = 1 - seg(p, 0.82, 1);
      // the lifting page casts a soft shadow onto the next print
      const outline: P3[] = [...grid[0], ...grid.map((r) => r[nx]), ...grid[ny].slice().reverse(), ...grid.map((r) => r[0]).reverse()].map(
        (q) => [q[0], q[1], 0] as P3,
      );
      shadowPoly(outline, 24, 0.18 * Math.sin(Math.PI * e) + 0.06 * (1 - e), 24);
      const faces: Face[] = [];
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const u0 = i / nx;
          const u1 = (i + 1) / nx;
          const v0 = j / ny;
          const v1 = (j + 1) / ny;
          faces.push({
            world: [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1]],
            uv: [
              [u0, v0],
              [u1, v0],
              [u1, v1],
            ],
          });
          faces.push({
            world: [grid[j][i], grid[j + 1][i + 1], grid[j + 1][i]],
            uv: [
              [u0, v0],
              [u1, v1],
              [u0, v1],
            ],
          });
        }
      }
      // glossy stock: the sheen rolls across the curl as the page turns
      drawFaces(faces, tex, null, alpha, 1.1);
      // golden dust shaken off the free edge
      const T = DUR.pageTurn;
      for (const d of page!.dust) {
        if (p < d.b) continue;
        const a = (p - d.b) * T;
        const lt = a / d.life;
        if (lt >= 1) continue;
        const s0 = curlPt(eio(d.b), 1, d.v);
        projPt(s0[0] + d.vx * a + pose0.x, s0[1] + d.vy * a + 120 * a * a + pose0.y, s0[2] + d.vz * a + pose0.z);
        spark(PX, PY, d.s * PS, (1 - lt) * twinkle(a, d.ph) * alpha, d.hue);
      }
      ctx!.globalAlpha = 1;
    }

    /* ---------- loop ---------- */

    function measure() {
      const cr = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cr.width;
      H = cr.height;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const a = anchorRef.current?.getBoundingClientRect();
      if (a && a.width > 0) {
        if (Math.abs(a.width - sheet.w) > 1 || Math.abs(a.height - sheet.h) > 1) {
          texCache.clear();
          backTex = null;
          shadowSprite = null;
        }
        sheet.cx = a.left - cr.left + a.width / 2;
        sheet.cy = a.top - cr.top + a.height / 2;
        sheet.w = a.width;
        sheet.h = a.height;
      }
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!sheet.w) return;
      const t = now / 1000;
      for (let k = 0; k < 4; k++) load(cur + k);

      if (coarse || reduce) {
        tilt.ty = reduce ? 0 : Math.sin(t * 0.4) * 0.05;
        tilt.tx = reduce ? 0 : Math.cos(t * 0.33) * 0.03;
      }
      tilt.x += (tilt.tx - tilt.x) * 0.06;
      tilt.y += (tilt.ty - tilt.y) * 0.06;
      cyR = Math.cos(tilt.y);
      syR = Math.sin(tilt.y);
      cxR = Math.cos(-tilt.x);
      sxR = Math.sin(-tilt.x);

      ctx!.clearRect(0, 0, W, H);
      const el = (now - tStart) / 1000;
      const bar = progressRef.current;

      if (phase === "hold") {
        if (paused) tStart = now - Math.min(el, hold) * 1000;
        if (bar) bar.style.transform = `scaleX(${Math.min(1, el / hold).toFixed(3)})`;
        if (!paused && el >= hold && startTransition(now)) {
          drawFrameTrans(0, t);
          return;
        }
        drawStack(0, t);
        drawSheet(cur, restPose(t));
        return;
      }
      if (bar) bar.style.transform = "scaleX(1)";
      const p = dbg.p ?? clamp01(el / DUR[tech]);
      drawFrameTrans(p, t);
      if (p >= 1) {
        cur = idx(cur + 1);
        phase = "hold";
        tStart = now;
        tear = null;
        dust = null;
        reform = null;
        shards = null;
        tiles = null;
        page = null;
        changeRef.current(cur, techOf(cur));
      }
    }

    function drawFrameTrans(p: number, t: number) {
      const settle = seg(p, SETTLE_AT[tech], Math.min(1, SETTLE_AT[tech] + 0.62));
      drawStack(settle, t, !!SELF_REVEAL[tech]);
      switch (tech) {
        case "tear":
          return drawTearFx(p);
        case "particles":
          return drawDriftFx(p);
        case "reform":
          return drawReformFx(p, t);
        case "shatter":
          return drawShatterFx(p);
        case "mosaic":
          return drawMosaicFx(p, t);
        case "strips":
          return drawStripsFx(p);
        case "pageTurn":
          return drawPageFx(p);
        default:
          return drawSheet(cur, pose0, 1 - eio(p));
      }
    }

    const start = () => {
      if (running) return;
      running = true;
      if (phase === "hold") tStart = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointer = (e: PointerEvent) => {
      if (coarse) return;
      const cr = canvas.getBoundingClientRect();
      const px = (e.clientX - (cr.left + sheet.cx)) / Math.max(1, W);
      const py = (e.clientY - (cr.top + sheet.cy)) / Math.max(1, H);
      tilt.ty = Math.max(-0.5, Math.min(0.5, px)) * 0.34;
      tilt.tx = Math.max(-0.5, Math.min(0.5, py)) * 0.26;
    };

    // ?fxdebug exposes a deterministic seek for visual testing of each technique
    if (location.search.includes("fxdebug")) {
      (window as unknown as { __fx: unknown }).__fx = {
        run: (k: Technique) => {
          phase = "hold";
          dbg.p = 0;
          dbg.tech = k;
          return startTransition(performance.now());
        },
        seek: (p: number) => {
          dbg.p = p;
        },
      };
    }

    controlRef.current = {
      next: () => {
        if (phase === "hold") startTransition(performance.now());
      },
      prev: () => {
        if (phase !== "hold") return;
        cur = idx(cur - 1);
        load(cur);
        tStart = performance.now();
        changeRef.current(cur, techOf(cur));
      },
      setPaused: (v: boolean) => {
        paused = v;
      },
    };

    measure();
    changeRef.current(cur, techOf(cur));
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    if (anchorRef.current) ro.observe(anchorRef.current);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(canvas);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.fonts?.ready.then(() => {
      texCache.clear();
      backTex = null;
    });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      controlRef.current = null;
    };
  }, [items, anchorRef, progressRef, controlRef]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none block ${className}`} />;
}
