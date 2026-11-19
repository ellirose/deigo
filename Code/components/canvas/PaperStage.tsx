"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type { Cat, WorkItem } from "@/lib/work";

/* ─────────────────────────────────────────────────────────────────────────────
   PaperStage — every project is printed on a sheet of paper. Each sheet leaves the
   stack with a technique that suits its discipline: brand marks fold into paper
   planes, posters turn like magazine pages, web prints tear apart, apps dissolve
   into pixels, illustrations flip as 3D shutters, uniforms fold like garments.
   Everything is real geometry: textured polygons projected with perspective.
   ───────────────────────────────────────────────────────────────────────────── */

export type Technique = "plane" | "pageTurn" | "tear" | "particles" | "strips" | "fold" | "fade";
export type StageHandle = { next: () => void; prev: () => void; setPaused: (p: boolean) => void };

export function techniqueFor(item: WorkItem, index: number): Technique {
  switch (item.cat) {
    case "web":
      return "tear";
    case "app":
      return "particles";
    case "brand":
      return "plane";
    case "poster":
    case "fashion":
      return "pageTurn";
    case "illustration":
      return "strips";
    case "apparel":
      return (["fold", "plane", "particles"] as const)[index % 3];
  }
}

const HOLD = 3.2;
const DUR: Record<Technique, number> = { plane: 4.8, pageTurn: 2.2, tear: 2.4, particles: 2.9, strips: 2.3, fold: 3.3, fade: 1.2 };
const SETTLE_AT: Record<Technique, number> = { plane: 0.12, pageTurn: 0.12, tear: 0.22, particles: 0.06, strips: 0, fold: 0.18, fade: 0 };
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

type P3 = [number, number, number];
type UV = [number, number];
type V = { x: number; y: number; u: number; v: number };
type Line = { px: number; py: number; dx: number; dy: number; fs: number };
type Piece = { pts: V[]; layer: number; tag: number };
type Pose = { x: number; y: number; z: number; rz: number; s: number };
type Tex = HTMLCanvasElement;
type Face = { world: P3[]; uv: UV[]; uvBack?: UV[] };

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const ein = (x: number) => x * x * x;
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
  rz: lerp(a.rz, b.rz, t),
  s: lerp(a.s, b.s, t),
});

/* ---------- 2D fold geometry (pure) ---------- */

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

/** Splits a polygon by a line; returns [side ≥ 0, side ≤ 0]. */
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

function makeLine(px: number, py: number, qx: number, qy: number, sx: number, sy: number): Line {
  let dx = qx - px;
  let dy = qy - py;
  const l = Math.hypot(dx, dy) || 1;
  dx /= l;
  dy /= l;
  return { px, py, dx, dy, fs: Math.sign(dx * (sy - py) - dy * (sx - px)) || 1 };
}

function reflect(q: V, L: Line): V {
  const nx = -L.dy;
  const ny = L.dx;
  const d = (q.x - L.px) * nx + (q.y - L.py) * ny;
  return { x: q.x - 2 * d * nx, y: q.y - 2 * d * ny, u: q.u, v: q.v };
}

/** Splits pieces by the step's fold lines, tags the moving side, and bakes the flat result. */
function bakeStep(pieces: Piece[], lines: Line[]) {
  let curr: Piece[] = pieces.map((p) => ({ ...p, tag: -1 }));
  lines.forEach((L, li) => {
    const out: Piece[] = [];
    for (const pc of curr) {
      if (pc.tag !== -1) {
        out.push(pc);
        continue;
      }
      const [A, B] = split(pc.pts, L);
      const foldPts = L.fs > 0 ? A : B;
      const keepPts = L.fs > 0 ? B : A;
      if (Math.abs(area2(foldPts)) > 0.5) out.push({ pts: foldPts, layer: pc.layer, tag: li });
      if (Math.abs(area2(keepPts)) > 0.5) out.push({ pts: keepPts, layer: pc.layer, tag: -1 });
    }
    curr = out;
  });
  const maxL = Math.max(...curr.map((p) => p.layer));
  const baked: Piece[] = curr.map((pc) => {
    if (pc.tag === -1) return { pts: pc.pts, layer: pc.layer, tag: -1 };
    const L = lines[pc.tag];
    const gMax = Math.max(...curr.filter((q) => q.tag === pc.tag).map((q) => q.layer));
    return { pts: pc.pts.map((q) => reflect(q, L)), layer: maxL + 1 + (gMax - pc.layer), tag: -1 };
  });
  return { tagged: curr, lines, baked };
}

