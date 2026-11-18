"use client";

import { useEffect, useRef } from "react";

export type City = { code: string; name: string; lat: number; lon: number };

/* Simplified outlines (lon, lat) — stylised, not cartographic. */
const BRAZIL: [number, number][] = [
  [-60, 5.2], [-56.5, 1.9], [-54, 2.3], [-51.6, 4.2], [-50, 1.8], [-48.5, -1], [-44.5, -2.5], [-41, -2.9], [-38.5, -3.7],
  [-35.2, -5.4], [-34.8, -7.5], [-35.3, -9.7], [-37, -11], [-38.9, -13], [-39, -17.5], [-40.9, -21.9], [-42, -22.9],
  [-44.6, -23.4], [-47.9, -25.4], [-48.6, -28.2], [-50.7, -31], [-52.6, -33.7], [-53.4, -33.7], [-53.6, -31.5],
  [-55.6, -30.8], [-57.6, -30.2], [-56, -28], [-54.6, -25.6], [-54.3, -24], [-55.4, -22.6], [-57.9, -22.1], [-58.1, -20.2],
  [-57.6, -18.1], [-60, -16.3], [-60.2, -13.8], [-62.7, -13], [-65, -11], [-66.6, -9.9], [-69.9, -11], [-72.5, -9.9],
  [-73.9, -7.5], [-72.9, -5.3], [-70, -4.3], [-69.4, -1.1], [-70, 0.6], [-69.2, 1], [-66.9, 1.2], [-64, 2], [-64.5, 3.8],
  [-62.8, 4], [-60, 5.2],
];
const SOUTH_AMERICA: [number, number][] = [
  [-77.3, 8.6], [-75.6, 10.7], [-72, 12], [-68, 10.5], [-63, 10.6], [-60, 8.5], [-57, 6], [-52, 4.8], [-50, 1.8],
  [-48.5, -1], [-44.5, -2.5], [-38.5, -3.7], [-35.2, -5.4], [-34.8, -7.5], [-37, -11], [-39, -17.5], [-41, -22],
  [-44.6, -23.4], [-48.6, -28.2], [-52.6, -33.7], [-56, -34.9], [-57.5, -36.5], [-56.7, -38.5], [-62, -39], [-65, -42],
  [-65.6, -47], [-68, -50.5], [-69, -52.5], [-68.5, -54.9], [-71.5, -53.8], [-74.5, -50], [-73.8, -44], [-73.5, -38],
  [-71.6, -33], [-71.5, -28], [-70.3, -18.4], [-75, -15], [-77.5, -12], [-79.5, -8], [-81.3, -4.5], [-80, -2],
  [-80.3, 0.9], [-78.8, 1.6], [-77.5, 4], [-77.3, 8.6],
];

function inside(poly: [number, number][], lon: number, lat: number) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

const RAD = Math.PI / 180;
const vec = (lat: number, lon: number) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD)];

/* An orthographic dot-globe. Brazil glows, the rest of South America is mid-tone,
   the oceans are a fine grain. Hovering a role eases the globe to that city. */
