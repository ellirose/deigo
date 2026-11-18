"use client";

import { useRef, type KeyboardEvent } from "react";
import { LANGS } from "@/lib/i18n";
import { Flag } from "./Brand";
import { useI18n } from "./i18n";

/* Segmented flag switch: the active language expands to show its code,
   the others stay as round flags. Arrow keys move between options. */
export default function LanguageSwitcher({ className = "", size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const { lang, setLang, t } = useI18n();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : LANGS.length - 1)) % LANGS.length;
    refs.current[next]?.focus();
    setLang(LANGS[next].code);
  };

  const flag = size === "lg" ? "size-9" : "size-7";
  return (
    <div role="radiogroup" aria-label={t.nav.language} className={`flex items-center gap-1 rounded-full bg-sand p-1 ring-1 ring-line ${className}`}>
      {LANGS.map((l, i) => {
        const on = l.code === lang;
        return (
          <button
            key={l.code}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={l.label}
            title={l.label}
            tabIndex={on ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => !on && setLang(l.code)}
            className={`group flex items-center rounded-full p-0.5 transition-all duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
              on ? "bg-paper pr-3 shadow-soft" : "opacity-75 hover:opacity-100 hover:scale-110"
            }`}
          >
            <Flag code={l.code} className={`${flag} ring-2 ring-paper`} />
            <span
              className={`overflow-hidden text-[13px] font-extrabold tracking-wide text-ink transition-all duration-500 ${
                on ? "ml-2 max-w-10 opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              {l.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}