/** Rotates a point on the fold side about the line, lifting it toward the camera. */
function foldPoint(q: V, L: Line, phi: number, z0: number): P3 {
  const nx = -L.dy * L.fs;
  const ny = L.dx * L.fs;
  const rx = q.x - L.px;
  const ry = q.y - L.py;
  const a = rx * L.dx + ry * L.dy;
  const b = rx * nx + ry * ny;
  const c = Math.cos(phi);
  return [L.px + a * L.dx + b * c * nx, L.py + a * L.dy + b * c * ny, z0 - b * Math.sin(phi)];
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

    // per-transition data
    let pose0: Pose = { x: 0, y: 0, z: 0, rz: 0, s: 1 };
    let tear: { jag: { x: number; y: number }[]; left: V[]; right: V[]; pv: { x: number; y: number } } | null = null;
    let part: {
      count: number;
      x0: Float32Array;
      y0: Float32Array;
      t0: Float32Array;
      vx: Float32Array;
      vy: Float32Array;
      vz: Float32Array;
      ph: Float32Array;
      life: Float32Array;
      col: string[];
      rowNoise: Float32Array;
      rows: number;
      cs: number;
    } | null = null;
    let fold: { steps: ReturnType<typeof bakeStep>[]; final: Piece[]; regions: number[]; wx: number } | null = null;

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
      const g = c.getContext("2d")!;
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

    /** Draws a planar textured polygon with lambert shading and correct front/back texture. */
    function drawPoly(world: P3[], uv: UV[], front: Tex, back: Tex | null, alpha = 1, uvBack?: UV[]) {
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

    function drawFaces(faces: Face[], front: Tex, back: Tex | null, alpha = 1) {
      // Depth-sort in stage space (before the pointer tilt): the tilt is a rigid rotation, but it
      // would swamp the sub-pixel offsets that keep folded paper layers in the right order.
      const sorted = faces
        .map((f) => ({ f, z: f.world.reduce((s, p) => s + p[2], 0) / f.world.length }))
        .sort((a, b) => b.z - a.z);
      for (const { f } of sorted) drawPoly(f.world, f.uv, front, back, alpha, f.uvBack);
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
      if (tex) drawPoly(c, UVQ, tex, null, alpha);
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
      tear = { jag, left, right, pv: jag[N] };
    }

    function initParticles() {
      const tex = getTex(cur)!;
      const g = tex.getContext("2d")!;
      const data = g.getImageData(0, 0, tex.width, tex.height).data;
      const { w, h } = sheet;
      const cols = coarse ? 44 : 66;
      const cs = w / cols;
      const rows = Math.ceil(h / cs);
      const count = cols * rows;
      const rowNoise = new Float32Array(rows).map(() => Math.random());
      const P = {
        count,
        x0: new Float32Array(count),
        y0: new Float32Array(count),
        t0: new Float32Array(count),
        vx: new Float32Array(count),
        vy: new Float32Array(count),
        vz: new Float32Array(count),
        ph: new Float32Array(count),
        life: new Float32Array(count),
        col: new Array<string>(count),
        rowNoise,
        rows,
        cs,
      };
      let k = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = -w / 2 + (c + 0.5) * cs;
          const y = Math.min(h / 2 - cs / 2, -h / 2 + (r + 0.5) * cs);
          const px = Math.min(tex.width - 1, Math.floor((x / w + 0.5) * tex.width));
          const py = Math.min(tex.height - 1, Math.floor((y / h + 0.5) * tex.height));
          const o = (py * tex.width + px) * 4;
          P.x0[k] = x;
          P.y0[k] = y;
          P.col[k] = `rgb(${data[o]},${data[o + 1]},${data[o + 2]})`;
          const u = c / (cols - 1);
          P.t0[k] = ((u + 0.3 * rowNoise[r]) / 1.3) * 0.8;
          P.vx[k] = 110 + Math.random() * 280;
          P.vy[k] = -50 - Math.random() * 210;
          P.vz[k] = -280 + Math.random() * 220;
          P.ph[k] = Math.random() * 6.283;
          P.life[k] = 0.9 + Math.random() * 0.9;
          k++;
        }
      }
      part = P;
    }

    function rectPiece(): Piece {
      const { w, h } = sheet;
      return {
        pts: [
          { x: -w / 2, y: -h / 2, u: 0, v: 0 },
          { x: w / 2, y: -h / 2, u: 1, v: 0 },
          { x: w / 2, y: h / 2, u: 1, v: 1 },
          { x: -w / 2, y: h / 2, u: 0, v: 1 },
        ],
        layer: 0,
        tag: -1,
      };
    }

    function initPlane() {
      const { w, h } = sheet;
      const top = -h / 2;
      const s1 = bakeStep(
        [rectPiece()],
        [makeLine(0, top, -w / 2, top + w / 2, -w / 2, top), makeLine(0, top, w / 2, top + w / 2, w / 2, top)],
      );
      const a = (22.5 * Math.PI) / 180;
      const s2 = bakeStep(s1.baked, [
        makeLine(0, top, -Math.sin(a) * h, top + Math.cos(a) * h, -w / 2, 0),
        makeLine(0, top, Math.sin(a) * h, top + Math.cos(a) * h, w / 2, 0),
      ]);
      const wx = w * 0.11;
      let fin = s2.baked;
      for (const lx of [-wx, 0, wx]) {
        const out: Piece[] = [];
        for (const pc of fin) {
          const [A, B] = split(pc.pts, { px: lx, py: 0, dx: 0, dy: 1 });
          if (Math.abs(area2(A)) > 0.5) out.push({ pts: A, layer: pc.layer, tag: -1 });
          if (Math.abs(area2(B)) > 0.5) out.push({ pts: B, layer: pc.layer, tag: -1 });
        }
        fin = out;
      }
      const regions = fin.map((pc) => {
        const cx = pc.pts.reduce((s, q) => s + q.x, 0) / pc.pts.length;
        return cx < -wx ? 0 : cx < 0 ? 1 : cx < wx ? 2 : 3;
      });
      fold = { steps: [s1, s2], final: fin, regions, wx };
    }

    function initFold() {
      const { w, h } = sheet;
      const s1 = bakeStep([rectPiece()], [makeLine(-w / 2, 0, w / 2, 0, 0, -h / 2)]);
      const s2 = bakeStep(s1.baked, [makeLine(0, -h / 2, 0, h / 2, -w / 2, 0)]);
      fold = { steps: [s1, s2], final: s2.baked, regions: [], wx: 0 };
    }

    function startTransition(now: number) {
      if (!getTex(cur) || !getTex(cur + 1)) return false;
      tech = techOf(cur);
      pose0 = restPose(now / 1000);
      if (tech === "tear") initTear();
      if (tech === "particles") initParticles();
      if (tech === "plane") initPlane();
      if (tech === "fold") initFold();
      phase = "trans";
      tStart = now;
      return true;
    }

    /* ---------- transition renderers ---------- */

    const off = (p: P3): P3 => [p[0] + pose0.x, p[1] + pose0.y, p[2] + pose0.z];

    function stepFaces(step: ReturnType<typeof bakeStep>, phi: number, map?: (p: P3) => P3): Face[] {
      return step.tagged.map((pc) => {
        const z0 = -pc.layer * 0.9;
        const world = pc.pts.map((q) => {
          const p: P3 = pc.tag >= 0 ? foldPoint(q, step.lines[pc.tag], phi, z0) : [q.x, q.y, z0];
          return map ? map(p) : off(p);
        });
        return { world, uv: pc.pts.map((q) => [q.u, q.v] as UV) };
      });
    }

    function drawTearFx(p: number) {
      const d = tear!;
      const tex = getTex(cur)!;
      const a = eio(seg(p, 0, 0.28));
      const b = ein(seg(p, 0.2, 1));
      const alpha = 1 - seg(p, 0.8, 1);
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
        );
        // fibrous torn edge
        const edge = d.jag.map((q) => proj(view(tf(q))));
        const c = ctx!;
        c.save();
        c.globalAlpha = alpha;
        c.lineJoin = "round";
        c.beginPath();
        edge.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.strokeStyle = "rgba(255,253,248,.95)";
        c.lineWidth = 3.2;
        c.stroke();
        c.strokeStyle = "rgba(28,43,39,.16)";
        c.lineWidth = 1;
        c.translate(side * 1.6, 0.6);
        c.stroke();
        c.restore();
      }
    }

    function drawParticlesFx(p: number) {
      const P = part!;
      const { w, h } = sheet;
      const T = DUR.particles;
      const c = ctx!;
      // what is left of the print, behind a ragged dissolving front
      const pts: P3[] = [off([w / 2, -h / 2, 0])];
      for (let r = 0; r < P.rows; r++) {
        const bu = (p / 0.8) * 1.3 - 0.3 * P.rowNoise[r];
        const bx = Math.max(-w / 2, Math.min(w / 2, -w / 2 + bu * w));
        const y0 = -h / 2 + r * P.cs;
        const y1 = Math.min(h / 2, y0 + P.cs);
        pts.push(off([bx, y0, 0]), off([bx, y1, 0]));
      }
      pts.push(off([w / 2, h / 2, 0]));
      c.save();
      tracePath(pts.map((q) => proj(view(q))));
      c.clip();
      drawSheet(cur, pose0, 1, false);
      c.restore();

      for (let i = 0; i < P.count; i++) {
        if (p < P.t0[i]) continue;
        const age = (p - P.t0[i]) * T;
        const lt = age / P.life[i];
        if (lt >= 1) continue;
        const x = P.x0[i] + P.vx[i] * age + Math.sin(age * 2.6 + P.ph[i]) * 16 * age;
        const y = P.y0[i] + P.vy[i] * age - 40 * age * age;
        const z = P.vz[i] * age;
        const vp = view(off([x, y, z]));
        const sc = FOCAL / (FOCAL + vp[2]);
        const [sx, sy] = proj(vp);
        const size = P.cs * 1.06 * (1 - lt * 0.55) * sc;
        c.globalAlpha = (1 - lt) * (1 - lt * 0.3);
        c.fillStyle = P.col[i];
        c.fillRect(sx - size / 2, sy - size / 2, size, size);
      }
      c.globalAlpha = 1;
    }

    function drawStripsFx(p: number) {
      const { w, h } = sheet;
      const texA = getTex(cur)!;
      const texB = getTex(cur + 1)!;
      const N = coarse ? 7 : 11;
      const R = 3;
      drawShadowSprite(pose0, 0.24);
      const faces: Face[] = [];
      for (let i = 0; i < N; i++) {
        const ua = i / N;
        const ub = (i + 1) / N;
        const xa = -w / 2 + ua * w;
        const xb = -w / 2 + ub * w;
        const xc = (xa + xb) / 2;
        const hw = (xb - xa) / 2;
        const di = (i / (N - 1)) * 0.42;
        const th = eio(seg(p, di, di + 0.58)) * Math.PI;
        const bulge = -Math.sin(th) * 38;
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
      }
      drawFaces(faces, texA, texB);
    }

    function drawPageFx(p: number) {
      const { w, h } = sheet;
      const tex = getTex(cur)!;
      const e = eio(p);
      const nx = coarse ? 12 : 18;
      const ny = coarse ? 6 : 8;
      const beta = 1.7 * Math.sin(Math.PI * e);
      const grid: P3[][] = [];
      for (let j = 0; j <= ny; j++) {
        const row: P3[] = [];
        for (let i = 0; i <= nx; i++) {
          const dd = (i / nx) * w;
          const th = Math.min(Math.PI, Math.max(0, e * Math.PI + (j / ny - 0.5) * 0.6 * Math.sin(Math.PI * e)));
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
          row.push(off([x, -h / 2 + (j / ny) * h, z * 0.5]));
        }
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
      drawFaces(faces, tex, null, alpha);
    }

    function drawPlaneFx(p: number) {
      const F = fold!;
      const tex = getTex(cur)!;
      const f1 = eio(seg(p, 0, 0.16));
      const f2 = eio(seg(p, 0.18, 0.34));
      const f3 = eio(seg(p, 0.37, 0.55));
      const fly = seg(p, 0.56, 1);
      if (p < 0.17) return drawFaces(stepFaces(F.steps[0], f1 * Math.PI), tex, null);
      if (p < 0.355) return drawFaces(stepFaces(F.steps[1], f2 * Math.PI), tex, null);

      const sA = eio(seg(fly, 0, 0.4));
      const sc = 1 - 0.3 * f3 - 0.18 * sA;
      const ac = f3 * 1.42;
      const e1 = Math.pow(fly, 1.6);
      const T: P3 = [
        (W - sheet.cx + 320) * e1,
        -(sheet.cy + 320) * Math.pow(fly, 1.9) + 80 * Math.sin(Math.PI * Math.min(1, fly * 1.3)) - 26 * f3,
        520 * fly,
      ];
      const wob = Math.sin(fly * 9) * 0.12 * fly;
      const a = -Math.PI / 2 * sA + wob;
      const b = 1.2 * sA;
      const g = -0.34 * sA;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const cb = Math.cos(b);
      const sb = Math.sin(b);
      const cg = Math.cos(g);
      const sg = Math.sin(g);
      const faces: Face[] = F.final.map((pc, k) => {
        const wing = F.regions[k] === 0 || F.regions[k] === 3;
        const world = pc.pts.map((q) => {
          const sgn = q.x < 0 ? -1 : 1;
          let ax = Math.abs(q.x);
          let z = -pc.layer * 0.9;
          if (wing) {
            const dx = ax - F.wx;
            ax = F.wx + dx * Math.cos(ac);
            z += -dx * Math.sin(ac);
          }
          const ax2 = ax * Math.cos(ac) - z * Math.sin(ac);
          const z2 = ax * Math.sin(ac) + z * Math.cos(ac);
          const x = sgn * ax2 * sc;
          const y = q.y * sc;
          const zz = z2 * sc;
          const y1 = y * ca - zz * sa;
          const z1 = y * sa + zz * ca;
          const x2 = x * cb + z1 * sb;
          const z3 = -x * sb + z1 * cb;
          const x3 = x2 * cg - y1 * sg;
          const y3 = x2 * sg + y1 * cg;
          return off([x3 + T[0], y3 + T[1], z3 + T[2]]);
        });
        return { world, uv: pc.pts.map((q) => [q.u, q.v] as UV) };
      });
      drawFaces(faces, tex, null);
    }

    function drawFoldFx(p: number) {
      const F = fold!;
      const tex = getTex(cur)!;
      const f1 = eio(seg(p, 0, 0.3));
      const f2 = eio(seg(p, 0.32, 0.6));
      const ex = seg(p, 0.62, 1);
      if (p < 0.31) return drawFaces(stepFaces(F.steps[0], f1 * Math.PI), tex, null);
      if (p < 0.61) return drawFaces(stepFaces(F.steps[1], f2 * Math.PI), tex, null);
      const e = eio(ex);
      const pcx = sheet.w / 4;
      const pcy = sheet.h / 4;
      const rz = 0.42 * e;
      const cr = Math.cos(rz);
      const sr = Math.sin(rz);
      const lift = -34 * Math.sin(Math.PI * Math.min(1, ex * 2)) * (1 - ex);
      const ty = (H - sheet.cy + sheet.h) * e * e * 0.95 + lift;
      const tx = sheet.w * 0.18 * e;
      const alpha = 1 - seg(ex, 0.75, 1);
      const faces: Face[] = F.final.map((pc) => ({
        world: pc.pts.map((q) => {
          const rx = q.x - pcx;
          const ry = q.y - pcy;
          return off([pcx + rx * cr - ry * sr + tx, pcy + rx * sr + ry * cr + ty, -pc.layer * 0.9 - 40 * e]);
        }),
        uv: pc.pts.map((q) => [q.u, q.v] as UV),
      }));
      const outline = faces.flatMap((f) => f.world);
      if (outline.length) {
        const xs = outline.map((q) => q[0]);
        const ys = outline.map((q) => q[1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        shadowPoly(
          [
            [minX, minY, 0],
            [maxX, minY, 0],
            [maxX, maxY, 0],
            [minX, maxY, 0],
          ],
          28,
          0.18 * alpha,
          18,
        );
      }
      drawFaces(faces, tex, null, alpha);
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
      const p = clamp01(el / DUR[tech]);
      drawFrameTrans(p, t);
      if (p >= 1) {
        cur = idx(cur + 1);
        phase = "hold";
        tStart = now;
        tear = null;
        part = null;
        fold = null;
        changeRef.current(cur, techOf(cur));
      }
    }

    function drawFrameTrans(p: number, t: number) {
      const settle = seg(p, SETTLE_AT[tech], Math.min(1, SETTLE_AT[tech] + 0.62));
      drawStack(settle, t, tech === "strips");
      switch (tech) {
        case "tear":
          return drawTearFx(p);
        case "particles":
          return drawParticlesFx(p);
        case "strips":
          return drawStripsFx(p);
        case "pageTurn":
          return drawPageFx(p);
        case "plane":
          return drawPlaneFx(p);
        case "fold":
          return drawFoldFx(p);
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
