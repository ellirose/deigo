"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { Flag } from "./Brand";
import { useI18n } from "./i18n";
import { Icon, type IconName } from "./Icons";
import { Kicker, Texture, delay } from "./ui";

const FACT_ICONS: IconName[] = ["pin", "cap", "chat"];

export default function About() {
  const { t } = useI18n();
  const stage = useRef<HTMLDivElement>(null);

  // Layered parallax: each photo drifts by its own depth as the pointer moves.
  useEffect(() => {
    const el = stage.current;
    if (!el || matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };
    const leave = () => {
      el.style.setProperty("--px", "0");
      el.style.setProperty("--py", "0");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  const layer = (depth: number) => ({ "--depth": depth }) as CSSProperties;

  return (
    <section id="about" className="relative overflow-hidden bg-sand pb-20 pt-28 lg:pb-28 lg:pt-36">
      <Texture src="/textures/plaster.jpg" size={460} opacity={0.55} />
      <div className="relative mx-auto grid max-w-[1480px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-12">
        {/* Collage */}
        <div ref={stage} data-reveal="scale" className="parallax-stage relative mx-auto aspect-[1/1.02] w-full max-w-[640px] lg:col-span-6">
          <div aria-hidden className="parallax-layer absolute left-[12%] top-[6%] size-[72%] rounded-full bg-sol" style={layer(-14)} />
          <svg aria-hidden viewBox="0 0 100 100" className="parallax-layer spin-slower absolute left-[4%] top-[-2%] size-[88%] text-mata" style={layer(-6)}>
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth=".4" strokeDasharray="1 2.6" />
          </svg>
          <div className="parallax-layer absolute left-[18%] top-[3%] w-[50%]" style={layer(18)}>
            <div className="aspect-[3/4] overflow-hidden rounded-b-[30px] rounded-t-full border-[8px] border-paper bg-paper shadow-lift">
              <div className="relative h-full w-full">
                <Image src="/photos/diego-04-camera-portrait.jpg" alt={t.about.photoAlts[0]} fill sizes="(min-width:1024px) 320px, 50vw" className="object-cover object-[50%_30%]" />
              </div>
            </div>
          </div>
          <div className="parallax-layer absolute right-[1%] top-[36%] w-[40%]" style={layer(30)}>
            <div className="relative aspect-square overflow-hidden rounded-full border-[8px] border-paper bg-paper shadow-lift">
              <Image src="/photos/diego-05-laptop-call.jpg" alt={t.about.photoAlts[1]} fill sizes="(min-width:1024px) 260px, 40vw" className="object-cover" />
            </div>
          </div>
          <div className="parallax-layer absolute bottom-[2%] left-[2%] w-[36%]" style={layer(40)}>
            <div className="relative aspect-square rotate-[-4deg] overflow-hidden rounded-[38px] border-[8px] border-paper bg-paper shadow-lift">
              <Image src="/photos/diego-02-train-hoodie.jpg" alt={t.about.photoAlts[2]} fill sizes="(min-width:1024px) 230px, 36vw" className="object-cover" />
            </div>
          </div>
          <div className="parallax-layer absolute bottom-[12%] right-[8%]" style={layer(52)}>
            <span className="flex items-center gap-2 rounded-full bg-paper py-2 pl-2 pr-4 text-sm font-extrabold shadow-lift ring-1 ring-line">
              <Flag code="pt" className="size-7" />
              {t.about.badge}
            </span>
          </div>
        </div>

        {/* Copy */}
        <div className="lg:col-span-6 lg:pl-6">
          <div data-reveal>
            <Kicker icon="sun">{t.about.kicker}</Kicker>
          </div>
          <h2 data-reveal style={delay(80)} className="mt-6 font-display text-[clamp(3rem,6vw,6rem)] font-extrabold leading-[.92] tracking-[-0.045em]">
            <span className="block font-serif text-[1.08em] font-normal italic tracking-[-0.01em] text-coral">{t.about.helloA}</span>
            <span className="block text-mata">{t.about.helloB}</span>
          </h2>
          <p data-reveal style={delay(140)} className="mt-7 text-xl font-medium leading-relaxed text-ink/80">
            {t.about.p1}
          </p>
          <p data-reveal style={delay(200)} className="mt-4 text-xl font-medium leading-relaxed text-muted">
            {t.about.p2}
          </p>

          <dl className="mt-10 grid gap-4">
            {t.about.facts.map((f, i) => (
              <div key={f.label} data-reveal style={delay(240 + i * 80)} className="flex items-center gap-5 rounded-[26px] bg-paper/90 p-3 pr-6 shadow-soft ring-1 ring-line">
                <span className="grid size-16 shrink-0 place-items-center rounded-[20px] bg-mata text-paper" style={{ "--icon-accent": "rgb(255 255 255 / .25)" } as CSSProperties}>
                  <Icon name={FACT_ICONS[i]} className="size-9" />
                </span>
                <div>
                  <dt className="text-[11px] font-extrabold uppercase tracking-[.2em] text-muted">{f.label}</dt>
                  <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-[17px] font-extrabold leading-snug">
                    {i === 2 && (
                      <span className="flex -space-x-1.5">
                        <Flag code="pt" className="size-6 ring-2 ring-paper" />
                        <Flag code="en" className="size-6 ring-2 ring-paper" />
                      </span>
                    )}
                    {f.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <div data-reveal style={delay(480)} className="mt-8">
            <p className="text-sm font-extrabold uppercase tracking-[.2em] text-coral">{t.about.learningTitle}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {t.about.learning.map((l) => (
                <li key={l} className="rounded-full bg-paper px-4 py-2 text-[15px] font-bold ring-1 ring-line">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
