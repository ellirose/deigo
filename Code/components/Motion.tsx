"use client";

import { useEffect, useRef, useState } from "react";
import EditTimeline from "./canvas/EditTimeline";
import { useI18n } from "./i18n";
import { Icon } from "./Icons";
import { Kicker, SectionTitle, delay } from "./ui";

const TOOLS = ["Premiere Pro", "After Effects", "DaVinci Resolve", "Storyboards", "Color", "Subtitles"];

export default function Motion() {
  const { t } = useI18n();
  const video = useRef<HTMLVideoElement>(null);
  const timecode = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(true);

  // Pause the reel when it is off-screen; resume if the viewer had it playing.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) v.pause();
      else if (playing) v.play().catch(() => {});
    });
    io.observe(v);
    return () => io.disconnect();
  }, [playing]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section id="motion" className="relative isolate overflow-hidden bg-mar py-28 lg:py-36">
      <video
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-[.32] mix-blend-luminosity"
        autoPlay
        muted
        loop
        playsInline
        poster="/media/surf-texture.jpg"
      >
        <source src="/media/surf-texture.mp4" type="video/mp4" />
      </video>
      <div aria-hidden className="absolute -left-24 bottom-[-140px] -z-10 size-[420px] rounded-full bg-sol/90" />

      <div className="mx-auto grid max-w-[1480px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-12">
        <div className="lg:col-span-4">
          <div data-reveal>
            <Kicker icon="film" tone="coral">
              {t.motion.kicker}
            </Kicker>
          </div>
          <SectionTitle className="mt-6 text-[clamp(2.4rem,4.4vw,4.4rem)]">
            <span data-reveal style={delay(80)} className="block">
              {t.motion.title}
            </span>
          </SectionTitle>
          <p data-reveal style={delay(160)} className="mt-6 text-lg font-medium leading-relaxed text-ink/80">
            {t.motion.desc}
          </p>

          <div className="mt-8 space-y-3">
            {t.motion.stats.map((s, i) => (
              <div key={i} data-reveal="left" style={delay(220 + i * 100)} className="lower-third flex items-center gap-4 bg-paper py-3 pl-3 pr-8 shadow-soft">
                <span className={`grid h-14 min-w-20 place-items-center rounded-2xl px-3 font-display text-3xl font-extrabold ${i ? "bg-sol text-ink" : "bg-mata text-paper"}`}>{s.value}</span>
                <span className="text-[15px] font-bold leading-snug">{s.label}</span>
              </div>
            ))}
          </div>

          <ul data-reveal style={delay(420)} className="mt-8 flex flex-wrap gap-2">
            {TOOLS.map((tool) => (
              <li key={tool} className="rounded-full bg-paper/70 px-3.5 py-1.5 text-sm font-bold ring-1 ring-ink/10 backdrop-blur">
                {tool}
              </li>
            ))}
          </ul>
        </div>

        {/* Monitor */}
        <div data-reveal="scale" style={delay(120)} className="lg:col-span-8">
          <div className="rounded-[36px] bg-paper p-3 shadow-lift ring-1 ring-ink/5 sm:p-4">
            <div className="relative aspect-video overflow-hidden rounded-[26px] bg-ink/10">
              <video ref={video} className="h-full w-full object-cover" autoPlay muted loop playsInline poster="/media/reel-studio.jpg" preload="metadata">
                <source src="/media/reel-studio.mp4" type="video/mp4" />
              </video>
              {/* viewfinder */}
              <div aria-hidden className="pointer-events-none absolute inset-4 sm:inset-6">
                {["left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-xl", "right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-xl", "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl", "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl"].map((c) => (
                  <span key={c} className={`absolute size-8 border-paper/90 sm:size-11 ${c}`} />
                ))}
                <span className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2">
                  <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-paper/70" />
                  <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-paper/70" />
                </span>
              </div>
              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-ink/55 px-3 py-1.5 font-mono text-xs font-bold text-paper backdrop-blur sm:left-9 sm:top-9 sm:text-sm">
                <span className={`size-2.5 rounded-full bg-coral ${playing ? "rec-pulse" : ""}`} />
                REC
                <span ref={timecode} className="tabular-nums">00:00:00:00</span>
              </div>
              <span className="absolute right-6 top-6 hidden rounded-full bg-ink/55 px-3 py-1.5 font-mono text-xs font-bold text-paper backdrop-blur sm:right-9 sm:top-9 sm:block">HD · 30 fps</span>
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? t.motion.pause : t.motion.play}
                className="absolute bottom-6 left-6 grid size-14 place-items-center rounded-full bg-paper text-ink shadow-lift transition hover:scale-105 hover:bg-sol sm:bottom-9 sm:left-9 sm:size-16"
              >
                <Icon name={playing ? "pause" : "playSolid"} className="size-6" strokeWidth={4} />
              </button>
            </div>

            <div className="mt-3 rounded-[22px] bg-sand px-2 py-2 ring-1 ring-line">
              <EditTimeline videoRef={video} timecodeRef={timecode} tracks={t.motion.tracks} clips={t.motion.clips} />
            </div>
            <p className="mt-3 flex items-center gap-2 px-2 text-sm font-semibold text-muted">
              <Icon name="cursor" className="size-5 text-mata" />
              {t.motion.hint}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
