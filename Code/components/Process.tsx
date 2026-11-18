"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useI18n } from "./i18n";
import { Icon, type IconName } from "./Icons";
import { Kicker, SectionTitle, delay } from "./ui";

const STEPS: { icon: IconName; pin: string; tone: string; rot: number }[] = [
  { icon: "search", pin: "bg-coral", tone: "bg-sol text-ink", rot: -1.8 },
  { icon: "pen", pin: "bg-mar", tone: "bg-coral text-paper", rot: 1.2 },
  { icon: "code", pin: "bg-sol", tone: "bg-mata text-paper", rot: -0.8 },
  { icon: "rocket", pin: "bg-mata", tone: "bg-mar text-paper", rot: 1.6 },
  { icon: "chart", pin: "bg-azul", tone: "bg-azul text-paper", rot: -1.2 },
];
const SIG_ICON: IconName[] = ["web", "film", "briefcase"];

export default function Process() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="process-title" className="relative isolate overflow-hidden py-28 lg:py-36">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[url(/textures/wood.jpg)] bg-cover bg-center" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-sand/60" />

      <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div data-reveal>
              <Kicker icon="layers" tone="coral">
                {t.process.kicker}
              </Kicker>
            </div>
            <SectionTitle className="mt-6">
              <span id="process-title" data-reveal style={delay(80)} className="block">
                {t.process.title}
              </span>
            </SectionTitle>
            <p data-reveal style={delay(160)} className="mt-6 max-w-[48ch] text-xl font-medium leading-relaxed text-ink/75">
              {t.process.intro}
            </p>
          </div>
          {/* Polaroid of a workshop, taped to the board */}
          <figure data-reveal="right" style={delay(200)} className="relative mx-auto w-full max-w-[460px] lg:col-span-5">
            <div className="rotate-[2.5deg] bg-paper p-3 pb-14 shadow-lift transition duration-700 hover:rotate-0">
              <span aria-hidden className="tape left-1/2 -top-3 -translate-x-1/2 -rotate-3" />
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image src="/photos/diego-07-whiteboard-presentation.jpg" alt={t.process.photo} fill sizes="460px" className="object-cover" />
              </div>
              <figcaption className="absolute inset-x-4 bottom-4 font-serif text-xl italic text-ink/80">{t.process.photo}</figcaption>
            </div>
          </figure>
        </div>

        {/* Pinned notes joined by a thread */}
        <div className="relative mt-20">
          <svg aria-hidden className="thread absolute left-0 top-10 hidden h-24 w-full lg:block" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d="M40 30 C 180 90, 260 -10, 400 40 S 640 90, 760 30 S 920 20, 970 50" fill="none" stroke="var(--color-coral)" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" />
          </svg>
          <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            {t.process.steps.map((s, i) => {
              const st = STEPS[i];
              return (
                <li key={i} data-reveal style={delay(i * 110)}>
                  <article className="note relative h-full bg-paper px-6 pb-7 pt-10 shadow-soft transition duration-500 hover:-translate-y-2 hover:rotate-0 hover:shadow-lift" style={{ rotate: `${st.rot}deg` }}>
                    <span aria-hidden className={`pin absolute left-1/2 top-3 size-5 -translate-x-1/2 rounded-full ${st.pin}`} />
                    <div className="flex items-center justify-between">
                      <span className={`grid size-16 place-items-center rounded-[20px] ${st.tone}`} style={{ "--icon-accent": "rgb(255 255 255 / .3)" } as CSSProperties}>
                        <Icon name={st.icon} className="size-10" />
                      </span>
                      <span className="font-serif text-5xl italic text-ink/20">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="mt-6 font-display text-[1.75rem] font-extrabold tracking-[-0.03em]">{s.title}</h3>
                    <p className="mt-2 text-[16px] leading-relaxed text-ink/70">{s.desc}</p>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Signature engagements on clipboards */}
        <h3 data-reveal className="mt-24 font-display text-[clamp(1.9rem,3vw,2.8rem)] font-extrabold tracking-[-0.03em]">
          {t.process.signatureTitle}
        </h3>
        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-7">
          {t.process.signature.map((s, i) => (
            <article key={i} data-reveal style={delay(i * 120)} className="clipboard group relative rounded-[28px] bg-paper px-7 pb-8 pt-14 shadow-soft ring-1 ring-line transition duration-500 hover:-translate-y-2 hover:shadow-lift">
              <span aria-hidden className="absolute -top-4 left-1/2 flex h-9 w-28 -translate-x-1/2 items-center justify-center rounded-xl bg-mata-deep shadow-soft">
                <span className="h-2.5 w-12 rounded-full bg-sand/80" />
              </span>
              <div className="flex items-center gap-3">
                <span className="grid size-14 place-items-center rounded-2xl bg-sand text-mata ring-1 ring-line transition group-hover:bg-sol group-hover:text-ink">
                  <Icon name={SIG_ICON[i]} className="size-8" />
                </span>
                <span className="text-xs font-extrabold uppercase tracking-[.16em] text-coral">{s.tag}</span>
              </div>
              <h4 className="mt-6 font-display text-[1.7rem] font-extrabold leading-[1.05] tracking-[-0.03em]">{s.title}</h4>
              <p className="mt-3 text-[16px] leading-relaxed text-ink/70">{s.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
