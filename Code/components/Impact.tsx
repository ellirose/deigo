"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "./i18n";
import { Icon, type IconName } from "./Icons";
import { Kicker, SectionTitle, Texture, delay, useInView } from "./ui";

const STATS: { value: number; prefix: string; suffix: string; icon: IconName; color: string; ring: string }[] = [
  { value: 38, prefix: "−", suffix: "%", icon: "gauge", color: "text-mata", ring: "border-mata" },
  { value: 21, prefix: "+", suffix: "%", icon: "chart", color: "text-coral", ring: "border-coral" },
  { value: 24, prefix: "+", suffix: "%", icon: "search", color: "text-azul", ring: "border-azul" },
  { value: 12, prefix: "", suffix: "h", icon: "rocket", color: "text-mar", ring: "border-mar" },
  { value: 20, prefix: "−", suffix: "%", icon: "check", color: "text-mata", ring: "border-sol" },
  { value: 20, prefix: "", suffix: "+", icon: "web", color: "text-coral", ring: "border-azul" },
];

function CountUp({ to, prefix, suffix }: { to: number; prefix: string; suffix: string }) {
  const [n, setN] = useState(to);
  const started = useRef(false);
  const ref = useInView<HTMLSpanElement>(() => {
    if (started.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    started.current = true;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1600);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  // Start from zero once mounted (the tile is still hidden until revealed).
  useEffect(() => {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setN(0);
  }, []);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {n}
      {suffix}
    </span>
  );
}

export default function Impact() {
  const { t } = useI18n();
  const photo = useRef<HTMLDivElement>(null);

  // Gentle parallax on the tile photograph
  useEffect(() => {
    const el = photo.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.parentElement!.getBoundingClientRect();
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.transform = `translate3d(0, ${p * -60}px, 0) scale(1.18)`;
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section aria-labelledby="impact-title" className="relative bg-sand py-24 lg:py-32">
      <Texture src="/textures/plaster.jpg" size={460} opacity={0.5} />
      <div className="relative mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
        <div data-reveal="clip" className="relative h-[clamp(380px,44vw,560px)] overflow-hidden rounded-[44px] shadow-lift">
          <div ref={photo} className="absolute inset-0 will-change-transform" style={{ transform: "scale(1.18)" }}>
            <Image src="/textures/selaron.jpg" alt={t.impact.photo} fill sizes="(min-width:1480px) 1400px, 100vw" className="object-cover" />
          </div>
          <div className="absolute left-4 top-4 max-w-[600px] rounded-[32px] bg-paper/95 p-6 shadow-lift backdrop-blur sm:left-8 sm:top-8 sm:p-9">
            <Kicker icon="sun" tone="azul">
              {t.impact.kicker}
            </Kicker>
            <SectionTitle className="mt-5 text-[clamp(2.2rem,4.2vw,4.2rem)]">
              <span id="impact-title">{t.impact.title}</span>
            </SectionTitle>
            <p className="mt-4 text-lg font-medium leading-relaxed text-muted">{t.impact.intro}</p>
          </div>
          <span className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-paper/90 px-3.5 py-1.5 text-xs font-bold backdrop-blur">
            <Icon name="pin" className="size-4 text-coral" strokeWidth={3} />
            {t.impact.photo}
          </span>
        </div>

        <div className="relative z-10 -mt-20 grid grid-cols-1 gap-5 px-1 sm:grid-cols-2 sm:px-4 lg:-mt-28 lg:grid-cols-3 lg:gap-6 lg:px-12">
          {STATS.map((s, i) => (
            <div key={i} data-reveal="flip" style={delay(i * 110)} className="azulejo group relative overflow-hidden rounded-[30px] bg-paper p-7 shadow-lift ring-1 ring-line sm:p-8">
              {/* Azulejo corner ornaments */}
              {["-left-9 -top-9", "-right-9 -top-9", "-bottom-9 -left-9", "-bottom-9 -right-9"].map((pos) => (
                <span key={pos} aria-hidden className={`absolute ${pos} size-[72px] rounded-full border-[7px] ${s.ring} opacity-25 transition duration-700 group-hover:scale-110 group-hover:opacity-60`} />
              ))}
              <span aria-hidden className={`absolute right-7 top-7 grid size-14 place-items-center rounded-2xl bg-sand ${s.color}`} style={{ "--icon-accent": "var(--color-sol)" } as CSSProperties}>
                <Icon name={s.icon} className="size-9" />
              </span>
              <p className={`relative font-display text-[clamp(3.4rem,5.2vw,5.4rem)] font-extrabold leading-none tracking-[-0.05em] ${s.color}`}>
                <CountUp to={s.value} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="relative mt-3 max-w-[26ch] text-lg font-bold leading-snug text-ink/85">{t.impact.labels[i]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
