"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dict, LANGS, type Dict, type Lang } from "@/lib/i18n";

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void };

const I18nContext = createContext<Ctx>({ lang: "en", t: dict.en, setLang: () => {} });
const KEY = "ds-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Restore a saved choice, otherwise follow the browser language.
  useEffect(() => {
    let next: Lang | null = null;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "en" || saved === "pt" || saved === "es") next = saved;
    } catch {}
    if (!next) {
      const nav = navigator.language.toLowerCase();
      next = nav.startsWith("pt") ? "pt" : nav.startsWith("es") ? "es" : "en";
    }
    setLangState(next); // one-time sync with browser storage after hydration
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.code === lang)?.htmlLang ?? "en";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    // A short cross-fade so the copy swap feels deliberate rather than abrupt.
    const root = document.documentElement;
    root.classList.add("lang-swap");
    window.setTimeout(() => {
      setLangState(l);
      window.setTimeout(() => root.classList.remove("lang-swap"), 60);
    }, 160);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  }, []);

  const value = useMemo(() => ({ lang, t: dict[lang], setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
