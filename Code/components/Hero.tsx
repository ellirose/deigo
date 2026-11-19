"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { CATS, WORK, type Cat } from "@/lib/work";
import { Flag } from "./Brand";
import CalcadaoWave from "./canvas/CalcadaoWave";
import PaperStage, { techniqueFor, type StageHandle, type Technique } from "./canvas/PaperStage";
import { useI18n } from "./i18n";
import { Icon, type IconName } from "./Icons";
import { Texture, delay } from "./ui";

const CAT_ICON = Object.fromEntries(CATS.map((c) => [c.id, c.icon])) as Record<Cat | "all", IconName>;
const TECH_ICON: Record<Technique, IconName> = {
  pageTurn: "page",
  tear: "tear",
  particles: "particles",
  strips: "strips",
  reform: "swirl",
  shatter: "shatter",
  mosaic: "mosaic",
  fade: "layers",
};
const pad = (n: number) => String(n).padStart(2, "0");
const onAccent = { "--icon-accent": "rgb(255 255 255 / .25)" } as CSSProperties;

export default function Hero() {
  const { t, lang } = useI18n();
  const anchor = useRef<HTMLButtonElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const control = useRef<StageHandle | null>(null);
  const [now, setNow] = useState<{ i: number; tech: Technique }>({ i: 0, tech: techniqueFor(WORK[0], 0) });
  const [paused, setPaused] = useState(false);
  const onChange = useCallback((i: number, tech: Technique) => setNow({ i, tech }), []);
  const item = WORK[now.i];

  const togglePause = () => {
    const next = !paused;
    control.current?.setPaused(next);
    setPaused(next);
  };

  return (
    <section id="top" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-sand lg:h-[100svh] lg:min-h-[720px] lg:max-h-[1100px]">
      <Texture src="/textures/plaster.jpg" size={460} opacity={0.6} />
      <div aria-hidden className="sun-breathe absolute -right-[110px] -top-[150px] size-[280px] rounded-full bg-sol sm:-right-[8vw] sm:-top-[20vh] sm:size-[clamp(340px,60vh,700px)]" />
      <svg aria-hidden className="absolute -right-[110px] -top-[150px] size-[280px] text-sol sm:-right-[8vw] sm:-top-[20vh] sm:size-[clamp(340px,60vh,700px)]" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="58" fill="none" stroke="currentColor" strokeWidth=".35" opacity=".9" />
        <circle cx="50" cy="50" r="66" fill="none" stroke="currentColor" strokeWidth=".25" opacity=".6" />
      </svg>
      {/* oversized catalogue number of the print on show */}
      <p key={now.i} aria-hidden className="numeral pointer-events-none absolute bottom-[12%] right-[3%] hidden select-none font-serif text-[clamp(10rem,19vw,20rem)] italic leading-none text-[#efe5d0] lg:block">
        {pad(now.i + 1)}
      </p>

      {/* The paper stage spans the whole hero so dust, shards and pixels can leave the frame */}
      <PaperStage className="absolute inset-0 z-[1] h-full w-full" items={WORK} anchorRef={anchor} progressRef={bar} controlRef={control} onChange={onChange} />

      <div className="pointer-events-none relative z-10 mx-auto grid w-full max-w-[1480px] flex-1 grid-cols-1 content-center gap-7 px-5 pb-[84px] pt-24 sm:px-8 sm:pb-[96px] sm:pt-28 lg:grid-cols-12 lg:gap-6 lg:px-12 lg:pb-[118px] lg:pt-28">
        {/* Copy */}
        <div className="pointer-events-auto lg:col-span-6 lg:self-center">
          <p data-reveal className="inline-flex items-center gap-2.5 rounded-full bg-paper/90 py-1.5 pl-1.5 pr-4 text-[12px] font-extrabold uppercase tracking-[.18em] shadow-soft ring-1 ring-line sm:text-[13px]">
            <Flag code="pt" className="size-7" />
            <span>
              {t.hero.eyebrow.split(" · ")[0]}
              <span className="hidden sm:inline"> · {t.hero.eyebrow.split(" · ")[1]}</span>
            </span>
          </p>

          <h1 className="mt-6 font-display text-[clamp(2.5rem,5.9vw,6.6rem)] font-extrabold leading-[.93] tracking-[-0.04em] lg:text-[clamp(3rem,min(5.1vw,9svh),6.2rem)]">
            <span data-reveal className="block text-balance" style={delay(80)}>
              {t.hero.line1}
            </span>
            <span data-reveal className="block text-balance" style={delay(180)}>
              {t.hero.pre}
              <em className="relative inline-block whitespace-nowrap pr-[.08em] font-serif text-[1.12em] font-normal italic leading-[.8] tracking-[-0.01em] text-mata">
                <svg aria-hidden viewBox="0 0 300 30" preserveAspectRatio="none" className="swash absolute -bottom-[.06em] left-[-2%] -z-10 h-[.34em] w-[104%] text-sol">
                  <path d="M5 20C70 6 160 4 295 14" stroke="currentColor" strokeWidth="14" fill="none" strokeLinecap="round" pathLength={1} />
                </svg>
                {t.hero.em}
              </em>
              {t.hero.post}
            </span>
          </h1>

          <p data-reveal style={delay(280)} className="mt-5 max-w-[40ch] text-[clamp(1rem,1.25vw,1.3rem)] font-medium leading-relaxed text-muted sm:mt-6">
            {t.hero.sub}
          </p>

          <div data-reveal style={delay(360)} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-8">
            <a href="#work" className="btn-primary group">
              {t.hero.cta}
              <span className="btn-primary-icon">
                <Icon name="arrowRight" className="size-5" strokeWidth={3} />
              </span>
            </a>
            <a href="#journey" className="link-sweep hidden text-lg font-extrabold sm:inline">
              {t.hero.cta2}
            </a>
          </div>

          <dl data-reveal style={delay(460)} className="hero-tall-only mt-9 hidden items-center gap-5 lg:flex">
            {(
              [
                ["20+", t.hero.stat],
                ["10", t.hero.statYears],
                [String(WORK.length), t.hero.statPieces],
              ] as const
            ).map(([v, l], i) => (
              <div key={l} className="flex items-center gap-3">
                <dt className="font-display text-[2.1rem] font-extrabold leading-none tracking-tight text-mata">{v}</dt>
                <dd className="max-w-[10ch] text-[13px] font-bold leading-tight text-muted">{l}</dd>
                {i < 2 && <span aria-hidden className="ml-2 h-9 w-px bg-line" />}
              </div>
            ))}
          </dl>
        </div>

        {/* Stage footprint: the canvas prints each sheet exactly inside this box */}
        <div className="relative flex h-[clamp(180px,23svh,300px)] items-center justify-center sm:h-[clamp(230px,27svh,360px)] lg:col-span-6 lg:h-full lg:justify-end">
          <div className="relative aspect-[4/5] h-full lg:mr-[10%] lg:h-[min(62svh,620px)]">
            <button
              ref={anchor}
              type="button"
              onClick={() => control.current?.next()}
              aria-label={`${t.hero.next}: ${item.title[lang]}`}
              className="pointer-events-auto absolute inset-0 cursor-pointer rounded-md"
            />

            {/* Polaroid portrait */}
            <figure data-reveal="left" style={delay(520)} className="pointer-events-auto absolute -left-[56%] bottom-[18%] z-10 w-[50%] sm:-left-[40%] sm:bottom-[4%] sm:w-[44%] lg:-left-[36%]">
              <div className="relative -rotate-[7deg] bg-paper p-[6%] pb-[24%] shadow-lift ring-1 ring-line transition duration-500 hover:-translate-y-1 hover:-rotate-[3deg]">
                <span aria-hidden className="tape -top-3 left-1/2 -translate-x-1/2 rotate-[3deg]" />
                <div className="relative aspect-square overflow-hidden bg-mar">
                  <Image src="/photos/diego-01-teal-headphones.jpg" alt={t.hero.portraitAlt} fill priority sizes="(min-width:1024px) 240px, 36vw" className="object-cover" />
                </div>
                <figcaption className="absolute inset-x-0 bottom-[6%] text-center font-serif text-[clamp(12px,1.25vw,19px)] italic text-ink/80">{t.hero.polaroid}</figcaption>
              </div>
            </figure>

            {/* Pinned studio print */}
            <figure data-reveal="scale" style={delay(640)} className="pointer-events-auto absolute -right-[13%] -top-[8%] z-10 hidden w-[30%] sm:block">
              <div className="relative rotate-[6deg] rounded-[16px] bg-paper p-[6%] shadow-lift ring-1 ring-line transition duration-500 hover:rotate-[2deg]">
                <span aria-hidden className="pin absolute -top-2 left-1/2 z-10 size-4 -translate-x-1/2 rounded-full bg-coral" />
                <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-sand">
                  <Image src="/photos/diego-06-camera-studio.jpg" alt={t.hero.cameraAlt} fill sizes="(min-width:1024px) 180px, 30vw" className="object-cover object-[60%_30%]" />
                </div>
              </div>
            </figure>

            {/* Now-showing ticket */}
            <div data-reveal style={delay(760)} className="pointer-events-auto absolute left-1/2 top-[calc(100%-22px)] z-20 w-[min(340px,88vw)] -translate-x-1/2 sm:bottom-[2%] sm:left-[72%] sm:top-auto sm:w-[300px] sm:translate-x-0 lg:-bottom-[10%] lg:left-auto lg:-right-[20%] lg:w-[350px]">
              <div className="relative rounded-[24px] bg-paper/95 p-3 shadow-lift ring-1 ring-line backdrop-blur sm:p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mata text-paper sm:size-12" style={onAccent}>
                    <Icon name={CAT_ICON[item.cat]} className="size-7" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center justify-between gap-2 text-[10.5px] font-extrabold uppercase tracking-[.16em] text-muted">
                      <span className="truncate">
                        {t.hero.showing} · {t.work.filters[item.cat]}
                      </span>
                      <span className="font-mono tracking-normal text-ink">
                        {pad(now.i + 1)}/{WORK.length}
                      </span>
                    </p>
                    <p key={now.i} className="ticket-title mt-0.5 truncate font-display text-[1.05rem] font-extrabold leading-tight sm:text-[1.2rem]">
                      {item.title[lang]}
                    </p>
                  </div>
                  <button type="button" onClick={() => control.current?.next()} aria-label={t.hero.next} className="mini-btn mini-btn-accent sm:hidden">
                    <Icon name="chevronRight" className="size-4" strokeWidth={3.4} />
                  </button>
                </div>
                <div className="mt-3 hidden items-center justify-between gap-2 sm:flex">
                  <span key={now.tech + now.i} className="ticket-title inline-flex min-w-0 items-center gap-2 rounded-full bg-sand py-1 pl-1 pr-3 text-[12.5px] font-extrabold ring-1 ring-line">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sol text-ink" style={{ "--icon-accent": "rgb(255 255 255 / .6)" } as CSSProperties}>
                      <Icon name={TECH_ICON[now.tech]} className="size-[18px]" />
                    </span>
                    <span className="hidden font-bold text-muted xl:inline">{t.hero.leaves}</span>
                    <span className="truncate">{t.hero.techniques[now.tech]}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button type="button" onClick={() => control.current?.prev()} aria-label={t.hero.prev} className="mini-btn">
                      <Icon name="chevronLeft" className="size-4" strokeWidth={3.4} />
                    </button>
                    <button type="button" onClick={togglePause} aria-label={paused ? t.hero.play : t.hero.pause} aria-pressed={paused} className="mini-btn">
                      <Icon name={paused ? "playSolid" : "pause"} className="size-4" strokeWidth={4} />
                    </button>
                    <button type="button" onClick={() => control.current?.next()} aria-label={t.hero.next} className="mini-btn mini-btn-accent">
                      <Icon name="chevronRight" className="size-4" strokeWidth={3.4} />
                    </button>
                  </div>
                </div>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-line sm:mt-3">
                  <span ref={bar} className="block h-full origin-left scale-x-0 rounded-full bg-coral" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CalcadaoWave className="absolute inset-x-0 bottom-0 z-[5] h-[74px] lg:h-[100px]" />
    </section>
  );
}
