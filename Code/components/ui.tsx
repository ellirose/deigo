"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "./Icons";

/* A photographed surface (plaster, linen, wood) laid over a section with multiply blending. */
export function Texture({
  src,
  size = 480,
  opacity = 0.4,
  className = "",
}: {
  src: string;
  size?: number | "cover";
  opacity?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 mix-blend-multiply ${className}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: size === "cover" ? "cover" : `${size}px`,
        backgroundPosition: "center",
        opacity,
      }}
    />
  );
}

export function Kicker({ icon, children, tone = "mata" }: { icon: IconName; children: ReactNode; tone?: "mata" | "coral" | "azul" }) {
  const bg = { mata: "bg-mata", coral: "bg-coral", azul: "bg-azul" }[tone];
  return (
    <p className="inline-flex items-center gap-3 rounded-full bg-paper/90 py-1.5 pl-1.5 pr-5 text-[13px] font-extrabold uppercase tracking-[.2em] text-ink shadow-soft ring-1 ring-line">
      <span className={`grid size-9 place-items-center rounded-full ${bg} text-sand`} style={{ "--icon-accent": "rgb(255 255 255 / .28)" } as CSSProperties}>
        <Icon name={icon} className="size-5" />
      </span>
      {children}
    </p>
  );
}

export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-display text-[clamp(2.6rem,5.4vw,5.4rem)] font-extrabold leading-[.95] tracking-[-0.035em] text-balance ${className}`}>
      {children}
    </h2>
  );
}

/* Pointer-driven 3D tilt. Children marked .pop / .pop-sm float above the surface. */
export function Tilt({
  children,
  className = "",
  max = 7,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(px * max).toFixed(2)}deg`);
        el.dataset.tilting = "";
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      delete el.dataset.tilting;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [max]);
  return (
    <div ref={ref} className={`tilt ${className}`} style={style}>
      {children}
    </div>
  );
}

/* Watches every [data-reveal] element (including ones added later) and marks it in view. */
export function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    const scan = (root: ParentNode) =>
      root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    scan(document);
    const mo = new MutationObserver((muts) => {
      for (const m of muts)
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches("[data-reveal]:not(.is-in)")) io.observe(n);
          scan(n);
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}

/* Runs a callback once when the element first scrolls into view. */
export function useInView<T extends Element>(onEnter: () => void, rootMargin = "0px 0px -10% 0px") {
  const ref = useRef<T>(null);
  const cb = useRef(onEnter);
  useEffect(() => {
    cb.current = onEnter;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          cb.current();
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return ref;
}

export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
