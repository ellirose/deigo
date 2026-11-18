"use client";

import type { CSSProperties, ReactNode } from "react";
import { useI18n } from "./i18n";
import { Icon, type IconName } from "./Icons";
import { Kicker, SectionTitle, Texture, Tilt, delay } from "./ui";

type Shape = "tab" | "arch" | "film" | "rise" | "leaf";
const CARDS: { icon: IconName; shape: Shape; tone: string; accent: string; span: string }[] = [
  { icon: "code", shape: "tab", tone: "bg-mata", accent: "rgb(255 255 255 / .22)", span: "lg:col-span-3" },
  { icon: "pen", shape: "arch", tone: "bg-coral", accent: "rgb(255 255 255 / .25)", span: "lg:col-span-3" },
  { icon: "play", shape: "film", tone: "bg-mar", accent: "rgb(255 255 255 / .25)", span: "lg:col-span-2" },
  { icon: "chart", shape: "rise", tone: "bg-sol", accent: "rgb(255 255 255 / .6)", span: "lg:col-span-2" },
  { icon: "briefcase", shape: "leaf", tone: "bg-azul", accent: "rgb(255 255 255 / .22)", span: "lg:col-span-2" },
];

const RADIUS: Record<Shape, string> = {
  tab: "28px 28px 28px 28px",
  arch: "260px 260px 28px 28px / 150px 150px 28px 28px",
  film: "20px",
  rise: "28px 140px 28px 28px",
  leaf: "120px 28px 120px 28px",
};

function Perforations() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-6 flex justify-between">
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} className="h-2.5 w-4 rounded-[3px] bg-sand ring-1 ring-line" />
      ))}
    </div>
  );
}

function Card({ i, children }: { i: number; children: ReactNode }) {
  const c = CARDS[i];
  return (
    <div data-reveal style={delay((i % 3) * 110)} className={`drop-soft ${c.span} ${c.shape === "tab" ? "pt-10" : ""}`}>
      <Tilt max={6} className="h-full">
        <article
          className={`relative flex h-full flex-col bg-paper p-7 ring-1 ring-line sm:p-9 ${c.shape === "arch" ? "pt-16 sm:pt-20" : ""} ${c.shape === "film" ? "py-12 sm:py-14" : ""}`}
          style={{ borderRadius: RADIUS[c.shape], borderTopLeftRadius: c.shape === "tab" ? 0 : undefined, transformStyle: "preserve-3d" }}
        >
          {c.shape === "tab" && (
            <div aria-hidden className="absolute -top-10 left-[-1px] flex h-10 w-[min(260px,62%)] items-center gap-2 rounded-t-[22px] border border-b-0 border-line bg-paper px-5">
              <span className="size-2.5 rounded-full bg-coral" />
              <span className="size-2.5 rounded-full bg-sol" />
              <span className="size-2.5 rounded-full bg-mata" />
              <span className="ml-2 font-mono text-xs font-semibold text-muted">studio.tsx</span>
            </div>
          )}
          {c.shape === "film" && (
            <>
              <div className="absolute inset-x-0 top-4">
                <Perforations />
              </div>
              <div className="absolute inset-x-0 bottom-4">
                <Perforations />
              </div>
            </>
          )}
          {children}
        </article>
      </Tilt>
    </div>
  );
}

export default function Expertise() {
  const { t } = useI18n();
  return (
    <section id="expertise" className="relative overflow-hidden bg-sand pb-28 pt-32 lg:pb-36 lg:pt-40">
      <Texture src="/textures/linen.jpg" size={520} opacity={0.32} />
      <div aria-hidden className="absolute -left-40 top-1/3 size-[520px] rounded-full border-[56px] border-mar/10" />

      <div className="relative mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div data-reveal>
              <Kicker icon="spark">{t.expertise.kicker}</Kicker>
            </div>
            <SectionTitle className="mt-6">
              <span data-reveal="up" style={delay(80)} className="block">
                {t.expertise.title}
              </span>
            </SectionTitle>
          </div>
          <p data-reveal style={delay(160)} className="max-w-[46ch] text-xl font-medium leading-relaxed text-muted lg:col-span-5 lg:pb-3">
            {t.expertise.intro}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-20 lg:grid-cols-6 lg:gap-7">
          {t.expertise.cards.map((card, i) => {
            const c = CARDS[i];
            return (
              <Card key={i} i={i}>
                <div className="flex items-start justify-between gap-4" style={{ transformStyle: "preserve-3d" }}>
                  <span
                    className={`pop grid size-[clamp(84px,7vw,108px)] place-items-center rounded-[30px] ${c.tone} ${c.shape === "rise" ? "text-ink" : "text-paper"} shadow-[0_18px_30px_-14px_rgb(28_43_39_/_.45)]`}
                    style={{ "--icon-accent": c.accent } as CSSProperties}
                  >
                    <Icon name={c.icon} className="size-[60%]" strokeWidth={2.4} />
                  </span>
                  <span className={`pop-sm font-serif text-5xl italic text-line ${c.shape === "rise" ? "mr-16 mt-8" : ""}`}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="pop-sm mt-8 font-display text-[clamp(1.75rem,2.3vw,2.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{card.title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-muted">{card.desc}</p>

                {i === 0 && (
                  <pre aria-hidden className="mt-6 overflow-hidden rounded-2xl bg-sand px-5 py-4 font-mono text-[13px] leading-6 text-ink/80 ring-1 ring-line">
                    <span className="text-azul">const</span> site = <span className="text-mata">design</span> + <span className="text-coral">code</span> + <span className="text-mar">motion</span>;
                  </pre>
                )}
                {i === 1 && (
                  <div aria-hidden className="mt-6 flex items-center gap-2">
                    {["bg-mata", "bg-sol", "bg-mar", "bg-coral", "bg-azul", "bg-ink"].map((b, k) => (
                      <span key={b} className={`size-9 rounded-full ${b} ring-4 ring-paper transition-transform duration-500 hover:-translate-y-1`} style={{ marginLeft: k ? -10 : 0 }} />
                    ))}
                    <span className="ml-3 font-serif text-2xl italic text-muted">Aa</span>
                  </div>
                )}

                <ul className="mt-auto flex flex-wrap gap-2 pt-7">
                  {card.tools.map((tool) => (
                    <li key={tool} className="rounded-full bg-sand px-3.5 py-1.5 text-sm font-bold text-ink/80 ring-1 ring-line">
                      {tool}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
