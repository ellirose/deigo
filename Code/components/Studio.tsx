"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import type { Lang } from "@/lib/i18n";
import { FILMS_ORDERED, STUDIO_CATS, filmPoster, filmPreview, filmRatio, filmSrc, fmtDur, type Film, type StudioCat } from "@/lib/studio";
import Ambient from "./canvas/Ambient";
import { useI18n } from "./i18n";
import { Icon, type IconName } from "./Icons";
import { Kicker, SectionTitle, delay } from "./ui";

const CAT_ICON = Object.fromEntries(STUDIO_CATS.map((c) => [c.id, c.icon])) as Record<StudioCat | "all", IconName>;
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (s: number) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
const onDark = { "--icon-accent": "rgb(255 194 61 / .35)" } as CSSProperties;

export default function Studio() {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<StudioCat | "all">("all");
  const list = useMemo(() => (cat === "all" ? FILMS_ORDERED : FILMS_ORDERED.filter((f) => f.cat === cat)), [cat]);
  const [id, setId] = useState(FILMS_ORDERED[0].id);
  const [auto, setAuto] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const film = FILMS_ORDERED.find((f) => f.id === id) ?? FILMS_ORDERED[0];
  const pos = Math.max(0, list.findIndex((f) => f.id === id));
  const upNext = list[(pos + 1) % list.length];

  const step = useCallback(
    (d: number) =>
      setId((cur) => {
        const i = Math.max(0, list.findIndex((f) => f.id === cur));
        return list[(i + d + list.length) % list.length].id;
      }),
    [list],
  );

  const choose = (c: StudioCat | "all") => {
    setCat(c);
    const next = c === "all" ? FILMS_ORDERED : FILMS_ORDERED.filter((f) => f.cat === c);
    if (!next.some((f) => f.id === id)) setId(next[0].id);
  };

  const select = (f: Film) => {
    setId(f.id);
    const r = stage.current?.getBoundingClientRect();
    if (r && (r.top < 70 || r.bottom > window.innerHeight)) stage.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section id="studio" className="relative isolate overflow-hidden bg-[#0f2620] py-28 text-paper lg:py-36">
      {/* stage lights */}
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 -z-10 size-[620px] rounded-full bg-sol/20 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-[38%] -z-10 size-[520px] rounded-full bg-coral/15 blur-[120px]" />
      <div aria-hidden className="studio-grain pointer-events-none absolute inset-0 -z-10 opacity-[.5]" />

      <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <div data-reveal>
              <Kicker icon="film" tone="coral">
                {t.studio.kicker}
              </Kicker>
            </div>
            <SectionTitle className="mt-6">
              <span data-reveal style={delay(80)} className="block">
                {t.studio.title}
              </span>
            </SectionTitle>
          </div>
          <div className="lg:col-span-5">
            <p data-reveal style={delay(140)} className="text-lg font-medium leading-relaxed text-paper/75">
              {t.studio.desc}
            </p>
            <dl data-reveal style={delay(200)} className="mt-6 flex flex-wrap gap-3">
              {t.studio.stats.map((s) => (
                <div key={s.label} className="flex items-baseline gap-2 rounded-2xl bg-paper/[.06] px-4 py-2.5 ring-1 ring-paper/10">
                  <dt className="font-display text-2xl font-extrabold text-sol">{s.value}</dt>
                  <dd className="text-sm font-bold text-paper/70">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Screening room */}
        <div className="mt-14 grid gap-6 lg:mt-16 lg:grid-cols-12 lg:gap-8">
          <div ref={stage} data-reveal="scale" className="lg:col-span-8">
            <Screen film={film} index={pos} total={list.length} auto={auto} onPrev={() => step(-1)} onNext={() => step(1)} />
          </div>

          <aside data-reveal style={delay(120)} className="lg:col-span-4">
            <div className="flex h-full flex-col rounded-[30px] bg-paper/[.06] p-6 ring-1 ring-paper/10 backdrop-blur sm:p-8">
              <p className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-[.22em] text-sol" style={onDark}>
                <Icon name={CAT_ICON[film.cat]} className="size-6" />
                {t.studio.cats[film.cat]}
              </p>
              <p className="mt-5 font-serif text-[2.2rem] italic leading-none text-paper/45">Nº {pad(FILMS_ORDERED.indexOf(film) + 1)}</p>
              <p key={film.id} className="ticket-title mt-2 font-display text-[clamp(1.8rem,2.5vw,2.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-balance">
                {film.title[lang]}
              </p>
              <dl className="mt-7 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-paper/[.05] p-3.5 ring-1 ring-paper/10">
                  <dt className="text-[11px] font-extrabold uppercase tracking-[.18em] text-paper/50">{t.studio.format}</dt>
                  <dd className="mt-1 font-mono text-base font-bold">{filmRatio(film)}</dd>
                </div>
                <div className="rounded-2xl bg-paper/[.05] p-3.5 ring-1 ring-paper/10">
                  <dt className="text-[11px] font-extrabold uppercase tracking-[.18em] text-paper/50">{t.studio.length}</dt>
                  <dd className="mt-1 font-mono text-base font-bold">{fmtDur(film.dur)}</dd>
                </div>
                <div className="col-span-2 rounded-2xl bg-paper/[.05] p-3.5 ring-1 ring-paper/10">
                  <dt className="text-[11px] font-extrabold uppercase tracking-[.18em] text-paper/50">{t.studio.craft}</dt>
                  <dd className="mt-1 font-bold">{t.studio.craftValue}</dd>
                </div>
              </dl>

              <button
                type="button"
                role="switch"
                aria-checked={auto}
                onClick={() => setAuto((a) => !a)}
                className="mt-6 flex items-center justify-between gap-4 rounded-2xl px-1 py-1 text-left font-bold text-paper/85"
              >
                {t.studio.auto}
                <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${auto ? "bg-sol" : "bg-paper/20"}`}>
                  <span className={`absolute top-1 size-5 rounded-full bg-paper shadow transition-[left] duration-300 ${auto ? "left-6" : "left-1"}`} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => step(1)}
                className="group mt-auto flex items-center gap-4 rounded-[22px] bg-paper/[.06] p-3 pt-3 text-left ring-1 ring-paper/10 transition hover:bg-paper/[.1] max-lg:mt-6"
              >
                <span className="relative h-[72px] w-[60px] shrink-0 overflow-hidden rounded-t-full rounded-b-[12px] bg-ink/40">
                  <Image src={filmPoster(upNext)} alt="" fill sizes="60px" className="object-cover transition duration-500 group-hover:scale-110" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-extrabold uppercase tracking-[.2em] text-sol">{t.studio.next}</span>
                  <span className="mt-1 block truncate font-display text-lg font-bold">{upNext.title[lang]}</span>
                </span>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-ink transition group-hover:translate-x-1 group-hover:bg-sol">
                  <Icon name="arrowRight" className="size-5" strokeWidth={4} />
                </span>
              </button>
            </div>
          </aside>
        </div>

        {/* Reel wall */}
        <div className="mt-20 flex flex-col gap-5 lg:mt-24 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 data-reveal className="font-display text-[clamp(1.9rem,3vw,2.8rem)] font-extrabold tracking-[-0.03em]">
              {t.studio.wall}
            </h3>
            <p data-reveal style={delay(80)} className="mt-2 flex items-center gap-2 text-sm font-semibold text-paper/60">
              <Icon name="cursor" className="size-5 text-sol" />
              {t.studio.hint}
            </p>
          </div>
          <div data-reveal style={delay(120)} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0 lg:max-w-[62%] lg:justify-end">
            {STUDIO_CATS.map((c) => {
              const on = cat === c.id;
              const count = c.id === "all" ? FILMS_ORDERED.length : FILMS_ORDERED.filter((f) => f.cat === c.id).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(c.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-bold transition ${
                    on ? "bg-sol text-ink shadow-[0_10px_30px_-10px_rgba(255,194,61,.7)]" : "bg-paper/[.07] text-paper ring-1 ring-paper/15 hover:bg-paper/[.13]"
                  }`}
                >
                  <span className={`grid size-8 place-items-center rounded-full ${on ? "bg-ink/10" : "bg-paper/10"}`} style={on ? undefined : onDark}>
                    <Icon name={c.icon} className="size-[18px]" />
                  </span>
                  {t.studio.cats[c.id]}
                  <span className={`font-mono text-xs ${on ? "text-ink/60" : "text-paper/50"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 columns-2 gap-4 sm:gap-6 md:columns-3 xl:columns-4">
          {list.map((f) => (
            <Tile key={f.id} film={f} lang={lang} active={f.id === id} catLabel={t.studio.cats[f.cat]} openLabel={t.studio.open} playingLabel={t.studio.playing} onSelect={() => select(f)} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── the screen ───────────────────────── */

function Screen({ film, index, total, auto, onPrev, onNext }: { film: Film; index: number; total: number; auto: boolean; onPrev: () => void; onNext: () => void }) {
  const { t, lang } = useI18n();
  const v = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const want = useRef(true);
  const visible = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [shown, setShown] = useState(film.id);

  // swapping films: fade the picture out until the new one has a frame
  if (shown !== film.id) {
    setShown(film.id);
    setReady(false);
  }

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = v.current;
      if (!el || !el.duration || !visible.current) return;
      if (bar.current) bar.current.style.transform = `scaleX(${(el.currentTime / el.duration).toFixed(4)})`;
      if (time.current) time.current.textContent = `${clock(el.currentTime)} / ${clock(el.duration)}`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const el = v.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        if (!e.isIntersecting) el.pause();
        else if (want.current) el.play().catch(() => {});
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onLoaded = () => {
    setReady(true);
    if (want.current && visible.current) v.current?.play().catch(() => {});
  };

  // the first film can finish loading before hydration attaches onLoadedData
  useEffect(() => {
    const el = v.current;
    if (el && el.readyState >= 2) {
      setReady(true);
      if (want.current && visible.current) el.play().catch(() => {});
    }
  }, [film.id]);

  const toggle = () => {
    const el = v.current;
    if (!el) return;
    if (el.paused) {
      want.current = true;
      el.play().catch(() => {});
    } else {
      want.current = false;
      el.pause();
    }
  };

  const scrub = (e: RPointerEvent<HTMLDivElement>) => {
    const el = v.current;
    if (!el || !el.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    el.currentTime = Math.min(0.999, Math.max(0, (e.clientX - r.left) / r.width)) * el.duration;
  };

  const fullscreen = () => {
    const el = box.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };

  return (
    <div className="relative">
      {/* light spilling onto the wall */}
      <Ambient videoRef={v} w={28} h={18} smoothing={0.1} className="absolute left-[-7%] top-[-9%] h-[118%] w-[114%] rounded-[60px] opacity-75 blur-[70px] saturate-[1.6]" />

      <div
        ref={box}
        className="group/screen relative aspect-[4/5] overflow-hidden rounded-[30px] bg-[#091512] shadow-[0_50px_100px_-40px_rgba(0,0,0,.8)] ring-1 ring-paper/10 sm:aspect-[16/10] [&:fullscreen]:rounded-none"
      >
        {/* the letterbox, filled with the film's own colour */}
        <Ambient videoRef={v} className="absolute inset-0 h-full w-full scale-125 opacity-80 blur-2xl saturate-[1.3]" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,12,10,.55))]" />
        <Image key={film.id} src={filmPoster(film)} alt="" fill sizes="(min-width:1024px) 62vw, 100vw" className="object-contain" priority={false} />
        <video
          ref={v}
          src={filmSrc(film)}
          muted
          playsInline
          preload="auto"
          loop={!auto}
          onLoadedData={onLoaded}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => auto && onNext()}
          onClick={toggle}
          aria-label={film.title[lang]}
          className={`absolute inset-0 h-full w-full cursor-pointer object-contain transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        />

        {/* chips */}
        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3 sm:inset-x-6 sm:top-6">
          <span className="flex items-center gap-2 rounded-full bg-[#07110e]/60 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-paper backdrop-blur sm:text-xs">
            <span className={`size-2.5 rounded-full bg-coral ${playing ? "rec-pulse" : ""}`} />
            {t.studio.now}
            <span className="text-paper/60">
              {pad(index + 1)}/{pad(total)}
            </span>
          </span>
          <span className="rounded-full bg-[#07110e]/60 px-3 py-1.5 font-mono text-[11px] font-bold text-paper backdrop-blur sm:text-xs">
            {filmRatio(film)} · {fmtDur(film.dur)}
          </span>
        </div>

        {/* transport */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-[#07110e]/90 via-[#07110e]/45 to-transparent px-4 pb-4 pt-20 sm:gap-4 sm:px-6 sm:pb-5">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? t.studio.pause : t.studio.play}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-paper text-ink shadow-lift transition hover:scale-105 hover:bg-sol sm:size-14"
          >
            <Icon name={playing ? "pause" : "playSolid"} className="size-5 sm:size-6" strokeWidth={4} />
          </button>
          <div
            role="presentation"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              scrub(e);
            }}
            onPointerMove={(e) => e.buttons && scrub(e)}
            className="group/bar relative flex-1 cursor-pointer touch-none py-3"
          >
            <span className="block h-1.5 overflow-hidden rounded-full bg-paper/20 transition-[height] group-hover/bar:h-2.5">
              <span ref={bar} className="block h-full origin-left rounded-full bg-gradient-to-r from-sol to-coral" style={{ transform: "scaleX(0)" }} />
            </span>
          </div>
          <span ref={time} className="hidden w-[84px] shrink-0 text-right font-mono text-xs font-bold tabular-nums text-paper/80 sm:block">
            0:00 / {clock(film.dur)}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={onPrev} aria-label={t.studio.prev} className="grid size-10 place-items-center rounded-full bg-paper/12 text-paper ring-1 ring-paper/20 backdrop-blur transition hover:bg-paper hover:text-ink">
              <Icon name="chevronLeft" className="size-5" strokeWidth={4} />
            </button>
            <button type="button" onClick={onNext} aria-label={t.studio.next} className="grid size-10 place-items-center rounded-full bg-paper/12 text-paper ring-1 ring-paper/20 backdrop-blur transition hover:bg-paper hover:text-ink">
              <Icon name="chevronRight" className="size-5" strokeWidth={4} />
            </button>
            <button type="button" onClick={fullscreen} aria-label={t.studio.fullscreen} className="hidden size-10 place-items-center rounded-full bg-paper/12 text-paper ring-1 ring-paper/20 backdrop-blur transition hover:bg-paper hover:text-ink sm:grid">
              <Icon name="expand" className="size-[18px]" strokeWidth={4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── reel-wall tile ───────────────────────── */

function Tile({
  film,
  lang,
  active,
  catLabel,
  openLabel,
  playingLabel,
  onSelect,
}: {
  film: Film;
  lang: Lang;
  active: boolean;
  catLabel: string;
  openLabel: string;
  playingLabel: string;
  onSelect: () => void;
}) {
  const v = useRef<HTMLVideoElement>(null);
  const [hot, setHot] = useState(false);
  const portrait = film.h > film.w;

  const enter = (e: RPointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = v.current;
    if (!el) return;
    if (!el.getAttribute("src")) el.src = filmPreview(film);
    setHot(true);
    el.play().catch(() => {});
  };
  const leave = () => {
    setHot(false);
    v.current?.pause();
  };

  const media = (
    <>
      <Image src={filmPoster(film)} alt="" fill sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw" className="object-cover transition duration-700 group-hover:scale-[1.05]" />
      <video ref={v} muted loop playsInline preload="none" aria-hidden className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${hot ? "opacity-100" : "opacity-0"}`} />
      <span aria-hidden className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 scale-75 place-items-center rounded-full bg-paper/90 text-ink opacity-0 shadow-lift backdrop-blur transition duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
        <Icon name="playSolid" className="size-5" />
      </span>
      {active && (
        <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-sol px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-ink shadow-lift">
          <span className="eq" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          {playingLabel}
        </span>
      )}
    </>
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      onPointerEnter={enter}
      onPointerLeave={leave}
      aria-label={`${film.title[lang]} — ${openLabel}`}
      aria-pressed={active}
      className="group mb-6 block w-full break-inside-avoid text-left outline-none sm:mb-8"
    >
      {portrait ? (
        <span
          className={`relative block aspect-[4/5] overflow-hidden rounded-b-[22px] rounded-t-[999px] bg-ink/40 shadow-[0_24px_50px_-28px_rgba(0,0,0,.9)] transition duration-500 group-hover:-translate-y-1.5 ${
            active ? "ring-[3px] ring-sol ring-offset-4 ring-offset-[#0f2620]" : "ring-1 ring-paper/10"
          }`}
        >
          {media}
        </span>
      ) : (
        <span
          className={`film-frame block rounded-[16px] px-2.5 py-[18px] shadow-[0_24px_50px_-28px_rgba(0,0,0,.9)] transition duration-500 group-hover:-translate-y-1.5 ${
            active ? "ring-[3px] ring-sol ring-offset-4 ring-offset-[#0f2620]" : "ring-1 ring-paper/10"
          }`}
        >
          <span className="relative block overflow-hidden rounded-[6px]" style={{ aspectRatio: `${film.w} / ${film.h}` }}>
            {media}
          </span>
        </span>
      )}
      <span className="mt-3 flex items-start justify-between gap-3 px-1">
        <span className="min-w-0">
          <span className="block text-[11px] font-extrabold uppercase tracking-[.2em] text-paper/50">{catLabel}</span>
          <span className="mt-1 block font-display text-base font-bold leading-tight sm:text-lg">{film.title[lang]}</span>
        </span>
        <span className="mt-0.5 shrink-0 font-mono text-xs font-bold text-paper/55">{fmtDur(film.dur)}</span>
      </span>
    </button>
  );
}
