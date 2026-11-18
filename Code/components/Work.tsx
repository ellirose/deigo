"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import { CASE_STUDY, CATS, WORK, type Cat, type WorkItem } from "@/lib/work";
import { useI18n } from "./i18n";
import { Icon, type IconName } from "./Icons";
import { Kicker, SectionTitle, Texture, Tilt, delay } from "./ui";

const CAT_ICON = Object.fromEntries(CATS.map((c) => [c.id, c.icon])) as Record<Cat | "all", IconName>;
const SIZES = "(min-width:1280px) 420px, (min-width:1024px) 31vw, (min-width:640px) 46vw, 92vw";

/* ---------- Card frames, one per discipline ---------- */

function Caption({ item, lang, label }: { item: WorkItem; lang: Lang; label: string }) {
  return (
    <div className="mt-4 flex items-start justify-between gap-4 px-1">
      <div>
        <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.18em] text-mata">
          <Icon name={CAT_ICON[item.cat]} className="size-4" strokeWidth={3} />
          {label}
        </p>
        <h3 className="mt-1.5 font-display text-[1.3rem] font-extrabold leading-tight tracking-[-0.02em]">{item.title[lang]}</h3>
      </div>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-ink ring-1 ring-line transition duration-500 group-hover:rotate-45 group-hover:bg-sol">
        <Icon name="arrowUpRight" className="size-5" strokeWidth={3} />
      </span>
    </div>
  );
}

function Frame({ item, index }: { item: WorkItem; index: number }) {
  const img = (cls = "object-cover") => <Image src={item.src} alt="" fill sizes={SIZES} className={cls} />;
  const tilt = index % 2 ? 1.4 : -1.2;

  switch (item.cat) {
    case "web": {
      const wide = item.w > item.h;
      return (
        <div className="overflow-hidden rounded-[24px] bg-paper shadow-soft ring-1 ring-line transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-lift">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="size-3 rounded-full bg-coral" />
            <span className="size-3 rounded-full bg-sol" />
            <span className="size-3 rounded-full bg-mata" />
            <span className="ml-2 flex-1 truncate rounded-full bg-sand px-3 py-1 font-mono text-[11px] font-semibold text-muted">/{item.id.split("-").slice(0, 2).join("-")}</span>
          </div>
          <div className={`relative overflow-hidden ${wide ? "aspect-[16/9]" : "aspect-[4/3.6]"}`}>
            {img(wide ? "object-cover" : "object-cover object-top transition-[object-position] duration-[4s] ease-in-out group-hover:object-bottom")}
          </div>
        </div>
      );
    }
    case "app":
      return (
        <Tilt max={10}>
          <div className="mx-auto w-[88%] rounded-[46px] bg-paper p-2.5 shadow-soft ring-1 ring-line transition-shadow duration-500 group-hover:shadow-lift">
            <div className="relative aspect-[9/15] overflow-hidden rounded-[38px] bg-sand">
              {img()}
              <span aria-hidden className="absolute left-1/2 top-3 h-5 w-20 -translate-x-1/2 rounded-full bg-ink/85" />
            </div>
          </div>
        </Tilt>
      );
    case "brand":
      return (
        <div className="relative transition duration-500 group-hover:-translate-y-1.5">
          <div className="relative aspect-square overflow-hidden rounded-[44px] bg-paper shadow-soft ring-1 ring-line transition-shadow duration-500 group-hover:shadow-lift">
            {img()}
          </div>
          <span aria-hidden className="absolute -right-2 -top-2 grid size-14 place-items-center rounded-full bg-sol text-mata-deep shadow-soft ring-4 ring-sand" style={{ "--icon-accent": "rgb(255 255 255 / .6)" } as CSSProperties}>
            <Icon name="brand" className="size-8" />
          </span>
        </div>
      );
    case "poster":
      return (
        <div className="relative px-2 pt-3">
          <div className="relative bg-paper p-2.5 shadow-soft ring-1 ring-line transition duration-500 group-hover:-translate-y-1 group-hover:rotate-0 group-hover:shadow-lift" style={{ rotate: `${tilt}deg` }}>
            <span aria-hidden className="tape -left-3 top-1 -rotate-[28deg]" />
            <span aria-hidden className="tape -right-3 top-1 rotate-[28deg]" />
            <div className="relative overflow-hidden" style={{ aspectRatio: `${item.w}/${item.h}` }}>
              {img()}
            </div>
          </div>
        </div>
      );
    case "illustration":
      return (
        <div className="drop-soft transition duration-500 group-hover:-translate-y-1.5">
          <div className="stamp bg-paper p-[18px]">
            <div className="relative overflow-hidden rounded-[6px]" style={{ aspectRatio: `${item.w}/${item.h}` }}>
              {img()}
            </div>
            <div className="flex items-center justify-between px-1 pt-3 font-mono text-[11px] font-bold uppercase tracking-widest text-muted">
              <span>Brasil</span>
              <span className="text-coral">R$ 2,00</span>
            </div>
          </div>
        </div>
      );
    case "apparel":
      return (
        <div className="drop-soft relative pt-6 transition duration-500 group-hover:-translate-y-1.5">
          <svg aria-hidden viewBox="0 0 60 40" className="absolute left-1/2 top-0 h-10 w-16 -translate-x-1/2 text-ink/50">
            <path d="M30 34C18 28 14 10 30 4c16 6 12 24 0 30" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <div className="hangtag relative bg-paper px-3 pb-3 pt-12">
            <span aria-hidden className="absolute left-1/2 top-5 size-4 -translate-x-1/2 rounded-full bg-sand shadow-[inset_0_2px_3px_rgb(0_0_0_/_.25)] ring-2 ring-line" />
            <div className="relative overflow-hidden rounded-[12px]" style={{ aspectRatio: `${item.w}/${item.h}` }}>
              {img()}
            </div>
          </div>
        </div>
      );
    case "fashion":
      return (
        <div className="px-2 pt-2">
          <div className="bg-paper p-3 pb-5 shadow-soft ring-1 ring-line transition duration-500 group-hover:-translate-y-1 group-hover:rotate-0 group-hover:shadow-lift" style={{ rotate: `${-tilt}deg` }}>
            <div className="relative overflow-hidden" style={{ aspectRatio: `${item.w}/${item.h}` }}>
              {img()}
            </div>
          </div>
        </div>
      );
  }
}

