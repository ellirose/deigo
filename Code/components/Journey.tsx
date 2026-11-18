"use client";

import { useState } from "react";
import { ROLE_TITLES } from "@/lib/i18n";
import CareerGlobe, { type City } from "./canvas/CareerGlobe";
import { useI18n } from "./i18n";
import { Icon } from "./Icons";
import { Kicker, SectionTitle, Texture, delay } from "./ui";

const CITIES: City[] = [
  { code: "SAO", name: "São Paulo", lat: -23.55, lon: -46.63 },
  { code: "BHZ", name: "Belo Horizonte", lat: -19.92, lon: -43.94 },
  { code: "CWB", name: "Curitiba", lat: -25.43, lon: -49.27 },
];
const STATES = ["SP", "MG", "PR"];

export default function Journey() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);

  return (
    <section id="journey" className="relative bg-paper py-28 lg:py-36">
      <Texture src="/textures/linen.jpg" size={520} opacity={0.22} />
      <div className="relative mx-auto grid max-w-[1480px] gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <div data-reveal>
              <Kicker icon="globe">{t.journey.kicker}</Kicker>
            </div>
            <SectionTitle className="mt-6 text-[clamp(2.4rem,4.6vw,4.6rem)]">
              <span data-reveal style={delay(80)} className="block">
                {t.journey.title}
              </span>
            </SectionTitle>
            <p data-reveal style={delay(160)} className="mt-5 max-w-[42ch] text-lg font-medium leading-relaxed text-muted">
              {t.journey.intro}
            </p>
            <div data-reveal="scale" style={delay(220)} className="relative mx-auto mt-6 max-w-[520px]">
              <div aria-hidden className="absolute inset-[12%] rounded-full bg-sol/35 blur-2xl" />
              <CareerGlobe cities={CITIES} active={active} className="relative" />
            </div>
            <p className="mt-1 text-center text-sm font-semibold text-muted">{t.journey.globe}</p>
          </div>
        </div>

        <ol className="space-y-8 lg:col-span-7 lg:pt-40">
          {t.journey.roles.map((role, i) => {
            const on = active === i;
            return (
              <li key={i} data-reveal style={delay(i * 120)} className="drop-soft">
                <article
                  tabIndex={0}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  aria-current={on ? "step" : undefined}
                  className={`pass grid bg-paper outline-none transition duration-500 sm:grid-cols-[170px_1fr] ${on ? "-translate-y-1" : ""}`}
                >
                  <div className={`pass-stub flex flex-row items-center justify-between gap-4 p-6 transition-colors duration-500 sm:flex-col sm:items-start sm:justify-between ${on ? "bg-sol" : "bg-sand"}`}>
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-ink/60">{STATES[i]} · BR</p>
                      <p className="mt-1 font-display text-[3.4rem] font-extrabold leading-none tracking-[-0.04em] text-mata-deep">{CITIES[i].code}</p>
                      <p className="mt-1 text-sm font-extrabold">{CITIES[i].name}</p>
                    </div>
                    <span className={`grid size-12 place-items-center rounded-full transition duration-500 ${on ? "rotate-0 bg-ink text-sol" : "-rotate-45 bg-paper text-ink"}`}>
                      <Icon name="arrowRight" className="size-6" strokeWidth={3} />
                    </span>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="rounded-full bg-sand px-3 py-1 font-mono text-xs font-bold ring-1 ring-line">{role.period}</span>
                      <span className="flex items-center gap-2 text-sm font-extrabold text-mata">
                        <Icon name="briefcase" className="size-5" />
                        {role.company}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-[clamp(1.5rem,2.2vw,2.1rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">{ROLE_TITLES[i]}</h3>
                    <ul className="mt-5 space-y-3">
                      {role.bullets.map((b) => (
                        <li key={b} className="flex gap-3 text-[17px] font-medium leading-snug text-ink/80">
                          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-mata/12 text-mata">
                            <Icon name="check" className="size-4" strokeWidth={4} />
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
