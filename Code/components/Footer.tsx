"use client";

import { Flag, LogoMark } from "./Brand";
import CalcadaoWave from "./canvas/CalcadaoWave";
import { useI18n } from "./i18n";
import { Icon } from "./Icons";
import LanguageSwitcher from "./LanguageSwitcher";
import { NAV_IDS } from "./Nav";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative bg-sand">
      <CalcadaoWave className="h-[84px] lg:h-[110px]" />
      <div className="relative overflow-hidden bg-mata pb-10 pt-14 text-sand lg:pt-20">
        {/* A low sun cresting over the footer edge */}
        <div aria-hidden className="pointer-events-none absolute -top-[318px] hidden sm:block right-[8%] size-[380px] rounded-full bg-sol" />

        <div className="relative mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-5">
                <LogoMark className="size-20 rounded-[22px] ring-4 ring-sand/20 lg:size-24" title="Diego Silveira" />
                <div>
                  <p className="font-display text-3xl font-extrabold tracking-[-0.03em] lg:text-4xl">Diego Silveira</p>
                  <p className="text-sm font-extrabold uppercase tracking-[.22em] text-sol">{t.nav.role}</p>
                </div>
              </div>
              <p className="mt-8 max-w-[22ch] font-display text-[clamp(2rem,3.6vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{t.footer.tagline}</p>
            </div>

            <div className="relative grid gap-10 sm:grid-cols-2 lg:col-span-5">
              <nav aria-label={t.footer.explore}>
                <p className="text-xs font-extrabold uppercase tracking-[.22em] text-sand/60">{t.footer.explore}</p>
                <ul className="mt-4 space-y-2">
                  {NAV_IDS.map((id) => (
                    <li key={id}>
                      <a href={`#${id}`} className="group inline-flex items-center gap-2 text-xl font-extrabold">
                        <span className="h-[3px] w-0 rounded-full bg-sol transition-all duration-300 group-hover:w-5" />
                        {t.nav[id]}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.22em] text-sand/60">{t.footer.language}</p>
                <LanguageSwitcher size="lg" className="mt-4 w-fit" />
                <a href="#top" className="group mt-10 flex w-fit items-center gap-4 text-lg font-extrabold">
                  <span className="grid size-16 place-items-center rounded-full bg-sol text-ink shadow-lift transition duration-500 group-hover:-translate-y-1.5">
                    <Icon name="arrowUp" className="size-7" strokeWidth={3} />
                  </span>
                  {t.footer.top}
                </a>
              </div>
            </div>
          </div>

          {/* Oversized wordmark */}
          <p aria-hidden data-reveal className="mt-16 select-none whitespace-nowrap pb-[.14em] font-display text-[min(calc((100vw-7rem)/6.4),14rem)] font-extrabold leading-[.9] tracking-[-0.055em] text-sand">
            Diego<span className="text-sol">.</span>Silveira
          </p>

          <div className="mt-10 flex flex-col gap-4 border-t border-sand/20 pt-6 text-sm font-semibold text-sand/75 md:flex-row md:items-center md:justify-between">
            <p>
              © 2026 Diego Silveira. {t.footer.rights}
            </p>
            <p className="text-sand/60">{t.footer.credits}</p>
            <p className="flex items-center gap-2 font-extrabold text-sand">
              <Flag code="pt" className="size-6" />
              {t.footer.made}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
