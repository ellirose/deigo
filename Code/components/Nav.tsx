"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark, Wordmark } from "./Brand";
import { useI18n } from "./i18n";
import { Icon } from "./Icons";
import LanguageSwitcher from "./LanguageSwitcher";
import { Texture } from "./ui";

export const NAV_IDS = ["expertise", "work", "motion", "studio", "journey", "about"] as const;

export default function Nav() {
  const { t } = useI18n();
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLSpanElement>(null);

  // Scroll progress + compact state
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.current?.style.setProperty("transform", `scaleX(${max > 0 ? scrollY / max : 0})`);
        setScrolled(scrollY > 40);
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy
  useEffect(() => {
    const els = NAV_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Mobile sheet: lock scroll, close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav
        aria-label="Primary"
        className={`relative mx-auto flex max-w-[1480px] items-center justify-between gap-3 rounded-full bg-paper/88 pl-2 pr-2 shadow-soft ring-1 ring-line backdrop-blur-xl transition-[padding,box-shadow] duration-500 ${
          scrolled ? "py-1.5 shadow-lift" : "py-2"
        }`}
      >
        <a href="#top" aria-label={t.nav.home} className="group flex items-center gap-3 rounded-full pr-3">
          <LogoMark className="size-12 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" />
          <Wordmark role={t.nav.role} className="hidden min-[380px]:block lg:hidden xl:block" />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_IDS.map((id) => (
            <li key={id}>
              <a href={`#${id}`} data-active={active === id} className="navlink">
                <span className="navlink-dot" aria-hidden />
                {t.nav[id]}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:flex" />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.close : t.nav.menu}
            className="burger grid size-12 place-items-center rounded-full bg-mata text-sand transition hover:bg-mata-deep lg:hidden"
            data-open={open}
          >
            <span aria-hidden />
            <span aria-hidden />
          </button>
        </div>

        <span aria-hidden className="pointer-events-none absolute inset-x-10 bottom-0 h-[3px] overflow-hidden rounded-full">
          <span ref={bar} className="block h-full origin-left scale-x-0 rounded-full bg-sol" />
        </span>
      </nav>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 -z-10 overflow-hidden bg-sand transition-[clip-path] duration-700 ease-[cubic-bezier(.7,0,.2,1)] lg:hidden ${
          open ? "[clip-path:circle(150%_at_calc(100%-44px)_44px)]" : "pointer-events-none [clip-path:circle(0%_at_calc(100%-44px)_44px)]"
        }`}
        aria-hidden={!open}
        inert={!open}
      >
        <Texture src="/textures/plaster.jpg" size={420} opacity={0.5} />
        <div aria-hidden className="absolute -bottom-24 -right-24 size-80 rounded-full bg-sol" />
        <div className="relative flex h-full flex-col justify-between px-6 pb-10 pt-28">
          <ul className="space-y-1">
            {NAV_IDS.map((id, i) => (
              <li key={id} className={`transition duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms" }}>
                <a href={`#${id}`} onClick={() => setOpen(false)} className="group flex items-center justify-between border-b border-line gap-4 py-4 font-display text-[clamp(2rem,10vw,2.6rem)] font-extrabold tracking-tight">
                  {t.nav[id]}
                  <span className="grid size-12 place-items-center rounded-full bg-paper text-mata shadow-soft transition group-hover:bg-sol">
                    <Icon name="arrowUpRight" className="size-6" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="relative flex items-center justify-between">
            <LanguageSwitcher size="lg" />
            <LogoMark className="size-14" />
          </div>
        </div>
      </div>
    </header>
  );
}