export default function CareerGlobe({ cities, active, className = "" }: { cities: City[]; active: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const font = getComputedStyle(document.body).fontFamily;

    // Fibonacci-sphere sampling
    const N = 9000;
    const pts: { v: number[]; kind: 0 | 1 | 2 }[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      const x = Math.cos(th) * r;
      const z = Math.sin(th) * r;
      const lat = Math.asin(y) / RAD;
      const lon = Math.atan2(z, x) / RAD;
      const kind = inside(BRAZIL, lon, lat) ? 2 : inside(SOUTH_AMERICA, lon, lat) ? 1 : 0;
      if (kind === 0 && i % 3) continue; // keep the ocean grain light
      pts.push({ v: [x, y, z], kind });
    }
    const cityVec = cities.map((c) => vec(c.lat, c.lon));

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let t0 = performance.now();
    const view = { lon: -50, lat: -16, tLon: -50, tLat: -16 };
    const drag = { on: false, x: 0, y: 0, lon: 0, lat: 0, until: 0 };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };

    // Rotate a unit vector so (view.lat, view.lon) faces the camera (+z toward viewer).
    const project = (v: number[]) => {
      const lo = view.lon * RAD;
      const la = view.lat * RAD;
      // yaw around Y so the target longitude sits on the +z axis
      const x1 = v[2] * Math.cos(lo) - v[0] * Math.sin(lo); // east → screen right
      const z1 = v[0] * Math.cos(lo) + v[2] * Math.sin(lo);
      const y1 = v[1];
      // pitch around X
      const y2 = y1 * Math.cos(la) - z1 * Math.sin(la);
      const z2 = y1 * Math.sin(la) + z1 * Math.cos(la);
      return [x1, y2, z2];
    };

    const slerp = (a: number[], b: number[], s: number) => {
      const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const om = Math.acos(d);
      if (om < 1e-4) return a;
      const s0 = Math.sin((1 - s) * om) / Math.sin(om);
      const s1 = Math.sin(s * om) / Math.sin(om);
      return [a[0] * s0 + b[0] * s1, a[1] * s0 + b[1] * s1, a[2] * s0 + b[2] * s1];
    };

    const draw = (now: number) => {
      const time = (now - t0) / 1000;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.43;
      ctx.clearRect(0, 0, w, h);

      // Ground shadow + disc
      ctx.fillStyle = "rgba(28,43,39,.08)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + R * 1.08, R * 0.72, R * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFDF8";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(28,43,39,.1)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dots
      for (const p of pts) {
        const [x, y, z] = project(p.v);
        if (z < 0) continue;
        const sx = cx + x * R;
        const sy = cy - y * R;
        const depth = 0.35 + z * 0.65;
        if (p.kind === 2) {
          ctx.fillStyle = `rgba(11,122,92,${0.55 + z * 0.45})`;
          ctx.beginPath();
          ctx.arc(sx, sy, R * 0.0085 * (0.75 + z * 0.4), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 1) {
          ctx.fillStyle = `rgba(23,162,184,${0.35 * depth + 0.15})`;
          ctx.beginPath();
          ctx.arc(sx, sy, R * 0.007 * (0.75 + z * 0.4), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(28,43,39,${0.09 * depth})`;
          ctx.fillRect(sx - 0.9, sy - 0.9, 1.8, 1.8);
        }
      }

      // Career arcs (chronological: last city in list → first)
      const order = [...cityVec].reverse();
      for (let i = 0; i < order.length - 1; i++) {
        const a = order[i];
        const b = order[i + 1];
        ctx.strokeStyle = "rgba(242,107,79,.85)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -time * 18;
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= 1.0001; s += 0.04) {
          const m = slerp(a, b, s);
          const lift = 1 + 0.16 * Math.sin(Math.PI * s);
          const [x, y, z] = project(m);
          if (z < -0.05) {
            started = false;
            continue;
          }
          const sx = cx + x * R * lift;
          const sy = cy - y * R * lift;
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // City markers
      cityVec.forEach((v, i) => {
        const [x, y, z] = project(v);
        if (z < 0) return;
        const sx = cx + x * R;
        const sy = cy - y * R;
        const on = i === activeRef.current;
        if (on) {
          const pulse = (time * 0.9) % 1;
          ctx.strokeStyle = `rgba(242,107,79,${1 - pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, 8 + pulse * 22, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = on ? "#F26B4F" : "#FFC23D";
        ctx.strokeStyle = "#1C2B27";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, on ? 7 : 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Label pill
        const label = cities[i].code;
        ctx.font = `800 ${on ? 13 : 11}px ${font}`;
        const tw = ctx.measureText(label).width;
        const px = sx + (i === 1 ? 12 : -tw - 26);
        const py = sy - (i === 2 ? -6 : 26);
        ctx.fillStyle = on ? "#1C2B27" : "rgba(255,253,248,.95)";
        ctx.beginPath();
        ctx.roundRect(px, py, tw + 14, on ? 22 : 19, 10);
        ctx.fill();
        if (!on) {
          ctx.strokeStyle = "rgba(28,43,39,.15)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.fillStyle = on ? "#FFC23D" : "#1C2B27";
        ctx.textBaseline = "middle";
        ctx.fillText(label, px + 7, py + (on ? 11 : 9.5));
      });
    };

    const tick = (now: number) => {
      const c = cities[activeRef.current];
      if (!drag.on && now > drag.until && c) {
        // Ease toward the active city with a gentle idle sway.
        const sway = reduce ? 0 : Math.sin(now / 2600) * 6;
        view.tLon = c.lon + sway;
        view.tLat = c.lat + 4;
      }
      view.lon += (view.tLon - view.lon) * 0.06;
      view.lat += (view.tLat - view.lat) * 0.06;
      draw(now);
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      t0 = performance.now() - 1000;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const down = (e: PointerEvent) => {
      drag.on = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.lon = view.tLon;
      drag.lat = view.tLat;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag.on) return;
      view.tLon = drag.lon - (e.clientX - drag.x) * 0.35;
      view.tLat = Math.max(-70, Math.min(70, drag.lat + (e.clientY - drag.y) * 0.35));
    };
    const up = () => {
      drag.on = false;
      drag.until = performance.now() + 2500;
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
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
    };
  }, [cities]);

  return <canvas ref={ref} aria-hidden className={`block aspect-square w-full cursor-grab touch-none active:cursor-grabbing ${className}`} />;
}
