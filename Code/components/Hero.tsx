"use client";

import Image from "next/image";
import { useId, type CSSProperties } from "react";
import { Flag } from "./Brand";
import CalcadaoWave from "./canvas/CalcadaoWave";
import { useI18n } from "./i18n";
import { Icon } from "./Icons";
import { Texture, delay } from "./ui";

export default function Hero() {
  const { t } = useI18n();
  const ringId = useId();

  return (
    <section id="top" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-sand lg:h-[100svh] lg:min-h-[700px] lg:max-h-[1100px]">
      <Texture src="/textures/plaster.jpg" size={460} opacity={0.6} />
      {/* The sun: one flat disc, slowly breathing */}
      <div aria-hidden className="sun-breathe absolute -right-[110px] -top-[150px] size-[280px] sm:-right-[12vw] sm:-top-[18vh] sm:size-[clamp(340px,62vh,720px)] rounded-full bg-sol lg:-right-[6vw]" />
      {/* Faint contour rings echoing the sun */}
      <svg aria-hidden className="absolute -right-[110px] -top-[150px] size-[280px] sm:-right-[12vw] sm:-top-[18vh] sm:size-[clamp(340px,62vh,720px)] text-sol lg:-right-[6vw]" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="58" fill="none" stroke="currentColor" strokeWidth=".35" opacity=".9" />
        <circle cx="50" cy="50" r="66" fill="none" stroke="currentColor" strokeWidth=".25" opacity=".6" />
      </svg>

      <div className="relative z-10 mx-auto grid w-full max-w-[1480px] flex-1 grid-cols-1 content-center gap-6 px-5 sm:gap-8 pb-[84px] pt-24 sm:px-8 sm:pb-[96px] sm:pt-28 lg:grid-cols-12 lg:gap-6 lg:px-12 lg:pb-[120px] lg:pt-28">
        {/* Copy */}
        <div className="lg:col-span-7 lg:self-center">
          <p data-reveal className="inline-flex items-center gap-2.5 rounded-full bg-paper/90 py-1.5 pl-1.5 pr-4 text-[12px] font-extrabold uppercase tracking-[.18em] shadow-soft ring-1 ring-line sm:text-[13px]">
            <Flag code="pt" className="size-7" />
            <span>
              {t.hero.eyebrow.split(" · ")[0]}
              <span className="hidden sm:inline"> · {t.hero.eyebrow.split(" · ")[1]}</span>
            </span>
          </p>

          <h1 className="mt-6 font-display text-[clamp(2.5rem,5.9vw,6.6rem)] lg:text-[clamp(3rem,min(5.5vw,9.2svh),6.6rem)] font-extrabold leading-[.93] tracking-[-0.04em]">
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

          <p data-reveal style={delay(280)} className="mt-5 max-w-[40ch] text-[clamp(1rem,1.3vw,1.32rem)] sm:mt-6 font-medium leading-relaxed text-muted">
            {t.hero.sub}
          </p>

          <div data-reveal style={delay(360)} className="mt-6 flex flex-wrap items-center sm:mt-8 gap-x-6 gap-y-4">
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

          <div data-reveal style={delay(460)} className="hero-tall-only mt-10 hidden items-center gap-4 lg:flex">
            <div className="flex -space-x-2">
              {(["code", "pen", "play"] as const).map((n, i) => (
                <span
                  key={n}
                  className={`grid size-14 place-items-center rounded-2xl text-paper shadow-soft ring-4 ring-sand ${["bg-mata", "bg-coral", "bg-mar"][i]}`}
                  style={{ "--icon-accent": "rgb(255 255 255 / .25)" } as CSSProperties}
                >
                  <Icon name={n} className="size-8" />
                </span>
              ))}
            </div>
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold">{t.hero.disciplines}</p>
              <p className="text-sm font-semibold text-muted">{t.hero.years}</p>
            </div>
          </div>
        </div>

        {/* Visual: an arched window cut into the plaster wall */}
        <div className="relative flex h-[clamp(170px,25svh,340px)] sm:h-[clamp(230px,36svh,340px)] items-center justify-center lg:col-span-5 lg:h-full lg:max-h-[700px] lg:justify-end">
          <div data-reveal="scale" style={delay(150)} className="relative aspect-[3/4] h-full lg:mr-[6%]">
            <div className="h-full rounded-b-[30px] rounded-t-full bg-paper p-[clamp(6px,0.8vw,12px)] shadow-lift ring-1 ring-line">
              <div className="relative h-full overflow-hidden rounded-b-[22px] rounded-t-full bg-mar">
                <video
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster="/media/hero-cove.jpg"
                  aria-label={t.hero.videoLabel}
                >
                  <source src="/media/hero-cove.mp4" type="video/mp4" />
                </video>
                {/* depth: the window reveal casts a soft inner shadow */}
                <div aria-hidden className="absolute inset-0 rounded-b-[22px] rounded-t-full shadow-[inset_0_26px_44px_-10px_rgb(10_60_50_/_.45),inset_0_-10px_24px_-12px_rgb(10_60_50_/_.35)]" />
                {/* mullion */}
                <div aria-hidden className="absolute inset-y-0 left-1/2 w-[clamp(4px,0.5vw,8px)] -translate-x-1/2 bg-paper/90" />
                <div aria-hidden className="absolute inset-x-0 top-[38%] h-[clamp(4px,0.5vw,8px)] bg-paper/90" />
              </div>
            </div>
            {/* sill */}
            <div aria-hidden className="absolute -bottom-3 left-[-9%] right-[-9%] h-5 rounded-full bg-paper shadow-soft ring-1 ring-line" />

            {/* Portrait with a rotating caption ring */}
            <div data-reveal="scale" style={delay(420)} className="absolute -left-[26%] bottom-[4%] aspect-square w-[42%] sm:-left-[34%] sm:w-[50%]">
              {/* paper badge the caption is printed on */}
              <span aria-hidden className="absolute -inset-[18%] rounded-full bg-paper shadow-lift ring-1 ring-line" />
              <svg aria-hidden viewBox="0 0 200 200" className="spin-slow absolute -inset-[18%] h-[136%] w-[136%] text-ink">
                <defs>
                  <path id={ringId} d="M100,100 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0" />
                </defs>
                <text className="fill-current text-[11px] font-extrabold">
                  <textPath href={`#${ringId}`} textLength="520" lengthAdjust="spacing">
                    {t.hero.ring}
                  </textPath>
                </text>
              </svg>
              <div className="relative h-full w-full overflow-hidden rounded-full border-[clamp(4px,0.5vw,7px)] border-paper bg-mar shadow-lift">
                <Image src="/photos/diego-01-teal-headphones.jpg" alt={t.hero.portraitAlt} fill priority sizes="(min-width:1024px) 260px, 160px" className="object-cover" />
              </div>
              <span className="absolute -right-1 top-[4%] grid size-[30%] place-items-center rounded-full bg-coral text-paper shadow-soft ring-4 ring-sand">
                <Icon name="spark" className="size-[55%]" />
              </span>
            </div>

            {/* Delivered stat — a speech-bubble card */}
            <div data-reveal="left" style={delay(560)} className="float-y absolute -left-[46%] top-[8%] hidden w-[clamp(180px,15vw,240px)] rounded-[26px] rounded-bl-[6px] bg-paper p-4 shadow-lift ring-1 ring-line sm:block">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-mata text-sand" style={{ "--icon-accent": "rgb(255 255 255 / .22)" } as CSSProperties}>
                  <Icon name="web" className="size-7" />
                </span>
                <span className="font-display text-[2.6rem] font-extrabold leading-none tracking-tight">20+</span>
              </div>
              <p className="mt-2 text-[13px] font-semibold leading-snug text-muted">{t.hero.stat}</p>
            </div>

            {/* Now editing — a compact player pill */}
            <div data-reveal="right" style={delay(680)} className="float-y-alt absolute -right-[10%] bottom-[18%] hidden items-center gap-3 rounded-full bg-paper py-2 pl-2 pr-5 shadow-lift ring-1 ring-line sm:flex">
              <span className="grid size-11 place-items-center rounded-full bg-coral text-paper">
                <Icon name="playSolid" className="ml-0.5 size-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.18em] text-muted">{t.hero.editing}</span>
                <span className="block whitespace-nowrap text-sm font-extrabold">{t.hero.clip}</span>
              </span>
              <span aria-hidden className="eq ml-1 flex h-6 items-end gap-[3px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-[3px] rounded-full bg-mata" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CalcadaoWave className="absolute inset-x-0 bottom-0 z-10 h-[74px] lg:h-[100px]" />
    </section>
  );
}