/* ---------- Filter bar with a sliding indicator ---------- */

function Filters({ value, onChange, counts }: { value: Cat | "all"; onChange: (c: Cat | "all") => void; counts: Record<string, number> }) {
  const { t, lang } = useI18n();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [ind, setInd] = useState({ left: 0, width: 0 });

  const measure = useCallback(() => {
    const el = refs.current[value];
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value]);

  useLayoutEffect(() => {
    measure();
  }, [measure, lang]);
  useEffect(() => {
    addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div className="scroll-x -mx-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0">
      <div role="tablist" aria-label={t.work.title} className="relative inline-flex gap-1 rounded-full bg-paper p-1.5 shadow-soft ring-1 ring-line">
        <span aria-hidden className="absolute bottom-1.5 top-1.5 rounded-full bg-mata transition-all duration-500 ease-[cubic-bezier(.2,.7,.2,1)]" style={{ left: ind.left, width: ind.width }} />
        {CATS.map((c) => {
          const on = value === c.id;
          return (
            <button
              key={c.id}
              ref={(el) => {
                refs.current[c.id] = el;
              }}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(c.id)}
              className={`relative z-10 flex items-center gap-2 whitespace-nowrap rounded-full py-2.5 pl-3.5 pr-3 text-[15px] font-extrabold transition-colors duration-300 ${on ? "text-paper" : "text-ink/70 hover:text-ink"}`}
              style={{ "--icon-accent": on ? "rgb(255 255 255 / .28)" : undefined } as CSSProperties}
            >
              <Icon name={c.icon} className="size-6" />
              {t.work.filters[c.id]}
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${on ? "bg-paper/20 text-paper" : "bg-sand text-muted"}`}>{counts[c.id]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Lightbox ---------- */

function Lightbox({ list, index, onClose, onMove }: { list: WorkItem[]; index: number; onClose: () => void; onMove: (i: number) => void }) {
  const { t, lang } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = list[index];
  const go = useCallback((d: number) => onMove((index + d + list.length) % list.length), [index, list.length, onMove]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      prevFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={item.title[lang]} className="lightbox fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      <div aria-hidden className="absolute inset-0 bg-sand/92 backdrop-blur-md" />
      <div className="lightbox-panel relative flex max-h-full w-full max-w-[1100px] flex-col items-center gap-5 lg:flex-row lg:items-end lg:gap-10" onClick={(e) => e.stopPropagation()}>
        <div key={item.id} className="lightbox-img relative overflow-hidden rounded-[28px] bg-paper p-2.5 shadow-lift ring-1 ring-line">
          <Image
            src={item.src}
            alt={item.title[lang]}
            width={item.w}
            height={item.h}
            quality={85}
            sizes="(min-width:1024px) 700px, 92vw"
            className="h-auto max-h-[68svh] w-auto rounded-[20px] lg:max-h-[82svh]"
            style={{ maxWidth: "min(92vw, 720px)" }}
          />
        </div>
        <div className="w-full max-w-[340px] text-center lg:text-left">
          <p className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-[.2em] text-mata lg:justify-start">
            <Icon name={CAT_ICON[item.cat]} className="size-5" strokeWidth={3} />
            {t.work.filters[item.cat]}
          </p>
          <h3 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{item.title[lang]}</h3>
          <p className="mt-3 font-serif text-2xl italic text-muted">
            {index + 1} <span className="text-line">/</span> {list.length}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 lg:justify-start">
            <button type="button" onClick={() => go(-1)} aria-label={t.work.prev} className="round-btn">
              <Icon name="chevronLeft" className="size-6" strokeWidth={3} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t.work.next} className="round-btn">
              <Icon name="chevronRight" className="size-6" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
      <button ref={closeRef} type="button" onClick={onClose} aria-label={t.work.close} className="round-btn absolute right-4 top-4 z-10 bg-ink text-paper hover:bg-coral sm:right-8 sm:top-8">
        <Icon name="close" className="size-6" strokeWidth={3} />
      </button>
    </div>
  );
}

/* ---------- Drag-to-scroll strip ---------- */

function DragStrip({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false;
    let moved = false;
    let x0 = 0;
    let s0 = 0;
    const pd = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      moved = false;
      x0 = e.clientX;
      s0 = el.scrollLeft;
    };
    const pm = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 4) {
        moved = true;
        el.dataset.dragging = "";
      }
      el.scrollLeft = s0 - dx;
    };
    const pu = () => {
      down = false;
      delete el.dataset.dragging;
    };
    const click = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    el.addEventListener("pointerdown", pd);
    addEventListener("pointermove", pm);
    addEventListener("pointerup", pu);
    el.addEventListener("click", click, true);
    return () => {
      el.removeEventListener("pointerdown", pd);
      removeEventListener("pointermove", pm);
      removeEventListener("pointerup", pu);
      el.removeEventListener("click", click, true);
    };
  }, []);
  return (
    <div ref={ref} role="region" aria-label={label} tabIndex={0} className="drag-strip scroll-x flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto pb-6 pt-2 select-none">
      {children}
    </div>
  );
}

/* ---------- Section ---------- */

export default function Work() {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<Cat | "all">("all");
  const [box, setBox] = useState<{ list: WorkItem[]; index: number } | null>(null);

  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 12;

  const full = useMemo(() => (filter === "all" ? WORK : WORK.filter((w) => w.cat === filter)), [filter]);
  const list = expanded || full.length <= PREVIEW ? full : full.slice(0, PREVIEW);
  const changeFilter = (c: Cat | "all") => {
    setFilter(c);
    setExpanded(false);
  };
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: WORK.length };
    for (const w of WORK) c[w.cat] = (c[w.cat] ?? 0) + 1;
    return c;
  }, []);

  return (
    <section id="work" className="relative overflow-x-clip bg-sand pb-28 pt-28 lg:pb-36 lg:pt-36">
      <Texture src="/textures/plaster.jpg" size={460} opacity={0.5} />
      <div aria-hidden className="absolute right-[-120px] top-24 size-[300px] rounded-full bg-coral/15" />

      <div className="relative mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div data-reveal>
              <Kicker icon="layers" tone="coral">
                {t.work.kicker}
              </Kicker>
            </div>
            <SectionTitle className="mt-6">
              <span data-reveal style={delay(80)} className="block">
                {t.work.title}
                <span className="text-coral">.</span>
              </span>
            </SectionTitle>
          </div>
          <p data-reveal style={delay(160)} className="max-w-[44ch] text-xl font-medium leading-relaxed text-muted lg:col-span-5 lg:pb-3">
            {t.work.intro}
          </p>
        </div>

        <div data-reveal style={delay(200)} className="mt-12">
          <Filters value={filter} onChange={changeFilter} counts={counts} />
        </div>

        <div key={filter} className="mt-10 columns-1 gap-7 sm:columns-2 lg:columns-3 lg:gap-9">
          {list.map((item, i) => (
            <div key={item.id} data-reveal style={delay((i % 3) * 90)} className="mb-10 break-inside-avoid">
              <button
                type="button"
                onClick={() => setBox({ list: full, index: i })}
                aria-label={`${t.work.view}: ${item.title[lang]}`}
                className="group block w-full rounded-[28px] text-left"
              >
                <Frame item={item} index={i} />
                <Caption item={item} lang={lang} label={t.work.filters[item.cat]} />
              </button>
            </div>
          ))}
        </div>

        {full.length > PREVIEW && (
          <div className="relative mt-2 flex items-center justify-center gap-6">
            <span aria-hidden className="h-px flex-1 bg-line" />
            <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="btn-primary group">
              {expanded ? t.work.less : `${t.work.more} · ${full.length}`}
              <span className="btn-primary-icon">
                <Icon name={expanded ? "arrowUp" : "arrowRight"} className={`size-5 ${expanded ? "" : "rotate-90"}`} strokeWidth={3} />
              </span>
            </button>
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>
        )}

        {/* Case study strip */}
        <div className="mt-20 rounded-[40px] bg-paper/80 p-6 shadow-soft ring-1 ring-line backdrop-blur sm:p-10 lg:mt-28">
          <div className="grid items-end gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p data-reveal className="text-xs font-extrabold uppercase tracking-[.22em] text-coral">{t.work.caseKicker}</p>
              <h3 data-reveal style={delay(80)} className="mt-3 font-display text-[clamp(2rem,3.6vw,3.4rem)] font-extrabold leading-[1] tracking-[-0.03em]">
                {t.work.caseTitle}
              </h3>
            </div>
            <div className="lg:col-span-5">
              <p data-reveal style={delay(140)} className="text-lg leading-relaxed text-muted">
                {t.work.caseIntro}
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm font-bold text-mata">
                <Icon name="cursor" className="size-5" /> {t.work.drag}
              </p>
            </div>
          </div>
          <div className="relative mt-8">
            <div aria-hidden className="absolute left-0 right-0 top-[54px] border-t-2 border-dashed border-line" />
            <DragStrip label={t.work.caseTitle}>
              {CASE_STUDY.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBox({ list: CASE_STUDY.map((c, k) => ({ ...c, title: { en: t.work.steps[k], pt: t.work.steps[k], es: t.work.steps[k] } })), index: i })}
                  className="group relative w-[min(78vw,300px)] shrink-0 snap-start text-left"
                >
                  <span className="relative z-10 grid size-[54px] place-items-center rounded-full bg-sand font-serif text-2xl italic ring-1 ring-line transition group-hover:bg-sol">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="relative mt-5 aspect-square overflow-hidden rounded-[30px] bg-sand ring-1 ring-line transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-lift">
                    <Image src={item.src} alt="" fill sizes="300px" className="object-cover transition duration-700 group-hover:scale-105" draggable={false} />
                  </div>
                  <p className="mt-4 font-display text-xl font-extrabold">{t.work.steps[i]}</p>
                </button>
              ))}
            </DragStrip>
          </div>
        </div>
      </div>

      {box && <Lightbox list={box.list} index={box.index} onClose={() => setBox(null)} onMove={(i) => setBox((b) => (b ? { ...b, index: i } : b))} />}
    </section>
  );
}
